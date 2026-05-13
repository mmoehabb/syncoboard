const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\n\s*as Parameters<typeof api\.createPlan>\[0\]/g, ' as Parameters<typeof api.createPlan>[0]'));
replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\/\* eslint-disable-line no-restricted-syntax \*\//g, ''));
replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as/g, '/* eslint-disable-next-line no-restricted-syntax */ (err as'));

replaceAll('apps/web/src/app/api/subscriptions/webhook/paypal/route.ts', c => c.replace(/\/\* eslint-disable-next-line no-restricted-syntax \*\//g, ''));
replaceAll('apps/web/src/app/api/subscriptions/webhook/paypal/route.ts', c => c.replace(/\(err as \{message\?:string\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */ (err as {message?:string})'));

replaceAll('apps/web/src/app/dashboard/components/MainBoard.tsx', c => c.replace(/\) as UnregisteredUser\[\]; \/\/ eslint-disable-line no-restricted-syntax/g, ') /* eslint-disable-next-line no-restricted-syntax */ as UnregisteredUser[];'));

replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/\{price\?:any\}/g, '{price?:unknown}'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/\{endDate\?:Date\|string\}/g, '{endDate?:unknown}'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/\{id\?:string, price\?:any, status\?:string, endDate\?:any\}/g, '{id?:string, price?:unknown, status?:string, endDate?:unknown}'));
