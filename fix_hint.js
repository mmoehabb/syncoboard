const fs = require('fs');

const path = 'apps/tui/src/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexOutput = /const \[output, setOutput\] = useState<string\[\]>\(\[\n\s*"Welcome to Syncoboard TUI!",\n\s*"Type \/auth to login\.",\n\s*\]\);/;

const replacementOutput = `const [output, setOutput] = useState<string[]>([
    "Welcome to Syncoboard TUI!",
    "Type /auth to login.",
    "Hint: Try typing /tui to experience the new aesthetic layout!",
  ]);`;

code = code.replace(regexOutput, replacementOutput);

fs.writeFileSync(path, code, 'utf8');
