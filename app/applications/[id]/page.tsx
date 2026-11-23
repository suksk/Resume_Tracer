import Link from "next/link";
import { notFound } from "next/navigation";
import { application, roles, statuses } from "../../../lib/archive";
import { submitResume, updateApplication } from "../../actions";
import { ActionForm } from "../../forms";
import { DateLabel, Icon, Shell, StatusBadge } from "../../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Application" };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record, available] = await Promise.all([application(id), roles()]);
  if (!record) notFound();
  const role = available.find(item => item.id === record.roleId);
  const source = record.source;
  const allowedStatuses = record.submission ? statuses : statuses.filter(status => ["Draft", "Rejected", "Withdrawn"].includes(status));

  return <Shell section="applications">
    <Link className="text-link file-link back-link" href="/"><Icon name="back" size={15} /> All applications</Link>
    <header className="page-heading"><div><h1>{record.title}</h1><p>{record.company} · {role?.name ?? record.roleId}</p></div><StatusBadge status={record.status} /></header>
    <div className="detail-grid">
      <section className="panel editor">
        <h2>Job description</h2>
        {record.posting && <a className="text-link" href={record.posting} target="_blank" rel="noreferrer">Open job posting</a>}
        <p className="preserve">{record.description || "No job description saved."}</p>
      </section>
      <section className="panel editor">
        <h2>Resume</h2>
        {source && <a className="text-link file-link" href={`/files/resumes/${source.roleId}/${source.version}`}><Icon name="download" size={16} /> Starting resume · {available.find(item => item.id === source.roleId)?.name ?? "Role resume"}</a>}
        {record.submission ? <><p className="muted">Applied <DateLabel value={record.submission.date} /></p><a className="button secondary" href={`/files/applications/${id}/${record.submission.file}`}><Icon name="download" size={17} /> Download submitted PDF</a></> :
          <ActionForm action={submitResume.bind(null, id)} label="Save PDF and mark applied">
            <label>Applied date<input type="date" name="date" required /></label>
            <label>Submitted PDF, up to 10 MB<input name="resume" type="file" accept=".pdf" required /></label>
          </ActionForm>}
      </section>
      <section className="panel editor">
        <h2>Status and notes</h2>
        <ActionForm key={record.status} action={updateApplication.bind(null, id)} label="Save changes">
          <label>Status<select name="status" aria-label="Status" defaultValue={record.status}>{allowedStatuses.map(status => <option key={status}>{status}</option>)}</select></label>
          <label>Notes<textarea name="notes" rows={5} defaultValue={record.notes} maxLength={15000} /></label>
        </ActionForm>
      </section>
    </div>
  </Shell>;
}
