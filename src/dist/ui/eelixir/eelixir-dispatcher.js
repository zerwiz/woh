/**
 * eelixir-dispatcher.ts — Eelixir Agent Team Dispatcher
 *
 * Provides intelligent task routing, load balancing, and agent coordination
 * for the Eelixir agent team system.
 *
 * Features:
 * - Intelligent task distribution
 * - Load balancing across agents
 * - Agent capability matching
 * - Task prioritization
 * - Request queuing
 */
import { ICONS } from "./eelixir-widget";
// ========================== UTILS ==========================
/**
 * Generate request ID
 */
function generateRequestId() {
    return `req-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 5)}`;
}
/**
 * Get load score for agent
 */
function getLoadScore(agent) {
    if (agent.status === "running") {
        const tools = agent.activeTools?.size || 0;
        return tools;
    }
    // Queued agents get 0, finished agents get -1
    return 0;
}
/**
 * Get capability score for agent
 */
function getCapabilityScore(agent) {
    const metadata = agent.metadata || {};
    const capability = metadata.capability || 50;
    const skills = metadata.skills || [];
    // Normalize capability to 0-1
    const normalized = capability / 100;
    // Add bonus for relevant skills
    let skillBonus = 0;
    if (skills.includes("code"))
        skillBonus += 0.1;
    if (skills.includes("research"))
        skillBonus += 0.1;
    if (skills.includes("debug"))
        skillBonus += 0.1;
    if (skills.includes("test"))
        skillBonus += 0.05;
    return normalized + skillBonus;
}
/**
 * Match task difficulty to agent capability
 */
function matchDifficulty(difficulty, agent) {
    const capability = agent.metadata?.capability || 50;
    switch (difficulty) {
        case "easy":
            return capability > 20;
        case "medium":
            return capability > 40;
        case "hard":
            return capability > 70;
        default:
            return true;
    }
}
/**
 * Get agent priority based on capabilities
 */
function getAgentPriority(agent) {
    const capability = agent.metadata?.capability || 50;
    const skills = agent.metadata?.skills || [];
    let priority = capability / 10;
    // Add for skills
    if (skills.includes("code"))
        priority += 2;
    if (skills.includes("research"))
        priority += 2;
    if (skills.includes("debug"))
        priority += 1;
    if (skills.includes("test"))
        priority += 1;
    return priority;
}
/**
 * Get best agent by capability
 */
function getBestCapability(agent) {
    const metadata = agent.metadata || {};
    let capability = metadata.capability || 50;
    return capability;
}
// ========================== TASK QUEUE ==========================
/**
 * TaskQueue manages task requests
 */
class TaskQueue {
    queue = [];
    processing = new Set();
    timeout;
    maxQueueSize;
    constructor(options) {
        this.timeout = options?.timeout || 60000;
        this.maxQueueSize = options?.queueSize || 100;
    }
    /**
     * Enqueue task
     */
    enqueue(context) {
        if (this.queue.length >= this.maxQueueSize) {
            return { success: false, position: 0 };
        }
        this.queue.push(context);
        const position = this.queue.length;
        return { success: true, position };
    }
    /**
     * Get next task to process
     */
    peekTask() {
        if (this.queue.length === 0) {
            return null;
        }
        return this.queue[0];
    }
    /**
     * Get task by request ID
     */
    getTask(requestId) {
        return this.queue.find((t) => t.requestId === requestId) || null;
    }
    /**
     * Dequeue task
     */
    dequeue() {
        if (this.queue.length === 0) {
            return null;
        }
        return this.queue.shift() || null;
    }
    /**
     * Get queue size
     */
    size() {
        return this.queue.length;
    }
    /**
     * Clear queue
     */
    clear() {
        this.queue = [];
    }
}
// ========================== DISPATCHER CLASS ==========================
/**
 * Dispatcher dispatches tasks to agents
 */
export class Dispatcher {
    agents;
    queue;
    options;
    state;
    requestCtxs = new Map();
    running = false;
    interval;
    constructor(agents, config) {
        this.agents = agents;
        this.queue = new TaskQueue({
            mode: "round_robin",
            loadThreshold: 0.8,
            timeout: config?.toolTimeout || 60000,
            maxConcurrent: config?.maxConcurrent || 1,
            queueSize: 100,
            loadWeight: 0.4,
            capabilityWeight: 0.6,
        });
        this.state = {
            pending: 0,
            active: 0,
            completed: 0,
            failed: 0,
            avgResponseMs: 0,
            total: 0,
            rpm: 0,
        };
        // Initialize
        this.initialize();
    }
    /**
     * Initialize dispatcher
     */
    initialize() {
        // Setup periodic stats update
        this.interval = setInterval(() => {
            this.updateStats();
        }, 1000);
        return { success: true, message: "Dispatcher initialized" };
    }
    /**
     * Update dispatcher stats
     */
    updateStats() {
        const now = Date.now();
        const lastRpm = this.state.rpm;
        const minDelta = 60000; // 1 minute
        if (now - lastRpm < minDelta) {
            return;
        }
        // Calculate RPM (mock - would track actual)
        this.state.rpm = lastRpm;
    }
    /**
     * Dispatch task to agent
     */
    async dispatch(task, options = {}) {
        if (!this.running) {
            return null;
        }
        const requestId = options.requestId || generateRequestId();
        const priority = options.priority || 5;
        const context = {
            task,
            options: this.options,
            priority,
            timestamp: Date.now(),
            requestId,
        };
        // Enqueue task
        const enqueueResult = this.queue.enqueue(context);
        if (!enqueueResult.success) {
            return {
                requestId,
                agentId: "",
                status: "queue_full",
                position: 0,
            };
        }
        // Find best agent
        const agentId = this.selectAgent(context);
        if (!agentId) {
            return {
                requestId,
                agentId: "",
                status: "no_agents",
                position: enqueueResult.position,
            };
        }
        const contextWithAgent = {
            ...context,
            agent: this.agents.get(agentId) || {},
            position: enqueueResult.position,
            dispatchedAt: Date.now(),
        };
        // Store context
        this.requestCtxs.set(requestId, contextWithAgent);
        this.state.pending++;
        this.state.active++;
        this.queue.dequeue(); // Remove from queue, it's now being processed
        return {
            requestId,
            agentId,
            status: "dispatched",
            position: enqueueResult.position,
        };
    }
    /**
     * Select best agent for task
     */
    selectAgent(context) {
        let bestAgent = null;
        let bestScore = -Infinity;
        let bestReason = "No agents available";
        // Filter eligible agents
        const eligibleAgents = Array.from(this.agents.values()).filter((agent) => {
            // Running agents are preferred
            if (agent.status === "running") {
                return true;
            }
            // Queued agents that can be promoted
            if (agent.status === "queued") {
                // Check if there are enough running agents
                const runningAgents = Array.from(this.agents.values()).filter((a) => a.status === "running").length;
                const maxConcurrent = this.options.maxConcurrent || 1;
                return runningAgents < maxConcurrent;
            }
            return false;
        });
        if (eligibleAgents.length === 0) {
            return null;
        }
        const mode = this.options?.mode || "round_robin";
        switch (mode) {
            case "round_robin":
                // Just pick first eligible
                bestAgent = eligibleAgents[0];
                break;
            case "capability":
                // Pick highest capability
                bestAgent = eligibleAgents.reduce((best, current) => {
                    const cap = getCapabilityScore(current);
                    return cap > (getCapabilityScore(best) || 0) ? current : best;
                }, eligibleAgents[0]);
                break;
            case "load":
                // Pick lowest load
                bestAgent = eligibleAgents.reduce((best, current) => {
                    const bestLoad = (getLoadScore(best) || 0);
                    const currentLoad = (getLoadScore(current) || 0);
                    return currentLoad < bestLoad ? current : best;
                }, eligibleAgents[0]);
                break;
            case "custom":
            default:
                // Use weighted score
                for (const agent of eligibleAgents) {
                    const loadScore = getLoadScore(agent);
                    const capScore = getCapabilityScore(agent);
                    const difficulty = /* Would parse from task */ "medium";
                    const loadWeight = this.options?.loadWeight || 0.5;
                    const capWeight = this.options?.capabilityWeight || 0.5;
                    const matchOk = matchDifficulty(difficulty, agent);
                    const score = (1 - loadWeight) * (capScore || 0) +
                        loadWeight * (loadScore === 0 ? 1 : 1 - loadScore);
                    if (score > bestScore) {
                        bestScore = score;
                        bestAgent = agent;
                        bestReason = `${difficulty}: loaded by ${agent.name}`;
                    }
                }
                break;
        }
        return bestAgent?.id || null;
    }
    /**
     * Complete request
     */
    onCompletion(requestId, result) {
        const context = this.requestCtxs.get(requestId);
        if (!context) {
            return;
        }
        // Mark as completed
        context.completedAt = Date.now();
        const duration = context.completedAt - context.timestamp;
        this.state.avgResponseMs = (this.state.avgResponseMs * (this.state.total - 1) + duration) / this.state.total;
        this.state.total++;
        this.state.active--;
        this.state.completed++;
        // Update state
        const now = Date.now();
        this.state.pending = this.queue.size();
        this.state.rpm = ((this.state.total / (now / 60000)) || 0).toFixed(1);
        this.requestCtxs.delete(requestId);
    }
    /**
     * Handle error
     */
    onError(requestId, error) {
        const context = this.requestCtxs.get(requestId);
        if (!context) {
            return;
        }
        context.error = error;
        context.completedAt = Date.now();
        this.state.active--;
        this.state.failed++;
        // Update stats
        const now = Date.now();
        this.state.pending = this.queue.size();
        this.state.rpm = ((this.state.total / Math.max(1, (now / 60000))) || 0).toFixed(1);
        this.requestCtxs.delete(requestId);
    }
    /**
     * Get dispatched request
     */
    getRequestContext(requestId) {
        return this.requestCtxs.get(requestId) || null;
    }
    /**
     * Get queue for widget
     */
    getQueue() {
        return {
            pending: this.queue.queue,
            active: Array.from(this.agents.values()).filter((a) => a.status === "running"),
        };
    }
    /**
     * Get statistics
     */
    getStats() {
        return { ...this.state };
    }
    /**
     * Get all request contexts
     */
    getAllRequestContexts() {
        return Array.from(this.requestCtxs.values());
    }
    /**
     * Get next available agent
     */
    getNextAgent() {
        return this.agents.values().find((agent) => agent.status === "running" || agent.status === "queued") || null;
    }
    /**
     * Get queue position for request
     */
    getPosition(requestId) {
        const pending = this.queue.queue.slice(this.queue.queue.findIndex((r) => r.requestId === requestId));
        return pending.length;
    }
    /**
     * Get dispatch mode
     */
    getMode() {
        return this.options?.mode || "round_robin";
    }
    /**
     * Set dispatch mode
     */
    setMode(mode) {
        this.options = { ...this.options, mode };
    }
    /**
     * Get queue size
     */
    getQueueSize() {
        return this.queue.size();
    }
    /**
     * Clear completed requests from stats
     */
    resetStats() {
        this.state.completed = 0;
        this.state.failed = 0;
        this.state.avgResponseMs = 0;
        this.state.total = 0;
    }
    /**
     * Start dispatcher
     */
    start() {
        this.running = true;
    }
    /**
     * Stop dispatcher
     */
    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = undefined;
        }
    }
    /**
     * Get dispatcher display
     */
    getDisplay() {
        const icon = ICONS.dispatch;
        const rpm = this.state.rpm;
        const total = this.state.completed + this.state.failed;
        return `${icon} Dispatcher (Mode: ${this.options?.mode || "round_robin"} | rpm: ${rpm} | total: ${total})\n` +
            `Queue: ${this.queue.queue.length} | Active: ${this.state.active}\n` +
            `Avg response: ${this.state.avgResponseMs.toFixed(2)}ms\n` +
            `Pending: ${this.state.pending} | Failed: ${this.state.failed}`;
    }
    /**
     * Cleanup
     */
    dispose() {
        this.stop();
    }
}
//# sourceMappingURL=eelixir-dispatcher.js.map