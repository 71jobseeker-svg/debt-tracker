import {
  deserializeAppState,
  getDefaultAppState,
  serializeAppState,
  type PersistedAppState,
} from "./stateSchema";

const LOCAL_STORAGE_KEY = "debt-tracker-state";
const API_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function loadFromApi(): Promise<PersistedAppState | null> {
  try {
    const response = await fetch("/api/state", { cache: "no-store" });
    if (!response.ok) return null;

    const payload = (await response.json()) as { state: unknown | null };
    if (!payload.state) return null;

    return deserializeAppState(payload.state);
  } catch {
    return null;
  }
}

async function saveToApi(state: PersistedAppState): Promise<boolean> {
  try {
    const response = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function resetApi(): Promise<boolean> {
  try {
    const response = await fetch("/api/state", { method: "DELETE" });
    return response.ok;
  } catch {
    return false;
  }
}

function loadFromLocalStorage(): PersistedAppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return deserializeAppState(JSON.parse(raw));
  } catch {
    return null;
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

/**
 * Loads persisted state: tries Redis (with timeout), then localStorage, then
 * returns null (caller falls back to hardcoded defaults). localStorage is read
 * synchronously so slow/failed Redis never blocks showing cached data.
 */
export async function loadAppState(): Promise<PersistedAppState | null> {
  const fromLocal = loadFromLocalStorage();
  const fromApi = await withTimeout(loadFromApi(), API_TIMEOUT_MS);

  if (fromApi) return fromApi;
  if (fromLocal) return fromLocal;
  return null;
}

/**
 * Persists state to localStorage immediately, then awaits Redis PUT.
 * Returns true if Redis save succeeded.
 */
export async function saveAppState(state: PersistedAppState): Promise<boolean> {
  saveToLocalStorage(state);
  return saveToApi(state);
}

/**
 * Clears persisted state (explicit reset only).
 */
export async function resetAppState(): Promise<void> {
  await resetApi();
  clearLocalStorage();
}

export { getDefaultAppState };
