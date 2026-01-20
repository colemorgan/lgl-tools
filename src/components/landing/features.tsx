import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to create
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Our tools are designed to help creators work more efficiently and
            produce better content.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = iconMap[tool.icon] || Clock;
            return (
              <div
                key={tool.slug}
                className="relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm"
              >
                {tool.status === "coming_soon" && (
                  <Badge
                    variant="secondary"
                    className="absolute right-4 top-4"
                  >
                    Coming Soon
                  </Badge>
                )}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {tool.name}
                </h3>
                <p className="mt-3 flex-grow text-muted-foreground">
                  {tool.description}
                </p>
                <FeatureList tool={tool.slug} />
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
    <ul className="mt-6 space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}
