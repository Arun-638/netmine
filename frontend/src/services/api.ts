// =========================================================
// NetMine AI — Central API & Settings Service
// =========================================================

export const DEFAULT_API_URL = "http://localhost:8000";

export interface AppSettings {
  apiUrl: string;
  iface: string;
  ifThreshold: number;
  dbscanEps: number;
  dbscanMin: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiUrl: DEFAULT_API_URL,
  iface: "Wi-Fi",
  ifThreshold: 0.70,
  dbscanEps: 0.5,
  dbscanMin: 5,
};

const STORAGE_KEY = "netmine_app_settings";

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return {
      apiUrl: typeof parsed.apiUrl === "string" && parsed.apiUrl ? parsed.apiUrl : DEFAULT_SETTINGS.apiUrl,
      iface: typeof parsed.iface === "string" && parsed.iface ? parsed.iface : DEFAULT_SETTINGS.iface,
      ifThreshold: typeof parsed.ifThreshold === "number" ? parsed.ifThreshold : DEFAULT_SETTINGS.ifThreshold,
      dbscanEps: typeof parsed.dbscanEps === "number" ? parsed.dbscanEps : DEFAULT_SETTINGS.dbscanEps,
      dbscanMin: typeof parsed.dbscanMin === "number" ? parsed.dbscanMin : DEFAULT_SETTINGS.dbscanMin,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage:", err);
  }
}

export function resetSettings(): AppSettings {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear settings from localStorage:", err);
  }
  return { ...DEFAULT_SETTINGS };
}

export function getApiUrl(): string {
  return loadSettings().apiUrl;
}
