#!/usr/bin/env python3
"""
Fast Intent Heuristic - Fast intent classification without LLM calls.

Key insight: Many intents can be classified with simple heuristics, saving LLM calls.
Use this first, then escalate to LLM only when needed.

Usage:
    python fast_heuristic.py "fix the bug in auth"
    python fast_heuristic.py --query "add feature" --json
"""

import argparse
import json
import re
import sys
from typing import Dict, List, Optional, Tuple


# Keyword patterns for each intent
INTENT_PATTERNS = {
    "debug": {
        "keywords": ["fix", "bug", "error", "issue", "broken", "not working", 
                    "fails", "crash", "exception", "wrong", "incorrect", "fail",
                    "debug", "troubleshoot", "problem", "solve"],
        "weight": 1.0
    },
    "implement": {
        "keywords": ["add", "create", "build", "write", "implement", "develop",
                     "code", "make", "generate", "produce", "new", "feature",
                     "component", "function", "class", "module"],
        "weight": 1.0
    },
    "review": {
        "keywords": ["review", "analyze", "audit", "check", "inspect", 
                    "evaluate", "assess", "critique", "examine", "look at",
                    "assess", "quality", "security", "performance"],
        "weight": 1.0
    },
    "research": {
        "keywords": ["find", "search", "lookup", "investigate", "research",
                     "explore", "discover", "learn", "understand", "how to",
                     "what is", "explain", "document", "docs", "what does",
                     "what are", "why does"],
        "weight": 1.0
    },
    "git": {
        "keywords": ["commit", "push", "pull", "merge", "branch", "pr", 
                    "pull request", "diff", "status", "log", "revert", 
                    "stash", "checkout", "reset", "tag", "release"],
        "weight": 1.5
    },
    "document": {
        "keywords": ["document", "doc", "readme", "write docs", "comment",
                     "explain", "describe", "tutorial", "guide", "wiki",
                     "spec", "specification", "api doc"],
        "weight": 1.0
    },
    "complex": {
        "keywords": ["entire", "all files", "whole codebase", "bulk", 
                    "refactor everything", "migrate all", "large", "comprehensive"],
        "weight": 1.2
    }
}


def normalize_query(query: str) -> str:
    return query.lower().strip()


def count_keyword_matches(query: str, keywords: List[str]) -> Tuple[int, List[str]]:
    query_lower = normalize_query(query)
    matches = []
    
    for keyword in keywords:
        pattern = r'\b' + re.escape(keyword) + r'\b'
        if re.search(pattern, query_lower):
            matches.append(keyword)
    
    return len(matches), matches


def detect_complexity(query: str) -> float:
    complexity = 0.0
    
    if len(query.split()) > 10:
        complexity += 0.2
    if len(query.split()) > 20:
        complexity += 0.1
    
    multi_step_patterns = [
        r'\band\b', r'\bthen\b', r'\bafter\b', r'\bbefore\b',
        r'\bfirst\b', r'\bnext\b', r'\bfinally\b',
    ]
    
    for pattern in multi_step_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            complexity += 0.15
    
    if re.search(r'\b(secure|safe|critical|production|money|payment|auth)/i', query):
        complexity += 0.2
    
    if re.search(r'\b(thing|stuff|something|anything)/i', query):
        complexity += 0.2
    
    return min(complexity, 1.0)


def detect_skill_chain_need(query: str) -> Optional[Dict]:
    query_lower = normalize_query(query)
    
    if re.search(r'\bresearch\b.*\b(implement|add|create|build)/i', query_lower):
        return {
            "needed": True,
            "chain": ["research-agent", "code-agent"],
            "reason": "Explicit research-then-implement"
        }
    
    if re.search(r'\b(implement|add|create).*\b(verify|test|check)/i', query_lower):
        return {
            "needed": True,
            "chain": ["code-agent", "verifier-code-agent"],
            "reason": "Implementation with verification"
        }
    
    if re.search(r'\b(secure|auth|payment|encryption)\b.*\b(implement|add|fix)/i', query_lower):
        return {
            "needed": True,
            "chain": ["code-agent", "verifier-code-agent", "reflection-orchestrator"],
            "reason": "Security-critical implementation"
        }
    
    if re.search(r'\b(review|analyze).*\b(fix|implement)/i', query_lower):
        return {
            "needed": True,
            "chain": ["analysis-agent", "code-agent"],
            "reason": "Review followed by fix"
        }
    
    return None


def classify_intent(query: str) -> Dict:
    query_lower = normalize_query(query)
    
    scores = {}
    matched_keywords = {}
    
    for intent, pattern_data in INTENT_PATTERNS.items():
        count, matches = count_keyword_matches(query_lower, pattern_data["keywords"])
        if count > 0:
            scores[intent] = count * pattern_data["weight"]
            matched_keywords[intent] = matches
    
    if not scores:
        return {
            "intent": "unclear",
            "confidence": 0.3,
            "reasoning": "No keyword matches found",
            "suggested_action": "llm",
            "alternative_intents": [],
            "skill_chain": {"needed": False},
            "complexity": detect_complexity(query)
        }
    
    sorted_intents = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    primary_intent = sorted_intents[0][0]
    primary_score = sorted_intents[0][1]
    
    total_score = sum(scores.values())
    confidence = min(primary_score / max(total_score, 1), 1.0)
    
    if len(sorted_intents) > 1:
        ratio = primary_score / max(sorted_intents[1][1], 1)
        if ratio > 2:
            confidence = min(confidence * 1.2, 1.0)
    
    if confidence > 0.7:
        action = "skill"
    elif confidence > 0.4:
        action = "llm"
    else:
        action = "llm"
    
    skill_chain = detect_skill_chain_need(query)
    if skill_chain:
        action = "skill_chain"
    
    complexity = detect_complexity(query)
    
    if complexity > 0.7 and primary_intent not in ["complex"]:
        action = "skill_chain" if skill_chain else "llm"
    
    return {
        "intent": primary_intent,
        "confidence": round(confidence, 2),
        "reasoning": f"Matched keywords: {', '.join(matched_keywords.get(primary_intent, []))}",
        "suggested_action": action,
        "keywords_matched": matched_keywords.get(primary_intent, []),
        "alternative_intents": [
            {"intent": intent, "score": score} 
            for intent, score in sorted_intents[1:3]
        ],
        "skill_chain": skill_chain or {"needed": False},
        "complexity": round(complexity, 2)
    }


def main():
    parser = argparse.ArgumentParser(description="Fast intent classification")
    parser.add_argument("query", nargs="?", help="Query to classify")
    parser.add_argument("--query", dest="query_alt", help="Query (alternative)")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    
    args = parser.parse_args()
    
    query = args.query or args.query_alt
    if not query:
        print("ERROR: Provide a query", file=sys.stderr)
        return 1
    
    result = classify_intent(query)
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Intent: {result['intent']} (confidence: {result['confidence']})")
        print(f"Action: {result['suggested_action']}")
        print(f"Complexity: {result['complexity']}")
        print(f"Keywords: {', '.join(result['keywords_matched'])}")
        
        if result['skill_chain']['needed']:
            print(f"Skill chain: {' → '.join(result['skill_chain']['chain'])}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
