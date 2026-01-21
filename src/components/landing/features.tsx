"use client";

import { useEffect, useRef, useState } from "react";
import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

export function Features() {
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
    <section ref={sectionRef} id="features" className="py-20 sm:py-32 relative overflow-hidden">
      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-muted/30" />
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="features-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <rect width="80" height="80" fill="none" />
              <path d="M0 40h80M40 0v80" stroke="currentColor" strokeWidth="0.5" className="text-primary/20" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#features-pattern)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Produce Better Events
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our tools are designed to help event producers work more efficiently and
            deliver seamless live experiences.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = iconMap[tool.icon] || Clock;
            return (
              <div
                key={tool.slug}
                className={`group relative flex flex-col rounded-2xl border bg-card/80 backdrop-blur-sm p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${200 + index * 150}ms` }}
              >
                {tool.status === "coming_soon" && (
                  <Badge
                    variant="secondary"
                    className="absolute right-4 top-4 group-hover:bg-accent/20 group-hover:text-accent transition-colors"
                  >
                    Coming Soon
                  </Badge>
                )}
                
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                  <Icon className="h-8 w-8 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                
                <h3 className="mt-6 text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                
                <p className="mt-3 flex-grow text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
                
                <div className="mt-6 pt-6 border-t border-border/50">
                  <FeatureList tool={tool.slug} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureList({ tool }: { tool: string }) {
  const features: Record<string, string[]> = {
    timer: [
      "Customizable countdown and count-up modes",
      "Visual and audio alerts",
      "Session history tracking",
    ],
    prompter: [
      "Adjustable scroll speed",
      "Mirror mode for camera setups",
      "Remote control support",
    ],
    vog: [
      "Multiple voice options",
      "Text-to-speech conversion",
      "Custom announcement templates",
    ],
  };

  const items = features[tool] || [];

  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          <div className="mt-0.5 flex-shrink-0">
            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <svg
                className="h-3 w-3 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          {item}
        </li>
      ))}
    </ul>
  );
}
