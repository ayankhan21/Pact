import type { TaskStatus } from "./schema";
import type { ContextState, Task } from "./store";
import { buildJobSwitchTasks, jobSwitchContext } from "../lib/job-switch-plan";

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  all<T>(): Promise<{ results?: T[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface D1Database {
  prepare(query: string): D1Statement;
  batch<T = unknown>(statements: D1Statement[]): Promise<T[]>;
}

const PLAN_ID = "job-switch-2026";
const CONTEXT_ID = "active";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: TaskStatus;
  estimated_minutes: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  id: string;
  task_id: string;
  metadata_json: string | null;
  created_at: string;
}

const toTask = (row: TaskRow, events: EventRow[]): Task => ({
  id: row.id,
  title: row.title,
  description: row.description ?? undefined,
  category: row.category ?? undefined,
  status: row.status,
  estimatedMinutes: row.estimated_minutes,
  dueDate: row.due_date ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  history: events.flatMap((event) => {
    if (!event.metadata_json) return [];
    try {
      const metadata = JSON.parse(event.metadata_json) as {
        from?: TaskStatus;
        to?: TaskStatus;
        reason?: string;
      };
      if (!metadata.from || !metadata.to) return [];
      return [
        {
          from: metadata.from,
          to: metadata.to,
          createdAt: event.created_at,
          ...(metadata.reason ? { reason: metadata.reason } : {}),
        },
      ];
    } catch {
      return [];
    }
  }),
});

export const ensureJobSwitchSeed = async (db: D1Database): Promise<void> => {
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT OR IGNORE INTO plans
       (id, name, description, start_date, end_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
    )
    .bind(
      PLAN_ID,
      "Funded startup job switch",
      "Daily preparation plan from October 6 through November 10, 2026.",
      "2026-10-06",
      "2026-11-10",
      now,
      now,
    )
    .run();

  await db
    .prepare(
      `INSERT OR IGNORE INTO contexts (id, content, version, created_at, updated_at)
       VALUES (?, ?, 0, ?, ?)`,
    )
    .bind(CONTEXT_ID, JSON.stringify(jobSwitchContext), now, now)
    .run();

  const count = await db
    .prepare("SELECT COUNT(*) AS count FROM tasks WHERE plan_id = ?")
    .bind(PLAN_ID)
    .first<{ count: number }>();

  if ((count?.count ?? 0) > 0) return;

  const seedStatements = buildJobSwitchTasks().flatMap((task) => {
    const createdAt = `${task.dueDate}T00:00:00.000Z`;
    return [
      db
        .prepare(
          `INSERT OR IGNORE INTO tasks
           (id, plan_id, title, description, category, priority, status, estimated_minutes, deadline, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 'medium', ?, ?, ?, ?, ?)`,
        )
        .bind(
          task.id,
          PLAN_ID,
          task.title,
          task.description ?? null,
          task.category ?? null,
          task.status,
          task.estimatedMinutes,
          task.dueDate ?? null,
          createdAt,
          createdAt,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO task_schedules
           (id, task_id, scheduled_date, scheduled_start_time, scheduled_end_time, created_at, updated_at)
           VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
        )
        .bind(
          `schedule-${task.id}`,
          task.id,
          task.dueDate,
          createdAt,
          createdAt,
        ),
      db
        .prepare(
          `INSERT OR IGNORE INTO task_events (id, task_id, event_type, metadata_json, created_at)
           VALUES (?, ?, 'created', ?, ?)`,
        )
        .bind(
          `event-created-${task.id}`,
          task.id,
          JSON.stringify({ from: "todo", to: "todo" }),
          createdAt,
        ),
    ];
  });

  for (let index = 0; index < seedStatements.length; index += 50) {
    await db.batch(seedStatements.slice(index, index + 50));
  }
};

export const getTasksFromD1 = async (db: D1Database): Promise<Task[]> => {
  const result = await db
    .prepare(
      `SELECT t.id, t.title, t.description, t.category, t.status,
              t.estimated_minutes, s.scheduled_date AS due_date,
              t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN task_schedules s ON s.task_id = t.id
       WHERE t.plan_id = ?
       ORDER BY s.scheduled_date, t.created_at, t.id`,
    )
    .bind(PLAN_ID)
    .all<TaskRow>();
  const rows = result.results ?? [];

  if (rows.length === 0) return [];

  const events: EventRow[] = [];
  for (let index = 0; index < rows.length; index += 50) {
    const taskIds = rows.slice(index, index + 50).map((row) => row.id);
    const eventResult = await db
      .prepare(
        `SELECT id, task_id, metadata_json, created_at
         FROM task_events
         WHERE task_id IN (${taskIds.map(() => "?").join(",")})
         ORDER BY created_at, id`,
      )
      .bind(...taskIds)
      .all<EventRow>();
    events.push(...(eventResult.results ?? []));
  }
  const eventsByTask = new Map<string, EventRow[]>();
  for (const event of events) {
    const taskEvents = eventsByTask.get(event.task_id) ?? [];
    taskEvents.push(event);
    eventsByTask.set(event.task_id, taskEvents);
  }

  return rows.map((row) => toTask(row, eventsByTask.get(row.id) ?? []));
};

export const getTaskFromD1 = async (
  db: D1Database,
  taskId: string,
): Promise<Task | undefined> =>
  (await getTasksFromD1(db)).find((task) => task.id === taskId);

export const createTaskInD1 = async (
  db: D1Database,
  input: {
    title: string;
    description?: string;
    category?: string;
    status?: TaskStatus;
    estimatedMinutes: number;
    dueDate?: string;
  },
): Promise<Task> => {
  const id = `task-${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  const status = input.status ?? "todo";
  const task: Task = {
    id,
    title: input.title,
    description: input.description,
    category: input.category,
    status,
    estimatedMinutes: input.estimatedMinutes,
    dueDate: input.dueDate,
    history: [{ from: "todo", to: status, createdAt }],
    createdAt,
    updatedAt: createdAt,
  };
  const statements = [
    db
      .prepare(
        `INSERT INTO tasks
         (id, plan_id, title, description, category, priority, status, estimated_minutes, deadline, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 'medium', ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        PLAN_ID,
        task.title,
        task.description ?? null,
        task.category ?? null,
        status,
        task.estimatedMinutes,
        task.dueDate ?? null,
        createdAt,
        createdAt,
      ),
    ...(task.dueDate
      ? [
          db
            .prepare(
              `INSERT INTO task_schedules
               (id, task_id, scheduled_date, scheduled_start_time, scheduled_end_time, created_at, updated_at)
               VALUES (?, ?, ?, NULL, NULL, ?, ?)`,
            )
            .bind(`schedule-${id}`, id, task.dueDate, createdAt, createdAt),
        ]
      : []),
    db
      .prepare(
        `INSERT INTO task_events (id, task_id, event_type, metadata_json, created_at)
         VALUES (?, ?, 'created', ?, ?)`,
      )
      .bind(
        `event-created-${id}`,
        id,
        JSON.stringify({ from: "todo", to: status }),
        createdAt,
      ),
  ];
  await db.batch(statements);
  return task;
};

export const updateTaskStatusInD1 = async (
  db: D1Database,
  task: Task,
  nextStatus: TaskStatus,
  reason?: string,
): Promise<Task> => {
  const createdAt = new Date().toISOString();
  const eventType =
    nextStatus === "in_progress"
      ? "started"
      : nextStatus === "done"
        ? "completed"
        : nextStatus === "blocked"
          ? "blocked"
          : nextStatus === "cancelled"
            ? "cancelled"
            : "reopened";
  const historyEntry = {
    from: task.status,
    to: nextStatus,
    createdAt,
    ...(reason ? { reason } : {}),
  };
  await db.batch([
    db
      .prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?")
      .bind(nextStatus, createdAt, task.id),
    db
      .prepare(
        `INSERT INTO task_events (id, task_id, event_type, metadata_json, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        `event-${crypto.randomUUID()}`,
        task.id,
        eventType,
        JSON.stringify(historyEntry),
        createdAt,
      ),
  ]);
  return {
    ...task,
    status: nextStatus,
    history: [...(task.history ?? []), historyEntry],
  };
};

export const rescheduleTaskInD1 = async (
  db: D1Database,
  task: Task,
  nextDate: string,
): Promise<Task> => {
  const updatedAt = new Date().toISOString();
  const historyEntry = {
    from: task.status,
    to: task.status,
    createdAt: updatedAt,
    reason: `Rescheduled to ${nextDate}`,
  };
  await db.batch([
    db
      .prepare(
        `INSERT INTO task_schedules
         (id, task_id, scheduled_date, scheduled_start_time, scheduled_end_time, created_at, updated_at)
         VALUES (?, ?, ?, NULL, NULL, ?, ?)
         ON CONFLICT(task_id) DO UPDATE SET scheduled_date = excluded.scheduled_date, updated_at = excluded.updated_at`,
      )
      .bind(`schedule-${task.id}`, task.id, nextDate, updatedAt, updatedAt),
    db
      .prepare("UPDATE tasks SET deadline = ?, updated_at = ? WHERE id = ?")
      .bind(nextDate, updatedAt, task.id),
    db
      .prepare(
        `INSERT INTO task_events (id, task_id, event_type, metadata_json, created_at)
         VALUES (?, ?, 'rescheduled', ?, ?)`,
      )
      .bind(
        `event-${crypto.randomUUID()}`,
        task.id,
        JSON.stringify(historyEntry),
        updatedAt,
      ),
  ]);
  return {
    ...task,
    dueDate: nextDate,
    history: [...(task.history ?? []), historyEntry],
  };
};

export const getContextFromD1 = async (
  db: D1Database,
): Promise<ContextState> => {
  const row = await db
    .prepare("SELECT content, version, updated_at FROM contexts WHERE id = ?")
    .bind(CONTEXT_ID)
    .first<{ content: string; version: number; updated_at: string }>();
  const content = row
    ? (JSON.parse(row.content) as Omit<ContextState, "version" | "updatedAt">)
    : jobSwitchContext;
  return {
    ...content,
    version: row?.version ?? 0,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
};

export const updateContextInD1 = async (
  db: D1Database,
  partial: Partial<ContextState>,
): Promise<ContextState> => {
  const current = await getContextFromD1(db);
  const updatedAt = new Date().toISOString();
  const { version: _version, updatedAt: _updatedAt, ...editable } = current;
  const next = {
    ...editable,
    ...partial,
    version: current.version + 1,
    updatedAt,
  };
  await db
    .prepare(
      "UPDATE contexts SET content = ?, version = ?, updated_at = ? WHERE id = ?",
    )
    .bind(
      JSON.stringify({
        goal: next.goal,
        itinerary: next.itinerary,
        behaviors: next.behaviors,
        constraints: next.constraints,
      }),
      next.version,
      updatedAt,
      CONTEXT_ID,
    )
    .run();
  return next;
};

export const getProgressSummaryFromD1 = async (
  db: D1Database,
  date: string,
) => {
  const tasks = (await getTasksFromD1(db)).filter(
    (task) => task.dueDate === date,
  );
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "done").length;
  return {
    total,
    done,
    remaining: total - done,
    completionRate: total === 0 ? 0 : Number(((done / total) * 100).toFixed(2)),
  };
};
