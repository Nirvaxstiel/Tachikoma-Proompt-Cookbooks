/**
 * File utilities with error handling
 */

import { constants, access, mkdir, readFile } from "node:fs/promises";

export interface FileReadResult<T = string> {
  success: boolean;
  data?: T;
  error?: Error;
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(path: string): Promise<FileReadResult<string>> {
  try {
    const content = await readFile(path, "utf-8");
    return { success: true, data: content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function readTextFileSafe(path: string, fallback: string): Promise<string> {
  const result = await readTextFile(path);
  return result.success ? (result.data ?? fallback) : fallback;
}

export async function readJSONFile<T = unknown>(path: string): Promise<FileReadResult<T>> {
  try {
    const content = await readFile(path, "utf-8");
    const parsed = JSON.parse(content) as T;
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function ensureDir(path: string): Promise<void> {
  try {
    await mkdir(path, { recursive: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code !== "EEXIST") {
      throw error;
    }
  }
}
