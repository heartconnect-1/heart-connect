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
