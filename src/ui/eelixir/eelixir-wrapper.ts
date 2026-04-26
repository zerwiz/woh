/**
 * eelixir-wrapper.ts — Eelixir Manager Wrapper
 *
 * Provides a clean API for creating and managing Eelixir agents.
 * Wraps EelixirAgentManager with additional conveniences.
 */

import { EelixirConfig, EelixirAgentState, EelixirUIContext } from "./eelixir-agent-types";
import { EelixirAgentManager } from "./eelixir-manager";

/**
 * EelixirManagerWrapper provides a higher-level API
 */
export class EelixirManagerWrapper {
  private manager: EelixirAgentManager;
  private initialized: boolean = false;

  /**
   * Create wrapped manager
   */
  constructor(config: EelixirConfig) {
    this.manager = new EelixirAgentManager(config);
  }

  /**
   * Init with UI context
   */
  initUI(ctx: EelixirUIContext): void {
    this.manager.initUI(ctx);
    this.initialized = true;
  }

  /**
   * Execute a tool on the current active agent
   */
  async executeTool(
    toolName: string,
    result: string,
  ): Promise<boolean> {
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
  getActiveAgent(): EelixirAgentState | undefined {
    return this.manager.getAgents().find((a) => a.status === "running");
  }

  /**
   * Switch to a specific agent
   */
  async switchAgent(agentId: string): Promise<boolean> {
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
  async queueAgent(agentName: string): Promise<boolean> {
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
  getQueuedAgents(): EelixirAgentState[] {
    return this.manager.getQueuedAgents();
  }

  /**
   * Get all running agents
   */
  getRunningAgents(): EelixirAgentState[] {
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
  getRunningCount(): number {
    return this.manager.getRunningAgentCount();
  }

  /**
   * Get total agent count
   */
  getCount(): number {
    return this.manager.getAgentCount();
  }

  /**
   * Check if any agent is running
   */
  hasActiveAgent(): boolean {
    return this.getRunningCount() > 0;
  }

  /**
   * Get status text
   */
  getStatusText(): string {
    return this.manager.getStatusText();
  }

  /**
   * Register key handler (integrated with global stop key)
   */
  registerKeyHandler(): void {
    // Integrated with manager's key handler
    if (this.manager.stopKeyConfig) {
      this.manager.registerStopKey?.();
    }
  }

  /**
   * Handle error
   */
  async handleError(agentId: string, error: Error): Promise<void> {
    await this.manager.handleAgentError(
      this.manager.getAgents().find((a) => a.id === agentId) || {},
      error,
    );
  }

  /**
   * Complete agent
   */
  async completeAgent(agentId: string, result: string): Promise<void> {
    await this.manager.completeAgent(agentId, result);
  }

  /**
   * Stop agent
   */
  async stopAgent(agentId: string): Promise<void> {
    await this.manager.stopAgent(agentId);
  }

  /**
   * On agent start callback
   */
  onAgentStart(agent: EelixirAgentState): void {
    if (this.initialized && this.manager.uiCtx) {
      this.manager.uiCtx.setStatus(agent.id, `${agent.name} running`);
    }
  }

  /**
   * On agent complete callback
   */
  onAgentComplete(agent: EelixirAgentState): void {
    if (this.initialized && this.manager.uiCtx) {
      this.manager.uiCtx.setStatus(agent.id, undefined);
    }
  }

  /**
   * On turn start callback
   */
  onTurnStart(): void {
    this.manager.onTurnStart?.();
  }

  /**
   * Force widget update
   */
  requestRender(): void {
    if (this.manager.widget) {
      this.manager.widget.forceRefresh?.();
    }
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.manager.dispose();
  }

  /**
   * Get manager internals (for advanced usage)
   */
  getManager(): EelixirAgentManager {
    return this.manager;
  }
}
