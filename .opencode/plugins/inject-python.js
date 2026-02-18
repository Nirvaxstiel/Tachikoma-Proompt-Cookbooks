/**
 * Inject Python and UV environment variables into all shell executions
 * This enables using `python` and `uv` commands with portable tools
 * Uses relative path so it works when project is cloned to any location
 */

export const InjectPythonEnv = async () => {
  return {
    "shell.env": async (input, output) => {
      const projectRoot = input.cwd;
      const pythonDir = projectRoot + "/.opencode/assets/Python310";
      const assetsDir = projectRoot + "/.opencode/assets";

      const currentPath = output.env.PATH || "";
      // Add both Python and assets dir (for uv.exe)
      output.env.PATH = pythonDir + ";" + assetsDir + ";" + currentPath;

      output.env.PYTHON_HOME = pythonDir;

      output.env.PYTHONPATH = pythonDir + "/Lib";

      // UV cache directory (optional, for faster installs)
      output.env.UV_CACHE_DIR = projectRoot + "/.opencode/cache/uv";
    },
  };
};
