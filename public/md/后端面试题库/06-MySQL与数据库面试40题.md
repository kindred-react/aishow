# MySQL 与数据库面试 40 题

> 基于数据库与 ORM 知识体系整理，涵盖索引、事务与锁、SQL 优化、日志体系、主从复制、分库分表等核心考点。

---

## 目录

- [一、索引（10题）](#一索引10题)
- [二、事务与锁（10题）](#二事务与锁10题)
- [三、SQL 优化（6题）](#三sql-优化6题)
- [四、日志体系（6题）](#四日志体系6题)
- [五、主从复制（4题）](#五主从复制4题)
- [六、分库分表（4题）](#六分库分表4题)
- [高频考点速查表](#高频考点速查表)

---

## 一、索引（10题）

### Q1: 为什么 MySQL 索引使用 B+ 树而不是 B 树？

**难度**: ⭐⭐⭐

**答案**: B+ 树相比 B 树有三个核心优势：

1. **非叶子节点不存数据**，单个节点能存更多键，**树更矮**，减少磁盘 IO
2. **叶子节点形成有序双向链表**，范围查询只需遍历叶子节点，效率极高
3. **查询性能稳定**，每次查询都到叶子节点，时间复杂度恒为 O(log n)

**解析**:
- 3 层 B+ 树可存储约 2000 万条记录（假设页大小 16KB）
- B 树范围查询需要在中序遍历中来回跳转，效率低
- 红黑树层级太深（2000 万条需要约 24 层），IO 次数不可接受

---

### Q2: 什么是聚簇索引和非聚簇索引？

**难度**: ⭐⭐

**答案**: 聚簇索引的叶子节点存储**完整的行数据**，非聚簇索引（辅助索引）的叶子节点存储**主键值**。

**解析**:
- InnoDB 的主键索引就是聚簇索引，一张表只能有一个聚簇索引
- 通过辅助索引查询时，需要先查到主键值，再回聚簇索引查完整数据（**回表**）

```
聚簇索引（主键 id）:          非聚簇索引（name）:
    [30]                        [Alice]
   /    \                      /       \
 [10]   [50]              [Bob]      [Carol]
  |      |                  |          |
[行数据] [行数据]          [id=10]    [id=30]
                          (需回表)    (需回表)
```

---

### Q3: 什么是覆盖索引？如何减少回表？

**难度**: ⭐⭐

**答案**: 覆盖索引是指查询的列全部在索引中，不需要回表查聚簇索引。

**解析**:
```sql
-- 假设有组合索引 idx_name_age(name, age)

-- 覆盖索引：查询列在索引中，Extra = Using index
SELECT id, name FROM user WHERE name = 'Alice';

-- 需要回表：查询了非索引列 email
SELECT name, age, email FROM user WHERE name = 'Alice';
```

减少回表的方法：
1. **覆盖索引**：SELECT 只选索引列
2. **组合索引**：将常用查询列组合到索引中
3. **索引下推（ICP）**：在索引层面先过滤，减少回表次数

---

### Q4: 什么是最左前缀原则？

**难度**: ⭐⭐

**答案**: 组合索引遵循最左前缀原则：查询必须从索引的最左列开始，不能跳过左边的列。

**解析**:
```sql
-- 组合索引 idx_a_b_c(a, b, c)

-- 命中索引
SELECT * FROM t WHERE a = 1;                    -- 使用 a
SELECT * FROM t WHERE a = 1 AND b = 2;          -- 使用 a, b
SELECT * FROM t WHERE a = 1 AND b = 2 AND c = 3;-- 使用 a, b, c

-- 未命中索引
SELECT * FROM t WHERE b = 2;                    -- 跳过 a
SELECT * FROM t WHERE c = 3;                    -- 跳过 a, b

-- 注意：b 范围查询后 c 无法使用索引
SELECT * FROM t WHERE a = 1 AND b > 2 AND c = 3; -- 只使用 a, b
```

- 最左前缀是针对索引列的顺序，不是 SQL 中 WHERE 条件的书写顺序（优化器会自动调整）

---

### Q5: 什么是索引下推（ICP）？

**难度**: ⭐⭐⭐

**答案**: 索引下推（Index Condition Pushdown）是 MySQL 5.6 引入的优化，在存储引擎层先过滤索引条件，减少回表次数。

**解析**:
```sql
-- 组合索引 idx_name_age(name, age)
SELECT * FROM user WHERE name LIKE 'A%' AND age = 20;

-- 没有 ICP（5.6 之前）：
-- 1. 存储引擎：通过 name LIKE 'A%' 找到 4 条记录
-- 2. 回表 4 次
-- 3. Server 层：过滤 age = 20（剩 1 条）

-- 有 ICP（5.6+）：
-- 1. 存储引擎：通过 name LIKE 'A%' AND age = 20 过滤（1 条）
-- 2. 回表 1 次
```

- EXPLAIN 中 `Using index condition` 表示使用了索引下推

---

### Q6: 索引失效的常见场景？

**难度**: ⭐⭐

**答案**: 6 种常见索引失效场景：

```sql
-- 1. 对索引列使用函数
SELECT * FROM user WHERE LEFT(name, 3) = 'Ali';  -- 失效
SELECT * FROM user WHERE name LIKE 'Ali%';         -- 生效

-- 2. 对索引列做运算
SELECT * FROM user WHERE age + 1 = 20;  -- 失效
SELECT * FROM user WHERE age = 19;       -- 生效

-- 3. 隐式类型转换
SELECT * FROM user WHERE phone = 13800138000;  -- 失效（phone 是 VARCHAR）
SELECT * FROM user WHERE phone = '13800138000'; -- 生效

-- 4. LIKE 以通配符 % 开头
SELECT * FROM user WHERE name LIKE '%Alice';  -- 失效
SELECT * FROM user WHERE name LIKE 'Alice%';  -- 生效

-- 5. 使用 OR（部分列无索引）
SELECT * FROM user WHERE name = 'Alice' OR age = 20;  -- 如果 age 无索引则失效

-- 6. 使用 != 或 NOT IN
SELECT * FROM user WHERE name != 'admin';  -- 可能失效
SELECT * FROM user WHERE name NOT IN (...); -- 可能失效
```

---

### Q7: 什么是回表？如何判断是否发生了回表？

**难度**: ⭐⭐

**答案**: 回表是通过辅助索引查到主键值后，再回到聚簇索引查询完整行数据的过程。

**解析**:
- 通过 EXPLAIN 查看 `Extra` 列：
  - `Using index`：覆盖索引，无回表
  - 空（无 Using index）：发生了回表

```sql
EXPLAIN SELECT id, name FROM user WHERE name = 'Alice';
-- Extra: Using index（覆盖索引，无回表）

EXPLAIN SELECT * FROM user WHERE name = 'Alice';
-- Extra: 空（需要回表查完整行）
```

---

### Q8: 联合索引和多个单列索引的区别？

**难度**: ⭐⭐

**答案**: 联合索引（组合索引）是在一个 B+ 树上按多列排序，一个索引可以覆盖多种查询。多个单列索引是多个独立的 B+ 树，MySQL 一次查询通常只能使用一个索引。

**解析**:
- 联合索引 `(a, b, c)` 可以覆盖：`a`、`a,b`、`a,b,c` 的查询
- 多个单列索引 `idx_a(a)` + `idx_b(b)` + `idx_c(c)`：MySQL 通常只选择一个（索引合并除外）
- 索引合并（Index Merge）：MySQL 可以同时使用多个单列索引，但效率不如联合索引

---

### Q9: 如何创建高效的索引？

**难度**: ⭐⭐⭐

**答案**: 索引设计原则：
1. **选择性高的列优先**：区分度高的列放前面（如手机号 > 性别）
2. **覆盖常用查询**：将 SELECT 的列纳入索引
3. **短索引优先**：索引列越短，一个页能存更多索引项
4. **避免冗余索引**：`(a)` 和 `(a,b)` 同时存在时 `(a)` 冗余
5. **频繁作为 WHERE 条件的列建索引**
6. **ORDER BY / GROUP BY 的列考虑建索引**（避免 filesort）

```sql
-- 计算区分度
SELECT COUNT(DISTINCT name) / COUNT(*) FROM user;
-- 区分度接近 1 适合建索引，接近 0 不适合
```

---

### Q10: 前缀索引是什么？

**难度**: ⭐⭐

**答案**: 前缀索引是对字符串列的前 N 个字符建立索引，减少索引大小。

**解析**:
```sql
-- 对 name 列的前 10 个字符建索引
CREATE INDEX idx_name ON user(name(10));

-- 优点：索引更小，节省空间
-- 缺点：无法使用覆盖索引（索引不包含完整列值）
```

---

## 二、事务与锁（10题）

### Q11: 事务的 ACID 特性？

**难度**: ⭐⭐

**答案**:
- **原子性（Atomicity）**：事务中的操作要么全部成功，要么全部回滚（undo log 保证）
- **一致性（Consistency）**：事务前后数据满足完整性约束
- **隔离性（Isolation）**：并发事务之间互不影响（锁 + MVCC 保证）
- **持久性（Durability）**：事务提交后数据永久保存（redo log 保证）

---

### Q12: MySQL 的四种隔离级别？

**难度**: ⭐⭐

**答案**:

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | MySQL 默认 |
|---------|------|-----------|------|-----------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | |
| READ COMMITTED | 不可能 | 可能 | 可能 | |
| **REPEATABLE READ** | 不可能 | 不可能 | 可能 | 是 |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 | |

**解析**: MySQL InnoDB 在 RR 级别通过 MVCC + Next-Key Lock 在很大程度上避免了幻读。

---

### Q13: MVCC 的实现原理？

**难度**: ⭐⭐⭐

**答案**: MVCC（多版本并发控制）通过隐藏列 + undo log + ReadView 实现读不阻塞。

**解析**:
- 每行数据有两个隐藏列：`trx_id`（最后修改的事务 ID）和 `roll_pointer`（指向 undo log 的指针）
- 每条记录有多个版本，通过 undo log 链表连接
- **ReadView**：事务开始时创建的"快照"，决定事务能看到哪些版本

ReadView 的四个核心字段：
- `m_ids`：活跃事务 ID 列表
- `min_trx_id`：最小活跃事务 ID
- `max_trx_id`：下一个待分配的事务 ID
- `creator_trx_id`：创建该 ReadView 的事务 ID

可见性判断规则：
1. `trx_id == creator_trx_id`：当前事务修改的，可见
2. `trx_id < min_trx_id`：事务已提交，可见
3. `trx_id >= max_trx_id`：事务在 ReadView 创建后开始，不可见
4. `min_trx_id <= trx_id < max_trx_id`：如果在 `m_ids` 中则不可见，否则可见

---

### Q14: RC 和 RR 级别下 ReadView 的区别？

**难度**: ⭐⭐⭐

**答案**:
- **RC（Read Committed）**：每次 SELECT 都创建新的 ReadView，能看到其他事务已提交的最新数据
- **RR（Repeatable Read）**：事务第一次 SELECT 时创建 ReadView，后续复用，保证可重复读

**解析**:
```sql
-- RC 级别
-- 事务A                              -- 事务B
BEGIN;                                BEGIN;
SELECT balance FROM account WHERE id=1; -- 100
                                      UPDATE account SET balance=200 WHERE id=1;
                                      COMMIT;
SELECT balance FROM account WHERE id=1; -- 200（新 ReadView）
-- 不可重复读！

-- RR 级别
-- 事务A                              -- 事务B
BEGIN;                                BEGIN;
SELECT balance FROM account WHERE id=1; -- 100
                                      UPDATE account SET balance=200 WHERE id=1;
                                      COMMIT;
SELECT balance FROM account WHERE id=1; -- 100（复用 ReadView）
-- 可重复读！
```

---

### Q15: InnoDB 的锁类型有哪些？

**难度**: ⭐⭐⭐

**答案**:

| 锁类型 | 范围 | 说明 |
|--------|------|------|
| 记录锁（Record Lock） | 单行 | 锁定索引记录 |
| 间隙锁（Gap Lock） | 间隙 | 锁定索引记录之间的间隙（防止插入） |
| 临键锁（Next-Key Lock） | 记录+间隙 | 记录锁 + 间隙锁（左开右闭） |
| 意向锁（Intention Lock） | 表级 | 快速判断表中是否有行锁 |

**解析**:
- InnoDB 的行锁是**加在索引上的**，不是加在数据行上
- 如果没有使用索引，行锁会退化为表锁
- Next-Key Lock 是 InnoDB 在 RR 级别默认使用的锁，用于防止幻读

---

### Q16: 什么是死锁？如何排查和避免？

**难度**: ⭐⭐⭐

**答案**: 死锁是两个或多个事务互相等待对方释放锁，导致所有事务都无法继续。

**解析**:
```sql
-- 死锁示例
-- 事务A                    -- 事务B
BEGIN;                     BEGIN;
UPDATE t SET a=1 WHERE id=1;  UPDATE t SET b=1 WHERE id=2;
UPDATE t SET b=1 WHERE id=2;  -- 等待事务A释放 id=2 的锁
                              UPDATE t SET a=1 WHERE id=1;
                              -- 等待事务A释放 id=1 的锁 -> 死锁！
```

- 排查方式：
  1. `SHOW ENGINE INNODB STATUS` 查看最近一次死锁信息
  2. 开启死锁日志：`innodb_print_all_deadlocks = ON`
  3. 查看 `performance_schema.data_lock_waits`（MySQL 8.0+，替代已移除的 information_schema.INNODB_LOCK_WAITS）

- 避免死锁：
  1. 按固定顺序访问表和行
  2. 保持事务简短
  3. 使用合适的隔离级别
  4. 设置 `innodb_lock_wait_timeout`

---

### Q17: 什么是当前读和快照读？

**难度**: ⭐⭐⭐

**答案**:
- **快照读（Snapshot Read）**：读取的是数据的可见版本（MVCC），不加锁。普通 SELECT 属于快照读
- **当前读（Current Read）**：读取的是最新数据，加锁。`UPDATE`、`DELETE`、`SELECT ... FOR UPDATE`、`SELECT ... LOCK IN SHARE MODE` 属于当前读

**解析**:
```sql
-- 快照读（不加锁）
SELECT * FROM account WHERE id = 1;

-- 当前读（加锁）
SELECT * FROM account WHERE id = 1 FOR UPDATE;       -- 排他锁
SELECT * FROM account WHERE id = 1 LOCK IN SHARE MODE; -- 共享锁
UPDATE account SET balance = 200 WHERE id = 1;        -- 排他锁
```

---

### Q18: 乐观锁和悲观锁的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | 悲观锁 | 乐观锁 |
|--------|--------|--------|
| 思想 | 假设会冲突，先加锁 | 假设不冲突，提交时检查 |
| 实现 | SELECT ... FOR UPDATE | 版本号/时间戳 |
| 并发性能 | 低（阻塞等待） | 高（无阻塞） |
| 适用场景 | 写多读少 | 读多写少 |
| 死锁风险 | 有 | 无 |

```sql
-- 悲观锁
SELECT * FROM account WHERE id = 1 FOR UPDATE;
UPDATE account SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- 乐观锁（版本号）
UPDATE account SET balance = balance - 100, version = version + 1
WHERE id = 1 AND version = 10;
-- 影响行数为 0 表示版本冲突
```

---

### Q19: 行锁升级为表锁的场景？

**难度**: ⭐⭐

**答案**: 当 WHERE 条件没有使用索引时，InnoDB 的行锁会退化为表锁。

**解析**:
```sql
-- 使用索引 -> 行锁
UPDATE user SET name = 'Alice' WHERE id = 1;  -- id 是主键索引

-- 没有使用索引 -> 表锁
UPDATE user SET name = 'Alice' WHERE age = 20; -- age 没有索引
```

- 原因：没有索引时，InnoDB 无法定位到具体行，只能锁住所有扫描到的行（全表扫描 = 表锁）
- 解决方案：确保 WHERE 条件使用索引

---

### Q20: gap lock 的作用？

**难度**: ⭐⭐⭐

**答案**: 间隙锁（Gap Lock）用于锁定索引记录之间的间隙，防止其他事务在间隙中插入新记录，从而避免幻读。

**解析**:
```sql
-- 假设 id 有 1, 5, 10
SELECT * FROM t WHERE id = 7 FOR UPDATE;
-- 加间隙锁 (1, 5) 和 (5, 10)，阻止其他事务插入 id=2,3,4,6,7,8,9

-- 注意：间隙锁之间不互斥！
-- 事务A: SELECT * FROM t WHERE id = 7 FOR UPDATE; -- 加间隙锁
-- 事务B: SELECT * FROM t WHERE id = 7 FOR UPDATE; -- 可以获取相同的间隙锁
-- 但事务A和B都不能 INSERT id=7 的记录
```

---

## 三、SQL 优化（6题）

### Q21: EXPLAIN 的关键字段有哪些？

**难度**: ⭐⭐

**答案**:

| 字段 | 说明 |
|------|------|
| **type** | 访问类型（性能从好到差：system > const > eq_ref > ref > range > index > ALL） |
| **key** | 实际使用的索引 |
| **key_len** | 使用的索引长度 |
| **rows** | 预估扫描行数 |
| **filtered** | 过滤比例 |
| **Extra** | 额外信息（Using index、Using filesort、Using temporary 等） |

**解析**:
- `type = ALL`：全表扫描，需要优化
- `type = index`：索引全扫描
- `type = range`：索引范围扫描
- `type = ref`：索引等值查询（非唯一）
- `type = eq_ref`：唯一索引等值查询
- `Extra = Using filesort`：需要额外排序，考虑优化索引
- `Extra = Using temporary`：使用临时表，考虑优化

---

### Q22: 如何优化慢查询？

**难度**: ⭐⭐

**答案**: 慢查询优化步骤：
1. 开启慢查询日志：`slow_query_log = ON`，`long_query_time = 1`
2. 使用 EXPLAIN 分析执行计划
3. 常见优化手段：
   - 添加合适的索引
   - 避免 `SELECT *`，只查需要的列
   - 避免 `IN` 子查询，改用 `JOIN`
   - 避免大事务
   - 使用覆盖索引减少回表
   - 分页优化（深分页）

---

### Q23: 深分页如何优化？

**难度**: ⭐⭐⭐

**答案**: 深分页（如 `LIMIT 1000000, 10`）性能差，因为 MySQL 需要扫描前 1000010 行再丢弃前 1000000 行。

**解析**:
```sql
-- 方案1：游标分页（推荐）
SELECT * FROM user WHERE id > 1000000 LIMIT 10;

-- 方案2：子查询优化
SELECT * FROM user WHERE id IN (
    SELECT id FROM user ORDER BY id LIMIT 1000000, 10
);

-- 方案3：延迟关联
SELECT u.* FROM user u
INNER JOIN (SELECT id FROM user ORDER BY id LIMIT 1000000, 10) t
ON u.id = t.id;

-- 方案4：覆盖索引 + 子查询
SELECT * FROM user u
INNER JOIN (SELECT id FROM user WHERE create_time > '2024-01-01' LIMIT 1000000, 10) t
ON u.id = t.id;
```

---

### Q24: JOIN 优化有哪些策略？

**难度**: ⭐⭐

**答案**:
1. **小表驱动大表**：`SELECT * FROM 小表 JOIN 大表 ON ...`
2. **被驱动表的 JOIN 字段加索引**
3. **避免 SELECT ***，只查需要的列
4. **增大 join_buffer_size**
5. **使用 STRAIGHT_JOIN 强制指定驱动顺序**

```sql
-- 确保 user.id 有索引
SELECT o.* FROM orders o
INNER JOIN user u ON o.user_id = u.id
WHERE u.status = 1;
```

---

### Q25: COUNT(*) 优化？

**难度**: ⭐⭐

**答案**:
- `COUNT(*)` 和 `COUNT(1)` 效率相同，InnoDB 会选择最小的辅助索引遍历
- `COUNT(字段)` 需要判断字段是否为 NULL，效率略低
- MyISAM 存储了行数，`COUNT(*)` 是 O(1)；InnoDB 需要遍历索引

```sql
-- 大表 COUNT 优化：使用 Redis 计数器或单独的统计表
-- INSERT/DELETE 时维护计数
```

---

### Q26: 如何查看和优化 SQL 执行计划？

**难度**: ⭐⭐

**答案**:
```sql
-- 使用 EXPLAIN
EXPLAIN SELECT * FROM user WHERE name = 'Alice';

-- 使用 EXPLAIN ANALYZE（MySQL 8.0+，实际执行并返回详细耗时）
EXPLAIN ANALYZE SELECT * FROM user WHERE name = 'Alice';

-- 使用 Profile（MySQL 8.0 已移除）
-- 替代方案：Performance Schema
```

---

## 四、日志体系（6题）

### Q27: redo log 的作用？

**难度**: ⭐⭐

**答案**: redo log（重做日志）记录的是物理日志（"对哪个数据页的哪个偏移量做了什么修改"），用于保证事务的**持久性**。崩溃恢复时通过 redo log 重放已提交的事务。

**解析**:
- WAL（Write-Ahead Logging）机制：先写日志，再写磁盘
- redo log 是循环写（固定大小），写满后覆盖旧日志
- redo log 分为两部分：redo log buffer（内存）和 redo log file（磁盘）
- `innodb_flush_log_at_trx_commit = 1`：每次事务提交都刷盘（最安全）

---

### Q28: undo log 的作用？

**难度**: ⭐⭐

**答案**: undo log（回滚日志）记录的是逻辑日志（"将某行从值 A 改为值 B"），用于保证事务的**原子性**（回滚）和 **MVCC**（多版本）。

**解析**:
- 事务回滚时，通过 undo log 将数据恢复到修改前的状态
- MVCC 通过 undo log 构建数据的历史版本链
- undo log 也需要持久化（记录在 redo log 中）

---

### Q29: binlog 的作用？

**难度**: ⭐⭐

**答案**: binlog（归档日志）记录的是逻辑日志（SQL 语句或行变更），用于**主从复制**和**数据恢复**。

**解析**:
- binlog 是 MySQL Server 层的日志，所有存储引擎都有
- redo log 是 InnoDB 引擎层的日志
- 三种格式：
  - `STATEMENT`：记录 SQL 语句（可能有主从不一致问题）
  - `ROW`：记录行变更（推荐，数据一致性好但日志量大）
  - `MIXED`：自动选择

---

### Q30: 两阶段提交（2PC）的流程？

**难度**: ⭐⭐⭐

**答案**: 两阶段提交保证 redo log 和 binlog 的一致性。

**解析**:
```
prepare 阶段：
  1. 将 redo log 刷盘（标记为 prepare 状态）
  2. 将 binlog 写入 binlog cache

commit 阶段：
  3. 将 binlog 刷盘
  4. 将 redo log 标记为 commit 状态

崩溃恢复：
  - redo log prepare + binlog 存在 -> 提交
  - redo log prepare + binlog 不存在 -> 回滚
```

---

### Q31: 一条 UPDATE 语句的完整执行流程？

**难度**: ⭐⭐⭐

**答案**:
```
UPDATE user SET name = 'Alice' WHERE id = 1;

1. 客户端 -> 连接器（认证）
2. 查询缓存（8.0 跳过）
3. 解析器（词法分析 + 语法分析 -> AST）
4. 优化器（选择索引：id 是主键）
5. 执行器：
   a. 调用 InnoDB 引擎接口
   b. 查找 id=1 的行（如果不在 Buffer Pool，从磁盘加载）
   c. 加行锁（X Lock）
   d. 将旧值写入 undo log
   e. 更新内存中的数据（Buffer Pool）
   f. 将更新操作写入 redo log（prepare）
   g. 写入 binlog
   h. 将 redo log 标记为 commit
   i. 返回影响行数
```

---

### Q32: Buffer Pool 的作用？

**难度**: ⭐⭐

**答案**: Buffer Pool 是 InnoDB 的内存缓存区域，缓存数据页和索引页，减少磁盘 IO。

**解析**:
- 页大小默认 16KB
- 脏页（修改后未刷盘的页）通过后台线程定期刷盘
- `innodb_buffer_pool_size` 通常设置为物理内存的 60%-70%
- 缓存淘汰策略：LRU（最近最少使用），但做了优化（冷热数据分离）

---

## 五、主从复制（4题）

### Q33: MySQL 主从复制的流程？

**难度**: ⭐⭐

**答案**:
```
Master                          Slave
  |                               |
  |-- binlog dump thread -------->| IO Thread（拉取 binlog）
  |                               |-- 写入 relay log
  |                               |-- SQL Thread（重放 relay log）
```

1. Master 将变更写入 binlog
2. Slave 的 IO Thread 连接 Master，请求 binlog
3. Master 的 dump thread 发送 binlog 事件
4. Slave 的 IO Thread 接收并写入 relay log
5. Slave 的 SQL Thread 读取 relay log 并重放

---

### Q34: binlog 的三种格式及区别？

**难度**: ⭐⭐

**答案**:

| 格式 | 内容 | 优点 | 缺点 |
|------|------|------|------|
| STATEMENT | SQL 语句 | 日志量小 | 主从不一致（now()、UUID 等） |
| ROW | 行变更 | 数据一致 | 日志量大 |
| MIXED | 自动选择 | 折中 | 行为不可预测 |

**解析**: 推荐使用 `ROW` 格式，数据一致性最好。

---

### Q35: 主从延迟的原因和解决方案？

**难度**: ⭐⭐⭐

**答案**:
原因：
1. Slave 单线程重放（MySQL 5.6 之前）
2. 大事务（批量 UPDATE/DELETE）
3. Slave 硬件性能差
4. 网络延迟

解决方案：
1. **并行复制**（MySQL 5.7+）：`slave_parallel_workers > 1`
2. **半同步复制**：Master 等待至少一个 Slave 确认
3. **读写分离**：写走 Master，读走 Slave（接受短暂延迟）
4. **GTID 复制**：全局事务 ID，便于故障切换

---

### Q36: 如何解决主从数据不一致？

**难度**: ⭐⭐

**答案**:
1. 使用 `ROW` 格式 binlog
2. 使用半同步复制
3. 定期使用 `pt-table-checksum` 校验数据一致性
4. 不一致时使用 `pt-table-sync` 修复

---

## 六、分库分表（4题）

### Q37: 什么情况下需要分库分表？

**难度**: ⭐⭐

**答案**:
- **分库**：单库并发连接数接近上限（如 MySQL 默认 151 个连接）
- **分表**：单表数据量超过 500 万~1000 万行，查询性能下降

**解析**:
- 垂直拆分：按业务模块拆分到不同数据库（如用户库、订单库）
- 水平拆分：同一张表按某个规则拆分到多张表/多个库

---

### Q38: 分库分表后如何处理跨库 JOIN？

**难度**: ⭐⭐⭐

**答案**:
1. **数据冗余**：将需要 JOIN 的字段冗余到另一张表
2. **应用层聚合**：在应用代码中分别查询再合并
3. **全局表**：字典表等小表在每个库都保存一份
4. **使用中间件**：ShardingSphere 的跨库 JOIN 支持

---

### Q39: 分布式 ID 的生成方案？

**难度**: ⭐⭐

**答案**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| UUID | 简单 | 无序、太长、索引性能差 |
| 数据库自增 | 简单 | 单点、性能瓶颈 |
| 雪花算法（Snowflake） | 有序、高性能 | 时钟回拨问题 |
| Redis INCR | 高性能 | 依赖 Redis |
| Leaf-segment（美团） | 高性能、可用性好 | ID 不连续 |

**解析**: 雪花算法：`时间戳(41bit) + 机器ID(10bit) + 序列号(12bit)`

---

### Q40: 分库分表中间件有哪些？

**难度**: ⭐⭐

**答案**:
- **ShardingSphere**（Apache）：功能全面，支持读写分离、分库分表、分布式事务
- **MyCat**：基于 Cobar 演进，社区活跃度下降
- **Vitess**（Google）：基于 Kubernetes 的数据库中间件

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| B+ 树索引原理 | 极高 | 非叶子不存数据、叶子双向链表、3层2000万 |
| 聚簇索引 vs 非聚簇索引 | 极高 | 主键存行数据、辅助索引存主键值、回表 |
| 最左前缀原则 | 极高 | 从最左列开始、不能跳列、范围后截断 |
| 索引失效场景 | 高 | 函数、运算、隐式转换、左模糊、OR |
| MVCC 原理 | 高 | 隐藏列 + undo log + ReadView |
| 事务隔离级别 | 高 | RC/RR 区别、ReadView 创建时机 |
| 锁类型 | 高 | 记录锁、间隙锁、临键锁、意向锁 |
| 死锁排查 | 中 | SHOW ENGINE INNODB STATUS、innodb_print_all_deadlocks |
| 两阶段提交 | 中 | redo log prepare -> binlog -> redo log commit |
| 深分页优化 | 中 | 游标分页、延迟关联、子查询 |
