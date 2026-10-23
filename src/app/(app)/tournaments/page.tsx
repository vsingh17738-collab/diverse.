import { TournamentsView } from "@/components/tournaments/tournaments-view";
import { getGameOptions, getTournaments } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tournaments · Nexus Gaming Zone" };

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [sp, tournaments, games] = await Promise.all([
    searchParams,
    Promise.resolve(getTournaments()),
    Promise.resolve(getGameOptions()),
  ]);
  return (
    <TournamentsView
      initial={tournaments}
      games={games as never}
      autoOpen={sp.new === "1"}
    />
  );
}
