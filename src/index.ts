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
