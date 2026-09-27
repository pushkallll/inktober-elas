import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  children?: React.ReactNode;
}

/**
 * Full-bleed page header that breaks out of the constrained <main> container
 * (which has px-4 sm:px-6 lg:px-8) using negative margin breakout.
 *
 * The warm parchment surface (#faf8f5 at 98% opacity) provides clear visual
 * separation from the painterly bg-main.jpg background (#d6cbbd region).
 * A bottom border + drop shadow creates a clear "surface above painting" effect.
 */
export function PageHeader({ title, subtitle, badge, children }: PageHeaderProps) {
  return (
    <div
      className={[
        "relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw]",
        "bg-card",
        // Visible bottom border + layered shadow: crisp line + diffuse glow
        "border-b-2 border-[#bdae9c]",
        "shadow-[0_4px_0_rgba(0,0,0,0.06),0_6px_24px_rgba(0,0,0,0.10)]",
        // Vertical rhythm
        "pt-8 pb-7 mb-10",
        // Stack above the absolutely-positioned painterly background
        "relative z-10",
      ].join(" ")}
    >
      <div className="max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl sm:text-3xl font-serif tracking-widest text-foreground uppercase">
              {title}
            </h1>
            {badge && (
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-sm">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted uppercase tracking-[0.15em]">
              {subtitle}
            </p>
          )}
        </div>
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

