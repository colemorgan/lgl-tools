"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { Menu } from "lucide-react";

const navLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo height={32} />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-105"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Desktop Auth Buttons */}
          <div className="hidden sm:flex sm:items-center sm:gap-3">
            <Button 
              asChild 
              variant="ghost" 
              size="sm"
              className="transition-all duration-200 hover:bg-primary/5"
            >
              <Link href="/login">Sign In</Link>
            </Button>
            <Button 
              asChild 
              size="sm"
              className="shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu" className="hover:bg-primary/5 transition-colors">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <Logo height={28} href={undefined} />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium text-foreground transition-all duration-200 hover:text-primary hover:translate-x-1"
                  >
                    {link.name}
                  </Link>
                ))}
                <hr className="my-4" />
                <Button asChild variant="outline" className="w-full transition-all duration-200 hover:bg-primary/5">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full shadow-md">
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    Start Free Trial
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Mobile: Show only trial button when menu closed */}
          <Button 
            asChild 
            size="sm" 
            className="sm:hidden shadow-md shadow-primary/20 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Link href="/signup">Try Free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
