export type DiffMatcher<T = any> = (a: T, b: T, aIndex?: number, bIndex?: number) => boolean;
