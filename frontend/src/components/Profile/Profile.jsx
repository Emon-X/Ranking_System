import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

const ExternalIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const UserIcon = () => (
    <svg className="h-12 w-12 text-rank-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export default function Profile() {
    const { username } = useParams();
    const currentUsername = localStorage.getItem("username");
    const targetUsername = username || currentUsername;

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    const isOwnProfile = currentUsername === user?.username;
    const isAdminViewing = localStorage.getItem("userRole") === "admin";

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`${API}/users/ViewUser/${targetUsername}`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 404) throw new Error("User profile not found.");
                    throw new Error(`HTTP error: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setUser(data.participant);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [targetUsername]);

    if (loading) {
        return (
            <div className="flex min-h-screen bg-ink-950 items-center justify-center">
                <div className="flex items-center gap-3 text-ink-400">
                    <svg className="h-6 w-6 animate-spin text-rank-blue" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <span>Loading profile…</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-ink-950 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-xl border border-rank-red/30 bg-rank-red/10 p-5 text-center text-rank-red">
                    <h3 className="font-semibold text-lg">Error</h3>
                    <p className="mt-2 text-sm text-ink-300">{error}</p>
                    <Link to="/" className="mt-5 inline-block text-xs font-semibold uppercase tracking-wider text-rank-blue hover:underline">
                        Back to Standings
                    </Link>
                </div>
            </div>
        );
    }

    // Parse weekly positions history
    let positionHistory = [];
    try {
        positionHistory = JSON.parse(user.weekly_positions_history || "[]");
    } catch {
        positionHistory = [];
    }

    // Prepare SVG elements for rank history chart
    const renderChart = () => {
        if (!positionHistory || positionHistory.length === 0) {
            return (
                <div className="flex h-36 items-center justify-center rounded-xl border border-ink-800 bg-ink-900/20 text-sm text-ink-500 italic">
                    No weekly position history recorded yet.
                </div>
            );
        }

        const width = 500;
        const height = 150;
        const padding = 20;

        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;

        const maxRank = Math.max(...positionHistory, 10);
        const minRank = 1; // Rank #1 is the best

        const points = positionHistory.map((rank, index) => {
            const x = padding + (index / Math.max(1, positionHistory.length - 1)) * chartWidth;
            // Invert Y axis: smaller rank (1) is higher (near the top)
            const y = padding + ((rank - minRank) / Math.max(1, maxRank - minRank)) * chartHeight;
            return { x, y, rank, week: index + 1 };
        });

        const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        return (
            <div className="rounded-xl border border-ink-800 bg-ink-900/40 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-4">Rank History (Weekly Standings)</h3>
                <div className="relative overflow-x-auto">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px] h-auto">
                        {/* Horizontal Grid lines */}
                        {[0, 0.5, 1].map((ratio, i) => {
                            const y = padding + ratio * chartHeight;
                            const r = Math.round(minRank + ratio * (maxRank - minRank));
                            return (
                                <g key={i}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1f2937" strokeWidth="1" strokeDasharray="3,3" />
                                    <text x={padding - 5} y={y + 4} fill="#6b7280" fontSize="8" textAnchor="end">#{r}</text>
                                </g>
                            );
                        })}

                        {/* Chart Line */}
                        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                        {/* Points */}
                        {points.map((p, i) => (
                            <g key={i} className="group cursor-pointer">
                                <circle cx={p.x} cy={p.y} r="4" fill="#60a5fa" stroke="#111827" strokeWidth="1.5" />
                                <circle cx={p.x} cy={p.y} r="8" fill="#60a5fa" className="opacity-0 hover:opacity-20 transition" />
                                <text x={p.x} y={p.y - 8} fill="#f3f4f6" fontSize="9" fontWeight="bold" textAnchor="middle" className="hidden group-hover:block bg-black px-1 rounded">
                                    #{p.rank}
                                </text>
                                <text x={p.x} y={height - 2} fill="#6b7280" fontSize="8" textAnchor="middle">W{p.week}</text>
                            </g>
                        ))}
                    </svg>
                </div>
                <div className="mt-3 flex justify-between text-[10px] text-ink-500 font-mono">
                    <span>Best Rank: #{Math.min(...positionHistory)}</span>
                    <span>Total Weeks: {positionHistory.length}</span>
                </div>
            </div>
        );
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API}/${isAdminViewing ? 'admin/UpdateUser/' + user.username : 'users/UpdateUser'}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.detail || "Update failed");
            }
            setIsEditing(false);
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="min-h-screen bg-ink-950 py-12 px-6 sm:px-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 flex justify-between items-center">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-rank-blue transition">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Standings
                    </Link>
                    {(isAdminViewing || isOwnProfile) && (
                        <button onClick={() => {
                            setEditForm({
                                name: user.name || "",
                                email: user.email || "",
                                codeforces_handle: user.codeforces_handle || "",
                                atcoder_handle: user.atcoder_handle || "",
                                codechef_handle: user.codechef_handle || "",
                                vjudge_handle: user.vjudge_handle || "",
                            });
                            setIsEditing(true);
                        }} className="rounded-lg bg-ink-800 px-3 py-1.5 text-xs font-medium text-ink-200 hover:bg-ink-700">
                            Edit Profile
                        </button>
                    )}
                </div>

                {isEditing && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsEditing(false)}>
                        <div className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="font-display text-lg font-semibold text-ink-100">Edit Profile</h3>
                                <button onClick={() => setIsEditing(false)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-800">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" /></svg>
                                </button>
                            </div>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div><label className="text-xs text-ink-400">Name</label><input className="w-full rounded bg-ink-900/50 border border-ink-700 p-2 text-ink-100" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} required/></div>
                                <div><label className="text-xs text-ink-400">Email</label><input type="email" className="w-full rounded bg-ink-900/50 border border-ink-700 p-2 text-ink-100" value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} required/></div>
                                <div><label className="text-xs text-ink-400">Codeforces Handle</label><input className="w-full rounded bg-ink-900/50 border border-ink-700 p-2 text-ink-100" value={editForm.codeforces_handle} onChange={e=>setEditForm({...editForm, codeforces_handle: e.target.value})}/></div>
                                <div><label className="text-xs text-ink-400">AtCoder Handle</label><input className="w-full rounded bg-ink-900/50 border border-ink-700 p-2 text-ink-100" value={editForm.atcoder_handle} onChange={e=>setEditForm({...editForm, atcoder_handle: e.target.value})}/></div>
                                <div><label className="text-xs text-ink-400">VJudge Handle</label><input className="w-full rounded bg-ink-900/50 border border-ink-700 p-2 text-ink-100" value={editForm.vjudge_handle} onChange={e=>setEditForm({...editForm, vjudge_handle: e.target.value})}/></div>
                                <button type="submit" className="w-full rounded-lg bg-rank-blue py-2 text-ink-950 font-bold">Save Changes</button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Profile Card */}
                <div className="overflow-hidden rounded-2xl border border-ink-800 bg-ink-900/60 p-6 sm:p-8 backdrop-blur shadow-xl mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rank-blue/10 border border-rank-blue/20">
                                <UserIcon />
                            </div>
                            <div>
                                <h1 className="font-display text-2xl font-bold text-ink-100">{user.name}</h1>
                                <p className="text-sm text-ink-400 mt-1">@{user.username}</p>
                                <p className="text-xs text-ink-500 font-mono mt-2">{user.email}</p>
                            </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-center sm:items-end gap-2">
                            <span className="inline-flex items-center rounded-full bg-rank-blue/15 px-3 py-1 font-mono text-xs font-semibold text-rank-blue ring-1 ring-inset ring-rank-blue/30">
                                {user.role.toUpperCase()}
                            </span>
                            {user.weekly_position > 0 && (
                                <p className="text-xs text-ink-400 font-medium">
                                    Current Rank: <span className="font-bold text-amber-500">#{user.weekly_position}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Handles Grid */}
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-ink-800/80 pt-6">
                        <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Codeforces</span>
                            {user.codeforces_handle ? (
                                <a
                                    href={`https://codeforces.com/profile/${user.codeforces_handle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 flex items-center justify-between text-sm font-medium text-ink-200 hover:text-rank-blue transition"
                                >
                                    <span>{user.codeforces_handle}</span>
                                    <ExternalIcon />
                                </a>
                            ) : (
                                <span className="mt-1 block text-sm text-ink-500 italic">Not Linked</span>
                            )}
                        </div>
                        <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">AtCoder</span>
                            {user.atcoder_handle ? (
                                <a
                                    href={`https://atcoder.jp/users/${user.atcoder_handle}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 flex items-center justify-between text-sm font-medium text-ink-200 hover:text-rank-blue transition"
                                >
                                    <span>{user.atcoder_handle}</span>
                                    <ExternalIcon />
                                </a>
                            ) : (
                                <span className="mt-1 block text-sm text-ink-500 italic">Not Linked</span>
                            )}
                        </div>
                        <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">VJudge Handle</span>
                            <span className="mt-1 block text-sm font-medium text-ink-200">{user.vjudge_handle || user.username}</span>
                        </div>
                    </div>
                </div>

                {/* Score Grid & Rank History */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6 backdrop-blur">
                            <h2 className="font-display text-lg font-semibold text-ink-100 mb-4">Points & Stats</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Weekly Points</span>
                                    <span className="mt-1.5 block font-mono text-2xl font-bold text-rank-blue">{user.weekly_points || 0}</span>
                                </div>
                                <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">Contest Point</span>
                                    <span className="mt-1.5 block font-mono text-2xl font-bold text-rank-cyan">{Math.round(user.weekly_contest_point || 0)}</span>
                                </div>
                                <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">CF Rating</span>
                                    <span className="mt-1.5 block font-mono text-lg font-semibold text-ink-200">{user.codeforces_rating || 0}</span>
                                </div>
                                <div className="rounded-xl bg-ink-900/40 p-4 border border-ink-800">
                                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500">AtCoder Rating</span>
                                    <span className="mt-1.5 block font-mono text-lg font-semibold text-ink-200">{user.atcoder_rating || 0}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-ink-800 bg-ink-900/60 p-6 backdrop-blur">
                            <h2 className="font-display text-lg font-semibold text-ink-100 mb-4">Solved Problems (Last 7 Days)</h2>
                            <div className="space-y-3.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-ink-400">Codeforces Solves</span>
                                    <span className="font-mono text-sm font-semibold text-ink-200">{user.codeforces_solved_last_7_days || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-ink-400">AtCoder Solves</span>
                                    <span className="font-mono text-sm font-semibold text-ink-200">{user.atcoder_solved_last_7_days || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-ink-400">VJudge Contest Solves</span>
                                    <span className="font-mono text-sm font-semibold text-ink-200">{user.weekly_contest_solved_problem || 0}</span>
                                </div>
                                <div className="border-t border-ink-800 pt-3 flex items-center justify-between font-medium">
                                    <span className="text-sm text-ink-200">Total Solves</span>
                                    <span className="font-mono text-sm text-rank-blue">{user.total_solved_last_7_days || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        {renderChart()}
                        {positionHistory.length > 0 && (
                            <div className="mt-4 rounded-xl border border-ink-800 bg-ink-900/30 p-4">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-2">Weekly Standing Details</h4>
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-2">
                                    {positionHistory.map((rank, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-ink-800/40 last:border-0">
                                            <span className="text-ink-400 font-mono">Week {idx + 1}</span>
                                            <span className={`font-semibold ${rank === 1 ? "text-amber-500" : rank <= 3 ? "text-slate-300" : "text-ink-200"}`}>
                                                #{rank}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
