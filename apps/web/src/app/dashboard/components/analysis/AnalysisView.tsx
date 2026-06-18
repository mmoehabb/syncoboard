"use client";

import { useMemo, useState, useEffect } from "react";
import { MainBoardTask, MainBoardData } from "../types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ReferenceArea
} from "recharts";
import axios from "axios";

const STATUS_COLORS = {
  TODO: "#94a3b8", // slate-400
  IN_PROGRESS: "#3b82f6", // blue-500
  IN_REVIEW: "#a855f7", // purple-500
  CHANGES_REQUESTED: "#f59e0b", // amber-500
  DONE: "#22c55e", // green-500
  CLOSED: "#ef4444", // red-500
};

export function AnalysisView({ boardId }: { boardId: string }) {
  const [tasks, setTasks] = useState<MainBoardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Zoom state for Burndown Chart
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);
  const [left, setLeft] = useState<string | "dataMin">("dataMin");
  const [right, setRight] = useState<string | "dataMax">("dataMax");
  const [bottom, setBottom] = useState<number | "dataMin">("dataMin");
  const [top, setTop] = useState<number | "dataMax">("dataMax");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await axios.get(`/api/board-analysis?boardId=${boardId}`);
        setTasks(res.data.tasks || []);
      } catch (err) {
        console.error("Failed to fetch tasks for analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [boardId]);

  const burndownData = useMemo(() => {
    if (!tasks.length) return [];

    // Get unique dates
    const dates = new Set<string>();
    tasks.forEach(t => {
      dates.add(new Date(t.createdAt).toISOString().split('T')[0]);
      if (t.status === 'DONE' || t.status === 'CLOSED') {
        dates.add(new Date(t.updatedAt).toISOString().split('T')[0]);
      }
    });

    const sortedDates = Array.from(dates).sort();

    let totalTasks = 0;
    let completedTasks = 0;

    return sortedDates.map(date => {
      const dateEnd = new Date(`${date}T23:59:59.999Z`).getTime();

      const createdUpToDate = tasks.filter(t => new Date(t.createdAt).getTime() <= dateEnd).length;
      const completedUpToDate = tasks.filter(t =>
        (t.status === 'DONE' || t.status === 'CLOSED') && new Date(t.updatedAt).getTime() <= dateEnd
      ).length;

      return {
        date,
        remaining: createdUpToDate - completedUpToDate,
      };
    });
  }, [tasks]);

  const pieData = useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const barData = useMemo(() => {
    const memberStats: Record<string, { member: string, TODO: number, IN_PROGRESS: number, DONE: number }> = {};

    tasks.forEach(task => {
      const assignees = task.assignees || [];
      assignees.forEach(assignee => {
        const name = assignee.name || assignee.email || assignee.id;
        if (!memberStats[name]) {
          memberStats[name] = { member: name, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
        }
        if (task.status === 'DONE' || task.status === 'CLOSED') {
          memberStats[name].DONE += 1;
        } else if (task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW' || task.status === 'CHANGES_REQUESTED') {
          memberStats[name].IN_PROGRESS += 1;
        } else {
          memberStats[name].TODO += 1;
        }
      });
    });

    return Object.values(memberStats);
  }, [tasks]);

  const zoomOut = () => {
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setLeft("dataMin");
    setRight("dataMax");
    setTop("dataMax");
    setBottom("dataMin");
  };

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === null || refAreaLeft === null) {
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    let [leftAxis, rightAxis] = [refAreaLeft, refAreaRight];
    if (leftAxis > rightAxis) {
      [leftAxis, rightAxis] = [rightAxis, leftAxis];
    }

    setLeft(leftAxis);
    setRight(rightAxis);
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  if (isLoading) {
    return <div className="text-syntax-grey font-mono text-sm p-4">Loading analysis...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 overflow-y-auto w-full h-full">
      <div className="bg-void-grey border border-white/10 rounded-md p-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-mono text-lg">Burndown Chart</h3>
          <button
            onClick={zoomOut}
            className="text-xs text-neon-pulse border border-neon-pulse rounded px-2 py-1 hover:bg-neon-pulse hover:text-obsidian-night transition-colors"
          >
            Reset Zoom
          </button>
        </div>
        <div className="h-[300px] w-full text-xs font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={burndownData}
              onMouseDown={(e) => e && setRefAreaLeft(typeof e.activeLabel === 'string' ? e.activeLabel : null)}
              onMouseMove={(e) => refAreaLeft && e && setRefAreaRight(typeof e.activeLabel === 'string' ? e.activeLabel : null)}
              onMouseUp={zoom}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
              <XAxis dataKey="date" stroke="#94a3b8" domain={[left, right]} type="category" allowDataOverflow />
              <YAxis stroke="#94a3b8" domain={[bottom, top]} allowDataOverflow />
              <RechartsTooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#333" }} />
              <Area type="monotone" dataKey="remaining" stroke="#00ffcc" fill="#00ffcc33" />
              {refAreaLeft && refAreaRight ? (
                <ReferenceArea x1={refAreaLeft} x2={refAreaRight} strokeOpacity={0.3} fill="#00ffcc1a" />
              ) : null}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-syntax-grey text-xs font-mono mt-2 text-center">Click and drag to zoom</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full">
        <div className="bg-void-grey border border-white/10 rounded-md p-4 w-full md:w-1/2">
          <h3 className="text-white font-mono text-lg mb-4">Task Status Distribution</h3>
          <div className="h-[300px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#fff"} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#333" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-void-grey border border-white/10 rounded-md p-4 w-full md:w-1/2">
          <h3 className="text-white font-mono text-lg mb-4">Member Progress</h3>
          <div className="h-[300px] w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="member" type="category" stroke="#94a3b8" width={80} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#1e1e1e", borderColor: "#333" }} />
                <Legend />
                <Bar dataKey="TODO" stackId="a" fill={STATUS_COLORS.TODO} />
                <Bar dataKey="IN_PROGRESS" stackId="a" fill={STATUS_COLORS.IN_PROGRESS} />
                <Bar dataKey="DONE" stackId="a" fill={STATUS_COLORS.DONE} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
