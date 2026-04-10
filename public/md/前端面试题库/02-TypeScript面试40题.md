# TypeScript 面试 40 题

> 基于 TypeScript 体系学习整理，覆盖基础类型、泛型、类型体操、高级类型及 React + TS 实战

---

## 目录

- [一、基础类型与接口（8题）](#一基础类型与接口)
- [二、泛型深入（8题）](#二泛型深入)
- [三、类型体操（8题）](#三类型体操)
- [四、高级类型（8题）](#四高级类型)
- [五、React + TS 实战（8题）](#五react--ts-实战)
- [高频考点速查表](#高频考点速查表)

---

## 一、基础类型与接口

### Q1: any、unknown、never、void 的区别是什么？

**难度**: ⭐

**答案**: `any` 跳过类型检查可赋值给任何类型；`unknown` 是类型安全的 any，使用前必须类型检查；`never` 表示永远不会返回或不可达的类型；`void` 表示无返回值的函数。

**解析**:
```typescript
let anything: any = 42;
anything = "string"; // OK
let num: number = anything; // OK（危险）

let something: unknown = 42;
// let num2: number = something; // 错误
if (typeof something === "number") {
  let num2: number = something; // OK
}

function error(msg: string): never { throw new Error(msg); }
function log(msg: string): void { console.log(msg); }
```

**面试技巧**: 优先使用 `unknown` 替代 `any`，`never` 常用于穷举检查。

---

### Q2: interface 和 type 有什么区别？什么时候用哪个？

**难度**: ⭐⭐

**答案**: interface 支持合并声明和 extends；type 支持联合类型、交叉类型、映射类型、元组等。定义对象结构用 interface，定义联合类型/工具类型用 type。

**解析**:
```typescript
// interface 合并声明
interface Box { height: number; }
interface Box { width: number; }
const box: Box = { height: 10, width: 20 }; // 自动合并

// type 不支持合并
// type Box = { height: number; }
// type Box = { width: number; } // 错误

// type 支持联合类型
type ID = number | string;
type Status = 'active' | 'inactive';

// type 支持映射类型
type Readonly<T> = { readonly [K in keyof T]: T[K]; };
```

| 特性 | interface | type |
|------|-----------|------|
| 扩展 | extends | & 交叉 |
| 合并声明 | 支持 | 不支持 |
| 联合类型 | 不适合 | 适合 |
| 映射类型 | 不支持 | 支持 |

---

### Q3: 什么是类型守卫（Type Guard）？有哪些形式？

**难度**: ⭐⭐

**答案**: 类型守卫是在运行时检查类型的方式，缩小类型范围。形式包括：typeof、instanceof、in、自定义类型谓词（`is`）、字面量类型守卫。

**解析**:
```typescript
// typeof
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") return Array(padding + 1).join(" ") + value;
  return padding + value;
}

// instanceof
class Bird { fly() {} }
class Fish { swim() {} }
function move(animal: Bird | Fish) {
  if (animal instanceof Bird) animal.fly();
  else animal.swim();
}

// 自定义类型守卫
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

// in
if ('fly' in animal) animal.fly();
```

---

### Q4: 什么是泛型？如何使用泛型约束？

**难度**: ⭐⭐

**答案**: 泛型是类型参数化，允许在定义时不指定具体类型，使用时再传入。泛型约束通过 `extends` 限制类型参数的范围。

**解析**:
```typescript
// 基本泛型
function identity<T>(arg: T): T { return arg; }
identity<string>("hello");
identity(42); // 自动推断

// 泛型约束
interface HasLength { length: number; }
function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}
logLength("hello"); // OK
logLength([1, 2, 3]); // OK
// logLength(123); // 错误

// 多个泛型参数
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}
```

---

### Q5: TypeScript 中 enum 有哪些类型？各有什么特点？

**难度**: ⭐

**答案**: 数字枚举（可反向映射）、字符串枚举（无反向映射）、常量枚举（编译时内联，无运行时代码）。

**解析**:
```typescript
// 数字枚举（支持反向映射）
enum Direction { Up, Down, Left, Right }
console.log(Direction.Up);    // 0
console.log(Direction[0]);    // "Up"

// 字符串枚举（无反向映射）
enum DirectionStr {
  Up = "UP", Down = "DOWN"
}

// 常量枚举（编译时内联）
const enum ConstDir { Up, Down }
let dir = ConstDir.Up; // 编译后: let dir = 0;
```

---

### Q6: 什么是声明文件（.d.ts）？有什么作用？

**难度**: ⭐⭐

**答案**: 声明文件用于描述 JavaScript 库的类型信息，不包含实现代码。作用：为 JS 库提供类型提示、扩展全局类型、模块类型声明。

**解析**:
```typescript
// 声明全局变量
declare const jQuery: (selector: string) => HTMLElement;

// 声明模块
declare module 'lodash' {
  export function debounce(fn: Function, wait: number): Function;
}

// 声明全局类型扩展
declare global {
  interface Window {
    myCustomProperty: string;
  }
}

// @types/xxx — 社区维护的类型声明
// npm install @types/lodash
```

---

### Q7: 什么是类型断言？as 和非空断言有什么区别？

**难度**: ⭐

**答案**: 类型断言告诉编译器"我知道这个类型"，不做运行时检查。`as` 是类型转换断言，`!` 是非空断言（排除 null/undefined）。

**解析**:
```typescript
// as 断言
let someValue: unknown = "this is a string";
let strLength: number = (someValue as string).length;

// 非空断言
function fixed(name: string | null): string {
  return name!; // 告诉 TS name 不是 null
}

// 注意：断言不等于类型转换
// const num = "hello" as number; // 错误
// 需要先断言为 unknown 再断言为目标类型
const num = "hello" as unknown as number; // 可以但不推荐
```

---

### Q8: TypeScript 中函数重载如何实现？

**难度**: ⭐⭐

**答案**: TypeScript 的函数重载是通过提供多个函数签名（overload signatures）加一个实现签名来实现的。

**解析**:
```typescript
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: number | string, b: number | string): number | string {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  return a.toString() + b.toString();
}

add(1, 2);       // number
add('a', 'b');   // string
// add(1, 'b');   // 错误

// 实现签名对外不可见，只展示重载签名
```

---

## 二、泛型深入

### Q9: 泛型函数的类型推断规则是什么？

**难度**: ⭐⭐

**答案**: TypeScript 从传入的实参推断泛型类型，推断规则包括：从函数参数推断、从返回值推断、从上下文推断。当推断失败时使用默认类型或报错。

**解析**:
```typescript
function createPair<S, T>(first: S, second: T): [S, T] {
  return [first, second];
}
const pair = createPair(1, 'hello'); // 推断为 [number, string]

// 泛型默认值
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}
createArray(3, 'a'); // string[]
createArray(3, 1);   // number[]

// 从上下文推断
const fn: <T>(x: T) => T = (x) => x; // T 从上下文推断
```

---

### Q10: 泛型接口和泛型类如何使用？

**难度**: ⭐⭐

**答案**: 泛型接口在接口名后声明类型参数，泛型类在类名后声明类型参数。

**解析**:
```typescript
// 泛型接口
interface Repository<T> {
  findById(id: string): Promise<T>;
  findAll(): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

interface User { id: string; name: string; }
const userRepo: Repository<User> = { /* 实现 */ };

// 泛型类
class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
}

const numberStack = new Stack<number>();
numberStack.push(1);
```

---

### Q11: 什么是条件类型？如何使用？

**难度**: ⭐⭐

**答案**: 条件类型 `T extends U ? X : Y` 根据类型关系选择不同的类型，类似三元表达式。常与 `infer` 结合使用。

**解析**:
```typescript
type IsString<T> = T extends string ? true : false;
type A = IsString<'hello'>;  // true
type B = IsString<42>;        // false

// 分布式条件类型（联合类型会自动分发）
type ToArray<T> = T extends any ? T[] : never;
type C = ToArray<string | number>; // string[] | number[]

// 禁止分发：用 [T] 包裹
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type D = ToArrayNonDist<string | number>; // (string | number)[]
```

---

### Q12: 什么是映射类型？如何使用？

**难度**: ⭐⭐

**答案**: 映射类型通过遍历联合类型（keyof）创建新类型，可以添加修饰符（readonly、?、-readonly、-?）。

**解析**:
```typescript
// 基本映射
type Readonly<T> = { readonly [K in keyof T]: T[K]; };
type Optional<T> = { [K in keyof T]?: T[K]; };

// 移除 readonly
type Mutable<T> = { -readonly [K in keyof T]: T[K]; };

// 移除可选
type Required<T> = { [K in keyof T]-?: T[K]; };

// 结合条件类型
type Pick<T, K extends keyof T> = { [P in K]: T[P]; };
type Omit<T, K extends keyof T> = { [P in Exclude<keyof T, K>]: T[P]; };

// 实际使用
interface User { id: number; name: string; age?: number; }
type ReadonlyUser = Readonly<User>;
type RequiredUser = Required<User>;
```

---

### Q13: 什么是 infer 关键字？有什么用？

**难度**: ⭐⭐⭐

**答案**: `infer` 在条件类型中推断类型变量，只能在 `extends` 子句中使用。常用于提取函数返回值类型、数组元素类型、Promise 内部类型等。

**解析**:
```typescript
// 提取函数返回值类型
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Fn = () => string;
type R = ReturnType<Fn>; // string

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type P = UnwrapPromise<Promise<string>>; // string

// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;
type E = ElementType<string[]>; // string

// 提取函数参数类型
type FirstParam<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
type FP = FirstParam<(a: string, b: number) => void>; // string
```

---

### Q14: 泛型工具类型 Partial、Required、Pick、Omit 的实现原理？

**难度**: ⭐⭐

**答案**: 都是基于映射类型和条件类型实现的。

**解析**:
```typescript
// Partial — 所有属性变可选
type Partial<T> = { [K in keyof T]?: T[K]; };

// Required — 所有属性变必选
type Required<T> = { [K in keyof T]-?: T[K]; };

// Pick — 选取部分属性
type Pick<T, K extends keyof T> = { [P in K]: T[P]; };

// Omit — 排除部分属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Record — 构造键值对类型
type Record<K extends string | number | symbol, T> = { [P in K]: T };

// 使用示例
interface User { id: number; name: string; age: number; email: string; }
type UserPreview = Pick<User, 'id' | 'name'>;
type UserWithoutEmail = Omit<User, 'email'>;
```

---

### Q15: 泛型中的 keyof 操作符有什么用？

**难度**: ⭐⭐

**答案**: `keyof T` 获取类型 T 的所有公共属性名组成的联合类型，常用于映射类型和泛型约束。

**解析**:
```typescript
interface User { id: number; name: string; age: number; }
type UserKeys = keyof User; // 'id' | 'name' | 'age'

// 泛型约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user: User = { id: 1, name: '张三', age: 25 };
getProperty(user, 'name'); // string
// getProperty(user, 'email'); // 错误

// 获取值的类型
type UserValues = User[keyof User]; // number | string
```

---

### Q16: 什么是协变和逆变？

**难度**: ⭐⭐⭐

**答案**: 协变（Covariant）子类型可以赋值给父类型（如 `Dog[]` 赋给 `Animal[]`）；逆变（Contravariant）父类型可以赋值给子类型（如函数参数）。TypeScript 中函数参数默认是双变的（bivariant），开启 `strictFunctionTypes` 后是逆变的。

**解析**:
```typescript
// 协变 — 数组
class Animal { name: string; }
class Dog extends Animal { breed: string; }
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs; // OK（协变）

// 逆变 — 函数参数
type Fn = (a: Animal) => void;
let fn1: Fn = (a: Dog) => {}; // OK（逆变，接受更具体的参数）
// let fn2: Fn = (a: Object) => {}; // 开启 strictFunctionTypes 后报错

// 不变（Invariant）— 既不协变也不逆变
interface Box<T> { value: T; }
let box1: Box<Dog> = { value: new Dog() };
// let box2: Box<Animal> = box1; // 错误（不变）
```

---

## 三、类型体操

### Q17: 手写 DeepReadonly

**难度**: ⭐⭐⭐

**答案**: 递归地将对象的所有属性（包括嵌套对象）变为 readonly。

**解析**:
```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface Obj {
  a: string;
  b: { c: number; d: { e: boolean } };
  fn: () => void;
}

type ReadonlyObj = DeepReadonly<Obj>;
// { readonly a: string; readonly b: { readonly c: number; readonly d: { readonly e: boolean } }; fn: () => void; }
```

---

### Q18: 手写 Partial、Required

**难度**: ⭐⭐

**答案**: Partial 将所有属性变可选，Required 将所有属性变必选。

**解析**:
```typescript
// Partial
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// Required
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};

// 测试
interface User { id: number; name: string; age: number; }
type PartialUser = MyPartial<User>; // { id?: number; name?: string; age?: number; }
type RequiredUser = MyRequired<PartialUser>; // { id: number; name: string; age: number; }
```

---

### Q19: 手写 Pick、Omit

**难度**: ⭐⭐

**答案**: Pick 选取部分属性，Omit 排除部分属性。

**解析**:
```typescript
// Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit
type MyOmit<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]: T[P];
};

// 测试
interface User { id: number; name: string; age: number; email: string; }
type UserPreview = MyPick<User, 'id' | 'name'>; // { id: number; name: string; }
type UserWithoutAge = MyOmit<User, 'age'>; // { id: number; name: string; email: string; }
```

---

### Q20: 手写 Record

**难度**: ⭐⭐

**答案**: Record 构造键值对类型，键类型为 string/number/symbol，值类型为任意类型。

**解析**:
```typescript
type MyRecord<K extends string | number | symbol, T> = {
  [P in K]: T;
};

// 测试
type PageInfo = MyRecord<'title' | 'content', string>;
// { title: string; content: string; }

type RoleMap = MyRecord<string, number>;
// { [key: string]: number; }
```

---

### Q21: 手写 Exclude、Extract

**难度**: ⭐⭐

**答案**: Exclude 从联合类型中排除指定类型，Extract 从联合类型中提取指定类型。

**解析**:
```typescript
// Exclude
type MyExclude<T, U> = T extends U ? never : T;

// Extract
type MyExtract<T, U> = T extends U ? T : never;

// 测试
type T0 = MyExclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
type T1 = MyExtract<'a' | 'b' | 'c', 'a' | 'f'>; // 'a'
```

---

### Q22: 手写 ReturnType

**难度**: ⭐⭐

**答案**: 提取函数的返回值类型，使用 `infer` 推断。

**解析**:
```typescript
type MyReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : any;

// 测试
type Fn1 = () => string;
type Fn2 = (x: number) => boolean;
type R1 = MyReturnType<Fn1>; // string
type R2 = MyReturnType<Fn2>; // boolean
type R3 = MyReturnType<typeof Promise.resolve>; // Promise<unknown>
```

---

### Q23: 手写 PromiseType（提取 Promise 内部类型）

**难度**: ⭐⭐⭐

**答案**: 使用递归条件类型 + infer 提取。

**解析**:
```typescript
type PromiseType<T> = T extends Promise<infer U> ? PromiseType<U> : T;

// 测试
type P1 = PromiseType<Promise<string>>; // string
type P2 = PromiseType<Promise<Promise<number>>>; // number
type P3 = PromiseType<string>; // string
```

---

### Q24: 手写 TupleToUnion（元组转联合类型）

**难度**: ⭐⭐⭐

**答案**: 利用元组的数字索引映射。

**解析**:
```typescript
type TupleToUnion<T extends readonly any[]> = T[number];

// 测试
type T1 = TupleToUnion<['a', 'b', 'c']>; // 'a' | 'b' | 'c'
type T2 = TupleToUnion<[1, 2, 3]>; // 1 | 2 | 3
```

---

## 四、高级类型

### Q25: 什么是模板字面量类型？

**难度**: ⭐⭐

**答案**: 模板字面量类型通过模板字符串语法组合和操作字符串类型，支持字符串模式匹配。

**解析**:
```typescript
type EventName = 'click' | 'focus' | 'blur';
type HandlerName = `on${Capitalize<EventName>}`;
// 'onClick' | 'onFocus' | 'onBlur'

// 字符串模式匹配
type Email = `${string}@${string}.${string}`;
const email: Email = 'test@example.com'; // OK
// const bad: Email = 'not-an-email'; // 错误

// Uppercase / Lowercase / Capitalize / Uncapitalize
type Greeting = 'hello world';
type Upper = Uppercase<Greeting>; // 'HELLO WORLD'
type Cap = Capitalize<Greeting>; // 'Hello world'

// 实际应用：CSS 属性类型
type CSSProperty = `${string}-${string}`;
```

---

### Q26: satisfies 操作符有什么用？

**难度**: ⭐⭐

**答案**: `satisfies`（TS 4.9+）验证表达式是否符合某个类型，但不改变表达式的推断类型。解决了类型断言丢失精确类型信息的问题。

**解析**:
```typescript
// 问题：as 断言会丢失精确类型
const colors = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255],
} as Record<string, string[] | string>;
// colors.green 被推断为 string[] | string，丢失了精确类型

// 解决：satisfies 保留精确类型
const colors2 = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255],
} satisfies Record<string, string[] | string>;
// colors2.green 仍然是 '#00ff00'（精确类型）
// colors2.red   仍然是 [255, 0, 0]（精确类型）
```

---

### Q27: as const 有什么用？

**难度**: ⭐⭐

**答案**: `as const` 将值推断为最窄的字面量类型（readonly），常用于常量定义和精确类型推断。

**解析**:
```typescript
// 默认推断
const config = {
  api: 'https://api.example.com',
  timeout: 3000,
  retries: 3,
};
// config.api 的类型是 string（不是字面量）

// as const 推断
const config2 = {
  api: 'https://api.example.com',
  timeout: 3000,
  retries: 3,
} as const;
// config2.api 的类型是 'https://api.example.com'
// config2.timeout 的类型是 3000

// 数组
const arr = [1, 2, 3] as const; // readonly [1, 2, 3]
// arr.push(4); // 错误
```

---

### Q28: 什么是装饰器（Decorator）？有哪些类型？

**难度**: ⭐⭐⭐

**答案**: 装饰器是一种特殊声明，可以附加到类、方法、属性、参数上，用于修改行为。TS 5.0+ 使用 TC39 标准装饰器。

**解析**:
> 以下为旧版实验性装饰器语法（--experimentalDecorators），TC39 标准装饰器（TS 5.0+）语法不同

```typescript
function log<T extends { new (...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      console.log(`Creating instance of ${constructor.name}`);
      super(...args);
    }
  };
}

@log
class MyClass {}

// 方法装饰器
function measure(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    const start = performance.now();
    const result = original.apply(this, args);
    console.log(`${propertyKey} took ${performance.now() - start}ms`);
    return result;
  };
}

class Service {
  @measure
  processData(data: any) { /* ... */ }
}
```

---

### Q29: 什么是条件类型中的分布式特性？

**难度**: ⭐⭐⭐

**答案**: 当条件类型作用于联合类型时，会自动分发（Distributive Conditional Types）：`T extends U ? X : Y` 对联合类型 `A | B` 等价于 `(A extends U ? X : Y) | (B extends U ? X : Y)`。

**解析**:
```typescript
// 分布式
type ToArray<T> = T extends any ? T[] : never;
type R1 = ToArray<string | number>; // string[] | number[]

// 非分布式（用元组包裹）
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type R2 = ToArrayNonDist<string | number>; // (string | number)[]

// 实际应用：Exclude
type Exclude<T, U> = T extends U ? never : T;
type R3 = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
```

---

### Q30: 什么是声明合并（Declaration Merging）？

**难度**: ⭐⭐

**答案**: TypeScript 允许同名 interface 自动合并，同名 function 通过重载合并。interface 合并是 TypeScript 独有的特性。

**解析**:
```typescript
// interface 合并
interface Window {
  myProp: string;
}
interface Window {
  myMethod(): void;
}
// 等价于
interface Window {
  myProp: string;
  myMethod(): void;
}

// 函数重载合并
function add(a: number, b: number): number;
function add(a: string, b: string): string;
function add(a: any, b: any): any { return a + b; }

// class 合并（类与命名空间）
class MyClass { /* ... */ }
namespace MyClass {
  export const version = '1.0';
}
```

---

### Q31: 什么是 Utility Types？列举常用的内置工具类型

**难度**: ⭐⭐

**答案**: TypeScript 内置的工具类型用于常见类型转换。

**解析**:
```typescript
// Partial<T> — 所有属性可选
// Required<T> — 所有属性必选
// Readonly<T> — 所有属性只读
// Pick<T, K> — 选取部分属性
// Omit<T, K> — 排除部分属性
// Record<K, T> — 构造键值对类型
// Exclude<T, U> — 从联合类型中排除
// Extract<T, U> — 从联合类型中提取
// NonNullable<T> — 排除 null 和 undefined
// ReturnType<T> — 提取函数返回值类型
// Parameters<T> — 提取函数参数类型
// Awaited<T> — 提取 Promise 解析后的类型

// Parameters 示例
type Params = Parameters<(a: string, b: number) => void>;
// [a: string, b: number]

// NonNullable 示例
type T = NonNullable<string | null | undefined>; // string
```

---

### Q32: 什么是 ThisType？

**难度**: ⭐⭐⭐

**答案**: `ThisType<T>` 是一个工具类型，用于在对象字面量中指定 this 的类型，常与对象方法配合使用。

**解析**:
```typescript
// ThisType 需要开启 noImplicitThis
function makeObject<T>(obj: T & ThisType<{ count: number; increment: () => void }>): T & { count: number; increment: () => void } {
  return obj as any;
}

const obj = makeObject({
  count: 0,
  increment() {
    this.count++; // this 被正确推断为 { count: number; increment: () => void }
  },
});

obj.increment();
console.log(obj.count); // 1
```

---

## 五、React + TS 实战

### Q33: React 组件的 Props 和 State 如何定义类型？

**难度**: ⭐⭐

**答案**: 使用 interface 或 type 定义 Props，使用泛型 useState 定义 State。函数组件使用 `React.FC` 或直接标注参数类型。

**解析**:
```tsx
// 方式1：interface 定义 Props
interface ButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

// 方式2：直接标注参数类型（推荐）
function Button({ label, onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}

// State 类型
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState<boolean>(false);

// React.FC 的缺点：隐式包含 children，泛型使用不便
const MyComponent: React.FC<{ title: string }> = ({ title }) => <h1>{title}</h1>;
```

---

### Q34: 如何为事件处理函数定义类型？

**难度**: ⭐⭐

**答案**: React 提供了丰富的事件类型，如 `React.ChangeEvent`、`React.FormEvent`、`React.MouseEvent` 等。

**解析**:
```tsx
// 表单事件
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// 鼠标事件
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.clientX, e.clientY);
};

// 键盘事件
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') { /* ... */ }
};

// 自定义事件
interface CustomEvent {
  detail: { id: string; action: string };
}
const handleCustom = (e: CustomEvent) => { /* ... */ };
```

---

### Q35: 如何为 useRef 定义类型？

**难度**: ⭐⭐

**答案**: `useRef<T>` 的泛型参数指定 ref 的类型。DOM ref 使用 `HTMLXxxElement`，普通值使用具体类型。

**解析**:
```tsx
// DOM ref
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []);

// 可变值 ref
const timerRef = useRef<number | null>(null);
const countRef = useRef(0);

// 泛型组件中的 ref
interface ListProps<T> {
  items: T[];
  ref?: React.RefObject<HTMLDivElement>;
}
function List<T>({ items, ref }: ListProps<T>) {
  return <div ref={ref}>{items.map(String)}</div>;
}
```

---

### Q36: 如何为自定义 Hook 定义类型？

**难度**: ⭐⭐

**答案**: 自定义 Hook 使用泛型参数，返回值类型通过 TypeScript 自动推断或显式标注。

**解析**:
```tsx
// 泛型自定义 Hook
function useFetch<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// 使用
interface User { id: number; name: string; }
const { data, loading } = useFetch<User>('/api/user');
```

---

### Q37: 如何处理 React 中的泛型组件？

**难度**: ⭐⭐⭐

**答案**: React 组件可以使用泛型，但 JSX 中不能直接传递泛型参数，需要通过工厂函数或 Props 传递。

**解析**:
```tsx
// 方式1：工厂函数
function List<T>({ items, renderItem }: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return <ul>{items.map(renderItem)}</ul>;
}

// 使用
const NumberList = List as <T>(props: {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) => React.ReactElement;

<NumberList items={[1, 2, 3]} renderItem={n => <li>{n}</li>} />

// 方式2：通过 Props 传递类型
interface GenericListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}
function GenericList<T extends { id: string | number }>({ items, renderItem }: GenericListProps<T>) {
  return <ul>{items.map(item => <li key={item.id}>{renderItem(item)}</li>)}</ul>;
}
```

---

### Q38: 如何为 Context 定义类型？

**难度**: ⭐⭐

**答案**: 使用 `createContext<T>` 指定 Context 的类型，Provider 的 value 必须匹配。

**解析**:
```tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// 自定义 Hook 安全使用 Context
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

---

### Q39: 如何为 Redux 定义类型？

**难度**: ⭐⭐⭐

**答案**: 使用 TypeScript 定义 Action 类型、State 类型、Reducer 类型，利用 discriminated union 确保类型安全。

**解析**:
```typescript
// Action Types
interface IncrementAction { type: 'counter/increment'; payload: number; }
interface DecrementAction { type: 'counter/decrement'; payload: number; }
type CounterAction = IncrementAction | DecrementAction;

// State
interface CounterState { count: number; }

// Reducer
function counterReducer(state: CounterState = { count: 0 }, action: CounterAction): CounterState {
  switch (action.type) {
    case 'counter/increment': return { count: state.count + action.payload };
    case 'counter/decrement': return { count: state.count - action.payload };
    default: return state;
  }
}

// Typed Hooks (with @reduxjs/toolkit)
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
const counterSlice = createSlice({
  name: 'counter',
  initialState: { count: 0 },
  reducers: {
    increment: (state, action: PayloadAction<number>) => { state.count += action.payload; },
  },
});
```

---

### Q40: TypeScript 中如何实现类型安全的路由参数？

**难度**: ⭐⭐⭐

**答案**: 利用模板字面量类型和泛型参数定义路由参数类型。

**解析**:
```typescript
// 路由参数类型
type RouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof RouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : {};

type UserRoute = '/users/:id';
type UserParams = RouteParams<UserRoute>; // { id: string }

type PostRoute = '/users/:userId/posts/:postId';
type PostParams = RouteParams<PostRoute>; // { userId: string; postId: string }

// 使用
function navigate<Route extends string>(
  path: Route,
  params: RouteParams<Route>
): string {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

navigate('/users/:id', { id: '123' }); // '/users/123'
// navigate('/users/:id', {}); // 类型错误
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| 基础类型 | ★★★★★ | any vs unknown, interface vs type, 类型守卫 |
| 泛型 | ★★★★★ | 泛型约束 extends, 泛型工具类型, infer |
| 类型体操 | ★★★★ | Partial/Required/Pick/Omit/Record/Exclude/ReturnType |
| 条件类型 | ★★★★ | extends ? : , 分布式特性, infer |
| 映射类型 | ★★★★ | in keyof, readonly/-readonly, ?/-? |
| 模板字面量类型 | ★★★ | 字符串模式匹配, Capitalize/Uppercase |
| as const / satisfies | ★★★ | 精确类型推断, 不丢失类型信息 |
| React + TS | ★★★★ | Props 类型, 事件类型, useRef/useContext 泛型 |
| 声明文件 | ★★★ | .d.ts, declare, @types |
| 协变逆变 | ★★★ | 函数参数逆变, 数组协变, strictFunctionTypes |
