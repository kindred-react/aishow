# PostgreSQL 知识点总结（5年经验深度指南）

> 适用对象：具有5年经验的DBA、后端工程师、数据库架构师 | 版本参考：PostgreSQL 14-17

---

## 1. 基础操作

### 1.1 DDL（数据定义语言）

```sql
-- 创建数据库（生产环境必须显式指定编码和排序规则）
CREATE DATABASE mydb ENCODING 'UTF8' LC_COLLATE 'zh_CN.UTF-8' LC_CTYPE 'zh_CN.UTF-8' TEMPLATE template0;

-- 创建表（含约束）
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- UNLOGGED 表不写 WAL，速度快但崩溃后数据丢失
CREATE UNLOGGED TABLE temp_import (id BIGSERIAL, raw_data JSONB);

-- PG 11+ 大表添加带默认值列只修改元数据，不重写表
ALTER TABLE orders ADD COLUMN remark TEXT DEFAULT '';
-- 修改列类型（USING 处理类型转换）
ALTER TABLE orders ALTER COLUMN amount TYPE NUMERIC(20,4) USING amount::NUMERIC(20,4);

-- 添加约束（NOT VALID 先加不验证，再异步验证，不阻塞读写）
ALTER TABLE orders ADD CONSTRAINT chk_amount CHECK (amount > 0) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT chk_amount;
```

### 1.2 DML（数据操作语言）

```sql
-- 批量插入（多行 VALUES 比单条 INSERT 性能高数倍）
INSERT INTO orders (user_id, amount, status) VALUES (1001, 99.90, 'paid'), (1002, 199.00, 'pending');

-- UPSERT（PG 9.5+）
INSERT INTO order_items (order_id, sku, qty) VALUES (1, 'SKU-001', 2)
ON CONFLICT (order_id, sku) DO UPDATE SET qty = order_items.qty + EXCLUDED.qty, updated_at = NOW();

-- MERGE（PG 15+，标准 SQL 语法）
MERGE INTO inventory tgt USING (SELECT 'SKU-001' AS sku, 10 AS delta) src ON tgt.sku = src.sku
WHEN MATCHED THEN UPDATE SET stock = tgt.stock + src.delta
WHEN NOT MATCHED THEN INSERT (sku, stock) VALUES (src.sku, src.delta);

-- UPDATE 带关联
UPDATE orders o SET status = 'shipped' FROM shipping_records s WHERE o.id = s.order_id;
```

### 1.3 DCL（数据控制语言）与 Schema 管理

```sql
CREATE ROLE readonly LOGIN PASSWORD 'xxx';
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly;
GRANT SELECT (id, name, email) ON users TO readonly;  -- 列级权限

-- 行级安全策略（RLS，PG 9.5+）
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders USING (tenant_id = current_setting('app.tenant_id')::BIGINT);

-- Schema 管理
CREATE SCHEMA app_data AUTHORIZATION dbadmin;
SET search_path TO app_data, public;
ALTER DATABASE mydb SET search_path TO app_data, public;
```

### 实战经验

1. **DDL 事务性**：PG 的 DDL 可以 ROLLBACK，这是与 MySQL 的重大区别。
2. **ON CONFLICT 需要唯一约束**：目标列上必须存在唯一约束或唯一索引。
3. **RLS 性能**：每条查询都会附加策略条件，注意在策略条件列上建索引。
4. **NOT VALID 约束**：大表加约束的利器，先加后验，避免长时间锁表。

### 面试题

- Q: PostgreSQL 的 DDL 可以回滚吗？A: 可以，PG 的 DDL 是事务性的。
- Q: RLS 和视图权限控制的区别？A: RLS 是行级透明过滤，应用无需修改 SQL；视图需要改写查询。

---

## 2. MVCC 机制

### 2.1 实现原理

PostgreSQL 采用**追加写入（Append-Only）**的 MVCC。每次 UPDATE 实际是 INSERT 新版本 + 标记旧版本过期。每行包含隐藏系统列：

| 系统列 | 说明 |
|--------|------|
| `xmin` | 插入该行版本的事务 ID |
| `xmax` | 删除/更新该行版本的事务 ID（0 表示有效） |
| `cmin/cmax` | 事务内的命令序列号 |
| `ctid` | 行的物理位置 `(block_number, offset)` |

```sql
SELECT xmin, xmax, ctid, * FROM orders WHERE id = 1;  -- 需要超级用户权限
```

### 2.2 事务 ID 与快照

```sql
SELECT txid_current();           -- 当前事务 ID
SELECT pg_current_snapshot();    -- 当前快照：xmin:xmax:xip_list

-- 事务 ID 回卷监控（32位无符号整数，约42亿后回卷）
SELECT datname, age(datfrozenxid) FROM pg_database;
-- age > 1.5亿需关注，> 1.8亿 autovacuum 强制 FREEZE，> 20亿数据库只读
```

### 2.3 VACUUM 机制

```sql
VACUUM orders;              -- 回收死元组空间供重用，不释放磁盘，不锁表
VACUUM ANALYZE orders;      -- 同时更新统计信息
VACUUM FULL orders;         -- 重写表释放磁盘，需 ACCESS EXCLUSIVE 锁

-- 查看膨胀情况
SELECT relname, n_live_tup, n_dead_tup,
       ROUND(n_dead_tup::NUMERIC / NULLIF(n_live_tup, 0) * 100, 2) AS dead_ratio
FROM pg_stat_user_tables WHERE n_dead_tup > 0 ORDER BY dead_ratio DESC;

-- 表级别 autovacuum 调优
ALTER TABLE orders SET (
    autovacuum_vacuum_scale_factor = 0.05,   -- 5% 死元组触发（默认 20%）
    autovacuum_analyze_scale_factor = 0.02,  -- 2% 变化触发 ANALYZE
    autovacuum_vacuum_cost_limit = 2000      -- 默认 200
);
```

### 实战经验

1. **长事务是 MVCC 的天敌**：阻止 VACUUM 回收死元组导致表膨胀，必须设置 `idle_in_transaction_session_timeout`。
2. **VACUUM FULL 的代价**：需要排他锁重写整个表，大表建议使用 `pg_repack` 在线重建。
3. **死元组不等于膨胀**：VACUUM 回收空间留在表内供重用，只有 VACUUM FULL 才归还操作系统。

### 面试题

- Q: UPDATE 为什么导致表膨胀？A: PG MVCC 追加写入，UPDATE = INSERT + 标记旧版本过期，旧版本成为死元组。
- Q: VACUUM 和 VACUUM FULL 区别？A: VACUUM 回收空间供重用不锁表；VACUUM FULL 重写表释放磁盘需排他锁。

---

## 3. 索引体系

### 3.1 各索引类型对比

```sql
-- B-Tree（默认，支持等值/范围/排序）
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE UNIQUE INDEX uniq_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_orders_created ON orders(created_at);  -- 并发创建不阻塞写入
CREATE INDEX idx_orders_covering ON orders(user_id) INCLUDE (amount, status);  -- 覆盖索引避免回表
CREATE INDEX idx_orders_unpaid ON orders(created_at) WHERE status = 'unpaid';  -- 部分索引

-- Hash（仅等值查询，PG 10+ 支持 WAL）
CREATE INDEX idx_users_email_hash ON users USING HASH(email);

-- GiST（地理空间/范围类型/全文搜索）
CREATE INDEX idx_places_location ON places USING GIST(location);

-- SP-GiST（非平衡数据结构，如电话前缀匹配）
CREATE INDEX idx_points_radial ON points USING SPGIST(coord);

-- GIN（数组/JSONB/全文搜索，查询快写入慢）
CREATE INDEX idx_articles_fts ON articles USING GIN(to_tsvector('chinese', content));
CREATE INDEX idx_events_data ON events USING GIN(data jsonb_path_ops);  -- 体积约为默认的1/10
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);

-- BRIN（块范围索引，极小但依赖物理有序性，适合时序日志表）
CREATE INDEX idx_logs_time_brin ON access_log USING BRIN(created_at) WITH (pages_per_range = 32);

-- 表达式索引
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
CREATE INDEX idx_users_name_trgm ON users USING GIN(name gin_trgm_ops);  -- 模糊搜索
```

### 3.2 索引运维

```sql
REINDEX INDEX CONCURRENTLY idx_orders_user_id;  -- PG 12+ 并发重建不锁表

-- 发现无用索引（idx_scan = 0 的大索引考虑删除）
SELECT relname, indexrelname, idx_scan, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes ORDER BY idx_scan ASC;
```

### 实战经验

1. **CONCURRENTLY 失败**：创建失败后索引变为 INVALID，需先 DROP 再重建，且不能在事务块内使用。
2. **复合索引列顺序**：等值条件列在前，范围条件列在后，也要考虑选择性。
3. **JSONB 索引选择**：`jsonb_path_ops` 体积小但只支持 `@>`，大多数场景推荐。
4. **BRIN 非万能**：数据物理无序时（频繁 UPDATE 导致行迁移）过滤效果很差。

### 面试题

- Q: GIN 和 GiST 区别？A: GIN 适合多值类型查询快写入慢；GiST 适合空间/范围数据写入快查询可能较慢。
- Q: INCLUDE 列作用？A: 存储在索引叶子节点避免回表（Index Only Scan），不参与排序。

---

## 4. 高级 SQL

### 4.1 窗口函数

```sql
SELECT user_id, amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn,    -- 连续不重复
    RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rnk,         -- 同值同排名跳号
    DENSE_RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS drnk,  -- 同值同排名不跳号
    LAG(amount, 1) OVER (ORDER BY created_at) AS prev_amount               -- 前一行
FROM orders;

-- 窗口帧
SUM(amount) OVER (ORDER BY created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)  -- 累计求和
SUM(amount) OVER (ORDER BY created_at RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW)  -- 滑动窗口
```

### 4.2 CTE 与递归查询

```sql
-- PG 12+ 可控制物化：MATERIALIZED / NOT MATERIALIZED
WITH RECURSIVE org_tree AS (
    SELECT id, name, parent_id, 1 AS level FROM departments WHERE parent_id IS NULL
    UNION ALL
    SELECT d.id, d.name, d.parent_id, t.level + 1 FROM departments d JOIN org_tree t ON d.parent_id = t.id
) SELECT * FROM org_tree;

-- 递归 + 路径追踪（防止循环引用）
WITH RECURSIVE breadcrumb AS (
    SELECT id, name, parent_id, ARRAY[id] AS path FROM categories WHERE parent_id IS NULL
    UNION ALL
    SELECT c.id, c.name, c.parent_id, b.path || c.id FROM categories c
    JOIN breadcrumb b ON c.parent_id = b.id WHERE NOT (c.id = ANY(b.path))
) SELECT * FROM breadcrumb;
```

### 4.3 LATERAL JOIN

```sql
-- 取每个用户的最近 N 条订单
SELECT u.name, o.* FROM users u CROSS JOIN LATERAL (
    SELECT id, amount, created_at FROM orders WHERE user_id = u.id ORDER BY created_at DESC LIMIT 3
) o;

-- 生成日期序列 + 关联查询
SELECT d.day::date, COUNT(o.id) FROM generate_series('2025-01-01','2025-01-31','1 day'::interval) AS d(day)
LEFT JOIN LATERAL (SELECT id FROM orders WHERE DATE(created_at) = d.day) o ON true GROUP BY d.day;
```

### 4.4 JSONB 操作

```sql
SELECT data->'name' FROM events;           -- 返回 JSON
SELECT data->>'name' FROM events;          -- 返回 TEXT
SELECT data#>'{address,city}' FROM events; -- 嵌套路径返回 JSON
SELECT data @> '{"status":"active"}' FROM events;  -- 包含检查

-- JSONPath（PG 12+）
SELECT jsonb_path_query(data, '$.items[*] ? (@.price > 100)') FROM orders;

-- JSONB 修改
UPDATE events SET data = data || '{"status":"processed"}'::jsonb WHERE id = 1;
```

### 4.5 数组、全文搜索、GROUPING SETS、正则

```sql
-- 数组
SELECT unnest(ARRAY['a','b','c']) WITH ORDINALITY AS t(elem, ordinality);  -- 带序号展开
SELECT * FROM posts WHERE 'PostgreSQL' = ANY(tags);  -- 包含检查
SELECT user_id, array_agg(order_id ORDER BY created_at) FROM orders GROUP BY user_id;

-- 全文搜索
ALTER TABLE articles ADD COLUMN textsearch tsvector
    GENERATED ALWAYS AS (to_tsvector('chinese', coalesce(title,'') || ' ' || coalesce(content,''))) STORED;
CREATE INDEX idx_articles_fts ON articles USING GIN(textsearch);
SELECT ts_headline('chinese', content, to_tsquery('chinese', 'PostgreSQL')) FROM articles;

-- GROUPING SETS / CUBE / ROLLUP
SELECT year, month, SUM(amount) FROM sales GROUP BY ROLLUP (year, month);
SELECT year, region, product, SUM(amount) FROM sales GROUP BY CUBE (year, region, product);

-- 正则表达式
SELECT * FROM users WHERE name ~ '^张';                    -- POSIX 正则
SELECT REGEXP_REPLACE(phone, '[^0-9]', '', 'g') FROM users;  -- 正则替换
```

### 实战经验

1. **窗口函数内存**：数据量大时可能导致 `work_mem` 溢出，注意设置合理的 work_mem。
2. **递归 CTE 循环检测**：图结构查询必须加 `WHERE NOT (id = ANY(path))`，否则无限递归。
3. **JSONB `@>` 限制**：右侧必须是字面量不能是列引用，列引用比较用 `jsonb_path_query`。
4. **中文全文搜索**：内置 `chinese` 配置分词简单，生产建议 `zhparser` 或 `pg_jieba` 扩展。

### 面试题

- Q: ROW_NUMBER/RANK/DENSE_RANK 区别？A: ROW_NUMBER 连续不重复；RANK 同值同排名跳号；DENSE_RANK 同值同排名不跳号。
- Q: JSONB 和 JSON 区别？A: JSONB 二进制存储支持索引和高效操作符，写入稍慢查询快；JSON 文本存储保持原格式。

---

## 5. 事务与锁

### 5.1 隔离级别与行锁

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;    -- 默认
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;   -- PG 的 MVCC 实际避免了幻读
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;       -- SSI 实现，可能有误报回滚
-- PG 不支持 READ UNCOMMITTED，自动降级为 READ COMMITTED

SELECT * FROM orders WHERE id = 1 FOR UPDATE;           -- 排他行锁
SELECT * FROM orders WHERE id = 1 FOR NO KEY UPDATE;    -- 不锁非关键列
SELECT * FROM orders WHERE id = 1 FOR SHARE;            -- 共享行锁
SELECT * FROM orders WHERE id = 1 FOR KEY SHARE;        -- 允许 NO KEY UPDATE

-- SKIP LOCKED（任务队列最佳实践，跳过已锁定行）
SELECT * FROM task_queue WHERE status = 'pending' ORDER BY created_at LIMIT 10 FOR UPDATE SKIP LOCKED;
SELECT * FROM orders WHERE id = 1 FOR UPDATE NOWAIT;    -- 获取不到锁立即报错
```

### 5.2 Advisory Lock 与死锁

```sql
-- Advisory Lock（分布式互斥）
SELECT pg_try_advisory_xact_lock(user_id::bigint, resource_type::bigint);  -- 事务级，自动释放
SELECT pg_advisory_lock(12345);           -- 会话级，需手动释放
SELECT pg_advisory_unlock(12345);

-- 锁等待配置
SET lock_timeout = '5s';
SET deadlock_timeout = '1s';

-- 查看锁等待
SELECT blocked.pid, blocked.query, blocking.pid, blocking.query
FROM pg_locks blocked JOIN pg_locks blocking
    ON blocked.locktype = blocking.locktype AND blocked.pid != blocking.pid
    AND blocked.granted = false AND blocking.granted = true;
```

### 5.3 SAVEPOINT

```sql
BEGIN;
    INSERT INTO orders (user_id, amount) VALUES (1, 100);
    SAVEPOINT sp1;
    INSERT INTO order_items VALUES (currval('orders_id_seq'), 'SKU-001', -1);
    ROLLBACK TO SAVEPOINT sp1;  -- 回滚到保存点
    INSERT INTO order_items VALUES (currval('orders_id_seq'), 'SKU-001', 1);
COMMIT;
```

### 实战经验

1. **SKIP LOCKED**：避免 worker 竞争同一行导致锁等待，比 `FOR UPDATE` + `NOWAIT` 重试更高效。
2. **Advisory Lock 哈希冲突**：单参数版本可能冲突，推荐双参数 `pg_advisory_lock(bigint, bigint)`。
3. **SERIALIZABLE 误报**：SSI 实现可能有 false positive 导致事务回滚，高并发慎用。
4. **长事务持有锁**：设置 `idle_in_transaction_session_timeout` 防止忘记提交/回滚。

### 面试题

- Q: FOR UPDATE 和 FOR SHARE 区别？A: FOR UPDATE 排他锁阻止其他读写；FOR SHARE 共享锁允许读阻止写。
- Q: 如何实现分布式互斥？A: Advisory Lock，`pg_advisory_lock(bigint, bigint)` 实现跨会话互斥。

---

## 6. 表分区

### 6.1 声明式分区（PG 10+）

```sql
-- Range 分区
CREATE TABLE orders (id BIGSERIAL, user_id BIGINT NOT NULL, amount NUMERIC(18,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), status VARCHAR(20) DEFAULT 'pending')
PARTITION BY RANGE (created_at);
CREATE TABLE orders_2025q1 PARTITION OF orders FOR VALUES FROM ('2025-01-01') TO ('2025-04-01');
CREATE TABLE orders_default PARTITION OF orders DEFAULT;  -- PG 11+ 默认分区

-- List 分区
CREATE TABLE users (id BIGSERIAL, name TEXT, region VARCHAR(10)) PARTITION BY LIST (region);
CREATE TABLE users_cn PARTITION OF users FOR VALUES IN ('CN','HK','TW');

-- Hash 分区
CREATE TABLE events (id BIGSERIAL, payload JSONB) PARTITION BY HASH (id);
CREATE TABLE events_p0 PARTITION OF events FOR VALUES WITH (MODULUS 4, REMAINDER 0);

-- 子分区：先 Range 再 List
CREATE TABLE sensor_data_2025q1 PARTITION OF sensor_data
    FOR VALUES FROM ('2025-01-01') TO ('2025-04-01') PARTITION BY LIST (metric_type);
```

### 6.2 分区管理

```sql
-- ATTACH/DETACH
ALTER TABLE orders ATTACH PARTITION orders_2025q3 FOR VALUES FROM ('2025-07-01') TO ('2025-10-01');
ALTER TABLE orders DETACH PARTITION orders_2025q1;  -- 分区切换归档

-- 分区裁剪：确保查询条件包含分区键，PG 14+ 支持执行时裁剪
EXPLAIN SELECT * FROM orders WHERE created_at >= '2025-01-01' AND created_at < '2025-04-01';
```

### 实战经验

1. **主键必须包含分区键**：PG 硬性限制，全局唯一约束需通过应用层或触发器保证。
2. **分区数量上限**：建议不超过 1000 个，过多导致规划时间长和内存消耗大。
3. **分区裁剪失效**：对分区键使用函数（如 `DATE(created_at)`）会导致裁剪失效。

### 面试题

- Q: 分区表主键为什么必须包含分区键？A: 每个分区是独立物理表，不包含分区键无法保证跨分区唯一性。
- Q: 如何实现全局唯一约束？A: PG 原生不支持，可通过 Snowflake ID、外部唯一性检查或 DEFERRABLE 约束。

---

## 7. 流复制与高可用

### 7.1 物理流复制

```bash
# 主库 postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = '1GB'
synchronous_standby_names = 'standby1'  # 同步复制

# pg_hba.conf
host replication replicator 192.168.1.0/24 scram-sha-256

# 备库初始化
pg_basebackup -h primary_host -U replicator -D /var/lib/postgresql/data -Fp -Xs -P -R
```

### 7.2 逻辑复制与复制槽

```sql
-- 逻辑复制（PG 10+，可选择性复制表/行，备库可读写）
CREATE PUBLICATION pub_orders FOR TABLE orders WHERE (status = 'completed');
CREATE SUBSCRIPTION sub_orders CONNECTION 'host=primary dbname=mydb user=replicator'
    PUBLICATION pub_orders WITH (create_slot = true);

-- 复制槽（防止 WAL 被过早删除，但未使用会导致磁盘满）
SELECT pg_create_physical_replication_slot('standby1_slot');
SELECT slot_name, active, pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) FROM pg_replication_slots;
```

### 7.3 高可用方案

```bash
# 手动 Failover
pg_ctl promote -D /var/lib/postgresql/data

# Patroni + etcd（推荐生产方案）
# 通过 etcd leader 选举，Patroni 监控主库健康，故障时自动提升备库
# 配置关键：synchronous_standby_names = 'FIRST 1 (standby1, standby2)' 实现降级策略
```

### 实战经验

1. **复制槽泄漏**：备库宕机后未清理复制槽，主库 WAL 无限堆积。必须监控 `active` 状态。
2. **逻辑复制限制**：不支持 DDL 复制、大事务可能导致延迟，DDL 需两端手动同步。
3. **同步复制可用性**：同步备库宕机会阻塞主库写入，建议配置 `FIRST 1` 降级策略。
4. **Patroni 防脑裂**：依赖 etcd 分布式一致性，etcd 至少 3 节点。

### 面试题

- Q: 物理复制和逻辑复制区别？A: 物理基于 WAL 整实例复制备库只读；逻辑基于逻辑解码可选择性复制备库可读写。
- Q: 复制槽作用和风险？A: 确保备库断连后 WAL 不被删除，但未使用的复制槽导致 WAL 堆积磁盘满。

---

## 8. 性能调优

### 8.1 关键参数（64GB 内存服务器参考）

```sql
shared_buffers = '16GB'              -- 共享缓冲区，总内存 25%
effective_cache_size = '48GB'        -- 规划器缓存估计，总内存 75%
work_mem = '64MB'                    -- 排序/哈希内存（每个操作分配，注意并发）
maintenance_work_mem = '2GB'         -- VACUUM/CREATE INDEX 内存
wal_buffers = '64MB'
random_page_cost = 1.1               -- SSD 环境调低（默认 4.0）
max_parallel_workers_per_gather = 4  -- 并行查询 worker 数
max_connections = 200                -- 配合 PgBouncer 使用
```

### 8.2 EXPLAIN ANALYZE 详解

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) SELECT * FROM orders WHERE user_id = 1001;

-- 关键扫描类型：Seq Scan（全表，需优化）、Index Scan（索引定位需回表）、
--   Index Only Scan（仅索引，最快）、Bitmap Scan（多条件/低选择性）、
--   Parallel Seq Scan（并行扫描）
-- 连接类型：Nested Loop（小表驱动大表）、Hash Join（等值连接大表）、Merge Join（已排序数据）
-- BUFFERS：shared hit（缓冲命中）、shared read（磁盘读取）、temp（work_mem 不足信号）
```

### 8.3 pg_stat_statements 与连接池

```sql
-- 启用：shared_preload_libraries = 'pg_stat_statements'
SELECT query, calls, total_exec_time, mean_exec_time
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;
```

```ini
; PgBouncer 配置（transaction 模式）
[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
; 注意：transaction 模式不支持 SET 持久化、PREPARE、LISTEN/NOTIFY、advisory locks
```

### 实战经验

1. **work_mem 陷阱**：每个操作独立分配，复杂查询可能同时使用多个，100连接实际消耗远超预期。
2. **random_page_cost**：使用 SSD 务必调低到 1.1-1.5，否则规划器过度偏好顺序扫描。
3. **统计信息**：`ANALYZE` 是免费的性能优化，大表变更后务必手动执行。
4. **并行度权衡**：不是越高越好，过多 worker 争抢 CPU/I/O，根据核心数和并发调整。

### 面试题

- Q: shared_buffers 为什么不设为总内存的 50%+？A: PG 双缓冲策略（shared_buffers + OS Page Cache），过大反而浪费。
- Q: PgBouncer 三种 pool_mode 区别？A: session 连接灵活池化差；transaction 事务结束归还池化好但有限制；statement 每语句归还限制最多。

---

## 9. 备份恢复

### 9.1 逻辑备份

```bash
pg_dump -Fc -j 4 -f mydb.dump mydb          # 自定义格式，支持并行恢复
pg_dump -Fd -j 4 -f /backup/mydb_dir mydb   # 目录格式，支持并行备份
pg_dump -s -f schema.sql mydb               # 只备份 schema
pg_dumpall -f all_databases.sql              # 全实例备份（含全局对象）
pg_restore -d mydb -j 4 --clean mydb.dump   # 并行恢复
```

### 9.2 物理备份与 PITR

```bash
# WAL 归档配置
# archive_mode = on
# archive_command = 'cp %p /backup/wal_archive/%f'

# PITR 恢复
restore_command = 'cp /backup/wal_archive/%f %p'
recovery_target_time = '2025-06-15 14:30:00'  # 或 recovery_target_xid / recovery_target_name
recovery_target_action = 'promote'
# 创建 recovery.signal 后启动 PostgreSQL
```

### 9.3 pgBackRest

```bash
pgbackrest --stanza=mydb --type=full backup      # 全量
pgbackrest --stanza=mydb --type=diff backup       # 差异
pgbackrest --stanza=mydb --type=incr backup       # 增量
pgbackrest --stanza=mydb --type=time --target="2025-06-15 14:30:00" restore  # PITR
```

### 实战经验

1. **物理备份 + WAL 归档是标配**：唯一能保证 RPO 接近 0 的方案，逻辑备份作为补充。
2. **pg_dump 不备份全局对象**：角色、表空间需要 pg_dumpall。
3. **备份验证**：定期在测试环境恢复演练，或使用 `pg_verifybackup`（PG 13+）验证完整性。
4. **pgBackRest vs Barman**：pgBackRest 支持差异/增量恢复更快；Barman 配置简单支持远程备份。

### 面试题

- Q: PITR 原理？A: 基础物理备份 + WAL 归档，从基础备份重放 WAL 到指定恢复目标点。
- Q: -Fc 和 -Fd 区别？A: -Fc 自定义压缩格式单文件支持并行恢复；-Fd 目录格式支持并行备份和恢复。

---

## 10. 监控运维

### 10.1 核心监控视图

```sql
-- 活动连接与慢查询
SELECT pid, usename, state, wait_event, query,
    EXTRACT(EPOCH FROM (NOW() - query_start)) AS duration_sec
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration_sec DESC;

-- 表统计（膨胀监控）
SELECT relname, seq_scan, idx_scan, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;

-- 索引使用（发现无用索引）
SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;

-- 锁等待
SELECT locktype, relation::regclass, mode, granted, pid FROM pg_locks WHERE NOT granted;

-- 复制状态
SELECT pid, client_addr, state, sync_state,
    pg_wal_lsn_diff(sent_lsn, replay_lsn) AS lag_bytes FROM pg_stat_replication;
```

### 10.2 日志与监控体系

```sql
-- postgresql.conf
log_min_duration_statement = '200ms'  -- 慢查询阈值
log_lock_waits = on                   -- 记录锁等待
log_temp_files = 0                    -- 记录临时文件使用
```

```yaml
# Prometheus + postgres_exporter 关键指标
# pg_up, pg_stat_activity_count, pg_stat_database_deadlocks,
# pg_replication_lag, pg_table_size_bytes, pg_stat_user_tables_dead_tups
# 告警：连接数 > 80% max_connections、复制延迟 > 60s、死锁数 > 0、表膨胀率 > 50%
```

### 实战经验

1. **idle in transaction**：事务开启后长时间未提交，阻止 VACUUM。设置 `idle_in_transaction_session_timeout`。
2. **log_min_duration_statement**：从 500ms 开始，根据实际情况调整，太小产生大量日志。
3. **复制延迟监控**：PG 10+ 的 `write_lag/flush_lag/replay_lag` 直接显示延迟时间。

### 面试题

- Q: 如何排查连接数暴增？A: `pg_stat_activity` 按 state 和 query 分组统计，结合应用日志定位。
- Q: 如何监控表膨胀？A: `pg_stat_user_tables` 的 dead/live 比率，或 `pgstattuple` 扩展获取精确膨胀率。

---

## 11. 扩展生态

### 11.1 PostGIS（地理空间）

```sql
CREATE EXTENSION postgis;
CREATE TABLE locations (id SERIAL, name TEXT, geom GEOMETRY(Point, 4326));
CREATE INDEX idx_locations_geom ON locations USING GIST(geom);

-- 5km 范围查询
SELECT name, ST_Distance(geom, ST_SetSRID(ST_MakePoint(116.4, 39.9), 4326)) AS distance
FROM locations WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(116.4, 39.9), 4326), 5000);
```

### 11.2 pg_trgm（模糊搜索）

```sql
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_users_name_trgm ON users USING GIN(name gin_trgm_ops);
SELECT * FROM users WHERE name LIKE '%张%';
SELECT * FROM users WHERE similarity(name, '张三') > 0.3;
```

### 11.3 hstore / pgcrypto / TimescaleDB / Citus

```sql
-- hstore（键值对）
CREATE EXTENSION hstore;
CREATE INDEX idx_products_attrs ON products USING GIN(attrs);
SELECT * FROM products WHERE attrs->'color' = '黑色';

-- pgcrypto（加密）
CREATE EXTENSION pgcrypto;
INSERT INTO users (email, password_hash) VALUES ('u@e.com', crypt('pwd', gen_salt('bf', 10)));

-- TimescaleDB（时序数据）
CREATE EXTENSION timescaledb;
SELECT create_hypertable('sensor_readings', 'time');
CREATE MATERIALIZED VIEW sensor_hourly WITH (timescaledb.continuous) AS
    SELECT time_bucket('1 hour', time) AS bucket, sensor_id, AVG(value) FROM sensor_readings GROUP BY 1,2;
SELECT add_retention_policy('sensor_readings', INTERVAL '90 days');

-- Citus（分布式）
CREATE EXTENSION citus;
SELECT create_distributed_table('orders', 'user_id');  -- 按 user_id 哈希分布
SELECT create_reference_table('regions');                -- 广播到所有节点
```

### 实战经验

1. **PostGIS**：空间查询必须建 GiST 索引；小范围用 Geometry（快），大范围用 Geography（精确）。
2. **pg_trgm**：GIN trgm 索引较大，短文本效果最佳，长文本用全文搜索。
3. **hstore 局限**：不支持嵌套和类型约束，复杂结构用 JSONB。
4. **Citus 限制**：不支持跨节点外键、唯一约束须含分布键、部分窗口函数受限。

### 面试题

- Q: Geometry 和 Geography 区别？A: Geometry 平面坐标快但不精确；Geography 球面坐标精确但慢。
- Q: TimescaleDB vs 普通分区表？A: TimescaleDB 提供自动分区、连续聚合、压缩、保留策略等时序特性。

---

## 附录：运维速查

```sql
-- 数据库/表大小
SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;

-- 终止会话
SELECT pg_terminate_backend(pid);   -- 终止会话
SELECT pg_cancel_backend(pid);      -- 取消当前查询

-- 创建命名恢复点
SELECT pg_create_restore_point('before_major_update');

-- 表膨胀率（需 pgstattuple 扩展）
CREATE EXTENSION pgstattuple;
SELECT * FROM pgstattuple('orders');
```

---

> **文档版本**：v1.0 | **适用版本**：PostgreSQL 14-17 | **最后更新**：2025-06
