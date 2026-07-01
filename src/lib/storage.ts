import {
  deserializeAppState,
  getDefaultAppState,
  serializeAppState,
  type PersistedAppState,
} from "./stateSchema";

const LOCAL_STORAGE_KEY = "debt-tracker-state";

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
 * Loads persisted state from Vercel KV (via API), falling back to
 * localStorage when KV is unavailable (e.g. local dev without env vars).
 * Returns null if no saved data exists — does NOT return defaults.
 */
export async function loadAppState(): Promise<PersistedAppState | null> {
  const fromApi = await loadFromApi();
  if (fromApi) return fromApi;

  return loadFromLocalStorage();
}

/**
 * Persists state to Vercel KV, with localStorage as a dev fallback.
 */
export async function saveAppState(state: PersistedAppState): Promise<void> {
  const savedToApi = await saveToApi(state);
  if (!savedToApi) {
    saveToLocalStorage(state);
  }
}

/**
 * Clears persisted state (explicit reset only).
 */
export async function resetAppState(): Promise<void> {
  await resetApi();
  clearLocalStorage();
}

export { getDefaultAppState };
