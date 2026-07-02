import {
  deserializeAppState,
  getDefaultAppState,
  KV_STATE_KEY,
  serializeAppState,
  type PersistedAppState,
} from "./stateSchema";

const LOCAL_STORAGE_KEY = "debt-tracker-state";
const API_TIMEOUT_MS = 3000;

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

type ApiLoadResult = "empty" | PersistedAppState;

async function loadFromApi(): Promise<ApiLoadResult> {
  const response = await fetch("/api/state", { cache: "no-store" });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new StorageError(
      body.error ?? `Failed to load debt data (HTTP ${response.status})`
    );
  }

  const payload = (await response.json()) as { state: unknown | null };
  if (!payload.state) return "empty";

  const state = deserializeAppState(payload.state);
  if (!state) {
    throw new StorageError("Saved data on server is invalid or unsupported");
  }

  return state;
}

async function saveToApi(state: PersistedAppState): Promise<void> {
  const serialized = serializeAppState(state);

  console.log("[debt-tracker] Redis PUT before", {
    key: KV_STATE_KEY,
    payload: serialized,
  });

  let response: Response;
  try {
    response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
      keepalive: true,
    });
  } catch (error) {
    console.error("[debt-tracker] Redis PUT failed (network)", error);
    throw new StorageError(
      "Network error while saving — check your connection and try again"
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: string;
      detail?: string;
    };
    console.error("[debt-tracker] Redis PUT failed — full response", {
      key: KV_STATE_KEY,
      status: response.status,
      statusText: response.statusText,
      body,
    });
    const message =
      body.detail ??
      body.error ??
      `Failed to save debt data (HTTP ${response.status})`;
    throw new StorageError(message);
  }

  console.log("[debt-tracker] Redis PUT after", {
    key: KV_STATE_KEY,
    ok: true,
  });
}

async function resetApi(): Promise<void> {
  const response = await fetch("/api/state", { method: "DELETE" });
  if (!response.ok) {
    throw new StorageError("Failed to reset debt data on server");
  }
}

function saveToLocalStorage(state: PersistedAppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(serializeAppState(state))
  );
}

function clearLocalStorage(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export interface LoadAppStateResult {
  state: PersistedAppState;
  /** True when Redis returned no saved data yet (first visit). */
  isNew: boolean;
}

/**
 * Loads persisted state from Redis only. Throws StorageError on failure or
 * timeout. Returns defaults only when Redis responds successfully with no
 * saved data (first visit).
 */
export async function loadAppState(): Promise<LoadAppStateResult> {
  const result = await withTimeout(loadFromApi(), API_TIMEOUT_MS);

  if (result === null) {
    throw new StorageError(
      "Timed out loading debt data from server — please retry"
    );
  }

  if (result === "empty") {
    return { state: getDefaultAppState(), isNew: true };
  }

  return { state: result, isNew: false };
}

/**
 * Mirrors to localStorage, then persists to Redis. Throws StorageError if
 * the Redis PUT fails.
 */
export async function saveAppState(state: PersistedAppState): Promise<void> {
  saveToLocalStorage(state);
  await saveToApi(state);
}

/**
 * Clears persisted state (explicit reset only).
 */
export async function resetAppState(): Promise<void> {
  await resetApi();
  clearLocalStorage();
}

export { getDefaultAppState };
