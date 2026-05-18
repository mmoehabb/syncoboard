import React, { useState, useEffect } from "react";
import { render, Text, Box, useInput } from "ink";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { spawn } from "node:child_process";
import { setGlobalApiToken, directoryApi } from "@syncoboard/api";
import { executeTabCompletion } from "@syncoboard/shared";
import { COMMAND_REGISTRY } from "./command-registry";
import { AppMode } from "./types";
import { MAX_COMMAND_HISTORY } from "./constants";

const CONFIG_DIR = path.join(os.homedir(), ".config", "syncoboard");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

/**
 * Safely opens a URL in the default browser using platform-specific commands.
 * Uses spawn with argument arrays to prevent command injection.
 */
const openUrl = (url: string) => {
  const platform = process.platform;
  try {
    if (platform === "win32") {
      // On Windows, 'start' is a shell builtin, so we use cmd /c.
      // The empty string as the second argument is for the title parameter of 'start'.
      spawn("cmd", ["/c", "start", "", url], { stdio: "ignore" }).unref();
    } else if (platform === "darwin") {
      spawn("open", [url], { stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { stdio: "ignore" }).unref();
    }
  } catch (err) {
    // Silently fail if we can't open the browser, the user can still see the URL in some cases
    // though here it's hardcoded to localhost.
    console.error("Failed to open browser:", err);
  }
};

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

  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

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

    server.on("error", (e: NodeJS.ErrnoException) => {
      if (e.code === "EADDRINUSE") {
        setOutput((prev) => [
          ...prev,
          "Server already running, opening browser...",
        ]);
        openUrl(authUrl);
      } else {
        setOutput((prev) => [...prev, `Server error: ${e.message}`]);
      }
    });

    server.listen(port, () => {
      openUrl(authUrl);
      setOutput((prev) => [
        ...prev,
        `Waiting for authentication callback on port ${port}...`,
      ]);
    });
  };

  useInput(async (char, key) => {
    if (key.return) {
      setOutput((prev) => [...prev, `> ${input}`]);

      const trimmedInput = input.trim();
      if (trimmedInput) {
        setHistory((prev) => {
          const newHistory = [
            trimmedInput,
            ...prev.filter((c) => c !== trimmedInput),
          ].slice(0, MAX_COMMAND_HISTORY);
          return newHistory;
        });
      }
      setHistoryIndex(-1);

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
        const parts = trimmedInput.split(" ");
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
      setCursorPosition(0);
    } else if (key.upArrow) {
      if (history.length > 0 && (input === "" || historyIndex !== -1)) {
        const nextIndex = Math.min(historyIndex + 1, history.length - 1);
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
        setCursorPosition(history[nextIndex].length);
      }
    } else if (key.downArrow) {
      if (historyIndex !== -1) {
        const nextIndex = historyIndex - 1;
        if (nextIndex === -1) {
          setHistoryIndex(-1);
          setInput("");
          setCursorPosition(0);
        } else {
          setHistoryIndex(nextIndex);
          setInput(history[nextIndex]);
          setCursorPosition(history[nextIndex].length);
        }
      }
    } else if (key.leftArrow) {
      setCursorPosition((prev) => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition((prev) => Math.min(input.length, prev + 1));
    } else if (key.tab) {
      await executeTabCompletion({
        inputValue: input,
        virtualPath,
        commandRegistryKeys: Object.keys(COMMAND_REGISTRY),
        getDirectoryEntries: async (path) => {
          return directoryApi.getDirectory(path);
        },
        setInputValue: (newInput: string) => {
          setInput(newInput);
          setCursorPosition(newInput.length);
        },
        printOutput: (lines: string[]) => {
          setOutput((prev) => [...prev, ...lines]);
        },
      });
    } else if (key.backspace) {
      if (cursorPosition > 0) {
        setInput(
          (prev) =>
            prev.slice(0, cursorPosition - 1) + prev.slice(cursorPosition),
        );
        setCursorPosition((prev) => prev - 1);
      }
    } else if (key.delete) {
      if (cursorPosition < input.length) {
        setInput(
          (prev) =>
            prev.slice(0, cursorPosition) + prev.slice(cursorPosition + 1),
        );
      }
    } else if (char) {
      setInput(
        (prev) =>
          prev.slice(0, cursorPosition) + char + prev.slice(cursorPosition),
      );
      setCursorPosition((prev) => prev + char.length);
    }
  });

  const renderedInputBeforeCursor = input.slice(0, cursorPosition);
  const renderedInputAtCursor =
    cursorPosition < input.length ? input[cursorPosition] : " ";
  const renderedInputAfterCursor =
    cursorPosition < input.length ? input.slice(cursorPosition + 1) : "";

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
        <Text>{renderedInputBeforeCursor}</Text>
        <Text inverse>{renderedInputAtCursor}</Text>
        <Text>{renderedInputAfterCursor}</Text>
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
