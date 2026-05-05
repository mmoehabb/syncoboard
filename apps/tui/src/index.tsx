import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput } from "ink";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { exec } from "node:child_process";
import { setGlobalApiToken, directoryApi } from "@syncoboard/api";
import { executeTabCompletion } from "@syncoboard/shared";
import { COMMAND_REGISTRY } from "./command-registry";
import { AppMode } from "./types";

const CONFIG_DIR = path.join(os.homedir(), ".config", "syncoboard");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface Config {
  token?: string;
}

async function loadConfig(): Promise<Config> {
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveConfig(config: Config) {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const App = () => {
  const [output, setOutput] = useState<string[]>([
    "Welcome to Syncoboard TUI!",
    "Type /auth to login.",
  ]);
  const [input, setInput] = useState("");
  const [config, setConfig] = useState<Config>({});
  const [virtualPath, setVirtualPath] = useState<string>("");
  const [mode, setMode] = useState<AppMode>("command");
  const [activeBoardId, setActiveBoardId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    loadConfig().then((cfg) => {
      setConfig(cfg);
      if (cfg.token) {
        setGlobalApiToken(cfg.token);
      }
    });
  }, []);

  useEffect(() => {
    // Attempt to extract activeBoardId from virtual path
    // Format is typically ~/<workspace_name>/<board_name> => the ID isn't directly in path, but directoryApi returns it.
    // However, if we don't have it, we might just not have it. The real board resolution happens in CD.
    // For TUI, let's keep it simple. If we want activeBoardId we might need to parse it,
    // but the directory API response sets it properly in cd. We can just derive it if needed or
    // simply not support activeBoardId dependent actions unless explicitly set.
    // Let's rely on directory fetching in cd or manually setting it.
    // For now, if virtualPath has 3 parts like /workspace/board, it's a board.
  }, [virtualPath]);

  const handleAuth = () => {
    const port = 3456;
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://localhost:${port}`);
      const token = url.searchParams.get("token");

      if (token) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          "<h1>Authentication successful!</h1><p>You can close this tab and return to the terminal.</p>",
        );
        await saveConfig({ ...config, token });
        setConfig({ ...config, token });
        setGlobalApiToken(token);
        setOutput((prev) => [...prev, "Authentication successful!"]);
        server.close();
      } else {
        res.writeHead(400);
        res.end("Bad Request");
      }
    });

    const authUrl = `http://localhost:3000/cli/auth?port=${port}`;
    const startCmd =
      process.platform === "win32"
        ? "start"
        : process.platform === "darwin"
          ? "open"
          : "xdg-open";

    server.on("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EADDRINUSE") {
        setOutput((prev) => [
          ...prev,
          "Server already running, opening browser...",
        ]);
        exec(`${startCmd} "${authUrl}"`);
      } else {
        setOutput((prev) => [...prev, `Server error: ${e.message}`]);
      }
    });

    server.listen(port, () => {
      exec(`${startCmd} "${authUrl}"`);
      setOutput((prev) => [
        ...prev,
        `Waiting for authentication callback on port ${port}...`,
      ]);
    });
  };

  useInput(async (char, key) => {
    if (key.return) {
      setOutput((prev) => [...prev, `> ${input}`]);
      if (input === "/auth" || input === "auth") {
        handleAuth();
      } else if (input === "/logout" || input === "logout") {
        saveConfig({ ...config, token: undefined }).then(() => {
          setConfig({ ...config, token: undefined });
          setGlobalApiToken(null);
          setOutput((prev) => [...prev, "Logged out."]);
        });
      } else if (input === "/clear" || input === "clear") {
        setOutput([]);
      } else if (input) {
        const parts = input.trim().split(" ");
        let cmdName = parts[0];
        if (cmdName.startsWith("/")) {
          cmdName = cmdName.substring(1);
        }
        const args = parts.slice(1);

        const command = COMMAND_REGISTRY[cmdName];
        if (command) {
          command.action({
            navigate: () => {}, // Not supported
            printOutput: (lines: string[]) =>
              setOutput((prev) => [...prev, ...lines]),
            setMode,
            args,
            virtualPath,
            setVirtualPath,
            activeBoardId,
            setActiveBoardId,
          });
        } else {
          setOutput((prev) => [...prev, `Command not found: ${cmdName}`]);
        }
      }
      setInput("");
    } else if (key.tab) {
      await executeTabCompletion({
        inputValue: input,
        virtualPath,
        commandRegistryKeys: Object.keys(COMMAND_REGISTRY),
        getDirectoryEntries: async (path) => {
          return directoryApi.getDirectory(path);
        },
        setInputValue: setInput,
        printOutput: (lines: string[]) => {
          setOutput((prev) => [...prev, ...lines]);
        },
      });
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1));
    } else if (char) {
      setInput((prev) => prev + char);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" marginBottom={1}>
        {output.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
      <Box>
        <Text color="blue">{virtualPath} </Text>
        <Text color="green">$ </Text>
        <Text>{input}</Text>
        {/* Simple cursor */}
        <Text inverse> </Text>
      </Box>
      {config.token && (
        <Box marginTop={1}>
          <Text color="gray">Logged in</Text>
        </Box>
      )}
    </Box>
  );
};

render(<App />);
