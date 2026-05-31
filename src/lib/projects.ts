// Per-project persistence of paint color preferences (manual overrides).
// Stored in localStorage so each project keeps its own equivalence choices.

export type ColorOverride = {
  brandId: string;   // brand chosen for this override
  code: string;      // color code within that brand
};

export type ProjectPrefs = {
  name: string;
  paintPalette: string;                 // preferred main brand
  overrides: Record<string, ColorOverride>; // key = source hex (UPPERCASE)
  updatedAt: number;
};

const KEY = "atelier:projects:v1";
const CURRENT_KEY = "atelier:projects:current";

type Store = Record<string, ProjectPrefs>;

function read(): Store {
  if (typeof localStorage === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Store; }
  catch { return {}; }
}

function write(s: Store) {
  if (typeof localStorage === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function listProjects(): ProjectPrefs[] {
  return Object.values(read()).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getProject(name: string): ProjectPrefs | null {
  return read()[name] ?? null;
}

export function saveProject(p: ProjectPrefs) {
  const s = read();
  s[p.name] = { ...p, updatedAt: Date.now() };
  write(s);
}

export function deleteProject(name: string) {
  const s = read();
  delete s[name];
  write(s);
}

export function getCurrentProject(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentProject(name: string | null) {
  if (typeof localStorage === "undefined") return;
  if (name) localStorage.setItem(CURRENT_KEY, name);
  else localStorage.removeItem(CURRENT_KEY);
}

export const normHex = (h: string) => h.toUpperCase();
