export const CATEGORIES = ['design', 'finance', 'personal', 'marketing'] as const;
export type Category = typeof CATEGORIES[number];
