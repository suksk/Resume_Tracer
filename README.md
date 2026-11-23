# Resume Tracer

A single-user application tracker and resume archive built with Next.js, TypeScript, and CSS.

## Run locally

Install Node.js 22 or newer and run these commands from the checkout.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The app assumes a trusted local environment and has no account system. Use a loopback binding for any archive with real resumes.

## Workflow

1. Open **Resumes** and upload your Data Engineer master. Upload reusable PDF or DOCX versions under AI Engineer, Data Scientist, or Forward Deployed Engineer, or add more roles.
2. Open **Applications** and create a draft with the company, title, role, job description, and an optional starting resume. The record keeps the exact starting version available for download.
3. Tailor the resume in your usual editor. When you apply, attach the exact submitted PDF and enter the applied date. Saving it marks the application Applied. Update status and notes as the application progresses.

The archive is written to `archive/` by default. Set `RESUME_TRACER_DATA_DIR` to an absolute path to store it elsewhere. Each application has a JSON record and one submitted PDF. Each role keeps its uploaded versions. Application search and pagination read JSON and fetch resume files on demand.

If you want GitHub sync, manually commit and push the archive to a **private** repository. Keep the Data Engineer master on `main` by committing its archive folder there. If your code repository is public, keep the archive in a separate private checkout or directory.

Run `npm run build` for the production build or `npm run typecheck` for TypeScript checks.
