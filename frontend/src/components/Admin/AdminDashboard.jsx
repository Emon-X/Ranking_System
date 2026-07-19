import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

// ─── Tiny UI Atoms ────────────────────────────────────────────────────────────

const Badge = ({ children, color = "blue" }) => {
    const colors = {
        blue: "bg-rank-blue/10 text-rank-blue ring-rank-blue/20",
        red: "bg-red-500/10 text-red-400 ring-red-500/20",
        green: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
        amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset ${colors[color]}`}>
            {children}
        </span>
    );
};

const StatCard = ({ label, value, sub, color = "blue" }) => {
    const border = { blue: "border-rank-blue/20", green: "border-emerald-500/20", amber: "border-amber-500/20", red: "border-red-500/20" };
    const text = { blue: "text-rank-blue", green: "text-emerald-400", amber: "text-amber-400", red: "text-red-400" };
    return (
        <div className={`rounded-xl border ${border[color]} bg-ink-900/60 p-5 backdrop-blur`}>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</p>
            <p className={`mt-2 font-display text-3xl font-semibold ${text[color]}`}>{value}</p>
            {sub && <p className="mt-1 text-xs text-ink-500">{sub}</p>}
        </div>
    );
};

const Modal = ({ title, children, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-ink-100">{title}</h3>
                <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800 hover:text-ink-100">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
            {children}
        </div>
    </div>
);

const InputField = ({ label, ...props }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-medium text-ink-400">{label}</label>
        <input {...props} className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/20" />
    </div>
);

// ─── Sections ─────────────────────────────────────────────────────────────────

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
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            if (!res.ok) throw new Error("Failed to delete");
            showToast(`${username} removed.`);
            onRefresh();
        } catch {
            showToast("Delete failed.", "error");
        } finally {
            setDeleting(null);
            setConfirm(null);
        }
    };

    const filtered = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {toast && (
                <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${toast.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                    {toast.msg}
                </div>
            )}
            <div className="mb-4 flex items-center gap-3">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="w-64 rounded-lg border border-ink-700 bg-ink-800/60 px-3 py-2 font-mono text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue"
                />
                <span className="ml-auto text-xs text-ink-500">{filtered.length} user{filtered.length !== 1 && "s"}</span>
            </div>
            <div className="overflow-hidden rounded-xl border border-ink-800">
                <table className="w-full text-left text-sm text-ink-400">
                    <thead className="border-b border-ink-800 bg-ink-900/80 text-xs uppercase text-ink-500">
                        <tr>
                            <th className="px-5 py-3 font-medium">User</th>
                            <th className="px-5 py-3 font-medium hidden md:table-cell">Email</th>
                            <th className="px-5 py-3 font-medium hidden lg:table-cell">CF / AC</th>
                            <th className="px-5 py-3 font-medium">Role</th>
                            <th className="px-5 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-800">
                        {filtered.map(u => (
                            <tr key={u.username} className="transition-colors hover:bg-ink-800/30">
                                <td className="px-5 py-3">
                                    <div className="font-medium text-ink-100">{u.name}</div>
                                    <div className="text-xs text-ink-500">@{u.username}</div>
                                </td>
                                <td className="px-5 py-3 hidden md:table-cell font-mono text-xs">{u.email}</td>
                                <td className="px-5 py-3 hidden lg:table-cell">
                                    <div className="flex gap-2">
                                        {u.codeforces_handle && <Badge color="blue">CF: {u.codeforces_handle}</Badge>}
                                        {u.atcoder_handle && <Badge color="amber">AC: {u.atcoder_handle}</Badge>}
                                    </div>
                                </td>
                                <td className="px-5 py-3">
                                    <Badge color={u.role === "admin" ? "green" : "blue"}>{u.role}</Badge>
                                </td>
                                <td className="px-5 py-3 text-right">
                                    <button
                                        onClick={() => setConfirm(u.username)}
                                        className="rounded-lg px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {confirm && (
                <Modal title="Confirm Delete" onClose={() => setConfirm(null)}>
                    <p className="text-sm text-ink-400">
                        Are you sure you want to permanently remove <span className="font-semibold text-ink-100">@{confirm}</span>? This cannot be undone.
                    </p>
                    <div className="mt-5 flex justify-end gap-3">
                        <button onClick={() => setConfirm(null)} className="rounded-lg border border-ink-600 px-4 py-2 text-sm font-medium text-ink-200 hover:bg-ink-800">
                            Cancel
                        </button>
                        <button
                            onClick={() => handleDelete(confirm)}
                            disabled={deleting === confirm}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:opacity-60"
                        >
                            {deleting === confirm ? "Deleting…" : "Delete"}
                        </button>
                    </div>
                </Modal>
            )}
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
        setStatus("loading");
        setMsg("");
        try {
            const payload = Object.fromEntries(
                Object.entries(form).filter(([, v]) => v !== "")
            );
            const res = await fetch(`${API}/auth/SignUp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Sign up failed.");
            }
            setMsg("User created successfully!");
            setStatus("success");
            setForm({ name: "", username: "", email: "", password: "", codeforces_handle: "", atcoder_handle: "", codechef_handle: "" });
            onRefresh();
        } catch (err) {
            setMsg(err.message);
            setStatus("error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InputField label="Full Name *" placeholder="Alice" value={form.name} onChange={e => set("name", e.target.value)} required />
                <InputField label="Username (VJudge) *" placeholder="alice_x" value={form.username} onChange={e => set("username", e.target.value)} required />
                <InputField label="Email *" type="email" placeholder="alice@example.com" value={form.email} onChange={e => set("email", e.target.value)} required />
                <InputField label="Password *" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} required />
            </div>
            <hr className="border-ink-800" />
            <p className="text-xs font-medium uppercase tracking-widest text-ink-500">Competitive Handles (optional)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <InputField label="Codeforces" placeholder="tourist" value={form.codeforces_handle} onChange={e => set("codeforces_handle", e.target.value)} />
                <InputField label="AtCoder" placeholder="tourist" value={form.atcoder_handle} onChange={e => set("atcoder_handle", e.target.value)} />
                <InputField label="CodeChef" placeholder="tourist" value={form.codechef_handle} onChange={e => set("codechef_handle", e.target.value)} />
            </div>
            {msg && (
                <p className={`text-sm ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
            )}
            <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-rank-blue px-5 py-2.5 font-medium text-ink-950 transition hover:bg-rank-cyan disabled:opacity-60"
            >
                {status === "loading" ? "Creating…" : "Create User"}
            </button>
        </form>
    );
}

function AddContestSection() {
    const [form, setForm] = useState({ vjudge_url: "", name: "", scheduled_at: "", duration_hours: "2" });
    const [status, setStatus] = useState("idle");
    const [msg, setMsg] = useState("");

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setMsg("");
        try {
            const payload = {
                vjudge_url: form.vjudge_url,
                name: form.name || null,
                scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
                duration_seconds: Math.round(parseFloat(form.duration_hours || 2) * 3600),
                is_rated: true,
            };
            const res = await fetch(`${API}/contests/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to add contest.");
            setMsg(`Contest "${data.name || form.vjudge_url}" added successfully!`);
            setStatus("success");
            setForm({ vjudge_url: "", name: "", scheduled_at: "", duration_hours: "2" });
        } catch (err) {
            setMsg(err.message);
            setStatus("error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-ink-200">VJudge Contest URL *</label>
                <input
                    type="url"
                    placeholder="https://vjudge.net/contest/12345"
                    value={form.vjudge_url}
                    onChange={e => set("vjudge_url", e.target.value)}
                    required
                    className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-ink-200">Contest Name (optional — auto-filled from VJudge)</label>
                <input
                    type="text"
                    placeholder="e.g. Weekly Contest #5"
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
                />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-ink-200">Start Time (local)</label>
                    <input
                        type="datetime-local"
                        value={form.scheduled_at}
                        onChange={e => set("scheduled_at", e.target.value)}
                        className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 text-sm text-ink-100 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-ink-200">Duration (hours)</label>
                    <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={form.duration_hours}
                        onChange={e => set("duration_hours", e.target.value)}
                        className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 text-sm text-ink-100 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
                    />
                </div>
            </div>
            {msg && (
                <p className={`text-sm ${status === "success" ? "text-emerald-400" : "text-red-400"}`}>{msg}</p>
            )}
            <button
                type="submit"
                disabled={status === "loading"}
                className="rounded-lg bg-rank-blue px-5 py-2.5 font-medium text-ink-950 transition hover:bg-rank-cyan disabled:opacity-60"
            >
                {status === "loading" ? "Adding…" : "Add Contest"}
            </button>
        </form>
    );
}


function ScrapeContestSection() {
    const [urls, setUrls] = useState("");
    const [status, setStatus] = useState("idle");
    const [results, setResults] = useState(null);
    const [error, setError] = useState("");


    const handleScrape = async (e) => {
        e.preventDefault();
        setStatus("loading");
        setError("");
        setResults(null);
        const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
        try {
            const res = await fetch(`${API}/contests/scrape`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ urls: urlList }),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.detail || "Scrape failed.");
            }
            const data = await res.json();
            setResults(data.results);
            setStatus("success");
        } catch (err) {
            setError(err.message);
            setStatus("error");
        }
    };

    return (
        <div className="max-w-2xl space-y-5">
            <form onSubmit={handleScrape} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-ink-400">VJudge Contest URLs (one per line)</label>
                    <textarea
                        value={urls}
                        onChange={e => setUrls(e.target.value)}
                        rows={5}
                        placeholder={"https://vjudge.net/contest/12345\nhttps://vjudge.net/contest/12346"}
                        className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3.5 py-2.5 font-mono text-sm text-ink-100 placeholder:text-ink-500 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/20 resize-y"
                    />
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <button
                    type="submit"
                    disabled={status === "loading" || !urls.trim()}
                    className="flex items-center gap-2 rounded-lg bg-rank-blue px-5 py-2.5 font-medium text-ink-950 transition hover:bg-rank-cyan disabled:opacity-60"
                >
                    {status === "loading" && (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    )}
                    {status === "loading" ? "Scraping…" : "Scrape & Update Scores"}
                </button>
            </form>

            {results && (
                <div className="space-y-4">
                    <p className="text-sm font-medium text-emerald-400">✓ Scraped {results.length} contest{results.length !== 1 && "s"} and updated weekly points.</p>
                    {results.map((r, i) => (
                        <div key={i} className="rounded-xl border border-ink-800 bg-ink-900/50 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-ink-800 px-4 py-3">
                                <span className="font-medium text-ink-100 text-sm">{r.contest_name || "Unnamed Contest"}</span>
                                <Badge color="green">{r.contestants.length} participants</Badge>
                            </div>
                            <table className="w-full text-left text-xs text-ink-400">
                                <thead className="border-b border-ink-800 bg-ink-900/80">
                                    <tr>
                                        <th className="px-4 py-2 font-medium text-ink-500">#</th>
                                        <th className="px-4 py-2 font-medium text-ink-500">Handle</th>
                                        <th className="px-4 py-2 font-medium text-ink-500 text-right">Solved</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-800">
                                    {r.contestants.slice(0, 10).map((c, ci) => (
                                        <tr key={ci} className="hover:bg-ink-800/30">
                                            <td className="px-4 py-2 font-mono text-ink-500">{c.position}</td>
                                            <td className="px-4 py-2 text-ink-200">{c.contestant}</td>
                                            <td className="px-4 py-2 text-right font-mono">{c.solves}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {r.contestants.length > 10 && (
                                <p className="px-4 py-2 text-xs text-ink-500">+ {r.contestants.length - 10} more…</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const [tab, setTab] = useState("users");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch(`${API}/admin/ViewAllUsers`, {
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            setUsers(data.participants || []);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const isAdmin = localStorage.getItem('userRole') === 'admin';

    const tabs = [
        { id: "users", label: "All Users" },
        { id: "add", label: "Add User" },
        ...(isAdmin ? [{ id: "contest", label: "Add Contest" }] : []),
        ...(isAdmin ? [{ id: "scrape", label: "Scrape Contest" }] : []),
    ];

    return (
        <div className="min-h-screen bg-ink-950 py-10 px-6 sm:px-10">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-medium text-amber-400 ring-1 ring-amber-500/20">ADMIN</span>
                        <h1 className="font-display text-2xl font-semibold text-ink-100">Dashboard</h1>
                    </div>
                    <p className="text-sm text-ink-500">Manage users, add participants, and sync VJudge contest data.</p>
                </div>

                {/* Stats */}
                {!loading && (
                    <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard label="Total Users" value={users.length} color="blue" />
                        <StatCard label="Admins" value={users.filter(u => u.role === "admin").length} color="amber" />
                        <StatCard label="CF Linked" value={users.filter(u => u.codeforces_handle).length} color="green" />
                        <StatCard label="AC Linked" value={users.filter(u => u.atcoder_handle).length} color="blue" />
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6 flex gap-1 rounded-xl border border-ink-800 bg-ink-900/50 p-1 w-fit">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === t.id ? "bg-rank-blue/15 text-rank-blue" : "text-ink-400 hover:text-ink-200"}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center gap-3 text-ink-400">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Loading…
                    </div>
                ) : (
                    <>
                        {tab === "users" && <UsersSection users={users} onRefresh={fetchUsers} />}
                        {tab === "add" && <AddUserSection onRefresh={fetchUsers} />}
                        {tab === "contest" && <AddContestSection />}
                        {tab === "scrape" && <ScrapeContestSection />}
                    </>
                )}
            </div>
        </div>
    );
}
