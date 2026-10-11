// Sample/A-B fixtures are development-only. Production must never substitute demo business data.
export const isSlugFixtureMode = (): boolean => !import.meta.env.PROD;
