#!/usr/bin/env python3
"""
Tachikoma CLI-First Router

This script provides CLI-based routing for Tachikoma, replacing LLM reasoning
with fast script-based lookups.

Usage:
    python router.py classify "fix the bug"
    python router.py route debug
    python router.py context discover
    python router.py full "fix the bug in auth"
"""

import argparse
import functools
import json
import re
import sys
from pathlib import Path

import yaml

# Base directories
SCRIPT_DIR = Path(__file__).parent
OPENCODE_DIR = SCRIPT_DIR.parent.parent
CONTEXT_DIR = OPENCODE_DIR / ".opencode" / "context-modules"
CONFIG_DIR = OPENCODE_DIR / ".opencode" / "agents" / "tachikoma" / "config"
SKILLS_DIR = OPENCODE_DIR / ".opencode" / "skills"


class Colors:
    """ANSI colors for terminal output - ASCII safe for Windows"""

    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    CYAN = "\033[0;36m"
    MAGENTA = "\033[0;35m"
    NC = "\033[0m"  # No Color

    # ASCII-safe symbols for Windows compatibility
    CHECK = "[+]"
    WARNING = "[!]"
    ERROR = "[x]"
    ARROW = "->"


def print_header(text):
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}")
    print(f"{Colors.BLUE}{text}{Colors.NC}")
    print(f"{Colors.BLUE}{'=' * 60}{Colors.NC}")


def print_success(text):
    print(f"{Colors.GREEN}{Colors.CHECK}{Colors.NC} {text}")


def print_warning(text):
    print(f"{Colors.YELLOW}{Colors.WARNING}{Colors.NC} {text}")


def print_error(text):
    print(f"{Colors.RED}{Colors.ERROR}{Colors.NC} {text}")


# =============================================================================
# INTENT CLASSIFICATION (reads from intent-routes.yaml)
# =============================================================================


def load_intent_keywords() -> dict:
    """Load intent keywords from intent-routes.yaml"""
    routes = load_routes()
    return routes.get("intent_keywords", {})


def classify_intent(query: str) -> dict:
    """
    Classify user intent by matching keywords from intent-routes.yaml.
    Returns structured classification result.
    """
    query_lower = query.lower().strip()
    keywords_map = load_intent_keywords()

    if not keywords_map:
        return {
            "intent": "unclear",
            "confidence": 0.3,
            "reasoning": "No intent keywords configured",
            "suggested_action": "llm",
            "keywords_matched": [],
            "alternative_intents": [],
            "workflow": {"needed": False},
            "skills_bulk": {"needed": False},
            "complexity": 0.0,
        }

    # Score each intent based on keyword matches
    scores = {}
    matched_keywords = {}

    for intent, keywords in keywords_map.items():
        matches = []
        for keyword in keywords:
            # Use word boundary matching for accuracy
            pattern = r"\b" + re.escape(keyword.lower()) + r"\b"
            if re.search(pattern, query_lower):
                matches.append(keyword)

        if matches:
            scores[intent] = len(matches)
            matched_keywords[intent] = matches

    if not scores:
        return {
            "intent": "unclear",
            "confidence": 0.3,
            "reasoning": "No keyword matches found",
            "suggested_action": "llm",
            "keywords_matched": [],
            "alternative_intents": [],
            "workflow": {"needed": False},
            "skills_bulk": {"needed": False},
            "complexity": detect_complexity(query),
        }

    # Sort by score
    sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary_intent = sorted_intents[0][0]
    primary_score = sorted_intents[0][1]

    # Calculate confidence
    total_score = sum(scores.values())
    confidence = min(primary_score / max(total_score, 1), 1.0)

    # Boost confidence if primary is significantly higher
    if len(sorted_intents) > 1:
        ratio = primary_score / max(sorted_intents[1][1], 1)
        if ratio > 2:
            confidence = min(confidence * 1.2, 1.0)

    # Determine action based on confidence
    if confidence >= 0.7:
        action = "skill"
    elif confidence >= 0.5:
        action = "llm"
    else:
        action = "llm"

    # Detect workflow/skills_bulk need
    workflow = detect_workflow_need(query)
    skills_bulk = detect_skills_bulk_need(query)

    if workflow:
        action = "workflow"
    elif skills_bulk:
        action = "skills_bulk"

    complexity = detect_complexity(query)

    return {
        "intent": primary_intent,
        "confidence": round(confidence, 2),
        "reasoning": f"Matched keywords: {', '.join(matched_keywords.get(primary_intent, []))}",
        "suggested_action": action,
        "keywords_matched": matched_keywords.get(primary_intent, []),
        "alternative_intents": [
            {"intent": intent, "score": score} for intent, score in sorted_intents[1:3]
        ],
        "workflow": workflow or {"needed": False},
        "skills_bulk": skills_bulk or {"needed": False},
        "complexity": round(complexity, 2),
    }


def detect_complexity(query: str) -> float:
    """Detect task complexity from query"""
    complexity = 0.0

    if len(query.split()) > 10:
        complexity += 0.2
    if len(query.split()) > 20:
        complexity += 0.1

    multi_step_patterns = [
        r"\band\b",
        r"\bthen\b",
        r"\bafter\b",
        r"\bbefore\b",
        r"\bfirst\b",
        r"\bnext\b",
        r"\bfinally\b",
    ]

    for pattern in multi_step_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            complexity += 0.15

    # High-stakes keywords
    if re.search(
        r"\b(secure|safe|critical|production|auth|payment)\b", query, re.IGNORECASE
    ):
        complexity += 0.2

    return min(complexity, 1.0)


def detect_workflow_need(query: str) -> dict:
    """Detect if query needs sequential workflow"""
    workflow_patterns = [
        (r"research.*implement", "research-implement"),
        (r"implement.*verify", "implement-verify"),
        (r"implement.*test", "implement-verify"),
        (r"security.*implement", "security-implement"),
        (r"review.*reflect", "deep-review"),
        # New patterns - feature development (more flexible)
        (r"add.*authentication", "complex-workflow"),
        (r"add.*oauth", "complex-workflow"),
        (r"implement\s+system", "complex-workflow"),
        (r"build\s+feature", "complex-workflow"),
        (r"create\s+new\s+feature", "complex-workflow"),
        # Quality/stages keywords
        (r"quality\s+checks", "complex-workflow"),
        (r"production-grade", "complex-workflow"),
        (r"with\s+validation", "complex-workflow"),
        (r"step\s+by\s+step", "complex-workflow"),
    ]

    query_lower = query.lower()
    for pattern, workflow_name in workflow_patterns:
        if re.search(pattern, query_lower):
            return {"needed": True, "name": workflow_name}

    return {"needed": False}


def detect_skills_bulk_need(query: str) -> dict:
    """Detect if query needs multiple skills at once"""
    bulk_indicators = [
        "thoroughly",
        "comprehensive",
        "full analysis",
        "multiple",
        "all angles",
        "deep dive",
    ]

    query_lower = query.lower()
    for indicator in bulk_indicators:
        if indicator in query_lower:
            return {"needed": True, "name": "full-stack"}

    return {"needed": False}


def cmd_classify(args):
    """CLI command: classify intent"""
    if not args.query:
        print_error("Query required")
        print('Usage: router.py classify "fix the bug in auth"')
        return 1

    result = classify_intent(args.query)

    print_header(f'INTENT CLASSIFICATION: "{args.query}"')
    print()

    if "error" in result:
        print_error(f"Classification failed: {result['error']}")
        print("Falling back to LLM reasoning")
        return 1

    # Display results
    intent = result.get("intent", "unclear")
    confidence = result.get("confidence", 0)
    action = result.get("suggested_action", "unknown")
    complexity = result.get("complexity", 0)
    keywords = result.get("keywords_matched", [])

    # Color-code confidence
    if confidence >= 0.8:
        conf_color = Colors.GREEN
    elif confidence >= 0.5:
        conf_color = Colors.YELLOW
    else:
        conf_color = Colors.RED

    print(f"  Intent:        {Colors.CYAN}{intent}{Colors.NC}")
    print(f"  Confidence:    {conf_color}{confidence:.0%}{Colors.NC}")
    print(f"  Action:        {action}")
    print(f"  Complexity:     {complexity:.0%}")
    print(f"  Keywords:      {', '.join(keywords) if keywords else 'none'}")

    # Workflow info
    if result.get("workflow", {}).get("needed"):
        wf = result["workflow"].get("name", [])
        print(f"  Workflow:   {Colors.MAGENTA}{wf}{Colors.NC}")

    # Skills bulk info
    if result.get("skills_bulk", {}).get("needed"):
        bulk = result["skills_bulk"].get("name", [])
        print(f"  Skills Bulk: {Colors.MAGENTA}{bulk}{Colors.NC}")

    # Alternatives
    alt_intents = result.get("alternative_intents", [])
    if alt_intents:
        print(f"  Alternatives:  {', '.join([a['intent'] for a in alt_intents])}")

    print()
    return 0


# =============================================================================
# ROUTE LOOKUP
# =============================================================================


@functools.lru_cache(maxsize=1)
def load_routes() -> dict:
    """Load intent-routes.yaml configuration"""
    routes_file = CONFIG_DIR / "intent-routes.yaml"

    if not routes_file.exists():
        print_error(f"Routes file not found: {routes_file}")
        return {}

    with open(routes_file, encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_route(intent: str) -> dict:
    """Get route configuration for an intent"""
    routes = load_routes()
    return routes.get("routes", {}).get(intent, {})


def get_workflow(workflow_name: str) -> dict:
    """Get workflow configuration (sequential execution)"""
    routes = load_routes()
    return routes.get("workflows", {}).get(workflow_name, {})


def get_skills_bulk(bulk_name: str) -> dict:
    """Get skills bulk configuration (all at once)"""
    routes = load_routes()
    return routes.get("skills_bulk", {}).get(bulk_name, {})


def _print_routes_list(routes: dict, title: str = "AVAILABLE ROUTES"):
    """Print formatted list of all routes"""
    print_header(title)

    for name, config in routes.get("routes", {}).items():
        skill = config.get("skill", config.get("subagent", "none"))
        invoke = config.get("invoke_via", "unknown")
        desc = config.get("description", "")
        print(f"  {Colors.CYAN}{name:15}{Colors.NC} -> {skill:25} ({invoke})")
        if desc:
            print(f"                      {desc}")
        print()


def cmd_route(args):
    """CLI command: show route for intent"""
    if args.list:
        # List all routes
        routes = load_routes()
        _print_routes_list(routes)
        return 0

    if not args.intent:
        # List all routes
        routes = load_routes()
        _print_routes_list(routes)
        return 0

    route = get_route(args.intent)

    print_header(f"ROUTE: {args.intent}")
    print()

    if not route:
        print_error(f"No route found for intent: {args.intent}")
        print("Use --list to see available routes")
        return 1

    # Display route info
    print(f"  Description:   {route.get('description', 'N/A')}")
    print(f"  Skill:         {route.get('skill', 'N/A')}")
    print(f"  Invoke via:    {route.get('invoke_via', 'N/A')}")
    print(f"  Strategy:      {route.get('strategy', 'N/A')}")
    print(f"  Confidence:   {route.get('confidence_threshold', 'N/A')}")

    # Context modules
    ctx_modules = route.get("context_modules", [])
    if ctx_modules:
        print(f"  Context:       {', '.join(ctx_modules)}")

    # Tools
    tools = route.get("tools", [])
    if tools:
        print(f"  Tools:         {', '.join(tools)}")

    print()
    return 0


# =============================================================================
# CONTEXT OPERATIONS
# =============================================================================


def cmd_context(args):
    """CLI command: context operations"""
    if args.discover:
        return context_discover()
    elif args.status:
        return context_status()
    elif args.extract:
        return context_extract(args.extract)
    elif args.organize:
        return context_organize()
    else:
        print("Usage: router.py context discover|status|extract|organize")
        return 1


def context_discover():
    """Discover context files"""
    print_header("CONTEXT DISCOVERY")

    if not CONTEXT_DIR.exists():
        print_error(f"Context directory not found: {CONTEXT_DIR}")
        return 1

    files = list(CONTEXT_DIR.glob("*.md"))

    if not files:
        print_warning("No context files found")
        return 0

    print(f"Found {len(files)} context files:")
    print()

    for f in sorted(files):
        size = f.stat().st_size
        size_str = f"{size / 1024:.1f}K" if size > 1024 else f"{size}B"
        print(f"  {Colors.CYAN}{f.name:40}{Colors.NC} {size_str}")

    print()
    print_success("Discovery complete")
    return 0


def context_status():
    """Show context system status"""
    print_header("CONTEXT SYSTEM STATUS")

    if CONTEXT_DIR.exists():
        files = list(CONTEXT_DIR.glob("*.md"))
        total_size = sum(f.stat().st_size for f in files)
        print_success(
            f"Context directory: {len(files)} files ({total_size / 1024:.1f}K)"
        )
    else:
        print_error("Context directory not found")

    tmp_dir = OPENCODE_DIR / ".tmp"
    if tmp_dir.exists():
        tmp_files = list(tmp_dir.rglob("*"))
        if tmp_files:
            print_warning(f"Temporary files: {len(tmp_files)} files")
            print("  Run: router.py context cleanup")

    print()
    return 0


def context_extract(query: str):
    """Extract info from context files"""
    print_header(f"CONTEXT EXTRACT: {query}")

    if not CONTEXT_DIR.exists():
        print_error("Context directory not found")
        return 1

    import subprocess

    try:
        result = subprocess.run(
            ["grep", "-r", "-i", "-l", query, str(CONTEXT_DIR)],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.stdout:
            files = result.stdout.strip().split("\n")
            print(f"Found in {len(files)} files:")
            for f in files:
                rel_path = Path(f).relative_to(OPENCODE_DIR)
                print(f"  {Colors.CYAN}{rel_path}{Colors.NC}")
            print()
        else:
            print_warning(f"No matches found for: {query}")
            return 1

    except Exception as e:
        print_error(f"Search failed: {e}")
        return 1

    return 0


def context_organize():
    """Show context organization"""
    print_header("CONTEXT ORGANIZATION")

    if not CONTEXT_DIR.exists():
        print_error("Context directory not found")
        return 1

    # Group by priority
    priorities = {
        "Core (0-9)": [],
        "Standards (10-19)": [],
        "Workflows (20-29)": [],
        "Methods (30-39)": [],
        "Other (40+)": [],
    }

    for f in CONTEXT_DIR.glob("*.md"):
        name = f.stem
        # Extract priority number
        match = re.match(r"^(\d+)", name)
        if match:
            priority = int(match.group(1))
            if priority < 10:
                priorities["Core (0-9)"].append(f.name)
            elif priority < 20:
                priorities["Standards (10-19)"].append(f.name)
            elif priority < 30:
                priorities["Workflows (20-29)"].append(f.name)
            elif priority < 40:
                priorities["Methods (30-39)"].append(f.name)
            else:
                priorities["Other (40+)"].append(f.name)
        else:
            priorities["Other (40+)"].append(f.name)

    for category, files in priorities.items():
        if files:
            print(f"{Colors.CYAN}{category}:{Colors.NC}")
            for f in sorted(files):
                print(f"  - {f}")
            print()

    return 0


# =============================================================================
# FULL ROUTING WORKFLOW
# =============================================================================


def cmd_full(args):
    """CLI command: full routing workflow (classify + route + context)"""
    if not args.query:
        print_error("Query required")
        print('Usage: router.py full "fix the bug in auth"')
        return 1

    print_header(f'FULL ROUTING: "{args.query}"')
    print()

    # Step 1: Classify intent
    print(f"{Colors.YELLOW}[1/3]{Colors.NC} Classifying intent...")
    classification = classify_intent(args.query)

    if "error" in classification:
        print_error(f"Classification failed: {classification['error']}")
        return 1

    intent = classification.get("intent", "unknown")
    confidence = classification.get("confidence", 0)

    print_success(f"Intent: {intent} (confidence: {confidence:.0%})")
    print()

    # Step 2: Get route
    print(f"{Colors.YELLOW}[2/3]{Colors.NC} Looking up route...")

    # Check if workflow is detected - use workflow route instead
    workflow = classification.get("workflow", {})
    if workflow.get("needed"):
        workflow_name = workflow.get("name", "")
        # Try to get workflow config, fallback to complex-workflow route
        wf_config = get_workflow(workflow_name)
        if wf_config:
            skills = wf_config.get("skills", [])
            if skills:
                intent = workflow_name
                route = get_route("complex-workflow")
                print_success(
                    f"Detected workflow: {workflow_name} -> using workflow-management"
                )
            else:
                route = get_route(intent)
        else:
            route = get_route("complex-workflow")
    else:
        route = get_route(intent)

    # Ensure route is always set
    if not route:
        print_error(f"No route found for intent: {intent}")
        # Try to find similar intent
        routes = load_routes().get("routes", {})
        print(f"Available intents: {', '.join(routes.keys())}")
        return 1

    skill = route.get("skill", route.get("subagent", "N/A"))
    invoke_via = route.get("invoke_via", "skill")

    print_success(f"Route: {skill} (via {invoke_via})")
    print()

    # Step 3: Show context modules
    print(f"{Colors.YELLOW}[3/3]{Colors.NC} Context modules to load:")
    ctx_modules = route.get("context_modules", [])
    for ctx in ctx_modules:
        ctx_file = CONTEXT_DIR / f"{ctx}.md"
        if ctx_file.exists():
            size = ctx_file.stat().st_size
            print(
                f"  {Colors.GREEN}{Colors.CHECK}{Colors.NC} {ctx} ({size / 1024:.1f}K)"
            )
        else:
            print(f"  {Colors.RED}{Colors.ERROR}{Colors.NC} {ctx} (NOT FOUND)")

    print()
    print_header("ROUTING DECISION")
    print()

    # Final summary
    print(f"  Query:         {args.query}")
    print(f"  Intent:        {Colors.CYAN}{intent}{Colors.NC}")
    print(f"  Confidence:   {confidence:.0%}")
    print(f"  Route to:     {Colors.GREEN}{skill}{Colors.NC}")
    print(f"  Invoke:       {invoke_via}")
    print(f"  Strategy:     {route.get('strategy', 'N/A')}")

    # Workflow?
    if classification.get("workflow", {}).get("needed"):
        wf = classification["workflow"].get("name", "")
        print(f"  Workflow:  {Colors.MAGENTA}{wf}{Colors.NC}")

    # Skills bulk?
    if classification.get("skills_bulk", {}).get("needed"):
        bulk = classification["skills_bulk"].get("name", "")
        print(f"  Skills Bulk: {Colors.MAGENTA}{bulk}{Colors.NC}")

    # Tools needed
    tools = route.get("tools", [])
    if tools:
        print(f"  Tools:        {', '.join(tools)}")

    print()

    # Output JSON for programmatic use
    if args.json:
        output = {
            "query": args.query,
            "intent": intent,
            "confidence": confidence,
            "route": skill,
            "invoke_via": invoke_via,
            "strategy": route.get("strategy"),
            "context_modules": ctx_modules,
            "tools": tools,
            "workflow": classification.get("workflow", {}).get("name", ""),
            "skills_bulk": classification.get("skills_bulk", {}).get("name", ""),
        }
        print(json.dumps(output, indent=2))

    return 0


# =============================================================================
# MAIN
# =============================================================================


def main():
    parser = argparse.ArgumentParser(
        description="Tachikoma CLI-First Router - Fast intent classification and routing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s classify "fix the bug"           Classify a query
  %(prog)s route debug                       Show route for intent
  %(prog)s route --list                      List all routes
  %(prog)s context discover                   Find context files
  %(prog)s context extract "naming"         Search context
  %(prog)s full "implement auth"            Full routing workflow
  %(prog)s full "add feature" --json         JSON output for scripts
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # classify command
    classify_parser = subparsers.add_parser(
        "classify", help="Classify intent from query"
    )
    classify_parser.add_argument("query", nargs="?", help="Query to classify")

    # route command
    route_parser = subparsers.add_parser("route", help="Show route for intent")
    route_parser.add_argument(
        "--list", "-l", action="store_true", help="List all routes"
    )
    route_parser.add_argument("intent", nargs="?", help="Intent to look up")

    # context command
    context_parser = subparsers.add_parser("context", help="Context operations")
    context_parser.add_argument(
        "--discover", action="store_true", help="Discover context files"
    )
    context_parser.add_argument(
        "--status", action="store_true", help="Show context status"
    )
    context_parser.add_argument(
        "--extract", metavar="QUERY", help="Extract info from context"
    )
    context_parser.add_argument(
        "--organize", action="store_true", help="Show context organization"
    )

    # full command
    full_parser = subparsers.add_parser("full", help="Full routing workflow")
    full_parser.add_argument("query", nargs="?", help="User query to route")
    full_parser.add_argument("--json", "-j", action="store_true", help="JSON output")

    args = parser.parse_args()

    # Default command
    if not args.command:
        parser.print_help()
        return 0

    # Route to command
    if args.command == "classify":
        return cmd_classify(args)
    elif args.command == "route":
        return cmd_route(args)
    elif args.command == "context":
        return cmd_context(args)
    elif args.command == "full":
        return cmd_full(args)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
