type Role = {
  title: string;
  description: string;
  subject: string;
};

const ROLES: Role[] = [
  {
    title: "Full-Stack Developer (Co-Founder)",
    description:
      "Own product architecture and execution across frontend, backend, and integrations. You will ship core features fast, keep quality high, and turn product ideas into reliable systems users trust. This role is for someone who can build end-to-end and move with urgency.",
    subject: "Creator OS - Full-Stack Developer Co-Founder",
  },
  {
    title: "Product Designer (Co-Founder)",
    description:
      "Own the user experience from concept to polished interface. You will define interaction patterns, visual language, and product flows that make Creator OS feel premium and intuitive. This role is for someone who can think in systems and design for real creator workflows.",
    subject: "Creator OS - Product Designer Co-Founder",
  },
  {
    title: "Growth & Community (Co-Founder)",
    description:
      "Own creator acquisition, retention loops, and community momentum. You will shape messaging, run growth experiments, and build direct relationships with creators who become advocates of the product. This role is for someone who can combine strategy, execution, and audience intuition.",
    subject: "Creator OS - Growth and Community Co-Founder",
  },
];

const FOUNDER_LINKEDIN_URL = "https://www.linkedin.com/in/jeremiahtaylor614/";
const FOUNDER_PHOTO_URL = "https://unavatar.io/linkedin/jeremiahtaylor614";

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="rounded-3xl border bg-gradient-to-br from-surface to-surface-muted p-7">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Creator OS
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Careers</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            We&apos;re not hiring. We&apos;re building a team. If you&apos;re a creator who
            also builds, designs, or grows products - let&apos;s talk.
          </p>
        </section>

        <section className="rounded-2xl border bg-surface-muted/70 p-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Founder note
          </p>
          <p className="mt-2 text-lg font-semibold">
            You&apos;d be co-founding with me, so you should know who I am.
          </p>

          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start">
            <img
              src={FOUNDER_PHOTO_URL}
              alt="Jeremiah Taylor"
              className="h-20 w-20 rounded-xl border object-cover"
            />
            <div className="min-w-0">
              <p className="text-base font-semibold">Jeremiah Taylor</p>
              <p className="mt-2 text-sm text-muted-foreground">
                I built a creator audience to 215k followers on TikTok and still burned out hard.
                I stopped posting for years, not because I didn&apos;t care, but because my system
                couldn&apos;t survive real life. Creator OS is me building my comeback in public —
                and I want co-founders who care about helping creators come back too.
              </p>
              <a
                href={FOUNDER_LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-lg border border-accent/60 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {ROLES.map((role) => (
            <article key={role.title} className="rounded-2xl border bg-surface-muted/70 p-5">
              <h2 className="text-lg font-semibold">{role.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{role.description}</p>
              <p className="mt-3 text-xs font-semibold text-accent">
                Compensation: Equity only (25%) until $10k MRR.
              </p>
              <a
                href={`mailto:jeremiahtaylor91302@gmail.com?subject=${encodeURIComponent(role.subject)}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-accent to-accent-strong px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Apply
              </a>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
