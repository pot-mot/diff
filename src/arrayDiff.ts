import {type DiffMatcher} from './type/DiffMatcher';
import type {ArrayDiffOptions} from './type/DiffOptions';
import type {ArrayDiff, CircularReferenceDiff, ObjectDiff} from './type/DiffItem';
import {deepEquals} from './deepEquals';
import {_objectDiff} from './objectDiff';
import {checkIsDiffRecord} from './checkIsDiffRecord';

export const _arrayDiff = <T>(
    prevList: ReadonlyArray<T> | undefined | null,
    nextList: ReadonlyArray<T> | undefined | null,
    matchers: DiffMatcher<T>[],
    deepMatchers: DiffMatcher[],
    depth: number | undefined | null,
    visitedPrev: WeakSet<object>,
    visitedNext: WeakSet<object>,
): ArrayDiff<T> => {
    const result: ArrayDiff<T> = {
        type: 'array',
        added: [],
        updated: [],
        deleted: [],
        moved: [],
        equals: [],
    };

    // 如果两个列表都为空，直接返回空结果
    if (!prevList && !nextList) {
        return result;
    }

    if (!prevList) {
        // 如果前一个列表为空，所有项目都是新增的
        nextList?.forEach((item, index) => {
            result.added.push({data: item, nextIndex: index});
        });
        return result;
    }

    if (!nextList) {
        // 如果后一个列表为空，所有项目都是删除的
        prevList?.forEach((item, index) => {
            result.deleted.push({data: item, prevIndex: index});
        });
        return result;
    }

    const prevWithIndexSet = new Set(prevList.map((item, index) => ({item, index})));
    const nextWithIndexSet = new Set(nextList.map((item, index) => ({item, index})));
    visitedPrev.add(prevList);
    visitedNext.add(nextList);

    const shouldDeepDiff = depth === undefined || depth === null || depth > 0;
    const nextDepth = typeof depth === 'number' ? depth - 1 : undefined;

    for (const matcher of matchers) {
        for (const prev of prevWithIndexSet) {
            const {item: prevItem, index: prevIndex} = prev;

            let matchedNext: {item: T; index: number} | undefined = undefined;
            for (const next of nextWithIndexSet) {
                if (matcher(prevItem, next.item, prevIndex, next.index)) matchedNext = next;
            }
            if (matchedNext === undefined) continue;

            const {item: nextItem, index: nextIndex} = matchedNext;

            if (deepEquals(prevItem, nextItem)) {
                if (prevIndex === nextIndex) {
                    result.equals.push({
                        data: nextItem,
                        index: nextIndex,
                    });
                } else {
                    result.moved.push({
                        data: nextItem,
                        prevIndex: prevIndex,
                        nextIndex: nextIndex,
                    });
                }
            } else {
                let diff: ObjectDiff<any> | ArrayDiff<any> | CircularReferenceDiff | undefined =
                    undefined;

                if (shouldDeepDiff) {
                    if (Array.isArray(prevItem) && Array.isArray(nextItem)) {
                        diff = _arrayDiff(
                            prevItem,
                            nextItem,
                            deepMatchers,
                            deepMatchers,
                            nextDepth,
                            visitedPrev,
                            visitedNext,
                        );
                    } else if (checkIsDiffRecord(prevItem) && checkIsDiffRecord(nextItem)) {
                        diff = _objectDiff(
                            prevItem,
                            nextItem,
                            deepMatchers,
                            nextDepth,
                            visitedPrev,
                            visitedNext,
                        );
                    }
                }

                result.updated.push({
                    prevData: prevItem,
                    prevIndex: prevIndex,
                    nextData: nextItem,
                    nextIndex: nextIndex,
                    diff: diff as any,
                });
            }

            prevWithIndexSet.delete(prev);
            nextWithIndexSet.delete(matchedNext);
        }
    }

    prevWithIndexSet.forEach(({item, index}) => {
        result.deleted.push({data: item, prevIndex: index});
    });
    nextWithIndexSet.forEach(({item, index}) => {
        result.added.push({data: item, nextIndex: index});
    });

    return result;
};

export const arrayDiff = <T>(
    prevList: ReadonlyArray<T> | undefined | null,
    nextList: ReadonlyArray<T> | undefined | null,
    options?: ArrayDiffOptions<T> | undefined | null,
): ArrayDiff<T> => {
    const matchers = options?.matchers ?? [deepEquals];
    const deepMatchers = options?.deepMatchers ?? [deepEquals];
    const depth = options?.depth;

    return _arrayDiff(
        prevList,
        nextList,
        matchers,
        deepMatchers,
        depth,
        new WeakSet(),
        new WeakSet(),
    );
};
