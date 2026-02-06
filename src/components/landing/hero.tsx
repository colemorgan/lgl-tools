import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2, ArrowRight } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

const toolAccents = [
  "group-hover:border-violet-300 group-hover:shadow-violet-100",
  "group-hover:border-blue-300 group-hover:shadow-blue-100",
  "group-hover:border-rose-300 group-hover:shadow-rose-100",
];

const iconBgColors = [
  "bg-violet-100 text-violet-600",
  "bg-blue-100 text-blue-600",
  "bg-rose-100 text-rose-600",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-36 hero-gradient">
      {/* Decorative grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(245 91% 69%) 1px, transparent 1px), linear-gradient(90deg, hsl(245 91% 69%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="animate-fade-in-up font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Run Every Show{" "}
            <span className="text-gradient">Flawlessly</span>
          </h1>
          <p className="animate-fade-in-up-delay-1 mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
            The AV toolkit that handles the details so you can focus on the
            show. Simple, reliable, and built for professionals who refuse
            to miss a cue.
          </p>
          <div className="animate-fade-in-up-delay-2 mt-10 flex items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200 h-12 px-8 text-base"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <p className="animate-fade-in-up-delay-3 mt-4 text-sm text-muted-foreground">
            15-day free trial. No credit card required.
          </p>
        </div>

        {/* Tool Preview Cards */}
        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = iconMap[tool.icon] || Clock;
            return (
              <div
                key={tool.slug}
                className={`group relative rounded-2xl border bg-card/80 backdrop-blur-sm p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${toolAccents[index]} animate-fade-in-up`}
                style={{ animationDelay: `${0.3 + index * 0.1}s`, opacity: 0 }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgColors[index]} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {tool.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
