import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Resume Tracer", template: "%s · Resume Tracer" },
  description: "Organize your resume versions and job applications.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
