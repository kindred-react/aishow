# JVM 虚拟机知识体系

## 一、JVM 架构概览

### 1.1 JVM 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    类加载子系统                           │
│  (加载 → 验证 → 准备 → 解析 → 初始化)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    运行时数据区                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   方法区     │  │     堆       │  │  虚拟机栈    │  │
│  │ (元空间)     │  │  (新生代+    │  │   (栈帧)     │  │
│  │              │  │   老年代)    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 本地方法栈   │  │ 程序计数器   │                     │
│  └──────────────┘  └──────────────┘                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                    执行引擎                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   解释器     │  │  JIT编译器   │  │   GC回收器   │  │
│  │  (字节码→    │  │  (热点代码→  │  │  (垃圾回收)  │  │
│  │   机器码)    │  │   本地代码)  │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   本地库接口 (JNI)                        │
└─────────────────────────────────────────────────────────┘
```

### 1.2 JRE、JDK、JVM 的关系

```
JDK (Java Development Kit)
├── JRE (Java Runtime Environment)
│   ├── JVM (Java Virtual Machine)
│   │   ├── 类加载器
│   │   ├── 运行时数据区
│   │   ├── 执行引擎
│   │   └── 本地库接口
│   └── Java 核心类库 (rt.jar, tools.jar)
└── 开发工具 (javac, jdb, javadoc 等)
```

**代码示例：查看JVM版本**

```bash
# 查看JVM版本
java -version

# 查看JVM详细参数
java -XX:+PrintFlagsFinal -version

# 查看默认GC算法
java -XX:+PrintCommandLineFlags -version
```

### 1.3 Java 代码执行流程

```
源代码 (.java)
    ↓ [javac 编译]
字节码 (.class)
    ↓ [类加载器加载]
运行时数据区 (方法区、堆、栈等)
    ↓ [执行引擎]
    ├─→ 解释执行 (逐行解释字节码)
    └─→ JIT编译 (热点代码编译为本地代码)
         ↓
    本地机器码执行
```

**代码示例：查看字节码**

```java
// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, JVM!");
    }
}
```

```bash
# 编译
javac HelloWorld.java

# 查看字节码
javap -c HelloWorld.class

# 查看详细信息
javap -v HelloWorld.class
```

**字节码示例：**
```
public static void main(java.lang.String[]);
  Code:
   0:   getstatic       #2; //Field java/lang/System.out:Ljava/io/PrintStream;
   3:   ldc             #3; //String Hello, JVM!
   5:   invokevirtual   #4; //Method java/io/PrintStream.println:(Ljava/lang/String;)V
   8:   return
```

---

## 二、类加载机制

### 2.1 类加载过程

```
加载 (Loading)
    ↓
链接 (Linking)
    ├─ 验证 (Verification) - 字节码合法性检查
    ├─ 准备 (Preparation) - 为静态变量分配内存并设置默认值
    └─ 解析 (Resolution) - 符号引用转换为直接引用
    ↓
初始化 (Initialization) - 执行<clinit>方法，赋初始值
```

**代码示例：类加载过程演示**

```java
public class ClassLoadingDemo {
    // 准备阶段：value = 0 (默认值)
    // 初始化阶段：value = 10 (初始值)
    private static int value = 10;

    // 常量在编译期放入常量池
    private static final int CONSTANT = 20;

    static {
        System.out.println("静态代码块执行 - 初始化阶段");
        value = 20;
    }

    public static void main(String[] args) {
        System.out.println("value = " + value);
        System.out.println("CONSTANT = " + CONSTANT);
    }
}
```

**输出：**
```
静态代码块执行 - 初始化阶段
value = 20
CONSTANT = 20
```

### 2.2 类加载器

```
Bootstrap ClassLoader (启动类加载器)
    ↓
Extension/Platform ClassLoader (扩展/平台类加载器)
    ↓
Application/System ClassLoader (应用/系统类加载器)
    ↓
Custom ClassLoader (自定义类加载器)
```

**代码示例：查看类加载器**

```java
public class ClassLoaderDemo {
    public static void main(String[] args) {
        // 获取系统类加载器
        ClassLoader systemClassLoader = ClassLoader.getSystemClassLoader();
        System.out.println("系统类加载器: " + systemClassLoader);

        // 获取父类加载器（扩展类加载器）
        ClassLoader parentClassLoader = systemClassLoader.getParent();
        System.out.println("扩展类加载器: " + parentClassLoader);

        // 获取启动类加载器（通常为null）
        ClassLoader bootstrapClassLoader = parentClassLoader.getParent();
        System.out.println("启动类加载器: " + bootstrapClassLoader);

        // 查看类的加载器
        System.out.println("String的加载器: " + String.class.getClassLoader());
        System.out.println("ClassLoaderDemo的加载器: " + ClassLoaderDemo.class.getClassLoader());
    }
}
```

**输出：**
```
系统类加载器: jdk.internal.loader.ClassLoaders$AppClassLoader@...
扩展类加载器: jdk.internal.loader.ClassLoaders$PlatformClassLoader@...
启动类加载器: null
String的加载器: null (启动类加载器加载)
ClassLoaderDemo的加载器: jdk.internal.loader.ClassLoaders$AppClassLoader@...
```

### 2.3 双亲委派模型（Parents Delegation Model）

**工作原理：**
1. 类加载器收到类加载请求
2. 先委托给父类加载器
3. 父类加载器无法加载时，子类加载器才尝试加载

**代码示例：自定义类加载器**

```java
import java.io.*;

public class CustomClassLoader extends ClassLoader {
    private String classPath;

    public CustomClassLoader(String classPath) {
        this.classPath = classPath;
    }

    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        try {
            byte[] data = loadByte(name);
            return defineClass(name, data, 0, data.length);
        } catch (IOException e) {
            throw new ClassNotFoundException(name);
        }
    }

    private byte[] loadByte(String name) throws IOException {
        name = name.replaceAll("\\.", "/");
        FileInputStream fis = new FileInputStream(classPath + "/" + name + ".class");
        int len = fis.available();
        byte[] data = new byte[len];
        fis.read(data);
        fis.close();
        return data;
    }

    // 打破双亲委派
    @Override
    protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
        synchronized (getClassLoadingLock(name)) {
            // 检查是否已加载
            Class<?> c = findLoadedClass(name);
            if (c == null) {
                // 如果是自定义的类，不委托给父加载器
                if (name.startsWith("com.example")) {
                    c = findClass(name);
                } else {
                    // 其他类走双亲委派
                    c = super.loadClass(name, resolve);
                }
            }
            if (resolve) {
                resolveClass(c);
            }
            return c;
        }
    }

    public static void main(String[] args) throws Exception {
        CustomClassLoader loader = new CustomClassLoader("/path/to/classes");
        Class<?> clazz = loader.loadClass("com.example.Test");
        Object obj = clazz.newInstance();
        System.out.println(obj.getClass().getClassLoader());
    }
}
```

### 2.4 打破双亲委派的场景

**1. SPI机制（Service Provider Interface）**

```java
// JDBC驱动加载示例
import java.sql.*;

public class SPIDemo {
    public static void main(String[] args) throws Exception {
        // 使用线程上下文类加载器加载驱动
        Class.forName("com.mysql.cj.jdbc.Driver");

        // 或者使用ServiceLoader
        // ServiceLoader<Driver> drivers = ServiceLoader.load(Driver.class);
        // for (Driver driver : drivers) {
        //     System.out.println(driver);
        // }

        Connection conn = DriverManager.getConnection(
            "jdbc:mysql://localhost:3306/test", "root", "password");
        System.out.println("连接成功: " + conn);
    }
}
```

**2. Tomcat类加载机制**

```
CommonClassLoader (共享类库)
    ├─ WebAppClassLoader1 (应用1)
    └─ WebAppClassLoader2 (应用2)
```

**3. OSGi（模块化热部署）**

### 2.5 类卸载条件

```java
public class ClassUnloadDemo {
    public static void main(String[] args) throws Exception {
        // 创建自定义类加载器
        CustomClassLoader loader = new CustomClassLoader("/path/to/classes");
        Class<?> clazz = loader.loadClass("com.example.Test");

        // 创建实例
        Object obj = clazz.newInstance();

        // 清除引用
        obj = null;
        clazz = null;

        // 卸载类加载器
        loader = null;

        // 建议进行GC
        System.gc();

        System.out.println("类可能已被卸载");
    }
}
```

**类卸载条件：**
1. 该类的所有实例都被回收
2. 加载该类的ClassLoader实例被回收
3. 该类对应的java.lang.Class对象没有在任何地方被引用

---

## 三、运行时数据区

### 3.1 堆（Heap）

**堆内存结构：**

```
┌─────────────────────────────────────┐
│              老年代 (Old Gen)        │
│   (长期存活对象、大对象)             │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│              新生代 (Young Gen)      │
│  ┌─────────┬─────────┬─────────┐   │
│  │  Eden   │   S0    │   S1    │   │
│  │  (8)    │   (1)   │   (1)   │   │
│  └─────────┴─────────┴─────────┘   │
│              比例 8:1:1              │
└─────────────────────────────────────┘
```

**代码示例：对象分配与晋升**

```java
public class HeapAllocationDemo {
    // -Xms20m -Xmx20m -Xmn10m -XX:+PrintGCDetails

    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 1. 对象优先在Eden区分配
        byte[] allocation1 = new byte[2 * _1MB];
        byte[] allocation2 = new byte[2 * _1MB];
        byte[] allocation3 = new byte[2 * _1MB];

        // 2. 大对象直接进入老年代
        // -XX:PretenureSizeThreshold=3M (只对Serial和ParNew有效)
        byte[] allocation4 = new byte[4 * _1MB];

        // 3. 长期存活对象进入老年代
        // -XX:MaxTenuringThreshold=15 (默认15)
        byte[] allocation5 = new byte[2 * _1MB];
        allocation5 = null; // 释放引用

        // 4. 动态年龄判定
        // 如果Survivor区中相同年龄所有对象大小的总和大于Survivor空间的一半，
        // 年龄大于等于该年龄的对象就可以直接进入老年代
    }
}
```

**JVM参数示例：**
```bash
# 堆内存参数
-Xms20m              # 初始堆大小
-Xmx20m              # 最大堆大小
-Xmn10m              # 新生代大小
-XX:NewRatio=2       # 新生代与老年代比例 (2:1)
-XX:SurvivorRatio=8  # Eden与Survivor比例 (8:1)

# 大对象直接进入老年代
-XX:PretenureSizeThreshold=3M

# 晋升年龄阈值
-XX:MaxTenuringThreshold=15
```

**TLAB（Thread Local Allocation Buffer）：**

```java
public class TLABDemo {
    // -XX:+UseTLAB (默认开启)
    // -XX:TLABSize=256k
    // -XX:TLABWasteTargetPercent=1

    public static void main(String[] args) {
        // 多线程环境下，每个线程在Eden区分配一块私有内存区域
        // 避免多线程竞争，提高分配效率
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                byte[] data = new byte[1024];
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
    }
}
```

### 3.2 方法区 / 元空间（Metaspace）

**JDK 7 vs JDK 8 变化：**

```
JDK 7:
┌─────────────────────────────────┐
│           方法区                │
│  ┌─────────────────────────┐   │
│  │      永久代 (PermGen)    │   │
│  │  - 类信息               │   │
│  │  - 常量池               │   │
│  │  - 静态变量             │   │
│  └─────────────────────────┘   │
│  固定大小，容易OOM               │
└─────────────────────────────────┘

JDK 8+:
┌─────────────────────────────────┐
│           方法区                │
│  ┌─────────────────────────┐   │
│  │      元空间 (Metaspace) │   │
│  │  - 类信息               │   │
│  │  - 方法元数据           │   │
│  │  使用本地内存           │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │      堆                 │   │
│  │  - 字符串常量池         │   │
│  │  - 静态变量             │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

**代码示例：元空间OOM**

```java
// JDK 8: -XX:MaxMetaspaceSize=10m
import java.util.*;

public class MetaspaceOOMDemo {
    // 使用CGLIB或Javassist动态生成类
    static class OOMObject {}

    public static void main(String[] args) {
        // 模拟加载大量类
        try {
            // 使用反射或字节码生成工具创建大量类
            // 这里仅作示例
            List<Class<?>> classes = new ArrayList<>();
            for (int i = 0; i < 100000; i++) {
                // 实际场景中会使用字节码生成工具
                // Class.forName("com.example.Class" + i);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**JVM参数示例：**
```bash
# 元空间参数
-XX:MetaspaceSize=256m          # 元空间初始大小
-XX:MaxMetaspaceSize=512m       # 元空间最大大小
-XX:MinMetaspaceFreeRatio=40    # 最小空闲比例
-XX:MaxMetaspaceFreeRatio=70    # 最大空闲比例

# 字符串常量池
-XX:StringTableSize=100000      # StringTable桶数量
```

**字符串常量池示例：**

```java
public class StringConstantPoolDemo {
    public static void main(String[] args) {
        // 字符串常量池
        String s1 = "hello";
        String s2 = "hello";
        System.out.println(s1 == s2); // true - 常量池中同一个对象

        String s3 = new String("hello");
        System.out.println(s1 == s3); // false - 堆中新对象

        String s4 = s3.intern();
        System.out.println(s1 == s4); // true - intern返回常量池引用

        // JDK 7+ intern变化：字符串常量池在堆中
        String s5 = new String("ja") + new String("va");
        s5.intern();
        String s6 = "java";
        System.out.println(s5 == s6); // true (JDK 7+)
    }
}
```

### 3.3 虚拟机栈（VM Stack）

**栈帧结构：**

```
┌─────────────────────────────────────┐
│         栈帧 (Stack Frame)          │
│  ┌─────────────────────────────┐   │
│  │   局部变量表 (Local Variables) │  │
│  │   - 基本数据类型             │  │
│  │   - 对象引用                 │  │
│  │   - returnAddress            │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   操作数栈 (Operand Stack)   │  │
│  │   - 方法执行的操作数         │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   动态链接 (Dynamic Linking) │  │
│  │   - 符号引用 → 直接引用      │  │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │   方法返回地址 (Return Address)│
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**代码示例：栈溢出**

```java
// -Xss128k
public class StackOverflowDemo {
    private static int count = 0;

    public static void recursion() {
        count++;
        recursion();
    }

    public static void main(String[] args) {
        try {
            recursion();
        } catch (StackOverflowError e) {
            System.out.println("递归深度: " + count);
            e.printStackTrace();
        }
    }
}
```

**输出：**
```
递归深度: 983
java.lang.StackOverflowError
    at StackOverflowDemo.recursion(StackOverflowDemo.java:6)
    at StackOverflowDemo.recursion(StackOverflowDemo.java:7)
    ...
```

**JVM参数示例：**
```bash
# 栈大小
-Xss256k             # 每个线程栈大小
-XX:ThreadStackSize=256k
```

**局部变量表示例：**

```java
public class LocalVariableTableDemo {
    public static int test(int a, int b) {
        int c = a + b;
        int d = c * 2;
        return d;
    }

    // 查看局部变量表
    // javap -l -v LocalVariableTableDemo.class
}
```

### 3.4 本地方法栈（Native Method Stack）

```java
public class NativeMethodStackDemo {
    // native方法调用本地方法栈
    public native void nativeMethod();

    static {
        System.loadLibrary("native-lib");
    }

    public static void main(String[] args) {
        NativeMethodStackDemo demo = new NativeMethodStackDemo();
        demo.nativeMethod();
    }
}
```

**虚拟机栈 vs 本地方法栈：**
- 虚拟机栈：为Java方法服务
- 本地方法栈：为Native方法服务
- HotSpot将两者合二为一

### 3.5 程序计数器（PC Register）

```java
public class PCRegisterDemo {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int c = a + b;

        // PC寄存器记录当前执行的字节码指令位置
        // 线程私有，不会发生内存溢出
    }
}
```

**特点：**
- 线程私有
- 记录当前执行的字节码行号
- 唯一不会OOM的区域
- Native方法时值为undefined

---

## 四、垃圾回收（GC）（重点！面试最高频）

### 4.1 对象存活判断

**1. 引用计数法（Reference Counting）**

```java
public class ReferenceCountingDemo {
    private Object instance = null;
    private static final int _1MB = 1024 * 1024;

    // 占用内存，便于观察GC
    private byte[] bigSize = new byte[2 * _1MB];

    public static void main(String[] args) {
        ReferenceCountingDemo objA = new ReferenceCountingDemo();
        ReferenceCountingDemo objB = new ReferenceCountingDemo();

        objA.instance = objB;
        objB.instance = objA;

        // 循环引用，引用计数不为0，但对象已不可达
        objA = null;
        objB = null;

        // 建议GC
        System.gc();

        // 如果使用引用计数，这两个对象不会被回收
        // 但实际使用可达性分析，会被回收
    }
}
```

**2. 可达性分析算法（Reachability Analysis）**

```java
public class ReachabilityAnalysisDemo {
    // GC Roots 包括：
    // 1. 虚拟机栈（栈帧中的局部变量表）中引用的对象
    // 2. 方法区中类静态属性引用的对象
    // 3. 方法区中常量引用的对象
    // 4. 本地方法栈中JNI引用的对象

    private static Object staticVar;  // GC Root 2
    private static final Object CONSTANT = new Object();  // GC Root 3

    public void method() {
        Object localVar = new Object();  // GC Root 1

        // 可达对象
        Object reachable = localVar;

        // 不可达对象
        Object unreachable = new Object();
        unreachable = null;
    }
}
```

**GC Roots 示例：**

```java
public class GCRootsDemo {
    // 1. 虚拟机栈中引用的对象
    public void stackRoot() {
        Object obj = new Object();  // GC Root
    }

    // 2. 方法区中静态变量引用的对象
    private static Object staticRef = new Object();  // GC Root

    // 3. 方法区中常量引用的对象
    private static final Object CONSTANT_REF = new Object();  // GC Root

    // 4. 本地方法栈中JNI引用的对象
    private native void nativeMethod();  // GC Root

    public static void main(String[] args) {
        GCRootsDemo demo = new GCRootsDemo();
        demo.stackRoot();

        // 活着的对象
        Object alive = demo;

        // 死亡的对象
        Object dead = new Object();
        dead = null;

        System.gc();
    }
}
```

### 4.2 引用类型

**代码示例：四种引用类型**

```java
import java.lang.ref.*;
import java.util.*;

public class ReferenceTypeDemo {
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 1. 强引用 (Strong Reference)
        // 最常见的引用，只要引用存在，垃圾回收器永远不会回收
        Object strongRef = new Object();
        strongRef = null;  // 只有置null才可能被回收

        // 2. 软引用 (Soft Reference)
        // 内存不足时回收，用于缓存
        SoftReference<byte[]> softRef = new SoftReference<>(new byte[_1MB]);
        System.out.println("软引用: " + softRef.get());
        System.gc();
        System.out.println("GC后软引用: " + softRef.get());

        // 3. 弱引用 (Weak Reference)
        // 下次GC时回收，用于WeakHashMap
        WeakReference<byte[]> weakRef = new WeakReference<>(new byte[_1MB]);
        System.out.println("弱引用: " + weakRef.get());
        System.gc();
        System.out.println("GC后弱引用: " + weakRef.get());

        // 4. 虚引用 (Phantom Reference)
        // 无法通过get获取对象，用于跟踪对象被回收的状态
        ReferenceQueue<Object> queue = new ReferenceQueue<>();
        PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
        System.out.println("虚引用: " + phantomRef.get());  // 总是null

        // WeakHashMap示例
        WeakHashMap<String, Object> weakMap = new WeakHashMap<>();
        weakMap.put("key1", new Object());
        weakMap.put("key2", new Object());
        System.gc();
        System.out.println("WeakHashMap size: " + weakMap.size());
    }
}
```

**输出：**
```
软引用: [B@...
GC后软引用: [B@...
弱引用: [B@...
GC后弱引用: null
虚引用: null
WeakHashMap size: 0
```

### 4.3 垃圾回收算法

**1. 标记-清除（Mark-Sweep）**

```java
public class MarkSweepDemo {
    // 算法过程：
    // 1. 标记：标记所有存活对象
    // 2. 清除：回收未标记对象

    // 优点：简单，不需要额外空间
    // 缺点：产生内存碎片

    public static void main(String[] args) {
        // 模拟内存碎片
        List<Object> objects = new ArrayList<>();
        for (int i = 0; i < 100; i++) {
            if (i % 2 == 0) {
                objects.add(new Object());
            } else {
                objects.add(null);  // 模拟已回收对象
            }
        }
        // 内存不连续，导致大对象无法分配
    }
}
```

**2. 标记-复制（Mark-Copy）**

```java
public class MarkCopyDemo {
    // 算法过程：
    // 1. 标记：标记所有存活对象
    // 2. 复制：将存活对象复制到另一块空间
    // 3. 清空：清空原空间

    // 优点：无内存碎片，简单高效
    // 缺点：内存利用率低（需要两倍空间）

    // 新生代使用此算法（Eden + Survivor）

    public static void main(String[] args) {
        // 新生代复制算法
        // Eden区满了，将存活对象复制到Survivor区
        // 然后清空Eden区
    }
}
```

**3. 标记-整理（Mark-Compact）**

```java
public class MarkCompactDemo {
    // 算法过程：
    // 1. 标记：标记所有存活对象
    // 2. 整理：将存活对象向一端移动
    // 3. 清除：清理边界外的内存

    // 优点：无内存碎片
    // 缺点：需要移动对象，效率较低

    // 老年代使用此算法

    public static void main(String[] args) {
        // 老年代整理算法
        // 将存活对象向一端移动，消除内存碎片
    }
}
```

**4. 分代收集算法**

```java
public class GenerationalCollectionDemo {
    // 根据对象存活周期不同，采用不同算法
    // 新生代：标记-复制（存活率低）
    // 老年代：标记-整理（存活率高）

    public static void main(String[] args) {
        // 新生代GC (Minor GC / Young GC)
        // - 触发：Eden区满
        // - 速度快
        // - 回收新生代

        // 老年代GC (Major GC / Full GC)
        // - 触发：老年代空间不足
        // - 速度慢
        // - 回收整个堆
    }
}
```

### 4.4 垃圾回收器

**垃圾回收器对比表：**

| 回收器 | 类型 | 新生代 | 老年代 | 特点 | 适用场景 |
|--------|------|--------|--------|------|----------|
| Serial | 串行 | Serial | Serial Old | 单线程，简单 | 客户端应用 |
| ParNew | 并行 | ParNew | Serial Old | 多线程 | CMS配套 |
| Parallel Scavenge | 并行 | Parallel Scavenge | Parallel Old | 吞吐量优先 | 批处理、计算 |
| CMS | 并发 | ParNew | CMS | 低延迟 | Web应用 |
| G1 | 并发 | G1 | G1 | 可预测停顿 | 大内存 |
| ZGC | 并发 | ZGC | ZGC | 亚毫秒停顿 | 超大内存 |

**1. Serial / Serial Old**

```bash
# Serial GC
-XX:+UseSerialGC

# 新生代：复制算法
# 老年代：标记-整理算法
```

```java
public class SerialGCDemo {
    // 特点：
    // - 单线程进行GC
    // - 进行GC时必须暂停其他所有工作线程
    // - 简单高效，没有线程交互开销

    // 适用场景：
    // - 内存较小的客户端应用
    // - 单核CPU环境

    public static void main(String[] args) {
        // Serial GC工作流程
        // 1. 暂停所有应用线程
        // 2. 单线程进行垃圾回收
        // 3. 恢复应用线程
    }
}
```

**2. ParNew / Parallel Scavenge / Parallel Old**

```bash
# ParNew GC
-XX:+UseParNewGC

# Parallel GC (JDK 8默认)
-XX:+UseParallelGC
# JDK 9+ 默认使用 G1 GC，JDK 11+ 推荐使用 G1 或 ZGC

# Parallel Old
-XX:+UseParallelOldGC

# 并行线程数
-XX:ParallelGCThreads=4
```

```java
public class ParallelGCDemo {
    // 特点：
    // - 多线程并行进行GC
    // - 关注吞吐量（CPU用于运行用户代码的时间占比）
    // - 适合后台运算而不需要太多交互的任务

    // 适用场景：
    // - 批处理系统
    // - 科学计算
    // - 订单处理系统

    public static void main(String[] args) {
        // Parallel Scavenge参数
        // -XX:MaxGCPauseMillis=100  最大停顿时间
        // -XX:GCTimeRatio=99        吞吐量（1/(1+99)=1%时间用于GC）
    }
}
```

**3. CMS（Concurrent Mark Sweep）** ⚠️ CMS 在 JDK 9 被标记为废弃（deprecated），在 JDK 14 中已被彻底移除。了解即可，面试重点掌握 G1 和 ZGC

```bash
# CMS GC
-XX:+UseConcMarkSweepGC

# CMS参数
-XX:CMSInitiatingOccupancyFraction=75  老年代使用率达到75%时触发
-XX:+UseCMSInitiatingOccupancyOnly
-XX:+CMSParallelRemarkEnabled
-XX:+CMSScavengeBeforeRemark
```

```java
public class CMSGCDemo {
    // CMS四个阶段：
    // 1. 初始标记（STW）- 标记GC Roots能直接关联的对象
    // 2. 并发标记 - GC Roots Tracing
    // 3. 重新标记（STW）- 修正并发标记期间的变动
    // 4. 并发清除 - 回收垃圾对象

    // 优点：
    // - 并发收集
    // - 低停顿

    // 缺点：
    // - 对CPU资源敏感
    // - 无法处理浮动垃圾
    // - 标记-清除算法产生内存碎片
    // - 老年代空间不足时退化为Serial Old

    public static void main(String[] args) {
        // CMS工作流程
        // 1. 初始标记（STW，很快）
        // 2. 并发标记（与用户线程并发）
        // 3. 重新标记（STW，比初始标记稍长）
        // 4. 并发清除（与用户线程并发）
    }
}
```

**4. G1（Garbage First）**

```bash
# G1 GC (JDK 9+默认)
-XX:+UseG1GC

# G1参数
-XX:MaxGCPauseMillis=200          最大停顿时间
-XX:G1HeapRegionSize=16m          Region大小
-XX:InitiatingHeapOccupancyPercent=45  触发Mixed GC的堆占用率
```

```java
public class G1GCDemo {
    // G1特点：
    // - Region分区（将堆划分为多个大小相等的独立区域）
    // - 可预测停顿时间
    // - 无内存碎片
    // - 并发标记

    // G1 GC类型：
    // 1. Young GC - 新生代GC
    // 2. Mixed GC - 混合GC（新生代+老年代部分Region）
    // 3. Full GC - 退化为Serial GC（尽量避免）

    public static void main(String[] args) {
        // G1 Region结构
        // ┌─────┬─────┬─────┬─────┐
        // │  E  │  E  │  S  │  O  │  E: Eden
        // ├─────┼─────┼─────┼─────┤  S: Survivor
        // │  O  │  H  │  O  │  E  │  O: Old
        // ├─────┼─────┼─────┼─────┤  H: Humongous
        // │  E  │  O  │  E  │  S  │
        // └─────┴─────┴─────┴─────┘

        // G1 Mixed GC过程：
        // 1. 初始标记（STW）
        // 2. 并发标记
        // 3. 最终标记（STW）
        // 4. 筛选回收（STW）- 选择收益最高的Region
    }
}
```

**5. ZGC（Z Garbage Collector）**

```bash
# ZGC (JDK 11+)
-XX:+UnlockExperimentalVMOptions -XX:+UseZGC

# ZGC参数
-XX:ZCollectionInterval=5          GC间隔
```

```java
public class ZGCDemo {
    // ZGC特点：
    // - 染色指针（Colored Pointers）
    // - 读屏障（Load Barrier）
    // - 并发整理
    // - 亚毫秒级停顿（<10ms）
    // - 支持TB级堆内存

    // ZGC工作原理：
    // 1. 并发标记（使用染色指针标记存活对象）
    // 2. 并发重定位（移动对象，更新引用）
    // 3. 并发重映射（更新指针）

    public static void main(String[] args) {
        // ZGC染色指针
        // 64位指针中保留几位作为标记位：
        // 42位: 地址
        // 4位: 颜色标记（Finalizable、Remapped、Marked0、Marked1）
        // 18位: 未使用

        // ZGC读屏障
        // 每次访问对象时，检查指针颜色
        // 如果需要，执行重定位
    }
}
```

**6. Shenandoah**

```bash
# Shenandoah (OpenJDK 12+)
-XX:+UnlockExperimentalVMOptions -XX:+UseShenandoahGC
```

### 4.5 GC 日志分析

**GC日志格式：**

```bash
# JDK 8 GC日志参数
-XX:+PrintGC
-XX:+PrintGCDetails
-XX:+PrintGCTimeStamps
-XX:+PrintGCApplicationStoppedTime
-XX:+PrintGCApplicationConcurrentTime
-Xloggc:/path/to/gc.log

# JDK 9+ GC日志参数
-Xlog:gc*:file=/path/to/gc.log:time,uptime,level,tags
```

**GC日志示例分析：**

```java
// JDK 8 Parallel GC日志示例
/*
[GC (Allocation Failure) [PSYoungGen: 6144K->512K(7168K)] 6144K->512K(19968K), 0.0034567 secs]
[Full GC (Allocation Failure) [PSYoungGen: 512K->0K(7168K)] PSOldGen: 19456K->19456K(12800K)] 19968K->19456K(19968K), [Metaspace: 3456K->3456K(1056768K)], 0.1234567 secs]

解析：
[GC (Allocation Failure) - GC原因：分配失败
 [PSYoungGen: 6144K->512K(7168K)] - 新生代：回收前6144K，回收后512K，总容量7168K
 6144K->512K(19968K) - 整个堆：回收前6144K，回收后512K，总容量19968K
 0.0034567 secs] - GC耗时

[Full GC (Allocation Failure) - Full GC原因：分配失败
 [PSYoungGen: 512K->0K(7168K)] - 新生代变化
 PSOldGen: 19456K->19456K(12800K)] - 老年代：回收前19456K，回收后19456K（无变化）
 19968K->19456K(19968K) - 整个堆变化
 [Metaspace: 3456K->3456K(1056768K)] - 元空间变化
 0.1234567 secs] - GC耗时
*/
```

**代码示例：触发GC并分析日志**

```java
// -Xms20m -Xmx20m -Xmn10m -XX:+PrintGCDetails -XX:+PrintGCTimeStamps
public class GCLogAnalysisDemo {
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 触发Minor GC
        byte[] allocation1 = new byte[2 * _1MB];
        byte[] allocation2 = new byte[2 * _1MB];
        byte[] allocation3 = new byte[2 * _1MB];
        byte[] allocation4 = new byte[4 * _1MB];  // 触发Minor GC

        // 触发Full GC
        try {
            byte[] allocation5 = new byte[8 * _1MB];
        } catch (OutOfMemoryError e) {
            e.printStackTrace();
        }
    }
}
```

**常用GC调优参数：**

```bash
# 堆内存
-Xms4g -Xmx4g                    # 初始堆和最大堆相等，避免动态调整
-Xmn2g                          # 新生代大小
-XX:NewRatio=2                  # 新生代:老年代 = 1:2

# GC选择
-XX:+UseG1GC                    # 使用G1
-XX:MaxGCPauseMillis=200        # 最大停顿时间

# 元空间
-XX:MetaspaceSize=256m
-XX:MaxMetaspaceSize=512m

# 其他
-XX:+HeapDumpOnOutOfMemoryError # OOM时dump堆
-XX:HeapDumpPath=/path/to/dump
-XX:+PrintGCDetails             # 打印GC详情
-XX:+PrintGCDateStamps          # 打印时间戳
```

**常见GC问题排查：**

```java
// 问题1：Full GC频繁
public class FullGCFrequentDemo {
    // 原因：
    // 1. 老年代空间不足
    // 2. 元空间不足
    // 3. 显式调用System.gc()
    // 4. CMS GC失败（promotion failed、concurrent mode failure）

    // 解决方案：
    // 1. 增大老年代空间
    // 2. 降低进入老年代的年龄阈值
    // 3. 优化代码，减少大对象创建
    // 4. 使用更高效的GC（G1、ZGC）
}

// 问题2：OOM（OutOfMemoryError）
public class OOMDemo {
    // -Xms20m -Xmx20m -XX:+HeapDumpOnOutOfMemoryError

    public static void main(String[] args) {
        List<Object> list = new ArrayList<>();
        while (true) {
            list.add(new Object());
        }
    }
    // java.lang.OutOfMemoryError: Java heap space
}

// 问题3：内存泄漏
public class MemoryLeakDemo {
    static class Key {
        private String id;

        public Key(String id) {
            this.id = id;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Key key = (Key) o;
            return id != null ? id.equals(key.id) : key.id == null;
        }

        // 未重写hashCode()，导致HashMap内存泄漏
    }

    public static void main(String[] args) {
        Map<Key, Object> map = new HashMap<>();
        for (int i = 0; i < 100000; i++) {
            map.put(new Key("key" + i), new Object());
        }
        // Key对象无法被正确回收，导致内存泄漏
    }
}
```

---

## 五、JIT 编译器

### 5.1 解释执行 vs 编译执行

```java
public class JITDemo {
    // 解释执行：
    // - 逐条解释字节码为机器码
    // - 启动快，执行慢
    // - 无编译开销

    // 编译执行：
    // - 将字节码编译为本地机器码
    // - 启动慢，执行快
    // - 有编译开销，但执行效率高

    public static void main(String[] args) {
        // 冷代码：解释执行
        for (int i = 0; i < 10; i++) {
            System.out.println("Cold code");
        }

        // 热点代码：JIT编译为本地代码
        for (int i = 0; i < 10000; i++) {
            System.out.println("Hot code");
        }
    }
}
```

### 5.2 C1 vs C2 编译器

```java
public class CompilerDemo {
    // C1编译器（Client Compiler）：
    // - 编译速度快
    // - 优化较少
    // - 适合客户端应用

    // C2编译器（Server Compiler）：
    // - 编译速度慢
    // - 深度优化
    // - 适合服务端应用

    public static void main(String[] args) {
        // -client: 使用C1编译器
        // -server: 使用C2编译器（JDK 8默认）
    }
}
```

### 5.3 分层编译（Tiered Compilation）

```java
// JDK 7+ 默认启用分层编译
// -XX:+TieredCompilation

public class TieredCompilationDemo {
    /*
    分层编译5个层次：
    Level 0: 解释执行
    Level 1: C1编译（无profiling）
    Level 2: C1编译（有限profiling）
    Level 3: C1编译（完整profiling）
    Level 4: C2编译

    执行路径：
    0 → 1 → 2 → 3 → 4
    */

    public static void main(String[] args) {
        // 代码执行初期：解释执行
        // 执行一定次数后：C1编译
        // 执行更多次数后：C2编译
    }
}
```

### 5.4 热点代码探测

```java
public class HotSpotDetectionDemo {
    // 热点代码探测机制：
    // 1. 方法调用计数器
    // 2. 回边计数器（循环）

    // 默认阈值：
    // -client: 1500次
    // -server: 10000次

    public static void hotMethod() {
        // 方法调用计数器+1
    }

    public static void loopMethod() {
        for (int i = 0; i < 10000; i++) {
            // 回边计数器+1
        }
    }

    public static void main(String[] args) {
        // 调整阈值
        // -XX:CompileThreshold=10000

        // 查看编译信息
        // -XX:+PrintCompilation
    }
}
```

### 5.5 逃逸分析

```java
public class EscapeAnalysisDemo {
    // 逃逸分析：
    // - 分析对象的作用域
    // - 判断对象是否会逃逸出方法或线程

    // 优化技术：
    // 1. 标量替换（Scalar Replacement）
    // 2. 栈上分配（Stack Allocation）
    // 3. 锁消除（Lock Elimination）

    // -XX:+DoEscapeAnalysis (默认开启)
    // -XX:+EliminateAllocations
    // -XX:+EliminateLocks

    // 1. 标量替换
    public static void scalarReplacement() {
        Point point = new Point(1, 2);
        // JIT优化后：
        // int x = 1;
        // int y = 2;
        // 不在堆上分配Point对象
    }

    // 2. 栈上分配
    public static void stackAllocation() {
        Point point = new Point(1, 2);
        // 如果point未逃逸，可以分配在栈上
        // 方法返回时自动释放
    }

    // 3. 锁消除
    public static void lockElimination() {
        StringBuffer sb = new StringBuffer();
        sb.append("Hello");
        sb.append(" World");
        // StringBuffer的append方法有synchronized
        // 但sb未逃逸，JIT可以消除锁
    }

    static class Point {
        int x;
        int y;

        public Point(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }

    public static void main(String[] args) {
        scalarReplacement();
        stackAllocation();
        lockElimination();
    }
}
```

---

## 六、内存模型（JMM）

### 6.1 JMM 概述

```java
public class JMMDemo {
    // JMM（Java Memory Model）：
    // - 定义了线程和主内存之间的抽象关系
    // - 保证多线程环境下的可见性、原子性、有序性

    // 主内存（Main Memory）：
    // - 所有共享变量存储的地方

    // 工作内存（Working Memory）：
    // - 每个线程私有的内存
    // - 保存主内存中变量的副本

    public static void main(String[] args) {
        // 线程间通信通过主内存
        // 线程1: 工作内存 → 主内存
        // 线程2: 主内存 → 工作内存
    }
}
```

### 6.2 happens-before 原则

```java
public class HappensBeforeDemo {
    /*
    happens-before 8条原则：
    1. 程序次序规则：单线程内，代码顺序执行
    2. 管程锁定规则：unlock操作先于后续的lock操作
    3. volatile变量规则：volatile写先于volatile读
    4. 线程启动规则：Thread.start()先于线程动作
    5. 线程终止规则：线程终止先于终止检测
    6. 线程中断规则：interrupt()先于中断检测
    7. 对象终结规则：构造函数执行先于finalize()
    8. 传递性：A先于B，B先于C，则A先于C
    */

    private int x = 0;
    private volatile boolean flag = false;

    public void writer() {
        x = 42;      // 1
        flag = true; // 2 - volatile写
    }

    public void reader() {
        if (flag) {  // 3 - volatile读
            System.out.println(x); // 4
        }
    }

    // 根据happens-before原则：
    // 1先于2（程序次序规则）
    // 2先于3（volatile规则）
    // 3先于4（程序次序规则）
    // 因此：1先于4，保证x=42可见
}
```

### 6.3 volatile 的内存语义

```java
public class VolatileDemo {
    // volatile特性：
    // 1. 保证可见性
    // 2. 保证有序性（禁止指令重排序）
    // 3. 不保证原子性

    // volatile实现原理：
    // - 内存屏障（Memory Barrier）
    // - Lock前缀指令

    private volatile boolean running = true;
    private int count = 0;

    public void stop() {
        running = false; // volatile写，立即刷新到主内存
    }

    public void run() {
        while (running) { // volatile读，每次从主内存读取
            count++;
        }
    }

    // 双重检查锁（DCL）
    private static volatile VolatileDemo instance;

    public static VolatileDemo getInstance() {
        if (instance == null) { // 第一次检查
            synchronized (VolatileDemo.class) {
                if (instance == null) { // 第二次检查
                    instance = new VolatileDemo();
                    // new操作：
                    // 1. 分配内存
                    // 2. 初始化对象
                    // 3. 引用指向内存
                    // volatile禁止2和3重排序
                }
            }
        }
        return instance;
    }

    public static void main(String[] args) throws InterruptedException {
        VolatileDemo demo = new VolatileDemo();
        Thread t = new Thread(demo::run);
        t.start();

        Thread.sleep(1000);
        demo.stop();
        t.join();
        System.out.println("count = " + demo.count);
    }
}
```

### 6.4 final 的内存语义

```java
public class FinalDemo {
    // final特性：
    // 1. final域在构造函数内初始化
    // 2. final域的初始化先于对象引用的发布
    // 3. 保证final域在构造函数返回后对其他线程可见

    private final int x;
    private int y;

    public FinalDemo() {
        x = 1;  // final域
        y = 2;  // 非final域
    }

    public static void main(String[] args) {
        FinalDemo obj = new FinalDemo();
        // 保证：x=1对其他线程可见
        // 不保证：y=2对其他线程可见
    }
}

// final域重排序规则
class FinalReorderDemo {
    static FinalObject obj;

    public static void writer() {
        obj = new FinalObject(); // 1
    }

    public static void reader() {
        if (obj != null) { // 2
            int i = obj.x; // 3 - 保证看到正确值
            int j = obj.y; // 4 - 不保证看到正确值
        }
    }
}

class FinalObject {
    final int x;
    int y;

    public FinalObject() {
        x = 1;
        y = 2;
    }
}
```

---

## 七、JVM 调优实战

### 7.1 常用 JVM 参数

```bash
# 堆内存参数
-Xms4g                          # 初始堆大小
-Xmx4g                          # 最大堆大小
-Xmn2g                          # 新生代大小
-XX:NewRatio=2                  # 新生代:老年代 = 1:2
-XX:SurvivorRatio=8             # Eden:Survivor = 8:1

# 栈内存参数
-Xss512k                        # 线程栈大小

# 元空间参数
-XX:MetaspaceSize=256m          # 元空间初始大小
-XX:MaxMetaspaceSize=512m       # 元空间最大大小

# GC参数
-XX:+UseG1GC                    # 使用G1 GC
-XX:MaxGCPauseMillis=200        # 最大停顿时间
-XX:ParallelGCThreads=4         # GC线程数
-XX:ConcGCThreads=2             # 并发GC线程数

# GC日志参数
-XX:+PrintGCDetails             # 打印GC详情
-XX:+PrintGCDateStamps          # 打印时间戳
-XX:+PrintGCTimeStamps          # 打印GC时间戳
-Xloggc:/path/to/gc.log         # GC日志文件
-XX:+UseGCLogFileRotation        # 日志滚动
-XX:NumberOfGCLogFiles=5        # 日志文件数量
-XX:GCLogFileSize=10M           # 日志文件大小

# OOM参数
-XX:+HeapDumpOnOutOfMemoryError # OOM时dump堆
-XX:HeapDumpPath=/path/to/dump  # dump文件路径
-XX:OnOutOfMemoryError="script"  # OOM时执行脚本

# 其他参数
-XX:+PrintFlagsFinal            # 打印所有JVM参数
-XX:+PrintCommandLineFlags      # 打印命令行参数
-XX:+PrintFlagsInitial          # 打印初始参数
```

### 7.2 常用诊断工具

**1. 命令行工具**

```bash
# jps - 查看Java进程
jps -lvm

# jstat - 监控JVM统计信息
jstat -gc <pid> 1000 10        # 每秒输出一次，共10次
jstat -gcutil <pid> 1000 10    # 显示百分比
jstat -gccapacity <pid>        # 显示堆容量
jstat -gcnew <pid>             # 新生代统计
jstat -gcold <pid>             # 老年代统计

# jinfo - 查看和修改JVM参数
jinfo -flags <pid>             # 查看所有参数
jinfo -flag UseG1GC <pid>      # 查看特定参数
jinfo -flag +PrintGC <pid>     # 动态开启参数

# jmap - 查看堆内存和生成dump
jmap -heap <pid>                # 查看堆信息
jmap -histo <pid>              # 查看对象统计
jmap -dump:format=b,file=heap.hprof <pid>  # 生成堆dump

# jstack - 查看线程堆栈
jstack <pid>                    # 查看线程堆栈
jstack -l <pid>                 # 包含锁信息
```

**代码示例：使用jstat监控**

```java
// -Xms20m -Xmx20m -Xmn10m -XX:+UseSerialGC
public class JstatDemo {
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) throws InterruptedException {
        List<byte[]> list = new ArrayList<>();

        for (int i = 0; i < 100; i++) {
            list.add(new byte[_1MB]);
            Thread.sleep(100);
        }

        // 在另一个终端执行：
        // jstat -gc <pid> 1000
    }
}
```

**2. GUI工具**

```bash
# jconsole
jconsole <pid>

# jvisualvm
jvisualvm

# JMC (Java Mission Control)
jmc
```

**3. Arthas（阿里开源）**

```bash
# 安装Arthas
curl -O https://arthas.aliyun.com/arthas-boot.jar
java -jar arthas-boot.jar

# 常用命令
dashboard                      # 查看系统实时数据
thread                         # 查看线程信息
thread <id>                    # 查看线程堆栈
thread -b                      # 查看阻塞线程
jad <class>                    # 反编译类
sc <class>                     # 查看类信息
sm <class> <method>            # 查看方法信息
monitor <class> <method>       # 监控方法调用
watch <class> <method>         # 观察方法入参返回值
heapdump                       # 生成堆dump
vmoption                       # 查看JVM参数
sysprop                        # 查看系统属性
```

**代码示例：使用Arthas监控**

```java
public class ArthasDemo {
    public static void main(String[] args) throws InterruptedException {
        while (true) {
            businessMethod();
            Thread.sleep(1000);
        }
    }

    public static void businessMethod() {
        System.out.println("Business method executing...");
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

// Arthas命令：
// monitor ArthasDemo businessMethod
// watch ArthasDemo businessMethod '{params, returnObj}'
// jad ArthasDemo
```

### 7.3 OOM 排查流程

```java
// OOM排查步骤：
// 1. 获取堆dump文件
// 2. 使用MAT/JVisualVM分析
// 3. 找到大对象和对象引用链
// 4. 定位代码问题

// -XX:+HeapDumpOnOutOfMemoryError
// -XX:HeapDumpPath=/path/to/dump
public class OOMTroubleshootingDemo {
    // -Xms20m -Xmx20m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof

    public static void main(String[] args) {
        List<Object> list = new ArrayList<>();
        while (true) {
            list.add(new Object());
        }
    }
}

// OOM类型：
// 1. java.lang.OutOfMemoryError: Java heap space
//    - 堆内存不足
//    - 解决：增大堆内存、检查内存泄漏

// 2. java.lang.OutOfMemoryError: Metaspace
//    - 元空间不足
//    - 解决：增大元空间、检查类加载

// 3. java.lang.OutOfMemoryError: GC overhead limit exceeded
//    - GC时间过长
//    - 解决：优化GC参数、检查内存泄漏

// 4. java.lang.OutOfMemoryError: Direct buffer memory
//    - 直接内存不足
//    - 解决：增大直接内存、检查NIO使用

// 5. java.lang.StackOverflowError
//    - 栈溢出
//    - 解决：增大栈大小、检查递归深度
```

### 7.4 CPU 100% 排查流程

```java
// CPU 100%排查步骤：
// 1. 使用top命令找到CPU占用高的Java进程
// 2. 使用top -Hp <pid>找到CPU占用高的线程
// 3. 将线程ID转换为16进制
// 4. 使用jstack <pid>查看线程堆栈
// 5. 定位问题代码

public class HighCPUDemo {
    public static void main(String[] args) {
        new Thread(() -> {
            while (true) {
                // 死循环，CPU 100%
                Math.random();
            }
        }).start();

        new Thread(() -> {
            try {
                Thread.sleep(1000000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }
}

// 排查命令：
// 1. top - 找到Java进程PID
// 2. top -Hp <pid> - 找到线程PID
// 3. printf "%x" <thread_pid> - 转换为16进制
// 4. jstack <pid> | grep <hex_thread_pid> - 查看线程堆栈
```

### 7.5 内存泄漏排查流程

```java
import java.util.*;

public class MemoryLeakTroubleshootingDemo {
    // 内存泄漏排查步骤：
    // 1. 监控堆内存使用情况
    // 2. 定期生成堆dump
    // 3. 对比多个dump文件
    // 4. 找到持续增长的对象
    // 5. 分析对象引用链

    // 常见内存泄漏场景：
    // 1. 静态集合类
    // 2. 未关闭的资源
    // 3. 监听器未移除
    // 4. ThreadLocal未清理
    // 5. 缓存无过期策略

    // 场景1：静态集合
    private static Map<String, Object> cache = new HashMap<>();

    public void addToCache(String key, Object value) {
        cache.put(key, value);  // 无限增长
    }

    // 场景2：ThreadLocal
    private static ThreadLocal<byte[]> threadLocal = new ThreadLocal<>();

    public void threadLocalLeak() {
        threadLocal.set(new byte[1024 * 1024]);
        // 未调用threadLocal.remove()
    }

    // 场景3：监听器
    private List<Listener> listeners = new ArrayList<>();

    public void addListener(Listener listener) {
        listeners.add(listener);  // 未提供移除方法
    }

    interface Listener {}

    public static void main(String[] args) {
        MemoryLeakTroubleshootingDemo demo = new MemoryLeakTroubleshootingDemo();
        for (int i = 0; i < 100000; i++) {
            demo.addToCache("key" + i, new Object());
        }
    }
}
```

### 7.6 线上 GC 优化案例

```java
// 案例1：电商系统Full GC频繁
/*
问题：
- Full GC每10分钟一次
- 每次Full GC耗时3秒
- 影响用户体验

分析：
- jstat -gcutil <pid> 发现老年代使用率快速增长
- jmap -histo <pid> 发现大量大对象
- 代码分析：缓存未设置过期时间

解决方案：
1. 增大堆内存：-Xms8g -Xmx8g
2. 优化缓存：设置过期时间
3. 使用G1 GC：-XX:+UseG1GC -XX:MaxGCPauseMillis=200
4. 调整晋升年龄：-XX:MaxTenuringThreshold=10

结果：
- Full GC频率降低到每天1次
- 停顿时间减少到500ms
*/

// 案例2：实时计算系统GC停顿过长
/*
问题：
- GC停顿时间超过1秒
- 影响实时性要求

分析：
- 使用Parallel GC
- 吞吐量优先，不适合低延迟场景

解决方案：
1. 切换到G1 GC：-XX:+UseG1GC
2. 设置最大停顿时间：-XX:MaxGCPauseMillis=100
3. 调整Region大小：-XX:G1HeapRegionSize=16m

结果：
- GC停顿时间降低到100ms以内
- 满足实时性要求
*/

// 案例3：微服务元空间OOM
/*
问题：
- 频繁重启服务
- 元空间OOM

分析：
- 大量使用动态代理
- 类加载器泄漏

解决方案：
1. 增大元空间：-XX:MaxMetaspaceSize=512m
2. 优化代码：减少动态代理使用
3. 检查类加载器：确保正确卸载

结果：
- 元空间使用稳定
- 不再OOM
*/

public class GCOptimizationCase {
    public static void main(String[] args) {
        // GC优化建议：
        // 1. 根据场景选择合适的GC
        //    - 低延迟：G1、ZGC
        //    - 高吞吐：Parallel GC
        //    - 小内存：Serial GC

        // 2. 合理设置堆内存
        //    - Xms = Xmx（避免动态调整）
        //    - 留出20%缓冲空间

        // 3. 监控GC日志
        //    - 定期分析GC日志
        //    - 关注Full GC频率和停顿时间

        // 4. 优化代码
        //    - 减少对象创建
        //    - 及时释放引用
        //    - 使用对象池
    }
}
```

---

## 八、JVM 面试高频问题汇总

### 8.1 JVM 内存模型

**⭐ 面试问题：JVM 运行时数据区包含哪些部分？**

**答案：**
```
JVM 运行时数据区包含5个部分：

1. 堆（Heap）
   - 线程共享
   - 存储对象实例
   - GC的主要区域
   - 可分为新生代和老年代

2. 方法区（Method Area）/ 元空间（Metaspace）
   - 线程共享
   - 存储类信息、常量、静态变量
   - JDK 7是永久代，JDK 8是元空间

3. 虚拟机栈（VM Stack）
   - 线程私有
   - 存储栈帧（方法调用）
   - 包含局部变量表、操作数栈等
   - 可能发生StackOverflowError

4. 本地方法栈（Native Method Stack）
   - 线程私有
   - 为Native方法服务

5. 程序计数器（PC Register）
   - 线程私有
   - 记录当前执行的字节码行号
   - 唯一不会OOM的区域
```

**代码示例：**
```java
public class MemoryModelDemo {
    // 堆：对象实例
    private Object heapObject = new Object();

    // 方法区：类信息、静态变量、常量
    private static Object staticObject = new Object();
    private static final Object CONSTANT = new Object();

    public void method() {
        // 虚拟机栈：局部变量
        Object localObject = new Object();

        // 程序计数器：记录执行位置
        int a = 10;
        int b = 20;
        int c = a + b;
    }
}
```

### 8.2 类加载双亲委派

**⭐ 面试问题：什么是双亲委派模型？为什么要使用双亲委派？**

**答案：**
```
双亲委派模型：
- 类加载器收到类加载请求时，先委托给父类加载器
- 父类加载器无法加载时，子类加载器才尝试加载
- 类加载器层次：Bootstrap → Extension → Application → Custom

使用双亲委派的原因：
1. 避免重复加载：Java核心类不会被重复加载
2. 安全性：防止自定义类替换Java核心类
3. 唯一性：保证类的唯一性
```

**代码示例：**
```java
public class ParentDelegationDemo {
    public static void main(String[] args) {
        // String类由Bootstrap加载器加载
        System.out.println(String.class.getClassLoader()); // null

        // 自定义类由Application加载器加载
        System.out.println(ParentDelegationDemo.class.getClassLoader());
    }
}
```

**⭐ 面试问题：如何打破双亲委派？**

**答案：**
```
打破双亲委派的场景：
1. SPI机制（JDBC、JNDI等）
   - 使用线程上下文类加载器
   - ServiceLoader.load()

2. Tomcat类加载
   - Web应用隔离
   - 每个WebApp有独立的ClassLoader

3. OSGi模块化
   - 热部署
   - 模块间隔离
```

### 8.3 GC 算法与垃圾回收器

**⭐ 面试问题：有哪些垃圾回收算法？各有什么优缺点？**

**答案：**
```
1. 标记-清除（Mark-Sweep）
   - 优点：简单，不需要额外空间
   - 缺点：产生内存碎片

2. 标记-复制（Mark-Copy）
   - 优点：无内存碎片，简单高效
   - 缺点：内存利用率低（需要两倍空间）

3. 标记-整理（Mark-Compact）
   - 优点：无内存碎片
   - 缺点：需要移动对象，效率较低

4. 分代收集算法
   - 新生代：标记-复制（存活率低）
   - 老年代：标记-整理（存活率高）
```

**⭐ 面试问题：有哪些垃圾回收器？各有什么特点？**

**答案：**
```
1. Serial / Serial Old
   - 单线程
   - 适合客户端应用

2. ParNew / Parallel Scavenge / Parallel Old
   - 多线程并行
   - 吞吐量优先
   - 适合批处理系统

3. CMS（Concurrent Mark Sweep）
   - 并发收集
   - 低停顿
   - 适合Web应用
   - 缺点：CPU敏感、内存碎片

4. G1（Garbage First）
   - Region分区
   - 可预测停顿
   - 适合大内存
   - JDK 9+默认

5. ZGC（Z Garbage Collector）
   - 染色指针
   - 亚毫秒级停顿
   - 适合超大内存
```

### 8.4 OOM 排查

**⭐ 面试问题：如何排查 OOM 问题？**

**答案：**
```
OOM 排查步骤：
1. 获取堆dump文件
   - -XX:+HeapDumpOnOutOfMemoryError
   - jmap -dump:format=b,file=heap.hprof <pid>

2. 分析dump文件
   - MAT（Memory Analyzer Tool）
   - JVisualVM
   - JProfiler

3. 定位问题
   - 找到大对象
   - 分析对象引用链
   - 定位代码位置

4. 解决问题
   - 增大堆内存
   - 修复内存泄漏
   - 优化代码
```

**代码示例：**
```java
// -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/heap.hprof
public class OOMTroubleshooting {
    public static void main(String[] args) {
        List<Object> list = new ArrayList<>();
        while (true) {
            list.add(new Object());
        }
    }
}
```

### 8.5 CMS vs G1

**⭐ 面试问题：CMS 和 G1 有什么区别？**

**答案：**
```
CMS（Concurrent Mark Sweep）：
- 算法：标记-清除
- 停顿：低停顿
- 内存：有内存碎片
- 适用：中小内存、低延迟场景
- 缺点：CPU敏感、浮动垃圾、退化为Serial Old

G1（Garbage First）：
- 算法：标记-整理
- 停顿：可预测停顿
- 内存：无内存碎片
- 适用：大内存、低延迟场景
- 优点：Region分区、Mixed GC、停顿预测

选择建议：
- JDK 8及以下：中小内存用CMS，大内存用G1
- JDK 9及以上：默认使用G1
- 超大内存（>32GB）：考虑ZGC
```

### 8.6 ZGC 特点

**⭐ 面试问题：ZGC 有什么特点？**

**答案：**
```
ZGC（Z Garbage Collector）特点：
1. 亚毫秒级停顿（<10ms）
2. 支持TB级堆内存
3. 并发整理（无内存碎片）
4. 染色指针技术
5. 读屏障机制

核心技术：
- 染色指针：使用指针的保留位标记对象状态
- 读屏障：每次访问对象时检查指针颜色
- 并发重定位：移动对象时并发更新引用

适用场景：
- 超大内存（>32GB）
- 低延迟要求
- JDK 11+

限制：
- 不支持压缩指针（JDK 16+ 已支持）
- 不支持分代GC（JDK 21 引入分代ZGC）
```

### 8.7 对象什么时候进入老年代

**⭐ 面试问题：对象什么时候进入老年代？**

**答案：**
```
对象进入老年代的时机：
1. 大对象直接进入老年代
   - -XX:PretenureSizeThreshold=3M

2. 长期存活对象进入老年代
   - 年龄达到阈值（默认15）
   - -XX:MaxTenuringThreshold=15

3. 动态年龄判定
   - Survivor区中相同年龄对象大小总和 > Survivor空间一半
   - 该年龄及以上对象进入老年代

4. 空间分配担保
   - Survivor空间不足
   - 晋升对象 > 老年代剩余空间
   - 触发Full GC

5. CMS GC时
   - Survivor空间不足
   - 直接晋升到老年代
```

**代码示例：**
```java
// -Xms20m -Xmx20m -Xmn10m -XX:MaxTenuringThreshold=15
public class OldGenPromotionDemo {
    private static final int _1MB = 1024 * 1024;

    public static void main(String[] args) {
        // 大对象直接进入老年代
        byte[] bigObject = new byte[4 * _1MB];

        // 长期存活进入老年代
        for (int i = 0; i < 20; i++) {
            byte[] object = new byte[_1MB];
        }
    }
}
```

### 8.8 GC Roots 有哪些

**⭐ 面试问题：GC Roots 有哪些？**

**答案：**
```
GC Roots 包括：
1. 虚拟机栈中引用的对象
   - 栈帧中的局部变量
   - 方法参数

2. 方法区中类静态属性引用的对象
   - static修饰的变量

3. 方法区中常量引用的对象
   - final修饰的常量

4. 本地方法栈中JNI引用的对象
   - Native方法引用的对象

5. Java虚拟机内部的引用
   - Class对象
   - 异常对象
   - 类加载器

6. 所有被同步锁持有的对象
   - synchronized锁住的对象
```

**代码示例：**
```java
public class GCRootsExample {
    // GC Root 2: 方法区静态变量
    private static Object staticRef = new Object();

    // GC Root 3: 方法区常量
    private static final Object CONSTANT = new Object();

    public void method() {
        // GC Root 1: 虚拟机栈局部变量
        Object localVar = new Object();

        // 可达对象
        Object reachable = localVar;

        // 不可达对象
        Object unreachable = new Object();
        unreachable = null;
    }

    // GC Root 4: 本地方法栈
    private native void nativeMethod();
}
```

---

## 附录：JVM 参数速查表

### 堆内存参数
```bash
-Xms4g                    # 初始堆大小
-Xmx4g                    # 最大堆大小
-Xmn2g                    # 新生代大小
-XX:NewRatio=2            # 新生代:老年代 = 1:2
-XX:SurvivorRatio=8       # Eden:Survivor = 8:1
```

### GC 参数
```bash
-XX:+UseSerialGC          # Serial GC
-XX:+UseParallelGC        # Parallel GC
-XX:+UseConcMarkSweepGC   # CMS GC
-XX:+UseG1GC              # G1 GC
-XX:+UseZGC               # ZGC GC
```

### GC 日志参数
```bash
-XX:+PrintGCDetails       # 打印GC详情
-XX:+PrintGCDateStamps    # 打印时间戳
-Xloggc:/path/to/gc.log   # GC日志文件
```

### 元空间参数
```bash
-XX:MetaspaceSize=256m    # 元空间初始大小
-XX:MaxMetaspaceSize=512m # 元空间最大大小
```

### 栈参数
```bash
-Xss512k                  # 线程栈大小
```

### OOM 参数
```bash
-XX:+HeapDumpOnOutOfMemoryError  # OOM时dump
-XX:HeapDumpPath=/path/to/dump    # dump路径
```

---

## 总结

本文档涵盖了JVM虚拟机的核心知识点，包括：
- JVM架构和类加载机制
- 运行时数据区详解
- 垃圾回收算法和回收器
- JIT编译和优化
- Java内存模型
- JVM调优实战
- 面试高频问题

**面试重点：**
1. GC算法和垃圾回收器（最高频）
2. 类加载双亲委派
3. JVM内存模型
4. OOM排查
5. CMS vs G1
6. 对象晋升老年代
7. GC Roots

**学习建议：**
1. 理解原理，不要死记硬背
2. 结合实际代码和日志分析
3. 多做实验，观察GC行为
4. 关注JDK新版本的GC改进

**推荐资源：**
- 《深入理解Java虚拟机》- 周志明
- Oracle官方JVM文档
- OpenJDK源码
- Arthas、MAT等工具实践

---

## 补充知识点

### 补充一、G1 GC 详细调优（⭐⭐中频）

#### 1. Region 划分

G1（Garbage-First）将堆内存划分为多个大小相等的 Region（默认约 2048 个），每个 Region 可以动态扮演不同角色：

```
堆内存（G1 Region 划分）
┌──────────────────────────────────────────────┐
│  Eden      Eden      Eden      Eden          │
│  Survivor  Survivor  Survivor                │
│  Old       Old       Old       Old           │
│  Humongous Humongous                        │
│  Free      Free      Free                    │
└──────────────────────────────────────────────┘

Region 类型：
  - Eden Region：存放新创建的对象
  - Survivor Region：存放经过 Minor GC 后存活的对象
  - Old Region：存放长期存活的对象
  - Humongous Region：存放大对象（大小超过 Region 容量 50% 的对象）
  - Free Region：空闲 Region
```

```bash
# G1HeapRegionSize 默认值计算
# 堆大小 / 2048，范围 1MB ~ 32MB，且必须是 2 的幂次方
# 例如：堆 4GB → Region = 4GB/2048 = 2MB
-XX:G1HeapRegionSize=4m  # 手动指定 Region 大小
```

#### 2. Mixed GC 触发条件

G1 的 GC 分为三种类型：

```
1. Young GC（年轻代 GC）
   - 触发条件：Eden Region 满了
   - 回收范围：所有 Eden + Survivor Region
   - 特点：STW，但停顿时间可控

2. Mixed GC（混合 GC）
   - 触发条件：Old Region 占用达到阈值（-XX:InitiatingHeapOccupancyPercent，默认 45%）
   - 回收范围：所有 Young Region + 部分 Old Region（回收收益最大的 Region 优先）
   - 特点：STW，G1 通过 RSet（Remembered Set）跟踪跨 Region 引用

3. Full GC
   - 触发条件：Mixed GC 后仍无法腾出足够空间
   - 特点：退化到 Serial Full GC，单线程，停顿极长！应尽量避免
```

#### 3. G1 调优参数

```bash
# 核心调优参数
-XX:MaxGCPauseMillis=200          # 目标最大停顿时间（默认200ms），G1 会尽力达成
-XX:G1HeapRegionSize=4m           # Region 大小（1m/2m/4m/8m/16m/32m）
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记的堆占用阈值（默认45%）
-XX:G1MixedGCCountTarget=8        # Mixed GC 中期望回收的 Old Region 轮数（默认8）
-XX:G1ReservePercent=10           # 保留空闲 Region 百分比，防止 to-space exhaustion（默认10%）
-XX:MaxTenuringThreshold=15       # 晋升老年代的年龄阈值
-XX:G1NewSizePercent=5            # 年轻代最小占比（默认5%）
-XX:G1MaxNewSizePercent=60        # 年轻代最大占比（默认60%）

# 推荐配置（16GB 堆）
java -Xms16g -Xmx16g \
     -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=200 \
     -XX:G1HeapRegionSize=8m \
     -XX:InitiatingHeapOccupancyPercent=45 \
     -XX:+PrintGCDetails -XX:+PrintGCDateStamps \
     -Xloggc:/var/log/gc.log
```

#### 4. 为什么 G1 能实现可预测停顿

```
G1 可预测停顿的核心机制：

1. Region 化分：将堆分成小 Region，每次只回收部分 Region，而非整个堆
2. 停顿时间模型：维护每个 Region 的回收价值（垃圾占比 × Region 大小）
   → 优先回收垃圾最多的 Region（Garbage-First 名字的由来）
   → 在 MaxGCPauseMillis 时间内，选择回收价值最高的 Region 子集
3. 并发标记：使用并发标记阶段（与用户线程并发执行），减少 STW 时间
4. RSet（Remembered Set）：记录其他 Region 对当前 Region 的引用
   → 避免全堆扫描，只需扫描 RSet 即可确定存活对象
```

> ⭐ **面试问答：G1 和 CMS 的区别？**
>
> 答：(1) G1 将堆划分为 Region，CMS 使用固定分代（Eden/Survivor/Old）。(2) G1 有内存整理（Compaction），CMS 不整理（会产生碎片）。(3) G1 可预测停顿时间，CMS 不能。(4) G1 回收收益最大的 Region 优先，CMS 回收整个 Old 区。(5) CMS 在 JDK 14 被移除，G1 是 JDK 9+ 的默认 GC。

---

### 补充二、ZGC 详细原理（⭐⭐中频）

ZGC（Z Garbage Collector）是 JDK 11 引入的超低延迟 GC，目标是将停顿时间控制在 10ms 以内（JDK 16+ 降至 1ms 以内）。

#### 1. 染色指针（Colored Pointers）

ZGC 在 64 位指针的高位存储 GC 相关信息（元数据），称为染色指针：

```
64 位指针布局（Linux 64-bit）：
┌────────┬──────┬──────┬──────────────────────────┐
│ 0(1bit)│Final(1bit)│Remap(1bit)│Marked0/Marked1(1bit)│ 未使用(4bit) │ 对象地址(44bit)  │
└────────┴──────┴──────┴──────────────────────────┘

指针中的标志位：
  Marked0 / Marked1：标记位（三色标记中的"黑/灰"状态，交替使用）
  Remap：重映射位（标记对象是否已移动到新地址）
  Final：终结位（标记对象是否只能通过 Finalizer 访问）
  0：固定为 0，用于区分染色指针和普通指针

染色指针的优势：
  - 不需要在对象头存储标记信息，减少对象头开销
  - 转移对象时，只需修改指针，不需要修改对象头
  - 支持并发转移（转移后旧地址仍可访问）
```

#### 2. 读屏障（Read Barrier）

ZGC 使用读屏障（而非写屏障）来实现并发转移：

```java
// 读屏障伪代码
Object loadBarrier(Object reference) {
    // 检查指针的 Remap 位
    if (reference & REMAPPED_BIT == 0) {
        // 对象可能已被转移，需要修正指针
        // slow_path：从转发表中查找新地址
        reference = fixupReference(reference);
    }
    return reference;
}

// 每次 load 引用类型字段时，都会经过读屏障
// 例如：Object obj = field.name;  →  loadBarrier(field.name)
```

```
读屏障 vs 写屏障：
  读屏障：在读取引用时触发（每次读引用的开销）
  写屏障：在写入引用时触发（如 G1/CMS 的 RSet 维护）
  ZGC 选择读屏障的原因：读屏障可以正确处理"对象已转移但引用未更新"的情况
```

#### 3. 并发转移（Concurrent Relocation）

ZGC 的核心创新是**并发转移**，转移对象时不需要 STW：

```
ZGC GC 周期流程：
  1. 暂停初始标记（STW，极短 < 1ms）
     → 标记 GC Roots 直接引用的对象
  2. 并发标记（与用户线程并发）
     → 遍历对象图，通过读屏障标记存活对象
  3. 暂停再标记（STW，极短）
     → 处理并发标记期间的变更
  4. 并发转移预备（与用户线程并发）
     → 选择需要转移的 Region
  5. 暂停初始转移（STW，极短）
     → 将存活对象从旧 Region 复制到新 Region
     → 更新 GC Roots 引用
  6. 并发转移（与用户线程并发）
     → 通过读屏障，在访问旧地址时自动修正为新地址
     → 应用线程访问到已转移的对象时，读屏障会修正指针
```

#### 4. ZGC 的代际支持（JDK 21+）

```
JDK 21 引入分代 ZGC（Generational ZGC）：
  - 分为年轻代和老年代
  - 年轻代 Region 和老年代 Region 可以动态转换
  - 大多数对象在年轻代就被回收（Weak Generational Hypothesis）
  - 老年代回收频率低，进一步减少停顿

启用方式：
  java -XX:+UseZGC -XX:+ZGenerational  # JDK 21+
```

> ⭐ **面试问答：ZGC 为什么能做到亚毫秒级停顿？**
>
> 答：(1) 染色指针将 GC 信息存储在指针中，转移对象时只需修改指针。(2) 读屏障在访问引用时自动修正已转移对象的地址，实现并发转移。(3) 大部分工作（标记、转移）都与用户线程并发执行，STW 阶段极少且极短。(4) 转发表（Forwarding Table）记录对象的新旧地址映射，读屏障通过查表修正指针。

---

### 补充三、直接内存（Direct Memory）与 ByteBuffer（⭐⭐中频）

#### 1. NIO 直接内存

```java
// 堆内存 Buffer（HeapByteBuffer）
ByteBuffer heapBuffer = ByteBuffer.allocate(1024);
// 数据存储在 JVM 堆中，受 GC 管理
// 每次 IO 都需要拷贝到内核空间

// 直接内存 Buffer（DirectByteBuffer）
ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
// 数据存储在堆外内存（Native Memory），不受 GC 直接管理
// IO 时直接与内核空间交互，减少一次拷贝
```

```
IO 拷贝对比：

堆 Buffer IO 流程（4次拷贝）：
  磁盘 → 内核缓冲区 → JVM 堆缓冲区 → 内核 Socket 缓冲区 → 网卡

直接 Buffer IO 流程（3次拷贝）：
  磁盘 → 内核缓冲区 → 直接内存 → 内核 Socket 缓冲区 → 网卡

零拷贝（sendfile，2次拷贝）：
  磁盘 → 内核缓冲区 → 网卡（DMA 直接传输）
```

#### 2. -XX:MaxDirectMemorySize

```bash
# 直接内存大小限制（默认与 -Xmx 相等）
-XX:MaxDirectMemorySize=256m

# DirectByteBuffer 的内存分配通过 Unsafe.allocateMemory()
# 内存释放依赖 GC（Cleaner 机制），如果不及时 GC 可能导致 OOM
# 注意：直接内存 OOM 不会在堆内存 OOM 时触发，而是抛出
#   OutOfMemoryError: Direct buffer memory
```

#### 3. 零拷贝原理

```java
// 1. mmap（内存映射）
// 将文件映射到内存地址空间，用户空间与内核空间共享同一块内存
FileChannel channel = new RandomAccessFile("data.txt", "r").getChannel();
MappedByteBuffer mappedBuffer = channel.map(
    FileChannel.MapMode.READ_ONLY, 0, channel.size()
);

// 2. sendfile（零拷贝传输）
// 数据从文件描述符直接传输到 Socket 描述符，不经过用户空间
FileChannel source = new FileInputStream("data.txt").getChannel();
FileChannel dest = new FileOutputStream("output.txt").getChannel();
// transferTo 底层调用 sendfile 系统调用
source.transferTo(0, source.size(), dest);

// 3. Netty 中的零拷贝
// FileRegion：封装了 transferTo
// CompositeByteBuf：逻辑合并多个 Buffer，避免内存拷贝
```

> ⭐ **面试问答：直接内存和堆内存有什么区别？**
>
> 答：直接内存（Direct Memory）是通过 `Unsafe.allocateMemory()` 分配的堆外内存，不受 JVM GC 直接管理。优点是 IO 性能好（减少一次内核-用户空间拷贝），缺点是分配/回收开销大，且不受 JVM 堆大小限制（受 MaxDirectMemorySize 限制）。堆内存受 GC 管理，分配快，但 IO 时需要额外拷贝。Netty 广泛使用直接内存（PoolArena）来提升网络 IO 性能。

---

### 补充四、类加载的主动引用 vs 被动引用（⭐⭐中频）

#### 1. 五种主动引用场景（会触发类初始化）

JVM 规范规定，只有**主动引用**才会触发类的初始化（执行 `<clinit>()` 方法）：

```java
// 1. new 关键字创建对象
MyClass obj = new MyClass();  // 触发 MyClass 初始化

// 2. 访问类的静态字段（getstatic）
int value = MyClass.staticField;  // 触发 MyClass 初始化

// 3. 设置类的静态字段（putstatic）
MyClass.staticField = 10;  // 触发 MyClass 初始化

// 4. 调用类的静态方法（invokestatic）
MyClass.staticMethod();  // 触发 MyClass 初始化

// 5. 反射调用
Class.forName("com.example.MyClass");  // 触发初始化
// 注意：Class.forName() 默认触发初始化
// Class.forName("xxx", false, loader) 的第二个参数 false 表示不初始化
```

#### 2. 被动引用不会触发初始化的情况

```java
// 1. 通过子类引用父类的静态字段，只初始化父类，不初始化子类
class Parent { static int value = 100; }
class Child extends Parent {}
int v = Child.value;  // 只初始化 Parent，不初始化 Child

// 2. 通过数组定义引用类，不会触发初始化
MyClass[] array = new MyClass[10];  // 不会初始化 MyClass
// 只会创建一个 [Lcom.example.MyClass 的数组类

// 3. 引用类的常量不会触发初始化
// 编译期常量会被放入调用类的常量池中
class Constants {
    public static final String NAME = "Hello";  // 编译期常量
    public static final int NUM = 100;
}
String name = Constants.NAME;  // 不会触发 Constants 初始化！
// 因为 NAME 是编译期常量，编译时已经内联到调用方

// 注意：如果常量的值在编译期无法确定，则仍会触发初始化
class RuntimeConstants {
    public static final String UUID = java.util.UUID.randomUUID().toString();
    // 运行时才能确定，不是编译期常量
}
String uuid = RuntimeConstants.UUID;  // 会触发 RuntimeConstants 初始化
```

> ⭐ **面试问答：什么时候会触发类加载？**
>
> 答：类加载分为加载（Loading）、链接（Linking）、初始化（Initialization）三个阶段。加载不一定触发初始化。只有主动引用才会触发初始化：new 创建对象、访问/设置静态字段、调用静态方法、反射（Class.forName()）。被动引用不会触发初始化：通过子类引用父类静态字段（只初始化父类）、定义数组引用类、引用编译期常量。

---

### 补充五、JIT 编译优化深入（⭐⭐中频）

#### 1. 方法内联条件

方法内联是 JIT 编译器最重要的优化，将方法调用替换为方法体代码，消除调用开销：

```java
// 内联前
int add(int a, int b) { return a + b; }
int result = add(1, 2);

// 内联后（编译器直接替换）
int result = 1 + 2;
```

```bash
# 内联相关参数
-XX:MaxInlineSize=35           # 小于此字节码大小的方法会被内联（默认35字节）
-XX:FreqInlineSize=325         # 热点方法的最大内联大小（默认325字节）
-XX:MaxRecursiveInlineLevel=3  # 最大递归内联层数

# 查看内联日志
-XX:+PrintInlining
```

```
方法内联的条件：
  1. 方法体足够小（< MaxInlineSize）
  2. 方法是热点代码（被多次调用）
  3. 非虚方法（static、private、final、构造器）更容易被内联
  4. 虚方法如果只有一个实现（CHA 分析），也可以内联
  5. 方法不能太大（超过 FreqInlineSize 且不是极热点）
```

#### 2. On-Stack Replacement (OSR)

OSR 允许在方法执行过程中，将解释执行切换为编译执行（栈上替换）：

```
场景：一个方法包含一个很长的循环
void hotLoop() {
    for (int i = 0; i < 1000000; i++) {
        // 循环体被识别为热点
        // OSR 将整个方法的执行从解释器切换到 JIT 编译后的代码
    }
}

OSR 的触发条件：
  - 方法体中某个循环被识别为热点（执行次数超过阈值）
  - 但方法本身可能还没被完全编译
  - JIT 编译器编译该循环体
  - 运行时将执行状态从解释器切换到编译后的代码
```

#### 3. 分层编译（Interpreter → C1 → C2）

```
JDK 8+ 默认启用分层编译（Tiered Compilation）：

层级 0：解释执行（Interpreter）
  → 所有方法最初以解释方式执行
  → 收集 profiling 信息（方法调用次数、分支跳转频率等）

层级 1：C1 编译（Client Compiler）
  → 简单、快速的编译
  → 基本的优化：方法内联、常量折叠
  → 编译速度快，但优化程度有限

层级 2：C1 编译 + profiling
  → 带有 profiling 的 C1 编译
  → 收集更多的运行时信息

层级 3：C1 编译 + 完整 profiling
  → 收集所有 profiling 信息

层级 4：C2 编译（Server Compiler）
  → 深度优化编译
  → 优化：逃逸分析、锁消除、标量替换、循环优化、死代码消除
  → 编译慢，但生成的代码执行效率最高

编译流程：
  解释执行 → (热点探测) → C1 快速编译 → (更热) → C2 深度优化编译

热点探测阈值：
  -XX:CompileThreshold=10000  # 方法调用计数器阈值（默认10000次）
  -XX:BackEdgeThreshold=100000 # 循环回边计数器阈值（默认100000次）
  -XX:OnStackReplacePercentage=140 # OSR 触发比例
```

```bash
# 查看编译日志
-XX:+PrintCompilation

# 关闭分层编译（不推荐）
-XX:-TieredCompilation

# 只使用 C1
-XX:TieredStopAtLevel=1

# 只使用 C2
-XX:-TieredCompilation
```

> ⭐ **面试问答：什么是逃逸分析？**
>
> 答：逃逸分析是 JIT 编译器的优化基础，分析对象的作用域是否"逃逸"出方法或线程。如果对象不逃出方法，可以进行标量替换（将对象拆散为基本类型变量，分配在栈上）和锁消除（去掉不必要的同步）。逃逸分析本身不直接优化代码，但为其他优化提供依据。JDK 7+ 默认开启逃逸分析（`-XX:+DoEscapeAnalysis`）。
