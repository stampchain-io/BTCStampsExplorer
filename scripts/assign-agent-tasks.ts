#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * Agent Task Assignment Helper
 * Generates ready-to-send task assignments for agent swarm deployment
 */

interface AgentAssignment {
  agentName: string;
  errorTypes: string[];
  errorCount: number;
  priority: string;
  effort: string;
  fileFocus: string;
  instructions: string[];
  coordinationRules: string[];
  validation: string[];
}

class AgentTaskAssigner {

  getPhase2Assignments(): AgentAssignment[] {
    return [
      {
        agentName: "PROPERTY-AGENT",
        errorTypes: ["TS2339"],
        errorCount: 128,
        priority: "High Impact - Phase 2",
        effort: "3 hours",
        fileFocus: "components/**/*.tsx, islands/**/*.tsx",
        instructions: [
          "Focus ONLY on TS2339 'Property does not exist' errors in component and island files",
          "Run monitoring script: deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts",
          "Typical fixes: Add missing property definitions, import missing types, fix exactOptionalPropertyTypes",
          "Update component prop types and interface definitions"
        ],
        coordinationRules: [
          "Work in components/ and islands/ directories only",
          "Avoid lib/types/ files (other agents handle those)",
          "Report progress every 25% (32, 64, 96, 128 errors fixed)",
          "Update Taskmaster subtask 43.15 when complete"
        ],
        validation: [
          "Run: deno check on files you modify",
          "Ensure no new errors introduced",
          "Final check: total TS2339 count should decrease"
        ]
      },
      {
        agentName: "ASSIGNMENT-AGENT",
        errorTypes: ["TS2322"],
        errorCount: 152,
        priority: "High Impact - Phase 2",
        effort: "3 hours",
        fileFocus: "lib/**/*.ts, server/**/*.ts (excluding lib/types/)",
        instructions: [
          "Focus ONLY on TS2322 'Type assignment' errors in lib and server files",
          "Run monitoring script: deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts",
          "Typical fixes: Fix type mismatches, correct variable annotations, update interface implementations",
          "Fix generic type parameters and function return types"
        ],
        coordinationRules: [
          "Work in lib/ and server/ directories (avoid lib/types/)",
          "Stay away from components/islands (property-agent handles those)",
          "Report progress every 25% (38, 76, 114, 152 errors fixed)",
          "Update Taskmaster subtask 43.16 when complete"
        ],
        validation: [
          "Run: deno check on files you modify",
          "Ensure no new errors introduced",
          "Final check: total TS2322 count should decrease"
        ]
      },
      {
        agentName: "CLEANUP-AGENT",
        errorTypes: ["TS6133", "TS6196"],
        errorCount: 43,
        priority: "High Impact - Phase 2",
        effort: "1 hour",
        fileFocus: "**/*.ts, **/*.tsx (all files)",
        instructions: [
          "Focus ONLY on TS6133 and TS6196 'Unused variable/import' errors across all files",
          "Run monitoring script: deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts",
          "Typical fixes: Remove unused imports, unused variables, unused function parameters",
          "Clean up dead code - this is safe cleanup work"
        ],
        coordinationRules: [
          "Can work in any file (these are safe cleanup operations)",
          "Just remove unused code - don't modify logic",
          "Report progress every 25% (11, 22, 32, 43 errors fixed)",
          "This is the fastest task - should complete in 1 hour"
        ],
        validation: [
          "Run: deno check on files you modify",
          "Ensure functionality still works after cleanup",
          "Final check: total TS6133/6196 count should reach 0"
        ]
      }
    ];
  }

  generateAssignmentText(assignment: AgentAssignment): string {
    const progressMilestones = this.calculateProgressMilestones(assignment.errorCount);

    return `
🎯 TASK ASSIGNMENT: ${assignment.agentName}

TARGET: ${assignment.errorCount} ${assignment.errorTypes.join(", ")} errors
PRIORITY: ${assignment.priority}
ESTIMATED EFFORT: ${assignment.effort}
FILE FOCUS: ${assignment.fileFocus}

📋 SPECIFIC INSTRUCTIONS:
${assignment.instructions.map((instr, i) => `${i + 1}. ${instr}`).join('\n')}

🤝 COORDINATION RULES:
${assignment.coordinationRules.map(rule => `• ${rule}`).join('\n')}

✅ VALIDATION:
${assignment.validation.map(val => `• ${val}`).join('\n')}

📊 PROGRESS REPORTING:
Report progress at: ${progressMilestones.join(', ')} errors fixed

🚀 START IMMEDIATELY - You can work in parallel with other agents!

═══════════════════════════════════════════════════════════
`;
  }

  private calculateProgressMilestones(total: number): string[] {
    const quarter = Math.floor(total / 4);
    return [
      `${quarter}`,
      `${quarter * 2}`,
      `${quarter * 3}`,
      `${total}`
    ];
  }

  async generateAllAssignments(): Promise<void> {
    console.log('🤖 AGENT TASK ASSIGNMENT GENERATOR');
    console.log('═'.repeat(60));
    console.log('\n📊 PHASE 2 DEPLOYMENT: 3 AGENTS IN PARALLEL');
    console.log('Current Status: 692 TypeScript errors → Target: ~350 errors after Phase 2\n');

    const assignments = this.getPhase2Assignments();

    assignments.forEach((assignment, index) => {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`📋 ASSIGNMENT ${index + 1}/3:`);
      console.log(this.generateAssignmentText(assignment));
    });

    console.log('\n🚀 DEPLOYMENT COMMANDS:');
    console.log('═'.repeat(60));
    console.log(`
# Start monitoring (keep running in dedicated terminal)
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts --watch

# Quick status check (any agent can run)
deno run --allow-run --allow-read --allow-write scripts/type-error-monitor.ts

# Validate total progress (should decrease from 692)
deno check main.ts 2>&1 | grep -c "ERROR"
`);

    console.log('\n✅ COPY THE ASSIGNMENTS ABOVE AND SEND TO YOUR AGENTS!');
    console.log('Expected completion: 3 hours for Phase 2 (parallel execution)');
  }

  async saveAssignmentsToFile(): Promise<void> {
    const assignments = this.getPhase2Assignments();
    let content = `# 🤖 Phase 2 Agent Task Assignments\n\n`;
    content += `**Status**: 692 TypeScript errors → Target: ~350 after Phase 2\n`;
    content += `**Timeline**: 3 hours (parallel execution)\n\n`;

    assignments.forEach((assignment, index) => {
      content += `## Assignment ${index + 1}: ${assignment.agentName}\n\n`;
      content += this.generateAssignmentText(assignment);
      content += `\n---\n\n`;
    });

    await Deno.writeTextFile('PHASE_2_ASSIGNMENTS.md', content);
    console.log('\n💾 Assignments saved to: PHASE_2_ASSIGNMENTS.md');
  }
}

// CLI Interface
if (import.meta.main) {
  const assigner = new AgentTaskAssigner();

  const args = Deno.args;
  if (args.includes('--save')) {
    await assigner.saveAssignmentsToFile();
  } else {
    await assigner.generateAllAssignments();
  }
}

export { AgentTaskAssigner };
