const fs = require('fs');

function replaceAll(file, replacer) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/__tests__/api/api-client.test.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/__tests__/api/bugs-route.test.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/__tests__/api/subscriptions-route.test.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/__tests__/api/tasks/[taskId]/route.test.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/__tests__/api/tasks/route.test.ts', c => c.replace(/any/g, 'unknown'));

replaceAll('apps/web/src/app/api/subscriptions/checkout/route.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/src/app/api/subscriptions/webhook/paypal/route.ts', c => c.replace(/any/g, 'unknown'));

replaceAll('apps/web/src/app/cli/auth/AuthForm.tsx', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/src/app/dashboard/components/NotificationsDropdown.tsx', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/src/app/settings/components/AccountSettings.tsx', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/src/app/settings/components/SettingsTabs.tsx', c => c.replace(/any/g, 'unknown'));
replaceAll('apps/web/src/lib/api/websocket.ts', c => c.replace(/any/g, 'unknown'));

replaceAll('packages/payment/src/providers/paypal/api.ts', c => c.replace(/any/g, 'unknown'));
replaceAll('packages/payment/src/providers/paypal/index.ts', c => c.replace(/any/g, 'unknown'));
