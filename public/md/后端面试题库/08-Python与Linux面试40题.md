# Python 与 Linux 面试 40 题

> 基于 Python 核心、Web 框架、系统设计、数据库、Linux 基础、Docker/K8s 知识体系整理。

---

## 目录

- [一、Python 核心（10题）](#一python-核心10题)
- [二、Web 框架（6题）](#二web-框架6题)
- [三、系统设计（6题）](#三系统设计6题)
- [四、数据库（4题）](#四数据库4题)
- [五、Linux（8题）](#五linux8题)
- [六、Docker/K8s（6题）](#六dockerk8s6题)
- [高频考点速查表](#高频考点速查表)

---

## 一、Python 核心（10题）

### Q1: GIL（全局解释器锁）是什么？对多线程有什么影响？

**难度**: ⭐⭐

**答案**: GIL（Global Interpreter Lock）是 CPython 中的互斥锁，同一时刻只允许一个线程执行 Python 字节码。

**解析**:
- GIL 的存在使得 Python 多线程无法利用多核 CPU 进行并行计算
- GIL 在 I/O 操作时会释放（如网络请求、文件读写），因此多线程适合 I/O 密集型任务
- CPU 密集型任务应使用**多进程**（multiprocessing）绕过 GIL

```python
# I/O 密集型：多线程有效
import threading
import requests

def fetch(url):
    requests.get(url)

threads = [threading.Thread(target=fetch, args=(url,)) for url in urls]
for t in threads: t.start()
for t in threads: t.join()

# CPU 密集型：应使用多进程
from multiprocessing import Pool

def compute(n):
    return sum(i * i for i in range(n))

with Pool(4) as pool:
    results = pool.map(compute, [10000000] * 4)
```

---

### Q2: Python 的描述符（Descriptor）是什么？

**难度**: ⭐⭐⭐

**答案**: 描述符是实现了 `__get__`、`__set__`、`__delete__` 中的一个或多个方法的类，用于自定义属性的访问行为。

**解析**:
- **数据描述符**：实现了 `__get__` 和 `__set__`，优先级高于实例属性
- **非数据描述符**：只实现了 `__get__`，优先级低于实例属性
- `property`、`classmethod`、`staticmethod` 都是描述符

```python
class ValidatedAttribute:
    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, (int, float)):
            raise TypeError(f"{self.name} must be a number")
        obj.__dict__[self.name] = value

class User:
    age = ValidatedAttribute()

u = User()
u.age = 25    # OK
u.age = "abc" # TypeError: age must be a number
```

---

### Q3: Python 元类（Metaclass）是什么？

**难度**: ⭐⭐⭐

**答案**: 元类是"类的类"，用于控制类的创建过程。默认元类是 `type`。

**解析**:
```python
# 方式1：使用 type() 动态创建类
MyClass = type('MyClass', (object,), {'attr': 100})

# 方式2：自定义元类
class SingletonMeta(type):
    _instances = {}
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Singleton(metaclass=SingletonMeta):
    pass

# Singleton() 每次返回同一个实例
```

- 元类的应用场景：单例模式、ORM 模型定义、权限控制、自动注册

---

### Q4: Python 装饰器的本质是什么？手写一个带参数的装饰器。

**难度**: ⭐⭐

**答案**: 装饰器的本质是**高阶函数 + 闭包**，接收一个函数作为参数，返回一个增强后的函数。

**解析**:
```python
import functools
import time

def retry(max_retries=3, delay=1, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)  # 保留原函数元信息
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_retries=3, delay=2, exceptions=(ConnectionError, TimeoutError))
def fetch_api(url):
    # 网络请求逻辑
    pass
```

---

### Q5: Python 生成器（Generator）的原理和使用场景？

**难度**: ⭐⭐

**答案**: 生成器是使用 `yield` 关键字的函数，每次 `yield` 暂停执行并返回值，下次调用时从暂停处继续。

**解析**:
```python
# 斐波那契生成器
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

fib = fibonacci()
print(next(fib))  # 0
print(next(fib))  # 1
print(next(fib))  # 1

# 生成器表达式（惰性求值）
total = sum(x * x for x in range(1000000))  # 不占用大量内存

# yield from：委托给子生成器
def chain(*iterables):
    for it in iterables:
        yield from it
```

- 优势：惰性求值、节省内存、支持无限序列
- 场景：大数据处理、管道处理、协程

---

### Q6: Python 闭包（Closure）是什么？

**难度**: ⭐⭐

**答案**: 闭包是一个函数对象，它记住了定义时所在作用域的变量，即使外部函数已经返回。

**解析**:
```python
def make_counter():
    count = 0
    def counter():
        nonlocal count  # 声明使用外部变量
        count += 1
        return count
    return counter

c = make_counter()
print(c())  # 1
print(c())  # 2
print(c())  # 3
```

- 闭包的条件：嵌套函数、内部函数引用外部变量、外部函数返回内部函数
- 注意：Python 3 中需要 `nonlocal` 关键字才能修改外部变量

---

### Q7: Python 的垃圾回收机制？

**难度**: ⭐⭐

**答案**: Python 使用**引用计数**为主、**分代回收**和**循环检测**为辅的垃圾回收机制。

**解析**:
1. **引用计数**：对象被引用一次计数 +1，引用断开计数 -1，计数为 0 时立即回收
   - 优点：实时回收
   - 缺点：无法处理循环引用

2. **循环垃圾收集器**：检测并回收循环引用的对象
   - 使用分代回收策略：0 代（新建对象）、1 代（存活过一次 GC）、2 代（存活过多次 GC）
   - GC 频率：0 代 > 1 代 > 2 代

3. **弱引用**：`weakref` 模块，不增加引用计数

```python
import gc
import weakref

# 手动触发 GC
gc.collect()

# 弱引用
obj = MyClass()
ref = weakref.ref(obj)
obj = None  # 对象被回收
print(ref())  # None
```

---

### Q8: Python 的内存管理机制？

**难度**: ⭐⭐

**答案**: Python 使用**内存池机制**（Pymalloc）管理小对象内存，大对象直接调用 C 的 malloc/free。

**解析**:
- 小对象（< 256 字节）：使用内存池（Pymalloc），减少内存碎片
- 大对象（>= 256 字节）：直接调用系统的 malloc
- Python 的整数对象有缓存（-5 到 256），相同值的变量指向同一对象

```python
a = 256
b = 256
print(a is b)  # True（小整数缓存）

a = 257
b = 257
print(a is b)  # False（超出缓存范围）
```
> 注意：在交互式环境中逐行执行时 257 is 257 返回 False，但在同一代码块（如函数或 if 块）中可能因编译器优化返回 True

---

### Q9: Python 多进程和多线程的选择？

**难度**: ⭐⭐

**答案**:

| 对比项 | 多进程（multiprocessing） | 多线程（threading） | 协程（asyncio） |
|--------|------------------------|-------------------|-----------------|
| GIL 限制 | 无 | 有 | 有 |
| CPU 密集型 | 推荐 | 不推荐 | 不推荐 |
| I/O 密集型 | 可以 | 推荐 | 最推荐 |
| 内存开销 | 大（独立地址空间） | 小（共享内存） | 最小 |
| 通信方式 | Queue/Pipe/Value | 共享变量 | await |
| 创建开销 | 大 | 中 | 小 |

```python
# CPU 密集型 -> 多进程
from multiprocessing import Pool
with Pool(4) as pool:
    results = pool.map(cpu_task, data)

# I/O 密集型 -> 协程
import asyncio
async def io_task(url):
    await asyncio.sleep(1)
    return f"done: {url}"

async def main():
    results = await asyncio.gather(*[io_task(u) for u in urls])
asyncio.run(main())
```

---

### Q10: asyncio 的工作原理？

**难度**: ⭐⭐⭐

**答案**: asyncio 是基于事件循环的异步编程框架，通过协程（coroutine）实现并发。

**解析**:
```python
import asyncio

async def fetch_data(url):
    print(f"开始获取 {url}")
    await asyncio.sleep(1)  # 模拟 I/O 操作（非阻塞）
    return f"数据 from {url}"

async def main():
    # 并发执行多个协程
    tasks = [fetch_data(f"url{i}") for i in range(5)]
    results = await asyncio.gather(*tasks)
    print(results)

asyncio.run(main())
```

- 事件循环：调度协程的执行，在 I/O 等待时切换到其他协程
- `await`：挂起当前协程，让出控制权
- `asyncio.gather()`：并发执行多个协程
- `asyncio.create_task()`：将协程包装为 Task 并入队

---

## 二、Web 框架（6题）

### Q11: FastAPI vs Django vs Flask 的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | FastAPI | Django | Flask |
|--------|---------|--------|-------|
| 异步支持 | 原生支持 | Django 4.0+ 支持异步视图（async def），Django 5.x 进一步完善异步支持 | 需要扩展 |
| 性能 | 高（Starlette + Uvicorn） | 中 | 中 |
| 类型提示 | 强制（Pydantic） | 可选 | 可选 |
| ORM | SQLAlchemy / Tortoise | Django ORM | SQLAlchemy |
| 自动文档 | Swagger UI / ReDoc | 需要扩展 | 需要扩展 |
| 学习曲线 | 低 | 高 | 低 |
| 适用场景 | API 服务、微服务 | 全栈 Web | 小型 API |

---

### Q12: WSGI 和 ASGI 的区别？

**难度**: ⭐⭐

**答案**:
- **WSGI**（Web Server Gateway Interface）：同步协议，每个请求一个线程
- **ASGI**（Asynchronous Server Gateway Interface）：异步协议，支持 WebSocket、长连接

**解析**:
```
WSGI: Client -> WSGI Server (Gunicorn) -> Django/Flask (同步)
ASGI: Client -> ASGI Server (Uvicorn) -> FastAPI/Starlette (异步)
```

- WSGI 服务器：Gunicorn、uWSGI
- ASGI 服务器：Uvicorn、Daphne、Hypercorn

---

### Q13: ORM 的 N+1 问题是什么？如何解决？

**难度**: ⭐⭐

**答案**: N+1 问题是查询 N 条主记录后，每条记录再执行一次关联查询，导致 N+1 次 SQL。

**解析**:
```python
# 错误写法（N+1 查询）
articles = session.query(Article).all()  # 1 次
for a in articles:
    print(a.author.name)  # 每次循环 1 次，共 N 次

# 解决方案1：joinedload（JOIN 查询，1 次 SQL）
articles = session.query(Article).options(
    joinedload(Article.author)
).all()

# 解决方案2：selectinload（IN 查询，2 次 SQL）
articles = session.query(Article).options(
    selectinload(Article.author)
).all()

# 解决方案3：批量预加载
from sqlalchemy.orm import subqueryload
articles = session.query(Article).options(
    subqueryload(Article.author)
).all()
```

---

### Q14: FastAPI 的依赖注入系统？

**难度**: ⭐⭐

**答案**: FastAPI 使用 `Depends()` 实现依赖注入，将公共逻辑（数据库连接、认证、权限）抽取为可复用的依赖。

**解析**:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401)
    return user

@app.get("/profile")
async def profile(user=Depends(get_current_user)):
    return {"name": user.name}
```

---

### Q15: Django 的 MTV 架构？

**难度**: ⭐⭐

**答案**: Django 使用 MTV（Model-Template-View）架构：
- **Model**：数据模型（ORM）
- **Template**：模板引擎（HTML）
- **View**：业务逻辑（处理请求）

对比 MVC：
- Django 的 View = MVC 的 Controller
- Django 的 Template = MVC 的 View

---

### Q16: Flask 的上下文机制？

**难度**: ⭐⭐⭐

**答案**: Flask 使用请求上下文（Request Context）和应用上下文（Application Context）隔离不同请求的数据。

**解析**:
- **请求上下文**：request、session（每次请求独立）
- **应用上下文**：current_app、g（应用级别共享）
- 基于 `LocalStack` 实现（线程本地存储）

```python
from flask import g

@app.before_request
def before_request():
    g.db = get_db_connection()

@app.teardown_request
def teardown_request(exception):
    db = getattr(g, 'db', None)
    if db is not None:
        db.close()
```

---

## 三、系统设计（6题）

### Q17: 常见的限流算法有哪些？

**难度**: ⭐⭐

**答案**:
1. **固定窗口**：固定时间窗口内限制请求数，临界点可能突刺
2. **滑动窗口**：将时间窗口细分为小格子，更平滑
3. **令牌桶**：以固定速率生成令牌，请求需要获取令牌，允许突发流量
4. **漏桶**：请求进入队列，以固定速率处理，平滑流量

```python
# 令牌桶算法（Redis + Lua）
# 或使用 FastAPI 中间件
from fastapi import Request, HTTPException
import time

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests = []

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        # 清除过期记录
        self.requests = [t for t in self.requests if now - t < self.window]
        if len(self.requests) >= self.max_requests:
            return False
        self.requests.append(now)
        return True
```

---

### Q18: 分布式锁的实现方式？

**难度**: ⭐⭐

**答案**:
1. **Redis SETNX**：`SET lock_key value NX EX 30`
2. **ZooKeeper**：临时顺序节点
3. **数据库**：唯一索引 + 状态字段

```python
# Redis 分布式锁
import redis
import uuid

def acquire_lock(redis_client, lock_key, expire=10):
    request_id = str(uuid.uuid4())
    return redis_client.set(lock_key, request_id, nx=True, ex=expire)

def release_lock(redis_client, lock_key, request_id):
    script = """
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
    """
    return redis_client.eval(script, 1, lock_key, request_id)
```

---

### Q19: 一致性哈希的原理？

**难度**: ⭐⭐

**答案**: 一致性哈希将节点和数据都映射到一个哈希环（0 ~ 2^32-1），数据顺时针找最近的节点。节点增减时只影响相邻节点的数据。

**解析**:
- 虚拟节点解决数据倾斜：每个物理节点对应多个虚拟节点
- 应用场景：分布式缓存、分布式存储、负载均衡

---

### Q20: 分布式 ID 生成方案？

**难度**: ⭐⭐

**答案**:
1. **UUID**：简单但无序、太长
2. **数据库自增**：简单但单点瓶颈
3. **雪花算法（Snowflake）**：有序、高性能
4. **Redis INCR**：高性能但依赖 Redis
5. **Leaf-segment（美团）**：号段模式，高性能

```python
# 雪花算法（简化版）
import time
import threading

class Snowflake:
    def __init__(self, worker_id, datacenter_id):
        self.worker_id = worker_id
        self.datacenter_id = datacenter_id
        self.sequence = 0
        self.last_timestamp = -1
        self.lock = threading.Lock()

    def generate_id(self):
        with self.lock:
            timestamp = int(time.time() * 1000)
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & 0xFFF
                if self.sequence == 0:
                    # sequence 溢出（超过 4095），等待到下一毫秒
                    while timestamp <= self.last_timestamp:
                        timestamp = int(time.time() * 1000)
            else:
                self.sequence = 0
                self.last_timestamp = timestamp
            return ((timestamp - 1288834974657) << 22) | \
                   (self.datacenter_id << 17) | \
                   (self.worker_id << 12) | \
                   self.sequence
```

---

### Q21: CAP 定理在实际项目中的应用？

**难度**: ⭐⭐

**答案**: 大多数互联网系统选择 **AP + 最终一致性**。

**解析**:
- 支付系统：CP（强一致性，使用分布式事务）
- 社交点赞：AP（允许短暂不一致）
- 配置中心：CP（ZooKeeper）
- 服务注册：AP（Eureka）

---

### Q22: 负载均衡算法有哪些？

**难度**: ⭐⭐

**答案**:
1. **轮询（Round Robin）**：依次分配
2. **加权轮询**：按权重分配
3. **最少连接**：分配给连接数最少的服务器
4. **IP Hash**：同一 IP 分配到同一服务器（会话保持）
5. **随机**：随机选择

---

## 四、数据库（4题）

### Q23: MySQL 索引优化的要点？

**难度**: ⭐⭐

**答案**:
1. 遵循最左前缀原则
2. 避免索引失效（函数、运算、隐式转换、左模糊）
3. 使用覆盖索引减少回表
4. 避免 `SELECT *`
5. 合理使用组合索引
6. 使用 EXPLAIN 分析执行计划

---

### Q24: 如何排查慢查询？

**难度**: ⭐⭐

**答案**:
1. 开启慢查询日志：`slow_query_log = ON`，`long_query_time = 1`
2. 使用 EXPLAIN 分析执行计划
3. 检查是否使用了索引、是否有全表扫描
4. 检查是否有 `Using filesort`、`Using temporary`
5. 优化 SQL 或调整索引

---

### Q25: 读写分离的实现方式？

**难度**: ⭐⭐

**答案**:
1. **代码层面**：配置主从数据源，写操作走主库，读操作走从库
2. **中间件**：MyCat、ShardingSphere、ProxySQL
3. **云服务**：阿里云 RDS 读写分离地址

```python
# SQLAlchemy 读写分离
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

master_engine = create_engine("mysql://root:pwd@master:3306/db")
slave_engine = create_engine("mysql://root:pwd@slave:3306/db")

class RoutingSession(Session):
    def get_bind(self, mapper=None, clause=None):
        if self._flushing:  # 写操作
            return master_engine
        return slave_engine  # 读操作
```

---

### Q26: 数据库连接池的作用和配置？

**难度**: ⭐⭐

**答案**: 连接池预先创建一组数据库连接，复用连接避免频繁创建/销毁。

**解析**:
```python
# SQLAlchemy 连接池配置
engine = create_engine(
    "mysql://root:pwd@localhost:3306/db",
    pool_size=10,          # 连接池大小
    max_overflow=20,       # 最大溢出连接数
    pool_timeout=30,       # 获取连接超时时间
    pool_recycle=3600,     # 连接回收时间
    pool_pre_ping=True     # 连接前检查是否有效
)
```

---

## 五、Linux（8题）

### Q27: Linux 进程和线程的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | 进程 | 线程 |
|--------|------|------|
| 资源分配 | 独立地址空间 | 共享进程地址空间 |
| 创建开销 | 大 | 小 |
| 切换开销 | 大（切换页表） | 小（切换寄存器） |
| 通信方式 | 管道、Socket、共享内存 | 共享变量、锁 |
| 健壮性 | 一个崩溃不影响其他 | 一个崩溃可能导致整个进程崩溃 |

---

### Q28: Linux IO 模型：select、poll、epoll 的区别？

**难度**: ⭐⭐⭐

**答案**:

| 对比项 | select | poll | epoll |
|--------|--------|------|-------|
| 最大连接数 | 1024（FD_SETSIZE） | 无限制 | 无限制 |
| 时间复杂度 | O(n) | O(n) | O(1)（就绪事件） |
| 工作方式 | 轮询 | 轮询 | 事件通知（回调） |
| 内存拷贝 | 每次全量拷贝 | 每次全量拷贝 | 内核与用户空间共享内存 |
| 适用场景 | 少量连接 | 少量连接 | 大量连接（C10K） |

**解析**: epoll 是 Linux 下最高效的 IO 多路复用模型，Redis、Nginx 都使用 epoll。

---

### Q29: Linux 虚拟内存管理？

**难度**: ⭐⭐

**答案**: 虚拟内存让每个进程拥有独立的地址空间，通过页表映射到物理内存。

**解析**:
- **页表**：虚拟地址 -> 物理地址的映射
- **缺页中断**：访问不在物理内存的页面时触发，从磁盘加载
- **Swap**：物理内存不足时，将不活跃的页面换出到磁盘
- **TLB**：页表缓存，加速虚拟地址到物理地址的转换

```bash
# 查看内存使用
free -h
cat /proc/meminfo

# 查看 Swap
swapon -s
```

---

### Q30: 常用的 Linux 性能排查命令？

**难度**: ⭐⭐

**答案**:
```bash
# CPU
top / htop              # 实时进程监控
mpstat 1 5              # CPU 统计
sar -u 1 10             # CPU 使用率历史

# 内存
free -h                 # 内存使用
vmstat 1                # 虚拟内存统计

# IO
iostat -x 1             # IO 统计
iotop                   # IO 占用进程

# 网络
iftop                   # 网络流量
netstat -tlnp           # 监听端口
ss -tlnp                # 连接状态

# 综合
sar -u 1 10             # CPU
sar -r 1 10             # 内存
sar -n DEV 1 10         # 网络
```

---

### Q31: 如何查找占用端口的进程？

**难度**: ⭐

**答案**:
```bash
lsof -i :8080
netstat -tlnp | grep 8080
ss -tlnp | grep 8080
```

---

### Q32: Linux 中硬链接和软链接的区别？

**难度**: ⭐

**答案**:

| 对比项 | 硬链接 | 软链接 |
|--------|--------|--------|
| 本质 | 同一文件多个入口 | 指向原文件的快捷方式 |
| 跨文件系统 | 不可以 | 可以 |
| 删除原文件 | 仍可访问 | 失效 |
| inode | 相同 | 不同 |

```bash
ln file hardlink     # 硬链接
ln -s file softlink  # 软链接
```

---

### Q33: TCP 三次握手和四次挥手？

**难度**: ⭐⭐

**答案**:
```
三次握手（建立连接）：
客户端                    服务器
  |-------- SYN --------->|  (1)
  |<------ SYN-ACK ------|  (2)
  |-------- ACK -------->|  (3)

四次挥手（断开连接）：
客户端                    服务器
  |-------- FIN --------->|  (1) 客户端不再发送
  |<------ ACK ----------|  (2) 服务器确认
  |<------ FIN ----------|  (3) 服务器不再发送
  |-------- ACK -------->|  (4) 客户端确认
  |                        |  客户端进入 TIME_WAIT
```

- TIME_WAIT：主动关闭方等待 2MSL（最大报文生存时间），确保对方收到最后的 ACK

---

### Q34: 如何排查 Linux 负载高的问题？

**难度**: ⭐⭐

**答案**:
```bash
# 1. 查看负载
uptime  # load average: 0.5, 0.6, 0.7 (1/5/15分钟)

# 2. 查看哪个进程占用 CPU 高
top -o %CPU
ps aux --sort=-%cpu | head -10

# 3. 查看哪个进程占用内存高
ps aux --sort=-%mem | head -10

# 4. 查看 IO 等待
vmstat 1  # wa 列表示 IO 等待
iostat -x 1

# 5. 查看网络连接
netstat -an | grep ESTABLISHED | wc -l
```

---

## 六、Docker/K8s（6题）

### Q35: Docker 镜像的分层结构？

**难度**: ⭐⭐

**答案**: Docker 镜像由多个只读层（Layer）组成，每层对应 Dockerfile 中的一条指令。容器运行时在最上层添加可写层（Container Layer）。

**解析**:
```
Dockerfile:
FROM ubuntu:20.04          -> Layer 1 (基础层)
RUN apt-get update          -> Layer 2
RUN apt-get install python3 -> Layer 3
COPY . /app                 -> Layer 4
CMD ["python3", "app.py"]   -> Layer 5 (元数据，不产生新层)

容器运行时:
  Layer 1 (只读)
  Layer 2 (只读)
  Layer 3 (只读)
  Layer 4 (只读)
  Container Layer (可写)    <- 容器的修改都在这一层
```

- 分层的好处：层共享，多个容器可以共享相同的基础层，节省磁盘空间
- 构建优化：将变化频繁的指令放在后面，利用缓存加速构建

---

### Q36: Docker 容器和虚拟机的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | 容器（Docker） | 虚拟机 |
|--------|---------------|--------|
| 虚拟化级别 | 操作系统级（共享内核） | 硬件级（独立内核） |
| 启动速度 | 秒级 | 分钟级 |
| 资源占用 | 少 | 多 |
| 隔离性 | 进程级隔离 | 完全隔离 |
| 性能 | 接近原生 | 有虚拟化开销 |
| 安全性 | 较低（共享内核） | 高 |

---

### Q37: Kubernetes 的核心概念？

**难度**: ⭐⭐

**答案**:
- **Pod**：最小部署单元，包含一个或多个容器
- **Deployment**：管理 Pod 的副本数、滚动更新
- **Service**：为 Pod 提供稳定的网络访问入口（负载均衡）
- **ConfigMap/Secret**：配置管理
- **Namespace**：资源隔离

```yaml
# Deployment 示例
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: my-app
        image: my-app:1.0
        ports:
        - containerPort: 8080
```

---

### Q38: K8s Service 的类型？

**难度**: ⭐⭐

**答案**:
1. **ClusterIP**（默认）：集群内部访问
2. **NodePort**：在每个节点上开放端口，外部可通过 `NodeIP:NodePort` 访问
3. **LoadBalancer**：使用云厂商的负载均衡器暴露服务
4. **ExternalName**：将服务映射到外部 DNS 名称

---

### Q39: K8s 的 HPA（水平自动扩缩容）？

**难度**: ⭐⭐

**答案**: HPA（Horizontal Pod Autoscaler）根据 CPU 使用率或自定义指标自动调整 Pod 副本数。

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # CPU 使用率超过 70% 时扩容
```

---

### Q40: Dockerfile 的最佳实践？

**难度**: ⭐⭐

**答案**:
```dockerfile
# 1. 使用多阶段构建减少镜像大小
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# 最佳实践：
# - 使用 slim/alpine 基础镜像
# - 合并 RUN 指令减少层数
# - 利用构建缓存（变化少的指令放前面）
# - 不使用 root 用户运行
# - 使用 .dockerignore 排除不必要的文件
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| GIL | 极高 | CPython 互斥锁、IO 密集用多线程、CPU 密集用多进程 |
| 装饰器 | 极高 | 高阶函数+闭包、functools.wraps、带参数装饰器 |
| 生成器 | 高 | yield 惰性求值、节省内存、yield from |
| asyncio | 高 | 事件循环、await、gather/create_task |
| 垃圾回收 | 高 | 引用计数+分代回收+循环检测 |
| N+1 问题 | 高 | joinedload/selectinload 预加载 |
| select/poll/epoll | 高 | epoll O(1)、事件通知、适合 C10K |
| Docker 分层 | 中 | 只读层+可写层、层共享、多阶段构建 |
| K8s Pod/Deployment/Service | 中 | 最小部署单元、副本管理、网络入口 |
| 限流算法 | 中 | 固定窗口、滑动窗口、令牌桶、漏桶 |
