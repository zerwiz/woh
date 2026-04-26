/**
 * eelixir-view.ts — Eelixir Main TUI View
 *
 * Top-level TUI view for the Eelixir agent team.
 * Integrates agent manager, widget, and status display.
 */
import { EelixirAgentManager } from "./eelixir-manager";
// ========================== EELIXIR VIEW CLASS ==========================
export class EelixirView {
    manager;
    uiCtx;
    renderData;
    /**
     * Create Eelixir view
     */
    constructor(config) {
        this.manager = new EelixirAgentManager(config);
    }
    /**
     * Initialize view with UI context
     */
    init(uiCtx) {
        this.uiCtx = uiCtx;
        this.manager.initUI(uiCtx);
    }
    /**
     * Handle tool execution
     */
    async onToolExecutionStart(data, agentId) {
        // Debounce stop key handling if needed
        // (This would integrate with global key handler)
    }
    /**
     * Handle tool execution complete
     */
    async onToolExecutionEnd(data, agentId) {
        if (!this.uiCtx)
            return;
        const toolName = data.toolName || "tool";
        const result = data.toolResult?.response || data.content || "no response";
        const error = data.error;
        if (error) {
            // Handle error
            if (this.uiCtx.setStatus) {
                this.uiCtx.setStatus(agentId || "eelixir", `Error: ${error.message}`);
            }
            // Attempt recovery
            const nextAgent = this.manager.getNextAgent();
            if (nextAgent) {
                await this.startAgent(nextAgent, error.message);
            }
        }
        else {
            const agentId = agentId || this.getNextAgentId();
            // Complete agent with result
            if (this.manager.completeAgent && agentId) {
                await this.manager.completeAgent(agentId, result);
                // Trigger turn start for next operations
                if (this.manager.onTurnStart) {
                    this.manager.onTurnStart();
                }
            }
        }
    }
    /**
     * Handle switch intent (agent switching)
     */
    async onSwitchIntent(agentId, targetAgentId) {
        // Validate switch
        const agent = this.manager.agentList.get(agentId);
        if (!agent)
            return false;
        // Check permissions
        const targetAgent = this.manager.agentList.get(targetAgentId);
        if (!targetAgent || targetAgent.status !== "running") {
            return false;
        }
        // Perform switch
        await this.manager.stopAgent(agentId, "switched");
        this.manager.startAgent(targetAgentId);
        this.uiCtx?.setStatus("subagents", `Switched to: ${targetAgent.name}`);
        return true;
    }
    /**
     * Get next agent ID
     */
    getNextAgentId() {
        const agents = this.manager.getAgents();
        for (const agent of agents) {
            if (agent.status !== "stopped" && agent.status !== "error") {
                return agent.id;
            }
        }
        return agents[0]?.id || "";
    }
    /**
     * Start next available agent
     */
    async startNextAgent() {
        const nextAgent = this.manager.getNextAgent();
        if (nextAgent) {
            await this.manager.startAgent(nextAgent.id);
        }
    }
    /**
     * Start agent
     */
    async startAgent(agent, reason) {
        // Start agent if not already running
        if (agent.status !== "running") {
            agent.session = {
                state: reason,
                tokens: 0,
                startedAt: Date.now(),
            };
            agent.status = "running";
            agent.activeTools = new Map();
            this.uiCtx?.setStatus("subagents", `${agent.name} started: ${reason}`);
        }
    }
    /**
     * Handle agent complete
     */
    async onAgentComplete(agentId, result) {
        if (!this.uiCtx)
            return;
        const agent = this.manager.agentList.get(agentId);
        if (!agent)
            return;
        agent.status = "completed";
        agent.session = {
            state: result,
            tokens: agent.session?.tokens || 0,
            startedAt: agent.session?.startedAt || Date.now(),
        };
        // Clear status
        this.uiCtx.setStatus(agentId, undefined);
        // Start next agent if max concurrent allows
        const runningCount = this.manager.getRunningAgents().length;
        if (runningCount < this.manager.config.maxConcurrent) {
            await this.startNextAgent();
        }
        // Show completion message
        this.uiCtx.notify("subagents", `${agent.name} completed: ${result}`, 5000);
    }
    /**
     * Render view
     */
    render(tui) {
        if (!this.uiCtx) {
            return {
                render: () => [],
                invalidate: () => { },
            };
        }
        this.renderData = this.manager.render ? this.manager.render(tui) : undefined;
        return this.renderData;
    }
    /**
     * Get running agent count
     */
    getRunningAgentCount() {
        return this.manager.getRunningAgentCount();
    }
    /**
     * Get status text
     */
    getStatusText() {
        return this.manager.getStatusText();
    }
    /**
     * Get agents list
     */
    getAgents() {
        return this.manager.getAgents();
    }
    /**
     * Dispose
     */
    dispose() {
        this.manager.dispose();
        this.uiCtx = undefined;
        this.renderData = undefined;
    }
}
// ========================== EXPORT ==========================
export { EelixirAgentManager } from "./eelixir-manager";
export { EelixirWidget } from "./eelixir-widget";
export * from "./eelixir-agent-types";
//# sourceMappingURL=eelixir-view.js.map