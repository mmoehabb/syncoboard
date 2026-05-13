const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/\(err as \{response\?:\{data\?:\{error\?:string,message\?:string\}, status\?:number\}\}\)/g, 'err'));
// Wait, we need to cast to any so typescript allows building, but since any is not allowed by eslint, let's use type guards or unknown and disable typescript check. Wait, it's easier to just disable eslint rule just for those files for explicit type casting.
// Let's add // eslint-disable-next-line no-restricted-syntax
replaceAll('apps/dashboard/src/app/login/page.tsx', c => c.replace(/setError\( \(\(\(err && typeof err === "object" && "response" in err \? err\.response : \{\}\)\.\.\./g, ''));
// Actually, earlier we restored the file.
