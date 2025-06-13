#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

/**
 * Alert System for Newman API Testing (Deno Version)
 *
 * This script processes performance alerts and sends notifications through various channels:
 * - Console output with colored formatting
 * - File-based logging
 * - Webhook notifications
 * - Slack integration
 * - Discord integration
 * - Email notifications (future)
 */

interface AlertOptions {
  alertsFile?: string;
  logFile?: string;
  webhookUrl?: string;
  slackWebhookUrl?: string;
  discordWebhookUrl?: string;
  cooldownMinutes?: number;
  maxAlertsPerHour?: number;
  enableDeduplication?: boolean;
  severityThresholds?: {
    critical: number;
    warning: number;
    info: number;
  };
}

interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  data: unknown;
}

interface AlertState {
  lastSent: Record<string, string>;
  alertCounts: Record<string, number>;
  hourlyCount: number;
  lastHourReset: string;
}

interface NotificationChannel {
  name: string;
  enabled: boolean;
  send: (alert: Alert, context: AlertContext) => Promise<boolean>;
}

interface AlertContext {
  environment: string;
  sessionId?: string;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
}

class AlertSystem {
  private options: Required<AlertOptions>;
  private state: AlertState;
  private channels: NotificationChannel[] = [];

  constructor(options: AlertOptions = {}) {
    this.options = {
      alertsFile: options.alertsFile || "reports/performance-alerts.json",
      logFile: options.logFile || "reports/alert-log.json",
      webhookUrl: options.webhookUrl || "",
      slackWebhookUrl: options.slackWebhookUrl ||
        Deno.env.get("SLACK_WEBHOOK_URL") || "",
      discordWebhookUrl: options.discordWebhookUrl ||
        Deno.env.get("DISCORD_WEBHOOK_URL") || "",
      cooldownMinutes: options.cooldownMinutes || 5,
      maxAlertsPerHour: options.maxAlertsPerHour || 20,
      enableDeduplication: options.enableDeduplication ?? true,
      severityThresholds: options.severityThresholds || {
        critical: 1, // Send immediately
        warning: 2, // Send after 2 occurrences
        info: 1, // Send immediately
      },
    };

    this.state = this.loadState();
    this.initializeChannels();
  }

  /**
   * Initialize notification channels
   */
  private initializeChannels() {
    // Console channel (always enabled)
    this.channels.push({
      name: "console",
      enabled: true,
      send: this.sendConsoleAlert.bind(this),
    });

    // File logging channel (always enabled)
    this.channels.push({
      name: "file",
      enabled: true,
      send: this.sendFileAlert.bind(this),
    });

    // Webhook channel
    if (this.options.webhookUrl) {
      this.channels.push({
        name: "webhook",
        enabled: true,
        send: this.sendWebhookAlert.bind(this),
      });
    }

    // Slack channel
    if (this.options.slackWebhookUrl) {
      this.channels.push({
        name: "slack",
        enabled: true,
        send: this.sendSlackAlert.bind(this),
      });
    }

    // Discord channel
    if (this.options.discordWebhookUrl) {
      this.channels.push({
        name: "discord",
        enabled: true,
        send: this.sendDiscordAlert.bind(this),
      });
    }
  }

  /**
   * Process alerts from performance analysis
   */
  async processAlerts(alertsFile?: string): Promise<void> {
    const file = alertsFile || this.options.alertsFile;

    console.log(`🚨 Processing alerts from: ${file}`);

    try {
      await Deno.stat(file);
    } catch {
      console.log("ℹ️ No alerts file found, nothing to process");
      return;
    }

    const alertsText = await Deno.readTextFile(file);
    const alertsData = JSON.parse(alertsText);

    if (!alertsData.alerts || alertsData.alerts.length === 0) {
      console.log("✅ No alerts to process");
      return;
    }

    const context: AlertContext = {
      environment: Deno.env.get("DENO_ENV") || "development",
      sessionId: alertsData.sessionId,
      totalAlerts: alertsData.alerts.length,
      criticalAlerts:
        alertsData.alerts.filter((a: Alert) => a.severity === "critical")
          .length,
      warningAlerts:
        alertsData.alerts.filter((a: Alert) => a.severity === "warning").length,
    };

    console.log(
      `📊 Alert Summary: ${context.totalAlerts} total (${context.criticalAlerts} critical, ${context.warningAlerts} warnings)`,
    );

    // Reset hourly count if needed
    this.resetHourlyCountIfNeeded();

    // Process each alert
    for (const alert of alertsData.alerts) {
      await this.processAlert(alert, context);
    }

    // Save updated state
    await this.saveState();

    console.log("✅ Alert processing complete");
  }

  /**
   * Process a single alert
   */
  private async processAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<void> {
    // Check rate limiting
    if (this.state.hourlyCount >= this.options.maxAlertsPerHour) {
      console.log(
        `⏸️ Rate limit reached (${this.options.maxAlertsPerHour}/hour), skipping alert: ${alert.title}`,
      );
      return;
    }

    // Check deduplication
    if (this.options.enableDeduplication && this.isDuplicate(alert)) {
      console.log(
        `🔄 Duplicate alert detected, checking threshold: ${alert.title}`,
      );

      const alertKey = this.getAlertKey(alert);
      this.state.alertCounts[alertKey] =
        (this.state.alertCounts[alertKey] || 0) + 1;

      const threshold = this.options.severityThresholds[alert.severity] || 1;
      if (this.state.alertCounts[alertKey] < threshold) {
        console.log(
          `⏳ Alert count (${
            this.state.alertCounts[alertKey]
          }) below threshold (${threshold}), skipping`,
        );
        return;
      }
    }

    // Check cooldown
    if (this.isInCooldown(alert)) {
      console.log(`❄️ Alert in cooldown period, skipping: ${alert.title}`);
      return;
    }

    // Send alert through all enabled channels
    console.log(`📤 Sending ${alert.severity} alert: ${alert.title}`);

    let successCount = 0;
    for (const channel of this.channels) {
      if (channel.enabled) {
        try {
          const success = await channel.send(alert, context);
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error(
            `❌ Failed to send alert via ${channel.name}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    }

    // Update state
    const alertKey = this.getAlertKey(alert);
    this.state.lastSent[alertKey] = new Date().toISOString();
    this.state.hourlyCount++;

    console.log(
      `✅ Alert sent via ${successCount}/${
        this.channels.filter((c) => c.enabled).length
      } channels`,
    );
  }

  /**
   * Send alert to console with colored output
   */
  private async sendConsoleAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<boolean> {
    const colors = {
      critical: "\x1b[31m", // Red
      warning: "\x1b[33m", // Yellow
      info: "\x1b[36m", // Cyan
      reset: "\x1b[0m",
    };

    const color = colors[alert.severity];
    const timestamp = new Date(alert.timestamp).toLocaleString();

    console.log(
      `\n${color}🚨 ${alert.severity.toUpperCase()} ALERT${colors.reset}`,
    );
    console.log(
      `${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`,
    );
    console.log(`${color}Title:${colors.reset} ${alert.title}`);
    console.log(`${color}Message:${colors.reset} ${alert.message}`);
    console.log(`${color}Time:${colors.reset} ${timestamp}`);
    console.log(`${color}Environment:${colors.reset} ${context.environment}`);
    console.log(
      `${color}Session:${colors.reset} ${context.sessionId || "N/A"}`,
    );

    if (alert.data && typeof alert.data === "object") {
      console.log(`${color}Details:${colors.reset}`);
      console.log(JSON.stringify(alert.data, null, 2));
    }

    console.log(
      `${color}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`,
    );

    return true;
  }

  /**
   * Send alert to log file
   */
  private async sendFileAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<boolean> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      alert,
      context,
      processed: true,
    };

    try {
      await this.ensureDirectoryExists(this.options.logFile);

      // Append to log file
      const logLine = JSON.stringify(logEntry) + "\n";
      await Deno.writeTextFile(this.options.logFile, logLine, { append: true });

      return true;
    } catch (error) {
      console.error(
        `Failed to write to log file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Send alert via webhook
   */
  private async sendWebhookAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<boolean> {
    const payload = {
      alert,
      context,
      timestamp: new Date().toISOString(),
      source: "newman-performance-monitor",
    };

    try {
      const response = await fetch(this.options.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(
        `Webhook failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Send alert to Slack
   */
  private async sendSlackAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<boolean> {
    const color = {
      critical: "danger",
      warning: "warning",
      info: "good",
    }[alert.severity];

    const emoji = {
      critical: "🚨",
      warning: "⚠️",
      info: "ℹ️",
    }[alert.severity];

    const payload = {
      text: `${emoji} Performance Alert - ${alert.severity.toUpperCase()}`,
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: "Environment",
              value: context.environment,
              short: true,
            },
            {
              title: "Session ID",
              value: context.sessionId || "N/A",
              short: true,
            },
            {
              title: "Total Alerts",
              value:
                `${context.totalAlerts} (${context.criticalAlerts} critical, ${context.warningAlerts} warnings)`,
              short: false,
            },
          ],
          footer: "Newman Performance Monitor",
          ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
        },
      ],
    };

    try {
      const response = await fetch(this.options.slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(
        `Slack notification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Send alert to Discord
   */
  private async sendDiscordAlert(
    alert: Alert,
    context: AlertContext,
  ): Promise<boolean> {
    const color = {
      critical: 0xFF0000, // Red
      warning: 0xFFA500, // Orange
      info: 0x00BFFF, // Blue
    }[alert.severity];

    const emoji = {
      critical: "🚨",
      warning: "⚠️",
      info: "ℹ️",
    }[alert.severity];

    const payload = {
      embeds: [
        {
          title: `${emoji} Performance Alert - ${alert.severity.toUpperCase()}`,
          description: alert.title,
          color,
          fields: [
            {
              name: "Message",
              value: alert.message,
              inline: false,
            },
            {
              name: "Environment",
              value: context.environment,
              inline: true,
            },
            {
              name: "Session ID",
              value: context.sessionId || "N/A",
              inline: true,
            },
            {
              name: "Alert Summary",
              value:
                `${context.totalAlerts} total (${context.criticalAlerts} critical, ${context.warningAlerts} warnings)`,
              inline: false,
            },
          ],
          footer: {
            text: "Newman Performance Monitor",
          },
          timestamp: alert.timestamp,
        },
      ],
    };

    try {
      const response = await fetch(this.options.discordWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error(
        `Discord notification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return false;
    }
  }

  /**
   * Test alert system with a sample alert
   */
  async testAlert(
    severity: "critical" | "warning" | "info" = "info",
  ): Promise<void> {
    const testAlert: Alert = {
      id: `test_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: "test",
      severity,
      title: `Test Alert - ${severity.toUpperCase()}`,
      message:
        `This is a test ${severity} alert to verify the notification system is working correctly.`,
      data: {
        test: true,
        timestamp: new Date().toISOString(),
        channels: this.channels.filter((c) => c.enabled).map((c) => c.name),
      },
    };

    const context: AlertContext = {
      environment: Deno.env.get("DENO_ENV") || "development",
      sessionId: "test_session",
      totalAlerts: 1,
      criticalAlerts: severity === "critical" ? 1 : 0,
      warningAlerts: severity === "warning" ? 1 : 0,
    };

    console.log(`🧪 Sending test ${severity} alert...`);
    await this.processAlert(testAlert, context);
  }

  /**
   * Get alert system status
   */
  getStatus(): {
    channels: Array<{ name: string; enabled: boolean }>;
    state: AlertState;
    options: Partial<AlertOptions>;
  } {
    return {
      channels: this.channels.map((c) => ({
        name: c.name,
        enabled: c.enabled,
      })),
      state: this.state,
      options: {
        cooldownMinutes: this.options.cooldownMinutes,
        maxAlertsPerHour: this.options.maxAlertsPerHour,
        enableDeduplication: this.options.enableDeduplication,
        severityThresholds: this.options.severityThresholds,
      },
    };
  }

  // Utility methods
  private getAlertKey(alert: Alert): string {
    return `${alert.type}_${alert.severity}_${alert.title}`;
  }

  private isDuplicate(alert: Alert): boolean {
    const alertKey = this.getAlertKey(alert);
    return alertKey in this.state.lastSent;
  }

  private isInCooldown(alert: Alert): boolean {
    const alertKey = this.getAlertKey(alert);
    const lastSent = this.state.lastSent[alertKey];

    if (!lastSent) return false;

    const cooldownMs = this.options.cooldownMinutes * 60 * 1000;
    const timeSinceLastSent = Date.now() - new Date(lastSent).getTime();

    return timeSinceLastSent < cooldownMs;
  }

  private resetHourlyCountIfNeeded(): void {
    const now = new Date();
    const lastReset = new Date(this.state.lastHourReset);

    if (now.getTime() - lastReset.getTime() >= 60 * 60 * 1000) { // 1 hour
      this.state.hourlyCount = 0;
      this.state.lastHourReset = now.toISOString();
    }
  }

  // File operations
  private loadState(): AlertState {
    try {
      const stateFile = "reports/alert-state.json";
      const data = Deno.readTextFileSync(stateFile);
      return JSON.parse(data);
    } catch {
      return {
        lastSent: {},
        alertCounts: {},
        hourlyCount: 0,
        lastHourReset: new Date().toISOString(),
      };
    }
  }

  private async saveState(): Promise<void> {
    try {
      const stateFile = "reports/alert-state.json";
      await this.ensureDirectoryExists(stateFile);
      await Deno.writeTextFile(stateFile, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error(
        `Failed to save alert state: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (error) {
      if (!(error instanceof Deno.errors.AlreadyExists)) {
        throw error;
      }
    }
  }
}

// CLI interface
if (import.meta.main) {
  const args = Deno.args;
  const command = args[0];
  const alertsFile = args[1];

  const alertSystem = new AlertSystem();

  switch (command) {
    case "process":
      try {
        await alertSystem.processAlerts(alertsFile);
      } catch (error) {
        console.error(
          `Error processing alerts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    case "test":
      const severity = (args[1] as "critical" | "warning" | "info") || "info";
      try {
        await alertSystem.testAlert(severity);
      } catch (error) {
        console.error(
          `Error testing alerts: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    case "status":
      try {
        const status = alertSystem.getStatus();
        console.log("\n📊 Alert System Status:");
        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        );

        console.log("\n📡 Notification Channels:");
        status.channels.forEach((channel) => {
          const status_icon = channel.enabled ? "✅" : "❌";
          console.log(`  ${status_icon} ${channel.name}`);
        });

        console.log("\n⚙️ Configuration:");
        console.log(`  Cooldown: ${status.options.cooldownMinutes} minutes`);
        console.log(`  Max alerts/hour: ${status.options.maxAlertsPerHour}`);
        console.log(
          `  Deduplication: ${
            status.options.enableDeduplication ? "enabled" : "disabled"
          }`,
        );

        console.log("\n📈 Current State:");
        console.log(`  Alerts sent this hour: ${status.state.hourlyCount}`);
        console.log(
          `  Unique alert types tracked: ${
            Object.keys(status.state.lastSent).length
          }`,
        );
        console.log(
          `  Last hour reset: ${
            new Date(status.state.lastHourReset).toLocaleString()
          }`,
        );

        console.log(
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
        );
      } catch (error) {
        console.error(
          `Error getting status: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        Deno.exit(1);
      }
      break;

    default:
      console.log("Newman Alert System (Deno)");
      console.log("");
      console.log("Usage:");
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts process [alerts-file]",
      );
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts test [critical|warning|info]",
      );
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts status",
      );
      console.log("");
      console.log("Examples:");
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts process reports/performance-alerts.json",
      );
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts test critical",
      );
      console.log(
        "  deno run --allow-read --allow-write --allow-net scripts/alert-system.ts status",
      );
      console.log("");
      console.log("Environment Variables:");
      console.log(
        "  SLACK_WEBHOOK_URL    - Slack webhook URL for notifications",
      );
      console.log(
        "  DISCORD_WEBHOOK_URL  - Discord webhook URL for notifications",
      );
      console.log(
        "  DENO_ENV            - Environment name (development/production)",
      );
      break;
  }
}
