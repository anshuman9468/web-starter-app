/**
 * Voice Assistant Tools - Local processing for tasks, time, reminders
 * All functions run entirely in the browser with no external APIs
 */

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: number;
}

export interface Reminder {
  id: string;
  text: string;
  time: number;
  triggered: boolean;
}

// Local storage keys
const TASKS_KEY = 'voice_assistant_tasks';
const REMINDERS_KEY = 'voice_assistant_reminders';

// ============================================================================
// Task Management
// ============================================================================

export function getTasks(): Task[] {
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function addTask(text: string, dueDate?: number): Task {
  const tasks = getTasks();
  const task: Task = {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: Date.now(),
    dueDate,
  };
  tasks.push(task);
  saveTasks(tasks);
  return task;
}

export function completeTask(taskId: string): boolean {
  const tasks = getTasks();
  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.completed = true;
    saveTasks(tasks);
    return true;
  }
  return false;
}

export function deleteTask(taskId: string): boolean {
  const tasks = getTasks();
  const filtered = tasks.filter((t) => t.id !== taskId);
  if (filtered.length !== tasks.length) {
    saveTasks(filtered);
    return true;
  }
  return false;
}

export function clearCompletedTasks(): number {
  const tasks = getTasks();
  const remaining = tasks.filter((t) => !t.completed);
  const clearedCount = tasks.length - remaining.length;
  saveTasks(remaining);
  return clearedCount;
}

// ============================================================================
// Reminder Management
// ============================================================================

export function getReminders(): Reminder[] {
  try {
    const stored = localStorage.getItem(REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveReminders(reminders: Reminder[]): void {
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export function addReminder(text: string, time: number): Reminder {
  const reminders = getReminders();
  const reminder: Reminder = {
    id: Date.now().toString(),
    text,
    time,
    triggered: false,
  };
  reminders.push(reminder);
  saveReminders(reminders);
  return reminder;
}

export function deleteReminder(reminderId: string): boolean {
  const reminders = getReminders();
  const filtered = reminders.filter((r) => r.id !== reminderId);
  if (filtered.length !== reminders.length) {
    saveReminders(filtered);
    return true;
  }
  return false;
}

// ============================================================================
// Time & Date Utilities
// ============================================================================

export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getCurrentDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDayOfWeek(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { weekday: 'long' });
}

export function getTimeUntil(targetTime: number): string {
  const now = Date.now();
  const diff = targetTime - now;
  
  if (diff <= 0) return 'now';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

// ============================================================================
// Natural Language Processing Helpers
// ============================================================================

export function extractTaskFromText(text: string): { task: string; dueDate?: number } | null {
  // Simple NLP to detect task creation requests
  const taskPatterns = [
    /(?:add|create|make|new) (?:a )?(?:task|todo|reminder) (?:to |for )?(.+)/i,
    /(?:remind me to|i need to|i have to|i should) (.+)/i,
  ];
  
  for (const pattern of taskPatterns) {
    const match = text.match(pattern);
    if (match) {
      return { task: match[1].trim() };
    }
  }
  
  return null;
}

export function detectTimeQuery(text: string): 'time' | 'date' | 'day' | null {
  const lowerText = text.toLowerCase();
  
  if (/what(?:'s| is) the time|tell me the time|current time/.test(lowerText)) {
    return 'time';
  }
  
  if (/what(?:'s| is) the date|what(?:'s| is) today|today(?:'s| is) date/.test(lowerText)) {
    return 'date';
  }
  
  if (/what day is it|which day|day of (?:the )?week/.test(lowerText)) {
    return 'day';
  }
  
  return null;
}

export function detectTaskQuery(text: string): 'list' | 'count' | 'clear' | null {
  const lowerText = text.toLowerCase();
  
  if (/(?:list|show|what are|tell me) (?:my )?tasks/.test(lowerText)) {
    return 'list';
  }
  
  if (/how many tasks|task count/.test(lowerText)) {
    return 'count';
  }
  
  if (/clear (?:completed )?tasks|delete completed/.test(lowerText)) {
    return 'clear';
  }
  
  return null;
}

// ============================================================================
// Assistant Response Builder
// ============================================================================

export function buildAssistantContext(): string {
  const tasks = getTasks();
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const currentTime = getCurrentTime();
  const currentDate = getCurrentDate();
  
  let context = `Time: ${currentTime}. Date: ${currentDate}.`;
  
  if (incompleteTasks.length > 0) {
    context += ` Tasks: ${incompleteTasks.slice(0, 3).map((t) => t.text).join(', ')}`;
    if (incompleteTasks.length > 3) {
      context += ` +${incompleteTasks.length - 3} more`;
    }
  }
  
  return context;
}

export function generateAssistantSystemPrompt(): string {
  return `You are a helpful voice assistant. Keep all responses under 15 words and very conversational. Be friendly and concise.`;
}
