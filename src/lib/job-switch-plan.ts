import type { Task } from "./task-state";

export const jobSwitchContext = {
  goal: "Move into a funded startup within about 1.5 months, by November 10, 2026.",
  itinerary:
    "October 6-November 10: build and ship a multi-tenant SaaS app using React, Node, and Postgres; practice DSA daily; ship a small mini-build daily; study system design except Saturdays unless a date-specific reading is listed; begin applying October 16; and review the interview pipeline November 9-10.",
  behaviors:
    "Keep accountability grounded in planned versus actual progress. When work slips, ask what changed, identify the smallest useful next action, and help re-scope realistically. Do not assume a task is complete unless I say so.",
  constraints:
    "Daily routine: one DSA problem (45 min), mini-build (1-2 hr), multi-tenant SaaS project (2-3 hr), and system-design reading (30 min except Saturdays). Behavioral STAR practice is Wednesday and Sunday (30 min). Sundays also include resume/ATS and portfolio updates. Applications are 5-8 per day from October 16, with follow-up after 5-7 days and a simple company/date/status/follow-up tracker. Saturday system-design work is omitted except when explicitly listed in the itinerary.",
};

const phases = [
  {
    start: "2026-10-06",
    end: "2026-10-11",
    dsa: "arrays, hashmaps, and strings",
    miniBuilds:
      "URL shortener, rate-limited API, markdown notes app, webhook receiver, or CLI tool",
  },
  {
    start: "2026-10-12",
    end: "2026-10-18",
    dsa: "two pointers, sliding window, and stacks",
    miniBuilds:
      "Kanban board, expense tracker, JWT debugger, GitHub profile stats page, or polling-vs-websockets demo",
  },
  {
    start: "2026-10-19",
    end: "2026-10-25",
    dsa: "trees, recursion, and BFS/DFS",
    miniBuilds:
      "job queue dashboard, real-time chat, feature-flag service, or S3 file upload",
  },
  {
    start: "2026-10-26",
    end: "2026-11-01",
    dsa: "graphs, binary search, and intervals",
    miniBuilds:
      "RAG over a PDF, tool-calling bot, AI commit-message generator, or resume-vs-job-description matcher",
  },
  {
    start: "2026-11-02",
    end: "2026-11-10",
    dsa: "mixed revision and introductory dynamic programming",
    miniBuilds: "choose a small build based on interview feedback",
  },
];

const dailyFocus: Record<
  string,
  { project: string; systemDesign?: string; extra?: string[] }
> = {
  "2026-10-06": {
    project:
      "Set up the repo, Docker, and Postgres schema for users, orgs, projects, and tasks",
    systemDesign: "HTTP and client-server",
  },
  "2026-10-07": {
    project: "Implement authentication with JWT and refresh tokens",
    systemDesign: "REST design and status codes",
  },
  "2026-10-08": {
    project: "Implement role-based access and organization scoping",
    systemDesign: "SQL vs NoSQL",
  },
  "2026-10-09": {
    project: "Build CRUD APIs with Zod validation",
    systemDesign: "database indexing",
  },
  "2026-10-10": {
    project: "Add migrations, seed data, and error handling",
  },
  "2026-10-11": {
    project: "Build the React login and dashboard frontend",
    systemDesign: "caching basics",
  },
  "2026-10-12": {
    project: "Build projects and tasks UI with React Query",
    systemDesign: "load balancing",
  },
  "2026-10-13": {
    project: "Dockerize and deploy the backend and database",
    systemDesign: "horizontal vs vertical scaling",
  },
  "2026-10-14": {
    project: "Deploy the frontend and set up CI with GitHub Actions",
    systemDesign: "CDNs",
  },
  "2026-10-15": {
    project: "Write the README, architecture diagram, and demo data",
    systemDesign: "consistent hashing basics",
  },
  "2026-10-16": {
    project: "Fix rough edges while starting the application pipeline",
    systemDesign: "replication",
  },
  "2026-10-17": {
    project: "Add logging and rate limiting",
  },
  "2026-10-18": {
    project: "Test authentication and critical user paths",
    systemDesign: "the CAP theorem",
  },
  "2026-10-19": {
    project: "Add Redis caching to a hot endpoint",
    systemDesign: "cache invalidation",
  },
  "2026-10-20": {
    project: "Add BullMQ background jobs for email or reports",
    systemDesign: "message queues",
  },
  "2026-10-21": {
    project: "Add pagination, filtering, and search",
    systemDesign: "API pagination patterns",
  },
  "2026-10-22": {
    project: "Build an audit log or activity feed",
    systemDesign: "event-driven design",
  },
  "2026-10-23": {
    project: "Add health checks, metrics, and observability",
    systemDesign: "monitoring",
  },
  "2026-10-24": {
    project: "Review query plans and indexes for performance",
    systemDesign: "database sharding",
  },
  "2026-10-25": {
    project: "Polish the project and apply to top-choice companies",
    systemDesign: "weekly system-design review",
  },
  "2026-10-26": {
    project: "Set up pgvector and an embeddings pipeline",
    systemDesign: "design a notification system",
  },
  "2026-10-27": {
    project: "Build semantic search over tasks and projects",
    systemDesign: "design a URL shortener",
  },
  "2026-10-28": {
    project: "Add an LLM summary of project activity",
    systemDesign: "design a rate limiter",
  },
  "2026-10-29": {
    project: "Add streaming responses and prompt/cost handling",
    systemDesign: "design a chat app",
  },
  "2026-10-30": {
    project: "Polish AI features and failure handling",
    systemDesign: "design a news feed",
  },
  "2026-10-31": {
    project: "Test and document the AI feature",
    systemDesign: "weekly system-design review",
  },
  "2026-11-01": {
    project:
      "Overhaul the portfolio with case studies and follow up on applications",
  },
  "2026-11-02": {
    project: "Close the most important project gap found in mock interviews",
    extra: ["Mock system design: Dropbox; speak through the design out loud"],
  },
  "2026-11-03": {
    project: "Close the most important project gap found in mock interviews",
    extra: ["Mock system design: Uber; speak through the design out loud"],
  },
  "2026-11-04": {
    project: "Close the most important project gap found in mock interviews",
    extra: ["Mock system design: Instagram; speak through the design out loud"],
  },
  "2026-11-05": {
    project: "Fix project gaps surfaced in interviews",
  },
  "2026-11-06": {
    project: "Fix project gaps surfaced in interviews",
  },
  "2026-11-07": {
    project: "Run a security pass covering OWASP basics, secrets, and CORS",
    systemDesign: "authentication at scale",
  },
  "2026-11-08": {
    project: "Polish the project and record a two-minute README demo",
  },
  "2026-11-09": {
    project:
      "Review the application pipeline: applied, replied, and interviewing",
    extra: ["Decide what to drop or double down on based on pipeline status"],
  },
  "2026-11-10": {
    project: "Finish the pipeline review and plan the next phase",
  },
};

const dateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00.000Z`);
  const last = new Date(`${end}T00:00:00.000Z`);

  while (current <= last) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};

const makeTask = (
  date: string,
  key: string,
  title: string,
  category: string,
  estimatedMinutes: number,
  description: string,
): Task => ({
  id: `${date}-${key}`,
  title,
  category,
  status: "todo",
  estimatedMinutes,
  dueDate: date,
  description,
  history: [],
});

export const buildJobSwitchTasks = (): Task[] => {
  const start = "2026-10-06";
  const end = "2026-11-10";
  const dates = dateRange(start, end);

  return dates.flatMap((date) => {
    const phase = phases.find(
      (entry) => date >= entry.start && date <= entry.end,
    );
    const focus = dailyFocus[date];

    if (!phase || !focus) {
      return [];
    }

    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const tasks = [
      makeTask(
        date,
        "dsa",
        `DSA: ${phase.dsa} - solve at least one problem`,
        "DSA",
        45,
        "Solve one problem minimum, then note the pattern and anything to revisit.",
      ),
      makeTask(
        date,
        "mini-build",
        "Mini build: ship one small idea today",
        "Mini build",
        90,
        `Spend 1-2 hours and ship today. Ideas for this phase: ${phase.miniBuilds}.`,
      ),
      makeTask(
        date,
        "main-project",
        `Main project: ${focus.project}`,
        "Main project",
        150,
        "Work 2-3 focused hours on the multi-tenant SaaS app using React, Node, and Postgres.",
      ),
    ];

    const mockDesignScheduled = focus.extra?.some((title) =>
      title.startsWith("Mock system design:"),
    );

    if (focus.systemDesign || date === "2026-10-10") {
      tasks.push(
        makeTask(
          date,
          "system-design",
          `System design: ${focus.systemDesign ?? "optional rest-day reading"}`,
          "System design",
          30,
          date === "2026-10-10"
            ? "Optional rest-day reading, per the itinerary."
            : "Read for 30 minutes and capture one useful design trade-off.",
        ),
      );
    } else if (weekday !== 6 && !mockDesignScheduled) {
      tasks.push(
        makeTask(
          date,
          "system-design",
          "System design: weekly reading and review",
          "System design",
          30,
          "Read for 30 minutes and capture one useful design trade-off.",
        ),
      );
    }

    if (focus.extra) {
      for (const [index, title] of focus.extra.entries()) {
        tasks.push(
          makeTask(
            date,
            `focus-${index + 1}`,
            title,
            "Interview prep",
            60,
            "Practice aloud, then write down one gap to address in the project.",
          ),
        );
      }
    }

    if (weekday === 3 || weekday === 0) {
      tasks.push(
        makeTask(
          date,
          "behavioral",
          "Behavioral practice: write and speak one STAR story",
          "Behavioral",
          30,
          "Rotate through conflict, failure, ownership, tight deadline, and a bug you fixed. Write the STAR outline and say it out loud.",
        ),
      );
    }

    if (weekday === 0) {
      tasks.push(
        makeTask(
          date,
          "resume-ats",
          "Update resume and run an ATS check",
          "Career",
          45,
          "Update the resume and check it with Jobscan or a similar ATS tool.",
        ),
        makeTask(
          date,
          "portfolio",
          date === "2026-11-01"
            ? "Overhaul portfolio with case studies"
            : "Update portfolio site",
          "Career",
          date === "2026-11-01" ? 120 : 60,
          "Refresh the portfolio with the latest project progress and evidence.",
        ),
      );
    }

    if (date >= "2026-10-16" && date <= "2026-11-08") {
      tasks.push(
        makeTask(
          date,
          "applications",
          "Apply to 5-8 startup roles and update the tracker",
          "Job search",
          60,
          "Track company, application date, status, and follow-up date. Follow up 5-7 days after applying.",
        ),
      );

      if (date >= "2026-10-21") {
        tasks.push(
          makeTask(
            date,
            "follow-ups",
            "Follow up on applications due and update their status",
            "Job search",
            20,
            "Use the application tracker to identify applications from 5-7 days ago.",
          ),
        );
      }
    }

    if (date >= "2026-11-09") {
      tasks.push(
        makeTask(
          date,
          "pipeline-review",
          date === "2026-11-09"
            ? "Review pipeline: applied, replied, and interviewing"
            : "Decide what to drop, double down on, and plan next phase",
          "Job search",
          45,
          "Use the company tracker and current interview status to choose the next focus.",
        ),
      );
    }

    return tasks;
  });
};
