export const CATEGORIES = ['design', 'finance', 'personal', 'saas'] as const;
export type Category = typeof CATEGORIES[number];
