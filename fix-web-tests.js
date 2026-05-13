const fs = require('fs');

function convertAsToTsExpectError(filePath) {
  let lines = fs.readFileSync(filePath, 'utf8').split('\n');
  let newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('as unknown as ReturnType<typeof import("bun:test").mock>')) {
      newLines.push('    // @ts-expect-error mocking api');
      newLines.push(line.replace(/ as unknown as ReturnType<typeof import\("bun:test"\)\.mock>/g, ''));
    }
    else if (line.includes('as unknown as ReturnType<typeof mock>')) {
      newLines.push('    // @ts-expect-error mocking api');
      newLines.push(line.replace(/ as unknown as ReturnType<typeof mock>/g, ''));
    }
    else {
      newLines.push(line);
    }
  }

  fs.writeFileSync(filePath, newLines.join('\n'));
}

convertAsToTsExpectError('apps/web/__tests__/api/board-api.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/bug-api.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/directory-api.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/github-api.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/subscription-api.test.ts');
convertAsToTsExpectError('apps/web/__tests__/api/task-api.test.ts');
