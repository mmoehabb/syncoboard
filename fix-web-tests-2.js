const fs = require('fs');
const glob = require('glob');

const files = glob.sync('apps/web/__tests__/**/*.ts');

for (const file of files) {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('as unknown as AxiosInstance')) {
      lines[i] = '    // @ts-expect-error mocking axios\n' + lines[i].replace(/ as unknown as AxiosInstance/g, '');
      changed = true;
    }
    else if (lines[i].includes('as unknown as {')) {
      lines[i] = '      // @ts-expect-error mocking response\n' + lines[i].replace(/ as unknown as \{[^\}]+\}/g, '');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
  }
}
