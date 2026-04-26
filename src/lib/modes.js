#!/usr/bin/env node
"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTeams = loadTeams;
exports.loadChains = loadChains;
exports.getMode = getMode;
exports.executeTeam = executeTeam;
exports.executeChain = executeChain;
var fs_1 = require("fs");
var TEAMS_FILE = "/home/zerwiz/woh/alloy_agent/agents/teams.yaml";
var CHAIN_FILE = "/home/zerwiz/woh/alloy_agent/agents/agent-chain.yaml";
function loadTeams() {
    try {
        var content = (0, fs_1.readFileSync)(TEAMS_FILE, "utf-8");
        var teams = [];
        var current = null;
        for (var _i = 0, _a = content.split("\n"); _i < _a.length; _i++) {
            var line = _a[_i];
            var trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            if (!trimmed.startsWith(" ") && !trimmed.startsWith("\t") && trimmed.endsWith(":")) {
                var name_1 = trimmed.replace(":", "");
                if (name_1 !== "all" && name_1 !== "development" && name_1 !== "testing" &&
                    name_1 !== "review" && name_1 !== "code-review" && name_1 !== "pair-programming") {
                    current = { name: name_1, agents: [] };
                    teams.push(current);
                }
            }
            else if (current && trimmed.startsWith("-")) {
                current.agents.push(trimmed.replace("-", "").trim());
            }
        }
        return __spreadArray([
            { name: "all", agents: ["architect", "builder", "scanner", "tester"] },
            { name: "development", agents: ["architect", "builder", "scanner", "tester"] },
            { name: "testing", agents: ["scanner", "tester"] },
            { name: "review", agents: ["architect", "tester"] },
            { name: "code-review", agents: ["scanner", "architect"] },
            { name: "pair-programming", agents: ["builder", "scanner"] }
        ], teams, true);
    }
    catch (_b) {
        return [
            { name: "all", agents: ["architect", "builder", "scanner", "tester"] },
        ];
    }
}
function loadChains() {
    try {
        var content = (0, fs_1.readFileSync)(CHAIN_FILE, "utf-8");
        var chains = [];
        var current = null;
        for (var _i = 0, _a = content.split("\n"); _i < _a.length; _i++) {
            var line = _a[_i];
            var trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#"))
                continue;
            if (!trimmed.startsWith(" ") && !trimmed.startsWith("\t") && trimmed.endsWith(":")) {
                current = { name: trimmed.replace(":", ""), steps: [] };
                chains.push(current);
            }
            else if (current && trimmed.startsWith("-")) {
                current.steps.push(trimmed.replace("-", "").trim());
            }
        }
        return chains;
    }
    catch (_b) {
        return [];
    }
}
function getMode() {
    var arg = process.argv[2];
    if (arg === "--team")
        return "team";
    if (arg === "--chain")
        return "chain";
    if (arg === "--parallel")
        return "parallel";
    return "single";
}
function executeTeam(task, teamName) {
    return __awaiter(this, void 0, void 0, function () {
        var teams, team;
        return __generator(this, function (_a) {
            teams = loadTeams();
            team = teams.find(function (t) { return t.name === teamName; });
            if (!team) {
                console.log("Team not found: ".concat(teamName));
                console.log("Available teams:", teams.map(function (t) { return t.name; }).join(", "));
                return [2 /*return*/];
            }
            console.log("Executing team: ".concat(teamName));
            console.log("Agents: ".concat(team.agents.join(", ")));
            console.log("Task: ".concat(task));
            return [2 /*return*/];
        });
    });
}
function executeChain(task, chainName) {
    return __awaiter(this, void 0, void 0, function () {
        var chains, chain;
        return __generator(this, function (_a) {
            chains = loadChains();
            chain = chains.find(function (c) { return c.name === chainName; });
            if (!chain) {
                console.log("Chain not found: ".concat(chainName));
                console.log("Available chains:", chains.map(function (c) { return c.name; }).join(", "));
                return [2 /*return*/];
            }
            console.log("Executing chain: ".concat(chainName));
            console.log("Steps: ".concat(chain.steps.join(" -> ")));
            console.log("Task: ".concat(task));
            return [2 /*return*/];
        });
    });
}
if (require.main === module) {
    var teams = loadTeams();
    console.log("Teams:");
    for (var _i = 0, teams_1 = teams; _i < teams_1.length; _i++) {
        var team = teams_1[_i];
        console.log("  ".concat(team.name, ": ").concat(team.agents.join(", ")));
    }
    var chains = loadChains();
    console.log("\nChains:");
    for (var _a = 0, chains_1 = chains; _a < chains_1.length; _a++) {
        var chain = chains_1[_a];
        console.log("  ".concat(chain.name, ": ").concat(chain.steps.join(" -> ")));
    }
}
