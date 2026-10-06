import {
  createTask,
  getContext,
  getProgressSummary,
  getTask,
  getTasks,
  rescheduleTask,
  setTask,
  updateContext,
  updateTaskStatus,
} from "./store";
import {
  createTaskInD1,
  ensureJobSwitchSeed,
  getContextFromD1,
  getProgressSummaryFromD1,
  getTaskFromD1,
  getTasksFromD1,
  type D1Database,
  rescheduleTaskInD1,
  updateContextInD1,
  updateTaskStatusInD1,
} from "./d1-store";
import { isValidStatusTransition } from "../lib/task-state";
import {
  buildPactSystemPrompt,
  generateGroqReply,
  type GroqMessage,
} from "./groq";

export interface Env {
  DB?: D1Database;
  APP_ENV?: string;
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
  PACT_API_TOKEN?: string;
}

const json = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });

const parseJson = async (request: Request): Promise<any> => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (env.APP_ENV === "production") {
      if (!env.PACT_API_TOKEN) {
        return json({ error: "API access is not configured." }, 503);
      }
      if (request.headers.get("X-Pact-Internal-Token") !== env.PACT_API_TOKEN) {
        return json({ error: "Unauthorized." }, 401);
      }
    }

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, env: env.APP_ENV ?? "development" });
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return json({ error: "POST is required for chat requests." }, 405);
      }

      const body = await parseJson(request);

      if (!body || !body.message) {
        return json({ error: "Message content is required." }, 400);
      }

      const taskSummary = Array.isArray(body.tasks)
        ? body.tasks
            .map(
              (task: any) =>
                `- ${task.title}: ${task.status} (${task.estimatedMinutes} mins, due ${task.dueDate ?? "unknown"})`,
            )
            .join("\n")
        : "No tasks available.";

      const contextSummary = body.context
        ? JSON.stringify(body.context, null, 2)
        : "No additional context.";

      const messages: GroqMessage[] = [
        {
          role: "system",
          content: buildPactSystemPrompt(
            `Tasks:\n${taskSummary}\n\nContext:\n${contextSummary}`,
          ),
        },
        {
          role: "user",
          content: body.message,
        },
      ];

      try {
        const reply = await generateGroqReply(env, messages);
        return json({ reply });
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "The accountability assistant could not be reached.",
          },
          500,
        );
      }
    }

    if (url.pathname === "/api/tasks") {
      if (env.DB) await ensureJobSwitchSeed(env.DB);

      if (request.method === "GET") {
        return json({
          tasks: env.DB ? await getTasksFromD1(env.DB) : getTasks(),
        });
      }

      if (request.method === "POST") {
        const body = await parseJson(request);
        if (!body || !body.title || !body.estimatedMinutes) {
          return json(
            { error: "Task title and estimated minutes are required." },
            400,
          );
        }

        const taskInput = {
          title: body.title,
          description: body.description,
          category: body.category,
          status: body.status,
          estimatedMinutes: Number(body.estimatedMinutes),
          dueDate: body.dueDate,
        };
        const task = env.DB
          ? await createTaskInD1(env.DB, taskInput)
          : createTask(taskInput);

        return json({ task }, 201);
      }
    }

    if (url.pathname.startsWith("/api/tasks/")) {
      if (env.DB) await ensureJobSwitchSeed(env.DB);
      const taskId = url.pathname.split("/api/tasks/")[1];
      const task = env.DB
        ? await getTaskFromD1(env.DB, taskId)
        : getTask(taskId);

      if (!task) {
        return json({ error: "Task not found." }, 404);
      }

      if (request.method === "GET") {
        return json({ task });
      }

      if (request.method === "PATCH") {
        const body = await parseJson(request);
        if (!body) {
          return json({ error: "Task update payload is required." }, 400);
        }

        if (body.status) {
          if (!isValidStatusTransition(task.status, body.status)) {
            return json({ error: "Invalid task status transition." }, 400);
          }
          const updated = env.DB
            ? await updateTaskStatusInD1(env.DB, task, body.status, body.reason)
            : updateTaskStatus(taskId, body.status, body.reason);
          return json({ task: updated });
        }

        if (body.dueDate) {
          const updated = env.DB
            ? await rescheduleTaskInD1(env.DB, task, body.dueDate)
            : rescheduleTask(taskId, body.dueDate);
          return json({ task: updated });
        }

        const updated = env.DB ? task : setTask(taskId, body);
        return json({ task: updated });
      }
    }

    if (url.pathname === "/api/context") {
      if (env.DB) await ensureJobSwitchSeed(env.DB);

      if (request.method === "GET") {
        return json({
          context: env.DB ? await getContextFromD1(env.DB) : getContext(),
        });
      }

      if (request.method === "PUT") {
        const body = await parseJson(request);
        if (!body) {
          return json({ error: "Context payload is required." }, 400);
        }

        const context = env.DB
          ? await updateContextInD1(env.DB, body)
          : updateContext(body);
        return json({ context });
      }
    }

    if (url.pathname === "/api/progress/today") {
      const today =
        url.searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
      if (env.DB) {
        await ensureJobSwitchSeed(env.DB);
        return json({ summary: await getProgressSummaryFromD1(env.DB, today) });
      }
      return json({ summary: getProgressSummary(today) });
    }

    return json({ error: "Not found." }, 404);
  },
} satisfies { fetch: (request: Request, env: Env) => Promise<Response> };
