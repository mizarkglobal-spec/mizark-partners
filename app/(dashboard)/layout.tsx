import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import OnboardingBanner from "@/components/OnboardingBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("*")
      .eq("email", user.email!)
      .maybeSingle();

    if (byEmail) {
      partner = byEmail;
      await db.from("partners").update({ user_id: user.id } as any).eq("id", byEmail.id);
    }
  }

  if (!partner) {
    if (user.email === process.env.ADMIN_EMAIL) redirect("/admin");
    redirect("/pending");
  }

  if (partner.status !== "active") {
    if (user.email === process.env.ADMIN_EMAIL) redirect("/admin");
    redirect("/pending");
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8f7]">
      <DashboardSidebar partnerName={partner.name} equityPct={Number(partner.equity_pct)} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          partnerName={partner.name}
          equityPct={Number(partner.equity_pct)}
          email={user.email!}
          investmentAmount={partner.investment_amount}
          startDate={partner.start_date}
        />
        <main className="flex-1 overflow-auto pt-14 lg:pt-0">
          {!(partner as any).onboarding_completed && <OnboardingBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
