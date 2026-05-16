import { Command } from "./types";
import { resolvePath } from "@syncoboard/shared";

export const COMMAND_REGISTRY: Record<string, Command> = {
  ls: {
    name: "ls",
    description: "List directory contents (Workspaces, Boards, Tasks)",
    action: ({ args, printOutput, virtualPath }) => {
      const targetPath = args && args.length > 0 ? args[0] : ".";
      const resolvedPath = resolvePath(virtualPath, targetPath);

      import("@syncoboard/api").then(({ directoryApi }) => {
        directoryApi
          .getDirectory(resolvedPath)
          .then((response) => {
            if (response.entries.length === 0) {
              printOutput([]);
              return;
            }

            let outputLines: string[] = [];

            if (response.type === "Board") {
              const groupedTasks: Record<string, typeof response.entries> = {};
              response.entries.forEach((entry) => {
                if (entry.type === "Task" && entry.status) {
                  if (!groupedTasks[entry.status]) {
                    groupedTasks[entry.status] = [];
                  }
                  groupedTasks[entry.status].push(entry);
                }
              });

              Object.entries(groupedTasks).forEach(([status, tasks]) => {
                outputLines.push(`--- ${status} ---`);
                tasks.forEach((entry) => {
                  const title =
                    entry.title && entry.title.length > 30
                      ? entry.title.substring(0, 30) + "..."
                      : entry.title || "";
                  outputLines.push(`${entry.name} (${title}) [${entry.type}]`);
                });
                if (response.hasMoreByStatus?.[status]) {
                  outputLines.push(`...`);
                }
              });
            } else {
              outputLines = response.entries.map((entry) => {
                if (entry.type === "Task" && entry.title) {
                  // Truncate title
                  const title =
                    entry.title.length > 30
                      ? entry.title.substring(0, 30) + "..."
                      : entry.title;
                  return `${entry.name} (${title}) [${entry.type}]`;
                }
                const formattedName = entry.name
                  .toLowerCase()
                  .replace(/ /g, "-");
                return `${formattedName} [${entry.type}]`;
              });
            }

            printOutput(outputLines);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to list directory.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  cd: {
    name: "cd",
    description: "Change directory",
    action: ({
      args,
      printOutput,
      virtualPath,
      setVirtualPath,
      setActiveBoardId,
    }) => {
      const targetPath = args && args.length > 0 ? args[0] : "~";
      const resolvedPath = resolvePath(virtualPath, targetPath);

      import("@syncoboard/api").then(({ directoryApi }) => {
        directoryApi
          .getDirectory(resolvedPath)
          .then((response) => {
            setVirtualPath(resolvedPath);
            if (response.type === "Board" && response.id) {
              if (setActiveBoardId) {
                setActiveBoardId(response.id);
              }
            } else if (response.type !== "Task") {
              if (setActiveBoardId) {
                setActiveBoardId(undefined);
              }
            }
            printOutput([`Changed directory to ${resolvedPath}`]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to change directory.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  pwd: {
    name: "pwd",
    description: "Print working directory",
    action: ({ printOutput, virtualPath }) => {
      printOutput([virtualPath]);
    },
  },
  help: {
    name: "help",
    description: "List all available commands and shortcuts",
    action: ({ printOutput }) => {
      const commands = Object.values(COMMAND_REGISTRY);

      const navCommands = commands.filter((c) =>
        ["ls", "cd", "pwd", "help", "logout", "clear"].includes(c.name),
      );
      const workspaceCommands = commands.filter((c) =>
        [
          "delete-workspace",
          "activate-workspace",
          "deactivate-workspace",
        ].includes(c.name),
      );
      const boardCommands = commands.filter((c) =>
        [
          "delete-board",
          "restore-workspace",
          "restore-board",
          "list-deleted-boards",
          "activate-board",
          "deactivate-board",
          "invite-member",
          "rmv-member",
        ].includes(c.name),
      );
      const taskCommands = commands.filter((c) =>
        ["list-tasks", "add-task", "update-task", "delete-task", "search-task"].includes(
          c.name,
        ),
      );

      const formatCmd = (cmd: Command) =>
        `  /${cmd.name.padEnd(12)} - ${cmd.description}`;

      const output = [
        "--- SYNC-OS TUI v1.0.0 ---",
        "Navigation & System:",
        ...navCommands.map(formatCmd),
        "",
        "Workspaces:",
        ...workspaceCommands.map(formatCmd),
        "",
        "Boards:",
        ...boardCommands.map(formatCmd),
        "",
        "Tasks:",
        ...taskCommands.map(formatCmd),
        "",
      ];
      printOutput(output);
    },
  },
  board: {
    name: "board",
    description: "Navigate to the board view",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  dashboard: {
    name: "dashboard",
    description: "Navigate to the dashboard view",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  back: {
    name: "back",
    description: "Go back one page",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  forward: {
    name: "forward",
    description: "Go forward one page",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  settings: {
    name: "settings",
    description: "Navigate to the settings view",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  "add-board": {
    name: "add-board",
    description: "Open settings to add a new board",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  "join-voice-call": {
    name: "join-voice-call",
    description: "Join or start the board's voice call session",
    action: ({ printOutput }) => {
      printOutput(["Not supported in TUI"]);
    },
  },
  logout: {
    name: "logout",
    description: "Logout of the application",
    action: async ({ printOutput }) => {
      printOutput(["Logging out... (handled in index.tsx)"]);
    },
  },
  "delete-workspace": {
    name: "delete-workspace",
    description:
      "Delete a workspace (usage: /delete-workspace <workspace_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /delete-workspace <workspace_name>",
        ]);
        return;
      }

      const workspaceName = args.join(" ").trim();
      printOutput([`Attempting to delete workspace '${workspaceName}'...`]);

      import("@syncoboard/api").then(({ workspaceApi }) => {
        workspaceApi
          .deleteWorkspace(workspaceName)
          .then(() => {
            printOutput([`Successfully deleted workspace '${workspaceName}'.`]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to delete workspace.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },

  "restore-workspace": {
    name: "restore-workspace",
    description:
      "Restore a soft-deleted workspace (usage: /restore-workspace <workspace_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length !== 1) {
        printOutput([
          "Error: Missing arguments. Usage: /restore-workspace <workspace_name>",
        ]);
        return;
      }

      const workspaceName = args[0];

      import("@syncoboard/api").then(({ workspaceApi }) => {
        workspaceApi
          .restoreWorkspace(workspaceName.trim())
          .then(() => {
            printOutput([
              `Successfully restored workspace '${workspaceName.trim()}'`,
            ]);
          })
          .catch((error: any) => {
            printOutput([
              `Error: ${error.response?.data?.error?.message || error.message || "Failed to restore workspace."}`,
            ]);
          });
      });
    },
  },
  "restore-board": {
    name: "restore-board",
    description:
      "Restore a soft-deleted board (usage: /restore-board <workspace_name>/<board_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /restore-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const fullPath = args.join(" ");
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /restore-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .restoreBoard(workspaceName.trim(), boardName.trim())
          .then(() => {
            printOutput([
              `Successfully restored board '${boardName.trim()}' in workspace '${workspaceName.trim()}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to restore board.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "list-deleted-boards": {
    name: "list-deleted-boards",
    description:
      "List all soft-deleted boards and time remaining until permanent deletion",
    action: ({ printOutput }) => {
      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .getDeletedBoards()
          .then((boards) => {
            if (boards.length === 0) {
              printOutput(["No soft-deleted boards found."]);
              return;
            }

            const outputLines = ["--- Deleted Boards ---"];
            boards.forEach((board) => {
              outputLines.push(
                `- ${board.workspaceName}/${board.name} (Repo: ${board.repositoryName || "None"}) | ${board.timeLeftString} until permanent deletion`,
              );
            });
            printOutput(outputLines);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to list deleted boards.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "delete-board": {
    name: "delete-board",
    description:
      "Delete a board (usage: /delete-board <workspace_name>/<board_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /delete-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const fullPath = args.join(" ");
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /delete-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;
      printOutput([
        `Attempting to delete board '${boardName.trim()}' from workspace '${workspaceName.trim()}'...`,
      ]);

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .deleteBoard(workspaceName.trim(), boardName.trim())
          .then(() => {
            printOutput([
              `Successfully deleted board '${boardName.trim()}' from workspace '${workspaceName.trim()}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to delete board.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "activate-workspace": {
    name: "activate-workspace",
    description:
      "Activate a workspace (usage: /activate-workspace <workspace_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /activate-workspace <workspace_name>",
        ]);
        return;
      }

      const workspaceName = args.join(" ").trim();

      import("@syncoboard/api").then(({ workspaceApi }) => {
        workspaceApi
          .updateWorkspaceStatus(workspaceName, true)
          .then(() => {
            printOutput([
              `Successfully activated workspace '${workspaceName}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to activate workspace.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "deactivate-workspace": {
    name: "deactivate-workspace",
    description:
      "Deactivate a workspace (usage: /deactivate-workspace <workspace_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /deactivate-workspace <workspace_name>",
        ]);
        return;
      }

      const workspaceName = args.join(" ").trim();

      import("@syncoboard/api").then(({ workspaceApi }) => {
        workspaceApi
          .updateWorkspaceStatus(workspaceName, false)
          .then(() => {
            printOutput([
              `Successfully deactivated workspace '${workspaceName}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to deactivate workspace.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "activate-board": {
    name: "activate-board",
    description:
      "Activate a board (usage: /activate-board <workspace_name>/<board_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /activate-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const fullPath = args.join(" ");
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /activate-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .updateBoardStatus(workspaceName.trim(), boardName.trim(), true)
          .then(() => {
            printOutput([
              `Successfully activated board '${boardName.trim()}' in workspace '${workspaceName.trim()}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to activate board.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "deactivate-board": {
    name: "deactivate-board",
    description:
      "Deactivate a board (usage: /deactivate-board <workspace_name>/<board_name>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /deactivate-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const fullPath = args.join(" ");
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /deactivate-board <workspace_name>/<board_name>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .updateBoardStatus(workspaceName.trim(), boardName.trim(), false)
          .then(() => {
            printOutput([
              `Successfully deactivated board '${boardName.trim()}' in workspace '${workspaceName.trim()}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to deactivate board.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "invite-member": {
    name: "invite-member",
    description:
      "Invite a member to a board (usage: /invite-member <workspace_name>/<board_name> <user_id_or_email>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length < 2) {
        printOutput([
          "Error: Missing arguments. Usage: /invite-member <workspace_name>/<board_name> <user_id_or_email>",
        ]);
        return;
      }

      const fullPath = args[0];
      const identifier = args[1];
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /invite-member <workspace_name>/<board_name> <user_id_or_email>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .inviteMember(
            workspaceName.trim(),
            boardName.trim(),
            identifier.trim(),
          )
          .then(() => {
            printOutput([
              `Successfully invited member '${identifier}' to board '${boardName}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to add member.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "rmv-member": {
    name: "rmv-member",
    description:
      "Remove a member from a board (usage: /rmv-member <workspace_name>/<board_name> <user_id_or_email>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length < 2) {
        printOutput([
          "Error: Missing arguments. Usage: /rmv-member <workspace_name>/<board_name> <user_id_or_email>",
        ]);
        return;
      }

      const fullPath = args[0];
      const identifier = args[1];
      const parts = fullPath.split("/");

      if (parts.length !== 2) {
        printOutput([
          "Error: Invalid format. Usage: /rmv-member <workspace_name>/<board_name> <user_id_or_email>",
        ]);
        return;
      }

      const [workspaceName, boardName] = parts;

      import("@syncoboard/api").then(({ boardApi }) => {
        boardApi
          .removeMember(
            workspaceName.trim(),
            boardName.trim(),
            identifier.trim(),
          )
          .then(() => {
            printOutput([
              `Successfully removed member '${identifier}' from board '${boardName}'.`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to remove member.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  clear: {
    name: "clear",
    description: "Clear terminal output",
    action: ({ printOutput }) => {
      printOutput([]); // A special case handled in index.tsx
    },
  },
  "add-task": {
    name: "add-task",
    description:
      "Add a new task to the current board (usage: /add-task <title>)",
    action: ({ args, printOutput, activeBoardId }) => {
      if (!activeBoardId) {
        printOutput(["Error: You must be on a board to add a task."]);
        return;
      }
      if (!args || args.length === 0) {
        printOutput(["Error: Missing task title. Usage: /add-task <title>"]);
        return;
      }
      const title = args.join(" ");
      import("@syncoboard/api").then(({ taskApi }) => {
        taskApi
          .addTask({ boardId: activeBoardId, title })
          .then(() => {
            printOutput([`Successfully added task: '${title}'`]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to add task.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "update-task": {
    name: "update-task",
    description:
      "Update a task's status (usage: /update-task <task_id> <status>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length < 2) {
        printOutput([
          "Error: Missing arguments. Usage: /update-task <task_id> <status>",
        ]);
        return;
      }
      const taskId = args[0];
      const statusRaw = args.slice(1).join(" ");
      const status = statusRaw.replace(/[\s-]+/g, "_").toUpperCase();

      const validStatuses = [
        "TODO",
        "IN_PROGRESS",
        "IN_REVIEW",
        "CHANGES_REQUESTED",
        "DONE",
        "CLOSED",
      ];
      if (!validStatuses.includes(status)) {
        printOutput([
          `Error: Invalid status '${statusRaw}'.`,
          `Allowed statuses: ${validStatuses.join(", ")}`,
        ]);
        return;
      }

      import("@syncoboard/api").then(({ taskApi }) => {
        taskApi
          .updateTaskStatus(taskId, status)
          .then(() => {
            printOutput([
              `Successfully updated task SYNC-${taskId} to ${status}`,
            ]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to update task status.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "delete-task": {
    name: "delete-task",
    description: "Delete a task (usage: /delete-task <task_id>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput(["Error: Missing task id. Usage: /delete-task <task_id>"]);
        return;
      }
      const taskId = args[0];
      import("@syncoboard/api").then(({ taskApi }) => {
        taskApi
          .deleteTask(taskId)
          .then(() => {
            printOutput([`Successfully deleted task SYNC-${taskId}`]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ||
              (err as Error).message ||
              "Failed to delete task.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },

  "list-tasks": {
    name: "list-tasks",
    description: "List tasks with pagination (usage: /list-tasks <workspace>/<board> [page] [limit])",
    action: ({ args, printOutput, virtualPath }) => {
      if (!args || args.length === 0) {
        printOutput(["Error: Missing arguments. Usage: /list-tasks <workspace>/<board> [page] [limit]"]);
        return;
      }

      const targetPath = args[0];
      const resolvedPath = resolvePath(virtualPath, targetPath);
      let normalizedPath = resolvedPath.replace(/\/+/g, "/").trim();
      if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
        normalizedPath = normalizedPath.slice(0, -1);
      }
      if (!normalizedPath.startsWith("/")) {
        normalizedPath = "/" + normalizedPath;
      }

      const parts = normalizedPath === "/" ? [] : normalizedPath.split("/").filter(Boolean);
      if (parts.length !== 2) {
        printOutput(["Error: Invalid path. Path must point to a specific board, e.g., <workspace>/<board>"]);
        return;
      }

      const workspaceName = parts[0];
      const boardName = parts[1];

      let page = 1;
      let limit = 5;

      if (args.length > 1) {
        const parsedPage = parseInt(args[1], 10);
        if (!isNaN(parsedPage) && parsedPage > 0) {
          page = parsedPage;
        } else {
          printOutput(["Error: Invalid page number. Must be a positive integer."]);
          return;
        }
      }

      if (args.length > 2) {
        const parsedLimit = parseInt(args[2], 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0) {
          limit = parsedLimit;
        } else {
          printOutput(["Error: Invalid limit. Must be a positive integer."]);
          return;
        }
      }

      import("@syncoboard/api").then(({ taskApi }) => {
        taskApi.listTasks(workspaceName, boardName, page, limit)
          .then((response) => {
            const outputLines: string[] = [];
            const { tasksByStatus, hasMoreByStatus } = response;

            const statuses = ["TODO", "IN_PROGRESS", "IN_REVIEW", "CHANGES_REQUESTED", "DONE", "CLOSED"];
            let totalTasks = 0;

            statuses.forEach((status) => {
              const tasks = tasksByStatus[status];
              if (tasks && tasks.length > 0) {
                totalTasks += tasks.length;
                outputLines.push(`--- ${status} ---`);
                tasks.forEach((task: any) => {
                  const title = task.title && task.title.length > 30
                    ? task.title.substring(0, 30) + "..."
                    : task.title || "";
                  outputLines.push(`SYNC-${task.id} (${title}) [Task]`);
                });
                if (hasMoreByStatus[status]) {
                  outputLines.push(`... (more tasks available on next page)`);
                }
              }
            });

            if (totalTasks === 0) {
              outputLines.push("No tasks found on this board for the given page.");
            } else {
              outputLines.unshift(`Listing tasks for board: ${workspaceName}/${boardName} (Page ${page}, Limit ${limit})`);
            }

            printOutput(outputLines);
          })
          .catch((err: unknown) => {
            const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || (err as Error).message || "Failed to list tasks.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    }
  },
  "search-task": {
    name: "search-task",
    description:
      "Search tasks in the current board (usage: /search-task <search_text>)",
    action: ({ args, printOutput, activeBoardId }) => {
      if (!activeBoardId) {
        printOutput(["Error: You must be on a board to search tasks."]);
        return;
      }

      if (!args || args.length === 0) {
        printOutput(["Cleared search filter."]);
        return;
      }

      const searchText = args.join(" ");
      printOutput([
        `Searching tasks for: '${searchText}' (Not fully implemented in TUI without visual representation)`,
      ]);
    },
  },
  "report-bug": {
    name: "report-bug",
    description: "Report a bug manually (usage: /report-bug <message>)",
    action: ({ args, printOutput }) => {
      if (!args || args.length === 0) {
        printOutput(["Error: Missing message. Usage: /report-bug <message>"]);
        return;
      }

      const message = args.join(" ");

      import("@syncoboard/api").then(({ bugApi }) => {
        bugApi
          .reportBug({
            message,
            browser: "TUI CLI",
          })
          .then(() => {
            printOutput(["Bug reported successfully. Thank you!"]);
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as Error).message || "Failed to report bug.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },

  updates: {
    name: "updates",
    description: "Print unread updates and mark them as read",
    action: ({ printOutput }) => {
      Promise.all([import("@syncoboard/api")]).then(([{ notificationApi }]) => {
        Promise.all([
          notificationApi.getNotifications(),
          notificationApi.getReadState(),
        ])
          .then(([logsData, readData]) => {
            const logs = logsData.logs || [];
            const readDate = readData.lastRead
              ? new Date(readData.lastRead)
              : null;

            const unread = logs.filter((log) => {
              if (!readDate) return true;
              return new Date(log.createdAt) > readDate;
            });

            if (unread.length === 0) {
              printOutput(["No new updates"]);
              return;
            }

            const output: string[] = [];
            unread.forEach((log) => {
              const dateStr = new Date(log.createdAt).toLocaleDateString();

              if (log.type === "INVITATION") {
                const actorName =
                  log.actor?.name || log.actor?.email || "Someone";
                const boardName = `${log.board?.workspace?.name}/${log.board?.name}`;
                output.push(
                  `[${dateStr}] ${actorName} invited you to join ${boardName}`,
                );
              } else if (log.type === "MEMBER_JOIN") {
                const actorName =
                  log.actor?.name || log.actor?.email || "A new member";
                const boardName = `${log.board?.workspace?.name}/${log.board?.name}`;
                output.push(`[${dateStr}] ${actorName} joined ${boardName}`);
              } else if (log.type === "MEMBER_LEAVE") {
                const actorName =
                  log.actor?.name || log.actor?.email || "A member";
                const boardName = `${log.board?.workspace?.name}/${log.board?.name}`;
                output.push(`[${dateStr}] ${actorName} left ${boardName}`);
              } else if (log.type === "TASK_UPDATE") {
                const taskTitle = log.task?.title || "Unknown Task";
                const status = log.task?.status;
                const boardName = `${log.board?.workspace?.name}/${log.board?.name}`;
                output.push(
                  `[${dateStr}] Task "${taskTitle}" was updated to ${status} in ${boardName}`,
                );
              }
            });

            printOutput(output);

            notificationApi.markAsRead().catch((err: unknown) => {
              console.error("Failed to mark notifications as read", err);
            });
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err as Error).message || "Failed to fetch updates.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
};
