const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/command-registry.ts', c => {
  let r = c.replace(/err\.response\s*\?\.(data\?\.error) \|\|\s*\(err\)\.message/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) ||\n               (err instanceof Error ? err.message : "")');
  r = r.replace(/err\.response\s*\?\.(data\?\.error) \|\|\s*err\.message/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) ||\n               (err instanceof Error ? err.message : "")');
  return r;
});
