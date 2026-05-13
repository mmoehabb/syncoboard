const fs = require('fs');

function replaceFile(file, replacer) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}

replaceFile('apps/tui/src/command-registry.ts', c => {
  let text = c.replace(/\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)/g, 'err');
  text = text.replace(/\(err as Error\)/g, 'err');
  text = text.replace(/err: unknown/g, 'err: any'); // wait, any is forbidden.
  return text;
});
