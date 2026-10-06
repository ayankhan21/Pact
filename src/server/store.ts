import type { TaskStatus } from "./schema";

export type Task = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: TaskStatus;
  estimatedMinutes: number;
  dueDate?: string;
  history?: Array<{
    from: TaskStatus;
    to: TaskStatus;
    createdAt: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ContextState = {
  goal: string;
  itinerary: string;
  behaviors: string;
  constraints: string;
  version: number;
  updatedAt: string;
};

let taskStore: Task[] = [
  {
    id: "task-seed-1",
    title: "Kafka consumer implementation",
    description:
      "Build the consumer flow and validate the interview prep sprint.",
    category: "Backend",
    status: "todo",
    estimatedMinutes: 90,
    dueDate: "2026-10-07",
    history: [
      { from: "todo", to: "todo", createdAt: "2026-10-07T00:00:00.000Z" },
    ],
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
  },
  {
    id: "task-seed-2",
    title: "Resume polish",
    description: "Tighten backend bullets and quantify wins.",
    category: "Career",
    status: "done",
    estimatedMinutes: 45,
    dueDate: "2026-10-06",
    history: [
      { from: "todo", to: "done", createdAt: "2026-10-06T19:00:00.000Z" },
    ],
    createdAt: "2026-10-06T19:00:00.000Z",
    updatedAt: "2026-10-06T19:00:00.000Z",
  },
];

let currentContext: ContextState = {
  goal: "Switch to a backend engineering role within the next six weeks.",
  itinerary: "Week 1: Kafka + DSA + resume polishing",
  behaviors:
    "I tend to overestimate available energy after a long focus block.",
  constraints: "Weekdays allow roughly three focused hours.",
  version: 0,
  updatedAt: new Date().toISOString(),
};

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getTasks(): Task[] {
  return taskStore;
}

export function getTasksForDate(date: string): Task[] {
  return taskStore.filter((task) => task.dueDate === date);
}

export function getTask(taskId: string): Task | undefined {
  return taskStore.find((task) => task.id === taskId);
}

export function createTask(input: {
  title: string;
  description?: string;
  category?: string;
  status?: TaskStatus;
  estimatedMinutes: number;
  dueDate?: string;
}): Task {
  const createdAt = new Date().toISOString();
  const newTask: Task = {
    id: makeId("task"),
    title: input.title,
    description: input.description,
    category: input.category,
    status: input.status ?? "todo",
    estimatedMinutes: input.estimatedMinutes,
    dueDate: input.dueDate,
    history: [
      {
        from: "todo",
        to: input.status ?? "todo",
        createdAt,
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };

  taskStore = [newTask, ...taskStore];
  return newTask;
}

export function updateTaskStatus(
  taskId: string,
  nextStatus: TaskStatus,
  reason?: string,
): Task | undefined {
  const task = getTask(taskId);
  if (!task) {
    return undefined;
  }

  const nextTask: Task = {
    ...task,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    history: [
      ...(task.history ?? []),
      {
        from: task.status,
        to: nextStatus,
        createdAt: new Date().toISOString(),
        ...(reason ? { reason } : {}),
      },
    ],
  };

  taskStore = taskStore.map((entry) =>
    entry.id === taskId ? nextTask : entry,
  );
  return nextTask;
}

export function setTask(
  taskId: string,
  changes: Partial<Task>,
): Task | undefined {
  const task = getTask(taskId);
  if (!task) {
    return undefined;
  }

  const updatedTask = {
    ...task,
    ...changes,
    updatedAt: new Date().toISOString(),
  };

  taskStore = taskStore.map((entry) =>
    entry.id === taskId ? updatedTask : entry,
  );
  return updatedTask;
}

export function rescheduleTask(
  taskId: string,
  nextDate: string,
): Task | undefined {
  const task = getTask(taskId);
  if (!task) {
    return undefined;
  }

  const updatedTask = {
    ...task,
    dueDate: nextDate,
    updatedAt: new Date().toISOString(),
    history: [
      ...(task.history ?? []),
      {
        from: task.status,
        to: task.status,
        createdAt: new Date().toISOString(),
        reason: `Rescheduled to ${nextDate}`,
      },
    ],
  };

  taskStore = taskStore.map((entry) =>
    entry.id === taskId ? updatedTask : entry,
  );
  return updatedTask;
}

export function getProgressSummary(date: string): {
  total: number;
  done: number;
  remaining: number;
  completionRate: number;
} {
  const tasksForDate = getTasksForDate(date);
  const total = tasksForDate.length;
  const done = tasksForDate.filter((task) => task.status === "done").length;
  const remaining = total - done;
  const completionRate =
    total === 0 ? 0 : Number(((done / total) * 100).toFixed(2));

  return {
    total,
    done,
    remaining,
    completionRate,
  };
}

export function getContext(): ContextState {
  return currentContext;
}

export function updateContext(partial: Partial<ContextState>): ContextState {
  const nextVersion = (currentContext.version ?? 0) + 1;
  currentContext = {
    ...currentContext,
    ...partial,
    version: nextVersion,
    updatedAt: new Date().toISOString(),
  };

  return currentContext;
}
