import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { workspaceApi, taskApi } from "@syncoboard/api";

interface TuiLayoutProps {
  virtualPath: string;
  selectedTaskId: string | null;
}

export const TuiLayout: React.FC<TuiLayoutProps> = ({
  virtualPath,
  selectedTaskId,
}) => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch workspaces
    workspaceApi
      .getUserWorkspaces(true)
      .then((data) => setWorkspaces(data))
      .catch((err) => {
        setError(err.message || "Failed to fetch workspaces");
      });
  }, []);

  useEffect(() => {
    // Fetch tasks for the current board
    let normalizedPath = virtualPath.replace(/\/+/g, "/").trim();
    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    let parts =
      normalizedPath === "/" ? [] : normalizedPath.split("/").filter(Boolean);
    if (parts.length > 0 && parts[0] === "~") {
      parts = parts.slice(1);
    }

    if (parts.length >= 2) {
      const workspaceName = parts[0];
      const boardName = parts[1];
      taskApi
        .listTasks(workspaceName, boardName, 1, 50)
        .then((response) => {
          const allTasks: any[] = [];
          Object.values(response.tasksByStatus).forEach((statusTasks: any) => {
            allTasks.push(...statusTasks);
          });
          setTasks(allTasks);
        })
        .catch((err) => {
          // Ignore if the board isn't fully formed or doesn't exist
          setTasks([]);
        });
    } else {
      setTasks([]);
    }
  }, [virtualPath]);

  useEffect(() => {
    // Fetch task details
    if (selectedTaskId) {
      taskApi
        .getTask(selectedTaskId)
        .then((data) => setTaskDetails(data))
        .catch((err) => setTaskDetails(null));
    } else {
      setTaskDetails(null);
    }
  }, [selectedTaskId]);

  const pathParts = virtualPath.split("/").filter(Boolean);
  let activeWorkspaceName = pathParts[0];
  if (activeWorkspaceName === "~") {
    activeWorkspaceName = pathParts.length > 1 ? pathParts[1] : "";
  }

  return (
    <Box flexDirection="row" width="100%" height={20} borderStyle="single">
      {/* Left Column: Workspaces */}
      <Box
        flexDirection="column"
        width="25%"
        borderRightColor="white"
        borderStyle="single"
        paddingX={1}
      >
        <Text bold underline color="cyan">
          Workspaces
        </Text>
        {workspaces.map((ws: any) => (
          <Text
            key={ws.id}
            color={ws.name === activeWorkspaceName ? "green" : "white"}
          >
            {ws.name === activeWorkspaceName ? "▶ " : "  "}
            {ws.name}
          </Text>
        ))}
      </Box>

      {/* Middle Column: Tasks */}
      <Box
        flexDirection="column"
        width="40%"
        borderRightColor="white"
        borderStyle="single"
        paddingX={1}
      >
        <Text bold underline color="cyan">
          Tasks
        </Text>
        {tasks.length > 0 ? (
          tasks.map((task: any) => {
            const title =
              task.title && task.title.length > 30
                ? task.title.substring(0, 30) + "..."
                : task.title || "";
            const isSelected = selectedTaskId === String(task.id);
            return (
              <Text key={task.id} color={isSelected ? "green" : "white"}>
                {isSelected ? "▶ " : "  "}SYNC-{task.id}: {title}
              </Text>
            );
          })
        ) : (
          <Text color="gray">
            No tasks found. Navigate to a board using /cd
          </Text>
        )}
      </Box>

      {/* Right Column: Task Details */}
      <Box flexDirection="column" width="35%" paddingX={1}>
        <Text bold underline color="cyan">
          Task Details
        </Text>
        {taskDetails ? (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color="white">
              SYNC-{taskDetails.id}
            </Text>
            <Text>Title: {taskDetails.title}</Text>
            <Text>Status: {taskDetails.status}</Text>
            {taskDetails.description && (
              <Text>Desc: {taskDetails.description}</Text>
            )}
            <Box marginTop={1}>
              <Text color="blue">
                Assignees:{" "}
                {taskDetails.assignees
                  ?.map((a: any) => a.name || a.email)
                  .join(", ") || "None"}
              </Text>
            </Box>
          </Box>
        ) : (
          <Text color="gray">Select a task with /select-task</Text>
        )}
      </Box>
    </Box>
  );
};
