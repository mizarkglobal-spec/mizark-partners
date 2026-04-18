import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";
import AdminHeader from "@/components/AdminHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const admin = await isAdminEmail(user.email);
  if (!admin) {
    redirect("/login");
  }

  const isPrimary = user.email === process.env.ADMIN_EMAIL;

  return (
    <div className="flex min-h-screen bg-[#0a1f15]">
      <AdminSidebar adminEmail={user.email} isPrimary={isPrimary} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader adminEmail={user.email} isPrimary={isPrimary} />
        <main className="flex-1 overflow-auto pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
