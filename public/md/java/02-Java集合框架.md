# Java 集合框架知识体系

> 面向5年经验Java工程师面试知识储备。读者熟悉React，需快速掌握Java核心知识。

---

## 一、集合框架总览

### 1.1 Collection vs Map 接口体系图

```
Iterable
  └── Collection
        ├── List（有序、可重复）
        │     ├── ArrayList      → 动态数组
        │     ├── LinkedList     → 双向链表
        │     ├── Vector         → 动态数组（线程安全，已淘汰）
        │     └── CopyOnWriteArrayList → 读写分离（线程安全）
        │
        ├── Set（无序、不可重复）
        │     ├── HashSet        → HashMap
        │     ├── LinkedHashSet  → HashMap + 双向链表
        │     └── TreeSet        → 红黑树
        │
        └── Queue（队列）
              ├── PriorityQueue   → 堆
              ├── ArrayDeque      → 循环数组
              ├── LinkedList      → 同时实现Deque
              └── BlockingQueue
                    ├── ArrayBlockingQueue
                    ├── LinkedBlockingQueue
                    └── DelayQueue

Map（键值对）
  ├── HashMap           → 数组 + 链表 + 红黑树
  ├── LinkedHashMap     → HashMap + 双向链表
  ├── TreeMap           → 红黑树
  ├── Hashtable         → 线程安全（已淘汰）
  ├── ConcurrentHashMap → CAS + synchronized
  └── WeakHashMap       → 弱引用键
```

### 1.2 Iterable 接口与 for-each 语法

所有集合类都实现了 `Iterable` 接口，`for-each` 语法本质是调用 `iterator()` 方法：

```java
// for-each 语法糖
List<String> list = new ArrayList<>();
for (String s : list) {
    System.out.println(s);
}

// 编译后等价于
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    System.out.println(s);
}
```

`Iterable` 接口定义：

```java
public interface Iterable<T> {
    Iterator<T> iterator();
    // JDK 8 新增：支持Lambda的forEach
    default void forEach(Consumer<? super T> action) {
        Objects.requireNonNull(action);
        for (T t : this) {
            action.accept(t);
        }
    }
    // JDK 8 新增：支持Spliterator并行迭代
    default Spliterator<T> spliterator() {
        return Spliterators.spliteratorUnknownSize(iterator(), 0);
    }
}
```

### 1.3 集合的选择策略

```
需要键值对？
  ├── 是 → 需要排序？→ TreeMap
  │        ├── 否 → 需要线程安全？→ ConcurrentHashMap
  │        │        ├── 否 → 需要维护插入/访问顺序？→ LinkedHashMap
  │        │        │        └── 否 → HashMap
  │
需要有序集合（List）？
  ├── 查询多 → ArrayList
  ├── 增删多 → LinkedList
  └── 读多写少 + 线程安全 → CopyOnWriteArrayList

需要去重（Set）？
  ├── 需要排序 → TreeSet
  ├── 需要维护插入顺序 → LinkedHashSet
  └── 无特殊要求 → HashSet
```

> ⭐ **面试高频问题**：说说集合框架的体系结构？
>
> 答：Java集合框架主要分为两大体系——Collection和Map。Collection继承自Iterable，包含List（有序可重复）、Set（无序不可重复）、Queue（队列）三个子接口。Map是独立的键值对接口。List下最常用ArrayList（动态数组）和LinkedList（双向链表）；Set下HashSet基于HashMap实现，TreeSet基于红黑树；Map下HashMap是最常用的实现，ConcurrentHashMap是线程安全的哈希表。

---

## 二、List 接口

### 2.1 ArrayList

#### 底层数据结构

ArrayList 底层是一个 `Object[]` 数组：

```java
public class ArrayList<E> extends AbstractList<E>
        implements List<E>, RandomAccess, Cloneable, java.io.Serializable {
    // 默认初始容量 10（注意：无参构造时延迟到首次 add 时分配）
    private static final int DEFAULT_CAPACITY = 10;
    // 空数组（用于无参构造）
    private static final Object[] EMPTY_ELEMENTDATA = {};
    // 存储元素的数组缓冲区
    transient Object[] elementData;
    // 元素个数
    private int size;
}
```

#### 扩容机制

```java
// 无参构造：初始为空数组，首次add时扩容到10
public ArrayList() {
    this.elementData = EMPTY_ELEMENTDATA;
}

// 指定初始容量
public ArrayList(int initialCapacity) {
    if (initialCapacity > 0) {
        this.elementData = new Object[initialCapacity];
    } else if (initialCapacity == 0) {
        this.elementData = EMPTY_ELEMENTDATA;
    } else {
        throw new IllegalArgumentException("Illegal Capacity: " + initialCapacity);
    }
}

// add() 方法
public boolean add(E e) {
    ensureCapacityInternal(size + 1);  // 确保容量足够
    elementData[size++] = e;
    return true;
}

private void ensureCapacityInternal(int minCapacity) {
    // 如果是空数组，取默认容量10和minCapacity的最大值
    if (elementData == EMPTY_ELEMENTDATA) {
        minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
    }
    ensureExplicitCapacity(minCapacity);
}

private void ensureExplicitCapacity(int minCapacity) {
    modCount++;  // 修改计数器+1（fail-fast机制）
    // 如果需要的最小容量大于当前数组长度，则扩容
    if (minCapacity - elementData.length > 0)
        grow(minCapacity);
}

// 核心扩容方法
private void grow(int minCapacity) {
    int oldCapacity = elementData.length;
    // 新容量 = 旧容量 + 旧容量/2 = 1.5倍
    int newCapacity = oldCapacity + (oldCapacity >> 1);
    // 溢出处理
    if (newCapacity - minCapacity < 0)
        newCapacity = minCapacity;
    // 最大容量限制
    if (newCapacity - MAX_ARRAY_SIZE > 0)
        newCapacity = hugeCapacity(minCapacity);
    // 数组拷贝
    elementData = Arrays.copyOf(elementData, newCapacity);
}
```

**扩容流程图**：

```
add(e)
  → ensureCapacityInternal(size + 1)
    → 如果是空数组：minCapacity = max(10, size+1) = 10
    → ensureExplicitCapacity(minCapacity)
      → modCount++
      → 如果 minCapacity > elementData.length
        → grow(minCapacity)
          → newCapacity = oldCapacity + (oldCapacity >> 1)  // 1.5倍
          → Arrays.copyOf()  // 底层调用 System.arraycopy()
```

#### add/remove/get 时间复杂度

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| `get(int index)` | O(1) | 数组随机访问 |
| `add(E e)` | 均摊O(1) | 末尾添加，偶尔扩容O(n) |
| `add(int index, E e)` | O(n) | 需要移动元素 |
| `remove(int index)` | O(n) | 需要移动元素 |
| `remove(Object o)` | O(n) | 遍历查找+移动元素 |

```java
// 指定位置插入
public void add(int index, E element) {
    rangeCheckForAdd(index);
    ensureCapacityInternal(size + 1);
    // 将index及之后的元素整体后移一位
    System.arraycopy(elementData, index, elementData, index + 1, size - index);
    elementData[index] = element;
    size++;
}

// 指定位置删除
public E remove(int index) {
    rangeCheck(index);
    modCount++;
    E oldValue = elementData(index);
    int numMoved = size - index - 1;
    if (numMoved > 0)
        // 将index+1及之后的元素整体前移一位
        System.arraycopy(elementData, index + 1, elementData, index, numMoved);
    elementData[--size] = null; // help GC
    return oldValue;
}
```

#### modCount 与 fail-fast 机制

`modCount`（modification count）记录集合被结构化修改的次数。迭代器在创建时会记录 `expectedModCount`，每次 `next()` 时检查两者是否一致：

```java
// ArrayList.Itr
private class Itr implements Iterator<E> {
    int cursor;       // 下一个要返回的元素索引
    int lastRet = -1; // 上一个返回的元素索引
    int expectedModCount = modCount; // 创建迭代器时记录

    public E next() {
        checkForComodification(); // 检查是否被并发修改
        int i = cursor;
        if (i >= size)
            throw new NoSuchElementException();
        Object[] elementData = ArrayList.this.elementData;
        if (i >= elementData.length)
            throw new ConcurrentModificationException();
        cursor = i + 1;
        return (E) elementData[lastRet = i];
    }

    final void checkForComodification() {
        if (modCount != expectedModCount)
            throw new ConcurrentModificationException();
    }
}
```

```java
// fail-fast 演示
List<String> list = new ArrayList<>(Arrays.asList("A", "B", "C"));
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    String s = it.next();
    if ("B".equals(s)) {
        list.remove(s); // 直接操作集合，抛出 ConcurrentModificationException
    }
}

// 正确做法：使用迭代器的remove方法
Iterator<String> it2 = list.iterator();
while (it2.hasNext()) {
    String s = it2.next();
    if ("B".equals(s)) {
        it2.remove(); // 安全删除，会同步 expectedModCount
    }
}
```

#### ArrayList vs Vector

| 特性 | ArrayList | Vector |
|------|-----------|--------|
| 线程安全 | 不安全 | 安全（所有方法synchronized） |
| 扩容倍数 | 1.5倍 | 2倍 |
| 性能 | 高 | 低（锁竞争严重） |
| 推荐使用 | 是 | 否（已淘汰） |
| 迭代器 | fail-fast | fail-fast |
| JDK版本 | JDK 1.2 | JDK 1.0 |

> ⭐ **面试高频问题**：ArrayList 扩容机制是怎样的？
>
> 答：ArrayList 无参构造时初始为空数组，首次 add 时扩容到默认容量10。之后每次扩容为原来的1.5倍（`newCapacity = oldCapacity + (oldCapacity >> 1)`）。扩容通过 `Arrays.copyOf()` 底层调用 `System.arraycopy()` 实现数组拷贝。如果指定了初始容量，则按指定容量初始化。

> ⭐ **面试高频问题**：说说 fail-fast 机制？
>
> 答：fail-fast 是Java集合的一种错误检测机制。集合类维护一个 `modCount` 字段，每次结构化修改（增删）都递增。迭代器创建时记录 `expectedModCount = modCount`，每次 `next()` 时检查两者是否一致，不一致则抛出 `ConcurrentModificationException`。这不是线程安全的保证，而是一种防御性编程。与之对应的是 fail-safe（如 CopyOnWriteArrayList），在迭代时使用集合的快照，不会抛出异常。

---

### 2.2 LinkedList

#### 底层数据结构

LinkedList 同时实现了 `List` 和 `Deque` 接口，底层是双向链表：

```java
public class LinkedList<E>
    extends AbstractSequentialList<E>
    implements List<E>, Deque<E>, Cloneable, java.io.Serializable {

    transient int size = 0;
    // 头节点
    transient Node<E> first;
    // 尾节点
    transient Node<E> last;

    // 节点结构
    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;
        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }
}
```

#### 源码关键方法分析

```java
// 头部插入 O(1)
private void linkFirst(E e) {
    final Node<E> f = first;
    final Node<E> newNode = new Node<>(null, e, f);
    first = newNode;
    if (f == null)
        last = newNode;
    else
        f.prev = newNode;
    size++;
    modCount++;
}

// 尾部插入 O(1)
void linkLast(E e) {
    final Node<E> l = last;
    final Node<E> newNode = new Node<>(l, e, null);
    last = newNode;
    if (l == null)
        first = newNode;
    else
        l.next = newNode;
    size++;
    modCount++;
}

// 指定节点前插入 O(1)
void linkBefore(E e, Node<E> succ) {
    final Node<E> pred = succ.prev;
    final Node<E> newNode = new Node<>(pred, e, succ);
    succ.prev = newNode;
    if (pred == null)
        first = newNode;
    else
        pred.next = newNode;
    size++;
    modCount++;
}

// 删除头节点 O(1)
private E unlinkFirst(Node<E> f) {
    final E element = f.item;
    final Node<E> next = f.next;
    f.item = null;
    f.next = null; // help GC
    first = next;
    if (next == null)
        last = null;
    else
        next.prev = null;
    size--;
    modCount++;
    return element;
}

// get(int index) —— 需要遍历，O(n)
public E get(int index) {
    checkElementIndex(index);
    return node(index).item;
}

// 根据索引查找节点：前半部分从头遍历，后半部分从尾遍历
Node<E> node(int index) {
    if (index < (size >> 1)) {
        Node<E> x = first;
        for (int i = 0; i < index; i++)
            x = x.next;
        return x;
    } else {
        Node<E> x = last;
        for (int i = size - 1; i > index; i--)
            x = x.prev;
        return x;
    }
}
```

#### 同时实现 List 和 Deque

LinkedList 作为 Deque 使用：

```java
LinkedList<String> deque = new LinkedList<>();

// 作为栈使用（后进先出）
deque.push("A");    // 等价于 addFirst
deque.push("B");
String top = deque.pop();  // "B"，等价于 removeFirst

// 作为队列使用（先进先出）
deque.offer("C");   // 等价于 addLast
String head = deque.poll(); // "C"，等价于 removeFirst

// 作为双端队列
deque.addFirst("X");
deque.addLast("Y");
String first = deque.removeFirst(); // "X"
String last = deque.removeLast();   // "Y"
```

#### ArrayList vs LinkedList 选择

| 特性 | ArrayList | LinkedList |
|------|-----------|------------|
| 底层结构 | 动态数组 | 双向链表 |
| 随机访问 get(i) | O(1) | O(n) |
| 头部插入/删除 | O(n) | O(1) |
| 尾部插入/删除 | 均摊O(1) | O(1) |
| 中间插入/删除 | O(n) | O(n)（查找O(n)+操作O(1)） |
| 内存占用 | 紧凑 | 每个节点额外两个指针 |
| CPU缓存友好 | 是（连续内存） | 否（分散内存） |
| 实现接口 | List, RandomAccess | List, Deque |

> ⭐ **面试高频问题**：ArrayList 和 LinkedList 怎么选？
>
> 答：绝大多数场景选 ArrayList。原因：(1) ArrayList 的随机访问 O(1) 远快于 LinkedList 的 O(n)；(2) ArrayList 在尾部操作是均摊 O(1)，而中间操作两者都是 O(n)；(3) 数组的连续内存对 CPU 缓存更友好；(4) LinkedList 每个节点需要额外存储两个指针，内存开销更大。只有在需要频繁在头部插入/删除，或者需要同时作为栈/队列/双端队列使用时，才考虑 LinkedList。实际开发中，队列场景通常直接用 ArrayDeque。

---

### 2.3 CopyOnWriteArrayList

#### 读写分离原理

CopyOnWriteArrayList 采用"写时复制"策略：写操作时先复制一份新数组，在新数组上修改，修改完成后将引用指向新数组。读操作在原数组上进行，无需加锁。

```java
public class CopyOnWriteArrayList<E>
    implements List<E>, RandomAccess, Cloneable, java.io.Serializable {

    // volatile 保证可见性
    transient volatile Object[] array;

    final Object[] getArray() {
        return array;
    }

    final void setArray(Object[] a) {
        array = a;
    }

    // 读操作：无锁，直接读取
    public E get(int index) {
        return elementAt(getArray(), index);
    }

    // 写操作：加锁 + 复制数组
    public boolean add(E e) {
        synchronized (lock) {  // 使用synchronized（JDK 9+实现，JDK 8使用ReentrantLock）
            Object[] es = getArray();
            int len = es.length;
            // 复制新数组，长度+1
            es = Arrays.copyOf(es, len + 1);
            es[len] = e;
            setArray(es);  // 原子替换引用
            return true;
        }
    }

    // 删除操作同理
    public E remove(int index) {
        synchronized (lock) {
            Object[] es = getArray();
            int len = es.length;
            E oldValue = elementAt(es, index);
            int numMoved = len - index - 1;
            Object[] newElements;
            if (numMoved == 0)
                newElements = Arrays.copyOf(es, len - 1);
            else {
                newElements = new Object[len - 1];
                System.arraycopy(es, 0, newElements, 0, index);
                System.arraycopy(es, index + 1, newElements, index, numMoved);
            }
            setArray(newElements);
            return oldValue;
        }
    }
}
```

#### 适用场景

```java
// 典型场景：监听器列表（读多写少）
List<EventListener> listeners = new CopyOnWriteArrayList<>();

// 注册监听器（写操作，低频）
listeners.add(event -> System.out.println("Handler 1: " + event));
listeners.add(event -> System.out.println("Handler 2: " + event));

// 通知监听器（读操作，高频）
for (EventListener listener : listeners) {
    listener.handle("some event"); // 遍历期间无ConcurrentModificationException
}
```

> ⭐ **面试高频问题**：CopyOnWriteArrayList 的原理和适用场景？
>
> 答：CopyOnWriteArrayList 采用写时复制策略，写操作时加锁复制整个底层数组，读操作无锁直接读取。优点是读操作完全无锁，不会抛出 ConcurrentModificationException，适合读多写少的场景（如监听器列表、配置列表）。缺点是：(1) 写操作开销大（需要复制整个数组）；(2) 读操作可能读到旧数据（弱一致性）；(3) 内存占用高（写时存在两份数组）。

---

## 三、Set 接口

### 3.1 HashSet

#### 底层基于 HashMap

```java
public class HashSet<E>
    extends AbstractSet<E>
    implements Set<E>, Cloneable, java.io.Serializable {

    // 底层就是一个HashMap，value统一用PRESENT
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object();

    public HashSet() {
        map = new HashMap<>();
    }

    public boolean add(E e) {
        return map.put(e, PRESENT) == null;  // key是元素，value是固定对象
    }

    public boolean remove(Object o) {
        return map.remove(o) == PRESENT;
    }

    public boolean contains(Object o) {
        return map.containsKey(o);
    }
}
```

#### add() 过程

```
add(e)
  → map.put(e, PRESENT)
    → hash(e) 计算hash值
    → (n - 1) & hash 定位桶索引
    → 桶为空 → 直接插入
    → 桶不为空 → 遍历链表/红黑树
      → 先比较hashCode
      → 再比较equals
      → 都相等 → 不插入，返回false
      → 有不同 → 插入新节点，返回true
```

#### hashCode 和 equals 的约定

```java
// 正确重写 hashCode 和 equals
public class User {
    private String name;
    private int age;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return age == user.age && Objects.equals(name, user.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}

// 测试
Set<User> set = new HashSet<>();
set.add(new User("张三", 25));
set.add(new User("张三", 25)); // 重复，不会添加
set.add(new User("张三", 26)); // age不同，会添加
System.out.println(set.size()); // 2
```

**重要约定**：

1. 两个对象 `equals` 为 true，则 `hashCode` 必须相同
2. 两个对象 `hashCode` 相同，`equals` 不一定为 true（哈希冲突）
3. 重写 `equals` 必须重写 `hashCode`
4. `equals` 方法必须具备：自反性、对称性、传递性、一致性、非空性

> ⭐ **面试高频问题**：HashSet 如何保证元素唯一性？
>
> 答：HashSet 底层基于 HashMap 实现，`add(e)` 实际调用 `map.put(e, PRESENT)`。HashMap 的 key 唯一性保证机制：先计算 key 的 hashCode 定位桶，如果桶中已有元素，则遍历链表/红黑树，逐个比较 hashCode 和 equals。只有当 hashCode 和 equals 都相等时才认为是同一个元素，不重复插入。因此，存入 HashSet 的对象必须正确重写 hashCode() 和 equals()。

---

### 3.2 LinkedHashSet

```java
// LinkedHashSet 继承 HashSet，但使用 LinkedHashMap
public class LinkedHashSet<E> extends HashSet<E> implements Set<E> {

    public LinkedHashSet(int initialCapacity, float loadFactor) {
        super(initialCapacity, loadFactor, true);  // 注意第三个参数 dummy
    }

    // HashSet 的这个构造方法是给 LinkedHashSet 用的
    HashSet(int initialCapacity, float loadFactor, boolean dummy) {
        map = new LinkedHashMap<>(initialCapacity, loadFactor);
    }
}
```

LinkedHashSet = HashMap + 双向链表，维护元素的插入顺序：

```java
Set<String> set = new LinkedHashSet<>();
set.add("C");
set.add("A");
set.add("B");
// 遍历顺序：C → A → B（插入顺序）
for (String s : set) {
    System.out.println(s);
}
```

---

### 3.3 TreeSet

TreeSet 基于 `TreeMap`（红黑树）实现，元素自动排序：

```java
// 自然排序（元素实现 Comparable）
Set<String> set = new TreeSet<>();
set.add("C");
set.add("A");
set.add("B");
// 遍历顺序：A → B → C（自然排序）
System.out.println(set); // [A, B, C]

// 定制排序（使用 Comparator）
Set<User> userSet = new TreeSet<>((u1, u2) -> {
    if (u1.getAge() != u2.getAge()) {
        return u1.getAge() - u2.getAge();  // 按年龄升序
    }
    return u1.getName().compareTo(u2.getName());  // 年龄相同按姓名
});
userSet.add(new User("张三", 25));
userSet.add(new User("李四", 23));
userSet.add(new User("王五", 25));
// 遍历顺序按年龄排序
```

#### Comparable vs Comparator

```java
// 方式一：实现 Comparable（自然排序）
public class User implements Comparable<User> {
    private String name;
    private int age;

    @Override
    public int compareTo(User other) {
        return this.age - other.age; // 按年龄升序
    }
}

// 方式二：使用 Comparator（定制排序）
Comparator<User> byName = Comparator.comparing(User::getName);
Comparator<User> byAge = Comparator.comparingInt(User::getAge);
Comparator<User> byAgeDesc = Comparator.comparingInt(User::getAge).reversed();

// 组合排序
Comparator<User>复合 = Comparator.comparing(User::getAge)
                                  .thenComparing(User::getName);
```

> ⭐ **面试高频问题**：Comparable 和 Comparator 的区别？
>
> 答：Comparable 是"内部比较器"，在类定义时实现 `compareTo()` 方法，属于类的自然排序。Comparator 是"外部比较器"，在使用时传入，可以定义多种排序策略，更灵活。TreeSet/TreeMap 构造时可以传入 Comparator 来覆盖自然排序。优先级：有 Comparator 用 Comparator，没有则用 Comparable。

---

## 四、Map 接口

### 4.1 HashMap（重点！面试最高频）

#### JDK 7 vs JDK 8 结构对比

```
JDK 7：数组 + 链表
  [桶0] → Entry → Entry → Entry
  [桶1] → Entry
  [桶2] → Entry → Entry
  [桶3] → null
  ...

JDK 8：数组 + 链表 + 红黑树
  [桶0] → Node → Node → Node → TreeNode(红黑树)
  [桶1] → Node
  [桶2] → TreeNode(红黑树)
  [桶3] → null
  ...
```

JDK 8 的关键改进：
- 链表过长时转为红黑树，将查询时间复杂度从 O(n) 降到 O(log n)
- 数组+链表+红黑树组合结构

```java
// JDK 8 HashMap 核心属性
public class HashMap<K, V> extends AbstractMap<K, V>
    implements Map<K, V>, Cloneable, Serializable {

    static final int DEFAULT_INITIAL_CAPACITY = 16;    // 默认初始容量
    static final float DEFAULT_LOAD_FACTOR = 0.75f;    // 默认负载因子
    static final int TREEIFY_THRESHOLD = 8;            // 链表转红黑树阈值
    static final int UNTREEIFY_THRESHOLD = 6;          // 红黑树退化阈值
    static final int MIN_TREEIFY_CAPACITY = 64;        // 树化最小数组长度

    transient Node<K, V>[] table;   // 哈希桶数组
    transient int size;             // 键值对数量
    int threshold;                  // 扩容阈值 = capacity * loadFactor
    final float loadFactor;         // 负载因子

    // 链表节点
    static class Node<K, V> implements Map.Entry<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;
    }

    // 红黑树节点
    static final class TreeNode<K, V> extends LinkedHashMap.Entry<K, V> {
        TreeNode<K, V> parent;
        TreeNode<K, V> left;
        TreeNode<K, V> right;
        TreeNode<K, V> prev;    // 删除后需要取消链接
        boolean red;
    }
}
```

#### put() 过程完整分析

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

// hash() 方法：高位参与运算，减少冲突
static final int hash(Object key) {
    int h;
    // key为null时hash值为0（HashMap允许key为null）
    // (h = key.hashCode()) ^ (h >>> 16)：高16位与低16位异或
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

final V putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict) {
    Node<K, V>[] tab;
    Node<K, V> p;
    int n, i;

    // 1. 如果table为空或长度为0，初始化（延迟初始化）
    if ((tab = table) == null || (n = tab.length) == 0)
        n = (tab = resize()).length;

    // 2. 计算桶索引 (n-1) & hash，如果桶为空，直接放入新节点
    if ((p = tab[i = (n - 1) & hash]) == null)
        tab[i] = newNode(hash, key, value, null);

    // 3. 桶不为空，处理冲突
    else {
        Node<K, V> e;
        K k;

        // 3.1 如果首节点的key相同，直接覆盖
        if (p.hash == hash &&
            ((k = p.key) == key || (key != null && key.equals(k))))
            e = p;

        // 3.2 如果是红黑树节点，调用红黑树的插入方法
        else if (p instanceof TreeNode)
            e = ((TreeNode<K, V>) p).putTreeVal(this, tab, hash, key, value);

        // 3.3 链表情况：遍历链表
        else {
            for (int binCount = 0; ; ++binCount) {
                if ((e = p.next) == null) {
                    // 尾部插入新节点
                    p.next = newNode(hash, key, value, null);
                    // 链表长度达到8，尝试树化
                    if (binCount >= TREEIFY_THRESHOLD - 1)
                        treeifyBin(tab, hash);
                    break;
                }
                // 找到相同key，跳出循环
                if (e.hash == hash &&
                    ((k = e.key) == key || (key != null && key.equals(k))))
                    break;
                p = e;
            }
        }

        // 4. 如果找到已存在的key，覆盖旧值
        if (e != null) {
            V oldValue = e.value;
            if (!onlyIfAbsent || oldValue == null)
                e.value = value;
            afterNodeAccess(e);
            return oldValue;
        }
    }

    // 5. 增加修改计数，检查是否需要扩容
    ++modCount;
    if (++size > threshold)
        resize();
    afterNodeInsertion(evict);
    return null;
}
```

**put() 流程图**：

```
put(key, value)
  → hash(key)  // 计算hash值（高位扰动）
  → table为空？→ resize() 初始化
  → (n-1) & hash 定位桶
  → 桶为空？→ 直接放入新节点
  → 桶首节点key相同？→ 覆盖value
  → 是红黑树？→ putTreeVal()
  → 是链表？→ 遍历到尾部插入
    → 链表长度 >= 8？→ treeifyBin()
      → 数组长度 < 64？→ 扩容（优先扩容而非树化）
      → 数组长度 >= 64？→ 转红黑树
  → size > threshold？→ resize() 扩容
```

#### 扩容机制

```java
final Node<K, V>[] resize() {
    Node<K, V>[] oldTab = table;
    int oldCap = (oldTab == null) ? 0 : oldTab.length;
    int oldThr = threshold;
    int newCap, newThr = 0;

    // 计算新容量
    if (oldCap > 0) {
        // 已达最大容量，不扩容
        if (oldCap >= MAXIMUM_CAPACITY) {
            threshold = Integer.MAX_VALUE;
            return oldTab;
        }
        // 新容量 = 旧容量 * 2
        else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                 oldCap >= DEFAULT_INITIAL_CAPACITY)
            newThr = oldThr << 1; // 阈值也翻倍
    }
    // 使用阈值作为初始容量
    else if (oldThr > 0)
        newCap = oldThr;
    // 首次初始化
    else {
        newCap = DEFAULT_INITIAL_CAPACITY;  // 16
        newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY); // 12
    }

    if (newThr == 0) {
        float ft = (float)newCap * loadFactor;
        newThr = (newCap < MAXIMUM_CAPACITY && ft < MAXIMUM_CAPACITY ?
                  (int)ft : Integer.MAX_VALUE);
    }
    threshold = newThr;

    // 创建新数组
    Node<K, V>[] newTab = (Node<K, V>[])new Node[newCap];
    table = newTab;

    // 迁移数据
    if (oldTab != null) {
        for (int j = 0; j < oldCap; ++j) {
            Node<K, V> e;
            if ((e = oldTab[j]) != null) {
                oldTab[j] = null;
                if (e.next == null)
                    // 只有一个节点，直接重新hash
                    newTab[e.hash & (newCap - 1)] = e;
                else if (e instanceof TreeNode)
                    // 红黑树拆分
                    ((TreeNode<K, V>) e).split(this, newTab, j, oldCap);
                else {
                    // 链表拆分：JDK 8 优化
                    // 利用 (hash & oldCap) == 0 判断元素在新数组中的位置
                    Node<K, V> loHead = null, loTail = null;  // 低位链表（原位置）
                    Node<K, V> hiHead = null, hiTail = null;  // 高位链表（原位置+oldCap）
                    Node<K, V> next;
                    do {
                        next = e.next;
                        if ((e.hash & oldCap) == 0) {
                            if (loTail == null) loHead = e;
                            else loTail.next = e;
                            loTail = e;
                        } else {
                            if (hiTail == null) hiHead = e;
                            else hiTail.next = e;
                            hiTail = e;
                        }
                    } while ((e = next) != null);
                    if (loTail != null) {
                        loTail.next = null;
                        newTab[j] = loHead;
                    }
                    if (hiTail != null) {
                        hiTail.next = null;
                        newTab[j + oldCap] = hiHead;
                    }
                }
            }
        }
    }
    return newTab;
}
```

**JDK 8 扩容优化**：扩容时元素的位置要么在原位置，要么在"原位置 + oldCap"。通过 `e.hash & oldCap` 判断：
- 结果为 0：留在原位置
- 结果不为 0：移动到 原位置 + oldCap

#### 树化与退化条件

```java
// 树化方法
final void treeifyBin(Node<K, V>[] tab, int hash) {
    int n, index;
    Node<K, V> e;
    // 数组长度 < 64，优先扩容
    if (tab == null || (n = tab.length) < MIN_TREEIFY_CAPACITY)
        resize();
    else if ((e = tab[index = (n - 1) & hash]) != null) {
        // 将链表转为红黑树
        TreeNode<K, V> hd = null, tl = null;
        do {
            TreeNode<K, V> p = replacementTreeNode(e, null);
            if (tl == null)
                hd = p;
            else {
                p.prev = tl;
                tl.next = p;
            }
            tl = p;
        } while ((e = e.next) != null);
        if ((tab[index] = hd) != null)
            hd.treeify(tab);  // 构建红黑树
    }
}
```

**树化条件（必须同时满足）**：
1. 链表长度 >= 8（`TREEIFY_THRESHOLD`）
2. 数组长度 >= 64（`MIN_TREEIFY_CAPACITY`）

**退化条件**：
- resize() 扩容时，如果红黑树节点数 <= 6（`UNTREEIFY_THRESHOLD`），退化为链表
- 移除节点后也可能触发退化

> ⭐ **面试高频问题**：为什么树化阈值是8，退化阈值是6？
>
> 答：根据泊松分布，hash良好的情况下链表长度达到8的概率仅为0.00000006（千万分之六），属于极端情况。选择8是在时间和空间上的平衡。退化阈值设为6而不是8，是为了避免频繁在链表和红黑树之间转换（如果都是8，插入一个元素树化，删除一个元素退化，会频繁转换）。

#### hash() 方法的高位运算

```java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
```

**为什么要高位扰动？**

HashMap 的桶索引计算方式是 `(n - 1) & hash`，其中 n 是数组长度（2的幂次方）。当 n 较小时（如16），`n-1` 的高位全是0，只有低位参与运算，导致 hash 值的高位信息被浪费，冲突概率增大。

`h ^ (h >>> 16)` 让高16位与低16位异或，使高位信息也参与到桶索引计算中，减少冲突。

```
假设 h = 0b 0100 0101 0011 0010 0001 1010 1101 0011
n = 16, n-1 = 0b 0000 0000 0000 0000 0000 0000 0000 1111

不扰动：h & (n-1) = 0b ...0011（只用最低4位）
扰动后：(h ^ (h>>>16)) & (n-1) = 综合了高低位信息
```

#### 线程不安全的具体表现

**JDK 7：并发扩容导致死循环**

JDK 7 使用"头插法"迁移链表，多线程并发扩容时可能导致链表成环：

```
线程A和线程B同时扩容：
原始链表：1 → 2 → 3

线程A将 1 迁移到新表
线程B也将 1 迁移到新表，但此时 1 的next指向了新表中的节点
形成循环引用：1 → 3 → 2 → 1 → 3 → 2 → ...
后续 get() 操作进入死循环
```

**JDK 8：数据覆盖**

JDK 8 改用"尾插法"解决了死循环问题，但仍存在数据覆盖：

```java
// 两个线程同时执行put()，定位到同一个空桶
// 线程A：if ((p = tab[i = (n - 1) & hash]) == null)  → true
// 线程B：if ((p = tab[i = (n - 1) & hash]) == null)  → true（还没来得及插入）
// 线程A：tab[i] = newNode(...)
// 线程B：tab[i] = newNode(...)  → 覆盖了线程A的数据！
```

> ⭐ **面试高频问题**：HashMap 为什么线程不安全？
>
> 答：HashMap 在多线程环境下主要有两个问题：(1) JDK 7 中并发扩容时，头插法可能导致链表成环，引发 get() 死循环；(2) JDK 8 改用尾插法解决了死循环，但并发 put 时仍可能导致数据覆盖（两个线程同时判断桶为空，都执行插入，后一个覆盖前一个）。此外，并发扩容还可能导致数据丢失。多线程场景应使用 ConcurrentHashMap。

#### HashMap 的 key 为什么推荐用 String/Integer

1. **不可变性**：String 和 Integer 都是不可变类，hashCode 一旦计算就不会变，保证 key 在 HashMap 中的位置不会移动
2. **hashCode 缓存**：String 内部缓存了 hashCode 值，避免重复计算
3. **正确实现了 equals 和 hashCode**：不需要开发者自己重写，避免出错
4. **良好的 hash 分布**：String 的 hashCode 算法设计合理，冲突概率低

```java
// String 的 hashCode 缓存
public final class String {
    private int hash;  // 默认为0，首次计算后缓存

    public int hashCode() {
        int h = hash;
        if (h == 0 && value.length > 0) {
            char val[] = value;
            for (int i = 0; i < value.length; i++) {
                h = 31 * h + val[i];
            }
            hash = h;
        }
        return h;
    }
}
```

> ⭐ **面试高频问题**：HashMap 扩容过程是怎样的？
>
> 答：当 size 超过 threshold（capacity * loadFactor）时触发扩容。默认初始容量16，负载因子0.75，首次扩容阈值为12。扩容时创建一个2倍大小的新数组，然后遍历旧数组迁移元素。JDK 8 的优化：利用 `e.hash & oldCap` 将链表拆分为低位链表（留在原位置）和高位链表（移到原位置+oldCap），避免了像JDK 7那样重新计算每个元素的hash位置，提高了效率。红黑树在扩容时也会拆分，如果拆分后节点数 <= 6 则退化为链表。

---

### 4.2 LinkedHashMap

#### accessOrder 与 LRU 缓存实现

LinkedHashMap 在 HashMap 基础上增加了一个双向链表，可以维护两种顺序：
- **插入顺序**（默认）：按 key 的插入顺序遍历
- **访问顺序**（accessOrder=true）：按 key 的访问顺序遍历（最近访问的在尾部）

```java
public class LinkedHashMap<K, V> extends HashMap<K, V> {

    // 头节点（最久未访问）
    transient LinkedHashMap.Entry<K, V> head;
    // 尾节点（最近访问）
    transient LinkedHashMap.Entry<K, V> tail;
    // 是否按访问顺序排序
    final boolean accessOrder;

    // 节点结构：在HashMap.Node基础上增加了before和after指针
    static class Entry<K, V> extends HashMap.Node<K, V> {
        Entry<K, V> before, after;
        Entry(int hash, K key, V value, Node<K, V> next) {
            super(hash, key, value, next);
        }
    }
}
```

#### LRU 缓存代码示例

```java
/**
 * LRU缓存实现（最近最少使用）
 * 基于LinkedHashMap，重写removeEldestEntry()
 */
public class LRUCache<K, V> extends LinkedHashMap<K, V> {

    private final int maxCapacity;

    public LRUCache(int maxCapacity) {
        // accessOrder=true：按访问顺序排序
        // 最近访问的在尾部，最久未访问的在头部
        super(maxCapacity, 0.75f, true);
        this.maxCapacity = maxCapacity;
    }

    // 当元素数量超过容量时，移除最久未访问的（头部节点）
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > maxCapacity;
    }

    public static void main(String[] args) {
        LRUCache<String, String> cache = new LRUCache<>(3);

        cache.put("A", "1");
        cache.put("B", "2");
        cache.put("C", "3");
        System.out.println(cache.keySet()); // [A, B, C]

        cache.get("A");  // 访问A，A移到尾部
        System.out.println(cache.keySet()); // [B, C, A]

        cache.put("D", "4");  // 插入D，B是最久未访问的，被淘汰
        System.out.println(cache.keySet()); // [C, A, D]
    }
}
```

> ⭐ **面试高频问题**：如何用 LinkedHashMap 实现 LRU 缓存？
>
> 答：设置 `accessOrder = true` 使 LinkedHashMap 按访问顺序排序，最近访问的元素移到链表尾部。重写 `removeEldestEntry()` 方法，当 size 超过指定容量时返回 true，自动移除链表头部（最久未访问）的元素。get() 和 put() 都算访问操作。时间复杂度：get/put 都是 O(1)。

---

### 4.3 TreeMap

TreeMap 基于**红黑树**（Red-Black Tree）实现，所有 key 按照排序规则有序存储。

```java
// 基本使用
TreeMap<String, Integer> map = new TreeMap<>();
map.put("C", 3);
map.put("A", 1);
map.put("B", 2);
System.out.println(map); // {A=1, B=2, C=3}  按key自然排序

// 导航方法
System.out.println(map.firstKey());    // A
System.out.println(map.lastKey());     // C
System.out.println(map.ceilingKey("B")); // B（>=B的最小key）
System.out.println(map.floorKey("B"));   // B（<=B的最大key）
System.out.println(map.higherKey("B"));  // C（>B的最小key）
System.out.println(map.lowerKey("B"));   // A（<B的最大key）

// 子Map
SortedMap<String, Integer> subMap = map.subMap("A", "C"); // [A, C)
NavigableMap<String, Integer> descMap = map.descendingMap(); // 降序视图

// 定制排序
TreeMap<User, Integer> userMap = new TreeMap<>(
    Comparator.comparingInt(User::getAge).reversed()
);
```

**红黑树特性**：
1. 每个节点是红色或黑色
2. 根节点是黑色
3. 每个叶子节点（NIL）是黑色
4. 红色节点的子节点必须是黑色（不能有连续红色节点）
5. 从任一节点到其每个叶子节点的所有路径都包含相同数目的黑色节点

红黑树通过这些约束保证树的高度近似 log(n)，从而保证增删查改的时间复杂度为 O(log n)。

---

### 4.4 ConcurrentHashMap（重点！）

#### JDK 7：Segment 分段锁

```
ConcurrentHashMap（JDK 7）
  ┌─────────────────────────────────────┐
  │           Segment[0] (Lock)         │
  │   [桶0][桶1][桶2]...[桶15]          │
  ├─────────────────────────────────────┤
  │           Segment[1] (Lock)         │
  │   [桶0][桶1][桶2]...[桶15]          │
  ├─────────────────────────────────────┤
  │           Segment[2] (Lock)         │
  │   [桶0][桶1][桶2]...[桶15]          │
  ├─────────────────────────────────────┤
  │           ...                       │
  └─────────────────────────────────────┘

- 默认16个Segment，每个Segment相当于一个小HashMap
- 每个Segment有自己的ReentrantLock
- 不同Segment可以并发操作
- 并发度 = Segment数量（默认16）
```

```java
// JDK 7 核心结构
public class ConcurrentHashMap<K, V> extends AbstractMap<K, V>
    implements ConcurrentMap<K, V>, Serializable {

    final Segment<K, V>[] segments;
    static final int DEFAULT_CONCURRENCY_LEVEL = 16;

    // Segment 继承 ReentrantLock
    static final class Segment<K, V> extends ReentrantLock {
        transient volatile HashEntry<K, V>[] table;
        transient int count;
        transient int modCount;
        transient int threshold;
        final float loadFactor;
    }

    static final class HashEntry<K, V> {
        final int hash;
        final K key;
        volatile V value;
        volatile HashEntry<K, V> next;
    }
}
```

#### JDK 8：CAS + synchronized

JDK 8 废弃了 Segment，直接在数组的每个桶上加锁，锁粒度更细：

```
ConcurrentHashMap（JDK 8）
  ┌─────────────────────────────────────┐
  │  [桶0] [桶1] [桶2] ... [桶n]        │
  │    ↑     ↑     ↑                    │
  │  sync  sync  sync  ← 每个桶独立加锁  │
  │                                     │
  │  空桶：CAS 无锁插入                  │
  │  非空桶：synchronized 头节点          │
  └─────────────────────────────────────┘
```

```java
// JDK 8 核心属性
public class ConcurrentHashMap<K, V> extends AbstractMap<K, V>
    implements ConcurrentMap<K, V>, Serializable {

    transient volatile Node<K, V>[] table;
    private transient volatile Node<K, V>[] nextTable; // 扩容时使用
    private transient volatile long baseCount;
    private transient volatile int sizeCtl; // 控制初始化和扩容

    static class Node<K, V> implements Map.Entry<K, V> {
        final int hash;
        final K key;
        volatile V val;
        volatile Node<K, V> next;
    }
}
```

#### put() 过程分析

```java
public V put(K key, V value) {
    return putVal(key, value, false);
}

final V putVal(K key, V value, boolean onlyIfAbsent) {
    // key 和 value 都不允许为 null
    if (key == null || value == null) throw new NullPointerException();
    int hash = spread(key.hashCode());
    int binCount = 0;

    for (Node<K, V>[] tab = table;;) {
        Node<K, V> f;
        int n, i, fh;

        // 1. table为空，初始化
        if (tab == null || (n = tab.length) == 0)
            tab = initTable();

        // 2. 桶为空，CAS无锁插入
        else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
            if (casTabAt(tab, i, null, new Node<K, V>(hash, key, value, null)))
                break;  // CAS成功则退出
            // CAS失败则自旋重试
        }

        // 3. 桶头节点的hash值为MOVED（-1），表示正在扩容，帮助扩容
        else if ((fh = f.hash) == MOVED)
            tab = helpTransfer(tab, f);

        // 4. 桶不为空，synchronized加锁
        else {
            V oldVal = null;
            synchronized (f) {
                if (tabAt(tab, i) == f) {  // 双重检查
                    if (fh >= 0) {
                        // 链表情况
                        binCount = 1;
                        for (Node<K, V> e = f;; ++binCount) {
                            K ek;
                            if (e.hash == hash &&
                                ((ek = e.key) == key ||
                                 (ek != null && key.equals(ek)))) {
                                oldVal = e.val;
                                if (!onlyIfAbsent)
                                    e.val = value;
                                break;
                            }
                            Node<K, V> pred = e;
                            if ((e = e.next) == null) {
                                pred.next = new Node<K, V>(hash, key, value, null);
                                break;
                            }
                        }
                    }
                    else if (f instanceof TreeBin) {
                        // 红黑树情况
                        binCount = 2;
                        TreeNode<K, V> p = ((TreeBin<K, V>) f).putTreeVal(
                            tab, hash, key, value);
                        if (p != null) {
                            oldVal = p.val;
                            if (!onlyIfAbsent)
                                p.val = value;
                        }
                    }
                }
            }
            // 5. 链表转红黑树
            if (binCount != 0) {
                if (binCount >= TREEIFY_THRESHOLD)
                    treeifyBin(tab, i);
                if (oldVal != null)
                    return oldVal;
                break;
            }
        }
    }
    addCount(1L, binCount);  // 更新元素计数，可能触发扩容
    return null;
}
```

**put() 流程总结**：

```
put(key, value)
  → key/value 非null检查
  → spread() 计算hash
  → table为空？→ initTable()（CAS控制只有一个线程初始化）
  → 桶为空？→ CAS无锁插入（失败则自旋）
  → 正在扩容？→ helpTransfer() 帮助扩容
  → synchronized(头节点) 加锁
    → 链表：遍历查找/插入
    → 红黑树：putTreeVal()
  → binCount >= 8？→ treeifyBin()
  → addCount() 更新计数，检查扩容
```

#### size() 方法

JDK 8 的 size() 使用 `LongAdder` 思想，避免多线程竞争：

```java
// baseCount + CounterCell数组 求和
public int size() {
    long n = sumCount();
    return ((n < 0L) ? 0 : (n > Integer.MAX_VALUE) ? Integer.MAX_VALUE : (int) n);
}

final long sumCount() {
    CounterCell[] cs = counterCells;
    long sum = baseCount;
    if (cs != null) {
        for (CounterCell c : cs)
            if (c != null)
                sum += c.value;
    }
    return sum;
}
```

#### ConcurrentHashMap vs Hashtable vs synchronizedMap

| 特性 | ConcurrentHashMap | Hashtable | Collections.synchronizedMap() |
|------|-------------------|-----------|-------------------------------|
| 线程安全 | 是 | 是 | 是 |
| 锁粒度 | 桶级别（JDK 8） | 方法级别（整个表） | 方法级别（整个表） |
| null key | 不允许 | 不允许 | 不允许 |
| null value | 不允许 | 不允许 | 不允许 |
| 并发性能 | 高 | 低 | 低 |
| 迭代器 | 弱一致性 | fail-fast | fail-fast |
| JDK版本 | JDK 1.5 | JDK 1.0 | JDK 1.2 |

```java
// synchronizedMap 本质是对每个方法加synchronized
public static <K, V> Map<K, V> synchronizedMap(Map<K, V> m) {
    return new SynchronizedMap<>(m);
}

static class SynchronizedMap<K, V> {
    private final Map<K, V> m;
    final Object mutex;

    public V get(Object key) {
        synchronized (mutex) { return m.get(key); }
    }
    public V put(K key, V value) {
        synchronized (mutex) { return m.put(key, value); }
    }
    // 所有方法都加同一把锁
}
```

#### 为什么 ConcurrentHashMap 不允许 key/value 为 null

```java
// HashMap 允许 key 为 null
HashMap<String, String> hm = new HashMap<>();
hm.put(null, "value");  // OK，放在桶0

// ConcurrentHashMap 不允许
ConcurrentHashMap<String, String> chm = new ConcurrentHashMap<>();
chm.put(null, "value");  // NullPointerException
chm.put("key", null);    // NullPointerException
```

**原因**：在多线程环境下，如果 `get(key)` 返回 null，无法区分"key不存在"还是"value就是null"。HashMap 可以用 `containsKey()` 来判断，但在 ConcurrentHashMap 中，`get()` 和 `containsKey()` 之间可能有其他线程修改了 map，导致结果不一致。为了避免这种歧义，直接禁止 null 值。

> ⭐ **面试高频问题**：ConcurrentHashMap 在 JDK 7 和 JDK 8 中的实现有什么区别？
>
> 答：JDK 7 使用 Segment 分段锁，将整个数组分成若干段（默认16段），每段一个 ReentrantLock，不同段可以并发操作，并发度等于段数。JDK 8 废弃了 Segment，改为 CAS + synchronized，锁粒度从段级别降到桶级别。空桶用 CAS 无锁插入，非空桶用 synchronized 锁住头节点。JDK 8 的并发度等于数组长度（远大于默认16），性能更好。此外 JDK 8 引入了红黑树优化长链表的查询。

> ⭐ **面试高频问题**：ConcurrentHashMap 的 put 流程？
>
> 答：(1) 计算 key 的 hash（spread 方法，类似 HashMap 的高位扰动）；(2) 如果 table 未初始化，用 CAS 控制只有一个线程执行初始化；(3) 如果目标桶为空，用 CAS 无锁插入；(4) 如果正在扩容（头节点 hash 为 MOVED），当前线程帮助扩容；(5) 如果桶不为空，用 synchronized 锁住头节点，然后按链表或红黑树进行操作；(6) 链表长度达到8时尝试树化；(7) 最后用 addCount 更新元素计数，检查是否需要扩容。

---

### 4.5 Hashtable（了解即可）

```java
// Hashtable 所有方法都加了 synchronized
public class Hashtable<K, V> extends Dictionary<K, V>
    implements Map<K, V>, Cloneable, java.io.Serializable {

    public synchronized V put(K key, V value) {
        if (value == null) throw new NullPointerException();
        // ... 逻辑与HashMap类似，但加了锁
    }

    public synchronized V get(Object key) {
        // ...
    }
}
```

**Hashtable 与 HashMap 的区别**：

| 特性 | HashMap | Hashtable |
|------|---------|-----------|
| 线程安全 | 不安全 | 安全（synchronized） |
| null key | 允许（一个） | 不允许 |
| null value | 允许 | 不允许 |
| 初始容量 | 16 | 11 |
| 扩容倍数 | 2倍 | 2倍+1 |
| 父类 | AbstractMap | Dictionary |
| 迭代器 | fail-fast | fail-fast（Enumeration） |
| 推荐 | 是 | 否（已淘汰） |

> ⭐ **面试高频问题**：Hashtable 和 HashMap 的区别？
>
> 答：Hashtable 是线程安全的（所有方法加 synchronized），HashMap 不是。Hashtable 不允许 key 和 value 为 null，HashMap 允许一个 null key 和多个 null value。Hashtable 初始容量11，扩容为 2n+1；HashMap 初始容量16，扩容为 2n。Hashtable 继承 Dictionary，HashMap 继承 AbstractMap。实际开发中，线程安全场景用 ConcurrentHashMap 代替 Hashtable。

---

## 五、Queue 接口

### 5.1 PriorityQueue（堆实现）

PriorityQueue 是基于**小顶堆**（最小堆）实现的优先队列：

```java
// 默认小顶堆
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
System.out.println(minHeap.poll()); // 1（最小的先出）
System.out.println(minHeap.poll()); // 3
System.out.println(minHeap.poll()); // 5

// 大顶堆（传入反向Comparator）
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
maxHeap.offer(5);
maxHeap.offer(1);
maxHeap.offer(3);
System.out.println(maxHeap.poll()); // 5（最大的先出）
System.out.println(maxHeap.poll()); // 3

// 自定义优先级
PriorityQueue<Task> taskQueue = new PriorityQueue<>(
    Comparator.comparingInt(Task::getPriority).reversed()
);
taskQueue.offer(new Task("紧急", 10));
taskQueue.offer(new Task("普通", 5));
taskQueue.offer(new Task("低", 1));
// 优先级高的先出
```

**底层结构**：用数组存储完全二叉树，`array[0]` 是堆顶（最小元素）。

```
         1           数组表示：[1, 3, 5]
        / \
       3   5

插入元素：加到末尾，上浮（siftUp）
删除堆顶：末尾元素替换堆顶，下沉（siftDown）
```

| 操作 | 时间复杂度 |
|------|-----------|
| offer() / add() | O(log n) |
| poll() / remove() | O(log n) |
| peek() / element() | O(1) |

### 5.2 ArrayDeque（循环数组）

ArrayDeque 是基于**循环数组**实现的双端队列，比 LinkedList 性能更好：

```java
ArrayDeque<String> deque = new ArrayDeque<>();

// 作为栈使用
deque.push("A");   // 等价于 addFirst
deque.push("B");
deque.push("C");
System.out.println(deque.pop());   // C
System.out.println(deque.pop());   // B

// 作为队列使用
deque.offer("X");  // 等价于 addLast
deque.offer("Y");
System.out.println(deque.poll());  // X
System.out.println(deque.poll());  // Y

// 双端操作
deque.addFirst("头");
deque.addLast("尾");
deque.removeFirst();
deque.removeLast();
```

```
循环数组结构：
     head=5
      ↓
  [null][null][E][D][C][B][A][null][null]
                              ↑
                             tail=7

addFirst(B): head左移 → head=4, array[4]=B
addLast(A):  tail右移 → tail=8, array[7]=A
```

| 操作 | 时间复杂度 |
|------|-----------|
| addFirst / addLast | 均摊O(1) |
| removeFirst / removeLast | O(1) |
| getFirst / getLast | O(1) |

> ⭐ **面试高频问题**：ArrayDeque 和 LinkedList 作为队列/栈哪个更好？
>
> 答：ArrayDeque 更好。ArrayDeque 基于循环数组实现，内存连续，CPU缓存友好，不需要额外存储指针，性能优于 LinkedList。LinkedList 基于双向链表，每个节点需要额外存储两个指针，内存开销大，且分散内存不利于缓存。JDK 官方推荐 ArrayDeque 作为栈和队列的首选实现。

### 5.3 BlockingQueue（阻塞队列）

BlockingQueue 在 Queue 基础上增加了阻塞操作：队列为空时 take() 阻塞等待，队列满时 put() 阻塞等待。主要用于生产者-消费者模式。

```java
// 生产者-消费者模式
BlockingQueue<String> queue = new ArrayBlockingQueue<>(10);

// 生产者
ExecutorService producer = Executors.newSingleThreadExecutor();
producer.submit(() -> {
    try {
        for (int i = 0; i < 100; i++) {
            queue.put("item-" + i);  // 队列满时阻塞
            System.out.println("生产: item-" + i);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

// 消费者
ExecutorService consumer = Executors.newSingleThreadExecutor();
consumer.submit(() -> {
    try {
        for (int i = 0; i < 100; i++) {
            String item = queue.take();  // 队列空时阻塞
            System.out.println("消费: " + item);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});
```

**常用实现对比**：

| 实现 | 底层结构 | 有界性 | 公平性 | 特点 |
|------|---------|--------|--------|------|
| ArrayBlockingQueue | 数组 | 有界 | 可选公平 | 创建时指定容量 |
| LinkedBlockingQueue | 链表 | 可选（默认Integer.MAX_VALUE） | 不公平 | 吞吐量高于Array |
| SynchronousQueue | 无缓冲 | 无界（容量0） | 可选公平 | 直接传递，不存储 |
| PriorityBlockingQueue | 堆 | 无界 | 不公平 | 支持优先级排序 |

```java
// ArrayBlockingQueue（有界，公平可选）
BlockingQueue<String> abq = new ArrayBlockingQueue<>(100, true); // 公平锁

// LinkedBlockingQueue（默认无界，注意OOM风险）
BlockingQueue<String> lbq = new LinkedBlockingQueue<>(100); // 建议指定容量

// SynchronousQueue（零容量，直接传递）
BlockingQueue<String> sq = new SynchronousQueue<>();
// put() 会阻塞直到有对应的 take()
```

### 5.4 DelayQueue（延迟队列）

DelayQueue 是一个支持延时获取元素的无界阻塞队列，元素必须实现 `Delayed` 接口：

```java
// 延迟任务
public class DelayedTask implements Delayed {
    private final String name;
    private final long executeTime; // 执行时间（毫秒时间戳）

    public DelayedTask(String name, long delayMillis) {
        this.name = name;
        this.executeTime = System.currentTimeMillis() + delayMillis;
    }

    @Override
    public long getDelay(TimeUnit unit) {
        long diff = executeTime - System.currentTimeMillis();
        return unit.convert(diff, TimeUnit.MILLISECONDS);
    }

    @Override
    public int compareTo(Delayed o) {
        return Long.compare(this.executeTime, ((DelayedTask) o).executeTime);
    }

    @Override
    public String toString() {
        return name;
    }
}

// 使用示例
DelayQueue<DelayedTask> delayQueue = new DelayQueue<>();
delayQueue.put(new DelayedTask("任务1", 3000)); // 3秒后执行
delayQueue.put(new DelayedTask("任务2", 1000)); // 1秒后执行
delayQueue.put(new DelayedTask("任务3", 2000)); // 2秒后执行

// take() 会阻塞直到延迟到期
System.out.println(delayQueue.take()); // 1秒后输出：任务2
System.out.println(delayQueue.take()); // 再过1秒输出：任务3
System.out.println(delayQueue.take()); // 再过1秒输出：任务1
```

**典型应用场景**：
- 定时任务调度（如订单超时取消）
- 缓存过期清理
- 延迟消息发送

---

## 六、Collections 工具类

### 6.1 排序与查找

```java
List<Integer> list = new ArrayList<>(Arrays.asList(3, 1, 4, 1, 5, 9));

// 排序（自然排序）
Collections.sort(list);
System.out.println(list); // [1, 1, 3, 4, 5, 9]

// 定制排序
Collections.sort(list, Comparator.reverseOrder());
System.out.println(list); // [9, 5, 4, 3, 1, 1]

// 二分查找（必须先排序！）
int index = Collections.binarySearch(list, 5);
System.out.println(index); // 1

// 注意：未排序的列表使用binarySearch，结果未定义
```

### 6.2 不可变集合

```java
// 创建不可变集合（只读视图）
List<String> immutableList = Collections.unmodifiableList(
    new ArrayList<>(Arrays.asList("A", "B", "C"))
);
immutableList.add("D"); // UnsupportedOperationException

// 修改原始集合会影响不可变视图
List<String> original = new ArrayList<>(Arrays.asList("A", "B"));
List<String> unmodifiable = Collections.unmodifiableList(original);
original.add("C"); // OK
System.out.println(unmodifiable); // [A, B, C]（视图跟着变了）

// JDK 9+ 更简洁的方式
List<String> jdk9List = List.of("A", "B", "C"); // 真正的不可变
```

### 6.3 同步包装器

```java
// 将非线程安全的集合包装为线程安全
List<String> syncList = Collections.synchronizedList(new ArrayList<>());
Map<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());
Set<String> syncSet = Collections.synchronizedSet(new HashSet<>());

// 注意：迭代时仍需手动加锁！
synchronized (syncList) {
    for (String s : syncList) {
        System.out.println(s);
    }
}
```

> ⭐ **面试高频问题**：Collections.synchronizedList 和 CopyOnWriteArrayList 的区别？
>
> 答：synchronizedList 使用 synchronized 对每个方法加锁，读写都加锁，适合读写均衡的场景。CopyOnWriteArrayList 写时复制，读不加锁，适合读多写少的场景。synchronizedList 迭代时需要手动加锁，CopyOnWriteArrayList 迭代时不需要加锁（遍历快照）。synchronizedList 的写操作不会创建新数组，内存效率更高。

### 6.4 空集合

```java
// 返回空的不可变集合（单例，不占用内存）
List<String> emptyList = Collections.emptyList();
Set<String> emptySet = Collections.emptySet();
Map<String, String> emptyMap = Collections.emptyMap();

// 为什么不用 new ArrayList<>()？
// 1. emptyList() 返回单例，不创建新对象
// 2. 明确表达语义：这是一个空集合，不是"还没初始化"
// 3. 防止意外修改（不可变）

// 方法返回空集合的最佳实践
public List<User> findUsers(String name) {
    if (name == null) {
        return Collections.emptyList(); // 而不是 return null;
    }
    return userDao.selectByName(name);
}
```

---

## 七、集合面试高频问题汇总

### Q1：HashMap 扩容过程

> **答**：HashMap 默认初始容量16，负载因子0.75，扩容阈值为 capacity * loadFactor。当 size 超过阈值时触发 resize()。扩容创建一个2倍大小的新数组，遍历旧数组迁移元素。JDK 8 的优化：通过 `e.hash & oldCap` 将链表拆分为低位和高位两部分，低位留在原索引，高位移到原索引+oldCap，避免了重新计算hash。如果链表长度达到8且数组长度>=64则树化，扩容后红黑树节点<=6则退化为链表。

### Q2：HashMap 为什么线程不安全

> **答**：(1) JDK 7 并发扩容时头插法可能导致链表成环，引发 get() 死循环；(2) JDK 8 改用尾插法解决死循环，但并发 put 时仍可能数据覆盖（两个线程同时判断桶为空并插入，后者覆盖前者）；(3) 并发扩容可能导致数据丢失。多线程场景应使用 ConcurrentHashMap。

### Q3：ConcurrentHashMap 原理

> **答**：JDK 7 使用 Segment 分段锁，默认16段，每段一个 ReentrantLock，不同段可并发。JDK 8 废弃 Segment，改用 CAS + synchronized。空桶用 CAS 无锁插入，非空桶用 synchronized 锁住头节点。并发度从16提升到数组长度。size() 使用 LongAdder 思想（baseCount + CounterCell数组），避免竞争。不允许 null key/value。

### Q4：ArrayList 扩容机制

> **答**：无参构造初始为空数组，首次 add 扩容到10。之后每次扩容为1.5倍（`oldCapacity + (oldCapacity >> 1)`）。扩容通过 Arrays.copyOf() 实现。指定初始容量则按指定值初始化。扩容阈值没有显式字段，而是 `int(newCapacity * loadFactor)`，loadFactor 固定为1（ArrayList 不像 HashMap 有负载因子概念，满了就扩容）。

### Q5：HashSet 如何保证唯一性

> **答**：HashSet 底层基于 HashMap，add(e) 调用 map.put(e, PRESENT)。唯一性由 HashMap 的 key 唯一性保证：先计算 hashCode 定位桶，再遍历链表/红黑树比较 hashCode 和 equals。两者都相等才认为是同一元素。因此存入 HashSet 的对象必须正确重写 hashCode() 和 equals()。

### Q6：fail-fast vs fail-safe

> **答**：fail-fast（快速失败）：迭代器遍历时如果检测到集合被结构性修改（modCount 变化），立即抛出 ConcurrentModificationException。ArrayList、HashMap 等都是 fail-fast。fail-safe（安全失败）：迭代时使用集合的快照副本，不会抛出异常，但可能读到旧数据。CopyOnWriteArrayList、ConcurrentHashMap 的迭代器是 fail-safe。fail-fast 是一种防御性机制，不是线程安全保证。

### Q7：Comparable vs Comparator

> **答**：Comparable 是内部比较器，类实现 `compareTo(T o)` 方法定义自然排序。Comparator 是外部比较器，独立于类，可以定义多种排序策略。TreeSet/TreeMap 构造时可传入 Comparator 覆盖自然排序。优先级：有 Comparator 用 Comparator，没有用 Comparable。Comparator 更灵活，可以用匿名类/Lambda 定义，也可以通过 `Comparator.comparing()` 链式组合。

### Q8：HashMap 的 hash() 方法为什么用异或

> **答**：HashMap 用 `(h = key.hashCode()) ^ (h >>> 16)` 做高位扰动。因为桶索引计算是 `(n-1) & hash`，n 是2的幂次方，n-1 的低位全是1高位全是0。如果数组较小，只有 hash 的低位参与运算，高位信息被浪费。异或使高低位混合，增加 hash 的随机性，减少冲突。选择异或（而非与/或）是因为异或能更好地保留两个操作数的信息。

### Q9：HashMap 默认容量为什么是16

> **答**：16 是2的幂次方，`hash % n` 等价于 `hash & (n-1)`，位运算比取模运算快。2的幂次方保证 n-1 的二进制全是1，使 hash 的每一位都能参与桶索引计算。容量太小会导致频繁扩容，太大浪费内存，16是一个合理的折中。

### Q10：说说红黑树的特点

> **答**：红黑树是一种自平衡二叉搜索树，通过颜色标记和旋转操作保持近似平衡。五条性质：节点红或黑；根节点黑色；叶子节点（NIL）黑色；红色节点的子节点必须是黑色；任一节点到叶子的所有路径黑色节点数相同。这些约束保证树高不超过 2*log(n+1)，增删查改都是 O(log n)。HashMap 中链表长度>=8且数组长度>=64时转红黑树，将最坏查询从 O(n) 降到 O(log n)。

---

> **文档版本**：v1.0 | **适用对象**：5年经验Java工程师面试准备
> **前置知识**：Java基础语法、数据结构基础（链表、树、哈希表）

---

## 补充知识点

### 补充一、ConcurrentSkipListMap 跳表（⭐⭐中频）

#### 1. 跳表结构原理

跳表（Skip List）是一种基于有序链表的概率性数据结构，通过多层索引实现快速查找，平均时间复杂度 O(log n)，与红黑树相当。

```
跳表结构示意：

Level 4:  [头] ───────────────────────────────→ [尾]
Level 3:  [头] ────────────────→ [30] ──────────→ [尾]
Level 2:  [头] ──────→ [15] ──→ [30] ──→ [45] ──→ [尾]
Level 1:  [头] → [5] → [15] → [20] → [30] → [45] → [60] → [尾]
                ↑
           底层链表（所有元素）

查找过程（查找 30）：
  1. 从最高层头节点开始，向右比较
  2. 当前节点 < 30，继续向右
  3. 当前节点 > 30 或为尾节点，向下走一层
  4. 重复直到在底层链表找到 30

时间复杂度：O(log n)（与红黑树相当）
空间复杂度：O(n)（平均每个节点 2 个指针）
```

#### 2. ConcurrentSkipListMap 的特点

```java
// ConcurrentSkipListMap：线程安全的有序 Map
ConcurrentSkipListMap<String, String> map = new ConcurrentSkipListMap<>();

map.put("C", "3");
map.put("A", "1");
map.put("B", "2");

// 自动按 key 排序
System.out.println(map); // {A=1, B=2, C=3}

// 导航方法
System.out.println(map.firstKey());    // A
System.out.println(map.lastKey());     // C
System.out.println(map.ceilingKey("B")); // B（>=B的最小key）
System.out.println(map.subMap("A", "C")); // {A=1, B=2}（范围查询）
```

#### 3. 与 ConcurrentHashMap 的区别

| 特性 | ConcurrentSkipListMap | ConcurrentHashMap |
|------|----------------------|-------------------|
| 有序性 | key 有序（自然排序或 Comparator） | 无序 |
| 底层结构 | 跳表（多层链表） | 数组 + 链表 + 红黑树 |
| 查找复杂度 | O(log n) | 平均 O(1)，最坏 O(n) |
| 范围查询 | 高效（利用有序性） | 需要遍历 |
| 内存占用 | 较高（多层索引） | 较低 |
| 线程安全 | CAS + 无锁 | CAS + synchronized |

#### 4. 适用场景

```
ConcurrentSkipListMap 适用场景：
  - 需要线程安全 + key 有序（如排行榜、定时任务调度）
  - 需要高效的范围查询（subMap、headMap、tailMap）
  - 高并发环境下的有序 Map

ConcurrentHashMap 适用场景：
  - 不需要排序的通用键值存储
  - 追求最高的读写性能
  - 大多数业务场景
```

> ⭐ **面试问答：跳表和红黑树的区别？为什么 Redis 用跳表不用红黑树？**
>
> 答：跳表和红黑树的查找/插入/删除都是 O(log n)。跳表的优势：(1) 实现简单，红黑树需要复杂的旋转操作；(2) 范围查询更高效，跳表只需找到起点后沿底层链表遍历，红黑树需要中序遍历；(3) 并发友好，跳表的插入/删除只需修改局部指针，更容易实现无锁并发。Redis 选择跳表主要是实现简单且范围查询高效。

---

### 补充二、WeakHashMap 原理（⭐⭐中频）

#### 1. 弱引用键的 GC 行为

WeakHashMap 的 key 是**弱引用（WeakReference）**，当 key 不再被其他强引用引用时，GC 会自动回收该 key，对应的 Entry 也会被清除。

```java
WeakHashMap<String, String> map = new WeakHashMap<>();

String key = new String("key1");
map.put(key, "value1");
System.out.println(map.size()); // 1

key = null;  // 取消强引用
System.gc(); // 建议 GC（不保证立即执行）
Thread.sleep(100);

// GC 后，key1 的弱引用被回收，对应的 Entry 被清除
System.out.println(map.size()); // 可能为 0
```

```
引用强度对比：
  强引用（Strong）→ 软引用（Soft）→ 弱引用（Weak）→ 虚引用（Phantom）

  强引用：Object obj = new Object();  // 永远不会被 GC 回收
  软引用：SoftReference<Object> sr = new SoftReference<>(obj);  // 内存不足时才回收
  弱引用：WeakReference<Object> wr = new WeakReference<>(obj);  // 下次 GC 时回收
  虚引用：PhantomReference<Object> pr = new PhantomReference<>(obj, queue);  // 仅用于跟踪回收

WeakHashMap 使用 WeakReference 包装 key：
  Entry extends WeakReference<K> {
      Entry(K key, V value, ReferenceQueue<K> queue) {
          super(key, queue);  // key 被 WeakReference 包装
          this.value = value;
      }
  }
```

#### 2. 典型应用场景：ThreadLocal

```java
// ThreadLocal 内部使用 ThreadLocalMap（类似 WeakHashMap）
// ThreadLocalMap 的 key 是 ThreadLocal 的弱引用

ThreadLocal<User> threadLocal = new ThreadLocal<>();
threadLocal.set(new User("张三"));

// ThreadLocalMap 结构：
//   key = ThreadLocal 对象（弱引用）
//   value = User 对象（强引用）

// 如果 ThreadLocal 外部没有强引用了：
//   key 被 GC 回收（弱引用）
//   但 value 仍然存在（强引用）→ 内存泄漏！
//   需要调用 threadLocal.remove() 手动清理

// 所以 ThreadLocal 使用后务必 remove()
try {
    threadLocal.set(new User("张三"));
    // 使用 threadLocal.get()
} finally {
    threadLocal.remove();  // 防止内存泄漏
}
```

> ⭐ **面试问答：WeakHashMap 和 HashMap 的区别？**
>
> 答：WeakHashMap 的 key 是弱引用，当 key 不再被外部强引用时，GC 会回收 key 并自动清除对应的 Entry。HashMap 的 key 是强引用，只有显式 remove 或 GC 回收整个对象时才会清除。WeakHashMap 适用于缓存场景（如 ThreadLocalMap），不适合长期保存数据。

---

### 补充三、EnumSet / EnumMap（⭐⭐中频）

#### 1. EnumSet：枚举专用 Set

```java
enum DayOfWeek { MON, TUE, WED, THU, FRI, SAT, SUN }

// EnumSet 创建
EnumSet<DayOfWeek> workdays = EnumSet.of(DayOfWeek.MON, DayOfWeek.TUE,
    DayOfWeek.WED, DayOfWeek.THU, DayOfWeek.FRI);
System.out.println(workdays); // [MON, TUE, WED, THU, FRI]

// 范围创建
EnumSet<DayOfWeek> weekend = EnumSet.range(DayOfWeek.SAT, DayOfWeek.SUN);
System.out.println(weekend); // [SAT, SUN]

// 补集
EnumSet<DayOfWeek> allDays = EnumSet.allOf(DayOfWeek.class);
EnumSet<DayOfWeek> noneDays = EnumSet.noneOf(DayOfWeek.class);
EnumSet<DayOfWeek> complement = EnumSet.complementOf(workdays); // [SAT, SUN]

// 常用操作
workdays.add(DayOfWeek.SAT);
workdays.remove(DayOfWeek.MON);
workdays.contains(DayOfWeek.FRI); // true
```

#### 2. EnumMap：枚举专用 Map

```java
enum Color { RED, GREEN, BLUE }

EnumMap<Color, String> colorMap = new EnumMap<>(Color.class);
colorMap.put(Color.RED, "#FF0000");
colorMap.put(Color.GREEN, "#00FF00");
colorMap.put(Color.BLUE, "#0000FF");

// 按 enum 定义顺序遍历
for (Map.Entry<Color, String> entry : colorMap.entrySet()) {
    System.out.println(entry.getKey() + " = " + entry.getValue());
}
// RED = #FF0000
// GREEN = #00FF00
// BLUE = #0000FF
```

#### 3. 性能优势

```
EnumSet 的性能优势：
  1. 底层用位向量（bit vector）存储，每个 enum 值占一个 bit
  2. 所有操作都是位运算，O(1) 时间复杂度
  3. 内存占用极小（一个 long 就能存 64 个 enum 值）
  4. 枚举数量 <= 64 时用 RegularEnumSet（一个 long）
     枚举数量 > 64 时用 JumboEnumSet（long 数组）

EnumMap 的性能优势：
  1. 底层是 Object[] 数组，下标就是 enum.ordinal()
  2. put/get/remove 都是 O(1)，无哈希冲突
  3. 遍历时按 enum 定义顺序
  4. 内存紧凑，无哈希表的开销（桶数组、链表指针等）

// EnumSet 底层（简化）
class RegularEnumSet<E extends Enum<E>> extends EnumSet<E> {
    long elements;  // 位向量，每个 bit 代表一个 enum 值是否在集合中

    boolean add(E e) {
        long oldElements = elements;
        elements |= (1L << e.ordinal());  // 位或操作
        return elements != oldElements;
    }

    boolean contains(Object e) {
        return (elements & (1L << ((Enum<?>)e).ordinal())) != 0;  // 位与操作
    }
}

// EnumMap 底层（简化）
class EnumMap<K extends Enum<K>, V> {
    Object[] vals;  // 数组，下标 = enum.ordinal()
    K[] keyUniverse; // 所有 enum 值的数组

    V get(K key) {
        return vals[key.ordinal()];  // 直接数组下标访问
    }
}
```

> ⭐ **面试问答：为什么用 EnumSet/EnumMap 而不是 HashSet/HashMap？**
>
> 答：EnumSet/EnumMap 专门为枚举类型优化。EnumSet 底层用位向量存储，所有操作是位运算，速度极快且内存占用极小。EnumMap 底层用数组存储，下标就是 enum.ordinal()，无哈希冲突，put/get 都是 O(1)。当 key 是枚举类型时，EnumSet/EnumMap 在性能和内存上都远优于 HashSet/HashMap。
