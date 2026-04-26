import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { signOut } from "@/app/auth/actions";
import { canAccessApp } from "@/lib/access";
import { resolveSidebarUser } from "@/lib/display-user";

export default async function ProtectedAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in?error=Please%20sign%20in%20first.");
  }
  const paid = await canAccessApp(user.id, user.email);
  if (!paid) {
    redirect("/pricing");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const { displayName, initials } = resolveSidebarUser({
    email: user.email,
    profileFullName: profile?.full_name,
    metadataFullName: meta?.full_name ?? meta?.name,
  });

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-4 md:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="flex min-h-[calc(100vh-4rem)] flex-col rounded-3xl border bg-surface/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <AppSidebar />
            <div className="mt-auto flex items-center justify-between px-2 py-1">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  {user.email ? (
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  ) : null}
                </div>
              </div>
              <form action={signOut}>
                <button className="text-xs text-muted-foreground transition hover:text-foreground">
                  Sign out
                </button>
              </form>
            </div>
          </aside>
          <section className="min-w-0 rounded-3xl border bg-surface/80 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] md:p-7">
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
