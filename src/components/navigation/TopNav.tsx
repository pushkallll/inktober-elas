"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Image as ImageIcon, PenTool, PlusCircle, User, Menu, X, LogOut, ChevronDown, Shield, LogIn } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/contexts/AuthContext";

export function TopNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const { state, profile, logout, login } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const publicNavItems = [
    { label: "Gallery", href: "/", icon: Home },
    { label: "Art", href: "/art", icon: ImageIcon },
    { label: "Writing", href: "/writing", icon: PenTool },
  ];

  const accountNavItems = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "My Submissions", href: "/my-submissions", icon: PenTool },
    { label: "Submit", href: "/submit", icon: PlusCircle },
  ];

  const adminNavItems = [];
  if (profile?.role === "MODERATOR" || profile?.role === "ADMIN") {
    adminNavItems.push({ label: "Moderation", href: "/moderation", icon: Shield });
  }
  if (profile?.role === "ADMIN") {
    adminNavItems.push({ label: "Admin", href: "/admin", icon: Shield });
  }

  const roleIndicator = profile?.role === "ADMIN" ? "ADMIN" : profile?.role === "MODERATOR" ? "MODERATOR" : null;

  return (
    <>
      <header className="w-full flex items-center justify-between py-4 px-5 sm:px-8 lg:px-12 z-30 relative bg-[#f8f5f0]/95 backdrop-blur-[2px] border-b border-foreground/10 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        {/* LOGOS */}
        <Link href="/" className="flex items-center gap-4 sm:gap-5 hover:opacity-80 transition-opacity">
          <div className="h-7 sm:h-9 flex items-center">
            <img src="/elas-logo.png" alt="ELAS" className="h-full w-auto object-contain mix-blend-multiply opacity-90" />
          </div>
          <span className="text-foreground/40 text-sm select-none">×</span>
          <div className="h-8 sm:h-10 flex items-center">
            <img src="/inktober-logo.png" alt="Inktober" className="h-full w-auto object-contain mix-blend-multiply opacity-90" />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {publicNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[11px] uppercase tracking-[0.2em] transition-colors relative py-1 ${
                  isActive ? "text-foreground font-medium" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-foreground/40 rounded-full"
                  />
                )}
              </Link>
            );
          })}

          {state === "AUTHENTICATED" && profile && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
              >
                <span>{profile.penName}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isAccountDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-4 w-48 bg-[#f8f5f0] border border-foreground/10 shadow-lg py-2 z-50 rounded-[2px]"
                  >
                    {roleIndicator && (
                      <div className="px-4 py-2 border-b border-foreground/10 mb-2">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                          {roleIndicator}
                        </span>
                      </div>
                    )}

                    {accountNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="block px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground/80 hover:bg-black/5 hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}

                    {adminNavItems.length > 0 && (
                      <>
                        <div className="h-px bg-foreground/10 my-2" />
                        <div className="px-4 py-1">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-muted font-bold">
                            {profile?.role === "ADMIN" ? "Administration" : "Moderation"}
                          </span>
                        </div>
                        {adminNavItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsAccountDropdownOpen(false)}
                            className="block px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-amber-800 hover:bg-amber-900/5 transition-colors font-medium"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="h-px bg-foreground/10 my-2" />
                    <button
                      onClick={() => {
                        setIsAccountDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-red-700/80 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Login button for signed-out users */}
          {(state === "SIGNED_OUT" || state === "ERROR") && (
            <button
              onClick={login}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors border border-foreground/15 px-3 py-1.5 rounded-[2px] hover:border-foreground/30"
            >
              <LogIn className="w-3 h-3" />
              Log In
            </button>
          )}
        </nav>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-[#f8f5f0] overflow-y-auto"
          >
            <div className="p-6 flex flex-col min-h-full">
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 text-muted hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  {publicNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-2xl font-serif italic tracking-wide transition-colors ${
                          isActive ? "text-foreground" : "text-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {(state === "SIGNED_OUT" || state === "ERROR") && (
                  <>
                    <div className="h-px bg-foreground/10 my-4" />
                    <button
                      onClick={() => { setIsMenuOpen(false); login(); }}
                      className="flex items-center gap-3 text-lg font-serif italic tracking-wide text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <LogIn className="w-5 h-5" />
                      Log In
                    </button>
                  </>
                )}

                {state === "AUTHENTICATED" && profile && (
                  <>
                    <div className="h-px bg-foreground/10 my-4" />
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-sans uppercase tracking-[0.2em] text-muted font-medium">Your Account</span>
                        {roleIndicator && (
                          <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                            {roleIndicator}
                          </span>
                        )}
                      </div>

                      {accountNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="text-lg font-serif italic tracking-wide text-foreground/80 hover:text-foreground transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {adminNavItems.length > 0 && (
                      <>
                        <div className="h-px bg-foreground/10 my-4" />
                        <div className="flex flex-col gap-4">
                          <span className="text-xs font-sans uppercase tracking-[0.2em] text-amber-800 font-medium">
                            {profile?.role === "ADMIN" ? "Administration" : "Moderation"}
                          </span>
                          {adminNavItems.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsMenuOpen(false)}
                              className="text-lg font-serif italic tracking-wide text-amber-900/80 hover:text-amber-900 transition-colors"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="mt-auto pt-8">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-red-700/80 hover:text-red-700 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
