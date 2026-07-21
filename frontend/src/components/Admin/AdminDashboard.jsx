import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, PlusCircle, DownloadCloud, Trash2, Edit, Search, AlertTriangle, ChevronRight, Code2, Activity } from "lucide-react";
import { API_BASE_URL } from '../../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";

const API = API_BASE_URL;

const StatCard = ({ label, value, sub, icon: Icon, colorClass }) => (
  <Card className="bg-card/50 backdrop-blur overflow-hidden border-border/50">
    <CardContent className="p-6 relative">
      <div className={cn("absolute right-0 top-0 opacity-10 p-4 rounded-bl-full", colorClass)}>
        <Icon className="w-16 h-16" />
      </div>
      <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold font-mono">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </CardContent>
  </Card>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  </div>
);

function UsersSection({ users, onRefresh }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (username) => {
    setDeleting(username);
    try {
      const res = await fetch(`${API}/admin/DeleteUser/${username}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to delete");
      showToast(`${username} removed.`);
      onRefresh();
    } catch {
      showToast("Delete failed.", "destructive");
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  };

  const filtered = users.filter(u => u.username?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      {toast && (
        <div className={cn("rounded-lg px-4 py-3 text-sm border font-medium", toast.type === "success" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
          {toast.msg}
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users by name or handle..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border">
          <span className="font-semibold">{filtered.length}</span> Users Found
        </div>
      </div>

      <div className="rounded-xl border bg-card/50 backdrop-blur overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium hidden md:table-cell">Contact</th>
                <th className="px-6 py-4 font-medium hidden lg:table-cell">Handles</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.username} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/profile/${u.username}`} className="block group">
                      <div className="font-semibold group-hover:text-primary transition-colors">{u.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">@{u.username}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-muted-foreground font-mono text-xs">{u.email}</td>
                  <td className="px-6 py-4 hidden lg:table-cell space-x-2">
                    {u.codeforces_handle && <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5">CF</Badge>}
                    {u.atcoder_handle && <Badge variant="outline" className="border-success/30 text-success bg-success/5">AC</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="ghost" size="sm"><Link to={`/profile/${u.username}`}><Edit className="h-4 w-4" /></Link></Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirm(u.username)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No users found matching your search.</div>}
      </div>

      <AnimatePresence>
        {confirm && (
          <Modal title="Confirm Deletion" onClose={() => setConfirm(null)}>
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <p className="text-muted-foreground">Are you sure you want to permanently remove <strong className="text-foreground">@{confirm}</strong>? This action cannot be undone and all associated data will be lost.</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(confirm)} disabled={deleting === confirm}>{deleting === confirm ? "Deleting..." : "Permanently Delete"}</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function AddUserSection({ onRefresh }) {
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", codeforces_handle: "", atcoder_handle: "", codechef_handle: "" });
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading"); setMsg("");
    try {
      const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ""));
      const res = await fetch(`${API}/auth/SignUp`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.detail || "Sign up failed."); }
      setMsg("User created successfully!"); setStatus("success");
      setForm({ name: "", username: "", email: "", password: "", codeforces_handle: "", atcoder_handle: "", codechef_handle: "" });
      onRefresh();
    } catch (err) { setMsg(err.message); setStatus("error"); }
  };

  return (
    <Card className="max-w-3xl mx-auto bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Register New Participant</CardTitle>
        <CardDescription>Manually add a new user to the rating system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Full Name <span className="text-destructive">*</span></label><Input placeholder="John Doe" value={form.name} onChange={e => set("name", e.target.value)} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Username (VJudge) <span className="text-destructive">*</span></label><Input placeholder="johndoe123" value={form.username} onChange={e => set("username", e.target.value)} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Email <span className="text-destructive">*</span></label><Input type="email" placeholder="john@example.com" value={form.email} onChange={e => set("email", e.target.value)} required /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Password <span className="text-destructive">*</span></label><Input type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} required /></div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Linked Handles</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2"><label className="text-sm font-medium">Codeforces <span className="text-destructive">*</span></label><Input placeholder="tourist" value={form.codeforces_handle} onChange={e => set("codeforces_handle", e.target.value)} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">AtCoder <span className="text-destructive">*</span></label><Input placeholder="tourist" value={form.atcoder_handle} onChange={e => set("atcoder_handle", e.target.value)} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">CodeChef <span className="text-destructive">*</span></label><Input placeholder="tourist" value={form.codechef_handle} onChange={e => set("codechef_handle", e.target.value)} required /></div>
            </div>
          </div>

          {msg && <div className={cn("p-3 rounded-md text-sm border", status === "success" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>{msg}</div>}

          <Button type="submit" className="w-full sm:w-auto" disabled={status === "loading"}>
            {status === "loading" ? "Creating..." : "Create User"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddContestSection() {
  const [form, setForm] = useState({ vjudge_url: "", name: "", scheduled_at: "", duration_hours: "2" });
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading"); setMsg("");
    try {
      const payload = {
        vjudge_url: form.vjudge_url, name: form.name || null,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        duration_seconds: Math.round(parseFloat(form.duration_hours || 2) * 3600), is_rated: true,
      };
      const res = await fetch(`${API}/contests/add`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to add contest.");
      setMsg(`Contest "${data.name || form.vjudge_url}" added successfully!`); setStatus("success");
      setForm({ vjudge_url: "", name: "", scheduled_at: "", duration_hours: "2" });
    } catch (err) { setMsg(err.message); setStatus("error"); }
  };

  return (
    <Card className="max-w-2xl mx-auto bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle>Schedule Contest</CardTitle>
        <CardDescription>Add a new VJudge contest to track for ratings.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2"><label className="text-sm font-medium">VJudge Contest URL <span className="text-destructive">*</span></label><Input type="url" placeholder="https://vjudge.net/contest/12345" value={form.vjudge_url} onChange={e => set("vjudge_url", e.target.value)} required /></div>
          <div className="space-y-2"><label className="text-sm font-medium">Contest Name <span className="text-muted-foreground font-normal">(Auto-filled if left blank)</span></label><Input placeholder="Weekly Practice #10" value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2"><label className="text-sm font-medium">Start Time (Local)</label><Input type="datetime-local" value={form.scheduled_at} onChange={e => set("scheduled_at", e.target.value)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Duration (Hours)</label><Input type="number" min="0.5" step="0.5" value={form.duration_hours} onChange={e => set("duration_hours", e.target.value)} /></div>
          </div>
          {msg && <div className={cn("p-3 rounded-md text-sm border", status === "success" ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20")}>{msg}</div>}
          <Button type="submit" className="w-full sm:w-auto" disabled={status === "loading"}>
            {status === "loading" ? "Scheduling..." : "Add Contest"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ScrapeContestSection() {
  const [urls, setUrls] = useState("");
  const [status, setStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const handleScrape = async (e) => {
    e.preventDefault();
    setStatus("loading"); setError(""); setResults(null);
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    try {
      const res = await fetch(`${API}/contests/scrape`, {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ urls: urlList }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Scrape failed."); }
      const data = await res.json();
      setResults(data.results); setStatus("success");
    } catch (err) { setError(err.message); setStatus("error"); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="bg-card/50 backdrop-blur h-fit">
        <CardHeader>
          <CardTitle>Sync Contest Data</CardTitle>
          <CardDescription>Enter VJudge contest URLs to scrape standings and recalculate weekly points.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScrape} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Contest URLs (One per line)</label>
              <textarea value={urls} onChange={e => setUrls(e.target.value)} rows={6} className="w-full rounded-md border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 resize-none font-mono" placeholder="https://vjudge.net/contest/12345&#10;https://vjudge.net/contest/67890" />
            </div>
            {error && <div className="p-3 rounded-md text-sm border bg-destructive/10 text-destructive border-destructive/20">{error}</div>}
            <Button type="submit" className="w-full" disabled={status === "loading" || !urls.trim()}>
              {status === "loading" ? "Processing Data..." : <><DownloadCloud className="mr-2 h-4 w-4" /> Run Sync Operation</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="bg-success/10 text-success border border-success/20 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-success text-success-foreground p-1 rounded-full"><ChevronRight className="h-4 w-4" /></div>
                <div>
                  <h4 className="font-semibold text-sm">Sync Completed</h4>
                  <p className="text-sm opacity-90">Successfully processed {results.length} contest(s) and updated global standings.</p>
                </div>
              </div>

              {results.map((r, i) => (
                <Card key={i} className="overflow-hidden border-border/50">
                  <div className="bg-muted/50 px-4 py-3 flex justify-between items-center border-b">
                    <span className="font-semibold text-sm line-clamp-1">{r.contest_name || "Unnamed Contest"}</span>
                    <Badge variant="secondary" className="shrink-0">{r.contestants.length} Users</Badge>
                  </div>
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/20 text-muted-foreground text-xs uppercase">
                      <tr><th className="px-4 py-2 font-medium">Rank</th><th className="px-4 py-2 font-medium">Handle</th><th className="px-4 py-2 font-medium text-right">Solved</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {r.contestants.slice(0, 5).map((c, ci) => (
                        <tr key={ci}><td className="px-4 py-2 font-mono text-muted-foreground">#{c.position}</td><td className="px-4 py-2 font-medium">{c.contestant}</td><td className="px-4 py-2 text-right font-mono text-primary">{c.solves}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {r.contestants.length > 5 && <div className="bg-muted/10 px-4 py-2 text-xs text-muted-foreground text-center border-t border-border/50">+{r.contestants.length - 5} more participants</div>}
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API}/admin/ViewAllUsers`, { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } });
      const data = await res.json();
      setUsers(data.participants || []);
    } catch { setUsers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const isAdmin = localStorage.getItem('userRole') === 'admin';

  const tabs = [
    { id: "users", label: "Manage Users", icon: Users },
    { id: "add", label: "Add Participant", icon: UserPlus },
    ...(isAdmin ? [{ id: "contest", label: "Schedule Contest", icon: PlusCircle }] : []),
    ...(isAdmin ? [{ id: "scrape", label: "Sync Standings", icon: DownloadCloud }] : []),
  ];

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-8">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="destructive" className="uppercase tracking-widest text-[10px]">Admin Area</Badge>
              <h1 className="text-3xl font-bold tracking-tight">System Control</h1>
            </div>
            <p className="text-muted-foreground">Monitor platform activity, manage user access, and synchronize contest data.</p>
          </div>
        </div>

        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Members" value={users.length} icon={Users} colorClass="text-primary/20 bg-primary/5" />
            <StatCard label="Administrators" value={users.filter(u => u.role === "admin").length} icon={AlertTriangle} colorClass="text-destructive/20 bg-destructive/5" />
            <StatCard label="CF Connected" value={users.filter(u => u.codeforces_handle).length} icon={Code2} colorClass="text-blue-500/20 bg-blue-500/5" />
            <StatCard label="AC Connected" value={users.filter(u => u.atcoder_handle).length} icon={Activity} colorClass="text-success/20 bg-success/5" />
          </div>
        )}

        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar gap-2">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <Button key={t.id} variant={active ? "default" : "outline"} className={cn("whitespace-nowrap flex-shrink-0 transition-all", active ? "shadow-md shadow-primary/20" : "")} onClick={() => setTab(t.id)}>
                <Icon className={cn("mr-2 h-4 w-4", active ? "text-primary-foreground" : "text-muted-foreground")} /> {t.label}
              </Button>
            );
          })}
        </div>

        <div className="min-h-[500px]">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              {tab === "users" && <UsersSection users={users} onRefresh={fetchUsers} />}
              {tab === "add" && <AddUserSection onRefresh={fetchUsers} />}
              {tab === "contest" && <AddContestSection />}
              {tab === "scrape" && <ScrapeContestSection />}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
