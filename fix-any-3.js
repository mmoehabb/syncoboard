const fs = require('fs');

function replace(file, replacer) {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
}

replace('apps/dashboard/src/app/login/page.tsx', c => c.replace(/e: any/g, 'e: unknown'));
replace('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/e: any/g, 'e: unknown'));
replace('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/e: any/g, 'e: unknown'));
replace('apps/dashboard/src/app/users/page.tsx', c => c.replace(/error: any/g, 'error: unknown'));
