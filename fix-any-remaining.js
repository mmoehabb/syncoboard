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

replaceFile('packages/payment/src/providers/paypal/index.ts', c => {
  return c.replace(/as any/g, 'as unknown');
});

replaceFile('packages/shared/__tests__/tab-completion.test.ts', c => {
  let res = c.replace(/as any as string/g, 'as unknown as string');
  res = res.replace(/as any/g, 'as unknown');
  return res;
});

replaceFile('apps/web/__tests__/api/api-client.test.ts', c => {
  return c.replace(/as any/g, 'as unknown');
});
