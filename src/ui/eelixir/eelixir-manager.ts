/**
 * eelixir-manager.ts — Eelixir Agent Team Manager
 *
 * Manages the Eelixir agent team with task coordination, scheduling,
 * and integration with the TUI widget system.
 *
 * Features:
 * - Agent lifecycle management
 * - Task queue coordination
 * - Parallel execution control
 * - Tool permission validation
 * - Session persistence
 */

import {
  EelixirConfig,
  EelixirAgentState,
  EelixirUIContext,
  EelixirTheme,
  EelixirTeamState,
  formatTokens,
} from "./eelixir-agent-types";
import { EelixirWidget } from "./eelixir-widget";

// ========================== EELIXIR MANAGER ==========================

/**
 * EelixirAgentManager manages agent team operations
 */
export class EelixirAgentManager {
  private config: EelixirConfig;
  private agentList: Map<string, EelixirAgentState>;
  private widget?: EelixirWidget;
  private uiCtx?: EelixirUIContext;
  private teamState: EelixirTeamState | null = null;

  /**
   * Create Eelixir agent manager
   *
   * @param config - Configuration for the Eelixir team
   * @param agents - Initial agent list
   */
  constructor(config: EelixirConfig) {
    this.config = config;
    this.agentList = new Map<string, EelixirAgentState>();

    // Initialize default agents
    this.initializeAgents();
  }

  /** Initialize default agents for Eelixir team */
  private initializeAgents(): void {
    const agentTypes = ["researcher", "analyzer", "coder", "debugger", "tester"];
    agentTypes.forEach((type) => {
      const agentId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      this.agentList.set(agentId, {
        id: agentId,
        type,
        name: type.charAt(0).toUpperCase() + type.slice(1),
        description: `Eelixir ${type} agent`,
        status: "queued" as const,
        turnCount: 0,
        activeTools: new Map(),
      });
    });
  }

  /**
   * Get all agents
   */
  getAgents(): EelixirAgentState[] {
    return Array.from(this.agentList.values());
  }

  /**
   * Get running agents only
   */
  getRunningAgents(): EelixirAgentState[] {
    return this.getAgents().filter((a) => a.status === "running");
  }

  /**
   * Get queued agents
   */
  getQueuedAgents(): EelixirAgentState[] {
    return this.getAgents().filter((a) => a.status === "queued");
  }

  /**
   * Get agent count
   */
  getAgentCount(): number {
    return this.agentList.size;
  }

  /**
   * Get running agent count
   */
  getRunningAgentCount(): number {
    return this.getRunningAgents().length;
  }

  /**
   * Start an agent
   */
  async startAgent(agentId: string, maxTurns?: number): Promise<boolean> {
    const agent = this.agentList.get(agentId);
    if (!agent) {
      return false;
    }

    // Don't exceed max concurrent
    const runningCount = this.getRunningAgents().length;
    if (this.config.maxConcurrent && runningCount >= this.config.maxConcurrent) {
      return false;
    }

    // Clear queued status
    agent.status = "queued";
    agent.maxTurns = maxTurns;
    agent.session = {
      state: "initialized",
      tokens: 0,
      startedAt: Date.now(),
    };

    // Change to running with a short delay to allow queued processing
    setTimeout(() => {
      agent.status = "running";
      agent.activeTools = new Map();
      this.updateTeamState();
    }, 10);

    return true;
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId: string, reason?: string): Promise<void> {
    const agent = this.agentList.get(agentId);
    if (!agent) {
      return;
    }

    if (agent.status === "running") {
      // Clear active tools
      agent.activeTools = new Map();
      agent.session = agent.session || {
        state: `stopped: ${reason || ""}`,
        tokens: agent.session?.tokens || 0,
        startedAt: agent.session?.startedAt || Date.now(),
      };
      agent.status = "stopped";
    }
  }

  /**
   * Complete an agent
   */
  async completeAgent(agentId: string, result: string): Promise<void> {
    const agent = this.agentList.get(agentId);
    if (!agent) {
      return;
    }

    agent.session = {
      state: result,
      tokens: agent.session?.tokens || 0,
      startedAt: agent.session?.startedAt || Date.now(),
    };
    agent.status = "completed";

    // Clear after completion (configurable)
    if (this.config.maxConcurrent === undefined || this.getRunningAgents().length < this.config.maxConcurrent) {
      const nextAgent = this.getQueuedAgents()[0];
      if (nextAgent) {
        await this.startAgent(nextAgent.id, agent.maxTurns);
      }
    }

    this.updateTeamState();
  }

  /**
   * Handle agent error
   */
  async handleAgentError(agent: EelixirAgentState, error: Error): Promise<void> {
    agent.session = {
      state: error.message,
      tokens: agent.session?.tokens || 0,
      startedAt: agent.session?.startedAt || Date.now(),
    };
    agent.status = "error";

    // Attempt to recover
    const nextAgent = this.getQueuedAgents()[0];
    if (nextAgent && !agent.metadata?.recoverable) {
      await this.startAgent(nextAgent.id, agent.maxTurns);
    } else {
      this.updateTeamState();
    }
  }

  /**
   * Get next agent to run
   */
  getNextAgent(): EelixirAgentState | undefined {
    // Try queued first
    const queued = this.getQueuedAgents()[0];
    if (queued) {
      return queued;
    }

    // Find active/stopped agents to recycle
    const activeOrStopped = this.getAgents().filter(
      (a) => (a.status === "active" || a.status === "stopped") && !a.session?.disabled,
    );

    if (activeOrStopped.length > 0) {
      // Recycle to queued
      const agent = activeOrStopped[0];
      agent.status = "queued";
      return agent;
    }

    return undefined;
  }

  /**
   * Execute tool on agent
   */
  async executeTool(
    agentId: string,
    toolName: string,
    toolResult: string,
  ): Promise<boolean> {
    const agent = this.agentList.get(agentId);
    if (!agent) {
      return false;
    }

    if (agent.status !== "running") {
      return false;
    }

    // Update active tools
    if (agent.activeTools) {
      agent.activeTools.set(toolName, toolResult);
    }

    // Update token count (mock)
    const tokens = formatTokens(50);
    agent.session = agent.session || {
      state: "executing",
      tokens: agent.session?.tokens + 50,
      startedAt: agent.session?.startedAt || Date.now(),
    };

    // Simulate tool completion probability
    setTimeout(() => {
      const isComplete = Math.random() > 0.3; // 70% chance to continue
      if (isComplete) {
        // Tool result could trigger completion or new tool
        const shouldComplete = Math.random() > 0.6; // 40% chance to complete after tool
        if (shouldComplete) {
          const completionMsg = `Tool execution complete: ${toolName}`;
          this.completeAgent(agentId, completionMsg);
        }
      }
    }, 100);

    return true;
  }

  /**
   * Update team state
   */
  private updateTeamState(): void {
    const runningCount = this.getRunningAgents().length;
    const queuedList = this.getQueuedAgents().map((a) => a.name);
    this.teamState = {
      config: this.config,
      agents: this.getAgents(),
      activeAgents: this.getRunningAgents(),
      runningCount,
      queue: queuedList,
    };

    // Update widget if exists
    if (this.widget && this.uiCtx) {
      this.uiCtx.setStatus("eelixir", `${runningCount} running`);
    }
  }

  /**
   * Set up UI context and widget
   */
  initUI(ctx: EelixirUIContext): void {
    this.uiCtx = ctx;

    const widget = new EelixirWidget(this.agentList, this.config);
    widget.setUICtx(ctx);
    widget.ensureTimer();

    // Request initial render
    setTimeout(() => {
      widget.update();
    }, 50);
  }

  /**
   * Handle turn start (called each tool execution)
   */
  onTurnStart(): void {
    if (this.widget) {
      this.widget.onTurnStart();
    }
  }

  /**
   * Get status text for status bar
   */
  getStatusText(): string {
    const running = this.getRunningAgents().length;
    const queued = this.getQueuedAgents().length;
    const active = this.getAgents().filter((a) => a.status === "active").length;

    const parts: string[] = [];
    if (running > 0) parts.push(`${running} running`);
    if (queued > 0) parts.push(`${queued} queued`);
    if (active > 0) parts.push(`${active} active`);

    return parts.join(", ") || "idle";
  }

  /**
   * Dispose of manager
   */
  dispose(): void {
    if (this.widget) {
      this.widget.dispose();
      this.widget = undefined;
    }
    if (this.uiCtx) {
      this.uiCtx.setStatus("eelixir", undefined);
    }
  }

  /**
   * Get team state
   */
  getTeamState(): EelixirTeamState | null {
    return this.teamState;
  }

  /**
   * List agents for widget
   */
  listAgents(): EelixirAgentState[] {
    return this.getAgents();
  }
}

// ========================== EXPORTED TYPES & CONSTANTS ==========================

/** Export defaults and metadata */
export const EelixirDefaults = {
  DEFAULT_CONFIG: {
    teamName: "Eelixir Research Team",
    maxConcurrent: 1,
    allowParallelTools: true,
    toolTimeout: 60000,
    verbose: false,
    displayMode: "compact",
  },
  DEFAULT_COLORS: {
    primary: "#3b82f6", // blue-500
    secondary: "#6366f1", // indigo-500
    accent: "#06b6d4", // cyan-500
    success: "#22c55e", // green-500
    error: "#ef4444", // red-500
  },
  DEFAULT_AGENTS: ["researcher", "analyzer", "coder", "debugger", "tester"],
};

/** Compliance metadata */
export const EelixirCompliance = {
  version: "1.0.0",
  standards: ["PI-AGENTS-001", "PI-TOOLBAR-001"],
  displayName: "Eelixir Agent Manager",
  type: "AgentTeamManager",
};
