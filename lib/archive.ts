import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export const statuses = ["Draft", "Applied", "Interviewing", "Offer", "Rejected", "Withdrawn"] as const;
export type Status = typeof statuses[number];

export type Role = { id: string; name: string; versions: string[] };
export type Application = {
  id: string;
  company: string;
  title: string;
  roleId: string;
  source?: { roleId: string; version: string };
  posting: string;
  description: string;
  notes: string;
  createdAt: string;
  status: Status;
  submission?: { file: string; date: string };
};

const root = path.resolve(/* turbopackIgnore: true */ process.env.RESUME_TRACER_DATA_DIR || "archive");
const defaults: Role[] = [
  { id: "data-engineer", name: "Data Engineer", versions: [] },
  { id: "ai-engineer", name: "AI Engineer", versions: [] },
  { id: "data-scientist", name: "Data Scientist", versions: [] },
  { id: "forward-deployed-engineer", name: "Forward Deployed Engineer", versions: [] },
];

function safeSegment(value: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(value)) throw new Error("Invalid record ID.");
  return value;
}

function folder(kind: "resumes" | "applications", id: string) {
  return path.join(root, kind, safeSegment(id));
}

function missing(error: unknown) {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}

async function writeAtomic(file: string, content: string | Buffer, replace = true) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
    if (replace) await rename(temporary, file);
    else await link(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

// Serialize mutations within the single local app process.
let pending: Promise<unknown> = Promise.resolve();
export function mutate<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => undefined);
  return result;
}

async function records<T>(kind: "resumes" | "applications") {
  const directory = path.join(root, kind);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (missing(error)) return [];
    throw error;
  }
  const ids = entries.filter(entry => entry.isDirectory() && /^[a-z0-9][a-z0-9-]{0,100}$/.test(entry.name));
  const result: T[] = [];
  // Bound concurrent filesystem reads as the archive grows.
  for (let i = 0; i < ids.length; i += 32) {
    const batch = await Promise.all(ids.slice(i, i + 32).map(entry => readJson<T>(path.join(directory, entry.name, "record.json"))));
    for (const record of batch) if (record) result.push(record);
  }
  return result;
}

export async function roles() {
  const saved = new Map((await records<Role>("resumes")).map(role => [role.id, role]));
  for (const role of defaults) if (!saved.has(role.id)) saved.set(role.id, role);
  return [...saved.values()].sort((a, b) => {
    if (a.id === "data-engineer") return -1;
    if (b.id === "data-engineer") return 1;
    return a.name.localeCompare(b.name);
  });
}

export const applications = () => records<Application>("applications");

export function application(id: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(id)) return Promise.resolve(null);
  return readJson<Application>(path.join(folder("applications", id), "record.json"));
}

export function saveApplication(record: Application) {
  return writeAtomic(path.join(folder("applications", record.id), "record.json"), JSON.stringify(record, null, 2) + "\n");
}

export function saveRole(role: Role) {
  return writeAtomic(path.join(folder("resumes", role.id), "record.json"), JSON.stringify(role, null, 2) + "\n");
}

export async function upload(kind: "resumes" | "applications", id: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a resume file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a file no larger than 10 MB.");
  const extension = path.extname(file.name).toLowerCase();
  const content = Buffer.from(await file.arrayBuffer());
  const pdf = extension === ".pdf" && content.subarray(0, 5).toString() === "%PDF-";
  const docx = extension === ".docx" && content.length >= 4 && content.readUInt32LE(0) === 0x04034b50;
  if (!pdf && !(kind === "resumes" && docx)) throw new Error(kind === "resumes" ? "Choose a PDF or DOCX file." : "Choose a PDF file.");
  const name = `${randomUUID()}${extension}`;
  await writeAtomic(path.join(folder(kind, id), name), content, false);
  return name;
}

export function removeUpload(kind: "resumes" | "applications", id: string, name: string) {
  return rm(path.join(folder(kind, id), name), { force: true });
}

export async function download(kind: string, id: string, name: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,100}$/.test(id) || !/^[a-f0-9-]{36}\.(pdf|docx)$/.test(name)) return null;
  if (kind === "resumes") {
    const role = await readJson<Role>(path.join(folder(kind, id), "record.json"));
    if (!role?.versions.includes(name)) return null;
  } else if (kind === "applications") {
    const record = await application(id);
    if (record?.submission?.file !== name) return null;
  } else return null;
  try {
    return await readFile(path.join(folder(kind, id), name));
  } catch (error) {
    if (missing(error)) return null;
    throw error;
  }
}
