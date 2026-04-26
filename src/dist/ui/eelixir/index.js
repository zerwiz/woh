/**
 * eelixir/index.ts — Eelixir TUI Component Export
 *
 * Main entry point for the Eelixir agent team TUI components.
 *
 * Exports:
 * - Types and interfaces
 * - Manager for Eelixir agents
 * - Widget for TUI display
 * - View for main TUI view
 *
 * Usage Example:
 * ```typescript
 * import { EelixirConfig, EelixirView } from "./src/ui/eelixir";
 *
 * const config: EelixirConfig = {
 *   teamName: "Eelixir Research Team",
 *   maxConcurrent: 1,
 *   allowParallelTools: true,
 *   toolTimeout: 60000,
 *   verbose: false,
 *   displayMode: "compact",
 * };
 *
 * const view = new EelixirView(config);
 * view.init(uiCtx);
 * ```
 */
// Re-export all types and components
export { 
// Widget exports
EelixirWidget, SPINNERS, ICONS, STATUS_COLORS, formatTokens, formatTurns, formatDuration, formatToolUsage, describeActivity, 
// Manager exports
EelixirAgentManager, EelixirDefaults, EelixirCompliance, } from "./eelixir-agent-types";
export { EelixirManagerWrapper } from "./eelixir-wrapper";
export { EelixirView } from "./eelixir-view";
export { EelixirWidget } from "./eelixir-widget";
export { EelixirAgentManager } from "./eelixir-manager";
//# sourceMappingURL=index.js.map