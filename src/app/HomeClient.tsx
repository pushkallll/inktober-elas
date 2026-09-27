"use client";

import { useState, useMemo, useEffect } from "react";
import { FeedControls, FilterState } from "@/components/layout/FeedControls";
import { SubmissionCard } from "@/components/ui/SubmissionCard";
import { getMyYuppsies } from "@/app/actions/yuppsies";
import { useAuth } from "@/lib/contexts/AuthContext";

export type SortOption = "LATEST" | "OLDEST" | "YUPPSIES_HIGH" | "YUPPSIES_LOW";

export function HomeClient({ initialSubmissions }: { initialSubmissions: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    type: "ALL",
    genre: "ALL",
    day: "ALL",
    display: "ALL",
  });
  const [sort, setSort] = useState<SortOption>("LATEST");
  const [userYuppsies, setUserYuppsies] = useState<Set<string>>(new Set());
  const { state: authState } = useAuth();

  useEffect(() => {
    if (authState === "AUTHENTICATED" && initialSubmissions.length > 0) {
      const ids = initialSubmissions.map(s => s.id);
      getMyYuppsies(ids).then(yuppsiedIds => {
        setUserYuppsies(new Set(yuppsiedIds));
      }).catch(console.error);
    } else {
      setUserYuppsies(new Set());
    }
  }, [authState, initialSubmissions]);

  const filteredAndSorted = useMemo(() => {
    let result = initialSubmissions.filter((sub) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = sub.title.toLowerCase().includes(query);
        const matchesContent = sub.content?.toLowerCase().includes(query);
        const matchesAuthor = !sub.anonymous && sub.penName.toLowerCase().includes(query);
        const matchesPrompt = sub.prompt.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesPrompt) return false;
      }
      if (filters.type !== "ALL" && sub.type !== filters.type) return false;
      if (filters.genre !== "ALL" && sub.type === "WRITING" && sub.genre !== filters.genre) return false;
      if (filters.day !== "ALL" && sub.day !== Number(filters.day)) return false;
      if (filters.display === "NAMED" && sub.anonymous) return false;
      if (filters.display === "ANONYMOUS" && !sub.anonymous) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      switch (sort) {
        case "LATEST":
          return b.timestamp - a.timestamp;
        case "OLDEST":
          return a.timestamp - b.timestamp;
        case "YUPPSIES_HIGH":
          return (b.yuppsiesCount ?? 0) - (a.yuppsiesCount ?? 0);
        case "YUPPSIES_LOW":
          return (a.yuppsiesCount ?? 0) - (b.yuppsiesCount ?? 0);
        default:
          return 0;
      }
    });

    return result;
  }, [searchQuery, filters, sort, initialSubmissions]);

  return (
    <div className="flex flex-col min-h-screen">
      <FeedControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="py-8 flex flex-col">
        {filteredAndSorted.length > 0 ? (
          filteredAndSorted.map((sub, index) => (
            <SubmissionCard
              key={sub.id}
              submission={sub}
              priority={index < 2}
              initialYuppsied={userYuppsies.has(sub.id)}
            />
          ))
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-32 text-muted">
            <p className="font-serif italic text-xl mb-3 text-foreground/60">No submissions found</p>
            <p className="text-xs uppercase tracking-[0.2em]">Try adjusting your filters or search.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilters({ type: "ALL", genre: "ALL", day: "ALL", display: "ALL" });
                setSort("LATEST");
              }}
              className="mt-6 text-xs uppercase tracking-[0.2em] border border-border px-5 py-2.5 rounded-full text-muted hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
