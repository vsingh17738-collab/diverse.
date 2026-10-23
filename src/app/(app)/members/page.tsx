import { MembersView } from "@/components/members/members-view";
import { getMembers } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members · Nexus Gaming Zone" };

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [sp, members] = await Promise.all([searchParams, Promise.resolve(getMembers())]);
  return <MembersView initial={members} autoOpen={sp.new === "1"} />;
}
