const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/\(subscription as \{price\?:unknown\}\)\.price \/\* eslint-disable-line no-restricted-syntax \*\/\?\.plan/g, '(subscription as {price?:{plan?:{name?:string}}}).price?.plan /* eslint-disable-line no-restricted-syntax */'));
