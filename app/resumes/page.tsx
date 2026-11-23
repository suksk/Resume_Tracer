import Link from "next/link";
import { roles } from "../../lib/archive";
import { addRole, saveResume } from "../actions";
import { ActionForm } from "../forms";
import { Icon, Shell } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resumes" };

export default async function Resumes() {
  const available = await roles();
  return <Shell section="resumes">
    <header className="page-heading"><div><h1>Resumes</h1><p>Manage your Data Engineer master and reusable role resumes.</p></div></header>
    <div className="resume-grid">
      {available.map(role => {
        const master = role.id === "data-engineer";
        const current = role.versions[0];
        return <section className={`panel resume-card ${master ? "master" : ""}`} key={role.id}>
          <div className="section-heading"><span className="tile-icon violet"><Icon name="resumes" /></span>{master && <span className="status status-master">Master resume</span>}</div>
          <h2>{role.name}</h2>
          <p className="muted">{current ? `${role.versions.length} saved ${role.versions.length === 1 ? "version" : "versions"}` : "No resume uploaded yet"}</p>
          {current && <div className="inline-actions"><a className="text-link file-link" href={`/files/resumes/${role.id}/${current}`}><Icon name="download" size={16} /> Download latest</a><Link className="text-link" href={`/?new=1&source=${role.id}#new-application`}>Start application</Link></div>}
          {role.versions.length > 1 && <details><summary>Previous versions</summary><ul>{role.versions.slice(1).map((file, index) => <li key={file}><a className="text-link" href={`/files/resumes/${role.id}/${file}`}>Version {role.versions.length - index - 1} · {file.split(".").at(-1)?.toUpperCase()}</a></li>)}</ul></details>}
          <ActionForm action={saveResume.bind(null, role.id)} label={current ? "Save new version" : "Upload resume"}>
            <label>PDF or DOCX, up to 10 MB<input name="resume" type="file" accept=".pdf,.docx" required /></label>
          </ActionForm>
        </section>;
      })}
    </div>
    <section className="panel editor"><h2>Add a role</h2><ActionForm action={addRole} label="Add role"><label>Role name<input name="role name" maxLength={80} required placeholder="e.g. Analytics Engineer" /></label></ActionForm></section>
  </Shell>;
}
