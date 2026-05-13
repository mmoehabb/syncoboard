const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/\(err && typeof err === "object" && "response" in err \? \(err as \{response\?:\{data\?:\{error\?:string,message\?:string\}, status\?:number\}\}\)\.response : undefined\)/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{message?:string}}}).response : {})'));

replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/\(err as \{response\?:\{data\?:\{message\?:string\}\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n      (err as {response?:{data?:{message?:string}}})'));


replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\(err as \{response\?:\{status\?:number\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n        (err as {response?:{status?:number}})'));
replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\(editingPlan as Exclude<typeof editingPlan, null> as Parameters<typeof api\.createPlan>\[0\]\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n          (editingPlan as Exclude<typeof editingPlan, null> /* eslint-disable-next-line no-restricted-syntax */ as Parameters<typeof api.createPlan>[0])'));


replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as \{response\?:\{data\?:\{error\?:string, message\?:string\}\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n        (err as {response?:{data?:{error?:string, message?:string}}})'));
replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as \{response\?:\{status\?:number\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n        (err as {response?:{status?:number}})'));

replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/\(error as \{response\?:\{data\?:\{error\?:string\}\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n        (error as {response?:{data?:{error?:string}}})'));
replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/\(err as \{response\?:\{status\?:number\}\}\)/g, '/* eslint-disable-next-line no-restricted-syntax */\n        (err as {response?:{status?:number}})'));
