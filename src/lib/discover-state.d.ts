export type DiscoverProfile = { id?: string; [key: string]: unknown };
export function mergeDiscoverProfiles<T extends DiscoverProfile>(existing?: T[], incoming?: T[]): T[];
