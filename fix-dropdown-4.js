const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/dashboard/components/NotificationsDropdown.tsx', c => c.replace(/\(log: unknown\)/g, '(log: {createdAt: string | Date})'));
// I see that `logsData.logs.map` has the full type now. I need to make sure filter also has the type. Wait, the first one is the filter.
replaceAll('apps/web/src/app/dashboard/components/NotificationsDropdown.tsx', c => c.replace(/logsData\.logs\.filter\(\(log: unknown\)/g, 'logsData.logs.filter((log: {createdAt: string | Date})'));
