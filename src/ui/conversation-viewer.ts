/**
 * conversation-viewer.ts — Live conversation overlay for viewing agent sessions.
 *
 * Displays a scrollable, live-updating view of an agent's conversation.
 * Subscribes to session events for real-time streaming updates.
 */

/** Lines consumed by chrome: top border + header + header sep + footer sep + footer + bottom border. */
const CHROME_LINES = 6;
const MIN_VIEWPORT = 3;

/** Interface for agent session messages. */
interface AgentMessage {
  role: "user" | "assistant" | "toolResult" | "bashExecution";
  content: string | Array<{ type: string; text?: string }>;
}

/** Session statistics interface. */
interface SessionStats {
  tokens: {
    total: number;
  };
}

/** Session interface. */
interface AgentSession {
  subscribe(callback: () => void): () => void;
  messages: AgentMessage[];
  getSessionStats(): SessionStats;
}

/** Agent record interface. */
interface AgentRecord {
  type: string;
  status:
    | "queued"
    | "running"
    | "completed"
    | "steered"
    | "aborted"
    | "stopped"
    | "error"
    | "background";
  description: string;
  toolUses: number;
  startedAt: number;
  completedAt?: number;
  error?: string;
  subagentType?: string;
}

/** Theme interface (re-exported from agent-widget). */
export interface Theme {
  fg(color: string, text: string): string;
  bold(text: string): string;
}

/** Agent activity interface (re-exported from agent-widget). */
export interface AgentActivity {
  activeTools: Map<string, string>;
  toolUses: number;
  tokens: string;
  responseText: string;
  session?: { getSessionStats(): SessionStats };
  turnCount: number;
  maxTurns?: number;
}

/** Tool display mapping (re-exported from agent-widget). */
const TOOL_DISPLAY: Record<string, string> = {
  read: "reading",
  bash: "running command",
  edit: "editing",
  write: "writing",
  grep: "searching",
  find: "finding files",
  ls: "listing",
};

/** Get display name for any agent type. */
function getDisplayName(type: string): string {
  return type;
}

/** Get prompt mode label for agent type. */
function getPromptModeLabel(_type: string): string | undefined {
  return undefined;
}

/** Format a token count compactly. */
function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M token`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k token`;
  return `${count} token`;
}

/** Format duration from start/completed timestamps. */
function formatDuration(startedAt: number, completedAt?: number): string {
  if (completedAt) return `${((completedAt - startedAt) / 1000).toFixed(1)}s`;
  return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}

/** Extract text from message content. */
function extractText(content: any): string {
  if (typeof content === "string") return content;
  return content.map((c: any) => c.text ?? "").join("\n") || "";
}

/** Describe current activity. */
function describeActivity(
  activeTools: Map<string, string>,
  responseText?: string,
): string {
  if (activeTools.size > 0) {
    const groups = new Map<string, number>();
    for (const toolName of activeTools.values()) {
      const action = TOOL_DISPLAY[toolName] ?? toolName;
      groups.set(action, (groups.get(action) ?? 0) + 1);
    }

    const parts: string[] = [];
    for (const [action, count] of groups) {
      if (count > 1) {
        parts.push(
          `${action} ${count} ${action === "searching" ? "patterns" : "files"}`,
        );
      } else {
        parts.push(action);
      }
    }
    return parts.join(", ") + "…";
  }

  if (responseText && responseText.trim().length > 0) {
    const lines = responseText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length === 1) return lines[0];
    if (lines.length <= 3) return lines.join("\n");
    return lines.slice(0, 2).join("\n") + "\n…";
  }

  return "thinking…";
}

export class ConversationViewer implements Component {
  private autoScroll = true;
  private unsubscribe: (() => void) | undefined;
  private lastInnerW = 0;
  private closed = false;

  constructor(
    private tui: TUI,
    private session: AgentSession,
    private record: AgentRecord,
    private activity: AgentActivity | undefined,
    private theme: Theme,
    private done: (result: undefined) => void,
  ) {
    this.unsubscribe = session.subscribe(() => {
      if (this.closed) return;
      this.tui.requestRender();
    });
  }

  handleInput(data: string): void {
    if (matchesKey(data, "escape") || matchesKey(data, "q")) {
      this.closed = true;
      this.done(undefined);
      return;
    }

    const totalLines = this.buildContentLines(this.lastInnerW).length;
    const viewportHeight = this.viewportHeight();
    const maxScroll = Math.max(0, totalLines - viewportHeight);

    if (matchesKey(data, "up") || matchesKey(data, "k")) {
      this.scrollOffset = Math.max(0, this.scrollOffset - 1);
      this.autoScroll = this.scrollOffset >= maxScroll;
    } else if (matchesKey(data, "down") || matchesKey(data, "j")) {
      this.scrollOffset = Math.min(maxScroll, this.scrollOffset + 1);
      this.autoScroll = this.scrollOffset >= maxScroll;
    } else if (matchesKey(data, "pageUp")) {
      this.scrollOffset = Math.max(0, this.scrollOffset - viewportHeight);
      this.autoScroll = false;
    } else if (matchesKey(data, "pageDown")) {
      this.scrollOffset = Math.min(
        maxScroll,
        this.scrollOffset + viewportHeight,
      );
      this.autoScroll = this.scrollOffset >= maxScroll;
    } else if (matchesKey(data, "home")) {
      this.scrollOffset = 0;
      this.autoScroll = false;
    } else if (matchesKey(data, "end")) {
      this.scrollOffset = maxScroll;
      this.autoScroll = true;
    }
  }

  render(width: number): string[] {
    if (width < 6) return []; // too narrow for any meaningful rendering
    const th = this.theme;
    const innerW = width - 4; // border + padding
    this.lastInnerW = innerW;
    const lines: string[] = [];

    const pad = (s: string, len: number) => {
      const vis = visibleWidth(s);
      return s + " ".repeat(Math.max(0, len - vis));
    };
    const row = (content: string) =>
      th.fg("border", "│") +
      " " +
      truncateToWidth(pad(content, innerW), innerW) +
      " " +
      th.fg("border", "│");
    const hrTop = th.fg("border", `╭${"─".repeat(width - 2)}╮`);
    const hrBot = th.fg("border", `╰${"─".repeat(width - 2)}╯`);
    const hrMid = row(th.fg("dim", "─".repeat(innerW)));

    // Header
    lines.push(hrTop);
    const name = getDisplayName(this.record.type);
    const modeLabel = getPromptModeLabel(this.record.type);
    const modeTag = modeLabel ? ` ${th.fg("dim", `(${modeLabel})`)}` : "";
    const statusIcon =
      this.record.status === "running"
        ? th.fg("accent", "●")
        : this.record.status === "completed"
          ? th.fg("success", "✓")
          : this.record.status === "error"
            ? th.fg("error", "✗")
            : th.fg("dim", "○");
    const duration = formatDuration(
      this.record.startedAt,
      this.record.completedAt,
    );

    const headerParts: string[] = [duration];
    const toolUses = this.activity?.toolUses ?? this.record.toolUses;
    if (toolUses > 0)
      headerParts.unshift(`${toolUses} tool${toolUses === 1 ? "" : "s"}`);
    if (this.activity?.session) {
      try {
        const tokens = this.activity.session.getSessionStats().tokens.total;
        if (tokens > 0) headerParts.push(formatTokens(tokens));
      } catch {
        /* */
      }
    }

    lines.push(
      row(
        `${statusIcon} ${th.bold(name)}${modeTag}  ${th.fg("muted", this.record.description)} ${th.fg("dim", "·")} ${th.fg("dim", headerParts.join(" · "))}`,
      ),
    );
    lines.push(hrMid);

    // Content area — rebuild every render (live data, no cache needed)
    const contentLines = this.buildContentLines(innerW);
    const viewportHeight = this.viewportHeight();
    const maxScroll = Math.max(0, contentLines.length - viewportHeight);

    if (this.autoScroll) {
      this.scrollOffset = maxScroll;
    }

    const visibleStart = Math.min(this.scrollOffset, maxScroll);
    const visible = contentLines.slice(
      visibleStart,
      visibleStart + viewportHeight,
    );

    for (let i = 0; i < viewportHeight; i++) {
      lines.push(row(visible[i] ?? ""));
    }

    // Footer
    lines.push(hrMid);
    const scrollPct =
      contentLines.length <= viewportHeight
        ? "100%"
        : `${Math.round(((visibleStart + viewportHeight) / contentLines.length) * 100)}%`;
    const footerLeft = th.fg(
      "dim",
      `${contentLines.length} lines · ${scrollPct}`,
    );
    const footerRight = th.fg("dim", "↑↓ scroll · PgUp/PgDn · Esc close");
    const footerGap = Math.max(
      1,
      innerW - visibleWidth(footerLeft) - visibleWidth(footerRight),
    );
    lines.push(row(footerLeft + " ".repeat(footerGap) + footerRight));
    lines.push(hrBot);

    return lines;
  }

  invalidate(): void {
    /* no cached state to clear */
  }

  dispose(): void {
    this.closed = true;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  // ---- Private ----

  private viewportHeight(): number {
    return Math.max(MIN_VIEWPORT, this.tui.terminal.rows - CHROME_LINES);
  }

  private buildContentLines(width: number): string[] {
    if (width <= 0) return [];

    const th = this.theme;
    const messages = this.session.messages;
    const lines: string[] = [];

    if (messages.length === 0) {
      lines.push(th.fg("dim", "(waiting for first message...)"));
      return lines;
    }

    let needsSeparator = false;
    for (const msg of messages) {
      if (msg.role === "user") {
        const text =
          typeof msg.content === "string"
            ? msg.content
            : extractText(msg.content);
        if (!text.trim()) continue;
        if (needsSeparator) lines.push(th.fg("dim", "───"));
        lines.push(th.fg("accent", "[User]"));
        for (const line of wrapTextWithAnsi(text.trim(), width)) {
          lines.push(line);
        }
      } else if (msg.role === "assistant") {
        const textParts: string[] = [];
        const toolCalls: string[] = [];
        for (const c of msg.content) {
          if (c.type === "text" && c.text) textParts.push(c.text);
          else if (c.type === "toolCall") {
            toolCalls.push((c as any).name ?? (c as any).toolName ?? "unknown");
          }
        }
        if (needsSeparator) lines.push(th.fg("dim", "───"));
        lines.push(th.bold("[Assistant]"));
        if (textParts.length > 0) {
          for (const line of wrapTextWithAnsi(
            textParts.join("\n").trim(),
            width,
          )) {
            lines.push(line);
          }
        }
        for (const name of toolCalls) {
          lines.push(
            truncateToWidth(th.fg("muted", `  [Tool: ${name}]`), width),
          );
        }
      } else if (msg.role === "toolResult") {
        const text = extractText(msg.content);
        const truncated =
          text.length > 500 ? text.slice(0, 500) + "... (truncated)" : text;
        if (!truncated.trim()) continue;
        if (needsSeparator) lines.push(th.fg("dim", "───"));
        lines.push(th.fg("dim", "[Result]"));
        for (const line of wrapTextWithAnsi(truncated.trim(), width)) {
          lines.push(th.fg("dim", line));
        }
      } else if ((msg as any).role === "bashExecution") {
        const bash = msg as any;
        if (needsSeparator) lines.push(th.fg("dim", "───"));
        lines.push(
          truncateToWidth(th.fg("muted", `  $ ${bash.command}`), width),
        );
        if (bash.output?.trim()) {
          const out =
            bash.output.length > 500
              ? bash.output.slice(0, 500) + "... (truncated)"
              : bash.output;
          for (const line of wrapTextWithAnsi(out.trim(), width)) {
            lines.push(th.fg("dim", line));
          }
        }
      } else {
        continue;
      }
      needsSeparator = true;
    }

    // Streaming indicator for running agents
    if (this.record.status === "running" && this.activity) {
      const act = describeActivity(
        this.activity.activeTools,
        this.activity.responseText,
      );
      lines.push("");
      lines.push(
        truncateToWidth(th.fg("accent", "▍ ") + th.fg("dim", act), width),
      );
    }

    return lines.map((l) => truncateToWidth(l, width));
  }
}
