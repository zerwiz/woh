import type { ExtensionAPI, ToolCallEvent } from "@mariozechner/pi-coding-agent";
import { isToolCallEventType } from "@mariozechner/pi-coding-agent";
import { parse as yamlParse } from "yaml";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { applyExtensionDefaults } from "./themeMap.ts";

interface Rule {
	pattern: string;
	reason: string;
	ask?: boolean;
}

interface Rules {
	bashToolPatterns: Rule[];
	zeroAccessPaths: string[];
	readOnlyPaths: string[];
	noDeletePaths: string[];
	projectRoot?: string; // Optional project root for isolation
}

export default function (pi: ExtensionAPI) {
	let rules: Rules = {
		bashToolPatterns: [],
		zeroAccessPaths: [],
		readOnlyPaths: [],
		noDeletePaths: [],
	};

	let writeAllowedRoot: string | null = null;
	let sessionDeletePermission: "allowed" | "blocked" | "ask" = "ask";

	function resolvePath(p: string, cwd: string): string {
		if (p.startsWith("~")) {
			p = path.join(os.homedir(), p.slice(1));
		}
		return path.resolve(cwd, p);
	}

	function isPathWithin(targetPath: string, rootPath: string): boolean {
		const relative = path.relative(rootPath, targetPath);
		return !relative.startsWith("..") && !path.isAbsolute(relative);
	}

	function isPathMatch(targetPath: string, pattern: string, cwd: string): boolean {
		// Simple glob-to-regex or substring match
		// Expand tilde in pattern if present
		const resolvedPattern = pattern.startsWith("~") ? path.join(os.homedir(), pattern.slice(1)) : pattern;

		// If pattern ends with /, it's a directory match
		if (resolvedPattern.endsWith("/")) {
			const absolutePattern = path.isAbsolute(resolvedPattern) ? resolvedPattern : path.resolve(cwd, resolvedPattern);
			return targetPath.startsWith(absolutePattern);
		}

		// Handle basic wildcards *
		const regexPattern = resolvedPattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex chars
			.replace(/\*/g, ".*"); // convert * to .*

		const regex = new RegExp(`^${regexPattern}$|^${regexPattern}/|/${regexPattern}$|/${regexPattern}/`);

		// Match against absolute path and relative-to-cwd path
		const relativePath = path.relative(cwd, targetPath);

		return regex.test(targetPath) || regex.test(relativePath) || targetPath.includes(resolvedPattern) || relativePath.includes(resolvedPattern);
	}

	pi.on("session_start", async (_event, ctx) => {
		applyExtensionDefaults(import.meta.url, ctx);
		const projectRulesPath = path.join(ctx.cwd, ".pi", "damage-control-rules.yaml");
		const globalRulesPath = path.join(os.homedir(), ".pi", "damage-control-rules.yaml");
		const rulesPath = fs.existsSync(projectRulesPath) ? projectRulesPath : fs.existsSync(globalRulesPath) ? globalRulesPath : null;
		try {
			if (rulesPath) {
				const content = fs.readFileSync(rulesPath, "utf8");
				const loaded = yamlParse(content) as Partial<Rules>;
				rules = {
					bashToolPatterns: loaded.bashToolPatterns || [],
					zeroAccessPaths: loaded.zeroAccessPaths || [],
					readOnlyPaths: loaded.readOnlyPaths || [],
					noDeletePaths: loaded.noDeletePaths || [],
					projectRoot: loaded.projectRoot,
				};

				if (rules.projectRoot) {
					writeAllowedRoot = resolvePath(rules.projectRoot, ctx.cwd);
				}

				const source = rulesPath === projectRulesPath ? "project" : "global";
				ctx.ui.notify(`🛡️ Damage-Control: Loaded ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} rules (${source}).`);
				if (writeAllowedRoot) {
					ctx.ui.notify(`🏗️ Project Isolation: Write access restricted to ${writeAllowedRoot}`);
				}
			} else {
				ctx.ui.notify("🛡️ Damage-Control: No rules found at .pi/damage-control-rules.yaml (project or global)");
			}
		} catch (err) {
			ctx.ui.notify(`🛡️ Damage-Control: Failed to load rules: ${err instanceof Error ? err.message : String(err)}`);
		}

		const status = writeAllowedRoot 
			? `🛡️ Isolation: ${path.basename(writeAllowedRoot)} | Rules Active` 
			: `🛡️ Damage-Control Active: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} Rules`;
		ctx.ui.setStatus(status);
	});

	pi.registerCommand("dc-set-project", {
		description: "Set the root directory where write/edit access is allowed.",
		handler: async (args, ctx) => {
			if (!args?.trim()) {
				writeAllowedRoot = null;
				ctx.ui.notify("Project isolation disabled. Write access restored to all non-restricted paths.", "info");
			} else {
				writeAllowedRoot = resolvePath(args.trim(), ctx.cwd);
				ctx.ui.notify(`Project isolation enabled. Write access restricted to: ${writeAllowedRoot}`, "success");
			}
			const status = writeAllowedRoot 
				? `🛡️ Isolation: ${path.basename(writeAllowedRoot)} | Rules Active` 
				: `🛡️ Damage-Control Active: ${rules.bashToolPatterns.length + rules.zeroAccessPaths.length + rules.readOnlyPaths.length + rules.noDeletePaths.length} Rules`;
			ctx.ui.setStatus(status);
		}
	});

	pi.on("tool_call", async (event, ctx) => {
		let violationReason: string | null = null;
		let shouldAsk = false;
		let isDeletion = false;

		// 1. Extract paths from tool input
		const inputPaths: string[] = [];
		if (isToolCallEventType("read", event) || isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event)) {
			inputPaths.push(event.input.path);
		} else if (isToolCallEventType("grep", event) || isToolCallEventType("find", event) || isToolCallEventType("ls", event)) {
			inputPaths.push(event.input.path || ".");
		}

		// 2. Project Isolation & Deletion Check
		if (!violationReason) {
			const isModifyingTool = isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event);
			
			if (isModifyingTool) {
				const target = resolvePath(event.input.path, ctx.cwd);
				if (writeAllowedRoot && !isPathWithin(target, writeAllowedRoot)) {
					violationReason = `Write access denied: Path ${event.input.path} is outside the allowed project root (${writeAllowedRoot})`;
				}
			} else if (isToolCallEventType("bash", event)) {
				const command = event.input.command;
				const isDeleteCmd = /\b(rm|rmdir|unlink)\b/.test(command);
				const mightModify = isDeleteCmd || /[\s>|]/.test(command) || /\b(mv|sed|tee|touch|mkdir|cp|git)\b/.test(command);
				
				if (isDeleteCmd) isDeletion = true;

				if (mightModify && writeAllowedRoot) {
					const pathsInCmd = command.match(/\/[^\s;|<>|]+/g) || [];
					for (const p of pathsInCmd) {
						if (path.isAbsolute(p) && !isPathWithin(p, writeAllowedRoot)) {
							violationReason = `Bash command may modify files outside project root: ${p}`;
							break;
						}
					}
				}
			}
		}

		// 3. Deletion Protection Confirmation
		if (isDeletion && !violationReason) {
			if (sessionDeletePermission === "blocked") {
				violationReason = "File deletion is blocked for this session.";
			} else if (sessionDeletePermission === "ask") {
				const options = [
					"Yes, allow this deletion",
					"Yes, allow deletions for this session",
					"No, block this deletion",
					"No, block all deletions for this session"
				];
				const choice = await ctx.ui.select("🛡️ Deletion Protection: Allow deletion?", options);
				
				if (choice === options[0]) {
					// Allowed this time
				} else if (choice === options[1]) {
					sessionDeletePermission = "allowed";
				} else if (choice === options[2] || choice === undefined) {
					violationReason = "User denied deletion request.";
				} else if (choice === options[3]) {
					sessionDeletePermission = "blocked";
					violationReason = "File deletion is blocked for this session.";
				}
			}
		}

		// 4. Check Zero Access Paths for all tools that use path or glob
		if (!violationReason) {
			const checkPaths = (pathsToCheck: string[]) => {
				for (const p of pathsToCheck) {
					const resolved = resolvePath(p, ctx.cwd);
					for (const zap of rules.zeroAccessPaths) {
						if (isPathMatch(resolved, zap, ctx.cwd)) {
							return `Access to zero-access path restricted: ${zap}`;
						}
					}
				}
				return null;
			};

			if (isToolCallEventType("grep", event) && event.input.glob) {
				// Check glob field as well
				for (const zap of rules.zeroAccessPaths) {
					if (event.input.glob.includes(zap) || isPathMatch(event.input.glob, zap, ctx.cwd)) {
						violationReason = `Glob matches zero-access path: ${zap}`;
						break;
					}
				}
			}

			if (!violationReason) {
				violationReason = checkPaths(inputPaths);
			}
		}

		// 5. Tool-specific logic (Original Damage Control)
		if (!violationReason) {
			if (isToolCallEventType("bash", event)) {
				const command = event.input.command;

				// Check bashToolPatterns
				for (const rule of rules.bashToolPatterns) {
					const regex = new RegExp(rule.pattern);
					if (regex.test(command)) {
						violationReason = rule.reason;
						shouldAsk = !!rule.ask;
						break;
					}
				}

				// Check if bash command interacts with restricted paths
				if (!violationReason) {
					for (const zap of rules.zeroAccessPaths) {
						if (command.includes(zap)) {
							violationReason = `Bash command references zero-access path: ${zap}`;
							break;
						}
					}
				}

				if (!violationReason) {
					for (const rop of rules.readOnlyPaths) {
						// Heuristic: check if command might modify a read-only path
						if (command.includes(rop) && (/[\s>|]/.test(command) || /\b(rm|mv|sed|tee|touch|mkdir|rmdir|cp)\b/.test(command))) {
							violationReason = `Bash command may modify read-only path: ${rop}`;
							break;
						}
					}
				}

				if (!violationReason) {
					for (const ndp of rules.noDeletePaths) {
						if (command.includes(ndp) && (command.includes("rm") || command.includes("mv"))) {
							violationReason = `Bash command attempts to delete/move protected path: ${ndp}`;
							break;
						}
					}
				}
			} else if (isToolCallEventType("write", event) || isToolCallEventType("edit", event) || isToolCallEventType("replace", event)) {
				// Check Read-Only paths
				for (const p of inputPaths) {
					const resolved = resolvePath(p, ctx.cwd);
					for (const rop of rules.readOnlyPaths) {
						if (isPathMatch(resolved, rop, ctx.cwd)) {
							violationReason = `Modification of read-only path restricted: ${rop}`;
							break;
						}
					}
				}
			}
		}

		if (violationReason) {
			if (shouldAsk) {
				const confirmed = await ctx.ui.confirm("🛡️ Damage-Control Confirmation", `Dangerous command detected: ${violationReason}\n\nCommand: ${isToolCallEventType("bash", event) ? event.input.command : JSON.stringify(event.input)}\n\nDo you want to proceed?`, { timeout: 30000 });

				if (!confirmed) {
					ctx.ui.setStatus(`⚠️ Last Violation Blocked: ${violationReason.slice(0, 30)}...`);
					pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "blocked_by_user" });
					ctx.abort();
					return { block: true, reason: `🛑 BLOCKED by Damage-Control: ${violationReason} (User denied)\n\nDO NOT attempt to work around this restriction. DO NOT retry with alternative commands, paths, or approaches that achieve the same result. Report this block to the user exactly as stated and ask how they would like to proceed.` };
				} else {
					pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "confirmed_by_user" });
					return { block: false };
				}
			} else {
				ctx.ui.notify(`🛑 Damage-Control: Blocked ${event.toolName} due to ${violationReason}`);
				ctx.ui.setStatus(`⚠️ Last Violation: ${violationReason.slice(0, 30)}...`);
				pi.appendEntry("damage-control-log", { tool: event.toolName, input: event.input, rule: violationReason, action: "blocked" });
				ctx.abort();
				return { block: true, reason: `🛑 BLOCKED by Damage-Control: ${violationReason}\n\nDO NOT attempt to work around this restriction. DO NOT retry with alternative commands, paths, or approaches that achieve the same result. Report this block to the user exactly as stated and ask how they would like to proceed.` };
			}
		}

		return { block: false };
	});
}