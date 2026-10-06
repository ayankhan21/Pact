export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "done"
  | "cancelled";

export type PlanRecord = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "active" | "paused" | "completed";
  created_at: string;
  updated_at: string;
};

export type TaskRecord = {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  estimated_minutes: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskScheduleRecord = {
  id: string;
  task_id: string;
  scheduled_date: string;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskEventRecord = {
  id: string;
  task_id: string;
  event_type:
    | "created"
    | "scheduled"
    | "started"
    | "completed"
    | "postponed"
    | "rescheduled"
    | "blocked"
    | "cancelled"
    | "reopened";
  metadata_json: string | null;
  created_at: string;
};

export type ContextRecord = {
  id: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ConversationRecord = {
  id: string;
  created_at: string;
  updated_at: string;
};

export type MessageRecord = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  created_at: string;
};
