export type DiscoverProfile = { id?: string; [key: string]: unknown };
export function mergeDiscoverProfiles<T extends DiscoverProfile>(existing?: T[], incoming?: T[]): T[];
export function createDiscoverRequestGate(): {
  beginRefresh(): number;
  invalidate(): number;
  beginPage(): number | null;
  isCurrent(token: number): boolean;
  finishPage(token: number): void;
};
