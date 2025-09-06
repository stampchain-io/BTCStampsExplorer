# 🚀 BTCStampsExplorer Development Workflow

## Overview
This document outlines the optimized development workflow for BTCStampsExplorer using Cursor's latest best practices and specialized AI agents.

## 🎯 Core Principles

### 1. Agent-Based Development
- **Project Architect**: Oversees overall architecture and coordinates agents
- **Specialized Agents**: Handle specific domains with deep expertise
- **Collaborative Workflow**: Agents work together for comprehensive solutions

### 2. Quality-First Approach
- **Type Safety**: Zero TypeScript errors as a baseline
- **Testing**: Comprehensive test coverage across all layers
- **Performance**: Optimized for scalability and user experience
- **Security**: OWASP compliance and best practices

### 3. Documentation-Driven Development
- **Living Documentation**: Keep docs updated with code changes
- **Decision Records**: Document architectural decisions
- **Pattern Consistency**: Follow established patterns

## 🔄 Development Workflow

### Phase 1: Planning & Architecture
```bash
# Start with Project Architect
@Project Architect: "Analyze requirements and create implementation plan"
```

**Steps:**
1. **Requirements Analysis**: Clarify objectives and constraints
2. **Architecture Review**: Assess impact on existing systems
3. **Agent Assignment**: Determine which specialized agents to involve
4. **Plan Creation**: Create detailed implementation roadmap

### Phase 2: Implementation
```bash
# Use specialized agents for implementation
@Type System Guardian: "Fix compilation errors in new feature"
@API Design Specialist: "Design new endpoint following OpenAPI standards"
@UI/UX Designer: "Create responsive component with accessibility"
```

**Implementation Guidelines:**
- **Small, Focused Changes**: Break complex tasks into manageable pieces
- **Type Safety First**: Fix TypeScript errors immediately
- **Pattern Consistency**: Follow established project patterns
- **Comprehensive Testing**: Add tests for all new functionality

### Phase 3: Quality Assurance
```bash
# Quality checks with specialized agents
@Testing Maestro: "Create comprehensive test suite for new feature"
@Security Sentinel: "Perform security review of new code"
@Performance Optimizer: "Optimize and benchmark new functionality"
```

**Quality Gates:**
- ✅ TypeScript compilation (0 errors)
- ✅ Unit test coverage (>80%)
- ✅ API contract validation
- ✅ Security scan passed
- ✅ Performance benchmarks met
- ✅ Accessibility compliance
- ✅ Cross-browser testing

### Phase 4: Deployment & Monitoring
```bash
# Final validation and deployment
@Performance Optimizer: "Monitor production performance metrics"
@Security Sentinel: "Enable security monitoring for new features"
```

## 🤖 Agent Usage Guide

### Project Architect
**When to use:**
- New feature planning
- Architecture decisions
- Cross-cutting concerns
- Project coordination

**Example prompts:**
```
"Design the architecture for real-time price updates"
"Plan the migration strategy for the new database schema"
"Coordinate the implementation of wallet integration"
```

### Type System Guardian
**When to use:**
- TypeScript compilation errors
- Type definition updates
- Interface consolidation
- Generic type constraints

**Example prompts:**
```
"Fix the 909 TypeScript errors in the codebase"
"Create proper type definitions for the SRC20 API responses"
"Resolve type conflicts between globals.d.ts and src20.d.ts"
```

### API Design Specialist
**When to use:**
- New API endpoint creation
- OpenAPI specification updates
- Response format standardization
- HTTP status code decisions

**Example prompts:**
```
"Design the SRC20 token search API following REST standards"
"Update OpenAPI schema for new pagination parameters"
"Implement proper error responses for the balance endpoint"
```

### Performance Optimizer
**When to use:**
- Performance bottlenecks identified
- Caching strategy implementation
- Database query optimization
- Frontend loading optimization

**Example prompts:**
```
"Optimize the SRC20 token list loading performance"
"Implement Redis caching for market data"
"Reduce bundle size and improve Lighthouse scores"
```

### Security Sentinel
**When to use:**
- New authentication features
- Data handling implementation
- External API integrations
- Security vulnerability assessments

**Example prompts:**
```
"Review wallet connection security implementation"
"Implement CSRF protection for transaction endpoints"
"Validate input sanitization for tick parameters"
```

### UI/UX Designer
**When to use:**
- Component creation and updates
- Responsive design implementation
- User flow optimization
- Accessibility improvements

**Example prompts:**
```
"Design the token trading interface with mobile optimization"
"Create accessible data visualization components"
"Implement responsive navigation for the block explorer"
```

### Testing Maestro
**When to use:**
- Test suite creation
- Quality assurance
- Performance testing
- Test coverage analysis

**Example prompts:**
```
"Create comprehensive tests for the SRC20 minting functionality"
"Implement API contract testing with Dredd"
"Set up performance regression testing"
```

## 📋 Task Management

### Todo System Integration
```typescript
// Use structured todo format for complex tasks
todo_write({
  merge: false,
  todos: [
    {
      content: "Fix critical TypeScript compilation errors",
      status: "in_progress",
      id: "fix-typescript-errors"
    },
    {
      content: "Implement comprehensive error handling",
      status: "pending",
      id: "error-handling"
    }
  ]
})
```

### Progress Tracking
- **Daily Standups**: Update todo status regularly
- **Milestone Planning**: Break large features into milestones
- **Quality Metrics**: Track key quality indicators
- **Performance Benchmarks**: Monitor against established baselines

## 🔧 Tool Integration

### Cursor Features Utilization
- **Include Project Structure**: Enable for better context
- **Ask Mode**: Use for planning and clarification
- **Composer**: Leverage for complex multi-step tasks
- **Inline Agents**: Reference specialized agents as needed

### Development Environment
```bash
# Optimized Deno tasks
deno task check          # Type and lint checking
deno task test          # Run test suites
deno task validate:schema # OpenAPI validation
deno task dredd         # API contract testing
```

## 📊 Quality Metrics

### Code Quality
- **TypeScript Errors**: Target 0 compilation errors
- **Test Coverage**: Maintain >80% coverage
- **Lint Compliance**: 100% lint rule adherence
- **Bundle Size**: Monitor and optimize

### Performance Metrics
- **API Response Time**: <500ms average
- **First Contentful Paint**: <1.5s
- **Lighthouse Score**: >90
- **Cache Hit Rate**: >80%

### Security Metrics
- **Vulnerability Scan**: Clean security reports
- **OWASP Compliance**: 100% top 10 coverage
- **Input Validation**: All user inputs validated
- **Error Information Leakage**: Zero sensitive data exposure

## 🚨 Emergency Procedures

### Critical Issues
1. **Type System Breakage**: Immediately invoke @Type System Guardian
2. **Security Vulnerability**: Engage @Security Sentinel with high priority
3. **Performance Degradation**: @Performance Optimizer for immediate triage
4. **API Contract Violations**: @API Design Specialist for schema fixes

### Rollback Procedures
- **Feature Flags**: Use for safe deployment
- **Gradual Rollout**: Monitor metrics during deployment
- **Quick Rollback**: Automated rollback procedures
- **Post-Mortem**: Document lessons learned

## 📚 Documentation Standards

### Code Documentation
- **JSDoc Comments**: All public APIs documented
- **Type Definitions**: Comprehensive interface documentation
- **Implementation Notes**: Complex logic explanations
- **Usage Examples**: Practical code examples

### Project Documentation
- **Architecture Decisions**: ADR (Architectural Decision Records)
- **API Documentation**: OpenAPI 3.0 specification
- **Development Guide**: This workflow document
- **Deployment Guide**: Infrastructure and deployment procedures

## 🔄 Continuous Improvement

### Regular Reviews
- **Code Quality Reviews**: Monthly code quality assessments
- **Performance Audits**: Quarterly performance reviews
- **Security Audits**: Regular security assessments
- **Process Improvements**: Workflow optimization

### Learning and Adaptation
- **Technology Updates**: Stay current with Deno/Fresh developments
- **Best Practice Adoption**: Incorporate new Cursor features
- **Team Feedback**: Regular process improvement discussions
- **Metric Analysis**: Data-driven workflow improvements

---

## 🎯 Quick Start Commands

```bash
# Initialize development environment
deno task check

# Start with critical fixes
@Type System Guardian: "Fix TypeScript compilation errors"

# Plan new features
@Project Architect: "Design implementation plan"

# Quality assurance
@Testing Maestro: "Run comprehensive test suite"
```

This workflow ensures consistent, high-quality development while leveraging the full power of Cursor's AI agents and modern development practices.
