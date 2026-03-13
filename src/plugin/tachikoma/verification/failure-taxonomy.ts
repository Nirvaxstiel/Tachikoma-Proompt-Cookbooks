import type { SeverityLevel } from "./types";

export interface FailureCategory {
  id: string;
  name: string;
  description: string;
  severity: SeverityLevel;
  subcategories: string[];
  examples: string[];
  mitigationStrategies: string[];
}

export interface FailureSubcategory {
  id: string;
  name: string;
  description: string;
  parentCategory: string;
  severity: SeverityLevel;
  examples: string[];
}

export class FailureTaxonomyFactory {
  static readonly SYN_TAXONOMY = "taxonomy";

  static getAllCategories(): FailureCategory[] {
    return [
      {
        id: "syntax",
        name: "Syntax Errors",
        description: "Invalid syntax, type errors, missing semicolons, unclosed brackets",
        severity: "low",
        subcategories: [
          "syntax-undefined-variable",
          "syntax-type-mismatch",
          "syntax-missing-semicolon",
        ],
        examples: [
          "const x = undefined;",
          "let y = notDefined();",
        ],
        mitigationStrategies: [
          "Use TypeScript strict mode",
          "Enable noUnusedLocals",
          "Use linter to catch undefined references",
        ],
      },
      {
        id: "logic",
        name: "Logic Errors",
        description: "Incorrect logic, wrong operators, off-by-one errors, boolean logic errors",
        severity: "medium",
        subcategories: [
          "logic-equality-bug",
          "logic-off-by-one",
          "logic-infinite-loop",
          "logic-negation",
        ],
        examples: [
          "if (result == 'success') return true;",
          "for (let i = 0; i < arr.length; i++) {",
          "while (count-- > 0) {",
        ],
        mitigationStrategies: [
          "Enable TypeScript strict equality checks",
          "Use ESLint eqeqeq rule",
          "Educate team on difference between == and ===",
        ],
      },
      {
        id: "runtime",
        name: "Runtime Errors",
        description: "Exceptions, undefined is not a function, null reference errors, type errors",
        severity: "critical",
        subcategories: [
          "runtime-null-reference",
          "runtime-type-error",
        ],
        examples: [
          "const obj = null;",
          "obj.toString();",
          "Object.keys(obj).forEach(...);",
        ],
        mitigationStrategies: [
          "Add null checks before object operations",
          "Use optional chaining for nested properties",
          "Add unit tests for null handling",
          "Use TypeScript strict null checks",
        ],
      },
      {
        id: "security",
        name: "Security Issues",
        description: "Injection vulnerabilities, exposure of sensitive data, weak cryptography, authorization issues",
        severity: "critical",
        subcategories: [
          "sql-injection",
          "xss",
        ],
        examples: [
          "const query = 'SELECT * FROM users WHERE id = ' + userInput + ' '",
          "db.execute(query);",
        ],
        mitigationStrategies: [
          "Use parameterized queries",
          "Sanitize all user inputs",
          "Use ORM with built-in escaping",
          "Apply principle of least privilege",
        ],
      },
      {
        id: "performance",
        name: "Performance Issues",
        description: "Slow algorithms, memory leaks, inefficient data structures, unnecessary computations",
        severity: "medium",
        subcategories: [
          "perf-time-complexity",
          "perf-memory-leak",
        ],
        examples: [
          "for (let i = 0; i < arr.length; i++) {",
          "while (item = arr.pop()) {",
        ],
        mitigationStrategies: [
          "Use more efficient algorithms",
          "Avoid nested loops where possible",
          "Use built-in array methods (map, filter, reduce)",
          "Consider early termination in loops",
          "Profile and identify hot paths",
        ],
      },
    ];
  }

  static getAllSubcategories(): Map<string, FailureSubcategory[]> {
    const subcategories = new Map<string, FailureSubcategory[]>();

    subcategories.set("syntax", [
      {
        id: "syntax-undefined-variable",
        name: "Undefined Variable",
        description: "Reference to undefined variable",
        parentCategory: "syntax",
        severity: "low",
        examples: ["const x = undefined;"],
      },
      {
        id: "syntax-type-mismatch",
        name: "Type Mismatch",
        description: "Type incompatibility",
        parentCategory: "syntax",
        severity: "low",
        examples: ["let y: string = 123;"],
      },
      {
        id: "syntax-missing-semicolon",
        name: "Missing Semicolon",
        description: "Missing statement terminator",
        parentCategory: "syntax",
        severity: "low",
        examples: ["const x = 10", "return x"],
      },
    ]);

    subcategories.set("logic", [
      {
        id: "logic-equality-bug",
        name: "Equality Bug",
        description: "Using == instead of ===",
        parentCategory: "logic",
        severity: "medium",
        examples: ["if (result == 'success') return true;"],
      },
      {
        id: "logic-off-by-one",
        name: "Off-by-One Error",
        description: "Incorrect array bounds",
        parentCategory: "logic",
        severity: "medium",
        examples: ["for (let i = 0; i <= arr.length; i++)"],
      },
      {
        id: "logic-infinite-loop",
        name: "Infinite Loop",
        description: "Loop without proper termination",
        parentCategory: "logic",
        severity: "high",
        examples: ["while (true) { }"],
      },
      {
        id: "logic-negation",
        name: "Logic Negation",
        description: "Incorrect negation",
        parentCategory: "logic",
        severity: "medium",
        examples: ["if (!success && !error)"],
      },
    ]);

    subcategories.set("runtime", [
      {
        id: "runtime-null-reference",
        name: "Null Reference",
        description: "Accessing null/undefined",
        parentCategory: "runtime",
        severity: "critical",
        examples: ["obj.toString()"],
      },
      {
        id: "runtime-type-error",
        name: "Type Error",
        description: "Type mismatch at runtime",
        parentCategory: "runtime",
        severity: "critical",
        examples: ["func() is not a function"],
      },
    ]);

    subcategories.set("security", [
      {
        id: "sql-injection",
        name: "SQL Injection",
        description: "SQL injection vulnerability",
        parentCategory: "security",
        severity: "critical",
        examples: ["const query = 'SELECT * FROM users WHERE id = ' + userInput + ''"],
      },
      {
        id: "xss",
        name: "XSS",
        description: "Cross-site scripting",
        parentCategory: "security",
        severity: "critical",
        examples: ["const html = '<script>' + userInput + '</script>'"],
      },
    ]);

    subcategories.set("performance", [
      {
        id: "perf-time-complexity",
        name: "Time Complexity",
        description: "Inefficient algorithm",
        parentCategory: "performance",
        severity: "medium",
        examples: ["O(n²) nested loops"],
      },
      {
        id: "perf-memory-leak",
        name: "Memory Leak",
        description: "Unreleased memory",
        parentCategory: "performance",
        severity: "high",
        examples: ["Event listeners not removed"],
      },
    ]);

    return subcategories;
  }

  static getCategoryById(id: string): FailureCategory | undefined {
    const categories = this.getAllCategories();
    return categories.find((cat) => cat.id === id);
  }

  static getSubcategoryById(id: string): FailureSubcategory | undefined {
    const subcategories = this.getAllSubcategories();

    for (const [_parentId, subcats] of subcategories.entries()) {
      const found = subcats.find((sc) => sc.id === id);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  static getSubcategoriesByCategory(parentCategoryId: string): FailureSubcategory[] {
    const subcategories = this.getAllSubcategories();
    const result = subcategories.get(parentCategoryId);

    if (!result) {
      return [];
    }

    return result;
  }
}

export function getCodingFailureTaxonomy(): {
  categories: FailureCategory[];
  subcategories: Map<string, FailureSubcategory[]>;
} {
  return {
    categories: FailureTaxonomyFactory.getAllCategories(),
    subcategories: FailureTaxonomyFactory.getAllSubcategories(),
  };
}
