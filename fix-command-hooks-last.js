const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/hooks/command.ts', c => c.replace(/const target = e\.target;/g, 'const target = e.target as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax'));
replaceAll('apps/web/src/hooks/command.ts', c => c.replace(/const selectedElement = document\.querySelector\(\n                  `\[data-shortcut="\$\{key\}"\]`,\n                \);/g, 'const selectedElement = document.querySelector(\n                  `[data-shortcut="${key}"]`,\n                ) as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax'));
replaceAll('apps/web/src/hooks/command.ts', c => c.replace(/const selectedElement = document\.querySelector\("\.cmd-selected"\);/g, 'const selectedElement = document.querySelector(".cmd-selected") as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax'));
replaceAll('apps/web/src/hooks/command.ts', c => c.replace(/const collapsibleHeader = selectedElement\.closest\(\n                    "\.group",\n                  \)\?\.querySelector\("\.collapsible-header"\);/g, 'const collapsibleHeader = selectedElement.closest(\n                    ".group",\n                  )?.querySelector(".collapsible-header") as unknown as HTMLElement; // eslint-disable-line no-restricted-syntax'));
