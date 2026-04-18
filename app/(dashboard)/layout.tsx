import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db = createAdminClient();

  // Try user_id first, fall back to email match (for partners who haven't linked yet)
  let { data: partner } = await db
    .from("partners")
    .select("id, name, equity_pct, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("id, name, equity_pct, status")
      .eq("email", user.email!)
      .maybeSingle();

    if (byEmail) {
      partner = byEmail;
      // Link user_id for future lookups
      await db.from("partners").update({ user_id: user.id } as any).eq("id", byEmail.id);
    }
  }

  if (!partner) {
    // Admin accounts have no partner record — send them to admin panel
    if (user.email === process.env.ADMIN_EMAIL) {
      redirect("/admin");
    }
    redirect("/pending");
  }

  if (partner.status !== "active") {
    // Admin accounts — send to admin panel
    if (user.email === process.env.ADMIN_EMAIL) {
      redirect("/admin");
    }
    redirect("/pending");
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <DashboardSidebar partnerName={partner.name} equityPct={Number(partner.equity_pct)} />
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
