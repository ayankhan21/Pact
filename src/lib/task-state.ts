export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type TaskHistoryEntry = {
  from: TaskStatus;
  to: TaskStatus;
  createdAt: string;
  reason?: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  estimatedMinutes: number;
  category?: string;
  dueDate?: string;
  history?: TaskHistoryEntry[];
};

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ["in_progress", "blocked", "done", "cancelled"],
  in_progress: ["blocked", "done", "cancelled"],
  blocked: ["todo", "in_progress", "done", "cancelled"],
  done: ["cancelled"],
  cancelled: ["todo", "in_progress"],
};

export function isValidStatusTransition(
  from: TaskStatus,
  to: TaskStatus,
): boolean {
  if (from === to) {
    return true;
  }

  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function moveTaskToStatus(
  task: Task,
  nextStatus: TaskStatus,
  reason?: string,
): Task {
  if (task.status === nextStatus) {
    return task;
  }

  if (!isValidStatusTransition(task.status, nextStatus)) {
    throw new Error(`Invalid task transition: ${task.status} -> ${nextStatus}`);
  }

  const history = task.history ?? [];

  return {
    ...task,
    status: nextStatus,
    history: [
      ...history,
      {
        from: task.status,
        to: nextStatus,
        createdAt: new Date().toISOString(),
        ...(reason ? { reason } : {}),
      },
    ],
  };
}

export function calculateCompletionRate(
  tasks: Array<Pick<Task, "status">>,
): number {
  if (tasks.length === 0) {
    return 0;
  }

  const doneCount = tasks.filter((task) => task.status === "done").length;
  const value = (doneCount / tasks.length) * 100;

  return Number(value.toFixed(2));
}
