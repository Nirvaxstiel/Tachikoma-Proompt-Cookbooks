/**
 * Inject Python environment variables into all shell executions
 * This enables using `python` command with portable Python
 * Uses relative path so it works when project is cloned to any location
 */

export const InjectPythonEnv = async () => {
  return {
    "shell.env": async (input, output) => {
      const projectRoot = input.cwd;
      const pythonDir = projectRoot + "/.opencode/assets/Python310";

      const currentPath = output.env.PATH || "";
      output.env.PATH = pythonDir + ";" + currentPath;

      output.env.PYTHON_HOME = pythonDir;

      output.env.PYTHONPATH = pythonDir + "/Lib";
    },
  };
};
