const fs = require('fs');

const path = 'apps/tui/src/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(viewMode === "tui"\) \{\n\s*setOutput\(\[`> \$\{input\}`\]\);\n\s*\}/;

const replacement = `if (viewMode === "tui") {
        if (!input.trim().startsWith("ls") && !input.trim().startsWith("/ls")) {
          setOutput([\`> \${input}\`]);
        }
      }`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code, 'utf8');
