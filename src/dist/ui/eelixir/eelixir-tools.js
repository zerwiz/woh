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
// ========================== TOOLS SERVICE CLASS ==========================
/**
 * ToolsService manages tool registration and discovery
 */
export class ToolsService {
    registry = new Map();
    agents = new Map();
    config;
    usageStats = new Map();
    constructor(config) {
        if (config) {
            this.config = config;
        }
    }
    /**
     * Initialize tools service
     */
    initialize() {
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
    registerAgentTools() {
        // These would be tools registered per agent, not global registry
        // For now, agents get tools from agent registry
    }
    /**
     * Register a new tool
     */
    registerTool(options) {
        const { name, description = "", config = {}, schema = {}, deprecation = "", status = "available", } = options;
        // Check for duplicate
        if (this.registry.has(name)) {
            return {
                success: false,
                tool: null,
                message: `Tool "${name}" already registered`,
            };
        }
        const inputSchema = schema;
        const handler = schema.handler; // In real impl, this would be the actual function
        const registeredAt = Date.now();
        const entry = {
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
    registerCategory(name, description) {
        // Placeholder for category management
    }
    /**
     * Register agent tools
     */
    registerAgentTools() {
        // This would register standard tools for agents
        // In real impl, tools are registered per-agent
    }
    /**
     * Get tool from registry
     */
    getTool(name) {
        return this.registry.get(name) || null;
    }
    /**
     * Get all tools
     */
    getAllTools() {
        return Array.from(this.registry.values());
    }
    /**
     * Get tools by category
     */
    getToolsByCategory(category) {
        if (!category) {
            return this.getAllTools();
        }
        return this.getAllTools().filter((tool) => tool.metadata?.category === category);
    }
    /**
     * Get available tools
     */
    getAvailableTools() {
        return this.getAllTools().filter((tool) => tool.status === "available");
    }
    /**
     * Get deprecated tools
     */
    getDeprecatedTools() {
        return this.getAllTools().filter((tool) => tool.status === "deprecating" || tool.status === "deprecated");
    }
    /**
     * Discover tools by query
     */
    discoverTools(options) {
        const { query, category, status, maxResults, } = options || {};
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
            tools = tools.filter((tool) => tool.description.toLowerCase().includes(lowerQuery) ||
                tool.name.toLowerCase().includes(lowerQuery) ||
                tool.metadata?.category?.toLowerCase().includes(lowerQuery));
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
    async executeTool(name, input, agent, options) {
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
                outputTokens: 50, // Would be actual
            },
        };
    }
    /**
     * Update tool stats
     */
    updateToolStats(name, stats) {
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
    getToolStats(name) {
        const stats = this.usageStats.get(name);
        return stats || null;
    }
    /**
     * Get top used tools
     */
    getTopUsedTools(limit = 10) {
        const tools = this.getAllTools();
        return tools
            .sort((a, b) => (b.usage || 0) - (a.usage || 0))
            .slice(0, limit);
    }
    /**
     * Register tool for agent
     */
    registerAgentTool(agentId, tool) {
        const agent = this.agents.get(agentId);
        if (agent) {
            // In real impl, would add tool to agent's available tools
            // For now, agents get tools from main registry
        }
    }
    /**
     * De-register tool
     */
    removeTool(name) {
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
    setToolDeprecation(name, notice) {
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
    getRegistryStatus() {
        return this.getAllTools().map((tool) => tool.status);
    }
    /**
     * Get registry size
     */
    getRegistrySize() {
        return this.registry.size;
    }
    /**
     * Get all deprecations
     */
    getDeprecations() {
        return this.getAllTools()
            .filter((tool) => tool.deprecation)
            .map((tool) => ({
            name: tool.name,
            notice: tool.deprecation,
            deprecating: tool.status === "deprecating",
        }));
    }
    /**
     * Get agent available tools
     */
    getAgentTools(agentId) {
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
    getToolBySchema(schema) {
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
    validateInput(name, input) {
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
    getToolDescription(name) {
        const tool = this.registry.get(name);
        return tool?.description || null;
    }
    /**
     * Get tool input schema
     */
    getToolInputSchema(name) {
        const tool = this.registry.get(name);
        return tool?.inputSchema || null;
    }
    /**
     * Get tools for agent
     */
    getToolsForAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent || !agent.tools) {
            return [];
        }
        return agent.tools || [];
    }
    /**
     * Cleanup
     */
    dispose() {
        this.registry.clear();
        this.usageStats.clear();
        this.agents.clear();
    }
}
//# sourceMappingURL=eelixir-tools.js.map