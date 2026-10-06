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

export interface Env {
  DB?: unknown;
  APP_ENV?: string;
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

    if (request.method === "OPTIONS") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/health") {
      return json({ ok: true, env: env.APP_ENV ?? "development" });
    }

    if (url.pathname === "/api/tasks") {
      if (request.method === "GET") {
        return json({ tasks: getTasks() });
      }

      if (request.method === "POST") {
        const body = await parseJson(request);
        if (!body || !body.title || !body.estimatedMinutes) {
          return json(
            { error: "Task title and estimated minutes are required." },
            400,
          );
        }

        const task = createTask({
          title: body.title,
          description: body.description,
          category: body.category,
          status: body.status,
          estimatedMinutes: Number(body.estimatedMinutes),
          dueDate: body.dueDate,
        });

        return json({ task }, 201);
      }
    }

    if (url.pathname.startsWith("/api/tasks/")) {
      const taskId = url.pathname.split("/api/tasks/")[1];
      const task = getTask(taskId);

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
          const updated = updateTaskStatus(taskId, body.status, body.reason);
          return json({ task: updated });
        }

        if (body.dueDate) {
          const updated = rescheduleTask(taskId, body.dueDate);
          return json({ task: updated });
        }

        const updated = setTask(taskId, body);
        return json({ task: updated });
      }
    }

    if (url.pathname === "/api/context") {
      if (request.method === "GET") {
        return json({ context: getContext() });
      }

      if (request.method === "PUT") {
        const body = await parseJson(request);
        if (!body) {
          return json({ error: "Context payload is required." }, 400);
        }

        const context = updateContext(body);
        return json({ context });
      }
    }

    if (url.pathname === "/api/progress/today") {
      const today = new Date().toISOString().slice(0, 10);
      return json({ summary: getProgressSummary(today) });
    }

    return json({ error: "Not found." }, 404);
  },
} satisfies { fetch: (request: Request, env: Env) => Promise<Response> };
