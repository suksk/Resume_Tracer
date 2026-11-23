"use client";

import { useActionState, type ReactNode } from "react";
import type { FormState } from "./actions";

export function ActionForm({ action, label, children, className }: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return <form action={submit} className={className ?? "form-stack"}>
    {children}
    {state.error && <p className="form-error" role="alert">{state.error}</p>}
    {state.success && <p className="form-success" role="status">{state.success}</p>}
    <div><button className="button primary" disabled={pending}>{pending ? "Saving…" : label}</button></div>
  </form>;
}
