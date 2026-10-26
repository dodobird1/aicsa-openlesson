"use client";

import { useSyncExternalStore } from "react";
import { emptyProgress, parseProgress, PROGRESS_STORAGE_KEY, recordExerciseProgress, toggleLessonProgress, type ProgressState } from "./model";

const serverSnapshot = emptyProgress();
let snapshot: ProgressState = serverSnapshot;
let initialized = false;
const listeners = new Set<() => void>();

function initialize() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    snapshot = parseProgress(window.localStorage.getItem(PROGRESS_STORAGE_KEY));
  } catch {
    // Private browsing and storage policies must not disable in-memory progress.
    snapshot = emptyProgress();
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function onStorage(event: StorageEvent) {
  if (event.key !== PROGRESS_STORAGE_KEY && event.key !== null) return;
  try {
    if (event.storageArea && event.storageArea !== window.localStorage) return;
  } catch {
    return;
  }
  snapshot = parseProgress(event.key === null ? null : event.newValue);
  initialized = true;
  notify();
}

function subscribe(listener: () => void) {
  initialize();
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  initialize();
  return snapshot;
}

function update(next: ProgressState) {
  snapshot = next;
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Keep the current session functional even if persistence is unavailable.
  }
  notify();
}

function toggleLesson(id: string) {
  update(toggleLessonProgress(getSnapshot(), id));
}

function recordExercise(id: string, correct: boolean) {
  update(recordExerciseProgress(getSnapshot(), id, correct));
}

function reset() {
  initialize();
  update(emptyProgress());
}

/** Provider-free, SSR-safe progress shared across all lesson and quiz controls. */
export function useProgress() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
  return { completed: state.completed, outcomes: state.outcomes, toggleLesson, recordExercise, reset };
}
