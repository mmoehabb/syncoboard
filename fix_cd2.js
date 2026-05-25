const fs = require('fs');

const path = 'apps/tui/src/command-registry.ts';
let code = fs.readFileSync(path, 'utf8');

const cdRegex = /cd: \{\n\s*name: "cd",\n\s*description: "Change directory",\n\s*action: \(\{([\s\S]*?)\}\) => \{([\s\S]*?)directoryApi\n\s*\.getDirectory\(resolvedPath\)\n\s*\.then\(\(response\) => \{([\s\S]*?)printOutput\(\[`Changed directory to \$\{resolvedPath\}`\]\);\n\s*\}\)/;

// Let's replace the inner action logic
const newAction = `cd: {
    name: "cd",
    description: "Change directory",
    action: ({
      args,
      printOutput,
      virtualPath,
      setVirtualPath,
      setActiveBoardId,
      setSelectedTaskId,
    }) => {
      const targetPath = args && args.length > 0 ? args[0] : "~";
      const resolvedPath = resolvePath(virtualPath, targetPath);

      import("@syncoboard/api").then(({ directoryApi }) => {
        directoryApi
          .getDirectory(resolvedPath)
          .then((response) => {
            setVirtualPath(resolvedPath);
            if (response.type === "Board" && response.id) {
              if (setActiveBoardId) {
                setActiveBoardId(response.id);
              }
              if (setSelectedTaskId) {
                setSelectedTaskId(null);
              }
            } else if (response.type === "Task" && response.id) {
              if (setSelectedTaskId) {
                setSelectedTaskId(response.id);
              }
            } else {
              if (setActiveBoardId) {
                setActiveBoardId(undefined);
              }
              if (setSelectedTaskId) {
                setSelectedTaskId(null);
              }
            }
            printOutput([\`Changed directory to \${resolvedPath}\`]);
          })`;

code = code.replace(/cd: \{\n\s*name: "cd",\n\s*description: "Change directory",\n\s*action: \(\{([\s\S]*?)printOutput\(\[`Changed directory to \$\{resolvedPath\}`\]\);\n\s*\}\)/, newAction);

fs.writeFileSync(path, code, 'utf8');
