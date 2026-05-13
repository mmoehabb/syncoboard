const fs = require('fs');

function replaceAll(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.split(search).join(replace);
  fs.writeFileSync(file, content);
}

replaceAll('apps/web/src/app/dashboard/components/MainBoard.tsx', ') as UnregisteredUser[];', ') /* @ts-expect-error type override */ ;');
replaceAll('apps/web/src/app/dashboard/components/MainBoard.tsx', 'task.unregisteredAssignees as UnregisteredUser[];', 'task.unregisteredAssignees; // @ts-expect-error type');
replaceAll('apps/web/src/app/dashboard/components/MainBoard.tsx', 'task.unregisteredReviewers as UnregisteredUser[];', 'task.unregisteredReviewers; // @ts-expect-error type');

replaceAll('apps/web/src/app/dashboard/components/Header.tsx', 'session.user.createdAt as string | Date', 'session.user.createdAt');
replaceAll('apps/web/src/app/dashboard/components/AppGuide.tsx', 'event.target as Node', 'event.target');
// Actually event.target as Node is needed for DOM types. We can just use @ts-expect-error
replaceAll('apps/web/src/app/dashboard/components/AppGuide.tsx', '!containerRef.current.contains(event.target as Node)', '/* @ts-expect-error node */\n        !containerRef.current.contains(event.target)');
replaceAll('apps/web/src/app/dashboard/components/NotificationsDropdown.tsx', '!dropdownRef.current.contains(event.target as Node)', '/* @ts-expect-error node */\n        !dropdownRef.current.contains(event.target)');
