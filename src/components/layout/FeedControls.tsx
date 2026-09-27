"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, X, ArrowUpDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { SubmissionType } from "@/lib/types";
import { SortOption } from "@/app/HomeClient";

export interface FilterState {
  type: "ALL" | SubmissionType;
  genre: string;
  day: number | "ALL";
  display: "ALL" | "NAMED" | "ANONYMOUS";
}

interface FeedControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  sort?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  hideTypeFilter?: boolean;
}

export function FeedControls({ searchQuery, onSearchChange, filters, onFilterChange, sort = "LATEST", onSortChange, hideTypeFilter }: FeedControlsProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({ type: "ALL", genre: "ALL", day: "ALL", display: "ALL" });
    if (onSortChange) onSortChange("LATEST");
  };

  const hasActiveFilters = filters.type !== "ALL" || filters.genre !== "ALL" || filters.day !== "ALL" || filters.display !== "ALL" || sort !== "LATEST";

  return (
    <div className="w-full flex flex-col pt-4 pb-6 z-20 pointer-events-none sticky top-[60px] sm:top-[72px]">
      {/* Floating pill buttons */}
      <div className="flex items-center justify-between px-5 sm:px-8 lg:px-12 pointer-events-auto">
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.button
                key="search-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  setIsSearchOpen(true);
                  setIsFilterOpen(false);
                }}
                className={`p-2.5 rounded-full bg-[#f8f5f0]/95 backdrop-blur-[2px] shadow-sm border border-foreground/10 transition-colors ${
                  searchQuery ? "text-accent" : "text-muted hover:text-foreground"
                }`}
                aria-label="Open search"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.div
                key="search-input"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center overflow-hidden bg-[#f8f5f0]/95 backdrop-blur-[2px] shadow-sm rounded-full border border-foreground/10"
              >
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-3.5 text-muted" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-3 py-2.5 bg-transparent text-sm focus:outline-none w-44 sm:w-56 text-foreground placeholder:text-muted/60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange("")}
                      className="absolute right-2.5 text-muted hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 text-muted hover:text-foreground mr-1"
                  aria-label="Close search"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            if (isSearchOpen) setIsSearchOpen(false);
          }}
          className={`p-2.5 rounded-full bg-[#f8f5f0]/95 backdrop-blur-[2px] shadow-sm border border-foreground/10 relative transition-colors ${
            isFilterOpen || hasActiveFilters ? "text-accent" : "text-muted hover:text-foreground"
          }`}
          aria-label="Toggle filters"
        >
          <Filter className="w-4 h-4" />
          {hasActiveFilters && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {/* Filter Dropdown */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="px-5 sm:px-8 lg:px-12 mt-3 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#f8f5f0]/95 backdrop-blur-[2px] border border-foreground/10 rounded-[2px] p-5 shadow-lg overflow-hidden relative"
            >
              <button
                onClick={() => setIsFilterOpen(false)}
                className="absolute top-3 right-3 p-1.5 text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex justify-between items-end mb-4">
                <h3 className="text-xs uppercase tracking-[0.2em] text-muted">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-[10px] uppercase tracking-widest text-accent hover:text-foreground transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {!hideTypeFilter && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Type</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["ALL", "ART", "WRITING"].map((t) => (
                        <button
                          key={t}
                          onClick={() => updateFilter("type", t)}
                          className={`text-[10px] uppercase tracking-wider border px-2.5 py-1 rounded-sm transition-colors ${
                            filters.type === t
                              ? "border-accent/50 bg-accent/10 text-accent"
                              : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                          }`}
                        >
                          {t === "ALL" ? "All" : t === "ART" ? "Art" : "Writing"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(filters.type === "WRITING" || hideTypeFilter) && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Genre</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {["ALL", "Poetry", "Prose", "Short Story", "Essay", "Other"].map((g) => (
                        <button
                          key={g}
                          onClick={() => updateFilter("genre", g)}
                          className={`text-[10px] uppercase tracking-wider border px-2.5 py-1 rounded-sm transition-colors ${
                            filters.genre === g
                              ? "border-accent/50 bg-accent/10 text-accent"
                              : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Day</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                    <button
                      onClick={() => updateFilter("day", "ALL")}
                      className={`text-[10px] uppercase tracking-wider border px-2.5 py-1 rounded-sm shrink-0 transition-colors ${
                        filters.day === "ALL"
                          ? "border-accent/50 bg-accent/10 text-accent"
                          : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <button
                        key={d}
                        onClick={() => updateFilter("day", d)}
                        className={`text-[10px] border px-2 py-1 rounded-sm shrink-0 transition-colors ${
                          filters.day === d
                            ? "border-accent/50 bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Display</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {["ALL", "NAMED", "ANONYMOUS"].map((d) => (
                      <button
                        key={d}
                        onClick={() => updateFilter("display", d)}
                        className={`text-[10px] uppercase tracking-wider border px-2.5 py-1 rounded-sm transition-colors ${
                          filters.display === d
                            ? "border-accent/50 bg-accent/10 text-accent"
                            : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                        }`}
                      >
                        {d === "ALL" ? "All" : d === "NAMED" ? "Named" : "Anonymous"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                {onSortChange && (
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Sort By</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {([
                        ["LATEST", "Latest First"],
                        ["OLDEST", "Oldest First"],
                        ["YUPPSIES_HIGH", "♥ High → Low"],
                        ["YUPPSIES_LOW", "♥ Low → High"],
                      ] as [SortOption, string][]).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => onSortChange(value)}
                          className={`text-[10px] uppercase tracking-wider border px-2.5 py-1 rounded-sm transition-colors ${
                            sort === value
                              ? "border-accent/50 bg-accent/10 text-accent"
                              : "border-border text-muted hover:border-accent/30 hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
