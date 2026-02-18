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
import json
import os
import sys
import subprocess
import re
from pathlib import Path

# Try to import yaml, provide fallback instructions if not available
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    yaml = None


def simple_yaml_load(content: str) -> dict:
    """
    Minimal YAML parser for Tachikoma config files.
    Handles basic structures: nested dicts, lists, comments.
    """
    lines = content.split('\n')
    result = {}
    stack = [(result, -1)]  # (current_dict, indent_level)
    current_list = None
    current_key = None

    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.lstrip()

        # Skip empty lines and comments
        if not stripped or stripped.startswith('#'):
            i += 1
            continue

        # Calculate indent
        indent = len(line) - len(stripped)

        # Pop stack to find correct level
        while len(stack) > 1 and indent <= stack[-1][1]:
            stack.pop()

        current_dict, _ = stack[-1]

        # Check if it's a list item
        if stripped.startswith('- '):
            item = stripped[2:].strip()

            # Remove inline comments from list items
            if '#' in item:
                # Only remove if # is preceded by whitespace or at start
                hash_idx = item.find('#')
                if hash_idx > 0 and item[hash_idx-1] in ' \t':
                    item = item[:hash_idx].rstrip()
                elif hash_idx == 0:
                    i += 1
                    continue

            # If we haven't started a list, start one
            if current_key and not isinstance(current_dict.get(current_key), list):
                current_dict[current_key] = []
                current_list = current_dict[current_key]

            # Check if item has a key: value
            if ':' in item:
                key, val = item.split(':', 1)
                key = key.strip()
                val = val.strip()

                # Remove inline comments from value
                if '#' in val:
                    hash_idx = val.find('#')
                    if hash_idx > 0 and val[hash_idx-1] in ' \t':
                        val = val[:hash_idx].rstrip()

                if not val:
                    # Nested dict in list
                    new_dict = {}
                    if current_list is not None:
                        current_list.append(new_dict)
                    stack.append((new_dict, indent))
                    i += 1
                    continue
                else:
                    # Simple key: value in list item
                    if current_list is not None:
                        current_list.append({key: val})
            else:
                # Simple list item
                if current_list is not None:
                    current_list.append(item)

        elif ':' in stripped:
            key, val = stripped.split(':', 1)
            key = key.strip()
            val = val.strip()

            # Remove inline comments
            if '#' in val:
                val = val[:val.index('#')].strip()

            current_key = key
            current_list = None

            if not val:
                # Could be a nested dict OR the start of a list
                # Look ahead to see what comes next
                next_indent = None
                for j in range(i + 1, min(i + 10, len(lines))):
                    next_line = lines[j].lstrip()
                    if next_line and not next_line.startswith('#'):
                        next_indent = len(lines[j]) - len(lines[j].lstrip())
                        break

                if next_indent is not None and next_indent > indent:
                    # Check if next line is a list item
                    next_stripped = lines[i + 1].lstrip() if i + 1 < len(lines) else ''
                    if next_stripped.startswith('- '):
                        # This will be a list, initialize empty list
                        current_dict[key] = []
                        current_list = current_dict[key]
                    else:
                        # Nested dict
                        current_dict[key] = {}
                        stack.append((current_dict[key], indent))
                else:
                    # Empty value, treat as null
                    current_dict[key] = None
            elif val.startswith('[') and val.endswith(']'):
                # Inline list
                items = [v.strip().strip('"\'') for v in val[1:-1].split(',')]
                current_dict[key] = items
            elif val.startswith('"') and val.endswith('"'):
                current_dict[key] = val[1:-1]
            elif val.startswith("'") and val.endswith("'"):
                current_dict[key] = val[1:-1]
            elif val.lower() == 'true':
                current_dict[key] = True
            elif val.lower() == 'false':
                current_dict[key] = False
            else:
                try:
                    # Try int
                    current_dict[key] = int(val)
                except ValueError:
                    try:
                        # Try float
                        current_dict[key] = float(val)
                    except ValueError:
                        # String
                        current_dict[key] = val

        i += 1

    return result

# Base directories
SCRIPT_DIR = Path(__file__).parent
OPENCODE_DIR = SCRIPT_DIR.parent.parent
CONTEXT_DIR = OPENCODE_DIR / ".opencode" / "context"
CONFIG_DIR = OPENCODE_DIR / ".opencode" / "config"
SKILLS_DIR = OPENCODE_DIR / ".opencode" / "skills"


class Colors:
    """ANSI colors for terminal output - ASCII safe for Windows"""
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    CYAN = '\033[0;36m'
    MAGENTA = '\033[0;35m'
    NC = '\033[0m'  # No Color
    
    # ASCII-safe symbols for Windows compatibility
    CHECK = '[+]'
    WARNING = '[!]'
    ERROR = '[x]'
    ARROW = '->'


def print_header(text):
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}{text}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}")


def print_success(text):
    print(f"{Colors.GREEN}{Colors.CHECK}{Colors.NC} {text}")


def print_warning(text):
    print(f"{Colors.YELLOW}{Colors.WARNING}{Colors.NC} {text}")


def print_error(text):
    print(f"{Colors.RED}{Colors.ERROR}{Colors.NC} {text}")


# =============================================================================
# INTENT CLASSIFICATION
# =============================================================================

def classify_intent(query: str) -> dict:
    """
    Classify user intent using fast_heuristic.py script.
    Returns structured classification result.
    """
    heuristic_script = SKILLS_DIR / "intent-classifier" / "scripts" / "fast_heuristic.py"
    
    if not heuristic_script.exists():
        return {
            "error": "fast_heuristic.py not found",
            "fallback": "llm"
        }
    
    try:
        result = subprocess.run(
            [sys.executable, str(heuristic_script), query, "--json"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=str(OPENCODE_DIR)
        )
        
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            return {
                "error": result.stderr,
                "fallback": "llm"
            }
    except Exception as e:
        return {
            "error": str(e),
            "fallback": "llm"
        }


def cmd_classify(args):
    """CLI command: classify intent"""
    if not args.query:
        print_error("Query required")
        print("Usage: router.py classify \"fix the bug in auth\"")
        return 1
    
    result = classify_intent(args.query)
    
    print_header(f"INTENT CLASSIFICATION: \"{args.query}\"")
    print()
    
    if "error" in result:
        print_error(f"Classification failed: {result['error']}")
        print(f"Falling back to LLM reasoning")
        return 1
    
    # Display results
    intent = result.get("intent", "unknown")
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

def load_routes() -> dict:
    """Load intent-routes.yaml configuration"""
    routes_file = CONFIG_DIR / "intent-routes.yaml"

    if not routes_file.exists():
        print_error(f"Routes file not found: {routes_file}")
        return {}

    with open(routes_file, encoding='utf-8') as f:
        content = f.read()

    if YAML_AVAILABLE:
        return yaml.safe_load(content)
    else:
        return simple_yaml_load(content)


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


def cmd_route(args):
    """CLI command: show route for intent"""
    if args.list:
        # List all routes
        routes = load_routes()
        print_header("AVAILABLE ROUTES")
        
        for name, config in routes.get("routes", {}).items():
            skill = config.get("skill", config.get("subagent", "none"))
            invoke = config.get("invoke_via", "unknown")
            desc = config.get("description", "")
            print(f"  {Colors.CYAN}{name:15}{Colors.NC} -> {skill:25} ({invoke})")
            if desc:
                print(f"                      {desc}")
            print()
        return 0
    
    if not args.intent:
        # List all routes
        routes = load_routes()
        print_header("AVAILABLE ROUTES")
        
        for name, config in routes.get("routes", {}).items():
            skill = config.get("skill", config.get("subagent", "none"))
            invoke = config.get("invoke_via", "unknown")
            desc = config.get("description", "")
            print(f"  {Colors.CYAN}{name:15}{Colors.NC} → {skill:25} ({invoke})")
            if desc:
                print(f"                      {desc}")
            print()
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
        size_str = f"{size/1024:.1f}K" if size > 1024 else f"{size}B"
        print(f"  {Colors.CYAN}{f.name:40}{Colors.NC} {size_str}")
    
    print()
    print_success(f"Discovery complete")
    return 0


def context_status():
    """Show context system status"""
    print_header("CONTEXT SYSTEM STATUS")
    
    if CONTEXT_DIR.exists():
        files = list(CONTEXT_DIR.glob("*.md"))
        total_size = sum(f.stat().st_size for f in files)
        print_success(f"Context directory: {len(files)} files ({total_size/1024:.1f}K)")
    else:
        print_error("Context directory not found")
    
    # Check for temporary files
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
    
    # Search across all context files
    import subprocess
    
    try:
        result = subprocess.run(
            ["grep", "-r", "-i", "-l", query, str(CONTEXT_DIR)],
            capture_output=True,
            text=True,
            timeout=10
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
        "Other (40+)": []
    }
    
    for f in CONTEXT_DIR.glob("*.md"):
        name = f.stem
        # Extract priority number
        match = re.match(r'^(\d+)', name)
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
        print("Usage: router.py full \"fix the bug in auth\"")
        return 1
    
    print_header(f"FULL ROUTING: \"{args.query}\"")
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
    route = get_route(intent)
    
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
            print(f"  {Colors.GREEN}{Colors.CHECK}{Colors.NC} {ctx} ({size/1024:.1f}K)")
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
            "skills_bulk": classification.get("skills_bulk", {}).get("name", "")
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
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # classify command
    classify_parser = subparsers.add_parser("classify", help="Classify intent from query")
    classify_parser.add_argument("query", nargs="?", help="Query to classify")
    
    # route command
    route_parser = subparsers.add_parser("route", help="Show route for intent")
    route_parser.add_argument("--list", "-l", action="store_true", help="List all routes")
    route_parser.add_argument("intent", nargs="?", help="Intent to look up")
    
    # context command
    context_parser = subparsers.add_parser("context", help="Context operations")
    context_parser.add_argument("--discover", action="store_true", help="Discover context files")
    context_parser.add_argument("--status", action="store_true", help="Show context status")
    context_parser.add_argument("--extract", metavar="QUERY", help="Extract info from context")
    context_parser.add_argument("--organize", action="store_true", help="Show context organization")
    
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
