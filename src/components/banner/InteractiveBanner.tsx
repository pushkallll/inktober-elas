"use client";

import { useEffect, useRef } from "react";

interface BannerProps {
  text: string;
}

export function InteractiveBanner({ text }: BannerProps) {
  // DEBUGGING: Log prop received by client component
  console.log("INTERACTIVE BANNER COMPONENT DEBUG:", { text });

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const position = useRef(0);
  const velocity = useRef(-0.5);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const lastTime = useRef(0);

  const BASE_VELOCITY = -0.4;
  const MAX_VELOCITY = 10;
  const FRICTION = 0.92;
  const DRAG_MULTIPLIER = 0.4;

  useEffect(() => {
    let animationFrameId: number;
    let width = 0;

    const updateWidth = () => {
      if (blockRef.current) {
        width = blockRef.current.getBoundingClientRect().width;
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);

    const loop = () => {
      if (!isDragging.current) {
        if (Math.abs(velocity.current - BASE_VELOCITY) > 0.05) {
          velocity.current = velocity.current * FRICTION + BASE_VELOCITY * (1 - FRICTION);
        } else {
          velocity.current = BASE_VELOCITY;
        }
      }

      if (velocity.current > MAX_VELOCITY) velocity.current = MAX_VELOCITY;
      if (velocity.current < -MAX_VELOCITY) velocity.current = -MAX_VELOCITY;
      position.current += velocity.current;

      if (width > 0) {
        if (position.current <= -width) position.current += width;
        else if (position.current > 0) position.current -= width;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translate3d(${position.current}px, 0, 0)`;
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    isDragging.current = true;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
    velocity.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastX.current;
    const dt = performance.now() - lastTime.current;
    if (dt > 0) {
      const v = (dx / dt) * 16.66 * DRAG_MULTIPLIER;
      velocity.current = velocity.current * 0.5 + v * 0.5;
    }
    position.current += dx;
    lastX.current = e.clientX;
    lastTime.current = performance.now();
  };

  const handlePointerUp = () => { isDragging.current = false; };

  const repeatedContent = (
    <>
      <span className="px-5">{text}</span>
      <span className="px-3 text-foreground/50">·</span>
      <span className="px-5">{text}</span>
      <span className="px-3 text-foreground/50">·</span>
      <span className="px-5">{text}</span>
      <span className="px-3 text-foreground/50">·</span>
      <span className="px-5">{text}</span>
      <span className="px-3 text-foreground/50">·</span>
    </>
  );

  return (
    <div
      className="w-full overflow-hidden border-b border-foreground/10 bg-[#f8f5f0]/85 backdrop-blur-[2px] shadow-sm touch-none select-none py-2 flex items-center cursor-grab active:cursor-grabbing relative z-20"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        ref={containerRef}
        className="flex whitespace-nowrap will-change-transform motion-reduce:transform-none"
      >
        <div ref={blockRef} className="flex shrink-0 items-center font-serif italic text-xs tracking-[0.15em] text-foreground/90 motion-reduce:hidden">
          {repeatedContent}
        </div>
        <div className="flex shrink-0 items-center font-serif italic text-xs tracking-[0.15em] text-foreground/90 motion-reduce:hidden">
          {repeatedContent}
        </div>
        <div className="hidden motion-reduce:block font-serif italic text-xs tracking-widest text-foreground/75 w-full text-center">
          {text}
        </div>
      </div>
    </div>
  );
}
