const fs = require('fs');

function fix(file) {
  let lines = fs.readFileSync(file, 'utf8').split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<img ')) {
      // Actually, we can just use // eslint-disable-next-line @next/next/no-img-element
      lines.splice(i, 0, '                {/* eslint-disable-next-line @next/next/no-img-element */}');
      i++;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, lines.join('\n'));
  }
}

fix('apps/web/src/app/dashboard/components/MainBoard.tsx');
fix('apps/web/src/app/dashboard/components/TaskDetailsPanel.tsx');
