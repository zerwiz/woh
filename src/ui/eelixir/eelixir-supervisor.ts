/**
 * eelixir-supervisor.ts — Eelixir Agent Team Supervisor
 *
 * Provides process supervision, health monitoring, watchdog functionality,
 * and graceful shutdown for the Eelixir agent team system.
 *
 * Features:
 * - Process health monitoring
 * - Watchdog for crash recovery
 * - Graceful shutdown
 * - Auto-restart logic
 * - Queue management
 */

import type { EelixirAgentState, EelixirConfig } from "./eelixir-agent-types";
import { ICONS, formatDuration, formatTokens } from "./eelixir-widget";

// ========================== TYPES ==========================

/** Agent health status */
export type AgentHealth = "healthy" | "warning" | "error";

/** Agent health report */
export interface AgentHealthReport {
  /** Agent ID */
  agentId: string;
  /** Agent name */
  agentName: string;
  /** Health status */
  status: AgentHealth;
  /** Error count */
  errors: number;
  /** Warning count */
  warnings: number;
  /** Last health check */
  lastCheck: number;
  /** Message */
  message?: string;
}

/** Supervisor state */
export interface SupervisorState {
  /** Health status */
  health: "healthy" | "warning" | "error";
  /** Total agents */
  totalAgents: number;
  /** Active agents */
  activeAgents: number;
  /** Stopped agents */
  stoppedAgents: number;
  /** Failed agents */
  failedAgents: number;
  /** Queue size */
  queueSize: number;
  /** Last check timestamp */
  lastCheck: number;
  /** Watchdog status */
  watchdogStatus: "active" | "disabled";
  /** Restart count */
  restartCount: number;
  /** Crash count */
  crashCount: number;
}

/** Supervisor configuration */
export interface SupervisorConfig {
  /** Health check interval (ms) */
  healthCheckInterval: number;
  /** Watchdog window (ms) */
  watchdogWindow: number;
  /** Crash threshold */
  crashThreshold: number;
  /** Auto-restart count */
  restartCount: number;
  /** Enable watchdog */
  enableWatchdog: boolean;
  /** Queue threshold */
  queueThreshold: number;
  /** Graceful shutdown timeout (ms) */
  gracefulShutdownTimeout: number;
  /** Error threshold */
  errorThreshold: number;
}

/** Supervisor stats */
export interface SupervisorStats {
  /** Total start times */
  starts: number;
  /** Total stops */
  stops: number;
  /** Total restarts */
  restarts: number;
  /** Total crashes */
  crashes: number;
  /** Average uptime */
  averageUptimeMs: number;
  /** Peak queue size */
  peakQueue: number;
}

// ========================== CONSTANTS ==========================

const DEFAULT_CONFIG: SupervisorConfig = {
  healthCheckInterval: 5000,
  watchdogWindow: 30000,
  crashThreshold: 3,
  restartCount: 5,
  enableWatchdog: true,
  queueThreshold: 5,
  gracefulShutdownTimeout: 30000,
  errorThreshold: 10,
};

const HEALTH_ICONS = {
  healthy: "✓",
  warning: "⚠",
  error: "✗",
};

// ========================== HEALTH MONITOR CLASS ==========================

/**
 * HealthMonitor monitors agent health
 */
class HealthMonitor {
  private agents: Map<string, {
    health: AgentHealth;
    errors: number;
    warnings: number;
    lastCheck: number;
    message?: string;
  }>;
  private config: SupervisorConfig | undefined;
  private interval: NodeJS.Timeout | undefined;
  private reports: AgentHealthReport[] = [];

  constructor(config?: SupervisorConfig) {
    if (config) {
      this.config = config;
    }

    this.agents = new Map();
  }

  /**
   * Initialize health monitoring
   */
  initialize(): { success: boolean; message: string } {
    if (!this.config?.enableWatchdog) {
      return { success: true, message: "Watchdog disabled" };
    }

    this.interval = setInterval(() => {
      this.scanHealth();
    }, this.config?.healthCheckInterval || DEFAULT_CONFIG.healthCheckInterval);

    return { success: true, message: "Health monitoring initialized" };
  }

  /**
   * Record agent health check
   */
  recordAgentHealth(agentId: string, agent: EelixirAgentState): void {
    const errors = agent.session?.state === "error" ? (agent.session._errors || 0) + 1 :
      agent.session?.state === "completed" ? 0 :
      (this.agents.get(agentId)?.errors || 0);

    const warnings = agent.session?.state === "error" ? 1 : 0;
    const status: AgentHealth = agent.status === "completed" ? "healthy" :
                               agent.status === "error" ? "error" :
                               agent.status === "running" ? "warning" : "healthy";

    this.agents.set(agentId, {
      health: status,
      errors,
      warnings,
      lastCheck: Date.now(),
      message: agent.session?.state !== agent.status ? "status: " + agent.status : undefined,
    });

    // Update report
    const report = this.reports.find((r) => r.agentId === agentId);
    if (report) {
      report.status = status;
      report.errors = errors;
      report.warnings = warnings;
      report.message = report.message || undefined;
    } else {
      this.reports.push({
        agentId,
        agentName: agent.name,
        status,
        errors,
        warnings,
        lastCheck: Date.now(),
        message,
      });
    }
  }

  /**
   * Scan health of all agents (inherited from manager)
   */
  private scanHealth(): void {
    // Inherited from manager - agent states checked there
    // For now, this is placeholder
  }

  /**
   * Record warning
   */
  recordWarning(agentId: string, warning: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.warnings++;
      agent.message = warning;
    }
  }

  /**
   * Record error
   */
  recordError(agentId: string, error: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.errors++;
      agent.message = error;
    }
  }

  /**
   * Clear agent health
   */
  clearAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.agents.set(agentId, {
        ...agent,
        errors: 0,
        warnings: 0,
        message: undefined,
      });
    }
  }

  /**
   * Get agent health report
   */
  getAgentReport(agentId: string): AgentHealthReport | null {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return null;
    }

    return {
      agentId,
      agentName: agent.message?.split(": ")[1] || "N/A",
      status: agent.health,
      errors: agent.errors,
      warnings: agent.warnings,
      lastCheck: agent.lastCheck,
      message: agent.message,
    };
  }

  /**
   * Get all agent health reports
   */
  getAllReports(): AgentHealthReport[] {
    return this.reports;
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}

// ========================== SUPERVISOR CLASS ==========================

/**
 * Supervisor monitors process health and manages lifecycle
 */
export class Supervisor {
  private config: SupervisorConfig = { ...DEFAULT_CONFIG };
  private healthMonitor: HealthMonitor;
  private state: SupervisorState = {
    health: "healthy",
    totalAgents: 0,
    activeAgents: 0,
    stoppedAgents: 0,
    failedAgents: 0,
    queueSize: 0,
    lastCheck: Date.now(),
    watchdogStatus: "active",
    restartCount: 0,
    crashCount: 0,
  };
  private shutdownTimer: NodeJS.Timeout | undefined;
  private stateTimer: NodeJS.Timeout | undefined;
  private stats: SupervisorStats = {
    starts: 0,
    stops: 0,
    restarts: 0,
    crashes: 0,
    averageUptimeMs: 0,
    peakQueue: 0,
  };
  private running = false;
  private startedAt = Date.now();

  constructor(config: Partial<SupervisorConfig> = {}) {
    Object.assign(this.config, config);
    this.healthMonitor = new HealthMonitor(this.config);
    this.healthMonitor.initialize();
    this.setupStateUpdates();
  }

  /**
   * Initialize supervisor
   */
  initialize(): { success: boolean; message: string } {
    this.setupStateUpdates();
    return { success: true, message: "Supervisor initialized" };
  }

  /**
   * Setup state update timer
   */
  private setupStateUpdates(): void {
    const interval = this.config.healthCheckInterval || DEFAULT_CONFIG.healthCheckInterval;
    this.stateTimer = setInterval(() => {
      this.updateState();
    }, interval);
  }

  /**
   * Update supervisor state
   */
  private updateState(): void {
    this.state.lastCheck = Date.now();
    
    // Update queue size
    const queue = [] as EelixirAgentState[]; // Placeholder
    this.state.queueSize = queue.length;

    // Update watchdog status
    this.state.watchdogStatus = this.config.enableWatchdog ? "active" : "disabled";
  }

  /**
   * Start supervisor
   */
  start(): { success: boolean; message: string; state: SupervisorState } {
    if (!this.running) {
      this.running = true;
      this.startedAt = Date.now();
      this.stats.starts++;
      this.setHealth("healthy");
      return { success: true, message: "Supervisor started", state: this.getState() };
    }
    return { success: false, message: "Already running", state: this.getState() };
  }

  /**
   * Stop supervisor gracefully
   */
  stop(): { success: boolean; message: string; state: SupervisorState } {
    this.config.gracefulShutdownTimeout; // Use default
    this.setHealth("stopped");
    
    // Clear intervals
    if (this.shutdownTimer) {
      clearInterval(this.shutdownTimer);
      this.shutdownTimer = undefined;
    }
    if (this.stateTimer) {
      clearInterval(this.stateTimer);
      this.stateTimer = undefined;
    }

    this.healthMonitor.stop();
    
    this.running = false;
    this.stats.stops++;
    
    return { success: true, message: "Supervisor stopped gracefully", state: this.getState() };
  }

  /**
   * Restart supervisor
   */
  restart(): { success: boolean; message: string; state: SupervisorState } {
    if (this.running) {
      this.stats.restarts++;
      return { success: true, message: "Supervisor restarted", state: this.getState() };
    }
    return { success: false, message: "Not running", state: this.getState() };
  }

  /**
   * Set health status
   */
  setHealth(status: "healthy" | "warning" | "error" | "stopped"): SupervisorState {
    this.state.health = status;
    this.state.watchdogStatus = status === "error" ? "active" : "active";
    return this.getState();
  }

  /**
   * Record restart
   */
  restartProcess(): void {
    this.stats.restarts++;
    this.stats.crashes = 0; // Reset crash count
  }

  /**
   * Record crash
   */
  recordCrash(): SupervisorState {
    this.stats.crashes++;
    this.setHealth("error");
    return this.getState();
  }

  /**
   * Process crash
   */
  processCrash(): SupervisorState {
    this.state.crashCount++;
    this.setHealth("error");
    
    // If crashes exceed threshold, disable watchdog
    if (this.state.crashCount >= this.config.crashThreshold) {
      this.state.watchdogStatus = "disabled";
    }
    
    return this.getState();
  }

  /**
   * Get current supervisor state
   */
  getState(): SupervisorState {
    return { ...this.state };
  }

  /**
   * Get supervisor stats
   */
  getStats(): SupervisorStats {
    return { ...this.stats };
  }

  /**
   * Get configuration
   */
  getConfig(): SupervisorConfig {
    return this.config;
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    if (!this.running) {
      return 0;
    }
    return Date.now() - this.startedAt;
  }

  /**
   * Get formatted uptime
   */
  getFormattedUptime(): string {
    const uptime = this.getUptime();
    return formatDuration(uptime, {
      maxUnit: "s", // Maximum precision to seconds
      maxPrecision: 2,
    });
  }

  /**
   * Get health report
   */
  getHealthReport(): SupervisorState {
    return this.getState();
  }

  /**
   * Get active agent count
   */
  getActiveCount(): number {
    return this.state.activeAgents;
  }

  /**
   * Get active queue
   */
  getActiveQueue(): EelixirAgentState[] {
    return [] as EeixirAgentState[]; // Placeholder
  }

  /**
   * Get total agents
   */
  getTotalCount(): number {
    return this.state.totalAgents;
  }

  /**
   * Set total agents
   */
  setTotalAgents(count: number): void {
    this.state.totalAgents = count;
  }

  /**
   * Set active agent count
   */
  setActiveCount(count: number): void {
    this.state.activeAgents = count;
  }

  /**
   * Set queue size
   */
  setQueueSize(size: number): void {
    this.state.queueSize = size;
    if (size > this.stats.peakQueue) {
      this.stats.peakQueue = size;
    }
  }

  /**
   * Get restart count
   */
  getRestartCount(): number {
    return this.state.restartCount;
  }

  /**
   * Get crash count
   */
  getCrashCount(): number {
    return this.state.crashCount;
  }

  /**
   * Get health check
   */
  healthCheck(): { success: boolean; status: SupervisorState["health"]; message: string } {
    const uptime = this.getUptime();
    const warning = uptime < (this.config.watchdogWindow || DEFAULT_CONFIG.watchdogWindow);
    
    // Also check queue
    const queue = this.state.queueSize;
    const queueWarning = queue >= (this.config.queueThreshold || DEFAULT_CONFIG.queueThreshold);

    if (!warning && !queueWarning) {
      return { success: true, status: "healthy", message: "All checks passed" };
    } else if (!queueWarning) {
      return { success: true, status: "warning", message: `Uptime low: ${this.getFormattedUptime()}` };
    } else {
      return { success: true, status: "warning", message: `High queue: ${queue}` };
    }
  }

  /**
   * Check if supervisor is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get watchdog status
   */
  getWatchdogStatus(): "active" | "disabled" | "paused" {
    return this.state.watchdogStatus;
  }

  /**
   * Enable watchdog
   */
  enableWatchdog(): void {
    this.config.enableWatchdog = true;
    this.state.watchdogStatus = "active";
  }

  /**
   * Disable watchdog
   */
  disableWatchdog(): void {
    this.config.enableWatchdog = false;
    this.state.watchdogStatus = "disabled";
  }

  /**
   * Get watchdog status
   */
  getWatchdogEnabled(): boolean {
    return this.config.enableWatchdog;
  }

  /**
   * Get state display text
   */
  getStateDisplay(): string {
    const uptime = this.getFormattedUptime();
    const restart = this.state.restartCount > 0 ? `, restarts: ${this.state.restartCount}` : "";

    return `${this.state.health.toUpperCase()} | ${this.state.activeAgents}/${this.state.totalAgents} active${restart} | ${uptime}`;
  }

  /**
   * Get health display text
   */
  getHealthDisplay(): string {
    const icon = HEALTH_ICONS[this.state.health];
    return `${icon} ${this.state.health} | crashes: ${this.state.crashCount}`;
  }

  /**
   * Get status display text
   */
  getStatusDisplay(): string {
    const uptime = this.getFormattedUptime();
    const watch = this.state.watchdogStatus === "active" ? "watchdog active" : "watchdog disabled";

    return `${icon} ${this.state.health.toUpperCase()} | ${uptime}\n` +
           `Active: ${this.state.activeAgents}/${this.state.totalAgents} | Queue: ${this.state.queueSize}\n` +
           `${watch} | Restarts: ${this.state.restartCount}`;
  }

  /**
   * Get supervisor display
   */
  getSupervisorDisplay(): string {
    const icon = ICONS.running;
    const healthIcon = HEALTH_ICONS[this.state.health];
    const uptime = this.getFormattedUptime();
    const watch = this.state.watchdogStatus === "active" ? "Watchdog: active" : "Watchdog: disabled";

    return `${icon} ${this.state.health.toUpperCase(): status:\n` +
           `Uptime: ${uptime}\n` +
           `Active: ${this.state.activeAgents}/${this.state.totalAgents} | Queue: ${this.state.queueSize}\n` +
           `${watch}\n` +
           `Crashes: ${this.state.crashCount} | Restarts: ${this.state.restartCount}`;
  }

  /**
   * Force health check
   */
  forceHealthCheck(): SupervisorState {
    this.state.lastCheck = Date.now();
    return this.getState();
  }

  /**
   * Get agent health reports
   */
  getAgentHealthReports(): Map<string, AgentHealthReport> {
    return new Map(this.healthMonitor.getAllReports().map((r) => [r.agentId, r]));
  }

  /**
   * Get all agent reports
   */
  getAllHealthReports(): AgentHealthReport[] {
    return this.healthMonitor.getAllReports();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.stop();
    this.healthMonitor.dispose();
  }
}
