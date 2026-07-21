import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Search, Menu, X, Trophy, Swords, User, BookOpen, ShieldCheck, LogOut, Bell } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const isAdmin = () => localStorage.getItem('userRole') === 'admin';

const NAV_LINKS = [
  { label: "Standings", href: "standing", icon: Trophy },
  { label: "Contests", href: "contest", icon: Swords },
  { label: "Profile", href: "profile", icon: User },
  { label: "Resources", href: "https://youkn0wwho.academy/topic-list", icon: BookOpen },
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
      setMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-sm">
              RS
            </div>
            <span className="hidden font-display text-lg font-semibold tracking-tight sm:inline-block">
              Ranking System
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return link.href.startsWith("http") ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.label}
                  to={`/${link.href}`}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground ${
                      isActive ? "bg-accent text-accent-foreground font-semibold" : "text-muted-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              );
            })}
            {isAdmin() && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? "bg-warning/20 text-warning font-semibold" : "text-warning/80"
                  }`
                }
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </NavLink>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-ring rounded-full"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </div>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-[1.2rem] w-[1.2rem]" />
          </Button>

          <ThemeToggle />

          <Button variant="outline" onClick={handleLogout} className="rounded-full gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-background px-4 py-4 shadow-lg animate-in slide-in-from-top-2">
          <div className="mb-4 relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder="Search users..."
                className="pl-9 w-full"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
          </div>
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return link.href.startsWith("http") ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              ) : (
                <NavLink
                  key={link.label}
                  to={`/${link.href}`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              );
            })}
            {isAdmin() && (
              <NavLink
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-warning/20 text-warning" : "text-warning/80 hover:bg-accent hover:text-warning"
                  }`
                }
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </NavLink>
            )}
          </nav>
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full gap-2 justify-center" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}