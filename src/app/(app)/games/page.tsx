import { GamesView } from "@/components/games/games-view";
import { getGames } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Game library · Nexus Gaming Zone" };

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [sp, games] = await Promise.all([searchParams, Promise.resolve(getGames())]);
  return <GamesView initial={games} autoOpen={sp.new === "1"} />;
}
