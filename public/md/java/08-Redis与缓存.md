# 08 Redis 与缓存

> Java 后端面试知识体系 -- Redis 与缓存核心知识点

---

## 8.1 Redis 基础

### 8.1.1 五种基本数据类型及应用场景

#### String（字符串）

**底层结构**：SDS（Simple Dynamic String），Redis 3.2 之后根据字符串长度自动选择编码：`int`、`embstr`、`raw`。

**常用命令**：
```bash
SET key value [EX seconds] [PX milliseconds] [NX|XX]
GET key
INCR key          # 原子自增
INCRBY key increment
DECR key
MGET key1 key2    # 批量获取
SETEX key seconds value  # 设置带过期时间
```

**应用场景**：
- **缓存**：用户信息、页面内容等序列化后的 JSON 字符串
- **计数器**：文章阅读量、点赞数（`INCR` 原子操作）
- **分布式锁**：`SET lock_key value NX EX 30`
- **Session 共享**：集中式 Session 存储

```java
// Spring Boot 中使用 RedisTemplate 操作 String
@Autowired
private StringRedisTemplate redisTemplate;

// 缓存用户信息
public User getUser(Long userId) {
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        return JSON.parseObject(json, User.class);
    }
    User user = userMapper.selectById(userId);
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
    }
    return user;
}

// 分布式锁（基础版）
public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
    Boolean result = redisTemplate.opsForValue()
        .setIfAbsent(lockKey, requestId, expireSeconds, TimeUnit.SECONDS);
    return Boolean.TRUE.equals(result);
}
```

#### List（列表）

**底层结构**：3.2 之前使用 `ziplist` + `linkedlist`，之后统一使用 **quicklist**（双向链表 + ziplist 混合）。

**常用命令**：
```bash
LPUSH key value1 value2    # 左侧推入
RPUSH key value1 value2    # 右侧推入
LPOP key                   # 左侧弹出
RPOP key                   # 右侧弹出
LRANGE key start stop      # 范围查询
BLPOP key timeout          # 阻塞式左弹出
LLEN key                   # 获取长度
```

**应用场景**：
- **消息队列**：`LPUSH` + `BRPOP` 实现简单的阻塞队列
- **最新消息列表**：朋友圈时间线、最新文章列表
- **栈结构**：`LPUSH` + `LPOP`
- **队列结构**：`LPUSH` + `RPOP`

```java
// 简单消息队列
public void sendMessage(String queue, String message) {
    redisTemplate.opsForList().leftPush(queue, message);
}

public String consumeMessage(String queue, long timeoutSeconds) {
    return redisTemplate.opsForList().rightPop(queue, timeoutSeconds, TimeUnit.SECONDS);
}

// 最新文章列表（保留最新 100 篇）
public void addLatestArticle(Long articleId) {
    String key = "latest:articles";
    redisTemplate.opsForList().leftPush(key, String.valueOf(articleId));
    redisTemplate.opsForList().trim(key, 0, 99); // 只保留前100个
}
```

#### Hash（哈希）

**底层结构**：字段数量少且值小时使用 `ziplist`，否则使用 `hashtable`。

**常用命令**：
```bash
HSET key field value
HGET key field
HMSET key field1 value1 field2 value2
HMGET key field1 field2
HGETALL key
HDEL key field
HKEYS key
HVALS key
HINCRBY key field increment
```

**应用场景**：
- **对象存储**：用户信息（避免序列化/反序列化开销）
- **购物车**：`cart:userId` -> `{itemId: quantity}`
- **计数器组**：文章多维统计（阅读数、点赞数、评论数）

```java
// 购物车实现
public void addToCart(Long userId, Long itemId, int quantity) {
    String key = "cart:" + userId;
    redisTemplate.opsForHash().put(key, String.valueOf(itemId), String.valueOf(quantity));
}

public Map<Object, Object> getCart(Long userId) {
    return redisTemplate.opsForHash().entries("cart:" + userId);
}

public void changeQuantity(Long userId, Long itemId, int delta) {
    String key = "cart:" + userId;
    redisTemplate.opsForHash().increment(key, String.valueOf(itemId), delta);
}
```

#### Set（集合）

**底层结构**：元素都是整数且数量 <= `set-max-intset-entries`（默认 512）时使用 `intset`，否则使用 `hashtable`。

**常用命令**：
```bash
SADD key member1 member2
SREM key member
SMEMBERS key
SISMEMBER key member    # O(1) 判断是否存在
SCARD key               # 元素个数
SINTER key1 key2        # 交集
SUNION key1 key2        # 并集
SDIFF key1 key2         # 差集
SRANDMEMBER key count   # 随机获取
SPOP key count          # 随机弹出
```

**应用场景**：
- **标签系统**：用户兴趣标签、文章标签
- **共同好友**：`SINTER userA:friends userB:friends`
- **随机抽奖**：`SRANDMEMBER` / `SPOP`
- **去重**：统计独立 IP、独立访客

```java
// 标签系统
public void addTags(Long userId, String... tags) {
    String key = "user:tags:" + userId;
    redisTemplate.opsForSet().add(key, tags);
}

// 共同好友
public Set<String> getCommonFriends(Long userIdA, Long userIdB) {
    String keyA = "friends:" + userIdA;
    String keyB = "friends:" + userIdB;
    return redisTemplate.opsForSet().intersect(keyA, keyB);
}

// 抽奖系统
public Set<String> drawPrize(String activityKey, int count) {
    return redisTemplate.opsForSet().distinctRandomMembers(activityKey, count);
}
```

#### ZSet（有序集合）

**底层结构**：元素数量少且值小时使用 `ziplist`，否则使用 **跳表（SkipList）+ 字典（dict）** 双重结构。

**常用命令**：
```bash
ZADD key score member
ZREM key member
ZSCORE key member
ZRANGE key start stop [WITHSCORES]    # 按分数升序
ZREVRANGE key start stop [WITHSCORES] # 按分数降序
ZRANGEBYSCORE key min max
ZRANK key member       # 排名（升序）
ZREVRANK key member    # 排名（降序）
ZCARD key              # 元素总数
ZINCRBY key increment member
```

**应用场景**：
- **排行榜**：游戏积分排名、热搜排行
- **延迟队列**：分数存储执行时间戳
- **滑动窗口限流**：用时间戳作为分数

```java
// 排行榜实现
public void updateScore(String rankKey, String member, double score) {
    redisTemplate.opsForZSet().add(rankKey, member, score);
}

// 获取 Top 10
public Set<ZSetOperations.TypedTuple<String>> getTop10(String rankKey) {
    return redisTemplate.opsForZSet()
        .reverseRangeWithScores(rankKey, 0, 9);
}

// 获取用户排名
public Long getUserRank(String rankKey, String member) {
    Long rank = redisTemplate.opsForZSet().reverseRank(rankKey, member);
    return rank != null ? rank + 1 : null; // 排名从1开始
}

// 滑动窗口限流
public boolean isRateLimited(String userId, int maxRequests, int windowSeconds) {
    String key = "rate_limit:" + userId;
    long now = System.currentTimeMillis();
    long windowStart = now - windowSeconds * 1000L;
    // 移除窗口外的记录
    redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);
    // 添加当前请求
    redisTemplate.opsForZSet().add(key, String.valueOf(now), now);
    // 统计窗口内请求数
    Long count = redisTemplate.opsForZSet().zCard(key);
    return count != null && count > maxRequests;
}
```

---

### 8.1.2 三种特殊类型

#### Bitmap（位图）

**原理**：基于 String 类型，每个 bit 位代表一个状态（0 或 1），底层使用 SDS 的 `BITCOUNT`、`BITOP` 等位操作命令。

**常用命令**：
```bash
SETBIT key offset value     # 设置指定位的值
GETBIT key offset           # 获取指定位的值
BITCOUNT key [start end]    # 统计值为1的位数
BITOP operation destkey key1 key2  # 位运算（AND/OR/XOR/NOT）
BITPOS key bit [start end]  # 查找第一个为bit的位置
```

**应用场景**：
- **用户签到**：按天偏移，记录签到状态
- **在线状态**：百万级用户在线统计
- **布隆过滤器**：底层实现基础

```java
// 用户签到系统（按月签到）
public void signIn(Long userId, LocalDate date) {
    int dayOfMonth = date.getDayOfMonth();
    String key = "sign:" + userId + ":" + date.getYear() + "-" + date.getMonthValue();
    redisTemplate.opsForValue().setBit(key, dayOfMonth - 1, true);
}

// 统计本月签到天数
public long getSignInDays(Long userId, int year, int month) {
    String key = "sign:" + userId + ":" + year + "-" + month;
    return redisTemplate.execute((RedisCallback<Long>) connection ->
        connection.bitCount(key.getBytes(), 0, -1));
}

// 统计活跃用户数（BITCOUNT）
public long getActiveUserCount(String date) {
    String key = "active:" + date;
    return redisTemplate.execute((RedisCallback<Long>) connection ->
        connection.bitCount(key.getBytes()));
}
```

#### HyperLogLog（基数统计）

**原理**：基于概率算法，使用固定的 12KB 内存即可统计 2^64 个不同元素的近似基数，标准误差约 0.81%。

**常用命令**：
```bash
PFADD key element1 element2   # 添加元素
PFCOUNT key                   # 获取基数估算值
PFMERGE destkey key1 key2     # 合并多个 HyperLogLog
```

**应用场景**：
- **UV 统计**：页面独立访客数
- **搜索词统计**：独立搜索关键词数量

```java
// UV 统计
public void recordUV(String page, String userId) {
    String key = "uv:" + page + ":" + LocalDate.now();
    redisTemplate.opsForHyperLogLog().add(key, userId);
}

public long getUV(String page) {
    String key = "uv:" + page + ":" + LocalDate.now();
    return redisTemplate.opsForHyperLogLog().size(key);
}
```

#### GEO（地理位置）

**底层结构**：基于 **ZSet** 实现，使用 GeoHash 将经纬度编码为 52 位的分数值。

**常用命令**：
```bash
GEOADD key longitude latitude member
GEOPOS key member              # 获取坐标
GEODIST key member1 member2 [unit]  # 计算距离
GEORADIUS key longitude latitude radius unit [WITHCOORD] [WITHDIST] [COUNT count]
GEOSEARCH key fromLonLat longitude latitude BYRADIUS radius unit COUNT count
```

**应用场景**：
- **附近的人**：LBS 服务
- **外卖配送范围**：计算商家与用户的距离
- **门店搜索**：查找附近的门店

```java
// 添加门店位置
public void addStore(String storeId, double longitude, double latitude) {
    redisTemplate.opsForGeo().add("stores",
        new Point(longitude, latitude), storeId);
}

// 搜索附近 5km 内的门店
public List<GeoResult<RedisGeoCommands.GeoLocation<String>>> findNearbyStores(
        double longitude, double latitude, double radiusKm) {
    Circle circle = new Circle(new Point(longitude, latitude),
        new Distance(radiusKm, Metrics.KILOMETERS));
    RedisGeoCommands.GeoRadiusCommandArgs args =
        RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
            .includeDistance().includeCoordinates().limit(20);
    return redisTemplate.opsForGeo().radius("stores", circle, args)
        .getContent();
}
```

---

### 8.1.3 Redis 单线程模型与 IO 多路复用

#### 为什么 Redis 单线程还这么快？

1. **纯内存操作**：内存读写速度极快（纳秒级）
2. **单线程避免上下文切换**：没有线程切换和锁竞争的开销
3. **IO 多路复用**：单线程高效处理大量并发连接
4. **高效的数据结构**：跳表、压缩列表等针对内存优化

#### IO 多路复用模型

Redis 采用 **Reactor 模式**，通过 epoll/kqueue 实现多路复用：

```
                    ┌──────────────────────────────────┐
                    │         Redis 事件循环            │
                    │  ┌────────────────────────────┐  │
  Client A ────────>│  │   File Event Handler       │  │
  Client B ────────>│  │  ┌─────┐ ┌─────┐ ┌─────┐ │  │
  Client C ────────>│  │  │ AE  │ │ EPOLL│ │SELECT│ │  │
                    │  │  └─────┘ └─────┘ └─────┘ │  │
                    │  └────────────────────────────┘  │
                    │  ┌────────────────────────────┐  │
                    │  │   Time Event Handler        │  │
                    │  │  (serverCron 定时任务)       │  │
                    │  └────────────────────────────┘  │
                    └──────────────────────────────────┘
```

**工作流程**：
1. **epoll_wait** 阻塞等待，监听多个 socket 上的事件
2. 有事件到达时返回就绪的 socket 列表
3. **依次处理**每个就绪 socket 的读写事件
4. 处理完所有事件后，再次进入 epoll_wait

#### Redis 6.0 多线程 IO

Redis 6.0 引入多线程，但**仅用于网络 IO 读写**，命令执行仍然是单线程：

```
Client ──> IO Thread 1 ──┐
Client ──> IO Thread 2 ──┼──> Main Thread（命令执行）──> IO Thread 1 ──> Client
Client ──> IO Thread 3 ──┘
```

**配置**：
```conf
io-threads 4              # IO 线程数
io-threads-do-reads yes   # IO 线程是否处理读操作
```

---

### 8.1.4 String 底层结构（SDS）与编码优化

#### SDS（Simple Dynamic String）结构

```c
struct __attribute__ ((__packed__)) sdshdr64 {
    uint64_t len;     // 已使用长度
    uint64_t alloc;   // 分配的总长度（不含头部和结尾的 \0）
    unsigned char flags; // SDS 类型（低3位）
    char buf[];       // 字符数组
};
```

**SDS 与 C 字符串对比**：

| 特性 | C 字符串 | SDS |
|------|---------|-----|
| 获取长度 | O(N) 遍历 | O(1) 直接读 len |
| 缓冲区安全 | 可能溢出 | 空间预分配，防止溢出 |
| 修改字符串 | N 次内存重分配 | 最多 N 次内存重分配 |
| 二进制安全 | 不支持（以 \0 结尾） | 支持（len 标识长度） |
| API 兼容 | - | 兼容部分 C 字符串函数 |

**空间预分配策略**：
- 修改后 SDS 长度 < 1MB：分配 `2 * len` 的空间
- 修改后 SDS 长度 >= 1MB：分配 `len + 1MB` 的空间

**惰性释放**：缩短字符串时不立即释放内存，通过 `free` 字段记录，后续使用时可直接复用。

> 注意：在 Redis 5.0+ 的 SDS（sdshdr8/16/32/64）中，`free` 字段已被移除，改用 `alloc - len` 计算剩余空间。

#### String 的三种编码

| 编码 | 条件 | 特点 |
|------|------|------|
| **int** | 值为整数且范围在 `long` 内 | 直接存储整数，8 字节 |
| **embstr** | 字符串长度 <= 44 字节 | RedisObject + SDS 一次分配，内存连续 |
| **raw** | 字符串长度 > 44 字节 | RedisObject 和 SDS 分两次分配 |

```c
// RedisObject 结构
typedef struct redisObject {
    unsigned type:4;      // 类型（String/List/Hash/Set/ZSet）
    unsigned encoding:4;  // 编码方式
    unsigned lru:LRU_BITS; // LRU 时间戳或 LFU 数据
    int refcount;         // 引用计数
    void *ptr;            // 指向底层数据结构的指针
} robj;
```

**embstr vs raw**：
- `embstr`：RedisObject（16 字节）和 SDS（header + 数据 + \0）连续分配，只需一次内存分配，缓存友好
- `raw`：RedisObject 和 SDS 分开分配，需要两次内存分配
- **44 字节分界线**：`embstr` 最大长度 = 64（ jemalloc 最小分配单元）- 16（RedisObject）- 3（SDS header）- 1（\0）= 44

---

## 8.2 Redis 高级数据结构

### 8.2.1 跳表（SkipList）原理与实现

#### 跳表原理

跳表是一种**有序数据结构**，通过多级索引实现快速查找，平均时间复杂度为 **O(logN)**，最坏 O(N)。

```
Level 4:  1 ────────────────────────────────────────> 9
Level 3:  1 ────────────> 4 ────────────────────────> 9
Level 2:  1 ────> 3 ────> 4 ────> 6 ────────────────> 9
Level 1:  1 ────> 3 ────> 4 ────> 6 ────> 7 ────> 8 ─> 9
```

**查找过程**（查找值为 6 的节点）：
1. 从最高层 Level 4 的头节点开始
2. 6 < 9，沿 Level 4 向右无法前进，**下降**到 Level 3
3. Level 3 中 6 > 4，移动到 4，然后 6 < 9，下降到 Level 2
4. Level 2 中 6 > 4，移动到 4，然后 6 = 6，**找到目标**

#### Redis 跳表实现特点

```c
typedef struct zskiplistNode {
    sds ele;                       // 成员对象
    double score;                  // 分值
    struct zskiplistNode *backward; // 后退指针
    struct zskiplistLevel {
        struct zskiplistNode *forward; // 前进指针
        unsigned long span;        // 跨度（用于计算排名）
    } level[];
} zskiplistNode;

typedef struct zskiplist {
    struct zskiplistNode *header, *tail; // 头尾节点
    unsigned long length;           // 节点数量
    int level;                      // 最大层数
} zskiplist;
```

**Redis 跳表 vs 红黑树**：

| 对比项 | 跳表 | 红黑树 |
|--------|------|--------|
| 查找 | O(logN) 平均 | O(logN) 最坏保证 |
| 范围查询 | O(logN) 定位 + O(N) 遍历 | O(logN) 定位 + 中序遍历 |
| 实现复杂度 | 简单 | 复杂 |
| 内存占用 | 每个节点有多层指针 | 每个节点有左右子节点 + 颜色 |
| 插入/删除 | 通过随机层数，简单 | 需要旋转，复杂 |

Redis 选择跳表的原因：
1. **范围查询更方便**：跳表通过 `span` 字段可直接计算排名，链表遍历更高效
2. **实现简单**：比红黑树容易理解和维护
3. **内存可调**：通过 `zsl-max-level` 控制最大层数
4. **并发友好**：插入/删除只需修改局部指针

#### 随机层数算法

```c
int zslRandomLevel(void) {
    int level = 1;
    while ((random() & 0xFFFF) < (ZSKIPLIST_P * 0xFFFF))
        level += 1;
    return (level < ZSKIPLIST_MAXLEVEL) ? level : ZSKIPLIST_MAXLEVEL;
}
// ZSKIPLIST_P = 0.25，即每层有 25% 概率向上生长
// ZSKIPLIST_MAXLEVEL = 32
```

---

### 8.2.2 压缩列表（ziplist）与 quicklist

#### ziplist 结构

ziplist 是一块**连续内存**，用于存储少量数据以节省内存：

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ zlbytes  │ zltail   │ zllen    │ entry1   │ entry2   │ zlend    │
│ (4字节)  │ (4字节)  │ (2字节)  │          │          │ (1字节)  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

每个 entry 的结构：
```
┌──────────────┬────────────┬──────────┐
│ prevlen      │ encoding   │ data     │
│ (前一个entry │ (编码类型)  │ (数据)   │
│  的长度)     │            │          │
└──────────────┴────────────┴──────────┘
```

**ziplist 的缺点**：
- **连锁更新**：修改一个 entry 导致 `prevlen` 变大，可能引发后续 entry 的 `prevlen` 级联扩展
- 数据量大时性能下降：插入/删除需要内存重分配和数据搬运

#### quicklist

Redis 3.2 引入 quicklist，是 **双向链表 + ziplist** 的混合结构：

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ quicklist│───>│ quicklist│───>│ quicklist│───> NULL
│  node    │<───│  node    │<───│  node    │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     v               v               v
┌─────────┐    ┌─────────┐    ┌─────────┐
│ ziplist │    │ ziplist │    │ ziplist │
└─────────┘    └─────────┘    └─────────┘
```

**配置参数**：
```conf
list-max-ziplist-size -2    # 每个节点 ziplist 大小限制（-2: 8KB）
list-compress-depth 0       # 压缩深度（0: 不压缩；1: 首尾不压缩）
```

**quicklist 的优势**：
- 分段存储，避免单个 ziplist 过大导致的性能问题
- 双向链表支持两端 O(1) 操作
- 可配置压缩，节省内存
- 避免 ziplist 的连锁更新问题

#### listpack（Redis 7.0）

Redis 7.0 使用 **listpack** 替代 ziplist，解决了连锁更新问题：
- listpack 中每个 entry **只记录自身长度**，不记录前一个 entry 的长度
- 不存在级联更新问题

---

### 8.2.3 字典（dict）与渐进式 rehash

#### dict 结构

```c
typedef struct dict {
    dictType *type;        // 类型特定函数
    void *privdata;        // 私有数据
    dictht ht[2];          // 两个哈希表（用于 rehash）
    long rehashidx;        // rehash 进度（-1 表示未进行）
    int16_t pauserehash;   // 暂停 rehash 的计数器
} dict;

typedef struct dictht {
    dictEntry **table;     // 哈希表数组
    unsigned long size;    // 哈希表大小
    unsigned long sizemask;// 掩码（size - 1）
    unsigned long used;    // 已有节点数量
} dictht;

typedef struct dictEntry {
    void *key;             // 键
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
        double d;
    } v;                   // 值
    struct dictEntry *next; // 链表下一个节点（解决哈希冲突）
} dictEntry;
```

#### 渐进式 rehash

Redis 的 rehash 不是一次性完成的，而是**分多次、渐进式**地进行：

```
rehash 前：
ht[0]: [bucket0] -> entry -> entry -> NULL
       [bucket1] -> entry -> NULL
       [bucket2] -> NULL
       [bucket3] -> entry -> NULL
ht[1]: NULL（未分配）

rehash 中（rehashidx = 1，正在迁移 bucket1）：
ht[0]: [bucket0] -> NULL（已迁移）
       [bucket1] -> entry -> NULL（正在迁移）
       [bucket2] -> NULL
       [bucket3] -> entry -> NULL
ht[1]: [bucket0'] -> entry -> entry -> NULL（已迁移）
       [bucket1'] -> NULL
       [bucket2'] -> NULL
       [bucket3'] -> NULL
       ...

rehash 完成：
ht[0]: 释放
ht[1]: 成为新的 ht[0]
```

**渐进式 rehash 的触发条件**：
- 负载因子 = `used / size`
- 没有 `BGSAVE`/`BGREWRITEAOF` 时：负载因子 >= 1 触发
- 有 `BGSAVE`/`BGREWRITEAOF` 时：负载因子 >= 5 触发（避免 COW 时内存翻倍）

**rehash 期间的读写操作**：
- **查找**：先查 ht[0]，找不到再查 ht[1]
- **新增**：只写入 ht[1]
- **删除/修改**：在 ht[0] 中找到则操作，否则在 ht[1] 中操作
- 每次执行 CRUD 操作时，顺带迁移 ht[0] 中 `rehashidx` 位置的一个 bucket

---

### 8.2.4 RedisObject 与类型系统

```c
typedef struct redisObject {
    unsigned type:4;        // 类型
    unsigned encoding:4;    // 编码
    unsigned lru:LRU_BITS;  // LRU/LFU 信息
    int refcount;           // 引用计数（内存回收）
    void *ptr;              // 指向底层数据结构
} robj;
```

**五种类型与编码对应关系**：

| 类型 | type 值 | 可能的 encoding |
|------|---------|----------------|
| OBJ_STRING | 0 | int, embstr, raw |
| OBJ_LIST | 1 | quicklist |
| OBJ_HASH | 2 | ziplist/listpack, hashtable |
| OBJ_SET | 3 | intset, hashtable |
| OBJ_ZSET | 4 | ziplist/listpack, skiplist+dict |

**编码转换条件**（以 Hash 为例）：
```conf
hash-max-ziplist-entries 512    # 字段数 <= 512 时使用 ziplist
hash-max-ziplist-value 64       # 每个字段值 <= 64 字节时使用 ziplist
```

**引用计数与内存回收**：
- `refcount` 记录对象被引用的次数
- 创建时 `refcount = 1`
- 被新引用时 `refcount++`
- 引用被释放时 `refcount--`
- `refcount == 0` 时释放内存
- Redis 使用**对象共享**：如数字 0-9999 的字符串对象被共享

---

## 8.3 缓存常见问题

### 8.3.1 缓存穿透

**定义**：查询一个**数据库和缓存中都不存在**的数据，每次请求都会打到数据库，恶意攻击者可利用此漏洞压垮数据库。

**解决方案**：

#### 方案一：布隆过滤器

```
请求 ──> 布隆过滤器 ──> 不存在 ──> 直接返回
              │
              v
             存在 ──> 查缓存 ──> 查数据库
```

```java
// 基于 Redisson 的布隆过滤器
@Autowired
private RedissonClient redissonClient;

public void initBloomFilter() {
    RBloomFilter<String> bloomFilter = redissonClient.getBloomFilter("userBloomFilter");
    bloomFilter.tryInit(1000000L, 0.03); // 预期元素数，误判率
    // 预热：加载所有存在的用户ID
    List<Long> allUserIds = userMapper.selectAllIds();
    allUserIds.forEach(id -> bloomFilter.add(String.valueOf(id)));
}

public User getUserById(Long userId) {
    RBloomFilter<String> bloomFilter = redissonClient.getBloomFilter("userBloomFilter");
    // 布隆过滤器判断不存在，则一定不存在
    if (!bloomFilter.contains(String.valueOf(userId))) {
        return null;
    }
    // 布隆过滤器判断存在，可能误判，继续查缓存和数据库
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        return JSON.parseObject(json, User.class);
    }
    User user = userMapper.selectById(userId);
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
    }
    return user;
}
```

#### 方案二：缓存空值

```java
public User getUserById(Long userId) {
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        if ("NULL".equals(json)) {
            return null; // 缓存的空值
        }
        return JSON.parseObject(json, User.class);
    }
    User user = userMapper.selectById(userId);
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
    } else {
        // 缓存空值，设置较短的过期时间，防止占用过多内存
        redisTemplate.opsForValue().set(key, "NULL", 5, TimeUnit.MINUTES);
    }
    return user;
}
```

**两种方案对比**：

| 方案 | 优点 | 缺点 |
|------|------|------|
| 布隆过滤器 | 内存占用小，适合大量数据 | 存在误判率，不支持删除 |
| 缓存空值 | 实现简单 | 占用额外内存，不适合大量空值 |

---

### 8.3.2 缓存击穿

**定义**：某个**热点 Key 在过期的瞬间**，大量并发请求同时打到数据库，导致数据库压力骤增。

**解决方案**：

#### 方案一：互斥锁（Mutex Lock）

```java
public User getUserWithLock(Long userId) {
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        return JSON.parseObject(json, User.class);
    }

    // 获取分布式锁
    String lockKey = "lock:user:" + userId;
    String requestId = UUID.randomUUID().toString();
    try {
        boolean locked = Boolean.TRUE.equals(
            redisTemplate.opsForValue().setIfAbsent(lockKey, requestId, 10, TimeUnit.SECONDS));
        if (locked) {
            try {
                // 双重检查
                json = redisTemplate.opsForValue().get(key);
                if (json != null) {
                    return JSON.parseObject(json, User.class);
                }
                User user = userMapper.selectById(userId);
                if (user != null) {
                    redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
                }
                return user;
            } finally {
                // 释放锁（Lua 脚本保证原子性）
                String luaScript = "if redis.call('get', KEYS[1]) == ARGV[1] " +
                    "then return redis.call('del', KEYS[1]) else return 0 end";
                redisTemplate.execute(new DefaultRedisScript<>(luaScript, Long.class),
                    Collections.singletonList(lockKey), requestId);
            }
        } else {
            // 获取锁失败，短暂休眠后重试
            Thread.sleep(50);
            return getUserWithLock(userId);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return null;
    }
}
```

#### 方案二：逻辑过期

```java
// 逻辑过期数据结构
@Data
public class CacheData<T> {
    private T data;
    private LocalDateTime expireTime; // 逻辑过期时间
}

// 缓存预热：设置逻辑过期时间（物理不过期）
public void preWarm(Long userId) {
    User user = userMapper.selectById(userId);
    CacheData<User> cacheData = new CacheData<>();
    cacheData.setData(user);
    cacheData.setExpireTime(LocalDateTime.now().plusMinutes(30));
    redisTemplate.opsForValue().set("user:" + userId,
        JSON.toJSONString(cacheData));
}

// 异步重建缓存
public User getUserWithLogicalExpire(Long userId) {
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    CacheData<User> cacheData = JSON.parseObject(json, new TypeReference<CacheData<User>>() {});
    if (cacheData.getExpireTime().isAfter(LocalDateTime.now())) {
        // 未过期，直接返回
        return cacheData.getData();
    }
    // 已过期，尝试异步重建
    String lockKey = "lock:rebuild:" + userId;
    boolean locked = Boolean.TRUE.equals(
        redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS));
    if (locked) {
        // 获取锁成功，异步重建缓存
        CompletableFuture.runAsync(() -> {
            try {
                User user = userMapper.selectById(userId);
                CacheData<User> newCacheData = new CacheData<>();
                newCacheData.setData(user);
                newCacheData.setExpireTime(LocalDateTime.now().plusMinutes(30));
                redisTemplate.opsForValue().set(key, JSON.toJSONString(newCacheData));
            } finally {
                redisTemplate.delete(lockKey);
            }
        }, executor);
    }
    // 无论是否获取锁，都返回旧数据（高可用）
    return cacheData.getData();
}
```

**两种方案对比**：

| 方案 | 一致性 | 可用性 | 适用场景 |
|------|--------|--------|---------|
| 互斥锁 | 强一致 | 较低（可能阻塞） | 对一致性要求高 |
| 逻辑过期 | 最终一致 | 高（始终有数据返回） | 对可用性要求高 |

---

### 8.3.3 缓存雪崩

**定义**：**大量 Key 同时过期**，或者 Redis 集群宕机，导致大量请求同时打到数据库。

**解决方案**：

#### 方案一：过期时间随机化

```java
// 基础过期时间 + 随机偏移
public void cacheUser(User user) {
    String key = "user:" + user.getId();
    int baseExpire = 30; // 30 分钟
    int randomOffset = new Random().nextInt(10); // 0-10 分钟随机
    int expire = baseExpire + randomOffset;
    redisTemplate.opsForValue().set(key, JSON.toJSONString(user), expire, TimeUnit.MINUTES);
}
```

#### 方案二：多级缓存

```
请求 ──> 本地缓存（Caffeine/Guava）──> Redis 缓存 ──> 数据库
           (L1, 毫秒级)                  (L2, 毫秒级)    (毫秒~秒级)
```

```java
// 多级缓存实现
@Autowired
private Cache<Long, User> localCache; // Caffeine 本地缓存

public User getUser(Long userId) {
    // L1: 本地缓存
    User user = localCache.getIfPresent(userId);
    if (user != null) {
        return user;
    }
    // L2: Redis 缓存
    String key = "user:" + userId;
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        user = JSON.parseObject(json, User.class);
        localCache.put(userId, user); // 回填本地缓存
        return user;
    }
    // L3: 数据库
    user = userMapper.selectById(userId);
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
        localCache.put(userId, user);
    }
    return user;
}
```

#### 方案三：高可用保障

- Redis 集群 + 哨兵，避免单点故障
- 服务降级与限流（Hystrix / Sentinel）
- 数据库层面：读写分离、连接池优化

---

### 8.3.4 缓存与数据库一致性

#### Cache Aside（旁路缓存）-- 最常用

**读流程**：先读缓存，未命中则读数据库，然后回填缓存

**写流程**：先更新数据库，再删除缓存

```java
// Cache Aside 写策略
@Transactional
public void updateUser(User user) {
    // 1. 先更新数据库
    userMapper.updateById(user);
    // 2. 再删除缓存
    redisTemplate.delete("user:" + user.getId());
}

// Cache Aside 读策略
public User getUser(Long userId) {
    String key = "user:" + userId;
    // 1. 先读缓存
    String json = redisTemplate.opsForValue().get(key);
    if (json != null) {
        return JSON.parseObject(json, User.class);
    }
    // 2. 缓存未命中，读数据库
    User user = userMapper.selectById(userId);
    // 3. 回填缓存
    if (user != null) {
        redisTemplate.opsForValue().set(key, JSON.toJSONString(user), 30, TimeUnit.MINUTES);
    }
    return user;
}
```

**为什么是删除缓存而不是更新缓存？**
- 懒加载：下次读取时再更新，避免不常访问的数据浪费写操作
- 并发安全：更新缓存可能导致并发写不一致

**先更新数据库还是先删除缓存？**

推荐**先更新数据库，再删除缓存**：

| 方案 | 异常场景 | 一致性 |
|------|---------|--------|
| 先删缓存，再更新DB | 删缓存后、更新DB前有读请求，旧值回填缓存 | 不一致 |
| 先更新DB，再删缓存 | 更新DB后、删缓存前有读请求，旧值回填缓存（概率低） | 基本一致 |

**延迟双删策略**（增强一致性）：
```java
public void updateUser(User user) {
    // 1. 先删除缓存
    redisTemplate.delete("user:" + user.getId());
    // 2. 更新数据库
    userMapper.updateById(user);
    // 3. 延迟再次删除缓存（防止步骤1和2之间有读请求回填旧值）
    CompletableFuture.runAsync(() -> {
        try {
            Thread.sleep(500); // 延迟500ms
            redisTemplate.delete("user:" + user.getId());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    });
}
```

#### Write Through（写穿）

缓存层负责同步地将数据写入数据库和缓存，应用层只与缓存交互。

```
应用 ──> 缓存层 ──> 同步写入数据库
             │
             v
          更新缓存
```

#### Write Behind（写回 / 异步缓存写入）

缓存层先更新缓存，然后**异步**批量写入数据库。

```
应用 ──> 缓存层 ──> 立即更新缓存
                └──> 异步批量写入数据库
```

**三种策略对比**：

| 策略 | 一致性 | 性能 | 复杂度 | 适用场景 |
|------|--------|------|--------|---------|
| Cache Aside | 最终一致 | 高 | 低 | 最常用 |
| Write Through | 强一致 | 中 | 中 | 对一致性要求高 |
| Write Behind | 弱一致 | 最高 | 高 | 写密集场景 |

---

## 8.4 Redis 持久化

### 8.4.1 RDB 快照

**原理**：在指定的时间间隔内，对内存中的数据集进行**快照**（snapshot），将某一时刻的全部数据以二进制形式保存到 dump.rdb 文件。

#### save vs bgsave

| 命令 | 是否阻塞 | 说明 |
|------|---------|------|
| `save` | 是 | 同步保存，阻塞所有客户端，生产环境禁用 |
| `bgsave` | 否 | fork 子进程进行保存，父进程继续处理请求 |

**bgsave 流程**：
```
Redis 主进程 ──fork()──> 子进程（写 RDB 文件）
     │                         │
     │  继续处理客户端请求       │  遍历内存，写入 RDB 文件
     │                         │
     │                         v
     │                    完成写入，通知主进程
     v
  替换旧的 RDB 文件
```

#### COW（Copy On Write）机制

`bgsave` 使用 **fork + COW**：
1. `fork()` 创建子进程时，父子进程**共享内存页**
2. 子进程遍历内存生成 RDB，使用的是 fork 时的内存快照
3. 父进程修改某个内存页时，操作系统才**复制**该页（写时复制）
4. 子进程始终看到的是 fork 时刻的内存数据

**RDB 配置**：
```conf
save 900 1       # 900秒内至少1个Key变化
save 300 10      # 300秒内至少10个Key变化
save 60 10000    # 60秒内至少10000个Key变化

dbfilename dump.rdb
dir /var/lib/redis
rdbcompression yes    # 压缩
rdbchecksum yes       # 校验和
stop-writes-on-bgsave-error yes  # bgsave失败时停止写入
```

**RDB 的优缺点**：

| 优点 | 缺点 |
|------|------|
| 文件紧凑，恢复速度快 | 无法做到实时/秒级持久化 |
| 对性能影响小（子进程做） | fork() 在大数据集时耗时 |
| 适合备份和灾难恢复 | 两次快照之间的数据可能丢失 |

---

### 8.4.2 AOF 日志

**原理**：记录所有**写操作命令**，以追加（append-only）方式写入 AOF 文件，Redis 重启时通过重新执行这些命令来恢复数据。

#### AOF 工作流程

```
写命令 ──> AOF 缓冲区 ──> AOF 文件
              │
              ├──> 根据策略刷入文件
              │
              v
         AOF 重写（压缩文件）
```

#### appendfsync 策略

| 策略 | 说明 | 数据安全性 | 性能 |
|------|------|-----------|------|
| **always** | 每次写操作都同步刷盘 | 最高，最多丢失一条命令 | 最低 |
| **everysec** | 每秒刷盘一次 | 较高，最多丢失1秒数据 | 折中 |
| **no** | 由操作系统决定何时刷盘 | 最低，可能丢失较多数据 | 最高 |

**推荐**：`everysec`，兼顾安全性和性能。

#### AOF 重写

**目的**：随着时间推移，AOF 文件会越来越大，重写可以压缩文件。

**重写原理**：不是读取旧 AOF 文件，而是直接读取当前数据库状态，用最少的命令来重建。

```bash
# 手动触发
BGREWRITEAOF

# 配置
auto-aof-rewrite-percentage 100  # AOF 文件大小是上次重写后的100%时触发
auto-aof-rewrite-min-size 64mb   # AOF 文件最小达到64MB才触发重写
```

**重写示例**：
```
# 重写前（6条命令）
SET counter 1
INCR counter
INCR counter
INCR counter
DEL counter
SET counter 1

# 重写后（1条命令）
SET counter 4
```

**AOF 配置**：
```conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no  # 重写期间是否暂停 fsync
```

---

### 8.4.3 混合持久化

Redis 4.0 引入，结合 RDB 和 AOF 的优点：

```
[RDB 二进制数据] + [AOF 增量命令]
     │                    │
     v                    v
  全量快照            增量写命令
  (体积小)           (实时记录)
```

**配置**：
```conf
aof-use-rdb-preamble yes
```

**工作方式**：
1. AOF 重写时，先写入 RDB 格式的全量快照
2. 快照之后的新命令以 AOF 格式追加
3. 重启时先加载 RDB 部分，再重放 AOF 部分

**优势**：
- 恢复速度快（RDB 部分直接加载）
- 数据安全性高（AOF 部分增量记录）
- 文件体积合理（比纯 AOF 小）

---

### 8.4.4 两者对比与选型

| 对比项 | RDB | AOF | 混合持久化 |
|--------|-----|-----|-----------|
| 数据安全性 | 低（可能丢失分钟级数据） | 高（最多丢失1秒） | 高 |
| 文件大小 | 小（二进制压缩） | 大（文本命令） | 中等 |
| 恢复速度 | 快 | 慢 | 较快 |
| 对性能影响 | 小（fork子进程） | 较大（每次写都要记录） | 中等 |
| 适用场景 | 备份、灾难恢复 | 数据安全要求高 | 推荐（Redis 4.0+） |

**选型建议**：
- **Redis 4.0+**：开启混合持久化（`aof-use-rdb-preamble yes`）
- **Redis 4.0 以下**：如果可以容忍少量数据丢失，仅用 RDB；否则用 AOF
- **生产环境**：建议同时开启 RDB 和 AOF，RDB 用于备份，AOF 用于数据恢复

---

## 8.5 Redis 高可用与集群

### 8.5.1 主从复制

#### 全量同步（Full Resynchronization）

```
Slave                    Master
  │──> PSYNC ? -1 ─────────>│
  │<── +FULLRESYNC runid offset ──│
  │                         │──> bgsave 生成 RDB
  │<──────── RDB 文件 ──────│
  │   （加载 RDB 到内存）     │
  │<── 复制缓冲区增量数据 ───│
  │                         │
  │   （持续接收增量）         │
```

**全量同步流程**：
1. Slave 发送 `PSYNC ? -1` 请求全量同步
2. Master 执行 `bgsave` 生成 RDB 文件
3. Master 将 RDB 文件发送给 Slave
4. Master 将此期间的写命令缓存到 **replication buffer**
5. Slave 加载 RDB 文件
6. Master 将 replication buffer 中的增量命令发送给 Slave

#### 增量同步（Partial Resynchronization）

```
Slave                    Master
  │──> PSYNC runid offset ─>│
  │                         │──> 检查 runid 和 offset
  │<── +CONTINUE ──────────│
  │<── backlog 中的增量数据 ─│
```

**增量同步条件**：
- Slave 的 `runid` 与 Master 匹配（是同一个 Master）
- Slave 的复制偏移量在 Master 的 **replication backlog**（复制积压缓冲区）范围内

**相关配置**：
```conf
# Master
repl-backlog-size 1mb        # 复制积压缓冲区大小
repl-backlog-ttl 3600        # 缓冲区空闲释放时间

# Slave
slaveof 192.168.1.100 6379   # 指定 Master
slave-read-only yes          # 从节点只读
```

#### PSYNC 命令

Redis 2.8 之前使用 `SYNC`（仅全量同步），2.8 之后使用 `PSYNC`（支持增量同步）：

```
PSYNC <runid> <offset>
```

- `PSYNC ? -1`：请求全量同步
- `PSYNC runid offset`：请求增量同步

---

### 8.5.2 哨兵模式（Sentinel）

#### 架构

```
         ┌──────────┐
         │ Sentinel1│
         └────┬─────┘
              │ 监控
┌─────────────┼─────────────┐
│             │             │
v             v             v
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Sentinel2│ │ Sentinel3│ │ Sentinel4│
└──────────┘ └──────────┘ └──────────┘
     │             │             │
     └─────────────┼─────────────┘
                   │ 监控
              ┌────┴─────┐
              │  Master  │
              └────┬─────┘
                   │ 复制
          ┌────────┼────────┐
          v        v        v
     ┌────────┐┌────────┐┌────────┐
     │ Slave1 ││ Slave2 ││ Slave3 │
     └────────┘└────────┘└────────┘
```

#### Sentinel 核心功能

1. **监控（Monitoring）**：持续检测 Master 和 Slave 是否正常工作
2. **通知（Notification）**：被监控的节点出现问题时，通过 API 发送通知
3. **自动故障转移（Failover）**：Master 故障时自动将 Slave 提升为新 Master
4. **配置提供者**：客户端通过 Sentinel 获取当前 Master 地址

#### 故障转移流程

```
1. 主观下线（SDOWN）
   Sentinel 认为 Master 不可用（超过 down-after-milliseconds）

2. 客观下线（ODOWN）
   超过 quorum 个 Sentinel 都认为 Master 不可用

3. Sentinel 选举
   通过 Raft 算法选出一个 Sentinel 执行故障转移

4. 选择新 Master
   优先级：slave-priority > 复制偏移量最大 > runid 最小

5. 执行故障转移
   a. 将选中的 Slave 提升为 Master（SLAVEOF NO ONE）
   b. 修改其他 Slave 的复制目标为新 Master
   c. 更新客户端连接信息
   d. 将旧 Master 标记为 Slave（恢复后自动同步）
```

**Sentinel 配置**：
```conf
# sentinel.conf
port 26379
sentinel monitor mymaster 127.0.0.1 6379 2   # quorum = 2
sentinel down-after-milliseconds mymaster 30000  # 30秒主观下线
sentinel failover-timeout mymaster 180000     # 故障转移超时
sentinel parallel-syncs mymaster 1            # 同时同步的Slave数
```

**Spring Boot 集成 Sentinel**：
```yaml
# application.yml
spring:
  redis:
    sentinel:
      master: mymaster
      nodes:
        - 192.168.1.101:26379
        - 192.168.1.102:26379
        - 192.168.1.103:26379
```

---

### 8.5.3 Redis Cluster

#### 架构

```
┌──────────────────────────────────────────────────────┐
│                    Redis Cluster                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Node A   │  │ Node B   │  │ Node C   │           │
│  │ Master   │  │ Master   │  │ Master   │           │
│  │ 0-5460   │  │ 5461-10922│  │ 10923-16383│         │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
│       │              │              │                 │
│  ┌────┴─────┐  ┌────┴─────┐  ┌────┴─────┐           │
│  │ Node A'  │  │ Node B'  │  │ Node C'  │           │
│  │ Slave    │  │ Slave    │  │ Slave    │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└──────────────────────────────────────────────────────┘
```

#### 槽位分配（Hash Slot）

- Redis Cluster 共有 **16384 个哈希槽**（0 ~ 16383）
- 每个节点负责一部分槽位
- Key 的槽位计算：`CRC16(key) % 16384`

```bash
# 查看槽位分配
CLUSTER SLOTS

# 手动分配槽位
CLUSTER ADDSLOTS 0 1 2 3
CLUSTER DELSLOTS 0 1 2 3

# Key 的哈希标签（Hash Tag）
# {user:1000}:profile 和 {user:1000}:orders 会被分配到同一个槽位
SET {user:1000}:profile "..."
SET {user:1000}:orders "..."
```

#### Gossip 协议

Redis Cluster 节点间通过 **Gossip 协议** 进行通信：

**消息类型**：
| 消息类型 | 说明 |
|---------|------|
| **PING** | 节点间的心跳检测，携带自身状态和其他节点信息 |
| **PONG** | 回应 PING 或 MEET，携带自身状态 |
| **MEET** | 加入集群的握手消息 |
| **FAIL** | 标记某节点为故障状态 |

**Gossip 传播过程**：
```
Node A ──PING──> Node B ──PING──> Node C
   │               │               │
   └──PONG────────>└──PONG────────>└──PONG──>
   (携带 A,B,C 的状态信息，类似流言传播)
```

#### 故障检测与转移

```
1. 故障检测
   - PING 超时（cluster-node-timeout，默认15秒）-> 标记 PFAIL（疑似故障）
   - 超过半数 Master 标记 PFAIL -> 标记 FAIL（确认故障）

2. 从节点选举
   - 故障 Master 的所有 Slave 参与选举
   - 每个 Slave 向其他 Master 发送 FAULT 授权请求
   - 获得多数 Master 授权的 Slave 成为新 Master

3. 故障转移
   - 新 Master 执行 SLAVEOF NO ONE
   - 新 Master 接管故障 Master 的所有槽位
   - 广播通知所有节点更新配置
```

**Cluster 配置**：
```conf
port 7000
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 15000
cluster-announce-ip 192.168.1.100
cluster-announce-port 7000
```

---

### 8.5.4 分片与集群方案对比

| 方案 | 客户端分片 | 代理分片（Codis） | Redis Cluster |
|------|-----------|------------------|---------------|
| 原理 | 客户端自行路由 | 代理层转发 | 节点间通信路由 |
| 复杂度 | 客户端实现 | 部署代理 | Redis 内置 |
| 性能 | 高（无代理） | 中（多一跳） | 高 |
| 扩展 | 手动 | 在线扩容 | 在线扩容 |
| 数据一致性 | 取决于实现 | 强一致 | 最终一致 |
| 运维 | 复杂 | 中等 | 简单 |
| 最大规模 | 受限于客户端 | 大 | 1000+ 节点 |

**推荐**：优先使用 **Redis Cluster**，官方原生支持，社区活跃。

---

## 8.6 Redis 应用场景

### 8.6.1 分布式锁（Redisson 实现）

#### 基础分布式锁

```java
@Autowired
private RedissonClient redissonClient;

public void doBusiness() {
    RLock lock = redissonClient.getLock("businessLock");
    try {
        // 尝试加锁：等待5秒，锁自动释放时间30秒
        boolean acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
        if (acquired) {
            // 执行业务逻辑
            businessLogic();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();
        }
    }
}
```

#### Redisson 看门狗机制（Watchdog）

Redisson 的分布式锁内置了看门狗自动续期机制：

```
1. 加锁时如果不指定 leaseTime，默认启用看门狗
2. 看门狗每 10 秒（lockWatchdogTimeout / 3）检查锁是否还被持有
3. 如果被持有，自动续期到 lockWatchdogTimeout（默认 30 秒）
4. 客户端宕机后，看门狗停止续期，锁自动过期释放
```

```java
// 看门狗自动续期（不指定 leaseTime）
RLock lock = redissonClient.getLock("myLock");
lock.lock();  // 启用看门狗，默认30秒自动过期，每10秒续期
try {
    // 业务逻辑（即使执行时间超过30秒，锁也会自动续期）
    longRunningTask();
} finally {
    lock.unlock();
}
```

#### Redisson 锁的底层原理（Lua 脚本保证原子性）

**加锁 Lua 脚本**：
```lua
-- KEYS[1] = 锁的key
-- ARGV[1] = 过期时间
-- ARGV[2] = 线程唯一标识（UUID:threadId）
if (redis.call('exists', KEYS[1]) == 0) then
    redis.call('hset', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
if (redis.call('hexists', KEYS[1], ARGV[2]) == 1) then
    redis.call('hincrby', KEYS[1], ARGV[2], 1);
    redis.call('pexpire', KEYS[1], ARGV[1]);
    return nil;
end;
return redis.call('pttl', KEYS[1]);
```

**锁的数据结构**（Hash）：
```
myLock:
  {
    "uuid:threadId1": 1,   # 重入次数
    "uuid:threadId2": 1
  }
```

#### 红锁（RedLock）

在多主节点的场景下，Redisson 提供 RedLock 算法：

```java
RLock lock1 = redissonClient1.getLock("lock");
RLock lock2 = redissonClient2.getLock("lock");
RLock lock3 = redissonClient3.getLock("lock");

RedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
try {
    redLock.lock();
    // 业务逻辑
} finally {
    redLock.unlock();
}
```

**RedLock 算法步骤**：
1. 获取当前时间戳
2. 依次向 N 个 Redis 节点请求加锁
3. 计算加锁总耗时，只有当加锁成功的节点数 > N/2 且总耗时 < 锁的有效时间时才算成功
4. 如果失败，向所有节点发送解锁请求

---

### 8.6.2 排行榜（ZSet）

```java
// 实时排行榜
public void updateScore(String rankKey, String playerId, double score) {
    redisTemplate.opsForZSet().add(rankKey, playerId, score);
}

// 获取 Top N（带分数）
public List<Map.Entry<String, Double>> getTopN(String rankKey, int n) {
    Set<ZSetOperations.TypedTuple<String>> tuples =
        redisTemplate.opsForZSet().reverseRangeWithScores(rankKey, 0, n - 1);
    return tuples.stream()
        .map(tuple -> Map.entry(tuple.getValue(), tuple.getScore()))
        .collect(Collectors.toList());
}

// 获取用户排名和分数
public Map<String, Object> getUserRankInfo(String rankKey, String playerId) {
    Long rank = redisTemplate.opsForZSet().reverseRank(rankKey, playerId);
    Double score = redisTemplate.opsForZSet().score(rankKey, playerId);
    Map<String, Object> result = new HashMap<>();
    result.put("rank", rank != null ? rank + 1 : null);
    result.put("score", score);
    return result;
}

// 分页查询排行榜
public List<Map.Entry<String, Double>> getRankPage(String rankKey, int page, int size) {
    long start = (long) (page - 1) * size;
    long end = start + size - 1;
    Set<ZSetOperations.TypedTuple<String>> tuples =
        redisTemplate.opsForZSet().reverseRangeWithScores(rankKey, start, end);
    return tuples.stream()
        .map(tuple -> Map.entry(tuple.getValue(), tuple.getScore()))
        .collect(Collectors.toList());
}
```

---

### 8.6.3 计数器与限流

#### 计数器

```java
// 文章阅读量计数
public long incrementViewCount(Long articleId) {
    String key = "article:views:" + articleId;
    return redisTemplate.opsForValue().increment(key);
}

// 限制每日签到奖励次数
public boolean canClaimDailyReward(Long userId) {
    String key = "reward:" + userId + ":" + LocalDate.now();
    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.DAYS);
    }
    return count != null && count <= 1;
}
```

#### 限流算法

**固定窗口限流**：
```java
public boolean isAllowed(String userId, int maxRequests) {
    String key = "rate:" + userId + ":" + LocalDate.now();
    Long count = redisTemplate.opsForValue().increment(key);
    if (count != null && count == 1) {
        redisTemplate.expire(key, 1, TimeUnit.DAYS);
    }
    return count != null && count <= maxRequests;
}
```

**滑动窗口限流（ZSet）**：
```java
public boolean isAllowedSlidingWindow(String userId, int maxRequests, int windowSeconds) {
    String key = "rate:sliding:" + userId;
    long now = System.currentTimeMillis();
    long windowStart = now - windowSeconds * 1000L;

    // 移除窗口外的记录
    redisTemplate.opsForZSet().removeRangeByScore(key, 0, windowStart);

    // 添加当前请求
    redisTemplate.opsForZSet().add(key, String.valueOf(now), now);

    // 设置过期时间（防止内存泄漏）
    redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);

    // 统计窗口内请求数
    Long count = redisTemplate.opsForZSet().zCard(key);
    return count != null && count <= maxRequests;
}
```

**令牌桶限流（Redisson）**：
```java
RRateLimiter rateLimiter = redissonClient.getRateLimiter("apiLimiter");
// 设置限流规则：每秒产生5个令牌
rateLimiter.trySetRate(RateType.OVERALL, 5, 1, RateIntervalUnit.SECONDS);

// 尝试获取令牌
public boolean tryAcquire() {
    return rateLimiter.tryAcquire(1);
}
```

---

### 8.6.4 延迟队列

#### 基于 ZSet 实现

```java
// 添加延迟任务
public void addDelayTask(String taskId, long delayMillis) {
    long executeTime = System.currentTimeMillis() + delayMillis;
    redisTemplate.opsForZSet().add("delay_queue", taskId, executeTime);
}

// 消费延迟任务（定时轮询）
@Scheduled(fixedRate = 1000)
public void consumeDelayTasks() {
    long now = System.currentTimeMillis();
    // 获取到期的任务
    Set<String> tasks = redisTemplate.opsForZSet()
        .rangeByScore("delay_queue", 0, now);
    if (tasks != null && !tasks.isEmpty()) {
        for (String taskId : tasks) {
            // 使用 Lua 脚本保证原子性：取出并删除
            String luaScript = "if redis.call('zscore', KEYS[1], ARGV[1]) " +
                "then return redis.call('zrem', KEYS[1], ARGV[1]) " +
                "else return 0 end";
            Long removed = redisTemplate.execute(
                new DefaultRedisScript<>(luaScript, Long.class),
                Collections.singletonList("delay_queue"), taskId);
            if (Long.valueOf(1L).equals(removed)) {
                // 处理任务
                processTask(taskId);
            }
        }
    }
}
```

#### 基于 Redisson 延迟队列

```java
RBlockingQueue<String> blockingQueue = redissonClient.getBlockingQueue("delay_queue");
RDelayedQueue<String> delayedQueue = redissonClient.getDelayedQueue(blockingQueue);

// 添加延迟任务（3秒后执行）
delayedQueue.offer("task_data", 3, TimeUnit.SECONDS);

// 消费线程
new Thread(() -> {
    while (true) {
        try {
            String task = blockingQueue.take();
            processTask(task);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            break;
        }
    }
}).start();
```

---

### 8.6.5 发布订阅

```java
// 消息发布
public void publishMessage(String channel, String message) {
    redisTemplate.convertAndSend(channel, message);
}

// 消息监听
@Component
public class RedisMessageListener implements MessageListener {

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String channel = new String(message.getChannel());
        String body = new String(message.getBody());
        System.out.println("收到消息: channel=" + channel + ", body=" + body);
    }
}

// 注册监听器
@Configuration
public class RedisConfig {

    @Bean
    public RedisMessageListenerContainer container(
            RedisConnectionFactory connectionFactory,
            MessageListener listener) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        container.addMessageListener(listener, new ChannelTopic("order_events"));
        return container;
    }
}
```

**发布订阅的局限性**：
- 消息不持久化，离线期间的消息会丢失
- 没有消息确认机制
- 不适合作为可靠的消息队列
- 推荐使用 **Redis Stream** 替代

---

## 8.7 Redis 性能优化

### 8.7.1 内存优化策略

#### 数据结构选择优化

```conf
# Hash 类型：小 Hash 使用 ziplist 编码
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# List 类型：小 List 使用 quicklist + ziplist
list-max-ziplist-size -2       # 每个节点最大 8KB
list-compress-depth 0          # 不压缩

# Set 类型：纯整数小集合使用 intset
set-max-intset-entries 512

# ZSet 类型：小 ZSet 使用 ziplist
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
```

#### Key 命名优化

```java
// 好的命名规范：业务前缀:对象类型:对象ID:字段
// user:info:1001:name
// order:detail:2001

// 使用 Hash 代替多个 String Key
// 不推荐：
SET user:1001:name "张三"
SET user:1001:age 25
SET user:1001:city "北京"

// 推荐：
HSET user:1001 name "张三" age 25 city "北京"
```

#### 数据压缩

```java
// 大对象使用 GZIP 压缩
public void setCompressed(String key, Object value) {
    byte[] data = SerializationUtils.serialize(value);
    byte[] compressed = GzipUtils.compress(data);
    redisTemplate.execute((RedisCallback<Void>) connection -> {
        connection.set(key.getBytes(), compressed);
        return null;
    });
}
```

---

### 8.7.2 热点 Key 发现与处理

#### 发现热点 Key

**方法一：Redis 4.0+ LFU 淘汰策略**
```conf
maxmemory-policy allkeys-lfu
```

**方法二：使用 `redis-cli --hotkeys`**
```bash
redis-cli --hotkeys
```

**方法三：客户端侧监控**
```java
// 使用拦截器统计 Key 访问频率
@Aspect
@Component
public class HotKeyAspect {
    private ConcurrentHashMap<String, AtomicLong> keyCounter = new ConcurrentHashMap<>();

    @Around("execution(* org.springframework.data.redis.core.*.*(..))")
    public Object monitor(ProceedingJoinPoint pjp) throws Throwable {
        // 解析 Key 并计数
        String key = extractKey(pjp);
        if (key != null) {
            keyCounter.computeIfAbsent(key, k -> new AtomicLong(0)).incrementAndGet();
        }
        return pjp.proceed();
    }
}
```

#### 处理热点 Key

**方案一：本地缓存 + Redis**
```java
// 使用 Caffeine 作为本地缓存
@Autowired
private Cache<String, Object> localCache;

public Object getHotKey(String key) {
    // 先查本地缓存
    Object value = localCache.getIfPresent(key);
    if (value != null) {
        return value;
    }
    // 再查 Redis
    value = redisTemplate.opsForValue().get(key);
    if (value != null) {
        localCache.put(key, value);
    }
    return value;
}
```

**方案二：Key 分散（打散热点）**
```java
// 将热点 Key 分散到多个 Key
public void setHotKey(String key, String value) {
    int shardCount = 10;
    for (int i = 0; i < shardCount; i++) {
        String shardKey = key + "_shard_" + i;
        redisTemplate.opsForValue().set(shardKey, value, 30, TimeUnit.MINUTES);
    }
}

public String getHotKey(String key) {
    int shard = ThreadLocalRandom.current().nextInt(10);
    String shardKey = key + "_shard_" + shard;
    return redisTemplate.opsForValue().get(shardKey);
}
```

---

### 8.7.3 大 Key 问题与解决方案

#### 大 Key 的判定标准

| 数据类型 | 大 Key 阈值 |
|---------|-----------|
| String | value > 10KB |
| Hash | 字段数 > 5000 |
| List | 元素数 > 5000 |
| Set | 元素数 > 5000 |
| ZSet | 元素数 > 5000 |

#### 大 Key 的危害

1. **内存不均**：集群模式下某个节点内存远高于其他节点
2. **阻塞**：对大 Key 操作（如 `DEL`、`HGETALL`）耗时过长
3. **网络拥塞**：读取大 Key 占用大量带宽

#### 发现大 Key

```bash
# redis-cli --bigkeys
redis-cli --bigkeys -i 0.1

# 使用 SCAN + DEBUG OBJECT
redis-cli SCAN 0 COUNT 100
redis-cli DEBUG OBJECT key
```

#### 解决方案

**方案一：拆分大 Key**
```java
// 将大 Hash 拆分为多个小 Hash
public void splitLargeHash(String key) {
    Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
    int shardSize = 500;
    int shardIndex = 0;
    Map<Object, Object> shardData = new HashMap<>();
    for (Map.Entry<Object, Object> entry : data.entrySet()) {
        shardData.put(entry.getKey(), entry.getValue());
        if (shardData.size() >= shardSize) {
            String shardKey = key + "_shard_" + shardIndex++;
            redisTemplate.opsForHash().putAll(shardKey, shardData);
            shardData.clear();
        }
    }
    if (!shardData.isEmpty()) {
        redisTemplate.opsForHash().putAll(key + "_shard_" + shardIndex, shardData);
    }
    redisTemplate.delete(key);
}
```

**方案二：异步删除**
```bash
# 使用 UNLINK 代替 DEL（Redis 4.0+）
UNLINK large_key

# 在后台线程中逐步删除
```

**方案三：压缩存储**
```java
// 对大 Value 进行压缩
public void setLargeValue(String key, String value) {
    if (value.length() > 1024) {
        byte[] compressed = GzipUtils.compress(value.getBytes(StandardCharsets.UTF_8));
        redisTemplate.opsForValue().set(key.getBytes(), compressed);
    } else {
        redisTemplate.opsForValue().set(key, value);
    }
}
```

---

### 8.7.4 Pipeline 与批量操作

#### Pipeline 原理

```
无 Pipeline：
Client ──> SET key1 v1 ──> 等待响应 ──> SET key2 v2 ──> 等待响应 ──> ...
           一次 RTT                    一次 RTT

有 Pipeline：
Client ──> SET key1 v1
        ──> SET key2 v2
        ──> SET key3 v3
        ──> ...
        ──> EXEC
        <── 一次返回所有结果
           一次 RTT
```

#### Pipeline 使用

```java
// Spring Data Redis Pipeline
public void batchSet(Map<String, String> data) {
    redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
        StringRedisConnection stringRedisConn = (StringRedisConnection) connection;
        for (Map.Entry<String, String> entry : data.entrySet()) {
            stringRedisConn.set(entry.getKey(), entry.getValue());
        }
        return null; // 返回 null，结果通过 executePipelined 收集
    });
}

// 批量获取
public List<String> batchGet(Collection<String> keys) {
    return redisTemplate.executePipelined((RedisCallback<String>) connection -> {
        StringRedisConnection stringRedisConn = (StringRedisConnection) connection;
        for (String key : keys) {
            stringRedisConn.get(key);
        }
        return null;
    });
}

// 使用 mget/mset 批量操作（更简单的方式）
public List<String> batchGetSimple(Collection<String> keys) {
    return redisTemplate.opsForValue().multiGet(keys);
}
```

**Pipeline 注意事项**：
- Pipeline 中命令数不宜过多（建议每次 <= 10,000），避免占用过多内存
- Pipeline 不保证原子性，如需原子性使用 **Lua 脚本** 或 **MULTI/EXEC**

---

### 8.7.5 内存淘汰策略（8 种）

| 策略 | 说明 |
|------|------|
| **noeviction** | 不淘汰，内存满时写入操作返回错误（默认） |
| **allkeys-lru** | 从所有 Key 中淘汰最近最少使用的 |
| **allkeys-lfu** | 从所有 Key 中淘汰使用频率最低的（Redis 4.0+） |
| **allkeys-random** | 从所有 Key 中随机淘汰 |
| **volatile-lru** | 从设置了过期时间的 Key 中淘汰最近最少使用的 |
| **volatile-lfu** | 从设置了过期时间的 Key 中淘汰使用频率最低的（Redis 4.0+） |
| **volatile-random** | 从设置了过期时间的 Key 中随机淘汰 |
| **volatile-ttl** | 从设置了过期时间的 Key 中淘汰 TTL 最短的 |

**配置**：
```conf
maxmemory 4gb                    # 最大内存限制
maxmemory-policy allkeys-lfu     # 淘汰策略
maxmemory-samples 5              # LRU/LFU 采样数量
```

**LRU vs LFU**：
- **LRU（Least Recently Used）**：淘汰最近最少访问的，适合热点数据访问模式稳定的场景
- **LFU（Least Frequently Used）**：淘汰访问频率最低的，适合存在突发流量但核心数据访问频率稳定的场景

**Redis LRU 优化**：Redis 不使用精确的 LRU（需要维护全局链表），而是采用**近似 LRU**：
- 随机采样 5 个 Key（`maxmemory-samples` 配置）
- 淘汰其中最久未使用的
- 增加采样数可以提高精确度，但会消耗更多 CPU

---

## 8.8 Redis 6.x/7.x 新特性

### 8.8.1 多线程 IO（Redis 6.0）

**核心变化**：
- 默认关闭，需手动开启
- **仅用于网络 IO 读写**，命令执行仍然是单线程
- 默认线程数 = 4，建议不超过 8

```conf
io-threads 4
io-threads-do-reads yes
```

**适用场景**：
- 网络 IO 成为瓶颈时（高并发、大 Value）
- CPU 不是瓶颈的场景

**不适用场景**：
- 已有大量慢命令（如 `KEYS *`）
- 单次请求 Value 很小但 QPS 很高

---

### 8.8.2 ACL 权限控制（Redis 6.0）

**传统认证的问题**：
- `requirepass` 只有一个密码，所有用户共享
- 无法细粒度控制权限

**ACL 功能**：
```bash
# 创建用户
ACL SETUSER alice on >password1 ~cached:* +get +set +del

# 参数说明：
# on: 启用用户
# >password1: 设置密码
# ~cached:*: 允许访问的 Key 模式
# +get +set +del: 允许的命令
# -flushall: 禁止的命令
# +@read +@write: 允许的命令类别

# 查看用户权限
ACL LIST
ACL WHOAMI
ACL GETUSER alice

# 禁用用户
ACL SETUSER alice off

# 删除用户
ACL DELUSER alice
```

**Java 集成**：
```java
// 使用不同用户连接
@Bean
public RedisConnectionFactory redisConnectionFactory() {
    RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
    config.setHostName("localhost");
    config.setPort(6379);
    config.setUsername("alice");
    config.setPassword("password1");
    return new LettuceConnectionFactory(config);
}
```

---

### 8.8.3 Function 特性（Redis 7.0）

Redis 7.0 引入 **Function** 替代 Lua 脚本的部分功能，提供更好的管理能力：

```bash
# 创建 Function
FUNCTION LOAD "#!lua name=mylib\n redis.register_function('myfunc', function(keys, args)\n return redis.call('GET', keys[1])\n end)"

# 调用 Function
FCALL myfunc 1 mykey

# 删除 Function
FUNCTION DELETE mylib

# 列出所有 Function
FUNCTION LIST
```

**Function vs Lua EVAL 的优势**：
- Function 有名称，便于管理
- 支持持久化（RDB/AOF 会保存 Function）
- 更好的调试支持
- 函数库概念，可组织多个函数

---

### 8.8.4 Stream 消息队列（Redis 5.0+）

#### Stream 基本概念

Stream 是 Redis 的**持久化消息队列**，借鉴了 Kafka 的设计：

```
Consumer Group ──> Stream ──> Messages
     │
     ├──> Consumer 1 ──> 读取消息
     ├──> Consumer 2 ──> 读取消息
     └──> Consumer 3 ──> 读取消息
```

#### 常用命令

```bash
# 创建消费者组
XGROUP CREATE mystream mygroup $ MKSTREAM

# 发送消息
XADD mystream * field1 value1 field2 value2

# 消费消息（消费者组模式）
XREADGROUP GROUP mygroup consumer1 COUNT 1 BLOCK 5000 STREAMS mystream >

# 确认消息
XACK mystream mygroup 1609459200000-0

# 查看待处理消息
XPENDING mystream mygroup

# 查看消费者组信息
XINFO GROUPS mystream
XINFO CONSUMERS mystream mygroup

# 消息长度
XLEN mystream

# 修剪 Stream
XTRIM mystream MAXLEN ~ 1000  # 保留最近1000条
```

#### Java 集成

```java
// 发送消息
public String sendMessage(String streamKey, Map<String, String> message) {
    MapRecord<String, String, String> record = StreamRecords.newRecord()
        .ofObject(message)
        .withStreamKey(streamKey);
    RecordId recordId = redisTemplate.opsForStream().add(record);
    return recordId.getValue();
}

// 创建消费者组
public void createConsumerGroup(String streamKey, String groupName) {
    try {
        redisTemplate.opsForStream().createGroup(streamKey, groupName);
    } catch (Exception e) {
        // 消费者组已存在
    }
}

// 消费消息
public List<MapRecord<String, Object, Object>> consumeMessages(
        String streamKey, String groupName, String consumerName) {
    Consumer consumer = Consumer.from(groupName, consumerName);
    StreamOffset<String> offset = StreamOffset.create(streamKey, ReadOffset.lastConsumed());
    return redisTemplate.opsForStream().read(consumer, offset);
}

// 确认消息
public void acknowledge(String streamKey, String groupName, String... messageIds) {
    redisTemplate.opsForStream().acknowledge(groupName, streamKey, messageIds);
}
```

**Stream vs 发布订阅**：

| 特性 | Stream | 发布订阅 |
|------|--------|---------|
| 消息持久化 | 支持 | 不支持 |
| 消费者组 | 支持 | 不支持 |
| 消息确认 | 支持（ACK） | 不支持 |
| 消息回溯 | 支持 | 不支持 |
| 阻塞消费 | 支持 | 支持 |
| 适用场景 | 可靠消息队列 | 实时通知 |

---

## 8.9 常见面试题汇总

### Q1: Redis 为什么快？

**A:** Redis 快的核心原因：
1. **纯内存操作**：数据存储在内存中，读写速度极快
2. **单线程模型**：避免了线程切换和锁竞争的开销
3. **IO 多路复用**：使用 epoll 实现高效的网络 IO，单线程处理大量并发连接
4. **高效的数据结构**：SDS、跳表、ziplist、quicklist 等针对内存和 CPU 缓存优化
5. **事件驱动框架**：基于 Reactor 模式，文件事件和时间事件统一处理

---

### Q2: Redis 单线程如何处理高并发？

**A:** Redis 使用 **IO 多路复用**技术，通过 epoll（Linux）/ kqueue（macOS）系统调用，单线程可以同时监听多个 socket 的可读/可写事件。当某个 socket 有数据到达时，epoll 会通知 Redis 进行处理。这样单线程就能高效处理大量并发连接，不需要为每个连接创建一个线程。

Redis 6.0 引入了多线程 IO，但仅用于网络数据的读写和协议解析，**命令执行仍然是单线程**，保证了操作的原子性。

---

### Q3: 什么是缓存穿透？如何解决？

**A:** 缓存穿透是指查询一个**数据库和缓存中都不存在**的数据，由于缓存不命中，每次请求都会打到数据库，恶意攻击者可以利用大量不存在的 Key 压垮数据库。

解决方案：
1. **布隆过滤器**：在缓存前加一层布隆过滤器，不存在的 Key 直接拦截。优点是内存占用小，缺点是有误判率且不支持删除。
2. **缓存空值**：查询数据库不存在时，将空值（如 "NULL"）缓存起来，设置较短的过期时间。优点是实现简单，缺点是大量空值占用内存。
3. **参数校验**：在请求入口进行基本的参数校验（如 ID 格式、范围），拦截明显非法的请求。

---

### Q4: 什么是缓存击穿？如何解决？

**A:** 缓存击穿是指某个**热点 Key 在过期的瞬间**，大量并发请求同时到达，由于缓存已失效，这些请求同时打到数据库，可能导致数据库压力骤增。

解决方案：
1. **互斥锁**：使用分布式锁，只允许一个线程重建缓存，其他线程等待后重试。保证一致性，但可能阻塞部分请求。
2. **逻辑过期**：缓存不设置物理过期时间，而是在数据中存储逻辑过期时间。发现逻辑过期时，异步重建缓存，期间返回旧数据。保证可用性，但存在短期数据不一致。
3. **热点 Key 永不过期**：对确定的热点 Key 不设置过期时间，通过定时任务在低峰期更新。

---

### Q5: 什么是缓存雪崩？如何解决？

**A:** 缓存雪崩是指**大量 Key 同时过期**，或者 Redis 集群宕机，导致大量请求同时打到数据库。

解决方案：
1. **过期时间随机化**：在基础过期时间上加上随机偏移，避免大量 Key 同时过期
2. **多级缓存**：本地缓存（Caffeine）+ Redis 缓存，Redis 宕机时本地缓存仍可提供部分服务
3. **Redis 高可用**：使用 Sentinel 或 Cluster 保证 Redis 可用性
4. **服务降级与限流**：数据库压力大时进行限流或返回默认值
5. **缓存预热**：系统启动时提前加载热点数据

---

### Q6: Redis 和数据库双写一致性如何保证？

**A:** 最常用的是 **Cache Aside 模式**：
- **读**：先读缓存，未命中则读数据库，然后回填缓存
- **写**：先更新数据库，再删除缓存

推荐**先更新数据库再删除缓存**，因为：
- 先删缓存再更新数据库：删除后、更新前有并发读请求会将旧值回填缓存，导致不一致
- 先更新数据库再删除缓存：极端情况下（读缓存未命中、读数据库旧值、写数据库新值、回填旧值、删除缓存），可能出现短暂不一致，但概率很低

增强方案：
- **延迟双删**：更新数据库后延迟几百毫秒再删除缓存
- **消息队列异步删除**：更新数据库后发送消息到 MQ，消费者异步删除缓存
- **监听 Binlog**：通过 Canal 监听数据库变更，异步删除缓存

---

### Q7: RDB 和 AOF 的区别？

**A:**

| 对比项 | RDB | AOF |
|--------|-----|-----|
| 原理 | 定时对内存做快照 | 记录所有写操作命令 |
| 数据安全性 | 可能丢失分钟级数据 | 最多丢失 1 秒数据 |
| 文件大小 | 小（二进制压缩） | 大（文本命令） |
| 恢复速度 | 快 | 慢 |
| 对性能影响 | fork 时有短暂阻塞 | 每次写操作都要记录 |
| 适用场景 | 备份、灾难恢复 | 数据安全要求高 |

Redis 4.0+ 推荐使用**混合持久化**（`aof-use-rdb-preamble yes`），结合两者优点：AOF 重写时先写入 RDB 格式的全量数据，再追加增量命令。

---

### Q8: Redis 的过期策略和内存淘汰策略是什么？

**A:**

**过期策略**（如何处理过期 Key）：
1. **惰性删除**：访问 Key 时检查是否过期，过期则删除
2. **定期删除**：每秒执行 10 次抽样检查，随机抽取一批 Key，删除过期的 Key。如果过期比例 > 25%，继续抽样删除

**内存淘汰策略**（内存满时如何处理）：
- `noeviction`：不淘汰，写入返回错误
- `allkeys-lru`：从所有 Key 中淘汰最近最少使用的
- `allkeys-lfu`：从所有 Key 中淘汰使用频率最低的
- `volatile-lru`：从有过期时间的 Key 中淘汰最近最少使用的
- `volatile-lfu`：从有过期时间的 Key 中淘汰使用频率最低的
- `volatile-ttl`：从有过期时间的 Key 中淘汰 TTL 最短的
- `allkeys-random`：从所有 Key 中随机淘汰
- `volatile-random`：从有过期时间的 Key 中随机淘汰

---

### Q9: Redis Cluster 的工作原理？

**A:** Redis Cluster 通过**哈希槽（Hash Slot）**实现数据分片：
1. 共有 **16384 个哈希槽**，每个节点负责一部分
2. Key 的槽位 = `CRC16(key) % 16384`
3. 客户端发送命令到任意节点，如果 Key 不在该节点上，会返回 `MOVED` 重定向

节点间通过 **Gossip 协议**通信：
- 定期通过 PING/PONG 交换节点状态信息
- 故障检测：超过 `cluster-node-timeout` 未响应标记为 PFAIL，超过半数 Master 确认后标记为 FAIL
- 故障转移：从节点发起选举，获得多数 Master 授权后提升为新 Master，接管故障节点的槽位

---

### Q10: 什么是大 Key？如何发现和处理？

**A:**

**大 Key 判定标准**：
- String 类型 value > 10KB
- Hash/List/Set/ZSet 元素数 > 5000

**危害**：
- 操作大 Key 阻塞 Redis 主线程（如 `DEL`、`HGETALL`）
- 集群中导致内存不均衡
- 网络传输占用大量带宽

**发现方式**：
- `redis-cli --bigkeys` 扫描
- Redis RDB 分析工具（redis-rdb-tools）
- 客户端侧监控

**处理方式**：
1. **拆分**：将大 Hash 拆分为多个小 Hash，大 List 拆分为多个小 List
2. **压缩**：对大 Value 进行 GZIP 压缩
3. **异步删除**：使用 `UNLINK` 代替 `DEL`（Redis 4.0+）
4. **本地缓存**：将大 Key 数据缓存到应用本地内存

---

### Q11: Redisson 分布式锁的原理？

**A:** Redisson 分布式锁基于 Redis 的 **Hash 数据结构 + Lua 脚本**实现：

1. **加锁**：使用 Lua 脚本原子性地执行 `HSET`，Hash 的 field 为 `UUID:threadId`，value 为重入次数。同时设置过期时间。
2. **看门狗（Watchdog）**：如果不指定 leaseTime，默认启动看门狗，每 10 秒（30/3）检查锁是否还被持有，自动续期到 30 秒。客户端宕机后看门狗停止，锁自动过期。
3. **可重入**：同一线程多次加锁，Hash 中重入计数 +1；解锁时 -1，为 0 时删除锁。
4. **解锁**：使用 Lua 脚本检查 Hash 中的 field 是否是当前线程的，是则重入计数 -1，为 0 则删除 Key。

Redisson 还支持**公平锁**（基于 List 的排队）、**读写锁**、**红锁**（多节点）等高级特性。

---

### Q12: 什么是跳表？Redis 为什么用跳表而不用红黑树？

**A:** 跳表是一种基于**有序链表**的多级索引结构，通过随机层数实现 O(logN) 的查找、插入、删除。

Redis ZSet 选择跳表的原因：
1. **范围查询方便**：跳表通过链表遍历即可完成范围查询，红黑树需要中序遍历
2. **实现简单**：跳表的插入/删除只需修改指针，红黑树需要旋转操作
3. **内存可调**：通过调整概率因子和最大层数控制内存
4. **性能相当**：在实际应用中，跳表和红黑树的性能差距不大
5. **并发友好**：跳表的局部修改特性更适合并发环境

---

### Q13: 什么是渐进式 rehash？

**A:** Redis 的字典（dict）在数据量增长时需要进行扩容（rehash），但一次性迁移大量数据会阻塞 Redis。因此 Redis 采用**渐进式 rehash**：

1. 为 ht[1] 分配新的哈希表（大小为第一个 >= used*2 的 2 的幂）
2. 设置 `rehashidx = 0`，标记 rehash 开始
3. 在每次执行 CRUD 操作时，顺带将 ht[0] 中 `rehashidx` 位置的 bucket 迁移到 ht[1]，然后 `rehashidx++`
4. 查找时先查 ht[0]，找不到再查 ht[1]；新增操作只写入 ht[1]
5. 所有 bucket 迁移完成后，释放 ht[0]，将 ht[1] 设为 ht[0]，`rehashidx = -1`

这样将一次性的大量迁移分散到多次操作中，避免长时间阻塞。

---

### Q14: Pipeline 的作用和注意事项？

**A:** Pipeline 是 Redis 提供的**批量操作优化**机制：

**原理**：将多个命令打包发送给 Redis 服务端，服务端依次执行后将结果打包返回，减少了网络 RTT（往返时间）。

**适用场景**：需要执行大量独立命令的场景（批量设置/获取缓存）。

**注意事项**：
1. Pipeline 中的命令不是原子执行的，如需原子性应使用 `MULTI/EXEC` 或 Lua 脚本
2. 每次 Pipeline 的命令数不宜过多（建议 <= 10,000），否则会占用大量客户端和服务端内存
3. Pipeline 返回结果的顺序与发送顺序一致
4. 不建议在 Pipeline 中执行耗时命令（如 `KEYS *`）

---

### Q15: Redis 如何实现分布式限流？

**A:** 常见的三种限流算法在 Redis 中的实现：

1. **固定窗口限流**：使用 `INCR` + `EXPIRE`，在固定时间窗口内计数
2. **滑动窗口限流**：使用 ZSet，以时间戳为 score，通过 `ZRANGEBYSCORE` 统计窗口内的请求数
3. **令牌桶限流**：使用 Redisson 的 `RRateLimiter`，基于 Lua 脚本实现

```java
// 令牌桶限流（Redisson）
RRateLimiter limiter = redissonClient.getRateLimiter("apiLimit");
limiter.trySetRate(RateType.OVERALL, 100, 1, RateIntervalUnit.SECONDS);
if (limiter.tryAcquire()) {
    // 获取令牌成功，执行请求
} else {
    // 获取令牌失败，限流
}
```

生产环境推荐使用 Redisson 的 `RRateLimiter`，它基于 Lua 脚本保证了原子性，支持多种限流模式。

---

### Q16: Redis Sentinel 和 Cluster 的区别？

**A:**

| 对比项 | Sentinel | Cluster |
|--------|----------|---------|
| 功能 | 高可用（故障自动转移） | 高可用 + 数据分片 |
| 数据分片 | 不支持，所有节点数据相同 | 支持，16384 个哈希槽 |
| 容量 | 受限于单节点内存 | 水平扩展，支持 TB 级 |
| 写性能 | 单 Master 写入 | 多 Master 并行写入 |
| 客户端 | 连接 Sentinel 获取 Master 地址 | 客户端需支持 Cluster 协议 |
| 运维复杂度 | 低 | 中等 |
| 适用场景 | 数据量不大，需要高可用 | 数据量大，需要分片 |

**选型建议**：
- 数据量 < 单机内存上限（如 10-20GB）：使用 Sentinel
- 数据量 > 单机内存上限：使用 Cluster

---

### Q17: 什么是布隆过滤器？原理和局限性？

**A:** 布隆过滤器（Bloom Filter）是一种**空间效率极高的概率型数据结构**，用于判断一个元素是否在集合中。

**原理**：
1. 使用一个位数组（bit array）和 k 个独立的哈希函数
2. 添加元素时，用 k 个哈希函数计算 k 个位置，将对应位设为 1
3. 查询元素时，用 k 个哈希函数计算 k 个位置，如果所有位都为 1，则元素**可能存在**；如果有任一位为 0，则元素**一定不存在**

**特性**：
- **可能存在误判**（False Positive）：不同元素的哈希值可能映射到相同位置
- **不会漏判**（False Negative）：如果元素不存在，一定返回不存在
- **不支持删除**：删除一个元素可能影响其他元素

**Redis 实现**：通过 `SETBIT`/`GETBIT` 命令或 Redisson 的 `RBloomFilter` 实现。

---

### Q18: Redis 的 SDS 和 C 字符串有什么区别？

**A:**

| 特性 | C 字符串 | SDS |
|------|---------|-----|
| 获取长度 | O(N) 遍历到 \0 | O(1) 读取 len 字段 |
| 缓冲区安全 | `strcpy`/`strcat` 可能溢出 | 空间预分配，自动扩容 |
| 内存重分配 | 每次修改都需要重分配 | 空间预分配 + 惰性释放 |
| 二进制安全 | 以 \0 结尾，不能存储二进制数据 | 以 len 标识长度，支持二进制数据 |
| 兼容性 | - | 部分兼容 C 字符串函数（末尾保留 \0） |

SDS 的空间预分配策略：修改后长度 < 1MB 时分配 2 倍空间；>= 1MB 时额外分配 1MB。惰性释放：缩短时不立即释放内存，记录剩余空间供后续复用（Redis 5.0+ 通过 `alloc - len` 计算，不再使用 `free` 字段）。

---

### Q19: Redis 如何做内存优化？

**A:**

1. **选择合适的数据结构编码**：小 Hash 用 ziplist，小整数 Set 用 intset，合理配置阈值
2. **使用 Hash 代替多个 Key**：将相关字段存储在一个 Hash 中，减少 Key 的数量和内存碎片
3. **Key 命名精简**：避免过长的 Key 名，使用缩写
4. **设置合理的过期时间**：及时清理不用的数据
5. **使用 Bitmap/HyperLogLog**：对于特定场景（签到、UV 统计），使用这些特殊类型大幅节省内存
6. **开启内存淘汰策略**：根据业务选择合适的淘汰策略（推荐 `allkeys-lfu`）
7. **大 Key 拆分**：避免单个 Key 占用过多内存
8. **数据压缩**：对大 Value 使用 GZIP/Snappy 压缩
9. **使用 32 位实例**：数据量不大时使用 32 位 Redis，节省指针内存

---

### Q20: Redis 事务的实现和局限性？

**A:** Redis 通过 `MULTI`、`EXEC`、`DISCARD`、`WATCH` 实现事务：

```bash
# 基本事务
MULTI
SET key1 value1
SET key2 value2
EXEC

# 乐观锁
WATCH balance
balance = GET balance
MULTI
SET balance new_balance
EXEC   # 如果 balance 被其他客户端修改，EXEC 返回 nil
```

**Redis 事务的特点**：
- **原子性**：事务中的命令要么全部执行，要么全部不执行（不会部分执行）
- **不支持回滚**：如果某个命令执行失败，后续命令仍然执行（Redis 追求简单和性能）
- **隔离性**：事务执行期间不会被其他客户端中断（单线程保证）
- **一致性**：事务执行前后数据一致

**局限性**：
- 不支持回滚（命令语法错误会忽略，运行时错误会继续执行后续命令）
- 不支持条件判断（需要用 `WATCH` + 重试实现乐观锁）
- 不适合复杂的事务场景（如涉及多个 Key 的条件更新）

对于复杂事务场景，推荐使用 **Lua 脚本**，Lua 脚本在 Redis 中是原子执行的。

---

> 本文档覆盖了 Redis 与缓存的核心面试知识点，建议结合实际项目经验和官方文档深入理解。

---

## 补充知识点

### 补充一、Redis BigKey 问题（⭐⭐中频）

#### 1. BigKey 的定义与危害

```
BigKey 的定义：
  - String 类型：value 大小超过 10KB
  - Hash/List/Set/ZSet 类型：元素数量超过 5000 个
  （具体阈值根据业务调整）

BigKey 的危害：
  1. 内存不均：集群模式下，某个节点因 BigKey 占用过多内存
  2. 阻塞：对 BigKey 的操作（如 DEL、HGETALL、LRANGE）耗时很长
     单线程模型下会阻塞其他请求
  3. 网络拥塞：读取 BigKey 产生大量网络传输
  4. 删除阻塞：DEL 大 Key 会阻塞 Redis 主线程
     Redis 4.0+ 提供 UNLINK 异步删除
```

#### 2. 发现方式

```bash
# redis-cli --bigkeys：扫描所有 Key，统计大 Key
redis-cli --bigkeys -i 0.1
# 输出示例：
# Biggest string found: 'user:1001' with 1048576 bytes
# Biggest list found: 'queue:orders' with 50000 elements

# redis-cli --memory：查看 Key 的内存使用
redis-cli --memory usage key_name

# SCAN 命令：渐进式遍历（不阻塞）
SCAN 0 MATCH user:* COUNT 100
# 每次返回少量 Key，用游标继续遍历

# RDB 工具分析：redis-rdb-tools
rdb -c memory /var/lib/redis/dump.rdb --bytes 10240 -f bigkeys.csv
# 导出大于 10KB 的 Key 到 CSV
```

#### 3. 删除策略

```bash
# UNLINK：异步删除（Redis 4.0+）
# 将 Key 放入异步删除队列，由后台线程执行实际删除
UNLINK big_key

# DEL：同步删除（阻塞）
# 对于大 Key，DEL 会阻塞主线程
# 不推荐用于生产环境的大 Key 删除

# 分批删除（Hash/List/Set/ZSet）
# Hash：使用 HSCAN + HDEL 分批删除
HSCAN key 0 MATCH field:* COUNT 100
HDEL key field1 field2 field3 ...

# List：使用 LTRIM 逐步截断
LTRIM key 0 -1001  # 保留最后1000个元素
LTRIM key 0 -1     # 清空

# Set：使用 SSCAN + SREM 分批删除
SSCAN key 0 MATCH * COUNT 100
SREM key member1 member2 ...

# ZSet：使用 ZREMRANGEBYRANK 分批删除
ZREMRANGEBYRANK key 0 999  # 删除排名前1000的元素
```

> ⭐ **面试问答：如何发现和处理 Redis BigKey？**
>
> 答：发现方式：(1) redis-cli --bigkeys 扫描大 Key；(2) redis-cli --memory usage 查看单个 Key 内存；(3) 使用 redis-rdb-tools 离线分析 RDB 文件。处理方式：(1) 避免产生 BigKey，拆分大 Key（如大 Hash 拆分为多个小 Hash）；(2) 删除时使用 UNLINK 异步删除而非 DEL；(3) 对于集合类型，使用 SCAN + 分批删除。

---

### 补充二、Redis HotKey 问题（⭐⭐中频）

#### 1. 热点 Key 的危害

```
HotKey 的定义：
  某个 Key 在短时间内被大量访问（如秒杀商品、热门新闻）

危害：
  1. Redis 单节点压力过大，QPS 超过单机瓶颈
  2. 缓存击穿：HotKey 过期瞬间，大量请求穿透到数据库
  3. 网络带宽瓶颈：大量请求集中在同一个 Key
  4. 本地缓存不一致：多节点缓存同一 HotKey 的不同版本
```

#### 2. 解决方案

```java
// 方案一：本地缓存 + Redis 二级缓存
// 使用 Caffeine 作为本地缓存（L1），Redis 作为分布式缓存（L2）

@Service
public class HotKeyService {
    // 本地缓存（容量小，过期时间短）
    private final Cache<String, Object> localCache = Caffeine.newBuilder()
        .maximumSize(10000)
        .expireAfterWrite(5, TimeUnit.SECONDS)  // 本地缓存5秒过期
        .build();

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public Object get(String key) {
        // 1. 先查本地缓存
        Object value = localCache.getIfPresent(key);
        if (value != null) {
            return value;
        }

        // 2. 再查 Redis
        value = redisTemplate.opsForValue().get(key);
        if (value != null) {
            localCache.put(key, value);  // 回填本地缓存
            return value;
        }

        // 3. 查数据库并回填
        value = queryFromDB(key);
        if (value != null) {
            redisTemplate.opsForValue().set(key, value, 30, TimeUnit.MINUTES);
            localCache.put(key, value);
        }
        return value;
    }
}

// 方案二：Key 打散（增加副本）
// 将 HotKey 复制多份，分散到不同节点

public String getHotKey(String baseKey) {
    // 将 key 打散为 key_0, key_1, ..., key_N
    int N = 10;  // 副本数
    int index = ThreadLocalRandom.current().nextInt(N);
    String shardKey = baseKey + "_" + index;

    String value = redisTemplate.opsForValue().get(shardKey);
    if (value == null) {
        value = queryFromDB(baseKey);
        // 写入所有副本
        for (int i = 0; i < N; i++) {
            redisTemplate.opsForValue().set(baseKey + "_" + i, value, 30, TimeUnit.MINUTES);
        }
    }
    return value;
}
```

> ⭐ **面试问答：如何解决 Redis 热点 Key 问题？**
>
> 答：(1) 本地缓存 + Redis 二级缓存：使用 Caffeine/Guava Cache 作为 L1 本地缓存，Redis 作为 L2 分布式缓存，大部分请求在本地缓存命中，减轻 Redis 压力。(2) Key 打散：将 HotKey 复制多份（如 key_0 到 key_9），客户端随机访问不同副本，分散到不同 Redis 节点。(3) 热点发现：使用京东开源的 hotkey 工具或自研热点探测模块，自动识别热点 Key 并做本地缓存。

---

### 补充三、Redis Stream 消息队列（⭐⭐中频）

#### 1. Consumer Group

```bash
# 创建 Stream 和 Consumer Group
XGROUP CREATE mystream mygroup $ MKSTREAM

# 生产者：发送消息
XADD mystream * user zhangsan action login
# 返回消息ID：1630000000000-0

# 消费者：组内消费
XREADGROUP GROUP mygroup consumer1 COUNT 1 BLOCK 5000 STREAMS mystream >
# > 表示只接收新消息（未消费过的）

# 消费者：确认消息
XACK mystream mygroup 1630000000000-0
```

#### 2. ACK 机制

```
Stream 消息消费流程：

  1. 消费者通过 XREADGROUP 读取消息
  2. 消息进入 PEL（Pending Entries List），状态为"待确认"
  3. 消费者处理完消息后，调用 XACK 确认
  4. 确认后消息从 PEL 中移除
  5. 如果消费者崩溃未确认，消息仍在 PEL 中
  6. 其他消费者可以通过 XPENDING 查看，XCLAIM 认领未确认的消息
```

#### 3. Pending Entries List

```bash
# 查看待确认消息
XPENDING mystream mygroup
# 输出：消息ID、消费者、空闲时间、投递次数

# 认领超时未确认的消息
XCLAIM mystream mygroup consumer2 60000 1630000000000-0
# 将空闲超过60秒的消息转移给 consumer2

# 查看某个消费者的待确认消息详情
XPENDING mystream mygroup - + 10 consumer1
```

#### 4. 与 List 做消息队列的对比

| 特性 | Stream | List (LPUSH/BRPOP) |
|------|--------|-------------------|
| 消费者组 | 支持（多消费者竞争消费） | 不支持 |
| 消息确认 | 支持（XACK） | 不支持（取出即消费） |
| 消息回溯 | 支持（消息持久化，可重复消费） | 不支持（取出后删除） |
| 阻塞读取 | 支持（XREADGROUP BLOCK） | 支持（BRPOP） |
| 消息堆积 | 支持（受 maxlen 限制） | 支持 |
| 消息ID | 自动生成（时间戳+序号） | 无 |
| 消息丢失风险 | 低（PEL + XCLAIM） | 高（消费者崩溃则丢失） |

> ⭐ **面试问答：Redis Stream 和 List 做消息队列的区别？**
>
> 答：Stream 是 Redis 5.0 引入的专门的消息队列类型，支持消费者组、消息确认（ACK）、消息回溯、Pending 列表等特性。List（LPUSH/BRPOP）只能实现简单的点对点队列，不支持消费者组，消息取出即消费，消费者崩溃会丢失消息。Stream 更适合生产环境，List 只适合简单的异步任务场景。

---

### 补充四、Redis Lua 脚本（⭐⭐中频）

#### 1. EVAL/EVALSHA

```bash
# EVAL：直接执行 Lua 脚本
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 mykey myvalue

# EVALSHA：通过 SHA1 校验和执行（节省网络带宽）
SCRIPT LOAD "return redis.call('SET', KEYS[1], ARGV[1])"
# 返回 SHA1：a9f...b2c

EVALSHA a9f...b2c 1 mykey myvalue
```

#### 2. 为什么需要 Lua 脚本（原子性）

```
Lua 脚本的原子性保证：
  - Redis 单线程执行 Lua 脚本
  - 脚本执行期间不会执行其他命令
  - 不存在竞态条件
  - 等价于"事务"但更灵活（支持条件判断、循环）

典型场景：
  1. 分布式锁的释放（判断 + 删除）
  2. 限流（读取计数 + 判断 + 递增）
  3. 库存扣减（读取库存 + 判断 + 扣减）
  4. 原子化的复合操作
```

#### 3. 分布式锁释放的 Lua 实现

```java
// 分布式锁释放的 Lua 脚本
// 确保只有锁的持有者才能释放锁（防止误删）

// Lua 脚本
String luaScript =
    "if redis.call('get', KEYS[1]) == ARGV[1] then " +  // 判断值是否匹配
    "   return redis.call('del', KEYS[1]) " +            // 匹配则删除
    "else " +
    "   return 0 " +                                       // 不匹配返回0
    "end";

// Java 代码
public boolean releaseLock(String lockKey, String requestId) {
    DefaultRedisScript<Long> script = new DefaultRedisScript<>();
    script.setScriptText(luaScript);
    script.setResultType(Long.class);

    Long result = redisTemplate.execute(script,
        Collections.singletonList(lockKey),  // KEYS[1]
        requestId                             // ARGV[1]
    );
    return result != null && result == 1L;
}

// 为什么不能用简单的 GET + DEL？
// 因为 GET 和 DEL 是两个操作，不是原子的
// 可能 GET 到值后，锁过期被其他线程获取，然后 DEL 删除了别人的锁
```

> ⭐ **面试问答：Redis Lua 脚本为什么能保证原子性？**
>
> 答：Redis 是单线程执行命令的，Lua 脚本作为一个整体提交给 Redis 执行，Redis 在执行脚本期间不会处理其他客户端的命令。整个脚本的执行是原子的，中间不会被中断。但注意 Lua 脚本不应包含耗时操作（如调用其他服务），否则会阻塞 Redis。

---

### 补充五、Redis 事务（⭐⭐中频）

#### 1. MULTI/EXEC/WATCH

```bash
# 基本事务
MULTI          # 开启事务
SET key1 value1
SET key2 value2
GET key1
EXEC           # 执行事务（队列中的命令依次执行）

# DISCARD：取消事务
MULTI
SET key1 value1
DISCARD        # 取消事务，清空命令队列

# WATCH：乐观锁
WATCH counter  # 监视 counter
val = GET counter
# ... 其他操作 ...
MULTI
SET counter $((val + 1))
EXEC           # 如果 counter 被其他客户端修改，EXEC 返回 nil
```

#### 2. 乐观锁

```
WATCH + MULTI 实现乐观锁：

  客户端A：                    客户端B：
  WATCH counter
  val = GET counter (10)
                              SET counter 20
                              (修改了 counter)
  MULTI
  SET counter 11
  EXEC → 返回 nil（事务被取消）
  （因为 counter 已被修改）

  客户端A 需要重试：
  WATCH counter
  val = GET counter (20)
  MULTI
  SET counter 21
  EXEC → 成功
```

#### 3. 与 MySQL 事务的区别

| 特性 | Redis 事务 | MySQL 事务 |
|------|-----------|-----------|
| 原子性 | 命令要么全执行，要么全不执行（语法错误时） | 严格的原子性 |
| 回滚 | 不支持回滚（命令错误会继续执行后续命令） | 支持 ROLLBACK |
| 隔离级别 | 无隔离级别（单线程串行执行） | READ_UNCOMMITTED/READ_COMMITTED/REPEATABLE_READ/SERIALIZABLE |
| 一致性 | 最终一致（WATCH + 重试实现乐观锁） | 强一致性 |
| 持久性 | 可配置（RDB/AOF/EVERYSEC） | 依赖 Redo Log |
| 死锁 | 不存在（单线程） | 可能发生 |
| 适用场景 | 简单的原子操作 | 复杂的业务事务 |

> ⭐ **面试问答：Redis 事务和 MySQL 事务有什么区别？**
>
> 答：Redis 事务（MULTI/EXEC）不提供回滚机制，命令语法错误时整个事务不执行，但运行时错误会跳过错误命令继续执行。MySQL 事务支持完整的 ACID 特性，包括回滚、隔离级别。Redis 事务没有隔离级别的概念，因为 Redis 是单线程串行执行的。Redis 通过 WATCH 实现乐观锁，MySQL 通过锁和 MVCC 实现并发控制。

---

### 补充六、Redis 集群数据迁移与扩容（⭐⭐中频）

#### 1. 节点扩容时数据迁移过程

```
Redis Cluster 扩容流程（3主 → 4主）：

  步骤1：添加新节点
    redis-cli --cluster add-node new-node:7000 existing-node:7001
    新节点加入集群，但还没有分配槽位

  步骤2：分配槽位
    redis-cli --cluster reshard existing-node:7001
    指定要迁移的槽数量（如 16384/4 = 4096 个槽）

  步骤3：数据迁移过程
    ┌──────────────────────────────────────────────────┐
    │ 源节点 (Node A)              目标节点 (Node D)    │
    │                                                    │
    │  槽 0-4095  ──迁移──→  槽 0-4095                  │
    │                                                    │
    │  迁移过程：                                        │
    │  1. 源节点标记槽为 MIGRATING（迁移中）              │
    │  2. 目标节点标记槽为 IMPORTING（导入中）             │
    │  3. 逐个 Key 迁移：                                │
    │     a. 源节点发送 MIGRATE 命令给目标节点            │
    │     b. 目标节点接收 Key 数据                        │
    │     c. 源节点删除 Key                              │
    │  4. 所有 Key 迁移完成后，更新槽位分配表              │
    └──────────────────────────────────────────────────┘

  步骤4：客户端感知
    集群通过 Gossip 协议广播新的槽位分配
    客户端收到 MOVED 重定向后更新本地槽位缓存
```

#### 2. importing/migrating 状态

```
迁移过程中的 Key 访问处理：

  源节点（MIGRATING 状态）：
    - 如果 Key 仍在源节点 → 正常处理
    - 如果 Key 已迁移到目标节点 → 返回 ASK 重定向
      （不是 MOVED！ASK 是临时的，MOVED 是永久的）

  目标节点（IMPORTING 状态）：
    - 正常的 ASKING 命令后的请求 → 正常处理
    - 没有 ASKING 标记的请求 → 返回 MOVED 重定向

  客户端处理流程：
    1. 客户端向源节点请求 Key
    2. 源节点发现 Key 已迁移，返回 ASK 重定向
    3. 客户端向目标节点发送 ASKING 命令
    4. 客户端再向目标节点发送 GET key
    5. 目标节点正常返回数据

  ASK vs MOVED：
    - MOVED：永久重定向，客户端更新本地缓存
    - ASK：临时重定向，客户端不更新缓存（下次仍先访问源节点）
```

> ⭐ **面试问答：Redis Cluster 扩容时数据怎么迁移？**
>
> 答：扩容时先添加新节点，然后通过 reshard 命令将部分槽位从旧节点迁移到新节点。迁移过程中，源节点将槽标记为 MIGRATING，目标节点标记为 IMPORTING。Key 逐个通过 MIGRATE 命令迁移。迁移期间，如果客户端访问已迁移的 Key，源节点返回 ASK 重定向，客户端先发送 ASKING 命令再访问目标节点。所有 Key 迁移完成后，通过 Gossip 协议广播新的槽位分配。
