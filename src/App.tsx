import { useMemo, useState } from "react";
import "./App.css";
import {
  calculateCompletionRate,
  moveTaskToStatus,
  type Task,
  type TaskStatus,
} from "./lib/task-state";

const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Kafka consumer implementation",
    description:
      "Build and validate the consumer flow for the interview prep sprint.",
    category: "Backend",
    status: "in_progress",
    estimatedMinutes: 90,
    dueDate: "2026-10-06",
    history: [
      {
        from: "todo",
        to: "in_progress",
        createdAt: "2026-10-06T08:15:00.000Z",
      },
    ],
  },
  {
    id: "task-2",
    title: "DSA practice set",
    description: "Solve three medium questions and review patterns.",
    category: "Algorithms",
    status: "todo",
    estimatedMinutes: 75,
    dueDate: "2026-10-06",
    history: [],
  },
  {
    id: "task-3",
    title: "System design rehearsal",
    description:
      "Walk through a URL shortener and capture decision trade-offs.",
    category: "System Design",
    status: "blocked",
    estimatedMinutes: 60,
    dueDate: "2026-10-06",
    history: [
      {
        from: "todo",
        to: "blocked",
        createdAt: "2026-10-06T07:10:00.000Z",
        reason: "Waiting on notes",
      },
    ],
  },
  {
    id: "task-4",
    title: "Resume polish",
    description: "Tighten the backend bullets and quantify wins.",
    category: "Career",
    status: "done",
    estimatedMinutes: 45,
    dueDate: "2026-10-05",
    history: [
      { from: "todo", to: "done", createdAt: "2026-10-05T19:00:00.000Z" },
    ],
  },
];

const statusOrder: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];

function App() {
  const [tasks, setTasks] = useState(initialTasks);

  const board = useMemo(
    () =>
      statusOrder.map((status) => ({
        status,
        items: tasks.filter((task) => task.status === status),
      })),
    [tasks],
  );

  const completionRate = calculateCompletionRate(tasks);

  const handleStatusChange = (taskId: string, nextStatus: TaskStatus) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? moveTaskToStatus(task, nextStatus) : task,
      ),
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
          <span>Today • 2026-10-06</span>
          <button type="button" className="profile-pill">
            A
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="chat-panel panel">
          <div className="chat-header">
            <span>Ask Pact anything</span>
            <span className="chat-status">Live</span>
          </div>

          <div className="message-list">
            <div className="bubble assistant">
              You have 3 tasks remaining today. Focus on Kafka first, then DSA,
              and keep the system design block active if energy drops later.
            </div>
            <div className="bubble user">
              I finished the resume pass and I’m starting Kafka now.
            </div>
            <div className="bubble assistant">
              Good. That keeps the day on track. We’ll check the DSA block after
              the Kafka session.
            </div>
          </div>

          <div className="composer">
            <input
              type="text"
              value="Tell me what I need to do today..."
              readOnly
            />
            <button type="button">→</button>
          </div>
        </section>

        <section className="summary-grid">
          <article className="metric-card panel">
            <span>Today’s completion</span>
            <strong>{completionRate}%</strong>
          </article>
          <article className="metric-card panel">
            <span>Completed today</span>
            <strong>1</strong>
          </article>
          <article className="metric-card panel">
            <span>Remaining today</span>
            <strong>3</strong>
          </article>
          <article className="metric-card panel">
            <span>Current streak</span>
            <strong>4 days</strong>
          </article>
        </section>

        <section className="board-wrap panel">
          <div className="board-header">
            <div>
              <p className="eyebrow">Today</p>
              <h2>Kanban board</h2>
            </div>
            <button type="button" className="ghost-button">
              + Add task
            </button>
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
            <button type="button" className="ghost-button">
              Save context
            </button>
          </div>

          <div className="context-content">
            <div>
              <h3>Goal</h3>
              <p>
                Switch into a backend engineering role within the next six
                weeks.
              </p>
            </div>
            <div>
              <h3>Behavior</h3>
              <p>
                I tend to overestimate energy after a long focus block, so Pact
                should protect my deep-work time.
              </p>
            </div>
            <div>
              <h3>Constraints</h3>
              <p>
                Weekdays allow about 3 hours of focused work, and system design
                tasks consistently need more buffer time.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
