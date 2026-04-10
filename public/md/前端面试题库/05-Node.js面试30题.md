# Node.js 面试 30 题

> 基于 Node.js 后端开发整理，覆盖事件循环、模块系统、Stream、异步编程、框架及多进程

---

## 目录

- [一、事件循环（6题）](#一事件循环)
- [二、模块系统（5题）](#二模块系统)
- [三、Stream 与 Buffer（5题）](#三stream-与-buffer)
- [四、异步编程（5题）](#四异步编程)
- [五、Express/Koa/NestJS（5题）](#五expresskoanestjs)
- [六、多进程与性能（4题）](#六多进程与性能)
- [高频考点速查表](#高频考点速查表)

---

## 一、事件循环

### Q1: Node.js 事件循环的执行顺序是什么？

**难度**: ⭐⭐

**答案**: 同步代码 → 微任务（nextTick > Promise）→ 宏任务（按阶段：timers → pending → poll → check → close）→ 每个阶段后清空微任务。

**解析**:
```
Node.js 事件循环六个阶段：
1. timers — setTimeout / setInterval
2. pending callbacks — 执行 I/O 回调
3. idle, prepare — 内部使用
4. poll — 检索新的 I/O 事件
5. check — setImmediate
6. close callbacks — close 事件

微任务在每个阶段之间执行：
process.nextTick > Promise.then
```

---

### Q2: process.nextTick 和 setImmediate 的区别？

**难度**: ⭐⭐

**答案**: `process.nextTick` 在当前操作完成后立即执行，优先级高于所有微任务；`setImmediate` 在事件循环的 Check 阶段执行。在 I/O 回调中 setImmediate 先于 setTimeout。

**解析**:
```javascript
// 主模块中顺序不确定
setTimeout(() => console.log('timeout'), 0);
setImmediate(() => console.log('immediate'));
// 可能输出：timeout, immediate 或 immediate, timeout

// I/O 回调中 setImmediate 优先
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
  // 输出：immediate, timeout
});

// nextTick 总是优先
process.nextTick(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
// 输出：nextTick, promise
```

---

### Q3: Node.js 和浏览器事件循环的区别？

**难度**: ⭐⭐

**答案**: (1) Node.js 有多个宏任务队列（按阶段划分），浏览器只有一个；(2) Node.js 微任务在阶段之间执行，浏览器在宏任务后执行；(3) Node.js 有 nextTick 和 setImmediate，浏览器没有。

---

### Q4: Node.js 中如何避免回调地狱？

**难度**: ⭐⭐

**答案**: (1) Promise 链式调用；(2) async/await；(3) EventEmitter；(4) 控制流库（async.js）。

**解析**:
```javascript
// Promise
function fetchData() {
  return fetch('/api/user')
    .then(res => res.json())
    .then(user => fetch(`/api/posts?userId=${user.id}`))
    .then(res => res.json());
}

// async/await（推荐）
async function fetchData() {
  const userRes = await fetch('/api/user');
  const user = await userRes.json();
  const postsRes = await fetch(`/api/posts?userId=${user.id}`);
  return postsRes.json();
}
```

---

### Q5: 什么是微任务和宏任务？

**难度**: ⭐

**答案**: 微任务优先级高，在每个宏任务执行完后清空。宏任务按阶段执行。

**解析**:
```
微任务：Promise.then/catch/finally、process.nextTick、queueMicrotask
宏任务：setTimeout、setInterval、setImmediate、I/O 操作、UI 渲染

执行顺序：同步 → nextTick → Promise → 宏任务 → nextTick → Promise → ...
```

---

### Q6: 如何实现一个定时器不受事件循环阻塞？

**难度**: ⭐⭐⭐

**答案**: 使用 `setImmediate` 或 `process.nextTick` 可以更快执行。对于精确计时，可以使用 `worker_threads` 在独立线程中计时。

**解析**:
```javascript
// setTimeout 最小延迟约 1ms（Node.js 中）
// 如果事件循环被阻塞，setTimeout 不会准时

// 使用 worker_threads 精确计时
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  const worker = new Worker(__filename, { workerData: 5000 });
  worker.on('message', (msg) => console.log('Timer fired:', msg));
} else {
  setTimeout(() => {
    parentPort.postMessage(`fired after ${workerData}ms`);
  }, workerData);
}
```

---

## 二、模块系统

### Q7: CommonJS 和 ESM 的主要区别？

**难度**: ⭐⭐

**答案**: CJS 运行时加载、同步、值拷贝、`require/module.exports`；ESM 编译时加载、异步、值引用、`import/export`。

**解析**:
| 特性 | CommonJS | ESM |
|------|----------|-----|
| 加载时机 | 运行时 | 编译时 |
| 加载方式 | 同步 | 异步 |
| 值传递 | 值拷贝 | 值引用 |
| 顶层 this | module | undefined |
| 动态导入 | require() | import() |
| 循环依赖 | 可能得到不完整值 | 引用实时绑定 |

---

### Q8: Node.js 模块加载的查找机制？

**难度**: ⭐⭐

**答案**: (1) 核心模块（fs、path 等）直接返回；(2) 文件模块按路径查找；(3) node_modules 逐级向上查找。

**解析**:
```
查找顺序：
1. 核心模块 — require('fs')
2. 相对/绝对路径 — require('./module')
3. node_modules — require('lodash')
   - 当前目录/node_modules
   - 父目录/node_modules
   - ...直到根目录

文件查找顺序：
require('./module')
→ ./module.js
→ ./module.json
→ ./module.node
→ ./module/index.js
→ ./module/index.json
→ ./module/index.node
```

---

### Q9: 什么是循环依赖？如何解决？

**难度**: ⭐⭐

**答案**: 模块 A 引用 B，B 又引用 A，形成循环。CJS 可能得到不完整的值；ESM 引用实时绑定但可能遇到 TDZ。

**解析**:
```javascript
// CJS 循环依赖
// a.js
const b = require('./b');
console.log(b.bValue); // undefined（b.js 还没执行完）
exports.aValue = 1;

// b.js
const a = require('./a');
console.log(a.aValue); // 1
exports.bValue = 2;

// 解决方案：
// 1. 重构代码，消除循环依赖
// 2. 延迟加载（函数内 require）
// 3. 使用依赖注入
// 4. 将共享逻辑提取到第三个模块
```

---

### Q10: module.exports 和 exports 的区别？

**难度**: ⭐

**答案**: `module.exports` 是模块的导出对象，`exports` 是 `module.exports` 的引用。不能直接给 `exports` 赋值（会断开引用），只能添加属性。

**解析**:
```javascript
// 正确
module.exports = { name: '张三' };
exports.name = '张三';

// 错误 — exports 被重新赋值，不再指向 module.exports
exports = { name: '张三' };

// 原理
const exports = module.exports; // exports 是引用
// exports = xxx; // 修改了引用，不影响 module.exports
```

---

### Q11: package.json 中的 exports 字段有什么用？

**难度**: ⭐⭐

**答案**: `exports` 定义包的公共 API，未导出的路径无法访问。支持条件导出（根据环境选择不同入口）。

**解析**:
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "default": "./dist/index.mjs"
    },
    "./utils": {
      "import": "./dist/utils.mjs",
      "require": "./dist/utils.cjs"
    }
  }
}
// 优势：
// 1. 定义公共 API（封装内部实现）
// 2. 条件导出（ESM/CJS/Node/Browser）
// 3. 子路径导出
```

---

## 三、Stream 与 Buffer

### Q12: Stream 有哪些类型？各有什么特点？

**难度**: ⭐⭐

**答案**: 四种类型：Readable（可读）、Writable（可写）、Duplex（双工，可读可写）、Transform（转换，读写之间转换）。

**解析**:
```javascript
// Readable
const readable = fs.createReadStream('./file.txt');

// Writable
const writable = fs.createWriteStream('./output.txt');

// Duplex（如 TCP Socket）
const { Socket } = require('net');

// Transform（如 zlib）
const { Transform } = require('stream');
const upperCase = new Transform({
  transform(chunk, encoding, callback) {
    this.push(chunk.toString().toUpperCase());
    callback();
  }
});
```

---

### Q13: Stream 的 pipe 方法和 pipeline 的区别？

**难度**: ⭐⭐

**答案**: `pipe` 不处理错误，一个环节出错会导致整个管道崩溃；`pipeline` 自动处理错误和背压，是推荐的方式。

**解析**:
```javascript
// pipe — 不处理错误
readable.pipe(writable); // 如果 readable 出错，writable 不会关闭

// pipeline — 自动处理错误（推荐）
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

---

### Q14: 什么是背压（Backpressure）？如何处理？

**难度**: ⭐⭐

**答案**: 背压是生产者产生数据速度快于消费者处理速度。Stream 通过 `highWaterMark` 和 `drain` 事件处理。

**解析**:
```javascript
// 处理背压
function writeData(writable, data) {
  let ok = true;
  for (const chunk of data) {
    if (!ok) break;
    ok = writable.write(chunk);
  }
  if (!ok) {
    writable.once('drain', () => writeData(writable, remainingData));
  }
}

// highWaterMark — 缓冲区大小
const readable = fs.createReadStream('./file.txt', {
  highWaterMark: 64 * 1024 // 64KB
});
```

---

### Q15: Buffer 和 String 的区别？

**难度**: ⭐

**答案**: Buffer 用于处理二进制数据，固定大小内存块；String 是 Unicode 字符串。Buffer 适合网络传输、文件操作、加密等场景。

**解析**:
```javascript
const buf = Buffer.from('Hello', 'utf-8');
console.log(buf.length);     // 5（字节长度）
console.log(buf.toString()); // 'Hello'

const buf2 = Buffer.alloc(10); // 创建 10 字节全零 Buffer
const buf3 = Buffer.allocUnsafe(10); // 创建但不初始化（更快，可能含旧数据）

// Buffer 操作
Buffer.concat([buf1, buf2]); // 合并
buf.slice(0, 3); // 切片（共享内存）
Buffer.isBuffer(buf); // 判断是否为 Buffer
```

---

### Q16: 如何实现一个自定义 Transform Stream？

**难度**: ⭐⭐

**答案**: 继承 Transform 类，实现 `_transform` 方法。

**解析**:
```javascript
const { Transform } = require('stream');

class CsvToJson extends Transform {
  constructor(options) {
    super({ ...options, objectMode: true });
    this.headers = null;
    this.remaining = '';
  }

  _transform(chunk, encoding, callback) {
    const data = this.remaining + chunk.toString();
    const lines = data.split('\n');
    this.remaining = lines.pop(); // 最后一行可能不完整

    for (const line of lines) {
      if (!this.headers) {
        this.headers = line.split(',');
        continue;
      }
      const values = line.split(',');
      const obj = {};
      this.headers.forEach((h, i) => obj[h] = values[i]);
      this.push(obj);
    }
    callback();
  }

  _flush(callback) {
    if (this.remaining) {
      // 处理剩余数据
    }
    callback();
  }
}
```

---

## 四、异步编程

### Q17: Promise 的三种状态和状态转换？

**难度**: ⭐

**答案**: Pending（进行中）→ Fulfilled（已成功）或 Rejected（已失败）。状态一旦改变不可逆。

**解析**:
```javascript
const promise = new Promise((resolve, reject) => {
  // Pending 状态
  setTimeout(() => {
    resolve('success'); // → Fulfilled
    // reject('error'); // → Rejected
  }, 1000);
});

// 状态不可逆
promise
  .then(val => console.log(val))
  .catch(err => console.error(err))
  .finally(() => console.log('done'));
```

---

### Q18: async/await 的错误处理有哪些方式？

**难度**: ⭐⭐

**答案**: (1) try-catch；(2) .catch()；(3) 封装错误处理工具函数（如 go 函数）。

**解析**:
```javascript
// try-catch
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    return await res.json();
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// 封装 go 函数（类似 Go 语言的错误处理）
function go(promise) {
  return promise.then(data => [null, data]).catch(err => [err, null]);
}

async function main() {
  const [err, data] = await go(fetchData());
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
}
```

---

### Q19: 如何实现并发控制（限制并发数）？

**难度**: ⭐⭐⭐

**答案**: 使用信号量模式，维护一个执行池，控制同时执行的异步任务数量。

**解析**:
```javascript
async function asyncPool(limit, items, fn) {
  const results = [];
  const executing = new Set();

  for (const item of items) {
    const p = fn(item).then(result => {
      results.push(result);
      executing.delete(p);
    });
    executing.add(p);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
  return results;
}

// 使用
const urls = ['/api/1', '/api/2', '/api/3', '/api/4', '/api/5'];
const results = await asyncPool(2, urls, url => fetch(url).then(r => r.json()));
```

---

### Q20: Node.js 中的 uncaughtException 和 unhandledRejection 如何处理？

**难度**: ⭐⭐

**答案**: `uncaughtException` 捕获未处理的同步异常，`unhandledRejection` 捕获未处理的 Promise 拒绝。两者都应记录日志并优雅退出。

**解析**:
```javascript
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // 记录日志
  logger.error(err);
  // 优雅退出（不建议继续运行）
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  logger.error({ reason, promise });
  process.exit(1);
});

// 注意：继续运行可能导致状态不一致
// Node.js 建议在 unhandledRejection 后退出进程
```

---

### Q21: 如何实现请求超时控制？

**难度**: ⭐⭐

**答案**: 使用 `Promise.race` 让请求和超时竞争。

**解析**:
```javascript
function fetchWithTimeout(url, timeout = 5000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// 使用 AbortController（更推荐）
async function fetchWithAbort(url, timeout = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  }
}
```

---

## 五、Express/Koa/NestJS

### Q22: Express 和 Koa 的区别？

**难度**: ⭐⭐

**答案**: Express 内置路由、中间件（线性执行）、错误处理；Koa 更轻量，使用 async/await 中间件（洋葱模型），不内置路由。

**解析**:
```javascript
// Express — 线性中间件
app.use((req, res, next) => {
  console.log('1');
  next();
  console.log('2'); // 请求处理完后执行
});
// 执行顺序：1 → 路由处理 → 2

// Koa — 洋葱模型
app.use(async (ctx, next) => {
  console.log('1');
  await next();
  console.log('2');
});
// 执行顺序：1 → 内层中间件 → 2

// Koa 的优势：
// 1. 更好的异步支持（async/await）
// 2. 更轻量（核心只有 ~600 行）
// 3. 更灵活（不绑定特定中间件）
```

---

### Q23: Express 中间件的工作原理？

**难度**: ⭐⭐

**答案**: 中间件是一个函数，接收 (req, res, next) 参数。通过 `next()` 将控制权传递给下一个中间件。如果调用 `next(err)`，则跳过后续中间件，进入错误处理中间件。

**解析**:
```javascript
// 中间件执行流程
app.use(middleware1);
app.use(middleware2);
app.get('/api', handler);

// 请求 → middleware1 → middleware2 → handler → middleware2 → middleware1 → 响应

// 错误处理中间件（4个参数）
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 应用级中间件
app.use('/api', (req, res, next) => {
  // 只对 /api 路径生效
  next();
});
```

---

### Q24: NestJS 的核心概念是什么？

**难度**: ⭐⭐

**答案**: NestJS 基于 TypeScript + 装饰器 + 依赖注入，核心概念：Module（模块）、Controller（控制器）、Provider/Service（服务）、Guard（守卫）、Pipe（管道）、Interceptor（拦截器）、Filter（过滤器）。

**解析**:
```typescript
// Controller
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UsePipes(ValidationPipe)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
}

// Module
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

---

### Q25: 如何实现一个简单的 Express 路由？

**难度**: ⭐⭐

**答案**: 使用 `app.METHOD(path, handler)` 注册路由，支持路径参数、查询参数、正则路由。

**解析**:
```javascript
const express = require('express');
const app = express();

// 基本路由
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

// 路径参数
app.get('/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

// 路由模块化
const userRouter = express.Router();
userRouter.get('/', (req, res) => res.json([]));
userRouter.get('/:id', (req, res) => res.json({ id: req.params.id }));
app.use('/users', userRouter);

// 中间件
app.use(express.json()); // 解析 JSON 请求体
app.use('/api', (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Q26: 如何设计一个 RESTful API？

**难度**: ⭐⭐

**答案**: 使用 HTTP 方法表示操作（GET/POST/PUT/DELETE），使用名词复数表示资源，使用状态码表示结果，支持分页、过滤、排序。

**解析**:
```
RESTful API 设计规范：
GET    /api/users       — 获取用户列表
GET    /api/users/:id   — 获取单个用户
POST   /api/users       — 创建用户
PUT    /api/users/:id   — 更新用户（全量）
PATCH  /api/users/:id   — 更新用户（部分）
DELETE /api/users/:id   — 删除用户

分页：GET /api/users?page=1&limit=10
过滤：GET /api/users?status=active
排序：GET /api/users?sort=createdAt&order=desc
搜索：GET /api/users?q=keyword

响应格式：
{ data: [], total: 100, page: 1, limit: 10 }
错误响应：
{ error: { code: 'USER_NOT_FOUND', message: 'User not found' } }
```

---

## 六、多进程与性能

### Q27: Node.js 为什么是单线程的？如何利用多核？

**难度**: ⭐⭐

**答案**: Node.js 单线程避免锁和线程切换开销，适合 I/O 密集型。利用多核：`cluster` 模块（多进程）、`worker_threads`（多线程）、`child_process`（子进程）。

**解析**:
```javascript
// cluster — 多进程
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {  // ⚠️ cluster.isMaster 在 Node.js 16+ 已废弃，请使用 cluster.isPrimary
  const cpuCount = os.cpus().length;
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // 自动重启
  });
} else {
  require('./app'); // 启动服务器
}

// worker_threads — 多线程（适合 CPU 密集型）
const { Worker, isMainThread, parentPort } = require('worker_threads');
if (isMainThread) {
  const worker = new Worker(__filename);
  worker.on('message', (msg) => console.log('Result:', msg));
  worker.postMessage('heavy task');
} else {
  const result = doHeavyWork();
  parentPort.postMessage(result);
}
```

---

### Q28: cluster 模块的工作原理？

**难度**: ⭐⭐

**答案**: Master 进程创建多个 Worker 进程，每个 Worker 独立运行服务器。Master 负责监听端口，将请求分发给 Worker（Round Robin 或其他策略）。

**解析**:
```
cluster 工作模式：
1. Master 进程监听端口
2. 创建 N 个 Worker 进程（通常等于 CPU 核数）
3. Master 接收到新连接后，通过 IPC 发送给某个 Worker
4. Worker 处理请求并返回响应

优势：
- 充分利用多核 CPU
- 进程隔离，一个 Worker 崩溃不影响其他
- Master 可以自动重启崩溃的 Worker

注意：
- Worker 之间不共享内存（通过 IPC 通信）
- Session/Socket 需要使用 Sticky Session
- 使用 PM2 管理更方便
```

---

### Q29: 如何实现 Node.js 服务的优雅重启？

**难度**: ⭐⭐⭐

**答案**: (1) 通知 Master 不再发送新请求给旧 Worker；(2) 等待旧 Worker 处理完已有请求；(3) 启动新 Worker；(4) 关闭旧 Worker。

**解析**:
```javascript
const http = require('http');
const server = http.createServer(app);

let isShuttingDown = false;

function gracefulShutdown(signal) {
  console.log(`${signal} received. Starting graceful shutdown`);
  isShuttingDown = true;

  server.close(() => {
    console.log('HTTP server closed');
    // 关闭数据库连接
    db.close(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });

  // 强制退出超时
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

### Q30: Node.js 性能优化有哪些方法？

**难度**: ⭐⭐

**答案**: (1) 使用集群/多线程；(2) 内存泄漏排查；(3) 使用 Stream 处理大文件；(4) 缓存（Redis）；(5) 连接池；(6) 代码优化（避免同步操作）。

**解析**:
```
性能优化清单：
1. 集群模式（cluster / PM2）
2. 使用 worker_threads 处理 CPU 密集型任务
3. 使用 Stream 处理大文件（避免一次性读入内存）
4. 数据库连接池
5. Redis 缓存热点数据
6. 启用 gzip/brotli 压缩
7. 使用 Node.js --inspect 进行性能分析
8. 使用 clinic.js / 0x 进行火焰图分析
9. 避免在请求处理中使用同步 API
10. 合理设置 GC 参数（--max-old-space-size）
11. 使用 Fastify 替代 Express（更快）
12. 使用 SWC/esbuild 加速 TypeScript 编译
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| 事件循环 | ★★★★★ | 六阶段 + 微任务优先 |
| nextTick vs setImmediate | ★★★★ | nextTick 优先级更高 |
| CJS vs ESM | ★★★★ | 运行时 vs 编译时，值拷贝 vs 值引用 |
| Stream | ★★★★ | 四种类型，pipe vs pipeline，背压 |
| Buffer | ★★★ | 二进制数据处理 |
| 异步编程 | ★★★★★ | Promise、async/await、并发控制 |
| Express 中间件 | ★★★★ | 线性执行，next() 传递控制 |
| Koa 洋葱模型 | ★★★ | async/await，洋葱式执行 |
| NestJS | ★★★ | 装饰器 + 依赖注入 |
| 多进程 | ★★★★ | cluster、worker_threads |
| 优雅重启 | ★★★ | SIGTERM 处理、等待请求完成 |
| 性能优化 | ★★★★ | 集群、Stream、缓存、连接池 |
