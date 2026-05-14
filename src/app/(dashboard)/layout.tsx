import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, tenant_id")
    .eq("id", user.id)
    .single();

  let tenantName: string | undefined;
  if (profile?.tenant_id) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("short_name, name")
      .eq("id", profile.tenant_id)
      .single();
    tenantName = tenant?.short_name || tenant?.name;
  }

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user.email;

  return (
    <div className="flex h-screen">
      <Sidebar tenantName={tenantName} userName={userName} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20 md:p-6 md:pb-6">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
