import Link from "next/link";

type LandingFooterProps = {
  publicSuffix: string;
};

export function LandingFooter({ publicSuffix }: LandingFooterProps) {
  return (
    <footer className="mt-auto border-t border-border/50 bg-black/55 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <p className="text-base font-semibold tracking-tight text-foreground">Creator OS</p>
          <p className="mt-3 text-xs text-muted-foreground/90 sm:mt-4">© 2026 Creator OS</p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end"
          aria-label="Footer"
        >
          <Link
            href={`/pricing${publicSuffix}`}
            className="font-medium text-muted-foreground transition hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href={`/careers${publicSuffix}`}
            className="font-medium text-muted-foreground transition hover:text-foreground"
          >
            Careers
          </Link>
          <Link
            href={`/blog${publicSuffix}`}
            className="font-medium text-muted-foreground transition hover:text-foreground"
          >
            Blog
          </Link>
        </nav>
      </div>
    </footer>
  );
}
