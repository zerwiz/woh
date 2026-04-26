#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTheme = loadTheme;
exports.listThemes = listThemes;
exports.getDefaultTheme = getDefaultTheme;
exports.renderThemeBox = renderThemeBox;
var fs_1 = require("fs");
var path_1 = require("path");
var THEMES_DIR = "/home/zerwiz/woh/themes";
function loadTheme(name) {
    var path = (0, path_1.join)(THEMES_DIR, "".concat(name, ".json"));
    try {
        var content = (0, fs_1.readFileSync)(path, "utf-8");
        var data = JSON.parse(content);
        return {
            name: data.name || name,
            background: data.background || "#1e1e2e",
            foreground: data.foreground || "#cdd6f4",
            primary: data.primary || "#89b4fa",
            secondary: data.secondary || "#f5c2e7",
            accent: data.accent || "#94e2d5",
            error: data.error || "#f38ba8",
            warning: data.warning || "#fab387",
            success: data.success || "#a6e3a1",
            muted: data.muted || "#6c7086",
            border: data.border || "#45475a",
        };
    }
    catch (e) {
        console.error("Failed to load theme ".concat(name, ":"), e);
        return null;
    }
}
function listThemes() {
    try {
        return (0, fs_1.readdirSync)(THEMES_DIR)
            .filter(function (f) { return f.endsWith(".json"); })
            .map(function (f) { return f.replace(".json", ""); });
    }
    catch (_a) {
        return [];
    }
}
function getDefaultTheme() {
    return loadTheme("nord") || {
        name: "default",
        background: "#1e1e2e",
        foreground: "#cdd6f4",
        primary: "#89b4fa",
        secondary: "#f5c2e7",
        accent: "#94e2d5",
        error: "#f38ba8",
        warning: "#fab387",
        success: "#a6e3a1",
        muted: "#6c7086",
        border: "#45475a",
    };
}
function renderThemeBox(theme, width) {
    if (width === void 0) { width = 40; }
    var lines = [];
    var s = theme;
    lines.push("┌" + "─".repeat(width) + "┐");
    lines.push("│" + " Theme: ".concat(s.name, " ").padEnd(width - 1) + "│");
    lines.push("├" + "─".repeat(width) + "┤");
    lines.push("│" + " Background ".padEnd(width - 21) + "│ " + s.background + " │");
    lines.push("│" + " Foreground ".padEnd(width - 21) + "│ " + s.foreground + " │");
    lines.push("│" + " Primary   ".padEnd(width - 21) + "│ " + s.primary + " │");
    lines.push("│" + " Secondary ".padEnd(width - 21) + "│ " + s.secondary + " │");
    lines.push("│" + " Accent    ".padEnd(width - 21) + "│ " + s.accent + " │");
    lines.push("│" + " Error     ".padEnd(width - 21) + "│ " + s.error + " │");
    lines.push("│" + " Success   ".padEnd(width - 21) + "│ " + s.success + " │");
    lines.push("└" + "─".repeat(width) + "┘");
    return lines.join("\n");
}
if (require.main === module) {
    var themes = listThemes();
    console.log("Available themes:", themes.join(", "));
    console.log("");
    var defaultT = getDefaultTheme();
    console.log(renderThemeBox(defaultT));
}
