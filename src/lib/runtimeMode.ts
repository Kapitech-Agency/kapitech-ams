// Runtime application screens must never substitute fabricated demo or preview business records.
// Tests should inject fixtures through isolated test helpers only.
export const isSlugFixtureMode = (): boolean => false;
