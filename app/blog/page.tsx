import Link from "next/link";
import type { Metadata } from "next";
import { blogPostSummaries } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog | Creator OS",
  description: "Playbooks on growth, consistency, and building a sustainable creator practice.",
};

export default function BlogIndexPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10 md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to home
        </Link>

        <header className="mt-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Blog</p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            From the blog
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Ideas and systems behind Creator OS.
          </p>
        </header>

        <ul className="mt-10 space-y-3 sm:mt-12 sm:space-y-4">
          {blogPostSummaries.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-border/80 bg-surface p-4 no-underline transition hover:border-accent/50 hover:bg-surface-muted/60 sm:rounded-2xl sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full border border-accent/50 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.date}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{post.readTimeMinutes} min read</p>
                <h2 className="mt-3 text-balance text-base font-semibold leading-snug text-foreground group-hover:text-accent sm:text-lg">
                  {post.title}
                </h2>
                <span className="mt-3 inline-block text-sm font-medium text-accent">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
