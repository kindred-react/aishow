# JavaScript 核心原理

> 面向3-5年经验全栈开发者 JavaScript 核心原理面试指南

---

## 目录

1. [原型与原型链](#1-原型与原型链)
2. [闭包](#2-闭包)
3. [this 指向](#3-this-指向)
4. [事件循环（浏览器端）](#4-事件循环浏览器端)
5. [ES6+ 新特性](#5-es6-新特性)
6. [前端手撕代码题](#6-前端手撕代码题)

---

## 1. 原型与原型链

### 1.1 prototype、__proto__、constructor 关系

#### 核心概念

JavaScript 中每个对象都有一个内部属性 `[[Prototype]]`（可通过 `__proto__` 访问），指向它的原型对象。每个函数都有一个 `prototype` 属性，指向原型对象。原型对象上有一个 `constructor` 属性，指回构造函数。

```
构造函数 (Function)
  ├── prototype ──────→ 原型对象 (Prototype Object)
  │                       ├── constructor ──→ 构造函数
  │                       └── __proto__ ────→ Object.prototype
  │
  └── (new 调用)
        │
        ↓
  实例对象 (Instance)
    └── __proto__ ──────→ 原型对象 (Prototype Object)
```

#### 代码示例

```javascript
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const person = new Person('张三', 25);

// 三角关系验证
console.log(Person.prototype.constructor === Person); // true
console.log(person.__proto__ === Person.prototype);    // true
console.log(Person.prototype.__proto__ === Object.prototype); // true
console.log(Object.prototype.__proto__ === null);      // true（原型链终点）

// 属性查找
console.log(person.name);       // '张三'（自身属性）
console.log(person.sayHello);   // [Function]（原型上的方法）
console.log(person.toString);   // [Function]（Object.prototype 上的方法）
```

#### 特殊情况

```javascript
// 1. Function 本身也是对象
console.log(Function.__proto__ === Function.prototype); // true
console.log(Function.prototype.__proto__ === Object.prototype); // true

// 2. Object 也是构造函数
console.log(Object.__proto__ === Function.prototype); // true
console.log(Object.prototype.__proto__ === null);      // true

// 3. 所有函数的 __proto__ 都指向 Function.prototype
function foo() {}
console.log(foo.__proto__ === Function.prototype); // true
```

### 1.2 原型链查找机制

当访问一个对象的属性时，如果对象自身没有该属性，JavaScript 引擎会沿着 `__proto__` 链向上查找，直到找到该属性或到达原型链终点（`null`）。

```javascript
function Animal(name) {
  this.name = name;
}
Animal.prototype.type = '动物';

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() {
  console.log('汪汪！');
};

const dog = new Dog('旺财', '柴犬');

// 查找链：dog → Dog.prototype → Animal.prototype → Object.prototype → null
console.log(dog.breed);   // '柴犬'（dog 自身）
console.log(dog.bark);    // [Function]（Dog.prototype）
console.log(dog.type);    // '动物'（Animal.prototype）
console.log(dog.toString); // [Function]（Object.prototype）
console.log(dog.notExist); // undefined（找不到，返回 undefined）
```

### 1.3 继承的多种实现方式

#### 1. 原型链继承

```javascript
function Parent() {
  this.colors = ['red', 'blue'];
}
Parent.prototype.getColor = function() {
  return this.colors;
};

function Child() {}

Child.prototype = new Parent();

const child1 = new Child();
const child2 = new Child();

child1.colors.push('green');
console.log(child2.colors); // ['red', 'blue', 'green'] — 引用类型共享问题！
```

**缺点：** 引用类型属性被所有实例共享；创建子类实例时无法向父类传参。

#### 2. 构造函数继承（借用构造函数）

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
  this.sayName = function() {
    console.log(this.name);
  };
}

function Child(name, age) {
  Parent.call(this, name); // 借用父类构造函数
  this.age = age;
}

const child1 = new Child('张三', 10);
const child2 = new Child('李四', 20);

child1.colors.push('green');
console.log(child1.colors); // ['red', 'blue', 'green']
console.log(child2.colors); // ['red', 'blue'] — 互不影响
```

**缺点：** 方法都在构造函数中定义，无法复用；父类原型上的方法子类访问不到。

#### 3. 组合继承

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}
Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name); // 第二次调用 Parent
  this.age = age;
}
Child.prototype = new Parent(); // 第一次调用 Parent
Child.prototype.constructor = Child;

const child = new Child('张三', 10);
console.log(child.name);    // '张三'
console.log(child.sayName); // [Function]
```

**缺点：** 父类构造函数被调用了两次；`Child.prototype` 上有冗余的 `name` 和 `colors` 属性。

#### 4. 寄生组合继承（最佳方案）

```javascript
function Parent(name) {
  this.name = name;
  this.colors = ['red', 'blue'];
}
Parent.prototype.sayName = function() {
  console.log(this.name);
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

// 核心：使用 Object.create 创建原型，避免调用父类构造函数
Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;

Child.prototype.sayAge = function() {
  console.log(this.age);
};

const child = new Child('张三', 10);
child.colors.push('green');
console.log(child.colors);  // ['red', 'blue', 'green']
console.log(child.sayName); // [Function]
console.log(child.sayAge);  // [Function]

// 验证原型链上没有冗余属性
console.log(Child.prototype.name); // undefined
```

#### 5. ES6 class 继承

```javascript
class Parent {
  constructor(name) {
    this.name = name;
    this.colors = ['red', 'blue'];
  }

  sayName() {
    console.log(this.name);
  }

  // 静态方法
  static create(name) {
    return new Parent(name);
  }
}

class Child extends Parent {
  constructor(name, age) {
    super(name); // 必须在 this 之前调用
    this.age = age;
  }

  sayAge() {
    console.log(this.age);
  }
}

const child = new Child('张三', 10);
child.sayName(); // '张三'
child.sayAge();  // 10

// ES6 class 本质上是语法糖
console.log(typeof Parent); // 'function'
console.log(Child.__proto__ === Parent); // true
```

### 1.4 面试问答

**Q: 如何判断属性在对象自身还是原型上？**

```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.age = 25;

const person = new Person('张三');

// 1. hasOwnProperty — 判断自身属性
console.log(person.hasOwnProperty('name')); // true
console.log(person.hasOwnProperty('age'));  // false

// 2. Object.hasOwn (ES2022) — 更安全，不依赖原型链
console.log(Object.hasOwn(person, 'name')); // true
console.log(Object.hasOwn(person, 'age'));  // false

// 3. in 操作符 — 判断自身和原型链上是否存在
console.log('name' in person); // true
console.log('age' in person);  // true

// 4. 综合判断
function hasPrototypeProperty(obj, prop) {
  return prop in obj && !obj.hasOwnProperty(prop);
}
console.log(hasPrototypeProperty(person, 'age'));  // true
console.log(hasPrototypeProperty(person, 'name')); // false
```

**Q: Object.create(null) 和 {} 有什么区别？**

```javascript
const obj1 = {};
const obj2 = Object.create(null);

console.log(obj1.toString);    // [Function]
console.log(obj2.toString);    // undefined
console.log(obj2.__proto__);   // undefined

// Object.create(null) 创建的对象没有原型，常用于：
// 1. 创建纯净的字典对象（无原型链污染风险）
// 2. 作为 Map 的替代（性能更好）
// 3. 存储键值对，避免与原型属性冲突
```

---

## 2. 闭包

### 2.1 闭包的定义与原理

#### 定义

闭包（Closure）是指一个函数能够记住并访问它的词法作用域，即使这个函数在其词法作用域之外执行。

```javascript
function outer() {
  let count = 0; // 自由变量

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const counter = outer(); // outer 执行完毕，但 count 不会被回收
counter(); // 1
counter(); // 2
counter(); // 3

// count 变量被 inner 函数"闭包"引用，因此不会被垃圾回收
```

#### 原理解析

```
词法作用域（Lexical Scope）：
  - 函数的作用域在定义时确定，而非调用时
  - 内部函数可以访问外部函数的变量
  - 即使外部函数已经返回，内部函数仍保持对外部变量的引用

闭包 = 函数 + 其词法环境的引用
```

```javascript
// 闭包的本质：函数对象上保存了对外部词法环境的引用
function createMultiplier(factor) {
  return function(number) {
    return number * factor; // factor 通过闭包被记住
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
// double 和 triple 各自维护独立的闭包环境
```

### 2.2 闭包的应用场景

#### 1. 模块化（数据私有化）

```javascript
const CounterModule = (function() {
  // 私有变量
  let count = 0;

  // 私有方法
  function log(msg) {
    console.log(`[Counter] ${msg}`);
  }

  // 公开 API
  return {
    increment() {
      count++;
      log(`increment to ${count}`);
    },
    decrement() {
      count--;
      log(`decrement to ${count}`);
    },
    getCount() {
      return count;
    }
  };
})();

CounterModule.increment(); // [Counter] increment to 1
CounterModule.increment(); // [Counter] increment to 2
console.log(CounterModule.getCount()); // 2
console.log(CounterModule.count); // undefined — 无法直接访问私有变量
```

#### 2. 柯里化（Currying）

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

function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));    // 6
console.log(curriedAdd(1, 2)(3));    // 6
console.log(curriedAdd(1)(2, 3));    // 6
console.log(curriedAdd(1, 2, 3));    // 6
```

#### 3. 防抖与节流

```javascript
// 防抖 — 闭包保存 timer 变量
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流 — 闭包保存 last 变量
function throttle(fn, interval) {
  let last = 0;
  return function(...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
```

#### 4. 缓存（Memoization）

```javascript
function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const expensiveCalc = memoize(function(n) {
  console.log('计算中...');
  return n * n;
});

console.log(expensiveCalc(5)); // 计算中... → 25
console.log(expensiveCalc(5)); // 25（直接从缓存读取）
```

### 2.3 闭包的内存问题

#### 内存泄漏场景

```javascript
// 1. 意外的闭包引用
function createHandlers() {
  const arr = [];
  // bad: 每个闭包都引用了巨大的 data
  let hugeData = new Array(1000000).fill('x');

  for (let i = 0; i < 5; i++) {
    arr.push(function() {
      console.log(i); // 只需要 i，但 hugeData 也被闭包保留
    });
  }

  return arr;
}

// 修复：缩小闭包作用域
function createHandlersFixed() {
  const arr = [];

  for (let i = 0; i < 5; i++) {
    // hugeData 在块作用域内，闭包不会引用
    let hugeData = new Array(1000000).fill('x');
    arr.push(function() {
      console.log(i);
    });
    // hugeData 在每次迭代结束后可以被回收
  }

  return arr;
}
```

```javascript
// 2. 定时器中的闭包
function startPolling() {
  const data = fetchHugeData(); // 大数据

  setInterval(function() {
    const status = checkStatus(); // 只需要 status
    // 但 data 也被闭包引用，无法被回收
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
```

```javascript
// 3. DOM 事件监听器未移除
function bindEvent() {
  const element = document.getElementById('btn');
  const hugeData = new Array(1000000).fill('x');

  element.addEventListener('click', function() {
    console.log('clicked');
    // hugeData 被闭包引用，即使不再使用也不会被回收
  });

  // 修复：移除事件监听
  // element.removeEventListener('click', handler);
}
```

### 2.4 面试问答

**Q: 循环中的闭包问题（var vs let）**

```javascript
// 经典问题：var 声明导致闭包共享同一个变量
for (var i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // 3, 3, 3
  }, 100);
}

// 原因：var 声明的 i 是函数作用域，三个闭包共享同一个 i
// setTimeout 回调执行时，i 已经变为 3

// 解决方案 1：使用 let（块级作用域）
for (let i = 0; i < 3; i++) {
  setTimeout(function() {
    console.log(i); // 0, 1, 2
  }, 100);
}

// 原理：let 在每次循环迭代中创建新的绑定
// 等价于：
// { let i = 0; setTimeout(() => console.log(i), 100); }
// { let i = 1; setTimeout(() => console.log(i), 100); }
// { let i = 2; setTimeout(() => console.log(i), 100); }

// 解决方案 2：IIFE 创建新的作用域
for (var i = 0; i < 3; i++) {
  (function(j) {
    setTimeout(function() {
      console.log(j); // 0, 1, 2
    }, 100);
  })(i);
}

// 解决方案 3：使用 setTimeout 第三个参数
for (var i = 0; i < 3; i++) {
  setTimeout(function(j) {
    console.log(j); // 0, 1, 2
  }, 100, i);
}
```

**Q: 闭包会导致内存泄漏吗？**

不一定。闭包本身不会导致内存泄漏，只有当闭包引用了不再需要的大对象，且闭包本身被长期持有（如全局变量、事件监听器、定时器）时，才会导致内存泄漏。现代浏览器的垃圾回收器能够正确处理闭包中的引用。

---

## 3. this 指向

### 3.1 this 的五种绑定规则

#### 1. 默认绑定

```javascript
// 非严格模式：this 指向全局对象（浏览器中为 window）
function foo() {
  console.log(this);
}
foo(); // window（非严格模式）/ undefined（严格模式）

// 严格模式
'use strict';
function bar() {
  console.log(this);
}
bar(); // undefined
```

#### 2. 隐式绑定

```javascript
const obj = {
  name: '张三',
  sayName() {
    console.log(this.name);
  }
};

obj.sayName(); // '张三' — this 指向调用者 obj

// 隐式丢失
const fn = obj.sayName;
fn(); // undefined — this 指向全局对象

// 回调中的隐式丢失
function doSomething(callback) {
  callback();
}
doSomething(obj.sayName); // undefined
```

#### 3. 显式绑定（call / apply / bind）

```javascript
function greet(greeting) {
  console.log(`${greeting}, ${this.name}`);
}

const person = { name: '张三' };

// call — 立即调用，逐个传参
greet.call(person, '你好'); // '你好, 张三'

// apply — 立即调用，数组传参
greet.apply(person, ['你好']); // '你好, 张三'

// bind — 返回新函数，不立即调用
const boundGreet = greet.bind(person, '你好');
boundGreet(); // '你好, 张三'
```

#### 4. new 绑定

```javascript
function Person(name) {
  this.name = name;
  // new 操作符做了以下事情：
  // 1. 创建一个新对象 {}
  // 2. 将新对象的 __proto__ 指向构造函数的 prototype
  // 3. 将 this 绑定到新对象
  // 4. 如果构造函数返回对象，则返回该对象；否则返回新对象
}

const person = new Person('张三');
console.log(person.name); // '张三'
```

#### 5. 箭头函数

```javascript
// 箭头函数没有自己的 this，继承外层词法作用域的 this
const obj = {
  name: '张三',
  sayName: () => {
    console.log(this.name); // undefined — this 继承外层（全局）
  },
  sayNameNormal() {
    const arrow = () => {
      console.log(this.name); // '张三' — this 继承 sayNameNormal 的 this
    };
    arrow();
  }
};

obj.sayName();      // undefined
obj.sayNameNormal(); // '张三'
```

### 3.2 绑定优先级

```
new 绑定 > 显式绑定（bind） > 隐式绑定 > 默认绑定
```

```javascript
function foo() {
  console.log(this.a);
}

const obj1 = { a: 1, foo };
const obj2 = { a: 2, foo };

// 隐式绑定
obj1.foo(); // 1

// 显式绑定优先于隐式绑定
obj1.foo.call(obj2); // 2

// new 绑定优先于显式绑定
const bar = foo.bind(obj1);
const instance = new bar(); // undefined（this 指向新对象，不是 obj1）
```

### 3.3 面试问答

**Q: 箭头函数的 this 为什么是词法作用域？**

箭头函数的设计目的是为了解决回调函数中 `this` 指向不直观的问题。在箭头函数出现之前，开发者经常需要使用 `var self = this` 或 `.bind(this)` 来保存外层的 `this`。

```javascript
// 箭头函数出现前
function Timer() {
  this.seconds = 0;
  var self = this; // 保存 this
  setInterval(function() {
    self.seconds++;
    console.log(self.seconds);
  }, 1000);
}

// 箭头函数
function Timer2() {
  this.seconds = 0;
  setInterval(() => {
    this.seconds++; // 自动继承外层 this
    console.log(this.seconds);
  }, 1000);
}
```

箭头函数在**定义时**就确定了 `this` 的指向（继承外层词法作用域的 `this`），而不是在**调用时**确定。这是因为箭头函数没有自己的 `this`、`arguments`、`super`、`new.target`。

**注意：** 箭头函数不能用作构造函数（不能 new），也没有 `prototype` 属性。

**Q: 实现一个 bind 函数？**

```javascript
Function.prototype.myBind = function(context, ...outerArgs) {
  const fn = this;

  const bound = function(...innerArgs) {
    // 如果是 new 调用，this 应该指向新实例
    return fn.call(
      this instanceof bound ? this : context,
      ...outerArgs,
      ...innerArgs
    );
  };

  // 继承原函数的原型
  bound.prototype = Object.create(fn.prototype);
  return bound;
};

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.bind(null, '张三');
const p = new BoundPerson(25);
console.log(p.name); // '张三'
console.log(p.age);  // 25
```

---

## 4. 事件循环（浏览器端）

### 4.1 宏任务与微任务

#### 分类

| 宏任务（Macrotask） | 微任务（Microtask） |
|---|---|
| setTimeout / setInterval | Promise.then / catch / finally |
| requestAnimationFrame（注：rAF 有独立的回调队列，由浏览器在渲染流程中调度，不完全等同于普通宏任务） | MutationObserver |
| I/O 操作 | queueMicrotask |
| UI 渲染 | process.nextTick（Node.js） |
| setImmediate（Node.js） | |

#### 执行顺序

```
同步代码 → 微任务队列（全部清空）→ 宏任务（取一个）→ 微任务队列（全部清空）→ ...
```

```javascript
console.log('1. 同步');

setTimeout(() => {
  console.log('2. 宏任务 setTimeout');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('3. 微任务 Promise 1');
  })
  .then(() => {
    console.log('4. 微任务 Promise 2');
  });

queueMicrotask(() => {
  console.log('5. 微任务 queueMicrotask');
});

console.log('6. 同步');

// 输出顺序：
// 1. 同步
// 6. 同步
// 3. 微任务 Promise 1
// 5. 微任务 queueMicrotask
// 4. 微任务 Promise 2
// 2. 宏任务 setTimeout
```

### 4.2 常见面试题

#### Promise.then vs setTimeout

```javascript
console.log('start');

setTimeout(() => {
  console.log('timeout');
}, 0);

new Promise((resolve) => {
  console.log('promise executor'); // 同步执行
  resolve();
}).then(() => {
  console.log('promise then'); // 微任务
});

console.log('end');

// 输出：
// start
// promise executor
// end
// promise then
// timeout
```

#### 复杂嵌套

```javascript
console.log('1');

setTimeout(() => {
  console.log('2');
  Promise.resolve().then(() => {
    console.log('3');
  });
}, 0);

Promise.resolve().then(() => {
  console.log('4');
  setTimeout(() => {
    console.log('5');
  }, 0);
}).then(() => {
  console.log('6');
});

console.log('7');

// 输出：1, 7, 4, 6, 2, 3, 5
```

#### async/await 执行顺序

```javascript
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 输出：
// script start
// async1 start
// async2
// promise1
// script end
// async1 end
// promise2
// setTimeout
```

### 4.3 requestAnimationFrame vs setTimeout

```javascript
// requestAnimationFrame 在下一次重绘前执行（通常 16.6ms / 60fps）
// setTimeout 最小延迟 4ms（HTML5 规范），不与渲染周期同步

// 动画应该使用 rAF
function animate() {
  // 更新动画状态
  element.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// rAF 的优势：
// 1. 与浏览器刷新率同步，避免掉帧
// 2. 页面不可见时自动暂停，节省资源
// 3. 浏览器可以优化多个 rAF 回调的执行

// setTimeout 的问题：
// 1. 不与渲染周期同步，可能出现卡顿
// 2. 即使页面不可见也会执行
// 3. 最小延迟限制（嵌套调用时延迟至少 4ms）
```

### 4.4 Node.js 事件循环与浏览器的区别

```
Node.js 事件循环的六个阶段：
  1. timers — setTimeout / setInterval
  2. pending callbacks — 执行 I/O 回调
  3. idle, prepare — 内部使用
  4. poll — 检索新的 I/O 事件
  5. check — setImmediate
  6. close callbacks — close 事件

关键区别：
  1. Node.js 有多个宏任务队列（按阶段划分），浏览器只有一个
  2. Node.js 中微任务在阶段之间执行
  3. Node.js 的 process.nextTick 优先级高于 Promise.then
  4. setImmediate 只在 Node.js 中存在
```

```javascript
// Node.js 中的执行顺序
setTimeout(() => console.log('setTimeout'), 0);
setImmediate(() => console.log('setImmediate'));

// 在 I/O 回调中：setImmediate 优先
// 在主模块中：不确定（取决于事件循环当前阶段）

// 微任务优先级：nextTick > Promise.then
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
// 输出：nextTick, promise
```

---

## 5. ES6+ 新特性

### 5.1 let/const 与块级作用域

```javascript
// let — 块级作用域，存在暂时性死区（TDZ）
{
  // TDZ 开始
  // console.log(a); // ReferenceError
  let a = 1;
  // TDZ 结束
  console.log(a); // 1
}

// console.log(a); // ReferenceError: a is not defined

// const — 块级作用域，声明时必须初始化，不可重新赋值
const obj = { name: '张三' };
obj.name = '李四'; // 可以修改属性
// obj = {}; // TypeError: Assignment to constant variable

// 经典面试题：for 循环 + var vs let
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0); // 3, 3, 3
}

for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 0); // 0, 1, 2
}
```

### 5.2 解构赋值、展开运算符

```javascript
// 数组解构
const [a, b, ...rest] = [1, 2, 3, 4, 5];
console.log(a, b, rest); // 1, 2, [3, 4, 5]

// 交换变量
let x = 1, y = 2;
[x, y] = [y, x];

// 对象解构 + 重命名 + 默认值
const { name: userName, age = 18, address: { city } } = {
  name: '张三',
  address: { city: '北京' }
};
console.log(userName, age, city); // '张三', 18, '北京'

// 函数参数解构
function greet({ name, age = 18 }) {
  console.log(`${name}, ${age}`);
}
greet({ name: '张三' }); // '张三, 18'

// 展开运算符
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, b: 3, c: 4 }; // { a: 1, b: 3, c: 4 }

// 浅拷贝
const clone = { ...obj1 };
```

### 5.3 Symbol、Iterator、Generator

#### Symbol

```javascript
// 创建唯一标识符
const id1 = Symbol('id');
const id2 = Symbol('id');
console.log(id1 === id2); // false

// 作为对象属性键（不会出现在 for...in 中）
const user = {
  [Symbol('id')]: 1,
  name: '张三'
};

// 内置 Symbol
// Symbol.iterator — 定义迭代行为
// Symbol.toPrimitive — 类型转换
// Symbol.toStringTag — Object.prototype.toString 的标签

// Symbol.iterator 示例
const iterable = {
  [Symbol.iterator]() {
    let step = 0;
    return {
      next() {
        step++;
        if (step <= 3) {
          return { value: step, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
};

for (const val of iterable) {
  console.log(val); // 1, 2, 3
}
```

#### Generator

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
console.log(fib.next().value); // 3
console.log(fib.next().value); // 5

// Generator 实现异步流程控制
function* loadData() {
  const user = yield fetch('/api/user');
  const posts = yield fetch(`/api/posts?userId=${user.id}`);
  return posts;
}

// 配合 co 库自动执行
// co(loadData).then(posts => console.log(posts));
```

### 5.4 Proxy 与 Reflect

```javascript
// Proxy — 拦截对象的基本操作
const handler = {
  get(target, prop, receiver) {
    console.log(`访问属性: ${prop}`);
    return Reflect.get(target, prop, receiver);
  },
  set(target, prop, value, receiver) {
    console.log(`设置属性: ${prop} = ${value}`);
    return Reflect.set(target, prop, value, receiver);
  },
  deleteProperty(target, prop) {
    console.log(`删除属性: ${prop}`);
    return Reflect.deleteProperty(target, prop);
  }
};

const proxy = new Proxy({ name: '张三' }, handler);
proxy.name;        // 访问属性: name
proxy.age = 25;    // 设置属性: age = 25
delete proxy.name; // 删除属性: name

// 实现响应式（Vue 3 核心原理）
function reactive(target) {
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
}

// Reflect — 提供拦截 JavaScript 操作的方法
// 与 Proxy handler 方法一一对应
// 优势：1. 返回布尔值表示操作是否成功  2. 正确的 this 绑定
console.log(Reflect.get({ name: '张三' }, 'name')); // '张三'
console.log(Reflect.has({ name: '张三' }, 'name')); // true
```

### 5.5 WeakMap、WeakRef、FinalizationRegistry

```javascript
// WeakMap — 键必须是对象，弱引用，不阻止垃圾回收
const weakMap = new WeakMap();
let obj = { name: '张三' };

weakMap.set(obj, 'some data');
console.log(weakMap.get(obj)); // 'some data'

obj = null; // 对象可以被垃圾回收，WeakMap 中的条目自动移除

// 应用场景：
// 1. 为 DOM 元素关联数据（元素移除后自动清理）
// 2. 私有数据存储
// 3. 缓存计算结果

// WeakRef — 对对象的弱引用
let target = { data: 'important' };
const weakRef = new WeakRef(target);

console.log(weakRef.deref()); // { data: 'important' }（如果未被回收）
console.log(weakRef.deref()); // undefined（如果已被回收）

target = null; // 允许垃圾回收

// FinalizationRegistry — 对象被垃圾回收时执行回调
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`对象 ${heldValue} 已被回收`);
});

let obj2 = { name: '李四' };
registry.register(obj2, 'obj2');

obj2 = null; // 当 obj2 被回收时，回调会被触发
// 注意：回调执行时机不确定，不要依赖它做关键逻辑
```

### 5.6 Optional Chaining、Nullish Coalescing

```javascript
// Optional Chaining (?.)
const user = {
  profile: {
    address: {
      city: '北京'
    }
  }
};

console.log(user?.profile?.address?.city);  // '北京'
console.log(user?.profile?.phone?.number);   // undefined
console.log(user?.getFullName?.());          // undefined（方法不存在）

// 数组 Optional Chaining
const arr = [1, 2, 3];
console.log(arr?.[0]); // 1
console.log(arr?.[10]); // undefined

// Nullish Coalescing (??)
// 只在 null 或 undefined 时使用默认值（0、''、false 不触发）
const value = 0;
console.log(value ?? 'default'); // 0
console.log(value || 'default'); // 'default'

const emptyStr = '';
console.log(emptyStr ?? 'default'); // ''
console.log(emptyStr || 'default'); // 'default'

const nullVal = null;
console.log(nullVal ?? 'default'); // 'default'

// 组合使用
const config = {
  timeout: 0,
  retries: null
};

const timeout = config?.timeout ?? 3000;  // 0
const retries = config?.retries ?? 3;     // 3
```

---

## 6. 前端手撕代码题

### 6.1 防抖（debounce）

```javascript
/**
 * 防抖：在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 * 应用场景：搜索框输入联想、窗口 resize、按钮防重复点击
 */
function debounce(fn, delay = 300, immediate = false) {
  let timer = null;

  const debounced = function(...args) {
    // 清除上一次的定时器
    if (timer) clearTimeout(timer);

    if (immediate) {
      // 立即执行模式
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, delay);
      if (callNow) {
        fn.apply(this, args);
      }
    } else {
      // 非立即执行模式
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    }
  };

  // 取消防抖
  debounced.cancel = function() {
    clearTimeout(timer);
    timer = null;
  };

  return debounced;
}

// 使用示例
const handleSearch = debounce((keyword) => {
  console.log('搜索:', keyword);
  // 发送搜索请求...
}, 500);

input.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});

// 面试追问：为什么需要在防抖中保存 this 和 arguments？
// 答：因为 setTimeout 中的回调函数的 this 指向 window，
//     而 arguments 也丢失了原始调用的参数，需要通过闭包保存。
```

### 6.2 节流（throttle）

```javascript
/**
 * 节流：规定时间内只执行一次，降低高频事件的触发频率
 * 应用场景：滚动事件、鼠标移动、窗口 resize、抢购按钮
 */

// 方案 1：时间戳版本（第一次立即执行）
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

// 方案 2：定时器版本（最后一次也会执行）
function throttleTimer(fn, interval = 300) {
  let timer = null;
  return function(...args) {
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, interval);
    }
  };
}

// 方案 3：完整版（首次和末次都能执行）
function throttleFull(fn, interval = 300) {
  let last = 0;
  let timer = null;

  return function(...args) {
    const now = Date.now();
    const remaining = interval - (now - last);

    clearTimeout(timer);

    if (remaining <= 0) {
      // 超过间隔时间，立即执行
      last = now;
      fn.apply(this, args);
    } else {
      // 未超过间隔时间，设置定时器保证最后一次执行
      timer = setTimeout(() => {
        last = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

### 6.3 深拷贝（deepClone）

```javascript
/**
 * 深拷贝：递归 + 循环引用处理 + 特殊对象处理
 */
function deepClone(target, cache = new WeakMap()) {
  // 基本类型直接返回
  if (target === null || typeof target !== 'object') {
    return target;
  }

  // 处理循环引用
  if (cache.has(target)) {
    return cache.get(target);
  }

  // 处理特殊对象
  if (target instanceof Date) {
    return new Date(target.getTime());
  }
  if (target instanceof RegExp) {
    return new RegExp(target.source, target.flags);
  }
  if (target instanceof Map) {
    const map = new Map();
    cache.set(target, map);
    target.forEach((value, key) => {
      map.set(deepClone(key, cache), deepClone(value, cache));
    });
    return map;
  }
  if (target instanceof Set) {
    const set = new Set();
    cache.set(target, set);
    target.forEach((value) => {
      set.add(deepClone(value, cache));
    });
    return set;
  }

  // 处理数组和普通对象
  const clone = Array.isArray(target) ? [] : {};
  cache.set(target, clone);

  // 处理 Symbol 属性
  const allKeys = [
    ...Object.keys(target),
    ...Object.getOwnPropertySymbols(target)
  ];

  for (const key of allKeys) {
    clone[key] = deepClone(target[key], cache);
  }

  return clone;
}

// 测试
const obj = {
  name: '张三',
  age: 25,
  hobbies: ['reading', 'coding'],
  address: { city: '北京', district: '海淀' },
  date: new Date(),
  regex: /abc/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
  [Symbol('id')]: 1
};

obj.self = obj; // 循环引用

const cloned = deepClone(obj);
console.log(cloned.self === cloned); // true（循环引用正确处理）
console.log(cloned !== obj);         // true（不同引用）
console.log(cloned.address !== obj.address); // true（深拷贝）
console.log(cloned.date instanceof Date);    // true
console.log(cloned.regex instanceof RegExp); // true
```

### 6.4 发布订阅模式（EventEmitter）

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  // 订阅事件
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this; // 支持链式调用
  }

  // 订阅一次
  once(event, listener) {
    const wrapper = (...args) => {
      listener.apply(this, args);
      this.off(event, wrapper);
    };
    wrapper.raw = listener; // 保存原始引用
    return this.on(event, wrapper);
  }

  // 取消订阅
  off(event, listener) {
    if (!this.events.has(event)) return this;

    const listeners = this.events.get(event);
    this.events.set(
      event,
      listeners.filter(
        (fn) => fn !== listener && fn.raw !== listener
      )
    );

    // 如果没有监听器了，删除事件
    if (this.events.get(event).length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  // 触发事件
  emit(event, ...args) {
    if (!this.events.has(event)) return false;

    const listeners = this.events.get(event).slice(); // 复制数组，防止在遍历中修改
    listeners.forEach((listener) => {
      listener.apply(this, args);
    });

    return true;
  }

  // 获取事件监听器数量
  listenerCount(event) {
    return this.events.get(event)?.length || 0;
  }

  // 移除所有事件监听
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }
}

// 使用示例
const emitter = new EventEmitter();

const handler = (data) => console.log('收到消息:', data);
emitter.on('message', handler);
emitter.once('connect', () => console.log('已连接'));

emitter.emit('message', 'Hello'); // 收到消息: Hello
emitter.emit('connect');          // 已连接
emitter.emit('connect');          // （无输出，once 只触发一次）

emitter.off('message', handler);
emitter.emit('message', 'World'); // （无输出，已取消订阅）
```

### 6.5 Promise.all / Promise.race / Promise.allSettled 手写

```javascript
// Promise.all — 所有成功才成功，一个失败就失败
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const iterable = Array.from(promises);
    if (iterable.length === 0) {
      resolve([]);
      return;
    }

    const results = new Array(iterable.length);
    let count = 0;

    iterable.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => {
          results[index] = value;
          count++;
          if (count === iterable.length) {
            resolve(results);
          }
        },
        (reason) => reject(reason)
      );
    });
  });
}

// Promise.race — 返回最先完成的结果（无论成功或失败）
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    const iterable = Array.from(promises);
    if (iterable.length === 0) return;

    iterable.forEach((promise) => {
      Promise.resolve(promise).then(resolve, reject);
    });
  });
}

// Promise.allSettled — 等待所有完成，返回每个的结果
function promiseAllSettled(promises) {
  return new Promise((resolve) => {
    const iterable = Array.from(promises);
    if (iterable.length === 0) {
      resolve([]);
      return;
    }

    const results = new Array(iterable.length);
    let count = 0;

    iterable.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => {
          results[index] = { status: 'fulfilled', value };
          count++;
          if (count === iterable.length) resolve(results);
        },
        (reason) => {
          results[index] = { status: 'rejected', reason };
          count++;
          if (count === iterable.length) resolve(results);
        }
      );
    });
  });
}

// 测试
const p1 = Promise.resolve(1);
const p2 = Promise.reject('error');
const p3 = Promise.resolve(3);

promiseAll([p1, p3]).then(console.log); // [1, 3]
promiseAll([p1, p2, p3]).catch(console.error); // 'error'

promiseRace([p1, p3]).then(console.log); // 1

promiseAllSettled([p1, p2, p3]).then(console.log);
// [{ status: 'fulfilled', value: 1 },
//  { status: 'rejected', reason: 'error' },
//  { status: 'fulfilled', value: 3 }]
```

### 6.6 数组扁平化（flatten）

```javascript
// 方案 1：递归
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

// 方案 2：reduce + 递归
function flattenReduce(arr) {
  return arr.reduce((acc, item) => {
    return acc.concat(Array.isArray(item) ? flattenReduce(item) : item);
  }, []);
}

// 方案 3：迭代（使用栈）
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
  return result.reverse(); // 因为是 pop，需要反转
}

// 方案 4：ES6 flat（生产环境直接使用）
// [1, [2, [3, [4]]]].flat(Infinity); // [1, 2, 3, 4]

// 测试
console.log(flatten([1, [2, [3, [4]]]])); // [1, 2, 3, 4]
console.log(flatten([1, [2, [3, [4]]]], 1)); // [1, 2, [3, [4]]]
console.log(flattenReduce([1, [2, [3, [4]]]])); // [1, 2, 3, 4]
console.log(flattenIterative([1, [2, [3, [4]]]])); // [1, 2, 3, 4]
```

### 6.7 柯里化（curry）

```javascript
/**
 * 柯里化：将多参数函数转换为一系列单参数函数
 */
function curry(fn) {
  return function curried(...args) {
    // 参数够了，执行原函数
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // 参数不够，返回新函数继续收集参数
    return function(...args2) {
      return curried.apply(this, args.concat(args2));
    };
  };
}

// 使用示例
function add(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(add);
console.log(curriedAdd(1)(2)(3));     // 6
console.log(curriedAdd(1, 2)(3));     // 6
console.log(curriedAdd(1)(2, 3));     // 6
console.log(curriedAdd(1, 2, 3));     // 6

// 实际应用：复用配置
const match = curry((reg, str) => reg.test(str));
const hasNumber = match(/\d+/);
console.log(hasNumber('abc123')); // true
console.log(hasNumber('abc'));    // false

const filter = curry((fn, arr) => arr.filter(fn));
const getNumbers = filter(hasNumber);
console.log(getNumbers(['abc', '123', 'def'])); // ['123']
```

### 6.8 LRU 缓存实现

```javascript
/**
 * LRU (Least Recently Used) 缓存
 * 使用 Map 保持插入顺序（ES6 Map 按插入顺序迭代）
 * get/put 操作时间复杂度 O(1)
 */
class LRUCache {
  constructor(capacity) {
    if (capacity <= 0) throw new Error('capacity must be positive');
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }
    // 删除后重新插入，更新顺序（移到末尾 = 最近使用）
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key); // 先删除
    }
    this.cache.set(key, value);
    // 超过容量，删除最久未使用的（第一个元素）
    if (this.cache.size > this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  get size() {
    return this.cache.size;
  }
}

// 测试
const cache = new LRUCache(3);
cache.put('a', 1);
cache.put('b', 2);
cache.put('c', 3);
console.log(cache.get('a')); // 1（a 变为最近使用）
cache.put('d', 4);           // 淘汰 b（最久未使用）
console.log(cache.get('b')); // -1（已被淘汰）
console.log(cache.size);     // 3

// 面试追问：为什么使用 Map 而不是普通对象？
// 1. Map 保持插入顺序
// 2. Map 的 key 可以是任意类型
// 3. Map 的 size 属性直接获取大小
// 4. Map 的 delete 操作更高效
```

### 6.9 new 操作符模拟实现

```javascript
/**
 * new 操作符做了什么：
 * 1. 创建一个新对象
 * 2. 将新对象的 __proto__ 指向构造函数的 prototype
 * 3. 将构造函数的 this 绑定到新对象
 * 4. 如果构造函数返回对象，则返回该对象；否则返回新对象
 */
function myNew(Constructor, ...args) {
  // 1. 创建新对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);

  // 2. 执行构造函数，this 绑定到新对象
  const result = Constructor.apply(obj, args);

  // 3. 判断返回值
  // 如果构造函数返回的是对象（非 null），则返回该对象
  // 否则返回新创建的对象
  return result !== null && (typeof result === 'object' || typeof result === 'function')
    ? result
    : obj;
}

// 测试
function Person(name, age) {
  this.name = name;
  this.age = age;
}
Person.prototype.sayHello = function() {
  console.log(`Hello, I'm ${this.name}`);
};

const person = myNew(Person, '张三', 25);
console.log(person.name);          // '张三'
console.log(person.age);           // 25
console.log(person instanceof Person); // true
person.sayHello();                 // "Hello, I'm 张三"

// 边界情况：构造函数返回对象
function Factory() {
  return { type: 'object' };
}
const result = myNew(Factory);
console.log(result.type); // 'object'（返回构造函数的对象）
```

### 6.10 call / apply / bind 手写

```javascript
// 手写 call
Function.prototype.myCall = function(context, ...args) {
  context = context == null ? globalThis : Object(context);

  // 使用 Symbol 避免属性名冲突
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

// 手写 bind
Function.prototype.myBind = function(context, ...outerArgs) {
  const fn = this;

  const bound = function(...innerArgs) {
    // 如果是 new 调用，this 指向新实例
    // 否则 this 指向绑定的 context
    return fn.call(
      this instanceof bound ? this : context,
      ...outerArgs,
      ...innerArgs
    );
  };

  // 继承原函数的原型链
  bound.prototype = Object.create(fn.prototype);
  return bound;
};

// 测试
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: '张三' };

console.log(greet.myCall(person, 'Hello', '!'));  // 'Hello, 张三!'
console.log(greet.myApply(person, ['Hi', '~']));   // 'Hi, 张三~'

const boundGreet = greet.myBind(person, 'Hey');
console.log(boundGreet('?')); // 'Hey, 张三?'
```

### 6.11 instanceof 手写

```javascript
/**
 * instanceof 原理：
 * 沿着对象的原型链（__proto__）向上查找，
 * 直到找到构造函数的 prototype 或到达原型链终点（null）
 */
function myInstanceof(instance, Constructor) {
  // 基本类型直接返回 false
  if (instance === null || (typeof instance !== 'object' && typeof instance !== 'function')) {
    return false;
  }

  // 获取构造函数的 prototype
  const prototype = Constructor.prototype;
  if (!prototype) return false;

  // 沿着原型链查找
  let current = instance.__proto__;

  while (current !== null) {
    if (current === prototype) {
      return true;
    }
    current = current.__proto__;
  }

  return false;
}

// 测试
console.log(myInstanceof([], Array));    // true
console.log(myInstanceof({}, Object));   // true
console.log(myInstanceof('abc', String)); // false
console.log(myInstanceof(123, Number));  // false

function Person() {}
const p = new Person();
console.log(myInstanceof(p, Person));    // true
console.log(myInstanceof(p, Object));    // true
```

### 6.12 懒加载函数实现

```javascript
/**
 * 懒加载函数：在第一次调用时才进行初始化
 * 适用于：初始化开销大的操作（创建复杂对象、加载模块等）
 */

// 方案 1：闭包 + 缓存
function createHeavyObject() {
  console.log('创建重对象...');
  return { data: new Array(10000).fill('x') };
}

const getHeavyObject = (function() {
  let instance = null;
  return function() {
    if (!instance) {
      instance = createHeavyObject();
    }
    return instance;
  };
})();

console.log(getHeavyObject()); // 创建重对象... { data: [...] }
console.log(getHeavyObject()); // { data: [...] }（不再创建）

// 方案 2：函数替换（更高效，后续调用无 if 判断）
function getParser() {
  // 首次调用时创建 parser，然后替换函数自身
  const parser = {
    parse(str) {
      return JSON.parse(str);
    }
  };

  // 替换自身
  getParser = function() {
    return parser;
  };

  return parser;
}

console.log(getParser().parse('{"a":1}')); // { a: 1 }
console.log(getParser().parse('{"b":2}')); // { b: 2 }（直接返回，无判断）

// 方案 3：单例模式
class Singleton {
  static instance = null;

  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  constructor() {
    if (Singleton.instance) {
      throw new Error('请使用 Singleton.getInstance()');
    }
  }
}
```

### 6.13 数组去重多种方式

```javascript
const arr = [1, 2, 3, 2, 1, '1', '2', true, true, null, null, undefined, undefined,
  { a: 1 }, { a: 1 }, [1], [1]];

// 1. Set（最简单，适用于基本类型）
const unique1 = [...new Set(arr)];
// [1, 2, 3, '1', '2', true, null, undefined, {a:1}, {a:1}, [1], [1]]
// 注意：对象和数组引用不同，不会被去重

// 2. filter + indexOf
const unique2 = arr.filter((item, index) => arr.indexOf(item) === index);

// 3. reduce
const unique3 = arr.reduce((acc, item) => {
  if (!acc.includes(item)) acc.push(item);
  return acc;
}, []);

// 4. Map（利用 key 唯一性）
const unique4 = [...new Map(arr.map(item => [item, item])).values()];

// 5. 对象去重（适用于对象数组，按某个字段）
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三' }
];

const uniqueUsers = [...new Map(users.map(user => [user.id, user])).values()];
// [{ id: 1, name: '张三' }, { id: 2, name: '李四' }]

// 6. 深度去重（JSON 序列化，有局限性）
const uniqueDeep = [...new Set(arr.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));

// 性能对比：
// Set > Map > indexOf > includes > reduce
// Set 时间复杂度 O(n)，indexOf/includes 是 O(n^2)
```

### 6.14 对象扁平化 / 深层取值

```javascript
// 对象扁平化
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

const nested = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3
    }
  },
  f: [4, 5]
};

console.log(flattenObject(nested));
// { a: 1, 'b.c': 2, 'b.d.e': 3, f: [4, 5] }

// 深层取值（安全访问嵌套属性）
function getDeepValue(obj, path, defaultValue = undefined) {
  const keys = Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.');

  let result = obj;
  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
}

const data = {
  user: {
    profile: {
      address: {
        city: '北京'
      },
      tags: ['developer', 'designer']
    }
  }
};

console.log(getDeepValue(data, 'user.profile.address.city')); // '北京'
console.log(getDeepValue(data, 'user.profile.address.zip'));   // undefined
console.log(getDeepValue(data, 'user.profile.address.zip', '000000')); // '000000'
console.log(getDeepValue(data, 'user.profile.tags[0]'));      // 'developer'
console.log(getDeepValue(data, 'user.profile.tags[5]'));      // undefined

// ES2020+ 可以直接使用 Optional Chaining
// data?.user?.profile?.address?.city
```

---

> 本文档涵盖了 JavaScript 核心原理的高频面试知识点，每个知识点都包含概念讲解、代码示例和面试问答。建议结合实际项目练习手撕代码题，加深理解。
