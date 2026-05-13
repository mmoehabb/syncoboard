const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/command-registry.ts', c => c.replace(/err\.response\n                 \?\.data\?\.error \|\|\n               \(err\)\.message/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) ||\n               (err instanceof Error ? err.message : "")'));

replaceAll('apps/web/src/lib/command-registry.ts', c => c.replace(/err\.response\?\./g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) || '));

// Let's just fix it manually using a replace script
