/**
 * eelixir-widget.ts — Eelixir Agent Team TUI Widget
 *
 * A comprehensive TUI widget for displaying Eelixir agent team status,
 * including agent trees, activity indicators, and real-time metrics.
 *
 * Features:
 * - Animated agent status indicators
 * - Tool execution activity display
 * - Token and turn counters
 * - Error/warning notifications
 * - Configurable overflow handling
 */

import { EelixirUIContext, EelixirTheme, EelixirAgentState, EelixirAgentMetadata, EelixirRenderData } from "./eelixir-agent-types";

// ==================== SPINNERS & ICONS ====================

/** Animated spinners for agent status */
export const SPINNERS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

/** Status icons */
export const ICONS = {
  queued: "◦",
  running: "●",
  completed: "✓",
  error: "✗",
  aborted: "⊘",
  stopped: "■",
  active: "▶",
};

/** Status colors */
export const STATUS_COLORS = {
  queued: "muted",
  running: "accent",
  completed: "success",
  error: "error",
  aborted: "warning",
  stopped: "dim",
  active: "accent",
};

// ==================== CONSTANTS ====================

/** Maximum lines in widget before overflow */
const MAX_WIDGET_LINES = 12;

/** Running agent line height (header + activity = 2 lines) */
const RUNNING_LINES = 2;

/** Queued line takes 1 line */
const QUEUED_LINE = 1;

/** Finished agent takes 1 line */
const FINISHED_LINE = 1;

// ==================== FORMATTING HELPERS ====================

/** Format token count */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M tokens`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k tokens`;
  return `${count} tokens`;
}

/** Format turn count with limit */
export function formatTurns(turnCount: number, maxTurns?: number): string {
  if (maxTurns != null) return `⟳${turnCount}/${maxTurns}`;
  return `⟳${turnCount}`;
}

/** Format duration */
export function formatDuration(startedAt: number, completedAt?: number): string {
  if (completedAt) return `${(completedAt - startedAt).toFixed(1)}s`;
  return `${((Date.now() - startedAt) / 1000).toFixed(1)}s (running)`;
}

/** Format tool usage */
export function formatToolUsage(uses: number): string {
  return `${uses} tool${uses === 1 ? "" : "s"} used`;
}

/** Truncate text to column width */
import { truncateToWidth } from "@mariozechner/pi-tui";

export function truncate(line: string, cols: number): string {
  return truncateToWidth(line, cols);
}

// ==================== DESCRIPTION BUILDERS ====================

/** Get activity description from active tools or response */
export function describeActivity(
  activeTools: Map<string, string>,
  responseText?: string,
): string {
  if (activeTools.size > 0) {
    const actions: string[] = [];
    for (const toolName of activeTools.values()) {
      const actionMap: Record<string, string> = {
        read: "reading",
        bash: "running command",
        edit: "editing",
        write: "writing",
        grep: "searching",
        find: "finding",
        ls: "listing",
      };
      actions.push(actionMap[toolName] || toolName);
    }
    return actions.join(", ");
  }

  if (responseText && responseText.trim().length > 0) {
    return responseText.trim().slice(0, 50) + (responseText.length > 50 ? "..." : "");
  }

  return "thinking...";
}

// ==================== EELIXIR WIDGET CLASS ====================

export class EelixirWidget {
  private uiCtx: EelixirUIContext | undefined;
  private widgetFrame = 0;
  private widgetInterval: NodeJS.Timeout | undefined;
  private lastStatusText: string | undefined;
  private finishedTurnAge = new Map<string, number>();

  constructor(
    private agents: Map<string, EelixirAgentState>,
    private config: EelixirConfig,
  ) {}

  /** Set UI context */
  setUICtx(ctx: EelixirUIContext) {
    this.uiCtx = ctx;
    this.lastStatusText = undefined;
  }

  /** Update widget on each turn */
  onTurnStart() {
    this.ageFinished();
    this.update();
  }

  /** Age finished agents and clear expired ones */
  private ageFinished(): void {
    const age = this.finishedTurnAge.get("expired") ?? 0;
    this.finishedTurnAge.set("expired", age + 1);
  }

  /** Start widget update timer */
  ensureTimer() {
    if (!this.widgetInterval) {
      this.widgetInterval = setInterval(() => this.update(), 80);
    }
  }

  /** Check if finished agent should still be shown */
  private shouldShowFinished(agentId: string, status: string): boolean {
    const age = this.finishedTurnAge.get(agentId) ?? 0;
    const maxAge = status === "error" || status === "aborted" ? 2 : 1;
    return age < maxAge;
  }

  /** Record agent as finished */
  markFinished(agentId: string): void {
    if (!this.finishedTurnAge.has(agentId)) {
      this.finishedTurnAge.set(agentId, 0);
    }
  }

  /** Get all agents as array */
  private getAgents(): EelixirAgentState[] {
    return Array.from(this.agents.values());
  }

  /** Categorize agents by status */
  private categorizeAgents(): {
    running: EelixirAgentState[];
    queued: EelixirAgentState[];
    finished: EelixirAgentState[];
  } {
    const agents = this.getAgents();
    return {
      running: agents.filter((a) => a.status === "running"),
      queued: agents.filter((a) => a.status === "queued"),
      finished: agents.filter(
        (a) =>
          a.status !== "running" &&
          a.status !== "queued" &&
          a.status !== "completed" &&
          this.shouldShowFinished(a.id, a.status),
      ),
    };
  }

  /** Render widget content */
  private renderWidget(tui: any, theme: EelixirTheme): string[] {
    const { running, queued, finished } = this.categorizeAgents();
    const totalAgents = running.length + queued.length + finished.length;

    if (totalAgents === 0) return [];

    const cols = tui.terminal?.columns ?? 80;
    const truncateLine = (line: string) => truncate(line, cols);

    const hasActive = running.length > 0 || queued.length > 0;
    const headingColor = hasActive ? this.config.colors?.accent || "accent" : "dim";
    const headingIcon = hasActive ? ICONS.running + " " : ICONS.queued + " ";
    const frame = SPINNERS[this.widgetFrame % SPINNERS.length];

    const parts: string[] = [
      truncateLine(
        theme.fg(headingColor, headingIcon) +
          theme.bold(this.config.teamName) +
          (hasActive ? ` (${frame} ${totalAgents} agent${totalAgents === 1 ? "" : "s"})` : ""),
      ),
    ];

    // Render finished agents first
    for (const agent of finished) {
      const line = this.renderFinishedAgentLine(agent, theme, cols);
      parts.push(line);
    }

    // Render running agents
    for (const agent of running) {
      const lines = this.renderRunningAgentLines(agent, theme, cols);
      parts.push(...lines);
    }

    // Render queued agents
    if (queued.length > 0) {
      const queuedLine = truncateLine(
        theme.fg("dim", "◦") +
          theme.muted(` ${queued.length} queued`) +
          ` (${queued.map((a) => a.name).join(", ")})`,
      );
      parts.push(queuedLine);
    }

    // Overflow handling
    if (parts.length > MAX_WIDGET_LINES) {
      const overflowLines = [];
      for (let i = parts.length - 1; i >= 0; i--) {
        if (overflowLines.length < MAX_WIDGET_LINES - 2) {
          overflowLines.unshift(parts[i]);
        } else if (parts[i] === parts[0]) {
          break;
        }
      }
      parts.splice(1, parts.length - 2);
      parts.push(
        truncateLine(
          theme.fg("dim", "─") +
            theme.dim(` +${parts.length - 1} more line${parts.length - 1 === 1 ? "" : "s"}`),
        ),
      );
      parts.unshift(overflowLines[overflowLines.length - 1]);
    }

    // Fix connectors
    this.fixConnectors(parts);

    return parts;
  }

  /** Render finished agent line */
  private renderFinishedAgentLine(
    agent: EelixirAgentState,
    theme: EelixirTheme,
    cols: number,
  ): string {
    const icon = theme.fg(STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS], ICONS[agent.status as keyof typeof ICONS]);
    const statusColor = STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS] as Exclude<keyof typeof STATUS_COLORS, "queued">;
    const name = agent.name;
    const description = agent.description ?
      theme.dim(agent.description.slice(0, 40)) + (agent.description.length > 40 ? "..." : "") :
      "";
    const toolUses = agent.activeTools?.size || 0;
    const tokens = agent.session?.tokens ? formatTokens(agent.session.tokens) : "";
    const duration = formatDuration(agent.session?.startedAt, agent.session?.startedAt);
    const statusText = agent.status === "error" ? ` error: ${agent.session?.state || "Unknown error"}` : "";

    const parts: string[] = [];
    if (agent.metadata?.turnCount) parts.push(formatTurns(agent.metadata.turnCount, agent.metadata.maxTurns));
    if (toolUses > 0) parts.push(formatToolUsage(toolUses));
    if (tokens) parts.push(tokens);
    parts.push(duration);

    return truncateLine(
      theme.fg("dim", "─") +
        ` ${icon} ${theme.fg(statusColor, name)}  ${description}  ${theme.dim("·")} ${theme.dim(parts.join(" · "))}${statusText}`,
    );
  }

  /** Render running agent lines (header + activity) */
  private renderRunningAgentLines(
    agent: EelixirAgentState,
    theme: EelixirTheme,
    cols: number,
  ): string[] {
    const headerParts: string[] = [];
    if (agent.metadata?.turnCount) headerParts.push(formatTurns(agent.metadata.turnCount, agent.metadata.maxTurns));
    const toolUses = agent.activeTools?.size || 0;
    if (toolUses > 0) headerParts.push(formatToolUsage(toolUses));
    const tokens = agent.session?.tokens ? formatTokens(agent.session.tokens) : "";
    headerParts.push(tokens);
    headerParts.push(formatDuration(agent.session?.startedAt));
    const header = truncateLine(
      theme.fg("dim", "─") +
        ` ${theme.fg("accent", frame)} ${theme.bold(agent.name)}  ${theme.dim(agent.description || agent.type)}  ${theme.dim("·")} ${theme.dim(headerParts.join(" · "))}`,
    );

    const activityParts: string[] = [];
    const activity = describeActivity(agent.activeTools || new Map(), agent.session?.state);
    activityParts.push("⎿  " + activity);

    return [header, truncateLine(theme.fg("dim", "│  ") + theme.dim(activityParts.join(" ")))] as string[];
  }

  /** Fix tree connectors for last items */
  private fixConnectors(lines: string[]): void {
    if (lines.length > 1) {
      const last = lines.length - 1;
      lines[last] = lines[last].replace("├─", "└─");
    }
  }

  /** Render full content */
  public render(tui: any): EelixirRenderData {
    return {
      render: () => this.renderWidget(tui, tui.theme as EelixirTheme),
      invalidate: () => {
        // Force re-registration on theme change
        this.widgetFrame = 0;
      },
    };
  }

  /** Update widget */
  public update() {
    if (!this.uiCtx) return;
    this.widgetFrame++;
  }

  /** Force widget refresh */
  public forceRefresh() {
    this.widgetFrame = 0;
    this.update();
  }

  /** Cleanup */
  public dispose() {
    if (this.widgetInterval) {
      clearInterval(this.widgetInterval);
      this.widgetInterval = undefined;
    }
    if (this.uiCtx) {
      this.uiCtx.setWidget("eelixir", undefined);
      this.uiCtx.setStatus("eelixir", undefined);
    }
    this.finishedTurnAge.clear();
  }
}

// ==================== STANDARDS COMPLIANCE ====================

export const COMPLIANCE = {
  widgetStandard: "PI-TOOLBAR-001",
  displayName: "Eelixir Agent Widget",
  description: "TUI widget for Eelixir agent team visualization",
  features: [
    "Real-time agent status",
    "Tool activity display",
    "Token/turn counters",
    "Overflow handling",
    "Theme support",
  ],
};
