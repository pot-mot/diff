# @potmot/diff

简单的差异对比工具库，支持对象、数组的差异分析。

## 功能特性

- ✨ 深度相等比较 (`deepEquals`)
- 📊 对象差异分析 (`objectDiff`)
- 📋 数组差异分析 (`arrayDiff`)
- 🔁 循环引用检测
- 📤 TypeScript 类型支持

## 安装

```bash
npm install @potmot/diff
```

```bash
yarn add @potmot/diff
```

```bash
pnpm add @potmot/diff
```

## 使用方法

### 1. deepEquals - 深度相等比较

用于深度比较两个值是否相等，支持对象、数组和嵌套结构。

```typescript
import { deepEquals } from '@potmot/diff';

// 基本类型比较
deepEquals(1, 1);                    // true
deepEquals('hello', 'world');        // false

// 对象比较
deepEquals({ a: 1, b: 2 }, { a: 1, b: 2 });  // true
deepEquals({ a: 1 }, { a: 1, b: 2 });        // false

// 嵌套对象比较
deepEquals({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } });  // true

// 数组比较
deepEquals([1, 2, 3], [1, 2, 3]);    // true
deepEquals([1, 2], [1, 2, 3]);       // false
```

### 2. objectDiff - 对象差异分析

比较两个对象的差异，返回新增、删除和更新的属性。

```typescript
import { objectDiff } from '@potmot/diff';

// 基本使用
const oldObj = { a: 1, b: 2, c: 3 };
const newObj = { a: 1, b: 4, d: 5 };

const result = objectDiff(oldObj, newObj);
/*
result = {
  type: 'object',
  deleted: {
    c: { propertyName: 'c', value: 3 }
  },
  added: {
    d: { propertyName: 'd', value: 5 }
  },
  updated: {
    b: {
      propertyName: 'b',
      prevValue: 2,
      nextValue: 4,
      diff: undefined
    }
  }
}
*/

// 嵌套对象比较
const oldUser = {
  name: 'John',
  address: {
    city: 'Beijing',
    zip: '100000'
  }
};

const newUser = {
  name: 'John',
  address: {
    city: 'Shanghai',
    zip: '100000'
  }
};

const diff = objectDiff(oldUser, newUser);
/*
diff = {
  type: 'object',
  updated: {
    address: {
      propertyName: 'address',
      prevValue: { city: 'Beijing', zip: '100000' },
      nextValue: { city: 'Shanghai', zip: '100000' },
      diff: {
        type: 'object',
        updated: {
          city: {
            propertyName: 'city',
            prevValue: 'Beijing',
            nextValue: 'Shanghai',
            diff: undefined
          }
        }
      }
    }
  }
}
*/

// 处理 null/undefined
objectDiff(null, { a: 1 });  // 所有属性都是新增
objectDiff({ a: 1 }, null);  // 所有属性都是删除
```

### 3. arrayDiff - 数组差异分析

比较两个数组的差异，支持元素新增、删除、更新和移动检测。

```typescript
import { arrayDiff } from '@potmot/diff';

// 定义匹配函数（用于识别同一元素）
const matchById = (a, b) => a.id === b.id;

const oldList = [
  { id: 1, name: 'Item 1', value: 'A' },
  { id: 2, name: 'Item 2', value: 'B' },
  { id: 3, name: 'Item 3', value: 'C' }
];

const newList = [
  { id: 2, name: 'Item 2', value: 'B' },           // 相等
  { id: 1, name: 'Item 1', value: 'A Updated' },   // 更新
  { id: 4, name: 'Item 4', value: 'D' }            // 新增
  // id: 3 被删除
];

const result = arrayDiff(oldList, newList, [matchById]);
/*
result = {
  type: 'array',
  added: [
    { data: { id: 4, name: 'Item 4', value: 'D' }, nextIndex: 2 }
  ],
  updated: [
    {
      prevData: { id: 1, name: 'Item 1', value: 'A' },
      prevIndex: 0,
      nextData: { id: 1, name: 'Item 1', value: 'A Updated' },
      nextIndex: 1,
      diff: {
        type: 'object',
        updated: {
          value: {
            propertyName: 'value',
            prevValue: 'A',
            nextValue: 'A Updated',
            diff: undefined
          }
        }
      }
    }
  ],
  deleted: [
    { data: { id: 3, name: 'Item 3', value: 'C' }, prevIndex: 2 }
  ],
  moved: [
    { data: { id: 2, name: 'Item 2', value: 'B' }, prevIndex: 1, nextIndex: 0 }
  ],
  equals: []
}
*/
```

### 4. 高级用法

#### 多条件匹配

```typescript
// 使用多个匹配函数进行更精确的对比
const matchByNameAndValue = [
  (a, b) => a.name === b.name,
  (a, b) => a.value === b.value
];

const result = arrayDiff(oldList, newList, matchByNameAndValue);
```

#### 自定义深度比较函数

```typescript
// 为 objectDiff 提供自定义的深度比较函数
const customDeepMatch = [
  (a, b) => {
    // 如果都有 name 属性，则通过 name 判断是否相等
    if ('name' in a && 'name' in b) {
      return a.name === b.name;
    }
    return false;
  }
];

const result = objectDiff(oldObj, newObj, customDeepMatch);
```

#### 循环引用处理

```typescript
// 自动检测和处理循环引用
const obj1 = { a: 1 };
obj1.self = obj1;  // 循环引用

const obj2 = { a: 2 };
obj2.self = obj2;  // 循环引用

const result = objectDiff(obj1, obj2);
// {
//   type: 'object',
//   updated: {
//     a: { propertyName: 'a', prevValue: 1, nextValue: 2, diff: undefined },
//     self: {
//       propertyName: 'self',
//       prevValue: obj1,
//       nextValue: obj2,
//       diff: { type: 'circular reference' }
//     }
//   }
// }
```

## API 参考

### deepEquals(a: any, b: any): boolean

深度比较两个值是否相等。

**参数：**
- `a` - 第一个值
- `b` - 第二个值

**返回：** `boolean` - 如果两个值深度相等则返回 `true`

---

### objectDiff<T, U>(oldVal: T | undefined | null, newVal: U | undefined | null, options?: DiffOptions): ObjectDiff | CircularReferenceDiff

比较两个对象的差异。

**参数：**
- `oldVal` - 原始对象，可以为 `undefined` 或 `null`
- `newVal` - 新对象，可以为 `undefined` 或 `null`
- `options` - 可选，配置对象，包含以下属性：
  - `depth` - 可选，递归深度限制
  - `deepMatchers` - 可选，自定义深度比较函数列表，默认为 `[deepEquals]`

**返回：** `ObjectDiff | CircularReferenceDiff` - 差异结果对象，可能包含以下属性：
- `type` - 类型为 `'object'` 或 `'circular reference'`
- `added` - 新增的属性集合
- `deleted` - 删除的属性集合
- `updated` - 更新的属性集合
- `equals` - 未变化的属性集合

---

### arrayDiff<T>(prevList: ReadonlyArray<T> | undefined | null, nextList: ReadonlyArray<T> | undefined | null, options?: ArrayDiffOptions<T>): ArrayDiff

比较两个数组的差异。

**参数：**
- `prevList` - 原始数组，可以为 `undefined` 或 `null`
- `nextList` - 新数组，可以为 `undefined` 或 `null`
- `options` - 可选，配置对象，包含以下属性：
  - `depth` - 可选，递归深度限制
  - `matchers` - 可选，匹配函数列表，用于识别同一元素，默认为 `[deepEquals]`
  - `deepMatchers` - 可选，自定义深度比较函数列表，默认为 `[deepEquals]`

**返回：** `ArrayDiff` - 差异结果对象，包含以下属性：
- `type` - 类型为 `'array'`
- `added` - 新增的元素数组
- `updated` - 更新的元素数组
- `deleted` - 删除的元素数组
- `moved` - 移动位置的元素数组
- `equals` - 未变化的元素数组

## 许可证

MIT
