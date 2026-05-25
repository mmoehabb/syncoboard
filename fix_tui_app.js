const fs = require('fs');

const path = 'apps/tui/src/index.tsx';
let code = fs.readFileSync(path, 'utf8');

const regex = /if \(trimmedInput\) \{\n\s*setHistory\(\(prev\) => \{\n\s*const newHistory = \[\n\s*trimmedInput,\n\s*\.\.\.prev\.filter\(\(c\) => c !== trimmedInput\),\n\s*\]\.slice\(0, MAX_COMMAND_HISTORY\);\n\s*return newHistory;\n\s*\}\);\n\s*\}/;

const replacement = `if (trimmedInput) {
        setHistory((prev) => {
          const newHistory = [
            trimmedInput,
            ...prev.filter((c) => c !== trimmedInput),
          ].slice(0, MAX_COMMAND_HISTORY);
          return newHistory;
        });
      }

      // If in TUI mode, we hide previous output on the next command
      if (viewMode === "tui") {
         setOutput([\`> \${input}\`]);
      }`;

code = code.replace(regex, replacement);

const regexRender = /\{viewMode === "classic" && \(\n\s*<Box flexDirection="column" marginBottom=\{1\}>\n\s*\{output\.map\(\(line, i\) => \(\n\s*<Text key=\{i\}>\{line\}<\/Text>\n\s*\)\)\}\n\s*<\/Box>\n\s*\)\}/;

const replacementRender = `{viewMode === "classic" && (
        <Box flexDirection="column" marginBottom={1}>
          {output.map((line, i) => (
            <Text key={i}>{line}</Text>
          ))}
        </Box>
      )}

      {viewMode === "tui" && output.length > 0 && (
        <Box flexDirection="column" marginTop={1} marginBottom={1} borderStyle="single" borderColor="gray" paddingX={1}>
          {output.map((line, i) => (
            <Text key={i} color="gray">{line}</Text>
          ))}
        </Box>
      )}`;

code = code.replace(regexRender, replacementRender);

fs.writeFileSync(path, code, 'utf8');
