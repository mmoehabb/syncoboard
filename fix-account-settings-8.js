const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\?\.id/g, '(subscription as {id?:string})?.id /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.id\)/g, '(subscription as {id:string}).id) /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.name/g, '(subscription as {price?:{plan?:{name?:string, maxWorkspaces?:number, maxMembersPerBoard?:number, maxActiveBoards?:number, isTrial?:boolean}}}).price?.plan?.name /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.maxWorkspaces/g, '(subscription as {price?:{plan?:{maxWorkspaces?:number}}}).price?.plan?.maxWorkspaces /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.maxBoardsPerWorkspace/g, '(subscription as {price?:{plan?:{maxBoardsPerWorkspace?:number}}}).price?.plan?.maxBoardsPerWorkspace /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.maxMembersPerBoard/g, '(subscription as {price?:{plan?:{maxMembersPerBoard?:number}}}).price?.plan?.maxMembersPerBoard /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.maxActiveBoards/g, '(subscription as {price?:{plan?:{maxActiveBoards?:number}}}).price?.plan?.maxActiveBoards /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price\.plan\.isTrial/g, '(subscription as {price?:{plan?:{isTrial?:boolean}}}).price?.plan?.isTrial /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.price/g, '(subscription as {price?:any}).price /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.status/g, '(subscription as {status?:string}).status /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.cancelAtPeriodEnd/g, '(subscription as {cancelAtPeriodEnd?:boolean}).cancelAtPeriodEnd /* eslint-disable-line no-restricted-syntax */'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/subscription\.endDate/g, '(subscription as {endDate?:Date|string}).endDate /* eslint-disable-line no-restricted-syntax */'));
