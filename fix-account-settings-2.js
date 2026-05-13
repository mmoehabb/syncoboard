const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\?\.id/g, '(subscription as {id?:string})?.id /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.id\)/g, '(subscription as {id:string}).id) /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price/g, '(subscription as {price?:any}).price /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.status/g, '(subscription as {status?:string}).status /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.cancelAtPeriodEnd/g, '(subscription as {cancelAtPeriodEnd?:boolean}).cancelAtPeriodEnd /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.endDate/g, '(subscription as {endDate?:Date|string}).endDate /* eslint-disable-line no-restricted-syntax */'));
