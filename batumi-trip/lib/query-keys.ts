export const qk = {
  /** Flat list of destination branches that belong to the current user */
  directions: () => ["directions"] as const,

  /**
   * Infinite, filtered list of locations inside a branch.
   *
   * @param dirId  Direction UUID or `null` for the legacy root list
   * @param search Current search string from uiStore.searchQuery
   * @param tags   Selected tag names from uiStore.selectedTags
   */
  locations: (
    dirId: string | null,
    search: string,
    tags: string[],
  ) =>
    [
      "locations",
      {
        dir: dirId ?? "__root__",
        search,
        tags,
      },
    ] as const,

  /** Single location object */
  location: (id: string) => ["location", id] as const,

  /** Static dictionary of all tags */
  tags: () => ["tags"] as const,

  /** Favourites of a particular user (used for hydration & toggling) */
  favourites: (userId: string) => ["favourites", userId] as const,
} as const;

/**
 * Union type of every possible QueryKey returned by qk.
 * Handy for generics and helpers that accept any key produced here.
 */
export type QueryKeys = ReturnType<(typeof qk)[keyof typeof qk]>;