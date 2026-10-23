import { TransactionsView } from "@/components/transactions/transactions-view";
import { getMemberOptions, getTransactions } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Transactions · Nexus Gaming Zone" };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const [sp, transactions, members] = await Promise.all([
    searchParams,
    Promise.resolve(getTransactions()),
    Promise.resolve(getMemberOptions()),
  ]);
  return (
    <TransactionsView
      initial={transactions}
      members={members as never}
      autoOpen={sp.new === "1"}
    />
  );
}
