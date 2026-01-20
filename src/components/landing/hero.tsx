import Link from "next/link";
import { Button } from "@/components/ui/button";
import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2 } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Professional Tools for{" "}
            <span className="text-primary">Creators</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Streamline your workflow with our suite of professional tools.
            Timer, teleprompter, and voice-of-god features designed to help you
            create better content, faster.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            15-day free trial. No credit card required.
          </p>
        </div>

        {/* Tool Preview Cards */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {tools.map((tool) => {
            const Icon = iconMap[tool.icon] || Clock;
            return (
              <div
                key={tool.slug}
                className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
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
