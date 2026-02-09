import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const features = [
  "Full access to Timer, Prompter, and VOG",
  "Unlimited shows and sessions",
  "Priority support from our team",
  "New features and updates as we ship them",
  "Cloud sync across all your devices",
  "Save presets and templates for repeat shows",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One plan.{" "}
            <span className="text-gradient">No surprises.</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every tool, every feature, one flat price. Try it free for 14 days
            and see the difference on your next show.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-lg">
          <div className="relative rounded-3xl border-2 border-accent/30 bg-card p-8 shadow-lg sm:p-10 animate-pulse-glow">
            {/* Accent gradient top bar */}
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

            <div className="flex items-baseline justify-between">
              <h3 className="font-heading text-2xl font-bold text-foreground">Pro</h3>
              <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                14-day free trial
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                $9
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <p className="mt-4 text-muted-foreground">
              Everything you need to run a flawless show.
            </p>

            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/10">
                    <Check className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              size="lg"
              className="mt-10 w-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30 transition-all duration-200 h-12 text-base"
            >
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
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
