export const isSlugFixtureMode = (): boolean =>
  !import.meta.env.PROD || import.meta.env.VITE_AB_TEST_DATA === 'true';
