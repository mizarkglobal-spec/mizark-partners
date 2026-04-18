"use client";
import { useEffect, useState } from "react";
import { fmt } from "@/lib/format";

interface Announcement {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch("/api/admin/announcements");
    const d = await r.json();
    setAnnouncements(d.announcements ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setError("");
    if (!title.trim()) { setError("Title is required"); return; }
    if (!body.trim()) { setError("Body is required"); return; }
    setPosting(true);
    try {
      const r = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), is_pinned: pinned }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setTitle(""); setBody(""); setPinned(false);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    const r = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (r.ok) load();
    setDeleting(null);
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Announcements</h1>
        <p className="text-white/50 text-sm">Send announcements to all active partners.</p>
      </div>

      {/* Create Form */}
      <div className="bg-[#1a3a2a] border border-white/10 rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Create Announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 2024 Distribution Processed"
              className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#40916c]"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1">Body *</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write the announcement message..."
              className="w-full bg-[#0f2a1e] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#40916c] resize-none"
            />
          </div>
          <button
            onClick={() => setPinned(!pinned)}
            className={`flex items-center gap-2 text-sm transition-colors ${pinned ? "text-[#d4a843]" : "text-white/50 hover:text-white"}`}
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              pinned ? "bg-[#d4a843] border-[#d4a843]" : "border-white/30"
            }`}>
              {pinned && (
                <svg className="w-2.5 h-2.5 text-[#0f2a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            Pin this announcement
          </button>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <button
            onClick={handleCreate}
            disabled={posting}
            className="bg-[#40916c] hover:bg-[#2d6a4f] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {posting ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className={`border rounded-2xl p-5 ${
              ann.is_pinned
                ? "bg-[#2d6a4f]/10 border-[#40916c]/30"
                : "bg-[#1a3a2a] border-white/10"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.is_pinned && (
                      <span className="bg-[#d4a843]/10 text-[#d4a843] text-[10px] px-2 py-0.5 rounded-full border border-[#d4a843]/20">
                        Pinned
                      </span>
                    )}
                    <span className="text-white/30 text-xs">{fmt.date(ann.created_at)}</span>
                  </div>
                  <h4 className="text-white font-semibold">{ann.title}</h4>
                  <p className="text-white/60 text-sm mt-1 leading-relaxed">{ann.body}</p>
                </div>
                <button
                  onClick={() => handleDelete(ann.id)}
                  disabled={deleting === ann.id}
                  className="text-red-400/50 hover:text-red-400 text-xs transition-colors flex-shrink-0 mt-1"
                >
                  {deleting === ann.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="text-center text-white/30 text-sm py-8">No announcements yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
