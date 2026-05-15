import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: horseCount } = await supabase
    .from("horses")
    .select("*", { count: "exact", head: true })
    .eq("current_owner_id", user!.id);
  const { count: appCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("applicant_id", user!.id)
    .in("status", ["draft", "submitted", "incomplete", "awaiting_payment"]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="My Horses"
          count={horseCount ?? 0}
          href="/horses"
          description="Registered and pending"
        />
        <DashboardCard
          title="Active Applications"
          count={appCount ?? 0}
          href="/applications"
          description="In progress"
        />
      </div>

      {(horseCount ?? 0) === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-gray-600">No horses registered yet.</p>
          <Link
            href="/horses/new"
            className="mt-3 inline-block rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5a87] min-h-[44px] leading-[28px]"
          >
            Register Your First Horse
          </Link>
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  count,
  href,
  description,
}: {
  title: string;
  count: number;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
    >
      <p className="text-sm text-gray-600">{title}</p>
      <p className="mt-1 text-3xl font-bold text-[#1a3a5c]">{count}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </Link>
  );
}
