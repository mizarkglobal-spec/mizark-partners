import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const db = createAdminClient();

  let { data: partner } = await db
    .from("partners")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!partner) {
    const { data: byEmail } = await db
      .from("partners")
      .select("id")
      .eq("email", user.email!)
      .eq("status", "active")
      .maybeSingle();
    if (byEmail) partner = byEmail;
  }

  if (!partner) redirect("/pending");

  const { data: announcements } = await db
    .from("announcements")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const pinned = (announcements ?? []).filter((a: any) => a.is_pinned);
  const regular = (announcements ?? []).filter((a: any) => !a.is_pinned);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] mb-1">Announcements</h1>
        <p className="text-gray-500 text-sm">Official communications from the Mizark Global management team.</p>
      </div>

      {pinned.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-gray-400 text-xs uppercase tracking-widest">Pinned</h3>
          {pinned.map((ann: any) => (
            <div key={ann.id} className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-[#d4a843]/10 text-[#b8882e] text-xs px-2 py-0.5 rounded-full border border-[#d4a843]/30">
                      Pinned
                    </span>
                  </div>
                  <h4 className="text-[#111827] font-semibold text-lg mb-2">{ann.title}</h4>
                  <p className="text-gray-600 leading-relaxed">{ann.body}</p>
                </div>
              </div>
              <div className="text-gray-400 text-xs mt-4">{fmt.date(ann.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {regular.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && <h3 className="text-gray-400 text-xs uppercase tracking-widest">All Announcements</h3>}
          {regular.map((ann: any) => (
            <div key={ann.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:border-gray-300 transition-colors">
              <h4 className="text-[#111827] font-semibold mb-2">{ann.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed">{ann.body}</p>
              <div className="text-gray-300 text-xs mt-4">{fmt.date(ann.created_at)}</div>
            </div>
          ))}
        </div>
      )}

      {(!announcements || announcements.length === 0) && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-sm">No announcements yet. Check back for updates from the management team.</div>
        </div>
      )}
    </div>
  );
}
