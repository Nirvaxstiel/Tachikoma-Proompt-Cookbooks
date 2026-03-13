import { describe, it, expect } from "bun:test";
import {
  FailureTaxonomyFactory,
  getCodingFailureTaxonomy,
} from "../../../src/plugin/tachikoma/verification/failure-taxonomy";

describe("FailureTaxonomyFactory", () => {
  describe("getAllCategories", () => {
    it("should return 5 major categories", () => {
      const categories = FailureTaxonomyFactory.getAllCategories();
      expect(categories.length).toBe(5);
    });

    it("should have all required category IDs", () => {
      const categories = FailureTaxonomyFactory.getAllCategories();
      const categoryIds = categories.map((c) => c.id);
      expect(categoryIds).toContain("syntax");
      expect(categoryIds).toContain("logic");
      expect(categoryIds).toContain("runtime");
      expect(categoryIds).toContain("security");
      expect(categoryIds).toContain("performance");
    });

    it("should have valid category structures", () => {
      const categories = FailureTaxonomyFactory.getAllCategories();

      for (const category of categories) {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.severity).toBeDefined();
        expect(category.subcategories).toBeInstanceOf(Array);
        expect(category.examples).toBeInstanceOf(Array);
        expect(category.mitigationStrategies).toBeInstanceOf(Array);
      }
    });

    it("should have 13 total subcategories across all categories", () => {
      const categories = FailureTaxonomyFactory.getAllCategories();
      const totalSubcategories = categories.reduce(
        (sum, cat) => sum + cat.subcategories.length,
        0,
      );
      expect(totalSubcategories).toBe(13);
    });
  });

  describe("getAllSubcategories", () => {
    it("should return a Map of subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      expect(subcategories).toBeInstanceOf(Map);
    });

    it("should have subcategories for all 5 categories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      expect(subcategories.size).toBe(5);
    });

    it("should have syntax subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      const syntaxSubcats = subcategories.get("syntax");

      expect(syntaxSubcats).toBeDefined();
      expect(syntaxSubcats?.length).toBe(3);
      expect(syntaxSubcats?.[0].parentCategory).toBe("syntax");
    });

    it("should have logic subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      const logicSubcats = subcategories.get("logic");

      expect(logicSubcats).toBeDefined();
      expect(logicSubcats?.length).toBe(4);
    });

    it("should have runtime subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      const runtimeSubcats = subcategories.get("runtime");

      expect(runtimeSubcats).toBeDefined();
      expect(runtimeSubcats?.length).toBe(2);
    });

    it("should have security subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      const securitySubcats = subcategories.get("security");

      expect(securitySubcats).toBeDefined();
      expect(securitySubcats?.length).toBe(2);
    });

    it("should have performance subcategories", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();
      const perfSubcats = subcategories.get("performance");

      expect(perfSubcats).toBeDefined();
      expect(perfSubcats?.length).toBe(2);
    });

    it("should have valid subcategory structures", () => {
      const subcategories = FailureTaxonomyFactory.getAllSubcategories();

      for (const [categoryId, subcats] of subcategories.entries()) {
        expect(categoryId).toBeDefined();

        for (const subcat of subcats) {
          expect(subcat.id).toBeDefined();
          expect(subcat.name).toBeDefined();
          expect(subcat.description).toBeDefined();
          expect(subcat.parentCategory).toBe(categoryId);
          expect(subcat.severity).toBeDefined();
          expect(subcat.examples).toBeInstanceOf(Array);
        }
      }
    });
  });

  describe("getCategoryById", () => {
    it("should return category for valid ID", () => {
      const category = FailureTaxonomyFactory.getCategoryById("syntax");

      expect(category).toBeDefined();
      expect(category?.id).toBe("syntax");
      expect(category?.name).toBe("Syntax Errors");
    });

    it("should return undefined for invalid ID", () => {
      const category = FailureTaxonomyFactory.getCategoryById("invalid");

      expect(category).toBeUndefined();
    });

    it("should return category for all valid IDs", () => {
      const validIds = ["syntax", "logic", "runtime", "security", "performance"];

      for (const id of validIds) {
        const category = FailureTaxonomyFactory.getCategoryById(id);
        expect(category).toBeDefined();
        expect(category?.id).toBe(id);
      }
    });
  });

  describe("getSubcategoryById", () => {
    it("should return subcategory for valid ID", () => {
      const subcategory = FailureTaxonomyFactory.getSubcategoryById(
        "syntax-undefined-variable",
      );

      expect(subcategory).toBeDefined();
      expect(subcategory?.id).toBe("syntax-undefined-variable");
      expect(subcategory?.name).toBe("Undefined Variable");
      expect(subcategory?.parentCategory).toBe("syntax");
    });

    it("should return undefined for invalid ID", () => {
      const subcategory = FailureTaxonomyFactory.getSubcategoryById(
        "invalid-id",
      );

      expect(subcategory).toBeUndefined();
    });

    it("should return subcategories for all valid IDs", () => {
      const validIds = [
        "syntax-undefined-variable",
        "syntax-type-mismatch",
        "syntax-missing-semicolon",
        "logic-equality-bug",
        "logic-off-by-one",
        "logic-infinite-loop",
        "logic-negation",
        "runtime-null-reference",
        "runtime-type-error",
        "sql-injection",
        "xss",
        "perf-time-complexity",
        "perf-memory-leak",
      ];

      for (const id of validIds) {
        const subcategory = FailureTaxonomyFactory.getSubcategoryById(id);
        expect(subcategory).toBeDefined();
        expect(subcategory?.id).toBe(id);
      }
    });
  });

  describe("getSubcategoriesByCategory", () => {
    it("should return subcategories for syntax category", () => {
      const subcats = FailureTaxonomyFactory.getSubcategoriesByCategory("syntax");

      expect(subcats).toBeInstanceOf(Array);
      expect(subcats.length).toBe(3);
      expect(subcats[0].parentCategory).toBe("syntax");
    });

    it("should return subcategories for logic category", () => {
      const subcats = FailureTaxonomyFactory.getSubcategoriesByCategory("logic");

      expect(subcats).toBeInstanceOf(Array);
      expect(subcats.length).toBe(4);
      expect(subcats[0].parentCategory).toBe("logic");
    });

    it("should return empty array for invalid category", () => {
      const subcats = FailureTaxonomyFactory.getSubcategoriesByCategory(
        "invalid",
      );

      expect(subcats).toBeInstanceOf(Array);
      expect(subcats.length).toBe(0);
    });
  });

  describe("getCodingFailureTaxonomy", () => {
    it("should return complete taxonomy", () => {
      const taxonomy = getCodingFailureTaxonomy();

      expect(taxonomy.categories).toBeInstanceOf(Array);
      expect(taxonomy.categories.length).toBe(5);
      expect(taxonomy.subcategories).toBeInstanceOf(Map);
      expect(taxonomy.subcategories.size).toBe(5);
    });

    it("should have all 13 subcategories", () => {
      const taxonomy = getCodingFailureTaxonomy();

      let totalSubcategories = 0;
      for (const subcats of taxonomy.subcategories.values()) {
        totalSubcategories += subcats.length;
      }

      expect(totalSubcategories).toBe(13);
    });
  });

  describe("Taxonomy Coverage", () => {
    it("should have 65 total failure types (5 categories × 13 subcategories)", () => {
      const taxonomy = getCodingFailureTaxonomy();
      const categories = taxonomy.categories;
      const subcategories = taxonomy.subcategories;

      let totalCount = 0;

      for (const category of categories) {
        const subcats = subcategories.get(category.id);
        if (subcats) {
          totalCount += subcats.length;
        }
      }

      expect(categories.length).toBe(5);

      let expectedSubcatCount = 0;
      for (const category of categories) {
        expectedSubcatCount += category.subcategories.length;
      }

      expect(expectedSubcatCount).toBe(13);
    });

    it("should cover all severity levels", () => {
      const categories = FailureTaxonomyFactory.getAllCategories();
      const severities = new Set(categories.map((c) => c.severity));

      expect(severities.has("low")).toBe(true);
      expect(severities.has("medium")).toBe(true);
      expect(severities.has("critical")).toBe(true);
    });
  });
});
