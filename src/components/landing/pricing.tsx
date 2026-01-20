import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const features = [
  "Access to all tools (Timer, Prompter, VOG)",
  "Unlimited usage",
  "Priority support",
  "Regular feature updates",
  "Cloud sync across devices",
  "Custom presets and templates",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One plan with everything you need. Start with a 15-day free trial.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-lg">
          <div className="rounded-3xl border-2 border-primary bg-card p-8 shadow-lg sm:p-10">
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-bold text-foreground">Pro</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                15-day free trial
              </span>
            </div>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-foreground">
                $9
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <p className="mt-4 text-muted-foreground">
              Everything you need to create professional content.
            </p>

            <ul className="mt-8 space-y-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="mt-10 w-full">
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
