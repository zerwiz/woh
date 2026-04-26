/**
 * conversation-viewer.ts — Live conversation overlay for viewing agent sessions.
 *
 * Displays a scrollable, live-updating view of an agent's conversation.
 * Subscribes to session events for real-time streaming updates.
 */
/** Lines consumed by chrome: top border + header + header sep + footer sep + footer + bottom border. */
const CHROME_LINES = 6;
const MIN_VIEWPORT = 3;
/** Tool display mapping (re-exported from agent-widget). */
const TOOL_DISPLAY = {
    read: "reading",
    bash: "running command",
    edit: "editing",
    write: "writing",
    grep: "searching",
    find: "finding files",
    ls: "listing",
};
/** Get display name for any agent type. */
function getDisplayName(type) {
    return type;
}
/** Get prompt mode label for agent type. */
function getPromptModeLabel(_type) {
    return undefined;
}
/** Format a token count compactly. */
function formatTokens(count) {
    if (count >= 1_000_000)
        return `${(count / 1_000_000).toFixed(1)}M token`;
    if (count >= 1_000)
        return `${(count / 1_000).toFixed(1)}k token`;
    return `${count} token`;
}
/** Format duration from start/completed timestamps. */
function formatDuration(startedAt, completedAt) {
    if (completedAt)
        return `${((completedAt - startedAt) / 1000).toFixed(1)}s`;
    return `${((Date.now() - startedAt) / 1000).toFixed(1)}s`;
}
/** Extract text from message content. */
function extractText(content) {
    if (typeof content === "string")
        return content;
    return content.map((c) => c.text ?? "").join("\n") || "";
}
/** Describe current activity. */
function describeActivity(activeTools, responseText) {
    if (activeTools.size > 0) {
        const groups = new Map();
        for (const toolName of activeTools.values()) {
            const action = TOOL_DISPLAY[toolName] ?? toolName;
            groups.set(action, (groups.get(action) ?? 0) + 1);
        }
        const parts = [];
        for (const [action, count] of groups) {
            if (count > 1) {
                parts.push(`${action} ${count} ${action === "searching" ? "patterns" : "files"}`);
            }
            else {
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
        if (lines.length === 1)
            return lines[0];
        if (lines.length <= 3)
            return lines.join("\n");
        return lines.slice(0, 2).join("\n") + "\n…";
    }
    return "thinking…";
}
export class ConversationViewer {
    tui;
    session;
    record;
    activity;
    theme;
    done;
    autoScroll = true;
    unsubscribe;
    lastInnerW = 0;
    closed = false;
    constructor(tui, session, record, activity, theme, done) {
        this.tui = tui;
        this.session = session;
        this.record = record;
        this.activity = activity;
        this.theme = theme;
        this.done = done;
        this.unsubscribe = session.subscribe(() => {
            if (this.closed)
                return;
            this.tui.requestRender();
        });
    }
    handleInput(data) {
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
        }
        else if (matchesKey(data, "down") || matchesKey(data, "j")) {
            this.scrollOffset = Math.min(maxScroll, this.scrollOffset + 1);
            this.autoScroll = this.scrollOffset >= maxScroll;
        }
        else if (matchesKey(data, "pageUp")) {
            this.scrollOffset = Math.max(0, this.scrollOffset - viewportHeight);
            this.autoScroll = false;
        }
        else if (matchesKey(data, "pageDown")) {
            this.scrollOffset = Math.min(maxScroll, this.scrollOffset + viewportHeight);
            this.autoScroll = this.scrollOffset >= maxScroll;
        }
        else if (matchesKey(data, "home")) {
            this.scrollOffset = 0;
            this.autoScroll = false;
        }
        else if (matchesKey(data, "end")) {
            this.scrollOffset = maxScroll;
            this.autoScroll = true;
        }
    }
    render(width) {
        if (width < 6)
            return []; // too narrow for any meaningful rendering
        const th = this.theme;
        const innerW = width - 4; // border + padding
        this.lastInnerW = innerW;
        const lines = [];
        const pad = (s, len) => {
            const vis = visibleWidth(s);
            return s + " ".repeat(Math.max(0, len - vis));
        };
        const row = (content) => th.fg("border", "│") +
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
        const statusIcon = this.record.status === "running"
            ? th.fg("accent", "●")
            : this.record.status === "completed"
                ? th.fg("success", "✓")
                : this.record.status === "error"
                    ? th.fg("error", "✗")
                    : th.fg("dim", "○");
        const duration = formatDuration(this.record.startedAt, this.record.completedAt);
        const headerParts = [duration];
        const toolUses = this.activity?.toolUses ?? this.record.toolUses;
        if (toolUses > 0)
            headerParts.unshift(`${toolUses} tool${toolUses === 1 ? "" : "s"}`);
        if (this.activity?.session) {
            try {
                const tokens = this.activity.session.getSessionStats().tokens.total;
                if (tokens > 0)
                    headerParts.push(formatTokens(tokens));
            }
            catch {
                /* */
            }
        }
        lines.push(row(`${statusIcon} ${th.bold(name)}${modeTag}  ${th.fg("muted", this.record.description)} ${th.fg("dim", "·")} ${th.fg("dim", headerParts.join(" · "))}`));
        lines.push(hrMid);
        // Content area — rebuild every render (live data, no cache needed)
        const contentLines = this.buildContentLines(innerW);
        const viewportHeight = this.viewportHeight();
        const maxScroll = Math.max(0, contentLines.length - viewportHeight);
        if (this.autoScroll) {
            this.scrollOffset = maxScroll;
        }
        const visibleStart = Math.min(this.scrollOffset, maxScroll);
        const visible = contentLines.slice(visibleStart, visibleStart + viewportHeight);
        for (let i = 0; i < viewportHeight; i++) {
            lines.push(row(visible[i] ?? ""));
        }
        // Footer
        lines.push(hrMid);
        const scrollPct = contentLines.length <= viewportHeight
            ? "100%"
            : `${Math.round(((visibleStart + viewportHeight) / contentLines.length) * 100)}%`;
        const footerLeft = th.fg("dim", `${contentLines.length} lines · ${scrollPct}`);
        const footerRight = th.fg("dim", "↑↓ scroll · PgUp/PgDn · Esc close");
        const footerGap = Math.max(1, innerW - visibleWidth(footerLeft) - visibleWidth(footerRight));
        lines.push(row(footerLeft + " ".repeat(footerGap) + footerRight));
        lines.push(hrBot);
        return lines;
    }
    invalidate() {
        /* no cached state to clear */
    }
    dispose() {
        this.closed = true;
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = undefined;
        }
    }
    // ---- Private ----
    viewportHeight() {
        return Math.max(MIN_VIEWPORT, this.tui.terminal.rows - CHROME_LINES);
    }
    buildContentLines(width) {
        if (width <= 0)
            return [];
        const th = this.theme;
        const messages = this.session.messages;
        const lines = [];
        if (messages.length === 0) {
            lines.push(th.fg("dim", "(waiting for first message...)"));
            return lines;
        }
        let needsSeparator = false;
        for (const msg of messages) {
            if (msg.role === "user") {
                const text = typeof msg.content === "string"
                    ? msg.content
                    : extractText(msg.content);
                if (!text.trim())
                    continue;
                if (needsSeparator)
                    lines.push(th.fg("dim", "───"));
                lines.push(th.fg("accent", "[User]"));
                for (const line of wrapTextWithAnsi(text.trim(), width)) {
                    lines.push(line);
                }
            }
            else if (msg.role === "assistant") {
                const textParts = [];
                const toolCalls = [];
                for (const c of msg.content) {
                    if (c.type === "text" && c.text)
                        textParts.push(c.text);
                    else if (c.type === "toolCall") {
                        toolCalls.push(c.name ?? c.toolName ?? "unknown");
                    }
                }
                if (needsSeparator)
                    lines.push(th.fg("dim", "───"));
                lines.push(th.bold("[Assistant]"));
                if (textParts.length > 0) {
                    for (const line of wrapTextWithAnsi(textParts.join("\n").trim(), width)) {
                        lines.push(line);
                    }
                }
                for (const name of toolCalls) {
                    lines.push(truncateToWidth(th.fg("muted", `  [Tool: ${name}]`), width));
                }
            }
            else if (msg.role === "toolResult") {
                const text = extractText(msg.content);
                const truncated = text.length > 500 ? text.slice(0, 500) + "... (truncated)" : text;
                if (!truncated.trim())
                    continue;
                if (needsSeparator)
                    lines.push(th.fg("dim", "───"));
                lines.push(th.fg("dim", "[Result]"));
                for (const line of wrapTextWithAnsi(truncated.trim(), width)) {
                    lines.push(th.fg("dim", line));
                }
            }
            else if (msg.role === "bashExecution") {
                const bash = msg;
                if (needsSeparator)
                    lines.push(th.fg("dim", "───"));
                lines.push(truncateToWidth(th.fg("muted", `  $ ${bash.command}`), width));
                if (bash.output?.trim()) {
                    const out = bash.output.length > 500
                        ? bash.output.slice(0, 500) + "... (truncated)"
                        : bash.output;
                    for (const line of wrapTextWithAnsi(out.trim(), width)) {
                        lines.push(th.fg("dim", line));
                    }
                }
            }
            else {
                continue;
            }
            needsSeparator = true;
        }
        // Streaming indicator for running agents
        if (this.record.status === "running" && this.activity) {
            const act = describeActivity(this.activity.activeTools, this.activity.responseText);
            lines.push("");
            lines.push(truncateToWidth(th.fg("accent", "▍ ") + th.fg("dim", act), width));
        }
        return lines.map((l) => truncateToWidth(l, width));
    }
}
//# sourceMappingURL=conversation-viewer.js.map