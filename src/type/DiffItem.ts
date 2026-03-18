import {DiffRecord} from "./DiffRecord";

export type CircularReferenceDiff = {
    type: 'circular reference';
};

export type ObjectDiff<T extends DiffRecord, U extends DiffRecord = T> = {
    type: 'object';
    equals?: {
        [K in keyof T & keyof U]?: PropertyEqualsDiffItem<T, K>;
    };
    updated?: {
        [K in keyof T & keyof U]?: PropertyUpdatedDiffItem<T, U, K>;
    };
    added?: {
        [K in Exclude<keyof U, keyof T>]?: PropertyAddedDiffItem<U, K>;
    };
    deleted?: {
        [K in Exclude<keyof T, keyof U>]?: PropertyDeletedDiffItem<T, K>;
    };
};

export type PropertyAddedDiffItem<
    T extends DiffRecord,
    K extends keyof T = keyof T,
> = {
    propertyName: K;
    value: T[K];
};

export type PropertyDeletedDiffItem<
    T extends DiffRecord,
    K extends keyof T = keyof T,
> = {
    propertyName: K;
    value: T[K];
};

export type PropertyEqualsDiffItem<
    T extends DiffRecord,
    K extends keyof T = keyof T,
> = {
    propertyName: K;
    value: T[K];
};

export type PropertyUpdatedDiffItem<
    T extends DiffRecord,
    U extends DiffRecord = T,
    K extends keyof T & keyof U = keyof T & keyof U,
> = {
    propertyName: K;
    prevValue: T[K];
    nextValue: U[K];
    diff?: T[K] & U[K] extends Array<infer Item> | ReadonlyArray<infer Item>
        ? ArrayDiff<Item>
        : T[K] & U[K] extends DiffRecord
          ? ObjectDiff<T[K] & U[K], T[K] & U[K]> | CircularReferenceDiff
          : never;
};

export type ArrayAddedDiffItem<T> = {
    data: T;
    nextIndex: number;
};

export type ArrayUpdatedDiffItem<T> = {
    prevData: T;
    prevIndex: number;
    nextData: T;
    nextIndex: number;
    diff: T extends Array<infer Item> | ReadonlyArray<infer Item>
        ? ArrayDiff<Item>
        : T extends DiffRecord
          ? ObjectDiff<T> | CircularReferenceDiff
          : never;
};

export type ArrayDeletedDiffItem<T> = {
    data: T;
    prevIndex: number;
};

export type ArrayMovedDiffItem<T> = {
    data: T;
    prevIndex: number;
    nextIndex: number;
};

export type ArrayEqualsDiffItem<T> = {
    data: T;
    index: number;
};

export type ArrayDiff<T> = {
    type: 'array';
    added: ArrayAddedDiffItem<T>[];
    updated: ArrayUpdatedDiffItem<T>[];
    deleted: ArrayDeletedDiffItem<T>[];
    moved: ArrayMovedDiffItem<T>[];
    equals: ArrayEqualsDiffItem<T>[];
};
