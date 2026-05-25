const fs = require('fs');

const path = 'apps/tui/src/command-registry.ts';
let code = fs.readFileSync(path, 'utf8');

const regexNav = /const navCommands = commands\.filter\(\(c\) =>\n\s*\["ls", "cd", "pwd", "help", "logout", "clear"\]\.includes\(c\.name\),\n\s*\);/;
const replacementNav = `const navCommands = commands.filter((c) =>
        ["ls", "cd", "pwd", "help", "logout", "clear", "tui", "classic"].includes(c.name),
      );`;

code = code.replace(regexNav, replacementNav);

const regexTask = /const taskCommands = commands\.filter\(\(c\) =>\n\s*\[\n\s*"list-tasks",\n\s*"add-task",\n\s*"update-task",\n\s*"delete-task",\n\s*"search-task",\n\s*\]\.includes\(c\.name\),\n\s*\);/;

const replacementTask = `const taskCommands = commands.filter((c) =>
        [
          "list-tasks",
          "add-task",
          "update-task",
          "delete-task",
          "search-task",
          "select-task",
        ].includes(c.name),
      );`;

code = code.replace(regexTask, replacementTask);

fs.writeFileSync(path, code, 'utf8');
