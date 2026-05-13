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

// Packages Utils Tests
replaceFile('packages/utils/__tests__/subscription-limits.test.ts', content => {
  return content.replace(/\(prisma\.([a-zA-Z0-9]+)\.([a-zA-Z0-9]+) as any\)/g, '(prisma.$1.$2 as unknown as ReturnType<typeof import("bun:test").mock>)');
});

replaceFile('packages/utils/__tests__/cleanup.test.ts', content => {
  let c = content.replace(/\(prisma\.([a-zA-Z0-9]+)\.([a-zA-Z0-9]+) as any\)/g, '(prisma.$1.$2 as unknown as ReturnType<typeof import("bun:test").mock>)');
  c = c.replace(/console\.error = consoleSpy as any;/g, 'console.error = consoleSpy as unknown as typeof console.error;');
  return c;
});

// payment api
replaceFile('packages/payment/src/providers/paypal/api.ts', content => {
  let c = content.replace(/error as any/g, 'error as unknown as { response?: { data?: unknown } }');
  c = c.replace(/as { response\?: { data\?: any } }/g, 'as { response?: { data?: unknown } }');
  return c;
});

// web bugs test
replaceFile('apps/web/__tests__/api/bugs-route.test.ts', content => {
  return content.replace(/req as any/g, 'req as unknown as NextRequest');
});

// web task tests
['apps/web/__tests__/api/tasks/[taskId]/route.test.ts', 'apps/web/__tests__/api/tasks/route.test.ts'].forEach(f => {
  replaceFile(f, content => {
    return content.replace(/\(global as any\)\.testUserId/g, '(global as unknown as { testUserId: string }).testUserId');
  });
});
