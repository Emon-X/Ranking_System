import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config';

export default function Standing() {
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchStandings = (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const url = isRefresh
            ? `${API_BASE_URL}/users/ViewAllUsers_by_Rank?refresh=true`
            : `${API_BASE_URL}/users/ViewAllUsers_by_Rank`;

        fetch(url, {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setUserData(data.participants || []);
                setLoading(false);
                setRefreshing(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
                setRefreshing(false);
            });
    };

    useEffect(() => {
        fetchStandings(false);
    }, []);

    return (
        <div className="min-h-screen bg-ink-950 py-12 px-6 sm:px-10">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-semibold text-ink-100">ACM Lab</h1>
                        <p className="mt-2 text-ink-400">CSE, Mawlana Bhashani Science and Technology University</p>
                    </div>
                    {/* <button
                        onClick={() => fetchStandings(true)}
                        disabled={refreshing || loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-rank-blue/15 border border-rank-blue/30 hover:bg-rank-blue/20 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-rank-blue transition"
                    >
                        {refreshing ? (
                            <>
                                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Recalculating…
                            </>
                        ) : (
                            <>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
                                </svg>
                                Recalculate Standings
                            </>
                        )}
                    {/* </button> */}
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <svg className="h-8 w-8 animate-spin text-rank-blue" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-rank-red/30 bg-rank-red/10 px-4 py-3 text-sm text-rank-red">
                        Failed to load standings: {error}
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-900/50 backdrop-blur">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-ink-400">
                                <thead className="border-b border-ink-800 bg-ink-900/80 text-xs uppercase text-ink-500">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Rank</th>
                                        <th className="px-6 py-4 font-medium">User</th>
                                        <th className="px-6 py-4 font-medium">Weekly Points</th>
                                        <th className="px-6 py-4 font-medium hidden sm:table-cell">CF Rating</th>
                                        <th className="px-6 py-4 font-medium hidden sm:table-cell">AC Rating</th>
                                        <th className="px-6 py-4 font-medium text-right">Total Solved (7d)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-800">
                                    {userData.map((user, index) => (
                                        <tr
                                            key={user.username || index}
                                            className="transition-colors hover:bg-ink-800/40"
                                        >
                                            <td className="px-6 py-4">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-mono text-xs font-semibold ${index === 0 ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/30' : index === 1 ? 'bg-slate-300/20 text-slate-300 ring-1 ring-slate-300/30' : index === 2 ? 'bg-amber-700/20 text-amber-600 ring-1 ring-amber-700/30' : 'bg-ink-800 text-ink-300'}`}>
                                                    #{index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <Link
                                                            to={`/profile/${user.username}`}
                                                            className="font-medium text-ink-100 hover:text-rank-blue transition"
                                                        >
                                                            {user.name || user.username}
                                                        </Link>
                                                        <div className="text-xs text-ink-500">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-rank-blue/10 px-2 py-1 font-mono text-xs font-medium text-rank-blue ring-1 ring-inset ring-rank-blue/20">
                                                    {user.weekly_points}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className={user.codeforces_rating >= 1400 ? 'text-rank-cyan' : 'text-ink-300'}>
                                                    {user.codeforces_rating}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className={user.atcoder_rating >= 400 ? 'text-rank-green' : 'text-ink-300'}>
                                                    {user.atcoder_rating}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-medium text-ink-200">
                                                {user.total_solved_last_7_days}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}