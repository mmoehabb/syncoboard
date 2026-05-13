const fs = require('fs');

function convertAsToTsExpectError(filePath) {
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Test files that use mock: we should extract the function and use `// @ts-expect-error` before the line
    if (line.includes('as unknown as ReturnType<typeof import("bun:test").mock>')) {
      newLines.push('    // @ts-expect-error mocking prisma for tests');
      newLines.push(line.replace(/ as unknown as ReturnType<typeof import\("bun:test"\)\.mock>/g, ''));
    }
    else if (line.includes('as unknown as NextRequest')) {
      newLines.push('    // @ts-expect-error mock req');
      newLines.push(line.replace(/ as unknown as NextRequest/g, ''));
    }
    else if (line.includes('as unknown as { testUserId: string }')) {
      newLines.push('    // @ts-expect-error mock global var');
      newLines.push(line.replace(/ as unknown as { testUserId: string }/g, ''));
    }
    else if (line.includes('as unknown as typeof console.error')) {
      newLines.push('    // @ts-expect-error mock console error');
      newLines.push(line.replace(/ as unknown as typeof console\.error/g, ''));
    }
    else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'));
}

convertAsToTsExpectError('packages/utils/__tests__/subscription-limits.test.ts');
convertAsToTsExpectError('packages/utils/__tests__/cleanup.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/bugs-route.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/tasks/[taskId]/route.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/tasks/route.test.ts');
