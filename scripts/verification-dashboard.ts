// Verification Dashboard and Monitoring System
// Purpose: Real-time verification dashboard and notification system
// Part of Task 40.6: Verification Dashboard and Monitoring

import { join } from "@std/path";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

export interface VerificationStatus {
  taskId: string;
  status: "pending" | "valid" | "invalid" | "in_progress";
  lastVerified: string;
  verificationScore: number;
  issues: string[];
  evidence: {
    codeChanges: boolean;
    testsPassing: boolean;
    documentationUpdated: boolean;
    gitCommits: number;
  };
}

export interface DashboardData {
  totalTasks: number;
  verifiedTasks: number;
  failedVerification: number;
  pendingVerification: number;
  verificationPercentage: number;
  recentActivity: VerificationActivity[];
  taskStatuses: VerificationStatus[];
}

export interface VerificationActivity {
  timestamp: string;
  taskId: string;
  action: "verified" | "failed" | "rollback" | "evidence_collected";
  details: string;
}

export class VerificationDashboard {
  private projectRoot: string;
  private dashboardDir: string;
  private port: number;

  constructor(projectRoot: string = Deno.cwd(), port: number = 8080) {
    this.projectRoot = projectRoot;
    this.dashboardDir = join(projectRoot, ".taskmaster", "dashboard");
    this.port = port;
  }

  async generateDashboardData(): Promise<DashboardData> {
    const tasksData = await this.loadTasksData();
    const verificationStatuses = await this.loadVerificationStatuses();
    const recentActivity = await this.loadRecentActivity();

    let totalTasks = 0;
    let verifiedTasks = 0;
    let failedVerification = 0;
    let pendingVerification = 0;

    // Count tasks and verification status
    for (const task of tasksData.tasks) {
      totalTasks++;
      
      const verification = verificationStatuses.find(
        (v: VerificationStatus) => v.taskId === task.id.toString()
      );

      if (verification) {
        switch (verification.status) {
          case "valid":
            verifiedTasks++;
            break;
          case "invalid":
            failedVerification++;
            break;
          case "pending":
          case "in_progress":
            pendingVerification++;
            break;
        }
      } else if (task.status === "done") {
        // Task is marked done but not verified - needs verification
        pendingVerification++;
      }
    }

    const verificationPercentage = totalTasks > 0 
      ? (verifiedTasks / totalTasks) * 100 
      : 0;

    return {
      totalTasks,
      verifiedTasks,
      failedVerification,
      pendingVerification,
      verificationPercentage,
      recentActivity,
      taskStatuses: verificationStatuses
    };
  }

  async startDashboardServer(): Promise<void> {
    console.log(`🚀 Starting Verification Dashboard on http://localhost:${this.port}`);

    const handler = async (request: Request): Promise<Response> => {
      const url = new URL(request.url);

      switch (url.pathname) {
        case "/":
          return new Response(await this.generateDashboardHTML(), {
            headers: { "content-type": "text/html" }
          });

        case "/api/dashboard":
          const dashboardData = await this.generateDashboardData();
          return Response.json(dashboardData);

        case "/api/verify-task":
          if (request.method === "POST") {
            const { taskId } = await request.json();
            const result = await this.verifyTask(taskId);
            return Response.json(result);
          }
          break;

        case "/api/rollback-task":
          if (request.method === "POST") {
            const { taskId, reason } = await request.json();
            const result = await this.initiateRollback(taskId, reason);
            return Response.json(result);
          }
          break;

        case "/static/style.css":
          return new Response(this.getDashboardCSS(), {
            headers: { "content-type": "text/css" }
          });
      }

      return new Response("Not Found", { status: 404 });
    };

    await serve(handler, { port: this.port });
  }

  private async generateDashboardHTML(): Promise<string> {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Verification Dashboard</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <div class="dashboard">
        <header>
            <h1>🔍 Task Verification Dashboard</h1>
            <div class="status-indicators">
                <div class="indicator verified">
                    <span class="count" id="verified-count">0</span>
                    <span class="label">Verified</span>
                </div>
                <div class="indicator failed">
                    <span class="count" id="failed-count">0</span>
                    <span class="label">Failed</span>
                </div>
                <div class="indicator pending">
                    <span class="count" id="pending-count">0</span>
                    <span class="label">Pending</span>
                </div>
            </div>
        </header>

        <main>
            <section class="progress-section">
                <h2>Verification Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">
                    <span id="progress-percentage">0%</span> verified
                </div>
            </section>

            <section class="tasks-section">
                <h2>Task Verification Status</h2>
                <div class="controls">
                    <button onclick="refreshData()" class="btn btn-primary">Refresh</button>
                    <button onclick="verifyAllPending()" class="btn btn-secondary">Verify All Pending</button>
                </div>
                <div class="task-list" id="task-list">
                    <!-- Tasks will be loaded here -->
                </div>
            </section>

            <section class="activity-section">
                <h2>Recent Activity</h2>
                <div class="activity-list" id="activity-list">
                    <!-- Activity will be loaded here -->
                </div>
            </section>
        </main>
    </div>

    <script>
        let dashboardData = null;

        async function loadDashboardData() {
            try {
                const response = await fetch('/api/dashboard');
                dashboardData = await response.json();
                updateDashboard();
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            }
        }

        function updateDashboard() {
            if (!dashboardData) return;

            // Update indicators
            document.getElementById('verified-count').textContent = dashboardData.verifiedTasks;
            document.getElementById('failed-count').textContent = dashboardData.failedVerification;
            document.getElementById('pending-count').textContent = dashboardData.pendingVerification;

            // Update progress bar
            const percentage = Math.round(dashboardData.verificationPercentage);
            document.getElementById('progress-fill').style.width = percentage + '%';
            document.getElementById('progress-percentage').textContent = percentage + '%';

            // Update task list
            updateTaskList();

            // Update activity list
            updateActivityList();
        }

        function updateTaskList() {
            const taskList = document.getElementById('task-list');
            taskList.innerHTML = '';

            dashboardData.taskStatuses.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-item ' + task.status;
                taskElement.innerHTML = \`
                    <div class="task-header">
                        <span class="task-id">Task \${task.taskId}</span>
                        <span class="task-status \${task.status}">\${task.status}</span>
                    </div>
                    <div class="task-details">
                        <div class="verification-score">Score: \${task.verificationScore}/100</div>
                        <div class="last-verified">Last verified: \${new Date(task.lastVerified).toLocaleString()}</div>
                    </div>
                    <div class="task-evidence">
                        <span class="evidence-item \${task.evidence.codeChanges ? 'true' : 'false'}">Code Changes</span>
                        <span class="evidence-item \${task.evidence.testsPassing ? 'true' : 'false'}">Tests Passing</span>
                        <span class="evidence-item \${task.evidence.documentationUpdated ? 'true' : 'false'}">Documentation</span>
                        <span class="evidence-item">Git Commits: \${task.evidence.gitCommits}</span>
                    </div>
                    <div class="task-actions">
                        <button onclick="verifyTask('\${task.taskId}')" class="btn btn-small btn-primary">Verify</button>
                        <button onclick="rollbackTask('\${task.taskId}')" class="btn btn-small btn-danger">Rollback</button>
                    </div>
                    \${task.issues.length > 0 ? \`
                    <div class="task-issues">
                        <strong>Issues:</strong>
                        <ul>
                            \${task.issues.map(issue => \`<li>\${issue}</li>\`).join('')}
                        </ul>
                    </div>
                    \` : ''}
                \`;
                taskList.appendChild(taskElement);
            });
        }

        function updateActivityList() {
            const activityList = document.getElementById('activity-list');
            activityList.innerHTML = '';

            dashboardData.recentActivity.slice(0, 10).forEach(activity => {
                const activityElement = document.createElement('div');
                activityElement.className = 'activity-item ' + activity.action;
                activityElement.innerHTML = \`
                    <div class="activity-time">\${new Date(activity.timestamp).toLocaleString()}</div>
                    <div class="activity-details">
                        <strong>Task \${activity.taskId}</strong>: \${activity.details}
                    </div>
                \`;
                activityList.appendChild(activityElement);
            });
        }

        async function verifyTask(taskId) {
            try {
                const response = await fetch('/api/verify-task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId })
                });
                const result = await response.json();
                
                if (result.success) {
                    alert(\`Task \${taskId} verification completed\`);
                    loadDashboardData();
                } else {
                    alert(\`Task \${taskId} verification failed: \${result.error}\`);
                }
            } catch (error) {
                alert('Verification request failed: ' + error.message);
            }
        }

        async function rollbackTask(taskId) {
            const reason = prompt(\`Enter reason for rolling back task \${taskId}:\`);
            if (!reason) return;

            try {
                const response = await fetch('/api/rollback-task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ taskId, reason })
                });
                const result = await response.json();
                
                if (result.success) {
                    alert(\`Task \${taskId} rollback initiated\`);
                    loadDashboardData();
                } else {
                    alert(\`Task \${taskId} rollback failed: \${result.error}\`);
                }
            } catch (error) {
                alert('Rollback request failed: ' + error.message);
            }
        }

        function refreshData() {
            loadDashboardData();
        }

        async function verifyAllPending() {
            if (!confirm('This will verify all pending tasks. Continue?')) return;
            
            // Implementation would iterate through pending tasks and verify them
            alert('Bulk verification not yet implemented');
        }

        // Auto-refresh every 30 seconds
        setInterval(loadDashboardData, 30000);

        // Initial load
        loadDashboardData();
    </script>
</body>
</html>
    `;
  }

  private getDashboardCSS(): string {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f5f5;
    color: #333;
}

.dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 {
    margin-bottom: 20px;
    color: #2563eb;
}

.status-indicators {
    display: flex;
    gap: 20px;
}

.indicator {
    text-align: center;
    padding: 15px;
    border-radius: 6px;
    min-width: 100px;
}

.indicator.verified { background: #dcfce7; color: #166534; }
.indicator.failed { background: #fef2f2; color: #dc2626; }
.indicator.pending { background: #fef3c7; color: #d97706; }

.count {
    display: block;
    font-size: 24px;
    font-weight: bold;
}

.label {
    font-size: 14px;
}

main {
    display: grid;
    gap: 20px;
}

section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
    margin-bottom: 15px;
    color: #374151;
}

.progress-bar {
    width: 100%;
    height: 20px;
    background: #e5e7eb;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
}

.progress-fill {
    height: 100%;
    background: #10b981;
    transition: width 0.3s ease;
}

.progress-text {
    text-align: center;
    font-weight: 500;
}

.controls {
    margin-bottom: 20px;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    margin-right: 10px;
}

.btn-primary { background: #2563eb; color: white; }
.btn-secondary { background: #6b7280; color: white; }
.btn-danger { background: #dc2626; color: white; }
.btn-small { padding: 4px 8px; font-size: 12px; }

.btn:hover {
    opacity: 0.9;
}

.task-list {
    display: grid;
    gap: 15px;
}

.task-item {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 15px;
}

.task-item.valid { border-left: 4px solid #10b981; }
.task-item.invalid { border-left: 4px solid #dc2626; }
.task-item.pending { border-left: 4px solid #d97706; }

.task-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.task-id {
    font-weight: 600;
}

.task-status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
}

.task-status.valid { background: #dcfce7; color: #166534; }
.task-status.invalid { background: #fef2f2; color: #dc2626; }
.task-status.pending { background: #fef3c7; color: #d97706; }

.task-details {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 14px;
    color: #6b7280;
}

.task-evidence {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.evidence-item {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 12px;
}

.evidence-item.true { background: #dcfce7; color: #166534; }
.evidence-item.false { background: #fef2f2; color: #dc2626; }

.task-actions {
    margin-top: 10px;
}

.task-issues {
    margin-top: 10px;
    padding: 10px;
    background: #fef2f2;
    border-radius: 4px;
}

.task-issues ul {
    margin-left: 20px;
    margin-top: 5px;
}

.activity-list {
    display: grid;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;
}

.activity-item {
    padding: 10px;
    border-radius: 4px;
    background: #f9fafb;
    border-left: 3px solid #6b7280;
}

.activity-item.verified { border-left-color: #10b981; }
.activity-item.failed { border-left-color: #dc2626; }
.activity-item.rollback { border-left-color: #d97706; }

.activity-time {
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 5px;
}
    `;
  }

  private async verifyTask(taskId: string): Promise<any> {
    try {
      // Import verification modules dynamically
      const { TaskVerifier } = await import("./task-verification.ts");
      const { EvidenceCollector } = await import("./evidence-collection.ts");

      // Collect evidence
      const evidenceCollector = new EvidenceCollector(this.projectRoot);
      const evidence = await evidenceCollector.collectTaskEvidence(
        taskId,
        "Dashboard verification request"
      );

      // Run verification
      const verifier = new TaskVerifier({
        taskId,
        type: "implementation",
        requiredChecks: ["fileExistence", "typeChecking", "linting", "formatting"]
      });

      const verificationResult = await verifier.verify();

      // Update verification status
      await this.updateVerificationStatus({
        taskId,
        status: verificationResult.passed ? "valid" : "invalid",
        lastVerified: new Date().toISOString(),
        verificationScore: verificationResult.passed ? 100 : 0,
        issues: verificationResult.details,
        evidence: {
          codeChanges: evidence.verificationResults.codeChanges,
          testsPassing: evidence.verificationResults.testsPassing,
          documentationUpdated: evidence.verificationResults.documentationUpdated,
          gitCommits: evidence.auditTrail.filter(item => item.includes("commit")).length
        }
      });

      // Log activity
      await this.logActivity({
        timestamp: new Date().toISOString(),
        taskId,
        action: verificationResult.passed ? "verified" : "failed",
        details: verificationResult.passed 
          ? "Task verification passed"
          : `Verification failed: ${verificationResult.failureReason || "Unknown error"}`
      });

      return { success: true, result: verificationResult };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async initiateRollback(taskId: string, reason: string): Promise<any> {
    try {
      // Import rollback module dynamically
      const { RollbackManager } = await import("./rollback-procedures.ts");

      const rollbackManager = new RollbackManager(this.projectRoot);
      const plan = await rollbackManager.createRollbackPlan(taskId, reason);
      const success = await rollbackManager.executeRollback(plan);

      // Log activity
      await this.logActivity({
        timestamp: new Date().toISOString(),
        taskId,
        action: "rollback",
        details: `Rollback ${success ? "completed" : "failed"}: ${reason}`
      });

      return { success, plan };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async loadTasksData(): Promise<any> {
    const tasksPath = join(this.projectRoot, ".taskmaster", "tasks", "tasks.json");
    const content = await Deno.readTextFile(tasksPath);
    return JSON.parse(content);
  }

  private async loadVerificationStatuses(): Promise<VerificationStatus[]> {
    const statusPath = join(this.dashboardDir, "verification-statuses.json");
    try {
      const content = await Deno.readTextFile(statusPath);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async loadRecentActivity(): Promise<VerificationActivity[]> {
    const activityPath = join(this.dashboardDir, "recent-activity.json");
    try {
      const content = await Deno.readTextFile(activityPath);
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async updateVerificationStatus(status: VerificationStatus): Promise<void> {
    await this.ensureDashboardDirectory();
    
    const statuses = await this.loadVerificationStatuses();
    const existingIndex = statuses.findIndex(s => s.taskId === status.taskId);
    
    if (existingIndex >= 0) {
      statuses[existingIndex] = status;
    } else {
      statuses.push(status);
    }

    const statusPath = join(this.dashboardDir, "verification-statuses.json");
    await Deno.writeTextFile(statusPath, JSON.stringify(statuses, null, 2));
  }

  private async logActivity(activity: VerificationActivity): Promise<void> {
    await this.ensureDashboardDirectory();
    
    const activities = await this.loadRecentActivity();
    activities.unshift(activity); // Add to beginning
    
    // Keep only last 100 activities
    const recentActivities = activities.slice(0, 100);

    const activityPath = join(this.dashboardDir, "recent-activity.json");
    await Deno.writeTextFile(activityPath, JSON.stringify(recentActivities, null, 2));
  }

  private async ensureDashboardDirectory(): Promise<void> {
    try {
      await Deno.mkdir(this.dashboardDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }
}

// CLI Entry Point
if (import.meta.main) {
  const command = Deno.args[0];
  const port = parseInt(Deno.args[1]) || 8080;

  if (command === "start") {
    const dashboard = new VerificationDashboard(Deno.cwd(), port);
    await dashboard.startDashboardServer();
  } else {
    console.error("Usage: deno run --allow-net --allow-read --allow-write scripts/verification-dashboard.ts start [port]");
    Deno.exit(1);
  }
}