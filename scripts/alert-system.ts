import type { AlertContext } from "$types/ui.d.ts";
import type { AlertContext } from "$types/ui.d.ts";
import type { AlertState } from "$types/ui.d.ts";
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


interface NotificationChannel {
  name: string;
  enabled: boolean;
  send: (alert: Alert, context: AlertContext) => Promise<boolean>;
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
