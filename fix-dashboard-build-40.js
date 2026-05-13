const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/users/page.tsx', c => c.replace(/err\.response\?\.status/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{status?:number}}).response?.status : undefined)'));
