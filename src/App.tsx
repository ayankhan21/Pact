import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  calculateCompletionRate,
  moveTaskToStatus,
  type Task,
  type TaskStatus,
} from "./lib/task-state";
import { buildJobSwitchTasks, jobSwitchContext } from "./lib/job-switch-plan";

const statusOrder: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
type ChatMessage = { id: string; role: "assistant" | "user"; text: string };

const getLocalDate = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
};

const initialMessages = [
  {
    id: "msg-1",
    role: "assistant" as const,
    text: "Your Oct 6-Nov 10 job-switch itinerary is loaded. Tell me what happened, and I’ll help keep the plan realistic.",
  },
];

const findTaskByKeyword = (text: string, tasks: Task[]) => {
  const normalized = text.toLowerCase();

  return tasks.find((task) => normalized.includes(task.title.toLowerCase()));
};

function App() {
  const [tasks, setTasks] = useState<Task[]>(buildJobSwitchTasks());
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [contextDraft, setContextDraft] = useState(jobSwitchContext);
  const [contextSavedAt, setContextSavedAt] = useState("Saved just now");
  const [selectedDate, setSelectedDate] = useState(getLocalDate);
  const [apiConnected, setApiConnected] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    category: "Backend",
    estimatedMinutes: 60,
    dueDate: selectedDate,
  });

  const board = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        items: tasks.filter(
          (task) => task.status === status && task.dueDate === selectedDate,
        ),
      })),
    [tasks, selectedDate],
  );

  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDate);
  const completionRate = calculateCompletionRate(selectedTasks);

  useEffect(() => {
    let isCurrent = true;

    const loadPlan = async () => {
      try {
        const [tasksResponse, contextResponse] = await Promise.all([
          fetch("/api/tasks"),
          fetch("/api/context"),
        ]);

        if (!tasksResponse.ok || !contextResponse.ok) {
          throw new Error("Pact API is not available.");
        }

        const [{ tasks: savedTasks }, { context }] = await Promise.all([
          tasksResponse.json() as Promise<{ tasks: Task[] }>,
          contextResponse.json() as Promise<{
            context: typeof jobSwitchContext;
          }>,
        ]);

        if (isCurrent) {
          setTasks(savedTasks);
          setContextDraft(context);
          setApiConnected(true);
        }
      } catch {
        if (isCurrent) {
          setApiConnected(false);
        }
      }
    };

    void loadPlan();
    return () => {
      isCurrent = false;
    };
  }, []);

  const addMessage = (role: "assistant" | "user", text: string) => {
    setMessages((current) => [
      ...current,
      {
        id: `${role}-${Date.now()}`,
        role,
        text,
      },
    ]);
  };

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const updatedTask = moveTaskToStatus(task, nextStatus);
    if (apiConnected) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!response.ok) throw new Error("Task update failed.");
      } catch {
        addMessage(
          "assistant",
          "I couldn’t save that status change. Please try again when the connection is restored.",
        );
        return;
      }
    }

    setTasks((currentTasks) =>
      currentTasks.map((current) =>
        current.id === taskId ? updatedTask : current,
      ),
    );
    addMessage(
      "assistant",
      `${task.title} was moved to ${nextStatus.replace("_", " ")}.`,
    );
  };

  const handleSubmitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    const text = trimmed;
    setDraft("");
    addMessage("user", text);

    const askAssistant = async () => {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            tasks: selectedTasks,
            context: contextDraft,
          }),
        });

        if (!response.ok) {
          throw new Error("Assistant request failed.");
        }

        const payload = (await response.json()) as {
          reply?: string;
          error?: string;
        };

        if (payload.reply) {
          addMessage("assistant", payload.reply);
          return;
        }

        throw new Error(payload.error ?? "Assistant request failed.");
      } catch {
        const lower = text.toLowerCase();
        const taskMatch = findTaskByKeyword(text, tasks);

        let assistantReply =
          "I’m tracking that. We’ll keep the plan and the real progress aligned.";

        if (taskMatch) {
          const taskTitle = taskMatch.title;

          if (
            lower.includes("done") ||
            lower.includes("finished") ||
            lower.includes("completed")
          ) {
            setTasks((currentTasks) =>
              currentTasks.map((task) =>
                task.id === taskMatch.id
                  ? moveTaskToStatus(task, "done")
                  : task,
              ),
            );
            assistantReply = `${taskTitle} is marked as complete. Nice work.`;
          } else if (lower.includes("blocked") || lower.includes("stuck")) {
            setTasks((currentTasks) =>
              currentTasks.map((task) =>
                task.id === taskMatch.id
                  ? moveTaskToStatus(task, "blocked")
                  : task,
              ),
            );
            assistantReply = `${taskTitle} is now blocked. We should decide what changed and whether we need to re-scope it.`;
          } else if (
            lower.includes("tomorrow") ||
            lower.includes("reschedule") ||
            lower.includes("move")
          ) {
            setTasks((currentTasks) =>
              currentTasks.map((task) =>
                task.id === taskMatch.id
                  ? { ...task, dueDate: "2026-10-08" }
                  : task,
              ),
            );
            assistantReply = `${taskTitle} has been moved to tomorrow. I’ll keep the schedule realistic and watch for overload.`;
          }
        }

        if (lower.includes("today") && lower.includes("what")) {
          assistantReply = `You have ${tasks.filter((task) => task.status !== "done").length} open tasks today, and your completion rate is ${completionRate}%.`;
        }

        addMessage("assistant", assistantReply);
      }
    };

    void askAssistant();
  };

  const handleCreateTask = () => {
    const title = newTask.title.trim();
    if (!title) {
      return;
    }

    const created = {
      id: `task-${Date.now()}`,
      title,
      category: newTask.category,
      status: "todo" as const,
      estimatedMinutes: newTask.estimatedMinutes,
      dueDate: newTask.dueDate,
      history: [],
    };

    const saveTask = async () => {
      let taskToAdd: Task = created;
      if (apiConnected) {
        try {
          const response = await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(created),
          });
          if (!response.ok) throw new Error("Task creation failed.");
          const payload = (await response.json()) as { task: Task };
          taskToAdd = payload.task;
        } catch {
          addMessage(
            "assistant",
            "I couldn’t save that task. Please try again when the connection is restored.",
          );
          return;
        }
      }
      setTasks((currentTasks) => [taskToAdd, ...currentTasks]);
      addMessage(
        "assistant",
        `${title} was added to the board and scheduled for ${newTask.dueDate}.`,
      );
    };

    void saveTask();
    setNewTask({
      title: "",
      category: "Backend",
      estimatedMinutes: 60,
      dueDate: selectedDate,
    });
  };

  const handleSaveContext = async () => {
    if (apiConnected) {
      try {
        const response = await fetch("/api/context", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contextDraft),
        });
        if (!response.ok) throw new Error("Context update failed.");
      } catch {
        setContextSavedAt("Could not save. Check the connection and retry.");
        return;
      }
    }
    setContextSavedAt("Saved just now");
    addMessage(
      "assistant",
      "Context updated. I’ll use the revised goal and constraints in future checkpoints.",
    );
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Pact</p>
          <h1>Accountability dashboard</h1>
        </div>
        <div className="topbar-actions">
          <span>
            {selectedDate === getLocalDate() ? "Today" : "Plan date"} •{" "}
            {selectedDate}
          </span>
          <button type="button" className="profile-pill">
            A
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="chat-panel panel">
          <div className="chat-header">
            <span>Ask Pact anything</span>
            <span className="chat-status">
              {apiConnected ? "Connected" : "Local preview"}
            </span>
          </div>

          <div className="message-list">
            {messages.map((message) => (
              <div key={message.id} className={`bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>

          <form className="composer" onSubmit={handleSubmitMessage}>
            <input
              type="text"
              placeholder="Tell me what I need to do today..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit">→</button>
          </form>
        </section>

        <section className="summary-grid">
          <article className="metric-card panel">
            <span>Today’s completion</span>
            <strong>{completionRate}%</strong>
          </article>
          <article className="metric-card panel">
            <span>Completed today</span>
            <strong>
              {selectedTasks.filter((task) => task.status === "done").length}
            </strong>
          </article>
          <article className="metric-card panel">
            <span>Remaining today</span>
            <strong>
              {selectedTasks.filter((task) => task.status !== "done").length}
            </strong>
          </article>
          <article className="metric-card panel">
            <span>Current streak</span>
            <strong>4 days</strong>
          </article>
        </section>

        <section className="board-wrap panel">
          <div className="board-header">
            <div>
              <p className="eyebrow">Plan day</p>
              <h2>Kanban board</h2>
            </div>
            <div className="board-actions">
              <input
                aria-label="Select plan date"
                type="date"
                min="2026-10-06"
                max="2026-11-10"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
              <button
                type="button"
                className="ghost-button"
                onClick={handleCreateTask}
              >
                + Add task
              </button>
            </div>
          </div>

          <div className="quick-add">
            <input
              type="text"
              placeholder="Task title"
              value={newTask.title}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
            />
            <input
              type="text"
              placeholder="Category"
              value={newTask.category}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            />
            <input
              type="number"
              min="15"
              step="15"
              value={newTask.estimatedMinutes}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  estimatedMinutes: Number(event.target.value) || 60,
                }))
              }
            />
            <input
              type="date"
              min="2026-10-06"
              max="2026-11-10"
              value={newTask.dueDate}
              onChange={(event) =>
                setNewTask((current) => ({
                  ...current,
                  dueDate: event.target.value,
                }))
              }
            />
          </div>

          <div className="board-grid">
            {board.map(({ status, items }) => (
              <div key={status} className="column">
                <div className="column-header">
                  <span>{status.replace("_", " ")}</span>
                  <span className="badge">{items.length}</span>
                </div>

                {items.length === 0 ? (
                  <div className="empty-column">No tasks</div>
                ) : (
                  items.map((task) => (
                    <article key={task.id} className="task-card">
                      <div className="task-meta">
                        <span>{task.category}</span>
                        <span>{task.estimatedMinutes} min</span>
                      </div>
                      <h3>{task.title}</h3>
                      <p>{task.description}</p>
                      <div className="task-footer">
                        <span>Due {task.dueDate}</span>
                        <select
                          aria-label={`Change status for ${task.title}`}
                          value={task.status}
                          onChange={(event) =>
                            handleStatusChange(
                              task.id,
                              event.target.value as TaskStatus,
                            )
                          }
                        >
                          <option value="todo">TODO</option>
                          <option value="in_progress">IN PROGRESS</option>
                          <option value="blocked">BLOCKED</option>
                          <option value="done">DONE</option>
                        </select>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="context-panel panel">
          <div className="board-header">
            <div>
              <p className="eyebrow">Current context</p>
              <h2>Job switch prep</h2>
            </div>
            <button
              type="button"
              className="ghost-button"
              onClick={handleSaveContext}
            >
              Save context
            </button>
          </div>

          <div className="context-form">
            <label>
              Goal
              <textarea
                value={contextDraft.goal}
                onChange={(event) =>
                  setContextDraft((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Itinerary
              <textarea
                value={contextDraft.itinerary}
                onChange={(event) =>
                  setContextDraft((current) => ({
                    ...current,
                    itinerary: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Behavioral context
              <textarea
                value={contextDraft.behaviors}
                onChange={(event) =>
                  setContextDraft((current) => ({
                    ...current,
                    behaviors: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Constraints
              <textarea
                value={contextDraft.constraints}
                onChange={(event) =>
                  setContextDraft((current) => ({
                    ...current,
                    constraints: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="context-save-status">{contextSavedAt}</div>
        </section>
      </main>
    </div>
  );
}

export default App;
