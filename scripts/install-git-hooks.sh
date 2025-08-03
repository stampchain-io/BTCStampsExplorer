#!/bin/bash

# Git Hooks Installation Script for BTCStampsExplorer
# 
# This script installs Git hooks that enforce import pattern validation
# and other code quality checks before commits.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." &> /dev/null && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Installing Git hooks for BTCStampsExplorer..."
echo "Project root: $PROJECT_ROOT"

# Check if we're in a Git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Error: Not in a Git repository"
    exit 1
fi

# Check if pre-commit is available
if command -v pre-commit &> /dev/null; then
    echo "✅ pre-commit is available"
    
    # Install pre-commit hooks
    cd "$PROJECT_ROOT"
    pre-commit install
    echo "✅ Pre-commit hooks installed successfully"
    
    # Test the hooks
    echo "🧪 Testing pre-commit hooks..."
    if pre-commit run --all-files --verbose; then
        echo "✅ All pre-commit hooks passed"
    else
        echo "⚠️  Some pre-commit hooks failed - this is normal for initial setup"
        echo "   Run 'pre-commit run --all-files' to see details"
    fi
    
else
    echo "⚠️  pre-commit not found. Installing manual hooks..."
    
    # Create manual pre-commit hook
    cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# BTCStampsExplorer Pre-commit Hook
# Validates import patterns and code quality before commits

set -e

echo "🔍 Running pre-commit validation..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

# Run Deno format check
echo "📐 Checking code formatting..."
if ! deno fmt --check; then
    echo "❌ Code formatting issues found. Run 'deno fmt' to fix."
    exit 1
fi

# Run Deno lint
echo "🔍 Running linter..."
if ! deno lint --quiet; then
    echo "❌ Linting issues found. Fix the issues above."
    exit 1
fi

# Run import pattern validation
echo "📦 Validating import patterns..."
if ! deno task check:imports:ci; then
    echo "❌ Import pattern violations found. Fix the issues above."
    exit 1
fi

# Run type checking
echo "🔎 Checking TypeScript types..."
if ! deno check main.ts; then
    echo "❌ TypeScript type errors found. Fix the issues above."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
EOF

    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✅ Manual pre-commit hook installed"
fi

# Create commit message template
cat > "$PROJECT_ROOT/.gitmessage" << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Type: feat, fix, docs, style, refactor, test, chore
# Scope: component, service, api, ui, etc.
# Subject: imperative, present tense, lowercase, no period
#
# Examples:
# feat(stamps): add new stamp validation endpoint
# fix(api): resolve type error in SRC20 balance calculation
# docs(import): update import pattern guidelines
# refactor(types): migrate from $globals to domain imports
#
# For import pattern changes, reference the task:
# refactor(imports): migrate server services from $globals (task 28.4)
EOF

# Configure Git to use the message template
git config commit.template .gitmessage
echo "✅ Git commit message template configured"

# Create pre-push hook for additional validation
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# BTCStampsExplorer Pre-push Hook
# Additional validation before pushing to remote

set -e

echo "🚀 Running pre-push validation..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

# Run full validation suite
echo "🧪 Running full test suite..."
if ! deno task validate:ci; then
    echo "❌ Full validation failed. Fix issues before pushing."
    exit 1
fi

echo "✅ All pre-push checks passed!"
EOF

chmod +x "$HOOKS_DIR/pre-push"
echo "✅ Pre-push hook installed"

# Display installation summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🎉 Git Hooks Installation Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Installed hooks:"
echo "  ✅ pre-commit: Format, lint, import validation, type checking"
echo "  ✅ pre-push: Full validation suite including tests"
echo "  ✅ commit template: Structured commit messages"
echo ""
echo "Usage:"
echo "  • Hooks run automatically on commit/push"
echo "  • Skip hooks: git commit --no-verify (not recommended)"
echo "  • Test hooks: pre-commit run --all-files"
echo "  • Validate imports: deno task check:imports"
echo ""
echo "For more information, see docs/IMPORT_PATTERNS.md"
echo "═══════════════════════════════════════════════════════════════"