import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { motion } from 'framer-motion';
import { Calendar, Clock, ExternalLink, Activity, Trophy, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
const API = API_BASE_URL;

function formatDate(iso) {
  if (!iso) return "TBA";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CountdownBadge({ scheduledAt }) {
  const diff = new Date(scheduledAt) - new Date();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  return (
    <Badge variant="outline" className="border-primary/50 text-primary bg-primary/10">
      {days > 0 ? `${days}d ${hrs}h left` : `${hrs}h left`}
    </Badge>
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
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
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

  const ContestCard = ({ contest, status }) => {
    const isRunning = status === 'running';
    const isPast = status === 'past';
    const isUpcoming = status === 'upcoming';
    
    return (
      <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className={`h-full flex flex-col relative overflow-hidden ${isRunning ? 'border-success/50 bg-success/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-border/50 bg-card/50'}`}>
          {isRunning && (
            <div className="absolute top-0 right-0 p-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
              </span>
            </div>
          )}
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start gap-4">
              <CardTitle className="text-xl font-bold leading-tight line-clamp-2">
                {contest.name || contest.vjudge_url}
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="secondary">VJudge</Badge>
              {isRunning && <Badge variant="success" className="bg-success text-success-foreground">LIVE NOW</Badge>}
              {isUpcoming && contest.scheduled_at && <CountdownBadge scheduledAt={contest.scheduled_at} />}
            </div>
          </CardHeader>
          <CardContent className="pb-6 flex-grow space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{formatDate(contest.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span>Duration: TBA</span>
            </div>
          </CardContent>
          <CardFooter className="pt-0 border-t border-border/50 bg-muted/20 p-4 mt-auto flex gap-3">
            <Button asChild className="w-full flex items-center gap-2" variant={isRunning ? "default" : "outline"}>
              <a href={contest.vjudge_url} target="_blank" rel="noreferrer">
                {isRunning ? (
                  <><PlayCircle className="h-4 w-4" /> Enter Contest</>
                ) : isPast ? (
                  <><Trophy className="h-4 w-4" /> View Standings</>
                ) : (
                  <><ExternalLink className="h-4 w-4" /> View Details</>
                )}
              </a>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Competitive <span className="text-primary">Contests</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            View upcoming schedules, participate in live contests, and review past standings.
          </p>
        </motion.div>

        {loading ? (
          <div className="space-y-16">
            <section>
               <Skeleton className="h-8 w-48 mb-6" />
               <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
               </div>
            </section>
            <section>
               <Skeleton className="h-8 w-48 mb-6" />
               <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                 {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
               </div>
            </section>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
            Failed to load contests: {error}
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Running Contests */}
            {running.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-6 w-6 text-success" />
                  <h2 className="text-2xl font-bold">Live Contests</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {running.map(c => <ContestCard key={c.id} contest={c} status="running" />)}
                </div>
              </section>
            )}

            {/* Upcoming Contests */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Upcoming Contests</h2>
              </div>
              {upcoming.length === 0 ? (
                <Card className="bg-muted/20 border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No upcoming contests scheduled yet.</CardContent></Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {upcoming.map(c => <ContestCard key={c.id} contest={c} status="upcoming" />)}
                </div>
              )}
            </section>

            {/* Past Contests */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-bold">Past Contests</h2>
              </div>
              {past.length === 0 ? (
                <Card className="bg-muted/20 border-dashed"><CardContent className="p-8 text-center text-muted-foreground">No past contests recorded yet.</CardContent></Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {past.map(c => <ContestCard key={c.id} contest={c} status="past" />)}
                </div>
              )}
            </section>

          </div>
        )}
      </div>
    </div>
  );
}
