"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const features = [
  "Access to all tools (Timer, Prompter, VOG)",
  "Unlimited usage",
  "Priority support",
  "Regular feature updates",
  "Cloud sync across devices",
  "Custom presets and templates",
];

export function Pricing() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="pricing" className="py-20 sm:py-32 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              transparent pricing
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One plan with everything you need. Start with a 15-day free trial.
          </p>
        </div>

        <div className={`mx-auto mt-16 max-w-lg transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm p-8 shadow-2xl shadow-primary/10 hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 hover:-translate-y-1 sm:p-10">
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary/5 to-accent/5 blur-3xl -z-10" />
            
            {/* Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-4 py-2 shadow-lg shadow-primary/20">
                <Sparkles className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">
                  15-day free trial
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <h3 className="font-heading text-2xl font-bold text-foreground">Pro</h3>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                $9
              </span>
              <span className="text-lg text-muted-foreground">/month</span>
            </div>

            <p className="mt-4 text-muted-foreground">
              Everything you need to produce professional events.
            </p>

            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 group">
                  <div className="mt-0.5 flex-shrink-0">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <span className="text-foreground group-hover:text-primary/80 transition-colors">{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              asChild 
              size="lg" 
              className="mt-10 w-full shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              No credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
