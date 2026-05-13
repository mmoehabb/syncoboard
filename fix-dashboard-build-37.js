const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/err\.response\?\.data\?\.message/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{message?:string}}}).response?.data?.message : undefined)'));

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/err\.response\?\.status/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{status?:number}}).response?.status : undefined)'));

replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/err\.response\?\.data\?\.message/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{message?:string}}}).response?.data?.message : undefined)'));

replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/error\.response\?\.data\?\.error/g, '(error && typeof error === "object" && "response" in error ? (error as {response?:{data?:{error?:string}}}).response?.data?.error : undefined)'));
