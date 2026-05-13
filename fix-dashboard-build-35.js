const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/settings/page.tsx', c => c.replace(/\(err as any\)\.response/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string,message?:string}, status?:number}}).response : undefined)'));

replaceAll('apps/web/src/app/settings/components/AddBoard.tsx', c => c.replace(/\(\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)\)\.response/g, '((err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}})?.response : undefined))'));

replaceAll('apps/web/src/app/settings/components/AddWorkspace.tsx', c => c.replace(/\(\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)\)\.response/g, '((err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}})?.response : undefined))'));
