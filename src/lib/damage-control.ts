#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";

interface DamageControlRules {
  bashToolPatterns: Array<{pattern: string; reason: string; ask?: boolean}>;
  zeroAccessPaths: string[];
  readOnlyPaths: string[];
  noDeletePaths: string[];
}

export function loadDamageControlRules(yamlPath: string): DamageControlRules | null {
  try {
    const content = readFileSync(yamlPath, "utf-8");
    return parseYamlRules(content);
  } catch (e) {
    console.error("Failed to load damage control rules:", e);
    return null;
  }
}

function parseYamlRules(content: string): DamageControlRules {
  const rules: DamageControlRules = {
    bashToolPatterns: [],
    zeroAccessPaths: [],
    readOnlyPaths: [],
    noDeletePaths: [],
  };
  
  let currentSection: string | null = null;
  
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    
    if (trimmed === "bashToolPatterns:") {
      currentSection = "bashToolPatterns";
      continue;
    }
    if (trimmed === "zeroAccessPaths:") {
      currentSection = "zeroAccessPaths";
      continue;
    }
    if (trimmed === "readOnlyPaths:") {
      currentSection = "readOnlyPaths";
      continue;
    }
    if (trimmed === "noDeletePaths:") {
      currentSection = "noDeletePaths";
      continue;
    }
    
    if (currentSection === "bashToolPatterns" && trimmed.startsWith("- pattern:")) {
      const patternMatch = trimmed.match(/- pattern: ['"](.+?)['"]/);
      if (patternMatch) {
        rules.bashToolPatterns.push({
          pattern: patternMatch[1],
          reason: "",
        });
      }
    } else if (currentSection === "bashToolPatterns" && trimmed.startsWith("reason:") && rules.bashToolPatterns.length > 0) {
      const last = rules.bashToolPatterns[rules.bashToolPatterns.length - 1];
      last.reason = trimmed.replace("reason:", "").trim();
    } else if (currentSection === "zeroAccessPaths" && trimmed.startsWith("-")) {
      rules.zeroAccessPaths.push(trimmed.replace("-", "").trim());
    } else if (currentSection === "readOnlyPaths" && trimmed.startsWith("-")) {
      rules.readOnlyPaths.push(trimmed.replace("-", "").trim());
    } else if (currentSection === "noDeletePaths" && trimmed.startsWith("-")) {
      rules.noDeletePaths.push(trimmed.replace("-", "").trim());
    }
  }
  
  return rules;
}

export function checkBashCommand(command: string, rules: DamageControlRules): {blocked: boolean; reason?: string; needsConfirm?: boolean} {
  for (const rule of rules.bashToolPatterns) {
    const regex = new RegExp(rule.pattern, "i");
    if (regex.test(command)) {
      const needsConfirm = rule.ask === true;
      return { blocked: !needsConfirm, reason: rule.reason, needsConfirm };
    }
  }
  return { blocked: false };
}

export function checkPathAccess(path: string, rules: DamageControlRules, mode: "read" | "write" | "delete"): {blocked: boolean; reason?: string} {
  const normalizedPath = path.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
  
  if (mode === "read") {
    for (const blockedPath of rules.zeroAccessPaths) {
      const resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
      if (normalizedPath.includes(resolved) || normalizedPath === resolved) {
        return { blocked: true, reason: "Zero-access path" };
      }
    }
    for (const blockedPath of rules.readOnlyPaths) {
      const resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
      if (normalizedPath.startsWith(resolved)) {
        return { blocked: true, reason: "Read-only path" };
      }
    }
  }
  
  if (mode === "write" || mode === "delete") {
    for (const blockedPath of rules.noDeletePaths) {
      const resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
      if (normalizedPath.includes(resolved) || normalizedPath === resolved) {
        return { blocked: true, reason: "No-delete path" };
      }
    }
  }
  
  return { blocked: false };
}

export function checkFileExtension(path: string): boolean {
  const dangerous = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".dmg", ".pkg", ".deb", ".rpm"];
  const ext = path.toLowerCase().slice(path.lastIndexOf("."));
  return dangerous.includes(ext);
}

if (import.meta.url === process.argv[1] || process.argv[1]?.includes("damage-control")) {
  const rulesPath = process.argv[2] || process.argv[3] || "/home/zerwiz/woh/alloy_agent/damage-control-rules.yaml";
  const rules = loadDamageControlRules(rulesPath);
  
  if (rules) {
    console.log("Loaded damage control rules:");
    console.log(`  Patterns: ${rules.bashToolPatterns.length}`);
    console.log(`  Zero-access paths: ${rules.zeroAccessPaths.length}`);
    console.log(`  Read-only paths: ${rules.readOnlyPaths.length}`);
    console.log(`  No-delete paths: ${rules.noDeletePaths.length}`);
  }
}