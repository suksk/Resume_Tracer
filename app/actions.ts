"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { application, mutate, removeUpload, roles, saveApplication, saveRole, statuses, upload, type Status } from "../lib/archive";

export type FormState = { error?: string; success?: string };

function field(form: FormData, key: string, maximum: number, required = false) {
  const value = String(form.get(key) ?? "").trim();
  if (required && !value) throw new Error(`${key[0].toUpperCase() + key.slice(1)} is required.`);
  if (value.length > maximum) throw new Error(`${key[0].toUpperCase() + key.slice(1)} is too long.`);
  return value;
}

function failure(error: unknown): FormState {
  if (error instanceof Error && "code" in error) {
    console.error(error);
    return { error: "The archive could not be saved. Check that its folder is writable." };
  }
  return { error: error instanceof Error ? error.message : "Something went wrong." };
}

export async function createApplication(_state: FormState, form: FormData): Promise<FormState> {
  let id: string;
  try {
    id = await mutate(async () => {
      const available = await roles();
      const role = available.find(item => item.id === form.get("role"));
      if (!role) throw new Error("Choose a role.");
      const source = available.find(item => item.id === form.get("source"));
      if (form.get("source") && !source?.versions.length) throw new Error("Choose an available starting resume.");
      const posting = field(form, "posting", 2048);
      if (posting && !/^https?:\/\/[^\s]+$/i.test(posting)) throw new Error("Enter a posting URL starting with https:// or http://.");
      const id = randomUUID();
      await saveApplication({
        id, roleId: role.id, company: field(form, "company", 120, true), title: field(form, "title", 120, true),
        posting, description: field(form, "description", 40000), notes: field(form, "notes", 15000),
        createdAt: new Date().toISOString(), status: "Draft",
        source: source ? { roleId: source.id, version: source.versions[0] } : undefined,
      });
      return id;
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  redirect(`/applications/${id}`);
}

export async function updateApplication(id: string, _state: FormState, form: FormData): Promise<FormState> {
  try {
    await mutate(async () => {
      const record = await application(id);
      if (!record) throw new Error("Application not found.");
      const status = form.get("status") as Status;
      if (!statuses.includes(status)) throw new Error("Choose a valid status.");
      if (!record.submission && ["Applied", "Interviewing", "Offer"].includes(status)) throw new Error("Record the submitted PDF first.");
      await saveApplication({ ...record, status, notes: field(form, "notes", 15000) });
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
  return { success: "Application updated." };
}

export async function submitResume(id: string, _state: FormState, form: FormData): Promise<FormState> {
  try {
    await mutate(async () => {
      const record = await application(id);
      if (!record) throw new Error("Application not found.");
      if (record.submission) throw new Error("A submitted resume is already saved for this application.");
      const date = field(form, "date", 10, true);
      const parsed = new Date(date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(+parsed) || parsed.toISOString().slice(0, 10) !== date) throw new Error("Enter a valid applied date.");
      const file = await upload("applications", id, form.get("resume"));
      try {
        await saveApplication({ ...record, status: "Applied", submission: { file, date } });
      } catch (error) {
        await removeUpload("applications", id, file);
        throw error;
      }
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/");
  revalidatePath(`/applications/${id}`);
  return { success: "Submitted resume saved." };
}

export async function addRole(_state: FormState, form: FormData): Promise<FormState> {
  try {
    await mutate(async () => {
      const name = field(form, "role name", 80, true);
      if ((await roles()).some(role => role.name.toLowerCase() === name.toLowerCase())) throw new Error("This role already exists.");
      await saveRole({ id: randomUUID(), name, versions: [] });
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/resumes");
  return { success: "Role added." };
}

export async function saveResume(id: string, _state: FormState, form: FormData): Promise<FormState> {
  try {
    await mutate(async () => {
      const role = (await roles()).find(item => item.id === id);
      if (!role) throw new Error("Role not found.");
      const name = await upload("resumes", id, form.get("resume"));
      try {
        await saveRole({ ...role, versions: [name, ...role.versions] });
      } catch (error) {
        await removeUpload("resumes", id, name);
        throw error;
      }
    });
  } catch (error) {
    return failure(error);
  }
  revalidatePath("/resumes");
  return { success: "Resume version saved." };
}
