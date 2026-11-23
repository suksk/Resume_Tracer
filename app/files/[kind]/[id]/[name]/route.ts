import { download } from "../../../../../lib/archive";

export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string; name: string }> }) {
  const { kind, id, name } = await params;
  const file = await download(kind, id, name);
  if (!file) return new Response("File not found", { status: 404 });
  const extension = name.endsWith(".pdf") ? "pdf" : "docx";
  const filename = kind === "applications" ? "submitted-resume" : "resume";
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": extension === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}.${extension}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
