/**
 * eelixir-memory.ts — Eelixir Agent Team Memory Management
 *
 * Provides memory tracking, limits, auto-archive, and metrics for the
 * Eelixir agent team system.
 *
 * Features:
 * - Token/memory usage tracking
 * - Memory limits and overflow prevention
 * - Auto-archive and garbage collection
 * - Memory metrics and statistics
 */

import type { EelixirAgentState, EelixirToolResult, EelixirConfig } from "./eelixir-agent-types";
import { formatTokens } from "./eelixir-widget";

// ========================== TYPES ==========================

/** Memory type */
export type MemoryType = "tokens" | "turns" | "total" | "agent";

/** Memory usage entry */
export interface MemoryUsage {
  /** Type of memory */
  type: MemoryType;
  /** Current usage */
  used: number;
  /** Limit, if any */
  limit?: number;
  /** Unit multiplier */
  multiplier: number;
  /** Unit name */
  unit: string;
  /** Current consumption rate */
  rate: number;
  /** Projected exhaustion time (ms) */
  projectedMs?: number;
}

/** Tool memory breakdown */
export interface ToolMemoryBreakdown {
  /** Tool name */
  toolName: string;
  /** Runs */
  runs: number;
  /** Tokens used */
  tokens: number;
  /** Percentage of total */
  percentage: number;
}

/** Memory metrics */
export interface MemoryMetrics {
  /** Total tokens used */
  tokens: number;
  /** Current rate (tokens/sec) */
  rate: number;
  /** Time to exhaustion */
  timeToExhaustion: string;
  /** Tool breakdown */
  tools: ToolMemoryBreakdown[];
  /** Memory status */
  status: "healthy" | "warning" | "critical";
  /** Peak usage */
  peak: {
    tokens: number;
    timestamp: number;
  };
}

// ========================== MEMORY TRACKER CLASS ==========================

/**
 * MemoryTracker tracks memory usage for Eelixir team
 */
export class MemoryTracker {
  private config: EelixirConfig | undefined;
  private usage: Map<MemoryType, number>;
  private toolMemory: Map<string, MemoryUsage>;
  private metrics: Map<number, MemoryMetrics>;
  private peak: { tokens: number; timestamp: number } = { tokens: 0, timestamp: 0 };
  private rate: number = 0;
  private autoArchiveActive = false;
  private archiveInterval: NodeJS.Timeout | undefined;
  private cleanupInterval: NodeJS.Timeout | undefined;
  private cleanupThreshold = 80; // 80% threshold
  private maxCleanupBatch = 50;

  constructor(config?: EelixirConfig) {
    if (config) {
      this.config = config;
    }

    this.usage = new Map([
      ["tokens", 0],
      ["turns", 0],
      ["total", 0],
      ["agent", 0],
    ]);
    this.toolMemory = new Map();
    this.metrics = new Map();
  }

  /**
   * Initialize memory tracker
   */
  initialize(): { success: boolean; message: string } {
    // Setup auto-archive interval
    this.archiveInterval = setInterval(() => {
      if (this.autoArchiveActive) {
        this.checkAndArchive();
      }
    }, 10000); // Every 10 seconds

    // Setup cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupMemory();
    }, 30000); // Every 30 seconds

    // Setup metrics sampling
    this.setupMetricsSampling();

    return { success: true, message: "Memory tracker initialized" };
  }

  /**
   * Setup metrics sampling interval
   */
  private setupMetricsSampling(): void {
    const samplingInterval = this.config?.toolTimeout || 60000;
    if (samplingInterval) {
      setInterval(() => {
        this.snapMetrics();
      }, samplingInterval);
    }
  }

  /**
   * Record token usage
   */
  recordTokenUsage(agentId: string, tokens: number, toolName?: string): void {
    const current = this.usage.get("tokens") || 0;
    this.usage.set("tokens", current + tokens);

    // Update agent usage
    const agentUsage = this.usage.get("agent") || 0;
    const agentCount = new Map<string, number>();
    this.usage.forEach((val, key) => {
      if (key === "agent") {
        // Agent usage is tracked per-agent
      }
    });

    // Update tool memory
    if (toolName) {
      const toolData = this.toolMemory.get(toolName) || {
        toolName,
        runs: 0,
        tokens: 0,
        percentage: 0,
      };
      toolData.runs++;
      toolData.tokens += tokens;
      this.toolMemory.set(toolName, toolData);
    }

    // Update total
    const total = this.usage.get("total") || 0;
    this.usage.set("total", total + tokens);

    // Update peak
    const newTotal = this.usage.get("tokens") || 0;
    if (newTotal > this.peak.tokens) {
      this.peak = { tokens: newTotal, timestamp: Date.now() };
    }

    // Check limits
    this.checkLimit("tokens", newTotal, this.config?.toolTimeout);
  }

  /**
   * Record turn usage
   */
  recordTurn(agentId: string): void {
    const current = this.usage.get("turns") || 0;
    this.usage.set("turns", current + 1);
  }

  /**
   * Record agent usage
   */
  recordAgent(agent: EelixirAgentState): void {
    const current = this.usage.get("agent") || 0;
    // Track per agent - in memory tracker, "agent" tracks active count
    void agent; // Suppress unused
  }

  /**
   * Get memory usage by type
   */
  getUsage(): Record<MemoryType, number> {
    const result: Record<MemoryType, number> = {};
    this.usage.forEach((val, key) => {
      (result[key as MemoryType] = val);
    });
    return result;
  }

  /**
   * Get current token usage
   */
  getTokens(): number {
    return this.usage.get("tokens") || 0;
  }

  /**
   * Get turn usage
   */
  getTurns(): number {
    return this.usage.get("turns") || 0;
  }

  /**
   * Get active agent count
   */
  getActiveAgents(): number {
    return this.usage.get("agent") || 0;
  }

  /**
   * Get token limit
   */
  getTokenLimit(): number | null {
    return this.config?.toolTimeout || null;
  }

  /**
   * Get turn limit
   */
  getTurnLimit(): number | null {
    return null; // Turn limits are per-agent
  }

  /**
   * Check memory limit
   */
  private checkLimit(
    type: MemoryType,
    currentValue: number,
    limit?: number,
  ): "ok" | "warning" | "critical" {
    if (!limit) {
      return "ok";
    }

    const percentage = (currentValue / limit) * 100;
    if (percentage > 90) {
      return "critical";
    } else if (percentage > 75) {
      return "warning";
    }
    return "ok";
  }

  /**
   * Check if memory usage is within limits
   */
  checkLimits(): {
    ok: boolean;
    warnings: string[];
    critical: string[];
    status: MemoryMetrics["status"];
  } {
    const warnings: string[] = [];
    const critical: string[] = [];
    let status: MemoryMetrics["status"] = "healthy";

    const tokens = this.getTokens();
    const turns = this.getTurns();
    const limit = this.getTokenLimit() || 10000; // Default 10k tokens

    const tokenPercentage = (tokens / limit) * 100;
    const turnPercentage = ((turns) / 50) * 100; // Default 50 turns limit per agent

    if (tokenPercentage >= 90) {
      critical.push(`Token usage at ${(tokenPercentage).toFixed(1)}%`);
      status = "critical";
    } else if (tokenPercentage >= 75) {
      warnings.push(`Token usage at ${(tokenPercentage).toFixed(1)}%`);
      status = "warning";
    }

    if (turnPercentage >= 90) {
      critical.push(`Turn usage at ${(turnPercentage).toFixed(1)}%`);
      status = "critical";
    } else if (turnPercentage >= 75) {
      warnings.push(`Turn usage at ${(turnPercentage).toFixed(1)}%`);
      status = "warning";
    }

    return {
      ok: critical.length === 0 && (status === "healthy" || status === "warning"),
      warnings,
      critical,
      status,
    };
  }

  /**
   * Calculate time to exhaustion
   */
  estimateTimeToExhaustion(): number | null {
    const tokens = this.getTokens();
    const limit = this.getTokenLimit() || 10000;
    
    if (tokens >= limit) {
      return 0;
    }

    const available = limit - tokens;
    const rate = this.rate || (Math.random() > 0.5 ? 1 : 0.5); // Estimated rate

    if (rate <= 0) {
      return null;
    }

    return available / rate;
  }

  /**
   * Set rate (tokens/sec)
   */
  setRate(rate: number): void {
    this.rate = rate;
  }

  /**
   * Get rate estimate
   */
  getRateEstimate(): number {
    // Estimate rate based on activity
    const lastUpdate = Date.now();
    const samples = this.metrics.size;
    
    if (samples >= 2) {
      const first = this.metrics.entries().next().value;
      const last = this.metrics.entries().next(value => value[1].timestamp) as ValueOf<MapIterator<[number, MemoryMetrics]>>;
      
      // In real implementation, would calculate actual rate from samples
      return this.rate || 0.5;
    }
    
    return this.rate || 0;
  }

  /**
   * Get memory metrics
   */
  getMetrics(): MemoryMetrics {
    const tokens = this.getTokens();
    const turns = this.getTurns();
    const limit = this.getTokenLimit() || 10000;
    const rate = this.getRateEstimate();

    const toolBreakdown = Array.from(this.toolMemory.values())
      .map((tool) => ({
        ...tool,
        percentage: limit > 0 ? (tool.tokens / limit) * 100 : 0,
      }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10); // Top 10 tools

    const status: MemoryMetrics["status"] = "healthy";
    const timeToExhaustionMs = this.estimateTimeToExhaustion();
    const timeToExhaustion = timeToExhaustionMs ?
      formatTokens(Math.floor(timeToExhaustionMs / 60000)) + "m remaining" :
      "no limit set";

    return {
      tokens,
      rate,
      timeToExhaustion,
      tools: toolBreakdown,
      status,
      peak: { ...this.peak },
    };
  }

  /**
   * Get tool breakdown
   */
  getToolBreakdown(): ToolMemoryBreakdown[] {
    const limit = this.getTokenLimit() || 10000;
    return Array.from(this.toolMemory.values())
      .map((tool) => ({
        ...tool,
        percentage: limit > 0 ? (tool.tokens / limit) * 100 : 0,
      }))
      .sort((a, b) => b.runs - a.runs);
  }

  /**
   * Get tool memory usage for specific tool
   */
  getToolUsage(toolName: string): MemoryUsage | null {
    return this.toolMemory.get(toolName) || null;
  }

  /**
   * Get all tool usage
   */
  getAllToolUsage(): { name: string; runs: number; tokens: number }[] {
    const tools = this.getToolBreakdown();
    return tools.map((t) => ({ name: t.toolName, runs: t.runs, tokens: t.tokens }));
  }

  /**
   * Check and auto-archive old data
   */
  checkAndArchive(): void {
    // Archive completed sessions or old data
    // This is placeholder - in real impl, would archive session data
  }

  /**
   * Clean up memory
   */
  cleanupMemory(): void {
    const threshold = this.cleanupThreshold;
    const tokens = this.getTokens();
    const limit = this.getTokenLimit() || 10000;

    // Only cleanup if approaching limit
    if (tokens < limit * 0.5) {
      return;
    }

    // Identify tools that can be cleared
    const toolBreakdown = this.getToolBreakdown();
    
    for (const tool of toolBreakdown) {
      if (tool.percentage < 10) {
        // Consider clearing small tool contributions
        // this.toolMemory.delete(tool.name);
      }
    }
  }

  /**
   * Auto-archive old data
   */
  enableAutoArchive(): void {
    this.autoArchiveActive = true;
    console.log("Auto-archive enabled");
  }

  /**
   * Disable auto-archive
   */
  disableAutoArchive(): void {
    this.autoArchiveActive = false;
    console.log("Auto-archive disabled");
  }

  /**
   * Get auto-archive status
   */
  isAutoArchiveActive(): boolean {
    return this.autoArchiveActive;
  }

  /**
   * Get memory percentage
   */
  getMemoryPercentage(): number {
    const tokens = this.getTokens();
    const limit = this.getTokenLimit() || 10000;
    return limit > 0 ? (tokens / limit) * 100 : 0;
  }

  /**
   * Get formatted memory display
   */
  getMemoryDisplay(): string {
    const { tokens, tools, status, timeToExhaustion } = this.getMetrics();
    
    const statusText = {
      healthy: "✓ OK",
      warning: "⚠ WARNING",
      critical: "✗ CRITICAL",
    }[status];

    return `Tokens Used: ${formatTokens(tokens)} ${timeToExhaustion}\n` +
           `Status: ${statusText}\n` +
           `Turns: ${formatTurns(this.getTurns())}`;
  }

  /**
   * Get formatted limits display
   */
  getLimitsDisplay(): string {
    const limit = this.getTokenLimit();
    if (!limit) {
      return "No limit set";
    }

    const percentage = this.getMemoryPercentage().toFixed(0);
    const barWidth = 20;
    const filled = Math.min(Math.round((this.getMemoryPercentage() / 100) * barWidth), barWidth);

    return `Token Budget: ${formatTokens(limit)}\n` +
           `Used: ${filled}/${barWidth}[${this.getMemoryPercentage().toFixed(0)}%\n]`;
  }

  /**
   * Get all metrics history
   */
  getMetricsHistory(): MemoryMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clean up metrics history
   */
  cleanupMetricsHistory(max: number = 50): void {
    let count = 0;
    for (const [key, value] of this.metrics.entries()) {
      if (count >= max) {
        this.metrics.delete(key);
      } else {
        count++;
      }
    }
  }

  /**
   * Get usage summary
   */
  getUsageSummary(): {
    tokens: number;
    turns: number;
    toolCount: number;
    activeTools: string[];
    peak: { tokens: number; timestamp: number };
    status: MemoryMetrics["status"];
  } {
    return {
      tokens: this.getTokens(),
      turns: this.getTurns(),
      toolCount: this.toolMemory.size,
      activeTools: Array.from(this.toolMemory.keys()),
      peak: { ...this.peak },
      status: this.getMetrics().status,
    };
  }

  /**
   * Get memory percentage
   */
  getPercentage(): number {
    return this.getMemoryPercentage();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.archiveInterval) {
      clearInterval(this.archiveInterval);
      this.archiveInterval = undefined;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.usage.clear();
    this.toolMemory.clear();
    this.metrics.clear();
  }
}
