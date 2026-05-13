const fs = require('fs');

function convert(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/const prEvent = payload as PullRequestEvent;/g, 'const prEvent: PullRequestEvent = payload;');
  fs.writeFileSync(filePath, content);
}
convert('apps/web/src/app/api/github/hook/route.ts');
