/** Deduplicate recommendation records by stable member ID. Records without IDs are not displayable. */
export function mergeDiscoverProfiles(existing = [], incoming = []) {
  const seen = new Set();
  const merged = [];
  for (const profile of [...existing, ...incoming]) {
    const id = typeof profile?.id === 'string' ? profile.id.trim() : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    merged.push(profile);
  }
  return merged;
}

/** Request-generation and single-flight gate for the existing Discover endpoint. */
export function createDiscoverRequestGate() {
  let generation = 0;
  let activePageGeneration = null;
  return {
    beginRefresh() {
      generation += 1;
      activePageGeneration = null;
      return generation;
    },
    invalidate() {
      generation += 1;
      activePageGeneration = null;
      return generation;
    },
    beginPage() {
      if (activePageGeneration !== null) return null;
      activePageGeneration = generation;
      return generation;
    },
    isCurrent(token) {
      return token === generation;
    },
    finishPage(token) {
      if (activePageGeneration === token) activePageGeneration = null;
    },
  };
}
