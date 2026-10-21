import { SignInButton, SignUpButton, UserButton, Show } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="flex flex-col items-center gap-8 text-center">
        <span className="font-mono text-xs font-medium tracking-widest text-copy-muted uppercase">
          001 / AI-assisted system design
        </span>

        <h1 className="text-[clamp(56px,10.5vw,152px)] leading-[0.95] font-medium tracking-[-0.03em]">
          GHOST AI
        </h1>

        <Show when="signed-out">
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <button className="h-9.5 rounded-md border border-surface-border-strong px-4 text-sm font-medium transition-colors hover:bg-subtle">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="h-9.5 rounded-md bg-brand px-4 text-sm font-medium text-on-accent transition hover:brightness-110">
                Get started
              </button>
            </SignUpButton>
          </div>
        </Show>

        <Show when="signed-in">
          <div className="flex items-center gap-3">
            <span className="text-sm text-copy-secondary">Signed in</span>
            <UserButton />
          </div>
        </Show>
      </div>
    </main>
  );
}
