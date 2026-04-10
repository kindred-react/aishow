# 数据库与 ORM 知识体系

> 面向 5 年经验 Java 工程师面试知识储备 | 从 React 转型 Java 快速掌握核心知识

---

## 一、MySQL 基础

### 1.1 MySQL 架构

MySQL 采用 **客户端/服务端** 架构，整体分为两层：

```
┌─────────────────────────────────────────────────────┐
│                   客户端（JDBC / Navicat / CLI）      │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  Server 层（连接层 + SQL层 + 优化器）    │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  连接池/认证  │ │ SQL 解析器   │ │  查询优化器   │  │
│  └─────────────┘ └──────────────┘ └──────────────┘  │
│  ┌─────────────────────────────────────────────┐    │
│  │           查询缓存（8.0 已移除）              │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              存储引擎层（可插拔）                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  InnoDB  │ │  MyISAM  │ │  Memory  │            │
│  └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────┘
```

**Server 层核心组件：**

| 组件 | 职责 |
|------|------|
| 连接器 | 管理连接、权限认证（`mysql -u root -p`） |
| 查询缓存 | 缓存 SELECT 结果（MySQL 8.0 已移除） |
| 解析器 | 词法分析 + 语法分析，生成 AST |
| 优化器 | 选择执行计划（索引选择、JOIN 顺序） |
| 执行器 | 调用存储引擎 API 执行查询 |

**一条 SQL 的执行流程：**

```sql
SELECT name, age FROM user WHERE id = 1;
```

```
客户端 → 连接器(认证) → 查询缓存(8.0跳过) → 解析器(AST) → 优化器(选索引) → 执行器(调引擎) → 返回结果
```

### 1.2 InnoDB vs MyISAM

| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| 事务 | **支持** | 不支持 |
| 锁粒度 | **行级锁** | 表级锁 |
| 外键 | **支持** | 不支持 |
| 崩溃恢复 | **支持**（Redo Log） | 不支持 |
| MVCC | **支持** | 不支持 |
| 全文索引 | 支持（5.6+） | 支持 |
| 存储结构 | 表空间（.ibd） | .MYD + .MYI |
| COUNT(*) | 需遍历 | 直接存储行数 |
| 适用场景 | 高并发 OLTP | 读多写少、不需事务 |

### 1.3 MySQL 存储引擎选择

```sql
-- 查看当前支持的存储引擎
SHOW ENGINES;

-- 查看表使用的存储引擎
SHOW TABLE STATUS LIKE 'user';

-- 创建表时指定存储引擎
CREATE TABLE user (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**选择建议：**

- **绝大多数场景选 InnoDB**：支持事务、行锁、MVCC、崩溃恢复
- **只读日志表 / 配置表** 可考虑 MyISAM（利用 COUNT(*) 快速统计）
- **内存临时表** 用 Memory 引擎（重启丢失）

> ⭐ **面试高频问题：InnoDB 为什么推荐作为默认存储引擎？**
>
> 1. 支持事务，保证数据一致性（ACID）
> 2. 行级锁，并发性能远优于 MyISAM 的表锁
> 3. 支持 MVCC，读写不冲突
> 4. 支持外键约束，保证引用完整性
> 5. 崩溃恢复能力（Redo Log + Undo Log）

---

## 二、索引（重点！面试最高频）

### 2.1 索引类型

```sql
-- 1. 主键索引（Primary Key）—— 自动创建，唯一且非空
ALTER TABLE user ADD PRIMARY KEY (id);

-- 2. 唯一索引（Unique）—— 值唯一，允许 NULL
CREATE UNIQUE INDEX uk_email ON user(email);

-- 3. 普通索引（Normal）—— 无约束
CREATE INDEX idx_name ON user(name);

-- 4. 组合索引（Composite）—— 多列联合
CREATE INDEX idx_name_age ON user(name, age);

-- 5. 全文索引（FullText）—— 文本搜索
CREATE FULLTEXT INDEX ft_content ON article(content);

-- 查看索引
SHOW INDEX FROM user;

-- 删除索引
DROP INDEX idx_name ON user;
```

### 2.2 B+ 树索引结构

**B+ 树的核心特征：**

```
                    [30 | 60]
                   /          \
            [10|20]            [40|50|70]
           /    \              /    |    \
        [数据]  [数据]      [数据] [数据] [数据]
```

- **非叶子节点**：只存储键值（不存数据），节点更大，每层能存更多键
- **叶子节点**：存储所有数据，并通过**双向链表**连接
- **层级浅**：3 层 B+ 树可存储约 2000 万条记录（假设页大小 16KB）

**为什么不用其他数据结构？**

| 数据结构 | 不适合原因 |
|----------|-----------|
| **B 树** | 非叶子节点存数据 → 每层节点少 → 树更深 → IO 次数多；且不支持范围查询高效遍历 |
| **红黑树** | 二叉树，层级太深（2000 万条需要约 24 层），IO 次数爆炸 |
| **Hash** | 只支持等值查询（`=`, `IN`），不支持范围查询（`>`, `<`, `BETWEEN`）、排序、最左前缀 |
| **二叉查找树** | 可能退化为链表，查询 O(n) |

> ⭐ **面试高频问题：为什么 MySQL 索选用 B+ 树而不是 B 树？**
>
> 1. B+ 树非叶子节点不存数据，单个节点能存更多键，**树更矮**，减少磁盘 IO
> 2. B+ 树叶子节点形成**有序双向链表**，范围查询只需遍历叶子节点，效率极高
> 3. B+ 树的查询性能**稳定**，每次查询都到叶子节点，时间复杂度恒为 O(log n)
> 4. B 树范围查询需要在中序遍历中来回跳转，效率低

### 2.3 聚簇索引 vs 非聚簇索引

**聚簇索引（Clustered Index）：**

- InnoDB 的主键索引就是聚簇索引
- **叶子节点存储完整的行数据**
- 一张表只能有一个聚簇索引

**非聚簇索引（Secondary Index / 回表查询）：**

- 除主键外的索引
- **叶子节点存储主键值**，需要回表查完整数据

```
聚簇索引（主键 id）:          非聚簇索引（name）:
    [30]                        [Alice]
   /    \                      /       \
 [10]   [50]              [Bob]      [Carol]
  |      |                  |          |
[行数据] [行数据]          [id=10]    [id=30]
                          (需回表)    (需回表)
```

```sql
-- 回表示例：先查辅助索引得到主键，再查聚簇索引得到完整行
SELECT * FROM user WHERE name = 'Alice';
-- 1. 在 idx_name 上找到 name='Alice' → 得到 id=10
-- 2. 用 id=10 回聚簇索引查完整行数据

-- 覆盖索引：不需要回表
SELECT id, name FROM user WHERE name = 'Alice';
-- 索引 idx_name(name) 的叶子节点已有 name 和主键 id，无需回表
```

> ⭐ **面试高频问题：什么是回表？如何减少回表？**
>
> **回表**：通过辅助索引查到主键值后，再回到聚簇索引查询完整行数据的过程。每次回表多一次磁盘 IO。
>
> **减少回表的方法：**
> 1. **覆盖索引**：让查询的列都在索引中，`SELECT` 只选索引列
> 2. **组合索引**：将常用查询列组合到索引中
> 3. **索引下推（ICP）**：在索引层面先过滤，减少回表次数

### 2.4 覆盖索引

```sql
-- 假设有组合索引 idx_name_age(name, age)

-- ✅ 覆盖索引：查询列在索引中，Extra = Using index
SELECT name, age FROM user WHERE name = 'Alice';

-- ❌ 需要回表：查询了非索引列 email
SELECT name, age, email FROM user WHERE name = 'Alice';

-- ✅ 强制使用覆盖索引（不推荐，但了解原理）
SELECT name, age FROM user FORCE INDEX (idx_name_age) WHERE name = 'Alice';
```

### 2.5 最左前缀原则

```sql
-- 组合索引 idx_a_b_c(a, b, c)

-- ✅ 命中索引（使用了 a）
SELECT * FROM t WHERE a = 1;

-- ✅ 命中索引（使用了 a, b）
SELECT * FROM t WHERE a = 1 AND b = 2;

-- ✅ 命中索引（使用了 a, b, c）
SELECT * FROM t WHERE a = 1 AND b = 2 AND c = 3;

-- ✅ 命中索引（使用了 a, b —— c 用于范围后不参与索引）
SELECT * FROM t WHERE a = 1 AND b = 2 AND c > 3;

-- ❌ 未命中索引（跳过了 a）
SELECT * FROM t WHERE b = 2;

-- ❌ 未命中索引（跳过了 a）
SELECT * FROM t WHERE b = 2 AND c = 3;

-- ✅ 命中索引（MySQL 优化器会自动调整顺序）
SELECT * FROM t WHERE c = 3 AND a = 1 AND b = 2;

-- ✅ 命中索引（a 用于等值，b 用于范围）
SELECT * FROM t WHERE a = 1 AND b > 2 AND c = 3;
-- 注意：b 是范围查询后，c 无法使用索引！
```

> ⭐ **面试高频问题：什么是最左前缀原则？为什么会有这个原则？**
>
> B+ 树的叶子节点按索引列从左到右排序。先按 a 排序，a 相同按 b 排序，b 相同按 c 排序。
> 查询时必须从最左列开始匹配，跳过 a 直接查 b，无法确定 b 的有序位置。
>
> **注意**：最左前缀是针对索引列的顺序，不是 SQL 中 WHERE 条件的书写顺序（优化器会自动调整）。

### 2.6 索引下推（ICP，Index Condition Pushdown）

MySQL 5.6 引入的优化，在**存储引擎层**先过滤索引条件，减少回表次数。

```sql
-- 组合索引 idx_name_age(name, age)
SELECT * FROM user WHERE name LIKE 'A%' AND age = 20;

-- 没有 ICP（5.6 之前）：
-- 1. 存储引擎：通过 name LIKE 'A%' 在索引中找到匹配记录（4条）
-- 2. 存储引擎：回表查完整数据（4次回表）
-- 3. Server 层：过滤 age = 20（剩1条）

-- 有 ICP（5.6+）：
-- 1. 存储引擎：通过 name LIKE 'A%' AND age = 20 在索引中过滤（1条）
-- 2. 存储引擎：回表查完整数据（1次回表）
```

**EXPLAIN 中 `Using index condition` 表示使用了索引下推。**

### 2.7 索引失效场景（6 种）

```sql
-- 假设 name 列有索引 idx_name

-- ❌ 1. 对索引列使用函数
SELECT * FROM user WHERE LEFT(name, 3) = 'Ali';
-- ✅ 改写：
SELECT * FROM user WHERE name LIKE 'Ali%';

-- ❌ 2. 对索引列做运算
SELECT * FROM user WHERE age + 1 = 20;
-- ✅ 改写：
SELECT * FROM user WHERE age = 19;

-- ❌ 3. 隐式类型转换（string 列传 number）
-- phone 是 VARCHAR 类型
SELECT * FROM user WHERE phone = 13800138000;
-- ✅ 改写：
SELECT * FROM user WHERE phone = '13800138000';

-- ❌ 4. LIKE 以通配符 % 开头
SELECT * FROM user WHERE name LIKE '%Alice';
-- ✅ 改写（如果业务允许）：
SELECT * FROM user WHERE name LIKE 'Alice%';

-- ❌ 5. OR 连接中有一个列没有索引
SELECT * FROM user WHERE name = 'Alice' OR age = 20;
-- 如果 age 没有索引，整个查询不走索引

-- ❌ 6. IS NOT NULL（部分版本/场景下）
SELECT * FROM user WHERE name IS NOT NULL;
-- 优化器认为大部分值不为 NULL，全表扫描更快
```

> ⭐ **面试高频问题：列举索引失效的常见场景？**
>
> 1. 对索引列使用函数或运算
> 2. 隐式类型转换
> 3. LIKE 以 `%` 开头
> 4. 违反最左前缀原则
> 5. OR 条件中有无索引列
> 6. 优化器判断全表扫描更快（数据量小、区分度低）
> 7. 使用 `!=`、`NOT IN`（可能失效）
> 8. 对索引列使用 `IS NOT NULL`

### 2.8 索引优化建议

```sql
-- 1. 选择区分度高的列建索引
-- 区别度 = COUNT(DISTINCT col) / COUNT(*)，建议 > 0.8
SELECT COUNT(DISTINCT name) / COUNT(*) FROM user;

-- 2. 组合索引优于多个单列索引（减少索引数量，覆盖更多查询）

-- 3. 短索引优于长索引（前缀索引）
CREATE INDEX idx_email_prefix ON user(email(20));

-- 4. 不要在区分度低的列建索引（如性别，只有 0/1）

-- 5. WHERE、ORDER BY、GROUP BY 中频繁使用的列建索引

-- 6. 单表索引数量建议不超过 5 个

-- 7. 尽量使用覆盖索引，减少 SELECT *
```

### 2.9 EXPLAIN 执行计划分析

```sql
EXPLAIN SELECT * FROM user WHERE name = 'Alice' AND age = 20;
```

**核心字段解读：**

| 字段 | 含义 | 重点值 |
|------|------|--------|
| **type** | 访问类型 | 从优到差：`system` > `const` > `eq_ref` > `ref` > `range` > `index` > **`ALL`（全表扫描）** |
| **key** | 实际使用的索引 | `NULL` 表示未使用索引 |
| **key_len** | 索引使用的字节数 | 越短越好，可判断用了组合索引的几列 |
| **rows** | 预估扫描行数 | 越少越好 |
| **Extra** | 额外信息 | 见下表 |

**Extra 常见值：**

| 值 | 含义 |
|----|------|
| `Using index` | 覆盖索引，不回表（好！） |
| `Using where` | 在 Server 层过滤（还行） |
| `Using index condition` | 索引下推 ICP（好！） |
| `Using filesort` | 文件排序（需优化！） |
| `Using temporary` | 使用临时表（需优化！） |
| `Using index for group-by` | 松散索引扫描（好！） |

```sql
-- 实际案例
EXPLAIN SELECT name, age FROM user WHERE name = 'Alice';
-- type=ref, key=idx_name, Extra=Using index（覆盖索引）

EXPLAIN SELECT * FROM user WHERE age > 20 ORDER BY name;
-- 如果 age 没有索引：type=ALL, Extra=Using filesort（全表扫描+文件排序）

EXPLAIN SELECT name, COUNT(*) FROM user GROUP BY name;
-- 如果 name 有索引：type=range, Extra=Using index for group-by
```

> ⭐ **面试高频问题：EXPLAIN 中 type 字段有哪些值？哪些需要优化？**
>
> `system` > `const` > `eq_ref` > `ref` > `range` > `index` > `ALL`
>
> - `const`：主键/唯一索引等值查询，最多一条
> - `eq_ref`：JOIN 时关联表的唯一索引等值查询
> - `ref`：普通索引等值查询
> - `range`：索引范围扫描（`>`, `<`, `BETWEEN`, `IN`）
> - `index`：索引全扫描（比 ALL 好，但仍然不好）
> - `ALL`：全表扫描，**必须优化**

---

## 三、事务（重点！）

### 3.1 ACID 特性

| 特性 | 含义 | 实现机制 |
|------|------|----------|
| **A**tomicity（原子性） | 事务是最小执行单位，要么全成功要么全失败 | Undo Log |
| **C**onsistency（一致性） | 数据从一个一致状态到另一个一致状态 | AID + 业务约束 |
| **I**solation（隔离性） | 并发事务之间互不影响 | 锁 + MVCC |
| **D**urability（持久性） | 提交后数据永久保存 | Redo Log |

```java
// Spring 事务管理
@Service
public class OrderService {

    @Transactional  // 声明式事务
    public void createOrder(Order order) {
        orderMapper.insert(order);          // 插入订单
        inventoryMapper.deduct(order.getProductId(), order.getQuantity()); // 扣减库存
        // 如果任何一步失败，整个事务回滚
    }
}
```

### 3.2 四种隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|----------|------|-----------|------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 最高 |
| READ COMMITTED | 避免 | 可能 | 可能 | 高 |
| **REPEATABLE READ**（默认） | 避免 | 避免 | 可能* | 中 |
| SERIALIZABLE | 避免 | 避免 | 避免 | 最低 |

> MySQL InnoDB 在 RR 级别通过 MVCC + 间隙锁**很大程度上避免了幻读**，但并非完全避免。

```sql
-- 查看当前隔离级别
SELECT @@transaction_isolation;

-- 设置隔离级别
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### 3.3 并发事务问题

```sql
-- 脏读（读到了其他事务未提交的数据）
-- 事务A                          事务B
BEGIN;                           BEGIN;
UPDATE account SET balance=200
WHERE id=1;
                                 SELECT balance FROM account WHERE id=1;  -- 读到 200（脏读！）
ROLLBACK;
                                 -- 事务B读到的200是脏数据

-- 不可重复读（同一事务内两次读取结果不同）
-- 事务A                          事务B
BEGIN;                           BEGIN;
SELECT balance FROM account
WHERE id=1;  -- 结果：100
                                 UPDATE account SET balance=200 WHERE id=1;
                                 COMMIT;
SELECT balance FROM account
WHERE id=1;  -- 结果：200（不可重复读！）

-- 幻读（同一事务内两次查询行数不同）
-- 事务A                          事务B
BEGIN;                           BEGIN;
SELECT * FROM account
WHERE age > 18;  -- 5条
                                 INSERT INTO account(name, age) VALUES('新用户', 25);
                                 COMMIT;
SELECT * FROM account
WHERE age > 18;  -- 6条（幻读！）
```

> ⭐ **面试高频问题：MySQL 默认隔离级别是什么？为什么？**
>
> MySQL 默认 **REPEATABLE READ（可重复读）**。
>
> 原因：在大多数业务场景中，不可重复读是不可接受的（同一事务中多次读取应一致），而幻读的概率较低且可通过间隙锁防范。RR 级别在性能和一致性之间取得了较好的平衡。
>
> 对比：Oracle 默认 RC，PostgreSQL 默认 RC。

### 3.4 MVCC（多版本并发控制）

MVCC 是 InnoDB 实现高并发的核心机制，**读不加锁，读写不冲突**。

#### 3.4.1 隐藏字段

每行数据有两个隐藏字段：

| 字段 | 大小 | 含义 |
|------|------|------|
| `DB_TRX_ID` | 6 字节 | 最近修改（插入/更新）该行的**事务 ID** |
| `DB_ROLL_PTR` | 7 字节 | **回滚指针**，指向 Undo Log 中的旧版本 |
| `DB_ROW_ID` | 6 字节 | 隐藏主键（无主键时自动生成） |

```
当前行数据（版本3）:
┌──────┬───────┬────────────┬─────────────┐
│ id=1 │ name='Charlie' │ DB_TRX_ID=103 │ DB_ROLL_PTR → │
└──────┴───────┴────────────┴─────────────┘
                                         │
                                         ▼
                              Undo Log（版本2）:
                              ┌──────┬────────────┬─────────────┐
                              │ name='Bob'  │ DB_TRX_ID=102 │ DB_ROLL_PTR → │
                              └────────────┴────────────┴─────────────┘
                                                                   │
                                                                   ▼
                                                        Undo Log（版本1）:
                                                        ┌────────────┬─────────────┐
                                                        │ name='Alice' │ DB_TRX_ID=101 │ NULL │
                                                        └────────────┴─────────────┘
```

#### 3.4.2 Undo Log 版本链

每次修改一行数据时，旧版本被记录到 Undo Log 中，通过 `DB_ROLL_PTR` 形成版本链。

```sql
-- 版本链示例
-- 事务101: INSERT INTO user(id, name) VALUES(1, 'Alice');   → 版本1
-- 事务102: UPDATE user SET name='Bob' WHERE id=1;            → 版本2
-- 事务103: UPDATE user SET name='Charlie' WHERE id=1;        → 版本3
```

#### 3.4.3 Read View

Read View 是事务在某个时刻的**可见性快照**，决定事务能看到哪些版本。

**Read View 核心字段：**

| 字段 | 含义 |
|------|------|
| `m_ids` | 生成 Read View 时所有活跃（未提交）事务 ID 列表 |
| `min_trx_id` | `m_ids` 中最小的事务 ID |
| `max_trx_id` | 生成 Read View 时系统应分配给下一个事务的 ID |
| `creator_trx_id` | 创建该 Read View 的事务 ID |

**可见性判断规则：**

```
对于版本链中的每个版本（DB_TRX_ID）：

1. DB_TRX_ID == creator_trx_id → ✅ 可见（自己的修改）
2. DB_TRX_ID < min_trx_id → ✅ 可见（在 Read View 之前已提交）
3. DB_TRX_ID >= max_trx_id → ❌ 不可见（在 Read View 之后才开启）
4. min_trx_id <= DB_TRX_ID < max_trx_id:
   - DB_TRX_ID 在 m_ids 中 → ❌ 不可见（事务未提交）
   - DB_TRX_ID 不在 m_ids 中 → ✅ 可见（事务已提交）
```

**RC vs RR 级别的区别：**

| 级别 | Read View 生成时机 | 效果 |
|------|-------------------|------|
| **RC**（读已提交） | **每次 SELECT** 都生成新的 Read View | 每次读到最新已提交数据 → 不可重复读 |
| **RR**（可重复读） | **事务第一次 SELECT** 时生成，后续复用 | 整个事务读到一致快照 → 可重复读 |

> ⭐ **面试高频问题：详细描述 MVCC 的实现原理？**
>
> 1. 每行数据隐藏 `DB_TRX_ID`（最近修改事务 ID）和 `DB_ROLL_PTR`（回滚指针）
> 2. 修改数据时，旧版本写入 Undo Log，形成版本链
> 3. 事务读取时，通过 Read View 判断版本链中哪个版本可见
> 4. RC 级别每次 SELECT 新建 Read View，RR 级别事务首次 SELECT 创建后复用
> 5. 这样实现了**无锁读**，读写不冲突

### 3.5 锁机制

#### 3.5.1 共享锁（S 锁）vs 排他锁（X 锁）

```sql
-- 共享锁（S锁 / 读锁）：允许多个事务同时读，阻止其他事务获取 X 锁
SELECT * FROM user WHERE id = 1 LOCK IN SHARE MODE;
-- MySQL 8.0 写法：
SELECT * FROM user WHERE id = 1 FOR SHARE;

-- 排他锁（X锁 / 写锁）：阻止其他事务获取 S 锁和 X 锁
SELECT * FROM user WHERE id = 1 FOR UPDATE;

-- 普通 UPDATE/DELETE 自动加 X 锁
UPDATE user SET name = 'Bob' WHERE id = 1;  -- 自动加 X 锁
```

| 锁类型 | S 锁 | X 锁 |
|--------|------|------|
| S 锁 | 兼容 | 冲突 |
| X 锁 | 冲突 | 冲突 |

#### 3.5.2 记录锁、间隙锁、临键锁

```sql
-- 假设 user 表 id 列有值：1, 5, 10, 15

-- 记录锁（Record Lock）：锁定索引上的具体记录
-- 加锁范围：精确匹配的行
SELECT * FROM user WHERE id = 5 FOR UPDATE;
-- 锁定：id = 5 这一行

-- 间隙锁（Gap Lock）：锁定索引记录之间的间隙（防止插入）
-- 加锁范围：开区间
SELECT * FROM user WHERE id = 7 FOR UPDATE;
-- 锁定：(5, 10) 这个间隙，不允许 INSERT id=6/7/8/9

-- 临键锁（Next-Key Lock）：记录锁 + 间隙锁
-- 加锁范围：左开右闭区间
SELECT * FROM user WHERE id > 5 AND id < 15 FOR UPDATE;
-- 锁定：(5, 10] 和 (10, 15)
```

> ⭐ **面试高频问题：InnoDB 有哪些锁类型？**
>
> - **记录锁**：锁定单条索引记录
> - **间隙锁**：锁定索引记录之间的间隙，防止幻读（阻止 INSERT）
> - **临键锁**：记录锁 + 间隙锁，左开右闭区间，**InnoDB 在 RR 级别的默认加锁方式**
> - **意向锁**：表级锁，用于快速判断表中是否有行锁（IS / IX）
> - **插入意向锁**：特殊的间隙锁，INSERT 时使用，多个 INSERT 可以插入同一间隙

#### 3.5.3 意向锁

```sql
-- 意向锁是表级锁，由 InnoDB 自动添加
-- 在给行加 S 锁前，自动在表级加 IS 锁（意向共享锁）
-- 在给行加 X 锁前，自动在表级加 IX 锁（意向排他锁）

-- 意向锁之间兼容，但与表级 S/X 锁冲突
-- 作用：快速判断表中是否有行锁，避免逐行检查
```

#### 3.5.4 死锁检测与解决

```sql
-- 查看最近的死锁信息
SHOW ENGINE INNODB STATUS;

-- 查看当前锁等待情况
SELECT * FROM information_schema.INNODB_LOCK_WAITS;
SELECT * FROM performance_schema.data_lock_waits;  -- MySQL 8.0

-- 死锁日志示例：
-- LATEST DETECTED DEADLOCK
-- Transaction 1: waiting for lock held by Transaction 2
-- Transaction 2: waiting for lock held by Transaction 1
-- DEADLOCK DETECTED → 回滚代价最小的事务
```

**死锁示例：**

```java
// 事务1                              // 事务2
begin;                               begin;
UPDATE user SET age=20               UPDATE user SET age=30
  WHERE id=1;  -- 锁住 id=1            WHERE id=2;  -- 锁住 id=2
UPDATE user SET age=20               UPDATE user SET age=30
  WHERE id=2;  -- 等待 id=2...          WHERE id=1;  -- 等待 id=1...
// 死锁！互相等待对方持有的锁
```

**死锁解决方案：**

| 方案 | 说明 |
|------|------|
| 按固定顺序访问表和行 | 所有事务按相同顺序加锁 |
| 大事务拆小事务 | 减少锁持有时间 |
| 合理使用索引 | 避免行锁升级为表锁 |
| 设置锁等待超时 | `innodb_lock_wait_timeout = 50`（默认 50 秒） |
| 开启死锁检测 | `innodb_deadlock_detect = ON`（默认开启） |

> ⭐ **面试高频问题：如何排查和解决死锁？**
>
> 1. 通过 `SHOW ENGINE INNODB STATUS` 查看死锁日志
> 2. 分析两个事务的锁等待关系
> 3. 解决方案：按固定顺序加锁、减小事务粒度、使用合理索引、设置超时时间
> 4. InnoDB 默认开启死锁检测，自动回滚代价最小的事务

---

## 四、SQL 优化

### 4.1 SQL 执行顺序

```sql
-- SQL 书写顺序 vs 执行顺序
-- 书写顺序：                    执行顺序：
SELECT column1, SUM(column2)     6. SELECT（投影列）
FROM table1                      1. FROM（加载表数据）
JOIN table2 ON condition         2. JOIN（连接表）
WHERE condition                  3. WHERE（过滤行）
GROUP BY column1                 4. GROUP BY（分组）
HAVING condition                 5. HAVING（过滤分组）
ORDER BY column1                 7. ORDER BY（排序）
LIMIT 10                         8. LIMIT（截取）
```

```sql
-- 实际案例：理解执行顺序的重要性
SELECT dept, AVG(salary) AS avg_salary
FROM employee
WHERE status = 'active'
GROUP BY dept
HAVING avg_salary > 10000
ORDER BY avg_salary DESC
LIMIT 5;

-- 执行过程：
-- 1. FROM employee → 加载全表数据
-- 2. WHERE status = 'active' → 过滤在职员工
-- 3. GROUP BY dept → 按部门分组
-- 4. HAVING avg_salary > 10000 → 过滤平均薪资>1万的部门
--    ⚠️ 注意：HAVING 中不能用 WHERE 的别名！因为 HAVING 在 SELECT 之前
-- 5. SELECT dept, AVG(salary) → 计算平均薪资
-- 6. ORDER BY avg_salary DESC → 排序
-- 7. LIMIT 5 → 取前5条
```

### 4.2 慢查询日志

```sql
-- 查看慢查询日志状态
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';

-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过1秒记录

-- 慢查询日志位置
-- /var/lib/mysql/hostname-slow.log

-- 使用 mysqldumpslow 分析
-- mysqldumpslow -s t -t 10 /var/lib/mysql/slow.log
-- -s t: 按查询时间排序
-- -t 10: 显示前10条
```

**my.cnf 配置：**

```ini
[mysqld]
slow_query_log = 1
slow_query_log_file = /var/lib/mysql/slow.log
long_query_time = 1
log_queries_not_using_indexes = 1  # 记录未使用索引的查询
```

### 4.3 常见 SQL 优化技巧

```sql
-- 1. 避免 SELECT *
-- ❌
SELECT * FROM user WHERE id = 1;
-- ✅ 只查需要的列
SELECT id, name, email FROM user WHERE id = 1;

-- 2. 用 EXISTS 替代 IN（子查询结果集大时）
-- ❌
SELECT * FROM `order` WHERE user_id IN (SELECT id FROM user WHERE status = 'active');
-- ✅
SELECT * FROM `order` o WHERE EXISTS (SELECT 1 FROM user u WHERE u.id = o.user_id AND u.status = 'active');

-- 3. 避免在 WHERE 中对列使用 OR（改用 UNION）
-- ❌
SELECT * FROM user WHERE status = 'active' OR role = 'admin';
-- ✅（如果 status 和 role 分别有索引）
SELECT * FROM user WHERE status = 'active'
UNION
SELECT * FROM user WHERE role = 'admin';

-- 4. 批量插入代替逐条插入
-- ❌
INSERT INTO user(name, age) VALUES('a', 20);
INSERT INTO user(name, age) VALUES('b', 21);
-- ✅
INSERT INTO user(name, age) VALUES('a', 20), ('b', 21);

-- 5. 用 LIMIT 1 确保只需要一条结果时
SELECT * FROM user WHERE email = 'test@example.com' LIMIT 1;

-- 6. 避免在 WHERE 子句中使用 != 或 <>
-- ❌
SELECT * FROM user WHERE status != 'deleted';
-- ✅
SELECT * FROM user WHERE status IN ('active', 'inactive');
```

### 4.4 分页优化（深分页问题）

```sql
-- ❌ 深分页问题：LIMIT offset, size
-- 当 offset 很大时，MySQL 需要扫描 offset + size 条记录，然后丢弃前 offset 条
SELECT * FROM user ORDER BY id LIMIT 1000000, 10;
-- 实际扫描了 1000010 条记录，只返回 10 条

-- ✅ 方案1：游标分页（推荐）
-- 记住上一页最后一条的 id
SELECT * FROM user WHERE id > 1000000 ORDER BY id LIMIT 10;

-- ✅ 方案2：子查询优化（利用覆盖索引）
SELECT * FROM user
WHERE id >= (SELECT id FROM user ORDER BY id LIMIT 1000000, 1)
ORDER BY id LIMIT 10;

-- ✅ 方案3：延迟关联
SELECT u.* FROM user u
INNER JOIN (SELECT id FROM user ORDER BY id LIMIT 1000000, 10) t
ON u.id = t.id;
```

> ⭐ **面试高频问题：如何优化深分页查询？**
>
> 1. **游标分页**（推荐）：`WHERE id > last_id LIMIT size`，前端配合使用
> 2. **延迟关联**：先通过覆盖索引查出主键，再关联查完整数据
> 3. **子查询优化**：先查 offset 位置的主键值，再从该位置开始查
> 4. **禁止大 offset**：产品层面限制最大页数（如最多翻 100 页）

### 4.5 JOIN 优化

```sql
-- 小表驱动大表（减少循环次数）
-- 假设 A 表 100 条，B 表 10000 条
-- ✅ 小表 A 驱动大表 B
SELECT * FROM A JOIN B ON A.id = B.a_id;
-- 等价于：for (a in A) { for (b in B) { if (a.id == b.a_id) } }
-- 循环次数：100 * 索引查找

-- ❌ 大表 B 驱动小表 A
-- 循环次数：10000 * 索引查找

-- 确保 JOIN 的关联列有索引
CREATE INDEX idx_b_a_id ON B(a_id);

-- 避免使用 LEFT JOIN（能用 INNER JOIN 就不用 LEFT JOIN）
-- LEFT JOIN 会返回左表所有行，即使右表无匹配
```

### 4.6 子查询优化

```sql
-- ❌ 标量子查询（每行执行一次子查询）
SELECT u.name,
       (SELECT COUNT(*) FROM `order` o WHERE o.user_id = u.id) AS order_count
FROM user u;

-- ✅ 改写为 LEFT JOIN
SELECT u.name, COALESCE(o.order_count, 0) AS order_count
FROM user u
LEFT JOIN (SELECT user_id, COUNT(*) AS order_count FROM `order` GROUP BY user_id) o
ON u.id = o.user_id;

-- ❌ 相关子查询
SELECT * FROM user u
WHERE EXISTS (SELECT 1 FROM `order` o WHERE o.user_id = u.id AND o.amount > 1000);

-- ✅ 改写为 JOIN
SELECT DISTINCT u.* FROM user u
INNER JOIN `order` o ON o.user_id = u.id AND o.amount > 1000;
```

---

## 五、数据库设计

### 5.1 三大范式

**第一范式（1NF）：字段不可再分**

```sql
-- ❌ 违反1NF：联系方式字段包含多个值
CREATE TABLE user (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    contact VARCHAR(200)  -- "phone:13800138000,email:test@test.com"
);

-- ✅ 符合1NF：拆分为独立字段
CREATE TABLE user (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100)
);
```

**第二范式（2NF）：在1NF基础上，非主键列完全依赖于主键**

```sql
-- ❌ 违反2NF：组合主键(order_id, product_id)，但 product_name 只依赖 product_id
CREATE TABLE order_item (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- 只依赖 product_id
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- ✅ 符合2NF：拆分
CREATE TABLE product (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100)
);
CREATE TABLE order_item (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);
```

**第三范式（3NF）：在2NF基础上，非主键列直接依赖于主键（消除传递依赖）**

```sql
-- ❌ 违反3NF：dept_name 依赖 dept_id，dept_id 依赖 id（传递依赖）
CREATE TABLE user (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    dept_id INT,
    dept_name VARCHAR(50)  -- 传递依赖
);

-- ✅ 符合3NF：拆分
CREATE TABLE department (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(50)
);
CREATE TABLE user (
    id INT PRIMARY KEY,
    name VARCHAR(50),
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES department(dept_id)
);
```

### 5.2 反范式设计

在实际生产中，为了**性能**，通常会适当违反范式，增加冗余字段。

```sql
-- 范式设计：查询订单时需要 JOIN 用户表
SELECT o.id, o.amount, u.name AS user_name
FROM `order` o JOIN user u ON o.user_id = u.id;

-- 反范式设计：在订单表中冗余用户名（避免 JOIN）
CREATE TABLE `order` (
    id BIGINT PRIMARY KEY,
    user_id BIGINT,
    user_name VARCHAR(50),  -- 冗余字段
    amount DECIMAL(10, 2),
    -- ...
);

-- 代价：用户改名时需要同步更新所有订单记录
-- 适用场景：读多写少、用户名很少变更
```

**反范式的常见手段：**

| 手段 | 示例 | 适用场景 |
|------|------|----------|
| 冗余字段 | 订单表冗余用户名 | 读多写少 |
| 计数器 | 文章表冗余点赞数 | 高频统计 |
| 汇总表 | 每日销售汇总表 | 报表查询 |
| 缓存表 | 热点数据缓存 | 高频读取 |

### 5.3 主键设计

```sql
-- 1. 自增 ID（推荐大多数场景）
CREATE TABLE user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
);
-- 优点：简单、有序、B+ 树插入效率高
-- 缺点：暴露数据量、分库分表时 ID 冲突

-- 2. UUID
CREATE TABLE user (
    id CHAR(36) PRIMARY KEY,  -- '550e8400-e29b-41d4-a716-446655440000'
    name VARCHAR(50)
);
-- 优点：全局唯一、分布式友好
-- 缺点：无序 → B+ 树频繁分裂、存储空间大、索引性能差

-- 3. 雪花算法（Snowflake）—— 推荐！
-- 64位 = 1位符号位 + 41位时间戳 + 10位机器ID + 12位序列号
```

**Java 雪花算法实现：**

```java
public class SnowflakeIdGenerator {
    private final long epoch = 1609459200000L; // 2021-01-01
    private final long machineIdBits = 10L;
    private final long sequenceBits = 12L;
    private final long maxMachineId = ~(-1L << machineIdBits);
    private final long maxSequence = ~(-1L << sequenceBits);

    private final long machineId;
    private long sequence = 0L;
    private long lastTimestamp = -1L;

    public SnowflakeIdGenerator(long machineId) {
        if (machineId < 0 || machineId > maxMachineId) {
            throw new IllegalArgumentException("Machine ID out of range");
        }
        this.machineId = machineId;
    }

    public synchronized long nextId() {
        long timestamp = System.currentTimeMillis();
        if (timestamp < lastTimestamp) {
            throw new RuntimeException("Clock moved backwards");
        }
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & maxSequence;
            if (sequence == 0) {
                timestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            sequence = 0L;
        }
        lastTimestamp = timestamp;
        return ((timestamp - epoch) << (machineIdBits + sequenceBits))
                | (machineId << sequenceBits)
                | sequence;
    }

    private long waitNextMillis(long lastTimestamp) {
        long timestamp = System.currentTimeMillis();
        while (timestamp <= lastTimestamp) {
            timestamp = System.currentTimeMillis();
        }
        return timestamp;
    }
}
```

> ⭐ **面试高频问题：为什么推荐雪花算法作为分布式主键？**
>
> 1. **趋势递增**：基于时间戳，大致有序，对 B+ 树友好
> 2. **全局唯一**：分布式环境下不冲突
> 3. **高性能**：本地生成，无需网络调用
> 4. **高可用**：不依赖数据库或 Redis
> 5. **信息可读**：ID 中包含时间戳，可反推生成时间

### 5.4 分库分表

**垂直拆分：按业务拆分**

```
单体数据库：
┌────────────────────────────┐
│ user表 | order表 | pay表    │
│ goods表 | log表 | config表  │
└────────────────────────────┘
         ↓ 垂直拆分
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 用户库        │  │ 订单库        │  │ 商品库        │
│ user         │  │ order        │  │ goods        │
│ user_profile │  │ order_item   │  │ category     │
└──────────────┘  └──────────────┘  └──────────────┘
```

**水平拆分：按数据分片**

```
order 表（单表 5000 万行 → 拆分为 4 个分片）：
┌──────────────────┐
│ order_0 (user_id % 4 = 0) │
├──────────────────┤
│ order_1 (user_id % 4 = 1) │
├──────────────────┤
│ order_2 (user_id % 4 = 2) │
├──────────────────┤
│ order_3 (user_id % 4 = 3) │
└──────────────────┘
```

**分片策略：**

| 策略 | 说明 | 优点 | 缺点 |
|------|------|------|------|
| Hash 取模 | `user_id % N` | 数据均匀 | 扩容困难 |
| 范围 | `user_id 在 [1, 1000万)` | 范围查询友好 | 数据可能不均 |
| 一致性 Hash | Hash 环 | 扩容只影响相邻节点 | 实现复杂 |

**分库分表带来的问题：**

1. **分布式事务**：跨库事务如何保证一致性
2. **跨库 JOIN**：无法直接 JOIN，需要应用层组装
3. **全局排序**：分片后 ORDER BY 需要应用层归并
4. **全局 ID**：需要分布式 ID 生成方案
5. **数据迁移**：扩容时需要数据迁移

### 5.5 ShardingSphere 基本概念

Apache ShardingSphere 是一套分布式数据库中间件解决方案。

```yaml
# ShardingSphere 配置示例（YAML）
dataSources:
  ds_0:
    url: jdbc:mysql://localhost:3306/ds_0
    username: root
    password: root
  ds_1:
    url: jdbc:mysql://localhost:3306/ds_1
    username: root
    password: root

rules:
  - !SHARDING
    tables:
      order:
        actualDataNodes: ds_${0..1}.order_${0..3}
        tableStrategy:
          standard:
            shardingColumn: order_id
            shardingAlgorithmName: order_inline
        keyGenerateStrategy:
          column: order_id
          keyGeneratorName: snowflake
    shardingAlgorithms:
      order_inline:
        type: INLINE
        props:
          algorithm-expression: order_${order_id % 4}
    keyGenerators:
      snowflake:
        type: SNOWFLAKE
```

**ShardingSphere 核心功能：**

| 功能 | 说明 |
|------|------|
| 数据分片 | 水平分库、水平分表、读写分离 |
| 分布式事务 | XA、BASE 事务 |
| 数据加密 | 敏感字段加密存储 |
| 分布式主键 | 内置雪花算法 |
| 影子库 | 压测隔离 |

---

## 六、MyBatis（重点！）

### 6.1 MyBatis 架构

```
┌─────────────────────────────────────────────────────┐
│                   应用层（MyBatis API）                │
│              SqlSession.selectList("UserMapper.findAll") │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              核心处理层（Configuration）                │
│  ┌───────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ SqlSession │ │ Executor │ │ StatementHandler  │  │
│  └───────────┘ └──────────┘ └───────────────────┘  │
│  ┌───────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ParameterH │ │ResultSetH│ │ TypeHandler       │  │
│  └───────────┘ └──────────┘ └───────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              基础支撑层                               │
│  ┌───────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ 数据源管理 │ │ 事务管理  │ │ 缓存（1级/2级）    │  │
│  └───────────┘ └──────────┘ └───────────────────┘  │
│  ┌───────────┐ ┌──────────┐                        │
│  │ 插件机制   │ │ 日志     │                        │
│  └───────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────┘
```

### 6.2 SqlSessionFactory 与 SqlSession

```java
// MyBatis 核心对象生命周期

// 1. SqlSessionFactory（全局唯一，应用启动时创建）
//    读取配置文件，创建 SqlSession 工厂
InputStream inputStream = Resources.getResourceAsStream("mybatis-config.xml");
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);

// 2. SqlSession（线程不安全，每次请求创建一个）
//    包含数据库连接，执行 SQL
try (SqlSession session = sqlSessionFactory.openSession()) {
    UserMapper mapper = session.getMapper(UserMapper.class);
    User user = mapper.findById(1L);
    session.commit();  // 手动提交
}

// 3. Spring Boot 中自动管理（不需要手动创建）
//    @MapperScan("com.example.mapper") 自动扫描
```

**生命周期对比：**

| 对象 | 生命周期 | 作用 |
|------|----------|------|
| `SqlSessionFactoryBuilder` | 方法级（用完即丢） | 解析配置文件，构建 Factory |
| `SqlSessionFactory` | 应用级（全局单例） | 创建 SqlSession |
| `SqlSession` | 请求/方法级（线程不安全） | 执行 SQL、管理事务 |
| `Mapper` | 方法级（从 SqlSession 获取） | 执行具体的 SQL 映射 |

### 6.3 Mapper 接口与 XML 映射

```java
// Mapper 接口
@Mapper
public interface UserMapper {

    User findById(Long id);

    List<User> findByName(String name);

    int insert(User user);

    int updateById(User user);

    int deleteById(Long id);
}
```

```xml
<!-- UserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">

    <!-- resultMap 定义 -->
    <resultMap id="userResultMap" type="com.example.entity.User">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="email" column="email"/>
        <result property="createTime" column="create_time"/>
    </resultMap>

    <!-- 基本查询 -->
    <select id="findById" parameterType="long" resultMap="userResultMap">
        SELECT id, name, email, create_time FROM user WHERE id = #{id}
    </select>

    <!-- 模糊查询 -->
    <select id="findByName" parameterType="string" resultMap="userResultMap">
        SELECT id, name, email, create_time
        FROM user
        WHERE name LIKE CONCAT('%', #{name}, '%')
    </select>

    <!-- 插入（返回自增主键） -->
    <insert id="insert" parameterType="com.example.entity.User"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO user (name, email, create_time)
        VALUES (#{name}, #{email}, #{createTime})
    </insert>

    <!-- 更新 -->
    <update id="updateById" parameterType="com.example.entity.User">
        UPDATE user
        SET name = #{name}, email = #{email}
        WHERE id = #{id}
    </update>

    <!-- 删除 -->
    <delete id="deleteById" parameterType="long">
        DELETE FROM user WHERE id = #{id}
    </delete>

</mapper>
```

### 6.4 #{} vs ${}（预编译 vs 字符串拼接）

```xml
<!-- #{}：预编译参数占位符（PreparedStatement） -->
<!-- SQL: SELECT * FROM user WHERE id = ? -->
<!-- 参数通过 setString(1, value) 设置，防止 SQL 注入 -->
<select id="findById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>

<!-- ${}：字符串拼接（Statement） -->
<!-- SQL: SELECT * FROM user ORDER BY age DESC -->
<!-- 直接替换到 SQL 中，有 SQL 注入风险 -->
<select id="findByOrder" resultType="User">
    SELECT * FROM user ORDER BY ${columnName} ${order}
</select>
```

| 特性 | #{} | ${} |
|------|-----|-----|
| 处理方式 | 预编译参数 | 字符串拼接 |
| SQL 注入 | **安全** | **不安全** |
| 类型处理 | 自动类型转换 | 纯字符串替换 |
| 适用场景 | 参数值（WHERE 条件值） | 表名、列名、ORDER BY 等结构性关键字 |

> ⭐ **面试高频问题：#{} 和 ${} 的区别？**
>
> `#{}` 使用 PreparedStatement 预编译，参数以 `?` 占位，通过 `setXxx` 设置值，**防止 SQL 注入**。
>
> `${}` 是纯字符串替换，直接将值拼接到 SQL 中，**有 SQL 注入风险**。
>
> 使用场景：`#{}` 用于所有参数值；`${}` 只在需要动态表名、列名、排序方向时使用（且需在代码中做白名单校验）。

### 6.5 动态 SQL

```xml
<!-- if 条件判断 -->
<select id="findUsers" resultType="User">
    SELECT * FROM user
    WHERE 1=1
    <if test="name != null and name != ''">
        AND name LIKE CONCAT('%', #{name}, '%')
    </if>
    <if test="status != null">
        AND status = #{status}
    </if>
    <if test="minAge != null">
        AND age >= #{minAge}
    </if>
</select>

<!-- choose-when-otherwise（类似 switch-case） -->
<select id="findUsersByCondition" resultType="User">
    SELECT * FROM user
    WHERE 1=1
    <choose>
        <when test="name != null">
            AND name = #{name}
        </when>
        <when test="email != null">
            AND email = #{email}
        </when>
        <otherwise>
            AND status = 'active'
        </otherwise>
    </choose>
</select>

<!-- where（自动处理 AND/OR 前缀） -->
<select id="findUsersOptimized" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="status != null">
            AND status = #{status}
        </if>
    </where>
</select>

<!-- set（自动处理末尾逗号） -->
<update id="updateUserSelective">
    UPDATE user
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="email != null">email = #{email},</if>
        <if test="status != null">status = #{status},</if>
    </set>
    WHERE id = #{id}
</update>

<!-- foreach（批量操作） -->
<!-- 批量查询 -->
<select id="findByIds" resultType="User">
    SELECT * FROM user
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- 批量插入 -->
<insert id="batchInsert">
    INSERT INTO user (name, email, status) VALUES
    <foreach collection="users" item="user" separator=",">
        (#{user.name}, #{user.email}, #{user.status})
    </foreach>
</insert>

<!-- trim（自定义前缀/后缀） -->
<update id="updateUserTrim">
    UPDATE user
    <trim prefix="SET" suffixOverrides=",">
        <if test="name != null">name = #{name},</if>
        <if test="email != null">email = #{email},</if>
    </trim>
    WHERE id = #{id}
</update>
```

### 6.6 一对一、一对多、多对多映射

**实体类：**

```java
public class User {
    private Long id;
    private String name;
    private String email;
    private Order order;           // 一对一
    private List<Order> orders;    // 一对多
    private List<Role> roles;      // 多对多
    // getters & setters
}

public class Order {
    private Long id;
    private String orderNo;
    private BigDecimal amount;
    private User user;             // 多对一
    // getters & setters
}

public class Role {
    private Long id;
    private String roleName;
    // getters & setters
}
```

**XML 映射：**

```xml
<!-- 一对一：association -->
<resultMap id="userWithOrderMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <association property="order" javaType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
    </association>
</resultMap>

<select id="findUserWithOrder" resultMap="userWithOrderMap">
    SELECT u.id, u.name, o.id AS order_id, o.order_no, o.amount
    FROM user u
    LEFT JOIN `order` o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>

<!-- 一对多：collection -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
        <result property="amount" column="amount"/>
    </collection>
</resultMap>

<select id="findUserWithOrders" resultMap="userWithOrdersMap">
    SELECT u.id, u.name, o.id AS order_id, o.order_no, o.amount
    FROM user u
    LEFT JOIN `order` o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>

<!-- 多对多：collection + 中间表 -->
<resultMap id="userWithRolesMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id"/>
        <result property="roleName" column="role_name"/>
    </collection>
</resultMap>

<select id="findUserWithRoles" resultMap="userWithRolesMap">
    SELECT u.id, u.name, r.id AS role_id, r.role_name
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = #{id}
</select>

<!-- 嵌套查询（N+1 问题，不推荐） -->
<resultMap id="userLazyOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order"
                select="com.example.mapper.OrderMapper.findByUserId"
                column="id"/>
</resultMap>
```

### 6.7 一级缓存 vs 二级缓存

**一级缓存（SqlSession 级别）：**

```java
// 一级缓存默认开启，SqlSession 范围内有效
try (SqlSession session = sqlSessionFactory.openSession()) {
    UserMapper mapper = session.getMapper(UserMapper.class);

    // 第一次查询 → 查数据库，结果放入一级缓存
    User user1 = mapper.findById(1L);

    // 第二次查询 → 命中一级缓存，不发 SQL
    User user2 = mapper.findById(1L);

    System.out.println(user1 == user2);  // true（同一个对象）

    // 以下操作会清空一级缓存：
    session.commit();       // 提交
    session.rollback();     // 回滚
    session.clearCache();   // 手动清空
    mapper.insert(new User()); // 任何增删改操作
}
```

**二级缓存（Mapper / Namespace 级别）：**

```xml
<!-- 1. 全局配置开启二级缓存（默认开启） -->
<!-- mybatis-config.xml -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- 2. Mapper XML 中添加 <cache/> 标签 -->
<mapper namespace="com.example.mapper.UserMapper">
    <!-- 开启二级缓存 -->
    <cache
        eviction="LRU"
        flushInterval="60000"
        size="1024"
        readOnly="true"/>

    <!-- 查询需要设置 useCache="true"（默认） -->
    <select id="findById" resultType="User" useCache="true">
        SELECT * FROM user WHERE id = #{id}
    </select>

    <!-- 增删改会清空该 namespace 下的二级缓存 -->
    <update id="updateById">
        UPDATE user SET name = #{name} WHERE id = #{id}
    </update>
</mapper>
```

```java
// 二级缓存跨 SqlSession 生效
try (SqlSession session1 = sqlSessionFactory.openSession()) {
    UserMapper mapper1 = session1.getMapper(UserMapper.class);
    User user1 = mapper1.findById(1L);  // 查数据库
    session1.commit();  // 关闭前提交，数据写入二级缓存
}

try (SqlSession session2 = sqlSessionFactory.openSession()) {
    UserMapper mapper2 = session2.getMapper(UserMapper.class);
    User user2 = mapper2.findById(1L);  // 命中二级缓存！
}
```

| 特性 | 一级缓存 | 二级缓存 |
|------|----------|----------|
| 范围 | SqlSession | Mapper（Namespace） |
| 默认 | 开启 | 开启（需配置 `<cache/>`） |
| 存储 | HashMap | 可自定义（LRU、FIFO、Soft、Weak） |
| 跨 Session | 否 | 是 |
| 实体类要求 | 无 | **必须实现 Serializable** |

> ⭐ **面试高频问题：MyBatis 一级缓存和二级缓存有什么区别？**
>
> 一级缓存是 SqlSession 级别的，默认开启，增删改或 `commit()`/`close()` 后清空。
>
> 二级缓存是 Mapper（Namespace）级别的，跨 SqlSession 共享，需要在 XML 中配置 `<cache/>`，实体类必须实现 Serializable。
>
> **实际生产中**：一级缓存正常使用；二级缓存**慎用**，因为容易出现数据不一致（多表关联查询时，一个表更新不会清空另一个表的缓存），推荐使用 Redis 作为分布式缓存替代。

### 6.8 延迟加载（Lazy Loading）

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 按需加载（3.4.1+ 默认 true） -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

```xml
<!-- 延迟加载配置 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- fetchType="lazy" 延迟加载，fetchType="eager" 立即加载 -->
    <collection property="orders" ofType="Order"
                select="com.example.mapper.OrderMapper.findByUserId"
                column="id"
                fetchType="lazy"/>
</resultMap>
```

```java
UserMapper mapper = session.getMapper(UserMapper.class);
User user = mapper.findById(1L);
// 此时只执行了 SELECT * FROM user WHERE id = 1
// orders 未被加载

List<Order> orders = user.getOrders();
// 此时才执行 SELECT * FROM `order` WHERE user_id = 1
```

### 6.9 MyBatis-Plus

MyBatis-Plus（MP）是 MyBatis 的增强工具，**只增强不做改变**。

#### 6.9.1 CRUD 接口

```java
// Entity
@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_name")
    private String name;

    private String email;

    private Integer age;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic  // 逻辑删除字段
    private Integer deleted;
}

// Mapper 接口（继承 BaseMapper）
@Mapper
public interface UserMapper extends BaseMapper<User> {
    // BaseMapper 已提供 CRUD 方法，无需写 XML
}

// Service 接口
public interface UserService extends IService<User> {
}

// Service 实现
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {
}
```

```java
// 使用 BaseMapper 的 CRUD 方法

// 插入
User user = new User();
user.setName("Alice");
user.setEmail("alice@example.com");
user.setAge(25);
userMapper.insert(user);  // 自动填充 createTime、updateTime
System.out.println(user.getId());  // 自动回填主键

// 根据 ID 查询
User user = userMapper.selectById(1L);

// 条件查询
List<User> users = userMapper.selectList(
    new QueryWrapper<User>().eq("name", "Alice")
);

// 更新
User updateUser = new User();
updateUser.setId(1L);
updateUser.setName("Bob");
userMapper.updateById(updateUser);

// 删除（逻辑删除，实际执行 UPDATE SET deleted=1）
userMapper.deleteById(1L);

// 批量操作
List<User> batchUsers = Arrays.asList(user1, user2, user3);
userService.saveBatch(batchUsers);
```

#### 6.9.2 条件构造器

```java
// QueryWrapper（字符串列名）
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.eq("name", "Alice")
       .gt("age", 18)
       .like("email", "@example.com")
       .between("age", 18, 30)
       .isNotNull("email")
       .in("status", "active", "inactive")
       .orderByDesc("create_time")
       .last("LIMIT 10");
List<User> users = userMapper.selectList(wrapper);

// LambdaQueryWrapper（类型安全，推荐！）
LambdaQueryWrapper<User> lambdaWrapper = new LambdaQueryWrapper<>();
lambdaWrapper.eq(User::getName, "Alice")
             .gt(User::getAge, 18)
             .like(User::getEmail, "@example.com")
             .between(User::getAge, 18, 30)
             .isNotNull(User::getEmail)
             .in(User::getStatus, "active", "inactive")
             .orderByDesc(User::getCreateTime)
             .last("LIMIT 10");
List<User> users = userMapper.selectList(lambdaWrapper);

// LambdaQueryChainWrapper（链式调用）
List<User> result = new LambdaQueryChainWrapper<>(userMapper)
    .eq(User::getStatus, "active")
    .ge(User::getAge, 18)
    .orderByDesc(User::getCreateTime)
    .list();

// 查询单个
User user = new LambdaQueryChainWrapper<>(userMapper)
    .eq(User::getEmail, "alice@example.com")
    .one();

// 分页查询
Page<User> page = new Page<>(1, 10);
LambdaQueryWrapper<User> pageWrapper = new LambdaQueryWrapper<>();
pageWrapper.eq(User::getStatus, "active")
           .orderByDesc(User::getCreateTime);
Page<User> result = userMapper.selectPage(page, pageWrapper);
// result.getRecords() → 当前页数据
// result.getTotal()   → 总记录数
// result.getPages()   → 总页数
```

#### 6.9.3 分页插件

```java
// 配置类
@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 分页插件（MySQL 用 DbType.MYSQL）
        interceptor.addInnerInterceptor(
            new PaginationInnerInterceptor(DbType.MYSQL)
        );
        // 乐观锁插件
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        return interceptor;
    }
}
```

```java
// 使用分页
Page<User> page = new Page<>(1, 10);  // 第1页，每页10条
Page<User> result = userMapper.selectPage(page, null);

System.out.println("当前页数据: " + result.getRecords());
System.out.println("总记录数: " + result.getTotal());
System.out.println("总页数: " + result.getPages());

// 分页插件自动生成的 SQL：
-- SELECT * FROM user LIMIT 0, 10
-- SELECT COUNT(*) FROM user  （自动执行 count 查询）
```

#### 6.9.4 代码生成器

```java
// MyBatis-Plus 代码生成器（3.5.x 版本）
public class CodeGenerator {
    public static void main(String[] args) {
        FastAutoGenerator.create(
            "jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=utf-8",
            "root",
            "password"
        )
        .globalConfig(builder -> {
            builder.author("generator")
                   .outputDir(System.getProperty("user.dir") + "/src/main/java")
                   .enableSwagger();  // 开启 swagger 模式
        })
        .packageConfig(builder -> {
            builder.parent("com.example")
                   .moduleName("user")
                   .entity("entity")
                   .mapper("mapper")
                   .service("service")
                   .serviceImpl("service.impl")
                   .controller("controller");
        })
        .strategyConfig(builder -> {
            builder.addInclude("user", "order", "product")  // 表名
                   .entityBuilder()
                   .enableLombok()         // 启用 Lombok
                   .enableChainModel()     // 链式模型
                   .logicDeleteColumnName("deleted")  // 逻辑删除
                   .naming(NamingStrategy.underline_to_camel)  // 下划线转驼峰
                   .controllerBuilder()
                   .enableRestStyle();     // REST 风格
        })
        .execute();
    }
}
```

#### 6.9.5 乐观锁插件

```java
// Entity 中添加 @Version 字段
@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;

    private Integer stock;

    @Version  // 乐观锁版本号
    private Integer version;
}
```

```java
// 乐观锁使用流程
Product product = productMapper.selectById(1L);
// product: { id=1, name="手机", stock=100, version=1 }

product.setStock(99);  // 库存减1
productMapper.updateById(product);
// 执行 SQL: UPDATE product SET name='手机', stock=99, version=2
//           WHERE id=1 AND version=1
// 如果 version 不匹配（被其他线程修改），更新失败

// 乐观锁 vs 悲观锁
// 乐观锁：不加锁，通过版本号检测冲突（适合读多写少）
// 悲观锁：SELECT ... FOR UPDATE（适合写多读少）
```

> ⭐ **面试高频问题：MyBatis-Plus 有哪些常用功能？**
>
> 1. **BaseMapper / IService**：通用 CRUD，无需写 XML
> 2. **条件构造器**：QueryWrapper / LambdaQueryWrapper，类型安全的条件查询
> 3. **分页插件**：自动分页，生成 count 查询
> 4. **代码生成器**：根据数据库表自动生成 Entity、Mapper、Service、Controller
> 5. **乐观锁插件**：通过 `@Version` 注解实现乐观锁
> 6. **逻辑删除**：`@TableLogic`，删除操作自动转为 UPDATE
> 7. **自动填充**：`@TableField(fill = FieldFill.INSERT)` 自动填充创建时间等
> 8. **多租户插件**：自动拼接租户条件

---

## 七、数据库连接池

### 7.1 HikariCP（Spring Boot 默认）

HikariCP 是目前性能最好的 JDBC 连接池，Spring Boot 2.x+ 默认使用。

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: root
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      minimum-idle: 5              # 最小空闲连接数
      maximum-pool-size: 20        # 最大连接数
      idle-timeout: 600000         # 空闲连接超时时间（10分钟）
      max-lifetime: 1800000        # 连接最大存活时间（30分钟）
      connection-timeout: 30000    # 获取连接超时时间（30秒）
      connection-test-query: SELECT 1  # 连接测试语句
      pool-name: MyHikariCP        # 连接池名称
```

**HikariCP 为什么快？**

1. **字节码精简**：优化编译后的字节码，减少 CPU 缓存命中失败
2. **自定义 FastList**：替代 ArrayList，减少范围检查
3. **无锁集合**：ConcurrentBag 替代 ConcurrentLinkedQueue
4. **代理优化**：使用 Javassist 生成代理类，避免反射

### 7.2 Druid（阿里巴巴）

Druid 功能丰富，提供强大的监控能力。

```xml
<!-- pom.xml -->
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.16</version>
</dependency>
```

```yaml
# application.yml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    druid:
      url: jdbc:mysql://localhost:3306/mydb
      username: root
      password: root
      driver-class-name: com.mysql.cj.jdbc.Driver
      initial-size: 5           # 初始化连接数
      min-idle: 5               # 最小空闲连接数
      max-active: 20            # 最大连接数
      max-wait: 60000           # 获取连接超时时间
      time-between-eviction-runs-millis: 60000  # 检测间隔
      min-evictable-idle-time-millis: 300000    # 最小空闲时间
      validation-query: SELECT 1
      test-while-idle: true     # 空闲时检测
      test-on-borrow: false     # 借出时不检测
      test-on-return: false     # 归还时不检测
      # 监控配置
      stat-view-servlet:
        enabled: true
        url-pattern: /druid/*
        login-username: admin
        login-password: admin
      web-stat-filter:
        enabled: true
        url-pattern: /*
      # SQL 防火墙
      filter:
        wall:
          enabled: true
        stat:
          enabled: true
          slow-sql-millis: 1000  # 慢 SQL 阈值
```

```java
// 配置类（可选，yml 已足够时不需要）
@Configuration
public class DruidConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.druid")
    public DataSource druidDataSource() {
        return new DruidDataSource();
    }
}
```

**HikariCP vs Druid 对比：**

| 特性 | HikariCP | Druid |
|------|----------|-------|
| 性能 | 更快 | 略慢 |
| 监控 | 基础 | **强大**（Web 控制台） |
| SQL 防火墙 | 无 | **有**（防 SQL 注入） |
| SQL 统计 | 无 | **有**（慢 SQL 分析） |
| Spring Boot 默认 | **是** | 否 |
| 扩展性 | 简洁 | 丰富（插件机制） |
| 适用场景 | 追求性能 | 需要监控和运维 |

### 7.3 连接池参数配置

```yaml
# 连接池参数调优建议
spring:
  datasource:
    hikari:
      # 最大连接数：公式 = (核心数 * 2) + 有效磁盘数
      # 例如 8核机器：(8 * 2) + 1 = 17，取 20
      maximum-pool-size: 20

      # 最小空闲连接数：通常与 maximum-pool-size 相同
      # 避免频繁创建/销毁连接
      minimum-idle: 10

      # 连接超时：30秒
      connection-timeout: 30000

      # 空闲超时：10分钟（超过后回收）
      idle-timeout: 600000

      # 最大生命周期：30分钟（防止长时间使用的连接出问题）
      max-lifetime: 1800000

      # 泄漏检测阈值：60秒（连接借出超过60秒未归还则打印警告）
      leak-detection-threshold: 60000
```

### 7.4 连接池监控

```java
// HikariCP 监控（通过 JMX / Micrometer）
// Spring Boot Actuator 自动暴露
// 访问：/actuator/metrics/hikaricp.connections.active
// 访问：/actuator/metrics/hikaricp.connections.idle
// 访问：/actuator/metrics/hikaricp.connections.pending

// application.yml 开启 Actuator
management:
  endpoints:
    web:
      exposure:
        include: health, metrics, info
  endpoint:
    health:
      show-details: always
```

```java
// 自定义连接池健康检查
@Component
public class DataSourceHealthIndicator {

    @Autowired
    private DataSource dataSource;

    public void checkPoolStatus() {
        if (dataSource instanceof HikariDataSource hikari) {
            HikariPoolMXBean poolMXBean = hikari.getHikariPoolMXBean();
            System.out.println("活跃连接数: " + poolMXBean.getActiveConnections());
            System.out.println("空闲连接数: " + poolMXBean.getIdleConnections());
            System.out.println("等待线程数: " + poolMXBean.getThreadsAwaitingConnection());
            System.out.println("总连接数: " + poolMXBean.getTotalConnections());
        }
    }
}
```

> ⭐ **面试高频问题：如何配置数据库连接池参数？最大连接数怎么确定？**
>
> 最大连接数公式：`(CPU 核心数 * 2) + 有效磁盘数`
>
> 原因：数据库连接是阻塞式 IO，每个连接占用一个线程。CPU 密集型任务（如复杂计算）线程数应接近 CPU 核心数；IO 密集型（如数据库查询）可以多一些，但过多会导致线程上下文切换开销。
>
> 常见错误：把最大连接数设得很大（如 200+），实际上大部分连接在等待，反而降低性能。

---

## 八、NoSQL 概述

### 8.1 Redis（后续专题）

Redis 是最常用的内存数据库，常用于缓存、分布式锁、排行榜等。

```java
// Spring Data Redis 基本使用
@Service
public class UserService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private UserMapper userMapper;

    public User getUserById(Long id) {
        String key = "user:" + id;

        // 1. 先查缓存
        User user = (User) redisTemplate.opsForValue().get(key);
        if (user != null) {
            return user;  // 缓存命中
        }

        // 2. 缓存未命中，查数据库
        user = userMapper.selectById(id);

        // 3. 写入缓存（设置过期时间）
        if (user != null) {
            redisTemplate.opsForValue().set(key, user, 30, TimeUnit.MINUTES);
        }

        return user;
    }
}
```

**Redis 常用数据结构：**

| 数据结构 | 适用场景 |
|----------|----------|
| String | 缓存、计数器、分布式锁 |
| Hash | 对象存储（如用户信息） |
| List | 消息队列、最新列表 |
| Set | 去重、标签、共同好友 |
| ZSet（有序集合） | 排行榜、延迟队列 |

### 8.2 MongoDB（文档数据库）

MongoDB 存储的是 JSON 风格的文档（BSON），适合** schema 不固定**的场景。

```java
// Spring Data MongoDB
@Document(collection = "articles")
public class Article {
    @MongoId
    private String id;
    private String title;
    private String content;
    private List<String> tags;       // 数组字段
    private Map<String, Object> metadata;  // 灵活字段
    private LocalDateTime createdAt;
    // getters & setters
}

@Repository
public interface ArticleRepository extends MongoRepository<Article, String> {
    List<Article> findByTagsContaining(String tag);
    List<Article> findByTitleLike(String title);
}

// 使用
@Service
public class ArticleService {
    @Autowired
    private ArticleRepository articleRepository;

    public Article save(Article article) {
        return articleRepository.save(article);
    }

    public List<Article> findByTag(String tag) {
        return articleRepository.findByTagsContaining(tag);
    }
}
```

**MongoDB 适用场景：**

- 内容管理系统（CMS）
- 日志存储
- 物联网设备数据
- 社交网络（动态、评论）
- 产品目录（属性不固定）

### 8.3 Elasticsearch（搜索引擎）

Elasticsearch 是分布式搜索和分析引擎，基于 Lucene。

```java
// Spring Data Elasticsearch
@Document(indexName = "products")
public class Product {
    @Id
    private Long id;
    @Field(type = FieldType.Text, analyzer = "ik_max_word")
    private String name;
    @Field(type = FieldType.Keyword)
    private String category;
    @Field(type = FieldType.Double)
    private Double price;
    @Field(type = FieldType.Text)
    private String description;
    // getters & setters
}

@Repository
public interface ProductRepository extends ElasticsearchRepository<Product, Long> {
    List<Product> findByName(String name);
    List<Product> findByCategoryAndPriceBetween(String category, Double min, Double max);
}

// 使用
@Service
public class SearchService {
    @Autowired
    private ProductRepository productRepository;

    // 全文搜索
    public List<Product> search(String keyword) {
        return productRepository.findByName(keyword);
    }

    // 高级搜索（使用 ElasticsearchRestTemplate）
    public Page<Product> advancedSearch(String keyword, int page, int size) {
        NativeSearchQuery query = new NativeSearchQueryBuilder()
            .withQuery(QueryBuilders.matchQuery("name", keyword))
            .withPageable(PageRequest.of(page, size))
            .build();
        return elasticsearchTemplate.queryForPage(query, Product.class);
    }
}
```

**Elasticsearch 适用场景：**

- 全文搜索（商品搜索、日志搜索）
- 日志分析（ELK：Elasticsearch + Logstash + Kibana）
- 数据分析聚合
- 自动补全 / 搜索建议

### 8.4 各 NoSQL 适用场景

| 数据库 | 类型 | 适用场景 | 不适用场景 |
|--------|------|----------|-----------|
| **Redis** | 键值（内存） | 缓存、分布式锁、排行榜、计数器 | 大数据持久化、复杂查询 |
| **MongoDB** | 文档 | 灵活 schema、内容管理、日志 | 强事务、复杂 JOIN |
| **Elasticsearch** | 搜索引擎 | 全文搜索、日志分析 | 事务、实时更新 |
| **Neo4j** | 图数据库 | 社交关系、知识图谱 | 大规模通用存储 |
| **HBase** | 列族 | 海量数据、时序数据 | 复杂查询、小数据量 |
| **Cassandra** | 列族 | 高可用写入、时间序列 | 复杂查询、JOIN |

> ⭐ **面试高频问题：项目中如何选择数据库？**
>
> 核心业务数据 → **MySQL**（事务、关系型）
> 热点数据缓存 → **Redis**（高性能读写）
> 灵活 schema / 非结构化数据 → **MongoDB**
> 全文搜索 → **Elasticsearch**
> 海量数据 / 时序数据 → **HBase** / **ClickHouse**
>
> 实际项目中通常是**组合使用**，每种数据库解决特定问题。

---

## 九、数据库面试高频问题汇总

### 9.1 B+ 树为什么适合数据库索引？

**答：**

1. **层级浅，IO 次数少**：B+ 树非叶子节点不存数据，每个节点能存更多键值。3 层 B+ 树（假设页大小 16KB）可存储约 2000 万条记录，查询最多 3 次 IO。

2. **范围查询高效**：叶子节点通过双向链表连接，范围查询只需遍历链表，无需回到上层节点。

3. **查询性能稳定**：无论查哪个值，都从根到叶子，时间复杂度恒为 O(log n)。

4. **对比 B 树**：B 树非叶子节点存数据，节点更小，树更深；范围查询需要中序遍历。

5. **对比 Hash**：Hash 只支持等值查询，不支持范围、排序、最左前缀。

6. **对比红黑树**：二叉树层级太深，2000 万条数据约 24 层，IO 次数过多。

### 9.2 聚簇索引 vs 非聚簇索引

**答：**

- **聚簇索引**：叶子节点存储完整的行数据。InnoDB 的主键索引就是聚簇索引。一张表只能有一个聚簇索引。
- **非聚簇索引（辅助索引）**：叶子节点存储主键值。查询时需要先查辅助索引得到主键，再回聚簇索引查完整数据（回表）。

**优化**：通过覆盖索引（查询列都在索引中）减少回表。

### 9.3 最左前缀原则

**答：**

组合索引 `(a, b, c)` 的 B+ 树按 a → b → c 的顺序排序。查询必须从最左列 a 开始匹配，不能跳过 a 直接查 b 或 c。

- `WHERE a = 1` → 命中 a
- `WHERE a = 1 AND b = 2` → 命中 a, b
- `WHERE b = 2` → 不命中（跳过了 a）
- `WHERE a = 1 AND b > 2 AND c = 3` → 命中 a, b（b 是范围查询后，c 不参与索引）

**注意**：MySQL 优化器会自动调整 WHERE 条件顺序，不影响最左前缀匹配。

### 9.4 MVCC 原理

**答：**

MVCC（多版本并发控制）通过**隐藏字段 + Undo Log + Read View** 实现：

1. 每行数据隐藏 `DB_TRX_ID`（最后修改的事务 ID）和 `DB_ROLL_PTR`（回滚指针）
2. 修改数据时，旧版本写入 Undo Log，通过回滚指针形成版本链
3. 事务读取时，通过 Read View 判断版本链中哪个版本可见：
   - `DB_TRX_ID < min_trx_id` → 可见（已提交）
   - `DB_TRX_ID` 在活跃事务列表中 → 不可见（未提交）
   - `DB_TRX_ID >= max_trx_id` → 不可见（Read View 之后开启）
4. RC 级别每次 SELECT 新建 Read View → 不可重复读
5. RR 级别事务首次 SELECT 创建后复用 → 可重复读

### 9.5 事务隔离级别

**答：**

| 级别 | 脏读 | 不可重复读 | 幻读 |
|------|------|-----------|------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 |
| READ COMMITTED | 避免 | 可能 | 可能 |
| REPEATABLE READ（默认） | 避免 | 避免 | InnoDB 通过 MVCC + 间隙锁基本避免 |
| SERIALIZABLE | 避免 | 避免 | 避免 |

MySQL 默认 **REPEATABLE READ**，InnoDB 通过 MVCC + 间隙锁在该级别基本避免了幻读。

### 9.6 死锁如何解决

**答：**

**排查方法**：`SHOW ENGINE INNODB STATUS` 查看死锁日志。

**解决方案：**

1. **按固定顺序访问表和行**：所有事务按相同顺序加锁
2. **减小事务粒度**：大事务拆小事务，减少锁持有时间
3. **合理使用索引**：避免行锁升级为表锁
4. **设置锁等待超时**：`innodb_lock_wait_timeout`
5. **开启死锁检测**：`innodb_deadlock_detect = ON`（默认开启），自动回滚代价最小的事务

### 9.7 慢查询优化

**答：**

**定位慢查询**：开启慢查询日志（`slow_query_log = ON`，`long_query_time = 1`），使用 `mysqldumpslow` 分析。

**优化步骤：**

1. **EXPLAIN 分析执行计划**：关注 `type`（避免 ALL）、`key`（是否使用索引）、`rows`（扫描行数）、`Extra`（避免 Using filesort、Using temporary）
2. **添加合适的索引**：根据 WHERE、ORDER BY、GROUP BY 条件建索引
3. **避免索引失效**：不用函数、不做运算、不隐式转换、不以 `%` 开头 LIKE
4. **优化 SQL 写法**：避免 SELECT *、用 EXISTS 替代 IN、批量插入
5. **分页优化**：深分页用游标分页或延迟关联
6. **JOIN 优化**：小表驱动大表，确保关联列有索引

### 9.8 分库分表策略

**答：**

**何时分库分表？** 单表数据量超过 500 万~1000 万行，或单库 QPS 超过单机瓶颈。

**垂直拆分**：按业务模块拆分到不同的库/表（如用户库、订单库、商品库）。

**水平拆分**：同一张表按分片键拆分到多个表/库。

**分片策略：**

- **Hash 取模**：`user_id % N`，数据均匀但扩容困难
- **范围**：按 ID 范围分片，范围查询友好但可能数据不均
- **一致性 Hash**：扩容只影响相邻节点

**分库分表带来的问题及解决方案：**

| 问题 | 解决方案 |
|------|----------|
| 分布式事务 | Seata、XA、最终一致性（消息队列） |
| 跨库 JOIN | 应用层组装、数据冗余、全局表 |
| 全局排序 | 应用层归并排序 |
| 全局 ID | 雪花算法、Leaf（美团） |
| 数据迁移 | ShardingSphere、双写方案 |

**中间件**：Apache ShardingSphere、MyCat。

---

> **总结**：数据库与 ORM 是 Java 后端的核心技能，面试中索引、事务、SQL 优化是最高频考点。建议结合实际项目经验，理解每个知识点背后的原理和适用场景，而不仅仅是记忆概念。

---

## 补充知识点

### 补充一、Redo Log 与 Undo Log 详细原理（⭐高频）

#### 1. WAL 机制（Write-Ahead Logging）

WAL（预写日志）是数据库崩溃恢复的核心机制：**先写日志，再写磁盘**。

```
WAL 核心原则：
  修改数据时，先将修改操作写入日志（Redo Log），再更新数据页到磁盘。
  如果数据库崩溃，可以通过 Redo Log 恢复已提交但未持久化的数据。

为什么需要 WAL？
  1. 随机写性能差：直接修改数据页是随机 IO
  2. 顺序写性能好：追加写入日志文件是顺序 IO
  3. WAL 用顺序写代替随机写，大幅提升性能
```

#### 2. Redo Log（重做日志）

```
Redo Log 写入流程：

  Buffer Pool（内存）          Redo Log Buffer（内存）       Redo Log File（磁盘）
  ┌──────────────┐            ┌─────────────────┐          ┌──────────────────┐
  │ 数据页（脏页）│ ──修改──→ │ Redo Log Buffer │ ──刷盘──→ │ Redo Log File    │
  │              │            │ （循环缓冲区）    │          │ （ib_logfile0/1） │
  └──────────────┘            └─────────────────┘          └──────────────────┘
       │                                                          ↑
       └──────── Checkpoint ───────────────────────────────────────┘
                   （将脏页刷回磁盘，可以截断 Redo Log）

Redo Log 刷盘时机：
  1. 事务提交时（默认）
  2. Redo Log Buffer 空间不足（超过一半）
  3. 后台线程每秒刷盘
  4. Checkpoint 时

参数控制：
  innodb_flush_log_at_trx_commit = 1  # 事务提交时刷盘（最安全，默认）
  innodb_flush_log_at_trx_commit = 0  # 每秒刷盘（性能好，可能丢1秒数据）
  innodb_flush_log_at_trx_commit = 2  # 事务提交时写入OS缓存，每秒刷盘
```

#### 3. Undo Log（回滚日志）

```
Undo Log 的作用：
  1. 事务回滚：撤销未提交事务的修改
  2. MVCC（多版本并发控制）：提供数据的历史版本，实现读一致性

Undo Log 存储结构：
  - 存储在 Undo 表空间中（innodb_undo_tablespaces）
  - 每个修改操作记录一条 Undo Log
  - 包含：修改前的旧值、事务ID、回滚指针

MVCC 实现：
  每行数据有两个隐藏列：
  - trx_id：最后修改该行的事务ID
  - roll_pointer：指向该行的 Undo Log（形成版本链）

  ReadView：事务开始时的活跃事务列表
  - 通过比较 trx_id 和 ReadView 判断数据版本是否可见
  - RC 级别：每次 SELECT 都创建新的 ReadView
  - RR 级别：第一次 SELECT 创建 ReadView，后续复用
```

#### 4. Binlog（二进制日志）

```
Binlog 三种格式：

1. STATEMENT（语句模式）
   - 记录执行的 SQL 语句
   - 优点：日志量小
   - 缺点：非确定性函数（NOW()、UUID()）可能导致主从数据不一致

2. ROW（行模式，MySQL 5.7+ 默认）
   - 记录每行数据的变化（前镜像 + 后镜像）
   - 优点：数据一致性好，不依赖 SQL 上下文
   - 缺点：日志量大（批量操作时）

3. MIXED（混合模式）
   - 默认用 STATEMENT，遇到非确定性函数自动切换为 ROW

配置：
  binlog_format = ROW
  binlog_row_image = FULL  # 记录完整的前后镜像
```

#### 5. 两阶段提交（Redo Log 与 Binlog 的一致性）

```
两阶段提交流程（一条 UPDATE 语句）：

  阶段一：Prepare
  ┌─────────────────────────────────────────────┐
  │ 1. 将修改写入 Redo Log（标记为 Prepare 状态） │
  │ 2. Redo Log 刷盘                            │
  └─────────────────────────────────────────────┘
       ↓
  阶段二：Commit
  ┌─────────────────────────────────────────────┐
  │ 1. 将 Binlog 写入并刷盘                      │
  │ 2. 将 Redo Log 标记为 Commit 状态            │
  └─────────────────────────────────────────────┘

崩溃恢复场景：
  - Prepare 阶段崩溃：Redo Log 未提交 → 回滚
  - Binlog 写入后崩溃：Redo Log 有 Commit 标记 → 提交
  - Redo Log Prepare + Binlog 已刷盘，但 Commit 标记未写入
    → 比对 Redo Log 和 Binlog 的事务XID，匹配则提交，不匹配则回滚
```

#### 6. Checkpoint 机制

```
Checkpoint 的作用：
  - 将 Buffer Pool 中的脏页刷回磁盘
  - 推进 Redo Log 的可回收位置
  - 缩短崩溃恢复时间

两种 Checkpoint：
  1. Sharp Checkpoint（完全检查点）
     - 关闭数据库时执行，将所有脏页刷回磁盘
  2. Fuzzy Checkpoint（模糊检查点）
     - 后台线程异步刷新部分脏页
     - 触发条件：Redo Log 空间不足、Buffer Pool 空间不足、定时刷新
```

#### 7. Double Write（双写）

```
Double Write 解决的问题：
  - 页撕裂（Partial Page Write）：16KB 的数据页，写入时只写了一部分（如 4KB 后断电）
  - Redo Log 只记录页的物理修改，无法修复页撕裂

Double Write 流程：
  1. 先将数据页写入 Double Write Buffer（连续的存储区域）
  2. Double Write Buffer 刷盘（顺序写，速度快）
  3. 再将数据页写入实际的数据文件位置
  4. 如果写入过程中崩溃，恢复时从 Double Write Buffer 恢复完整页

参数：
  innodb_doublewrite = ON  # 默认开启
```

#### 8. 面试问答：一条 UPDATE 语句的完整执行流程

```
UPDATE users SET age = 25 WHERE id = 1;

执行流程：
  1. 客户端 → 连接器（TCP 连接、权限验证）
  2. 查询缓存（MySQL 8.0 已移除）
  3. 解析器（SQL 解析、语法树）
  4. 优化器（选择索引、执行计划）
  5. 执行器
     a. 调用 InnoDB 接口
     b. 如果 Buffer Pool 中有该数据页，直接使用；否则从磁盘加载
     c. 对行加 X 锁（写锁）
     d. 将旧值写入 Undo Log（用于回滚和 MVCC）
     e. 更新 Buffer Pool 中的数据页（内存中，标记为脏页）
     f. 将修改操作写入 Redo Log Buffer
  6. 提交事务（COMMIT）
     a. Redo Log Buffer → Redo Log File（刷盘，Prepare）
     b. Binlog → Binlog File（刷盘）
     c. Redo Log 标记为 Commit（两阶段提交）
  7. 返回"OK"给客户端
  8. 后台线程异步将脏页刷回磁盘（Checkpoint）
```

> ⭐ **面试问答：Redo Log 和 Binlog 的区别？**
>
> 答：(1) Redo Log 是 InnoDB 引擎特有的物理日志，记录"数据页的修改"；Binlog 是 MySQL Server 层的逻辑日志，记录"SQL 语句或行的变化"。(2) Redo Log 循环写入，空间固定会被覆盖；Binlog 追加写入，可以保留很久。(3) Redo Log 用于崩溃恢复；Binlog 用于主从复制和数据恢复。(4) 两阶段提交保证两者的一致性。

---

### 补充二、MySQL 主从复制原理（⭐高频）

#### 1. Binlog 格式（ROW/STATEMENT/MIXED）

```
主从复制依赖 Binlog 传递数据变更：

STATEMENT 格式：
  - 记录原始 SQL 语句
  - 主从可能因环境差异导致执行结果不同（如 NOW()、UUID()）
  - 日志量小

ROW 格式（推荐）：
  - 记录每行的数据变化
  - 数据一致性好，不受主从环境差异影响
  - 日志量大，但 MySQL 5.7+ 支持 binlog_row_image=MINIMAL 减少

MIXED 格式：
  - 自动选择 STATEMENT 或 ROW
  - 遇到非确定性函数时自动切换为 ROW
```

#### 2. 主从复制步骤

```
主从复制完整流程：

  Master（主库）                          Slave（从库）
  ┌──────────────────┐                  ┌──────────────────┐
  │                  │                  │                  │
  │ 1. 客户端写入     │                  │                  │
  │ 2. 写入 Binlog    │                  │                  │
  │                  │                  │                  │
  │   Dump Thread ───│── Binlog ──────→│ IO Thread        │
  │   (发送 Binlog)  │                  │ (接收 Binlog)     │
  │                  │                  │       ↓          │
  │                  │                  │   Relay Log       │
  │                  │                  │ (中继日志)         │
  │                  │                  │       ↓          │
  │                  │                  │ SQL Thread        │
  │                  │                  │ (重放 Binlog)     │
  │                  │                  │       ↓          │
  │                  │                  │   应用到本地数据    │
  └──────────────────┘                  └──────────────────┘

详细步骤：
  1. Master 将数据变更写入 Binlog
  2. Master 的 Dump Thread 读取 Binlog 发送给 Slave
  3. Slave 的 IO Thread 接收 Binlog，写入 Relay Log（中继日志）
  4. Slave 的 SQL Thread 读取 Relay Log，重放 SQL 语句
```

#### 3. 半同步复制

```
半同步复制（Semi-Synchronous Replication）：

  全同步复制（不实用）：
    Master 等待所有 Slave 都写入成功才返回客户端（延迟太高）

  异步复制（默认）：
    Master 写入 Binlog 后立即返回客户端，不等待 Slave
    风险：Master 崩溃可能丢失已提交但未复制的数据

  半同步复制：
    Master 写入 Binlog 后，等待至少一个 Slave 确认接收
    然后才返回客户端
    折中方案：兼顾数据安全和性能

  配置：
    # Master
    install plugin rpl_semi_sync_master soname 'semisync_master.so';
    SET GLOBAL rpl_semi_sync_master_enabled = 1;

    # Slave
    install plugin rpl_semi_sync_slave soname 'semisync_slave.so';
    SET GLOBAL rpl_semi_sync_slave_enabled = 1;
```

#### 4. GTID 复制

```
GTID（Global Transaction Identifier）：
  - 全局唯一的事务ID：source_id:sequence_number
  - 例如：3E11FA47-71CA-11E1-9E33-C80AA9429562:23

优势：
  1. 不需要知道 Binlog 的位置（offset），简化主从切换
  2. 每个事务有唯一ID，避免重复执行
  3. 故障恢复更简单

配置：
  gtid_mode = ON
  enforce_gtid_consistency = ON
```

#### 5. 主从延迟原因与解决方案

```
主从延迟的原因：
  1. 单线程重放（Slave 的 SQL Thread 是单线程的）
  2. 大事务（批量 UPDATE/DELETE）
  3. 从库硬件性能差
  4. 从库上有大量读查询影响重放
  5. 网络延迟

解决方案：
  1. MySQL 5.7+ 并行复制（Multi-Threaded Slave）
     - slave_parallel_workers = 8
     - slave_parallel_type = LOGICAL_CLOCK
  2. 避免大事务，拆分为小事务
  3. 从库使用 SSD
  4. 读写分离时，关键读走主库
  5. 使用 GTID + 半同步复制减少数据丢失
```

> ⭐ **面试问答：MySQL 主从延迟怎么解决？**
>
> 答：(1) 开启并行复制（slave_parallel_workers），将 SQL Thread 改为多线程重放。(2) 避免大事务，拆分批量操作。(3) 从库使用更好的硬件（SSD、更多CPU）。(4) 关键读走主库（如刚写入后立即读取的场景）。(5) 使用半同步复制减少数据丢失风险。

---

### 补充三、读写分离方案（⭐⭐中频）

#### 1. 基于代理

```
ProxySQL / MaxScale 架构：

  客户端 → ProxySQL → Master（写）
                  → Slave1（读）
                  → Slave2（读）

ProxySQL 功能：
  - 自动识别 SQL 类型（SELECT → 从库，INSERT/UPDATE/DELETE → 主库）
  - 连接池管理
  - 故障自动切换
  - 读写权重配置
  - 查询缓存

配置示例（ProxySQL）：
  INSERT INTO mysql_servers(hostgroup_id, hostname, port)
  VALUES (0, 'master-host', 3306),   -- hostgroup 0: 写
         (1, 'slave1-host', 3306),   -- hostgroup 1: 读
         (1, 'slave2-host', 3306);

  INSERT INTO mysql_query_rules(rule_id, active, match_digest, destination_hostgroup)
  VALUES (1, 1, '^SELECT.*FOR UPDATE', 0),  -- SELECT FOR UPDATE → 写
         (2, 1, '^SELECT', 1);               -- SELECT → 读
```

#### 2. 基于代码（ShardingSphere-JDBC）

```java
// ShardingSphere-JDBC 读写分离配置
// application.yml
spring:
  shardingsphere:
    datasource:
      names: master,slave0,slave1
      master:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://master-host:3306/db
      slave0:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://slave0-host:3306/db
      slave1:
        type: com.zaxxer.hikari.HikariDataSource
        jdbc-url: jdbc:mysql://slave1-host:3306/db
    rules:
      readwrite-splitting:
        data-sources:
          rw:
            write-data-source-name: master
            read-data-source-names: slave0,slave1
            load-balancer-name: round-robin
        load-balancers:
          round-robin:
            type: ROUND_ROBIN
```

#### 3. 主从延迟问题

```
读写分离下的主从延迟问题：
  1. 客户端写入数据 → 主库
  2. 客户端立即读取 → 从库
  3. 但数据还没同步到从库 → 读到旧数据！

解决方案：
  1. 关键读走主库（写后读场景）
  2. 延迟双删策略（写后等一段时间再删缓存）
  3. 使用消息队列保证最终一致性
  4. 半同步复制减少延迟
  5. 强制路由主库的注解（如 @Master）
```

> ⭐ **面试问答：读写分离有哪些实现方式？**
>
> 答：(1) 基于代理：ProxySQL、MaxScale 部署在应用和数据库之间，自动路由读写请求，对应用透明。(2) 基于代码：ShardingSphere-JDBC 在 JDBC 层实现读写分离，通过配置主从数据源，框架自动路由。代理方式对应用侵入小但增加网络跳数，代码方式性能好但需要引入依赖。

---

### 补充四、InnoDB Buffer Pool 原理（⭐⭐中频）

#### 1. 预读机制

```
InnoDB 预读（Read Ahead）：

  线性预读（Linear Read Ahead）：
    - 顺序访问同一个 extent（1MB = 64个连续页）中的页面
    - 当访问某个 extent 中超过 innodb_read_ahead_threshold（默认56）个页面时
    - 触发预读，将下一个 extent 的所有页面读入 Buffer Pool

  随机预读（Random Read Ahead）：
    - 同一个 extent 中有 13 个不同的页面在 Buffer Pool 中
    - 触发预读该 extent 的剩余页面
    - 默认关闭（innodb_random_read_ahead = OFF）
```

#### 2. 脏页刷新

```
脏页刷新触发条件：
  1. Redo Log 空间不足时（Checkpoint）
     - 脏页对应的 Redo Log 空间即将被覆盖
     - 必须将脏页刷回磁盘才能覆盖 Redo Log
  2. Buffer Pool 空间不足时
     - 需要淘汰页面为新页面腾出空间
     - 优先淘汰干净页，必要时刷新脏页
  3. 后台线程定时刷新
     - Page Cleaner Thread 每秒刷新一定比例的脏页
  4. MySQL 正常关闭时（Sharp Checkpoint）
  5. 手动触发（FLUSH TABLES WITH READ LOCK）
```

#### 3. LRU 淘汰（冷热数据分离）

```
InnoDB LRU 改进（冷热数据分离）：

  传统 LRU：
    新页面直接放入 LRU 头部
    问题：全表扫描会将大量冷数据挤入 LRU 头部，淘汰热数据

  InnoDB 改进 LRU：
    LRU List 分为两部分：
    ┌──────────────────────────────────────────────┐
    │ Young 区域（热数据，默认 3/8）│ Old 区域（冷数据，默认 5/8）│
    └──────────────────────────────────────────────┘

    新页面先进入 Old 区域头部
    在 Old 区域存活超过 innodb_old_blocks_time（默认1000ms）后
    才能被移入 Young 区域头部
    这样全表扫描的冷数据不会立即挤占 Young 区域

参数：
  innodb_buffer_pool_size          # Buffer Pool 大小（建议物理内存的 60%-70%）
  innodb_old_blocks_pct            # Old 区域占比（默认37，即 5/13 ≈ 37%）
  innodb_old_blocks_time           # 在 Old 区域的存活时间阈值（默认1000ms）
```

#### 4. Change Buffer

```
Change Buffer 的作用：
  - 缓冲对二级索引的修改操作（INSERT/UPDATE/DELETE）
  - 二级索引不是唯一的，修改不需要立即查磁盘
  - 先记录在 Change Buffer 中，后续合并到二级索引页

适用条件：
  - 只适用于二级索引（非唯一索引）
  - 主键索引的修改直接更新数据页（因为主键索引是有序的）
  - 唯一索引的修改需要检查唯一性，不能使用 Change Buffer

合并时机（Merge）：
  1. 二级索引页被读入 Buffer Pool 时
  2. 后台线程定时合并
  3. MySQL 关闭时
  4. Buffer Pool 空间不足时

参数：
  innodb_change_buffer_max_size    # Change Buffer 最大占比（默认25%）
  innodb_change_buffering          # 控制缓冲哪些操作（all/inserts/deletes/none）
```

> ⭐ **面试问答：Buffer Pool 的 LRU 为什么要冷热分离？**
>
> 答：传统 LRU 存在全表扫描问题：大量冷数据被读入后会挤占 LRU 头部，将热数据淘汰。InnoDB 将 LRU 分为 Young（热）和 Old（冷）两个区域，新页面先进入 Old 区域，只有存活超过 innodb_old_blocks_time（默认1秒）才能进入 Young 区域。这样全表扫描的冷数据在 Old 区域就会被淘汰，不会影响热数据。
