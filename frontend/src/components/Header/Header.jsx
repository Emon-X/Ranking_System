import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const isAdmin = () => localStorage.getItem('userRole') === 'admin';

const NAV_LINKS = [
    { label: "Standings", href: "standing" },
    { label: "Contests", href: "contest" },
    { label: "Profile", href: "profile" },
    { label: "Resources", href: "https://youkn0wwho.academy/topic-list" },
];

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");
    const navigate = useNavigate();
    
    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/login';
    };

    const handleSearchSubmit = (e) => {
        if (e.key === "Enter" && searchVal.trim()) {
            navigate(`/profile/${searchVal.trim()}`);
            setSearchVal("");
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b border-ink-700 bg-ink-950/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                {/* Logo */}
                <a href="#" className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rank-blue/15 font-display text-base font-semibold text-rank-blue ring-1 ring-rank-blue/30">
                        RS
                    </div>
                    <span className="font-display text-lg font-semibold tracking-tight text-ink-100">
                        Ranking System
                    </span>
                </a>

                {/* Desktop nav */}
                <nav className="hidden items-center gap-8 md:flex">
                    {NAV_LINKS.map((link) => (
                        link.href.startsWith("http") ? (
                            <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-400 transition hover:text-ink-100">{link.label}</a>
                        ) : (
                            <NavLink key={link.label} to={`/${link.href}`} className={({ isActive }) => `text-sm font-medium transition ${isActive ? "text-rank-blue" : "text-ink-400 hover:text-ink-100"}`}>{link.label}</NavLink>
                        )
                    ))}
                    {isAdmin() && (
                        <NavLink to="/admin" className={({ isActive }) => `text-sm font-medium transition ${isActive ? "text-amber-400" : "text-amber-500/70 hover:text-amber-400"}`}>Admin</NavLink>
                    )}
                </nav>

                {/* Right side: search + auth */}
                <div className="hidden items-center gap-3 md:flex">
                    <label className="relative">
                        <span className="sr-only">Search a user</span>
                        <input
                            type="text"
                            placeholder="Search handle…"
                            value={searchVal}
                            onChange={(e) => setSearchVal(e.target.value)}
                            onKeyDown={handleSearchSubmit}
                            className="w-48 rounded-lg border border-ink-600 bg-ink-800/60 py-1.5 pl-8 pr-3 font-mono text-sm text-ink-100 placeholder:text-ink-400 outline-none transition focus:border-rank-blue focus:ring-2 focus:ring-rank-blue/30"
                        />
                        <svg
                            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <circle cx="11" cy="11" r="7" />
                            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                        </svg>
                    </label>

                    <button
                        onClick={handleLogout}
                        className="rounded-lg border border-ink-600 px-4 py-1.5 text-sm font-medium text-ink-100 transition hover:bg-ink-800"
                    >
                        Sign out
                    </button>
                </div>

                {/* Mobile menu button */}
                <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 text-ink-200 md:hidden"
                    aria-label="Toggle menu"
                    aria-expanded={menuOpen}
                >
                    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {menuOpen ? (
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                        ) : (
                            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="border-t border-ink-700 bg-ink-950 px-6 py-4 md:hidden">
                    <nav className="flex flex-col gap-1">
                        {NAV_LINKS.map((link) => (
                            link.href.startsWith("http") ? (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => setMenuOpen(false)}
                                    className="rounded-lg px-3 py-2 text-sm font-medium text-ink-200 hover:bg-ink-800 transition"
                                >
                                    {link.label}
                                </a>
                            ) : (
                                <NavLink
                                    key={link.label}
                                    to={`/${link.href}`}
                                    onClick={() => setMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive
                                            ? "bg-rank-blue/10 text-rank-blue"
                                            : "text-ink-200 hover:bg-ink-800"
                                        }`
                                    }
                                >
                                    {link.label}
                                </NavLink>
                            )
                        ))}
                    </nav>
                    <div className="mt-4 flex items-center gap-3 border-t border-ink-700 pt-4">
                        <button onClick={handleLogout} className="flex-1 rounded-lg border border-ink-600 py-2 text-center text-sm font-medium text-ink-100 hover:bg-ink-800">
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}