const fs = require('fs');
let content = fs.readFileSync('apps/tui/src/command-registry.ts', 'utf8');

content = content.replace(/\.catch\(\(err: any\) => \{/g, '.catch((err: unknown) => {');

// We need a helper function to safely extract error messages
const helper = `
function extractError(err: unknown): string | undefined {
  if (err && typeof err === "object") {
    if ("response" in err && err.response && typeof err.response === "object" && "data" in err.response) {
      const data = err.response.data;
      if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
        return data.error;
      }
    }
    if ("message" in err && typeof err.message === "string") {
      return err.message;
    }
  }
  return undefined;
}
`;

content = content.replace('export const COMMAND_REGISTRY', helper + '\nexport const COMMAND_REGISTRY');

// Now replace the error extraction logic in the catch blocks
content = content.replace(/const errorMessage =\s+err\.response\s+\?\s+\.data\?\.error \|\|\s+err\.message \|\|\s+"(.*?)";/g, 'const errorMessage = extractError(err) || "$1";');

// It's formatted differently
// const errorMessage =
//              err.response
//                ?.data?.error ||
//              err.message ||
//              "Failed to ...";
content = content.replace(/const errorMessage =[\s\S]*?err\.response[\s\S]*?\?\s*\.data\?\.error\s*\|\|[\s\S]*?err\.message\s*\|\|\s*(".*?");/g, 'const errorMessage = extractError(err) || $1;');

fs.writeFileSync('apps/tui/src/command-registry.ts', content);
