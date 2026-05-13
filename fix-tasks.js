const fs = require('fs');

function convert(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/status as TaskStatus/g, 'status');
  fs.writeFileSync(filePath, content);
}
convert('apps/web/src/app/api/tasks/[taskId]/route.ts');
