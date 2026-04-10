# JavaScript 核心面试 50 题

> 基于 JavaScript 核心原理整理，覆盖原型链、闭包、this、事件循环、ES6+ 及手撕代码

---

## 目录

- [一、原型与原型链（8题）](#一原型与原型链)
- [二、闭包（6题）](#二闭包)
- [三、this 指向（5题）](#三this-指向)
- [四、事件循环（6题）](#四事件循环)
- [五、ES6+ 新特性（8题）](#五es6-新特性)
- [六、手撕代码题（17题）](#六手撕代码题)
- [高频考点速查表](#高频考点速查表)

---

## 一、原型与原型链

### Q1: prototype、\_\_proto\_\_、constructor 三者之间的关系是什么？

**难度**: ⭐

**答案**: 每个函数都有 `prototype` 属性指向原型对象；每个对象都有 `__proto__` 属性指向其构造函数的原型对象；原型对象上的 `constructor` 指回构造函数。三者形成三角关系。

**解析**:
```javascript
function Person(name) { this.name = name; }
const p = new Person('张三');

console.log(Person.prototype.constructor === Person); // true
console.log(p.__proto__ === Person.prototype);        // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__ === null);     // true（原型链终点）
```

**扩展**:
- `Function.__proto__ === Function.prototype`（函数也是对象）
- `Object.__proto__ === Function.prototype`（Object 本身是构造函数）
- 所有函数的 `__proto__` 都指向 `Function.prototype`

---

### Q2: 原型链的查找机制是怎样的？

**难度**: ⭐

**答案**: 当访问对象的属性时，如果对象自身没有该属性，JavaScript 引擎会沿着 `__proto__` 链向上查找，直到找到该属性或到达原型链终点 `null`（返回 `undefined`）。

**解析**:
```javascript
function Animal(name) { this.name = name; }
Animal.prototype.type = '动物';
function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = new Dog('旺财', '柴犬');
// 查找链：dog → Dog.prototype → Animal.prototype → Object.prototype → null
console.log(dog.breed);    // '柴犬'（自身）
console.log(dog.type);     // '动物'（Animal.prototype）
console.log(dog.toString); // [Function]（Object.prototype）
```

**面试技巧**: 画原型链图是最直观的答题方式，面试官喜欢看你对链路的理解。

---

### Q3: JavaScript 中实现继承有哪些方式？各有什么优缺点？

**难度**: ⭐⭐

**答案**: 主要有五种继承方式：原型链继承、构造函数继承、组合继承、寄生组合继承、ES6 class 继承。

**解析**:

| 方式 | 优点 | 缺点 |
|------|------|------|
| 原型链继承 | 简单 | 引用类型共享，无法传参 |
| 构造函数继承 | 避免引用共享 | 方法无法复用 |
| 组合继承 | 兼具两者优点 | 父构造函数调用两次 |
| **寄生组合继承** | **最佳方案** | 写法稍复杂 |
| ES6 class | 语法简洁 | 本质是语法糖 |

```javascript
// 寄生组合继承（推荐）
function Parent(name) { this.name = name; }
Parent.prototype.sayName = function() { console.log(this.name); };

function Child(name, age) {
  Parent.call(this, name); // 借用构造函数
  this.age = age;
}
Child.prototype = Object.create(Parent.prototype); // 核心步骤
Child.prototype.constructor = Child;

// ES6 class 继承（语法糖）
class Parent { /* ... */ }
class Child extends Parent {
  constructor(name, age) {
    super(name); // 必须在 this 之前
    this.age = age;
  }
}
```

---

### Q4: 如何判断属性是对象自身的还是原型链上的？

**难度**: ⭐

**答案**: 使用 `hasOwnProperty()` 或 `Object.hasOwn()`（ES2022）判断自身属性，`in` 操作符判断自身和原型链。

**解析**:
```javascript
function Person(name) { this.name = name; }
Person.prototype.age = 25;
const p = new Person('张三');

console.log(p.hasOwnProperty('name')); // true（自身）
console.log(p.hasOwnProperty('age'));  // false（原型）
console.log('name' in p);              // true
console.log('age' in p);               // true

// ES2022 更安全的方式
console.log(Object.hasOwn(p, 'name')); // true
console.log(Object.hasOwn(p, 'age'));  // false

// 判断是否为原型属性
function hasPrototypeProperty(obj, prop) {
  return prop in obj && !obj.hasOwnProperty(prop);
}
```

---

### Q5: Object.create(null) 和 {} 有什么区别？

**难度**: ⭐

**答案**: `Object.create(null)` 创建的对象没有原型（`__proto__` 为 `undefined`），不会继承 `Object.prototype` 上的任何属性和方法；`{}` 等价于 `new Object()`，原型指向 `Object.prototype`。

**解析**:
```javascript
const obj1 = {};
const obj2 = Object.create(null);

console.log(obj1.toString);  // [Function]
console.log(obj2.toString);  // undefined
console.log('toString' in obj1); // true
console.log('toString' in obj2); // false

// 应用场景：
// 1. 创建纯净字典对象，无原型链污染风险
// 2. 作为 Map 替代（性能更好）
// 3. 存储键值对，避免与原型属性冲突
const dict = Object.create(null);
dict['__proto__'] = 'safe'; // 不会产生副作用
```

---

### Q6: instanceof 的原理是什么？如何手写 instanceof？

**难度**: ⭐⭐

**答案**: `instanceof` 沿着对象的原型链（`__proto__`）向上查找，直到找到构造函数的 `prototype` 或到达 `null`。

**解析**:
```javascript
function myInstanceof(instance, Constructor) {
  if (instance === null || (typeof instance !== 'object' && typeof instance !== 'function')) {
    return false;
  }
  const prototype = Constructor.prototype;
  let current = instance.__proto__;
  while (current !== null) {
    if (current === prototype) return true;
    current = current.__proto__;
  }
  return false;
}

console.log(myInstanceof([], Array));   // true
console.log(myInstanceof({}, Object));  // true
console.log(myInstanceof('abc', String)); // false
```

---

### Q7: new 操作符做了什么？如何模拟实现？

**难度**: ⭐⭐

**答案**: `new` 操作符做了四件事：(1) 创建一个新对象；(2) 将新对象的 `__proto__` 指向构造函数的 `prototype`；(3) 将构造函数的 `this` 绑定到新对象并执行；(4) 如果构造函数返回对象则返回该对象，否则返回新对象。

**解析**:
```javascript
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return result !== null && (typeof result === 'object' || typeof result === 'function')
    ? result : obj;
}

function Person(name, age) {
  this.name = name;
  this.age = age;
}
const p = myNew(Person, '张三', 25);
console.log(p instanceof Person); // true
console.log(p.name);              // '张三'
```

---

### Q8: 原型链的终点是什么？为什么？

**难度**: ⭐

**答案**: 原型链的终点是 `null`。`Object.prototype.__proto__ === null`，这是 JavaScript 规范规定的，表示原型链的结束。当查找属性到达 `null` 时仍未找到，就返回 `undefined`。

**解析**:
```javascript
console.log(Object.prototype.__proto__); // null
// 完整链路：
// obj → 构造函数.prototype → Object.prototype → null

// 特殊情况
console.log(Function.prototype.__proto__ === Object.prototype); // true
console.log(Object.__proto__ === Function.prototype);           // true
// 所以 Object 的原型链：
// Object → Function.prototype → Object.prototype → null
```

---

## 二、闭包

### Q9: 什么是闭包？闭包的原理是什么？

**难度**: ⭐

**答案**: 闭包是指一个函数能够记住并访问它的词法作用域，即使这个函数在其词法作用域之外执行。闭包 = 函数 + 其词法环境的引用。

**解析**:
```javascript
function outer() {
  let count = 0; // 自由变量
  function inner() {
    count++;
    console.log(count);
  }
  return inner;
}

const counter = outer();
counter(); // 1
counter(); // 2
// outer 执行完毕，但 count 被 inner 闭包引用，不会被垃圾回收
```

**核心原理**: JavaScript 采用词法作用域，函数的作用域在定义时确定。内部函数持有对外部变量的引用，即使外部函数已返回，这些变量仍被保留在内存中。

---

### Q10: 闭包有哪些常见应用场景？

**难度**: ⭐⭐

**答案**: 闭包常见应用包括：(1) 模块化/数据私有化；(2) 柯里化；(3) 防抖与节流；(4) 缓存（Memoization）；(5) 函数工厂。

**解析**:
```javascript
// 1. 模块化 — 数据私有化
const CounterModule = (function() {
  let count = 0; // 私有变量
  return {
    increment() { count++; },
    getCount() { return count; }
  };
})();
console.log(CounterModule.count); // undefined — 无法直接访问

// 2. 函数工厂
function createMultiplier(factor) {
  return function(number) {
    return number * factor;
  };
}
const double = createMultiplier(2);
const triple = createMultiplier(3);

// 3. 缓存
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

---

### Q11: 循环中的闭包问题（var vs let）如何解决？

**难度**: ⭐⭐

**答案**: `var` 声明的变量是函数作用域，循环中的闭包共享同一个变量；`let` 声明的变量是块级作用域，每次迭代创建新的绑定。解决方案有三种：使用 `let`、IIFE、`setTimeout` 第三个参数。

**解析**:
```javascript
// 问题：var 导致闭包共享
for (var i = 0; i < 3; i++) {
  setTimeout(function() { console.log(i); }, 100); // 3, 3, 3
}

// 方案1：let（推荐）
for (let i = 0; i < 3; i++) {
  setTimeout(function() { console.log(i); }, 100); // 0, 1, 2
}

// 方案2：IIFE
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() { console.log(j); }, 100);
  })(i);
}

// 方案3：setTimeout 第三个参数
for (var i = 0; i < 3; i++) {
  setTimeout(function(j) { console.log(j); }, 100, i);
}
```

---

### Q12: 闭包会导致内存泄漏吗？如何避免？

**难度**: ⭐⭐

**答案**: 闭包本身不会导致内存泄漏，只有当闭包引用了不再需要的大对象，且闭包本身被长期持有（全局变量、事件监听器、定时器）时才会。避免方法：及时移除事件监听、清除定时器、缩小闭包作用域。

**解析**:
```javascript
// 问题：定时器中闭包引用了大对象
function startPolling() {
  const hugeData = fetchHugeData();
  setInterval(function() {
    const status = checkStatus(); // 只需要 status
    // hugeData 也被闭包引用，无法回收
    console.log(status);
  }, 1000);
}

// 修复：将不需要的数据移出闭包
function startPollingFixed() {
  const status = checkStatus();
  setInterval(function() {
    console.log(status);
  }, 1000);
}

// 修复：缩小闭包作用域
function createHandlers() {
  const arr = [];
  for (let i = 0; i < 5; i++) {
    let hugeData = new Array(1000000).fill('x'); // 块作用域
    arr.push(function() { console.log(i); });
    // hugeData 在每次迭代结束后可被回收
  }
  return arr;
}
```

---

### Q13: 什么是 IIFE？有什么作用？

**难度**: ⭐

**答案**: IIFE（Immediately Invoked Function Expression）是立即调用函数表达式，定义后立即执行。作用：创建独立作用域，避免污染全局变量，常用于模块化。

**解析**:
```javascript
// IIFE 写法
(function() {
  const private = 'private';
  console.log(private);
})();

// 箭头函数版
(() => {
  const private = 'private';
  console.log(private);
})();

// 带参数
(function(global) {
  global.myLib = { /* ... */ };
})(window);

// 现代替代方案：ES Module 天然具有作用域隔离
```

---

### Q14: 闭包与高阶函数的关系是什么？

**难度**: ⭐⭐

**答案**: 高阶函数是接受函数作为参数或返回函数的函数。闭包是高阶函数实现的基础——返回的内部函数通过闭包保持对外部变量的引用。柯里化、偏函数、装饰器等都是高阶函数 + 闭包的应用。

**解析**:
```javascript
// 高阶函数 + 闭包 = 柯里化
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

// 高阶函数 + 闭包 = 装饰器
function withLog(fn) {
  return function(...args) {
    console.log(`calling ${fn.name} with`, args);
    const result = fn.apply(this, args);
    console.log(`result:`, result);
    return result;
  };
}
```

---

## 三、this 指向

### Q15: this 的绑定规则有哪些？优先级如何？

**难度**: ⭐⭐

**答案**: this 有四种绑定规则，优先级从高到低：`new 绑定 > 显式绑定（bind） > 隐式绑定 > 默认绑定`。箭头函数没有自己的 this，继承外层词法作用域的 this（不属于绑定规则，而是词法作用域特性）。

**解析**:
```javascript
// 1. 默认绑定
function foo() { console.log(this); }
foo(); // window（非严格模式）/ undefined（严格模式）

// 2. 隐式绑定
const obj = { name: '张三', sayName() { console.log(this.name); } };
obj.sayName(); // '张三'
const fn = obj.sayName;
fn(); // undefined（隐式丢失）

// 3. 显式绑定
fn.call(obj);       // '张三'
fn.apply(obj);      // '张三'
fn.bind(obj)();     // '张三'

// 4. new 绑定
const bar = foo.bind(obj);
new bar(); // this 指向新实例，不是 obj

// 优先级验证
const obj1 = { a: 1, foo };
const obj2 = { a: 2, foo };
obj1.foo.call(obj2); // 2（显式 > 隐式）
```

---

### Q16: 箭头函数的 this 为什么是词法作用域？

**难度**: ⭐⭐

**答案**: 箭头函数在定义时就确定了 this 的指向（继承外层词法作用域的 this），而不是在调用时确定。这是因为箭头函数没有自己的 `this`、`arguments`、`super`、`new.target`。

**解析**:
```javascript
const obj = {
  name: '张三',
  sayName: () => {
    console.log(this.name); // undefined — 继承外层（全局）
  },
  sayNameNormal() {
    const arrow = () => {
      console.log(this.name); // '张三' — 继承 sayNameNormal 的 this
    };
    arrow();
  }
};

// 箭头函数出现前的解决方案
function Timer() {
  this.seconds = 0;
  var self = this; // 保存 this
  setInterval(function() { self.seconds++; }, 1000);
}

// 箭头函数
function Timer2() {
  this.seconds = 0;
  setInterval(() => { this.seconds++; }, 1000);
}

// 注意：箭头函数不能 new，没有 prototype
```

---

### Q17: 如何手写 call、apply、bind？

**难度**: ⭐⭐⭐

**答案**: 核心思路是将函数作为目标对象的属性调用，执行后删除。

**解析**:
```javascript
// 手写 call
Function.prototype.myCall = function(context, ...args) {
  context = context == null ? globalThis : Object(context);
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

// 手写 apply
Function.prototype.myApply = function(context, args = []) {
  context = context == null ? globalThis : Object(context);
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

// 手写 bind（需考虑 new 调用）
Function.prototype.myBind = function(context, ...outerArgs) {
  const fn = this;
  const bound = function(...innerArgs) {
    return fn.call(
      this instanceof bound ? this : context,
      ...outerArgs, ...innerArgs
    );
  };
  bound.prototype = Object.create(fn.prototype);
  return bound;
};
```

**面试技巧**: bind 需要考虑 new 调用的情况，这是区分候选人水平的点。

---

### Q18: 什么是隐式丢失？如何解决？

**难度**: ⭐⭐

**答案**: 当函数作为引用被赋值给变量或作为回调传递时，会丢失原本的调用对象，this 指向全局对象或 undefined。解决方法：使用箭头函数、bind、保存 this。

**解析**:
```javascript
const obj = {
  name: '张三',
  sayName() { console.log(this.name); }
};

const fn = obj.sayName;
fn(); // undefined（隐式丢失）

// 解决方案
fn.call(obj);              // '张三'
const fn2 = obj.sayName.bind(obj);
fn2();                     // '张三'

// 回调中的隐式丢失
function doSomething(cb) { cb(); }
doSomething(obj.sayName); // undefined

// 解决：箭头函数
doSomething(() => obj.sayName()); // '张三'
```

---

### Q19: 严格模式对 this 有什么影响？

**难度**: ⭐

**答案**: 在严格模式下，函数的默认绑定 this 为 `undefined`（非严格模式为 `window`）。这能帮助开发者更早发现 this 指向错误。

**解析**:
```javascript
'use strict';
function foo() {
  console.log(this); // undefined
}
foo(); // undefined

// 非严格模式
function bar() {
  console.log(this); // window
}
bar(); // window

// 注意：对象方法调用不受影响
const obj = { name: '张三', say() { 'use strict'; console.log(this); } };
obj.say(); // { name: '张三', say: [Function] }
```

---

## 四、事件循环

### Q20: 浏览器事件循环的执行顺序是什么？

**难度**: ⭐⭐

**答案**: 执行顺序为：同步代码 → 微任务队列（全部清空）→ 宏任务（取一个）→ 微任务队列（全部清空）→ 下一个宏任务... 如此循环。

**解析**:
```javascript
console.log('1. 同步');

setTimeout(() => {
  console.log('2. 宏任务 setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('3. 微任务 Promise 1'))
  .then(() => console.log('4. 微任务 Promise 2'));

queueMicrotask(() => console.log('5. 微任务 queueMicrotask'));

console.log('6. 同步');

// 输出：1 → 6 → 3 → 5 → 4 → 2
```

**宏任务**: setTimeout / setInterval / requestAnimationFrame / I/O / UI 渲染
**微任务**: Promise.then/catch/finally / MutationObserver / queueMicrotask

---

### Q21: Promise.then 和 setTimeout 谁先执行？

**难度**: ⭐⭐

**答案**: Promise.then（微任务）先于 setTimeout（宏任务）执行。微任务在当前宏任务执行完后、下一个宏任务开始前全部清空。

**解析**:
```javascript
console.log('start');

setTimeout(() => console.log('timeout'), 0);

new Promise((resolve) => {
  console.log('promise executor'); // 同步执行
  resolve();
}).then(() => console.log('promise then'));

console.log('end');

// 输出：start → promise executor → end → promise then → timeout
```

**关键点**: Promise 的 executor 是同步执行的，then 回调才是微任务。

---

### Q22: async/await 的执行顺序是怎样的？

**难度**: ⭐⭐⭐

**答案**: `async` 函数返回 Promise，`await` 会暂停 async 函数执行，将后续代码作为微任务（.then 回调）放入微任务队列。

**解析**:
```javascript
async function async1() {
  console.log('async1 start');
  await async2(); // await 后面的代码相当于 .then 回调
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}

console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));
console.log('script end');

// 输出：
// script start → async1 start → async2 → promise1 → script end
// → async1 end → promise2 → setTimeout
```

**面试技巧**: `await` 等价于 `Promise.resolve(value).then(callback)`，await 后面的代码是微任务。

---

### Q23: 复杂嵌套的事件循环输出题

**难度**: ⭐⭐⭐

**答案**: 需要仔细追踪每个阶段的宏任务和微任务队列。

**解析**:
```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => console.log('3'));
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => console.log('5'), 0);
}).then(() => console.log('6'));

console.log('7');

// 输出：1, 7, 4, 6, 2, 3, 5
// 分析：
// 同步：1, 7
// 微任务：4 → 产生 setTimeout(5)，链式 then → 6
// 宏任务 setTimeout：2 → 产生微任务 3
// 微任务：3
// 宏任务 setTimeout：5
```

---

### Q24: Node.js 事件循环与浏览器的区别？

**难度**: ⭐⭐

**答案**: Node.js 事件循环有六个阶段（timers → pending callbacks → idle/prepare → poll → check → close），微任务在阶段之间执行。`process.nextTick` 优先级高于 `Promise.then`。

**解析**:
```
Node.js 事件循环阶段：
1. timers — setTimeout / setInterval
2. pending callbacks — I/O 回调
3. idle, prepare — 内部使用
4. poll — 检索新的 I/O 事件
5. check — setImmediate
6. close callbacks — close 事件

关键区别：
1. Node.js 有多个宏任务队列（按阶段划分），浏览器只有一个
2. Node.js 中微任务在阶段之间执行
3. process.nextTick 优先级高于 Promise.then
4. setImmediate 只在 Node.js 中存在
```

```javascript
// Node.js 中
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));
// 主模块中顺序不确定；I/O 回调中 setImmediate 优先

process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
// 输出：nextTick, promise
```

---

### Q25: requestAnimationFrame 和 setTimeout 的区别？

**难度**: ⭐⭐

**答案**: `requestAnimationFrame` 在下一次重绘前执行（通常 16.6ms/60fps），与渲染周期同步；`setTimeout` 最小延迟 4ms，不与渲染周期同步。动画应使用 rAF。

**解析**:
```javascript
// rAF 优势：
// 1. 与浏览器刷新率同步，避免掉帧
// 2. 页面不可见时自动暂停，节省资源
// 3. 浏览器可以优化多个 rAF 回调

function animate() {
  element.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// setTimeout 的问题：
// 1. 不与渲染周期同步，可能卡顿
// 2. 页面不可见时仍执行
// 3. 嵌套调用延迟至少 4ms
```

---

## 五、ES6+ 新特性

### Q26: let/const 与 var 的区别是什么？

**难度**: ⭐

**答案**: `let`/`const` 是块级作用域，存在暂时性死区（TDZ），不可重复声明；`var` 是函数作用域，有变量提升。`const` 声明时必须初始化，不可重新赋值（但对象属性可修改）。

**解析**:
```javascript
// 块级作用域
{
  let a = 1;
  const b = 2;
  var c = 3;
}
// console.log(a); // ReferenceError
// console.log(b); // ReferenceError
console.log(c);    // 3

// 暂时性死区
{
  // console.log(d); // ReferenceError（TDZ）
  let d = 1;
}

// const 不可变引用
const obj = { name: '张三' };
obj.name = '李四'; // 可以
// obj = {};        // TypeError
```

---

### Q27: 解构赋值有哪些常见用法？

**难度**: ⭐

**答案**: 支持数组解构、对象解构、函数参数解构、默认值、重命名、剩余元素等。

**解析**:
```javascript
// 数组解构
const [a, b, ...rest] = [1, 2, 3, 4, 5];

// 对象解构 + 重命名 + 默认值
const { name: userName, age = 18, address: { city } } = {
  name: '张三', address: { city: '北京' }
};

// 函数参数解构
function greet({ name, age = 18 }) {
  console.log(`${name}, ${age}`);
}

// 交换变量
let x = 1, y = 2;
[x, y] = [y, x];

// 展开运算符
const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, b: 3, c: 4 }; // { a: 1, b: 3, c: 4 }
```

---

### Q28: Symbol 有什么用？内置 Symbol 有哪些？

**难度**: ⭐⭐

**答案**: Symbol 创建唯一标识符，作为对象属性键不会出现在 `for...in` 中。内置 Symbol 包括 `Symbol.iterator`（迭代器）、`Symbol.toPrimitive`（类型转换）、`Symbol.toStringTag`（标签）等。

**解析**:
```javascript
const id1 = Symbol('id');
const id2 = Symbol('id');
console.log(id1 === id2); // false

const user = {
  [Symbol('id')]: 1,
  name: '张三'
};
for (const key in user) { console.log(key); } // 只输出 'name'

// Symbol.iterator — 自定义迭代行为
const iterable = {
  [Symbol.iterator]() {
    let step = 0;
    return {
      next() {
        step++;
        return step <= 3
          ? { value: step, done: false }
          : { value: undefined, done: true };
      }
    };
  }
};
for (const val of iterable) { console.log(val); } // 1, 2, 3
```

---

### Q29: Proxy 和 Reflect 的作用是什么？

**难度**: ⭐⭐

**答案**: Proxy 拦截对象的基本操作（get/set/deleteProperty 等），Reflect 提供与 Proxy handler 一一对应的方法。Vue 3 使用 Proxy 实现响应式。

**解析**:
```javascript
const reactive = (target) => {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key); // 依赖收集
      const result = Reflect.get(obj, key, receiver);
      if (typeof result === 'object' && result !== null) {
        return reactive(result); // 深层响应式
      }
      return result;
    },
    set(obj, key, value, receiver) {
      const oldValue = obj[key];
      const result = Reflect.set(obj, key, value, receiver);
      if (oldValue !== value) {
        trigger(obj, key); // 派发更新
      }
      return result;
    }
  });
};

// Reflect 的优势：
// 1. 返回布尔值表示操作是否成功
// 2. 正确的 this 绑定（receiver 参数）
```

---

### Q30: WeakMap 和 Map 的区别是什么？

**难度**: ⭐⭐

**答案**: WeakMap 的键必须是对象，是弱引用（不阻止垃圾回收），不可遍历；Map 的键可以是任意类型，是强引用，可遍历。WeakMap 适用于 DOM 关联数据、私有数据存储、缓存。

**解析**:
```javascript
const map = new Map();
const weakMap = new WeakMap();

let obj = { name: '张三' };
map.set(obj, 'data');
weakMap.set(obj, 'data');

obj = null;
// map 仍然持有对原对象的引用，对象不会被回收
// weakMap 不阻止回收，对象可被垃圾回收，条目自动移除

// 应用场景
const wm = new WeakMap();
function processElement(el) {
  if (!wm.has(el)) {
    wm.set(el, { clicks: 0 });
  }
  const data = wm.get(el);
  data.clicks++;
}
// 元素移除后，WeakMap 中的数据自动清理
```

---

### Q31: Optional Chaining (?.) 和 Nullish Coalescing (??) 的作用？

**难度**: ⭐

**答案**: `?.` 安全访问嵌套属性，遇到 `null/undefined` 短路返回 `undefined`；`??` 只在 `null/undefined` 时使用默认值（`0`、`''`、`false` 不触发）。

**解析**:
```javascript
const user = { profile: { address: { city: '北京' } } };

console.log(user?.profile?.address?.city);  // '北京'
console.log(user?.profile?.phone?.number);   // undefined
console.log(user?.getFullName?.());          // undefined

// ?? vs ||
console.log(0 ?? 'default');     // 0
console.log(0 || 'default');     // 'default'
console.log('' ?? 'default');    // ''
console.log('' || 'default');    // 'default'
console.log(null ?? 'default');  // 'default'

// 组合使用
const timeout = config?.timeout ?? 3000; // 0 不会被替换
```

---

### Q32: Generator 是什么？有什么应用？

**难度**: ⭐⭐

**答案**: Generator 是可以暂停和恢复执行的函数，通过 `yield` 暂停，`next()` 恢复。应用场景：惰性求值、异步流程控制、迭代器实现。

**解析**:
```javascript
function* fibonacci() {
  let [prev, curr] = [0, 1];
  while (true) {
    yield curr;
    [prev, curr] = [curr, prev + curr];
  }
}

const fib = fibonacci();
console.log(fib.next().value); // 1
console.log(fib.next().value); // 1
console.log(fib.next().value); // 2

// Generator 实现异步流程控制
function* loadData() {
  const user = yield fetch('/api/user');
  const posts = yield fetch(`/api/posts?userId=${user.id}`);
  return posts;
}
// 配合 co 库自动执行
```

---

### Q33: ES6 模块（ESM）与 CommonJS 的区别？

**难度**: ⭐⭐

**答案**: ESM 是编译时静态加载、值引用、异步加载、this 指向 undefined；CJS 是运行时动态加载、值拷贝、同步加载、this 指向 module.exports。

**解析**:
```javascript
// ESM — 值引用（实时反映变化）
// moduleA.mjs
export let count = 1;
export function increment() { count++; }

// moduleB.mjs
import { count, increment } from './moduleA.mjs';
console.log(count); // 1
increment();
console.log(count); // 2（实时引用）

// CJS — 值拷贝
// moduleA.js
let count = 1;
module.exports = { count };

// moduleB.js
const { count } = require('./moduleA');
count = 2; // 不影响 moduleA
```

---

## 六、手撕代码题

### Q34: 手写防抖函数（debounce）

**难度**: ⭐⭐

**答案**: 防抖在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

**解析**:
```javascript
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;
  const debounced = function(...args) {
    if (timer) clearTimeout(timer);
    if (immediate) {
      const callNow = !timer;
      timer = setTimeout(() => { timer = null; }, delay);
      if (callNow) fn.apply(this, args);
    } else {
      timer = setTimeout(() => { fn.apply(this, args); }, delay);
    }
  };
  debounced.cancel = function() {
    clearTimeout(timer);
    timer = null;
  };
  return debounced;
}
```

**应用场景**: 搜索框输入联想、窗口 resize、按钮防重复点击。

---

### Q35: 手写节流函数（throttle）

**难度**: ⭐⭐

**答案**: 节流规定时间内只执行一次，降低高频事件的触发频率。

**解析**:
```javascript
// 时间戳版本（首次立即执行）
function throttle(fn, interval = 300) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}

// 完整版（首次和末次都能执行）
function throttleFull(fn, interval = 300) {
  let last = 0;
  let timer = null;
  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - last);
    clearTimeout(timer);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else {
      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

**应用场景**: 滚动事件、鼠标移动、窗口 resize、抢购按钮。

---

### Q36: 手写深拷贝（deepClone）

**难度**: ⭐⭐⭐

**答案**: 递归拷贝 + 循环引用处理（WeakMap）+ 特殊对象处理（Date、RegExp、Map、Set、Symbol）。

**解析**:
```javascript
function deepClone(target, cache = new WeakMap()) {
  if (target === null || typeof target !== 'object') return target;
  if (cache.has(target)) return cache.get(target);

  if (target instanceof Date) return new Date(target.getTime());
  if (target instanceof RegExp) return new RegExp(target.source, target.flags);

  if (target instanceof Map) {
    const map = new Map();
    cache.set(target, map);
    target.forEach((v, k) => map.set(deepClone(k, cache), deepClone(v, cache)));
    return map;
  }
  if (target instanceof Set) {
    const set = new Set();
    cache.set(target, set);
    target.forEach(v => set.add(deepClone(v, cache)));
    return set;
  }

  const clone = Array.isArray(target) ? [] : {};
  cache.set(target, clone);

  const allKeys = [...Object.keys(target), ...Object.getOwnPropertySymbols(target)];
  for (const key of allKeys) {
    clone[key] = deepClone(target[key], cache);
  }
  return clone;
}
```

---

### Q37: 手写 EventEmitter（发布订阅模式）

**难度**: ⭐⭐⭐

**答案**: 实现 on、once、off、emit 方法，支持链式调用。

**解析**:
```javascript
class EventEmitter {
  constructor() { this.events = new Map(); }

  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    this.events.get(event).push(listener);
    return this;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, wrapper);
    };
    wrapper.raw = listener;
    return this.on(event, wrapper);
  }

  off(event, listener) {
    if (!this.events.has(event)) return this;
    const listeners = this.events.get(event);
    this.events.set(event, listeners.filter(fn => fn !== listener && fn.raw !== listener));
    if (this.events.get(event).length === 0) this.events.delete(event);
    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    const listeners = this.events.get(event).slice(); // 复制防止遍历中修改
    listeners.forEach(fn => fn.apply(this, args));
    return true;
  }
}
```

---

### Q38: 手写 Promise.all / Promise.race / Promise.allSettled

**难度**: ⭐⭐⭐

**答案**: 核心是用计数器追踪完成数量，注意用 `Promise.resolve()` 包装非 Promise 值。

**解析**:
```javascript
// Promise.all — 全部成功才成功
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const arr = Array.from(promises);
    if (arr.length === 0) { resolve([]); return; }
    const results = new Array(arr.length);
    let count = 0;
    arr.forEach((p, i) => {
      Promise.resolve(p).then(
        val => { results[i] = val; if (++count === arr.length) resolve(results); },
        err => reject(err)
      );
    });
  });
}

// Promise.race — 返回最先完成的结果
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    Array.from(promises).forEach(p => Promise.resolve(p).then(resolve, reject));
  });
}

// Promise.allSettled — 等待全部完成
function promiseAllSettled(promises) {
  return new Promise(resolve => {
    const arr = Array.from(promises);
    if (arr.length === 0) { resolve([]); return; }
    const results = new Array(arr.length);
    let count = 0;
    arr.forEach((p, i) => {
      Promise.resolve(p).then(
        val => { results[i] = { status: 'fulfilled', value: val }; if (++count === arr.length) resolve(results); },
        err => { results[i] = { status: 'rejected', reason: err }; if (++count === arr.length) resolve(results); }
      );
    });
  });
}
```

---

### Q39: 手写数组扁平化（flatten）

**难度**: ⭐⭐

**答案**: 递归、reduce + 递归、迭代（栈）、ES6 flat。

**解析**:
```javascript
// 递归（支持指定深度）
function flatten(arr, depth = Infinity) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item) && depth > 0) {
      result.push(...flatten(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}

// 迭代（栈）
function flattenIterative(arr) {
  const stack = [...arr];
  const result = [];
  while (stack.length) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item);
    } else {
      result.push(item);
    }
  }
  return result.reverse();
}

// ES6
// [1, [2, [3]]].flat(Infinity); // [1, 2, 3]
```

---

### Q40: 手写柯里化函数（curry）

**难度**: ⭐⭐

**答案**: 将多参数函数转换为一系列单参数函数，参数收集够了就执行原函数。

**解析**:
```javascript
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

function add(a, b, c) { return a + b + c; }
const curriedAdd = curry(add);

console.log(curriedAdd(1)(2)(3));  // 6
console.log(curriedAdd(1, 2)(3));  // 6
console.log(curriedAdd(1)(2, 3));  // 6
console.log(curriedAdd(1, 2, 3));  // 6

// 实际应用
const match = curry((reg, str) => reg.test(str));
const hasNumber = match(/\d+/);
console.log(hasNumber('abc123')); // true
```

---

### Q41: 手写 LRU 缓存

**难度**: ⭐⭐⭐

**答案**: 利用 ES6 Map 的插入顺序特性，get 时删除后重新插入（移到末尾），put 时超过容量删除第一个元素。

**解析**:
```javascript
class LRUCache {
  constructor(capacity) {
    if (capacity <= 0) throw new Error('capacity must be positive');
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // 移到末尾
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);
    if (this.cache.size > this.capacity) {
      this.cache.delete(this.cache.keys().next().value); // 删除最久未使用
    }
  }
}

// 时间复杂度 O(1)，空间复杂度 O(capacity)
```

---

### Q42: 手写 new 操作符

**难度**: ⭐⭐

**答案**: 见 Q7，核心是 `Object.create` + `apply` + 返回值判断。

**解析**: （同 Q7）

---

### Q43: 手写 call / apply / bind

**难度**: ⭐⭐⭐

**答案**: 见 Q17，核心是将函数作为目标对象属性调用。

**解析**: （同 Q17）

---

### Q44: 手写 instanceof

**难度**: ⭐⭐

**答案**: 见 Q6，沿原型链查找。

**解析**: （同 Q6）

---

### Q45: 手写懒加载函数

**难度**: ⭐⭐

**答案**: 闭包缓存实例，首次调用时初始化，后续直接返回缓存。

**解析**:
```javascript
// 方案1：闭包 + 缓存
const getHeavyObject = (function() {
  let instance = null;
  return function() {
    if (!instance) {
      instance = createHeavyObject();
    }
    return instance;
  };
})();

// 方案2：函数替换（更高效，后续无 if 判断）
function getParser() {
  const parser = { parse(str) { return JSON.parse(str); } };
  getParser = function() { return parser; }; // 替换自身
  return parser;
}

// 方案3：单例模式
class Singleton {
  static instance = null;
  static getInstance() {
    if (!Singleton.instance) Singleton.instance = new Singleton();
    return Singleton.instance;
  }
}
```

---

### Q46: 手写数组去重

**难度**: ⭐⭐

**答案**: 多种方式：Set、filter + indexOf、Map、对象数组按字段去重。

**解析**:
```javascript
const arr = [1, 2, 3, 2, 1, '1', '2', true, true];

// 1. Set（最简单，适用于基本类型）
const unique1 = [...new Set(arr)];

// 2. Map（利用 key 唯一性）
const unique2 = [...new Map(arr.map(item => [item, item])).values()];

// 3. 对象数组按字段去重
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三' }
];
const uniqueUsers = [...new Map(users.map(u => [u.id, u])).values()];

// 性能：Set > Map > indexOf > includes > reduce
```

---

### Q47: 手写对象扁平化

**难度**: ⭐⭐

**答案**: 递归遍历对象，将嵌套属性用 `.` 连接为扁平 key。

**解析**:
```javascript
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const nested = { a: 1, b: { c: 2, d: { e: 3 } }, f: [4, 5] };
console.log(flattenObject(nested));
// { a: 1, 'b.c': 2, 'b.d.e': 3, f: [4, 5] }

// 深层取值（安全访问）
function getDeepValue(obj, path, defaultValue = undefined) {
  const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let result = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    result = result[key];
  }
  return result === undefined ? defaultValue : result;
}
```

---

### Q48: 手写发布订阅模式（进阶）

**难度**: ⭐⭐⭐

**答案**: 在 EventEmitter 基础上增加命名空间、最大监听器数限制。

**解析**:
```javascript
class AdvancedEventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 10;
  }

  setMaxListeners(n) { this.maxListeners = n; }

  on(event, listener) {
    if (!this.events.has(event)) this.events.set(event, []);
    const listeners = this.events.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) exceeded for "${event}"`);
    }
    listeners.push(listener);
    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false;
    const listeners = this.events.get(event).slice();
    for (const fn of listeners) {
      fn.apply(this, args);
    }
    return true;
  }
}
```

---

### Q49: 手写函数节流进阶（带取消和 leading/trailing）

**难度**: ⭐⭐⭐

**答案**: 支持 leading（首次立即执行）、trailing（末次也执行）、取消功能。

**解析**:
```javascript
function throttleAdvanced(fn, interval, options = {}) {
  const { leading = true, trailing = true } = options;
  let last = 0;
  let timer = null;

  const throttled = function(...args) {
    const now = Date.now();
    if (!leading && !last) last = now;

    const remaining = interval - (now - last);
    clearTimeout(timer);

    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (trailing) {
      timer = setTimeout(() => {
        last = leading ? Date.now() : 0;
        fn.apply(this, args);
      }, remaining);
    }
  };

  throttled.cancel = function() {
    clearTimeout(timer);
    last = 0;
    timer = null;
  };

  return throttled;
}
```

---

### Q50: 手写 Promise（简易版）

**难度**: ⭐⭐⭐

**答案**: 实现 Promise 的三种状态、then 链式调用、异步处理。

**解析**:
```javascript
class MyPromise {
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  constructor(executor) {
    this.status = MyPromise.PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.FULFILLED;
        this.value = value;
        this.onFulfilledCallbacks.forEach(fn => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECTED;
        this.reason = reason;
        this.onRejectedCallbacks.forEach(fn => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : val => val;
    onRejected = typeof onRejected === 'function' ? onRejected : err => { throw err; };

    const promise2 = new MyPromise((resolve, reject) => {
      if (this.status === MyPromise.FULFILLED) {
        queueMicrotask(() => {
          try {
            const x = onFulfilled(this.value);
            resolve(x);
          } catch (e) { reject(e); }
        });
      } else if (this.status === MyPromise.REJECTED) {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            resolve(x);
          } catch (e) { reject(e); }
        });
      } else {
        this.onFulfilledCallbacks.push(() => {
          queueMicrotask(() => {
            try { resolve(onFulfilled(this.value)); } catch (e) { reject(e); }
          });
        });
        this.onRejectedCallbacks.push(() => {
          queueMicrotask(() => {
            try { resolve(onRejected(this.reason)); } catch (e) { reject(e); }
          });
        });
      }
    });
    return promise2;
  }
}
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| 原型链 | ★★★★★ | prototype/__proto__/constructor 三角关系，原型链查找 |
| 闭包 | ★★★★★ | 词法作用域 + 变量引用，应用场景（模块化、防抖节流） |
| this 指向 | ★★★★ | 四种绑定规则，箭头函数词法 this，bind 实现 |
| 事件循环 | ★★★★★ | 宏任务/微任务执行顺序，async/await 原理 |
| Promise | ★★★★★ | 状态机，then 链式调用，手写 Promise.all/race |
| ES6+ | ★★★★ | let/const、解构、Proxy、Symbol、ESM |
| 防抖节流 | ★★★★ | 闭包 + 定时器，区别在于"延迟执行"vs"固定频率" |
| 深拷贝 | ★★★★ | 递归 + WeakMap 处理循环引用 + 特殊对象 |
| 手写 new | ★★★ | Object.create + apply + 返回值判断 |
| 手写 call/apply/bind | ★★★ | 函数作为属性调用，bind 需考虑 new |
| LRU 缓存 | ★★★ | Map 插入顺序，O(1) 的 get/put |
| 柯里化 | ★★★ | 递归收集参数，参数够了执行原函数 |
| 数组扁平化 | ★★★ | 递归/迭代/flat，支持指定深度 |
| 数组去重 | ★★★ | Set 最优，对象数组用 Map |
| 类型判断 | ★★★ | typeof / instanceof / Object.prototype.toString |
