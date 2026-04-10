# Redis 数据库知识点总结

> 适合5年经验后端工程师的深度学习文档

---

## 目录

1. [数据结构与命令](#1-数据结构与命令)
2. [底层数据结构](#2-底层数据结构)
3. [持久化机制](#3-持久化机制)
4. [内存管理](#4-内存管理)
5. [缓存设计](#5-缓存设计)
6. [集群方案](#6-集群方案)
7. [事务与Lua脚本](#7-事务与lua脚本)
8. [高可用与架构](#8-高可用与架构)
9. [性能优化](#9-性能优化)
10. [应用场景](#10-应用场景)
11. [监控运维](#11-监控运维)
12. [Redis 7.x 新特性](#12-redis-7x-新特性)

---

## 1. 数据结构与命令

### 1.1 String（字符串）

**核心命令与示例：**
```bash
SET key value [NX|XX] [EX seconds] [PX milliseconds]  # NX=不存在才设置,XX=存在才设置
GET key
SETNX key value          # 分布式锁基础（不支持过期时间，需配合EXPIRE）
SETEX key seconds value  # 设置值+过期时间（原子操作）
PSETEX key ms value      # 毫秒级过期
GETSET key new_value     # 获取旧值并设置新值（原子操作，Redis 6.2+ 已废弃，推荐使用 SET key new_value GET）
MGET key1 key2 key3      # 批量读取，减少网络往返
MSET key1 v1 key2 v2     # 批量写入
INCR / DECR              # 原子自增/自减（不存在则从0开始）
INCRBY key n / DECRBY key n  # 指定步长
```

**编码选择：** `int`（数值<2^63-1）、`embstr`（Redis 6.x 及以下 ≤44字节，Redis 7.0+ ≤64字节，连续内存）、`raw`（超过阈值，分离内存）

**实战要点：**
- 分布式锁用 `SET key uuid NX EX 30`，释放时用 Lua 校验值再 DEL，避免误删
- `GETSET` 在 key 不存在时返回 nil，不能用于判断 key 是否存在
- 大 JSON 对象建议用 Hash 存储以便部分更新，避免整体序列化/反序列化开销

**面试题：** String 最大 512MB；`SETNX` 和 `SET key value NX` 功能相同但后者更灵活；`INCR` 对不存在的 key 返回 1 而非报错

---

### 1.2 Hash（哈希）

**核心命令与示例：**
```bash
HSET key field value / HGET key field
HMSET key f1 v1 f2 v2 / HMGET key f1 f2 f3
HGETALL key          # 返回所有field-value（大Hash时阻塞！）
HDEL key f1 f2 / HKEYS key / HVALS key / HLEN key / HEXISTS key field
HINCRBY key field n  # field级原子自增
HSCAN key 0 MATCH pattern COUNT 100  # 渐进式遍历
```

**编码选择：** `ziplist`（field<512 且 value<64字节）自动转为 `hashtable`，转换不可逆

**实战要点：**
- `HGETALL` 在大 Hash 时阻塞，生产环境用 `HSCAN` 分批处理
- Hash vs String 存对象：Hash 支持部分更新和 `HINCRBY`，但 field 过多时性能下降
- 大 Hash 拆分方案：按业务维度分片 `HSET user:1001:shard0 ...`

**面试题：** ziplist 转 hashtable 阈值是 field>512 或 value>64字节；`HINCRBY` 对不存在的 field 从 0 开始

---

### 1.3 List（列表）

**核心命令与示例：**
```bash
LPUSH / RPUSH / LPOP / RPOP / LRANGE 0 -1 / LLEN / LINDEX key idx
LINSERT key BEFORE|AFTER pivot value  # O(N)操作
LSET key idx value / LREM key count value / LTRIM key start stop
BLPOP key1 key2 timeout / BRPOP key1 key2 timeout  # 阻塞弹出
BRPOPLPUSH src dst timeout  # 可靠队列：弹出并备份
```

**编码选择：** Redis 3.2+ 默认 `quicklist`（ziplist 双向链表），两端操作 O(1)

**实战要点：**
- `LINDEX` 时间复杂度 O(N)，大列表禁用
- 消息队列推荐 `BRPOPLPUSH` 实现可靠消费：弹出 -> 备份 -> 处理 -> 删除备份
- `BLPOP` 多 key 时按顺序轮询，可能导致负载不均

**面试题：** List 有序可重复 vs Set 无序不重复；`LTRIM` 不释放内存只截断引用

---

### 1.4 Set（集合）

**核心命令与示例：**
```bash
SADD / SREM / SMEMBERS / SISMEMBER / SCARD / SPOP / SRANDMEMBER
SUNION / SINTER / SDIFF  # 并集/交集/差集
SUNIONSTORE / SINTERSTORE / SDIFFSTORE dest key1 key2  # 运算结果存储
SSCAN key 0 MATCH pattern COUNT 100
```

**编码选择：** `intset`（纯整数且<512个）自动转为 `hashtable`

**实战要点：**
- 共同好友：`SINTER user:1001:following user:1002:following`
- 标签系统：`SADD tag:redis:articles 1001 1002`，多标签 AND 查询用 `SINTER`
- `SMEMBERS` 大 Set 时阻塞，用 `SSCAN`；`SPOP` 移除元素，随机访问用 `SRANDMEMBER`

**面试题：** 集合运算复杂度取决于最小集合；intset 升级不可逆

---

### 1.5 ZSet（有序集合）

**核心命令与示例：**
```bash
ZADD key score member / ZREM key member
ZRANGE / ZREVRANGE key start stop WITHSCORES
ZRANGEBYSCORE / ZREVRANGEBYSCORE key min max WITHSCORES LIMIT offset count
ZRANK / ZREVRANK key member  # 排名（从0开始）
ZCARD / ZCOUNT key min max / ZINCRBY key n member
ZUNIONSTORE / ZINTERSTORE dest numkeys k1 k2 WEIGHTS w1 w2 AGGREGATE SUM|MIN|MAX
ZSCAN key 0 MATCH pattern COUNT 100
```

**编码选择：** `ziplist`（<128个元素且每个<64字节）自动转为 `skiplist` + `dict`

**实战要点：**
- 排行榜：`ZREVRANGE leaderboard 0 9 WITHSCORES`（Top 10），分页用 LIMIT
- 延迟队列：`ZADD delayed:tasks ${timestamp} "task:1001"`，轮询 `ZRANGEBYSCORE ... -inf ${now}`
- `ZUNIONSTORE/ZINTERSTORE` 会覆盖目标 key，注意备份
- 分数是 double 类型，注意浮点精度问题

**面试题：** 底层 skiplist + dict，skiplist 保证 O(logN) 范围查询，dict 保证 O(1) 查找

---

### 1.6 Stream（流）

**核心命令与示例：**
```bash
XADD key [MAXLEN ~ 10000] * field value field value  # *自动生成ID
XREAD COUNT n BLOCK ms STREAMS key ID  # ID=0从头读，$读最新
XREADGROUP GROUP g consumer COUNT n BLOCK ms NOACK STREAMS key >  # >只读新消息
XACK key group ID  # 确认消息
XCLAIM key group consumer min_idle ID  # 转移消息（处理失败时）
XDEL / XTRIM key MAXLEN ~ 10000
XGROUP CREATE key group 0 MKSTREAM / XGROUP DESTROY key group
XRANGE / XREVRANGE key start end COUNT n
XINFO STREAM key / XINFO GROUPS key / XINFO CONSUMERS key group
```

**实战要点：**
- Stream 支持消费者组 + ACK + 消息回溯，比 List 更适合做消息队列
- `XREADGROUP` 用 `>` 接收新消息，用 `0` 读取历史未确认消息
- `MAXLEN ~ 10000` 使用近似裁剪（~），性能更好
- 消息 ID 格式：毫秒时间戳-序列号，不能手动指定

**面试题：** Stream vs List：Stream 支持消费者组、ACK、回溯、持久化

---

### 1.7 HyperLogLog / Bitmap / Geospatial

**HyperLogLog（基数统计）：**
```bash
PFADD key e1 e2 e3 / PFCOUNT key1 key2 / PFMERGE dest k1 k2
```
标准误差 0.81%，内存仅 12KB。适合 UV 统计，但不能获取具体元素，小数据集（<1000）误差较大。

**Bitmap（位图）：**
```bash
SETBIT / GETBIT key offset / BITCOUNT key [start end]
BITOP AND|OR|XOR|NOT dest k1 k2 / BITFIELD key GET type offset
BITPOS key bit [start end]
```
每个 bit 代表一个状态，签到系统：`SETBIT user:1001:signin ${day} 1`，offset 最大 2^32-1。

**Geospatial（地理位置）：**
```bash
GEOADD key lng lat member / GEODIST key m1 m2 km
GEOSEARCH key FROMMEMBER member BYRADIUS radius km WITHDIST WITHCOORD COUNT n
GEOSEARCH key FROMLONLAT lng lat BYRADIUS radius km WITHDIST WITHCOORD COUNT n
GEORADIUSBYMEMBER key member radius km / GEOHASH / GEOPOS
```
> **注意：** `GEORADIUS` 和 `GEORADIUSBYMEMBER` 在 Redis 6.2+ 已废弃，推荐使用 `GEOSEARCH`（Redis 6.2+）替代。

底层 ZSet + 52 位 geohash，精度约 0.1 米。经度 -180~180，纬度 -85~85。

---

## 2. 底层数据结构

### 2.1 SDS（Simple Dynamic String）

```c
struct sdshdr { int len; int free; char buf[]; };
```
相比 C 字符串：O(1) 获取长度、二进制安全、空间预分配减少重分配、防止缓冲区溢出。编码类型：sdshdr5/8/16/32/64，根据长度自动选择。

### 2.2 intset / ziplist / quicklist

**intset：** 有序整数集合，支持 int16->int32->int64 类型升级（不可逆），用于小 Set。

**ziplist：** 连续内存紧凑存储 `<zlbytes><zltail><zllen><entry...><zlend>`，省内存但插入删除需内存移动 O(N)。

**quicklist：** Redis 3.2+ List 默认实现，ziplist 双向链表。配置 `list-max-ziplist-size -2`（每段 8KB）、`list-compress-depth 0`（压缩深度）。两端 O(1)，支持中间节点压缩。

### 2.3 hashtable / skiplist / dict

**hashtable：** 链地址法解决冲突，支持渐进式 rehash。扩容触发：负载因子 >1（无 BGSAVE）或 >5（强制）。rehash 期间查询同时查两个表，写操作更新两个表。

**skiplist：** ZSet 底层，多层索引概率平衡（1/4 升级），O(logN) 查找/插入/删除。相比 B+树：实现简单、内存友好。

**dict：** Redis 核心结构，`dictht ht[2]` 双表实现渐进式 rehash。Set/Hash/ZSet 均基于 dict。

### 2.4 robj（Redis Object）

```c
typedef struct redisObject {
    unsigned type:4;      // OBJ_STRING/LIST/HASH/SET/ZSET/STREAM
    unsigned encoding:4;  // RAW/INT/HT/ZIPLIST/INTSET/SKIPLIST/EMBSTR/QUICKLIST
    unsigned lru:LRU_BITS; int refcount; void *ptr;
} robj;
```
`OBJECT ENCODING key` 查看编码。embstr（Redis 6.x 及以下 ≤44字节，Redis 7.0+ ≤64字节，连续内存）vs raw（超过阈值，分离内存）。

---

## 3. 持久化机制

### 3.1 RDB

```bash
save 900 1 / save 300 10 / save 60 10000  # 自动触发
SAVE  # 阻塞主线程（慎用）/ BGSAVE  # 后台fork子进程
rdbcompression yes / rdbchecksum yes / dbfilename dump.rdb
```
优点：文件紧凑、恢复快、适合备份。缺点：可能丢失数据、fork 时内存翻倍。

### 3.2 AOF

```bash
appendonly yes / appendfilename "appendonly.aof"
appendfsync everysec  # always(最安全最慢)/everysec(推荐)/no(最快不安全)
auto-aof-rewrite-percentage 100 / auto-aof-rewrite-min-size 64mb
```
AOF 重写压缩文件：`BGREWRITEAOF` 或自动触发。损坏修复：`redis-check-aof --fix`。

### 3.3 混合持久化（Redis 4.0+）

```bash
aof-use-rdb-preamble yes  # AOF文件= RDB头 + AOF尾
```
兼顾 RDB 恢复速度和 AOF 数据完整性，AOF 重写时自动生成。

### 3.4 fork 与 copy-on-write

fork 创建子进程做持久化，利用 COW 减少内存复制。优化：`echo 1 > /proc/sys/vm/overcommit_memory`、禁用 THP（`echo never > /sys/kernel/mm/transparent_hugepage/enabled`）。

**选型策略：** 纯缓存关闭持久化；数据安全选 AOF+everysec；平衡选混合持久化；定期 RDB 备份。

---

## 4. 内存管理

### 4.1 内存淘汰策略

| 策略 | 说明 |
|------|------|
| noeviction | 不淘汰，写入返回错误 |
| allkeys-lru | 淘汰最少使用的key（缓存场景推荐） |
| allkeys-lfu | 淘汰最不频繁使用的key（Redis 4.0+） |
| volatile-lru/lfu/ttl/random | 仅淘汰设置了过期时间的key |

```bash
maxmemory 2gb / maxmemory-policy allkeys-lru / maxmemory-samples 5
```

**LRU vs LFU：** LRU 基于时间（最近最少使用），LFU 基于频率（使用次数最少）。Redis 使用近似 LRU（随机采样淘汰）和近似 LFU（Morris 计数器 + 衰减因子）。访问频率差异大的场景选 LFU。

### 4.2 内存碎片与监控

```bash
activedefrag yes  # Redis 4.0+ 自动碎片整理
active-defrag-threshold-lower 10 / active-defrag-threshold-upper 100
INFO memory  # mem_fragmentation_ratio 正常范围 1.0-1.5
```

### 4.3 大key 检测与处理

**定义：** String>10KB，Hash/Set/ZSet/List>10000个元素。检测：`redis-cli --bigkeys`、`MEMORY USAGE key`。处理：按业务维度拆分（分片 Hash、分段 List）。预防：定时巡检 + 告警。

---

## 5. 缓存设计

### 5.1 缓存穿透（查询不存在的数据）

**方案1 - 布隆过滤器：** `BF.ADD user_filter user1`，查询前先过滤。误判率可配置，不支持删除。
**方案2 - 空值缓存：** 查不到时缓存 `null` 值（短过期时间 60s），防止重复穿透。
**方案3 - 请求限流：** `INCR rate:${ip}` + `EXPIRE` 限制单 IP 查询频率。

### 5.2 缓存击穿（热点key过期）

**方案1 - 互斥锁：** `SETNX lock:${key} 1 EX 10`，获取锁的线程查DB并重建缓存，其他线程等待重试。
**方案2 - 热点预加载：** 定时任务刷新热点 key，永不过期或逻辑过期。
**方案3 - 逻辑过期：** 缓存中存逻辑过期时间，过期后异步刷新，返回旧数据。

### 5.3 缓存雪崩（大量key同时过期）

**方案1 - 过期时间随机化：** `expire = 3600 + random(0, 300)`。
**方案2 - 多级缓存：** 本地缓存（Caffeine/Guava，TTL 60s）+ Redis + DB。
**方案3 - 限流降级：** Redis 限流保护 DB，超限返回默认值或排队。

### 5.4 缓存与数据库一致性

**Cache Aside（推荐）：** 读先缓存后DB并回填缓存；写先更新DB再删除缓存。
**延迟双删：** 删除缓存 -> 更新DB -> 延迟1s再删除缓存（用消息队列异步执行）。
**Write Through：** 缓存代理同步更新缓存和DB。**Write Behind：** 只更新缓存，异步批量写DB（可能丢数据）。

**踩坑：** 先删缓存再更新DB，并发时可能脏数据；推荐先更新DB再删缓存（失败概率更低）。

---

## 6. 集群方案

### 6.1 主从复制

```bash
replicaof <masterip> <masterport> / masterauth <password>  # slaveof 在 Redis 5.0+ 已废弃，推荐使用 REPLICAOF
```
**全量同步：** REPLICAOF -> 主节点 BGSAVE -> 发送 RDB -> 从节点加载 -> 发送缓冲区增量。
**增量同步（psync）：** 断线重连时从复制缓冲区（repl_backlog）恢复。`INFO replication` 查看 repl_backlog 大小和偏移量。

**踩坑：** 从节点只读；repl_backlog 太小会触发全量同步；大主节点 fork 慢。

### 6.2 哨兵模式（Sentinel）

```bash
sentinel monitor mymaster 192.168.1.100 6379 2  # quorum=2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
sentinel parallel-syncs mymaster 1
```
**功能：** 监控主从状态、故障通知、自动故障转移（选举领头 Sentinel -> 选新主 -> 通知客户端）。
**脑裂处理：** quorum 配置为 (n/2)+1（n 为 Sentinel 数量），建议部署 3/5/7 个奇数节点。

### 6.3 Cluster 模式

```bash
cluster-enabled yes / cluster-config-file nodes.conf / cluster-node-timeout 5000
```
**核心机制：**
- **Hash Slot：** 16384 个槽位，`CLUSTER KEYSLOT key` 计算。key 使用 `{hashtag}` 确保相关 key 在同一节点。
- **Gossip 协议：** 节点间 PING/PONG 通信，每秒随机选节点交换信息。
- **故障转移：** 节点标记 PFAIL -> 超过半数标记 PFAIL -> 标记 FAIL -> 从节点发起选举。
- **重定向：** `MOVED`（槽位已迁移，客户端应更新映射）、`ASK`（槽位迁移中，临时重定向）。
- **扩缩容：** `redis-cli --cluster reshard` 迁移槽位，`CLUSTER SETSLOT IMPORTING/MIGRATING`。

**批量操作优化：** 使用 Hash Tag `{user:1001}:profile` 和 `{user:1001}:settings` 确保同槽位。Pipeline 在 Cluster 中需确保所有 key 在同一节点。

**踩坑：** 不支持跨节点多 key 操作（除非 Hash Tag）；不支持 SELECT 数据库（只能用 db0）；公共 key（如分布式锁）需用 Hash Tag。

---

## 7. 事务与Lua脚本

### 7.1 事务（MULTI/EXEC/DISCARD/WATCH）

```bash
MULTI -> SET k1 v1 -> SET k2 v2 -> EXEC  # 原子执行
WATCH balance -> GET balance -> MULTI -> DECRBY balance 100 -> EXEC  # 乐观锁
```
**ACID 特性：** 原子性（支持）、一致性（部分支持，命令失败不回滚）、隔离性（支持）、持久性（取决于持久化配置）。
**不支持回滚的原因：** 命令语法错误在 EXEC 前可发现；运行时错误（如对 String 执行 INCR）只跳过该命令，不影响其他命令。设计上优先保证性能和简单性。

### 7.2 Lua 脚本

```bash
EVAL "return redis.call('SET', KEYS[1], ARGV[1])" 1 key value
EVALSHA <sha1> 1 key value  # 执行缓存脚本，减少网络传输
SCRIPT LOAD / SCRIPT EXISTS / SCRIPT FLUSH
```
**原子性保证：** 脚本执行期间不会被其他命令打断（单线程模型）。
**限制：** 不能使用随机函数、不能调用阻塞命令（BLPOP等）、默认超时 5秒（`lua-time-limit`）。
**脚本复制：** Redis 主从复制时，整个脚本在从节点重放（而非单条命令），保证一致性。

**实战 - 分布式锁：**
```lua
-- 加锁
if redis.call('SETNX', KEYS[1], ARGV[1]) == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return 1
end
return 0
-- 解锁（先校验值再删除）
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
```

---

## 8. 高可用与架构

### 8.1 读写分离与多级缓存

**读写分离：** 主节点写、从节点读。问题：主从延迟（异步复制）导致读到旧数据。方案：关键读强制走主节点、容忍短暂不一致。

**多级缓存架构：** `客户端 -> 本地缓存(Caffeine, TTL 60s) -> Redis(TTL 1h) -> DB`。一致性保证：更新 DB 后删除 Redis -> 发布失效消息 -> 本地缓存监听失效。

### 8.2 热点数据处理

识别：`maxmemory-policy allkeys-lfu` + 监控 `keyspace_hits`。处理：本地缓存热点 key、增加 Redis 副本读、使用读写分离分散压力。

### 8.3 架构方案对比

| 方案 | 分片方式 | 高可用 | 在线迁移 | 复杂度 |
|------|----------|--------|----------|--------|
| Redis Cluster | 客户端 | 支持 | 支持 | 中 |
| Codis | 代理(ZooKeeper) | 支持 | 支持 | 高 |
| Twemproxy | 代理 | 不支持 | 离线 | 低 |

**跨机房部署：** 同城双活（主从跨机房，异步复制）、异地多活（每个机房独立 Cluster，应用层同步）。挑战：跨机房延迟（通常 >1ms）、网络分区、数据一致性。

---

## 9. 性能优化

### 9.1 Pipeline 与连接池

**Pipeline：** 将多个命令打包发送，1 次网络往返代替 N 次。注意：Pipeline 中命令非原子执行；大批量时建议分批（每批 500-1000 条）。

**连接池：** `max_connections` 根据并发量设置（通常 50-200），配置 `socket_timeout=5`、`retry_on_timeout=True`。注意连接泄漏（使用后确保归还）。

### 9.2 慢查询与网络优化

```bash
slowlog-log-slower-than 10000  # 10ms阈值
slowlog-max-len 128
SLOWLOG GET 10 / SLOWLOG LEN / SLOWLOG RESET
```
常见慢命令：`KEYS *`（用 SCAN 替代）、`HGETALL` 大 Hash、`LRANGE 0 -1` 大 List、`FLUSHALL`。

**网络优化：** `tcp-nodelay yes`（禁用 Nagle 算法）、`tcp-keepalive 300`、`tcp-backlog 511`。

### 9.3 单线程模型与多线程 IO

**单线程模型：** 命令执行单线程，避免锁竞争和上下文切换。配合 IO 多路复用（epoll/kqueue）实现高并发。

**Redis 6.0+ 多线程 IO：** `io-threads 4` / `io-threads-do-reads yes`。仅处理网络读写，命令执行仍单线程。适用于网络 IO 成为瓶颈的高并发场景。

**Benchmark：** `redis-benchmark -h localhost -p 6379 -c 50 -n 100000 -t set,get`。关注 QPS、P99 延迟、错误率。

---

## 10. 应用场景

### 10.1 分布式锁

```bash
# 加锁（基础版）
SET lock:resource ${uuid} NX EX 30

# 解锁（Lua保证原子性）
EVAL "if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end" 1 lock:resource ${uuid}
```
**Redlock：** 在 N（>=3）个独立 Redis 实例上加锁，超过半数成功才算获取锁。解决单点故障问题，但仍有争议（时钟漂移、GC 停顿）。推荐使用 Redisson 实现。

### 10.2 分布式限流

**滑动窗口（ZSet）：** `ZADD limit:${uid} ${ts} ${ts}` -> `ZREMRANGEBYSCORE limit:${uid} -inf ${now-window}` -> `ZCARD` 判断是否超限。
**固定窗口（INCR）：** `INCR rate:${uid}` + `EXPIRE`，简单但存在临界点突刺问题。
**令牌桶（Lua）：** 维护令牌数，定时补充，消费时扣减。

### 10.3 其他场景速查

| 场景 | 数据结构 | 核心命令 |
|------|----------|----------|
| 排行榜 | ZSet | ZADD/ZREVRANGE/ZRANK |
| 消息队列 | Stream | XADD/XREADGROUP/XACK |
| 延迟队列 | ZSet | ZADD(score=ts)/ZRANGEBYSCORE/ZREM |
| 计数器 | String | INCR/INCRBY |
| 签到 | Bitmap | SETBIT/GETBIT/BITCOUNT |
| 附近的人 | GEO | GEOADD/GEOSEARCH/GEODIST |
| UV统计 | HyperLogLog | PFADD/PFCOUNT/PFMERGE |
| 共同好友 | Set | SINTER/SDIFF/SUNION |
| 标签系统 | Set | SADD/SINTER（多标签AND） |

---

## 11. 监控运维

### 11.1 核心监控命令

```bash
INFO server/memory/replication/stats/cpu/cluster  # 全方位信息
CLIENT LIST / CLIENT KILL ip:port / CLIENT SETNAME myclient  # 连接管理
DBSIZE  # key总数
MEMORY USAGE key  # 单key内存占用
MEMORY DOCTOR  # 内存诊断
```

### 11.2 监控体系

**Prometheus + Grafana：** 部署 `redis_exporter`，采集 `used_memory`、`connected_clients`、`ops_per_sec`、`evicted_keys`、`keyspace_hits/misses` 等指标。设置告警：内存使用率 >80%、连接数 >80%、淘汰数突增。

**RedisInsight：** 官方可视化工具，支持数据浏览、性能监控、慢查询分析、CLI。

**redis-rdb-tools：** `rdb -c memory dump.rdb > memory.csv` 分析内存占用分布，定位大 key。

### 11.3 键空间通知

```bash
notify-keyspace-events Ex  # 启用过期事件通知
SUBSCRIBE __keyevent@0__:expired  # 盢听过期事件
```
注意：过期事件不保证实时（Redis 内部删除策略决定），不可用于精确计时。

---

## 12. Redis 7.x 新特性

### 12.1 Function（替代 Lua 脚本）

```bash
FUNCTION LOAD "#!lua name=mylib\nredis.register_function('myfunc', function(keys, args) return redis.call('GET', keys[1]) end)"
FCALL myfunc 1 mykey
FUNCTION LIST / FUNCTION DELETE mylib
```
优势：更好的函数管理（命名空间）、支持元数据、更好的持久化、替代 SCRIPT 命令。

### 12.2 ACL v2

```bash
ACL SETUSER user1 on >password ~key:* +@read +@write -@dangerous
ACL LIST / ACL WHOAMI / ACL DELUSER user1 / ACL CAT  # 查看分类
```
增强：更细粒度的 key 模式匹配、命令分类管理、多步认证（SELECT 认证）、Pub/Sub 权限控制。

### 12.3 Sharded Pub/Sub

```bash
SPUBLISH channel:shard1 "message"  # 分片发布
SSUBSCRIBE channel:shard1          # 分片订阅
```
消息只在拥有该 channel 所在 slot 的节点上传播，避免全集群广播，提升扩展性。

### 12.4 Multi-part AOF

Redis 7.0 将 AOF 拆分为多个文件：`base`（RDB 格式基础文件）+ `incr`（增量 AOF 文件列表）。优势：重写更快（只重写最新 incr）、恢复更高效、支持 `aof-timestamp-enabled` 时间戳。

---

## 总结

5年经验工程师应重点掌握：
1. **底层原理：** SDS/ziplist/quicklist/skiplist/dict 的实现与转换条件
2. **持久化选型：** RDB/AOF/混合持久化的权衡，fork+COW 的优化
3. **缓存一致性：** Cache Aside + 延迟双删，理解各种异常场景
4. **集群高可用：** Cluster 的 Hash Slot、Gossip、故障转移、MOVED/ASK 重定向
5. **性能调优：** Pipeline、大 key 拆分、慢查询分析、多线程 IO
6. **分布式场景：** 分布式锁（Redlock）、限流、消息队列的工程实现
