import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalHorses },
    { count: registeredHorses },
    { count: pendingApps },
    { count: totalApps },
    { count: approvedApps },
  ] = await Promise.all([
    supabase.from("horses").select("*", { count: "exact", head: true }),
    supabase
      .from("horses")
      .select("*", { count: "exact", head: true })
      .eq("status", "registered"),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "in_review", "awaiting_approval"]),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  const stats = [
    { label: "Total Horses", value: totalHorses ?? 0 },
    { label: "Registered", value: registeredHorses ?? 0 },
    { label: "Applications Pending", value: pendingApps ?? 0 },
    { label: "Total Applications", value: totalApps ?? 0 },
    { label: "Approved", value: approvedApps ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#1a3a5c]">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-gray-200 bg-white p-4"
          >
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1a3a5c]">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
