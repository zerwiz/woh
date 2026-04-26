/**
 * eelixir-session.ts — Eelixir Agent Team Session Management
 *
 * Provides session lifecycle management, tracking, export/import, and replay
 * functionality for the Eelixir agent team system.
 *
 * Features:
 * - Session lifecycle (create, run, complete, export, replay)
 * - Session history and listing
 * - Session metadata tracking
 * - Session export/import capabilities
 */
/** Session status for UI */
export const SESSION_STATUS_ICONS = {
    pending: "◦",
    running: "●",
    completed: "✓",
    error: "✗",
    aborted: "⊘",
    exported: "📁",
};
/** Session status colors */
export const SESSION_STATUS_COLORS = {
    pending: "muted",
    running: "accent",
    completed: "success",
    error: "error",
    aborted: "warning",
    exported: "dim",
};
/** Maximum history size */
const MAX_SESSION_HISTORY = 100;
/** Export file prefix */
export const EXPORT_FILE_PREFIX = "eelixir-session-";
/** Replay interval (ms) */
export const REPLAY_INTERVAL = 200;
// ========================== SESSION EXPORT UTILS ==========================
/**
 * Generate unique session ID
 */
export function generateSessionId() {
    const timestamp = Date.now().toString().replace(/\D/g, "");
    const random = Math.random().toString(36).substring(2).toUpperCase();
    return `session-${timestamp}-${random}`;
}
/**
 * Format export timestamp
 */
function formatExportTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString();
}
// ========================== SESSION MANAGER CLASS ==========================
/**
 * SessionModule manages session lifecycle
 */
export class SessionModule {
    sessions = new Map();
    activeSessions = new Set();
    history = [];
    config;
    expiryTimer = undefined;
    replayInterval = undefined;
    constructor(config) {
        if (config) {
            this.config = config;
        }
        this.initialize();
    }
    /**
     * Initialize session manager
     */
    initialize() {
        // Setup auto-expiry for inactive sessions
        this.expiryTimer = setInterval(() => {
            this.cleanupExpired();
        }, 5 * 60 * 1000); // Check every 5 minutes
        return { success: true };
    }
    /**
     * Create a new session
     */
    createSession(agentStates) {
        const sessionId = generateSessionId();
        const session = {
            id: sessionId,
            state: "running",
            status: "init",
            agents: agentStates.map((a) => a.id),
            turns: [],
            turnCount: 0,
            tokenCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            durationMs: 0,
            config: this.config || {
                teamName: "",
                maxConcurrent: 1,
                allowParallelTools: true,
                toolTimeout: 60000,
                verbose: false,
                displayMode: "compact",
            },
            agentStates: agentStates,
            metadata: {},
        };
        this.sessions.set(sessionId, session);
        this.activeSessions.add(sessionId);
        this.history.push(session);
        console.log(`Session created: ${sessionId}`);
        return session;
    }
    /**
     * Record a turn
     */
    recordTurn(sessionId, turn) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.turns.push(turn);
        session.turnCount++;
        session.tokenCount += turn.toolResult?._metadata?.inputTokens || 0;
        session.tokenCount += turn.toolResult?._metadata?.outputTokens || 0;
        session.updatedAt = Date.now();
        // Update duration
        const duration = Date.now() - (session.createdAt + (session.turns[0]?.timestamp || 0)) || Date.now() - session.createdAt;
        session.durationMs = duration;
        return session;
    }
    /**
     * Get or create session by ID
     */
    getSession(id) {
        return this.sessions.get(id) || null;
    }
    /**
     * Get all sessions
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * Get sessions by state
     */
    getSessionsByState(state) {
        return Array.from(this.sessions.values()).filter((s) => s.state === state);
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => this.activeSessions.has(s.id));
    }
    /**
     * Complete a session
     */
    completeSession(sessionId, finalMessage) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.state = "completed";
        session.status = finalMessage || "completed";
        session.updatedAt = Date.now();
        session.durationMs = Date.now() - session.createdAt;
        this.activeSessions.delete(sessionId);
        // Clean up agent states for this session
        session.agentStates = [];
        return session;
    }
    /**
     * Abort a session
     */
    abortSession(sessionId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.state = "aborted";
        session.status = reason;
        session.updatedAt = Date.now();
        this.activeSessions.delete(sessionId);
        return session;
    }
    /**
     * Set session error
     */
    setError(sessionId, error) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.state = "error";
        session.error = error;
        session.status = `error: ${error}`;
        session.updatedAt = Date.now();
        this.activeSessions.delete(sessionId);
        return session;
    }
    /**
     * Start a session from pending state
     */
    startSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.state = "running";
        session.status = "started";
        session.updatedAt = Date.now();
        this.activeSessions.add(sessionId);
        return session;
    }
    /**
     * Stop a running session
     */
    stopSession(sessionId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.state = "aborted";
        session.status = reason;
        session.updatedAt = Date.now();
        // Calculate duration
        const duration = Date.now() - session.createdAt;
        session.durationMs = duration;
        this.activeSessions.delete(sessionId);
        return session;
    }
    /**
     * Export session to object/string
     */
    exportSession(sessionId, format = "json") {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        const exportData = {
            ...session,
            turns: session.turns.map((t, i) => ({
                ...t,
                toolData: t.toolData ? {
                    toolName: t.toolData?.toolName,
                    data: t.toolData?.data,
                    switchIntent: t.toolData?.switchIntent,
                    error: t.toolData?.error,
                } : undefined,
                toolResult: t.toolResult,
            })),
        };
        if (format === "json") {
            return JSON.stringify(exportData, null, 2);
        }
        // CSV format
        const headers = ["turn", "timestamp", "agent_id", "tool", "status"];
        const rows = session.turns.map((t) => [
            t.number,
            new Date(t.timestamp).toISOString(),
            t.agentId,
            t.toolName || "",
            t.success ? "success" : "error",
        ]);
        return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    }
    /**
     * Import session from string
     */
    importSession(data) {
        try {
            const imported = JSON.parse(data);
            // Create new session from imported data
            const sessionId = imported.id || generateSessionId();
            const newSession = {
                id: sessionId,
                state: "completed",
                status: imported.status || "imported",
                agents: imported.agents || [],
                turns: [],
                turnCount: imported.turnCount || 0,
                tokenCount: imported.tokenCount || 0,
                createdAt: imported.createdAt || Date.now(),
                updatedAt: Date.now(),
                durationMs: imported.durationMs || 0,
                config: imported.config || (this.config || {}),
                agentStates: [],
                metadata: imported.metadata || {},
            };
            // Reconstruct turns if present
            if (imported.turns) {
                newSession.turns = imported.turns.map((t, i) => ({
                    number: i + 1,
                    timestamp: t.timestamp || Date.now(),
                    agentId: t.agentId || "",
                    toolName: t.toolName,
                    toolData: t.toolData,
                    toolResult: t.toolResult,
                    response: t.response,
                    success: t.success,
                }));
            }
            this.sessions.set(sessionId, newSession);
            this.history.push(newSession);
            return newSession;
        }
        catch (error) {
            console.error("Session import failed:", error);
            return null;
        }
    }
    /**
     * Get turn at index (for replay)
     */
    getTurn(sessionId, index) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        const turn = session.turns[index];
        if (!turn) {
            return null;
        }
        return turn;
    }
    /**
     * Get turns for replay
     */
    getReplayTurns(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return [];
        }
        return session.turns;
    }
    /**
     * Cleanup expired sessions
     */
    cleanupExpired() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [id, session] of this.sessions.entries()) {
            if (session.state === "completed") {
                const age = now - session.createdAt;
                // Archive sessions older than 1 hour (configurable)
                if (age > 60 * 60 * 1000) {
                    this.sessions.delete(id);
                    this.activeSessions.delete(id);
                    expiredCount++;
                }
            }
        }
        console.log(`Cleared ${expiredCount} expired sessions`);
    }
    session = this.sessions.get(sessionId);
    if(, session) {
        return null;
    }
    icon = SESSION_STATUS_ICONS[session.state];
    color = SESSION_STATUS_COLORS[session.state];
}
return {
    session,
    statusDisplay: `${icon} ${session.status}`,
    statusColor: color,
    duration: formatDuration(session.createdAt),
    tokens: formatTokens(session.tokenCount),
    turns: `${session.turnCount}`,
};
;
/**
 * Get session list for selector
 */
getSessionList();
{
    id: string;
    state: SessionState;
    status: string;
    createdAt: number;
    duration: number;
}
[];
{
    const sessions = this.getAllSessions();
    const filtered = sessions.filter((s) => s.state !== "pending");
    return filtered.map((s) => ({
        id: s.id,
        state: s.state,
        status: s.status,
        createdAt: s.createdAt,
        duration: s.durationMs,
    }));
}
/**
 * Get session summary
 */
getSessionSummary(sessionId, string);
string;
{
    const session = this.sessions.get(sessionId);
    if (!session) {
        return "Session not found";
    }
    const icon = SESSION_STATUS_ICONS[session.state];
    const status = [session.state.toUpperCase(), "(" + session.status + ")"].join(" ");
    return `${icon} Session: ${session.state.charAt(0).toUpperCase() + session.state.slice(1)}\n` +
        `Status: ${status}\n` +
        `Turns: ${session.turnCount} | Tokens: ${session.tokenCount}\n` +
        `Duration: ${formatDuration(session.createdAt)}\n` +
        `Agents: ${session.agents.join(", ")}\n` +
        `Created: ${new Date(session.createdAt).toString()}`;
}
/**
 * Get active session count
 */
getActiveCount();
number;
{
    return this.activeSessions.size;
}
/**
 * Total token count
 */
getTotalTokens();
number;
{
    return Array.from(this.sessions.values())
        .reduce((sum, s) => sum + s.tokenCount, 0);
}
/**
 * Total turn count
 */
getTotalTurns();
number;
{
    return Array.from(this.sessions.values())
        .reduce((sum, s) => sum + s.turnCount, 0);
}
/**
 * Cleanup
 */
dispose();
void {
    : .expiryTimer
};
{
    clearInterval(this.expiryTimer);
    this.expiryTimer = undefined;
}
if (this.replayInterval) {
    clearInterval(this.replayInterval);
    this.replayInterval = undefined;
}
this.sessions.clear();
this.history = [];
this.activeSessions.clear();
// ========================== EXPORTED CONSTANTS ==========================
/** Session module compliance */
export const SESSION_COMPLIANCE = {
    version: "1.0.0",
    standards: ["PI-SESSION-001"],
    displayName: "Eelixir Session Module",
    features: [
        "Session lifecycle",
        "Session export/import",
        "Session history",
        "Session replay",
    ],
};
//# sourceMappingURL=eelixir-session.js.map