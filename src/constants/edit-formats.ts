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

/**
 * Default format mappings based on research
 */
export const FORMAT_MAPPINGS: Record<ModelFamily, EditFormat> = {
  claude: "str_replace",
  gpt: "apply_patch",
  gemini: "str_replace_fuzzy",
  grok: "hashline",
  glm: "hashline",
  mistral: "str_replace",
  codellama: "hashline",
  generic: "str_replace_fuzzy",
};
