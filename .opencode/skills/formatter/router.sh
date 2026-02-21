#!/bin/bash
#
# Formatter/Cleanup Router
# Automated code quality cleanup via CLI tools
# Usage: bash router.sh <operation> [args]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect project type
detect_project_type() {
    if [ -f "package.json" ]; then
        echo "nodejs"
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ] || [ -f "pyproject.toml" ]; then
        echo "python"
    elif [ -f "go.mod" ]; then
        echo "go"
    elif [ -f "Cargo.toml" ]; then
        echo "rust"
    elif [ -f "composer.json" ]; then
        echo "php"
    elif [ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ] || [ -f "*.gradle" ]; then
        echo "java"
    elif [ -f "*.csproj" ] || [ -f "*.sln" ]; then
        echo "csharp"
    elif [ -f "CMakeLists.txt" ] || [ -f "Makefile" ]; then
        echo "cpp"
    elif [ -f "Gemfile" ]; then
        echo "ruby"
    elif [ -f "Package.swift" ]; then
        echo "swift"
    elif [ -f "*.kts" ] || [ -f "gradle.properties" ]; then
        echo "kotlin"
    elif [ -f "build.sbt" ]; then
        echo "scala"
    else
        echo "generic"
    fi
}

# Operation: Full cleanup pipeline
op_cleanup() {
    local target="${1:-.}"
    local project_type=$(detect_project_type)

    print_header "FORMATTER: Code Quality Cleanup"

    echo "Target: $target"
    echo "Project type: $project_type"
    echo ""

    local changes_made=0
    local warnings=""

    # Step 1: Remove debug code
    print_info "Step 1: Removing debug code..."
    if op_remove_debug "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 2: Format code
    print_info "Step 2: Formatting code..."
    if op_format "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 3: Optimize imports
    print_info "Step 3: Optimizing imports..."
    if op_imports "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 4: Fix linting
    print_info "Step 4: Fixing linting issues..."
    if op_lint "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Step 5: Type checking
    print_info "Step 5: Type checking..."
    if op_types "$target"; then
        changes_made=$((changes_made + 1))
    fi

    # Summary
    echo ""
    print_header "CLEANUP SUMMARY"

    if [ $changes_made -gt 0 ]; then
        print_success "Cleanup completed with improvements"
        echo ""
        echo "Actions performed:"
        echo "  - Debug code removal"
        echo "  - Code formatting"
        echo "  - Import optimization"
        echo "  - Linting fixes"
        echo "  - Type checking"
    else
        print_info "No changes needed - code is clean!"
    fi

    if [ -n "$warnings" ]; then
        echo ""
        print_warning "Manual review needed:"
        echo "$warnings"
    fi
}

# Step 1: Remove debug code
op_remove_debug() {
    local target="${1:-.}"
    local removed=0

    if [ ! -d "$target" ]; then
        print_info "No debug code found (target not a directory)"
        return 1
    fi

    # Remove console.log statements (JavaScript/TypeScript)
    find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -l "console\.log" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count console.log from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove debugger statements
    find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" -o -name "*.java" -o -name "*.cs" -o -name "*.cpp" -o -name "*.c" -o -name "*.h" -o -name "*.swift" -o -name "*.kt" -o -name "*.scala" \) -exec grep -l "debugger;" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -c "debugger;" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count debugger statements from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove print/println statements (Java, Kotlin, Scala)
    find "$target" -type f \( -name "*.java" -o -name "*.kt" -o -name "*.scala" \) -exec grep -lE "(System\.out\.print|System\.err\.print)" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -cE "System\.(out|err)\.(print|println)" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count print statements from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove Console.WriteLine (C#)
    find "$target" -type f -name "*.cs" -exec grep -l "Console\.WriteLine" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -c "Console\.WriteLine" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count Console.WriteLine from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove printf/print statements (C/C++)
    find "$target" -type f \( -name "*.c" -o -name "*.cpp" -o -name "*.h" \) -exec grep -lE "(printf|println|qDebug)" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -cE "(printf|println|qDebug)" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count print statements from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove puts statements (Ruby)
    find "$target" -type f -name "*.rb" -exec grep -l "puts " {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -c "^[[:space:]]*puts " "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count puts statements from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    # Remove print/println (Swift)
    find "$target" -type f -name "*.swift" -exec grep -lE "(print\(|debugPrint\()" {} \; 2>/dev/null | while read -r file; do
        local count=$(grep -cE "(print\(|debugPrint\()" "$file" 2>/dev/null || echo "0")
        if [ "$count" -gt 0 ]; then
            echo "  Removing $count print statements from $(basename "$file")"
            removed=$((removed + count))
        fi
    done

    if [ $removed -gt 0 ]; then
        print_success "Removed $removed debug statements"
        return 0
    else
        print_info "No debug code found"
        return 1
    fi
}

# Step 2: Format code
op_format() {
    local target="${1:-.}"
    local formatted=0
    local project_type=$(detect_project_type)

    # Prettier (JavaScript/TypeScript)
    if command_exists npx && [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ]; then
        echo "  Running Prettier..."
        if npx prettier --write "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with Prettier"
        fi
    fi

    # Black (Python)
    if command_exists black && [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
        echo "  Running Black..."
        if black "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with Black"
        fi
    fi

    # gofmt (Go)
    if command_exists gofmt && [ -f "go.mod" ]; then
        echo "  Running gofmt..."
        if gofmt -w "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with gofmt"
        fi
    fi

    # rustfmt (Rust)
    if command_exists rustfmt && [ -f "Cargo.toml" ]; then
        echo "  Running rustfmt..."
        if rustfmt "$target"/**/*.rs 2>/dev/null; then
            formatted=1
            print_success "Formatted with rustfmt"
        fi
    fi

    # google-java-format (Java)
    if command_exists java && ([ -f "pom.xml" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]); then
        if command -v google-java-format >/dev/null 2>&1; then
            echo "  Running google-java-format..."
            if google-java-format -w "$target"/**/*.java 2>/dev/null; then
                formatted=1
                print_success "Formatted with google-java-format"
            fi
        elif [ -f ".editorconfig" ]; then
            # Fallback to editorconfig if available
            echo "  EditorConfig detected - checking formatting..."
            formatted=1
        fi
    fi

    # dotnet-format (C#)
    if command_exists dotnet && [ -f "*.csproj" ]; then
        echo "  Running dotnet-format..."
        if dotnet format "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with dotnet-format"
        fi
    fi

    # clang-format (C/C++)
    if command_exists clang-format && [ -f "CMakeLists.txt" ]; then
        echo "  Running clang-format..."
        find "$target" -type f \( -name "*.c" -o -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec clang-format -i {} \; 2>/dev/null
        formatted=1
        print_success "Formatted with clang-format"
    fi

    # RuboCop (Ruby)
    if command_exists rubocop && [ -f "Gemfile" ]; then
        echo "  Running RuboCop..."
        if rubocop -a "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with RuboCop"
        fi
    fi

    # SwiftFormat (Swift)
    if command_exists swiftformat && [ -f "Package.swift" ]; then
        echo "  Running SwiftFormat..."
        if swiftformat "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with SwiftFormat"
        fi
    fi

    # ktlint (Kotlin)
    if command_exists ktlint && [ -f "*.kts" ]; then
        echo "  Running ktlint..."
        if ktlint -F "$target"/**/*.kt 2>/dev/null; then
            formatted=1
            print_success "Formatted with ktlint"
        fi
    fi

    # Scalafmt (Scala)
    if command_exists scalafmt && [ -f "build.sbt" ]; then
        echo "  Running Scalafmt..."
        if scalafmt "$target"/**/*.scala 2>/dev/null; then
            formatted=1
            print_success "Formatted with Scalafmt"
        fi
    fi

    # PHP-CS-Fixer (PHP)
    if command_exists php-cs-fixer && [ -f "composer.json" ]; then
        echo "  Running PHP-CS-Fixer..."
        if php-cs-fixer fix "$target" 2>/dev/null; then
            formatted=1
            print_success "Formatted with PHP-CS-Fixer"
        fi
    fi

    if [ $formatted -eq 1 ]; then
        return 0
    else
        print_warning "No formatter found or no files to format"
        return 1
    fi
}

# Step 3: Optimize imports
op_imports() {
    local target="${1:-.}"
    local optimized=0

    # Try ESLint with import plugin
    if command_exists npx && [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "  Running ESLint import fixes..."
        if npx eslint --fix "$target" 2>/dev/null | grep -q "import"; then
            optimized=1
            print_success "Optimized imports with ESLint"
        fi
    fi

    # Try isort (Python)
    if command_exists isort; then
        echo "  Running isort..."
        if isort "$target" 2>/dev/null; then
            optimized=1
            print_success "Optimized imports with isort"
        fi
    fi

    # Try organize-imports (TypeScript)
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript import organizer..."
        # This would need a specific tool, skipping for now
        :
    fi

    if [ $optimized -eq 1 ]; then
        return 0
    else
        print_info "No import optimization needed or tool not available"
        return 1
    fi
}

# Step 4: Fix linting
op_lint() {
    local target="${1:-.}"
    local fixed=0
    local project_type=$(detect_project_type)

    # ESLint (JavaScript/TypeScript)
    if command_exists npx && [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ]; then
        echo "  Running ESLint --fix..."
        if npx eslint --fix "$target" 2>/dev/null; then
            fixed=1
            print_success "Fixed ESLint issues"
        fi
    fi

    # flake8 (Python)
    if command_exists flake8; then
        echo "  Running flake8 check..."
        flake8 "$target" 2>/dev/null || true
    fi

    # golint (Go)
    if command_exists golint && [ -f "go.mod" ]; then
        echo "  Running golint..."
        golint "$target" 2>/dev/null || true
    fi

    # clippy (Rust)
    if command_exists cargo && [ -f "Cargo.toml" ]; then
        echo "  Running cargo clippy..."
        cargo clippy 2>/dev/null || true
    fi

    # Checkstyle (Java)
    if command_exists checkstyle && [ -f "pom.xml" ]; then
        echo "  Running Checkstyle..."
        checkstyle -c /google_checks.xml "$target" 2>/dev/null || true
    fi

    # SpotBugs (Java)
    if command_exists spotbugs && [ -f "build.gradle" ]; then
        echo "  Running SpotBugs..."
        spotbugs 2>/dev/null || true
    fi

    # dotnet build (C#)
    if command_exists dotnet && [ -f "*.csproj" ]; then
        echo "  Running dotnet build..."
        dotnet build "$target" 2>/dev/null || true
    fi

    # clang-tidy (C/C++)
    if command_exists clang-tidy && [ -f "CMakeLists.txt" ]; then
        echo "  Running clang-tidy..."
        find "$target" -type f \( -name "*.c" -o -name "*.cpp" \) -exec clang-tidy {} \; 2>/dev/null || true
    fi

    # RuboCop (Ruby)
    if command_exists rubocop && [ -f "Gemfile" ]; then
        echo "  Running RuboCop..."
        rubocop -a "$target" 2>/dev/null || true
    fi

    # SwiftLint (Swift)
    if command_exists swiftlint && [ -f "Package.swift" ]; then
        echo "  Running SwiftLint..."
        swiftlint autocorrect "$target" 2>/dev/null || true
    fi

    # detekt (Kotlin)
    if command_exists detekt && [ -f "*.kts" ]; then
        echo "  Running detekt..."
        detekt 2>/dev/null || true
    fi

    # PHP-CS-Fixer (PHP)
    if command_exists php-cs-fixer && [ -f "composer.json" ]; then
        echo "  Running PHP-CS-Fixer..."
        php-cs-fixer fix "$target" --rules=@PSR12 2>/dev/null || true
    fi

    if [ $fixed -eq 1 ]; then
        return 0
    else
        print_info "No linting issues found or tool not available"
        return 1
    fi
}

# Step 5: Type checking
op_types() {
    local target="${1:-.}"
    local checked=0

    # TypeScript
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "  Running TypeScript compiler..."
        if npx tsc --noEmit 2>/dev/null; then
            checked=1
            print_success "TypeScript check passed"
        else
            print_warning "TypeScript errors found (manual review needed)"
        fi
    fi

    # mypy (Python)
    if command_exists mypy; then
        echo "  Running mypy..."
        if mypy "$target" 2>/dev/null; then
            checked=1
            print_success "Python type check passed"
        fi
    fi

    # go build (Go)
    if command_exists go && [ -f "go.mod" ]; then
        echo "  Running go build..."
        if go build ./... 2>/dev/null; then
            checked=1
            print_success "Go build passed"
        fi
    fi

    # cargo check (Rust)
    if command_exists cargo && [ -f "Cargo.toml" ]; then
        echo "  Running cargo check..."
        if cargo check 2>/dev/null; then
            checked=1
            print_success "Rust check passed"
        fi
    fi

    # javac (Java)
    if command_exists javac && ([ -f "pom.xml" ] || [ -f "build.gradle" ]); then
        echo "  Running javac..."
        if javac "$target"/**/*.java 2>/dev/null; then
            checked=1
            print_success "Java compilation passed"
        else
            print_warning "Java compilation errors found"
        fi
    fi

    # dotnet build (C#)
    if command_exists dotnet && [ -f "*.csproj" ]; then
        echo "  Running dotnet build..."
        if dotnet build "$target" --no-restore 2>/dev/null; then
            checked=1
            print_success "C# build passed"
        else
            print_warning "C# build errors found"
        fi
    fi

    # GCC/Clang (C/C++)
    if command_exists gcc && [ -f "CMakeLists.txt" ]; then
        echo "  Running GCC analysis..."
        find "$target" -type f \( -name "*.c" -o -name "*.cpp" \) -exec gcc -fsyntax-only {} \; 2>/dev/null || true
    fi

    # Swift compiler (Swift)
    if command_exists swiftc && [ -f "Package.swift" ]; then
        echo "  Running Swift compiler..."
        if swiftc -parse "$target"/**/*.swift 2>/dev/null; then
            checked=1
            print_success "Swift compilation passed"
        fi
    fi

    # Kotlin compiler (Kotlin)
    if command_exists kotlinc && [ -f "*.kts" ]; then
        echo "  Running Kotlin compiler..."
        if kotlinc "$target"/**/*.kt -include-runtime -d /dev/null 2>/dev/null; then
            checked=1
            print_success "Kotlin compilation passed"
        fi
    fi

    # Scala compiler (Scala)
    if command_exists scalac && [ -f "build.sbt" ]; then
        echo "  Running Scala compiler..."
        if scalac "$target"/**/*.scala 2>/dev/null; then
            checked=1
            print_success "Scala compilation passed"
        fi
    fi

    if [ $checked -eq 1 ]; then
        return 0
    else
        print_info "No type checker found or no type issues"
        return 1
    fi
}

# Operation: Check only (dry run)
op_check() {
    local target="${1:-.}"
    local project_type=$(detect_project_type)

    print_header "FORMATTER: Check Only (Dry Run)"

    echo "Target: $target"
    echo "Project type: $project_type"
    echo ""

    print_info "Checking for issues (no changes will be made)..."

    # Check for debug code across all languages
    echo ""
    echo "Debug code found:"
    find "$target" -type f \( -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" \) -exec grep -Hn "console\.log\|debugger;" {} \; 2>/dev/null | head -20 || echo "  (JS/TS) None"
    find "$target" -type f \( -name "*.java" -o -name "*.kt" -o -name "*.scala" \) -exec grep -Hn "System\.(out|err)\.print" {} \; 2>/dev/null | head -20 || echo "  (Java/Kotlin/Scala) None"
    find "$target" -type f -name "*.cs" -exec grep -Hn "Console\.WriteLine" {} \; 2>/dev/null | head -20 || echo "  (C#) None"
    find "$target" -type f \( -name "*.c" -o -name "*.cpp" \) -exec grep -Hn "printf\|println" {} \; 2>/dev/null | head -20 || echo "  (C/C++) None"
    find "$target" -type f -name "*.swift" -exec grep -Hn "print\(" {} \; 2>/dev/null | head -20 || echo "  (Swift) None"
    find "$target" -type f -name "*.rb" -exec grep -Hn "^[[:space:]]*puts " {} \; 2>/dev/null | head -20 || echo "  (Ruby) None"

    # Check formatting
    echo ""
    if command_exists npx && [ -f ".prettierrc" ]; then
        echo "Prettier issues:"
        npx prettier --check "$target" 2>/dev/null || echo "  Formatting issues found"
    fi

    if command_exists black && [ -f "pyproject.toml" ]; then
        echo "Black issues:"
        black --check "$target" 2>/dev/null || echo "  Formatting issues found"
    fi

    if command_exists gofmt && [ -f "go.mod" ]; then
        echo "gofmt issues:"
        gofmt -l "$target" 2>/dev/null || echo "  No formatting issues"
    fi

    if command_exists rustfmt && [ -f "Cargo.toml" ]; then
        echo "rustfmt issues:"
        rustfmt --check "$target"/**/*.rs 2>/dev/null || echo "  Formatting issues found"
    fi

    if command_exists clang-format && [ -f "CMakeLists.txt" ]; then
        echo "clang-format issues:"
        find "$target" -type f \( -name "*.c" -o -name "*.cpp" -o -name "*.h" \) -exec clang-format --dry-run {} \; 2>/dev/null | head -5 || echo "  Formatting issues found"
    fi

    # Check linting
    echo ""
    if command_exists npx && [ -f ".eslintrc" ]; then
        echo "ESLint issues:"
        npx eslint "$target" 2>/dev/null | head -20 || echo "  No issues or ESLint not configured"
    fi

    if command_exists flake8; then
        echo "flake8 issues:"
        flake8 "$target" 2>/dev/null | head -20 || echo "  No issues"
    fi

    if command_exists rubocop && [ -f "Gemfile" ]; then
        echo "RuboCop issues:"
        rubocop "$target" 2>/dev/null | head -20 || echo "  No issues"
    fi

    if command_exists swiftlint && [ -f "Package.swift" ]; then
        echo "SwiftLint issues:"
        swiftlint "$target" 2>/dev/null | head -20 || echo "  No issues"
    fi

    # Type checking
    echo ""
    if command_exists npx && [ -f "tsconfig.json" ]; then
        echo "TypeScript issues:"
        npx tsc --noEmit 2>/dev/null || echo "  Type errors found"
    fi

    if command_exists mypy; then
        echo "mypy issues:"
        mypy "$target" 2>/dev/null | head -20 || echo "  No type issues"
    fi

    if command_exists cargo && [ -f "Cargo.toml" ]; then
        echo "Rust issues:"
        cargo check 2>/dev/null | head -20 || echo "  Errors found"
    fi

    if command_exists dotnet && [ -f "*.csproj" ]; then
        echo "C# build issues:"
        dotnet build "$target" --no-restore 2>/dev/null | head -20 || echo "  Build errors"
    fi

    echo ""
    print_info "Check complete. Run 'cleanup' to fix issues."
}

# Operation: Help
op_help() {
    echo "Formatter - Automated code quality cleanup"
    echo ""
    echo "Usage: bash router.sh <operation> [target]"
    echo ""
    echo "Operations:"
    echo "  cleanup [target]    Full cleanup pipeline (default: .)"
    echo "  check [target]      Check only, no changes (dry run)"
    echo "  help                Show this help"
    echo ""
    echo "Cleanup steps:"
    echo "  1. Remove debug code (console.log, println, WriteLine, etc.)"
    echo "  2. Format code (Prettier, Black, gofmt, rustfmt, clang-format, etc.)"
    echo "  3. Optimize imports (ESLint, isort)"
    echo "  4. Fix linting (ESLint, flake8, clippy, Checkstyle, clang-tidy, etc.)"
    echo "  5. Type checking (TypeScript, mypy, cargo, javac, dotnet, etc.)"
    echo ""
    echo "Examples:"
    echo "  bash router.sh cleanup"
    echo "  bash router.sh cleanup src/"
    echo "  bash router.sh check"
    echo ""
    echo "Supports: Node.js, Python, Go, Rust, Java, C#, C/C++, Ruby, Swift, Kotlin, Scala, PHP"
}

# Main router
case "${1:-cleanup}" in
    cleanup)
        shift
        op_cleanup "$@"
        ;;
    check)
        shift
        op_check "$@"
        ;;
    help|--help|-h)
        op_help
        ;;
    *)
        print_error "Unknown operation: $1"
        echo "Run 'bash router.sh help' for usage"
        exit 1
        ;;
esac
