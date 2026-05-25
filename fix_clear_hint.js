const fs = require('fs');

const path = 'apps/tui/src/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(input === "\/auth" \|\| input === "auth"\) \{/;
const replacement = `
      // The hint disappears on any command executed, because we use setOutput logic. Wait, let's just make sure.
      setOutput((prev) => {
        return prev.filter(line => !line.startsWith("Hint: Try typing /tui"));
      });

      if (input === "/auth" || input === "auth") {`;

code = code.replace(regex, replacement);

fs.writeFileSync(path, code, 'utf8');
