# MongoDB 知识点总结（5年经验深度指南）

> 适用人群：具有5年后端开发或DBA经验的工程师
> MongoDB 版本：主要基于 6.x/7.x，兼容 5.x/4.x

---

## 目录

1. [基础操作](#1-基础操作)
2. [聚合管道（Aggregation Pipeline）](#2-聚合管道aggregation-pipeline)
3. [索引体系](#3-索引体系)
4. [文档模型设计](#4-文档模型设计)
5. [事务机制](#5-事务机制)
6. [副本集（Replica Set）](#6-副本集replica-set)
7. [分片集群（Sharded Cluster）](#7-分片集群sharded-cluster)
8. [变更流（Change Streams）](#8-变更流change-streams)
9. [性能调优](#9-性能调优)
10. [备份恢复](#10-备份恢复)
11. [监控运维](#11-监控运维)
12. [安全机制](#12-安全机制)

---

## 1. 基础操作

### 1.1 数据库与集合操作

```javascript
// 数据库操作
use mydb                                    // 切换/创建数据库（写入时才真正创建）
show dbs                                    // 查看所有数据库
db.getName()                                // 当前数据库名
db.stats(1024)                              // 统计信息（参数为缩放因子KB）
db.dropDatabase()                           // 删除当前数据库

// 集合操作
db.createCollection("users", {
  capped: true, size: 10485760, max: 1000,  // 固定大小集合
  validator: { $jsonSchema: { ... } },       // Schema 验证
  validationLevel: "strict", validationAction: "error"
})
show collections                            // 查看集合列表
db.users.stats({ indexDetails: true })      // 集合统计（含索引详情）
db.users.renameCollection("members", true)  // 重命名（原子操作，true=强制覆盖）
db.users.drop()                             // 删除集合
```

**实战经验**：`use` 不会立即创建数据库，写入时才创建。`renameCollection` 在副本集下是元数据操作，执行极快但短暂锁集合，建议低峰期操作。Capped Collection 适合日志/缓存场景，不支持 `$pull`/`$pop` 等缩小操作。

### 1.2 CRUD 操作

```javascript
// 插入
db.users.insertOne({ name: "张三", age: 28, tags: ["dev", "golang"], createdAt: new Date() })
db.users.insertMany([{ name: "李四" }, { name: "王五" }], {
  ordered: false, writeConcern: { w: "majority", j: true }
})

// 查询
db.users.findOne({ name: "张三" })
db.users.find({ age: { $gte: 25 } }).limit(10).skip(20).sort({ createdAt: -1 })
db.users.countDocuments({ age: { $gte: 25 } })   // 精确计数（基于聚合）
db.users.estimatedDocumentCount()                  // 估算计数（基于元数据，快）

// 更新
db.users.updateOne({ name: "张三" }, { $set: { age: 29 }, $inc: { loginCount: 1 } }, { upsert: true })
db.users.updateMany({ status: "inactive" }, { $set: { status: "archived" } })
db.users.replaceOne({ _id: ObjectId("...") }, { name: "新名字", age: 30 })  // 替换整个文档
db.users.findOneAndUpdate({ name: "张三" }, { $set: { age: 29 } }, { returnDocument: "after" })

// 删除
db.users.deleteOne({ name: "张三" })
db.users.deleteMany({ status: "archived" })
db.users.findOneAndDelete({ status: "inactive" }, { sort: { createdAt: 1 } })

// 批量写入（单次最多10万条）
db.users.bulkWrite([
  { insertOne: { document: { name: "A", age: 20 } } },
  { updateOne: { filter: { name: "B" }, update: { $set: { age: 31 } } } },
  { deleteOne: { filter: { name: "C" } } }
], { ordered: false, writeConcern: { w: "majority" } })
```

**实战经验**：`ordered: false` 性能提升显著（服务端可并行处理），但无法保证顺序。大量数据导入建议用 `mongoimport`。大 `skip` 性能差，推荐基于 `_id` 或时间戳的范围分页：`find({ _id: { $gt: lastId } }).limit(20)`。

### 1.3 查询操作符

```javascript
// 比较：$eq/$gt/$gte/$lt/$lte/$ne/$in/$nin
db.products.find({ price: { $gte: 10, $lte: 100 }, category: { $in: ["A", "B"] } })

// 逻辑：$and/$or/$not/$nor（逗号分隔即隐式 AND）
db.orders.find({ $or: [{ status: "urgent" }, { amount: { $gt: 10000 } }] })
db.users.find({ age: { $not: { $gt: 25 } } })

// 元素：$exists/$type（类型值：1=double, 2=string, 3=object, 4=array, 9=date）
db.users.find({ phone: { $exists: true }, code: { $type: ["int", "long"] } })

// 数组：$all/$elemMatch/$size
db.articles.find({ tags: { $all: ["mongodb", "index"] } })
db.survey.find({ results: { $elemMatch: { product: "A", score: { $gte: 80 } } } })
db.posts.find({ comments: { $size: 5 } })

// 正则（性能差，建议用 Atlas Search 替代）
db.users.find({ name: { $regex: /^张/, $options: "i" } })

// 地理空间（需 2dsphere 索引）
db.places.find({ location: { $near: { $geometry: { type: "Point", coordinates: [116.4, 39.9] }, $maxDistance: 5000 } } })
db.places.find({ location: { $geoWithin: { $geometry: { type: "Polygon", coordinates: [[[...]]] } } } })
db.places.find({ location: { $geoIntersects: { $geometry: { type: "LineString", coordinates: [[...]] } } } })
db.places.find({ location: { $nearSphere: { $geometry: { type: "Point", coordinates: [116.4, 39.9] }, $maxDistance: 5000 } } })
```

### 1.4 更新操作符

```javascript
// 字段操作：$set/$unset/$inc/$mul/$rename/$min/$max/$currentDate
db.users.updateOne({ _id: 1 }, {
  $set: { name: "新名字" }, $unset: { tempField: "" }, $inc: { loginCount: 1 },
  $mul: { price: 1.1 }, $rename: { oldName: "newName" }, $min: { lowPrice: 50 },
  $max: { highScore: 100 }, $currentDate: { lastModified: true }
})

// 数组操作：$push/$pop/$pull/$addToSet/$each/$position/$slice/$sort
db.users.updateOne({ _id: 1 }, {
  $push: { scores: { $each: [90, 85], $sort: -1, $slice: 5 } },
  $addToSet: { tags: { $each: ["a", "b"] } },
  $pop: { logs: 1 }, $pull: { scores: { $lt: 60 } },
  $pullAll: { flags: ["a", "b"] }
})

// 位操作：$bit
db.sensors.updateOne({ _id: 1 }, { $bit: { flags: { and: NumberLong(0xFFFF0000) } } })
```

### 1.5 投影与排序

```javascript
db.users.find({ status: "active" }, { name: 1, email: 1, _id: 0 })  // 投影
db.users.find({ _id: 1 }, { comments: { $slice: [10, 5] } })        // 数组切片
db.users.find({ _id: 1 }, { comments: { $elemMatch: { score: { $gte: 90 } } } })
db.users.find({}).sort({ createdAt: -1 }).skip(100).limit(20)       // 排序分页
```

**面试常见问题**：
1. `countDocuments` vs `estimatedDocumentCount`：前者精确但慢（基于聚合），后者估算但快（基于元数据）。
2. `skip` 性能问题：`skip(100000)` 需扫描并丢弃前10万条，应改用范围查询分页。
3. 索引失效场景：`$ne`/`$nin`/`$not`、非前缀正则、对索引字段用表达式（`$where`/`$expr`）、类型不匹配。

---

## 2. 聚合管道（Aggregation Pipeline）

### 2.1 核心阶段

```javascript
db.orders.aggregate([
  { $match: { status: "completed", createdAt: { $gte: ISODate("2025-01-01") } } },  // 过滤（前置利用索引）
  { $group: {
    _id: "$userId", totalAmount: { $sum: "$amount" }, orderCount: { $sum: 1 },
    avgAmount: { $avg: "$amount" }, maxAmount: { $max: "$amount" },
    categories: { $addToSet: "$category" }, lastOrder: { $last: "$createdAt" }
  }},
  { $addFields: { level: { $switch: { branches: [
    { case: { $gte: ["$totalAmount", 10000] }, then: "VIP" },
    { case: { $gte: ["$totalAmount", 5000] }, then: "Gold" }
  ], default: "Normal" } } } },
  { $project: { userId: "$_id", _id: 0, totalAmount: 1, level: 1 } },
  { $sort: { totalAmount: -1 } }, { $skip: 0 }, { $limit: 20 }
])
```

### 2.2 $lookup 关联查询

```javascript
// 基本关联
db.orders.aggregate([
  { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userInfo" } },
  { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } }
])

// pipeline 方式关联（支持复杂条件）
db.orders.aggregate([
  { $lookup: { from: "users", let: { userId: "$userId", orderDate: "$createdAt" },
    pipeline: [
      { $match: { $expr: { $and: [
        { $eq: ["$_id", "$$userId"] },
        { $gte: ["$createdAt", { $subtract: ["$$orderDate", 86400000 * 30] }] }
      ] } } },
      { $project: { name: 1, level: 1, _id: 0 } }
    ], as: "recentUserInfo"
  }}
])
```

### 2.3 $unwind / $facet / $bucket / $replaceRoot

```javascript
// $unwind：展开数组
db.posts.aggregate([{ $unwind: { path: "$comments", preserveNullAndEmptyArrays: true, includeArrayIndex: "idx" } }])

// $facet：多管道并行（适合分页+统计场景）
db.products.aggregate([{ $match: { category: "electronics" } }, { $facet: {
  paginatedResults: [{ $sort: { price: 1 } }, { $skip: 0 }, { $limit: 10 }],
  totalCount: [{ $count: "value" }],
  priceStats: [{ $group: { _id: null, avg: { $avg: "$price" }, max: { $max: "$price" } } }]
}}])

// $bucket / $bucketAuto
db.transactions.aggregate([{ $bucket: { groupBy: "$amount", boundaries: [0, 100, 500, 1000, Infinity],
  default: "other", output: { count: { $sum: 1 }, total: { $sum: "$amount" } } } }])
db.transactions.aggregate([{ $bucketAuto: { groupBy: "$amount", buckets: 5, output: { count: { $sum: 1 } } } }])

// $replaceRoot / $count / $sample
db.users.aggregate([{ $lookup: { from: "profiles", localField: "profileId", foreignField: "_id", as: "p" } },
  { $unwind: "$p" }, { $replaceRoot: { newRoot: "$p" } }])
db.orders.aggregate([{ $match: { status: "completed" } }, { $count: "completedOrders" }])
db.users.aggregate([{ $sample: { size: 100 } }])
```

### 2.4 聚合优化

```javascript
// 1. $match 前置利用索引；2. $project 早期裁剪字段；3. allowDiskUse 超过100MB时
db.orders.aggregate([...], { allowDiskUse: true })
db.orders.aggregate([...], { explain: "executionStats" })  // 分析执行计划
```

**面试常见问题**：
1. 聚合管道 vs 应用层 JOIN：聚合在数据库层完成关联减少网络传输，但消耗数据库CPU。大数据量建议应用层分步查询。
2. `$lookup` 性能：本质是嵌套循环，大集合关联时性能差。建议关联字段建索引，或用 `$let` + `pipeline` 限制子管道扫描范围。
3. `$facet` 每个子管道最多返回100MB（可通过 `allowDiskUse` 放宽）。

---

## 3. 索引体系

### 3.1 索引类型

```javascript
db.users.createIndex({ email: 1 })                                    // 单字段索引
db.orders.createIndex({ userId: 1, createdAt: -1, status: 1 })        // 复合索引
db.articles.createIndex({ tags: 1 })                                  // 多键索引（数组字段自动）
db.articles.createIndex({ title: "text", content: "text" }, {         // 文本索引
  weights: { title: 10, content: 5 }, default_language: "chinese" })
db.places.createIndex({ location: "2dsphere" })                       // 地理空间索引
db.users.createIndex({ sessionId: "hashed" })                         // 哈希索引（仅等值查询）
db.products.createIndex({ "metadata.$**": 1 })                        // 通配符索引（4.2+）
```

### 3.2 索引属性

```javascript
db.users.createIndex({ email: 1 }, { unique: true })                  // 唯一索引
db.enrollments.createIndex({ studentId: 1, courseId: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { sparse: true })                  // 稀疏索引
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 }) // TTL索引（60秒粒度清理）
db.events.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })     // 指定时间过期
db.orders.createIndex({ status: 1 }, {                                // 部分索引
  partialFilterExpression: { status: { $in: ["active", "pending"] } } })
db.users.hideIndex("email_1")                                         // 隐藏索引（测试用）
```

### 3.3 索引管理

```javascript
db.users.createIndex({ name: 1 }, { name: "idx_name" })  // 创建
db.users.getIndexes()                                      // 查看
db.users.dropIndex("idx_name")                             // 删除
db.users.dropIndexes()                                     // 删除所有（_id除外）
db.users.totalIndexSize(1024)                              // 索引大小
db.users.reIndex()                                         // 重建（阻塞读写）
```

### 3.4 索引优化

**ESR 规则（Equality / Sort / Range）**：复合索引字段顺序应遵循 E-S-R。

```javascript
// 查询：find({ userId: X, status: Y }).sort({ createdAt: -1 })
db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 })
// E: userId (Equality) -> S: status (Sort) -> R: createdAt (Range)
```

**覆盖查询（Covered Query）**：索引包含查询所需所有字段，无需回表。

```javascript
db.users.createIndex({ status: 1, name: 1, age: 1 })
db.users.find({ status: "active" }, { name: 1, age: 1, _id: 0 })
// explain 中 stage = "IXSCAN" 且无 FETCH 阶段
```

**explain() 分析**：关注 `winningPlan.stage`（COLLSCAN vs IXSCAN）、`totalDocsExamined` vs `nReturned`（理想比例接近1:1）、`executionTimeMillis`。

**实战经验**：
1. 每个额外索引增加约10-20%写入开销，通常一个集合不超过5-10个索引。
2. TTL 索引不能是复合索引，过期精度60秒。
3. 删除索引前先隐藏，观察确认无问题后再删。
4. 复合索引各字段方向可以不同，MongoDB 可双向遍历索引。

**面试常见问题**：
1. 索引失效场景：`$ne`/`$nin`/`$not`、非前缀正则、`$where`/`$expr`、类型不匹配。
2. 多键索引限制：复合索引最多一个多键字段，多键索引边界查询效率低于单字段。
3. 索引交集（Index Intersection）：MongoDB 可同时使用多个索引（4.2+优化），但通常不如复合索引。

---

## 4. 文档模型设计

### 4.1 嵌入 vs 引用

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| 一对一 | 嵌入 | 一次查询获取所有数据 |
| 一对少量（<100） | 嵌入 | 避免额外查询 |
| 一对多（无上限） | 引用 | 避免文档超过16MB |
| 多对多 | 引用（中间集合） | 关系灵活 |
| 频繁独立访问子文档 | 引用 | 独立索引和查询 |

```javascript
// 嵌入示例
{ _id: 1, name: "张三", address: { province: "北京", city: "北京" } }

// 引用示例
{ _id: ObjectId("order1"), userId: ObjectId("user1"), amount: 100 }

// 反范式化：订单中冗余用户快照
{ _id: ObjectId("order1"), userId: ObjectId("user1"),
  userSnapshot: { name: "张三", level: "VIP" }, amount: 100 }
```

### 4.2 设计模式

```javascript
// 属性模式（动态属性）
{ name: "iPhone 15", attrs: [{ k: "color", v: "black" }, { k: "storage", v: "256GB" }] }
db.products.createIndex({ "attrs.k": 1, "attrs.v": 1 })

// 桶模式（高频时序数据，按小时分桶）
{ sensorId: "s001", dateHour: ISODate("2025-06-01T10:00:00Z"),
  totalCount: 3600, sumValue: 36000, avgValue: 10 }

// 物化路径（树结构）
{ _id: 1, name: "后端组", path: "company.tech.backend" }
db.departments.find({ path: /^company\.tech\./ })  // 查询所有子节点

// 祖先数组
{ _id: 1, name: "后端组", ancestors: [ObjectId("root"), ObjectId("tech")] }
```

### 4.3 Schema 验证

```javascript
db.createCollection("users", {
  validator: { $jsonSchema: { bsonType: "object", required: ["name", "email", "age"],
    properties: {
      name: { bsonType: "string", minLength: 1, maxLength: 100 },
      email: { bsonType: "string", pattern: "^[\\w.-]+@[\\w.-]+\\.\\w+$" },
      age: { bsonType: "int", minimum: 0, maximum: 150 },
      status: { bsonType: "string", enum: ["active", "inactive", "banned"] }
    }, additionalProperties: false
  }},
  validationLevel: "strict", validationAction: "error"
})
db.runCommand({ collMod: "users", validationLevel: "moderate" })  // 修改验证规则
```

**面试常见问题**：
1. MongoDB 推荐反范式化是因为不支持高效 JOIN，嵌入和冗余可减少查询次数和网络往返。
2. 16MB 限制应对：引用关系拆分、GridFS 存储大文件、桶模式压缩时序数据。
3. Schema 验证在数据库层执行，Mongoose 在应用层执行，建议两层都做。

---

## 5. 事务机制

### 5.1 多文档事务

```javascript
const session = db.getMongo().startSession()
try {
  session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } })
  const user = session.getDatabase("mydb").users.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { session })
  if (!user.value) throw new Error("余额不足")
  session.getDatabase("mydb").orders.insertOne({ userId, amount, status: "created" }, { session })
  session.commitTransaction()
} catch (e) { session.abortTransaction() } finally { session.endSession() }
```

### 5.2 读写关注

```javascript
// 读关注：local（默认，不保证持久化）/ majority（已确认写入大多数）/ linearizable（线性一致性）
// 写关注：w:0（不确认）/ w:1（主节点确认，默认）/ w:majority / j:true（写入journal）/ wtimeout:5000
session.startTransaction({ readConcern: { level: "snapshot" }, writeConcern: { w: "majority", j: true } })
```

### 5.3 事务限制与最佳实践

**限制**：超时默认60秒（`transactionLifetimeLimitSeconds`）；修改文档总大小不超过16MB；不支持在 config/admin/local 库运行事务；4.4+ 支持事务中创建集合。

**最佳实践**：
1. 事务尽量短，减少锁持有时间。
2. 使用重试逻辑处理 `TransientTransactionError` 和 `WriteConflict`。
3. 很多场景可用单文档原子操作（`$inc`/`findOneAndUpdate`）替代事务。
4. 事务增加约30-50%延迟，必要时才使用。

**面试常见问题**：
1. MongoDB 事务 vs 关系型数据库：支持快照隔离（非可重复读），性能开销更大。
2. 单文档操作天然原子性，`findOneAndUpdate` + `$inc` 可实现转账等场景无需事务。
3. 写关注 `w:1` vs `w:majority`：前者主节点写入即返回但可能丢数据，后者更安全但延迟更高。

---

## 6. 副本集（Replica Set）

### 6.1 架构与角色

| 角色 | 说明 | 适用场景 |
|------|------|---------|
| Primary | 接收所有写操作 | 默认，每个副本集1个 |
| Secondary | 复制数据，可处理读请求 | 数据冗余、读扩展 |
| Arbiter | 仅投票，不存数据 | 奇数节点需求时 |
| Hidden | 不参与读请求 | 专用分析/报表节点 |
| Delayed | 数据延迟（如1小时） | 灾难恢复/误操作回滚 |
| Priority-0 | 永远不会成为 Primary | 防止某些节点提升 |

选举基于 Raft 协议变体，需 (N/2+1) 多数票，选举超时通常10秒。

### 6.2 读写操作配置

```javascript
// 读偏好：primary/primaryPreferred/secondary/secondaryPreferred/nearest
db.orders.find({}).readPref("secondaryPreferred")
// 写关注
db.orders.insertOne({}, { writeConcern: { w: "majority", j: true, wtimeout: 5000 } })
```

### 6.3 Oplog 管理

```javascript
use local
db.oplog.rs.find().sort({ ts: -1 }).limit(5)  // 查看操作日志
rs.printReplicationInfo()                       // Oplog 大小和窗口
db.adminCommand({ replSetResizeOplog: 1, size: 16384 })  // 调整 Oplog 大小
```

### 6.4 副本集管理

```javascript
rs.initiate({ _id: "rs0", members: [
  { _id: 0, host: "mongo1:27017", priority: 2 },
  { _id: 1, host: "mongo2:27017" },
  { _id: 2, host: "mongo3:27017", arbiterOnly: true }
]})
rs.add({ host: "mongo4:27017", priority: 0, hidden: true })
rs.remove("mongo4:27017")
rs.status(); rs.conf(); rs.stepDown(60)  // 手动降级Primary
```

**面试常见问题**：
1. 奇数节点：3节点容忍1台故障，5节点容忍2台。4节点也只能容忍1台，浪费资源。
2. 回滚：Primary 故障时未完全复制的写入，新 Primary 可能没有。旧 Primary 重新加入时触发回滚，数据保存在 `rollback` 目录。
3. Oplog 窗口不足时 Secondary 追不上，进入 RECOVERING 状态。需增大 Oplog 或增加带宽。

---

## 7. 分片集群（Sharded Cluster）

### 7.1 组件与分片策略

组件：Shard（数据分片，每个是副本集）、Config Server（3节点副本集，存元数据）、mongos（查询路由）。

```javascript
// 范围分片（适合范围查询，但可能热点）
sh.shardCollection("mydb.orders", { userId: 1 })
// 哈希分片（均匀分布，不支持范围查询）
sh.shardCollection("mydb.logs", { userId: "hashed" })
// 区域分片（数据路由到特定 Shard）
sh.addTagRange("mydb.users", { region: "CN" }, { region: "CN" }, "shard-cn")
```

### 7.2 分片键选择

**原则**：高基数、低频率、非单调递增、查询友好。

```javascript
// 好的分片键：{ userId: "hashed" }、{ userId: 1, createdAt: 1 }、{ tenantId: 1, _id: 1 }
// 差的分片键：{ status: 1 }（低基数）、{ createdAt: 1 }（单调递增热点）
```

### 7.3 Chunk 管理

```javascript
sh.enableSharding("mydb"); sh.shardCollection("mydb.orders", { userId: 1 })
sh.status(); db.chunks.find({ ns: "mydb.orders" })
sh.splitAt("mydb.orders", { userId: ObjectId("...") })
sh.moveChunk("mydb.orders", { userId: ObjectId("...") }, "shard2")
sh.stopBalancer(); sh.startBalancer()
db.settings.update({ _id: "balancer" }, { $set: { activeWindow: { start: "02:00", stop: "06:00" } } }, { upsert: true })
db.settings.update({ _id: "chunksize" }, { $set: { value: 128 } })  // 调整Chunk大小
```

**限制**：分片键不可更改（7.0+ 支持 `resharding`）；唯一索引必须包含分片键；不支持跨分片 `$lookup`（除非分片键在关联条件中）。

**面试常见问题**：
1. 分片键选错：7.0+ 用 `resharding` 在线更改；旧版本需导出数据、新建集合、重新分片。
2. Jumbo Chunk：超过 Chunk 最大大小且无法分割。需手动处理或调整数据模型。
3. 哈希分片不支持范围查询，解决方案：复合分片键（前缀哈希 + 后缀范围）。

---

## 8. 变更流（Change Streams）

```javascript
// 监听集合/数据库/集群级别变更
const cs = db.orders.watch([
  { $match: { operationType: { $in: ["insert", "update"] } } }
], { fullDocument: "updateLookup", fullDocumentBeforeChange: "whenAvailable" })

cs.on("change", (event) => {
  // event.operationType: insert/update/delete/replace/invalidate/drop/rename
  // event.fullDocument / event.fullDocumentBeforeChange / event.documentKey
  // event.updateDescription: { updatedFields, removedFields }
  lastResumeToken = event._id  // 保存 resumeToken 用于断点续传
})

// 断点续传
const cs2 = db.orders.watch([], { resumeAfter: lastResumeToken })
const cs3 = db.orders.watch([], { startAtOperationTime: Timestamp(1700000000, 1) })
```

**前提条件**：副本集或分片集群、WiredTiger 引擎、`readConcern: majority`。

**实战经验**：
1. 务必将 `resumeToken` 持久化到外部存储（Redis/DB），否则重启后无法续传。
2. 如果消费速度慢于 Oplog 生成速度可能丢失事件，需监控 Oplog 窗口。
3. 常见场景：同步到 Elasticsearch、触发业务事件通知、数据审计、实时数据管道。

---

## 9. 性能调优

### 9.1 慢查询分析

```javascript
db.setProfilingLevel(1, 50)  // 记录超过50ms的操作（级别0关/1慢/2全部）
db.system.profile.find().sort({ ts: -1 }).limit(10)
db.orders.find({ userId: ObjectId("...") }).explain("executionStats")
// 关注：totalDocsExamined vs nReturned、stage（COLLSCAN vs IXSCAN）、executionTimeMillis
```

### 9.2 WiredTiger 存储引擎

```javascript
// 特性：B-Tree 索引、文档级 MVCC 并发、数据压缩、检查点机制
// 压缩：--wiredTigerCollectionBlockCompressor snappy(默认)/zlib/zstd(5.0+)
// 缓存：--wiredTigerCacheSizeGB 4（默认 (RAM-1GB)*50%）
db.serverStatus().wiredTiger.cache  // 监控缓存使用和页面淘汰
```

### 9.3 连接与批量写入优化

```javascript
// 连接池 URI 参数：maxPoolSize=100&minPoolSize=10&maxIdleTimeMS=30000&waitQueueTimeoutMS=5000
db.currentOp({ "secs_running": { $gte: 5 } })  // 长时间运行的操作
db.killOp(opId)

// 批量写入：ordered:false 性能更好；先删索引->批量导入->重建索引比带索引导入快数倍
db.users.insertMany(docs, { ordered: false, writeConcern: { w: 1 } })
```

**面试常见问题**：
1. WiredTiger vs MMAPv1：WiredTiger 支持文档级锁、压缩、MVCC，是3.2+默认引擎。
2. 判断是否需要更多内存：观察 `pages evicted` 持续高且缓存命中率低于90%。
3. 批量导入最佳实践：先删索引 -> 批量导入（ordered:false, w:1）-> 重建索引。

---

## 10. 备份恢复

```bash
# mongodump/mongorestore（逻辑备份）
mongodump --uri "mongodb://user:pass@host:27017/mydb" --out /backup --gzip --numParallelCollections 4
mongodump --uri "..." --oplog --out /backup/full_with_oplog  # 增量备份
mongorestore --uri "..." --drop --gzip --numParallelCollections 4 --dir /backup/mydb
mongorestore --uri "..." --oplogReplay --oplogLimit "1690000000:1" --dir /backup  # PITR

# 物理备份（企业版 mongobackup / LVM 快照）
# 1. db.fsyncLock() 2. LVM快照 3. db.fsyncUnlock() 4. 挂载并复制
```

**备份策略**：全量每天凌晨 + 增量每小时（基于Oplog）+ 保留7天全量/30天增量 + 异地存储 + 每月恢复演练。

**实战经验**：`mongodump` 使用快照不锁集合；小型库（<50GB）用 mongodump，大型库用物理备份；备份应加密存储。

---

## 11. 监控运维

### 11.1 内置监控

```javascript
db.serverStatus()  // connections/opcounters/network/mem/wiredTiger.cache
db.stats()         // collections/data_size/storage_size/index_size
db.users.stats()   // count/size/avgObjSize/nindexes/totalIndexSize
```

```bash
mongostat --uri "..." --discover  # 实时监控所有节点
mongotop --uri "..." 10           # 集合级别读写时间
```

### 11.2 日志与告警

```bash
mongod --setParameter "logComponentVerbosity={command:2,query:3}"
db.adminCommand({ setParameter: 1, slowms: 200 })
```

关键告警指标：连接数>80%、Oplog窗口<1小时、复制延迟>10秒、页面淘汰率异常、慢查询激增、磁盘>85%。

### 11.3 用户与角色管理

```javascript
db.createUser({ user: "app_user", pwd: "StrongPassword123!", roles: [
  { role: "readWrite", db: "mydb" }, { role: "read", db: "reporting" }
], mechanisms: ["SCRAM-SHA-256"] })

db.createRole({ role: "orderManager", privileges: [
  { resource: { db: "mydb", collection: "orders" }, actions: ["find", "update", "insert"] }
], roles: [{ role: "read", db: "mydb" }] })

db.grantRolesToUser("app_user", [{ role: "orderManager", db: "mydb" }])
db.getUser("app_user", { showPrivileges: true })
db.changeUserPassword("app_user", "NewPassword!")
```

---

## 12. 安全机制

### 12.1 认证与权限

```bash
# SCRAM-SHA-256（推荐默认）、x.509（集群内部）、LDAP（企业版）
mongod --auth --setParameter authenticationMechanisms=SCRAM-SHA-256
mongod --auth --clusterAuthMode=x509 --sslCAFile /etc/ssl/ca.pem --sslPEMKeyFile /etc/ssl/mongo.pem
```

内置角色：read/readWrite/dbAdmin/userAdmin/dbOwner/clusterAdmin/backup/restore/root。遵循最小权限原则。

### 12.2 加密与审计

```bash
# TLS 加密通信
mongod --tlsMode requireTLS --tlsCAFile /etc/ssl/ca.pem --tlsCertificateKeyFile /etc/ssl/server.pem

# 字段级加密（FLE，4.2+）：自动加密/显式加密，支持 AEAD_AES_256_CBC_HMAC_SHA_512

# 审计日志（企业版）
mongod --auditDestination file --auditFormat JSON --auditPath /var/log/mongodb/audit.log \
  --auditFilter '{ "atype": "authCheck", "param.command": { $in: ["dropCollection"] } }'
```

### 12.3 网络安全

```bash
mongod --bindIp 127.0.0.1,10.0.0.1  # 不要绑定 0.0.0.0
# 防火墙：27017仅对应用服务器开放，Config Server(27019)/mongos(27020)仅内网
```

**面试常见问题**：
1. 安全最佳实践：启用认证、TLS、最小权限、网络隔离、定期审计、FLE 加密敏感数据。
2. SCRAM-SHA-256 流程：客户端发用户名 -> 服务端返回 salt/iteration -> 客户端计算 proof -> 服务端验证。密码不在网络中传输。
3. 生产环境必须启用 `--auth`，默认不启用仅为开发便利。

---

## 附录：常用运维脚本

```javascript
// 查找并删除重复文档
db.users.aggregate([
  { $group: { _id: "$email", count: { $sum: 1 }, ids: { $push: "$_id" } } },
  { $match: { count: { $gt: 1 } } }
]).forEach(d => { d.ids.shift(); db.users.deleteMany({ _id: { $in: d.ids } }) })

// 大集合分批处理
let lastId = null
while (true) {
  const q = lastId ? { _id: { $gt: lastId } } : {}
  const docs = db.coll.find(q).sort({ _id: 1 }).limit(10000).toArray()
  if (!docs.length) break
  lastId = docs[docs.length - 1]._id
  // 处理 docs...
}

// 索引使用率分析
db.users.aggregate([{ $indexStats: {} }]).forEach(s => print(s.name + ": " + JSON.stringify(s.accesses)))
```

---

> **文档版本**：v1.0 | **适用版本**：MongoDB 4.4 / 5.0 / 6.0 / 7.0 / 8.0
