import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Medal, Crown, TrendingUp, Users, Activity, Download } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
export default function Standing() {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStandings = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/users/ViewAllUsers_by_Rank`, {
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setUserData(data.participants || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  const filteredData = userData.filter(user => 
    (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const topThree = filteredData.slice(0, 3);
  const restUsers = filteredData.slice(3);

  const downloadTop5 = () => {
    const top5 = userData.slice(0, 5);
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Rank,Username,Name,Points,CF Rating,AtCoder Rating,30D Solved\n";
    
    top5.forEach((user, index) => {
      const row = [
        index + 1,
        user.username,
        user.name || "N/A",
        user.weekly_points || 0,
        user.codeforces_rating || 0,
        user.atcoder_rating || 0,
        user.total_solved_last_7_days || 0
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "top_5_standings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Hero Section */}
        <section className="flex flex-col gap-6 md:flex-row justify-between items-start md:items-end">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="space-y-4 max-w-2xl"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              MBSTU ACM Lab <span className="text-primary">Standings</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Weekly competitive programming rankings. Compete, learn, and grow your algorithmic skills.
            </p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Card className="bg-primary/10 border-primary/20 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-primary/20 rounded-lg text-primary"><Users size={24}/></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Participants</p>
                  <p className="text-2xl font-bold">{userData.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/40 border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-2 bg-secondary rounded-lg text-secondary-foreground"><Activity size={24}/></div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Week</p>
                  <p className="text-2xl font-bold">Week 1</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        {loading ? (
          <div className="space-y-6">
             <div className="flex gap-4 h-[300px] items-end justify-center">
                 <Skeleton className="w-1/3 h-48 rounded-t-xl" />
                 <Skeleton className="w-1/3 h-64 rounded-t-xl" />
                 <Skeleton className="w-1/3 h-40 rounded-t-xl" />
             </div>
             <Card className="overflow-hidden border-border/50 shadow-sm bg-card/50">
               <div className="p-4 border-b bg-muted/20">
                 <Skeleton className="h-8 w-48" />
               </div>
               <div className="p-4 space-y-4">
                 {[1, 2, 3, 4, 5].map(i => (
                   <Skeleton key={i} className="h-12 w-full" />
                 ))}
               </div>
             </Card>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
            Failed to load standings: {error}
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            {topThree.length > 0 && (
              <section className="py-8">
                <div className="flex flex-col sm:flex-row justify-center items-center sm:items-end gap-8 sm:gap-4 h-auto sm:h-[300px]">
                  {/* Rank 2 - Silver */}
                  {topThree[1] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.2 }}
                      className="flex flex-col items-center w-full sm:w-1/3 order-2 sm:order-1"
                    >
                      <Link to={`/profile/${topThree[1].username}`} className="mb-4 text-center group">
                        <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-secondary/80 border-4 border-muted-foreground/30 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                          {topThree[1].name?.[0] || topThree[1].username?.[0] || "?"}
                        </div>
                        <p className="font-semibold">{topThree[1].username}</p>
                        <Badge variant="secondary" className="mt-1">{topThree[1].weekly_points} pts</Badge>
                      </Link>
                      <div className="w-full bg-muted-foreground/20 rounded-t-xl h-32 flex justify-center pt-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-muted-foreground/20 to-transparent" />
                        <Medal className="text-slate-400" size={32} />
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 1 - Gold */}
                  {topThree[0] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center w-full sm:w-1/3 order-1 sm:order-2"
                    >
                      <Link to={`/profile/${topThree[0].username}`} className="mb-4 text-center group">
                        <div className="h-20 w-20 mx-auto mb-2 rounded-full bg-warning/20 border-4 border-warning/50 flex items-center justify-center text-2xl font-bold text-warning group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                          {topThree[0].name?.[0] || topThree[0].username?.[0] || "?"}
                        </div>
                        <p className="font-bold text-lg text-warning">{topThree[0].username}</p>
                        <Badge className="bg-warning text-warning-foreground mt-1">{topThree[0].weekly_points} pts</Badge>
                      </Link>
                      <div className="w-full bg-warning/20 rounded-t-xl h-40 flex justify-center pt-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-warning/20 to-transparent" />
                        <Crown className="text-warning" size={40} />
                      </div>
                    </motion.div>
                  )}

                  {/* Rank 3 - Bronze */}
                  {topThree[2] && (
                    <motion.div 
                      initial={{ opacity: 0, y: 50 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col items-center w-full sm:w-1/3 order-3"
                    >
                      <Link to={`/profile/${topThree[2].username}`} className="mb-4 text-center group">
                        <div className="h-16 w-16 mx-auto mb-2 rounded-full bg-orange-900/20 border-4 border-orange-700/50 flex items-center justify-center text-xl font-bold text-orange-600 group-hover:scale-110 transition-transform">
                          {topThree[2].name?.[0] || topThree[2].username?.[0] || "?"}
                        </div>
                        <p className="font-semibold">{topThree[2].username}</p>
                        <Badge variant="outline" className="text-orange-600 border-orange-600/30 mt-1">{topThree[2].weekly_points} pts</Badge>
                      </Link>
                      <div className="w-full bg-orange-900/10 rounded-t-xl h-24 flex justify-center pt-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent" />
                        <Medal className="text-orange-600" size={32} />
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>
            )}

            {/* Remaining Users Table */}
            <Card className="overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Global Ranking
                </h3>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <Button variant="outline" size="sm" onClick={downloadTop5} className="w-full sm:w-auto font-medium">
                    <Download className="h-4 w-4 mr-2" /> Top 5 CSV
                  </Button>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by username..." 
                      className="pl-9 bg-background/50 border-border/50" 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/40 text-muted-foreground font-medium border-b sticky top-0">
                    <tr>
                      <th className="px-6 py-4">Rank</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Points</th>
                      <th className="px-6 py-4 hidden md:table-cell">CF Rating</th>
                      <th className="px-6 py-4 hidden md:table-cell">AC Rating</th>
                      <th className="px-6 py-4 text-right">30D Solved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <AnimatePresence>
                      {restUsers.map((user, index) => (
                        <motion.tr 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={user.username} 
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-muted-foreground font-medium group-hover:text-foreground transition-colors">#{index + 4}</span>
                          </td>
                          <td className="px-6 py-4">
                            <Link to={`/profile/${user.username}`} className="font-medium hover:text-primary transition-colors flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {user.username[0].toUpperCase()}
                              </div>
                              {user.name || user.username}
                            </Link>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium">{user.weekly_points}</td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <Badge variant="outline" className={user.codeforces_rating >= 1400 ? 'border-primary/50 text-primary bg-primary/10' : ''}>
                              {user.codeforces_rating || 0}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <Badge variant="outline" className={user.atcoder_rating >= 400 ? 'border-success/50 text-success bg-success/10' : ''}>
                              {user.atcoder_rating || 0}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-muted-foreground">
                              {user.total_solved_last_7_days > 0 && <TrendingUp className="h-3 w-3 text-success" />}
                              {user.total_solved_last_7_days || 0}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {restUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}