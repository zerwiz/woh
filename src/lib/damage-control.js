#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDamageControlRules = loadDamageControlRules;
exports.checkBashCommand = checkBashCommand;
exports.checkPathAccess = checkPathAccess;
exports.checkFileExtension = checkFileExtension;
var fs_1 = require("fs");
function loadDamageControlRules(yamlPath) {
    try {
        var content = (0, fs_1.readFileSync)(yamlPath, "utf-8");
        return parseYamlRules(content);
    }
    catch (e) {
        console.error("Failed to load damage control rules:", e);
        return null;
    }
}
function parseYamlRules(content) {
    var rules = {
        bashToolPatterns: [],
        zeroAccessPaths: [],
        readOnlyPaths: [],
        noDeletePaths: [],
    };
    var currentSection = null;
    for (var _i = 0, _a = content.split("\n"); _i < _a.length; _i++) {
        var line = _a[_i];
        var trimmed = line.trim();
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
            var patternMatch = trimmed.match(/- pattern: ['"](.+?)['"]/);
            if (patternMatch) {
                rules.bashToolPatterns.push({
                    pattern: patternMatch[1],
                    reason: "",
                });
            }
        }
        else if (currentSection === "bashToolPatterns" && trimmed.startsWith("reason:") && rules.bashToolPatterns.length > 0) {
            var last = rules.bashToolPatterns[rules.bashToolPatterns.length - 1];
            last.reason = trimmed.replace("reason:", "").trim();
        }
        else if (currentSection === "zeroAccessPaths" && trimmed.startsWith("-")) {
            rules.zeroAccessPaths.push(trimmed.replace("-", "").trim());
        }
        else if (currentSection === "readOnlyPaths" && trimmed.startsWith("-")) {
            rules.readOnlyPaths.push(trimmed.replace("-", "").trim());
        }
        else if (currentSection === "noDeletePaths" && trimmed.startsWith("-")) {
            rules.noDeletePaths.push(trimmed.replace("-", "").trim());
        }
    }
    return rules;
}
function checkBashCommand(command, rules) {
    for (var _i = 0, _a = rules.bashToolPatterns; _i < _a.length; _i++) {
        var rule = _a[_i];
        var regex = new RegExp(rule.pattern, "i");
        if (regex.test(command)) {
            var needsConfirm = rule.ask === true;
            return { blocked: !needsConfirm, reason: rule.reason, needsConfirm: needsConfirm };
        }
    }
    return { blocked: false };
}
function checkPathAccess(path, rules, mode) {
    var normalizedPath = path.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
    if (mode === "read") {
        for (var _i = 0, _a = rules.zeroAccessPaths; _i < _a.length; _i++) {
            var blockedPath = _a[_i];
            var resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
            if (normalizedPath.includes(resolved) || normalizedPath === resolved) {
                return { blocked: true, reason: "Zero-access path" };
            }
        }
        for (var _b = 0, _c = rules.readOnlyPaths; _b < _c.length; _b++) {
            var blockedPath = _c[_b];
            var resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
            if (normalizedPath.startsWith(resolved)) {
                return { blocked: true, reason: "Read-only path" };
            }
        }
    }
    if (mode === "write" || mode === "delete") {
        for (var _d = 0, _e = rules.noDeletePaths; _d < _e.length; _d++) {
            var blockedPath = _e[_d];
            var resolved = blockedPath.replace(/^~/, process.env.HOME || "/home/" + process.env.USER);
            if (normalizedPath.includes(resolved) || normalizedPath === resolved) {
                return { blocked: true, reason: "No-delete path" };
            }
        }
    }
    return { blocked: false };
}
function checkFileExtension(path) {
    var dangerous = [".exe", ".sh", ".bat", ".cmd", ".ps1", ".dmg", ".pkg", ".deb", ".rpm"];
    var ext = path.toLowerCase().slice(path.lastIndexOf("."));
    return dangerous.includes(ext);
}
if (require.main === module) {
    var rulesPath = process.argv[2] || "/home/zerwiz/woh/alloy_agent/damage-control-rules.yaml";
    var rules = loadDamageControlRules(rulesPath);
    if (rules) {
        console.log("Loaded damage control rules:");
        console.log("  Patterns: ".concat(rules.bashToolPatterns.length));
        console.log("  Zero-access paths: ".concat(rules.zeroAccessPaths.length));
        console.log("  Read-only paths: ".concat(rules.readOnlyPaths.length));
        console.log("  No-delete paths: ".concat(rules.noDeletePaths.length));
    }
}
