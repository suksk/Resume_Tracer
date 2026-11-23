import Link from "next/link";
import type { ReactNode } from "react";

const paths = {
  logo: "M8 3h7l5 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h2Zm6 0v6h6M9 13h7m-7 4h5",
  applications: "M4 7h16v13H4zM9 7V4h6v3M4 12h16m-10 0v2h4v-2",
  resumes: "M7 4h8l4 4v12H7zM15 4v5h4M10 13h6m-6 3h6",
  plus: "M12 5v14M5 12h14",
  search: "M21 21l-5-5m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  arrow: "M9 5l7 7-7 7",
  back: "M15 5l-7 7 7 7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  send: "m3 10 18-7-7 18-3-8-8-3Zm8 3L21 3",
  check: "m5 12 4 4L19 6",
} as const;

export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export function Shell({ section, children }: { section: "applications" | "resumes"; children: ReactNode }) {
  return <div className="shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><Icon name="logo" /></span>Resume Tracer</Link>
      <nav aria-label="Main navigation">
        <p className="nav-label">Workspace</p>
        <Link href="/" aria-current={section === "applications" ? "page" : undefined}><Icon name="applications" size={18} />Applications</Link>
        <Link href="/resumes" aria-current={section === "resumes" ? "page" : undefined}><Icon name="resumes" size={18} />Resumes</Link>
      </nav>
      <p className="sidebar-footer"><span className="local-dot" /> Local workspace</p>
    </aside>
    <div className="main-area">
      <div className="topbar"><span>Workspace</span><Icon name="arrow" size={13} /><strong>{section === "applications" ? "Applications" : "Resumes"}</strong></div>
      <main className="content">{children}</main>
    </div>
  </div>;
}

export function DateLabel({ value }: { value: string }) {
  return <time dateTime={value}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value))}</time>;
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status.toLowerCase()}`}><span />{status}</span>;
}
