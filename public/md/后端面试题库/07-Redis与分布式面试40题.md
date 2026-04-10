# Redis 与分布式面试 40 题

> 基于 Redis 与缓存、分布式与微服务知识体系整理，涵盖 Redis 数据结构、缓存问题、持久化、集群、分布式锁、分布式理论、消息队列等核心考点。

---

## 目录

- [一、Redis 数据结构（8题）](#一redis-数据结构8题)
- [二、缓存问题（6题）](#二缓存问题6题)
- [三、持久化（4题）](#三持久化4题)
- [四、集群（6题）](#四集群6题)
- [五、分布式锁（4题）](#五分布式锁4题)
- [六、分布式理论（6题）](#六分布式理论6题)
- [七、消息队列（4题）](#七消息队列4题)
- [八、其他（2题）](#八其他2题)
- [高频考点速查表](#高频考点速查表)

---

## 一、Redis 数据结构（8题）

### Q1: Redis 的五种基本数据类型及应用场景？

**难度**: ⭐⭐

**答案**:

| 类型 | 底层结构 | 应用场景 |
|------|---------|---------|
| String | SDS（int/embstr/raw） | 缓存、计数器、分布式锁、Session |
| List | quicklist（双向链表+ziplist） | 消息队列、最新列表、栈/队列 |
| Hash | ziplist/hashtable | 对象存储、购物车 |
| Set | intset/hashtable | 标签、共同好友、去重、抽奖 |
| ZSet | ziplist/skiplist+dict | 排行榜、延迟队列、滑动窗口限流 |

---

### Q2: Redis 的 SDS 和 C 字符串的区别？

**难度**: ⭐⭐⭐

**答案**: SDS（Simple Dynamic String）是 Redis 自己实现的字符串结构，相比 C 字符串有以下优势：

| 对比项 | C 字符串 | SDS |
|--------|---------|-----|
| 获取长度 | O(n)（遍历） | O(1)（记录 len） |
| 缓冲区溢出 | 可能 | 自动扩容 |
| 修改次数 | 每次修改需要重新分配 | 空间预分配 + 惰性释放 |
| 二进制安全 | 不安全（以 \0 结尾） | 安全（记录 len） |

```c
// Redis 3.2+ 版本的 SDS 结构体（__attribute__ 根据字符串长度选择不同类型）
struct __attribute__ ((__packed__)) sdshdr5 {
    unsigned char flags; // 低3位存储类型，高5位存储长度
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr8 {
    uint8_t len;     // 已使用长度
    uint8_t alloc;   // 已分配长度（替代旧版的 free 字段）
    unsigned char flags;
    char buf[];
};
struct __attribute__ ((__packed__)) sdshdr16 {
    uint16_t len;    // 已使用长度
    uint16_t alloc;  // 已分配长度
    unsigned char flags;
    char buf[];
};
// 还有 sdshdr32、sdshdr64，根据字符串长度自动选择
// 注意：Redis 3.2 之前使用旧版结构体，包含 int len 和 int free 字段
```

---

### Q3: Redis 跳表（SkipList）的原理？

**难度**: ⭐⭐⭐

**答案**: 跳表是在有序链表基础上增加多级索引，通过二分查找加速查询，时间复杂度 O(log n)。

**解析**:
```
Level 3:  [1] --------------------------------------------------------> [9]
Level 2:  [1] ------------------------> [5] -------------------------> [9]
Level 1:  [1] --------> [3] --------> [5] --------> [7] ---------> [9]
Level 0:  [1] -> [2] -> [3] -> [4] -> [5] -> [6] -> [7] -> [8] -> [9]
```

- ZSet 的底层使用跳表 + 字典双重结构
- 跳表支持范围查询（ZRANGEBYSCORE），红黑树也可以但实现更复杂
- Redis 选择跳表而非红黑树的原因：实现简单、范围查询方便、内存可调

---

### Q4: Redis 的 quicklist 是什么？

**难度**: ⭐⭐

**答案**: quicklist 是 Redis 3.2 引入的 List 底层实现，是**双向链表 + ziplist** 的混合结构。每个链表节点存储一个 ziplist，兼顾内存效率和操作性能。

**解析**:
- 纯双向链表：每个节点有 prev/next 指针，内存开销大
- 纯 ziplist：内存紧凑但修改时需要重新分配，性能差
- quicklist：分段存储，每段用 ziplist，段之间用双向链表连接

```
quicklist:
[ziplist1] <-> [ziplist2] <-> [ziplist3] <-> [ziplist4]
```

---

### Q5: Redis 的字典（dict）是如何实现的？

**难度**: ⭐⭐

**答案**: Redis 的字典使用**哈希表 + 链地址法**处理冲突，支持渐进式 rehash。

**解析**:
```c
typedef struct dict {
    dictht ht[2];  // 两个哈希表，用于渐进式 rehash
    int rehashidx; // rehash 进度，-1 表示未在 rehash
} dict;
```

- 渐进式 rehash：将 ht[0] 的数据逐步迁移到 ht[1]，期间同时服务读写
- rehash 触发条件：负载因子 > 1 或 < 0.1
- rehash 期间：查找先查 ht[0]，再查 ht[1]；新增只写入 ht[1]

---

### Q6: Redis 的 ZSet 为什么同时使用跳表和字典？

**难度**: ⭐⭐⭐

**答案**: 跳表支持范围查询（ZRANGEBYSCORE），字典支持 O(1) 的成员分数查找（ZSCORE）。

**解析**:
- **字典**：`member -> score` 映射，O(1) 查找分数
- **跳表**：按分数排序，支持范围查询、排名（ZRANK）
- 两者共享 member 和 score 数据，不会造成数据冗余

---

### Q7: Redis 的 Bitmap 和 HyperLogLog 的使用场景？

**难度**: ⭐⭐

**答案**:
- **Bitmap**：基于 String 的位操作，适合签到、在线状态统计
  - `SETBIT key offset value`、`GETBIT key offset`、`BITCOUNT key`
  - 1 亿用户的签到数据只需约 12MB

- **HyperLogLog**：基于概率算法的基数统计，固定 12KB 内存统计 2^64 个元素
  - `PFADD key element`、`PFCOUNT key`
  - 适合 UV 统计、独立搜索词统计
  - 标准误差约 0.81%

---

### Q8: Redis 为什么这么快？

**难度**: ⭐⭐

**答案**:
1. **纯内存操作**：数据存储在内存中，读写速度极快
2. **单线程模型**：避免上下文切换和锁竞争（Redis 6.0 引入多线程 IO，但命令执行仍是单线程）
3. **IO 多路复用**：epoll 模型，单线程处理大量并发连接
4. **高效的数据结构**：SDS、跳表、quicklist、ziplist 等针对特定场景优化
5. **协议简单**：RESP 协议解析开销小

---

## 二、缓存问题（6题）

### Q9: 什么是缓存穿透？如何解决？

**难度**: ⭐⭐

**答案**: 缓存穿透是指查询一个**不存在的数据**，缓存中没有，每次请求都打到数据库。

**解析**:
解决方案：
1. **布隆过滤器**：在缓存前加一层布隆过滤器，不存在的数据直接返回
2. **缓存空值**：查询不到的数据也缓存一个空值，设置较短过期时间（如 60 秒）
3. **参数校验**：在入口层对请求参数做合法性校验

```java
// 布隆过滤器方案
public Object getData(String key) {
    if (!bloomFilter.mightContain(key)) {
        return null; // 一定不存在
    }
    String cached = redis.get(key);
    if (cached != null) return cached;
    Object data = db.query(key);
    if (data != null) {
        redis.set(key, data, 30, TimeUnit.MINUTES);
    } else {
        redis.set(key, "", 60, TimeUnit.SECONDS); // 缓存空值
    }
    return data;
}
```

---

### Q10: 什么是缓存击穿？如何解决？

**难度**: ⭐⭐

**答案**: 缓存击穿是指某个**热点 Key 过期瞬间**，大量请求同时打到数据库。

**解析**:
解决方案：
1. **互斥锁**：只允许一个线程查数据库并重建缓存
2. **永不过期 + 异步更新**：逻辑上不设置过期，后台线程定时刷新
3. **热点数据预加载**：在过期前主动刷新

```java
// 互斥锁方案
public Object getHotData(String key) {
    String cached = redis.get(key);
    if (cached != null) return cached;

    String lockKey = "lock:" + key;
    if (redis.set(lockKey, "1", 10, TimeUnit.SECONDS, NX)) {
        try {
            Object data = db.query(key);
            redis.set(key, data, 30, TimeUnit.MINUTES);
            return data;
        } finally {
            redis.delete(lockKey);
        }
    } else {
        Thread.sleep(100);
        return getHotData(key); // 重试
    }
}
```

---

### Q11: 什么是缓存雪崩？如何解决？

**难度**: ⭐⭐

**答案**: 缓存雪崩是指**大量 Key 在同一时间过期**，或 **Redis 宕机**，大量请求同时打到数据库。

**解析**:
解决方案：
1. **随机过期时间**：给缓存过期时间加随机值（如 `3600 + random(300)` 秒）
2. **多级缓存**：本地缓存（Caffeine）+ Redis 缓存 + 数据库
3. **Redis 高可用**：主从复制 + Sentinel + Cluster
4. **熔断降级**：数据库压力过大时触发降级，返回默认值
5. **缓存预热**：系统启动时加载热点数据到缓存

---

### Q12: 如何保证缓存和数据库的一致性？

**难度**: ⭐⭐⭐

**答案**: 常见策略：

| 策略 | 说明 | 一致性 |
|------|------|--------|
| Cache Aside（旁路缓存） | 读：先缓存后DB；写：先更新DB后删缓存 | 最终一致性 |
| Write Through | 写入时同时更新缓存和DB | 强一致性 |
| Write Behind | 先更新缓存，异步批量更新DB | 最终一致性 |

**解析**:
```java
// Cache Aside 模式（推荐）
// 读
public User getUser(Long id) {
    String cached = redis.get("user:" + id);
    if (cached != null) return JSON.parseObject(cached, User.class);
    User user = db.selectById(id);
    if (user != null) redis.set("user:" + id, JSON.toJSONString(user));
    return user;
}

// 写（先更新DB，后删缓存）
public void updateUser(User user) {
    db.update(user);
    redis.delete("user:" + user.getId()); // 删除而非更新
}
```

- 为什么删缓存而不是更新缓存？避免并发写导致数据不一致
- 延迟双删：先删缓存 -> 更新DB -> 延迟再删缓存（防止读线程读到旧数据）

---

### Q13: 缓存预热和缓存降级？

**难度**: ⭐⭐

**答案**:
- **缓存预热**：系统启动或定时任务提前加载热点数据到缓存，避免冷启动时大量请求打到数据库
- **缓存降级**：当缓存服务不可用或数据库压力过大时，直接返回默认值或静态数据

```java
// 缓存降级示例
@HystrixCommand(fallbackMethod = "getDefaultUser")
public User getUser(Long id) {
    return userService.getById(id);
}

public User getDefaultUser(Long id) {
    return new User(id, "默认用户"); // 降级数据
}
```

---

### Q14: 什么是缓存污染？

**难度**: ⭐⭐

**答案**: 缓存污染是指大量低频访问的数据被加载到缓存中，占用了缓存空间，导致高频数据被淘汰。

**解析**:
- 原因：全量缓存、不合理的缓存策略
- 解决方案：
  1. 设置合理的过期时间
  2. 使用 LRU 淘汰策略（Redis 默认）
  3. 只缓存热点数据（通过统计访问频率筛选）

---

## 三、持久化（4题）

### Q15: RDB 持久化的原理？

**难度**: ⭐⭐

**答案**: RDB（Redis Database）是 Redis 的快照持久化方式，将某一时刻的所有数据以二进制形式保存到磁盘。

**解析**:
- 触发方式：
  - `save`：阻塞式，不推荐
  - `bgsave`：fork 子进程进行 RDB，不阻塞主进程
  - 配置自动触发：`save 900 1`（900秒内至少1次修改则触发）

- 优点：文件紧凑、恢复速度快
- 缺点：不是实时持久化，可能丢失最后一次快照后的数据

```bash
# RDB 配置
save 900 1
save 300 10
save 60 10000
dbfilename dump.rdb
dir /var/lib/redis
```

---

### Q16: AOF 持久化的原理？

**难度**: ⭐⭐

**答案**: AOF（Append Only File）以日志形式记录每个写操作，Redis 重启时重放 AOF 文件恢复数据。

**解析**:
- 三种同步策略：
  - `always`：每次写都刷盘（最安全，性能最差）
  - `everysec`：每秒刷盘（推荐，最多丢失 1 秒数据）
  - `no`：由操作系统决定刷盘时机

- AOF 重写（AOF Rewrite）：压缩 AOF 文件，去除冗余命令
  - `bgrewriteaof`：fork 子进程进行重写
  - 触发条件：AOF 文件大小超过 `auto-aof-rewrite-min-size` 且增长率超过 `auto-aof-rewrite-percentage`

---

### Q17: RDB 和 AOF 的区别？如何选择？

**难度**: ⭐⭐

**答案**:

| 对比项 | RDB | AOF |
|--------|-----|-----|
| 持久化方式 | 快照 | 日志 |
| 数据安全性 | 可能丢失较多数据 | 最多丢失 1 秒 |
| 文件大小 | 小（二进制压缩） | 大（需要重写优化） |
| 恢复速度 | 快 | 慢（重放日志） |
| 性能影响 | fork 时有瞬时开销 | always 模式影响大 |

**解析**: Redis 4.0+ 推荐使用**混合持久化**（RDB + AOF），结合两者优势。

```bash
# 开启混合持久化
aof-use-rdb-preamble yes
```

---

### Q18: Redis 4.0 混合持久化的原理？

**难度**: ⭐⭐⭐

**答案**: 混合持久化结合了 RDB 和 AOF：AOF 文件由 RDB 头部 + AOF 尾部组成。

**解析**:
- 重写时先写入 RDB 格式的快照（紧凑、恢复快）
- 然后追加 AOF 格式的增量日志（数据安全）
- 恢复时先加载 RDB 部分，再重放 AOF 部分
- 兼顾了 RDB 的恢复速度和 AOF 的数据安全性

---

## 四、集群（6题）

### Q19: Redis 主从复制的原理？

**难度**: ⭐⭐

**答案**: Redis 主从复制是异步复制，Slave 从 Master 同步数据。

**解析**:
```
Master                    Slave
  |                         |
  |-- SYNC/PSYNC ---------->| 全量同步/部分同步
  |<--- RDB file -----------|
  |<--- Buffer ------------|
  |                         |-- 加载 RDB
  |-- 增量数据 ------------>| 持续同步
```

- **全量同步**：Slave 首次连接时，Master 执行 BGSAVE 发送 RDB + Buffer
- **部分同步**：断线重连时，通过 replication backlog 增量同步
- `repl-backlog-size`：复制积压缓冲区大小，默认 1MB

---

### Q20: Redis Sentinel 的作用和工作原理？

**难度**: ⭐⭐

**答案**: Sentinel（哨兵）是 Redis 的高可用解决方案，负责监控、通知、自动故障转移。

**解析**:
- 三个核心功能：
  1. **监控**：持续检测 Master 和 Slave 是否正常
  2. **通知**：故障时通知管理员
  3. **自动故障转移**：Master 故障时自动将 Slave 提升为 Master

- 故障转移流程：
  1. Sentinel 检测到 Master 下线（主观下线 -> 客观下线）
  2. Sentinel 之间通过 Raft 协议选举 Leader
  3. Leader 选择一个 Slave 提升为新 Master
  4. 通知其他 Slave 复制新 Master
  5. 更新客户端连接

---

### Q21: Redis Cluster 的工作原理？

**难度**: ⭐⭐⭐

**答案**: Redis Cluster 将数据分片存储在多个节点上，每个节点负责一部分槽位（共 16384 个槽）。

**解析**:
```
Node A: 槽 0-5460
Node B: 槽 5461-10922
Node C: 槽 10923-16383
```

- 客户端向任意节点发送命令，如果 key 不在该节点的槽中，返回 `MOVED` 重定向
- 节点之间通过 Gossip 协议通信
- 支持 Master-Slave 高可用：每个 Master 至少有一个 Slave

---

### Q22: Redis Cluster 的数据迁移？

**难度**: ⭐⭐⭐

**答案**: Redis Cluster 支持在线数据迁移（resharding），不影响服务。

**解析**:
- 迁移过程：
  1. 源节点标记迁移槽为 `IMPORTING`
  2. 目标节点标记迁移槽为 `MIGRATING`
  3. 逐步将 key 从源节点迁移到目标节点
  4. 迁移完成后更新槽位映射

- 迁移命令：`CLUSTER SETSLOT <slot> IMPORTING/MIGRATING <node_id>`
- 工具：`redis-cli --cluster reshard`

---

### Q23: Redis Cluster 的故障检测和转移？

**难度**: ⭐⭐⭐

**答案**:
- **故障检测**：节点之间通过 PING/PONG 互相检测，超过 `cluster-node-timeout` 标记为 PFAIL（疑似故障），超过半数 Master 标记为 FAIL（确认故障）
- **故障转移**：从故障 Master 的 Slave 中选举新的 Master（Raft 协议）

---

### Q24: Redis Cluster 和 Sentinel 的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | Sentinel | Cluster |
|--------|----------|---------|
| 数据分片 | 不支持 | 支持（16384 槽） |
| 容量 | 受单机内存限制 | 水平扩展 |
| 高可用 | 主从自动切换 | 主从自动切换 |
| 客户端 | 连接任意节点 | 需要智能客户端 |
| 适用场景 | 中小规模 | 大规模 |

---

## 五、分布式锁（4题）

### Q25: Redis 分布式锁如何实现？

**难度**: ⭐⭐

**答案**: 使用 `SET key value NX EX seconds` 命令实现。

**解析**:
```java
// 加锁
public boolean tryLock(String lockKey, String requestId, int expireSeconds) {
    return redis.set(lockKey, requestId, expireSeconds, TimeUnit.SECONDS, NX);
}

// 释放锁（Lua 脚本保证原子性）
public boolean releaseLock(String lockKey, String requestId) {
    String script = "if redis.call('get', KEYS[1]) == ARGV[1] " +
                    "then return redis.call('del', KEYS[1]) " +
                    "else return 0 end";
    return redis.eval(script, 1, lockKey, requestId) == 1;
}
```

- `NX`：不存在才设置（保证互斥）
- `EX`：设置过期时间（防止死锁）
- 释放锁必须用 Lua 脚本（判断 value 是否是自己设置的，防止误删）

---

### Q26: Redisson 的看门狗机制？

**难度**: ⭐⭐⭐

**答案**: Redisson 的看门狗（Watchdog）机制用于自动续期分布式锁，防止业务未执行完锁就过期。

**解析**:
- 加锁时不指定过期时间（leaseTime = -1），看门狗默认每 10 秒检查一次
- 如果锁即将过期（剩余时间 < 10 秒），自动续期到 30 秒
- 客户端宕机后，看门狗停止续期，锁自动过期释放

```java
RLock lock = redisson.getLock("myLock");
lock.lock(); // 不指定超时时间，启动看门狗
try {
    // 业务逻辑
} finally {
    lock.unlock();
}
```

---

### Q27: Redis 分布式锁和 ZooKeeper 分布式锁的对比？

**难度**: ⭐⭐⭐

**答案**:

| 对比项 | Redis | ZooKeeper |
|--------|-------|-----------|
| 实现方式 | SET NX + Lua | 临时顺序节点 |
| 性能 | 高 | 较低 |
| 可靠性 | 主从切换可能丢锁 | 强一致性 |
| 锁释放 | 过期自动释放 | Session 过期自动释放 |
| 公平锁 | 不支持 | 支持（顺序节点） |
| 适用场景 | 高性能、允许少量不一致 | 强一致性要求 |

**解析**: Redis 锁在主从切换时可能丢失（Master 加锁后未同步到 Slave 就宕机），ZooKeeper 不会。

---

### Q28: 分布式锁需要注意哪些问题？

**难度**: ⭐⭐

**答案**:
1. **死锁**：必须设置过期时间
2. **锁续期**：看门狗机制
3. **误删锁**：释放时检查 value（Lua 脚本）
4. **可重入**：Redisson 使用 Hash 结构记录重入次数
5. **集群下的安全性**：RedLock 算法（向多个独立 Redis 实例加锁）

---

## 六、分布式理论（6题）

### Q29: CAP 定理？

**难度**: ⭐⭐

**答案**: CAP 定理指出分布式系统最多只能同时满足三个特性中的两个：一致性（C）、可用性（A）、分区容错性（P）。由于网络分区（P）不可避免，系统只能在 CP 和 AP 之间选择。

**解析**:
- **CP 系统**：ZooKeeper、HBase、Redis Cluster（牺牲可用性保证一致性）
- **AP 系统**：Eureka、Cassandra、DynamoDB（牺牲一致性保证可用性）
- 大多数业务系统选择 AP + 最终一致性

---

### Q30: BASE 理论？

**难度**: ⭐⭐

**答案**: BASE 是对 CAP 中 AP 方案的延伸：**B**asically Available（基本可用）、**S**oft State（软状态）、**E**ventually Consistent（最终一致性）。

**解析**:
- 基本可用：允许损失部分可用性（如响应时间增加、降级服务）
- 软状态：允许系统存在中间状态
- 最终一致性：数据最终达到一致状态

---

### Q31: 分布式事务的解决方案？

**难度**: ⭐⭐⭐

**答案**:

| 方案 | 原理 | 一致性 | 性能 | 复杂度 |
|------|------|--------|------|--------|
| 2PC | 协调者 + 两阶段提交 | 强一致 | 低（同步阻塞） | 中 |
| TCC | Try-Confirm-Cancel | 最终一致 | 中 | 高（需编写补偿） |
| Saga | 长事务拆分 + 补偿 | 最终一致 | 高 | 中 |
| Seata AT | 自动补偿（拦截 SQL） | 最终一致 | 高 | 低（推荐） |
| 本地消息表 | 可靠消息 + 最终一致 | 最终一致 | 高 | 中 |

---

### Q32: Seata 的 AT 模式原理？

**难度**: ⭐⭐⭐

**答案**: Seata AT 模式是一种无侵入的分布式事务方案，通过拦截 SQL 自动生成回滚日志（undo log）。

**解析**:
```
一阶段：执行业务 SQL + 记录 undo log（数据修改前的旧值）
二阶段-提交：异步清理 undo log
二阶段-回滚：根据 undo log 还原数据
```

- 全局事务 ID（XID）贯穿整个调用链
- TC（事务协调器）、TM（事务管理器）、RM（资源管理器）三角色

---

### Q33: 一致性哈希是什么？

**难度**: ⭐⭐

**答案**: 一致性哈希将整个哈希值空间组织成一个虚拟的圆环（0 ~ 2^32-1），将节点和数据都映射到环上，数据顺时针找最近的节点。

**解析**:
- 优点：节点增减时只影响相邻节点的数据，最小化数据迁移
- 虚拟节点：为每个物理节点创建多个虚拟节点，解决数据倾斜问题

```
       Node A
      /      \
Node C ---- Node B
      \      /
       Node D

数据 key1 -> 顺时针 -> Node A
数据 key2 -> 顺时针 -> Node B
```

---

### Q34: 什么是幂等性？如何实现？

**难度**: ⭐⭐

**答案**: 幂等性是指同一个操作执行一次和多次的效果相同。

**解析**:
实现方式：
1. **唯一索引**：数据库唯一约束防止重复插入
2. **Token 机制**：请求前获取 token，提交时验证并删除 token
3. **Redis SETNX**：`SETNX request_id 1 EX 60`
4. **乐观锁**：版本号机制
5. **状态机**：订单状态只能单向流转

```java
// Token 幂等方案
public Response createOrder(OrderRequest request) {
    String token = request.getToken();
    if (!redis.delete(token)) {
        return Response.fail("重复请求");
    }
    // 创建订单
    return Response.success(order);
}
```

---

## 七、消息队列（4题）

### Q35: RabbitMQ 和 Kafka 的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | RabbitMQ | Kafka |
|--------|----------|-------|
| 吞吐量 | 万级 | 百万级 |
| 延迟 | 微秒级 | 毫秒级 |
| 消息保留 | 消费后删除 | 持久化保留（可回溯） |
| 消费模式 | 推模式 | 拉模式 |
| 适用场景 | 业务消息、RPC | 日志、大数据、流处理 |
| 消息可靠性 | 高（ACK 机制） | 高（副本机制） |

---

### Q36: 如何保证消息不丢失？

**难度**: ⭐⭐

**答案**:
三个环节防止消息丢失：
1. **生产者**：确认机制（RabbitMQ 的 publisher confirm，Kafka 的 acks=all）
2. **消息队列**：持久化（RabbitMQ 的持久化队列和消息，Kafka 的副本数 > 1）
3. **消费者**：手动 ACK（消费成功后再确认）

---

### Q37: 如何保证消息的幂等性？

**难度**: ⭐⭐

**答案**:
1. **唯一消息 ID**：每条消息携带唯一 ID，消费前检查是否已处理
2. **Redis SETNX**：`SETNX msg_id 1`
3. **数据库唯一索引**：利用业务唯一约束
4. **状态标记**：消息处理成功后更新状态

---

### Q38: 如何处理消息积压？

**难度**: ⭐⭐

**答案**:
1. **快速扩容消费者**：增加消费者实例
2. **临时队列**：将积压消息转移到临时队列，快速消费
3. **消息丢弃**：非关键消息可以丢弃部分
4. **排查原因**：消费者处理慢、外部服务超时、数据库瓶颈

---

## 八、其他（2题）

### Q39: 什么是 BigKey？如何处理？

**难度**: ⭐⭐

**答案**: BigKey 是指 Value 过大的 Key（如一个 String 超过 10KB，Hash 超过 5000 个字段）。

**解析**:
- 危害：
  1. 阻塞其他请求（Redis 单线程）
  2. 网络传输慢
  3. 删除时导致长时间阻塞（DEL 大 Key）

- 处理方案：
  1. 拆分大 Key（Hash 拆分为多个小 Hash）
  2. 异步删除（`UNLINK` 命令，Redis 4.0+）
  3. 压缩 Value（使用压缩算法）

```bash
# 查找 BigKey
redis-cli --bigkeys

# 异步删除
UNLINK big_key
```

---

### Q40: 什么是 HotKey？如何处理？

**难度**: ⭐⭐

**答案**: HotKey 是指被高频访问的 Key，可能导致单个 Redis 节点压力过大。

**解析**:
- 处理方案：
  1. **本地缓存**：使用 Caffeine/Guava 缓存热点数据
  2. **读写分离**：增加 Redis 从节点分担读压力
  3. **Key 分散**：将热点 Key 分散到多个 Key（如 `key_0`, `key_1`, ..., `key_N`）

```java
// Key 分散方案
public String getHotData(String key) {
    int shard = ThreadLocalRandom.current().nextInt(10);
    return redis.get(key + "_" + shard);
}
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| 五大数据类型 | 极高 | String/List/Hash/Set/ZSet 及应用场景 |
| 缓存穿透/击穿/雪崩 | 极高 | 布隆过滤器、互斥锁、随机过期时间 |
| 分布式锁 | 极高 | SET NX EX、Lua 释放、Redisson 看门狗 |
| 持久化 | 高 | RDB 快照、AOF 日志、混合持久化 |
| 主从/哨兵/集群 | 高 | 全量同步、Sentinel 故障转移、16384 槽 |
| CAP/BASE | 高 | CP vs AP、最终一致性 |
| 分布式事务 | 高 | 2PC/TCC/Saga/Seata AT |
| SDS/跳表/quicklist | 中 | O(1) 长度、O(log n) 查询、分段 ziplist |
| 消息可靠性 | 中 | 生产者确认、持久化、手动 ACK |
| BigKey/HotKey | 中 | 拆分、UNLINK、本地缓存、Key 分散 |
