import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function safeNextPath(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export default async function SignInPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(safeNextPath(searchParams.next) ?? "/dashboard");
  }

  const errorMessage =
    typeof searchParams.error === "string" ? searchParams.error : null;
  const successMessage =
    typeof searchParams.success === "string" ? searchParams.success : null;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-surface p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to Creator OS to view your analytics dashboard.
        </p>

        <AuthForm />

        {errorMessage && (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="mt-4 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {successMessage}
          </p>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          By continuing, you agree to the Creator OS terms.{" "}
          <Link href="/" className="underline hover:text-foreground">
            Return home
          </Link>
        </p>
      </div>
    </main>
  );
}
