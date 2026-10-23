import { StationsView } from "@/components/stations/stations-view";
import { getStations } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stations · Nexus Gaming Zone" };

export default function StationsPage() {
  const stations = getStations();
  return <StationsView initial={stations} />;
}
