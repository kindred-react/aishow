# Node.js后端开发

> 目标读者：有JavaScript/React基础的后端为主的全栈开发者，面向3-5年经验面试

---

## 目录

1. [Node.js基础](#1-nodejs基础)
2. [异步编程深入](#2-异步编程深入)
3. [Express框架](#3-express框架)
4. [Koa框架](#4-koa框架)
5. [NestJS框架](#5-nestjs框架)
6. [数据库操作](#6-数据库操作)
7. [认证与授权](#7-认证与授权)
8. [API设计](#8-api设计)
9. [性能与部署](#9-性能与部署)
10. [实战项目](#10-实战项目)

---

## 1. Node.js基础

### 1.1 事件循环机制

#### 原理

Node.js的事件循环是Node.js能够实现非阻塞I/O的核心机制。事件循环允许Node.js执行非阻塞I/O操作，尽管JavaScript是单线程的。

事件循环的六个阶段：

1. **Timers（定时器）**：执行 `setTimeout()` 和 `setInterval()` 的回调
2. **Pending Callbacks（待定回调）**：执行推迟到下一次循环迭代的I/O回调
3. **Idle, Prepare（闲置，准备）**：仅内部使用
4. **Poll（轮询）**：检索新的I/O事件；执行I/O相关的回调
5. **Check（检查）**：执行 `setImmediate()` 的回调
6. **Close Callbacks（关闭回调）**：执行 `socket.on('close', ...)` 等回调

#### 代码示例

```javascript
// 事件循环示例
console.log('1. 开始');

setTimeout(() => {
  console.log('2. setTimeout');
}, 0);

setImmediate(() => {
  console.log('3. setImmediate');
});

process.nextTick(() => {
  console.log('4. nextTick');
});

Promise.resolve().then(() => {
  console.log('5. Promise');
});

console.log('6. 结束');

// 输出顺序：
// 1. 开始
// 6. 结束
// 4. nextTick
// 5. Promise
// 2. setTimeout 或 3. setImmediate（顺序不确定）
```

```javascript
// 微任务 vs 宏任务
console.log('start');

setTimeout(() => {
  console.log('timeout1');
  Promise.resolve().then(() => console.log('promise1'));
}, 0);

setTimeout(() => {
  console.log('timeout2');
  Promise.resolve().then(() => console.log('promise2'));
}, 0);

Promise.resolve().then(() => console.log('promise3'));

console.log('end');

// 输出：
// start, end, promise3, timeout1, promise1, timeout2, promise2
```

#### 面试题

**Q1: Node.js事件循环的执行顺序是什么？**

**答案：**
1. 执行同步代码
2. 执行微任务队列（process.nextTick > Promise）
3. 执行宏任务队列（Timers > Pending Callbacks > Idle/Prepare > Poll > Check > Close Callbacks）
4. 每个宏任务执行完后，清空微任务队列

**Q2: process.nextTick 和 setImmediate 的区别是什么？**

**答案：**
- `process.nextTick()`：在当前操作完成后立即执行，优先级高于所有微任务
- `setImmediate()`：在事件循环的Check阶段执行，优先级低于微任务
- 在I/O回调中，`setImmediate()` 总是先于 `setTimeout()` 执行
- 在主模块中，执行顺序不确定

**Q3: 什么是微任务和宏任务？**

**答案：**
- **微任务**：Promise.then/catch/finally、queueMicrotask
- **process.nextTick()**：拥有独立的 nextTick queue，优先级高于 Promise 微任务队列
- **宏任务**：setTimeout、setInterval、setImmediate、I/O操作、UI渲染
- 微任务优先级高于宏任务，每个宏任务执行完后会清空所有微任务

---

### 1.2 模块系统 CommonJS/ESM

#### 原理

Node.js最初使用CommonJS模块系统，后来也支持ES Modules（ESM）。

**CommonJS特点：** 运行时加载、同步加载、值拷贝、使用 `require()` 和 `module.exports`

**ESM特点：** 编译时加载、异步加载、值引用、使用 `import` 和 `export`

#### 代码示例

```javascript
// CommonJS - math.js
function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }

module.exports = { add, subtract };
// 或者
// exports.add = add;
// exports.subtract = subtract;
```

```javascript
// CommonJS - main.js
const { add, subtract } = require('./math');
console.log(add(1, 2)); // 3
console.log(subtract(5, 3)); // 2
```

```javascript
// ESM - math.mjs
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }
export default function multiply(a, b) { return a * b; }
```

```javascript
// ESM - main.mjs
import { add, subtract } from './math.mjs';
import multiply from './math.mjs';
console.log(add(1, 2)); // 3
console.log(multiply(3, 4)); // 12
```

```javascript
// 混合使用 - package.json
{
  "type": "module" // 使用ESM
  // "type": "commonjs" // 使用CommonJS（默认）
}
// .js - 根据package.json的type
// .cjs - 强制CommonJS
// .mjs - 强制ESM
```

#### 面试题

**Q4: CommonJS 和 ESM 的主要区别是什么？**

**答案：**

| 特性 | CommonJS | ESM |
|------|----------|-----|
| 加载时机 | 运行时 | 编译时 |
| 加载方式 | 同步 | 异步 |
| 值传递 | 值拷贝 | 值引用 |
| 语法 | require/module.exports | import/export |
| 顶层this | module对象 | undefined |
| 动态导入 | require() | import() |

**Q5: 为什么ESM的值是引用而CommonJS是拷贝？**

**答案：**
- CommonJS在加载时执行模块代码，将导出的值复制到导入处
- ESM在编译时建立模块间的引用关系，导出的是只读引用
- 因此ESM可以实时反映导出值的变化，而CommonJS不能

---

### 1.3 Buffer/Stream

#### 原理

**Buffer** 用于处理二进制数据，固定大小内存块。**Stream** 是数据的流式处理，四种类型：Readable、Writable、Duplex、Transform。Stream内存效率高，适合处理大文件。

#### 代码示例

```javascript
// Buffer基本操作
const buf = Buffer.from('Hello World', 'utf-8');
console.log(buf.toString()); // Hello World
console.log(buf.length); // 11

const buf1 = Buffer.from('Hello');
const buf2 = Buffer.from(' World');
const buf3 = Buffer.concat([buf1, buf2]);
console.log(buf3.toString()); // Hello World
```

```javascript
// Stream - 读取文件
const fs = require('fs');
const readableStream = fs.createReadStream('./large-file.txt', {
  encoding: 'utf-8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

readableStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length);
});
readableStream.on('end', () => console.log('Finished reading'));
```

```javascript
// Stream - 管道操作
const readStream = fs.createReadStream('./input.txt');
const writeStream = fs.createWriteStream('./output.txt');
readStream.pipe(writeStream);

// 链式操作
readStream
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('./output.txt.gz'));
```

```javascript
// Transform Stream - 自定义转换
const { Transform } = require('stream');

const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});

process.stdin.pipe(upperCaseTransform).pipe(process.stdout);
```

```javascript
// Stream - pipeline（推荐方式，自动处理错误和背压）
const { pipeline } = require('stream');

pipeline(
  fs.createReadStream('./input.txt'),
  zlib.createGzip(),
  fs.createWriteStream('./output.txt.gz'),
  (err) => {
    if (err) console.error('Pipeline failed:', err);
    else console.log('Pipeline succeeded');
  }
);
```

#### 面试题

**Q6: Stream 的优势是什么？**

**答案：**
1. **内存效率**：不需要一次性加载全部数据到内存
2. **时间效率**：可以边读边处理，不需要等待全部数据加载完成
3. **可组合性**：可以通过pipe()链式操作
4. **适合大文件**：处理GB级别的文件不会导致内存溢出

**Q7: 什么是背压（Backpressure）？**

**答案：**
- 当生产者产生数据的速度快于消费者处理速度时，会产生背压
- Stream通过highWaterMark和drain事件处理背压
- 可写流在缓冲区满时会返回false，此时应该暂停写入
- 等待drain事件触发后再继续写入

---

### 1.4 全局对象

#### 原理

Node.js提供了一些全局对象，可以在任何地方直接使用，无需导入。

#### 代码示例

```javascript
// 常用全局对象
console.log(__filename);     // 当前文件的绝对路径
console.log(__dirname);      // 当前文件所在目录的绝对路径
console.log(process.cwd());  // 当前工作目录

// 全局函数
setTimeout(() => console.log('1秒后'), 1000);
setInterval(() => console.log('每秒'), 1000);
setImmediate(() => console.log('立即执行'));

// 全局类
const buf = Buffer.from('hello');
const url = new URL('https://example.com');
console.log(global);      // Node.js全局对象
console.log(globalThis);  // 标准全局对象（推荐）
```

```javascript
// console对象
console.log('普通日志');
console.error('错误日志');
console.warn('警告日志');
console.time('timer');
// 执行操作
console.timeEnd('timer');
console.table([{ name: 'Alice', age: 25 }, { name: 'Bob', age: 30 }]);
console.trace('调用栈');
```

#### 面试题

**Q8: __filename 和 __dirname 的区别是什么？**

**答案：**
- `__filename`：返回当前执行文件的绝对路径，包含文件名
- `__dirname`：返回当前执行文件所在目录的绝对路径，不包含文件名
- 在ESM中不存在，需要通过 `import.meta.url` 获取

**Q9: global 和 globalThis 的区别是什么？**

**答案：**
- `global`：Node.js特有的全局对象
- `globalThis`：ECMAScript标准定义的全局对象，在浏览器和Node.js中都存在
- 推荐使用 `globalThis` 以保证代码的可移植性

---

### 1.5 process对象

#### 原理

process对象是Node.js的全局对象，提供当前Node.js进程的信息和控制能力。

#### 代码示例

```javascript
// 进程信息
console.log('进程ID:', process.pid);
console.log('Node版本:', process.version);
console.log('平台:', process.platform);
console.log('架构:', process.arch);
console.log('内存使用:', process.memoryUsage());

// 环境变量
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('HOME:', process.env.HOME);

// 命令行参数
// process.argv[0] = node可执行文件路径
// process.argv[1] = 当前脚本路径
// process.argv[2...] = 命令行参数
```

```javascript
// 进程退出与信号处理
process.on('exit', (code) => {
  console.log(`进程退出，退出码: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('未处理的Promise拒绝:', reason);
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号');
  gracefulShutdown();
});

function gracefulShutdown() {
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}
```

```javascript
// CPU和内存分析
const startUsage = process.cpuUsage();
for (let i = 0; i < 1000000; i++) Math.sqrt(i);
const endUsage = process.cpuUsage(startUsage);
console.log('CPU使用时间:', endUsage);

const used = process.memoryUsage();
for (let key in used) {
  console.log(`${key}: ${Math.round(used[key] / 1024 / 1024)} MB`);
}
```

#### 面试题

**Q10: 如何优雅地关闭Node.js进程？**

**答案：**
1. 监听SIGTERM和SIGINT信号
2. 停止接收新请求
3. 完成正在处理的请求
4. 关闭数据库连接
5. 关闭服务器
6. 执行清理操作
7. 调用process.exit(0)

**Q11: uncaughtException 和 unhandledRejection 的区别是什么？**

**答案：**
- `uncaughtException`：捕获未处理的同步异常
- `unhandledRejection`：捕获未处理的Promise拒绝
- 两者都应该记录日志并优雅退出，不应该继续运行
- 继续运行可能导致状态不一致和内存泄漏

---

## 2. 异步编程深入

### 2.1 Promise链

#### 原理

Promise是异步编程的一种解决方案。三种状态：Pending（进行中）、Fulfilled（已成功）、Rejected（已失败）。状态一旦改变就不会再变。

#### 代码示例

```javascript
// 基本Promise
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = true;
    if (success) resolve('操作成功');
    else reject(new Error('操作失败'));
  }, 1000);
});

promise
  .then(result => { console.log(result); return '下一步'; })
  .then(result => { console.log(result); })
  .catch(error => { console.error(error); })
  .finally(() => { console.log('无论成功失败都会执行'); });
```

```javascript
// Promise链式调用
function fetchData() {
  return new Promise(resolve => {
    setTimeout(() => resolve({ id: 1, name: 'User' }), 1000);
  });
}

function fetchPosts(userId) {
  return new Promise(resolve => {
    setTimeout(() => resolve([
      { id: 1, userId, title: 'Post 1' },
      { id: 2, userId, title: 'Post 2' }
    ]), 1000);
  });
}

fetchData()
  .then(user => fetchPosts(user.id))
  .then(posts => console.log('Posts:', posts))
  .catch(error => console.error('Error:', error));
```

```javascript
// Promise静态方法
// Promise.all - 所有Promise都成功才成功
Promise.all([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
  .then(results => console.log(results)); // [1, 2, 3]

// Promise.race - 第一个完成的结果
Promise.race([
  new Promise(resolve => setTimeout(() => resolve(1), 1000)),
  new Promise(resolve => setTimeout(() => resolve(2), 500))
]).then(result => console.log(result)); // 2

// Promise.allSettled - 返回所有Promise的结果（无论成功失败）
Promise.allSettled([
  Promise.resolve(1),
  Promise.reject(new Error('Failed')),
  Promise.resolve(3)
]).then(results => console.log(results));
// [{status:'fulfilled',value:1},{status:'rejected',reason:Error},{status:'fulfilled',value:3}]

// Promise.any - 第一个成功的Promise
Promise.any([
  Promise.reject(new Error('Failed 1')),
  Promise.resolve(3)
]).then(result => console.log(result)); // 3
```

#### 面试题

**Q12: Promise.all 和 Promise.race 的区别是什么？**

**答案：**
- `Promise.all()`：所有Promise都成功才成功，有一个失败就失败，返回所有结果的数组
- `Promise.race()`：返回第一个完成的Promise结果，不管成功还是失败
- `Promise.allSettled()`：等待所有Promise完成，返回每个Promise的状态和值
- `Promise.any()`：返回第一个成功的Promise，全部失败才reject

**Q13: 如何实现一个Promise重试机制？**

**答案：**
```javascript
function retry(promiseFn, maxRetries = 3, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    function attemptRetry() {
      promiseFn()
        .then(resolve)
        .catch(error => {
          attempt++;
          if (attempt >= maxRetries) reject(error);
          else setTimeout(attemptRetry, delay);
        });
    }
    attemptRetry();
  });
}
```

---

### 2.2 async/await

#### 原理

async/await是Promise的语法糖，让异步代码看起来像同步代码。`async` 函数总是返回Promise，`await` 会暂停函数执行等待Promise解决。

#### 代码示例

```javascript
// 基本async/await
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

fetchData().then(data => console.log(data)).catch(error => console.error(error));
```

```javascript
// 并发执行
async function fetchMultipleData() {
  // 串行执行（慢）
  const user1 = await fetchUser(1);
  const user2 = await fetchUser(2);

  // 并发执行（快）
  const [userA, userB] = await Promise.all([fetchUser(1), fetchUser(2)]);
  return { userA, userB };
}
```

```javascript
// 循环中的async/await
// 串行执行
async function processItemsSerial(items) {
  const results = [];
  for (const item of items) {
    const result = await processItem(item);
    results.push(result);
  }
  return results;
}

// 并发执行
async function processItemsParallel(items) {
  const promises = items.map(item => processItem(item));
  return await Promise.all(promises);
}

// 控制并发数量
async function processItemsWithLimit(items, limit = 3) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const promise = processItem(item).then(result => {
      executing.splice(executing.indexOf(promise), 1);
      return result;
    });
    results.push(promise);
    executing.push(promise);
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}
```

#### 面试题

**Q14: async/await 相比 Promise 有什么优势？**

**答案：**
1. **代码可读性**：异步代码看起来像同步代码，更易理解
2. **错误处理**：可以使用try/catch，比.catch()更直观
3. **调试**：可以设置断点，调试更方便
4. **中间值**：可以方便地获取中间值，不需要层层传递
5. **条件语句**：可以在if/else等语句中使用await

**Q15: 如何实现并发控制？**

**答案：**
```javascript
async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}
```

---

### 2.3 事件驱动

#### 原理

Node.js采用事件驱动架构，通过EventEmitter实现发布-订阅模式。

#### 代码示例

```javascript
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();

// 监听事件
myEmitter.on('event', () => console.log('事件发生'));
myEmitter.emit('event');

// 带参数的事件
myEmitter.on('data', (data) => console.log('收到数据:', data));
myEmitter.emit('data', { id: 1, name: 'Test' });

// 只监听一次
myEmitter.once('once-event', () => console.log('只会执行一次'));

// 移除监听器
function handler() { console.log('Handler'); }
myEmitter.on('event', handler);
myEmitter.off('event', handler);

// 错误处理（必须监听，否则进程崩溃）
myEmitter.on('error', (err) => console.error('捕获到错误:', err));

// 获取监听器数量
console.log(myEmitter.listenerCount('event'));
console.log(myEmitter.eventNames());
```

```javascript
// 实际应用 - 文件处理器
class FileProcessor extends EventEmitter {
  processFile(filePath) {
    this.emit('start', filePath);
    fs.readFile(filePath, (err, data) => {
      if (err) { this.emit('error', err); return; }
      this.emit('data', data);
      this.emit('processed', data.toString().toUpperCase());
      this.emit('end');
    });
  }
}

const processor = new FileProcessor();
processor.on('start', (path) => console.log('开始处理:', path));
processor.on('end', () => console.log('处理结束'));
processor.on('error', (err) => console.error('错误:', err));
processor.processFile('./test.txt');
```

#### 面试题

**Q16: EventEmitter 的 on 和 once 有什么区别？**

**答案：**
- `on()`：注册一个永久监听器，每次事件触发都会执行
- `once()`：注册一个一次性监听器，只执行一次后自动移除
- `once()` 内部使用 `on()` 注册，在执行后调用 `removeListener()` 移除自己

**Q17: 如果没有监听 error 事件会发生什么？**

**答案：**
- 当EventEmitter发射'error'事件且没有监听器时，Node.js会将错误作为异常抛出
- 这会导致进程崩溃并退出
- 因此建议始终监听'error'事件

---

### 2.4 回调地狱解决方案

#### 原理

回调地狱是指多层嵌套的回调函数，导致代码难以阅读和维护。

#### 代码示例

```javascript
// 回调地狱（不推荐）
fs.readFile('file1.txt', (err, data1) => {
  if (err) throw err;
  fs.readFile('file2.txt', (err, data2) => {
    if (err) throw err;
    fs.readFile('file3.txt', (err, data3) => {
      if (err) throw err;
      console.log(data1, data2, data3);
    });
  });
});

// 解决方案1: Promise
function readFilePromise(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// 解决方案2: async/await（推荐）
async function readAllFiles() {
  try {
    const data1 = await readFilePromise('file1.txt');
    const data2 = await readFilePromise('file2.txt');
    const data3 = await readFilePromise('file3.txt');
    console.log('All files read');
  } catch (err) {
    console.error('Error:', err);
  }
}

// 解决方案3: util.promisify
const util = require('util');
const readFile = util.promisify(fs.readFile);
```

#### 面试题

**Q18: 什么是回调地狱？如何避免？**

**答案：**
回调地狱是指多层嵌套的回调函数，导致代码难以阅读和维护。

避免方法：
1. 使用命名函数代替匿名函数
2. 使用Promise链式调用
3. 使用async/await语法（推荐）
4. 使用流程控制库如async.js
5. 将复杂逻辑拆分成多个函数

---

### 2.5 并发控制

#### 原理

并发控制是指限制同时执行的异步操作数量，避免资源耗尽。

#### 代码示例

```javascript
// 队列实现并发控制
class Queue {
  constructor(concurrency = 1) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.next();
    });
  }

  async next() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;
    this.running++;
    const { task, resolve, reject } = this.queue.shift();
    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.next();
    }
  }
}

// 使用
const queue = new Queue(3);
const tasks = [1, 2, 3, 4, 5].map(i =>
  queue.add(async () => {
    console.log('Task', i);
    await new Promise(r => setTimeout(r, 1000));
    return i * 2;
  })
);
const results = await Promise.all(tasks);
```

```javascript
// 批量API请求
async function batchRequest(urls, batchSize = 5) {
  const results = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => fetch(url).then(res => res.json()))
    );
    results.push(...batchResults);
    if (i + batchSize < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return results;
}
```

#### 面试题

**Q19: 为什么需要并发控制？**

**答案：**
1. **资源限制**：避免同时发起过多请求导致资源耗尽
2. **性能优化**：合理的并发数可以提高整体性能
3. **避免限流**：API通常有速率限制，超过会被封禁
4. **稳定性**：防止系统过载导致崩溃
5. **公平性**：确保所有任务都能得到执行机会

**Q20: 如何选择合适的并发数？**

**答案：**
1. **CPU密集型**：并发数 = CPU核心数
2. **I/O密集型**：并发数可以设置得更高，如CPU核心数的2-3倍
3. **网络请求**：根据API限制和服务器承受能力，通常5-10个
4. **文件操作**：根据磁盘I/O能力，通常2-4个

---

## 3. Express框架

### 3.1 路由

#### 原理

Express路由用于定义应用程序的端点以及端点如何响应客户端请求。路由方法：GET、POST、PUT、DELETE、PATCH等。

#### 代码示例

```javascript
const express = require('express');
const app = express();

// 基本路由
app.get('/', (req, res) => res.send('Hello World'));
app.post('/users', (req, res) => res.send('Create user'));

// 路由参数
app.get('/users/:userId', (req, res) => {
  res.send(`User ID: ${req.params.userId}`);
});

// 查询参数
app.get('/search', (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  res.send(`Search: ${q}, Page: ${page}, Limit: ${limit}`);
});

// app.route()链式路由
app.route('/book')
  .get((req, res) => res.send('Get a book'))
  .post((req, res) => res.send('Add a book'))
  .put((req, res) => res.send('Update a book'));
```

```javascript
// express.Router模块化路由
const router = express.Router();

router.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

router.get('/', (req, res) => res.send('Home page'));
router.get('/about', (req, res) => res.send('About page'));

module.exports = router;

// 在主应用中使用
const birds = require('./birds');
app.use('/birds', birds);
```

#### 面试题

**Q21: Express路由参数和查询参数的区别是什么？**

**答案：**
- **路由参数**：URL路径的一部分，如 `/users/:id`，通过 `req.params` 获取
- **查询参数**：URL问号后的参数，如 `/users?page=1`，通过 `req.query` 获取
- 路由参数用于标识资源，查询参数用于过滤、排序、分页等

---

### 3.2 中间件机制

#### 原理

Express中间件是一个函数，可以访问请求对象(req)、响应对象(res)和next函数。

中间件类型：应用级中间件、路由级中间件、错误处理中间件、内置中间件、第三方中间件。

#### 代码示例

```javascript
const express = require('express');
const app = express();

// 应用级中间件
app.use((req, res, next) => {
  console.log('Time:', Date.now());
  next();
});

// 路径特定中间件
app.use('/user/:id', (req, res, next) => {
  console.log('Request Type:', req.method);
  next();
});

// 中间件链
function logMiddleware(req, res, next) {
  console.log(`${req.method} ${req.url}`);
  next();
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization;
  if (token) {
    req.user = { id: 1, name: 'User' };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/protected', logMiddleware, authMiddleware, (req, res) => {
  res.json({ user: req.user });
});
```

```javascript
// 内置中间件
app.use(express.json());                    // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体
app.use(express.static('public'));          // 静态文件服务

// 第三方中间件
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

app.use(cors());
app.use(morgan('combined'));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 100个请求
}));
```

```javascript
// 自定义验证中间件
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}

const Joi = require('joi');
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required()
});

app.post('/users', validate(userSchema), (req, res) => {
  res.json({ success: true });
});
```

#### 面试题

**Q22: Express中间件的执行顺序是什么？**

**答案：**
1. 中间件按照定义的顺序执行
2. 每个中间件可以调用 `next()` 将控制权传递给下一个中间件
3. 如果中间件不调用 `next()`，请求-响应循环终止
4. 错误处理中间件（4个参数）放在最后
5. 路由处理函数也是中间件的一种

**Q23: 如何实现全局错误处理？**

**答案：**
1. 定义4个参数的错误处理中间件 `(err, req, res, next)`
2. 在所有路由之后注册这个中间件
3. 在其他中间件或路由中使用 `next(err)` 传递错误
4. 错误处理中间件会捕获所有传递的错误

---

### 3.3 错误处理

#### 原理

Express错误处理通过专门的错误处理中间件实现。最佳实践：使用自定义错误类、区分操作错误和程序错误、记录错误日志、返回友好信息。

#### 代码示例

```javascript
// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) { super(message, 400); }
}

class NotFoundError extends AppError {
  constructor(message) { super(message, 404); }
}
```

```javascript
// 错误处理中间件
function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status, error: err,
      message: err.message, stack: err.stack
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({ status: err.status, message: err.message });
    } else {
      console.error('ERROR:', err);
      res.status(500).json({ status: 'error', message: 'Something went wrong!' });
    }
  }
}

// 使用
const app = express();
app.get('/error', (req, res, next) => next(new AppError('This is an error', 400)));
app.all('*', (req, res, next) => next(new AppError(`Can't find ${req.originalUrl}`, 404)));
app.use(errorHandler); // 必须在最后
```

```javascript
// 异步错误处理包装器
const catchAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('No user found with that ID', 404));
  res.status(200).json({ status: 'success', data: { user } });
}));
```

#### 面试题

**Q24: Express中如何处理异步函数的错误？**

**答案：**
1. 使用try/catch包裹异步代码
2. 使用高阶函数包装异步路由处理器（如catchAsync）
3. 在catch中调用next(err)传递错误
4. Express 5.x（目前仍在开发中，尚未正式发布）计划自动捕获异步错误

**Q25: 操作错误和程序错误的区别是什么？**

**答案：**
- **操作错误**：运行时错误（网络超时、无效输入等），可以预测和处理，不应导致进程退出
- **程序错误**：代码bug（未定义变量、类型错误等），不应发生，应记录日志并优雅退出

---

### 3.4 模板引擎

#### 原理

模板引擎用于生成动态HTML页面。常用：EJS（类似HTML）、Pug（缩进语法）、Handlebars（Mustache风格）。

#### 代码示例

```javascript
// EJS模板引擎
const express = require('express');
const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home',
    user: { name: 'John', age: 30 },
    items: ['Apple', 'Banana', 'Orange']
  });
});
```

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html>
<head><title><%= title %></title></head>
<body>
  <h1>Welcome, <%= user.name %>!</h1>
  <ul>
    <% items.forEach(function(item) { %>
      <li><%= item %></li>
    <% }); %>
  </ul>
  <% if (user.age >= 18) { %>
    <p>You are an adult</p>
  <% } else { %>
    <p>You are a minor</p>
  <% } %>
</body>
</html>
```

```javascript
// Pug模板引擎
app.set('view engine', 'pug');
app.get('/pug', (req, res) => {
  res.render('index', { title: 'Pug Example', message: 'Hello from Pug!' });
});
```

```pug
// views/index.pug
doctype html
html
  head
    title= title
  body
    h1= message
    each item in items
      li= item
```

#### 面试题

**Q26: EJS、Pug和Handlebars的区别是什么？**

| 特性 | EJS | Pug | Handlebars |
|------|-----|-----|------------|
| 语法 | 类似HTML | 缩进语法 | Mustache风格 |
| 学习曲线 | 低 | 中 | 低 |
| 逻辑支持 | 强 | 强 | 弱 |
| 安全性 | 需手动转义 | 自动转义 | 自动转义 |

---

### 3.5 文件上传

#### 原理

文件上传通过multipart/form-data格式实现。常用库：multer（Express中间件）、formidable、busboy。

#### 代码示例

```javascript
const multer = require('multer');
const path = require('path');

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid file type'), false);
};

const upload = multer({
  storage, fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// 单文件上传
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ message: 'File uploaded successfully', file: req.file });
});

// 多文件上传
app.post('/upload/multiple', upload.array('files', 10), (req, res) => {
  res.json({ files: req.files });
});

// 不同字段的文件上传
app.post('/upload/fields', upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 8 }
]), (req, res) => {
  res.json({ avatar: req.files['avatar'], gallery: req.files['gallery'] });
});
```

```javascript
// 图片处理
const sharp = require('sharp');

app.post('/upload/image', upload.single('image'), async (req, res) => {
  try {
    await sharp(req.file.path)
      .resize(800, 600, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(`uploads/compressed-${req.file.filename}`);
    res.json({ message: 'Image processed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

#### 面试题

**Q27: multer的diskStorage和memoryStorage有什么区别？**

**答案：**
- **diskStorage**：将文件保存到磁盘，适合大文件
- **memoryStorage**：将文件保存在内存中（Buffer），适合小文件或需要直接处理的文件
- diskStorage需要更多磁盘空间，但可以处理大文件
- memoryStorage占用内存，但处理速度快，适合后续上传到云存储的场景

---

## 4. Koa框架

### 4.1 洋葱模型

#### 原理

Koa采用洋葱模型，中间件像洋葱一样层层包裹。请求从外层进入内层，响应从内层返回外层。每个中间件可以控制是否继续执行，原生支持async/await。

#### 代码示例

```javascript
const Koa = require('koa');
const app = new Koa();

app.use(async (ctx, next) => {
  console.log('1. 请求进入中间件1');
  await next();
  console.log('6. 响应返回中间件1');
});

app.use(async (ctx, next) => {
  console.log('2. 请求进入中间件2');
  await next();
  console.log('5. 响应返回中间件2');
});

app.use(async (ctx, next) => {
  console.log('3. 请求进入中间件3');
  await next();
  console.log('4. 响应返回中间件3');
});

app.listen(3000);
// 执行顺序：1 -> 2 -> 3 -> 4 -> 5 -> 6
```

```javascript
// 实际应用
const app = new Koa();

// 日志中间件
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`${ctx.method} ${ctx.url} - ${Date.now() - start}ms`);
});

// 错误处理中间件
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { error: err.message };
    ctx.app.emit('error', err, ctx);
  }
});

app.use(async ctx => { ctx.body = 'Hello Koa'; });
app.listen(3000);
```

#### 面试题

**Q28: Koa的洋葱模型和Express的中间件机制有什么区别？**

| 特性 | Express | Koa |
|------|---------|-----|
| 执行模式 | 线性执行 | 洋葱模型 |
| async/await | 需要手动处理 | 原生支持 |
| 响应处理 | 在中间件中直接响应 | 通过ctx.body |
| 错误处理 | 需要传递err参数 | try/catch |
| 路由 | 内置 | 需要插件 |

---

### 4.2 中间件编写

#### 代码示例

```javascript
// 带配置的中间件
function authMiddleware(options = {}) {
  const { secret = 'default-secret' } = options;
  return async (ctx, next) => {
    const token = ctx.headers.authorization;
    if (!token) {
      ctx.status = 401;
      ctx.body = { error: 'No token provided' };
      return;
    }
    try {
      const decoded = jwt.verify(token, secret);
      ctx.state.user = decoded;
      await next();
    } catch (err) {
      ctx.status = 401;
      ctx.body = { error: 'Invalid token' };
    }
  };
}

app.use(authMiddleware({ secret: 'my-secret' }));
```

```javascript
// 请求验证中间件
function validate(schema) {
  return async (ctx, next) => {
    const { error } = schema.validate(ctx.request.body);
    if (error) {
      ctx.status = 400;
      ctx.body = { error: error.details[0].message };
      return;
    }
    await next();
  };
}
```

#### 面试题

**Q29: 如何编写可配置的Koa中间件？**

**答案：**
使用工厂函数模式，返回一个async函数。通过参数接收配置，在中间件内部使用闭包访问配置。

---

### 4.3 ctx上下文

#### 原理

ctx是Koa的上下文对象，将Node的request和response对象封装到一个对象中。

#### 代码示例

```javascript
app.use(async ctx => {
  // 请求信息
  console.log(ctx.method);       // GET, POST
  console.log(ctx.url);          // 请求路径
  console.log(ctx.path);         // 路径（不含查询字符串）
  console.log(ctx.query);        // 查询参数对象
  console.log(ctx.ip);           // 客户端IP

  // 响应信息
  ctx.body = 'Hello World';
  ctx.status = 200;
  ctx.set('Content-Type', 'text/plain');

  // 使用ctx.state传递数据
  ctx.state.user = { id: 1, name: 'User' };
});
```

#### 面试题

**Q30: ctx.request.body 和 ctx.body 的区别是什么？**

**答案：**
- `ctx.request.body`：请求体数据，由bodyParser中间件解析
- `ctx.body`：响应体数据，设置后会被发送给客户端
- 前者是输入，后者是输出

---

### 4.4 与Express对比

#### 面试题

**Q31: 什么时候选择Express，什么时候选择Koa？**

**选择Express：** 快速开发原型、需要成熟生态、团队熟悉Express、需要内置路由和视图引擎

**选择Koa：** 追求更好性能、喜欢async/await语法、需要更灵活的中间件控制、现代化架构

---

## 5. NestJS框架

### 5.1 装饰器

#### 原理

装饰器是一种特殊的声明，可以附加到类、方法、属性或参数上，用于添加元数据。

#### 代码示例

```typescript
import { Controller, Get, Post, Body, Param, Query, Headers } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() { return 'This action returns all users'; }

  @Get(':id')
  findOne(@Param('id') id: string) { return `User #${id}`; }

  @Post()
  create(@Body() createUserDto: CreateUserDto) { return 'User created'; }

  @Get(':id/profile')
  detailed(
    @Param('id') id: string,
    @Query('sort') sort: string,
    @Headers('authorization') auth: string
  ) { return { id, sort, auth }; }
}
```

```typescript
// 自定义装饰器
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

@Get('profile')
getProfile(@User() user: any) { return user; }

@Get('email')
getEmail(@User('email') email: string) { return email; }
```

#### 面试题

**Q32: NestJS装饰器的作用是什么？**

**答案：**
1. **元数据声明**：为类、方法、属性添加元数据
2. **依赖注入**：标记可注入的服务
3. **路由定义**：定义HTTP方法和路径
4. **参数解析**：自动解析请求参数
5. **验证**：结合class-validator进行数据验证
6. **权限控制**：结合守卫进行权限验证

---

### 5.2 依赖注入

#### 原理

依赖注入（DI）是一种设计模式，用于实现控制反转（IoC）。NestJS的DI系统包含Provider（可注入的服务）、Injector（创建和注入依赖）、Token（标识Provider）。

#### 代码示例

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private users = [];
  findAll() { return this.users; }
  create(user: any) { this.users.push(user); return user; }
}
```

```typescript
import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() { return this.usersService.findAll(); }
}
```

```typescript
// 自定义Provider
import { Module } from '@nestjs/common';

@Module({
  providers: [
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        return await createConnection(configService.get('DB_URL'));
      },
      inject: [ConfigService],
    },
  ],
})
export class AppModule {}

// 使用
@Injectable()
export class UsersService {
  constructor(@Inject('DATABASE_CONNECTION') private connection: any) {}
}
```

```typescript
// 循环依赖解决 - 使用forwardRef
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class ServiceA {
  constructor(@Inject(forwardRef(() => ServiceB)) private serviceB: ServiceB) {}
}

@Injectable()
export class ServiceB {
  constructor(@Inject(forwardRef(() => ServiceA)) private serviceA: ServiceA) {}
}
```

#### 面试题

**Q33: NestJS依赖注入的优势是什么？**

**答案：**
1. **解耦**：降低组件之间的耦合度
2. **可测试**：方便进行单元测试，可以mock依赖
3. **可维护**：代码结构清晰，易于维护
4. **可扩展**：方便替换实现，支持多种Provider类型
5. **单例模式**：默认单例，节省资源

**Q34: 如何解决循环依赖问题？**

**答案：**
1. 使用 `forwardRef()` 延迟引用
2. 使用 `ModuleRef` 延迟注入
3. 重构代码，消除循环依赖（推荐）

---

### 5.3 模块/控制器/服务

#### 代码示例

```typescript
// 模块
@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

```typescript
// 控制器
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() { return this.usersService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.usersService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) { return this.usersService.create(createUserDto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.usersService.remove(id); }
}
```

```typescript
// 服务
@Injectable()
export class UsersService {
  private users = [];

  async findAll() { return this.users; }

  async findOne(id: string) {
    const user = this.users.find(u => u.id === id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(createUserDto: CreateUserDto) {
    const newUser = { id: Date.now().toString(), ...createUserDto };
    this.users.push(newUser);
    return newUser;
  }
}
```

#### 面试题

**Q35: Module、Controller、Service的职责是什么？**

**答案：**
- **Module**：组织应用程序结构，管理依赖关系
- **Controller**：处理HTTP请求，调用Service，返回响应
- **Service**：实现业务逻辑，处理数据，与数据库交互

---

### 5.4 守卫/管道/拦截器

#### 代码示例

```typescript
// 守卫 - 权限验证
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  @Get('admin')
  @Roles('admin')
  getAdminData() { return 'Admin data'; }
}
```

```typescript
// 管道 - 数据验证
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) return value;
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) throw new BadRequestException('Validation failed');
    return value;
  }
}

// 全局使用
app.useGlobalPipes(new ValidationPipe());
```

```typescript
// 拦截器 - 响应转换
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => ({ data, timestamp: new Date().toISOString() })),
    );
  }
}

// 全局使用
app.useGlobalInterceptors(new TransformInterceptor());
```

```typescript
// 日志拦截器
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();
    this.logger.log(`Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        this.logger.log(`Response: ${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`);
      }),
    );
  }
}
```

#### 面试题

**Q36: Guard、Pipe、Interceptor的执行顺序是什么？**

**答案：**
1. **Guard**：最先执行，用于权限验证
2. **Interceptor**（请求前）：在Guard之后
3. **Pipe**：用于数据验证和转换
4. **Controller**：处理请求
5. **Interceptor**（响应后）：响应返回时执行
6. **Exception Filter**：最后执行，处理异常

---

### 5.5 TypeORM集成

#### 代码示例

```typescript
// 实体
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

```typescript
// 模块配置
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

```typescript
// 服务中使用TypeORM
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
```

```typescript
// 关系映射
@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @OneToMany(() => Post, post => post.author) posts: Post[];
}

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @ManyToOne(() => User, user => user.posts) author: User;
}

// 使用关系
async findUserWithPosts(userId: number) {
  return this.userRepository.findOne({
    where: { id: userId },
    relations: ['posts'],
  });
}
```

```typescript
// 事务处理
async createUserWithPost(userData: any, postData: any) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const user = queryRunner.manager.create(User, userData);
    const savedUser = await queryRunner.manager.save(user);

    const post = queryRunner.manager.create(Post, { ...postData, author: savedUser });
    await queryRunner.manager.save(post);

    await queryRunner.commitTransaction();
    return savedUser;
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
}
```

#### 面试题

**Q37: TypeORM中Repository和EntityManager的区别是什么？**

**答案：**
- **Repository**：针对特定实体的操作接口，提供基本的CRUD方法
- **EntityManager**：更底层的接口，可以操作多个实体，支持事务
- Repository是EntityManager的封装，更易用
- EntityManager更灵活，适合复杂操作和事务处理

**Q38: 如何在TypeORM中处理事务？**

**答案：**
1. 使用QueryRunner手动管理事务（推荐）
2. 使用EntityManager的transaction方法
3. 使用try/catch/finally确保资源释放

---

## 6. 数据库操作

### 6.1 MongoDB + Mongoose

#### 原理

MongoDB是NoSQL文档数据库，Mongoose是MongoDB的ODM框架。特点：灵活的文档结构、Schema验证、中间件支持。

#### 代码示例

```javascript
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/myapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// 注意：Mongoose 6+ 这些选项已默认为 true，Mongoose 7+ 已完全移除这些选项

// 定义Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
```

```javascript
// CRUD操作
await User.create({ name: 'John', email: 'john@example.com', password: 'hashed' });
const users = await User.find({ isActive: true });
const user = await User.findById(userId);
await User.findByIdAndUpdate(userId, { name: 'New Name' });
await User.findByIdAndDelete(userId);
```

```javascript
// 高级查询
const users = await User.find({ age: { $gte: 18, $lte: 65 } })
  .sort({ createdAt: -1 })
  .skip(0).limit(10)
  .select('name email');

// 聚合
const stats = await User.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$role', count: { $sum: 1 } } }
]);
```

```javascript
// 中间件 - 密码加密
const bcrypt = require('bcrypt');

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 实例方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 静态方法
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email });
};
```

#### 面试题

**Q39: Mongoose Schema和Model的区别是什么？**

**答案：**
- **Schema**：定义文档结构、验证规则、默认值等（蓝图）
- **Model**：基于Schema创建的构造函数，用于操作数据库（实例）
- 通过Model创建、查询、更新、删除文档

**Q40: 如何在Mongoose中实现软删除？**

**答案：**
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  isDeleted: { type: Boolean, default: false, select: false },
  deletedAt: Date
});

userSchema.pre('find', function() {
  this.where({ isDeleted: false });
});

userSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};
```

---

### 6.2 MySQL + Sequelize/Prisma

#### 代码示例

```javascript
// Sequelize连接
const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost', dialect: 'mysql',
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
});

// 定义模型
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'users', timestamps: true, underscored: true });
```

```javascript
// CRUD操作
const user = await User.create({ name: 'John', email: 'john@example.com', password: 'hashed' });
const users = await User.findAll({ where: { isActive: true } });
const user = await User.findByPk(userId);
await User.update({ name: 'Jane' }, { where: { id: userId } });
await User.destroy({ where: { id: userId } });

// 高级查询
const users = await User.findAll({
  where: { age: { [Op.gte]: 18, [Op.lte]: 65 } },
  order: [['createdAt', 'DESC']],
  offset: 0, limit: 10,
  include: [{ model: Post, as: 'posts' }]
});
```

```javascript
// 事务处理
const t = await sequelize.transaction();
try {
  const user = await User.create({ name: 'John', email: 'john@example.com' }, { transaction: t });
  await Post.create({ title: 'First Post', userId: user.id }, { transaction: t });
  await t.commit();
} catch (error) {
  await t.rollback();
  throw error;
}
```

```javascript
// Prisma使用
// schema.prisma
// model User {
//   id        Int      @id @default(autoincrement())
//   name      String
//   email     String   @unique
//   posts     Post[]
//   createdAt DateTime @default(now())
// }

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const user = await prisma.user.create({
  data: { name: 'John Doe', email: 'john@example.com' }
});

const users = await prisma.user.findMany({
  where: { isActive: true },
  include: { posts: true }
});

await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' }
});
```

#### 面试题

**Q41: Sequelize和Prisma的区别是什么？**

| 特性 | Sequelize | Prisma |
|------|-----------|--------|
| 类型安全 | 需要手动定义类型 | 自动生成类型 |
| API风格 | 链式调用 | 简洁直观 |
| 迁移 | 手动编写 | 自动生成 |
| 学习曲线 | 较陡 | 较平 |
| 性能 | 好 | 更好 |

---

### 6.3 Redis + ioredis

#### 代码示例

```javascript
const Redis = require('ioredis');
const redis = new Redis({ host: 'localhost', port: 6379 });

// String操作
await redis.set('key', 'value');
await redis.set('key', 'value', 'EX', 60); // 60秒过期
const value = await redis.get('key');
await redis.incr('counter');

// Hash操作
await redis.hset('user:1', 'name', 'John', 'age', '30');
const user = await redis.hgetall('user:1');

// List操作
await redis.lpush('list', 'item1', 'item2');
const items = await redis.lrange('list', 0, -1);

// Set操作
await redis.sadd('tags', 'nodejs', 'javascript');
const members = await redis.smembers('tags');

// Sorted Set操作
await redis.zadd('rank', 100, 'user1', 200, 'user2');
const rank = await redis.zrank('rank', 'user1');
```

```javascript
// 缓存模式
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await User.findById(userId);
  await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600);
  return user;
}
```

```javascript
// 分布式锁
async function acquireLock(lockKey, ttl = 10) {
  const token = Date.now().toString();
  const acquired = await redis.set(lockKey, token, 'NX', 'EX', ttl);
  return acquired === 'OK' ? token : null;
}

async function releaseLock(lockKey, token) {
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, lockKey, token);
}
```

#### 面试题

**Q42: Redis的常用数据结构有哪些？**

**答案：**
1. **String**：字符串、数字、二进制数据
2. **Hash**：键值对集合，适合存储对象
3. **List**：有序列表，支持两端操作
4. **Set**：无序集合，元素唯一
5. **Sorted Set**：有序集合，元素关联分数

**Q43: 如何解决缓存穿透、击穿、雪崩？**

**答案：**
- **缓存穿透**（查询不存在的数据）：布隆过滤器、缓存空值
- **缓存击穿**（热点key过期）：互斥锁、永不过期
- **缓存雪崩**（大量key同时过期）：随机过期时间、缓存预热

---

## 7. 认证与授权

### 7.1 JWT实现

#### 原理

JWT（JSON Web Token）是无状态的认证机制。结构：Header（算法和类型）、Payload（数据）、Signature（签名）。

#### 代码示例

```javascript
const jwt = require('jsonwebtoken');

class JWTService {
  constructor(secret, expiresIn = '7d') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token) {
    return jwt.verify(token, this.secret);
  }
}

const jwtService = new JWTService(process.env.JWT_SECRET);

// 生成Token
const token = jwtService.generateToken({ userId: user.id, role: user.role });

// Express中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
```

#### 面试题

**Q44: JWT的优缺点是什么？**

**优点：** 无状态、跨域支持好、包含自定义信息、标准化

**缺点：** Token无法撤销、体积较大、无法在服务端主动失效、需要处理刷新

**Q45: 如何实现JWT的刷新机制？**

**答案：**
1. 使用短期Access Token和长期Refresh Token
2. Access Token过期后使用Refresh Token获取新的Access Token
3. Refresh Token存储在数据库或Redis中
4. 可以撤销Refresh Token
5. 实现Token黑名单机制

---

### 7.2 Session机制

#### 代码示例

```javascript
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// 登录
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await user.comparePassword(password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  req.session.user = { id: user.id, email: user.email, role: user.role };
  res.json({ message: 'Logged in' });
});

// 登出
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out' });
  });
});
```

#### 面试题

**Q46: Session和JWT的区别是什么？**

| 特性 | Session | JWT |
|------|---------|-----|
| 存储位置 | 服务器 | 客户端 |
| 状态 | 有状态 | 无状态 |
| 扩展性 | 需要Session共享 | 天然支持分布式 |
| 安全性 | 可控 | 依赖密钥 |
| 撤销 | 容易 | 困难 |

---

### 7.3 OAuth2集成

#### 代码示例

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0].value
      });
    }
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);
```

#### 面试题

**Q47: OAuth2的授权码模式流程是什么？**

**答案：**
1. 客户端重定向用户到授权服务器
2. 用户授权后，授权服务器返回授权码
3. 客户端使用授权码向授权服务器换取访问令牌
4. 授权服务器验证授权码，返回访问令牌
5. 客户端使用访问令牌访问受保护资源

---

### 7.4 Passport.js

#### 代码示例

```javascript
// 本地策略
const LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy({
  usernameField: 'email', passwordField: 'password'
}, async (email, password, done) => {
  const user = await User.findOne({ email });
  if (!user || !await user.comparePassword(password)) {
    return done(null, false, { message: 'Invalid credentials' });
  }
  return done(null, user);
}));

// JWT策略
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
}, async (payload, done) => {
  const user = await User.findById(payload.userId);
  if (!user) return done(null, false);
  return done(null, user);
}));

// 使用
app.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const token = jwtService.generateToken({ userId: req.user.id });
  res.json({ token });
});
```

#### 面试题

**Q48: Passport.js的序列化和反序列化有什么作用？**

**答案：**
- **序列化**：将用户对象转换为唯一标识（如用户ID），存储在Session中
- **反序列化**：根据Session中的标识从数据库加载用户对象
- 用于Session认证，JWT认证不需要

---

### 7.5 RBAC权限设计

#### 代码示例

```javascript
// 角色和权限定义
const ROLES = { ADMIN: 'admin', MODERATOR: 'moderator', USER: 'user' };

const ROLE_PERMISSIONS = {
  admin: ['user:read', 'user:write', 'user:delete', 'post:read', 'post:write', 'post:delete'],
  moderator: ['user:read', 'post:read', 'post:write', 'post:delete'],
  user: ['user:read', 'user:write', 'post:read', 'post:write']
};

// 权限检查中间件
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    if (!permissions.includes(permission)) return res.status(403).json({ error: 'Permission denied' });
    next();
  };
}

// 角色检查中间件
function requireRole(...roles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(user.role)) return res.status(403).json({ error: 'Insufficient role' });
    next();
  };
}

// 使用
app.delete('/users/:id', authenticate, requirePermission('user:delete'), deleteUser);
app.get('/admin', authenticate, requireRole('admin'), adminDashboard);
```

```javascript
// 资源所有权检查
async function checkOwnership(req, res, next) {
  const resource = await Resource.findById(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Not found' });
  if (resource.ownerId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  req.resource = resource;
  next();
}
```

#### 面试题

**Q49: RBAC和ABAC的区别是什么？**

**答案：**
- **RBAC**：基于角色的访问控制，用户属于角色，角色拥有权限。简单易用，适合大多数场景
- **ABAC**：基于属性的访问控制，基于用户属性、资源属性、环境属性。更灵活，适合复杂场景

---

## 8. API设计

### 8.1 RESTful规范

#### 原理

RESTful API设计原则：使用名词表示资源、正确使用HTTP方法、正确使用HTTP状态码、支持API版本。

#### 代码示例

```javascript
const router = express.Router();

// 用户资源
router.get('/users', getUsers);           // 200 - 获取用户列表
router.get('/users/:id', getUser);         // 200/404 - 获取单个用户
router.post('/users', createUser);         // 201 - 创建用户
router.put('/users/:id', updateUser);      // 200 - 更新用户
router.patch('/users/:id', patchUser);     // 200 - 部分更新
router.delete('/users/:id', deleteUser);  // 204 - 删除用户

// 嵌套资源
router.get('/users/:userId/posts', getUserPosts);
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', createComment);
```

```javascript
// HTTP状态码使用
async function getUsers(req, res) {
  const users = await User.find();
  res.status(200).json({ status: 'success', results: users.length, data: { users } });
}

async function createUser(req, res) {
  const user = await User.create(req.body);
  res.status(201).json({ status: 'success', data: { user } });
}

#### 面试题

**Q50: RESTful API设计的最佳实践是什么？**

**答案：**
1. 使用名词表示资源，复数形式（/users而非/user）
2. 正确使用HTTP方法：GET查询、POST创建、PUT更新、DELETE删除
3. 正确使用HTTP状态码：200成功、201创建、204无内容、400请求错误、401未认证、403禁止、404未找到、500服务器错误
4. 使用分页、过滤、排序参数
5. 支持API版本控制
6. 统一响应格式

---

### 8.2 GraphQL基础

#### 原理

GraphQL是一种API查询语言，客户端可以精确指定需要的数据。

特点：
- 按需获取数据
- 单一端点
- 强类型Schema
- 实时订阅

#### 代码示例

```javascript
const { ApolloServer, gql } = require('apollo-server-express');

// 定义Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
  }

  type Mutation {
    createUser(name: String!, email: String!, password: String!): User!
    createPost(title: String!, content: String!, authorId: ID!): Post!
  }
`;
```

```javascript
// 定义Resolver
const resolvers = {
  Query: {
    users: async () => await User.find(),
    user: async (_, { id }) => await User.findById(id),
    posts: async () => await Post.find().populate('author'),
  },
  Mutation: {
    createUser: async (_, { name, email, password }) => {
      const user = new User({ name, email, password });
      return await user.save();
    },
    createPost: async (_, { title, content, authorId }) => {
      const post = new Post({ title, content, author: authorId });
      return await post.save();
    },
  },
  User: {
    posts: async (parent) => await Post.find({ author: parent.id }),
  },
};

// 集成Express
const server = new ApolloServer({ typeDefs, resolvers });
await server.start();
server.applyMiddleware({ app });
```

#### 面试题

**Q51: REST和GraphQL的区别是什么？**

| 特性 | REST | GraphQL |
|------|------|---------|
| 端点 | 多个端点 | 单一端点 |
| 数据获取 | 固定返回 | 按需获取 |
| 版本控制 | URL版本 | Schema演进 |
| 过度获取 | 可能 | 不会 |
| 学习曲线 | 低 | 中 |
| 缓存 | HTTP缓存 | 需要额外处理 |

---

### 8.3 API版本管理

#### 代码示例

```javascript
// 方案1: URL路径版本（推荐）
const v1Router = express.Router();
const v2Router = express.Router();

v1Router.get('/users', getUsersV1);
v2Router.get('/users', getUsersV2);

app.use('/api/v1', v1Router);
app.use('/api/v2', v2Router);
```

```javascript
// 方案2: 请求头版本
app.use((req, res, next) => {
  const version = req.headers['api-version'] || 'v1';
  req.apiVersion = version;
  next();
});

app.get('/users', (req, res) => {
  if (req.apiVersion === 'v2') {
    return getUsersV2(req, res);
  }
  return getUsersV1(req, res);
});
```

```javascript
// 方案3: 查询参数版本
app.get('/users', (req, res) => {
  const version = req.query.version || 'v1';
  // 根据版本路由
});
```

```javascript
// 版本化中间件
function versionRouter(versions) {
  return (req, res, next) => {
    const version = req.headers['api-version'] || 'v1';
    const handler = versions[version] || versions['v1'];
    handler(req, res, next);
  };
}

app.get('/users', versionRouter({
  v1: getUsersV1,
  v2: getUsersV2
}));
```

#### 面试题

**Q52: API版本管理有哪些方案？**

**答案：**
1. **URL路径版本**：`/api/v1/users`（推荐，最清晰）
2. **请求头版本**：`Accept: application/vnd.api+json;version=2`
3. **查询参数版本**：`/api/users?version=2`
4. **Content Negotiation**：通过Accept头协商

---

### 8.4 接口限流

#### 代码示例

```javascript
// 固定窗口限流
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100个请求
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // 返回 RateLimit-* 头
  legacyHeaders: false, // 禁用 X-RateLimit-* 头
});

app.use('/api/', limiter);
```

```javascript
// 不同路由不同限流
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次尝试
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', apiLimiter);
app.post('/auth/login', authLimiter, login);
app.post('/auth/register', authLimiter, register);
```

```javascript
// Redis限流（分布式）
const Redis = require('ioredis');
const redis = new Redis();

async function rateLimitMiddleware(req, res, next) {
  const ip = req.ip;
  const key = `rate-limit:${ip}`;
  const limit = 100;
  const window = 60; // 60秒

  const current = await redis.incr(key);
  if (current === 1) await redis.expire(key, window);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));

  if (current > limit) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
}
```

```javascript
// 滑动窗口限流
async function slidingWindowRateLimit(key, limit, window) {
  const now = Date.now();
  const windowStart = now - window * 1000;

  const multi = redis.multi();
  multi.zadd(key, now, `${now}-${Math.random()}`);
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.pexpire(key, window * 1000);

  const results = await multi.exec();
  const count = results[2][1];

  return { count, limited: count > limit };
}
```

#### 面试题

**Q53: 什么是限流？有哪些限流算法？**

**答案：**
限流是限制单位时间内的请求数量，保护服务不被过载。

算法：
1. **固定窗口**：固定时间窗口计数，实现简单但可能有边界问题
2. **滑动窗口**：滑动时间窗口计数，更平滑
3. **令牌桶**：以固定速率生成令牌，请求需要获取令牌
4. **漏桶**：以固定速率处理请求，多余请求排队或丢弃

---

### 8.5 接口文档Swagger

#### 代码示例

```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'API documentation'
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

```javascript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: 获取用户列表
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 用户列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/users', authMiddleware, getUsers);
```

```javascript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     CreateUserDto:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: 创建用户
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDto'
 *     responses:
 *       201:
 *         description: 用户创建成功
 */
router.post('/users', createUser);
```

#### 面试题

**Q54: Swagger/OpenAPI的优势是什么？**

**答案：**
1. 自动生成交互式API文档
2. 支持在线测试API
3. 标准化API描述格式
4. 可以自动生成客户端SDK
5. 支持多种编程语言
6. 可以集成到CI/CD流程中

---

## 9. 性能与部署

### 9.1 Cluster集群

#### 原理

Node.js是单线程的，Cluster模块允许创建多个工作进程来充分利用多核CPU。

#### 代码示例

```javascript
const cluster = require('cluster');
const os = require('os');
const express = require('express');

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`主进程 ${process.pid} 正在运行`);

  // 衍生工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出`);
    console.log('正在重启...');
    cluster.fork(); // 自动重启
  });
} else {
  const app = express();

  app.get('/', (req, res) => {
    res.send(`Hello from worker ${process.pid}`);
  });

  app.listen(3000, () => {
    console.log(`工作进程 ${process.pid} 已启动`);
  });
}
```

```javascript
// 共享端口
// 所有工作进程共享同一个端口
// Node.js Cluster模块自动处理请求分发

// 进程间通信
if (cluster.isPrimary) {
  const worker = cluster.fork();
  worker.on('message', (msg) => {
    console.log('主进程收到消息:', msg);
  });
  worker.send({ type: 'config', data: { port: 3000 } });
} else {
  process.on('message', (msg) => {
    if (msg.type === 'config') {
      console.log('收到配置:', msg.data);
    }
  });
}
```

#### 面试题

**Q55: Node.js Cluster的原理是什么？**

**答案：**
1. 主进程（Master）创建多个工作进程（Worker）
2. 主进程监听端口，接收请求
3. 主进程将请求分发到工作进程
4. 工作进程处理请求并返回响应
5. 每个工作进程是独立的V8实例
6. 进程间通过IPC通信

**Q56: Cluster的优缺点是什么？**

**答案：**
- **优点**：充分利用多核CPU、提高吞吐量、进程崩溃自动重启
- **缺点**：内存不能共享、进程间通信开销、每个进程有独立内存

---

### 9.2 PM2进程管理

#### 原理

PM2是Node.js的进程管理工具，支持集群模式、日志管理、监控、自动重启等。

#### 代码示例

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name "my-app"

# 集群模式
pm2 start app.js -i max  # 使用所有CPU核心
pm2 start app.js -i 4    # 使用4个进程

# 管理应用
pm2 list                 # 查看所有应用
pm2 stop my-app          # 停止
pm2 restart my-app       # 重启
pm2 delete my-app        # 删除
pm2 reload my-app        # 零停机重启

# 查看日志
pm2 logs                 # 所有日志
pm2 logs my-app          # 指定应用日志

# 监控
pm2 monit                # 实时监控
pm2 plus                 # Web监控面板
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: './src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

```bash
# 使用配置文件
pm2 start ecosystem.config.js
pm2 start ecosystem.config.js --env production

# 开机自启
pm2 startup
pm2 save
```

#### 面试题

**Q57: PM2的集群模式和Node.js Cluster有什么区别？**

**答案：**
- PM2集群模式基于Node.js Cluster模块
- PM2提供了更高级的管理功能：日志管理、监控、自动重启、零停机重启
- PM2支持配置文件管理
- PM2支持进程间负载均衡
- PM2提供了Web监控面板

---

### 9.3 日志系统winston

#### 代码示例

```javascript
const winston = require('winston');
const { combine, timestamp, printf, colorize, errors } = winston.format;

// 自定义格式
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// 创建logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 错误日志
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 所有日志
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), timestamp(), logFormat),
  }));
}

module.exports = logger;
```

```javascript
// 使用logger
const logger = require('./utils/logger');

logger.error('Something went wrong', { error: err.stack });
logger.warn('Warning message');
logger.info('Info message');
logger.debug('Debug message', { data: someObject });

// Express集成
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});
```

```javascript
// 日志轮转
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d' // 保留14天
});

const logger = winston.createLogger({
  transports: [transport]
});
```

#### 面试题

**Q58: winston的日志级别有哪些？**

**答案：**
从低到高：error、warn、info、http、verbose、debug、silly

设置某个级别后，只会记录该级别及以上的日志。例如设置为info，则不会记录debug和silly。

---

### 9.4 健康检查

#### 代码示例

```javascript
// 健康检查路由
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // 检查数据库连接
  try {
    await mongoose.connection.db.admin().ping();
    health.checks.database = { status: 'ok' };
  } catch (err) {
    health.status = 'error';
    health.checks.database = { status: 'error', message: err.message };
  }

  // 检查Redis连接
  try {
    await redis.ping();
    health.checks.redis = { status: 'ok' };
  } catch (err) {
    health.status = 'error';
    health.checks.redis = { status: 'error', message: err.message };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// 简单版
app.get('/health/simple', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// 就绪检查（深度检查）
app.get('/ready', async (req, res) => {
  try {
    // 检查所有依赖服务
    await checkDatabase();
    await checkRedis();
    await checkExternalAPI();
    res.status(200).json({ status: 'ready' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: err.message });
  }
});
```

#### 面试题

**Q59: 健康检查的liveness和readiness有什么区别？**

**答案：**
- **Liveness**：检查应用是否存活，失败则重启容器
- **Readiness**：检查应用是否就绪，失败则从负载均衡中移除
- Liveness检查简单快速（如进程是否存在）
- Readiness检查更全面（如数据库连接是否正常）

---

### 9.5 优雅关闭

#### 代码示例

```javascript
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis');

const app = express();
const server = app.listen(3000);

// 优雅关闭
async function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // 1. 停止接收新请求
  server.close(async () => {
    console.log('HTTP server closed');

    try {
      // 2. 关闭数据库连接
      await mongoose.connection.close();
      console.log('MongoDB connection closed');

      // 3. 关闭Redis连接
      await redis.quit();
      console.log('Redis connection closed');

      // 4. 退出进程
      console.log('Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // 如果5秒内未完成，强制退出
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
}

// 监听信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});
```

```javascript
// 带超时的优雅关闭
class GracefulShutdown {
  constructor(server) {
    this.server = server;
    this.connections = new Set();
    this.shutdown = false;

    // 跟踪活跃连接
    this.server.on('connection', (socket) => {
      this.connections.add(socket);
      socket.on('close', () => this.connections.delete(socket));

      if (this.shutdown) {
        socket.end('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      }
    });
  }

  async shutdown(timeout = 10000) {
    this.shutdown = true;
    console.log('Starting graceful shutdown...');

    // 停止接收新连接
    this.server.close(() => {
      console.log('Server stopped accepting new connections');
    });

    // 等待现有连接完成
    if (this.connections.size > 0) {
      console.log(`Waiting for ${this.connections.size} active connections...`);
      await new Promise((resolve) => setTimeout(resolve, timeout));
      // 强制关闭剩余连接
      for (const socket of this.connections) {
        socket.destroy();
      }
    }

    console.log('All connections closed');
  }
}
```

#### 面试题

**Q60: 优雅关闭的步骤是什么？**

**答案：**
1. 监听SIGTERM和SIGINT信号
2. 停止接收新请求（server.close()）
3. 等待正在处理的请求完成
4. 关闭数据库连接
5. 关闭Redis等其他连接
6. 清理临时资源
7. 记录关闭日志
8. 调用process.exit(0)
9. 设置超时，超时后强制退出

---

## 10. 实战项目

### 10.1 用Express实现完整的用户认证+CRUD REST API

#### 项目结构

```
project/
  src/
    config/
      database.js
      config.js
    controllers/
      authController.js
      userController.js
    middlewares/
      auth.js
      errorHandler.js
      validate.js
    models/
      User.js
    routes/
      auth.js
      users.js
    utils/
      AppError.js
      logger.js
    app.js
    server.js
  package.json
  .env
```

#### 数据库配置

```javascript
// src/config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

```javascript
// src/config/config.js
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10
  }
};
```

#### 数据模型

```javascript
// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name must be at most 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // 默认不返回密码
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 实例方法：比较密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

#### 工具类

```javascript
// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

```javascript
// src/utils/logger.js
const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), timestamp(), logFormat),
  }));
}

module.exports = logger;
```

#### 中间件

```javascript
// src/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('This user has been deactivated.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    next(new AppError('Invalid token. Please log in again.', 401));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { signToken, authMiddleware, restrictTo };
```

```javascript
// src/middlewares/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // 开发环境返回详细错误
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // 生产环境
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      logger.error('Unexpected error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};

module.exports = errorHandler;
```

```javascript
// src/middlewares/validate.js
const Joi = require('joi');
const AppError = require('../utils/AppError');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const messages = error.details.map(detail => detail.message);
      return next(new AppError(messages.join(', '), 400));
    }

    next();
  };
};

// 验证Schema
const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(50),
  email: Joi.string().email()
});

module.exports = { validate, registerSchema, loginSchema, updateUserSchema };
```

#### 控制器

```javascript
// src/controllers/authController.js
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../middlewares/auth');

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    // 创建用户
    const user = await User.create({ name, email, password });

    // 生成Token
    const token = signToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 检查是否提供了邮箱和密码
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // 查找用户（需要select password）
    const user = await User.findOne({ email }).select('+password');

    // 检查用户是否存在及密码是否正确
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    // 检查用户是否激活
    if (!user.isActive) {
      return next(new AppError('This account has been deactivated', 401));
    }

    const token = signToken(user.id);

    res.status(200).json({
      status: 'success',
      token,
      data: { user: { id: user.id, name: user.name, email: user.email, role: user.role } }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};
```

```javascript
// src/controllers/userController.js
const User = require('../models/User');
const AppError = require('../utils/AppError');

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = User.find();
    const total = await User.countDocuments();

    const users = await query.skip(skip).limit(limit).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    // 不允许更新密码和角色
    const { password, role, ...updateData } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(200).json({ status: 'success', data: { user } });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
```

#### 路由

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validate, registerSchema, loginSchema } = require('../middlewares/validate');
const { authMiddleware } = require('../middlewares/auth');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
```

```javascript
// src/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, restrictTo } = require('../middlewares/auth');
const { validate, updateUserSchema } = require('../middlewares/validate');

router.use(authMiddleware); // 所有路由都需要认证

router.get('/', restrictTo('admin'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', restrictTo('admin'), userController.deleteUser);

module.exports = router;
```

#### 应用入口

```javascript
// src/app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const logger = require('./utils/logger');

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors());
app.use(xss());
app.use(hpp());

// 限流
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
}));

// 解析请求体
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 错误处理中间件
app.use(errorHandler);

module.exports = app;
```

```javascript
// src/server.js
const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

// 启动服务器
const server = app.listen(PORT, async () => {
  await connectDB();
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// 优雅关闭
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  shutdown('unhandledRejection');
});
```

#### 测试

```javascript
// tests/auth.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    test('should not register with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already in use');
    });

    test('should validate input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'A', email: 'invalid', password: '123' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    test('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });
  });
});
```

```javascript
// tests/users.test.js
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST);
  // 注册并获取token
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Admin', email: 'admin@test.com', password: 'password123' });
  token = res.body.token;
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
});

describe('Users API', () => {
  describe('GET /api/users', () => {
    test('should get all users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.users).toBeDefined();
    });

    test('should return 401 without token', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get a single user', async () => {
      const users = await User.find();
      const userId = users[0]._id;

      const res = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user._id).toBe(userId.toString());
    });

    test('should return 404 for non-existent user', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/users/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/users/:id', () => {
    test('should update a user', async () => {
      const users = await User.find();
      const userId = users[0]._id;

      const res = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.name).toBe('Updated Name');
    });
  });
});
```

#### 面试题

**Q61: 如何设计一个生产级的Express项目结构？**

**答案：**
1. **分层架构**：routes -> controllers -> services -> models
2. **中间件分离**：auth、validation、error handling独立文件
3. **配置管理**：使用环境变量和配置文件
4. **错误处理**：自定义错误类 + 全局错误处理中间件
5. **日志系统**：使用winston记录日志
6. **安全防护**：helmet、cors、xss、hpp、rate-limit
7. **优雅关闭**：处理SIGTERM/SIGINT信号
8. **健康检查**：提供/health端点
9. **测试覆盖**：单元测试 + 集成测试
10. **文档**：使用Swagger生成API文档

**Q62: 如何确保API的安全性？**

**答案：**
1. **认证**：JWT或Session认证
2. **授权**：RBAC权限控制
3. **输入验证**：使用Joi或class-validator
4. **SQL/NoSQL注入防护**：使用ORM/ODM
5. **XSS防护**：使用xss-clean中间件
6. **CSRF防护**：使用csurf中间件
7. **速率限制**：防止暴力破解
8. **HTTPS**：加密传输
9. **Helmet**：设置安全HTTP头
10. **HPP**：防止HTTP参数污染

---

> 本文档覆盖了Node.js后端开发的核心知识点，每个知识点都包含原理讲解、代码示例和面试题。建议结合实际项目练习，加深理解。

---

## 11. Cluster 多进程架构

### 11.1 child_process.fork

```javascript
const { fork } = require('child_process');

// 主进程
const child = fork('./worker.js');

// 主进程 → 子进程
child.send({ type: 'task', data: 'some data' });

// 子进程 → 主进程
child.on('message', (msg) => {
  console.log('收到子进程消息:', msg);
});

// 子进程退出
child.on('exit', (code) => {
  console.log(`子进程退出，退出码: ${code}`);
});

// 杀死子进程
child.kill();

// worker.js（子进程）
process.on('message', (msg) => {
  if (msg.type === 'task') {
    const result = doWork(msg.data);
    process.send({ type: 'result', data: result });
  }
});
```

### 11.2 cluster 模块

```javascript
const cluster = require('cluster');
const os = require('os');
const http = require('http');

if (cluster.isPrimary) {
  // 主进程
  const numCPUs = os.cpus().length;
  console.log(`主进程 ${process.pid} 正在运行`);

  // 根据 CPU 核心数创建工作进程
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // 工作进程退出时重启
  cluster.on('exit', (worker, code, signal) => {
    console.log(`工作进程 ${worker.process.pid} 已退出，正在重启...`);
    cluster.fork();
  });

  // 主进程和工作进程通信
  Object.values(cluster.workers).forEach(worker => {
    worker.on('message', (msg) => {
      console.log(`主进程收到工作进程 ${worker.id} 的消息:`, msg);
    });
  });
} else {
  // 工作进程
  console.log(`工作进程 ${process.pid} 已启动`);

  http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from Worker ${process.pid}\n`);
  }).listen(3000);
}
```

### 11.3 PM2 原理

```
PM2 是 Node.js 进程管理工具，核心功能：
1. 进程守护 — 进程崩溃自动重启
2. 负载均衡 — cluster 模式，多进程利用多核
3. 日志管理 — 统一管理应用日志
4. 监控 — CPU、内存使用率监控
5. 零停机重载 — graceful reload
```

```javascript
// PM2 配置文件 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-app',
    script: './src/index.js',
    instances: 'max', // 或指定数字，max = CPU 核心数
    exec_mode: 'cluster', // cluster 模式
    watch: false,
    max_memory_restart: '1G', // 内存超过 1G 自动重启
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

// PM2 常用命令
// pm2 start ecosystem.config.js
// pm2 reload my-app（零停机重载）
// pm2 stop my-app
// pm2 delete my-app
// pm2 logs
// pm2 monit
```

### 11.4 IPC（进程间通信）

```javascript
// Node.js IPC 基于 pipe（管道），支持：
// 1. send() — 发送可序列化的消息
// 2. handle — 传递 TCP Server / UDP Socket

// 主进程传递 HTTP Server 给子进程
const server = http.createServer();
const worker = fork('./worker.js');
worker.send('server', server);

// worker.js
process.on('message', (msg, server) => {
  if (msg === 'server') {
    server.on('connection', (socket) => {
      // 子进程处理连接
    });
  }
});

// 注意：IPC 只支持可序列化的数据
// 不能传递函数、Symbol、DOM 对象等
// 可以传递：string, number, boolean, object, array, Buffer, null, undefined
```

---

## 12. worker_threads 工作线程

### 12.1 基本用法

```javascript
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // 主线程
  const worker = new Worker(__filename, {
    workerData: { start: 1, end: 100000000 }
  });

  worker.on('message', (result) => {
    console.log('计算结果:', result);
  });

  worker.on('error', (err) => {
    console.error('Worker 错误:', err);
  });

  worker.on('exit', (code) => {
    console.log(`Worker 退出，退出码: ${code}`);
  });
} else {
  // 工作线程
  const { start, end } = workerData;
  let sum = 0;
  for (let i = start; i <= end; i++) {
    sum += i;
  }
  parentPort.postMessage(sum);
}
```

### 12.2 Worker vs Child Process

```
child_process.fork:
  - 创建独立的 V8 实例
  - 进程间通过 IPC 通信
  - 内存隔离，启动开销大
  - 适合 CPU 密集型任务

worker_threads:
  - 共享进程内存（通过 SharedArrayBuffer）
  - 线程间通信开销更小
  - 启动更快
  - 适合需要共享数据的场景
  - 注意：Node.js 仍然是单线程事件循环，Worker Threads 是真正的多线程
```

### 12.3 SharedArrayBuffer

```javascript
// 共享内存
const { Worker, SharedArrayBuffer } = require('worker_threads');

const sharedBuffer = new SharedArrayBuffer(4); // 4 字节共享内存
const sharedArray = new Int32Array(sharedBuffer);

const worker = new Worker('./worker.js', {
  workerData: { buffer: sharedBuffer }
});

// 主线程可以读写 sharedArray
// 工作线程也可以读写 sharedArray
// 需要使用 Atomics 保证原子性

// worker.js
const { workerData, parentPort } = require('worker_threads');
const sharedArray = new Int32Array(workerData.buffer);

Atomics.add(sharedArray, 0, 1); // 原子操作
parentPort.postMessage('done');
```

---

## 13. 手写 Promise.all / Promise.race

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
    let settledCount = 0;

    iterable.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => {
          results[index] = value;
          settledCount++;
          if (settledCount === iterable.length) {
            resolve(results);
          }
        },
        (reason) => reject(reason)
      );
    });
  });
}

// Promise.race — 返回最先完成的结果
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    const iterable = Array.from(promises);
    if (iterable.length === 0) return;

    iterable.forEach((promise) => {
      Promise.resolve(promise).then(resolve, reject);
    });
  });
}

// 测试
promiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  new Promise(resolve => setTimeout(() => resolve(3), 100))
]).then(console.log); // [1, 2, 3]

promiseRace([
  new Promise(resolve => setTimeout(() => resolve('slow'), 200)),
  new Promise(resolve => setTimeout(() => resolve('fast'), 100))
]).then(console.log); // 'fast'
```

---

## 14. Koa 中间件洋葱模型

### 14.1 原理

```
Koa 的中间件是一个异步函数数组，执行顺序呈"洋葱"形状：

请求 → 中间件1(前半) → 中间件2(前半) → 中间件3(前半) → 业务处理
响应 ← 中间件1(后半) ← 中间件2(后半) ← 中间件3(后半) ← 业务处理

每个中间件通过 await next() 将控制权传递给下一个中间件，
next() 返回后继续执行当前中间件的后续代码。
```

### 14.2 compose 函数手写

```javascript
function compose(middlewares) {
  if (!Array.isArray(middlewares)) {
    throw new TypeError('Middleware stack must be an array');
  }
  if (middlewares.some(fn => typeof fn !== 'function')) {
    throw new TypeError('Middleware must be composed of functions');
  }

  return function(context, next) {
    let index = -1;

    function dispatch(i) {
      if (i <= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      index = i;

      const fn = middlewares[i];
      if (!fn) {
        return Promise.resolve();
      }

      try {
        return Promise.resolve(
          fn(context, dispatch.bind(null, i + 1))
        );
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}

// 使用示例
const app = {
  middleware: [],
  use(fn) { this.middleware.push(fn); },
  listen(port) {
    const fn = compose(this.middleware);
    http.createServer((req, res) => {
      const ctx = { req, res };
      fn(ctx).then(() => {
        res.end(ctx.body);
      }).catch(err => {
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
    }).listen(port);
  }
};

// 注册中间件
app.use(async (ctx, next) => {
  console.log('1. 请求开始');
  const start = Date.now();
  await next();
  console.log(`1. 请求结束，耗时: ${Date.now() - start}ms`);
});

app.use(async (ctx, next) => {
  console.log('2. 处理请求');
  ctx.body = 'Hello Koa';
  await next();
  console.log('2. 响应完成');
});

app.listen(3000);

// 输出顺序：
// 1. 请求开始
// 2. 处理请求
// 2. 响应完成
// 1. 请求结束，耗时: Xms
```

---

## 15. Node.js 内存泄漏排查

### 15.1 常见内存泄漏场景

```javascript
// 1. 全局变量
// bad: 意外的全局变量
function leak1() {
  // 没有声明，自动成为全局变量
  cache = {}; // 等同于 global.cache
}
// good: 使用 const/let
function fixed1() {
  const cache = {};
}

// 2. 闭包引用
// bad: 定时器持有大对象引用
function leak2() {
  const hugeData = new Array(1000000);
  setInterval(() => {
    console.log(hugeData.length); // hugeData 无法被回收
  }, 1000);
}
// good: 只引用需要的数据
function fixed2() {
  const hugeData = new Array(1000000);
  const len = hugeData.length;
  setInterval(() => {
    console.log(len);
  }, 1000);
}

// 3. 事件监听器未移除
// bad: 重复添加监听器
function leak3(emitter) {
  // 每次调用都添加新的监听器
  emitter.on('data', () => {});
}
// good: 使用 once 或手动移除
function fixed3(emitter) {
  const handler = () => {};
  emitter.once('data', handler);
  // 或
  emitter.on('data', handler);
  // 用完后: emitter.off('data', handler);
}

// 4. 无限增长的 Map/Set/Array
// bad: 没有清理机制
const cache = new Map();
function getData(key) {
  if (!cache.has(key)) {
    cache.set(key, fetchFromDB(key)); // 永远增长
  }
  return cache.get(key);
}
// good: 使用 LRU 或 WeakMap
const lruCache = new LRUCache(1000); // 限制大小
const weakCache = new WeakMap(); // 自动回收

// 5. Promise 未处理的 rejection
// bad: 没有 catch 的 Promise
async function leak5() {
  const data = await fetchData(); // 如果 reject，没有处理
}
// good: 始终处理错误
async function fixed5() {
  try {
    const data = await fetchData();
  } catch (err) {
    console.error(err);
  }
}
```

### 15.2 排查工具

```bash
# 1. heapdump — 生成堆快照
# 安装: npm install heapdump
# 在代码中触发:
const heapdump = require('heapdump');
heapdump.writeSnapshot('/tmp/heapdump-' + Date.now() + '.heapsnapshot');

# 2. Chrome DevTools 分析堆快照
# 打开 Chrome → DevTools → Memory → Load → 选择 .heapsnapshot 文件
# 对比两个快照，查看新增的对象

# 3. node --inspect
node --inspect app.js
# 然后在 Chrome 中打开 chrome://inspect

# 4. clinic.js
npm install -g clinic
clinic heapprofiler -- node app.js

# 5. process.memoryUsage()
setInterval(() => {
  const used = process.memoryUsage();
  console.log({
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',     // 进程常驻内存
    heapTotal: Math.round(used.heapTotal / 1024 / 1024) + 'MB', // V8 堆总大小
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB',   // V8 堆已使用
    external: Math.round(used.external / 1024 / 1024) + 'MB'    // C++ 对象内存
  });
}, 5000);
```

---

## 16. V8 引擎基础

### 16.1 隐藏类（Hidden Class）

```javascript
// V8 为每个对象创建隐藏类（类似 C++ 的类），用于优化属性访问速度

// 1. 所有属性相同的对象共享同一个隐藏类
function Point(x, y) {
  this.x = x;
  this.y = y;
}

const p1 = new Point(1, 2);
const p2 = new Point(3, 4);
// p1 和 p2 共享同一个隐藏类 C1

// 2. 动态添加属性会创建新的隐藏类
p1.z = 3;
// p1 的隐藏类变为 C2（C1 的子类）
// p2 仍然是 C1
// 隐藏类链：C0 → C1(x,y) → C2(x,y,z)

// 3. 属性添加顺序不同，隐藏类也不同
const obj1 = { a: 1, b: 2 }; // 隐藏类 C1
const obj2 = { b: 2, a: 1 }; // 隐藏类 C2（不同于 C1）

// 性能建议：
// 1. 在构造函数中一次性声明所有属性
// 2. 保持属性添加顺序一致
// 3. 避免动态添加/删除属性
```

### 16.2 内联缓存（Inline Cache）

```javascript
// 内联缓存（IC）是一种优化技术，缓存属性查找的结果

function getX(obj) {
  return obj.x;
}

// 第一次调用：V8 查找 obj.x 的偏移量，记录在 IC 中
getX({ x: 1 }); // IC miss → 查找 → 缓存

// 第二次调用（相同隐藏类）：直接使用缓存的偏移量
getX({ x: 2 }); // IC hit → 直接访问

// 不同隐藏类：IC miss → 重新查找 → 更新缓存
getX({ x: 3, y: 4 }); // 如果隐藏类不同，IC miss

// 多态（Polymorphic）：IC 缓存了多个隐藏类的查找结果
// 超过一定数量（通常 4 个）变为超态（Megamorphic），性能下降

// 性能建议：
// 1. 避免在热点函数中处理不同形状的对象
// 2. 使用 TypeScript 确保对象形状一致
// 3. 避免混合不同类型的参数
```

### 16.3 V8 垃圾回收（简要）

```
V8 的垃圾回收采用分代回收策略：

新生代（Young Generation）：
  - 存放短命对象
  - 使用 Scavenge 算法（半空间复制）
  - From 空间 → To 空间（存活对象复制到 To 空间）
  - 晋升条件：对象经历一次 Scavenge 仍然存活，或 To 空间使用超过 25%

老生代（Old Generation）：
  - 存放长命对象
  - 使用 Mark-Sweep（标记清除）+ Mark-Compact（标记整理）
  - 增量标记（Incremental Marking）— 将标记工作拆分为小步骤
  - 并发回收（Concurrent）— 在辅助线程中执行回收

优化建议：
  1. 避免创建大量短命对象（减少新生代 GC 压力）
  2. 及时释放大对象的引用
  3. 使用 Buffer 处理二进制数据（不经过 V8 堆）
```
