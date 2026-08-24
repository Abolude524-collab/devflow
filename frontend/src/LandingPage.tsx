import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

const features = [
  { number: '01', title: 'Real-time Pipeline Sync', body: 'Keep automated triggers, deploys, and notifications visible beside the work they move.' },
  { number: '02', title: 'Deep Git & Tooling Integration', body: 'Connect branches, commits, and pull requests directly to the tasks your team owns.' },
  { number: '03', title: 'Zero Latency UI', body: 'Move from idea to action in a workspace designed for focus, speed, and developer ergonomics.' },
  { number: '04', title: 'Granular Role Controls', body: 'Give every collaborator the right level of access without slowing the team down.' },
];

export function LandingPage({ onSignIn, onGetStarted }: LandingPageProps) {
  const navigate = useNavigate();
  const handleSignIn = onSignIn || (() => navigate('/login'));
  const handleGetStarted = onGetStarted || (() => navigate('/register'));
  return (
    <div className="min-h-screen overflow-hidden bg-devflow-background text-devflow-text">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 text-left">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-devflow-accent/40 bg-devflow-accent/10 font-mono text-devflow-accent">&gt;_</span>
          <span className="font-mono text-sm font-semibold tracking-[0.24em]">DEVFLOW</span>
        </button>
        <div className="hidden items-center gap-8 text-sm text-devflow-muted md:flex">
          <a href="#features" className="transition hover:text-devflow-text">Features</a>
          <a href="#architecture" className="transition hover:text-devflow-text">Architecture</a>
          <a href="#docs" className="transition hover:text-devflow-text">Docs</a>
          <a href="#community" className="transition hover:text-devflow-text">Community</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSignIn} className="hidden px-3 py-2 text-sm font-semibold text-devflow-muted transition hover:text-devflow-text sm:block">Sign in</button>
          <button onClick={handleGetStarted} className="rounded-lg bg-devflow-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">Get started</button>
        </div>
      </nav>

      <main>
        <section className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
          <div className="relative z-10">
            <p className="mb-6 inline-flex rounded-full border border-devflow-success/30 bg-devflow-success/5 px-3 py-1.5 font-mono text-xs text-devflow-success">v1.0 is now live</p>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight text-devflow-text sm:text-6xl lg:text-7xl">Streamline your engineering workflow from idea to deployment.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-devflow-muted">DevFlow unites task tracking, automated pipelines, and team collaboration into a single, lightning-fast workspace.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={handleGetStarted} className="rounded-lg bg-devflow-accent px-5 py-3 font-semibold text-white transition hover:bg-blue-400">Start for free <span aria-hidden="true">-&gt;</span></button>
              <a href="#architecture" className="rounded-lg border border-white/15 px-5 py-3 font-semibold text-devflow-text transition hover:border-devflow-accent hover:text-devflow-accent">Live demo</a>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs uppercase tracking-wider text-devflow-muted">
              <span>React</span><span className="text-white/20">/</span><span>Node</span><span className="text-white/20">/</span><span>MongoDB</span><span className="text-white/20">/</span><span>TypeScript</span>
            </div>
          </div>
          <div id="architecture" className="relative lg:pl-8">
            <div className="absolute -inset-8 bg-devflow-accent/10 blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-devflow-surface shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-devflow-success" /><span className="font-mono text-xs text-devflow-muted">workspace / sprint-01</span></div>
                <span className="font-mono text-xs text-devflow-accent">LIVE</span>
              </div>
              <div className="grid grid-cols-[0.8fr_1.2fr] gap-5 p-5">
                <aside className="space-y-3 border-r border-white/10 pr-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-devflow-muted">Projects</p>
                  <div className="rounded-md bg-devflow-accent/15 px-3 py-2 text-xs text-devflow-text">Core platform</div>
                  <div className="px-3 py-2 text-xs text-devflow-muted">Mobile client</div>
                  <div className="px-3 py-2 text-xs text-devflow-muted">API migration</div>
                </aside>
                <div>
                  <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold">Engineering board</p><span className="rounded bg-devflow-success/10 px-2 py-1 font-mono text-[10px] text-devflow-success">12 tasks</span></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3"><p className="font-mono text-[10px] uppercase text-devflow-muted">In progress</p><div className="rounded-md border border-white/10 bg-devflow-background p-3"><p className="text-xs font-medium">Auth flow</p><p className="mt-2 font-mono text-[10px] text-devflow-accent">DEV-104</p></div><div className="rounded-md border border-white/10 bg-devflow-background p-3"><p className="text-xs font-medium">API metrics</p><p className="mt-2 font-mono text-[10px] text-devflow-muted">DEV-108</p></div></div>
                    <div className="space-y-3"><p className="font-mono text-[10px] uppercase text-devflow-success">Done</p><div className="rounded-md border border-devflow-success/20 bg-devflow-success/5 p-3"><p className="text-xs font-medium">CI pipeline</p><p className="mt-2 font-mono text-[10px] text-devflow-success">DEV-099</p></div><div className="rounded-md border border-devflow-success/20 bg-devflow-success/5 p-3"><p className="text-xs font-medium">Team invites</p><p className="mt-2 font-mono text-[10px] text-devflow-success">DEV-101</p></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-white/10 bg-white/[0.02] px-6 py-20 lg:px-10">
          <div className="mx-auto max-w-7xl"><div className="mb-10 max-w-xl"><p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-accent">Built for momentum</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">The control room for high-velocity teams.</h2></div><div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <article key={feature.number} className="bg-devflow-background p-6"><span className="font-mono text-xs text-devflow-success">{feature.number}</span><h3 className="mt-12 text-lg font-semibold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-devflow-muted">{feature.body}</p></article>)}</div></div>
        </section>

        <section id="docs" className="mx-auto max-w-7xl px-6 py-20 lg:px-10"><div className="flex flex-col justify-between gap-8 rounded-xl border border-devflow-accent/30 bg-devflow-accent/10 p-8 sm:flex-row sm:items-center sm:p-12"><div><p className="font-mono text-xs uppercase tracking-[0.2em] text-devflow-success">Ready when you are</p><h2 className="mt-3 max-w-xl text-3xl font-bold">Ready to upgrade your development workflow?</h2></div><button onClick={onGetStarted} className="shrink-0 rounded-lg bg-devflow-accent px-5 py-3 font-semibold text-white transition hover:bg-blue-400">Create your account <span aria-hidden="true">-&gt;</span></button></div></section>
      </main>

      <footer id="community" className="border-t border-white/10 px-6 py-7 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-devflow-muted sm:flex-row"><span className="font-mono text-xs">DEVFLOW / 2026</span><div className="flex flex-wrap gap-5"><a href="#community" className="hover:text-devflow-text">GitHub</a><a href="#community" className="hover:text-devflow-text">Twitter / X</a><a href="#docs" className="hover:text-devflow-text">Docs</a><a href="#community" className="hover:text-devflow-text">Privacy</a><a href="#community" className="hover:text-devflow-text">Terms</a></div></div></footer>
    </div>
  );
}
