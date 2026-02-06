import { tools } from "@/config/tools";
import { Clock, Scroll, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  Scroll,
  Volume2,
};

const toolStyles = [
  {
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    hoverBorder: "hover:border-violet-200",
    checkColor: "text-violet-500",
  },
  {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-200",
    checkColor: "text-blue-500",
  },
  {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    hoverBorder: "hover:border-rose-200",
    checkColor: "text-rose-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-muted/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Your control room,{" "}
            <span className="text-gradient">simplified</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three purpose-built tools that replace the clutter. So you can
            focus on the show, not the setup.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => {
            const Icon = iconMap[tool.icon] || Clock;
            const style = toolStyles[index];
            return (
              <div
                key={tool.slug}
                className={`group relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${style.hoverBorder}`}
              >
                {tool.status === "coming_soon" && (
                  <Badge
                    variant="secondary"
                    className="absolute right-4 top-4 text-xs"
                  >
                    Coming Soon
                  </Badge>
                )}
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className={`h-7 w-7 ${style.iconColor}`} />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {tool.name}
                </h3>
                <p className="mt-3 flex-grow text-muted-foreground">
                  {tool.description}
                </p>
                <FeatureList tool={tool.slug} checkColor={style.checkColor} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureList({ tool, checkColor }: { tool: string; checkColor: string }) {
  const features: Record<string, string[]> = {
    timer: [
      "Countdown & count-up modes for any segment",
      "Visual and audio cues your team can see",
      "Session logs to review run-of-show timing",
    ],
    prompter: [
      "Variable scroll speed for any pace of delivery",
      "Mirror mode for on-camera talent",
      "Remote control so you stay at the board",
    ],
    vog: [
      "Multiple voice options for the right tone",
      "Instant text-to-speech, no booth required",
      "Reusable announcement templates across shows",
    ],
  };

  const items = features[tool] || [];

  return (
    <ul className="mt-6 space-y-2.5">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <svg
            className={`mt-0.5 h-4 w-4 flex-shrink-0 ${checkColor}`}
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
