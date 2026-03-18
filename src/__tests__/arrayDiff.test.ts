import {describe, it, expect} from 'vitest';
import {arrayDiff} from '../arrayDiff';
import type {DeepReadonly} from '../type/DeepReadonly';
import type {ArrayDiff} from '../type/DiffItem';

// 定义测试数据类型
type TestItem = DeepReadonly<{
    name: string;
    value: string;
    count?: number;
}>;

type NestTestItem = DeepReadonly<{
    name: string;
    details: {
        id: number;
        description: string;
        nestArray: {
            name: string;
            value: string;
        }[];
    };
}>;

const nameMatcher = [(a: { name: string }, b: { name: string }) => a.name === b.name];

const nameValueMatcher = [
    (a: { name: string }, b: { name: string }) => a.name === b.name,
    (a: { value: string }, b: { value: string }) => a.value === b.value,
];

const customNameMatcher = [
    (a: any, b: any): boolean => {
        if ('name' in a && typeof a.name === 'string' && 'name' in b && typeof b.name === 'string')
            return a.name === b.name;
        return false;
    },
];

describe('arrayDiff - 基础功能', () => {
    it('空数组比较', () => {
        const emptyArrayDiff: ArrayDiff<TestItem> = {
            type: 'array',
            added: [],
            updated: [],
            deleted: [],
            moved: [],
            equals: [],
        };
        expect(arrayDiff<TestItem>([], [], {matchers: nameMatcher})).toStrictEqual(emptyArrayDiff);
        expect(arrayDiff<TestItem>(null, null, {matchers: nameMatcher})).toStrictEqual(emptyArrayDiff);
        expect(arrayDiff<TestItem>(undefined, undefined, {matchers: nameMatcher})).toStrictEqual(
            emptyArrayDiff,
        );
    });

    it('全部新增', () => {
        const nextList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
        ];

        const result = arrayDiff<TestItem>(null, nextList, {matchers: nameMatcher});
        expect(result.added).toHaveLength(2);
        expect(result.updated).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
        expect(result.equals).toHaveLength(0);
    });

    it('全部删除', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
        ];

        const result = arrayDiff<TestItem>(prevList, null, {matchers: nameMatcher});
        expect(result.deleted).toHaveLength(2);
        expect(result.added).toHaveLength(0);
        expect(result.updated).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
        expect(result.equals).toHaveLength(0);
    });

    it('元素相等', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
        ];

        const nextList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.equals).toHaveLength(2);
        expect(result.added).toHaveLength(0);
        expect(result.updated).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
    });

    it('元素移动', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
            {name: 'item3', value: 'value3'},
        ];

        const nextList: TestItem[] = [
            {name: 'item3', value: 'value3'},
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.moved).toHaveLength(3);
        expect(result.equals).toHaveLength(0);
        expect(result.added).toHaveLength(0);
        expect(result.updated).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
    });

    it('新增元素', () => {
        const prevList: TestItem[] = [{name: 'item1', value: 'value1'}];

        const nextList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
            {name: 'item3', value: 'value3'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.added).toHaveLength(2);
        expect(result.equals).toHaveLength(1);
        expect(result.deleted).toHaveLength(0);
        expect(result.updated).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
    });

    it('更新元素', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'oldValue'},
            {name: 'item2', value: 'value2'},
        ];

        const nextList: TestItem[] = [
            {name: 'item1', value: 'newValue'},
            {name: 'item2', value: 'value2'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.updated).toHaveLength(1);
        expect(result.equals).toHaveLength(1);
        expect(result.added).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
    });

    it('删除元素', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
            {name: 'item3', value: 'value3'},
        ];

        const nextList: TestItem[] = [{name: 'item1', value: 'value1'}];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.deleted).toHaveLength(2);
        expect(result.equals).toHaveLength(1);
        expect(result.added).toHaveLength(0);
        expect(result.updated).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
    });

    it('混合变更', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
            {name: 'item3', value: 'value3'},
            {name: 'item4', value: 'value4'},
        ];

        const nextList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'newValue'},
            {name: 'item4', value: 'value4'},
            {name: 'item5', value: 'value5'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameMatcher});
        expect(result.equals).toHaveLength(1);
        expect(result.added).toHaveLength(1);
        expect(result.updated).toHaveLength(1);
        expect(result.deleted).toHaveLength(1);
        expect(result.moved).toHaveLength(1);
    });
});

describe('arrayDiff - 多匹配器', () => {
    it('使用多个匹配器', () => {
        const prevList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'item2', value: 'value2'},
            {name: 'item3', value: 'value3'},
            {name: 'item4', value: 'value4'},
        ];

        const nextList: TestItem[] = [
            {name: 'item1', value: 'value1'},
            {name: 'new item2', value: 'value2'},
            {name: 'item2', value: 'newValue'},
            {name: 'item5', value: 'value4'},
        ];

        const result = arrayDiff<TestItem>(prevList, nextList, {matchers: nameValueMatcher});
        expect(result.equals).toHaveLength(1);
        expect(result.added).toHaveLength(1);
        expect(result.updated).toHaveLength(2);
        expect(result.deleted).toHaveLength(1);
        expect(result.moved).toHaveLength(0);
    });
});

describe('arrayDiff - 嵌套对象', () => {
    it('嵌套对象和数组的复杂更新', () => {
        const prevList: NestTestItem[] = [
            {
                name: 'item1',
                details: {
                    id: 1,
                    description: 'old description',
                    nestArray: [
                        {name: 'item1', value: 'value1'},
                        {name: 'item2', value: 'value2'},
                        {name: 'item3', value: 'value3'},
                    ],
                },
            },
        ];

        const nextList: NestTestItem[] = [
            {
                name: 'item1',
                details: {
                    id: 1,
                    description: 'new description',
                    nestArray: [
                        {name: 'item1', value: 'value1'},
                        {name: 'item3', value: 'new value'},
                    ],
                },
            },
        ];

        const result = arrayDiff<NestTestItem>(prevList, nextList, {
            matchers: nameMatcher,
            deepMatchers: customNameMatcher,
        });

        expect(result.updated).toHaveLength(1);
        expect(result.equals).toHaveLength(0);
        expect(result.added).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
        expect(result.moved).toHaveLength(0);
    });

    it('嵌套数组的比较', () => {
        type TestType = DeepReadonly<{ name: string; value: number }[]>;

        const prevList: TestType[] = [
            [
                {name: 'a', value: 1},
                {name: 'b', value: 2},
                {name: 'c', value: 3},
            ]
        ];

        const nextList: TestType[] = [
            [
                {name: 'a', value: 1},
                {name: 'b', value: 2},
                {name: 'c', value: 4},
            ],
        ];

        const result = arrayDiff<TestType>(prevList, nextList, {
            deepMatchers: customNameMatcher,
        });

        expect(result.updated).toHaveLength(1);
        expect(result.equals).toHaveLength(0);
        expect(result.added).toHaveLength(0);
        expect(result.deleted).toHaveLength(0);
        expect(result.moved).toHaveLength(0);

        // 验证嵌套数组的 diff
        const updatedItem = result.updated[0];
        expect(updatedItem?.diff?.type).toBe('array');
        if (updatedItem?.diff?.type !== 'array')
            throw new Error('nest array diff type is not array');

        expect(updatedItem?.diff).toStrictEqual({
            type: 'array',
            equals: [
                {data: {name: 'a', value: 1}, index: 0},
                {data: {name: 'b', value: 2}, index: 1},
            ],
            added: [],
            deleted: [],
            moved: [],
            updated: [
                {
                    prevData: {name: 'c', value: 3},
                    prevIndex: 2,
                    nextData: {name: 'c', value: 4},
                    nextIndex: 2,
                    diff: {
                        equals: {
                            name: {
                                propertyName: 'name',
                                value: 'c',
                            },
                        },
                        type: 'object',
                        updated: {
                            value: {
                                diff: undefined,
                                nextValue: 4,
                                prevValue: 3,
                                propertyName: 'value',
                            },
                        },
                    },
                },
            ],
        });
    });
});
