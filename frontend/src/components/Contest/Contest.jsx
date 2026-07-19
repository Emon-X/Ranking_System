import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';

const API = API_BASE_URL;

const CalendarIcon = () => (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const ExternalIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

function formatDate(iso) {
    if (!iso) return "TBA";
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function CountdownBadge({ scheduledAt }) {
    const diff = new Date(scheduledAt) - new Date();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    return (
        <span className="font-mono text-[11px] text-rank-cyan">
            {days > 0 ? `${days}d ${hrs}h remaining` : `${hrs}h remaining`}
        </span>
    );
}

export default function Contest() {
    const [upcoming, setUpcoming] = useState([]);
    const [running, setRunning] = useState([]);
    const [past, setPast] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`${API}/contests/list`, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => {
                setUpcoming(data.upcoming || []);
                setRunning(data.running || []);
                setPast(data.past || []);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-ink-950 py-12 px-6 sm:px-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-10">
                    <h1 className="font-display text-3xl font-semibold text-ink-100">Contests</h1>
                    <p className="mt-2 text-ink-400">View upcoming schedules, running contests, and past standings.</p>
                </div>

                {loading && (
                    <div className="flex items-center gap-3 text-ink-400">
                        <svg className="h-5 w-5 animate-spin text-rank-blue" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Loading contests…
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        Failed to load contests: {error}
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-12">
                        {/* Running Contests */}
                        {running.length > 0 && (
                            <section>
                                <h2 className="mb-4 font-display text-xl font-medium text-emerald-400 flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </span>
                                    Running Contests
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {running.map(c => (
                                        <a key={c.id} href={c.vjudge_url} target="_blank" rel="noreferrer"
                                            className="block rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 transition hover:bg-emerald-500/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-medium text-ink-100">{c.name || c.vjudge_url}</h3>
                                                <span className="shrink-0 inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-1 font-mono text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                                                    LIVE
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-1">
                                                <p className="text-sm text-emerald-400/80 flex items-center gap-2">
                                                    <CalendarIcon />
                                                    Started: {formatDate(c.scheduled_at)}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Upcoming Contests */}
                        <section>
                            <h2 className="mb-4 font-display text-xl font-medium text-ink-100 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rank-blue opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rank-blue" />
                                </span>
                                Upcoming Contests
                            </h2>
                            {upcoming.length === 0 ? (
                                <p className="text-sm text-ink-500 italic">No upcoming contests scheduled yet.</p>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {upcoming.map(c => (
                                        <a key={c.id} href={c.vjudge_url} target="_blank" rel="noreferrer"
                                            className="block rounded-xl border border-rank-blue/30 bg-rank-blue/5 p-5 transition hover:bg-rank-blue/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-medium text-ink-100">{c.name || c.vjudge_url}</h3>
                                                <span className="shrink-0 inline-flex items-center rounded-md bg-rank-blue/10 px-2 py-1 font-mono text-[10px] font-medium text-rank-blue ring-1 ring-inset ring-rank-blue/20">
                                                    VJudge
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-1">
                                                <p className="text-sm text-ink-400 flex items-center gap-2">
                                                    <CalendarIcon />
                                                    {formatDate(c.scheduled_at)}
                                                </p>
                                                {c.scheduled_at && <CountdownBadge scheduledAt={c.scheduled_at} />}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Past Contests */}
                        <section>
                            <h2 className="mb-4 font-display text-xl font-medium text-ink-100">Past Contests</h2>
                            {past.length === 0 ? (
                                <p className="text-sm text-ink-500 italic">No past contests recorded yet.</p>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 backdrop-blur">
                                    <table className="w-full text-left text-sm text-ink-400">
                                        <thead className="border-b border-ink-800 bg-ink-900/80 text-xs uppercase text-ink-500">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">#</th>
                                                <th className="px-6 py-4 font-medium">Contest Name</th>
                                                <th className="px-6 py-4 font-medium hidden sm:table-cell">Date</th>
                                                <th className="px-6 py-4 font-medium text-right">Link</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-ink-800">
                                            {past.map((c, idx) => (
                                                <tr key={c.id} className="transition-colors hover:bg-ink-800/40">
                                                    <td className="px-6 py-4 font-mono text-xs text-ink-500">{idx + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-ink-200">{c.name || "Unnamed Contest"}</td>
                                                    <td className="px-6 py-4 font-mono text-xs hidden sm:table-cell">{formatDate(c.scheduled_at)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <a href={c.vjudge_url} target="_blank" rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-rank-blue hover:text-rank-cyan transition">
                                                            View <ExternalIcon />
                                                        </a>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}
