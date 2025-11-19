// Physical Evidence Collection System
// Purpose: Comprehensive evidence collection and validation for task completions
// Part of Task 40.4: Physical Evidence Collection System

import { join } from "@std/path";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export interface EvidenceFile {
  path: string;
  type: "code" | "test" | "documentation" | "config" | "output";
  hash: string;
  timestamp: string;
  size: number;
}

export interface EvidenceReport {
  taskId: string;
  completionClaim: string;
  physicalEvidence: EvidenceFile[];
  verificationResults: {
    codeChanges: boolean;
    testsPassing: boolean;
    documentationUpdated: boolean;
    performanceImpact: boolean;
  };
  auditTrail: string[];
  timestamp: string;
}

export interface TaskCompletionEvidence {
  taskId: string;
  subtaskId?: string;
  claimedCompletion: string;
  requiredEvidence: string[];
  collectedEvidence: EvidenceFile[];
  validationStatus: "pending" | "valid" | "invalid" | "insufficient";
  verifierNotes: string[];
}

const EvidenceReportSchema = z.object({
  taskId: z.string(),
  completionClaim: z.string(),
  physicalEvidence: z.array(z.object({
    path: z.string(),
    type: z.enum(["code", "test", "documentation", "config", "output"]),
    hash: z.string(),
    timestamp: z.string(),
    size: z.number()
  })),
  verificationResults: z.object({
    codeChanges: z.boolean(),
    testsPassing: z.boolean(),
    documentationUpdated: z.boolean(),
    performanceImpact: z.boolean()
  }),
  auditTrail: z.array(z.string()),
  timestamp: z.string()
});

export class EvidenceCollector {
  private projectRoot: string;
  private evidenceDir: string;

  constructor(projectRoot: string = Deno.cwd()) {
    this.projectRoot = projectRoot;
    this.evidenceDir = join(projectRoot, ".taskmaster", "evidence");
  }

  async collectTaskEvidence(
    taskId: string,
    completionClaim: string
  ): Promise<EvidenceReport> {
    await this.ensureEvidenceDirectory();

    const evidence: EvidenceFile[] = [];
    const auditTrail: string[] = [];

    // Collect code changes evidence
    const codeEvidence = await this.collectCodeEvidence(taskId);
    evidence.push(...codeEvidence);
    auditTrail.push(`Collected ${codeEvidence.length} code evidence files`);

    // Collect test evidence
    const testEvidence = await this.collectTestEvidence(taskId);
    evidence.push(...testEvidence);
    auditTrail.push(`Collected ${testEvidence.length} test evidence files`);

    // Collect documentation evidence
    const docEvidence = await this.collectDocumentationEvidence(taskId);
    evidence.push(...docEvidence);
    auditTrail.push(`Collected ${docEvidence.length} documentation evidence files`);

    // Collect git commit evidence
    const gitEvidence = await this.collectGitEvidence(taskId);
    auditTrail.push(...gitEvidence);

    // Run verification checks
    const verificationResults = await this.runVerificationChecks(taskId);

    const report: EvidenceReport = {
      taskId,
      completionClaim,
      physicalEvidence: evidence,
      verificationResults,
      auditTrail,
      timestamp: new Date().toISOString()
    };

    // Save evidence report
    await this.saveEvidenceReport(report);

    return EvidenceReportSchema.parse(report);
  }

  private async collectCodeEvidence(taskId: string): Promise<EvidenceFile[]> {
    const evidence: EvidenceFile[] = [];

    // Look for recently modified TypeScript files
    const searchPaths = [
      "lib/types",
      "components",
      "islands",
      "routes",
      "server",
      "scripts"
    ];

    for (const searchPath of searchPaths) {
      const fullPath = join(this.projectRoot, searchPath);
      try {
        for await (const entry of Deno.readDir(fullPath)) {
          if (entry.isFile && entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
            const filePath = join(fullPath, entry.name);
            const stat = await Deno.stat(filePath);
            
            // Check if file was modified in last 7 days (evidence of recent work)
            const daysSinceModified = (Date.now() - stat.mtime!.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceModified <= 7) {
              const fileContent = await Deno.readTextFile(filePath);
              const hash = await this.calculateHash(fileContent);
              
              evidence.push({
                path: filePath,
                type: "code",
                hash,
                timestamp: stat.mtime!.toISOString(),
                size: stat.size
              });
            }
          }
        }
      } catch {
        // Directory might not exist, continue
      }
    }

    return evidence;
  }

  private async collectTestEvidence(taskId: string): Promise<EvidenceFile[]> {
    const evidence: EvidenceFile[] = [];

    const testPaths = ["tests", "test"];
    
    for (const testPath of testPaths) {
      const fullPath = join(this.projectRoot, testPath);
      try {
        for await (const entry of Deno.readDir(fullPath)) {
          if (entry.isFile && entry.name.endsWith(".test.ts")) {
            const filePath = join(fullPath, entry.name);
            const stat = await Deno.stat(filePath);
            const fileContent = await Deno.readTextFile(filePath);
            const hash = await this.calculateHash(fileContent);
            
            evidence.push({
              path: filePath,
              type: "test",
              hash,
              timestamp: stat.mtime!.toISOString(),
              size: stat.size
            });
          }
        }
      } catch {
        // Directory might not exist, continue
      }
    }

    // Collect test output evidence
    try {
      const testOutput = await this.runCommand("deno", ["test", "--reporter=json"]);
      const testOutputPath = join(this.evidenceDir, `test-output-${taskId}.json`);
      await Deno.writeTextFile(testOutputPath, testOutput);
      
      evidence.push({
        path: testOutputPath,
        type: "output",
        hash: await this.calculateHash(testOutput),
        timestamp: new Date().toISOString(),
        size: testOutput.length
      });
    } catch {
      // Test execution might fail, continue
    }

    return evidence;
  }

  private async collectDocumentationEvidence(taskId: string): Promise<EvidenceFile[]> {
    const evidence: EvidenceFile[] = [];

    // Look for documentation files
    const docPaths = [
      ".taskmaster/tasks",
      "docs",
      "README.md",
      "CLAUDE.md"
    ];

    for (const docPath of docPaths) {
      const fullPath = join(this.projectRoot, docPath);
      try {
        const stat = await Deno.stat(fullPath);
        
        if (stat.isFile && (docPath.endsWith(".md") || docPath.endsWith(".txt"))) {
          const fileContent = await Deno.readTextFile(fullPath);
          const hash = await this.calculateHash(fileContent);
          
          evidence.push({
            path: fullPath,
            type: "documentation",
            hash,
            timestamp: stat.mtime!.toISOString(),
            size: stat.size
          });
        } else if (stat.isDirectory) {
          for await (const entry of Deno.readDir(fullPath)) {
            if (entry.isFile && (entry.name.endsWith(".md") || entry.name.endsWith(".txt"))) {
              const filePath = join(fullPath, entry.name);
              const fileStat = await Deno.stat(filePath);
              const fileContent = await Deno.readTextFile(filePath);
              const hash = await this.calculateHash(fileContent);
              
              evidence.push({
                path: filePath,
                type: "documentation",
                hash,
                timestamp: fileStat.mtime!.toISOString(),
                size: fileStat.size
              });
            }
          }
        }
      } catch {
        // Path might not exist, continue
      }
    }

    return evidence;
  }

  private async collectGitEvidence(taskId: string): Promise<string[]> {
    const auditTrail: string[] = [];

    try {
      // Get recent commits
      const recentCommits = await this.runCommand("git", [
        "log", 
        "--oneline", 
        "--since=7.days.ago",
        `--grep=${taskId}`
      ]);
      
      if (recentCommits.trim()) {
        auditTrail.push(`Found git commits related to task ${taskId}:`);
        auditTrail.push(recentCommits);
      }

      // Get current status
      const gitStatus = await this.runCommand("git", ["status", "--porcelain"]);
      if (gitStatus.trim()) {
        auditTrail.push("Current git status shows uncommitted changes:");
        auditTrail.push(gitStatus);
      }

      // Get diff stats
      const diffStats = await this.runCommand("git", ["diff", "--stat", "HEAD~10", "HEAD"]);
      if (diffStats.trim()) {
        auditTrail.push("Recent diff statistics:");
        auditTrail.push(diffStats);
      }

    } catch (error) {
      auditTrail.push(`Git evidence collection error: ${error.message}`);
    }

    return auditTrail;
  }

  private async runVerificationChecks(taskId: string) {
    return {
      codeChanges: await this.hasCodeChanges(),
      testsPassing: await this.areTestsPassing(),
      documentationUpdated: await this.isDocumentationUpdated(),
      performanceImpact: await this.hasPerformanceImpact()
    };
  }

  private async hasCodeChanges(): Promise<boolean> {
    try {
      const gitStatus = await this.runCommand("git", ["status", "--porcelain"]);
      return gitStatus.trim().length > 0;
    } catch {
      return false;
    }
  }

  private async areTestsPassing(): Promise<boolean> {
    try {
      const testResult = await this.runCommand("deno", ["test", "--quiet"]);
      return true; // If command succeeded, tests are passing
    } catch {
      return false;
    }
  }

  private async isDocumentationUpdated(): Promise<boolean> {
    // Check if task-related documentation exists
    try {
      const taskDocsPath = join(this.projectRoot, ".taskmaster", "tasks");
      const entries = [];
      for await (const entry of Deno.readDir(taskDocsPath)) {
        entries.push(entry);
      }
      return entries.length > 0;
    } catch {
      return false;
    }
  }

  private async hasPerformanceImpact(): Promise<boolean> {
    // Placeholder for performance impact analysis
    // Could check bundle size, compilation time, etc.
    return true;
  }

  private async ensureEvidenceDirectory(): Promise<void> {
    try {
      await Deno.mkdir(this.evidenceDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  }

  private async saveEvidenceReport(report: EvidenceReport): Promise<void> {
    const reportPath = join(this.evidenceDir, `evidence-${report.taskId}-${Date.now()}.json`);
    await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
  }

  private async calculateHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async runCommand(command: string, args: string[]): Promise<string> {
    const cmd = new Deno.Command(command, {
      args,
      stdout: "piped",
      stderr: "piped"
    });

    const { success, stdout, stderr } = await cmd.output();
    
    if (!success) {
      const errorOutput = new TextDecoder().decode(stderr);
      throw new Error(`Command failed: ${command} ${args.join(' ')}\n${errorOutput}`);
    }

    return new TextDecoder().decode(stdout);
  }
}

// Retrospective audit function for completed tasks
export async function auditCompletedTask(
  taskId: string,
  subtaskId?: string
): Promise<TaskCompletionEvidence> {
  const collector = new EvidenceCollector();
  const fullTaskId = subtaskId ? `${taskId}.${subtaskId}` : taskId;
  
  const evidence = await collector.collectTaskEvidence(
    fullTaskId,
    "Retrospective audit of completed task"
  );

  return {
    taskId: fullTaskId,
    subtaskId,
    claimedCompletion: "Task marked as complete in Task Master",
    requiredEvidence: [
      "Code changes",
      "Test coverage",
      "Documentation updates",
      "Git commit history"
    ],
    collectedEvidence: evidence.physicalEvidence,
    validationStatus: evidence.verificationResults.codeChanges &&
                     evidence.verificationResults.testsPassing &&
                     evidence.verificationResults.documentationUpdated
                     ? "valid" : "insufficient",
    verifierNotes: evidence.auditTrail
  };
}

// CLI Entry Point
if (import.meta.main) {
  const taskId = Deno.args[0];
  const subtaskId = Deno.args[1];

  if (!taskId) {
    console.error("Usage: deno run scripts/evidence-collection.ts <taskId> [subtaskId]");
    Deno.exit(1);
  }

  const evidence = await auditCompletedTask(taskId, subtaskId);
  console.log(JSON.stringify(evidence, null, 2));
  Deno.exit(evidence.validationStatus === "valid" ? 0 : 1);
}