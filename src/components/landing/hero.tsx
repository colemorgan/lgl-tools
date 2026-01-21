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
  const [timerValue, setTimerValue] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);

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
            <div className="relative bg-card/80 backdrop-blur-sm rounded-3xl border-2 border-primary/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 border-b flex items-center gap-2 px-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-auto text-xs text-muted-foreground">Live Timer Demo</span>
              </div>
              
              <div className="p-8">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-primary to-primary/90 rounded-full p-8 shadow-2xl">
                      <span className="font-mono text-5xl font-bold text-white">
                        {Math.floor(timerValue / 60)}:{(timerValue % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-4">
                  <button
                    onClick={timerRunning ? pauseTimer : startTimer}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  >
                    {timerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-all hover:scale-110 active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Try our countdown timer - just one of the tools you&apos;ll get access to
                </p>
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
