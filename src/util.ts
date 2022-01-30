export const keys = <T extends object>(t: T) => Object.keys(t) as (keyof T)[];
