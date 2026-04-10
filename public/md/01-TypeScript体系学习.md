# TypeScript体系学习

> 面向3-5年经验的全栈开发者 TypeScript 面试指南

## 目录

1. [基础类型与类型注解](#1-基础类型与类型注解)
2. [接口与类型别名](#2-接口与类型别名)
3. [函数类型](#3-函数类型)
4. [泛型深入](#4-泛型深入)
5. [内置工具类型](#5-内置工具类型)
6. [类与装饰器](#6-类与装饰器)
7. [模块与命名空间](#7-模块与命名空间)
8. [TypeScript配置](#8-typescript配置)
9. [React + TypeScript实践](#9-react--typescript实践)
10. [Node.js + TypeScript实践](#10-nodejs--typescript实践)
11. [常见面试题TOP 20](#11-常见面试题top-20)

---

## 1. 基础类型与类型注解

### 1.1 原始类型（Primitive Types）

TypeScript支持JavaScript的所有原始类型，并提供了类型注解功能。

#### 基本原始类型

```typescript
// 字符串
let name: string = "张三";
let template: string = `Hello ${name}`;

// 数字
let age: number = 25;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

// 布尔值
let isActive: boolean = true;
let isDone: boolean = false;

// null 和 undefined
let nothing: null = null;
let notDefined: undefined = undefined;

// symbol
let sym: symbol = Symbol("key");

// bigint
let big: bigint = 100n;
```

#### 特殊类型

```typescript
// any - 任意类型，慎用
let anything: any = 42;
anything = "可以是字符串";
anything = { key: "value" };

// unknown - 类型安全的any
let value: unknown = 42;
// value.toFixed(); // 错误：Object is of type 'unknown'
if (typeof value === "number") {
  value.toFixed(); // 正确
}

// never - 永不存在的类型
function error(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// void - 无返回值
function log(message: string): void {
  console.log(message);
}
```

### 1.2 数组类型

```typescript
// 类型 + 方括号
let numbers: number[] = [1, 2, 3, 4, 5];
let strings: string[] = ["a", "b", "c"];

// 数组泛型
let numbers2: Array<number> = [1, 2, 3];
let strings2: Array<string> = ["a", "b", "c"];

// 只读数组
const readonlyNumbers: ReadonlyArray<number> = [1, 2, 3];
// readonlyNumbers[0] = 4; // 错误

// 联合类型数组
let mixed: (number | string)[] = [1, "two", 3, "four"];
```

### 1.3 元组类型（Tuple）

元组允许表示一个已知元素数量和类型的数组。

```typescript
// 基本元组
let tuple: [string, number] = ["hello", 10];

// 访问元素
tuple[0]; // "hello"
tuple[1]; // 10

// 可选元素
let optionalTuple: [string, number?] = ["hello"];
optionalTuple = ["hello", 10];

// 剩余元素
let restTuple: [string, ...number[]] = ["hello", 1, 2, 3];

// 命名元组
let namedTuple: [name: string, age: number] = ["张三", 25];

// 只读元组
const readonlyTuple: readonly [string, number] = ["hello", 10];
// readonlyTuple[0] = "world"; // 错误
```

### 1.4 枚举类型（Enum）

枚举是TypeScript特有的类型，用于定义一组命名常量。

#### 数字枚举

```typescript
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

enum Direction2 {
  Up = 1,
  Down,    // 2
  Left,    // 3
  Right    // 4
}

let dir: Direction = Direction.Up;
console.log(Direction.Up);    // 0
console.log(Direction[0]);   // "Up"
```

#### 字符串枚举

```typescript
enum DirectionString {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

let dirStr: DirectionString = DirectionString.Up;
console.log(DirectionString.Up); // "UP"
```

#### 常量枚举

```typescript
const enum ConstDirection {
  Up,
  Down,
  Left,
  Right
}

let directions = [
  ConstDirection.Up,
  ConstDirection.Down,
  ConstDirection.Left,
  ConstDirection.Right
];
// 编译后会被内联，不会生成枚举代码
```

#### 反向映射

```typescript
enum Enum {
  A
}
let a = Enum.A;           // 0
let nameOfA = Enum[a];    // "A"
```

### 1.5 类型断言

类型断言有两种形式：

```typescript
// 尖括号语法
let someValue: any = "this is a string";
let strLength1: number = (<string>someValue).length;

// as 语法（推荐，在JSX中只能用这个）
let strLength2: number = (someValue as string).length;

// 非空断言操作符
function fixed(name: string | null): string {
  // const postfix: string = name; // 错误
  const postfix: string = name!; // 正确
  return postfix;
}
```

### 1.6 类型守卫

```typescript
// typeof 类型守卫
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  if (typeof padding === "string") {
    return padding + value;
  }
  throw new Error(`Expected string or number, got '${padding}'.`);
}

// instanceof 类型守卫
class Bird {
  fly() { console.log("flying"); }
}
class Fish {
  swim() { console.log("swimming"); }
}

function move(animal: Bird | Fish) {
  if (animal instanceof Bird) {
    animal.fly();
  } else {
    animal.swim();
  }
}

// 自定义类型守卫
interface Fish {
  swim: () => void;
}
interface Bird {
  fly: () => void;
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function getSmallPet(): Fish | Bird {
  return Math.random() > 0.5 ? { swim: () => {} } : { fly: () => {} };
}

let pet = getSmallPet();
if (isFish(pet)) {
  pet.swim();
} else {
  pet.fly();
}
```

### 1.7 联合类型与交叉类型

```typescript
// 联合类型 |
type ID = number | string;

function printId(id: ID) {
  if (typeof id === "string") {
    console.log(id.toUpperCase());
  } else {
    console.log(id);
  }
}

// 交叉类型 &
interface Person {
  name: string;
}
interface Employee {
  employeeId: number;
}

type EmployeePerson = Person & Employee;

const emp: EmployeePerson = {
  name: "张三",
  employeeId: 1001
};
```

### 面试题 Q1

**Q: any、unknown、never、void 的区别是什么？**

**A:**
- `any`: 任意类型，可以赋值给任何类型，也可以被任何类型赋值。会跳过类型检查，慎用。
- `unknown`: 类型安全的any，任何类型都可以赋值给unknown，但unknown不能赋值给其他类型（除了any和unknown）。使用前必须进行类型检查。
- `never`: 永不存在的类型，表示永远不会返回的函数或永远无法到达的代码位置。
- `void`: 表示没有返回值的函数类型。

```typescript
let anything: any = 42;
let something: unknown = 42;
let neverValue: never = (() => { throw new Error(); })();
let voidValue: void = console.log("hello");

// any 可以赋值给任何类型
let num: number = anything; // 正确

// unknown 不能直接赋值给其他类型
// let num2: number = something; // 错误
if (typeof something === "number") {
  let num2: number = something; // 正确
}
```

---

## 2. 接口与类型别名

### 2.1 接口（Interface）

接口是TypeScript中定义对象结构的主要方式。

#### 基本接口定义

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // 可选属性
  readonly createdAt: Date; // 只读属性
}

const user: User = {
  id: 1,
  name: "张三",
  email: "zhangsan@example.com",
  createdAt: new Date()
};

// user.createdAt = new Date(); // 错误：只读属性不能修改
```

#### 函数类型接口

```typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

let mySearch: SearchFunc = function(source: string, subString: string): boolean {
  return source.search(subString) > -1;
};
```

#### 可索引类型

```typescript
// 字符串索引签名
interface StringArray {
  [index: number]: string;
}

let myArray: StringArray = ["Bob", "Fred"];

// 字符串索引
interface StringDictionary {
  [key: string]: string | number;
}

let dict: StringDictionary = {
  name: "张三",
  age: 25
};

// 混合索引
interface MixedDictionary {
  [index: string]: number | string;
  length: number; // 数字索引
  name: string;   // 字符串索引
}
```

### 2.2 类型别名（Type）

类型别名用于给类型起个新名字。

```typescript
// 基本类型别名
type Name = string;
type Age = number;
type Person = {
  name: Name;
  age: Age;
};

// 联合类型别名
type ID = number | string;

// 函数类型别名
type Add = (a: number, b: number) => number;
const add: Add = (a, b) => a + b;

// 泛型类型别名
type Container<T> = { value: T };
const container: Container<number> = { value: 42 };
```

### 2.3 Interface vs Type

| 特性 | Interface | Type |
|------|-----------|------|
| 扩展方式 | extends | 交叉类型 & |
| 合并声明 | 支持 | 不支持 |
| 描述对象 | 适合 | 适合 |
| 描述联合类型 | 不适合 | 适合 |
| 描述元组 | 不适合 | 适合 |
| 映射类型 | 支持（TS 2.1+） | 支持 |
| 泛型 | 支持 | 支持 |

```typescript
// Interface 扩展
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type 扩展
type AnimalType = {
  name: string;
};
type DogType = AnimalType & {
  breed: string;
};

// Interface 合并声明
interface Box {
  height: number;
}
interface Box {
  width: number;
}
const box: Box = { height: 10, width: 20 }; // 自动合并

// Type 不支持合并
// type BoxType = { height: number };
// type BoxType = { width: number }; // 错误：重复标识符
```

### 2.4 接口继承

```typescript
// 单继承
interface Shape {
  color: string;
}

interface Square extends Shape {
  sideLength: number;
}

const square: Square = {
  color: "red",
  sideLength: 10
};

// 多继承
interface PenStroke {
  penWidth: number;
}

interface SquareWithPen extends Square, PenStroke {
  sideLength: number;
}

const squareWithPen: SquareWithPen = {
  color: "blue",
  sideLength: 15,
  penWidth: 2
};
```

### 2.5 交叉类型

```typescript
interface Person {
  name: string;
}
interface Serializable {
  serialize(): string;
}

type PersonSerializable = Person & Serializable;

class Employee implements PersonSerializable {
  constructor(public name: string) {}
  serialize(): string {
    return JSON.stringify({ name: this.name });
  }
}

const emp = new Employee("张三");
console.log(emp.serialize());
```

### 2.6 索引签名高级用法

```typescript
// 精确字符串字面量
type PropertyName = "firstName" | "lastName" | "age";

interface Person {
  [propName: PropertyName]: string | number;
}

// 只读索引签名
interface ReadonlyStringArray {
  readonly [index: number]: string;
}

const myArray: ReadonlyStringArray = ["Alice", "Bob"];
// myArray[2] = "Mallory"; // 错误

// 模板字面量类型
type EventName<T extends string> = `on${Capitalize<T>}`;

interface EventHandler {
  [K in EventName<"click" | "hover">]: (event: Event) => void;
}

const handler: EventHandler = {
  onClick: (e) => console.log("click"),
  onHover: (e) => console.log("hover")
};
```

### 面试题 Q2

**Q: interface 和 type 的主要区别是什么？什么时候用哪个？**

**A:**

主要区别：
1. **扩展方式不同**：interface 使用 `extends`，type 使用交叉类型 `&`
2. **声明合并**：interface 支持同名接口自动合并，type 不支持
3. **适用场景**：
   - interface 适合定义对象结构、类契约
   - type 适合定义联合类型、元组、映射类型等

使用建议：
- 定义对象结构、需要扩展时，优先使用 interface
- 定义联合类型、元组、复杂类型组合时，使用 type
- React 组件 Props 类型推荐使用 interface（便于扩展）

```typescript
// 推荐：对象结构用 interface
interface User {
  id: number;
  name: string;
}

// 推荐：联合类型用 type
type Status = "pending" | "success" | "error";

// 推荐：映射类型用 type
type PartialUser = Partial<User>;
```

---

## 3. 函数类型

### 3.1 函数类型注解

```typescript
// 函数声明
function add(a: number, b: number): number {
  return a + b;
}

// 函数表达式
const multiply: (a: number, b: number) => number = (a, b) => a * b;

// 类型别名
type MathOperation = (a: number, b: number) => number;
const subtract: MathOperation = (a, b) => a - b;

// 接口定义函数类型
interface MathFunction {
  (a: number, b: number): number;
}
const divide: MathFunction = (a, b) => a / b;
```

### 3.2 可选参数与默认参数

```typescript
// 可选参数
function buildName(firstName: string, lastName?: string): string {
  if (lastName) {
    return `${firstName} ${lastName}`;
  }
  return firstName;
}

// 默认参数
function buildName2(firstName: string, lastName = "Smith"): string {
  return `${firstName} ${lastName}`;
}

// 剩余参数
function sum(...numbers: number[]): number {
  return numbers.reduce((acc, curr) => acc + curr, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15
```

### 3.3 函数重载

函数重载允许一个函数接受不同数量或类型的参数。

```typescript
// 基本重载
function padLeft(value: string, padding: string): string;
function padLeft(value: string, padding: number): string;
function padLeft(value: string, padding: string | number): string {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  return padding + value;
}

// 对象方法重载
class Calculator {
  add(a: number, b: number): number;
  add(a: string, b: string): string;
  add(a: number | string, b: number | string): number | string {
    if (typeof a === "number" && typeof b === "number") {
      return a + b;
    }
    return `${a}${b}`;
  }
}

const calc = new Calculator();
console.log(calc.add(1, 2));      // 3
console.log(calc.add("a", "b")); // "ab"

// 复杂重载示例
function createElement(tag: "a"): HTMLAnchorElement;
function createElement(tag: "img"): HTMLImageElement;
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

const anchor = createElement("a"); // HTMLAnchorElement
const image = createElement("img"); // HTMLImageElement
```

### 3.4 泛型函数

```typescript
// 基本泛型函数
function identity<T>(arg: T): T {
  return arg;
}

const num = identity<number>(42);
const str = identity("hello"); // 类型推断

// 多个泛型参数
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p = pair(1, "hello"); // [number, string]

// 泛型约束
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}

loggingIdentity({ length: 10, value: 3 });
// loggingIdentity(3); // 错误：number 没有 length 属性

// 在泛型约束中使用类型参数
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "张三", age: 25 };
const name = getProperty(user, "name"); // string
const age = getProperty(user, "age");   // number
// getProperty(user, "email"); // 错误：email 不存在
```

### 3.5 this 类型

```typescript
// this 参数
interface Card {
  suit: string;
  rank: number;
  print(this: Card): void;
}

const card: Card = {
  suit: "hearts",
  rank: 1,
  print() {
    console.log(`${this.rank} of ${this.suit}`);
  }
};

// this 类型
class BasicCalculator {
  public constructor(protected value: number = 0) {}

  public currentValue(): number {
    return this.value;
  }

  public add(operand: number): this {
    this.value += operand;
    return this;
  }

  public subtract(operand: number): this {
    this.value -= operand;
    return this;
  }
}

class ScientificCalculator extends BasicCalculator {
  public constructor(value = 0) {
    super(value);
  }

  public multiply(operand: number): this {
    this.value *= operand;
    return this;
  }
}

const v1 = new BasicCalculator(2)
  .add(1)
  .add(3)
  .currentValue(); // 6

const v2 = new ScientificCalculator(2)
  .add(1)
  .multiply(3)
  .currentValue(); // 9
```

### 3.6 条件类型在函数中的应用

```typescript
// 条件类型
type TypeName<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

function typeName<T>(value: T): TypeName<T> {
  if (typeof value === "string") return "string" as TypeName<T>;
  if (typeof value === "number") return "number" as TypeName<T>;
  if (typeof value === "boolean") return "boolean" as TypeName<T>;
  if (typeof value === "undefined") return "undefined" as TypeName<T>;
  if (typeof value === "function") return "function" as TypeName<T>;
  return "object" as TypeName<T>;
}

typeName("hello"); // "string"
typeName(42);      // "number"

// infer 关键字
type Unpack<T> =
  T extends (infer U)[] ? U :
  T extends (...args: any[]) => infer U ? U :
  T extends Promise<infer U> ? U :
  T;

function unpack<T>(value: T): Unpack<T> {
  return value as any;
}

const arr = [1, 2, 3];
const item = unpack(arr); // number

const promise = Promise.resolve("hello");
const result = unpack(promise); // string
```

### 面试题 Q3

**Q: 什么是函数重载？如何实现函数重载？**

**A:**

函数重载允许一个函数接受不同数量或类型的参数，TypeScript 会根据调用时的参数类型选择正确的重载签名。

实现步骤：
1. 声明多个重载签名（没有函数体）
2. 实现函数体（必须兼容所有重载签名）

```typescript
function process(input: string): string;
function process(input: number): number;
function process(input: string | number): string | number {
  return input;
}

// 注意：重载签名必须按从具体到一般的顺序排列
function len(s: string): number;
function len(arr: any[]): number;
function len(x: any): number {
  return x.length;
}
```

---

## 4. 泛型深入

### 4.1 泛型约束

```typescript
// 基本约束
interface HasLength {
  length: number;
}

function getLength<T extends HasLength>(arg: T): number {
  return arg.length;
}

getLength("hello");      // 5
getLength([1, 2, 3]);   // 3
getLength({ length: 10 }); // 10

// 约束类型参数
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "张三", age: 25 };
getProperty(user, "name"); // string
// getProperty(user, "email"); // 错误

// 使用原型约束
function createInstance<T extends { new(): T }>(c: { new(): T }): T {
  return new c();
}

class BeeKeeper {
  hasMask: boolean = true;
}

class ZooKeeper {
  nametag: string = "Mikle";
}

class Animal {
  numLegs: number = 4;
}

class Bee extends Animal {
  keeper: BeeKeeper = new BeeKeeper();
}

class Lion extends Animal {
  keeper: ZooKeeper = new ZooKeeper();
}

function createInstance<A extends Animal>(c: new () => A): A {
  return new c();
}

createInstance(Lion).keeper.nametag; // 类型推断正确
```

### 4.2 泛型默认值

```typescript
// 泛型默认值
interface User<T = string> {
  id: T;
  name: string;
}

const user1: User<number> = { id: 1, name: "张三" };
const user2: User = { id: "abc", name: "李四" };

// 多个泛型参数
interface Response<T = any, E = Error> {
  data: T;
  error?: E;
}

const success: Response<string> = { data: "success" };
const failure: Response<null, Error> = { data: null, error: new Error() };

// 泛型约束与默认值结合
interface Config<T extends object = object> {
  options: T;
}

const config1: Config = { options: {} };
const config2: Config<{ debug: boolean }> = { options: { debug: true } };
```

### 4.3 映射类型

映射类型基于旧类型创建新类型。

```typescript
// 基本映射类型
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
}

type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;

// 映射类型修饰符
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 键重映射
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
  name: string;
  age: number;
}

type LazyPerson = Getters<Person>;
// {
//   getName: () => string;
//   getAge: () => number;
// }

// 条件映射
type PickByType<T, U> = {
  [P in keyof T as T[P] extends U ? P : never]: T[P];
};

interface User2 {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

type StringsOnly = PickByType<User2, string>;
// {
//   name: string;
//   email: string;
// }
```

### 4.4 条件类型

条件类型根据条件选择类型。

```typescript
// 基本条件类型
type IsArray<T> = T extends any[] ? true : false;

type Test1 = IsArray<string[]>; // true
type Test2 = IsArray<string>;   // false

// 条件类型分发
type ToArray<T> = T extends any ? T[] : never;

type Test3 = ToArray<string | number>; // string[] | number[]

// 条件类型中的类型推断
type Unpacked<T> =
  T extends (infer U)[] ? U :
  T extends (...args: any[]) => infer U ? U :
  T extends Promise<infer U> ? U :
  T;

type Test4 = Unpacked<string[]>; // string
type Test5 = Unpacked<() => string>; // string
type Test6 = Unpacked<Promise<string>>; // string

// 预定义条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

type Test7 = NonNullable<string | null>; // string
type Test8 = NonNullable<string | undefined>; // string
```

### 4.5 infer 关键字

`infer` 关键字用于在条件类型中推断类型。

```typescript
// 推断数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : never;

type Test9 = ElementType<number[]>; // number

// 推断函数返回类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function greet(): string {
  return "hello";
}

type Test10 = ReturnType<typeof greet>; // string

// 推断函数参数类型
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

function sum(a: number, b: number): number {
  return a + b;
}

type Test11 = Parameters<typeof sum>; // [number, number]

// 推断 Promise 的类型
type Awaited<T> = T extends Promise<infer U> ? U : T;

type Test12 = Awaited<Promise<string>>; // string

// 多个 infer
type Unpacked<T> =
  T extends (infer U)[] ? U :
  T extends (...args: any[]) => infer U ? U :
  T extends Promise<infer U> ? U :
  T;

type Test13 = Unpacked<string[]>; // string
type Test14 = Unpacked<() => number>; // number
type Test15 = Unpacked<Promise<boolean>>; // boolean
```

### 4.6 分布式条件类型

当条件类型作用于联合类型时，会自动分发。

```typescript
// 分布式条件类型
type ToArray<T> = T extends any ? T[] : never;

type Test16 = ToArray<string | number>; // string[] | number[]

// 非分布式条件类型
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Test17 = ToArrayNonDist<string | number>; // (string | number)[]

// 实际应用：Diff
type Diff<T, U> = T extends U ? never : T;

type Test18 = Diff<"a" | "b" | "c", "a" | "e">; // "b" | "c"

// 实际应用：Filter
type Filter<T, Condition> = T extends Condition ? T : never;

type Test19 = Filter<string | number | boolean, string | number>; // string | number
```

### 4.7 高级泛型模式

```typescript
// 模式匹配
type PromiseType<T> = T extends Promise<infer U> ? U : never;

async function fetchData() {
  return { id: 1, name: "张三" };
}

type Data = PromiseType<ReturnType<typeof fetchData>>;
// { id: number; name: string; }

// 递归类型
type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue };

const data: JSONValue = {
  name: "张三",
  age: 25,
  tags: ["developer", "typescript"],
  profile: {
    email: "zhangsan@example.com"
  }
};

// 深度 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface User3 {
  id: number;
  profile: {
    name: string;
    email: string;
  };
}

type ReadonlyUser = DeepReadonly<User3>;

// 深度 Partial
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type PartialUser = DeepPartial<User3>;
```

### 面试题 Q4

**Q: 什么是泛型约束？如何使用？**

**A:**

泛型约束用于限制泛型参数的类型范围，确保泛型参数具有某些特定的属性或方法。

使用方式：
1. 使用 `extends` 关键字指定约束
2. 可以约束为接口、类型别名、原始类型等
3. 可以使用 `keyof` 约束为对象的键

```typescript
// 基本约束
interface HasLength {
  length: number;
}

function getLength<T extends HasLength>(arg: T): number {
  return arg.length;
}

// 约束为对象的键
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 约束为构造函数
function createInstance<T>(c: new () => T): T {
  return new c();
}
```

---

## 5. 内置工具类型

TypeScript 提供了许多内置的工具类型，用于常见的类型转换。

### 5.1 Partial<T>

将所有属性变为可选。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type PartialUser = Partial<User>;

const partialUser: PartialUser = {
  name: "张三"
  // 其他属性都是可选的
};

// 手动实现
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};
```

### 5.2 Required<T>

将所有属性变为必需。

```typescript
interface PartialUser {
  id?: number;
  name?: string;
  email?: string;
}

type FullUser = Required<PartialUser>;

const fullUser: FullUser = {
  id: 1,
  name: "张三",
  email: "zhangsan@example.com"
  // 所有属性都是必需的
};

// 手动实现
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};
```

### 5.3 Readonly<T>

将所有属性变为只读。

```typescript
interface User {
  id: number;
  name: string;
}

type ReadonlyUser = Readonly<User>;

const readonlyUser: ReadonlyUser = {
  id: 1,
  name: "张三"
};

// readonlyUser.name = "李四"; // 错误：只读属性不能修改

// 手动实现
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

### 5.4 Pick<T, K>

从类型中选取一组属性。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserBasicInfo = Pick<User, "id" | "name">;

const basicInfo: UserBasicInfo = {
  id: 1,
  name: "张三"
};

// 手动实现
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### 5.5 Omit<T, K>

从类型中排除一组属性。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

type UserWithoutEmail = Omit<User, "email">;

const userWithoutEmail: UserWithoutEmail = {
  id: 1,
  name: "张三",
  age: 25
};

// 手动实现
type MyOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

### 5.6 Record<K, T>

构造一个对象类型，其属性名为 K，属性值为 T。

```typescript
type PageInfo = {
  title: string;
};

type Page = "home" | "about" | "contact";

const pageMap: Record<Page, PageInfo> = {
  home: { title: "Home" },
  about: { title: "About" },
  contact: { title: "Contact" }
};

// 手动实现
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};
```

### 5.7 Exclude<T, U>

从联合类型中排除 U。

```typescript
type T = Exclude<string | number | boolean, string>;

// T = number | boolean

// 手动实现
type MyExclude<T, U> = T extends U ? never : T;
```

### 5.8 Extract<T, U>

从联合类型中提取 U。

```typescript
type T = Extract<string | number | boolean, string | number>;

// T = string | number

// 手动实现
type MyExtract<T, U> = T extends U ? T : never;
```

### 5.9 ReturnType<T>

获取函数类型的返回类型。

```typescript
function greet(): string {
  return "hello";
}

type GreetReturn = ReturnType<typeof greet>; // string

// 手动实现
type MyReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : any;
```

### 5.10 Parameters<T>

获取函数类型的参数类型。

```typescript
function sum(a: number, b: number): number {
  return a + b;
}

type SumParams = Parameters<typeof sum>; // [number, number]

// 手动实现
type MyParameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;
```

### 5.11 NonNullable<T>

从类型中排除 null 和 undefined。

```typescript
type T = NonNullable<string | null | undefined>; // string

// 手动实现
type MyNonNullable<T> = T extends null | undefined ? never : T;
```

### 5.12 其他实用工具类型

```typescript
// Uppercase
type T1 = Uppercase<"hello">; // "HELLO"

// Lowercase
type T2 = Lowercase<"HELLO">; // "hello"

// Capitalize
type T3 = Capitalize<"hello">; // "Hello"

// Uncapitalize
type T4 = Uncapitalize<"Hello">; // "hello"

// InstanceType
class MyClass {
  constructor(public name: string) {}
}

type Instance = InstanceType<typeof MyClass>; // MyClass

// ThisParameterType
function toHex(this: Number): string {
  return this.toString(16);
}

type T5 = ThisParameterType<typeof toHex>; // Number

// OmitThisParameter
type T6 = OmitThisParameter<typeof toHex>; // () => string

// Partial - 深度版本
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Required - 深度版本
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
```

### 5.13 自定义工具类型示例

```typescript
// 深度 Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface User {
  id: number;
  profile: {
    name: string;
    email: string;
  };
}

type ReadonlyUser = DeepReadonly<User>;

// 获取对象的所有值类型
type ValueOf<T> = T[keyof T];

type UserValues = ValueOf<User>; // number | { name: string; email: string; }

// 获取函数的所有参数类型的联合
type AnyFunction = (...args: any[]) => any;
type ArgsType<T extends AnyFunction> = T extends (...args: infer P) => any ? P[number] : never;

function example(a: string, b: number, c: boolean): void {}

type ExampleArgs = ArgsType<typeof example>; // string | number | boolean

// 将联合类型转换为交叉类型
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type Test = UnionToIntersection<{ a: string } | { b: number }>;
// { a: string } & { b: number }
```

### 面试题 Q5

**Q: 如何实现一个 DeepPartial 工具类型？**

**A:**

DeepPartial 递归地将对象的所有属性变为可选。

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface User {
  id: number;
  profile: {
    name: string;
    email: string;
    address: {
      city: string;
      country: string;
    };
  };
}

type PartialUser = DeepPartial<User>;

const partialUser: PartialUser = {
  id: 1,
  profile: {
    name: "张三"
    // email 和 address 都是可选的
  }
};
```

---

## 6. 类与装饰器

### 6.1 类类型

```typescript
// 基本类定义
class Person {
  // 属性
  name: string;
  age: number;

  // 构造函数
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 方法
  greet(): string {
    return `Hello, my name is ${this.name}`;
  }
}

const person = new Person("张三", 25);
console.log(person.greet());

// 访问修饰符
class Employee {
  public name: string;           // 公共属性（默认）
  private salary: number;         // 私有属性
  protected department: string;   // 受保护属性
  readonly id: number;            // 只读属性

  constructor(name: string, salary: number, department: string, id: number) {
    this.name = name;
    this.salary = salary;
    this.department = department;
    this.id = id;
  }

  public getSalary(): number {
    return this.salary;
  }

  protected getDepartment(): string {
    return this.department;
  }
}

class Manager extends Employee {
  constructor(name: string, salary: number, department: string, id: number) {
    super(name, salary, department, id);
  }

  public showDepartment(): string {
    return this.getDepartment(); // 可以访问 protected 属性
    // return this.salary; // 错误：不能访问 private 属性
  }
}
```

### 6.2 抽象类

```typescript
// 抽象类
abstract class Animal {
  abstract name: string;
  abstract makeSound(): void;

  move(): void {
    console.log("Moving...");
  }
}

class Dog extends Animal {
  name: string = "Dog";

  makeSound(): void {
    console.log("Woof!");
  }
}

class Cat extends Animal {
  name: string = "Cat";

  makeSound(): void {
    console.log("Meow!");
  }
}

const dog = new Dog();
dog.makeSound(); // "Woof!"
dog.move();      // "Moving..."

// const animal = new Animal(); // 错误：不能实例化抽象类
```

### 6.3 类接口

```typescript
// 类实现接口
interface ClockInterface {
  currentTime: Date;
  setTime(d: Date): void;
}

class Clock implements ClockInterface {
  currentTime: Date = new Date();
  setTime(d: Date) {
    this.currentTime = d;
  }

  constructor(h: number, m: number) {}
}

// 接口继承
interface Shape {
  color: string;
}

interface Square extends Shape {
  sideLength: number;
}

class ColoredSquare implements Square {
  color: string;
  sideLength: number;

  constructor(color: string, sideLength: number) {
    this.color = color;
    this.sideLength = sideLength;
  }
}
```

### 6.4 装饰器模式

装饰器是一种特殊类型的声明，可以附加到类声明、方法、访问符、属性或参数上。

#### 类装饰器

```typescript
// 类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}

// 类装饰器工厂
function logger<T extends { new(...args: any[]): {} }>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
      console.log(`Creating instance of ${constructor.name}`);
    }
  };
}

@logger
class Person {
  constructor(public name: string) {}
}

const person = new Person("张三"); // 输出：Creating instance of Person
```

#### 方法装饰器

```typescript
// 方法装饰器
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${propertyKey} with args:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} returned:`, result);
    return result;
  };

  return descriptor;
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// 输出：
// Calling add with args: [2, 3]
// add returned: 5
```

#### 属性装饰器

```typescript
// 属性装饰器
function format(formatString: string) {
  return function(target: any, propertyKey: string) {
    let value: string;

    const getter = () => {
      return `${formatString} ${value}`;
    };

    const setter = (newValue: string) => {
      value = newValue;
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  };
}

class Greeter {
  @format("Hello,")
  greeting: string;
}

const greeter = new Greeter();
greeter.greeting = "World";
console.log(greeter.greeting); // "Hello, World"
```

#### 参数装饰器

```typescript
// 参数装饰器
function required(target: any, propertyKey: string, parameterIndex: number) {
  const requiredParameters: number[] = Reflect.getMetadata("required", target, propertyKey) || [];
  requiredParameters.push(parameterIndex);
  Reflect.defineMetadata("required", requiredParameters, target, propertyKey);
}

function validate(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    const requiredParameters: number[] = Reflect.getMetadata("required", target, propertyKey) || [];
    requiredParameters.forEach((index) => {
      if (args[index] === undefined || args[index] === null) {
        throw new Error(`Parameter at index ${index} is required`);
      }
    });
    return originalMethod.apply(this, args);
  };
}

class User {
  @validate
  createUser(@required name: string, @required email: string, age?: number) {
    console.log(`Creating user: ${name}, ${email}, ${age}`);
  }
}

const user = new User();
user.createUser("张三", "zhangsan@example.com");
// user.createUser("张三", undefined); // 错误：Parameter at index 1 is required
```

### 6.5 装饰器组合

```typescript
function first() {
  console.log("first(): factory evaluated");
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("first(): called");
  };
}

function second() {
  console.log("second(): factory evaluated");
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log("second(): called");
  };
}

class ExampleClass {
  @first()
  @second()
  method() {}
}

// 输出：
// first(): factory evaluated
// second(): factory evaluated
// second(): called
// first(): called
```

### 6.6 反射元数据

```typescript
import "reflect-metadata";

function metadata(key: string, value: any) {
  return function(target: any, propertyKey: string) {
    Reflect.defineMetadata(key, value, target, propertyKey);
  };
}

class MyClass {
  @metadata("custom", "value")
  myMethod() {}
}

const meta = Reflect.getMetadata("custom", MyClass.prototype, "myMethod");
console.log(meta); // "value"
```

### 面试题 Q6

**Q: 什么是装饰器？TypeScript 中有哪些类型的装饰器？**

**A:**

装饰器是一种特殊类型的声明，可以附加到类声明、方法、访问符、属性或参数上，用于修改或扩展它们的行为。

TypeScript 支持以下类型的装饰器：

1. **类装饰器**：应用于类构造函数
2. **方法装饰器**：应用于方法
3. **属性装饰器**：应用于属性
4. **参数装饰器**：应用于方法参数
5. **访问符装饰器**：应用于 getter/setter

装饰器执行顺序：从下到上，从内到外。

```typescript
// 类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
}

@sealed
class MyClass {}

// 方法装饰器
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${key}`);
    return original.apply(this, args);
  };
}

class Example {
  @log
  method() {}
}
```

---

## 7. 模块与命名空间

### 7.1 ES 模块

```typescript
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export const PI = 3.14159;

export interface User {
  id: number;
  name: string;
}

// main.ts
import { add, multiply, PI, User } from "./utils";

console.log(add(1, 2));
console.log(multiply(3, 4));
console.log(PI);

const user: User = { id: 1, name: "张三" };

// 默认导出
// calculator.ts
export default class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}

// main.ts
import Calculator from "./calculator";

const calc = new Calculator();
console.log(calc.add(1, 2));

// 导入所有
import * as utils from "./utils";
console.log(utils.add(1, 2));

// 重新导出
export { add, multiply } from "./utils";
export { default as Calculator } from "./calculator";
```

### 7.2 .d.ts 声明文件

声明文件用于为 JavaScript 库提供类型信息。

```typescript
// lodash.d.ts
declare module "lodash" {
  interface Lodash {
    cloneDeep<T>(value: T): T;
    uniq<T>(array: T[]): T[];
    map<T, U>(array: T[], iteratee: (value: T) => U): U[];
  }

  const _: Lodash;
  export = _;
}

// 使用
import _ from "lodash";

const cloned = _.cloneDeep({ a: 1 });
const unique = _.uniq([1, 2, 2, 3]);
const mapped = _.map([1, 2, 3], x => x * 2);
```

### 7.3 @types 包

```typescript
// 安装类型定义
// npm install --save-dev @types/node
// npm install --save-dev @types/react
// npm install --save-dev @types/express

// 使用
import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Hello World");
});
```

### 7.4 模块增强

```typescript
// 扩展全局对象
// global.d.ts
interface Window {
  myCustomProperty: string;
}

// 使用
window.myCustomProperty = "Hello";

// 扩展模块
// express.d.ts
declare module "express" {
  interface Request {
    user?: {
      id: number;
      name: string;
    };
  }
}

// 使用
import express from "express";

const app = express();

app.use((req, res, next) => {
  req.user = { id: 1, name: "张三" };
  next();
});

app.get("/", (req, res) => {
  console.log(req.user?.name); // 类型安全
  res.send("Hello");
});
```

### 7.5 命名空间

```typescript
// 命名空间定义
namespace Validation {
  export interface StringValidator {
    isAcceptable(s: string): boolean;
  }

  const lettersRegexp = /^[A-Za-z]+$/;
  const numberRegexp = /^[0-9]+$/;

  export class LettersOnlyValidator implements StringValidator {
    isAcceptable(s: string) {
      return lettersRegexp.test(s);
    }
  }

  export class ZipCodeValidator implements StringValidator {
    isAcceptable(s: string) {
      return s.length === 5 && numberRegexp.test(s);
    }
  }
}

// 使用
let validators: { [s: string]: Validation.StringValidator } = {};
validators["ZIP code"] = new Validation.ZipCodeValidator();
validators["Letters only"] = new Validation.LettersOnlyValidator();

// 嵌套命名空间
namespace Shapes {
  export namespace Polygons {
    export class Triangle {}
    export class Square {}
  }
}

const tri = new Shapes.Polygons.Triangle();
```

### 7.6 模块与命名空间的区别

| 特性 | ES 模块 | 命名空间 |
|------|---------|----------|
| 语法 | import/export | namespace |
| 作用域 | 文件级别 | 命名空间级别 |
| 编译输出 | ES Module/CommonJS | IIFE |
| 推荐 | 是 | 否（仅用于声明文件） |

### 面试题 Q7

**Q: .d.ts 文件的作用是什么？如何为第三方库创建类型声明？**

**A:**

.d.ts 文件是 TypeScript 声明文件，用于为 JavaScript 代码提供类型信息。它只包含类型声明，不包含实现代码。

创建类型声明的方式：

1. **使用 declare module**：为模块创建类型声明
2. **使用 declare global**：扩展全局对象
3. **使用 interface 扩展**：扩展现有类型

```typescript
// 为第三方库创建类型声明
// my-lib.d.ts
declare module "my-lib" {
  export interface Options {
    debug?: boolean;
    timeout?: number;
  }

  export function init(options?: Options): void;
  export function getData(): Promise<any>;
}

// 使用
import { init, getData } from "my-lib";

init({ debug: true });
getData().then(data => console.log(data));
```

---

## 8. TypeScript配置

### 8.1 tsconfig.json 核心选项

```json
{
  "compilerOptions": {
    // 基本选项
    "target": "ES2020",                    // 编译目标
    "module": "commonjs",                  // 模块系统
    "lib": ["ES2020", "DOM"],              // 包含的库文件
    "outDir": "./dist",                    // 输出目录
    "rootDir": "./src",                    // 根目录
    "removeComments": true,                // 移除注释
    "strict": true,                        // 启用所有严格类型检查选项

    // 额外检查
    "noUnusedLocals": true,                // 检查未使用的局部变量
    "noUnusedParameters": true,            // 检查未使用的参数
    "noImplicitReturns": true,             // 检查函数是否有隐式返回
    "noFallthroughCasesInSwitch": true,    // 检查 switch 语句中的 fallthrough

    // 模块解析选项
    "moduleResolution": "node",            // 模块解析策略
    "baseUrl": "./",                       // 基础路径
    "paths": {
      "@/*": ["src/*"]                     // 路径映射
    },
    "esModuleInterop": true,              // 启用 ES 模块互操作
    "allowSyntheticDefaultImports": true,  // 允许合成默认导入

    // 类型检查
    "strictNullChecks": true,              // 严格的 null 检查
    "strictFunctionTypes": true,           // 严格的函数类型检查
    "strictBindCallApply": true,          // 严格的 bind/call/apply 检查
    "strictPropertyInitialization": true, // 严格的类属性初始化检查
    "noImplicitThis": true,                // 禁止 this 类型为 any
    "alwaysStrict": true,                  // 以严格模式解析

    // 高级选项
    "skipLibCheck": true,                  // 跳过库文件的类型检查
    "forceConsistentCasingInFileNames": true, // 强制文件名大小写一致
    "resolveJsonModule": true,             // 允许导入 JSON 文件
    "declaration": true,                  // 生成 .d.ts 文件
    "declarationMap": true,               // 生成 .d.ts.map 文件
    "sourceMap": true,                     // 生成 source map 文件
    "incremental": true,                   // 增量编译
    "tsBuildInfoFile": "./.tsbuildinfo"   // 构建信息文件位置
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
```

### 8.2 Strict 模式

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

strict 模式等价于启用以下所有选项：

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### 8.3 项目引用

项目引用允许将 TypeScript 项目组织成多个子项目。

```json
// tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./core" },
    { "path": "./utils" },
    { "path": "./app" }
  ]
}

// core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "../dist/core",
    "declaration": true
  },
  "references": []
}

// utils/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "../dist/utils",
    "declaration": true
  },
  "references": [
    { "path": "../core" }
  ]
}

// app/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "outDir": "../dist/app",
    "declaration": true
  },
  "references": [
    { "path": "../core" },
    { "path": "../utils" }
  ]
}
```

### 8.4 常用配置场景

#### React 项目配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

#### Node.js 项目配置

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 面试题 Q8

**Q: tsconfig.json 中的 strict 模式包含哪些选项？启用 strict 模式有什么好处？**

**A:**

strict 模式包含以下选项：

1. **strictNullChecks**: 严格的 null 检查
2. **strictFunctionTypes**: 严格的函数类型检查
3. **strictBindCallApply**: 严格的 bind/call/apply 检查
4. **strictPropertyInitialization**: 严格的类属性初始化检查
5. **noImplicitThis**: 禁止 this 类型为 any
6. **alwaysStrict**: 以严格模式解析

好处：
- 提高代码质量，减少运行时错误
- 提供更好的类型推断
- 捕获更多潜在的错误
- 使代码更加健壮和可维护

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## 9. React + TypeScript实践

### 9.1 组件类型定义

#### 函数组件

```typescript
// 基本函数组件
import React from "react";

interface GreetingProps {
  name: string;
  age?: number;
}

const Greeting: React.FC<GreetingProps> = ({ name, age }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>Age: {age}</p>}
    </div>
  );
};

// 或者直接使用函数声明
function Greeting2({ name, age }: GreetingProps) {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      {age && <p>Age: {age}</p>}
    </div>
  );
}

// 使用
<Greeting name="张三" />
<Greeting name="李四" age={25} />
```

#### 类组件

```typescript
import React from "react";

interface CounterProps {
  initialCount: number;
}

interface CounterState {
  count: number;
}

class Counter extends React.Component<CounterProps, CounterState> {
  constructor(props: CounterProps) {
    super(props);
    this.state = {
      count: props.initialCount
    };
  }

  increment = () => {
    this.setState(prevState => ({ count: prevState.count + 1 }));
  };

  render() {
    return (
      <div>
        <p>Count: {this.state.count}</p>
        <button onClick={this.increment}>Increment</button>
      </div>
    );
  }
}

// 使用
<Counter initialCount={0} />
```

### 9.2 Hooks 类型

#### useState

```typescript
import { useState } from "react";

// 基本用法
const [count, setCount] = useState<number>(0);
const [name, setName] = useState<string>("");

// 推断类型
const [items, setItems] = useState([1, 2, 3]);

// 联合类型
type Status = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<Status>("idle");

// 对象类型
interface User {
  id: number;
  name: string;
  email: string;
}

const [user, setUser] = useState<User | null>(null);

// 函数式初始化
const [state, setState] = useState(() => {
  const initialState = computeExpensiveValue();
  return initialState;
});
```

#### useEffect

```typescript
import { useEffect } from "react";

// 无依赖
useEffect(() => {
  console.log("Component mounted");
}, []);

// 有依赖
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// 清理函数
useEffect(() => {
  const subscription = props.source.subscribe();
  return () => {
    subscription.unsubscribe();
  };
}, [props.source]);

// 异步操作
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  fetchData();
}, []);
```

#### useContext

```typescript
import { createContext, useContext } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

// 使用
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
};
```

#### useReducer

```typescript
import { useReducer } from "react";

interface State {
  count: number;
}

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "set"; payload: number };

const initialState: State = { count: 0 };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { count: state.count + 1 };
    case "decrement":
      return { count: state.count - 1 };
    case "set":
      return { count: action.payload };
    default:
      return state;
  }
}

const Counter = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "set", payload: 0 })}>Reset</button>
    </div>
  );
};
```

#### useRef

```typescript
import { useRef, useEffect } from "react";

// DOM 引用
const InputWithFocus = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} type="text" />;
};

// 可变值
const Timer = () => {
  const timerRef = useRef<number | null>(null);

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      console.log("Timer tick");
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div>
      <button onClick={startTimer}>Start</button>
      <button onClick={stopTimer}>Stop</button>
    </div>
  );
};
```

#### useMemo 和 useCallback

```typescript
import { useMemo, useCallback } from "react";

// useMemo
const ExpensiveComponent = ({ items }: { items: number[] }) => {
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a - b);
  }, [items]);

  return <div>{sortedItems.join(", ")}</div>;
};

// useCallback
const ParentComponent = () => {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log("Button clicked");
  }, []);

  return (
    <div>
      <ChildComponent onClick={handleClick} />
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
};

interface ChildComponentProps {
  onClick: () => void;
}

const ChildComponent: React.FC<ChildComponentProps> = ({ onClick }) => {
  console.log("ChildComponent rendered");
  return <button onClick={onClick}>Click me</button>;
};
```

### 9.3 事件类型

```typescript
import React from "react";

// 表单事件
const FormComponent = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" onChange={handleChange} />
      <button type="submit">Submit</button>
    </form>
  );
};

// 鼠标事件
const MouseComponent = () => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("Button clicked", e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("Mouse moved", e.clientX, e.clientY);
  };

  return (
    <div onMouseMove={handleMouseMove}>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
};

// 键盘事件
const KeyboardComponent = () => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      console.log("Enter key pressed");
    }
  };

  return <input type="text" onKeyDown={handleKeyDown} />;
};

// 滚动事件
const ScrollComponent = () => {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    console.log("Scrolled", e.currentTarget.scrollTop);
  };

  return (
    <div onScroll={handleScroll} style={{ height: "200px", overflow: "auto" }}>
      <div style={{ height: "1000px" }}>Scroll me</div>
    </div>
  );
};
```

### 9.4 Ref 类型

```typescript
import React, { useRef, useEffect } from "react";

// DOM 元素 ref
const DOMRefComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    console.log(divRef.current?.clientHeight);
  }, []);

  return (
    <div ref={divRef}>
      <input ref={inputRef} type="text" />
    </div>
  );
};

// 组件 ref
interface ChildComponentProps {
  value: string;
}

const ChildComponent = React.forwardRef<HTMLInputElement, ChildComponentProps>(
  ({ value }, ref) => {
    return <input ref={ref} value={value} />;
  }
);

const ParentComponent = () => {
  const childRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    childRef.current?.focus();
  }, []);

  return <ChildComponent ref={childRef} value="Hello" />;
};

// 自定义 ref
const useCustomRef = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) {
      // 自定义逻辑
      ref.current.style.border = "2px solid red";
    }
  }, []);

  return ref;
};

const CustomRefComponent = () => {
  const divRef = useCustomRef<HTMLDivElement>();

  return <div ref={divRef}>Custom ref</div>;
};
```

### 9.5 泛型组件

```typescript
import React from "react";

// 基本泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}

// 使用
interface User {
  id: number;
  name: string;
}

const UserList = () => {
  const users: User[] = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" }
  ];

  return (
    <List
      items={users}
      renderItem={user => <span>{user.name}</span>}
    />
  );
};

// 泛型组件类型
type GenericComponent<T> = React.FC<{ data: T }>;

const StringComponent: GenericComponent<string> = ({ data }) => {
  return <div>{data}</div>;
};

const NumberComponent: GenericComponent<number> = ({ data }) => {
  return <div>{data}</div>;
};

// 高阶泛型组件
interface TableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    header: string;
    render?: (value: T[keyof T]) => React.ReactNode;
  }[];
}

function Table<T>({ data, columns }: TableProps<T>) {
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column, index) => (
            <th key={index}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((column, colIndex) => (
              <td key={colIndex}>
                {column.render
                  ? column.render(row[column.key])
                  : String(row[column.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 使用
const UserTable = () => {
  const users: User[] = [
    { id: 1, name: "张三" },
    { id: 2, name: "李四" }
  ];

  return (
    <Table
      data={users}
      columns={[
        { key: "id", header: "ID" },
        { key: "name", header: "Name", render: value => <strong>{value}</strong> }
      ]}
    />
  );
};
```

### 9.6 常见 React 类型

```typescript
import React from "react";

// React.FC
interface Props {
  title: string;
}

const Component: React.FC<Props> = ({ title }) => {
  return <h1>{title}</h1>;
};

// React.ReactNode
interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return <div className="container">{children}</div>;
};

// React.ReactElement
interface WrapperProps {
  element: React.ReactElement;
}

const Wrapper: React.FC<WrapperProps> = ({ element }) => {
  return <div className="wrapper">{element}</div>;
};

// React.CSSProperties
const StyledComponent: React.FC = () => {
  const style: React.CSSProperties = {
    color: "red",
    fontSize: "16px",
    backgroundColor: "#f0f0f0"
  };

  return <div style={style}>Styled text</div>;
};

// React.HTMLAttributes
interface DivProps extends React.HTMLAttributes<HTMLDivElement> {
  customProp?: string;
}

const CustomDiv: React.FC<DivProps> = ({ customProp, ...rest }) => {
  return <div {...rest}>{customProp}</div>;
};

// React.ComponentProps
const Button = ({ children, ...props }: React.ComponentProps<"button">) => {
  return <button {...props}>{children}</button>;
};

// React.ComponentPropsWithoutRef
const Input = (props: React.ComponentPropsWithoutRef<"input">) => {
  return <input {...props} />;
};

// React.ComponentPropsWithRef
const InputWithRef = React.forwardRef<HTMLInputElement, React.ComponentPropsWithRef<"input">>(
  (props, ref) => {
    return <input ref={ref} {...props} />;
  }
);
```

### 面试题 Q9

**Q: 在 React + TypeScript 中，如何正确定义组件的 Props 类型？**

**A:**

定义组件 Props 类型的方式：

1. **使用 interface**：推荐用于对象类型的 Props
2. **使用 type**：适用于联合类型、元组等复杂类型
3. **使用 React.FC**：显式声明为函数组件
4. **使用泛型**：适用于需要类型参数的组件

```typescript
// 方式1：interface
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled, children }) => {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
};

// 方式2：type
type Status = "idle" | "loading" | "success" | "error";

type StatusBadgeProps = {
  status: Status;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return <span>{status}</span>;
};

// 方式3：泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}
```

---

## 10. Node.js + TypeScript实践

### 10.1 Express 类型定义

```typescript
import express, { Request, Response, NextFunction } from "express";

const app = express();

// 基本路由
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

// 带参数的路由
app.get("/users/:id", (req: Request, res: Response) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});

// 查询参数
app.get("/search", (req: Request, res: Response) => {
  const query = req.query.q as string;
  res.send(`Search query: ${query}`);
});

// POST 请求
app.post("/users", (req: Request, res: Response) => {
  const user = req.body;
  res.json(user);
});

// 扩展 Request 类型
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
  };
}

app.get("/profile", (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});
```

### 10.2 中间件类型

```typescript
import express, { Request, Response, NextFunction } from "express";

// 基本中间件
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

app.use(loggerMiddleware);

// 错误处理中间件
interface ErrorWithStatus extends Error {
  status?: number;
}

const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });
};

app.use(errorHandler);

// 认证中间件
const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 验证 token
  try {
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.get("/protected", authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  res.json({ message: "Protected route", user: req.user });
});

// 验证中间件
interface CreateUserRequest extends Request {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

const validateUser = (
  req: CreateUserRequest,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  next();
};

app.post("/users", validateUser, (req: CreateUserRequest, res: Response) => {
  // 创建用户逻辑
  res.status(201).json({ message: "User created" });
});
```

### 10.3 路由类型

```typescript
import express, { Router, Request, Response } from "express";

const router = Router();

// 定义路由处理器类型
type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

// 用户路由
interface UserRoutes {
  getUsers: RouteHandler;
  getUser: RouteHandler;
  createUser: RouteHandler;
  updateUser: RouteHandler;
  deleteUser: RouteHandler;
}

const userRoutes: UserRoutes = {
  getUsers: async (req, res) => {
    const users = await User.findAll();
    res.json(users);
  },

  getUser: async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  },

  createUser: async (req, res) => {
    const user = await User.create(req.body);
    res.status(201).json(user);
  },

  updateUser: async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  },

  deleteUser: async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted" });
  }
};

// 注册路由
router.get("/users", userRoutes.getUsers);
router.get("/users/:id", userRoutes.getUser);
router.post("/users", userRoutes.createUser);
router.put("/users/:id", userRoutes.updateUser);
router.delete("/users/:id", userRoutes.deleteUser);

app.use("/api", router);
```

### 10.4 数据库类型

```typescript
// MongoDB + Mongoose
import mongoose, { Document, Model, Schema } from "mongoose";

interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, {
  timestamps: true
});

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

// 使用
const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  const user = new User(userData);
  return await user.save();
};

const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return await User.findOne({ email });
};

// PostgreSQL + TypeORM
import { Entity, PrimaryGeneratedColumn, Column, Repository } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  updatedAt!: Date;
}

// 使用
const userRepository = AppDataSource.getRepository(User);

const createUser = async (userData: Partial<User>): Promise<User> => {
  const user = userRepository.create(userData);
  return await userRepository.save(user);
};

const findUserByEmail = async (email: string): Promise<User | null> => {
  return await userRepository.findOne({ where: { email } });
};
```

### 10.5 API 响应类型

```typescript
// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 成功响应
const successResponse = <T>(data: T, message?: string): ApiResponse<T> => {
  return {
    success: true,
    data,
    message
  };
};

// 错误响应
const errorResponse = (error: string): ApiResponse => {
  return {
    success: false,
    error
  };
};

// 分页响应
const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

// 使用
app.get("/users", async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const users = await User.find()
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await User.countDocuments();

  const response = paginatedResponse(users, page, limit, total);
  res.json(response);
});
```

### 10.6 环境变量类型

```typescript
import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  NODE_ENV: "development" | "production" | "test";
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  REDIS_URL?: string;
}

const envConfig: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  PORT: parseInt(process.env.PORT || "3000"),
  DATABASE_URL: process.env.DATABASE_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  REDIS_URL: process.env.REDIS_URL
};

// 验证环境变量
const validateEnv = (): void => {
  const required: (keyof EnvConfig)[] = ["DATABASE_URL", "JWT_SECRET"];

  for (const key of required) {
    if (!envConfig[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};

validateEnv();

export default envConfig;
```

### 面试题 Q10

**Q: 在 Node.js + TypeScript 项目中，如何为 Express 中间件定义类型？**

**A:**

为 Express 中间件定义类型的方式：

1. **基本中间件**：使用 `(req: Request, res: Response, next: NextFunction) => void`
2. **错误处理中间件**：使用 `(err: Error, req: Request, res: Response, next: NextFunction) => void`
3. **自定义中间件**：扩展 Request 接口添加自定义属性
4. **验证中间件**：扩展 Request 接口添加类型化的 body

```typescript
import express, { Request, Response, NextFunction } from "express";

// 基本中间件
const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
};

// 错误处理中间件
const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
};

// 自定义中间件
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    name: string;
  };
}

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization;
  if (token) {
    req.user = verifyToken(token);
  }
  next();
};
```

---

## 11. 常见面试题TOP 20

### Q1: TypeScript 中的 any 和 unknown 有什么区别？

**A:**
- `any`：可以赋值给任何类型，也可以被任何类型赋值。会跳过类型检查，慎用。
- `unknown`：类型安全的 any，任何类型都可以赋值给 unknown，但 unknown 不能赋值给其他类型（除了 any 和 unknown）。使用前必须进行类型检查。

```typescript
let anything: any = 42;
let something: unknown = 42;

let num: number = anything; // 正确
// let num2: number = something; // 错误

if (typeof something === "number") {
  let num2: number = something; // 正确
}
```

### Q2: interface 和 type 的主要区别是什么？

**A:**
1. **扩展方式**：interface 使用 `extends`，type 使用交叉类型 `&`
2. **声明合并**：interface 支持同名接口自动合并，type 不支持
3. **适用场景**：
   - interface 适合定义对象结构、类契约
   - type 适合定义联合类型、元组、映射类型等

```typescript
// Interface 扩展
interface Animal {
  name: string;
}
interface Dog extends Animal {
  breed: string;
}

// Type 扩展
type AnimalType = {
  name: string;
};
type DogType = AnimalType & {
  breed: string;
};
```

### Q3: 什么是泛型？如何使用泛型？

**A:**
泛型是 TypeScript 中的一种特性，允许在定义函数、接口或类时使用类型参数，从而提高代码的复用性和类型安全性。

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

// 泛型接口
interface Box<T> {
  value: T;
}

// 泛型类
class Container<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }
}

// 泛型约束
interface Lengthwise {
  length: number;
}

function getLength<T extends Lengthwise>(arg: T): number {
  return arg.length;
}
```

### Q4: 什么是类型守卫？有哪些类型守卫？

**A:**
类型守卫是一种在运行时检查类型的方式，可以在条件块中缩小类型的范围。

类型守卫类型：
1. **typeof 类型守卫**：用于检查原始类型
2. **instanceof 类型守卫**：用于检查实例类型
3. **自定义类型守卫**：使用 `parameterName is Type` 语法

```typescript
// typeof 类型守卫
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  return padding + value;
}

// instanceof 类型守卫
function move(animal: Bird | Fish) {
  if (animal instanceof Bird) {
    animal.fly();
  } else {
    animal.swim();
  }
}

// 自定义类型守卫
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}
```

### Q5: 什么是映射类型？常用的映射类型有哪些？

**A:**
映射类型基于旧类型创建新类型，通过遍历旧类型的属性来创建新类型。

常用映射类型：
- `Partial<T>`：将所有属性变为可选
- `Required<T>`：将所有属性变为必需
- `Readonly<T>`：将所有属性变为只读
- `Pick<T, K>`：选取一组属性
- `Omit<T, K>`：排除一组属性
- `Record<K, T>`：构造对象类型

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
type ReadonlyUser = Readonly<User>;
type UserBasicInfo = Pick<User, "id" | "name">;
type UserWithoutEmail = Omit<User, "email">;
```

### Q6: 什么是条件类型？如何使用条件类型？

**A:**
条件类型根据条件选择类型，语法为 `T extends U ? X : Y`。

```typescript
// 基本条件类型
type IsArray<T> = T extends any[] ? true : false;

type Test1 = IsArray<string[]>; // true
type Test2 = IsArray<string>;   // false

// 条件类型分发
type ToArray<T> = T extends any ? T[] : never;

type Test3 = ToArray<string | number>; // string[] | number[]

// infer 关键字
type Unpacked<T> =
  T extends (infer U)[] ? U :
  T extends (...args: any[]) => infer U ? U :
  T extends Promise<infer U> ? U :
  T;
```

### Q7: 什么是装饰器？TypeScript 中有哪些类型的装饰器？

**A:**
装饰器是一种特殊类型的声明，可以附加到类声明、方法、访问符、属性或参数上，用于修改或扩展它们的行为。

装饰器类型：
1. **类装饰器**：应用于类构造函数
2. **方法装饰器**：应用于方法
3. **属性装饰器**：应用于属性
4. **参数装饰器**：应用于方法参数
5. **访问符装饰器**：应用于 getter/setter

```typescript
// 类装饰器
function sealed(constructor: Function) {
  Object.seal(constructor);
}

@sealed
class MyClass {}

// 方法装饰器
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`Calling ${key}`);
    return original.apply(this, args);
  };
}

class Example {
  @log
  method() {}
}
```

### Q8: TypeScript 中的 never 类型有什么用？

**A:**
`never` 类型表示永不存在的类型，主要用于：
1. 表示永远不会返回的函数
2. 表示永远无法到达的代码位置
3. 在类型检查中用于穷尽检查

```typescript
// 永不返回的函数
function error(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// 穷尽检查
type Shape = { kind: "circle"; radius: number } | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "square":
      return shape.side ** 2;
    default:
      const _exhaustiveCheck: never = shape;
      return _exhaustiveCheck;
  }
}
```

### Q9: 如何实现一个 DeepPartial 工具类型？

**A:**
DeepPartial 递归地将对象的所有属性变为可选。

```typescript
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface User {
  id: number;
  profile: {
    name: string;
    email: string;
    address: {
      city: string;
      country: string;
    };
  };
}

type PartialUser = DeepPartial<User>;

const partialUser: PartialUser = {
  id: 1,
  profile: {
    name: "张三"
  }
};
```

### Q10: TypeScript 中的模块解析有哪些方式？

**A:**
TypeScript 支持两种模块解析策略：
1. **Classic**：旧版解析策略，主要用于兼容性
2. **Node**：Node.js 风格的解析策略，推荐使用

Node 解析策略的查找顺序：
1. 查找相对路径的 .ts、.tsx、.d.ts 文件
2. 查找 node_modules 中的包
3. 查找 package.json 的 types 字段
4. 查找 index.ts、index.d.ts 文件

```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```

### Q11: 什么是类型推断？TypeScript 如何进行类型推断？

**A:**
类型推断是 TypeScript 自动推断变量、函数参数、返回值等类型的能力。

类型推断方式：
1. **变量初始化**：根据初始化值推断类型
2. **函数返回值**：根据 return 语句推断类型
3. **上下文类型**：根据上下文推断类型
4. **最佳通用类型**：从多个候选类型中推断最佳类型

```typescript
// 变量初始化
let x = 3; // 推断为 number

// 函数返回值
function add(a: number, b: number) {
  return a + b; // 推断返回类型为 number
}

// 上下文类型
window.onmousedown = function(mouseEvent) {
  console.log(mouseEvent.button); // 推断为 MouseEvent
};

// 最佳通用类型
let x = [0, 1, null]; // 推断为 (number | null)[]
```

### Q12: 如何为第三方 JavaScript 库创建类型声明？

**A:**
为第三方库创建类型声明的方式：
1. **使用 declare module**：为模块创建类型声明
2. **使用 declare global**：扩展全局对象
3. **使用 interface 扩展**：扩展现有类型
4. **发布 @types 包**：发布到 DefinitelyTyped

```typescript
// 为第三方库创建类型声明
// my-lib.d.ts
declare module "my-lib" {
  export interface Options {
    debug?: boolean;
    timeout?: number;
  }

  export function init(options?: Options): void;
  export function getData(): Promise<any>;
}

// 使用
import { init, getData } from "my-lib";

init({ debug: true });
getData().then(data => console.log(data));
```

### Q13: TypeScript 中的 keyof 操作符有什么用？

**A:**
`keyof` 操作符用于获取某种类型的所有键，返回联合类型。

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

type UserKeys = keyof User; // "id" | "name" | "email"

// 结合泛型使用
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user: User = { id: 1, name: "张三", email: "zhangsan@example.com" };

const name = getProperty(user, "name"); // string
const age = getProperty(user, "age"); // 错误：age 不存在
```

### Q14: 什么是类型断言？什么时候使用类型断言？

**A:**
类型断言用于告诉编译器变量的具体类型，有两种语法：
1. **尖括号语法**：`<Type>variable`
2. **as 语法**：`variable as Type`

使用场景：
1. 编译器无法推断类型时
2. 从联合类型中选择特定类型
3. 处理 DOM 元素时

```typescript
// 尖括号语法
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;

// as 语法（推荐）
let strLength2: number = (someValue as string).length;

// DOM 元素
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");
```

### Q15: TypeScript 中的枚举有什么特点？

**A:**
枚举是 TypeScript 特有的类型，用于定义一组命名常量。

特点：
1. **数字枚举**：自动递增的数字值
2. **字符串枚举**：明确的字符串值
3. **常量枚举**：编译时内联
4. **反向映射**：可以通过值获取名称

```typescript
// 数字枚举
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right    // 3
}

// 字符串枚举
enum DirectionString {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

// 常量枚举
const enum ConstDirection {
  Up,
  Down
}

// 反向映射
enum Enum {
  A
}
let a = Enum.A;           // 0
let nameOfA = Enum[a];    // "A"
```

### Q16: 如何在 React + TypeScript 中正确定义组件的 Props 类型？

**A:**
定义组件 Props 类型的方式：
1. **使用 interface**：推荐用于对象类型的 Props
2. **使用 type**：适用于联合类型、元组等复杂类型
3. **使用 React.FC**：显式声明为函数组件
4. **使用泛型**：适用于需要类型参数的组件

```typescript
// 方式1：interface
interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, disabled, children }) => {
  return <button onClick={onClick} disabled={disabled}>{children}</button>;
};

// 方式2：type
type Status = "idle" | "loading" | "success" | "error";

type StatusBadgeProps = {
  status: Status;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return <span>{status}</span>;
};

// 方式3：泛型组件
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{renderItem(item)}</li>)}</ul>;
}
```

### Q17: TypeScript 中的 abstract class 和 interface 有什么区别？

**A:**
抽象类和接口的区别：

| 特性 | 抽象类 | 接口 |
|------|--------|------|
| 实现 | 可以包含实现 | 只能包含声明 |
| 构造函数 | 可以有 | 不能有 |
| 访问修饰符 | 支持 | 默认 public |
| 多继承 | 不支持 | 支持 |
| 字段 | 可以有 | 不能有 |

```typescript
// 抽象类
abstract class Animal {
  abstract name: string;
  abstract makeSound(): void;

  move(): void {
    console.log("Moving...");
  }
}

class Dog extends Animal {
  name: string = "Dog";
  makeSound(): void {
    console.log("Woof!");
  }
}

// 接口
interface Flyable {
  fly(): void;
}

class Bird implements Flyable {
  fly(): void {
    console.log("Flying!");
  }
}
```

### Q18: 如何使用 TypeScript 的内置工具类型？

**A:**
TypeScript 提供了许多内置工具类型：

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial - 所有属性可选
type PartialUser = Partial<User>;

// Required - 所有属性必需
type RequiredUser = Required<PartialUser>;

// Readonly - 所有属性只读
type ReadonlyUser = Readonly<User>;

// Pick - 选取属性
type UserBasicInfo = Pick<User, "id" | "name">;

// Omit - 排除属性
type UserWithoutEmail = Omit<User, "email">;

// Record - 构造对象类型
type UserMap = Record<string, User>;

// Exclude - 排除类型
type Numbers = Exclude<string | number, string>;

// Extract - 提取类型
type Strings = Extract<string | number, string>;

// ReturnType - 获取返回类型
type Return = ReturnType<() => string>;

// Parameters - 获取参数类型
type Params = Parameters<(a: number, b: number) => void>;
```

### Q19: TypeScript 中的模块和命名空间有什么区别？

**A:**
模块和命名空间的区别：

| 特性 | ES 模块 | 命名空间 |
|------|---------|----------|
| 语法 | import/export | namespace |
| 作用域 | 文件级别 | 命名空间级别 |
| 编译输出 | ES Module/CommonJS | IIFE |
| 推荐 | 是 | 否（仅用于声明文件） |

```typescript
// ES 模块
// utils.ts
export function add(a: number, b: number): number {
  return a + b;
}

// main.ts
import { add } from "./utils";

// 命名空间
namespace Utils {
  export function add(a: number, b: number): number {
    return a + b;
  }
}

Utils.add(1, 2);
```

### Q20: 如何配置 TypeScript 的 strict 模式？

**A:**
strict 模式等价于启用以下所有选项：

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

等价于：

```json
{
  "compilerOptions": {
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

启用 strict 模式的好处：
- 提高代码质量，减少运行时错误
- 提供更好的类型推断
- 捕获更多潜在的错误
- 使代码更加健壮和可维护

---

## 总结

本文档涵盖了 TypeScript 的核心概念和高级特性，包括：

1. **基础类型与类型注解**：原始类型、数组、元组、枚举、类型断言、类型守卫
2. **接口与类型别名**：接口定义、类型别名、接口继承、交叉类型
3. **函数类型**：函数重载、泛型函数、this 类型、条件类型
4. **泛型深入**：泛型约束、默认值、映射类型、条件类型、infer 关键字
5. **内置工具类型**：Partial、Required、Pick、Omit、Record 等
6. **类与装饰器**：类类型、抽象类、装饰器模式
7. **模块与命名空间**：ES 模块、.d.ts 文件、模块增强
8. **TypeScript 配置**：tsconfig.json、strict 模式、项目引用
9. **React + TypeScript 实践**：组件类型、Hooks 类型、事件类型
10. **Node.js + TypeScript 实践**：Express 类型、中间件类型、路由类型

掌握这些知识点将帮助你在面试中脱颖而出，并在实际项目中更好地使用 TypeScript。

---

## 12. TS `as const` 与 const 类型断言

### 12.1 基本用法

```typescript
// 普通对象 — 类型会被拓宽
const config = {
  api: 'https://api.example.com',
  timeout: 3000,
  retry: 3
};
// 类型推断：{ api: string; timeout: number; retry: number }

// as const — 将所有属性变为 readonly 字面量类型
const configConst = {
  api: 'https://api.example.com',
  timeout: 3000,
  retry: 3
} as const;
// 类型推断：{ readonly api: 'https://api.example.com'; readonly timeout: 3000; readonly retry: 3 }
```

### 12.2 实际应用场景

```typescript
// 1. 精确的联合类型
type Role = typeof roles[number]; // 'admin' | 'user' | 'guest'
const roles = ['admin', 'user', 'guest'] as const;

// 2. 函数参数约束
function setHeader(key: typeof headers[number], value: string) {
  // key 的类型：'Content-Type' | 'Authorization' | 'Accept'
}
const headers = ['Content-Type', 'Authorization', 'Accept'] as const;
setHeader('Content-Type', 'application/json');
// setHeader('X-Custom', 'value'); // Error

// 3. 与模板字面量类型结合
const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof httpMethods[number];
type ApiRoute = `/api/${string}`;
type ApiEndpoint = `${HttpMethod} ${ApiRoute}`;
// "GET /api/users" | "POST /api/users" | ...

// 4. 元组类型
const point = [10, 20] as const;
// 类型：readonly [10, 20]
// 而不是 number[]
```

### 12.3 面试问答

**Q: `as const` 和 `const` 声明有什么区别？**

```typescript
// const 声明 — 变量不可重新赋值，但对象属性可修改
const obj = { name: '张三' };
obj.name = '李四'; // OK
// obj = {}; // Error

// as const — 所有属性变为 readonly
const obj2 = { name: '张三' } as const;
// obj2.name = '李四'; // Error
```

---

## 13. TS `satisfies` 操作符

### 13.1 基本概念

`satisfies`（TS 4.9+）用于验证表达式是否满足某个类型，同时保留表达式的精确类型推断。

```typescript
// 问题：使用类型注解会丢失精确类型
type Colors = Record<string, [number, number, number] | string>;

// 方式 1：类型注解 — 丢失精确类型
const palette1: Colors = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255]
};
// palette1.red — 类型是 [number, number, number] | string，丢失了具体信息

// 方式 2：satisfies — 保留精确类型
const palette2 = {
  red: [255, 0, 0],
  green: '#00ff00',
  blue: [0, 0, 255]
} satisfies Colors;
// palette2.red — 类型是 readonly [255, 0, 0]（精确类型）
// palette2.green — 类型是 '#00ff00'（字面量类型）
```

### 13.2 实际应用

```typescript
// 1. 验证对象结构，同时保留字面量类型
type RouteConfig = Record<string, { path: string; method: string }>;

const routes = {
  getUsers: { path: '/users', method: 'GET' },
  createUser: { path: '/users', method: 'POST' },
  deleteUser: { path: '/users/:id', method: 'DELETE' }
} satisfies RouteConfig;

// routes.getUsers.method 的类型是 'GET'（字面量），而不是 string

// 2. 验证数组元素
type NumericTuple = [number, ...number[]];
const points = [[1, 2], [3, 4, 5], [6]] satisfies NumericTuple[];
// points[0] 的类型是 [1, 2]（精确元组），而不是 number[]

// 3. 与 as const 配合
const config = {
  apiUrl: 'https://api.example.com',
  port: 3000,
  features: ['auth', 'logging'] as const
} satisfies {
  apiUrl: string;
  port: number;
  features: readonly string[];
};
// config.apiUrl → 'https://api.example.com'（精确字面量）
// config.features → readonly ['auth', 'logging']（精确元组）
```

---

## 14. TS 协变与逆变

### 14.1 基本概念

```typescript
// 子类型关系
class Animal { name: string; }
class Dog extends Animal { breed: string; }

// 协变（Covariant）— 子类型方向一致
// Dog 是 Animal 的子类型
// Dog[] 也是 Animal[] 的子类型
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs; // OK — 协变

// 逆变（Contravariant）— 子类型方向相反
// 对于函数参数类型，方向是反的
type Handler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

const dogHandler: DogHandler = (dog) => { console.log(dog.breed); };
const handler: Handler = dogHandler; // OK — DogHandler 是 Handler 的子类型
// 因为 Handler 需要处理所有 Animal，DogHandler 能处理 Dog，自然也能处理 Animal 的子集
```

### 14.2 函数类型的可变性

```typescript
// 函数类型：(参数类型) → 返回值类型
// 参数类型是逆变的
// 返回值类型是协变的

// 返回值类型 — 协变
type GetAnimal = () => Animal;
type GetDog = () => Dog;

const getDog: GetDog = () => new Dog();
const getAnimal: GetAnimal = getDog; // OK — 返回 Dog 是返回 Animal 的子类型

// 参数类型 — 逆变
type ProcessAnimal = (a: Animal) => void;
type ProcessDog = (d: Dog) => void;

const processAnimal: ProcessAnimal = (a) => {};
const processDog: ProcessDog = processAnimal; // OK — 处理 Animal 的函数可以处理 Dog
// const processAnimal2: ProcessAnimal = processDog; // Error — 处理 Dog 的函数不能处理所有 Animal

// 双向协变（TypeScript 特有，strictFunctionTypes 关闭时）
// 开启 strictFunctionTypes 后，参数类型严格逆变
```

### 14.3 实际应用

```typescript
// 数组的 push 方法 — 参数类型逆变
interface Array<T> {
  push(...items: T[]): number;
}

// Dog[] 继承了 Animal[] 的 push
// Dog[].push 接受 Dog 参数
// Animal[].push 接受 Animal 参数
// Dog 是 Animal 的子类型，所以 Animal[] 的 push 可以接受 Dog

// 条件类型中的协变/逆变
type IsSubType<A, B> = A extends B ? true : false;
type R1 = IsSubType<Dog, Animal>; // true

// infer 关键字的协变位置
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
// R 在返回值位置 — 协变

type ParamType<T> = T extends (arg: infer P) => any ? P : never;
// P 在参数位置 — 逆变
```

---

## 15. TS 类型体操进阶

### 15.1 DeepReadonly

```typescript
// 将对象的所有属性（包括嵌套）变为 readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

// 测试
type Obj = {
  a: number;
  b: {
    c: string;
    d: {
      e: boolean;
    };
  };
  fn: () => void;
};

type ReadonlyObj = DeepReadonly<Obj>;
// {
//   readonly a: number;
//   readonly b: {
//     readonly c: string;
//     readonly d: {
//       readonly e: boolean;
//     };
//   };
//   readonly fn: () => void;
// }
```

### 15.2 PathOf

```typescript
// 获取对象所有嵌套属性的路径
type PathOf<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? T[K] extends Array<any>
          ? `${Prefix}${K}` | `${Prefix}${K}.${number}`
          : PathOf<T[K], `${Prefix}${K}.`> | `${Prefix}${K}`
        : `${Prefix}${K}`;
    }[keyof T & string]
  : never;

// 测试
type User = {
  name: string;
  age: number;
  address: {
    city: string;
    zip: string;
  };
  hobbies: string[];
};

type UserPaths = PathOf<User>;
// 'name' | 'age' | 'address' | 'address.city' | 'address.zip' | 'hobbies' | 'hobbies.${number}'
```

### 15.3 TupleToUnion

```typescript
// 将元组转换为联合类型
type TupleToUnion<T extends readonly any[]> = T[number];

// 测试
type Tuple = [string, number, boolean];
type Union = TupleToUnion<Tuple>; // string | number | boolean

type ReadonlyTuple = readonly ['a', 'b', 'c'];
type ReadonlyUnion = TupleToUnion<ReadonlyTuple>; // 'a' | 'b' | 'c'
```

### 15.4 Flatten

```typescript
// 将嵌套数组展平一层
type Flatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...First, ...Flatten<Rest>]
    : [First, ...Flatten<Rest>]
  : [];

// 测试
type F1 = Flatten<[1, 2, [3, 4], [5, [6, 7]]]>;
// [1, 2, 3, 4, 5, [6, 7]]

// 深度展平
type DeepFlatten<T extends any[]> = T extends [infer First, ...infer Rest]
  ? First extends any[]
    ? [...DeepFlatten<First>, ...DeepFlatten<Rest>]
    : [First, ...DeepFlatten<Rest>]
  : [];

type DF1 = DeepFlatten<[1, [2, [3, [4]]]]>;
// [1, 2, 3, 4]
```

### 15.5 ReadonlyKeys

```typescript
// 获取对象中所有 readonly 属性的键
type ReadonlyKeys<T> = {
  [K in keyof T]-?: Equal<
    { [P in K]: T[K] },
    { -readonly [P in K]: T[K] }
  > extends true
    ? never
    : K;
}[keyof T];

// 辅助类型
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2)
    ? true
    : false;

// 测试
type Obj = {
  readonly a: number;
  b: string;
  readonly c: boolean;
  d: symbol;
};

type ReadonlyKeysResult = ReadonlyKeys<Obj>; // 'a' | 'c'
```

### 15.6 OmitByType

```typescript
// 根据值类型排除属性
type OmitByType<T, U> = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

// 测试
type Obj = {
  a: number;
  b: string;
  c: number;
  d: boolean;
};

type Omitted = OmitByType<Obj, number>;
// { b: string; d: boolean }
```

### 15.7 ChainableOptions

```typescript
// 实现链式调用的类型安全配置
type Chainable<T = {}> = {
  option<K extends string, V>(
    key: K extends keyof T ? never : K,
    value: V
  ): Chainable<Omit<T, K> & { [P in K]: V }>;
  get(): T;
};

// 测试
declare const config: Chainable;

const result = config
  .option('name', '张三')
  .option('age', 25)
  .option('active', true)
  .get();

// result 类型：{ name: string; age: number; active: boolean }

// 重复 key 会报错
// config.option('name', '张三').option('name', '李四'); // Error
```

---

## 16. TS 声明文件(.d.ts)编写

### 16.1 基本结构

```typescript
// types/my-module.d.ts

// 声明全局变量
declare const GLOBAL_CONFIG: {
  apiBaseUrl: string;
  timeout: number;
};

// 声明函数
declare function formatDate(date: Date, format: string): string;

// 声明类
declare class Logger {
  constructor(level: string);
  log(message: string): void;
  error(message: string): void;
}

// 声明模块（针对没有类型定义的第三方库）
declare module 'some-untyped-lib' {
  export function init(options: { apiKey: string }): void;
  export function query(sql: string): Promise<any[]>;
}

// 声明模块 augmentation（扩展已有模块）
declare module 'express' {
  interface Request {
    userId?: string;
    userRole?: 'admin' | 'user';
  }
}
```

### 16.2 高级用法

```typescript
// 1. 泛型模块声明
declare module 'event-emitter' {
  class EventEmitter<T extends Record<string, any>> {
    on<K extends keyof T>(event: K, listener: T[K]): this;
    off<K extends keyof T>(event: K, listener: T[K]): this;
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): this;
  }
  export = EventEmitter;
}

// 2. 全局声明
// globals.d.ts
declare global {
  interface Window {
    myCustomProperty: string;
  }
  namespace NodeJS {
    interface ProcessEnv {
      CUSTOM_VAR: string;
    }
  }
}

// 3. 类型声明文件中的三斜线指令
/// <reference types="node" />
/// <reference path="./other.d.ts" />
```

---

## 17. TS 模板字面量类型进阶

### 17.1 Join

```typescript
// 将元组用分隔符连接成字符串
type Join<T extends string[], D extends string> =
  T extends []
    ? ''
    : T extends [infer Only extends string]
      ? Only
      : T extends [infer First extends string, ...infer Rest extends string[]]
        ? `${First}${D}${Join<Rest, D>}`
        : string;

// 测试
type J1 = Join<['a', 'b', 'c'], '-'>;   // 'a-b-c'
type J2 = Join<['hello', 'world'], ' '>; // 'hello world'
type J3 = Join<['a'], ','>;              // 'a'
type J4 = Join<[], ','>;                 // ''
```

### 17.2 Split

```typescript
// 将字符串按分隔符拆分为元组
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

// 测试
type S1 = Split<'a-b-c', '-'>;   // ['a', 'b', 'c']
type S2 = Split<'hello world', ' '>; // ['hello', 'world']
type S3 = Split<'abc', '-'>;     // ['abc']
type S4 = Split<'', '-'>;        // ['']
```

### 17.3 Replace

```typescript
// 替换字符串中的匹配项
type Replace<
  S extends string,
  From extends string,
  To extends string
> = From extends ''
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${Tail}`
    : S;

// ReplaceAll — 替换所有匹配项
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ''
  ? S
  : S extends `${infer Head}${From}${infer Tail}`
    ? `${Head}${To}${ReplaceAll<Tail, From, To>}`
    : S;

// 测试
type R1 = Replace<'hello world', 'world', 'TypeScript'>; // 'hello TypeScript'
type R2 = ReplaceAll<'a-b-a-b', 'a', 'x'>;              // 'x-b-x-b'
type R3 = Replace<'abc', 'd', 'x'>;                     // 'abc'（无匹配）
```

### 17.4 ParseURL

```typescript
// 解析 URL 为结构化对象
type ParseURL<S extends string> =
  S extends `http${infer Protocol}://${infer Host}${infer Rest}`
    ? {
        protocol: `http${Protocol}`;
        host: Host;
        path: Rest extends `/${infer Path}` ? `/${Path}` : '/';
        query: Rest extends `${string}?${infer Query}` ? Query : never;
      }
    : never;

// 测试
type URL1 = ParseURL<'https://example.com/users?page=1&limit=10'>;
// {
//   protocol: 'https';
//   host: 'example.com';
//   path: '/users';
//   query: 'page=1&limit=10';
// }

type URL2 = ParseURL<'http://localhost:3000/api/data'>;
// {
//   protocol: 'http';
//   host: 'localhost:3000';
//   path: '/api/data';
//   query: never;
// }
```

---

> 以上补充内容涵盖了 TypeScript 的高级类型特性，包括 `as const`、`satisfies`、协变逆变、类型体操、声明文件和模板字面量类型。这些知识点在高级 TypeScript 面试中频繁出现。
