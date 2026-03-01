"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function initGA() {
  if (!GA_ID || typeof window === "undefined") return;

  // Initialize gtag
  const gtag = (...args: unknown[]) => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(args);
  };
  
  gtag("js", new Date());
  gtag("config", GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });
}

export function pageview(url: string) {
  if (!GA_ID || typeof window === "undefined") return;
  
  window.gtag?.("config", GA_ID, {
    page_path: url,
  });
}

export function event(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined") return;
  
  window.gtag?.("event", name, params);
}

// Hook for automatic page view tracking
export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    pageview(url);
  }, [pathname, searchParams]);
}

// Predefined event functions
export const analytics = {
  lessonStarted: (courseId: string, lessonId: string) => 
    event("lesson_started", { course_id: courseId, lesson_id: lessonId }),
  
  lessonCompleted: (courseId: string, lessonId: string, xpEarned: number) =>
    event("lesson_completed", { course_id: courseId, lesson_id: lessonId, xp_earned: xpEarned }),
  
  courseEnrolled: (courseId: string) =>
    event("course_enrolled", { course_id: courseId }),
  
  courseCompleted: (courseId: string, xpEarned: number) =>
    event("course_completed", { course_id: courseId, xp_earned: xpEarned }),
  
  challengePassed: (courseId: string, lessonId: string, attempts: number) =>
    event("challenge_passed", { course_id: courseId, lesson_id: lessonId, attempts }),
  
  walletConnected: (walletType: string) =>
    event("wallet_connected", { wallet_type: walletType }),
  
  languageChanged: (language: string) =>
    event("language_changed", { language }),
};
