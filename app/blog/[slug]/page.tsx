import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { blogPosts, getPostBySlug } from "@/lib/blog/posts";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post not found | Creator OS" };
  }
  return {
    title: `${post.title} | Creator OS`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10 md:px-10">
      <article className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          ← Back to home
        </Link>

        <header className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
            <span className="rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 font-medium text-accent">
              {post.category}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.dateIso}>{post.date}</time>
            <span aria-hidden="true">·</span>
            <span>{post.readTimeMinutes} min read</span>
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">
            {post.title}
          </h1>
        </header>

        <div className="mt-10 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-[1.05rem] sm:leading-[1.75]">
          {post.paragraphs.map((paragraph, index) => (
            <p key={index} className="text-pretty">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
