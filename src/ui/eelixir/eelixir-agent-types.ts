/**
 * eelixir-agent-types.ts — Agent Team Eelixir Types
 *
 * TypeScript interfaces and types specifically for the Eelixir agent team TUI
 * components. Extends base agent types with Eelixir-specific configurations.
 */

import { Tool } from "pi-tui";

// ==================== EELIXIR TEAM CONFIGURATION ====================

/**
 * Eelixir team configuration options
 *
 * Controls behavior, appearance, and capabilities of Eelixir agents
 */
export interface EelixirConfig {
  /** Team name displayed in TUI */
  teamName: string;
  /** Maximum concurrent agents */
  maxConcurrent: number;
  /** Allow parallel tool execution */
  allowParallelTools: boolean;
  /** Tool timeout in milliseconds */
  toolTimeout: number;
  /** Enable verbose logging */
  verbose: boolean;
  /** Custom theme colors */
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    success?: string;
    error?: string;
  };
  /** Display mode: "compact" or "detailed" */
  displayMode: "compact" | "detailed";
}

/**
 * Eelixir-specific agent metadata
 *
 * Extends base agent data with Eelixir-specific fields
 */
export interface EelixirAgentMetadata {
  /** Agent capability level (E0-E100) */
  capability: number;
  /** Specialized skills (e.g., "code", "research", "debug") */
  skills: string[];
  /** Current task assignment */
  currentTask?: string;
  /** Task priority (1-10) */
  priority: number;
}

/**
 * Eelixir tool execution context
 */
export interface EelixirExecutionContext {
  /** Active agent IDs */
  activeAgents: string[];
  /** Current task description */
  taskDescription: string;
  /** Execution context flags */
  flags: {
    /** Whether in debugging mode */
    debug: boolean;
    /** Whether tools can be chained */
    chainable: boolean;
    /** Current step in workflow */
    currentStep: number;
  };
}

// ==================== EELIXIR TOOL RESULTS ====================

/**
 * Eelixir-specific tool result structure
 */
export interface EelixirToolResult {
  /** Execution timestamp */
  timestamp: number;
  /** Result value */
  content: string;
  /** Tool execution metadata */
  _metadata: {
    /** Input tokens used */
    inputTokens: number;
    /** Output tokens generated */
    outputTokens: number;
    /** Execution duration */
    durationMs: number;
  };
  /** Error (if any) */
  error?: string;
  /** Whether result is cached */
  cached?: boolean;
}

/**
 * Eelixir agent state interface
 */
export interface EelixirAgentState {
  /** Unique agent identifier */
  id: string;
  /** Agent type/subagent type */
  type: string;
  /** Current status */
  status:
    | "queued"
    | "running"
    | "completed"
    | "error"
    | "aborted"
    | "stopped"
    | "active";
  /** Agent name/description */
  name: string;
  /** Agent description */
  description: string;
  /** Session data */
  session?: {
    /** Session state */
    state: string;
    /** Tokens used */
    tokens: number;
    /** Start timestamp */
    startedAt: number;
  };
  /** Eelixir-specific metadata */
  metadata?: EelixirAgentMetadata;
  /** Active tools (if running) */
  activeTools?: Map<string, string>;
  /** Turn count */
  turnCount: number;
  /** Maximum turns allowed */
  maxTurns?: number;
}

/**
 * Eelixir team state
 */
export interface EelixirTeamState {
  /** Configuration */
  config: EelixirConfig;
  /** All agents in team */
  agents: EelixirAgentState[];
  /** Current active agents */
  activeAgents: EelixirAgentState[];
  /** Running agent count */
  runningCount: number;
  /** Pending requests */
  queue: string[];
}

// ==================== EELIXIR UI CONTEXT ====================

/**
 * UI Context for Eelixir TUI widgets
 */
export interface EelixirUIContext {
  /** Set agent status */
  setStatus(agentId: string, status: string | undefined): void;
  /** Set widget content */
  setWidget<T>(
    key: string,
    widget:
      | undefined
      | {
          render(): EelixirRenderData;
          invalidate(): void;
        },
    options?: {
      placement?: "aboveEditor" | "belowEditor";
    },
  ): void;
  /** Notify user */
  notify<T>(key: string, message: string, duration?: number): void;
  /** Terminal dimensions */
  terminal?: {
    rows: number;
    columns: number;
  };
  /** Request render */
  requestRender?(): void;
}

/**
 * Eelixir TUI theme
 */
export interface EelixirTheme {
  fg(bg: string, text: string): string;
  bold(text: string): string;
  dim(text: string): string;
  accent(text: string): string;
  muted(text: string): string;
  success(text: string): string;
  warning(text: string): string;
  error(text: string): string;
}

/**
 * Render data returned by widget render functions
 */
export interface EelixirRenderData {
  render(): string[];
  invalidate(): void;
}

/**
 * Tool result data structure
 */
export interface EelixirToolResultData {
  data: string;
  toolResult?: Tool.Result;
  switchIntent?: string;
  error?: any;
  toolName?: string;
}
