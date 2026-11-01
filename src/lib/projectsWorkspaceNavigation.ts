/** Module entry opens Overview; existing record/layout deep links retain Registry context. */
export const getProjectsDefaultView = (params: URLSearchParams): 'overview' | 'all' =>
  params.has('project') || params.has('layout') ? 'all' : 'overview';
