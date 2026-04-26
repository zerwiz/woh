#!/usr/bin/env node
"use strict";
/**
 * Alloy Agent CLI - Full Version
 *
 * TUI-style agent status display with Ollama provider
 * Supports tools, multi-agent dispatch, skills, themes, teams, and memory
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pi_tui_1 = require("@mariozechner/pi-tui");
var fs_1 = require("fs");
var path_1 = require("path");
var child_process_1 = require("child_process");
var damage_control_1 = require("./lib/damage-control");
var themes_1 = require("./lib/themes");
var agents_1 = require("./lib/agents");
var modes_1 = require("./lib/modes");
var memory_1 = require("./lib/memory");
// Spinner for animations  
var SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
// Working directory
var CWD = process.cwd();
// Available tools
var tools = {
    // Read file
    read: function (args, cwd) { return __awaiter(void 0, void 0, void 0, function () {
        var path, content;
        return __generator(this, function (_a) {
            if (args.length === 0)
                return [2 /*return*/, { success: false, output: "", error: "Usage: read <path>" }];
            path = (0, path_1.join)(cwd, args.join(" "));
            try {
                content = (0, fs_1.readFileSync)(path, "utf-8");
                return [2 /*return*/, { success: true, output: content.slice(0, 5000) }];
            }
            catch (e) {
                return [2 /*return*/, { success: false, output: "", error: e.message }];
            }
            return [2 /*return*/];
        });
    }); },
    // Write file
    write: function (args, cwd) { return __awaiter(void 0, void 0, void 0, function () {
        var path, content, dir;
        return __generator(this, function (_a) {
            if (args.length < 2)
                return [2 /*return*/, { success: false, output: "", error: "Usage: write <path> <content>" }];
            path = (0, path_1.join)(cwd, args[0]);
            content = args.slice(1).join(" ");
            try {
                dir = (0, path_1.dirname)(path);
                if (!(0, fs_1.existsSync)(dir))
                    (0, fs_1.mkdirSync)(dir, { recursive: true });
                (0, fs_1.writeFileSync)(path, content);
                return [2 /*return*/, { success: true, output: "Written to ".concat(path) }];
            }
            catch (e) {
                return [2 /*return*/, { success: false, output: "", error: e.message }];
            }
            return [2 /*return*/];
        });
    }); },
    // List directory
    ls: function (args, cwd) { return __awaiter(void 0, void 0, void 0, function () {
        var path, files;
        return __generator(this, function (_a) {
            path = (0, path_1.join)(cwd, args[0] || ".");
            try {
                files = (0, fs_1.readdirSync)(path).map(function (f) {
                    var stat = (0, fs_1.statSync)((0, path_1.join)(path, f));
                    return stat.isDirectory() ? f + "/" : f;
                }).sort();
                return [2 /*return*/, { success: true, output: files.join("\n") }];
            }
            catch (e) {
                return [2 /*return*/, { success: false, output: "", error: e.message }];
            }
            return [2 /*return*/];
        });
    }); },
    // Grep search
    grep: function (args, cwd) { return __awaiter(void 0, void 0, void 0, function () {
        var pattern, path, results_1, searchDir_1;
        return __generator(this, function (_a) {
            if (args.length < 2)
                return [2 /*return*/, { success: false, output: "", error: "Usage: grep <pattern> <path>" }];
            pattern = args[0];
            path = (0, path_1.join)(cwd, args[1]);
            try {
                results_1 = [];
                searchDir_1 = function (dir, depth) {
                    if (depth === void 0) { depth = 0; }
                    if (depth > 3)
                        return;
                    for (var _i = 0, _a = (0, fs_1.readdirSync)(dir); _i < _a.length; _i++) {
                        var file = _a[_i];
                        if (file.startsWith("."))
                            continue;
                        var fullPath = (0, path_1.join)(dir, file);
                        var stat = (0, fs_1.statSync)(fullPath);
                        if (stat.isDirectory()) {
                            searchDir_1(fullPath, depth + 1);
                        }
                        else if (stat.isFile() && /\.(ts|js|md|json|txt)$/.test(file)) {
                            var content = (0, fs_1.readFileSync)(fullPath, "utf-8");
                            var lines = content.split("\n");
                            for (var i = 0; i < lines.length; i++) {
                                if (lines[i].includes(pattern)) {
                                    results_1.push("".concat((0, path_1.relative)(cwd, fullPath), ":").concat(i + 1, ": ").concat(lines[i].slice(0, 80)));
                                    if (results_1.length > 30)
                                        return;
                                }
                            }
                        }
                    }
                };
                searchDir_1(path);
                return [2 /*return*/, { success: true, output: results_1.join("\n") || "No matches found" }];
            }
            catch (e) {
                return [2 /*return*/, { success: false, output: "", error: e.message }];
            }
            return [2 /*return*/];
        });
    }); },
    // Execute bash command
    bash: function (args, cwd) { return __awaiter(void 0, void 0, void 0, function () {
        var command, check;
        return __generator(this, function (_a) {
            if (args.length === 0)
                return [2 /*return*/, { success: false, output: "", error: "Usage: bash <command>" }];
            command = args.join(" ");
            // Check damage control
            if (damageRules) {
                check = (0, damage_control_1.checkBashCommand)(command, damageRules);
                if (check.blocked) {
                    return [2 /*return*/, { success: false, output: "", error: "BLOCKED: ".concat(check.reason) }];
                }
                if (check.needsConfirm) {
                    console.log("Warning: ".concat(check.reason, " - ").concat(command));
                }
            }
            return [2 /*return*/, new Promise(function (resolve) {
                    var child = (0, child_process_1.spawn)("sh", ["-c", command], { cwd: cwd });
                    var output = "";
                    var error = "";
                    child.stdout.on("data", function (data) { output += data.toString(); });
                    child.stderr.on("data", function (data) { error += data.toString(); });
                    child.on("close", function (code) {
                        resolve({ success: code === 0, output: output.slice(0, 3000), error: code !== 0 ? "Exit: ".concat(code) : undefined });
                    });
                    child.on("error", function (e) { return resolve({ success: false, output: "", error: e.message }); });
                })];
        });
    }); },
};
// Available skills
var skills = {
    analyze: {
        name: "analyze",
        description: "Analyze code structure and patterns",
        execute: function (input, context) { return "Analysis: ".concat(input); },
    },
    deduce: {
        name: "deduce",
        description: "Logical deduction",
        execute: function (input, context) { return "Deduction: ".concat(input); },
    },
    synthesize: {
        name: "synthesize",
        description: "Combine information",
        execute: function (input, context) { return "Synthesis: ".concat(input); },
    },
};
var agents = {
    architect: { name: "architect", description: "Architecture", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: [], skills: ["analyze", "deduce"] },
    builder: { name: "builder", description: "Code", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    scanner: { name: "scanner", description: "Discovery", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read", "ls", "grep", "bash"], skills: ["analyze"] },
    tester: { name: "tester", description: "Validation", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["bash", "read"], skills: ["deduce"] },
    frontend: { name: "frontend", description: "Frontend", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    planner: { name: "planner", description: "Planning", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["deduce"] },
    reviewer: { name: "reviewer", description: "Review", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read", "grep"], skills: ["analyze"] },
    planReviewer: { name: "plan-reviewer", description: "Plan Review", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read"], skills: ["analyze"] },
    redTeam: { name: "red-team", description: "Security", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["bash", "read"], skills: ["analyze"] },
    documenter: { name: "documenter", description: "Docs", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    scout: { name: "scout", description: "Explore", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read", "ls"], skills: ["analyze"] },
    bowser: { name: "bowser", description: "Browser", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["bash"], skills: [] },
    agentbuilder: { name: "agentbuilder", description: "Agent Builder", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    skillbuilder: { name: "skillbuilder", description: "Skill Builder", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    piDevExpert: { name: "pi-dev-expert", description: "Pi.dev Expert", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read", "write", "bash"], skills: ["deduce"] },
    extBuilder: { name: "ext-builder", description: "Ext Builder", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["write", "read"], skills: ["synthesize"] },
    agenttemplate: { name: "agenttemplate", description: "Templates", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read"], skills: [] },
    sessionManager: { name: "session-manager", description: "Sessions", status: "idle", task: "", toolCount: 0, elapsed: 0, lastWork: "", tools: ["read", "write"], skills: [] },
};
var activeTeam = ["architect", "builder", "scanner", "tester"];
var DEFAULT_MODEL = "qwen3.5:9b";
var OLLAMA_URL = "http://localhost:11434";
var TEAM_NAME = "all";
var DAMAGE_RULES_PATH = "/home/zerwiz/woh/alloy_agent/damage-control-rules.yaml";
var damageRules = (0, damage_control_1.loadDamageControlRules)(DAMAGE_RULES_PATH);
var currentTheme = (0, themes_1.getDefaultTheme)();
var allAgents = (0, agents_1.loadAllAgents)();
// ==================== TUI ====================
function renderTeam(frameIndex) {
    var width = 58;
    var lines = [];
    lines.push("┌" + "─".repeat(width) + "┐");
    lines.push("│" + " Alloy Agent Team ".padStart(width - 1) + "│");
    for (var i = 0; i < activeTeam.length; i++) {
        var name_1 = activeTeam[i];
        var agent = agents[name_1];
        var isLast = i === activeTeam.length - 1;
        var branch = isLast ? "└─" : "├─";
        var icon = "○";
        if (agent.status === "running")
            icon = SPINNER[frameIndex % SPINNER.length];
        else if (agent.status === "done")
            icon = "✓";
        else if (agent.status === "error")
            icon = "✗";
        var nameCap = name_1.charAt(0).toUpperCase() + name_1.slice(1);
        var desc = agent.task || agent.description;
        var stats = "";
        if (agent.status !== "idle") {
            var parts = [];
            parts.push(Math.round(agent.elapsed / 1000) + "s");
            if (agent.toolCount > 0)
                parts.push(agent.toolCount + " tool" + (agent.toolCount > 1 ? "s" : ""));
            stats = " · " + parts.join(" · ");
        }
        var line = "".concat(branch, " ").concat(icon, " ").concat(nameCap.padEnd(12), " ").concat(desc).padEnd(width - 2) + stats;
        lines.push((0, pi_tui_1.truncateToWidth)(line, width - 1) + "│");
        if (agent.status === "running" && agent.lastWork) {
            var actBranch = isLast ? " ⎿ " : " │ ";
            var actLines = agent.lastWork.split("\n").slice(0, 2);
            for (var _i = 0, actLines_1 = actLines; _i < actLines_1.length; _i++) {
                var l = actLines_1[_i];
                lines.push((0, pi_tui_1.truncateToWidth)(actBranch + l, width - 1) + "│");
            }
        }
    }
    var anyRunning = Object.values(agents).some(function (a) { return a.status === "running"; });
    var statusIcon = anyRunning ? "●" : "○";
    lines.push("└" + "─".repeat(width) + "┘");
    lines.push("│" + " ".concat(statusIcon, " Team: ").concat(TEAM_NAME, " ").padEnd(width - 1) + "│");
    lines.push("└" + "─".repeat(width) + "┘");
    console.clear();
    for (var _a = 0, lines_1 = lines; _a < lines_1.length; _a++) {
        var line = lines_1[_a];
        console.log(line);
    }
}
function checkOllama(url) {
    return __awaiter(this, void 0, void 0, function () {
        var res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("".concat(url, "/api/tags"))];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, res.ok];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function chat(url, model, messages) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch("".concat(url, "/api/chat"), {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ model: model, messages: messages, stream: false }),
                    })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _b.sent();
                    return [2 /*return*/, ((_a = data.message) === null || _a === void 0 ? void 0 : _a.content) || "No response"];
            }
        });
    });
}
function executeTool(toolName, args, cwd) {
    return __awaiter(this, void 0, void 0, function () {
        var tool;
        return __generator(this, function (_a) {
            tool = tools[toolName];
            if (!tool)
                return [2 /*return*/, { success: false, output: "", error: "Unknown tool: ".concat(toolName) }];
            return [2 /*return*/, tool(args, cwd)];
        });
    });
}
function dispatchToAgent(agentName, task) {
    return __awaiter(this, void 0, void 0, function () {
        var agent, frame, interval, parts, cmd, toolArgs, result, startTime, response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    agent = agents[agentName];
                    if (!agent)
                        return [2 /*return*/];
                    agent.status = "running";
                    agent.task = task;
                    frame = 0;
                    interval = setInterval(function () { return renderTeam(frame++); }, 80);
                    if (!(task.startsWith("read ") || task.startsWith("ls ") || task.startsWith("grep ") || task.startsWith("bash ") || task.startsWith("write "))) return [3 /*break*/, 2];
                    parts = task.split(" ");
                    cmd = parts[0];
                    toolArgs = parts.slice(1);
                    return [4 /*yield*/, executeTool(cmd, toolArgs, CWD)];
                case 1:
                    result = _a.sent();
                    agent.status = result.success ? "done" : "error";
                    agent.lastWork = result.output || result.error || "";
                    agent.toolCount = 1;
                    return [3 /*break*/, 5];
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    startTime = Date.now();
                    return [4 /*yield*/, chat(OLLAMA_URL, DEFAULT_MODEL, [{ role: "user", content: task }])];
                case 3:
                    response = _a.sent();
                    agent.elapsed = Date.now() - startTime;
                    agent.status = "done";
                    agent.lastWork = response;
                    agent.toolCount = 1;
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    agent.status = "error";
                    agent.lastWork = "Error: " + e_1.message;
                    return [3 /*break*/, 5];
                case 5:
                    clearInterval(interval);
                    renderTeam(0);
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, themeIdx, themeName, theme, teamIdx, teamName_1, teams, team, state, theme, task, dispatchMatch, agentName, subtask;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    themeIdx = args.indexOf("--theme");
                    if (themeIdx !== -1 && args[themeIdx + 1]) {
                        themeName = args[themeIdx + 1];
                        theme = (0, themes_1.loadTheme)(themeName);
                        if (theme) {
                            currentTheme = theme;
                            (0, memory_1.setTheme)(themeName);
                            console.log("Theme set to: ".concat(themeName));
                        }
                        else {
                            console.log("Theme not found: ".concat(themeName));
                            console.log("Available:", (0, themes_1.listThemes)().join(", "));
                        }
                        process.exit(0);
                    }
                    teamIdx = args.indexOf("--team");
                    if (teamIdx !== -1 && args[teamIdx + 1]) {
                        teamName_1 = args[teamIdx + 1];
                        teams = (0, modes_1.loadTeams)();
                        team = teams.find(function (t) { return t.name === teamName_1; });
                        if (team) {
                            (0, memory_1.setTeam)(teamName_1);
                            console.log("Team set to: ".concat(teamName_1));
                            console.log("Agents: ".concat(team.agents.join(", ")));
                        }
                        else {
                            console.log("Team not found: ".concat(teamName_1));
                            console.log("Available:", teams.map(function (t) { return t.name; }).join(", "));
                        }
                        process.exit(0);
                    }
                    state = (0, memory_1.loadState)();
                    if (state.theme) {
                        theme = (0, themes_1.loadTheme)(state.theme);
                        if (theme)
                            currentTheme = theme;
                    }
                    console.log("Checking Ollama...");
                    return [4 /*yield*/, checkOllama(OLLAMA_URL)];
                case 1:
                    if (!(_a.sent())) {
                        console.error("Error: Ollama not running at ".concat(OLLAMA_URL));
                        process.exit(1);
                    }
                    console.log("Ollama connected.");
                    console.log("Theme: ".concat(currentTheme.name, " | Team: ").concat(state.team, " | Mode: ").concat(state.mode, "\n"));
                    renderTeam(0);
                    task = args.join(" ");
                    if (!task) {
                        console.log("Tools: " + Object.keys(tools).join(", "));
                        console.log("Skills: " + Object.keys(skills).join(", "));
                        console.log("Available agents: " + Object.keys(allAgents).join(", "));
                        console.log("Usage: node cli-tui.ts <task>");
                        console.log("  --theme <name>   Set theme");
                        console.log("  --team <name>    Set team");
                        process.exit(0);
                    }
                    dispatchMatch = task.match(/^@(\w+)\s+(.+)$/);
                    if (!dispatchMatch) return [3 /*break*/, 5];
                    agentName = dispatchMatch[1], subtask = dispatchMatch[2];
                    if (!(allAgents[agentName] || agents[agentName])) return [3 /*break*/, 3];
                    return [4 /*yield*/, dispatchToAgent(agentName, subtask)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    console.log("Unknown agent: ".concat(agentName));
                    console.log("Available agents: " + Object.keys(allAgents).join(", "));
                    _a.label = 4;
                case 4: return [3 /*break*/, 7];
                case 5: 
                // Use scanner for tool tasks
                return [4 /*yield*/, dispatchToAgent("scanner", task)];
                case 6:
                    // Use scanner for tool tasks
                    _a.sent();
                    _a.label = 7;
                case 7:
                    console.log("\n--- End ---\n");
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
