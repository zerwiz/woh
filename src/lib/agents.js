#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAgent = loadAgent;
exports.loadAllAgents = loadAllAgents;
exports.listAgentNames = listAgentNames;
var fs_1 = require("fs");
var path_1 = require("path");
var AGENTS_DIR = "/home/zerwiz/woh/alloy_agent/agents";
function loadAgent(name) {
    var mdPath = (0, path_1.join)(AGENTS_DIR, "".concat(name, ".md"));
    var yamlPath = (0, path_1.join)(AGENTS_DIR, "".concat(name, ".yaml"));
    try {
        if ((0, fs_1.existsSync)(mdPath)) {
            return parseAgentMarkdown(name, (0, fs_1.readFileSync)(mdPath, "utf-8"));
        }
        if ((0, fs_1.existsSync)(yamlPath)) {
            return parseAgentYaml(name, (0, fs_1.readFileSync)(yamlPath, "utf-8"));
        }
    }
    catch (e) {
        console.error("Failed to load agent ".concat(name, ":"), e);
    }
    return null;
}
function parseAgentMarkdown(name, content) {
    var lines = content.split("\n");
    var description = "";
    var prompt = "";
    var tools = [];
    var skills = [];
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.startsWith("## ")) {
            description = line.replace("## ", "").trim();
        }
        else if (line.startsWith("### ")) {
            prompt += line.replace("### ", "").trim() + "\n";
        }
        else if (!line.startsWith("#") && prompt) {
            prompt += line + "\n";
        }
        if (line.includes("tool:") || line.includes("tools:")) {
            var match = line.match(/tools?:\s*\[?([^\]]+)\]?/);
            if (match) {
                tools = match[1].split(",").map(function (t) { return t.trim().replace(/['"]/g, ""); });
            }
        }
        if (line.includes("skill:") || line.includes("skills:")) {
            var match = line.match(/skills?:\s*\[?([^\]]+)\]?/);
            if (match) {
                skills = match[1].split(",").map(function (s) { return s.trim().replace(/['"]/g, ""); });
            }
        }
    }
    return {
        name: name,
        description: description || name,
        prompt: prompt.trim() || "You are ".concat(name, "."),
        tools: tools,
        skills: skills,
        enabled: true,
    };
}
function parseAgentYaml(name, content) {
    var lines = content.split("\n");
    var description = "";
    var tools = [];
    var skills = [];
    for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
        var line = lines_2[_i];
        if (line.startsWith("description:")) {
            description = line.replace("description:", "").trim();
        }
        if (line.startsWith("tools:")) {
            var match = line.match(/tools:\s*\[?([^\]]+)\]?/);
            if (match) {
                tools = match[1].split(",").map(function (t) { return t.trim().replace(/['"]/g, ""); });
            }
        }
        if (line.startsWith("skills:")) {
            var match = line.match(/skills:\s*\[?([^\]]+)\]?/);
            if (match) {
                skills = match[1].split(",").map(function (s) { return s.trim().replace(/['"]/g, ""); });
            }
        }
    }
    return {
        name: name,
        description: description,
        prompt: "You are ".concat(name, ". ").concat(description),
        tools: tools,
        skills: skills,
        enabled: true,
    };
}
function loadAllAgents() {
    var agents = {};
    var defaultAgents = [
        "architect", "builder", "scanner", "tester",
        "frontend", "planner", "reviewer", "plan-reviewer",
        "red-team", "documenter", "scout", "bowser",
        "agentbuilder", "skillbuilder", "pi-dev-expert",
        "ext-builder", "agenttemplate", "session-manager",
    ];
    for (var _i = 0, defaultAgents_1 = defaultAgents; _i < defaultAgents_1.length; _i++) {
        var name_1 = defaultAgents_1[_i];
        var agent = loadAgent(name_1);
        if (agent) {
            agents[name_1] = agent;
        }
    }
    return agents;
}
function listAgentNames() {
    var agents = loadAllAgents();
    return Object.keys(agents);
}
if (require.main === module) {
    var agents = loadAllAgents();
    console.log("Loaded agents:", Object.keys(agents).join(", "));
    console.log("");
    for (var _i = 0, _a = Object.entries(agents); _i < _a.length; _i++) {
        var _b = _a[_i], name_2 = _b[0], agent = _b[1];
        console.log("- ".concat(name_2, ": ").concat(agent.description));
        console.log("  tools: ".concat(agent.tools.join(", ")));
        console.log("  skills: ".concat(agent.skills.join(", ")));
    }
}
