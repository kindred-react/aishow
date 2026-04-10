# 第一阶段：Python核心 + Web框架基础
学习周期：第1-2周（14天）  |  每天投入：7小时  |  目标：能用FastAPI写出完整的REST API
验收标准：完成阶段末的项目实战，能独立用FastAPI写出带JWT认证、CRUD操作、单元测试的REST API。

## 1.1 Python速成（利用你的JS基础，3天搞定）
你有JavaScript/React基础，Python学习可以大幅加速。以下是与JS的核心差异点，重点掌握这些即可：
### 1.1.1 基础语法对比

### 1.1.2 函数对比
# JavaScript
function greet(name) { return `Hello ${name}`; }
const greet = (name) => `Hello ${name}`;

# Python
def greet(name): return f"Hello {name}"
greet = lambda name: f"Hello {name}"  # lambda只能写单行

# Python独有：默认参数、可变参数
def func(a, b=10, *args, **kwargs):
    pass  # args是元组，kwargs是字典
### 1.1.3 列表推导式（Python特色，面试高频）
# JavaScript
const squares = arr.map(x => x * x);
const evens = arr.filter(x => x % 2 === 0);

# Python - 列表推导式（更简洁）
squares = [x * x for x in arr]
evens = [x for x in arr if x % 2 == 0]

# 字典推导式
user_dict = {user.id: user.name for user in users}

# 集合推导式
unique_lengths = {len(word) for word in words}

# 生成器表达式（惰性求值，节省内存）
total = sum(x * x for x in range(1000000))
### 1.1.4 类与面向对象
# JavaScript (ES6)
class Animal {
    constructor(name) { this.name = name; }
    speak() { return `${this.name} makes a sound`; }
}

# Python
class Animal:
    def __init__(self, name):  # 构造函数
        self.name = name
    def speak(self):
        return f"{self.name} makes a sound"

# Python魔术方法（面试常考）
class MyList:
    def __init__(self): self.data = []
    def __len__(self): return len(self.data)     # len(obj)
    def __getitem__(self, idx): return self.data[idx]  # obj[idx]
    def __str__(self): return str(self.data)      # str(obj)
    def __repr__(self): return f"MyList({self.data})"  # repr(obj)
### 1.1.5 模块与包管理
# 创建虚拟环境（每个项目必须独立环境）
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 包管理
pip install fastapi uvicorn
pip freeze > requirements.txt
pip install -r requirements.txt

# 推荐：poetry（更现代的包管理工具）
poetry init
poetry add fastapi
poetry install

# __init__.py 的作用：标记目录为Python包
# myproject/
#   __init__.py    # 使myproject成为一个包
#   models.py
#   views.py

面试必考：虚拟环境的作用？__init__.py的作用？pip和poetry的区别？

## 1.2 Python高级特性（面试核心，5天深入）
以下内容是中高级面试的必考点，必须深入理解原理并能手写代码。
### 1.2.1 装饰器（Decorator）- 面试必考
本质：高阶函数 + 闭包。在不修改原函数代码的前提下，扩展函数功能。
# 基础装饰器
import functools
import time

def timer(func):
    @functools.wraps(func)  # 保留原函数的元信息（name, docstring）
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} executed in {end - start:.4f}s")
        return result
    return wrapper

@timer  # 等价于 slow_func = timer(slow_func)
def slow_func():
    time.sleep(1)
    return "done"

# 带参数的装饰器（面试高频手写题）
def retry(max_retries=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

@retry(max_retries=3, delay=2)
def fetch_api(url):
    pass
面试高频题：手写一个带参数的装饰器，实现函数执行时间统计和日志记录。

### 1.2.2 生成器与迭代器
# 迭代器：实现 __iter__ 和 __next__
class CountDown:
    def __init__(self, start):
        self.current = start
    def __iter__(self):
        return self
    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

# 生成器：使用 yield（更简洁）
def count_down(start):
    current = start
    while current > 0:
        yield current  # 暂停执行，返回值
        current -= 1

# 生成器的核心优势：惰性求值，节省内存
# 读取大文件时不会一次性加载到内存
def read_large_file(file_path):
    with open(file_path) as f:
        for line in f:  # 文件对象本身就是迭代器
            yield line.strip()

# yield from：委托给子生成器
def chain(*iterables):
    for it in iterables:
        yield from it  # Python 3.3+

# 生成器表达式 vs 列表推导式
nums = [x * x for x in range(1000000)]  # 立即计算，占用大量内存
nums_gen = (x * x for x in range(1000000))  # 惰性计算，几乎不占内存
面试题：手写一个斐波那契生成器。生成器和迭代器的区别？yield的底层原理？

### 1.2.3 GIL（全局解释器锁）- 区分度最高
GIL是Python面试中区分度最高的考点，几乎每场面试必问。

面试必问：GIL对多线程有什么影响？如何绕过GIL？什么场景用多线程vs多进程vs协程？务必能结合实际项目举例说明。

### 1.2.4 协程与asyncio
import asyncio

# 基本协程
async def fetch_data(url):
    await asyncio.sleep(1)  # 模拟IO操作
    return f"Data from {url}"

# 并发执行多个协程
async def main():
    # 方式1：asyncio.gather（等待全部完成）
    results = await asyncio.gather(
        fetch_data("url1"),
        fetch_data("url2"),
        fetch_data("url3"),
    )
    # 3个请求并发执行，总耗时约1秒（而非3秒）

    # 方式2：asyncio.create_task（手动管理）
    task1 = asyncio.create_task(fetch_data("url1"))
    task2 = asyncio.create_task(fetch_data("url2"))
    result1 = await task1
    result2 = await task2

    # 方式3：asyncio.wait（可设置超时、返回值策略）
    done, pending = await asyncio.wait(
        [fetch_data(f"url{i}") for i in range(5)],
        timeout=2,
        return_when=asyncio.ALL_COMPLETED,
    )

asyncio.run(main())
# 并发原语
async def producer_consumer():
    queue = asyncio.Queue(maxsize=10)

    async def producer():
        for i in range(5):
            await queue.put(i)
            print(f"Produced {i}")

    async def consumer():
        while True:
            item = await queue.get()
            print(f"Consumed {item}")
            queue.task_done()

    await asyncio.gather(producer(), consumer())

# 信号量（限制并发数）
async def limited_fetch(urls, max_concurrent=5):
    semaphore = asyncio.Semaphore(max_concurrent)
    async def fetch(url):
        async with semaphore:
            return await fetch_data(url)
    return await asyncio.gather(*[fetch(url) for url in urls])
面试题：asyncio的事件循环原理？协程和线程的区别？如何实现一个高并发爬虫？

### 1.2.5 闭包与作用域
# 闭包：内层函数引用外层函数的变量
def make_multiplier(factor):
    def multiply(x):
        return x * factor  # 引用外层变量 factor
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5))  # 10
print(triple(5))  # 15

# 经典陷阱：循环中的闭包
funcs = []
for i in range(3):
    funcs.append(lambda: i)  # 所有函数都引用同一个 i

# 错误结果：[2, 2, 2]（因为i最终是2）
# 正确写法：
funcs = []
for i in range(3):
    funcs.append(lambda i=i: i)  # 默认参数在定义时绑定
# 结果：[0, 1, 2]

# 或者使用 functools.partial
from functools import partial
funcs = [partial(lambda i: i, i) for i in range(3)]

### 1.2.6 内存管理与垃圾回收
- 引用计数：每个对象维护一个引用计数，为0时立即回收
- 分代回收：解决循环引用问题，分0/1/2三代，越老的对象扫描频率越低
- 循环引用检测：gc模块，通过tracing算法检测不可达的对象组
- 常见内存泄漏场景：全局列表不断append、闭包引用大对象、缓存未设置上限
- 排查工具：gc.get_objects()、memory_profiler、tracemalloc、objgraph
# 内存泄漏排查示例
import tracemalloc
tracemalloc.start()

# ... 执行你的代码 ...

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)

## 1.3 Web框架：FastAPI（主攻）+ Django（了解）
### 1.3.1 FastAPI完整掌握（6天）
FastAPI是2025-2026年增长最快的Python Web框架，基于Starlette + Pydantic + uvicorn，支持自动API文档、类型验证、异步。
# ===== FastAPI 完整示例 =====
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Optional, List
from datetime import datetime, timezone
import time
import jwt
from passlib.context import CryptContext

# ===== 1. 应用初始化 =====
app = FastAPI(
    title="我的API",
    description="FastAPI完整示例",
    version="1.0.0",
    middleware=[
        # CORS中间件
    ],
)

# ===== 2. 数据库配置 =====
DATABASE_URL = "postgresql://user:pass@localhost/db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ===== 3. 数据模型 =====
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    content = Column(Text)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

# ===== 4. Pydantic模型（请求/响应验证）=====
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    class Config:
        from_attributes = True  # ORM模式

class ArticleCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    content: str

class ArticleResponse(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    created_at: datetime
    class Config:
        from_attributes = True

# ===== 5. 依赖注入 =====
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ===== 6. JWT认证 =====
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def create_access_token(data: dict):
    return jwt.encode(data.copy(), SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme),
                     db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401, detail="Invalid credentials"
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ===== 7. 路由 =====
@app.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username exists")
    hashed = pwd_context.hash(user.password)
    db_user = User(username=user.username,
                   email=user.email,
                   hashed_password=hashed)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(),
          db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password,
                                          user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/articles", response_model=ArticleResponse)
def create_article(article: ArticleCreate,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    db_article = Article(**article.model_dump(), author_id=current_user.id)
    db.add(db_article)
    db.commit()
    db.refresh(db_article)
    return db_article

@app.get("/articles", response_model=List[ArticleResponse])
def list_articles(skip: int = 0, limit: int = 20,
                  db: Session = Depends(get_db)):
    return db.query(Article).offset(skip).limit(limit).all()

# ===== 8. 中间件 =====
@app.middleware("http")
async def log_requests(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    print(f"{request.method} {request.url} - {duration:.3f}s")
    return response

# ===== 9. 异常处理 =====
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return JSONResponse(status_code=400, content={"detail": str(exc)})

# ===== 10. 启动 =====
# uvicorn main:app --reload --host 0.0.0.0 --port 8000

### FastAPI核心知识点清单

### 1.3.2 Django核心了解（2天）
很多企业存量项目使用Django，面试需要了解基本概念。不需要深入，但要能回答基本问题。

面试题：FastAPI vs Django vs Flask的核心区别？什么场景选哪个？

## 1.4 第一阶段项目实战
项目：用FastAPI构建一个完整的博客系统REST API

项目目录结构参考：
blog-api/
  app/
    __init__.py
    main.py              # FastAPI应用入口
    config.py            # 配置（数据库、JWT密钥等）
    database.py          # 数据库连接
    models/              # SQLAlchemy模型
      user.py
      article.py
    schemas/             # Pydantic模型
      user.py
      article.py
    routers/             # 路由
      auth.py
      articles.py
    services/            # 业务逻辑
      auth_service.py
      article_service.py
    middleware/          # 中间件
      logging.py
    dependencies.py      # 依赖注入
  tests/
    test_auth.py
    test_articles.py
    conftest.py          # pytest fixtures
  Dockerfile
  docker-compose.yml
  requirements.txt

Dockerfile参考：
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
# docker-compose.yml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/blog
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: blog
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:

这个项目是基础，第二阶段会在此基础上升级。确保代码规范、结构清晰、测试通过。

## 1.5 第一阶段每日学习计划

| 概念 | JavaScript | Python | 关键差异 |
| --- | --- | --- | --- |
| 变量 | let x = 10 | x = 10 | Python无需声明，动态强类型 |
| 常量 | const PI = 3.14 | PI = 3.14 (约定大写) | Python无真正常量，靠约定 |
| 空值 | null / undefined | None | 判断用 is None |
| 布尔 | true / false | True / False | 注意大写 |
| 字符串 | `Hello ${name}` | f"Hello {name}" | f-string是Python推荐方式 |
| 数组 | [1, 2, 3] | [1, 2, 3] | Python叫list，支持切片 |
| 对象/字典 | {key: value} | {key: value} | Python叫dict，用法类似 |
| 三元表达式 | a ? b : c | b if a else c | 语法不同，逻辑一致 |
| 空数组判断 | !arr.length | not my_list | 空容器在Python中为False |


| 问题 | 标准答案 |
| --- | --- |
| GIL是什么？ | CPython的全局互斥锁，同一时刻只允许一个线程执行Python字节码 |
| 为什么需要GIL？ | CPython使用引用计数做内存管理，引用计数操作不是线程安全的，需要GIL保护 |
| GIL的影响？ | CPU密集型：多线程无法利用多核，性能无提升甚至下降 IO密集型：影响不大，因为IO等待时会释放GIL |
| 如何绕过GIL？ | 1. 多进程(multiprocessing) - CPU密集型首选 2. 协程(asyncio) - IO密集型首选 3. C扩展/Cython - 将计算密集部分用C实现 4. multiprocessing.Pool - 进程池 |
| 什么时候用多线程？ | IO密集型任务：网络请求、文件读写、数据库查询 |
| 什么时候用多进程？ | CPU密集型任务：数值计算、图像处理、机器学习 |
| 什么时候用协程？ | 高并发IO：API服务、爬虫、WebSocket |
| Python 3.13新特性？ | PEP 703：no-GIL实验性支持，可通过 --disable-gil 编译无GIL版本 |


| 知识点 | 说明 | 面试考点 |
| --- | --- | --- |
| 路径参数 | /items/{item_id} | 类型自动转换和验证 |
| 查询参数 | /items/?skip=0&limit=20 | 默认值、可选参数 |
| 请求体 | Pydantic模型验证 | 嵌套模型、字段验证器 |
| 依赖注入 | Depends()机制 | 子依赖、依赖链、全局依赖 |
| 中间件 | 请求/响应拦截 | 执行顺序、CORS配置 |
| 后台任务 | BackgroundTasks | 适合发送邮件、日志记录 |
| WebSocket | 原生支持 | 实时通信场景 |
| 生命周期 | lifespan 上下文管理器（⚠️ @app.on_event("startup"/"shutdown") 已弃用） | 初始化连接池、清理资源 |
| 自动文档 | /docs (Swagger) | OpenAPI规范、响应模型 |


| 概念 | 说明 | 面试常考点 |
| --- | --- | --- |
| MTV模式 | Model-Template-View，类似MVC | 与MVC的区别 |
| ORM | 模型定义、QuerySet操作 | select_related vs prefetch_related（解决N+1） |
| 中间件 | 请求/响应处理的钩子 | 中间件执行顺序（洋葱模型） |
| 信号(Signals) | 解耦的回调机制 | pre_save/post_save的使用场景 |
| 类视图(CBV) | 基于类的视图 | View/ListView/DetailView的继承关系 |
| DRF | Django REST Framework | 序列化器、视图集、路由 |
| 管理后台 | 自带Admin后台 | 如何自定义Admin |


| 功能模块 | 技术要点 | 验收标准 |
| --- | --- | --- |
| 用户注册/登录 | JWT认证、bcrypt密码哈希 | 能注册、登录、获取Token |
| 文章CRUD | 创建/读取/更新/删除文章 | 完整的RESTful API |
| 分页与搜索 | skip/limit、全文搜索 | 支持分页和关键词搜索 |
| 权限控制 | 只有作者能编辑自己的文章 | 权限校验正常工作 |
| 请求验证 | Pydantic模型、字段验证 | 非法输入返回422 |
| 错误处理 | 自定义异常处理器 | 统一错误响应格式 |
| 单元测试 | pytest + httpx.AsyncClient | 测试覆盖率达到80%+ |
| Docker化 | Dockerfile + docker-compose | docker-compose up即可运行 |


| 天 | 上午(2h) 理论 | 下午(3h) 实战 | 晚上(1.5h) 复习 |
| --- | --- | --- | --- |
| 1 | Python基础语法 变量/类型/控制流 | 搭建开发环境 写第一个Python脚本 | JS vs Python差异总结 |
| 2 | 函数/列表推导式 字典/集合操作 | 练习列表推导式 写数据处理脚本 | 刷2道LeetCode(Easy) |
| 3 | 面向对象编程 类/继承/魔术方法 | 实现一个简单的ORM模型 | 复习魔术方法 |
| 4 | 模块/包管理 venv/pip/poetry | 创建FastAPI项目 配置虚拟环境 | 了解__init__.py |
| 5 | 装饰器原理与手写 | 写3种装饰器 计时/重试/日志 | 刷装饰器面试题 |
| 6 | 生成器/迭代器 | 实现斐波那契生成器 大文件读取器 | 刷生成器面试题 |
| 7 | GIL + 多线程/多进程 | 多进程vs多线程性能对比实验 | 整理GIL面试答案 |
| 8 | asyncio协程 | 写一个异步爬虫 并发10个请求 | 刷协程面试题 |
| 9 | 闭包/内存管理 | 内存泄漏排查实验 | 刷闭包面试题 |
| 10 | FastAPI路由/依赖注入 | 实现用户注册登录API | 复习Pydantic验证 |
| 11 | FastAPI中间件/异常 | 添加日志中间件 错误处理 | 复习中间件机制 |
| 12 | SQLAlchemy ORM | 定义模型/CRUD操作 | 复习ORM原理 |
| 13 | 项目实战 | 完成博客API全部功能 | 写单元测试 |
| 14 | Docker化 + 复盘 | Dockerfile + docker-compose | 阶段总结笔记 |

---

## 补充知识点

### 1. 描述符协议（Descriptor）深度讲解（⭐高频）

#### 概念讲解

描述符是 Python 中实现"属性访问控制"的底层协议。任何定义了 `__get__`、`__set__`、`__delete__` 中至少一个方法的类，就是描述符。

**数据描述符 vs 非数据描述符：**

| 类型 | 定义的方法 | 优先级 |
|------|-----------|--------|
| 数据描述符 | `__get__` + `__set__` 或 `__delete__` | 高于实例 `__dict__` |
| 非数据描述符 | 仅 `__get__` | 低于实例 `__dict__` |

属性查找优先级（从高到低）：
1. 数据描述符（`__get__` + `__set__`）
2. 实例 `__dict__`
3. 非数据描述符（仅 `__get__`）
4. `__getattr__`（兜底）

#### 代码示例

```python
# ===== 数据描述符 =====
class ValidatedField:
    """带类型校验的数据描述符"""
    def __init__(self, name, type_hint):
        self.name = name
        self.type_hint = type_hint

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.name)

    def __set__(self, obj, value):
        if not isinstance(value, self.type_hint):
            raise TypeError(f"{self.name} 期望 {self.type_hint.__name__}，得到 {type(value).__name__}")
        obj.__dict__[self.name] = value

    def __delete__(self, obj):
        raise AttributeError(f"不允许删除 {self.name}")


class User:
    name = ValidatedField('name', str)
    age = ValidatedField('age', int)

u = User()
u.name = "Alice"   # OK
u.age = 25         # OK
u.name = 123       # TypeError: name 期望 str，得到 int
del u.age          # AttributeError: 不允许删除 age
```

```python
# ===== 非数据描述符 =====
class LazyProperty:
    """惰性计算属性（非数据描述符）"""
    def __init__(self, func):
        self.func = func
        self.attrname = func.__name__

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        value = self.func(obj)
        # 缓存到实例 __dict__，后续访问直接走实例字典，不再触发描述符
        obj.__dict__[self.attrname] = value
        return value


class DataProcessor:
    def __init__(self, data):
        self.data = data

    @LazyProperty
    def result(self):
        print("执行耗时计算...")
        return sum(x * x for x in self.data)

dp = DataProcessor(range(100000))
print(dp.result)  # 第一次：打印"执行耗时计算..."，返回结果
print(dp.result)  # 第二次：直接返回缓存，不打印
```

#### property 的底层实现

`property` 本质就是一个数据描述符类：

```python
# property 的简化实现
class MyProperty:
    def __init__(self, fget=None, fset=None, fdel=None, doc=None):
        self.fget = fget
        self.fset = fset
        self.fdel = fdel
        self.__doc__ = doc

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        if self.fget is None:
            raise AttributeError("不可读")
        return self.fget(obj)

    def __set__(self, obj, value):
        if self.fset is None:
            raise AttributeError("不可写")
        self.fset(obj, value)

    def setter(self, fset):
        self.fset = fset
        return self

    def deleter(self, fdel):
        self.fdel = fdel
        return self
```

#### 描述符在 ORM 中的应用（Django Field）

```python
# Django Field 的简化原理
class Field:
    """模拟 Django 的 Field 描述符"""
    def __init__(self, column_type, null=False, default=None):
        self.column_type = column_type
        self.null = null
        self.default = default
        self.attname = None  # 由元类设置

    def __set_name__(self, owner, name):
        self.attname = name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return obj.__dict__.get(self.attname, self.default)

    def __set__(self, obj, value):
        if value is None and not self.null:
            raise ValueError(f"{self.attname} 不能为 NULL")
        obj.__dict__[self.attname] = value

    def db_value(self, value):
        """转换为数据库存储的值"""
        return value


class CharField(Field):
    def __init__(self, max_length=255, **kwargs):
        super().__init__('VARCHAR', **kwargs)
        self.max_length = max_length

    def __set__(self, obj, value):
        if value is not None and len(value) > self.max_length:
            raise ValueError(f"{self.attname} 超过最大长度 {self.max_length}")
        super().__set__(obj, value)


class IntegerField(Field):
    def __init__(self, **kwargs):
        super().__init__('INTEGER', **kwargs)

    def __set__(self, obj, value):
        if value is not None and not isinstance(value, int):
            raise TypeError(f"{self.attname} 必须是整数")
        super().__set__(obj, value)


class Book:
    title = CharField(max_length=200)
    pages = IntegerField(null=True)
    price = IntegerField()

b = Book()
b.title = "Python Cookbook"  # OK
b.pages = 450                # OK
b.price = "free"             # TypeError: price 必须是整数
```

#### 面试问答

**Q: property、classmethod、staticmethod 的区别？**

| 特性 | property | classmethod | staticmethod |
|------|----------|-------------|--------------|
| 描述符类型 | 数据描述符 | 非数据描述符 | 非数据描述符 |
| 第一个参数 | 实例 (self) | 类 (cls) | 无特殊参数 |
| 调用方式 | `obj.attr` | `Cls.method()` 或 `obj.method()` | `Cls.method()` 或 `obj.method()` |
| 用途 | 属性访问控制 | 工厂方法、替代构造器 | 工具函数，与类逻辑无关 |
| 底层实现 | `__get__` + `__set__` | `__get__` 返回绑定方法 | `__get__` 返回原始函数 |

```python
class Demo:
    @property
    def x(self):
        return self._x

    @x.setter
    def x(self, value):
        self._x = value

    @classmethod
    def from_dict(cls, d):
        obj = cls()
        obj.x = d['x']
        return obj

    @staticmethod
    def helper():
        return "工具函数，不依赖类或实例"
```

---

### 2. 元类（Metaclass）深度讲解（⭐⭐中频）

#### 概念讲解

元类是"创建类的类"。Python 中一切皆对象，类本身也是对象，而元类就是用来创建类对象的。

```
type  -->  创建  -->  类(MyClass)  -->  创建  -->  实例(obj)
```

#### type() 创建类

```python
# 普通方式定义类
class MyClass:
    name = "hello"

    def greet(self):
        return self.name

# 等价于用 type() 创建
def greet(self):
    return self.name

MyClass2 = type('MyClass2', (object,), {
    'name': 'hello',
    'greet': greet,
})
```

`type(name, bases, dict)` 三个参数：
- `name`：类名
- `bases`：父类元组
- `dict`：类属性和方法字典

#### 自定义元类（\_\_new\_\_ vs \_\_init\_\_）

```python
class SingletonMeta(type):
    """单例元类"""
    _instances = {}

    def __new__(mcs, name, bases, namespace):
        # __new__: 控制类的创建过程（返回类对象）
        # 在类定义时执行，可以修改 namespace
        if 'log_calls' not in namespace:
            namespace['log_calls'] = False
        cls = super().__new__(mcs, name, bases, namespace)
        return cls

    def __call__(cls, *args, **kwargs):
        # __call__: 控制实例的创建过程
        # 拦截 ClassName() 调用
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Database(metaclass=SingletonMeta):
    def __init__(self):
        self.connected = True

db1 = Database()
db2 = Database()
print(db1 is db2)  # True，同一个实例
```

**\_\_new\_\_ vs \_\_init\_\_ 区别：**

| 方法 | 作用对象 | 调用时机 | 职责 |
|------|---------|---------|------|
| 元类 `__new__` | 类 | 类定义时 | 创建并返回类对象 |
| 元类 `__init__` | 类 | 类定义时（`__new__` 之后） | 初始化类对象 |
| 元类 `__call__` | 实例 | `ClassName()` 时 | 控制实例创建过程 |
| 类 `__new__` | 实例 | 实例化时 | 创建并返回实例对象 |
| 类 `__init__` | 实例 | 实例化时（`__new__` 之后） | 初始化实例属性 |

#### Django ORM 的元类应用（ModelBase）

```python
# Django ModelBase 的简化原理
class ModelBase(type):
    def __new__(mcs, name, bases, namespace):
        # 1. 收集所有 Field 描述符
        fields = {}
        for key, value in list(namespace.items()):
            if isinstance(value, Field):
                value.__set_name__(None, key)  # 设置字段名
                fields[key] = value

        # 2. 创建类
        cls = super().__new__(mcs, name, bases, namespace)

        # 3. 将字段信息挂到 _meta 上
        cls._meta = {'fields': fields, 'table_name': name.lower()}

        return cls


class Model(metaclass=ModelBase):
    pass


class User(Model):
    id = IntegerField()
    name = CharField(max_length=50)
    email = CharField(max_length=100)

print(User._meta)
# {'fields': {'id': <IntegerField>, 'name': <CharField>, 'email': <CharField>},
#  'table_name': 'user'}
```

#### 单例模式的元类实现

```python
import threading

class ThreadSafeSingleton(type):
    _instances = {}
    _lock = threading.Lock()

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            with cls._lock:
                # 双重检查
                if cls not in cls._instances:
                    cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]


class Config(metaclass=ThreadSafeSingleton):
    def __init__(self):
        self.settings = {}

c1 = Config()
c2 = Config()
print(c1 is c2)  # True
```

---

### 3. WSGI/ASGI 协议原理（⭐高频）

#### WSGI 协议（PEP 3333）

WSGI（Web Server Gateway Interface）是 Python Web 框架与应用服务器之间的标准接口。

**核心要素：**
- **应用（Application）**：一个可调用对象 `environ -> start_response -> body`
- **服务器（Server）**：接收 HTTP 请求，转换为 `environ` 字典，调用应用
- **environ**：包含请求信息的字典（PATH_INFO、REQUEST_METHOD、HTTP headers 等）
- **start_response**：用于发送响应状态码和 headers 的可调用对象

```python
# ===== 最小 WSGI 应用 =====
def simple_app(environ, start_response):
    """最简单的 WSGI 应用"""
    path = environ['PATH_INFO']
    method = environ['REQUEST_METHOD']

    status = '200 OK'
    headers = [('Content-Type', 'text/plain; charset=utf-8')]
    start_response(status, headers)

    return [f"你请求了 {method} {path}".encode('utf-8')]


# ===== 带 Middleware 的 WSGI 应用 =====
class TimingMiddleware:
    """计时中间件"""
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        import time
        start = time.time()
        # 包装 start_response 来捕获状态码
        def custom_start_response(status, headers, exc_info=None):
            headers.append(('X-Response-Time', f'{time.time() - start:.3f}s'))
            return start_response(status, headers, exc_info)

        return self.app(environ, custom_start_response)


# 中间件链
app = TimingMiddleware(simple_app)

# 用 wsgiref 运行（仅开发用）
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    server = make_server('0.0.0.0', 8000, app)
    server.serve_forever()
```

#### uWSGI/Gunicorn 工作原理

```
客户端请求
    |
    v
[Nginx] --反向代理--> [uWSGI/Gunicorn] --WSGI协议--> [Django/Flask App]
```

**Gunicorn 配置示例：**
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4                    # worker 进程数 = (2 x CPU核数) + 1
worker_class = "sync"          # sync / gevent / eventlet
worker_connections = 1000      # 每个worker的最大并发连接数
timeout = 30                   # worker 超时时间
keepalive = 2                  # keep-alive 连接超时
max_requests = 5000            # worker 处理多少请求后重启（防止内存泄漏）
max_requests_jitter = 500      # 重启抖动，避免所有worker同时重启
accesslog = "-"                # 访问日志输出到stdout
errorlog = "-"                 # 错误日志输出到stderr
loglevel = "info"
```

**uWSGI 配置示例：**
```ini
[uwsgi]
module = myproject.wsgi:application
master = true
processes = 4
socket = 0.0.0.0:8000
chmod-socket = 660
vacuum = true
die-on-term = true
```

#### ASGI 协议（FastAPI/Starlette 底层）

ASGI（Asynchronous Server Gateway Interface）是 WSGI 的异步 successor，支持 WebSocket、HTTP/2、长轮询。

```python
# ===== 最小 ASGI 应用 =====
async def simple_asgi_app(scope, receive, send):
    """
    scope: 请求信息字典（type, path, method, headers 等）
    receive: 异步函数，获取请求体
    send: 异步函数，发送响应
    """
    if scope['type'] == 'http':
        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [[b'content-type', b'text/plain']],
        })
        await send({
            'type': 'http.response.body',
            'body': b'Hello ASGI!',
        })
    elif scope['type'] == 'websocket':
        await send({'type': 'websocket.accept'})
        while True:
            message = await receive()
            if message['type'] == 'websocket.receive':
                data = message.get('text', '')
                await send({
                    'type': 'websocket.send',
                    'text': f"Echo: {data}",
                })
            elif message['type'] == 'websocket.disconnect':
                break
```

#### WSGI vs ASGI 对比

| 特性 | WSGI | ASGI |
|------|------|------|
| 同步/异步 | 仅同步 | 支持异步 |
| WebSocket | 不支持 | 原生支持 |
| HTTP/2 | 不支持 | 支持 |
| 长连接 | 不友好 | 原生支持 |
| 代表服务器 | Gunicorn, uWSGI | Uvicorn, Daphne, Hypercorn |
| 代表框架 | Django, Flask | FastAPI, Starlette, Django 3.0+ |
| 协议规范 | PEP 3333 | ASGI 3.0 |

#### 请求从浏览器到框架的完整链路

```
1. 浏览器 DNS 解析 --> 获取服务器 IP
2. TCP 三次握手 --> 建立连接
3. TLS 握手（HTTPS）--> 加密通道
4. 发送 HTTP 请求 --> Nginx
5. Nginx 反向代理 --> 转发到 uWSGI socket
6. uWSGI 解析请求 --> 构建 environ 字典
7. uWSGI 调用 WSGI app(environ, start_response)
8. Django/Flask 处理请求 --> 路由匹配 --> 视图函数
9. 视图函数返回响应 --> start_response(status, headers) + body
10. uWSGI 将响应返回给 Nginx
11. Nginx 返回给浏览器
12. 浏览器渲染页面
```

---

### 4. Python 内存管理（⭐⭐中频）

#### PyObject 结构

每个 Python 对象在 C 层都是一个 `PyObject` 结构体：

```c
// CPython 源码中的 PyObject 定义
typedef struct _object {
    PyObject_HEAD  // 包含引用计数 ob_refcnt 和类型指针 ob_type
} PyObject;

typedef struct {
    Py_ssize_t ob_refcnt;   // 引用计数
    PyTypeObject *ob_type;  // 指向类型对象
} PyObject_HEAD;
```

每个 Python 对象都有：
- **引用计数（ob_refcnt）**：记录有多少引用指向该对象
- **类型指针（ob_type）**：指向对象的类型（如 int、str、list）

#### 小整数缓存（-5~256）

```python
a = 256
b = 256
print(a is b)  # True，小整数缓存

a = 257
b = 257
print(a is b)  # False，超出缓存范围

# 但在交互式环境中，同一行赋值可能被优化
a = 257; b = 257
print(a is b)  # True（编译器优化，仅限同一代码块）
```

CPython 预先分配 -5 到 256 的整数对象，这些对象在程序启动时就创建好，不会被回收。

#### 字符串驻留（intern）

```python
a = "hello"
b = "hello"
print(a is b)  # True，字符串被驻留

a = "hello world!"
b = "hello world!"
print(a is b)  # False，包含空格的长字符串不自动驻留

import sys
a = sys.intern("hello world!")
b = sys.intern("hello world!")
print(a is b)  # True，手动驻留

# 适用场景：大量字符串比较时（如字典 key 查找）
# 驻留后用 is 比较代替 ==，O(1) vs O(n)
```

#### pymalloc 内存池

```
Python 内存分配层次：
1. 小对象（< 512 字节）--> pymalloc 内存池
   - 按 8 的倍数分块（8, 16, 24, ... 512）
   - Arena（256KB）--> Pool（4KB）--> Block（8~512字节）
2. 大对象（>= 512 字节）--> 直接调用 C malloc
3. 特殊情况 --> 直接调用 C malloc
```

#### \_\_slots\_\_ 节省内存

```python
class NormalUser:
    def __init__(self, name, email):
        self.name = name
        self.email = email

class SlotUser:
    __slots__ = ('name', 'email')  # 固定属性列表

    def __init__(self, name, email):
        self.name = name
        self.email = email

import sys
u1 = NormalUser("Alice", "alice@example.com")
u2 = SlotUser("Alice", "alice@example.com")

print(sys.getsizeof(u1.__dict__))  # 104 字节（__dict__ 开销）
print(sys.getsizeof(u2))           # 48 字节（无 __dict__，节省约 50%）

# __slots__ 的好处：
# 1. 节省内存（无 __dict__ 和 __weakref__）
# 2. 属性访问更快（直接偏移量，不用字典查找）
# 3. 防止动态添加属性

# __slots__ 的限制：
# 1. 不能添加未在 __slots__ 中声明的属性
# 2. 子类也需要定义 __slots__（除非用 __dict__）
# 3. 不能用于需要动态属性的场景
```

---

### 5. 多进程编程（multiprocessing）（⭐⭐中频）

#### Process vs Pool

```python
import multiprocessing
import time
import os

# ===== Process：手动管理进程 =====
def worker(task_id):
    print(f"进程 {os.getpid()} 处理任务 {task_id}")
    time.sleep(1)
    return f"任务 {task_id} 完成"

if __name__ == '__main__':
    processes = []
    for i in range(4):
        p = multiprocessing.Process(target=worker, args=(i,))
        processes.append(p)
        p.start()

    for p in processes:
        p.join()  # 等待所有进程完成

    print("所有任务完成")


# ===== Pool：进程池（推荐） =====
from multiprocessing import Pool

def compute(n):
    """CPU 密集型任务"""
    return sum(i * i for i in range(n))

if __name__ == '__main__':
    # Pool 自动管理进程数量
    with Pool(processes=4) as pool:
        # map: 阻塞式，按顺序返回结果
        results = pool.map(compute, [1000000, 2000000, 3000000, 4000000])
        print(results)

        # map_async: 非阻塞，返回 AsyncResult
        async_result = pool.map_async(compute, [1000000, 2000000, 3000000])
        # 做其他事情...
        results = async_result.get(timeout=30)  # 等待结果

        # apply: 提交单个任务
        result = pool.apply(compute, (1000000,))

        # apply_async: 异步提交单个任务
        async_result = pool.apply_async(compute, (1000000,))
        result = async_result.get()
```

#### 进程间通信（Queue/Pipe/Value/Array）

```python
from multiprocessing import Process, Queue, Pipe, Value, Array

# ===== Queue：线程/进程安全的队列 =====
def producer(q):
    for i in range(5):
        q.put(f"消息-{i}")
    q.put(None)  # 发送结束信号

def consumer(q):
    while True:
        msg = q.get()
        if msg is None:
            break
        print(f"消费: {msg}")

if __name__ == '__main__':
    q = Queue()
    p1 = Process(target=producer, args=(q,))
    p2 = Process(target=consumer, args=(q,))
    p1.start(); p2.start()
    p1.join(); p2.join()


# ===== Pipe：双向管道 =====
def pipe_worker(conn):
    conn.send(["hello", "from", "child"])
    conn.close()

if __name__ == '__main__':
    parent_conn, child_conn = Pipe()
    p = Process(target=pipe_worker, args=(child_conn,))
    p.start()
    print(parent_conn.recv())  # ['hello', 'from', 'child']
    p.join()


# ===== Value/Array：共享内存 =====
def counter_worker(counter, lock):
    for _ in range(100000):
        with lock:
            counter.value += 1

if __name__ == '__main__':
    counter = Value('i', 0)  # 'i' = signed int
    lock = multiprocessing.Lock()

    processes = [Process(target=counter_worker, args=(counter, lock)) for _ in range(4)]
    for p in processes:
        p.start()
    for p in processes:
        p.join()

    print(f"计数器: {counter.value}")  # 400000
```

#### 进程池配置

```python
from multiprocessing import Pool, cpu_count

# 进程数经验公式
print(f"CPU 核数: {cpu_count()}")

# CPU 密集型：进程数 = CPU 核数（或 +1）
pool_cpu = Pool(processes=cpu_count())

# IO 密集型：进程数可以多一些（2x~4x CPU 核数）
pool_io = Pool(processes=cpu_count() * 2)

# Pool 常用参数
pool = Pool(
    processes=4,           # 工作进程数
    maxtasksperchild=100,  # 每个进程处理多少任务后重启（防止内存泄漏）
    initializer=init_func, # 每个工作进程启动时执行的初始化函数
    initargs=(arg1,),       # 初始化函数参数
)
```

---

### 6. Flask 核心概念（⭐⭐中频）

#### 蓝图（Blueprint）

```python
from flask import Flask, Blueprint, jsonify

app = Flask(__name__)

# ===== 定义蓝图 =====
user_bp = Blueprint('user', __name__, url_prefix='/api/users')
order_bp = Blueprint('order', __name__, url_prefix='/api/orders')

@user_bp.route('/', methods=['GET'])
def list_users():
    return jsonify({"users": ["Alice", "Bob"]})

@user_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    return jsonify({"user_id": user_id, "name": "Alice"})

@order_bp.route('/', methods=['GET'])
def list_orders():
    return jsonify({"orders": []})

# ===== 注册蓝图 =====
app.register_blueprint(user_bp)
app.register_blueprint(order_bp)

# 蓝图的好处：
# 1. 模块化：按功能拆分路由
# 2. 可复用：蓝图可以在多个应用中注册
# 3. 命名空间：避免路由冲突
# 4. 中间件隔离：每个蓝图可以有自己的 before_request/after_request
```

#### 上下文（application context / request context）

```
Flask 上下文类型：
1. Application Context（应用上下文）
   - current_app: 当前应用实例
   - g: 存储请求期间的全局数据（每次请求重置）

2. Request Context（请求上下文）
   - request: 当前请求对象
   - session: 当前会话
```

```python
from flask import Flask, g, request, current_app

app = Flask(__name__)

# ===== g 对象的使用 =====
def get_db():
    """获取数据库连接，同一请求中复用"""
    if 'db' not in g:
        g.db = connect_to_database()
    return g.db

@app.teardown_appcontext
def teardown_db(exception):
    """请求结束后自动关闭数据库连接"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route('/users')
def list_users():
    db = get_db()  # 自动复用连接
    users = db.query("SELECT * FROM users")
    return {"users": users}
```

#### Werkzeug

Werkzeug 是 Flask 的底层 WSGI 工具库，提供：

```python
from werkzeug.routing import Map, Rule
from werkzeug.serving import run_simple
from werkzeug.http import parse_cookie
from werkzeug.security import generate_password_hash, check_password_hash

# 1. 路由系统
url_map = Map([
    Rule('/', endpoint='index'),
    Rule('/user/<int:id>', endpoint='user'),
])

# 2. 密码哈希
pw_hash = generate_password_hash('mypassword')
print(check_password_hash(pw_hash, 'mypassword'))  # True
print(check_password_hash(pw_hash, 'wrongpass'))    # False

# 3. HTTP 工具
from werkzeug.http import parse_options_header
parse_options_header('text/html; charset=utf-8')
# ('text/html', {'charset': 'utf-8'})
```

#### Flask vs Django vs FastAPI 对比

| 特性 | Flask | Django | FastAPI |
|------|-------|--------|---------|
| 类型 | 微框架 | 全栈框架 | 异步 API 框架 |
| 学习曲线 | 低 | 高 | 中 |
| ORM | 无内置（SQLAlchemy） | 内置 Django ORM | 无内置（SQLAlchemy/Tortoise） |
| 异步支持 | 2.0+（有限） | 3.1+（有限） | 原生 async/await |
| 性能 | 中 | 低 | 高 |
| 自动文档 | 无 | 无 | Swagger UI + ReDoc |
| 类型验证 | 无 | 无 | Pydantic |
| 管理后台 | 无 | 内置 Admin | 无 |
| 适用场景 | 小型项目、微服务 | 内容管理、全栈 Web | API 服务、微服务 |

---

### 7. ORM N+1 查询问题（⭐高频）

#### 问题描述

N+1 查询：执行 1 条查询获取 N 条记录，然后对每条记录再执行 1 条查询获取关联数据，总共 1 + N 条查询。

```python
# ===== N+1 问题演示 =====
# 获取所有文章及其作者
posts = Post.query.all()          # 第1条查询：SELECT * FROM posts
for post in posts:
    print(post.author.name)       # N条查询：SELECT * FROM authors WHERE id = ?

# 如果有100篇文章，就会执行101条SQL！
```

#### Django select\_related vs prefetch\_related

```python
# ===== select_related：SQL JOIN（一对一、外键）=====
# 生成 1 条 SQL（LEFT OUTER JOIN）
posts = Post.objects.select_related('author').all()
for post in posts:
    print(post.author.name)  # 不再触发额外查询

# SQL: SELECT posts.*, authors.* FROM posts LEFT OUTER JOIN authors ON posts.author_id = authors.id


# ===== prefetch_related：Python 端 JOIN（多对多、反向外键）=====
# 生成 2 条 SQL（先查主表，再查关联表）
posts = Post.objects.prefetch_related('tags').all()
for post in posts:
    print([tag.name for tag in post.tags.all()])  # 不再触发额外查询

# SQL 1: SELECT * FROM posts
# SQL 2: SELECT * FROM tags INNER JOIN post_tags ON ... WHERE post_id IN (1,2,3,...)


# ===== 组合使用 =====
posts = Post.objects.select_related('author').prefetch_related('tags', 'comments')
```

#### SQL 对比

```sql
-- N+1 问题（101条SQL）
SELECT * FROM posts;                                    -- 1条
SELECT * FROM authors WHERE id = 1;                     -- N条
SELECT * FROM authors WHERE id = 2;
...

-- select_related（1条SQL，JOIN）
SELECT posts.*, authors.*
FROM posts
LEFT OUTER JOIN authors ON posts.author_id = authors.id;

-- prefetch_related（2条SQL，子查询）
SELECT * FROM posts;                                    -- 1条
SELECT tags.*, post_tags.post_id
FROM tags
INNER JOIN post_tags ON tags.id = post_tags.tag_id
WHERE post_tags.post_id IN (1, 2, 3, ..., 100);        -- 1条
```

#### SQLAlchemy 中的解决方案

```python
from sqlalchemy.orm import joinedload, selectinload

# joinedload: 等价于 Django 的 select_related（JOIN）
posts = session.query(Post).options(joinedload(Post.author)).all()

# selectinload: 等价于 Django 的 prefetch_related（IN 查询）
posts = session.query(Post).options(selectinload(Post.tags)).all()

# 组合使用
posts = session.query(Post).options(
    joinedload(Post.author),
    selectinload(Post.tags),
    selectinload(Post.comments),
).all()
```

#### 面试问答

**Q: 什么时候用 select\_related，什么时候用 prefetch\_related？**

- `select_related`（JOIN）：适用于 ForeignKey、OneToOne 等单值关联。数据量小时效率高，但多对多时 JOIN 结果集会爆炸。
- `prefetch_related`（子查询）：适用于 ManyToMany、反向外键等多值关联。总是只生成 2 条 SQL，但需要在 Python 端做合并。

---

### 8. Python 线程安全与同步原语（⭐⭐中频）

#### Lock/RLock 区别

```python
import threading

# ===== Lock（互斥锁）=====
lock = threading.Lock()

lock.acquire()
try:
    # 临界区
    pass
finally:
    lock.release()

# 等价写法
with lock:
    # 临界区
    pass

# Lock 特点：
# 1. 同一线程不能重复 acquire（会死锁）
# 2. 任何线程都可以 release（不安全）


# ===== RLock（可重入锁）=====
rlock = threading.RLock()

def outer():
    with rlock:
        print("outer")
        inner()  # 同一线程可以再次获取锁

def inner():
    with rlock:  # 不会死锁
        print("inner")

# RLock 特点：
# 1. 同一线程可以多次 acquire（必须对应次数的 release）
# 2. 只有获取锁的线程才能 release（更安全）
# 3. 维护 acquire 计数器
```

#### Event/Condition/Semaphore

```python
import threading
import time

# ===== Event：线程间信号通知 =====
event = threading.Event()

def waiter():
    print("等待信号...")
    event.wait()  # 阻塞，直到 event.set()
    print("收到信号，继续执行")

def setter():
    time.sleep(2)
    event.set()  # 通知所有等待的线程

# 适用场景：一个线程通知其他线程"某事发生了"


# ===== Condition：条件变量（等待某个条件成立）=====
condition = threading.Condition()
items = []

def consumer():
    with condition:
        while not items:
            condition.wait()  # 释放锁并等待
        item = items.pop(0)
        print(f"消费: {item}")

def producer():
    with condition:
        items.append("产品")
        condition.notify()  # 唤醒一个等待的线程

# 适用场景：生产者-消费者模式


# ===== Semaphore：控制并发数量 =====
semaphore = threading.Semaphore(3)  # 最多3个线程同时执行

def limited_task(task_id):
    with semaphore:
        print(f"任务 {task_id} 开始")
        time.sleep(2)
        print(f"任务 {task_id} 结束")

# 适用场景：限制数据库连接数、限制并发请求数
```

#### 生产者-消费者模式

```python
import threading
import queue
import time
import random

q = queue.Queue(maxsize=10)

def producer():
    for i in range(20):
        item = f"产品-{i}"
        q.put(item)  # 队列满时自动阻塞
        print(f"生产: {item} (队列大小: {q.qsize()})")
        time.sleep(random.uniform(0.1, 0.5))

def consumer(consumer_id):
    while True:
        item = q.get()  # 队列空时自动阻塞
        print(f"消费者 {consumer_id} 消费: {item}")
        q.task_done()  # 标记任务完成
        time.sleep(random.uniform(0.2, 0.8))

# 启动消费者
consumers = []
for i in range(3):
    t = threading.Thread(target=consumer, args=(i,), daemon=True)
    t.start()
    consumers.append(t)

# 启动生产者
producer()

q.join()  # 等待所有任务被处理
print("所有任务完成")
```

#### concurrent.futures.ThreadPoolExecutor

```python
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

def fetch_url(url):
    """模拟 HTTP 请求"""
    time.sleep(1)
    return f"{url} 的内容"

urls = [
    "https://api.example.com/users",
    "https://api.example.com/orders",
    "https://api.example.com/products",
    "https://api.example.com/reviews",
]

# ===== 基本用法 =====
with ThreadPoolExecutor(max_workers=4) as executor:
    # submit: 提交单个任务，返回 Future
    future_to_url = {executor.submit(fetch_url, url): url for url in urls}
    for future in as_completed(future_to_url):
        url = future_to_url[future]
        try:
            result = future.result(timeout=5)
            print(result)
        except Exception as e:
            print(f"{url} 失败: {e}")

# ===== map 用法 =====
with ThreadPoolExecutor(max_workers=4) as executor:
    results = executor.map(fetch_url, urls)
    for result in results:
        print(result)

# ===== 回调函数 =====
with ThreadPoolExecutor(max_workers=4) as executor:
    future = executor.submit(fetch_url, urls[0])
    future.add_done_callback(lambda f: print(f"完成: {f.result()}"))

# ThreadPoolExecutor vs 手动 threading：
# 1. 自动管理线程生命周期
# 2. 提供 Future 对象，方便获取结果和异常
# 3. 支持 with 语句自动清理
# 4. map 方法简化批量任务
```
