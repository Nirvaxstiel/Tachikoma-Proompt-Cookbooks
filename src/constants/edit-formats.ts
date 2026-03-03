/**
 * Edit format type definitions
 */

export type EditFormat =
  | "str_replace"
  | "str_replace_fuzzy"
  | "apply_patch"
  | "hashline"
  | "editblock";

export type ModelFamily =
  | "claude"
  | "gpt"
  | "gemini"
  | "grok"
  | "glm"
  | "mistral"
  | "codellama"
  | "generic";
