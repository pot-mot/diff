import {DiffMatcher} from './DiffMatcher';

export type DiffOptions<DeepType = any> = {
    // TODO 添加深度约束
    depth?: number | undefined | null;
    deepMatchers?: DiffMatcher<DeepType>[] | undefined | null;
};

export type ArrayDiffOptions<ItemType, DeepType = any> = {
    // TODO 添加深度约束
    depth?: number | undefined | null;
    matchers?: DiffMatcher<ItemType>[] | undefined | null;
    deepMatchers?: DiffMatcher<DeepType>[] | undefined | null;
};
