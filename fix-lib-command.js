const fs = require('fs');

function replaceFile(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)/g, 'err');
  newContent = newContent.replace(/\(err as Error\)/g, 'err');

  // also fix API error types

  fs.writeFileSync(file, newContent);
}
replaceFile('apps/web/src/lib/command-registry.ts');

let errContent = fs.readFileSync('packages/api/src/error.ts', 'utf8');
errContent = errContent.replace(/as CustomError/g, '');
fs.writeFileSync('packages/api/src/error.ts', errContent);
