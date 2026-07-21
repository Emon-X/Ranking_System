import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Edit3, ExternalLink, Activity, Trophy, Code2, Target, BarChart3, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../../config";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
const API = API_BASE_URL;

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
    fetch(`${API}/users/ViewUser/${targetUsername}`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("User profile not found.");
        return res.json();
      })
      .then(data => {
        setUser(data.participant);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [targetUsername]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-12">
        <div className="h-48 md:h-64 w-full bg-muted animate-pulse" />
        <div className="mx-auto max-w-5xl px-4 sm:px-8 -mt-20 relative z-10">
          <div className="mb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
            <Skeleton className="h-32 w-32 md:h-40 md:w-40 rounded-full" />
            <div className="space-y-2 mb-2 w-full max-w-xs text-center md:text-left">
              <Skeleton className="h-10 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-6 w-32 mx-auto md:mx-0" />
              <div className="flex gap-2 justify-center md:justify-start mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
             <div className="space-y-8 md:col-span-1">
                 <Skeleton className="h-48 w-full rounded-xl" />
                 <Skeleton className="h-40 w-full rounded-xl" />
             </div>
             <div className="space-y-8 md:col-span-2">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     <Skeleton className="h-32 w-full rounded-xl" />
                     <Skeleton className="h-32 w-full rounded-xl" />
                     <Skeleton className="h-32 w-full rounded-xl" />
                     <Skeleton className="h-32 w-full rounded-xl" />
                 </div>
                 <Skeleton className="h-64 w-full rounded-xl" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-destructive/50 bg-destructive/10">
          <CardContent className="p-6 text-center text-destructive space-y-4">
            <h3 className="font-semibold text-lg">Error</h3>
            <p>{error}</p>
            <Button asChild variant="outline" className="mt-4"><Link to="/">Back to Standings</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  let positionHistory = [];
  try { positionHistory = JSON.parse(user.weekly_positions_history || "[]"); } catch { positionHistory = []; }

  const renderChart = () => {
    if (!positionHistory.length) {
      return (
        <Card className="min-h-[250px] flex items-center justify-center bg-muted/20 border-dashed">
          <p className="text-muted-foreground text-sm italic py-10">No weekly position history recorded yet.</p>
        </Card>
      );
    }
    const width = 500, height = 180, padding = 30;
    const chartWidth = width - padding * 2, chartHeight = height - padding * 2;
    const maxRank = Math.max(...positionHistory, 10), minRank = 1;
    const points = positionHistory.map((rank, i) => {
      const x = padding + (i / Math.max(1, positionHistory.length - 1)) * chartWidth;
      const y = padding + ((rank - minRank) / Math.max(1, maxRank - minRank)) * chartHeight;
      return { x, y, rank, week: i + 1 };
    });
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return (
      <Card className="p-6 overflow-hidden bg-card/50 backdrop-blur">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Rank History
          </CardTitle>
        </CardHeader>
        <div className="relative w-full overflow-x-auto">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px] h-auto drop-shadow-sm">
            {[0, 0.5, 1].map((ratio, i) => {
              const y = padding + ratio * chartHeight;
              const r = Math.round(minRank + ratio * (maxRank - minRank));
              return (
                <g key={i}>
                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" className="stroke-border" />
                  <text x={padding - 10} y={y + 4} fill="var(--muted-foreground)" fontSize="10" textAnchor="end" className="fill-muted-foreground">#{r}</text>
                </g>
              );
            })}
            <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary drop-shadow-md" />
            {points.map((p, i) => (
              <g key={i} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="5" className="fill-background stroke-primary stroke-[2px]" />
                <circle cx={p.x} cy={p.y} r="12" className="fill-primary/0 hover:fill-primary/20 transition-colors" />
                <text x={p.x} y={p.y - 12} fontSize="10" fontWeight="bold" textAnchor="middle" className="hidden group-hover:block fill-foreground">#{p.rank}</text>
                <text x={p.x} y={height - 5} fontSize="10" textAnchor="middle" className="fill-muted-foreground">W{p.week}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="mt-4 flex justify-between text-xs text-muted-foreground font-mono bg-muted/30 p-2 rounded-md border border-border/50">
          <span>Best Rank: #{Math.min(...positionHistory)}</span>
          <span>Total Weeks: {positionHistory.length}</span>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Profile Header Gradient */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary/20 via-primary/5 to-background border-b relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8 -mt-20 relative z-10">
        <div className="mb-6 flex justify-between items-end">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="h-32 w-32 md:h-40 md:w-40 rounded-full bg-card border-4 border-background flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-primary/10">
              <span className="text-5xl md:text-6xl font-bold text-primary">{user.name?.[0] || user.username?.[0] || "?"}</span>
            </div>
            <div className="text-center md:text-left mb-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{user.name}</h1>
              <p className="text-lg text-muted-foreground font-medium mt-1">@{user.username}</p>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-3">
                <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider">{user.role}</Badge>
                {user.weekly_position > 0 && (
                  <Badge variant="outline" className="px-3 py-1 text-xs border-warning/50 text-warning bg-warning/10">
                    Rank #{user.weekly_position}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex gap-3 mb-2">
            {(isAdminViewing || isOwnProfile) && (
              <Button variant="outline" onClick={() => {
                setEditForm({
                  name: user.name || "", email: user.email || "",
                  codeforces_handle: user.codeforces_handle || "",
                  atcoder_handle: user.atcoder_handle || "",
                  vjudge_handle: user.vjudge_handle || "",
                });
                setIsEditing(true);
              }}>
                <Edit3 className="h-4 w-4 mr-2" /> Edit Profile
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Link>
            </Button>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-lg shadow-2xl animate-in zoom-in-95">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
                <CardTitle>Edit Profile</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>✕</Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2"><label className="text-sm font-medium">Name</label><Input value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} required/></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Email</label><Input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} required/></div>
                  <div className="space-y-2"><label className="text-sm font-medium">Codeforces</label><Input value={editForm.codeforces_handle} onChange={e=>setEditForm({...editForm, codeforces_handle: e.target.value})}/></div>
                  <div className="space-y-2"><label className="text-sm font-medium">AtCoder</label><Input value={editForm.atcoder_handle} onChange={e=>setEditForm({...editForm, atcoder_handle: e.target.value})}/></div>
                  <div className="space-y-2"><label className="text-sm font-medium">VJudge</label><Input value={editForm.vjudge_handle} onChange={e=>setEditForm({...editForm, vjudge_handle: e.target.value})}/></div>
                  <Button type="submit" className="w-full mt-4">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {/* Left Column: Stats & Handles */}
          <div className="space-y-8 md:col-span-1">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/50 mb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Connected Accounts</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Codeforces</p>
                    {user.codeforces_handle ? <p className="font-medium mt-0.5">{user.codeforces_handle}</p> : <p className="text-sm italic text-muted-foreground mt-0.5">Not linked</p>}
                  </div>
                  {user.codeforces_handle && (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`https://codeforces.com/profile/${user.codeforces_handle}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
                <div className="flex justify-between items-center group">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">AtCoder</p>
                    {user.atcoder_handle ? <p className="font-medium mt-0.5">{user.atcoder_handle}</p> : <p className="text-sm italic text-muted-foreground mt-0.5">Not linked</p>}
                  </div>
                  {user.atcoder_handle && (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`https://atcoder.jp/users/${user.atcoder_handle}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">VJudge</p>
                  <p className="font-medium mt-0.5">{user.vjudge_handle || user.username}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/50 mb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Ratings</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Codeforces Rating</span>
                  <Badge variant="outline" className="font-mono text-sm">{user.codeforces_rating || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">AtCoder Rating</span>
                  <Badge variant="outline" className="font-mono text-sm">{user.atcoder_rating || 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Performance & Charts */}
          <div className="space-y-8 md:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold font-mono">{user.weekly_points || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Weekly Pts</p>
                </CardContent>
              </Card>
              <Card className="bg-success/5 border-success/20 hover:bg-success/10 transition-colors">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Target className="h-6 w-6 mx-auto mb-2 text-success" />
                  <p className="text-2xl font-bold font-mono">{Math.round(user.weekly_contest_point || 0)}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Contest Pts</p>
                </CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/20 hover:bg-accent/10 transition-colors">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Code2 className="h-6 w-6 mx-auto mb-2 text-accent" />
                  <p className="text-2xl font-bold font-mono">{user.total_solved_last_7_days || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">30D Solves</p>
                </CardContent>
              </Card>
              <Card className="bg-warning/5 border-warning/20 hover:bg-warning/10 transition-colors">
                <CardContent className="p-4 sm:p-6 text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-warning" />
                  <p className="text-2xl font-bold font-mono">{user.weekly_position || '-'}</p>
                  <p className="text-xs text-muted-foreground uppercase mt-1">Global Rank</p>
                </CardContent>
              </Card>
            </div>

            {renderChart()}

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-3 border-b border-border/50 mb-3"><CardTitle className="text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4"/> Problem Solving Breakdown (30 Days)</CardTitle></CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Codeforces</span>
                        <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(((user.codeforces_solved_last_7_days || 0) / Math.max(1, user.total_solved_last_7_days)) * 100, 100)}%` }} />
                        </div>
                        <span className="font-mono text-sm font-semibold">{user.codeforces_solved_last_7_days || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">AtCoder</span>
                        <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-success" style={{ width: `${Math.min(((user.atcoder_solved_last_7_days || 0) / Math.max(1, user.total_solved_last_7_days)) * 100, 100)}%` }} />
                        </div>
                        <span className="font-mono text-sm font-semibold">{user.atcoder_solved_last_7_days || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">VJudge (Last Contest)</span>
                        <div className="flex-1 mx-4 h-2 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-accent" style={{ width: `${Math.min(((user.weekly_contest_solved_problem || 0) / Math.max(1, user.total_solved_last_7_days)) * 100, 100)}%` }} />
                        </div>
                        <span className="font-mono text-sm font-semibold">{user.weekly_contest_solved_problem || 0}</span>
                    </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
