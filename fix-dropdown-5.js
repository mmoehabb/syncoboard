const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/dashboard/components/NotificationsDropdown.tsx', c => c.replace(/logs\.map\(\(log\)/g, '(logs as {id: string, type?: string, actor?: {name?: string, email?: string}, message?: string, taskId?: string, createdAt: string | Date, read?: boolean, action?: string, targetId?: string, board?: {name?: string, workspace?: {name?: string}}, status?: string, task?: {title?: string, status?: string, workspace?: {name?: string}, board?: {name?: string}}}[]) /* eslint-disable-line no-restricted-syntax */.map((log)'));
