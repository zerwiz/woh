#!/usr/bin/env node
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStateDir = ensureStateDir;
exports.loadState = loadState;
exports.saveState = saveState;
exports.createSession = createSession;
exports.addEntry = addEntry;
exports.getHistory = getHistory;
exports.getAgentHistory = getAgentHistory;
exports.getToolHistory = getToolHistory;
exports.setTheme = setTheme;
exports.setMode = setMode;
exports.setTeam = setTeam;
exports.getCurrentSession = getCurrentSession;
exports.startNewSession = startNewSession;
var fs_1 = require("fs");
var path_1 = require("path");
var STATE_DIR = "/home/zerwiz/woh/.alloy";
var STATE_FILE = (0, path_1.join)(STATE_DIR, "state.json");
function ensureStateDir() {
    if (!(0, fs_1.existsSync)(STATE_DIR)) {
        (0, fs_1.mkdirSync)(STATE_DIR, { recursive: true });
    }
}
function loadState() {
    ensureStateDir();
    try {
        if ((0, fs_1.existsSync)(STATE_FILE)) {
            return JSON.parse((0, fs_1.readFileSync)(STATE_FILE, "utf-8"));
        }
    }
    catch (_a) { }
    return {
        sessions: {},
        currentSession: null,
        theme: "nord",
        mode: "single",
        team: "all",
    };
}
function saveState(state) {
    ensureStateDir();
    (0, fs_1.writeFileSync)(STATE_FILE, JSON.stringify(state, null, 2));
}
function createSession(name) {
    var id = "session-".concat(Date.now());
    return {
        id: id,
        name: name,
        startTime: Date.now(),
        lastActive: Date.now(),
        entries: [],
    };
}
function addEntry(session, entry) {
    session.entries.push(__assign(__assign({}, entry), { id: "entry-".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8)), timestamp: Date.now() }));
    session.lastActive = Date.now();
}
function getHistory(session, limit) {
    if (limit === void 0) { limit = 10; }
    return session.entries.slice(-limit);
}
function getAgentHistory(session, agentName) {
    return session.entries.filter(function (e) { return e.agent === agentName; });
}
function getToolHistory(session, toolName) {
    return session.entries.filter(function (e) { return e.tool === toolName; });
}
function setTheme(themeName) {
    var state = loadState();
    state.theme = themeName;
    saveState(state);
}
function setMode(modeName) {
    var state = loadState();
    state.mode = modeName;
    saveState(state);
}
function setTeam(teamName) {
    var state = loadState();
    state.team = teamName;
    saveState(state);
}
function getCurrentSession() {
    var state = loadState();
    if (!state.currentSession)
        return null;
    return state.sessions[state.currentSession] || null;
}
function startNewSession(agentName) {
    if (agentName === void 0) { agentName = "default"; }
    var state = loadState();
    var session = createSession(agentName);
    state.sessions[session.id] = session;
    state.currentSession = session.id;
    saveState(state);
    return session;
}
if (require.main === module) {
    var state = loadState();
    console.log("Current state:");
    console.log("  Theme: ".concat(state.theme));
    console.log("  Mode: ".concat(state.mode));
    console.log("  Team: ".concat(state.team));
    console.log("  Sessions: ".concat(Object.keys(state.sessions).length));
    var session = startNewSession("test");
    console.log("\nCreated session: ".concat(session.id));
    addEntry(session, { type: "task", content: "Hello world" });
    console.log("Added entry");
    console.log("History:", getHistory(session));
}
