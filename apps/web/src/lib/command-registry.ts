import { Command } from "../types/commands";
import { NORMAL_ACTIONS_REGISTRY } from "./normal-actions-registry";

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
              err.response
                ?.data?.error ||
              (err).message ||
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
      navigate,
      virtualPath,
      setVirtualPath,
      setMode,
    }) => {
      const targetPath = args && args.length > 0 ? args[0] : "~";
      const resolvedPath = resolvePath(virtualPath, targetPath);

      import("@syncoboard/api").then(({ directoryApi }) => {
        directoryApi
          .getDirectory(resolvedPath)
          .then((response) => {
            setVirtualPath(resolvedPath);

            // Navigate based on type
            if (response.type === "Root" || response.type === "Workspace") {
              navigate("/dashboard");
            } else if (response.type === "Board" && response.id) {
              navigate(`/dashboard/b/${response.id}`);
            } else if (response.type === "Task" && response.id) {
              // Extract the board part from the path to get the boardId to navigate
              const pathParts = resolvedPath.split("/").filter(Boolean);
              if (pathParts.length === 3) {
                // To safely get boardId, we could query the parent directory, but a simpler way is to just use search params
                // Actually, if we go to dashboard root with ?taskId=..., it won't open side panel unless we're on the right board
                // Let's fetch the parent board to get its ID
                const parentPath = resolvePath(resolvedPath, "..");
                directoryApi
                  .getDirectory(parentPath)
                  .then((parentRes) => {
                    if (parentRes.id) {
                      navigate(
                        `/dashboard/b/${parentRes.id}?taskId=${response.id}`,
                      );
                    } else {
                      printOutput([`Changed directory to ${resolvedPath}`]);
                    }
                  })
                  .catch(() => {
                    printOutput([`Changed directory to ${resolvedPath}`]);
                  });
                return;
              }
              printOutput([`Changed directory to ${resolvedPath}`]);
            } else {
              printOutput([`Changed directory to ${resolvedPath}`]);
            }
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
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
        [
          "ls",
          "cd",
          "pwd",
          "help",
          "board",
          "dashboard",
          "settings",
          "back",
          "forward",
          "logout",
          "clear",
        ].includes(c.name),
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
          "add-board",
          "delete-board",
          "restore-board",
          "list-deleted-boards",
          "activate-board",
          "deactivate-board",
          "invite-member",
          "rmv-member",
          "join-voice-call",
        ].includes(c.name),
      );
      const taskCommands = commands.filter((c) =>
        ["add-task", "update-task", "delete-task", "search-task"].includes(
          c.name,
        ),
      );

      const formatCmd = (cmd: Command) =>
        `  /${cmd.name.padEnd(12)} - ${cmd.description}`;

      const output = [
        "--- SYNC-OS v1.0.0 ---",
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
        "Normal Mode Shortcuts:",
        ...Object.values(NORMAL_ACTIONS_REGISTRY).map(
          (act) => `  ${act.key.padEnd(13)} - ${act.description}`,
        ),
      ];
      printOutput(output);
    },
  },
  board: {
    name: "board",
    description: "Navigate to the board view",
    action: ({ navigate, setMode }) => {
      navigate("/board");
      setMode("normal");
    },
  },
  dashboard: {
    name: "dashboard",
    description: "Navigate to the dashboard view",
    action: ({ navigate, setMode }) => {
      navigate("/dashboard");
      setMode("normal");
    },
  },
  back: {
    name: "back",
    description: "Go back one page",
    action: ({ setMode }) => {
      window.history.back();
      setMode("normal");
    },
  },
  forward: {
    name: "forward",
    description: "Go forward one page",
    action: ({ setMode }) => {
      window.history.forward();
      setMode("normal");
    },
  },
  logout: {
    name: "logout",
    description: "Logout of the application",
    action: async ({ printOutput }) => {
      printOutput(["Logging out..."]);
      localStorage.clear();
      const { signOut } = await import("next-auth/react");
      await signOut({ callbackUrl: "/login" });
    },
  },
  settings: {
    name: "settings",
    description: "Navigate to the settings view",
    action: ({ navigate, setMode }) => {
      navigate("/settings");
      setMode("normal");
    },
  },
  "add-board": {
    name: "add-board",
    description: "Open settings to add a new board",
    action: ({ navigate, setMode }) => {
      navigate("/settings");
      setMode("normal");
    },
  },
  "delete-workspace": {
    name: "delete-workspace",
    description:
      "Delete a workspace (usage: /delete-workspace <workspace_name>)",
    action: ({ args, printOutput, setDeleteModalState }) => {
      if (!args || args.length === 0) {
        printOutput([
          "Error: Missing arguments. Usage: /delete-workspace <workspace_name>",
        ]);
        return;
      }

      const workspaceName = args.join(" ").trim();

      if (setDeleteModalState) {
        setDeleteModalState({
          isOpen: true,
          message: `Are you sure you want to delete the workspace '${workspaceName}'? This action will perform a soft-delete, and it will be permanently deleted after 3 months.`,
          onConfirm: async () => {
            const { workspaceApi } = await import("@syncoboard/api");
            try {
              await workspaceApi.deleteWorkspace(workspaceName);
              printOutput([
                `Successfully deleted workspace '${workspaceName}'.`,
              ]);
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err: unknown) {
              const errorMessage =
                err.response
                  ?.data?.error ||
                (err).message ||
                "Failed to delete workspace.";
              printOutput([`Error: ${errorMessage}`]);
            }
          },
        });
      }
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
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
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
              err.response
                ?.data?.error ||
              (err).message ||
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
    action: ({ args, printOutput, setDeleteModalState }) => {
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

      if (setDeleteModalState) {
        setDeleteModalState({
          isOpen: true,
          message: `Are you sure you want to delete the board '${boardName.trim()}' from workspace '${workspaceName.trim()}'? This action will perform a soft-delete, and it will be permanently deleted after 3 months.`,
          onConfirm: async () => {
            const { boardApi } = await import("@syncoboard/api");
            try {
              await boardApi.deleteBoard(
                workspaceName.trim(),
                boardName.trim(),
              );
              printOutput([
                `Successfully deleted board '${boardName.trim()}' from workspace '${workspaceName.trim()}'.`,
              ]);
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } catch (err: unknown) {
              const errorMessage =
                err.response
                  ?.data?.error ||
                (err).message ||
                "Failed to delete board.";
              printOutput([`Error: ${errorMessage}`]);
            }
          },
        });
      }
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
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
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
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
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
    action: ({ args, printOutput, showToast }) => {
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
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
              "Failed to activate board.";
            printOutput([`Error: ${errorMessage}`]);
            if (showToast) {
              showToast(errorMessage, "error");
            }
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
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          })
          .catch((err: unknown) => {
            const errorMessage =
              err.response
                ?.data?.error ||
              (err).message ||
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
              err.response
                ?.data?.error ||
              (err).message ||
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
              err.response
                ?.data?.error ||
              (err).message ||
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
      printOutput([]); // A special case, we'll handle this in the context to clear history
    },
  },
  "add-task": {
    name: "add-task",
    description:
      "Add a new task to the current board (usage: /add-task <title>)",
    action: ({ args, printOutput, activeBoardId, setMode }) => {
      if (!activeBoardId) {
        printOutput(["Error: You must be on a board to add a task."]);
        return;
      }
      if (!args || args.length === 0) {
        printOutput(["Error: Missing task title. Usage: /add-task <title>"]);
        return;
      }
      const title = args.join(" ");
      import("./actions/tasks").then(({ addTask }) => {
        addTask(activeBoardId, title)
          .then(() => {
            printOutput([`Successfully added task: '${title}'`]);
            setMode("normal");
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err).message || "Failed to add task.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "update-task": {
    name: "update-task",
    description:
      "Update a task's status (usage: /update-task <task_id> <status>)",
    action: ({ args, printOutput, setMode }) => {
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

      import("./actions/tasks").then(({ updateTaskStatus }) => {
        updateTaskStatus(taskId, status)
          .then(() => {
            printOutput([
              `Successfully updated task SYNC-${taskId} to ${status}`,
            ]);
            setMode("normal");
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err).message || "Failed to update task status.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "delete-task": {
    name: "delete-task",
    description: "Delete a task (usage: /delete-task <task_id>)",
    action: ({ args, printOutput, setMode }) => {
      if (!args || args.length === 0) {
        printOutput(["Error: Missing task id. Usage: /delete-task <task_id>"]);
        return;
      }
      const taskId = args[0];
      import("./actions/tasks").then(({ deleteTask }) => {
        deleteTask(taskId)
          .then(() => {
            printOutput([`Successfully deleted task SYNC-${taskId}`]);
            setMode("normal");
          })
          .catch((err: unknown) => {
            const errorMessage =
              (err).message || "Failed to delete task.";
            printOutput([`Error: ${errorMessage}`]);
          });
      });
    },
  },
  "search-task": {
    name: "search-task",
    description:
      "Search tasks in the current board (usage: /search-task <search_text>)",
    action: ({ args, printOutput, activeBoardId, navigate, setMode }) => {
      if (!activeBoardId) {
        printOutput(["Error: You must be on a board to search tasks."]);
        return;
      }

      if (!args || args.length === 0) {
        // If no args, clear the search
        const url = new URL(window.location.href);
        url.searchParams.delete("search");
        navigate(url.pathname + url.search);
        printOutput(["Cleared search filter."]);
        setMode("normal");
        return;
      }

      const searchText = args.join(" ");
      const url = new URL(window.location.href);
      url.searchParams.set("search", searchText);

      // Navigate to the same path with the new search parameter
      navigate(url.pathname + url.search);
      printOutput([`Searching tasks for: '${searchText}'`]);
      setMode("normal");
    },
  },
  "join-voice-call": {
    name: "join-voice-call",
    description: "Join or start the board's voice call session",
    action: ({ printOutput, activeBoardId, setMode, setIsVoiceCallActive }) => {
      if (!activeBoardId) {
        printOutput(["Error: You must be on a board to join a voice call."]);
        return;
      }
      if (setIsVoiceCallActive) {
        setIsVoiceCallActive(true);
        printOutput(["Joining voice call session..."]);
        setMode("normal");
      }
    },
  },
};
