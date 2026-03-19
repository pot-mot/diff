import type {DiffRecord} from './type/DiffRecord';
import type {DiffMatcher} from './type/DiffMatcher';
import type {DiffOptions} from './type/DiffOptions';
import type {
    ArrayDiff,
    CircularReferenceDiff,
    ObjectDiff,
    PropertyAddedDiffItem,
    PropertyDeletedDiffItem,
    PropertyEqualsDiffItem,
    PropertyUpdatedDiffItem,
} from './type/DiffItem';
import {deepEquals} from './deepEquals';
import {_arrayDiff} from './arrayDiff';
import {checkIsDiffRecord} from './checkIsDiffRecord';

export const _objectDiff = <T extends DiffRecord, U extends DiffRecord = T>(
    prevVal: T | undefined | null,
    nextVal: U | undefined | null,
    deepMatchers: DiffMatcher[],
    depth: number | undefined | null,
    visitedPrev: WeakSet<object>,
    visitedNext: WeakSet<object>,
): ObjectDiff<T, U> | CircularReferenceDiff => {
    // 如果两个值都为空，返回空对象
    if (
        (prevVal === undefined || prevVal === null || Object.keys(prevVal).length === 0) &&
        (nextVal === undefined || nextVal === null || Object.keys(nextVal).length === 0)
    ) {
        return {type: 'object'};
    }

    // 如果旧值为空，所有属性都是新增的
    if (prevVal === undefined || prevVal === null || typeof prevVal !== 'object') {
        const added: {[K in keyof U]?: PropertyAddedDiffItem<U, K>} = {};
        if (nextVal !== undefined && nextVal !== null && typeof nextVal === 'object') {
            Object.keys(nextVal).forEach((key) => {
                const k = key as keyof U;
                added[k] = {
                    propertyName: k,
                    value: nextVal[k],
                };
            });
        }
        return {type: 'object', added};
    }

    // 如果新值为空，所有属性都是删除的
    if (nextVal === undefined || nextVal === null || typeof nextVal !== 'object') {
        const deleted: {[K in keyof T]?: PropertyDeletedDiffItem<T, K>} = {};
        Object.keys(prevVal).forEach((key) => {
            const k = key as keyof T;
            deleted[k] = {
                propertyName: k,
                value: prevVal[k],
            };
        });
        return {type: 'object', deleted};
    }

    // 检查循环引用
    if (typeof prevVal === 'object') {
        if (visitedPrev.has(prevVal)) {
            // 检测到旧值中的循环引用
            return {type: 'circular reference'};
        }
        visitedPrev.add(prevVal);
    }

    if (typeof nextVal === 'object') {
        if (visitedNext.has(nextVal)) {
            // 检测到新值中的循环引用
            return {type: 'circular reference'};
        }
        visitedNext.add(nextVal);
    }

    const result: ObjectDiff<T, U> = {type: 'object'};

    // 检查属性删除
    const deleted: {[K in keyof T]?: PropertyDeletedDiffItem<T, K>} = {};
    for (const key in prevVal) {
        if (!(key in nextVal)) {
            deleted[key] = {
                propertyName: key,
                value: prevVal[key],
            };
        }
    }
    if (Object.keys(deleted).length > 0) {
        result.deleted = deleted;
    }

    // 检查属性新增
    const added: {[K in keyof U]?: PropertyAddedDiffItem<U, K>} = {};
    for (const key in nextVal) {
        if (!(key in prevVal)) {
            added[key] = {
                propertyName: key,
                value: nextVal[key],
            };
        }
    }
    if (Object.keys(added).length > 0) {
        result.added = added;
    }

    // 检查属性更新
    const equals: {[K in keyof T & keyof U]?: PropertyEqualsDiffItem<T, K>} = {};
    const updated: {[K in keyof T & keyof U]?: PropertyUpdatedDiffItem<T, U, K>} = {};

    const shouldDeepDiff = depth === undefined || depth === null || depth > 0;
    const nextDepth = typeof depth === 'number' ? depth - 1 : undefined;

    for (const key in prevVal) {
        if (key in nextVal) {
            if (deepEquals(prevVal[key], nextVal[key])) {
                equals[key] = {
                    propertyName: key,
                    value: prevVal[key],
                } as any;
            } else {
                // 确定值的类型并创建适当的 diff
                const prevValue = prevVal[key];
                const nextValue = nextVal[key];

                let diff: ObjectDiff<any> | ArrayDiff<any> | CircularReferenceDiff | undefined =
                    undefined;

                if (shouldDeepDiff) {
                    if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
                        diff = _arrayDiff(
                            prevValue,
                            nextValue,
                            deepMatchers,
                            deepMatchers,
                            nextDepth,
                            visitedPrev,
                            visitedNext,
                        );
                    } else if (checkIsDiffRecord(prevValue) && checkIsDiffRecord(nextValue)) {
                        // 传递已访问的 WeakMap 以处理嵌套对象的循环引用
                        diff = _objectDiff(
                            prevValue,
                            nextValue,
                            deepMatchers,
                            nextDepth,
                            visitedPrev,
                            visitedNext,
                        );
                    }
                }

                updated[key] = {
                    propertyName: key,
                    prevValue: prevVal[key],
                    nextValue: nextVal[key],
                    diff: diff,
                } as any;
            }
        }
    }
    if (Object.keys(equals).length > 0) {
        result.equals = equals;
    }
    if (Object.keys(updated).length > 0) {
        result.updated = updated;
    }

    return result;
};

export const objectDiff = <T extends DiffRecord, U extends DiffRecord = T>(
    prevVal: T | undefined | null,
    nextVal: U | undefined | null,
    options?: DiffOptions | undefined | null,
): ObjectDiff<T, U> | CircularReferenceDiff => {
    const deepMatchers = options?.deepMatchers ?? [deepEquals];
    const depth = options?.depth;

    return _objectDiff(prevVal, nextVal, deepMatchers, depth, new WeakSet(), new WeakSet());
};
