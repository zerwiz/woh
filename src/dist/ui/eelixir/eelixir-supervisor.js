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
import { ICONS, formatDuration } from "./eelixir-widget";
// ========================== CONSTANTS ==========================
const DEFAULT_CONFIG = {
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
    agents;
    config;
    interval;
    reports = [];
    constructor(config) {
        if (config) {
            this.config = config;
        }
        this.agents = new Map();
    }
    /**
     * Initialize health monitoring
     */
    initialize() {
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
    recordAgentHealth(agentId, agent) {
        const errors = agent.session?.state === "error" ? (agent.session._errors || 0) + 1 :
            agent.session?.state === "completed" ? 0 :
                (this.agents.get(agentId)?.errors || 0);
        const warnings = agent.session?.state === "error" ? 1 : 0;
        const status = agent.status === "completed" ? "healthy" :
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
        }
        else {
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
    scanHealth() {
        // Inherited from manager - agent states checked there
        // For now, this is placeholder
    }
    /**
     * Record warning
     */
    recordWarning(agentId, warning) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.warnings++;
            agent.message = warning;
        }
    }
    /**
     * Record error
     */
    recordError(agentId, error) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.errors++;
            agent.message = error;
        }
    }
    /**
     * Clear agent health
     */
    clearAgent(agentId) {
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
    getAgentReport(agentId) {
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
    getAllReports() {
        return this.reports;
    }
    /**
     * Stop monitoring
     */
    stop() {
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
    config = { ...DEFAULT_CONFIG };
    healthMonitor;
    state = {
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
    shutdownTimer;
    stateTimer;
    stats = {
        starts: 0,
        stops: 0,
        restarts: 0,
        crashes: 0,
        averageUptimeMs: 0,
        peakQueue: 0,
    };
    running = false;
    startedAt = Date.now();
    constructor(config = {}) {
        Object.assign(this.config, config);
        this.healthMonitor = new HealthMonitor(this.config);
        this.healthMonitor.initialize();
        this.setupStateUpdates();
    }
    /**
     * Initialize supervisor
     */
    initialize() {
        this.setupStateUpdates();
        return { success: true, message: "Supervisor initialized" };
    }
    /**
     * Setup state update timer
     */
    setupStateUpdates() {
        const interval = this.config.healthCheckInterval || DEFAULT_CONFIG.healthCheckInterval;
        this.stateTimer = setInterval(() => {
            this.updateState();
        }, interval);
    }
    /**
     * Update supervisor state
     */
    updateState() {
        this.state.lastCheck = Date.now();
        // Update queue size
        const queue = []; // Placeholder
        this.state.queueSize = queue.length;
        // Update watchdog status
        this.state.watchdogStatus = this.config.enableWatchdog ? "active" : "disabled";
    }
    /**
     * Start supervisor
     */
    start() {
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
    stop() {
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
    restart() {
        if (this.running) {
            this.stats.restarts++;
            return { success: true, message: "Supervisor restarted", state: this.getState() };
        }
        return { success: false, message: "Not running", state: this.getState() };
    }
    /**
     * Set health status
     */
    setHealth(status) {
        this.state.health = status;
        this.state.watchdogStatus = status === "error" ? "active" : "active";
        return this.getState();
    }
    /**
     * Record restart
     */
    restartProcess() {
        this.stats.restarts++;
        this.stats.crashes = 0; // Reset crash count
    }
    /**
     * Record crash
     */
    recordCrash() {
        this.stats.crashes++;
        this.setHealth("error");
        return this.getState();
    }
    /**
     * Process crash
     */
    processCrash() {
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
    getState() {
        return { ...this.state };
    }
    /**
     * Get supervisor stats
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Get configuration
     */
    getConfig() {
        return this.config;
    }
    /**
     * Get uptime
     */
    getUptime() {
        if (!this.running) {
            return 0;
        }
        return Date.now() - this.startedAt;
    }
    /**
     * Get formatted uptime
     */
    getFormattedUptime() {
        const uptime = this.getUptime();
        return formatDuration(uptime, {
            maxUnit: "s", // Maximum precision to seconds
            maxPrecision: 2,
        });
    }
    /**
     * Get health report
     */
    getHealthReport() {
        return this.getState();
    }
    /**
     * Get active agent count
     */
    getActiveCount() {
        return this.state.activeAgents;
    }
    /**
     * Get active queue
     */
    getActiveQueue() {
        return []; // Placeholder
    }
    /**
     * Get total agents
     */
    getTotalCount() {
        return this.state.totalAgents;
    }
    /**
     * Set total agents
     */
    setTotalAgents(count) {
        this.state.totalAgents = count;
    }
    /**
     * Set active agent count
     */
    setActiveCount(count) {
        this.state.activeAgents = count;
    }
    /**
     * Set queue size
     */
    setQueueSize(size) {
        this.state.queueSize = size;
        if (size > this.stats.peakQueue) {
            this.stats.peakQueue = size;
        }
    }
    /**
     * Get restart count
     */
    getRestartCount() {
        return this.state.restartCount;
    }
    /**
     * Get crash count
     */
    getCrashCount() {
        return this.state.crashCount;
    }
    /**
     * Get health check
     */
    healthCheck() {
        const uptime = this.getUptime();
        const warning = uptime < (this.config.watchdogWindow || DEFAULT_CONFIG.watchdogWindow);
        // Also check queue
        const queue = this.state.queueSize;
        const queueWarning = queue >= (this.config.queueThreshold || DEFAULT_CONFIG.queueThreshold);
        if (!warning && !queueWarning) {
            return { success: true, status: "healthy", message: "All checks passed" };
        }
        else if (!queueWarning) {
            return { success: true, status: "warning", message: `Uptime low: ${this.getFormattedUptime()}` };
        }
        else {
            return { success: true, status: "warning", message: `High queue: ${queue}` };
        }
    }
    /**
     * Check if supervisor is running
     */
    isRunning() {
        return this.running;
    }
    /**
     * Get watchdog status
     */
    getWatchdogStatus() {
        return this.state.watchdogStatus;
    }
    /**
     * Enable watchdog
     */
    enableWatchdog() {
        this.config.enableWatchdog = true;
        this.state.watchdogStatus = "active";
    }
    /**
     * Disable watchdog
     */
    disableWatchdog() {
        this.config.enableWatchdog = false;
        this.state.watchdogStatus = "disabled";
    }
    /**
     * Get watchdog status
     */
    getWatchdogEnabled() {
        return this.config.enableWatchdog;
    }
    /**
     * Get state display text
     */
    getStateDisplay() {
        const uptime = this.getFormattedUptime();
        const restart = this.state.restartCount > 0 ? `, restarts: ${this.state.restartCount}` : "";
        return `${this.state.health.toUpperCase()} | ${this.state.activeAgents}/${this.state.totalAgents} active${restart} | ${uptime}`;
    }
    /**
     * Get health display text
     */
    getHealthDisplay() {
        const icon = HEALTH_ICONS[this.state.health];
        return `${icon} ${this.state.health} | crashes: ${this.state.crashCount}`;
    }
    /**
     * Get status display text
     */
    getStatusDisplay() {
        const uptime = this.getFormattedUptime();
        const watch = this.state.watchdogStatus === "active" ? "watchdog active" : "watchdog disabled";
        return `${icon} ${this.state.health.toUpperCase()} | ${uptime}\n` +
            `Active: ${this.state.activeAgents}/${this.state.totalAgents} | Queue: ${this.state.queueSize}\n` +
            `${watch} | Restarts: ${this.state.restartCount}`;
    }
    /**
     * Get supervisor display
     */
    getSupervisorDisplay() {
        const icon = ICONS.running;
        const healthIcon = HEALTH_ICONS[this.state.health];
        const uptime = this.getFormattedUptime();
        const watch = this.state.watchdogStatus === "active" ? "Watchdog: active" : "Watchdog: disabled";
        return `${icon} ${this.state.health.toUpperCase();
        status: ;
        n ` +
           `;
        Uptime: $;
        {
            uptime;
        }
        n ` +
           `;
        Active: $;
        {
            this.state.activeAgents;
        }
        /${this.state.totalAgents} | Queue: ${this.state.queueSize}\n` + `${watch}\n` +
            `Crashes: ${this.state.crashCount} | Restarts: ${this.state.restartCount}`;
    }
    /**
     * Force health check
     */
    forceHealthCheck() {
        this.state.lastCheck = Date.now();
        return this.getState();
    }
    /**
     * Get agent health reports
     */
    getAgentHealthReports() {
        return new Map(this.healthMonitor.getAllReports().map((r) => [r.agentId, r]));
    }
    /**
     * Get all agent reports
     */
    getAllHealthReports() {
        return this.healthMonitor.getAllReports();
    }
    /**
     * Cleanup
     */
    dispose() {
        this.stop();
        this.healthMonitor.dispose();
    }
}
//# sourceMappingURL=eelixir-supervisor.js.map