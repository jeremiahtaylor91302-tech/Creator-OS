import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ConnectionsPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const params = new URLSearchParams();

  if (typeof searchParams.error === "string") {
    params.set("error", searchParams.error);
  }

  if (typeof searchParams.success === "string") {
    params.set("success", searchParams.success);
  }

  const query = params.toString();
  redirect(query ? `/settings?${query}` : "/settings");
}
