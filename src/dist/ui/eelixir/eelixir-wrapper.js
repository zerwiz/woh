/**
 * eelixir-wrapper.ts — Eelixir Manager Wrapper
 *
 * Provides a clean API for creating and managing Eelixir agents.
 * Wraps EelixirAgentManager with additional conveniences.
 */
import { EelixirAgentManager } from "./eelixir-manager";
/**
 * EelixirManagerWrapper provides a higher-level API
 */
export class EelixirManagerWrapper {
    manager;
    initialized = false;
    /**
     * Create wrapped manager
     */
    constructor(config) {
        this.manager = new EelixirAgentManager(config);
    }
    /**
     * Init with UI context
     */
    initUI(ctx) {
        this.manager.initUI(ctx);
        this.initialized = true;
    }
    /**
     * Execute a tool on the current active agent
     */
    async executeTool(toolName, result) {
        const agent = this.manager.getAgents()[0];
        if (!agent || agent.status !== "running") {
            return false;
        }
        await this.manager.executeTool(agent.id, toolName, result);
        return true;
    }
    /**
     * Get current active agent
     */
    getActiveAgent() {
        return this.manager.getAgents().find((a) => a.status === "running");
    }
    /**
     * Switch to a specific agent
     */
    async switchAgent(agentId) {
        const currentActive = this.getActiveAgent();
        const targetAgent = this.manager.getAgents().find((a) => a.id === agentId);
        if (!currentActive || !targetAgent) {
            return false;
        }
        // Stop current agent
        await this.manager.stopAgent(currentActive.id);
        // Start target agent
        const started = await this.manager.startAgent(agentId);
        return started;
    }
    /**
     * Queue a task (sets agent to queued status)
     */
    async queueAgent(agentName) {
        const queuedAgents = this.manager.getAgents().filter((a) => a.status === "queued");
        // Find or create agent with this name
        const agent = queuedAgents.find((a) => a.name === agentName);
        if (!agent) {
            return false;
        }
        // Start agent if queue is empty max
        const queuedCount = queuedAgents.length;
        if (queuedCount === 0) {
            this.manager.startAgent(agent.id);
        }
        return true;
    }
    /**
     * Get all queued agents
     */
    getQueuedAgents() {
        return this.manager.getQueuedAgents();
    }
    /**
     * Get all running agents
     */
    getRunningAgents() {
        return this.manager.getRunningAgents();
    }
    /**
     * Get team state
     */
    getTeamState() {
        return this.manager.getTeamState();
    }
    /**
     * Get running agent count
     */
    getRunningCount() {
        return this.manager.getRunningAgentCount();
    }
    /**
     * Get total agent count
     */
    getCount() {
        return this.manager.getAgentCount();
    }
    /**
     * Check if any agent is running
     */
    hasActiveAgent() {
        return this.getRunningCount() > 0;
    }
    /**
     * Get status text
     */
    getStatusText() {
        return this.manager.getStatusText();
    }
    /**
     * Register key handler (integrated with global stop key)
     */
    registerKeyHandler() {
        // Integrated with manager's key handler
        if (this.manager.stopKeyConfig) {
            this.manager.registerStopKey?.();
        }
    }
    /**
     * Handle error
     */
    async handleError(agentId, error) {
        await this.manager.handleAgentError(this.manager.getAgents().find((a) => a.id === agentId) || {}, error);
    }
    /**
     * Complete agent
     */
    async completeAgent(agentId, result) {
        await this.manager.completeAgent(agentId, result);
    }
    /**
     * Stop agent
     */
    async stopAgent(agentId) {
        await this.manager.stopAgent(agentId);
    }
    /**
     * On agent start callback
     */
    onAgentStart(agent) {
        if (this.initialized && this.manager.uiCtx) {
            this.manager.uiCtx.setStatus(agent.id, `${agent.name} running`);
        }
    }
    /**
     * On agent complete callback
     */
    onAgentComplete(agent) {
        if (this.initialized && this.manager.uiCtx) {
            this.manager.uiCtx.setStatus(agent.id, undefined);
        }
    }
    /**
     * On turn start callback
     */
    onTurnStart() {
        this.manager.onTurnStart?.();
    }
    /**
     * Force widget update
     */
    requestRender() {
        if (this.manager.widget) {
            this.manager.widget.forceRefresh?.();
        }
    }
    /**
     * Dispose
     */
    dispose() {
        this.manager.dispose();
    }
    /**
     * Get manager internals (for advanced usage)
     */
    getManager() {
        return this.manager;
    }
}
//# sourceMappingURL=eelixir-wrapper.js.map