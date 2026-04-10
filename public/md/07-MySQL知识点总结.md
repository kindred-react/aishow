# MySQL 知识点总结（5年经验深度版）

> 适用人群：具有5年左右经验的DBA或后端工程师 | 基于 MySQL 8.0

---

## 目录

1. [基础操作](#1-基础操作) | 2. [存储引擎](#2-存储引擎) | 3. [索引体系](#3-索引体系)
4. [事务与锁](#4-事务与锁) | 5. [SQL 优化](#5-sql-优化) | 6. [主从复制](#6-主从复制)
7. [分库分表](#7-分库分表) | 8. [高可用架构](#8-高可用架构) | 9. [性能调优](#9-性能调优)
10. [备份恢复](#10-备份恢复) | 11. [监控运维](#11-监控运维)

---

## 1. 基础操作

### 1.1 DDL（数据定义语言）

```sql
-- 建库（显式指定字符集）
CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 建表（含完整约束、计算列、外键）
CREATE TABLE `order_detail` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_id`    BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `product_id`  BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `quantity`    INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '数量',
  `unit_price`  DECIMAL(12,2)   NOT NULL COMMENT '单价',
  `total_price` DECIMAL(12,2)   GENERATED ALWAYS AS (`quantity` * `unit_price`) STORED,
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_product` (`order_id`, `product_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='订单明细表';

-- 在线DDL（ALGORITHM=INPLACE 支持并发DML）
ALTER TABLE `order_detail` ADD INDEX `idx_created_at` (`created_at`), ALGORITHM=INPLACE, LOCK=NONE;

-- MySQL 8.0 瞬时添加列（仅修改字典信息，不重建表）
ALTER TABLE `order_detail` ADD COLUMN `remark` VARCHAR(255) COMMENT '备注';

-- TRUNCATE：DDL操作，不走事务，比DELETE快得多，重置AUTO_INCREMENT
TRUNCATE TABLE `order_detail`;
```

**实战经验：**
- 大表 ALTER 推荐使用 `pt-online-schema-change` 或 `gh-ost` 在线变更。
- MySQL 8.0 原子 DDL：DROP/CREATE 等操作要么全部成功要么全部回滚（元数据层面）。
- 外键在分库分表场景下是灾难，互联网大厂通常禁用，改用应用层保证一致性。

### 1.2 DML（数据操作语言）

```sql
-- 批量INSERT（减少网络交互和binlog量）
INSERT INTO `order_detail` (`order_id`, `product_id`, `quantity`, `unit_price`)
VALUES (1001, 2001, 2, 99.50), (1001, 2002, 1, 299.00) AS new
ON DUPLICATE KEY UPDATE `quantity` = new.quantity

-- 关联更新
UPDATE `order_detail` od INNER JOIN `products` p ON od.product_id = p.id
SET od.unit_price = p.new_price WHERE p.price_updated_at > '2024-06-01';
```

**实战经验：** 大批量删除/更新应分批执行（每批5000-10000行），避免长事务和锁争用。`ON DUPLICATE KEY UPDATE` 在高并发下可能产生死锁（Next-Key Lock冲突）。生产环境建议开启 `sql_safe_updates=1`。

### 1.3 DQL（数据查询语言）

```sql
-- CTE递归查询（MySQL 8.0+，默认递归深度限制1000）
WITH RECURSIVE dept_tree AS (
  SELECT id, name, parent_id, 1 AS level FROM departments WHERE parent_id IS NULL
  UNION ALL
  SELECT d.id, d.name, d.parent_id, dt.level + 1
  FROM departments d INNER JOIN dept_tree dt ON d.parent_id = dt.id
) SELECT * FROM dept_tree WHERE level <= 3;

-- 窗口函数（比自连接+子查询性能好很多）
SELECT emp_id, dept_id, salary,
  ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rank,
  SUM(salary) OVER (PARTITION BY dept_id) AS dept_total
FROM employees;

-- LATERAL JOIN（MySQL 8.0.14+，将N+1查询合并为一条SQL）
SELECT u.id, u.name, o.recent_order_id FROM users u,
LATERAL (SELECT id AS recent_order_id FROM orders WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS o;
```

### 1.4 DCL（数据控制语言）

```sql
-- MySQL 8.0：CREATE USER 和 GRANT 分离（不再支持GRANT隐式创建用户）
CREATE USER 'app_user'@'10.0.%' IDENTIFIED BY 'StrongP@ssw0rd!';
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'app_user'@'10.0.%';

-- 角色管理（MySQL 8.0+）
CREATE ROLE 'readonly_role';
GRANT SELECT ON mydb.* TO 'readonly_role';
GRANT 'readonly_role' TO 'app_user'@'10.0.%';
```

---

## 2. 存储引擎

### 2.1 InnoDB vs MyISAM

| 特性 | InnoDB | MyISAM |
|------|--------|--------|
| 事务/MVCC/外键 | 支持 | 不支持 |
| 锁粒度 | 行级锁 | 表级锁 |
| 崩溃恢复 | Redo Log保证 | 需手动修复 |
| COUNT(*) | 需遍历索引 | 直接返回行数 |
| 适用场景 | OLTP、高并发 | 已基本淘汰 |

**实战经验：** MySQL 5.5+ 默认 InnoDB，MyISAM 已退出生产环境。面试中回答"MyISAM 已被淘汰"是加分项。

### 2.2 InnoDB 架构

**内存结构：**
- **Buffer Pool**（默认128MB）：缓存数据页和索引页，采用改进版LRU（Young区+Old区，防全表扫描污染）。预读阈值 `innodb_read_ahead_threshold=56`。多实例 `innodb_buffer_pool_instances`，每个实例>=1GB。
- **Change Buffer**：仅对非唯一二级索引的DML缓存，写密集场景效果显著。`innodb_change_buffer_max_size` 默认25%。
- **Log Buffer**：Redo Log缓冲区，默认16MB。
- **Adaptive Hash Index**：自动对热点页建立哈希索引。

**磁盘结构：**
- **Redo Log**：WAL策略，先写日志再写磁盘。`innodb_flush_log_at_trx_commit`：1=每次提交刷盘（最安全），2=每秒刷盘（可能丢1秒）。循环使用固定大小文件。
- **Undo Log**：记录修改前旧值，用于回滚和MVCC。MySQL 8.0独立表空间。长事务导致Undo膨胀。
- **Doublewrite Buffer**：解决「部分写」问题，SSD环境下可考虑关闭（`skip_innodb_doublewrite`）。

```sql
-- Buffer Pool命中率（应>99%）
SELECT (1 - (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_reads')
  / (SELECT variable_value FROM performance_schema.global_status WHERE variable_name = 'Innodb_buffer_pool_read_requests')) * 100 AS hit_rate;
```

**面试高频：** Redo Log循环写而Binlog追加写？Redo Log用于崩溃恢复（只需最近日志），Binlog用于主从复制（需完整历史）。两阶段提交保证一致性。

---

## 3. 索引体系

### 3.1 B+Tree 原理

B+Tree特点：非叶子节点只存键值（不存数据），所有数据在叶子节点形成有序双向链表，支持高效范围查询。树高通常2-4层，3层可存约2000万行（`16384/(8+6)=1171` 个索引项/页，`1171^2*16≈2200万`）。

### 3.2 聚簇索引 vs 非聚簇索引

| 特性 | 聚簇索引 | 非聚簇索引（二级索引） |
|------|---------|-------------------|
| 存储内容 | 完整数据行 | 主键值+索引列 |
| 数量 | 每表仅1个 | 可多个 |
| 回表 | 不需要 | 需通过主键回表 |

```sql
-- 回表示例：先查二级索引idx_name找到主键id，再回聚簇索引查完整行（两次B+Tree查找）
SELECT * FROM employees WHERE name = '张三';
-- 覆盖索引：索引已包含查询列，无需回表
SELECT id, name FROM employees WHERE name = '张三';
```

### 3.3 联合索引与最左前缀

```sql
ALTER TABLE employees ADD INDEX idx_dept_name_age (dept_id, name, age);
-- 命中：WHERE dept_id=1 / WHERE dept_id=1 AND name='张三' / 全部命中
-- 不命中：WHERE name='张三' / WHERE age=25（违反最左前缀）
-- 部分命中：WHERE dept_id=1 AND age=25（dept_id命中，age走索引下推）
```

**实战经验：** 联合索引列顺序原则——等值条件在前，范围条件在后，区分度高的在前。`(a,b,c)` 索引中 `WHERE a=1 ORDER BY b,c` 可利用索引避免排序。避免冗余索引：`(a)` 和 `(a,b)` 同时存在时 `(a)` 冗余。

### 3.4 索引下推（ICP）

MySQL 5.6引入，将WHERE条件中索引列的过滤下推到存储引擎层，减少回表次数。

```sql
-- 假设索引 idx_dept_name (dept_id, name)
SELECT * FROM employees WHERE dept_id = 1 AND name LIKE '张%';
-- 无ICP：Server层过滤name | 有ICP：存储引擎直接在索引中过滤，减少回表
```

### 3.5 Hash索引与全文索引

- **Hash索引**：仅支持等值查询，O(1)查找，存在哈希冲突。Memory引擎默认，InnoDB有自适应哈希索引。
- **全文索引**：`ALTER TABLE articles ADD FULLTEXT INDEX ft_content (content);` 查询用 `MATCH(content) AGAINST('关键词' IN NATURAL LANGUAGE MODE)`。

### 3.6 索引失效场景

```sql
-- 1. 对索引列使用函数：DATE(created_at)='2024-01-01' → 改为范围查询
-- 2. 隐式类型转换：phone(VARCHAR) 传入数字 → 加引号
-- 3. LIKE左模糊：'%张' → '张%'（可利用索引）
-- 4. OR连接非索引列
-- 5. NOT IN / != / IS NOT NULL（优化器可能选择全表扫描）
-- 6. 对索引列做运算：id+1=100 → id=99
```

---

## 4. 事务与锁

### 4.1 ACID 实现原理

| 特性 | 实现机制 |
|------|---------|
| 原子性 | Undo Log |
| 一致性 | 约束 + Redo/Undo Log |
| 隔离性 | MVCC + 锁机制 |
| 持久性 | Redo Log + Doublewrite Buffer |

### 4.2 事务隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | MVCC Read View |
|---------|------|-----------|------|---------------|
| READ UNCOMMITTED | 可能 | 可能 | 可能 | 无 |
| READ COMMITTED | 不可能 | 可能 | 可能 | 每次SELECT生成新Read View |
| REPEATABLE READ | 不可能 | 不可能 | 可能* | 首次SELECT生成，后续复用 |
| SERIALIZABLE | 不可能 | 不可能 | 不可能 | 所有读加共享锁 |

> *InnoDB在RR级别通过Next-Key Lock一定程度上防止幻读，但快照读和当前读混合使用时仍可能出现。

**实战经验：** 互联网公司推荐 **READ COMMITTED**，避免长事务导致Undo膨胀和锁争用。RC级别下间隙锁退化为行锁，死锁概率大幅降低。

### 4.3 MVCC 实现机制

核心组件：隐藏列（`DB_TRX_ID` + `DB_ROLL_PTR`）→ Undo Log版本链 → Read View可见性判断。

```
Read View可见性规则：
  trx_id < min_trx_id        → 可见（事务在Read View创建前已提交）
  trx_id >= max_trx_id       → 不可见（事务在Read View创建后才开始）
  min <= trx_id < max        → 检查是否在m_ids中（在=未提交，不在=已提交）
```

**面试题：** MVCC能解决幻读吗？快照读可以避免（Read View不变），但当前读（`SELECT FOR UPDATE`/INSERT/UPDATE/DELETE）仍可能产生幻读。InnoDB通过Next-Key Lock在RR级别下防止。

### 4.4 锁机制

| 锁类型 | 说明 |
|--------|------|
| 记录锁（Record Lock） | 锁定索引上的单条记录 |
| 间隙锁（Gap Lock） | 锁定索引记录之间的间隙，防止插入 |
| 临键锁（Next-Key Lock） | Record Lock + Gap Lock（左开右闭） |
| 插入意向锁 | INSERT时的特殊间隙锁，不互相阻塞 |
| 元数据锁（MDL） | DDL操作时自动获取 |

```sql
SELECT * FROM employees WHERE id = 1 FOR UPDATE;         -- 排他锁（X锁）
SELECT * FROM employees WHERE id = 1 LOCK IN SHARE MODE;  -- 共享锁（S锁）
SELECT * FROM performance_schema.data_locks;              -- 查看当前锁
SELECT * FROM performance_schema.data_lock_waits;         -- 查看锁等待
```

#### 死锁检测与处理

```sql
SET GLOBAL innodb_deadlock_detect = ON;        -- 开启死锁检测（默认）
SET GLOBAL innodb_lock_wait_timeout = 50;       -- 锁等待超时
SET GLOBAL innodb_print_all_deadlocks = ON;     -- 死锁信息输出到error log
SHOW ENGINE INNODB STATUS\G                     -- 查看最近死锁信息
```

**实战经验：**
- 死锁排查：`SHOW ENGINE INNODB STATUS` → `LATEST DETECTED DEADLOCK` → 分析两个事务持锁和等锁。
- 常见死锁：两个事务以不同顺序更新同一组行（解决方案：统一更新顺序）。
- 高并发下死锁检测本身可能成为瓶颈（`innodb_deadlock_detect=OFF` + `innodb_lock_wait_timeout`兜底）。
- 批量INSERT用多行VALUES而非多次单条INSERT，减少死锁概率。

**面试题：** 间隙锁之间不冲突（两个事务可同时对同一间隙加间隙锁），但间隙锁与插入意向锁冲突。

---

## 5. SQL 优化

### 5.1 EXPLAIN 执行计划详解

```sql
EXPLAIN FORMAT=JSON SELECT o.id, o.user_id FROM orders o
INNER JOIN order_detail od ON o.id = od.order_id
WHERE o.status = 'PAID' AND o.created_at > '2024-01-01' LIMIT 100;
```

| 字段 | 说明 | 优劣排序 |
|------|------|---------|
| **type** | 访问类型 | system > const > eq_ref > ref > range > index > ALL |
| **key** | 实际使用索引 | NULL=未使用索引 |
| **rows** | 预估扫描行数 | 越小越好 |
| **filtered** | 过滤比例 | 越大越好 |
| **Extra** | 额外信息 | Using index(覆盖) > Using where > Using filesort(差) > Using temporary(差) |

**type详解：** `const`=主键等值最多一行 | `eq_ref`=JOIN时主键关联每表一行 | `ref`=普通索引等值 | `range`=索引范围扫描 | `index`=索引全扫描 | `ALL`=全表扫描

### 5.2 慢查询日志分析

```sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;
SET GLOBAL log_queries_not_using_indexes = ON;
-- 分析工具：mysqldumpslow -s t -t 10 slow.log | pt-query-digest slow.log
```

### 5.3 SQL 改写技巧

```sql
-- 1. 子查询→JOIN
SELECT o.* FROM orders o INNER JOIN users u ON o.user_id = u.id WHERE u.level = 'VIP';

-- 2. EXISTS替代IN（子查询结果集大时）
SELECT * FROM orders o WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id AND u.level = 'VIP');

-- 3. 深分页优化
-- 差：OFFSET 1000000 需扫描1000010行
SELECT * FROM orders ORDER BY id LIMIT 1000000, 10;
-- 好：游标分页
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 10;
-- 备选：子查询优化
SELECT * FROM orders INNER JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 10) AS t ON orders.id = t.id;

-- 4. UNION ALL替代UNION（UNION去重有额外开销）
-- 5. 避免SELECT *，只查需要的列
```

### 5.4 JOIN 优化

```sql
-- MySQL 8.0 Hash Join（无可用索引的等值JOIN自动启用）
SET SESSION optimizer_switch = 'hash_join=on';
-- 小表驱动大表原则，注意join_buffer_size（默认256KB）
```

**实战经验：** JOIN表数不宜超过5张，超过时考虑数据冗余或应用层组装。`STRAIGHT_JOIN` 可强制指定驱动表但需谨慎。

---

## 6. 主从复制

### 6.1 Binlog 格式

| 格式 | 说明 | 推荐 |
|------|------|------|
| STATEMENT | 记录SQL原文，NOW()/UUID()可能主从不一致 | 不推荐 |
| ROW | 记录行变更，数据一致性好，日志量大 | **推荐** |
| MIXED | 自动选择，行为不可预测 | 不推荐 |

```sql
SET GLOBAL binlog_format = 'ROW';
SET GLOBAL binlog_row_image = 'MINIMAL';  -- 只记录变更列，减少日志量
```

### 6.2 复制原理与模式

```
Master: Client写入 → Binlog → Dump Thread发送
Slave: I/O Thread接收 → Relay Log → SQL Thread重放
```

| 模式 | 说明 | 安全性 | 性能 |
|------|------|--------|------|
| 异步复制 | Master写Binlog即返回 | 可能丢数据 | 最高 |
| 半同步复制 | 至少1个Slave确认接收 | 少量风险 | 中等 |
| 全同步复制 | 所有Slave确认重放 | 不丢失 | 最低 |

```sql
-- 半同步复制配置
INSTALL PLUGIN rpl_semi_sync_master SONAME 'semisync_master.so';
SET GLOBAL rpl_semi_sync_master_enabled = ON;
SET GLOBAL rpl_semi_sync_master_wait_for_replica_count = 1;
SET GLOBAL rpl_semi_sync_master_timeout = 1000;  -- 超时降级为异步
```

### 6.3 GTID 复制

GTID全局唯一标识每个事务，简化主从切换。

```sql
-- my.cnf: gtid_mode=ON, enforce_gtid_consistency=ON, log_slave_updates=ON
SELECT @@global.gtid_executed;
-- 基于GTID切换无需找binlog位置：CHANGE REPLICATION SOURCE TO SOURCE_AUTO_POSITION = 1;
```

### 6.4 延迟复制与多线程复制

```sql
CHANGE REPLICATION SOURCE TO SOURCE_DELAY = 3600;  -- 延迟1小时（误操作恢复利器）
SET GLOBAL slave_parallel_workers = 8;  -- 多线程复制（建议=CPU核数）
SET GLOBAL slave_parallel_type = 'LOGICAL_CLOCK';  -- 基于逻辑时钟的并行复制
```

**实战经验：** 主从延迟常见原因——大事务、Slave单线程、硬件不足。`Seconds_Behind_Master` 在网络延迟或大事务下不准确，推荐用 `pt-heartbeat` 或对比binlog位置。

---

## 7. 分库分表

### 7.1 垂直拆分 vs 水平拆分

- **垂直拆分**：按业务功能拆分到不同库（`ecommerce_db` → `user_db`/`order_db`/`product_db`），适合微服务架构。
- **水平拆分**：按分片键将数据分散（`order_db` → `order_db_0~3`，`user_id % 4`），适合单表>5000万行。

### 7.2 分片键选择

原则：数据均匀分布、80%+查询命中分片键、避免跨分片查询、考虑扩展性。

常用策略：Hash取模（均匀但扩容难）、范围分片（扩容易但可能热点）、一致性Hash（扩容迁移少）、基因法（分片键信息嵌入关联表ID，解决跨分片JOIN）。

### 7.3 ShardingSphere 配置

```yaml
rules:
  - !SHARDING
    tables:
      t_order:
        actualDataNodes: ds_${0..1}.t_order_${0..3}
        tableStrategy:
          standard:
            shardingColumn: order_id
            shardingAlgorithmName: t_order_mod
        keyGenerateStrategy:
          column: id
          keyGeneratorName: snowflake
    shardingAlgorithms:
      t_order_mod:
        type: MOD
        props:
          sharding-count: 4
    keyGenerators:
      snowflake:
        type: SNOWFLAKE
        props:
          worker-id: 1
```

### 7.4 分布式ID生成

| 方案 | 优点 | 缺点 |
|------|------|------|
| 雪花算法 | 高性能、趋势递增 | 时钟回拨问题 |
| 数据库号段 | 简单可靠 | 性能瓶颈 |
| Redis INCR | 性能好 | 依赖Redis |
| Leaf（美团） | 号段模式高性能 | 需额外服务 |

### 7.5 跨分片查询与数据迁移

- **跨分片查询**：应用层合并（小结果集）、全局二级索引表、数据同步到ES。
- **数据迁移**：双写迁移、Binlog同步（Canal/DTS）、ShardingSphere迁移工具。

---

## 8. 高可用架构

### 8.1 MHA（Master High Availability）

Manager检测Master故障 → 选择最新Slave为新Master → 补偿差异relay-log → 其他Slave指向新Master。故障切换期间写入不可用（30秒-2分钟）。社区版已停止维护，推荐Orchestrator或MGR替代。

### 8.2 MySQL InnoDB Cluster / Group Replication

基于Paxos协议，官方高可用方案。

```sql
-- my.cnf关键配置
-- plugin_load_add='group_replication.so'
-- group_replication_group_seeds='10.0.1.1:33061,10.0.1.2:33061,10.0.1.3:33061'
-- group_replication_single_primary_mode=ON
START GROUP_REPLICATION;
SELECT * FROM performance_schema.replication_group_members;
```

特点：自动选主、基于认证的故障检测、至少3节点（容忍1故障）。单主模式应用无需感知切换。

### 8.3 ProxySQL 读写分离

```sql
INSERT INTO mysql_servers (hostgroup_id, hostname, port) VALUES
  (10, '10.0.1.1', 3306),   -- 写组
  (20, '10.0.1.2', 3306),   -- 读组
  (20, '10.0.1.3', 3306);   -- 读组
INSERT INTO mysql_query_rules (rule_id, active, match_digest, destination_hostgroup, apply) VALUES
  (1, 1, '^SELECT.*FOR UPDATE', 10, 1),  -- SELECT FOR UPDATE走写组
  (2, 1, '^SELECT', 20, 1);              -- 其他SELECT走读组
LOAD MYSQL SERVERS TO RUNTIME; SAVE MYSQL SERVERS TO DISK;
```

### 8.4 Keepalived + VIP

VIP漂移时间3-10秒，应用需配置重连机制。存在脑裂风险，建议配合 `nopreempt` 模式。生产推荐 **Orchestrator + ProxySQL** 组合方案。

---

## 9. 性能调优

### 9.1 核心参数优化（16GB内存/SSD/高并发OLTP）

```ini
[mysqld]
# InnoDB核心
innodb_buffer_pool_size = 12G          # 物理内存60%-75%
innodb_buffer_pool_instances = 8       # 每个>=1GB
innodb_log_file_size = 1G              # Redo Log文件大小
innodb_flush_log_at_trx_commit = 1     # 安全优先=1，性能优先=2
innodb_flush_method = O_DIRECT         # 绕过OS缓存
innodb_io_capacity = 2000              # SSD建议2000-5000
innodb_io_capacity_max = 4000
innodb_file_per_table = ON

# 连接相关
max_connections = 1000
thread_cache_size = 100

# 缓冲区（每个连接独立）
sort_buffer_size = 4M
join_buffer_size = 4M
read_rnd_buffer_size = 4M
tmp_table_size = 64M
max_heap_table_size = 64M
table_open_cache = 4000

# 安全
sql_mode = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION'
skip_name_resolve = ON
character_set_server = utf8mb4
```

### 9.2 连接池优化

```yaml
# HikariCP推荐配置
spring.datasource.hikari:
  maximum-pool-size: 20    # CPU核数*2+磁盘数
  minimum-idle: 10
  max-lifetime: 1800000    # 30分钟（必须小于MySQL wait_timeout）
  connection-timeout: 3000
  leak-detection-threshold: 60000
```

连接池不是越大越好，过大会增加上下文切换开销。

### 9.3 表结构优化

- 数据类型：`TINYINT(1B) < SMALLINT(2B) < INT(4B) < BIGINT(8B)`，金额用 `DECIMAL(12,2)`，定长数据用 `CHAR`。
- 大表分区（按时间范围）：`PARTITION BY RANGE (TO_DAYS(created_at))`
- 历史数据归档：先INSERT到归档表，再分批DELETE（每批10000行）。

---

## 10. 备份恢复

### 10.1 mysqldump（逻辑备份）

```bash
# 全量备份（InnoDB一致性快照，不锁表）
mysqldump -u root -p --single-transaction --routines --triggers --events \
  --set-gtid-purged=ON --master-data=2 --max-allowed-packet=256M \
  --databases mydb | gzip > mydb_full.sql.gz

# 并行导出（比mysqldump快很多）
mydumper -u root -p -t 8 -B mydb -o /backup/mydb_20240101/
```

### 10.2 XtraBackup（物理备份）

```bash
# 全量备份
xtrabackup --backup --target-dir=/backup/full --user=backup_user --password=******

# 增量备份
xtrabackup --backup --target-dir=/backup/inc1 --incremental-basedir=/backup/full

# 恢复准备
xtrabackup --prepare --apply-log-only --target-dir=/backup/full
xtrabackup --prepare --apply-log-only --target-dir=/backup/full --incremental-dir=/backup/inc1
xtrabackup --prepare --target-dir=/backup/full

# 恢复拷贝（需先停MySQL）
xtrabackup --copy-back --target-dir=/backup/full
chown -R mysql:mysql /var/lib/mysql
```

### 10.3 PITR 时间点恢复

```bash
# 1. 恢复全量备份
mysql -u root -p mydb < mydb_full.sql
# 2. 找到误操作时间点
mysqlbinlog --start-datetime='2024-01-01 00:00:00' --stop-datetime='2024-01-15 12:00:00' \
  --base64-output=DECODE-ROWS -v mysql-bin.000005 | grep -A 5 'DELETE FROM'
# 3. 恢复到误操作之前
mysqlbinlog --start-datetime='2024-01-01 00:00:00' --stop-datetime='2024-01-15 11:59:59' \
  mysql-bin.000005 mysql-bin.000006 | mysql -u root -p
```

### 10.4 备份策略设计

| 策略 | 频率 | 保留 | 工具 |
|------|------|------|------|
| 全量备份 | 每天凌晨 | 7天 | XtraBackup |
| 增量备份 | 每4小时 | 2天 | XtraBackup |
| Binlog | 实时 | 7天 | MySQL自动 |
| Schema | 每天凌晨 | 30天 | mysqldump --no-data |

**实战经验：** 备份必须验证可恢复性，定期在测试环境演练。大库(>100GB)用XtraBackup比mysqldump快10倍以上。备份文件存异地（OSS/S3），防机房级故障。`binlog_expire_logs_seconds`（MySQL 8.0）控制binlog保留时间。

---

## 11. 监控运维

### 11.1 Performance Schema

```sql
-- 最耗时SQL Top 10
SELECT DIGEST_TEXT, COUNT_STAR, SUM_TIMER_WAIT/1000000000 AS total_ms,
  AVG_TIMER_WAIT/1000000000 AS avg_ms
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC LIMIT 10;

-- 内存使用
SELECT event_name, current_alloc FROM performance_schema.memory_summary_global_by_event_name
WHERE current_alloc > 1024*1024 ORDER BY current_alloc DESC;
```

### 11.2 Sys Schema（MySQL 8.0 自带）

```sql
SELECT * FROM sys.schema_unused_indexes;        -- 未使用索引
SELECT * FROM sys.schema_redundant_indexes;      -- 冗余索引
SELECT * FROM sys.statements_with_full_table_scans LIMIT 10;  -- 全表扫描Top SQL
SELECT * FROM sys.io_global_by_file_by_bytes LIMIT 10;       -- IO热点
```

### 11.3 Prometheus + Grafana

```yaml
# mysqld_exporter 关键采集项
--collect.info_schema.processlist
--collect.info_schema.innodb_metrics
--collect.perf_schema.eventsstatements
--collect.engine_innodb_status
```

**关键监控指标：** QPS/TPS、Threads_running vs max_connections、Buffer Pool命中率、Innodb_rows_*、主从延迟、慢查询数、死锁频率、磁盘IO、Binlog生成速率。

**告警规则建议：** 连接数>80%、Buffer Pool命中率<95%、主从延迟>30秒、慢查询突增、磁盘使用率>85%。

### 11.4 死锁与主从延迟监控

```sql
-- 死锁监控
SET GLOBAL innodb_print_all_deadlocks = ON;  -- 输出到error log
SELECT * FROM performance_schema.data_lock_waits WHERE REQUESTING_ENGINE_LOCK_ID IS NOT NULL;

-- 主从延迟（对比binlog位置更准确）
SHOW REPLICA STATUS\G  -- Seconds_Behind_Source可能不准
SELECT CHANNEL_NAME, SERVICE_STATE FROM performance_schema.replication_connection_status;
```

**实战经验：** 定期巡检——每周检查未使用索引、冗余索引、表碎片率（`DATA_FREE/DATA_LENGTH`）、慢查询趋势。Prometheus+Grafana+mysqld_exporter+alertmanager 是最成熟的监控方案。

---

## 附录：高频面试题速查

1. **自增主键优势？** 顺序插入，页分裂概率低，B+Tree紧凑。随机主键（UUID）导致频繁页分裂和碎片。
2. **回表与覆盖索引？** 二级索引→主键→聚簇索引查完整行=回表。查询列都在索引中=覆盖索引，避免回表。
3. **RR如何实现？** MVCC：首次SELECT生成Read View，后续复用，保证读到相同版本。
4. **索引失效场景？** 函数/隐式转换/左模糊/OR非索引列/违反最左前缀/优化器判断全表扫描更优。
5. **深分页优化？** 游标分页（WHERE id>last_id LIMIT N）、子查询优化、延迟关联、覆盖索引。
6. **Redo Log vs Binlog？** Redo=引擎层物理日志循环写（崩溃恢复），Binlog=Server层逻辑日志追加写（主从复制）。两阶段提交保证一致。
7. **主从延迟解决？** 减小事务大小、多线程复制、升级Slave硬件、读写分离。
8. **大表加索引？** MySQL 5.6+ Online DDL（ALGORITHM=INPLACE），推荐pt-online-schema-change或gh-ost。
9. **幻读与Next-Key Lock？** 幻读=同一事务两次查询返回不同行数。MVCC解决快照读幻读，Next-Key Lock解决当前读幻读。
10. **type=all如何优化？** 检查索引未命中原因（函数/类型转换/最左前缀），考虑新建索引，用FORCE INDEX验证。

---

> 文档版本：v1.0 | 基于 MySQL 8.0
