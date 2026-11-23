import Link from "next/link";
import { applications, roles, statuses, type Status } from "../lib/archive";
import { createApplication } from "./actions";
import { ActionForm } from "./forms";
import { DateLabel, Icon, Shell, StatusBadge } from "./ui";

export const dynamic = "force-dynamic";
const pageSize = 20;

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [all, available, query] = await Promise.all([applications(), roles(), searchParams]);
  const roleNames = new Map(available.map(role => [role.id, role.name]));
  const source = available.find(role => role.id === query.source && role.versions.length);
  const search = typeof query.q === "string" ? query.q.trim() : "";
  const role = available.find(role => role.id === query.role)?.id ?? "";
  const status = statuses.includes(query.status as Status) ? query.status as Status : "";
  const filtered = all.filter(record =>
    (!role || record.roleId === role) && (!status || record.status === status) &&
    (!search || `${record.company} ${record.title} ${roleNames.get(record.roleId) ?? ""}`.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = typeof query.page === "string" ? Number(query.page) : 1;
  const page = Number.isSafeInteger(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1;
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const pageHref = (number: number) => {
    const params = new URLSearchParams({ page: String(number) });
    if (search) params.set("q", search);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    return `/?${params}`;
  };

  return <Shell section="applications">
    <header className="page-heading"><div><h1>Applications</h1><p>Track where you applied and which resume you sent.</p></div>
      <Link className="button primary" href="/?new=1#new-application"><Icon name="plus" size={18} /> New application</Link>
    </header>
    {query.new === "1" && <section className="panel editor" id="new-application">
      <div className="section-heading"><h2>New application</h2><Link href="/" className="text-link">Cancel</Link></div>
      <ActionForm action={createApplication} label="Create application">
        <div className="field-grid">
          <label>Company<input name="company" required maxLength={120} placeholder="e.g. Acme" /></label>
          <label>Job title<input name="title" required maxLength={120} placeholder="e.g. Senior Data Engineer" /></label>
          <label>Role<select name="role" defaultValue={source?.id ?? "data-engineer"}>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label>Starting resume<select name="source" defaultValue={source?.id ?? ""}><option value="">None</option>{available.filter(item => item.versions.length).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
        <label>Job posting URL<input name="posting" type="url" maxLength={2048} placeholder="https://" /></label>
        <label>Job description<textarea name="description" rows={5} maxLength={40000} /></label>
        <label>Notes<textarea name="notes" rows={3} maxLength={15000} /></label>
      </ActionForm>
    </section>}
    <div className="stats">
      {([
        ["applications", "Total applications", all.length, "violet"],
        ["clock", "Drafts", all.filter(item => item.status === "Draft").length, "slate"],
        ["send", "Resumes submitted", all.filter(item => item.submission).length, "blue"],
        ["check", "Interviewing", all.filter(item => item.status === "Interviewing").length, "green"],
      ] as const).map(([icon, label, count, color]) => <div className="panel stat" key={label}><span className={`tile-icon ${color}`}><Icon name={icon} size={18} /></span><div><p>{label}</p><strong>{count}</strong></div></div>)}
    </div>
    <section className="panel archive">
      <div className="archive-header">
        <h2>Application history <span className="count">{all.length}</span></h2>
        <form className="filters">
          <label className="search-field"><Icon name="search" size={17} /><input name="q" aria-label="Search applications" defaultValue={search} placeholder="Search applications…" /></label>
          <select name="role" aria-label="Filter by role" defaultValue={role}><option value="">All roles</option>{available.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select name="status" aria-label="Filter by status" defaultValue={status}><option value="">All statuses</option>{statuses.map(item => <option key={item}>{item}</option>)}</select>
          <button className="button secondary">Filter</button>
          {(search || role || status) && <Link className="text-link" href="/">Clear</Link>}
        </form>
      </div>
      <div className="table-scroll"><table><thead><tr><th scope="col">Company / Job title</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Applied</th><th scope="col">Resume</th></tr></thead><tbody>
        {rows.map(item => <tr key={item.id}>
          <td><Link className="record-link" href={`/applications/${item.id}`}>{item.company}</Link><span className="cell-subtitle">{item.title}</span></td>
          <td>{roleNames.get(item.roleId) ?? item.roleId}</td><td><StatusBadge status={item.status} /></td>
          <td>{item.submission ? <DateLabel value={item.submission.date} /> : "—"}</td>
          <td>{item.submission ? <a className="text-link file-link" href={`/files/applications/${item.id}/${item.submission.file}`}><Icon name="download" size={16} /> PDF</a> : "—"}</td>
        </tr>)}
        {!rows.length && <tr><td colSpan={5}><div className="empty">
          <span className="empty-icon"><Icon name={all.length ? "search" : "applications"} size={26} /></span>
          <h3>{all.length ? "No matching applications" : "No applications yet"}</h3>
          <p>{all.length ? "Try another search or clear your filters." : "Add your first role to track the job description, application status, and submitted resume."}</p>
          <Link className="button secondary" href={all.length ? "/" : "/?new=1#new-application"}>{!all.length && <Icon name="plus" size={17} />}{all.length ? "Clear filters" : "Add application"}</Link>
        </div></td></tr>}
      </tbody></table></div>
      {rows.length > 0 && <div className="pagination"><span>{start + 1}–{start + rows.length} of {filtered.length} applications</span><div>{page > 1 && <Link className="button secondary" href={pageHref(page - 1)}>Previous</Link>}{page < totalPages && <Link className="button secondary" href={pageHref(page + 1)}>Next</Link>}</div></div>}
    </section>
  </Shell>;
}
