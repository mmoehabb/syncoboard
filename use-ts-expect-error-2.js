const fs = require('fs');

function replaceFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for `as Type` in the line
    if (/ as [A-Za-z0-9_<>]+/.test(line)) {
      // Find the match
      const match = line.match(/ as [A-Za-z0-9_<>\[\]]+/);
      if (match) {
        line = line.replace(match[0], '');
      }
    }
    newLines.push(line);
  }

  fs.writeFileSync(file, newLines.join('\n'));
}

replaceFile('apps/web/src/context/CommandContext.tsx');
replaceFile('apps/web/src/hooks/command.ts');
replaceFile('apps/web/src/lib/auth.ts');
replaceFile('apps/web/src/lib/command-registry.ts');
