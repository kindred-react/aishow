# Java 并发编程知识体系

> 面向5年经验Java工程师面试知识储备。读者熟悉React，需快速掌握Java核心知识。

---

## 一、线程基础

### 1.1 进程 vs 线程

**进程（Process）**：操作系统分配资源的基本单位，每个进程有独立的内存空间（堆、栈、代码区、数据区）。进程间通信需要 IPC 机制（管道、消息队列、共享内存等）。

**线程（Thread）**：CPU 调度的基本单位，同一进程内的线程共享进程的内存空间（堆、方法区），但每个线程有独立的程序计数器、栈和本地方法栈。

```
进程（独立内存空间）
├── 线程1（独立栈 + 程序计数器）
│     └── 共享：堆、方法区
├── 线程2（独立栈 + 程序计数器）
│     └── 共享：堆、方法区
└── 线程3（独立栈 + 程序计数器）
      └── 共享：堆、方法区
```

| 对比项 | 进程 | 线程 |
|--------|------|------|
| 资源分配 | 操作系统分配资源的基本单位 | CPU 调度的基本单位 |
| 内存 | 独立地址空间 | 共享进程地址空间 |
| 创建/销毁开销 | 大 | 小 |
| 切换开销 | 大（需切换页表等） | 小（只需保存/恢复寄存器） |
| 通信方式 | IPC（管道、Socket等） | 共享内存、wait/notify等 |
| 健壮性 | 一个进程崩溃不影响其他 | 一个线程崩溃可能导致整个进程崩溃 |

> **React 开发者类比**：进程类似浏览器中打开的不同标签页（独立内存），线程类似同一标签页中的 JS 主线程 + Web Worker（共享内存）。

### 1.2 创建线程的 4 种方式

#### 方式一：继承 Thread 类

```java
public class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程名: " + Thread.currentThread().getName());
    }

    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.setName("MyThread-1");
        thread.start(); // 启动线程，JVM 会回调 run()
    }
}
```

#### 方式二：实现 Runnable 接口（推荐）

```java
public class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程名: " + Thread.currentThread().getName());
    }

    public static void main(String[] args) {
        // Runnable 配合 Lambda（JDK 8+）
        Thread thread = new Thread(() -> {
            System.out.println("Lambda Runnable: " + Thread.currentThread().getName());
        }, "Lambda-Thread");
        thread.start();
    }
}
```

#### 方式三：实现 Callable 接口（有返回值）

```java
import java.util.concurrent.*;

public class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        int sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        return sum;
    }

    public static void main(String[] args) throws Exception {
        FutureTask<Integer> futureTask = new FutureTask<>(new MyCallable());
        Thread thread = new Thread(futureTask);
        thread.start();

        // get() 会阻塞直到任务完成
        Integer result = futureTask.get();
        System.out.println("计算结果: " + result); // 5050

        // 也可以设置超时
        // Integer result = futureTask.get(5, TimeUnit.SECONDS);
    }
}
```

#### 方式四：线程池（生产环境推荐）

```java
import java.util.concurrent.*;

public class ThreadPoolDemo {
    public static void main(String[] args) {
        // 生产环境禁止使用 Executors，后续章节详细讲解
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(10),
            new ThreadFactory() {
                private int count = 0;
                @Override
                public Thread newThread(Runnable r) {
                    return new Thread(r, "my-pool-" + count++);
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        // 提交 Runnable（无返回值）
        executor.execute(() -> System.out.println("execute: " + Thread.currentThread().getName()));

        // 提交 Callable（有返回值）
        Future<String> future = executor.submit(() -> {
            return "submit: " + Thread.currentThread().getName();
        });
        System.out.println(future.get());

        executor.shutdown();
    }
}
```

**四种方式对比：**

| 方式 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 继承 Thread | 简单直接 | Java 单继承限制 | 简单场景 |
| 实现 Runnable | 灵活，可继承其他类 | 无返回值，不能抛异常 | 通用场景 |
| 实现 Callable | 有返回值，可抛异常 | 使用稍复杂 | 需要结果的场景 |
| 线程池 | 线程复用，控制并发 | 配置复杂 | **生产环境首选** |

### 1.3 Thread 类核心方法

```java
public class ThreadMethodsDemo {
    public static void main(String[] args) throws Exception {

        // ========== start() vs run() ==========
        Thread t1 = new Thread(() -> System.out.println("t1: " + Thread.currentThread().getName()));
        t1.start();  // 正确：启动新线程，JVM 回调 run()
        // t1.run();  // 错误：在当前线程（main）中直接调用 run()，不会启动新线程

        // ========== sleep() ==========
        // 让当前线程暂停指定毫秒，不释放锁
        Thread.sleep(1000); // 静态方法，让 main 线程休眠 1 秒

        // ========== yield() ==========
        // 让出 CPU 时间片，让同优先级或更高优先级线程先执行
        // 只是提示，不保证一定让出
        Thread.yield();

        // ========== join() ==========
        Thread t2 = new Thread(() -> {
            try {
                Thread.sleep(2000);
                System.out.println("t2 执行完毕");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        });
        t2.start();
        t2.join(); // main 线程等待 t2 执行完毕
        System.out.println("main 在 t2 之后执行");

        // ========== interrupt() ==========
        Thread t3 = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                // 工作逻辑
            }
            System.out.println("t3 被中断，优雅退出");
        });
        t3.start();
        Thread.sleep(100);
        t3.interrupt(); // 设置中断标志位，不会强制终止线程
    }
}
```

**interrupt 机制详解：**

```java
// interrupt() 只是设置中断标志，不会强制停止线程
// 线程需要自行检查标志并处理

// 情况1：线程在运行中
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        // 正常工作
    }
    // 检测到中断标志，自行退出
    System.out.println("线程自行退出");
});
t.start();
t.interrupt();

// 情况2：线程在 sleep/wait/join 中
Thread t2 = new Thread(() -> {
    try {
        Thread.sleep(10000); // 会抛出 InterruptedException
    } catch (InterruptedException e) {
        // sleep 期间被 interrupt，会清除中断标志并抛出异常
        System.out.println("sleep 被中断");
        // 注意：此时中断标志已被清除！
        // 如果需要继续传递中断，可以再次调用 interrupt()
        Thread.currentThread().interrupt();
    }
});
t2.start();
t2.interrupt();
```

### 1.4 守护线程 vs 用户线程

```java
public class DaemonThreadDemo {
    public static void main(String[] args) throws Exception {
        Thread userThread = new Thread(() -> {
            try {
                Thread.sleep(3000);
                System.out.println("用户线程执行完毕");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }, "UserThread");

        Thread daemonThread = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(500);
                    System.out.println("守护线程运行中...");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }, "DaemonThread");

        daemonThread.setDaemon(true); // 必须在 start() 之前设置
        userThread.start();
        daemonThread.start();

        // 当所有用户线程结束后，JVM 会退出，守护线程会被强制终止
        userThread.join();
        System.out.println("main 结束");
    }
}
```

**关键点：**
- 守护线程（Daemon Thread）为其他线程提供服务，如 GC 线程
- 当所有用户线程结束后，JVM 退出，守护线程随之销毁
- 守护线程不能持有任何需要关闭的资源（文件、数据库连接等）
- `setDaemon(true)` 必须在 `start()` 之前调用，否则抛出 `IllegalThreadStateException`

### 1.5 线程生命周期

```
                    ┌──────────┐
          start()   │          │  run() 执行完毕
    NEW ──────────→ │ RUNNABLE │ ──────────→ TERMINATED
                    │          │
                    └────┬─────┘
                         │
           ┌─────────────┼──────────────────┐
           │             │                  │
    获取锁失败     wait()/join()      sleep(time)/wait(time)
           │             │                  │
           ▼             ▼                  ▼
     ┌──────────┐  ┌──────────┐    ┌───────────────┐
     │ BLOCKED  │  │ WAITING  │    │ TIMED_WAITING │
     └──────────┘  └──────────┘    └───────────────┘
           │             │                  │
      获取锁成功    notify()/notifyAll()   超时或interrupt
           │        /interrupt             │
           └─────────────┼──────────────────┘
                         │
                         ▼
                    ┌──────────┐
                    │ RUNNABLE │
                    └──────────┘
```

**六种状态详解：**

| 状态 | 说明 | 触发方式 |
|------|------|----------|
| NEW | 线程已创建，尚未启动 | `new Thread()` |
| RUNNABLE | 可运行状态（包含就绪和运行中） | `start()` |
| BLOCKED | 等待获取 synchronized 锁 | 等待进入 synchronized 块 |
| WAITING | 无限期等待 | `wait()`、`join()`、`LockSupport.park()` |
| TIMED_WAITING | 有时限等待 | `sleep(ms)`、`wait(ms)`、`join(ms)` |
| TERMINATED | 线程执行完毕或异常退出 | `run()` 正常结束或异常 |

```java
// 查看线程状态
Thread.State state = thread.getState();
System.out.println(state); // 输出枚举值
```

### 1.6 线程优先级

```java
public class PriorityDemo {
    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 100; i++) System.out.println("低优先级");
        });
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 100; i++) System.out.println("高优先级");
        });

        t1.setPriority(Thread.MIN_PRIORITY);  // 1
        t2.setPriority(Thread.MAX_PRIORITY);  // 10

        t1.start();
        t2.start();
    }
}
```

**注意：** 线程优先级 1-10，默认 5。但优先级**不保证**执行顺序，只是给线程调度器的"建议"，具体行为取决于操作系统。

---

## 二、线程安全问题

### 2.1 线程安全的三要素

```
线程安全三要素
├── 原子性（Atomicity）   → 一个或多个操作要么全部执行，要么全部不执行
├── 可见性（Visibility）  → 一个线程修改了共享变量，其他线程能立即看到
└── 有序性（Ordering）    → 程序执行的顺序按照代码的先后顺序
```

**经典案例：i++ 不是原子操作**

```java
public class AtomicityDemo {
    private static int count = 0;

    public static void main(String[] args) throws Exception {
        Runnable increment = () -> {
            for (int i = 0; i < 10000; i++) {
                count++; // 不是原子操作！实际是 3 步：
                         // 1. 读取 count 的值
                         // 2. count + 1
                         // 3. 写回 count
            }
        };

        Thread t1 = new Thread(increment);
        Thread t2 = new Thread(increment);
        t1.start();
        t2.start();
        t1.join();
        t2.join();

        // 期望 20000，实际可能小于 20000
        System.out.println("count = " + count);
    }
}
```

### 2.2 volatile 关键字

**volatile 两大特性：**
1. **保证可见性**：一个线程修改 volatile 变量，其他线程立即看到最新值（通过内存屏障，禁止 CPU 缓存）
2. **禁止指令重排序**：编译器和 CPU 不会对 volatile 变量前后的指令进行重排序

**volatile 不保证原子性！**

```java
public class VolatileDemo {
    // volatile 保证可见性，但不保证原子性
    private volatile int count = 0;

    public void increment() {
        count++; // 仍然不是线程安全的！
    }

    // volatile 的正确使用场景：状态标志位
    private volatile boolean running = true;

    public void stop() {
        running = false; // 保证其他线程立即看到
    }

    public void doWork() {
        while (running) {
            // 工作逻辑
        }
        System.out.println("线程安全退出");
    }
}
```

**volatile 底层原理（内存屏障）：**

```
普通变量：
  线程A（CPU缓存）→ 主内存 ← 线程B（CPU缓存）
  线程A修改后可能不会立即刷新到主内存
  线程B可能一直读自己CPU缓存中的旧值

volatile 变量：
  写操作：强制刷新到主内存（StoreStore + StoreLoad 屏障）
  读操作：强制从主内存读取（LoadLoad + LoadStore 屏障）

  线程A写volatile → 立即刷新到主内存
  线程B读volatile → 立即从主内存读取最新值
```

**volatile 典型应用：DCL 双重检查锁定单例模式**

```java
public class Singleton {
    // volatile 防止指令重排序
    // new Singleton() 实际分3步：
    // 1. 分配内存空间
    // 2. 初始化对象
    // 3. 将引用指向内存地址
    // 没有 volatile，步骤2和3可能重排序，导致其他线程拿到未初始化的对象
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                    // 第一次检查（无锁）
            synchronized (Singleton.class) {
                if (instance == null) {            // 第二次检查（有锁）
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

### 2.3 synchronized 关键字

**synchronized 三种使用方式：**

```java
public class SynchronizedDemo {
    private final Object lock = new Object();
    private static int staticCount = 0;
    private int instanceCount = 0;

    // 1. 对象锁 - 修饰实例方法（锁的是 this）
    public synchronized void instanceMethod() {
        instanceCount++;
    }

    // 2. 类锁 - 修饰静态方法（锁的是 Class 对象）
    public static synchronized void staticMethod() {
        staticCount++;
    }

    // 3. 同步代码块 - 更灵活的锁粒度
    public void blockMethod() {
        // 锁指定对象
        synchronized (lock) {
            instanceCount++;
        }

        // 锁 this
        synchronized (this) {
            instanceCount++;
        }

        // 锁 Class 对象（类锁）
        synchronized (SynchronizedDemo.class) {
            staticCount++;
        }
    }
}
```

**synchronized 可重入性：**

```java
public class ReentrantDemo {
    public synchronized void methodA() {
        System.out.println("methodA");
        methodB(); // 同一线程可以重入，不会死锁
    }

    public synchronized void methodB() {
        System.out.println("methodB");
    }

    // 父子类继承场景
    static class Parent {
        public synchronized void doSomething() {
            System.out.println("Parent doSomething");
        }
    }

    static class Child extends Parent {
        @Override
        public synchronized void doSomething() {
            System.out.println("Child doSomething");
            super.doSomething(); // 可重入，锁的是同一个对象
        }
    }
}
```

**synchronized 底层原理（JDK 6 优化后）：**

```
对象头中的 Mark Word：
┌─────────────────────────────────┐
│ Mark Word (64 bit)              │
├─────────┬───────┬───────────────┤
│ 锁标志位 │ 偏向锁 │ 轻量级锁指针  │
└─────────┴───────┴───────────────┘

锁升级过程（不可降级）：
无锁 → 偏向锁 → 轻量级锁 → 重量级锁

1. 偏向锁（Biased Lock）：
   - 第一个访问的线程记录线程ID到Mark Word
   - 后续该线程进入不需要任何CAS操作
   - 适用于几乎没有竞争的场景

2. 轻量级锁（Thin Lock）：
   - 有第二个线程来竞争时，偏向锁撤销，升级为轻量级锁
   - 线程在自己的栈帧中创建 Lock Record
   - 通过 CAS 操作将 Mark Word 替换为指向 Lock Record 的指针
   - 适用于少量线程短时间竞争的场景

3. 重量级锁（Heavyweight Lock）：
   - 竞争激烈时，升级为重量级锁
   - 依赖操作系统的 mutex 互斥量
   - 未获取到锁的线程会被阻塞（BLOCKED 状态）
```

### 2.4 synchronized vs volatile

| 对比项 | synchronized | volatile |
|--------|-------------|----------|
| 原子性 | 保证（互斥锁） | 不保证 |
| 可见性 | 保证 | 保证 |
| 有序性 | 保证 | 保证（禁止重排序） |
| 阻塞 | 可能阻塞 | 不会阻塞 |
| 编译优化 | 优化空间大 | 限制较多 |
| 适用场景 | 复合操作 | 单一状态标志 |
| 性能 | JDK 6 优化后差距不大 | 读多写少场景更优 |

> **面试回答要点：** synchronized 既能保证原子性又能保证可见性，volatile 只能保证可见性和有序性。synchronized 可能导致线程阻塞，volatile 不会。volatile 适合做状态标志，synchronized 适合做复合操作的互斥。

---

## 三、锁机制

### 3.1 ReentrantLock

ReentrantLock 是 `java.util.concurrent.locks` 包下的显式锁，提供了比 synchronized 更灵活的锁操作。

```java
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockDemo {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;

    public void increment() {
        lock.lock(); // 加锁
        try {
            count++;
        } finally {
            lock.unlock(); // 必须在 finally 中释放锁！
        }
    }

    // tryLock() 尝试获取锁，获取不到立即返回 false
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false; // 获取锁失败，可以做其他事情
    }

    // tryLock 带超时
    public boolean tryIncrementWithTimeout() throws InterruptedException {
        if (lock.tryLock(5, TimeUnit.SECONDS)) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false;
    }

    public static void main(String[] args) throws Exception {
        ReentrantLockDemo demo = new ReentrantLockDemo();

        // lockInterruptibly()：可中断的锁获取
        Thread t = new Thread(() -> {
            try {
                demo.lock.lockInterruptibly();
                try {
                    System.out.println("获取到锁");
                } finally {
                    demo.lock.unlock();
                }
            } catch (InterruptedException e) {
                System.out.println("等待锁的过程中被中断");
            }
        });
        t.start();
        Thread.sleep(100);
        t.interrupt(); // 中断等待锁的线程
    }
}
```

#### 公平锁 vs 非公平锁

```java
// 公平锁：线程按等待顺序获取锁（FIFO）
ReentrantLock fairLock = new ReentrantLock(true);

// 非公平锁（默认）：新来的线程可能插队获取锁
ReentrantLock unfairLock = new ReentrantLock(false);
// new ReentrantLock() 默认非公平锁
```

```
非公平锁（默认）：
  线程A释放锁 → 线程C刚好来请求 → 线程C直接获取锁（插队成功）
  线程B（等待更久）继续等待

公平锁：
  线程A释放锁 → 检查等待队列 → 线程B等待最久 → 线程B获取锁
```

**为什么默认非公平锁？** 性能更好。非公平锁减少了线程切换的开销，吞吐量更高。

#### Condition 条件变量

```java
import java.util.concurrent.locks.*;

public class ConditionDemo {
    private final ReentrantLock lock = new ReentrantLock();
    private final Condition notEmpty = lock.newCondition();
    private final Condition notFull = lock.newCondition();
    private final String[] items = new String[10];
    private int putptr, takeptr, count;

    public void put(String x) throws InterruptedException {
        lock.lock();
        try {
            while (count == items.length) {
                notFull.await(); // 队列满，等待 notFull 信号
            }
            items[putptr] = x;
            if (++putptr == items.length) putptr = 0;
            count++;
            notEmpty.signal(); // 通知消费者：队列不空了
        } finally {
            lock.unlock();
        }
    }

    public String take() throws InterruptedException {
        lock.lock();
        try {
            while (count == 0) {
                notEmpty.await(); // 队列空，等待 notEmpty 信号
            }
            String x = items[takeptr];
            if (++takeptr == items.length) takeptr = 0;
            count--;
            notFull.signal(); // 通知生产者：队列不满了
            return x;
        } finally {
            lock.unlock();
        }
    }
}
```

> **对比 synchronized 的 wait/notify：** Condition 支持多个条件变量，可以精确控制唤醒哪类线程；synchronized 只有一个等待队列。

### 3.2 ReentrantReadWriteLock

读写锁：读锁（共享锁）允许多个线程同时读，写锁（独占锁）只允许一个线程写。

```java
import java.util.concurrent.locks.*;
import java.util.HashMap;
import java.util.Map;

public class ReadWriteLockDemo {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private final Lock readLock = rwLock.readLock();
    private final Lock writeLock = rwLock.writeLock();
    private final Map<String, String> cache = new HashMap<>();

    // 读操作：多个线程可以同时读
    public String get(String key) {
        readLock.lock();
        try {
            return cache.get(key);
        } finally {
            readLock.unlock();
        }
    }

    // 写操作：只有一个线程可以写
    public void put(String key, String value) {
        writeLock.lock();
        try {
            cache.put(key, value);
        } finally {
            writeLock.unlock();
        }
    }

    // 锁降级：写锁 → 读锁（可以）
    public void lockDowngrade(String key) {
        writeLock.lock();
        try {
            // 1. 先获取写锁，修改数据
            cache.put(key, "updated-value");

            // 2. 在写锁未释放前，获取读锁
            readLock.lock();
        } finally {
            // 3. 释放写锁，此时仍持有读锁
            writeLock.unlock();
        }
        try {
            // 4. 安全地读取刚修改的数据（其他线程无法写）
            System.out.println(cache.get(key));
        } finally {
            // 5. 释放读锁
            readLock.unlock();
        }
    }

    // 读锁不能升级为写锁！否则会死锁
    public void lockUpgradeBad(String key) {
        readLock.lock();
        try {
            // 如果在这里尝试获取写锁 → 死锁！
            // writeLock.lock(); // 永远获取不到
            // 因为其他读线程可能也在持有读锁，写锁需要等所有读锁释放
        } finally {
            readLock.unlock();
        }
    }
}
```

```
读写锁状态图：
                    ┌────────────────────┐
                    │   无锁状态          │
                    └────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ 读锁     │  │ 读锁     │  │ 写锁     │
        │ (线程A)  │  │ (线程B)  │  │ (线程C)  │
        └──────────┘  └──────────┘  └──────────┘
              │              │              │
              └──────┬───────┘              │
                     │                      │
              读锁可以共存              写锁独占
              但不能和写锁共存          其他读写都阻塞
```

### 3.3 StampedLock

JDK 8 引入，性能优于 ReentrantReadWriteLock，支持乐观读。

```java
import java.util.concurrent.locks.StampedLock;

public class StampedLockDemo {
    private final StampedLock sl = new StampedLock();
    private double x, y;

    // 乐观读（无锁操作，性能最高）
    public double distanceFromOrigin() {
        // 1. 获取乐观读票据
        long stamp = sl.tryOptimisticRead();
        // 2. 读取数据到局部变量
        double currentX = x, currentY = y;
        // 3. 验证在读取期间是否有写操作
        if (!sl.validate(stamp)) {
            // 4. 验证失败，升级为悲观读锁
            stamp = sl.readLock();
            try {
                currentX = x;
                currentY = y;
            } finally {
                sl.unlockRead(stamp);
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }

    // 悲观读
    public void read() {
        long stamp = sl.readLock();
        try {
            System.out.println("x=" + x + ", y=" + y);
        } finally {
            sl.unlockRead(stamp);
        }
    }

    // 写锁
    public void move(double deltaX, double deltaY) {
        long stamp = sl.writeLock();
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            sl.unlockWrite(stamp);
        }
    }

    // 写锁转换为读锁
    public void moveThenRead(double deltaX, double deltaY) {
        long stamp = sl.writeLock();
        try {
            x += deltaX;
            y += deltaY;
            // 转换为读锁（释放写锁，获取读锁）
            stamp = sl.tryConvertToReadLock(stamp);
            if (stamp == 0L) {
                // 转换失败，手动获取读锁
                sl.unlockWrite(stamp);
                stamp = sl.readLock();
            }
            System.out.println("after move: x=" + x + ", y=" + y);
        } finally {
            sl.unlockRead(stamp);
        }
    }
}
```

**StampedLock vs ReentrantReadWriteLock：**

| 对比项 | StampedLock | ReentrantReadWriteLock |
|--------|------------|----------------------|
| 锁模式 | 乐观读、悲观读、写 | 读、写 |
| 可重入 | 不支持 | 支持 |
| 锁降级 | 支持 | 支持 |
| 条件变量 | 不支持 | 支持（Condition） |
| 性能 | 更高（乐观读无锁） | 略低 |
| 使用复杂度 | 较高 | 较低 |

> **注意：** StampedLock 不可重入！不要在持锁期间调用可能再次获取锁的方法。

---

## 四、CAS 与原子类

### 4.1 CAS 原理

**CAS（Compare-And-Swap）** 是一种无锁算法，通过 CPU 指令（如 x86 的 `cmpxchg`）原子地完成"比较并交换"操作。

```
CAS(V, Expected, New)
  V: 内存中的值
  Expected: 期望值
  New: 新值

如果 V == Expected → V = New，返回 true
如果 V != Expected → 不修改，返回 false（说明被其他线程修改了）
```

```java
// CAS 模拟（底层是 Unsafe 类的 native 方法）
public class CASDemo {
    private volatile int value;

    // 模拟 CAS 操作
    public boolean compareAndSet(int expected, int newValue) {
        // 底层调用 Unsafe.compareAndSwapInt()
        // 这是一个原子操作，由 CPU 指令保证
        synchronized (this) { // 仅示意，实际 CAS 不需要锁
            if (value == expected) {
                value = newValue;
                return true;
            }
            return false;
        }
    }

    // CAS 实现自增（AtomicInteger.incrementAndGet() 的原理）
    public int increment() {
        int old;
        int newValue;
        do {
            old = value;           // 读取当前值
            newValue = old + 1;    // 计算新值
        } while (!compareAndSet(old, newValue)); // CAS 失败则重试（自旋）
        return newValue;
    }
}
```

### 4.2 ABA 问题及解决方案

**ABA 问题：** 线程1读取值 A，线程2将值改为 B 又改回 A，线程1执行 CAS 时发现值还是 A，以为没有被修改过。

```java
import java.util.concurrent.atomic.*;

public class ABADemo {
    private static AtomicReference<Integer> ref = new AtomicReference<>(100);

    public static void main(String[] args) throws Exception {
        Thread t1 = new Thread(() -> {
            // 线程1：A → B → A
            ref.compareAndSet(100, 101); // 100 → 101
            ref.compareAndSet(101, 100); // 101 → 100
        });

        Thread t2 = new Thread(() -> {
            try { Thread.sleep(100); } catch (Exception e) {}
            // 线程2：期望100，改为2024
            // CAS 成功！但中间值已经被修改过了
            boolean success = ref.compareAndSet(100, 2024);
            System.out.println("CAS result: " + success); // true（但可能不是期望的行为）
            System.out.println("value: " + ref.get());    // 2024
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();
    }
}
```

**解决方案：AtomicStampedReference（带版本号的 CAS）**

```java
import java.util.concurrent.atomic.AtomicStampedReference;

public class AtomicStampedReferenceDemo {
    // 初始值100，版本号1
    private static AtomicStampedReference<Integer> ref =
        new AtomicStampedReference<>(100, 1);

    public static void main(String[] args) throws Exception {
        Thread t1 = new Thread(() -> {
            int stamp = ref.getStamp(); // 获取当前版本号
            ref.compareAndSet(100, 101, stamp, stamp + 1); // 版本号+1
            stamp = ref.getStamp();
            ref.compareAndSet(101, 100, stamp, stamp + 1); // 版本号再+1
        });

        Thread t2 = new Thread(() -> {
            try { Thread.sleep(100); } catch (Exception e) {}
            int stamp = ref.getStamp(); // 获取版本号
            // CAS 失败！因为版本号已经变了（1→2→3）
            boolean success = ref.compareAndSet(100, 2024, stamp, stamp + 1);
            System.out.println("CAS result: " + success); // false
            System.out.println("value: " + ref.getReference()); // 100
            System.out.println("stamp: " + ref.getStamp()); // 3
        });

        t1.start();
        t2.start();
        t1.join();
        t2.join();
    }
}
```

### 4.3 Unsafe 类

`sun.misc.Unsafe` 是 Java 中直接操作内存的底层类，CAS 操作的核心。

```java
// Unsafe 的主要功能（了解即可，生产环境不直接使用）
public class UnsafeDemo {
    // Unsafe 是单例，需要通过反射获取
    /*
    Field field = Unsafe.class.getDeclaredField("theUnsafe");
    field.setAccessible(true);
    Unsafe unsafe = (Unsafe) field.get(null);

    // CAS 操作
    unsafe.compareAndSwapInt(obj, offset, expected, newValue);
    unsafe.compareAndSwapLong(obj, offset, expected, newValue);
    unsafe.compareAndSwapObject(obj, offset, expected, newValue);

    // 直接内存操作
    long address = unsafe.allocateMemory(1024);
    unsafe.putByte(address, (byte) 1);
    byte value = unsafe.getByte(address);
    unsafe.freeMemory(address);

    // 偏移量获取
    long offset = unsafe.objectFieldOffset(MyClass.class.getDeclaredField("value"));
    */
}
```

### 4.4 原子类

```java
import java.util.concurrent.atomic.*;

public class AtomicClassesDemo {
    // ========== 基本原子类 ==========
    private static AtomicInteger atomicInt = new AtomicInteger(0);
    private static AtomicLong atomicLong = new AtomicLong(0);
    private static AtomicBoolean atomicBool = new AtomicBoolean(false);

    // ========== 引用原子类 ==========
    private static AtomicReference<User> atomicRef = new AtomicReference<>();

    // ========== 数组原子类 ==========
    private static AtomicIntegerArray atomicArray = new AtomicIntegerArray(10);

    // ========== 字段更新器 ==========
    private volatile int score;
    private static final AtomicIntegerFieldUpdater<AtomicClassesDemo> SCORE_UPDATER =
        AtomicIntegerFieldUpdater.newUpdater(AtomicClassesDemo.class, "score");

    public static void main(String[] args) {
        // AtomicInteger 常用方法
        atomicInt.set(10);
        atomicInt.get();              // 获取值
        atomicInt.getAndIncrement();  // i++（返回旧值）
        atomicInt.incrementAndGet();  // ++i（返回新值）
        atomicInt.getAndAdd(5);       // 加5（返回旧值）
        atomicInt.addAndGet(5);       // 加5（返回新值）
        atomicInt.compareAndSet(10, 20); // CAS
        atomicInt.updateAndGet(x -> x * 2); // Lambda 更新（JDK 8）

        // AtomicIntegerArray
        atomicArray.set(0, 1);
        atomicArray.getAndIncrement(0); // 对索引0的元素自增
        atomicArray.compareAndSet(0, 1, 10); // CAS

        // AtomicReference
        User oldUser = new User("张三", 25);
        User newUser = new User("李四", 30);
        atomicRef.set(oldUser);
        atomicRef.compareAndSet(oldUser, newUser); // CAS 替换整个对象

        // AtomicIntegerFieldUpdater（对已有类的 volatile 字段做原子操作）
        AtomicClassesDemo demo = new AtomicClassesDemo();
        SCORE_UPDATER.compareAndSet(demo, 0, 100);
        System.out.println(demo.score); // 100

        // 累加测试（线程安全）
        Runnable task = () -> {
            for (int i = 0; i < 10000; i++) {
                atomicInt.incrementAndGet();
            }
        };
        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
        try { t1.join(); t2.join(); } catch (Exception e) {}
        System.out.println("atomicInt = " + atomicInt.get()); // 20000
    }

    static class User {
        String name;
        int age;
        User(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }
}
```

### 4.5 LongAdder vs AtomicLong

```java
import java.util.concurrent.atomic.*;

public class LongAdderDemo {
    private static final int THREAD_COUNT = 8;
    private static final int ITERATIONS = 1_000_000;

    public static void main(String[] args) throws Exception {
        // AtomicLong：所有线程 CAS 竞争同一个 value
        AtomicLong atomicLong = new AtomicLong(0);
        // LongAdder：分散到多个 Cell，最后求和
        LongAdder longAdder = new LongAdder();

        // ========== AtomicLong 测试 ==========
        long start = System.currentTimeMillis();
        Thread[] threads1 = new Thread[THREAD_COUNT];
        for (int i = 0; i < THREAD_COUNT; i++) {
            threads1[i] = new Thread(() -> {
                for (int j = 0; j < ITERATIONS; j++) {
                    atomicLong.incrementAndGet();
                }
            });
            threads1[i].start();
        }
        for (Thread t : threads1) t.join();
        System.out.println("AtomicLong: " + atomicLong.get()
            + ", 耗时: " + (System.currentTimeMillis() - start) + "ms");

        // ========== LongAdder 测试 ==========
        start = System.currentTimeMillis();
        Thread[] threads2 = new Thread[THREAD_COUNT];
        for (int i = 0; i < THREAD_COUNT; i++) {
            threads2[i] = new Thread(() -> {
                for (int j = 0; j < ITERATIONS; j++) {
                    longAdder.increment();
                }
            });
            threads2[i].start();
        }
        for (Thread t : threads2) t.join();
        System.out.println("LongAdder: " + longAdder.sum()
            + ", 耗时: " + (System.currentTimeMillis() - start) + "ms");
    }
}
```

```
LongAdder 原理（Cell 分散竞争）：
┌─────────────────────────────────────────┐
│              LongAdder                   │
│  base (无竞争时直接CAS)                  │
├─────────────────────────────────────────┤
│  Cell[0]  Cell[1]  Cell[2]  ... Cell[n] │
│  (竞争时，不同线程累加到不同Cell)         │
└─────────────────────────────────────────┘

sum() = base + Cell[0] + Cell[1] + ... + Cell[n]

高并发场景下，LongAdder 性能远优于 AtomicLong：
- AtomicLong：所有线程竞争一个 value → 大量 CAS 失败重试
- LongAdder：线程分散到不同 Cell → 减少竞争

注意：LongAdder.sum() 不保证强一致性（求和时可能有其他线程在修改）
```

---

## 五、AQS（AbstractQueuedSynchronizer）

### 5.1 AQS 核心原理

AQS 是 JUC（java.util.concurrent）包中锁和同步器的基础框架。

```
AQS 核心结构：
┌──────────────────────────────────────────┐
│          AbstractQueuedSynchronizer       │
├──────────────────────────────────────────┤
│  volatile int state;  // 同步状态         │
│                                          │
│  CLH 双向队列（等待线程排队）              │
│  ┌─────┐    ┌─────┐    ┌─────┐          │
│  │Head │←──→│Node │←──→│Tail │          │
│  └─────┘    └─────┘    └─────┘          │
│                                          │
│  独占模式（Exclusive）                    │
│    - 同一时刻只有一个线程能获取同步状态     │
│    - ReentrantLock                       │
│                                          │
│  共享模式（Shared）                       │
│    - 多个线程可以同时获取同步状态           │
│    - Semaphore、CountDownLatch            │
└──────────────────────────────────────────┘

CLH 队列节点（Node）：
┌─────────────────────┐
│    Node             │
├─────────────────────┤
│ int waitStatus      │  ← 节点状态
│ Node prev           │  ← 前驱节点
│ Node next           │  ← 后继节点
│ Thread thread       │  ← 等待的线程
│ Node nextWaiter     │  ← 条件队列中的下一个节点
└─────────────────────┘

waitStatus 状态值：
  SIGNAL(-1)     : 后继节点需要被唤醒
  CANCELLED(1)   : 节点被取消（超时或中断）
  CONDITION(-2)  : 节点在条件队列中等待
  PROPAGATE(-3)  : 共享模式下的传播
  0              : 初始状态
```

**AQS 模板方法模式：**

```java
// AQS 的设计模式：模板方法模式
// 子类只需实现 tryAcquire/tryRelease（独占）或 tryAcquireShared/tryReleaseShared（共享）

// 独占模式需要实现：
protected boolean tryAcquire(int arg);        // 尝试获取锁
protected boolean tryRelease(int arg);        // 尝试释放锁
protected boolean isHeldExclusively();        // 是否被当前线程独占

// 共享模式需要实现：
protected int tryAcquireShared(int arg);      // 尝试获取共享锁（返回值 >= 0 表示成功）
protected boolean tryReleaseShared(int arg);  // 尝试释放共享锁
```

### 5.2 ReentrantLock 基于 AQS 的实现

```java
// ReentrantLock 内部结构（简化版）
public class ReentrantLock implements Lock {
    private final Sync sync;

    // Sync 继承 AQS
    abstract static class Sync extends AbstractQueuedSynchronizer {
        abstract void lock();

        // 非公平锁的 tryAcquire
        final boolean nonfairTryAcquire(int acquires) {
            Thread current = Thread.currentThread();
            int c = getState();           // 获取 AQS 的 state
            if (c == 0) {
                // CAS 尝试将 state 从 0 改为 1
                if (compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current); // 标记当前线程持有锁
                    return true;
                }
            } else if (current == getExclusiveOwnerThread()) {
                // 可重入：state + 1
                setState(c + acquires);
                return true;
            }
            return false;
        }

        // tryRelease
        protected final boolean tryRelease(int releases) {
            int c = getState() - releases;
            if (Thread.currentThread() != getExclusiveOwnerThread())
                throw new IllegalMonitorStateException();
            boolean free = false;
            if (c == 0) { // state 减到 0，完全释放锁
                free = true;
                setExclusiveOwnerThread(null);
            }
            setState(c);
            return free;
        }
    }

    // 非公平锁
    static final class NonfairSync extends Sync {
        void lock() {
            // 先 CAS 抢锁，失败了再走 AQS 的 acquire 流程
            if (compareAndSetState(0, 1))
                setExclusiveOwnerThread(Thread.currentThread());
            else
                acquire(1); // AQS 模板方法
        }

        protected boolean tryAcquire(int acquires) {
            return nonfairTryAcquire(acquires);
        }
    }

    // 公平锁
    static final class FairSync extends Sync {
        void lock() {
            acquire(1); // 不插队，直接走 AQS 流程
        }

        protected boolean tryAcquire(int acquires) {
            Thread current = Thread.currentThread();
            int c = getState();
            if (c == 0) {
                // 公平锁：先检查队列中是否有等待的线程
                if (!hasQueuedPredecessors() &&
                    compareAndSetState(0, acquires)) {
                    setExclusiveOwnerThread(current);
                    return true;
                }
            }
            // ... 可重入逻辑同上
            return false;
        }
    }
}
```

```
ReentrantLock.lock() 流程：
┌──────────┐
│ lock()   │
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ state == 0 ?     │──是──→ CAS(0, 1) ──成功──→ 获取锁，返回
└────┬─────────────┘          │
     │ 否                      │ 失败
     ▼                         ▼
┌──────────────────┐   ┌──────────────────┐
│ 当前线程持有锁？  │   │ 加入 CLH 队列     │
│ (可重入)          │   │ 自旋/CAS 入队     │
│ state++          │   │ 挂起(park)        │
└──────────────────┘   └──────────────────┘
```

### 5.3 CountDownLatch、Semaphore 基于 AQS 的实现

```java
// CountDownLatch（简化版）
public class CountDownLatch {
    private final Sync sync;

    private static final class Sync extends AbstractQueuedSynchronizer {
        Sync(int count) {
            setState(count); // 用 state 表示倒计时数
        }

        int getCount() {
            return getState();
        }

        // 共享模式：tryAcquireShared
        // state == 0 时返回 1（获取成功），否则返回 -1
        protected int tryAcquireShared(int acquires) {
            return getState() == 0 ? 1 : -1;
        }

        // tryReleaseShared：state - 1
        protected boolean tryReleaseShared(int releases) {
            for (;;) {
                int c = getState();
                if (c == 0) return false;
                int nextc = c - 1;
                if (compareAndSetState(c, nextc))
                    return nextc == 0; // state 减到 0 时唤醒等待线程
            }
        }
    }

    public void await() throws InterruptedException {
        sync.acquireSharedInterruptibly(1); // AQS 模板方法
    }

    public void countDown() {
        sync.releaseShared(1); // AQS 模板方法
    }
}

// Semaphore（简化版）
public class Semaphore {
    private final Sync sync;

    // 非公平
    static final class NonfairSync extends Sync {
        protected int tryAcquireShared(int acquires) {
            return nonfairTryAcquireShared(acquires);
        }
    }

    // 公平
    static final class FairSync extends Sync {
        protected int tryAcquireShared(int acquires) {
            for (;;) {
                if (hasQueuedPredecessors()) return -1;
                int available = getState();
                int remaining = available - acquires;
                if (remaining < 0 ||
                    compareAndSetState(available, remaining))
                    return remaining;
            }
        }
    }
}
```

---

## 六、并发工具类

### 6.1 CountDownLatch（倒计时门闩）

让一个或多个线程等待其他线程完成操作后再继续执行。

```java
import java.util.concurrent.CountDownLatch;

public class CountDownLatchDemo {
    public static void main(String[] args) throws Exception {
        // 模拟主线程等待 3 个子线程完成初始化
        CountDownLatch latch = new CountDownLatch(3);

        for (int i = 0; i < 3; i++) {
            final int index = i;
            new Thread(() -> {
                try {
                    System.out.println("线程" + index + " 开始初始化...");
                    Thread.sleep((long) (Math.random() * 3000));
                    System.out.println("线程" + index + " 初始化完成");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    latch.countDown(); // 计数器 -1
                }
            }).start();
        }

        System.out.println("主线程等待中...");
        latch.await(); // 阻塞，直到计数器为 0
        System.out.println("所有线程初始化完成，主线程继续执行");

        // 带超时的等待
        // boolean finished = latch.await(5, TimeUnit.SECONDS);
        // if (!finished) { System.out.println("超时！"); }
    }
}
```

```
CountDownLatch 工作流程：
  初始 state = 3

  Thread-1: countDown() → state = 2
  Thread-2: countDown() → state = 1
  Thread-3: countDown() → state = 0 → 唤醒 await 的线程

  主线程: await() → 阻塞等待 → state=0 时被唤醒
```

### 6.2 CyclicBarrier（循环栅栏）

让一组线程到达一个屏障点时被阻塞，直到最后一个线程到达，所有被阻塞的线程才能继续执行。可以循环使用。

```java
import java.util.concurrent.*;

public class CyclicBarrierDemo {
    public static void main(String[] args) throws Exception {
        // 3 个线程到达屏障后，先执行 barrierAction，然后一起继续
        CyclicBarrier barrier = new CyclicBarrier(3, () -> {
            // 所有线程到达后执行的回调（可选）
            System.out.println("=== 所有线程已到达，开始下一阶段 ===");
        });

        for (int i = 0; i < 3; i++) {
            final int index = i;
            new Thread(() -> {
                try {
                    System.out.println("线程" + index + " 到达屏障点");
                    barrier.await(); // 等待其他线程
                    System.out.println("线程" + index + " 继续执行");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();
        }
    }
}
```

**CountDownLatch vs CyclicBarrier：**

| 对比项 | CountDownLatch | CyclicBarrier |
|--------|---------------|---------------|
| 使用次数 | 一次性 | 可循环使用 |
| 等待方向 | 主线程等待子线程 | 线程之间互相等待 |
| 回调 | 无 | 支持 barrierAction |
| 计数器 | countDown() 递减 | await() 递增 |
| 重置 | 不支持 | reset() |

### 6.3 Semaphore（信号量）

控制同时访问共享资源的线程数量。

```java
import java.util.concurrent.Semaphore;

public class SemaphoreDemo {
    // 3 个停车位
    private static Semaphore semaphore = new Semaphore(3);

    public static void main(String[] args) {
        // 10 辆车抢 3 个停车位
        for (int i = 1; i <= 10; i++) {
            final int carNum = i;
            new Thread(() -> {
                try {
                    System.out.println("车" + carNum + " 等待停车...");
                    semaphore.acquire(); // 获取许可证（阻塞直到有可用）
                    System.out.println("车" + carNum + " 停入车位（剩余："
                        + semaphore.availablePermits() + "）");
                    Thread.sleep((long) (Math.random() * 5000));
                    System.out.println("车" + carNum + " 离开车位");
                } catch (InterruptedException e) {
                    e.printStackTrace();
                } finally {
                    semaphore.release(); // 释放许可证
                }
            }).start();
        }
    }
}
```

### 6.4 Exchanger（数据交换）

两个线程之间交换数据。

```java
import java.util.concurrent.Exchanger;

public class ExchangerDemo {
    private static Exchanger<String> exchanger = new Exchanger<>();

    public static void main(String[] args) {
        // 线程A：生产数据
        new Thread(() -> {
            try {
                String dataA = "来自线程A的数据";
                System.out.println("线程A准备交换: " + dataA);
                // exchange 会阻塞，直到另一个线程也调用 exchange
                String dataB = exchanger.exchange(dataA);
                System.out.println("线程A收到: " + dataB);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 线程B：消费数据
        new Thread(() -> {
            try {
                String dataB = "来自线程B的数据";
                System.out.println("线程B准备交换: " + dataB);
                String dataA = exchanger.exchange(dataB);
                System.out.println("线程B收到: " + dataA);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

### 6.5 Phaser（阶段同步）

JDK 7 引入，更灵活的同步屏障，支持动态注册/注销参与者。

```java
import java.util.concurrent.Phaser;

public class PhaserDemo {
    public static void main(String[] args) {
        // 3 个参与者
        Phaser phaser = new Phaser(3);

        for (int i = 0; i < 3; i++) {
            final int index = i;
            new Thread(() -> {
                // 阶段1：初始化
                System.out.println("线程" + index + " 完成初始化");
                phaser.arriveAndAwaitAdvance(); // 到达并等待

                // 阶段2：数据处理
                System.out.println("线程" + index + " 完成数据处理");
                phaser.arriveAndAwaitAdvance(); // 到达并等待

                // 阶段3：结果汇总
                System.out.println("线程" + index + " 完成结果汇总");
                phaser.arriveAndDeregister(); // 到达并注销
            }).start();
        }
    }
}
```

```
Phaser 阶段示意图：
  Phase 0: [线程0到达] [线程1到达] [线程2到达] → 全部到达 → 进入 Phase 1
  Phase 1: [线程0到达] [线程1到达] [线程2到达] → 全部到达 → 进入 Phase 2
  Phase 2: [线程0注销] [线程1注销] [线程2注销] → 参与者数为0，终止
```

---

## 七、线程池（重点！面试最高频）

### 7.1 为什么要用线程池

```
不使用线程池的问题：
  每次请求创建新线程 → 创建/销毁开销大
  无限制创建线程    → OOM（OutOfMemoryError）
  无法管理线程      → 无法控制并发数

使用线程池的好处：
  1. 线程复用：减少创建/销毁开销
  2. 控制并发数：防止资源耗尽
  3. 统一管理：提供线程生命周期管理
  4. 任务排队：超出处理能力的任务可以排队等待
```

### 7.2 ThreadPoolExecutor 7 大参数详解

```java
public ThreadPoolExecutor(
    int corePoolSize,          // 核心线程数
    int maximumPoolSize,       // 最大线程数
    long keepAliveTime,        // 非核心线程空闲存活时间
    TimeUnit unit,             // 存活时间单位
    BlockingQueue<Runnable> workQueue,  // 任务队列
    ThreadFactory threadFactory,        // 线程工厂
    RejectedExecutionHandler handler    // 拒绝策略
)
```

**参数详解：**

```java
import java.util.concurrent.*;

public class ThreadPoolParamsDemo {
    public static void main(String[] args) {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            // 1. corePoolSize（核心线程数）
            // 即使空闲也不会被回收（除非设置 allowCoreThreadTimeOut）
            2,

            // 2. maximumPoolSize（最大线程数）
            // 包含核心线程数，maximumPoolSize >= corePoolSize
            4,

            // 3. keepAliveTime（非核心线程空闲存活时间）
            // 超过此时间的非核心线程会被回收
            60L,

            // 4. unit（时间单位）
            TimeUnit.SECONDS,

            // 5. workQueue（任务队列）
            // 常用队列：
            //   ArrayBlockingQueue     → 有界队列，FIFO
            //   LinkedBlockingQueue    → 可选有界/无界（默认Integer.MAX_VALUE）
            //   SynchronousQueue       → 不存储任务，直接交给线程（无容量）
            //   PriorityBlockingQueue  → 优先级队列
            new ArrayBlockingQueue<>(10),

            // 6. threadFactory（线程工厂）
            // 自定义线程名、优先级、是否为守护线程等
            new ThreadFactory() {
                private int count = 0;
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "my-pool-thread-" + count++);
                    t.setDaemon(false); // 非守护线程
                    return t;
                }
            },

            // 7. handler（拒绝策略）
            // 当队列满且线程数达到 maximumPoolSize 时触发
            new ThreadPoolExecutor.AbortPolicy() // 默认：抛出 RejectedExecutionException
        );
    }
}
```

### 7.3 线程池工作流程

```
任务提交流程（重要！面试必问）：

  提交任务
     │
     ▼
  当前线程数 < corePoolSize ?
     │
     ├── 是 → 创建核心线程执行任务
     │
     └── 否 → 队列未满 ?
                │
                ├── 是 → 任务加入队列等待
                │         （注意：此时不会创建新线程！）
                │
                └── 否 → 当前线程数 < maximumPoolSize ?
                           │
                           ├── 是 → 创建非核心线程执行任务
                           │
                           └── 否 → 执行拒绝策略
```

```java
import java.util.concurrent.*;

public class ThreadPoolWorkflowDemo {
    public static void main(String[] args) {
        // 核心线程2，最大线程4，队列容量2
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(2),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        // 提交 7 个任务，观察线程池行为：
        // 任务1 → 核心线程1执行
        // 任务2 → 核心线程2执行
        // 任务3 → 加入队列（队列：[任务3]）
        // 任务4 → 加入队列（队列：[任务3, 任务4]，队列满）
        // 任务5 → 创建非核心线程3执行
        // 任务6 → 创建非核心线程4执行（达到最大线程数）
        // 任务7 → 触发拒绝策略（CallerRunsPolicy：由提交任务的线程执行）

        for (int i = 1; i <= 7; i++) {
            final int taskId = i;
            executor.execute(() -> {
                System.out.println("任务" + taskId + " 由 " +
                    Thread.currentThread().getName() + " 执行");
                try { Thread.sleep(2000); } catch (Exception e) {}
            });
        }

        executor.shutdown();
    }
}
```

### 7.4 线程池状态

```
线程池 5 种状态（runState）：

  RUNNING    → SHUTDOWN    → STOP    → TIDYING    → TERMINATED
  (运行中)      (关闭中)      (停止)     (整理中)      (终止)

  RUNNING：
    - 接受新任务，处理队列中的任务
    - 初始状态

  SHUTDOWN：
    - 不接受新任务，但处理队列中的任务
    - 调用 shutdown() 进入此状态

  STOP：
    - 不接受新任务，不处理队列中的任务
    - 中断正在执行的任务
    - 调用 shutdownNow() 进入此状态

  TIDYING：
    - 所有任务已终止，线程数为 0
    - 会执行 terminated() 钩子方法

  TERMINATED：
    - terminated() 方法执行完毕
    - 线程池彻底终止
```

```java
// 查看线程池状态
int state = executor.shutdownNow().size(); // 返回未执行的任务列表
// executor.isShutdown()  // 是否已调用 shutdown
// executor.isTerminated() // 是否已完全终止
// executor.awaitTermination(60, TimeUnit.SECONDS) // 等待终止
```

### 7.5 如何合理设置线程池参数

```java
public class ThreadPoolConfig {
    // ========== CPU 密集型任务 ==========
    // 特点：CPU 一直满负荷运算，很少等待
    // 线程数 = CPU 核心数 + 1
    // 原因：过多的线程会导致频繁的上下文切换，反而降低效率
    static ThreadPoolExecutor cpuIntensivePool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores + 1,           // 核心线程数
            cpuCores + 1,           // 最大线程数（不需要非核心线程）
            0L, TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<>(1000) // 有界队列
        );
    }

    // ========== IO 密集型任务 ==========
    // 特点：大部分时间在等待 IO（网络请求、文件读写、数据库查询）
    // 线程数 = CPU 核心数 * 2（或更多）
    // 原因：线程在等待 IO 时不占用 CPU，可以多创建一些线程
    static ThreadPoolExecutor ioIntensivePool() {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores * 2,           // 核心线程数
            cpuCores * 4,           // 最大线程数
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(1000)
        );
    }

    // ========== 混合型任务 ==========
    // 拆分为 CPU 密集型和 IO 密集型，分别用不同的线程池处理
    // 这是生产环境的推荐做法
}
```

**实际生产环境配置建议：**

```java
// 生产环境线程池配置模板
public class ProductionThreadPool {
    // IO 密集型线程池（用于 HTTP 请求、数据库查询等）
    public static ThreadPoolExecutor createIoPool(String namePrefix) {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores * 2,
            cpuCores * 4,
            60L, TimeUnit.SECONDS,
            new LinkedBlockingQueue<>(5000),
            new NamedThreadFactory(namePrefix),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );
    }

    // CPU 密集型线程池（用于计算、加密、压缩等）
    public static ThreadPoolExecutor createCpuPool(String namePrefix) {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        return new ThreadPoolExecutor(
            cpuCores + 1,
            cpuCores + 1,
            0L, TimeUnit.MILLISECONDS,
            new LinkedBlockingQueue<>(1000),
            new NamedThreadFactory(namePrefix),
            new ThreadPoolExecutor.AbortPolicy()
        );
    }

    static class NamedThreadFactory implements ThreadFactory {
        private final AtomicInteger count = new AtomicInteger(0);
        private final String prefix;

        NamedThreadFactory(String prefix) {
            this.prefix = prefix;
        }

        @Override
        public Thread newThread(Runnable r) {
            Thread t = new Thread(r, prefix + "-" + count.getAndIncrement());
            t.setDaemon(false);
            t.setUncaughtExceptionHandler((thread, e) -> {
                System.err.println("线程 " + thread.getName() + " 异常: " + e.getMessage());
            });
            return t;
        }
    }
}
```

### 7.6 Executors 工具类（为什么禁止使用）

```java
// ========== 禁止使用 Executors 的原因 ==========

// 1. newFixedThreadPool / newSingleThreadExecutor
//    使用 LinkedBlockingQueue，默认容量 Integer.MAX_VALUE
//    → 任务堆积可能导致 OOM
ExecutorService fixedPool = Executors.newFixedThreadPool(10);
// 等价于：
// new ThreadPoolExecutor(10, 10, 0L, TimeUnit.MILLISECONDS,
//     new LinkedBlockingQueue<Runnable>())  // 无界队列！

// 2. newCachedThreadPool
//    maximumPoolSize = Integer.MAX_VALUE
//    → 高并发时可能创建大量线程，导致 OOM
ExecutorService cachedPool = Executors.newCachedThreadPool();
// 等价于：
// new ThreadPoolExecutor(0, Integer.MAX_VALUE, 60L, TimeUnit.SECONDS,
//     new SynchronousQueue<Runnable>())  // 最大线程数无上限！

// 3. newScheduledThreadPool
//    同样使用 Integer.MAX_VALUE 作为 maximumPoolSize
ExecutorService scheduledPool = Executors.newScheduledThreadPool(10);
```

> **阿里巴巴 Java 开发手册明确禁止使用 Executors 创建线程池，必须通过 ThreadPoolExecutor 构造函数手动配置参数。**

### 7.7 四种拒绝策略

```java
import java.util.concurrent.*;

public class RejectionPolicyDemo {
    public static void main(String[] args) {
        // 核心线程1，最大线程1，队列容量1
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            1, 1, 0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(1)
        );

        // ========== 1. AbortPolicy（默认）==========
        // 抛出 RejectedExecutionException
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.AbortPolicy());

        // ========== 2. CallerRunsPolicy ==========
        // 由提交任务的线程（调用者）自己执行该任务
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // ========== 3. DiscardPolicy ==========
        // 静默丢弃任务，不抛异常
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());

        // ========== 4. DiscardOldestPolicy ==========
        // 丢弃队列中最老的任务，然后重新尝试提交当前任务
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardOldestPolicy());

        // ========== 5. 自定义拒绝策略 ==========
        executor.setRejectedExecutionHandler((r, e) -> {
            System.err.println("任务被拒绝: " + r.toString());
            // 可以记录日志、持久化任务、发送告警等
            // r.run(); // 也可以让调用者执行
        });

        // 提交 3 个任务（核心1 + 队列1 = 只能处理2个，第3个触发拒绝策略）
        executor.execute(() -> System.out.println("任务1"));
        executor.execute(() -> System.out.println("任务2"));
        executor.execute(() -> System.out.println("任务3（触发拒绝策略）"));

        executor.shutdown();
    }
}
```

### 7.8 线程池监控

```java
import java.util.concurrent.*;

public class ThreadPoolMonitorDemo {
    public static void main(String[] args) throws Exception {
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 4, 60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(10)
        );

        // 提交一些任务
        for (int i = 0; i < 15; i++) {
            executor.execute(() -> {
                try { Thread.sleep(2000); } catch (Exception e) {}
            });
        }

        // 监控线程池状态
        monitor(executor);

        executor.shutdown();
    }

    static void monitor(ThreadPoolExecutor executor) {
        System.out.println("========== 线程池监控 ==========");
        System.out.println("核心线程数: " + executor.getCorePoolSize());
        System.out.println("当前线程数: " + executor.getPoolSize());
        System.out.println("活跃线程数: " + executor.getActiveCount());
        System.out.println("历史最大线程数: " + executor.getLargestPoolSize());
        System.out.println("队列中任务数: " + executor.getQueue().size());
        System.out.println("队列剩余容量: " + executor.getQueue().remainingCapacity());
        System.out.println("已完成任务数: " + executor.getCompletedTaskCount());
        System.out.println("总提交任务数: " + executor.getTaskCount());
        System.out.println("线程池状态: " + executor.isShutdown() + " / " + executor.isTerminated());
    }
}
```

### 7.9 ForkJoinPool（工作窃取算法）

```java
import java.util.concurrent.*;
import java.util.stream.*;

public class ForkJoinPoolDemo {
    // 使用 ForkJoinPool 计算 1 到 N 的和
    static class SumTask extends RecursiveTask<Long> {
        private final long start;
        private final long end;
        private static final long THRESHOLD = 10_000; // 任务拆分阈值

        SumTask(long start, long end) {
            this.start = start;
            this.end = end;
        }

        @Override
        protected Long compute() {
            if (end - start <= THRESHOLD) {
                // 任务足够小，直接计算
                long sum = 0;
                for (long i = start; i <= end; i++) {
                    sum += i;
                }
                return sum;
            }

            // 任务太大，拆分为两个子任务
            long mid = (start + end) / 2;
            SumTask left = new SumTask(start, mid);
            SumTask right = new SumTask(mid + 1, end);

            left.fork();  // 异步执行左半部分
            return right.compute() + left.join(); // 右半部分当前线程执行，等待左半部分结果
        }
    }

    public static void main(String[] args) throws Exception {
        ForkJoinPool pool = new ForkJoinPool();
        SumTask task = new SumTask(1, 100_000_000);
        long result = pool.invoke(task);
        System.out.println("计算结果: " + result); // 5000000050000000

        // JDK 8 并行流底层使用 ForkJoinPool
        long parallelResult = LongStream.rangeClosed(1, 100_000_000)
            .parallel()
            .sum();
        System.out.println("并行流结果: " + parallelResult);
    }
}
```

```
工作窃取算法（Work Stealing）：
┌──────────────────────────────────────────────┐
│              ForkJoinPool                     │
│                                              │
│  Thread-1 的双端队列     Thread-2 的双端队列  │
│  ┌───────────────┐      ┌───────────────┐   │
│  │ Task7 (top)   │      │ (空)          │   │
│  │ Task5         │      │               │   │
│  │ Task3         │      │               │   │
│  │ Task1 (bottom)│      │               │   │
│  └───────────────┘      └───────────────┘   │
│       ↑ steal from                          │
│       │ top                                 │
│  Thread-2 从 Thread-1 的队列顶部"窃取"任务    │
└──────────────────────────────────────────────┘

特点：
- 每个工作线程有自己的双端队列（Deque）
- 从队列头部取任务执行
- 空闲线程从其他线程的队列尾部"窃取"任务
- 减少线程竞争，提高 CPU 利用率
```

---

## 八、并发集合

### 8.1 ConcurrentHashMap

#### JDK 7：Segment 分段锁

```
JDK 7 ConcurrentHashMap 结构：
┌─────────────────────────────────────────────┐
│          ConcurrentHashMap                  │
├─────────────────────────────────────────────┤
│  Segment[0]  Segment[1]  Segment[2]  ...    │
│  (ReentrantLock) (ReentrantLock)            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │HashEntry│ │HashEntry│ │HashEntry│      │
│  │  链表   │ │  链表   │ │  链表   │      │
│  └─────────┘ └─────────┘ └─────────┘      │
└─────────────────────────────────────────────┘

- 默认 16 个 Segment
- 每个 Segment 是一个 HashMap（数组 + 链表）
- 每个 Segment 有独立的 ReentrantLock
- 并发度 = Segment 数量（默认16）
- 缺点：锁粒度仍然较粗
```

#### JDK 8：CAS + synchronized

```java
import java.util.concurrent.ConcurrentHashMap;

public class ConcurrentHashMapDemo {
    public static void main(String[] args) {
        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();

        // 基本操作
        map.put("key1", "value1");
        map.putIfAbsent("key2", "value2"); // 不存在才放入
        map.get("key1");
        map.remove("key1");
        map.replace("key2", "value2", "newValue"); // CAS 替换

        // 原子操作（JDK 8+）
        map.computeIfAbsent("key3", k -> "computed-" + k);
        map.computeIfPresent("key3", (k, v) -> v + "-updated");
        map.merge("key3", "suffix", (oldVal, newVal) -> oldVal + newVal);

        // size() 的优化
        // JDK 7：遍历所有 Segment 的 count 求和
        // JDK 8：使用 baseCount + CounterCell 数组（类似 LongAdder）
        int size = map.size();
    }
}
```

```
JDK 8 ConcurrentHashMap 结构：
┌─────────────────────────────────────────────┐
│          ConcurrentHashMap (JDK 8)          │
├─────────────────────────────────────────────┤
│  Node[] table（数组）                        │
│  ┌─────┬─────┬─────┬─────┬─────┐           │
│  │Node │Node │Node │Node │Node │           │
│  │  ↓  │     │  ↓  │     │     │           │
│  │Node │     │Node │     │     │           │
│  │  ↓  │     │     │     │     │           │
│  │Tree │     │     │     │     │           │
│  │(红黑树)│     │     │     │     │           │
│  └─────┴─────┴─────┴─────┴─────┘           │
└─────────────────────────────────────────────┘

锁粒度：从 Segment（段）→ Node（节点）
- 链表长度 < 8：链表 + synchronized 头节点
- 链表长度 >= 8：转为红黑树
- 空的 bin 用 CAS 插入
- 非空的 bin 用 synchronized 锁头节点

put 流程：
1. 计算 hash 值
2. 如果 table 未初始化，CAS 初始化
3. 如果 bin 为空，CAS 插入新节点
4. 如果 bin 不为空，synchronized 锁住头节点
   - 链表：遍历插入/更新
   - 红黑树：TreeNode 插入/更新
5. 如果链表长度 >= 8，转为红黑树
6. addCount()：检查是否需要扩容
```

### 8.2 CopyOnWriteArrayList

读写分离：读操作无锁，写操作时复制整个数组。

```java
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Iterator;

public class CopyOnWriteArrayListDemo {
    public static void main(String[] args) {
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

        // 写操作：加锁 + 复制数组
        list.add("element1"); // 内部：复制原数组 → 新数组末尾添加 → 替换引用
        list.add("element2");
        list.remove("element1");

        // 读操作：无锁，直接读数组
        String value = list.get(0);

        // 迭代器：基于快照，不会抛出 ConcurrentModificationException
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            System.out.println(it.next()); // 迭代的是创建迭代器时的快照
        }
    }
}
```

```
CopyOnWriteArrayList 原理：
┌──────────────────────────────────────────┐
│  写操作（add）：                          │
│                                          │
│  1. 加锁（ReentrantLock）                │
│  2. 复制原数组 → 新数组                   │
│  3. 在新数组上修改                        │
│  4. 将引用指向新数组                      │
│  5. 释放锁                               │
│                                          │
│  读操作（get）：                          │
│                                          │
│  直接读取当前数组引用，无锁               │
│  （可能读到旧数据，但保证最终一致性）       │
└──────────────────────────────────────────┘

适用场景：读多写少（如白名单、配置列表）
不适用场景：写多读少（每次写都复制数组，开销大）
```

### 8.3 ConcurrentLinkedQueue

无锁并发队列，基于 CAS 实现。

```java
import java.util.concurrent.ConcurrentLinkedQueue;

public class ConcurrentLinkedQueueDemo {
    public static void main(String[] args) {
        ConcurrentLinkedQueue<String> queue = new ConcurrentLinkedQueue<>();

        // 入队（非阻塞）
        queue.offer("element1"); // 返回 true/false
        queue.add("element2");   // 等价于 offer，但失败时抛异常

        // 出队（非阻塞）
        String elem = queue.poll(); // 返回头部元素并移除，队列为空返回 null
        String peek = queue.peek(); // 返回头部元素但不移除

        // 判断是否为空
        boolean empty = queue.isEmpty();

        // 遍历
        for (String s : queue) {
            System.out.println(s);
        }
    }
}
```

### 8.4 BlockingQueue

阻塞队列，常用于生产者-消费者模式。

```java
import java.util.concurrent.*;

public class BlockingQueueDemo {
    public static void main(String[] args) throws Exception {
        // ========== ArrayBlockingQueue（有界、数组、FIFO）==========
        BlockingQueue<String> arrayQueue = new ArrayBlockingQueue<>(3);
        arrayQueue.put("a");   // 队列满时阻塞
        arrayQueue.offer("b"); // 队列满时返回 false
        arrayQueue.offer("c", 5, TimeUnit.SECONDS); // 带超时的 offer

        String take = arrayQueue.take(); // 队列空时阻塞
        String poll = arrayQueue.poll(5, TimeUnit.SECONDS); // 带超时的 poll

        // ========== LinkedBlockingQueue（可选有界/无界）==========
        // 默认容量 Integer.MAX_VALUE（注意 OOM 风险）
        BlockingQueue<String> linkedQueue = new LinkedBlockingQueue<>(100);

        // ========== SynchronousQueue（零容量）==========
        // 不存储元素，每个 put 必须等待一个 take
        BlockingQueue<String> syncQueue = new SynchronousQueue<>();
        // syncQueue.put("a"); // 阻塞，直到有线程 take
        // syncQueue.take();   // 阻塞，直到有线程 put

        // ========== 生产者-消费者模式 ==========
        BlockingQueue<String> taskQueue = new ArrayBlockingQueue<>(10);

        // 生产者
        new Thread(() -> {
            try {
                for (int i = 0; i < 20; i++) {
                    taskQueue.put("task-" + i);
                    System.out.println("生产: task-" + i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();

        // 消费者
        new Thread(() -> {
            try {
                for (int i = 0; i < 20; i++) {
                    String task = taskQueue.take();
                    System.out.println("消费: " + task);
                    Thread.sleep(200);
                }
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}
```

**BlockingQueue 四组 API：**

| 方法 | 抛异常 | 返回布尔值 | 阻塞 | 超时 |
|------|--------|-----------|------|------|
| 添加 | add() | offer() | put() | offer(time) |
| 移除 | remove() | poll() | take() | poll(time) |
| 检查 | element() | peek() | - | - |

---

## 九、ThreadLocal

### 9.1 ThreadLocal 原理

```java
public class ThreadLocalDemo {
    // 每个 ThreadLocal 对象作为 key，存储在每个线程的 ThreadLocalMap 中
    private static ThreadLocal<Integer> threadLocal = ThreadLocal.withInitial(() -> 0);

    public static void main(String[] args) {
        // 每个线程操作的是自己的副本，互不影响
        new Thread(() -> {
            threadLocal.set(100);
            System.out.println("Thread-A: " + threadLocal.get()); // 100
            threadLocal.remove(); // 用完必须清理！
        }).start();

        new Thread(() -> {
            threadLocal.set(200);
            System.out.println("Thread-B: " + threadLocal.get()); // 200
            threadLocal.remove();
        }).start();
    }
}
```

```
ThreadLocal 内部结构（JDK 8）：

Thread 对象
├── ThreadLocalMap（每个线程一个）
│     ├── Entry[0]  → key: ThreadLocalA (弱引用)  → value: ObjectA (强引用)
│     ├── Entry[1]  → key: ThreadLocalB (弱引用)  → value: ObjectB (强引用)
│     └── Entry[n]  → key: ThreadLocalC (弱引用)  → value: ObjectC (强引用)
│
│  Entry 继承 WeakReference<ThreadLocal<?>>
│  ┌──────────────────────────────────┐
│  │ Entry extends WeakReference      │
│  │   ┌──────────┐  ┌────────────┐  │
│  │   │ key (弱引用)│  │ value (强引用)│  │
│  │   │ ThreadLocal│  │  Object    │  │
│  │   └──────────┘  └────────────┘  │
│  └──────────────────────────────────┘

get() 流程：
1. 获取当前线程
2. 获取当前线程的 ThreadLocalMap
3. 以 ThreadLocal 对象为 key，从 Map 中查找 Entry
4. 返回 Entry 的 value

set() 流程：
1. 获取当前线程的 ThreadLocalMap
2. 以 ThreadLocal 对象为 key，存入 Map
```

### 9.2 内存泄漏问题

```
内存泄漏场景：

  栈                    堆
  ┌──────────┐          ┌──────────────────────┐
  │ ThreadRef│─────────→│ Thread 对象           │
  └──────────┘          │  └── ThreadLocalMap   │
                        │       ├── Entry0       │
  ┌──────────┐          │       │  key → null    │ ← ThreadLocal 被回收（弱引用）
  │ TL Ref   │    ╳     │       │  value → Object│ ← value 仍然存在！（强引用）
  └──────────┘          │       └── Entry1       │
  (ThreadLocal 被回收)   │          ...          │
                        └──────────────────────┘

  ThreadLocal 对象被 GC 回收 → key 变为 null
  但 value 仍然被 ThreadLocalMap.Entry 强引用 → 无法回收
  如果线程长期存活（如线程池中的线程）→ value 越积越多 → 内存泄漏

JDK 8 的缓解措施：
  - ThreadLocal.get()/set() 时会清理 key 为 null 的 Entry
  - 但不是每次都清理（探测式清理 + 启发式清理）
  - 仍然建议手动调用 remove()
```

```java
public class ThreadLocalLeakDemo {
    private static ThreadLocal<byte[]> threadLocal = new ThreadLocal<>();

    public static void main(String[] args) {
        // 线程池中的线程是复用的，ThreadLocal 用完不清理会导致内存泄漏
        ExecutorService executor = Executors.newFixedThreadPool(2);

        for (int i = 0; i < 10; i++) {
            final int index = i;
            executor.execute(() -> {
                // 每次任务设置一个大对象
                threadLocal.set(new byte[1024 * 1024]); // 1MB
                try {
                    System.out.println("任务" + index + " 处理中");
                } finally {
                    // 正确做法：finally 中调用 remove()
                    threadLocal.remove();
                }
            });
        }

        executor.shutdown();
    }
}
```

### 9.3 如何正确使用 ThreadLocal

```java
public class ThreadLocalBestPractice {
    // 1. 使用 static final 修饰（避免重复创建 ThreadLocal 对象）
    private static final ThreadLocal<SimpleDateFormat> dateFormatHolder =
        ThreadLocal.withInitial(() -> new SimpleDateFormat("yyyy-MM-dd HH:mm:ss"));

    // 2. 使用 try-finally 确保清理
    public String formatDate(Date date) {
        SimpleDateFormat sdf = dateFormatHolder.get();
        try {
            return sdf.format(date);
        } finally {
            // 注意：这里不需要 remove()，因为 ThreadLocal 是复用的
            // 只有当 value 是大对象或任务级数据时才需要 remove()
        }
    }

    // 3. 任务级数据：必须在 finally 中 remove()
    private static final ThreadLocal<UserContext> userContext = new ThreadLocal<>();

    public void processRequest() {
        userContext.set(new UserContext("userId-123"));
        try {
            // 业务逻辑
            doBusiness();
        } finally {
            userContext.remove(); // 必须清理！
        }
    }

    static class UserContext {
        String userId;
        UserContext(String userId) { this.userId = userId; }
    }
}
```

### 9.4 InheritableThreadLocal（父子线程传递）

```java
import java.util.concurrent.*;

public class InheritableThreadLocalDemo {
    // InheritableThreadLocal：子线程自动继承父线程的 ThreadLocal 值
    private static ThreadLocal<String> threadLocal = new ThreadLocal<>();
    private static ThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();

    public static void main(String[] args) {
        threadLocal.set("parent-value");
        inheritableThreadLocal.set("parent-inheritable-value");

        new Thread(() -> {
            System.out.println("ThreadLocal: " + threadLocal.get());           // null
            System.out.println("InheritableThreadLocal: " + inheritableThreadLocal.get()); // parent-inheritable-value
        }).start();

        // 线程池场景的问题：
        // 线程池中的线程是复用的，InheritableThreadLocal 只在创建线程时继承一次
        // 后续提交的任务不会重新继承父线程的值
        // 解决方案：使用 Alibaba 开源的 TransmittableThreadLocal（TTL）
    }
}
```

```
InheritableThreadLocal 继承时机：
  父线程创建子线程时（Thread 构造函数中）：
  if (parent.inheritableThreadLocals != null)
      this.inheritableThreadLocals =
          ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);

  注意：是复制引用，不是深拷贝！
  如果 value 是可变对象，父子线程共享同一个对象
```

---

## 十、并发面试高频问题汇总

### 10.1 synchronized vs ReentrantLock

| 对比项 | synchronized | ReentrantLock |
|--------|-------------|---------------|
| 锁类型 | 隐式锁（JVM 层面） | 显式锁（API 层面） |
| 使用方式 | 关键字修饰 | lock()/unlock() 方法 |
| 可中断 | 不可中断 | lockInterruptibly() 可中断 |
| 超时获取 | 不支持 | tryLock(timeout) |
| 公平锁 | 只支持非公平 | 支持公平/非公平 |
| 条件变量 | 单一等待队列 | 多个 Condition |
| 锁释放 | 自动（作用域结束） | 必须手动 unlock()（finally 中） |
| 性能 | JDK 6 优化后差距不大 | 略优（竞争激烈时） |
| 底层实现 | 对象头 + Monitor | AQS（CAS + CLH 队列） |

```java
// 面试回答模板：
// 1. synchronized 是 JVM 层面的锁，ReentrantLock 是 API 层面的锁
// 2. synchronized 自动释放锁，ReentrantLock 需要手动释放（更灵活但也更容易出错）
// 3. ReentrantLock 支持可中断锁、超时锁、公平锁、多条件变量
// 4. JDK 6 之后 synchronized 做了大量优化（偏向锁、轻量级锁、自旋锁），性能差距不大
// 5. 生产环境优先使用 synchronized（简单不易出错），需要高级特性时使用 ReentrantLock
```

### 10.2 volatile 的作用

```java
// 面试回答模板：
// 1. 保证可见性：一个线程修改 volatile 变量，其他线程立即看到最新值
//    原理：使用内存屏障（Memory Barrier），写操作强制刷新到主内存，读操作强制从主内存读取
// 2. 禁止指令重排序：编译器和 CPU 不会对 volatile 变量前后的指令进行重排序
//    原理：插入 StoreStore、StoreLoad、LoadLoad、LoadStore 四种内存屏障
// 3. 不保证原子性：volatile int i; i++ 仍然不是线程安全的
// 4. 典型使用场景：
//    - 状态标志位（boolean running）
//    - DCL 双重检查锁定单例模式
//    - 简单的读写场景（一写多读）
```

### 10.3 CAS 原理及 ABA 问题

```java
// 面试回答模板：
// CAS（Compare-And-Swap）：
// 1. CAS 是一种无锁算法，通过 CPU 指令原子地完成"比较并交换"
// 2. CAS(V, Expected, New)：如果 V == Expected，则 V = New，否则重试
// 3. 底层依赖 Unsafe 类的 native 方法，最终调用 CPU 的 cmpxchg 指令
// 4. ABA 问题：值从 A→B→A，CAS 检查时以为没变过
//    解决方案：AtomicStampedReference（带版本号的 CAS）
// 5. CAS 的缺点：
//    - 自旋开销：竞争激烈时大量 CAS 失败重试，消耗 CPU
//    - 只能保证单个变量的原子操作（多变量需要锁）
//    - ABA 问题
```

### 10.4 AQS 原理

```java
// 面试回答模板：
// AQS（AbstractQueuedSynchronizer）是 JUC 包中锁和同步器的基础框架
//
// 核心设计：
// 1. state 变量（volatile int）：表示同步状态
//    - ReentrantLock：state 表示重入次数
//    - CountDownLatch：state 表示倒计时数
//    - Semaphore：state 表示许可证数量
//
// 2. CLH 双向队列：用于存储等待获取锁的线程
//    - Head 节点：当前持有锁的线程（或空）
//    - Tail 节点：最新加入等待的线程
//    - Node 的 waitStatus：SIGNAL、CANCELLED、CONDITION、PROPAGATE
//
// 3. 两种模式：
//    - 独占模式（Exclusive）：同一时刻只有一个线程能获取（ReentrantLock）
//    - 共享模式（Shared）：多个线程可以同时获取（Semaphore、CountDownLatch）
//
// 4. 模板方法模式：
//    - 子类实现 tryAcquire/tryRelease（独占）
//    - 子类实现 tryAcquireShared/tryReleaseShared（共享）
//    - AQS 负责排队、唤醒、中断等通用逻辑
//
// 基于 AQS 实现的组件：
// ReentrantLock、ReentrantReadWriteLock、CountDownLatch、Semaphore、
// CyclicBarrier（内部用 ReentrantLock）、FutureTask
```

### 10.5 线程池参数及工作流程

```java
// 面试回答模板：
// 7 大参数：
// corePoolSize（核心线程数）、maximumPoolSize（最大线程数）、
// keepAliveTime（非核心线程空闲时间）、unit（时间单位）、
// workQueue（任务队列）、threadFactory（线程工厂）、handler（拒绝策略）
//
// 工作流程：
// 1. 提交任务时，如果当前线程数 < corePoolSize → 创建核心线程执行
// 2. 如果当前线程数 >= corePoolSize → 任务加入 workQueue
// 3. 如果 workQueue 已满 → 创建非核心线程执行
// 4. 如果线程数达到 maximumPoolSize → 执行拒绝策略
//
// 注意：核心线程数满了之后，先入队列，队列满了才创建非核心线程
// 这是面试最容易答错的点！
//
// 线程池参数设置：
// CPU 密集型：corePoolSize = CPU 核心数 + 1
// IO 密集型：corePoolSize = CPU 核心数 * 2（或更多）
//
// 为什么禁止 Executors？
// - newFixedThreadPool：LinkedBlockingQueue 默认 Integer.MAX_VALUE → OOM
// - newCachedThreadPool：maximumPoolSize = Integer.MAX_VALUE → OOM
// - newSingleThreadExecutor：同 newFixedThreadPool
```

### 10.6 线程池拒绝策略

```java
// 面试回答模板：
// 4 种拒绝策略（当队列满且线程数达到 maximumPoolSize 时触发）：
//
// 1. AbortPolicy（默认）：抛出 RejectedExecutionException
//    - 最严格的策略，让调用者感知到任务被拒绝
//
// 2. CallerRunsPolicy：由提交任务的线程（调用者）自己执行该任务
//    - 不会丢弃任务，但会降低提交速度（起到限流作用）
//    - 生产环境常用
//
// 3. DiscardPolicy：静默丢弃任务，不抛异常
//    - 适用于可以容忍丢失的场景（如日志记录）
//
// 4. DiscardOldestPolicy：丢弃队列中最老的任务，重新提交当前任务
//    - 适用于优先处理最新任务的场景
//
// 生产环境推荐：CallerRunsPolicy + 自定义告警日志
```

### 10.7 ThreadLocal 内存泄漏

```java
// 面试回答模板：
// 1. ThreadLocalMap 的 key 是 ThreadLocal 对象的弱引用
//    - ThreadLocal 对象被 GC 回收后，key 变为 null
//    - 但 value 是强引用，不会被回收
//
// 2. 如果线程长期存活（如线程池中的线程）：
//    - key 为 null 的 Entry 不会被自动清理
//    - value 越积越多 → 内存泄漏
//
// 3. JDK 8 的缓解措施：
//    - get()/set()/remove() 时会探测清理 key 为 null 的 Entry
//    - 但不是每次都清理，且如果不再调用这些方法就无法清理
//
// 4. 解决方案：
//    - 每次 use 完 ThreadLocal 后，在 finally 中调用 remove()
//    - 线程池中使用 ThreadLocal 必须手动清理
//
// 5. 为什么 key 用弱引用？
//    - 如果 key 用强引用，ThreadLocal 对象永远无法被回收（Thread 持有 ThreadLocalMap → ThreadLocalMap 持有 Entry → Entry 持有 key）
//    - 弱引用至少可以让 ThreadLocal 对象被回收，只是 value 可能泄漏
//    - value 的清理需要开发者主动 remove()
```

### 10.8 死锁及避免

```java
import java.util.concurrent.locks.*;

public class DeadlockDemo {
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();

    public static void main(String[] args) {
        // 死锁场景：线程1持有A等待B，线程2持有B等待A
        Thread t1 = new Thread(() -> {
            synchronized (lockA) {
                System.out.println("线程1 获取锁A");
                try { Thread.sleep(100); } catch (Exception e) {}
                synchronized (lockB) { // 等待锁B
                    System.out.println("线程1 获取锁B");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lockB) {
                System.out.println("线程2 获取锁B");
                try { Thread.sleep(100); } catch (Exception e) {}
                synchronized (lockA) { // 等待锁A
                    System.out.println("线程2 获取锁A");
                }
            }
        });

        t1.start();
        t2.start();
    }
}
```

**死锁的四个必要条件：**

```
1. 互斥条件：一个资源每次只能被一个线程使用
2. 请求与保持条件：一个线程因请求资源而阻塞时，对已获得的资源保持不放
3. 不剥夺条件：线程已获得的资源，在未使用完之前不能被强行剥夺
4. 循环等待条件：若干线程之间形成一种头尾相接的循环等待资源关系
```

**避免死锁的策略：**

```java
public class DeadlockPrevention {
    // 策略1：固定加锁顺序（破坏循环等待条件）
    private static final Object lockA = new Object();
    private static final Object lockB = new Object();

    // 所有线程都按 A→B 的顺序获取锁
    public void method1() {
        synchronized (lockA) {
            synchronized (lockB) {
                // 安全：始终先获取 A 再获取 B
            }
        }
    }

    public void method2() {
        synchronized (lockA) { // 注意：也是先获取 A
            synchronized (lockB) {
                // 安全
            }
        }
    }

    // 策略2：使用 tryLock 带超时（破坏请求与保持条件）
    private final ReentrantLock lock1 = new ReentrantLock();
    private final ReentrantLock lock2 = new ReentrantLock();

    public void transfer() throws InterruptedException {
        while (true) {
            if (lock1.tryLock(100, TimeUnit.MILLISECONDS)) {
                try {
                    if (lock2.tryLock(100, TimeUnit.MILLISECONDS)) {
                        try {
                            // 两把锁都获取成功
                            return;
                        } finally {
                            lock2.unlock();
                        }
                    }
                } finally {
                    lock1.unlock();
                }
            }
            // 获取失败，重试（可以加入随机退避时间）
            Thread.sleep(50);
        }
    }

    // 策略3：使用 jstack 或 jconsole 诊断死锁
    // jstack <pid> → 查看线程堆栈，会提示 "Found one Java-level deadlock"
}
```

**死锁诊断命令：**

```bash
# 1. jps 查看 Java 进程 ID
jps -l

# 2. jstack 查看线程堆栈
jstack <pid>

# 3. jconsole 可视化监控
jconsole <pid>

# 4. jvisualvm 更强大的可视化工具
jvisualvm

# 5. JDK 9+ 使用 jcmd
jcmd <pid> Thread.print
```

---

> **总结：** Java 并发编程的核心是理解 **线程安全三要素**（原子性、可见性、有序性）和 **AQS 框架**。synchronized 和 volatile 解决可见性和有序性，锁和 CAS 解决原子性。AQS 是 JUC 的基石，ReentrantLock、CountDownLatch、Semaphore 都基于它实现。线程池是生产环境必备技能，必须掌握参数配置和工作流程。ThreadLocal 要注意内存泄漏，使用后务必 remove()。

---

## 补充知识点

### 补充一、CompletableFuture 异步编程（⭐高频）

CompletableFuture 是 JDK 8 引入的异步编程工具类，支持链式调用、组合和异常处理，是 Java 异步编程的核心类。

#### 1. 创建方式

```java
// 1. supplyAsync：有返回值的异步任务
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    // 默认使用 ForkJoinPool.commonPool()
    return "Hello";
});

// 2. supplyAsync + 自定义线程池
ExecutorService executor = Executors.newFixedThreadPool(10);
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    return "Hello with custom pool";
}, executor);

// 3. runAsync：无返回值的异步任务
CompletableFuture<Void> future3 = CompletableFuture.runAsync(() -> {
    System.out.println("执行异步任务，无返回值");
}, executor);
```

#### 2. 链式调用

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Hello";
})
// thenApply：接收上一步结果，返回新结果（转换操作，有返回值）
.thenApply(s -> s + " World")
// thenCompose：接收上一步结果，返回新的 CompletableFuture（扁平化，用于异步编排）
.thenCompose(s -> CompletableFuture.supplyAsync(() -> s + " from CompletableFuture"))
// thenAccept：接收上一步结果，无返回值（消费操作）
.thenAccept(result -> System.out.println("最终结果: " + result));

future.join(); // 阻塞等待完成
// 输出：最终结果: Hello World from CompletableFuture
```

**thenApply vs thenCompose 的核心区别**：

```java
// thenApply：同步转换，返回 CompletableFuture<U>，U 是转换后的类型
// 类似 Stream 的 map
CompletableFuture<Integer> f1 = CompletableFuture.supplyAsync(() -> "123")
    .thenApply(Integer::parseInt);  // String → Integer

// thenCompose：异步转换，参数函数返回 CompletableFuture<U>，扁平化
// 类似 Stream 的 flatMap
CompletableFuture<Integer> f2 = CompletableFuture.supplyAsync(() -> "123")
    .thenCompose(s -> CompletableFuture.supplyAsync(() -> Integer.parseInt(s)));

// thenRun：不接收参数，不返回结果（在链末尾执行副作用）
CompletableFuture<Void> f3 = CompletableFuture.supplyAsync(() -> "data")
    .thenRun(() -> System.out.println("任务完成，做清理工作"));
```

| 方法 | 是否接收上一步结果 | 是否有返回值 | 用途 |
|------|-------------------|-------------|------|
| `thenApply` | 是 | 是 | 同步转换（类似 map） |
| `thenCompose` | 是 | 是 | 异步编排（类似 flatMap） |
| `thenAccept` | 是 | 否 | 消费结果 |
| `thenRun` | 否 | 否 | 执行副作用 |

#### 3. 异常处理

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) throw new RuntimeException("模拟异常");
    return "success";
})
// exceptionally：捕获异常，返回默认值（类似 catch）
.exceptionally(ex -> {
    System.out.println("异常: " + ex.getMessage());
    return "默认值";
});

System.out.println(future.join()); // 输出：默认值

// handle：无论成功失败都执行，可访问结果和异常
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    if (true) throw new RuntimeException("模拟异常");
    return "success";
})
.handle((result, ex) -> {
    if (ex != null) {
        return "降级结果: " + ex.getMessage();
    }
    return "正常结果: " + result;
});

// whenComplete：与 handle 类似，但返回值不影响链式传递
CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> "success")
    .whenComplete((result, ex) -> {
        if (ex == null) {
            System.out.println("成功: " + result);
        } else {
            System.out.println("失败: " + ex.getMessage());
        }
    });
```

#### 4. 组合多个 CompletableFuture

```java
// allOf：等待所有任务完成
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "任务1");
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "任务2");
CompletableFuture<String> f3 = CompletableFuture.supplyAsync(() -> "任务3");

CompletableFuture<Void> allFutures = CompletableFuture.allOf(f1, f2, f3);
// 获取所有结果
CompletableFuture<List<String>> allResults = allFutures.thenApply(v ->
    Stream.of(f1, f2, f3).map(CompletableFuture::join).collect(Collectors.toList())
);
List<String> results = allResults.join();
System.out.println(results); // [任务1, 任务2, 任务3]

// anyOf：只要有一个完成就返回（返回最先完成的结果）
CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(f1, f2, f3);
Object firstResult = anyFuture.join();
System.out.println("最先完成: " + firstResult);
```

#### 5. 与线程池配合

```java
// 推荐做法：为不同类型的任务使用不同线程池
ExecutorService ioPool = Executors.newFixedThreadPool(10);      // IO 密集型
ExecutorService cpuPool = Executors.newFixedThreadPool(4);       // CPU 密集型

CompletableFuture<String> result = CompletableFuture
    .supplyAsync(() -> queryFromDB(), ioPool)       // IO 操作用 IO 线程池
    .thenApplyAsync(data -> processData(data), cpuPool) // CPU 操作用 CPU 线程池
    .thenApplyAsync(data -> writeToCache(data), ioPool); // IO 操作用 IO 线程池

// 注意：不带 Async 后缀的方法在完成线程中执行
// 带 Async 后缀的方法默认在 ForkJoinPool 中执行
// 带 Async + Executor 参数的方法在指定线程池中执行
```

> ⭐ **面试问答：thenApply vs thenCompose 区别？**
>
> 答：thenApply 类似 Stream 的 map，接收 Function<T, U>，同步转换结果，返回 CompletableFuture<U>。thenCompose 类似 Stream 的 flatMap，接收 Function<T, CompletableFuture<U>>，用于将嵌套的 CompletableFuture 扁平化。当转换操作本身是异步的（返回 CompletableFuture）时，必须用 thenCompose，否则会得到嵌套的 CompletableFuture<CompletableFuture<U>>。简单记忆：转换是同步的用 thenApply，转换是异步的用 thenCompose。

---

### 补充二、Semaphore 信号量（⭐⭐中频）

Semaphore 用于控制同时访问共享资源的线程数量，常用于限流场景。

#### 1. 基本原理

```java
// 创建信号量，指定许可数量
Semaphore semaphore = new Semaphore(3); // 允许3个线程同时访问

// acquire()：获取一个许可（阻塞直到获取成功）
semaphore.acquire();
try {
    // 访问共享资源
} finally {
    semaphore.release(); // 释放许可（必须在 finally 中释放！）
}

// tryAcquire()：尝试获取许可（非阻塞）
if (semaphore.tryAcquire()) {
    try {
        // 获取成功，访问资源
    } finally {
        semaphore.release();
    }
} else {
    // 获取失败，执行降级逻辑
}

// tryAcquire(timeout)：带超时的获取
if (semaphore.tryAcquire(5, TimeUnit.SECONDS)) {
    try {
        // 5秒内获取成功
    } finally {
        semaphore.release();
    }
}
```

#### 2. 底层原理

Semaphore 基于 AQS 的**共享模式**实现：

```java
// acquire() 的核心逻辑
public void acquire() throws InterruptedException {
    sync.acquireSharedInterruptibly(1);
}

// AQS 共享模式：tryAcquireShared 返回值 >= 0 表示获取成功
// 非公平模式：直接 CAS 抢占
// 公平模式：检查是否有排队的线程

// release() 的核心逻辑
public void release() {
    sync.releaseShared(1);
}
```

#### 3. 典型应用：数据库连接池限流

```java
public class ConnectionPool {
    private final Semaphore semaphore;
    private final LinkedList<Connection> pool = new LinkedList<>();

    public ConnectionPool(int poolSize) {
        this.semaphore = new Semaphore(poolSize);
        for (int i = 0; i < poolSize; i++) {
            pool.add(createConnection());
        }
    }

    public Connection getConnection() throws InterruptedException {
        semaphore.acquire();  // 获取许可，超过 poolSize 则阻塞
        synchronized (pool) {
            return pool.removeFirst();
        }
    }

    public void returnConnection(Connection conn) {
        synchronized (pool) {
            pool.add(conn);
        }
        semaphore.release();  // 释放许可
    }
}
```

> ⭐ **面试问答：Semaphore 和 CountDownLatch 的区别？**
>
> 答：Semaphore 控制同时访问的线程数，许可可以反复获取和释放（循环使用），适用于限流场景（如连接池）。CountDownLatch 是一次性倒计时器，线程等待计数器归零后一起执行，不可重置，适用于"等待所有任务完成"场景。

---

### 补充三、CountDownLatch vs CyclicBarrier vs Semaphore 对比（⭐高频）

#### 1. 三者核心区别

| 特性 | CountDownLatch | CyclicBarrier | Semaphore |
|------|---------------|---------------|-----------|
| 作用 | 让一组线程等待，直到计数器归零 | 让一组线程互相等待，全部到达屏障点后继续 | 控制同时访问共享资源的线程数 |
| 计数器 | 递减，不可重置 | 递减，可重置（循环使用） | 许可数，可获取/释放 |
| 线程角色 | 一个/多个等待线程 + N个计数线程 | 所有线程既是等待者也是计数者 | 获取许可的线程 |
| 是否可重用 | 否（一次性） | 是（可循环） | 是（许可可反复获取） |
| 回调 | 无 | 支持 barrierAction | 无 |
| 底层实现 | AQS 共享模式 | ReentrantLock + Condition | AQS 共享模式 |

#### 2. 代码示例

```java
// ========== CountDownLatch：主线程等待所有子任务完成 ==========
CountDownLatch latch = new CountDownLatch(3);

for (int i = 0; i < 3; i++) {
    new Thread(() -> {
        try {
            Thread.sleep(1000);
            System.out.println(Thread.currentThread().getName() + " 完成");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            latch.countDown();  // 计数器 -1
        }
    }).start();
}

latch.await();  // 主线程等待，直到计数器为0
System.out.println("所有任务完成，主线程继续");

// ========== CyclicBarrier：多线程互相等待，全部到达后一起执行 ==========
CyclicBarrier barrier = new CyclicBarrier(3, () -> {
    // 所有线程到达屏障后执行的回调（可选）
    System.out.println("所有线程已到达，开始下一阶段");
});

for (int i = 0; i < 3; i++) {
    new Thread(() -> {
        try {
            System.out.println(Thread.currentThread().getName() + " 到达屏障");
            barrier.await();  // 等待其他线程
            System.out.println(Thread.currentThread().getName() + " 继续执行");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }).start();
}

// ========== Semaphore：限流 ==========
Semaphore semaphore = new Semaphore(2); // 只允许2个线程同时访问
for (int i = 0; i < 5; i++) {
    new Thread(() -> {
        try {
            semaphore.acquire();
            System.out.println(Thread.currentThread().getName() + " 获取许可，访问资源");
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            semaphore.release();
            System.out.println(Thread.currentThread().getName() + " 释放许可");
        }
    }).start();
}
```

#### 3. 适用场景总结

```
CountDownLatch：
  - 主线程等待多个子任务完成后再汇总结果
  - 多个服务启动完成后才开始接受请求
  - 并行测试中等待所有测试线程就绪

CyclicBarrier：
  - 多线程分阶段计算（每阶段所有线程同步一次）
  - 游戏中等待所有玩家准备就绪
  - 数据批量处理（多线程处理完一批后统一提交）

Semaphore：
  - 数据库连接池限流
  - 接口限流（控制并发请求数）
  - 停车场车位管理
```

> ⭐ **面试问答：CyclicBarrier 和 CountDownLatch 的区别？**
>
> 答：(1) CountDownLatch 是一次性计数器，计数器归零后不能重置；CyclicBarrier 可以通过 `reset()` 重置，循环使用。(2) CountDownLatch 的计数线程和等待线程可以是不同的线程（如主线程等待N个子线程）；CyclicBarrier 的所有线程既是计数者也是等待者。(3) CyclicBarrier 支持回调函数 `barrierAction`，所有线程到达后先执行回调再继续。(4) CyclicBarrier 如果某个线程被中断或超时，屏障会被破坏（BrokenBarrierException），其他等待线程也会收到异常。

---

### 补充四、LongAdder vs AtomicLong（⭐⭐中频）

#### 1. AtomicLong 的瓶颈

AtomicLong 使用 CAS 保证原子性，但在高并发场景下，大量线程同时竞争同一个变量的 CAS 操作，会导致大量自旋重试，性能急剧下降。

```java
// AtomicLong：所有线程竞争一个 value
AtomicLong counter = new AtomicLong();
// 线程1、线程2、线程3... 同时 CAS 修改同一个 value
// 竞争激烈时，CAS 失败重试次数激增
```

#### 2. LongAdder 的 Cell 数组分段 CAS 原理

LongAdder 采用"分段 CAS + 惰性求和"策略，将竞争分散到多个 Cell 上：

```
LongAdder 结构：
  base  ← 低竞争时直接 CAS base
  cells[0] ← 线程 hash 到不同的 Cell
  cells[1]
  cells[2]
  ...
  cells[n]

sum() = base + cells[0] + cells[1] + ... + cells[n]  // 惰性求和
```

```java
// LongAdder 核心源码（简化）
public class LongAdder extends Striped64 implements Serializable {
    // base：无竞争时直接 CAS 修改
    transient volatile long base;

    // cells：竞争时分散到不同 Cell
    transient volatile Cell[] cells;

    // Cell：每个 Cell 是一个 volatile long
    @sun.misc.Contended  // 避免伪共享（缓存行填充）
    static final class Cell {
        volatile long value;
        Cell(long x) { value = x; }
        // CAS 修改
        final boolean cas(long cmp, long val) {
            return UNSAFE.compareAndSwapLong(this, valueOffset, cmp, val);
        }
    }

    // add() 方法
    public void add(long x) {
        Cell[] cs; long b, v; int m; Cell c;
        if ((cs = cells) != null || !casBase(b = base, b + x)) {
            boolean uncontended = false;
            if (cs == null || (m = (cs.length - 1)) < 0 ||
                (c = cs[getProbe() & m]) == null ||
                !(uncontended = c.cas(v = c.value, v + x)))
                longAccumulate(x, null, uncontended);
        }
    }

    // sum()：惰性求和（非精确，可能有并发修改）
    public long sum() {
        Cell[] cs = cells;
        long sum = base;
        if (cs != null) {
            for (Cell c : cs)
                if (c != null)
                    sum += c.value;
        }
        return sum;
    }
}
```

#### 3. 工作流程

```
add(1)：
  1. 无竞争 → CAS 修改 base（快速路径）
  2. 有竞争 → 初始化 cells 数组
  3. 线程通过 probe（ThreadLocalRandom）hash 到某个 Cell
  4. CAS 修改对应 Cell 的 value（失败则重试或扩容 cells）

sum()：
  base + 所有 Cell 的 value 之和
  注意：sum() 不是强一致性的快照！
```

#### 4. 适用场景对比

| 特性 | AtomicLong | LongAdder |
|------|-----------|-----------|
| 原理 | 单个 value + CAS | base + Cell 数组 + 分段 CAS |
| 高并发性能 | 差（竞争激烈） | 好（竞争分散） |
| 内存占用 | 8 bytes | 8 bytes + Cell 数组 |
| 精确性 | 强一致性 | 最终一致性（sum() 可能不准确） |
| 适用操作 | 自增、CAS 比较 | 仅适合累加（add/sum） |
| 适用场景 | 低并发计数 | 高并发计数（如监控指标） |

```java
// 高并发计数场景推荐 LongAdder
LongAdder requestCount = new LongAdder();
requestCount.increment();  // 等价于 add(1)
requestCount.add(10);
long total = requestCount.sum();  // 获取当前总和

// 需要精确 CAS 操作场景用 AtomicLong
AtomicLong sequence = new AtomicLong();
long nextId = sequence.incrementAndGet();
boolean success = sequence.compareAndSet(expected, newValue);
```

> ⭐ **面试问答：LongAdder 为什么比 AtomicLong 快？**
>
> 答：LongAdder 将热点数据（单个 value）分散到多个 Cell 中，每个线程通过 hash 映射到不同的 Cell 进行 CAS 操作，减少了竞争。AtomicLong 所有线程竞争同一个 value，高并发时大量 CAS 失败重试。LongAdder 的代价是 sum() 方法不是强一致性的（遍历求和期间可能有并发修改），且只能做累加操作，不支持 CAS 比较更新。LongAdder 使用 `@Contended` 注解避免伪共享，每个 Cell 独占一个缓存行。
