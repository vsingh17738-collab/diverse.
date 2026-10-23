import { BookingsView } from "@/components/bookings/bookings-view";
import { getBookings, getGameOptions, getMemberOptions, getStationOptions } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Bookings · Nexus Gaming Zone" };

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [{ new: isNew }, bookings, members, stations, games] = await Promise.all([
    searchParams,
    Promise.resolve(getBookings()),
    Promise.resolve(getMemberOptions()),
    Promise.resolve(getStationOptions()),
    Promise.resolve(getGameOptions()),
  ]);

  return (
    <BookingsView
      initial={bookings}
      members={members as never}
      stations={stations as never}
      games={games as never}
      autoOpen={isNew === "1"}
    />
  );
}
