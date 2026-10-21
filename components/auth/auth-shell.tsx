import type { ReactNode } from "react";

const features = [
  "AI-generated architecture from a prompt",
  "Real-time collaboration on a shared canvas",
  "Technical spec generated from your design",
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1">
      <section className="hidden w-1/2 flex-col border-r border-surface-border bg-surface p-10 lg:flex">
        <p className="text-base font-semibold tracking-tight">Ghost AI</p>
        <div className="my-auto flex max-w-md flex-col gap-6">
          <span className="font-mono text-xs font-medium tracking-widest text-copy-muted uppercase">
            001 / System design
          </span>
          <p className="text-2xl font-semibold tracking-tight">Describe a system. Refine it together.</p>
          <ul className="flex flex-col gap-3 text-sm text-copy-secondary">
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
      </section>
      <main className="flex flex-1 items-center justify-center bg-page p-6">{children}</main>
    </div>
  );
}
