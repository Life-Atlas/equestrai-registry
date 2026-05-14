import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import type { UserRole } from "@/lib/constants";

const STAFF_ROLES: UserRole[] = ["staff", "admin", "board"];

export default async function AdminLayout({
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
    .select("first_name, last_name, tenant_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !STAFF_ROLES.includes(profile.role as UserRole)) {
    redirect("/");
  }

  let tenantName: string | undefined;
  if (profile.tenant_id) {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("short_name, name")
      .eq("id", profile.tenant_id)
      .single();
    tenantName = tenant?.short_name || tenant?.name;
  }

  const userName = `${profile.first_name} ${profile.last_name}`;

  return (
    <div className="flex h-screen">
      <Sidebar tenantName={tenantName} userName={userName} isAdmin />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20 md:p-6 md:pb-6">
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-medium text-amber-800">
          Staff Dashboard
        </div>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
