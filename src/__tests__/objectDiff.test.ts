import {describe, it, expect, assert} from 'vitest';
import {objectDiff} from '../objectDiff';
import type {ArrayDiff, ObjectDiff} from '../type/DiffItem';

describe('objectDiff - 基础功能', () => {
    it('空对象比较', () => {
        const emptyObjectDiff: ObjectDiff<any> = {type: 'object'};
        expect(objectDiff({}, {})).toStrictEqual(emptyObjectDiff);
        expect(objectDiff(null, null)).toStrictEqual(emptyObjectDiff);
        expect(objectDiff(undefined, undefined)).toStrictEqual(emptyObjectDiff);
    });

    it('属性新增', () => {
        const result = objectDiff({a: 1}, {a: 1, b: 2});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
            },
            added: {
                b: {propertyName: 'b', value: 2},
            },
        });
    });

    it('属性删除', () => {
        const result = objectDiff({a: 1, b: 2}, {a: 1});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
            },
            deleted: {
                b: {propertyName: 'b', value: 2},
            },
        });
    });

    it('属性更新', () => {
        const result = objectDiff({a: 1, b: 2}, {a: 1, b: 3});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
            },
            updated: {
                b: {
                    propertyName: 'b',
                    prevValue: 2,
                    nextValue: 3,
                    diff: undefined,
                },
            },
        });
    });

    it('完全相等的对象', () => {
        const result = objectDiff({a: 1, b: 2}, {a: 1, b: 2});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
                b: {propertyName: 'b', value: 2},
            },
        });
    });

    it('混合变更', () => {
        const result = objectDiff({a: 1, b: 2, c: 5}, {a: 1, b: 3, d: 4});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
            },
            deleted: {
                c: {propertyName: 'c', value: 5},
            },
            added: {
                d: {propertyName: 'd', value: 4},
            },
            updated: {
                b: {
                    propertyName: 'b',
                    prevValue: 2,
                    nextValue: 3,
                    diff: undefined,
                },
            },
        });
    });
});

describe('objectDiff - 空值处理', () => {
    it('旧值为 null/undefined', () => {
        const result = objectDiff(null, {a: 1, b: 2});
        expect(result).toStrictEqual({
            type: 'object',
            added: {
                a: {propertyName: 'a', value: 1},
                b: {propertyName: 'b', value: 2},
            },
        });
    });

    it('新值为 null/undefined', () => {
        const result = objectDiff({a: 1, b: 2}, null);
        expect(result).toStrictEqual({
            type: 'object',
            deleted: {
                a: {propertyName: 'a', value: 1},
                b: {propertyName: 'b', value: 2},
            },
        });
    });

    it('null 和 undefined 互相比较', () => {
        expect(objectDiff({}, null)).toStrictEqual({type: 'object'});
        expect(objectDiff(null, {})).toStrictEqual({type: 'object'});
        expect(objectDiff({}, undefined)).toStrictEqual({type: 'object'});
        expect(objectDiff(undefined, {})).toStrictEqual({type: 'object'});
    });

    it('嵌套 null/undefined', () => {
        const result = objectDiff({a: null, b: undefined, c: 1}, {a: null, b: 2, c: 1});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {
                    propertyName: 'a',
                    value: null,
                },
                c: {
                    propertyName: 'c',
                    value: 1,
                },
            },
            updated: {
                b: {
                    propertyName: 'b',
                    prevValue: undefined,
                    nextValue: 2,
                    diff: undefined,
                },
            },
        });
    });
});

describe('objectDiff - 嵌套对象', () => {
    it('简单嵌套对象', () => {
        const oldObj = {a: {b: 1}};
        const newObj = {a: {b: 2}};
        const result = objectDiff(oldObj, newObj);

        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: 1},
                    nextValue: {b: 2},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: 1,
                                nextValue: 2,
                                diff: undefined,
                            },
                        },
                    },
                },
            },
        });
    });

    it('嵌套相等', () => {
        const result = objectDiff({a: 1, b: {c: 1}}, {a: 1, b: {c: 1}});
        expect(result).toStrictEqual({
            type: 'object',
            equals: {
                a: {propertyName: 'a', value: 1},
                b: {
                    propertyName: 'b',
                    value: {c: 1},
                },
            },
        });
    });

    it('嵌套数组', () => {
        const oldObj = {items: [1, 2, 3]};
        const newObj = {items: [1, 2, 4]};
        const result = objectDiff(oldObj, newObj);

        assert(result.type === 'object');
        expect(result.updated).toBeDefined();
        expect(result.updated?.items?.diff).toStrictEqual({
            type: 'array',
            equals: [
                {data: 1, index: 0},
                {data: 2, index: 1},
            ],
            added: [{data: 4, nextIndex: 2}],
            deleted: [{data: 3, prevIndex: 2}],
            moved: [],
            updated: [],
        });
    });
});

describe('objectDiff - 循环引用', () => {
    it('简单循环引用', () => {
        const obj1: any = {a: 1};
        obj1.self = obj1;

        const obj2: any = {a: 2};
        obj2.self = obj2;

        const result = objectDiff(obj1, obj2);
        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: 1,
                    nextValue: 2,
                    diff: undefined,
                },
                self: {
                    propertyName: 'self',
                    prevValue: obj1,
                    nextValue: obj2,
                    diff: {
                        type: 'circular reference',
                    },
                },
            },
        });
    });

    it('新值循环引用', () => {
        const obj1: any = {a: 1};
        obj1.self = {};

        const obj2: any = {a: 2};
        obj2.self = obj2;

        const result = objectDiff(obj1, obj2);
        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: 1,
                    nextValue: 2,
                    diff: undefined,
                },
                self: {
                    propertyName: 'self',
                    prevValue: {},
                    nextValue: obj2,
                    diff: {
                        type: 'circular reference',
                    },
                },
            },
        });
    });

    it('嵌套循环引用', () => {
        const obj1: any = {a: {b: 1}};
        obj1.a.self = obj1;

        const obj2: any = {a: {b: 2}};
        obj2.a.self = obj2;

        const result = objectDiff(obj1, obj2);
        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: 1, self: obj1},
                    nextValue: {b: 2, self: obj2},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: 1,
                                nextValue: 2,
                                diff: undefined,
                            },
                            self: {
                                propertyName: 'self',
                                prevValue: obj1,
                                nextValue: obj2,
                                diff: {
                                    type: 'circular reference',
                                },
                            },
                        },
                    },
                },
            },
        });
    });
});

describe('objectDiff - 自定义匹配器', () => {
    it('使用 deepMatchers 按 name 属性匹配', () => {
        const customNameMatcher = [
            (a: any, b: any): boolean => {
                if (
                    typeof a === 'object' &&
                    typeof b === 'object' &&
                    'name' in a &&
                    typeof a.name === 'string' &&
                    'name' in b &&
                    typeof b.name === 'string'
                )
                    return a.name === b.name;
                return false;
            },
        ];

        const result = objectDiff(
            {
                a: [
                    {
                        name: 'item1',
                        value: 'value1',
                        nestArray: [
                            {
                                name: 'item1-1',
                                value: 'value1-1',
                            },
                        ],
                    },
                ],
            },
            {
                a: [
                    {
                        name: 'item1',
                        value: 'new value',
                        nestArray: [
                            {
                                name: 'item1-2',
                                value: 'value1-2',
                            },
                            {
                                name: 'item1-1',
                                value: 'new value',
                            },
                        ],
                    },
                ],
            },
            {
                deepMatchers: customNameMatcher,
            },
        );

        assert(result.type === 'object');
        assert(result.updated?.a?.diff?.updated?.[0]?.diff?.type === 'object');

        const nestArrayDiff: ArrayDiff<{
            name: string;
            value: string;
        }> = {
            type: 'array',
            added: [
                {
                    data: {
                        name: 'item1-2',
                        value: 'value1-2',
                    },
                    nextIndex: 0,
                },
            ],
            deleted: [],
            equals: [],
            moved: [],
            updated: [
                {
                    prevData: {
                        name: 'item1-1',
                        value: 'value1-1',
                    },
                    prevIndex: 0,
                    nextData: {
                        name: 'item1-1',
                        value: 'new value',
                    },
                    nextIndex: 1,
                    diff: {
                        type: 'object',
                        equals: {
                            name: {
                                propertyName: 'name',
                                value: 'item1-1',
                            },
                        },
                        updated: {
                            value: {
                                propertyName: 'value',
                                prevValue: 'value1-1',
                                nextValue: 'new value',
                                diff: undefined,
                            },
                        },
                    },
                },
            ],
        };

        expect(result.updated?.a?.diff?.updated?.[0]?.diff?.updated?.nestArray?.diff).toStrictEqual(
            nestArrayDiff,
        );
    });
});

describe('objectDiff - depth参数', () => {
    it('depth 为 0 时不进行深层比较', () => {
        const obj1 = {a: {b: 1}};
        const obj2 = {a: {b: 2}};

        const result = objectDiff(obj1, obj2, {depth: 0});

        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: 1},
                    nextValue: {b: 2},
                    diff: undefined,
                },
            },
        });
    });

    it('depth 为 1 时进行一层深层比较', () => {
        const obj1 = {a: {b: 1}};
        const obj2 = {a: {b: 2}};

        const result = objectDiff(obj1, obj2, {depth: 1});

        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: 1},
                    nextValue: {b: 2},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: 1,
                                nextValue: 2,
                                diff: undefined,
                            },
                        },
                    },
                },
            },
        });
    });

    it('depth 为 2 时进行两层深层比较', () => {
        const obj1 = {a: {b: {c: 1}}};
        const obj2 = {a: {b: {c: 2}}};

        const result = objectDiff(obj1, obj2, {depth: 2});

        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: {c: 1}},
                    nextValue: {b: {c: 2}},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: {c: 1},
                                nextValue: {c: 2},
                                diff: {
                                    type: 'object',
                                    updated: {
                                        c: {
                                            propertyName: 'c',
                                            prevValue: 1,
                                            nextValue: 2,
                                            diff: undefined,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    });

    it('depth 不足时深层对象不展开 diff', () => {
        const obj1 = {a: {b: {c: 1}}};
        const obj2 = {a: {b: {c: 2}}};

        const result = objectDiff(obj1, obj2, {depth: 1});

        expect(result).toStrictEqual({
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: {c: 1}},
                    nextValue: {b: {c: 2}},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: {c: 1},
                                nextValue: {c: 2},
                                diff: undefined,
                            },
                        },
                    },
                },
            },
        });
    });

    it('depth 为 null/undefined 时进行无限深层比较', () => {
        const obj1 = {a: {b: {c: {d: 1}}}};
        const obj2 = {a: {b: {c: {d: 2}}}};

        const excepted = {
            type: 'object',
            updated: {
                a: {
                    propertyName: 'a',
                    prevValue: {b: {c: {d: 1}}},
                    nextValue: {b: {c: {d: 2}}},
                    diff: {
                        type: 'object',
                        updated: {
                            b: {
                                propertyName: 'b',
                                prevValue: {c: {d: 1}},
                                nextValue: {c: {d: 2}},
                                diff: {
                                    type: 'object',
                                    updated: {
                                        c: {
                                            propertyName: 'c',
                                            prevValue: {d: 1},
                                            nextValue: {d: 2},
                                            diff: {
                                                type: 'object',
                                                updated: {
                                                    d: {
                                                        propertyName: 'd',
                                                        prevValue: 1,
                                                        nextValue: 2,
                                                        diff: undefined,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        }

        const nullResult = objectDiff(obj1, obj2, {depth: null});
        expect(nullResult).toStrictEqual(excepted);
        const undefinedResult = objectDiff(obj1, obj2, {depth: undefined});
        expect(undefinedResult).toStrictEqual(excepted);
    });

    it('嵌套数组受 depth 限制', () => {
        const obj1 = {items: [{a: {b: 1}}]};
        const obj2 = {items: [{a: {b: 2}}]};

        const result = objectDiff(obj1, obj2, {
            depth: 2,
            deepMatchers: [() => true],
        });

        assert(result.type === 'object');
        assert(result.updated?.items?.diff?.type === 'array');
        assert(result.updated?.items?.diff?.updated?.[0]?.diff?.type === 'object');
        expect(result.updated.items.diff.updated[0].diff.updated?.a).toStrictEqual({
            propertyName: 'a',
            prevValue: {b: 1},
            nextValue: {b: 2},
            diff: undefined,
        });
    });
});
