"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2, Play, Pause, RotateCcw } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const totalDuration = 60;
  const [timerValue, setTimerValue] = useState(totalDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const progressPercent = Math.min(100, Math.max(0, ((totalDuration - timerValue) / totalDuration) * 100));

  useEffect(() => {
    setIsVisible(true);
    let interval: NodeJS.Timeout;
    if (timerRunning && timerValue > 0) {
      interval = setInterval(() => setTimerValue((v) => v - 1), 1000);
    } else if (timerValue === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerValue]);

  const startTimer = () => setTimerRunning(true);
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => {
    setTimerValue(60);
    setTimerRunning(false);
  };

  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Geometric Pattern Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-primary/5" />
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="currentColor" className="text-primary/30" />
              <circle cx="30" cy="30" r="1" fill="currentColor" className="text-accent/30" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Professional Tools for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Event Producers
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Streamline your production workflow with our suite of professional event tools.
              Timer, teleprompter, and voice-of-god features designed to help you
              produce seamless live events.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto hover:bg-primary/5">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              15-day free trial. No credit card required.
            </p>
          </div>

          {/* Interactive Demo Preview */}
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              <div className="absolute -inset-3 rounded-[40px] bg-neutral-900/90 border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.55)]" />
              <div className="relative rounded-[32px] border border-white/10 bg-neutral-950/95 shadow-[0_30px_90px_rgba(0,0,0,0.45)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/60" />
                <div className="absolute inset-0 opacity-25 mix-blend-screen bg-[linear-gradient(transparent_85%,rgba(255,255,255,0.06)_90%)] bg-[length:100%_6px]" />
                <div className="relative p-8 sm:p-10">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold tracking-wide text-sky-300">Run of Show</span>
                    <div className="flex items-center gap-2 text-white/70">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                      <span className="font-semibold text-white">Kind Timer</span>
                      <span className="text-emerald-300">live</span>
                    </div>
                  </div>

                  <div className="mt-10 flex flex-col items-center">
                    <span className="font-mono text-[clamp(3.5rem,9vw,7rem)] font-semibold tracking-tight text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.6)]">
                      {Math.floor(timerValue / 60)}:{(timerValue % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="mt-4 text-sm sm:text-base font-semibold tracking-[0.2em] text-sky-300/80">
                      Speaker: Ben
                    </span>
                  </div>

                  <div className="mt-8">
                    <div className="relative h-5 rounded-full border border-white/10 bg-neutral-800/80 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-500"
                        style={{ width: `${Math.max(2, progressPercent)}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-white/90 drop-shadow"
                        style={{ left: `calc(${progressPercent}% - 6px)` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs text-white/60">
                    <span>Next: Sound check</span>
                    <span>00:45 buffer</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-col items-center">
                <div className="h-14 w-20 rounded-b-3xl bg-neutral-800/80 border border-white/10 shadow-[inset_0_10px_20px_rgba(0,0,0,0.4)]" />
                <div className="-mt-2 h-3 w-36 rounded-full bg-neutral-900/90 border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.45)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Animated Tool Cards */}
        <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = iconMap[tool.icon] || Clock;
            return (
              <div
                key={tool.slug}
                className={`group relative rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:border-primary/30 cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
                onMouseEnter={() => setSelectedTool(tool.slug)}
                onMouseLeave={() => setSelectedTool(null)}
              >
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 transition-opacity duration-300 ${selectedTool === tool.slug ? 'opacity-100' : ''}`} />
                
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 ${selectedTool === tool.slug ? 'scale-110 bg-primary/20' : ''}`}>
                  <Icon className={`h-7 w-7 text-primary transition-transform duration-300 ${selectedTool === tool.slug ? 'scale-110' : ''}`} />
                </div>
                <h3 className="relative mt-5 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="relative mt-3 text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                {tool.status === "coming_soon" && (
                  <span className="relative mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                    Coming Soon
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
