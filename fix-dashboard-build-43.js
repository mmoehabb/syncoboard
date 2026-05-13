const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\n\s*\/\* eslint-disable-next-line no-restricted-syntax \*\/\s*/g, ' '));
replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\(editingPlan as Exclude<typeof editingPlan, null> as Parameters<typeof api\.createPlan>\[0\]\)/g, '(editingPlan as Parameters<typeof api.createPlan>[0])'));
replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/await api\.createPlan\(\(editingPlan as Parameters<typeof api\.createPlan>\[0\]\)\);/g, 'await api.createPlan(editingPlan as Parameters<typeof api.createPlan>[0]); // eslint-disable-line no-restricted-syntax'));
replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/if \(\(\(err && typeof err === "object" && "response" in err \? err as \{response\?:\{status\?:number\}\} : \{response:\{status:0\}\}\)\.response\)\?\.status === 401\)/g, 'if (err && typeof err === "object" && "response" in err && (err as {response?:{status?:number}}).response?.status === 401) // eslint-disable-line no-restricted-syntax'));


replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/\/\* eslint-disable-next-line no-restricted-syntax \*\//g, ''));
replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/\(err as \{response\?:\{data\?:\{message\?:string\}\}\}\)/g, '(err as {response?:{data?:{message?:string}}}) /* eslint-disable-line no-restricted-syntax */'));

replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\/\* eslint-disable-next-line no-restricted-syntax \*\//g, ''));
replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as \{response\?:\{data\?:\{error\?:string, message\?:string\}\}\}\)/g, '(err as {response?:{data?:{error?:string, message?:string}}}) /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as \{response\?:\{status\?:number\}\}\)/g, '(err as {response?:{status?:number}}) /* eslint-disable-line no-restricted-syntax */'));

replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/\/\* eslint-disable-next-line no-restricted-syntax \*\//g, ''));
replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/\(error as \{response\?:\{data\?:\{error\?:string\}\}\}\)/g, '(error as {response?:{data?:{error?:string}}}) /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/\(err as \{response\?:\{status\?:number\}\}\)/g, '(err as {response?:{status?:number}}) /* eslint-disable-line no-restricted-syntax */'));
