/**
 * eelixir-tools.ts — Eelixir Tools Registry
 *
 * Provides tool registration, discovery, and management for the
 * Eelixir agent team system.
 *
 * Features:
 * - Tool registration
 * - Tool discovery
 * - Tool metadata handling
 * - Tool lifecycle
 */

import type { 
  ToolConfig, 
  ToolSchema, 
  ToolExecutionOptions, 
  ToolResult, 
  ToolInputSchema, 
  EelixirToolResult, 
  EelixirAgentState, 
  EelixirConfig 
} from "./eelixir-agent-types";
import { formatTokens } from "./eelixir-widget";

// ========================== TYPES ==========================

/** Tool registry status */
export type ToolRegistryStatus = "available" | "deprecating" | "deprecated" | "removing";

/** Tool registry entry */
export interface ToolRegistryEntry {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Tool handler/constructor */
  handler: Function;
  /** Tool input schema */
  inputSchema: ToolInputSchema;
  /** Tool config */
  config?: ToolConfig;
  /** Tool status */
  status: ToolRegistryStatus;
  /** Registered timestamp */
  registeredAt: number;
  /** Usage count */
  usage: number;
  /** Average duration (ms) */
  avgDuration: number;
  /** Success rate */
  successRate: number;
  /** Error count */
  errorCount: number;
  /** Deprecation notice */
  deprecation?: string;
  /** Metadata */
  metadata: {
    category?: string;
    version?: string;
    author?: string;
    requiresAuth?: boolean;
    sandbox?: boolean;
    timeouts?: number[];
  };
}

/** Tool registration options */
export interface ToolRegistrationOptions {
  /** Tool name */
  name: string;
  /** Tool description */
  description?: string;
  /** Tool config */
  config?: ToolConfig;
  /** Tool schema */
  schema?: ToolSchema;
  /** Deprecation notice */
  deprecation?: string;
  /** Status */
  status?: ToolRegistryStatus;
}

/** Tool discovery options */
export interface ToolDiscoveryOptions {
  /** Query text */
  query: string;
  /** Category filter */
  category?: string;
  /** Status filter */
  status?: ToolRegistryStatus;
  /** Max results */
  maxResults?: number;
}

// ========================== TOOLS SERVICE CLASS ==========================

/**
 * ToolsService manages tool registration and discovery
 */
export class ToolsService {
  private registry: Map<string, ToolRegistryEntry> = new Map();
  private agents: Map<string, EelixirAgentState> = new Map();
  private config: EelixirConfig | undefined;
  private usageStats: Map<string, {
    count: number;
    totalDuration: number;
    errors: number;
    successes: number;
  }> = new Map();

  constructor(config?: EelixirConfig) {
    if (config) {
      this.config = config;
    }
  }

  /**
   * Initialize tools service
   */
  initialize(): { success: boolean; registered: number } {
    // Setup default tool categories
    this.registerCategory("web", "Web tools (scraping, requests, navigation)");
    this.registerCategory("code", "Code tools (execution, compilation, debugging)");
    this.registerCategory("files", "File tools (read, write, edit, compress)");
    this.registerCategory("system", "System tools (filesystem, process, network)");
    this.registerCategory("ai", "AI/LLM tools (generation, analysis, synthesis)");

    // Setup default agent tools
    this.registerAgentTools();

    return { 
      success: true, 
      registered: this.registry.size 
    };
  }

  /**
   * Register agent-specific tools (inherited from manager)
   */
  private registerAgentTools(): void {
    // These would be tools registered per agent, not global registry
    // For now, agents get tools from agent registry
  }

  /**
   * Register a new tool
   */
  registerTool(options: ToolRegistrationOptions): { 
    success: boolean; 
    tool: ToolRegistryEntry | null;
    message: string;
  } {
    const {
      name,
      description = "",
      config = {} as ToolConfig,
      schema = {},
      deprecation = "",
      status = "available",
    } = options;

    // Check for duplicate
    if (this.registry.has(name)) {
      return {
        success: false,
        tool: null,
        message: `Tool "${name}" already registered`,
      };
    }

    const inputSchema = schema as ToolInputSchema;
    const handler = schema.handler; // In real impl, this would be the actual function

    const registeredAt = Date.now();
    const entry: ToolRegistryEntry = {
      name,
      description,
      handler,
      inputSchema,
      config,
      status,
      registeredAt,
      usage: 0,
      avgDuration: 0,
      successRate: 0,
      errorCount: 0,
      deprecation,
      metadata: {
        category: config.category,
        version: config.version,
        author: config.author,
        requiresAuth: config.requiresAuth || false,
        sandbox: config.sandbox || false,
        timeouts: config.timeouts,
      },
    };

    this.registry.set(name, entry);
    
    // Also track usage stats
    this.usageStats.set(name, {
      count: 0,
      totalDuration: 0,
      errors: 0,
      successes: 0,
    });

    return {
      success: true,
      tool: entry,
      message: `Tool "${name}" registered successfully`,
    };
  }

  /**
   * Register tool category
   */
  private registerCategory(name: string, description: string): void {
    // Placeholder for category management
  }

  /**
   * Register agent tools
   */
  registerAgentTools(): void {
    // This would register standard tools for agents
    // In real impl, tools are registered per-agent
  }

  /**
   * Get tool from registry
   */
  getTool(name: string): ToolRegistryEntry | null {
    return this.registry.get(name) || null;
  }

  /**
   * Get all tools
   */
  getAllTools(): ToolRegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category?: string): ToolRegistryEntry[] {
    if (!category) {
      return this.getAllTools();
    }
    return this.getAllTools().filter((tool) => tool.metadata?.category === category);
  }

  /**
   * Get available tools
   */
  getAvailableTools(): ToolRegistryEntry[] {
    return this.getAllTools().filter((tool) => tool.status === "available");
  }

  /**
   * Get deprecated tools
   */
  getDeprecatedTools(): ToolRegistryEntry[] {
    return this.getAllTools().filter((tool) => 
      tool.status === "deprecating" || tool.status === "deprecated"
    );
  }

  /**
   * Discover tools by query
   */
  discoverTools(options: ToolDiscoveryOptions): ToolRegistryEntry[] {
    const {
      query,
      category,
      status,
      maxResults,
    } = options || {};

    let tools = this.getAllTools();

    // Filter by status if provided
    if (status) {
      tools = tools.filter((tool) => tool.status === status);
    }

    // Filter by category if provided
    if (category) {
      tools = tools.filter((tool) => tool.metadata?.category === category);
    }

    // Filter by query (description match)
    if (query) {
      const lowerQuery = query.toLowerCase();
      tools = tools.filter((tool) =>
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.metadata?.category?.toLowerCase().includes(lowerQuery)
      );
    }

    // Limit results
    if (maxResults) {
      tools = tools.slice(0, maxResults);
    }

    return tools;
  }

  /**
   * Tool execution
   */
  async executeTool(
    name: string,
    input: Record<string, unknown>,
    agent: EelixirAgentState,
    options?: ToolExecutionOptions,
  ): Promise<EelixirToolResult> {
    const tool = this.registry.get(name);
    if (!tool) {
      return {
        toolName: name,
        toolResult: false,
        error: `Tool "${name}" not found`,
        durationMs: 0,
        metadata: {
          inputTokens: 0,
          outputTokens: 0,
        },
      };
    }

    const timeout = options?.timeout || this.config?.toolTimeout || 60000;
    
    // Check if tool is deprecated
    if (tool.status !== "available") {
      return {
        toolName: tool.name,
        toolResult: false,
        error: `Tool "${tool.name}" is ${tool.status}`,
        durationMs: 0,
        metadata: {
          inputTokens: 0,
          outputTokens: 0,
        },
      };
    }

    // Execute handler (simplified - handler would be actual function)
    for await (const line of tool.handler(input, this.config)) {
      // Yield to allow agent to handle output
      yield line;
    }

    // Update stats
    const stats = this.usageStats.get(name) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      successes: 0,
    };
    
    // Mock duration (would be actual from execution)
    const duration = 100;

    stats.count++;
    stats.totalDuration += duration;
    
    // Success/failure tracking (would be actual result)
    // For mock, assume success (would check actual result)
    
    this.registry.get(name)?.avgDuration =
      (stats.totalDuration / stats.count) || 0;

    return {
      toolName: tool.name,
      toolResult: true, // Would be actual tool output
      durationMs: duration,
      metadata: {
        inputTokens: 100, // Would be actual
        outputTokens: 50,  // Would be actual
      },
    };
  }

  /**
   * Update tool stats
   */
  updateToolStats(name: string, stats?: {
    success?: boolean;
    duration?: number;
    error?: string;
  }): void {
    const current = this.usageStats.get(name) || {
      count: 0,
      totalDuration: 0,
      errors: 0,
      successes: 0,
    };

    if (stats?.success) {
      current.successes++;
    }

    if (stats?.error) {
      current.errors++;
    }

    if (stats?.duration) {
      current.totalDuration += stats.duration;
    }

    this.usageStats.set(name, current);
  }

  /**
   * Get tool usage stats
   */
  getToolStats(name: string): {
    count: number;
    avgDuration: number;
    successRate: number;
    errors: number;
    successes: number;
  } | null {
    const stats = this.usageStats.get(name);
    return stats || null;
  }

  /**
   * Get top used tools
   */
  getTopUsedTools(limit: number = 10): ToolRegistryEntry[] {
    const tools = this.getAllTools();
    return tools
      .sort((a, b) => (b.usage || 0) - (a.usage || 0))
      .slice(0, limit);
  }

  /**
   * Register tool for agent
   */
  registerAgentTool(agentId: string, tool: ToolRegistryEntry): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      // In real impl, would add tool to agent's available tools
      // For now, agents get tools from main registry
    }
  }

  /**
   * De-register tool
   */
  removeTool(name: string): boolean {
    const tool = this.registry.get(name);
    if (tool) {
      // Before removing, maybe deprecate first
      const status = tool.status;
      if (status !== "removing" && status !== "deprecated") {
        // Soft deprecate instead
        tool.status = "deprecated";
        tool.deprecation = [
          "Tool",
          name,
          "removed",
        ].join(", ");
      }
      this.registry.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Set tool deprecation
   */
  setToolDeprecation(name: string, notice: string): ToolRegistryEntry | null {
    const tool = this.registry.get(name);
    if (tool) {
      tool.deprecation = notice;
      tool.status = "deprecating";
      return tool;
    }
    return null;
  }

  /**
   * Get registry status
   */
  getRegistryStatus(): ToolRegistryStatus[] {
    return this.getAllTools().map((tool) => tool.status);
  }

  /**
   * Get registry size
   */
  getRegistrySize(): number {
    return this.registry.size;
  }

  /**
   * Get all deprecations
   */
  getDeprecations(): {
    name: string;
    notice: string;
    deprecating: boolean;
  }[] {
    return this.getAllTools()
      .filter((tool) => tool.deprecation)
      .map((tool) => ({
        name: tool.name,
        notice: tool.deprecation!,
        deprecating: tool.status === "deprecating",
      }));
  }

  /**
   * Get agent available tools
   */
  getAgentTools(agentId: string): ToolRegistryEntry[] {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return [];
    }

    // In real impl, would return agent-specific tools
    // For now, return all tools that agent has access to
    return this.getAllTools().filter((tool) => {
      // Would check agent's allowed tools
      return true;
    });
  }

  /**
   * Get tool by schema
   */
  getToolBySchema(schema: ToolSchema): ToolRegistryEntry | null {
    for (const tool of this.getAllTools()) {
      if (schema.name === tool.name) {
        return tool;
      }
    }
    return null;
  }

  /**
   * Validate tool input schema
   */
  validateInput(name: string, input: unknown): boolean {
    const tool = this.registry.get(name);
    if (!tool) {
      return false;
    }

    // In real impl, would validate against JSON schema
    // For now, mock validation
    return true;
  }

  /**
   * Get tool description
   */
  getToolDescription(name: string): string | null {
    const tool = this.registry.get(name);
    return tool?.description || null;
  }

  /**
   * Get tool input schema
   */
  getToolInputSchema(name: string): ToolInputSchema | null {
    const tool = this.registry.get(name);
    return tool?.inputSchema || null;
  }

  /**
   * Get tools for agent
   */
  getToolsForAgent(agentId: string): ToolRegistryEntry[] {
    const agent = this.agents.get(agentId);
    if (!agent || !agent.tools) {
      return [];
    }
    return agent.tools || [];
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.registry.clear();
    this.usageStats.clear();
    this.agents.clear();
  }
}
