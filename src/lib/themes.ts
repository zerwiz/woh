#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

export interface Theme {
  name: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  error: string;
  warning: string;
  success: string;
  muted: string;
  border: string;
}

export interface ThemeSet {
  name: string;
  dark: Theme;
  light: Theme;
}

const THEMES_DIR = "/home/zerwiz/woh/themes";

export function loadTheme(name: string): Theme | null {
  const path = join(THEMES_DIR, `${name}.json`);
  try {
    const content = readFileSync(path, "utf-8");
    const data = JSON.parse(content);
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
  } catch (e) {
    console.error(`Failed to load theme ${name}:`, e);
    return null;
  }
}

export function listThemes(): string[] {
  try {
    return readdirSync(THEMES_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => f.replace(".json", ""));
  } catch {
    return [];
  }
}

export function getDefaultTheme(): Theme {
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

export function renderThemeBox(theme: Theme, width = 40): string {
  const lines: string[] = [];
  const s = theme;
  
  lines.push("┌" + "─".repeat(width) + "┐");
  lines.push("│" + ` Theme: ${s.name} `.padEnd(width - 1) + "│");
  lines.push("├" + "─".repeat(width) + "┤");
  lines.push("│" + ` Background `.padEnd(width - 21) + "│ " + s.background + " │");
  lines.push("│" + ` Foreground `.padEnd(width - 21) + "│ " + s.foreground + " │");
  lines.push("│" + ` Primary   `.padEnd(width - 21) + "│ " + s.primary + " │");
  lines.push("│" + ` Secondary `.padEnd(width - 21) + "│ " + s.secondary + " │");
  lines.push("│" + ` Accent    `.padEnd(width - 21) + "│ " + s.accent + " │");
  lines.push("│" + ` Error     `.padEnd(width - 21) + "│ " + s.error + " │");
  lines.push("│" + ` Success   `.padEnd(width - 21) + "│ " + s.success + " │");
  lines.push("└" + "─".repeat(width) + "┘");
  
  return lines.join("\n");
}

if (import.meta.url === process.argv[1] || process.argv[1]?.includes("themes.ts")) {
  const themes = listThemes();
  console.log("Available themes:", themes.join(", "));
  console.log("");
  const defaultT = getDefaultTheme();
  console.log(renderThemeBox(defaultT));
}