export type {
    DiffRecord,
} from './type/DiffRecord';
export type {
    DiffOptions,
    ArrayDiffOptions,
} from './type/DiffOptions';
export type {
    DiffMatcher,
} from './type/DiffMatcher';
export type {
    CircularReferenceDiff,
    ObjectDiff,
    PropertyAddedDiffItem,
    PropertyDeletedDiffItem,
    PropertyUpdatedDiffItem,
    ArrayDiff,
    ArrayAddedDiffItem,
    ArrayUpdatedDiffItem,
    ArrayDeletedDiffItem,
    ArrayMovedDiffItem,
    ArrayEqualsDiffItem,
} from './type/DiffItem';

export {deepEquals} from './deepEquals';
export {arrayDiff} from './arrayDiff';
export {objectDiff} from './objectDiff';
