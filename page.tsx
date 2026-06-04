
"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  BellRing, 
  Target, 
  UserCheck, 
  Trophy, 
  Zap, 
  Bookmark, 
  RotateCcw, 
  ArrowRight,
  Video
} from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, where } from "firebase/firestore";
import { useMemo } from "react";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { ExamCountdown } from "@/components/ExamCountdown";
import { StreakWidget } from "@/components/StreakWidget";
import { MotivationWidget } from "@/components/MotivationWidget";
import { StudyPlannerWidget } from "@/components/StudyPlannerWidget";
import { MistakeSummaryWidget } from "@/components/MistakeSummaryWidget";
import { CurrentAffairsWidget } from "@/components/CurrentAffairsWidget";

export default function StudentDashboard() {
  const { t, language } = useLanguage();
  const { user } = useUser();
  const db = useFirestore();

  // Optimized Stable Queries
  const announcementsQuery = useMemoFirebase(() => 
    query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(4)), 
    [db]
  );
  
  const enrollmentsQuery = useMemoFirebase(() => 
    user ? query(collection(db, "enrollments"), where("studentId", "==", user.uid)) : null,
    [db, user?.uid]
  );

  const attendanceQuery = useMemoFirebase(() => 
    user ? query(collection(db, "attendance"), where("studentId", "==", user.uid)) : null,
    [db, user?.uid]
  );

  const liveSessionsQuery = useMemoFirebase(() => 
    query(collection(db, "live_sessions"), orderBy("startTime", "asc"), limit(3)),
    [db]
  );

  const attemptsQuery = useMemoFirebase(() => 
    user ? query(collection(db, "test_attempts"), where("studentId", "==", user.uid), orderBy("completedAt", "desc"), limit(1)) : null,
    [db, user?.uid]
  );

  const coursesQuery = useMemoFirebase(() => collection(db, "courses"), [db]);
  
  const { data: announcements } = useCollection(announcementsQuery);
  const { data: courses } = useCollection(coursesQuery);
  const { data: enrollments } = useCollection(enrollmentsQuery);
  const { data: attendance } = useCollection(attendanceQuery);
  const { data: liveSessions } = useCollection(liveSessionsQuery);
  const { data: lastAttempts } = useCollection(attemptsQuery);

  const enrolledCourseIds = useMemo(() => enrollments.map(e => e.courseId), [enrollments]);

  const enrolledCourses = useMemo(() => {
    return courses.filter(c => enrolledCourseIds.includes(c.id));
  }, [courses, enrolledCourseIds]);

  const myLiveSessions = useMemo(() => {
    return liveSessions.filter(s => enrolledCourseIds.includes(s.courseId) && new Date(s.startTime) > new Date());
  }, [liveSessions, enrolledCourseIds]);

  const attendancePercentage = useMemo(() => {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(r => r.status === 'present').length;
    return Math.round((present / attendance.length) * 100);
  }, [attendance]);

  const lastScore = lastAttempts[0] ? Math.round((lastAttempts[0].finalScore / lastAttempts[0].totalQuestions) * 100) : 0;

  return (
    <div className="space-y-6 md:space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tight">
            {t('welcome')}, {user?.displayName || 'Scholar'}!
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg">
            {language === 'English' 
              ? "Excellence is not an act, but a habit." 
              : "சிறப்பு என்பது ஒரு செயலல்ல, ஒரு பழக்கம்."}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-card border rounded-2xl p-2 px-4 shadow-sm">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Sync Active</span>
        </div>
      </header>

      {/* 1. Motivation Center */}
      <MotivationWidget />

      <div className="grid lg:grid-cols-4 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          {/* 2. Exam Goal & Countdown */}
          <ExamCountdown />
          
          {/* 3. Streak System */}
          <StreakWidget />

          {/* Revision Hub Link */}
          <Card className="border-none shadow-lg overflow-hidden bg-primary text-white hover:scale-[1.02] transition-transform" asChild>
            <Link href="/dashboard/student/revision" className="block p-5 hover:bg-primary/90 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl">
                    <RotateCcw className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Revision Hub</p>
                    <p className="text-[10px] text-white/70 uppercase font-bold tracking-widest">Master Weak Areas</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-white/50" />
              </div>
            </Link>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8 md:space-y-10">
          <div className="grid grid-cols-3 gap-3 md:gap-6">
            <Card className="bg-emerald-500 text-white border-none shadow-md md:shadow-xl relative overflow-hidden group h-24 md:h-32 flex flex-col justify-center px-4 md:px-6">
              <UserCheck className="absolute -right-2 -bottom-2 h-16 w-16 md:h-20 md:w-20 text-white/10 group-hover:scale-125 transition-transform" />
              <p className="text-xl md:text-3xl font-bold relative z-10">{attendancePercentage}%</p>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white/80 relative z-10">Presence</p>
            </Card>
            
            <Card className="bg-accent text-accent-foreground border-none shadow-md md:shadow-xl relative overflow-hidden group h-24 md:h-32 flex flex-col justify-center px-4 md:px-6">
              <Target className="absolute -right-2 -bottom-2 h-16 w-16 md:h-20 md:w-20 text-white/10 group-hover:scale-125 transition-transform" />
              <p className="text-xl md:text-3xl font-bold relative z-10">{lastScore}%</p>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-accent-foreground/80 relative z-10">Success</p>
            </Card>

            <Card className="bg-primary text-primary-foreground border-none shadow-md md:shadow-xl relative overflow-hidden group h-24 md:h-32 flex flex-col justify-center px-4 md:px-6">
              <Trophy className="absolute -right-2 -bottom-2 h-16 w-16 md:h-20 md:w-20 text-white/10 group-hover:scale-125 transition-transform" />
              <p className="text-xl md:text-3xl font-bold relative z-10">{enrollments.length}</p>
              <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-primary-foreground/80 relative z-10">Modules</p>
            </Card>
          </div>

          <StudyPlannerWidget />

          <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-none shadow-lg overflow-hidden bg-white hover:scale-[1.02] transition-transform" asChild>
              <Link href="/dashboard/student/bookmarks" className="block p-5 md:p-6 hover:bg-muted/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2.5 rounded-xl">
                      <Bookmark className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Success Library</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Saved Items</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </Card>

            <MistakeSummaryWidget />
          </div>

          <CurrentAffairsWidget />

          {myLiveSessions.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                Live Sessions
              </h2>
              <div className="grid gap-4">
                {myLiveSessions.map((s) => (
                  <Card key={s.id} className="border-none ring-1 ring-border bg-card overflow-hidden">
                    <CardContent className="p-0 flex items-stretch">
                      <div className="bg-red-500 w-1.5 shrink-0" />
                      <div className="p-5 flex-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                            <Video className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm truncate">{s.title}</h4>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">
                              {courses.find(c => c.id === s.courseId)?.title}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 h-8 px-4 text-[10px] font-bold rounded-lg" asChild>
                          <a href={s.meetingLink} target="_blank" rel="noopener noreferrer">JOIN</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
             <h2 className="text-2xl font-headline font-bold flex items-center gap-3">
               <Zap className="h-6 w-6 text-primary fill-primary/20" />
               Curriculum Status
             </h2>
             <div className="grid gap-4">
                {enrolledCourses.slice(0, 3).map((course) => {
                  const enrollment = enrollments.find(e => e.courseId === course.id);
                  return (
                    <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="block group">
                      <Card className="hover:ring-1 hover:ring-primary/50 transition-all border-none ring-1 ring-border shadow-sm h-full overflow-hidden bg-white">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-3 flex-1">
                              <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">{course.title}</h3>
                              <div className="space-y-1.5">
                                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                  <span>Module Progress</span>
                                  <span className="text-primary">{enrollment?.progress || 0}%</span>
                                </div>
                                <Progress value={enrollment?.progress || 0} className="h-1 rounded-full" />
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
             </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          <LeaderboardWidget />

          <section className="space-y-4">
            <h2 className="text-xl font-headline font-bold flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Updates
            </h2>
            <div className="space-y-3">
              {announcements.slice(0, 3).map((a) => (
                <Card key={a.id} className="border-l-4 shadow-sm rounded-lg overflow-hidden" style={{ borderLeftColor: 
                  a.type === 'info' ? '#3b82f6' : a.type === 'warning' ? '#f59e0b' : '#10b981'
                }}>
                  <CardContent className="p-4">
                    <h4 className="font-bold text-xs leading-snug mb-1">{a.title}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{a.content}</p>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t">
                       <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(a.createdAt).toLocaleDateString()}</span>
                       <Badge variant="outline" className="text-[7px] h-3.5 uppercase font-bold">{a.type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
