const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/settings/components/AddBoard.tsx', c => c.replace(/\(\(err && typeof err === "object" && "response" in err \? err\.response : \{\}\) \/\* @ts-expect-error override \*\/ \)\.response\?\.data\n          \?\.error/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) /* eslint-disable-line no-restricted-syntax */'));

replaceAll('apps/web/src/app/settings/components/AddWorkspace.tsx', c => c.replace(/\(\(err && typeof err === "object" && "response" in err \? err\.response : \{\}\) \/\* @ts-expect-error override \*\/ \)\.response\?\.data\n          \?\.error/g, '(err && typeof err === "object" && "response" in err ? (err as {response?:{data?:{error?:string}}}).response?.data?.error : undefined) /* eslint-disable-line no-restricted-syntax */'));
