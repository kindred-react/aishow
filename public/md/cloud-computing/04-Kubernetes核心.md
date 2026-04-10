# 04 Kubernetes 核心

## 4.1 K8s 概述

### 4.1.1 为什么需要 K8s

Docker 解决了单机容器的打包和运行问题，但在生产环境中面临以下挑战：

| 挑战 | Docker 的局限 | Kubernetes 的解决方案 |
|------|-------------|---------------------|
| **多机编排** | 只能管理单机容器 | 统一管理跨节点容器调度 |
| **服务发现** | 需要额外工具（Consul 等） | 内置 DNS（CoreDNS）和 Service |
| **负载均衡** | 需要外部 LB 配置 | 内置 Service 负载均衡 |
| **自动伸缩** | 需要手动或第三方工具 | HPA/VPA 自动伸缩 |
| **自我修复** | 容器崩溃后不会自动恢复 | 控制器自动重启/重建 Pod |
| **滚动更新** | 需要手动管理 | Deployment 原生支持滚动更新和回滚 |
| **配置管理** | 通过环境变量或挂载文件 | ConfigMap/Secret 统一管理 |
| **存储管理** | 数据卷绑定单机 | PV/PVC/StorageClass 抽象存储 |

**核心价值**：Kubernetes 将容器化应用从"能运行"提升到"能在集群中可靠、自动地大规模运行"，是云原生时代的基础设施操作系统。

### 4.1.2 K8s 核心理念
- **声明式配置**：告诉 K8s 期望状态，K8s 自动调节到该状态
- **控制器模式**：通过 Watch-Compare-Act 循环实现自我修复
- **松耦合架构**：每个组件独立，通过 API 通信

## 4.2 K8s 架构

### 4.2.1 控制平面（Master Node）
```
+--------------------------------------------------+
|                  Control Plane                    |
|                                                   |
|  +-------------+  +-------------+  +-----------+ |
|  | kube-apiserver|  |   etcd      |  | scheduler | |
|  +-------------+  +-------------+  +-----------+ |
|                                                   |
|  +------------------+  +-----------------------+  |
|  | kube-controller- |  |  cloud-controller-    |  |
|  | manager          |  |  manager              |  |
|  +------------------+  +-----------------------+  |
+--------------------------------------------------+
```

- **kube-apiserver**：所有操作的入口，REST API。是集群的"前台"，所有组件（kubectl、kubelet、scheduler 等）都通过它与集群交互。支持认证、授权、准入控制。在 K8s 1.31 中默认启用结构化日志。
- **etcd**：分布式键值存储，集群状态的唯一数据源。使用 Raft 协议保证一致性。生产环境建议 3 或 5 个节点的奇数集群。K8s 1.31 要求 etcd 3.5.x 版本。
- **scheduler**：Pod 调度决策。根据资源需求、亲和/反亲和、Taint/Toleration 等策略将 Pod 分配到合适的节点。
- **kube-controller-manager**：运行各种控制器（Deployment、Node、Endpoint、ReplicaSet、Job 等），每个控制器是一个独立的循环过程。
- **cloud-controller-manager**：与云厂商 API 交互，管理云资源（LoadBalancer、Node 地址、路由等）。自建集群可省略。

### 4.2.2 工作节点（Worker Node）
```
+--------------------------------------------------+
|                   Worker Node                     |
|                                                   |
|  +-----------+  +-----------+  +---------------+  |
|  | kubelet   |  | kube-proxy|  | Container     |  |
|  |           |  |           |  | Runtime       |  |
|  +-----------+  +-----------+  | (containerd)  |  |
|                                  +---------------+  |
|  +----------------------------------------------+ |
|  |              Pod 1  |  Pod 2  |  Pod 3       | |
|  +----------------------------------------------+ |
+--------------------------------------------------+
```

- **kubelet**：节点代理，确保容器按 PodSpec 运行。向 API Server 注册节点，汇报节点状态，执行 Pod 的生命周期管理。
- **kube-proxy**：维护网络规则，实现 Service 路由。K8s 1.31 中默认使用 iptables 模式，推荐使用 IPVS 模式以获得更好的大规模性能。
- **Container Runtime**：通过 CRI（Container Runtime Interface）运行容器。K8s 1.31 推荐使用 **containerd 2.0**，已弃用 Docker-shim。

## 4.3 Pod

### 4.3.1 Pod 基本概念

Pod 是 Kubernetes 中**最小的调度和部署单元**，也是资源分配的基本单位。一个 Pod 可以包含一个或多个紧密耦合的容器，它们共享以下资源：

```
+--------------------------------------------------+
|                      Pod                          |
|                                                   |
|  +----------------+  +----------------+           |
|  |  主容器 (App)   |  |  Sidecar 容器  |           |
|  |                |  |  (日志代理)     |           |
|  +----------------+  +----------------+           |
|                                                   |
|  共享: Network Namespace (同一 IP)                 |
|  共享: Storage Volumes                            |
|  共享: IPC Namespace                              |
+--------------------------------------------------+
```

**Pod 的核心特性**：
- **共享网络**：同一 Pod 内所有容器共享同一个 IP 地址和端口空间，容器间通过 `localhost` 通信
- **共享存储**：通过 Volume 实现容器间数据共享
- **原子调度**：Pod 内所有容器总是在同一个节点上运行
- **生命周期短暂**：Pod 本身是临时的，被控制器（Deployment 等）管理

**多容器模式**：
| 模式 | 说明 | 典型场景 |
|------|------|---------|
| Sidecar | 辅助主容器 | 日志收集（Fluentd）、代理（Envoy） |
| Ambassador | 代理外部连接 | 数据库连接池代理 |
| Adapter | 标准化输出 | 监控指标适配器 |

### 4.3.2 Pod 生命周期

```
Pending → Running → Succeeded / Failed / Unknown
                ↘ CrashLoopBackOff
```

各阶段说明：

| 阶段 | 说明 |
|------|------|
| **Pending** | Pod 已被 K8s 接受，但容器镜像尚未创建。可能正在等待调度、拉取镜像或挂载存储。 |
| **Running** | Pod 已绑定到节点，至少一个容器正在运行（或正在启动/重启中）。`ready` 字段指示是否所有容器都已就绪。 |
| **Succeeded** | Pod 中所有容器成功终止，且不会重启。适用于一次性任务（Job）。 |
| **Failed** | Pod 中所有容器已终止，且至少一个容器失败退出（退出码非 0 或被系统终止）。 |
| **Unknown** | 无法获取 Pod 状态，通常是与 Pod 所在节点通信失败。 |

**常见异常状态**：
| 状态 | 说明 |
|------|------|
| **CrashLoopBackOff** | 容器反复崩溃退出，K8s 指数退避重启（延迟从 10s 递增到最大 5min） |
| **ImagePullBackOff** | 镜像拉取失败（镜像不存在、权限不足、网络问题） |
| **ErrImagePull** | 镜像拉取出错，通常首次尝试失败 |
| **OOMKilled** | 容器内存超过 limits 被内核 OOM Killer 终止 |
| **ContainerCreating** | 容器正在创建中（拉取镜像、挂载 Volume 等） |
| **Terminating** | Pod 正在被删除，等待优雅终止（默认 30s 宽限期） |
| **Evicted** | Pod 被节点驱逐（磁盘压力、内存压力等） |

### 4.3.3 Pod 重启策略
| 策略 | 说明 |
|------|------|
| Always | 容器退出后总是重启（默认） |
| OnFailure | 非正常退出时重启 |
| Never | 从不重启 |

### 4.3.4 健康检查

Kubernetes 通过三种探针（Probe）来检测容器的健康状态：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: health-check-demo
  labels:
    app: health-demo
spec:
  containers:
  - name: app
    image: nginx:1.27
    ports:
    - containerPort: 80

    # 存活探针：检测容器是否存活，失败则重启容器
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80
        httpHeaders:
        - name: Custom-Header
          value: health-check
      initialDelaySeconds: 15    # 容器启动后等待 15s 再开始探测
      periodSeconds: 10           # 每 10s 探测一次
      timeoutSeconds: 3           # 单次探测超时时间
      successThreshold: 1         # 连续成功 1 次视为健康
      failureThreshold: 3         # 连续失败 3 次视为不健康

    # 就绪探针：检测容器是否就绪，失败则从 Service Endpoints 中移除
    readinessProbe:
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 2
      successThreshold: 1
      failureThreshold: 3

    # 启动探针：检测容器是否启动完成，启动完成前 liveness/readiness 不生效
    # 适用于启动较慢的应用（如 Java 应用）
    startupProbe:
      httpGet:
        path: /healthz
        port: 80
      failureThreshold: 30        # 最多失败 30 次（30 * 10s = 300s 启动宽限期）
      periodSeconds: 10
```

**三种探针对比**：

| 探针 | 作用 | 失败后果 | 适用场景 |
|------|------|---------|---------|
| **livenessProbe** | 检测容器是否存活 | 重启容器 | 死锁、无限循环等不可恢复故障 |
| **readinessProbe** | 检测是否可以接收流量 | 从 Service 摘除 | 等待加载缓存、连接数据库等 |
| **startupProbe** | 检测是否启动完成 | 重启容器（启动期间 liveness 不生效） | 启动较慢的应用 |

**探测方法**：
- `httpGet`：发送 HTTP 请求，2xx/3xx 视为成功
- `tcpSocket`：尝试建立 TCP 连接
- `exec`：在容器内执行命令，返回 0 视为成功
- `grpc`：使用 gRPC 健康检查协议（K8s 1.24+ 支持）

### 4.3.5 Pod 调度
- **nodeSelector**：节点标签选择
- **nodeAffinity**：节点亲和性
- **podAffinity/podAntiAffinity**：Pod 亲和/反亲和
- **Taint/Toleration**：污点与容忍

## 4.4 工作负载控制器

### 4.4.1 Deployment

Deployment 是最常用的工作负载控制器，用于管理**无状态应用**。它通过管理 ReplicaSet 来实现 Pod 的创建、滚动更新和回滚。

**核心能力**：
- 滚动更新（Rolling Update）：逐步替换旧版本 Pod，保证服务零停机
- 回滚（Rollback）：可以回退到任意历史版本
- 扩缩容：手动或通过 HPA 自动调整副本数
- 暂停/恢复：暂停更新以便批量修改

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: default
  labels:
    app: nginx
    env: production
spec:
  replicas: 3
  # 选择器：匹配带有 app=nginx 标签的 Pod
  selector:
    matchLabels:
      app: nginx

  # 更新策略
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # 滚动更新时最多多创建 1 个 Pod（超过 replicas 的数量）
      maxUnavailable: 0     # 滚动更新时最多不可用 0 个 Pod（保证零停机）

  # Pod 模板
  template:
    metadata:
      labels:
        app: nginx
        env: production
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        env:
        - name: TZ
          value: "Asia/Shanghai"
```

**常用操作命令**：
```bash
# 查看滚动更新状态
kubectl rollout status deployment/nginx-deployment

# 查看更新历史
kubectl rollout history deployment/nginx-deployment

# 回滚到上一版本
kubectl rollout undo deployment/nginx-deployment

# 回滚到指定版本
kubectl rollout undo deployment/nginx-deployment --to-revision=2

# 扩缩容
kubectl scale deployment/nginx-deployment --replicas=5
```

### 4.4.2 StatefulSet

StatefulSet 用于管理**有状态应用**，如数据库（MySQL、PostgreSQL）、消息队列（Kafka、RabbitMQ）等需要稳定标识和有序管理的场景。

**与 Deployment 的核心区别**：
| 特性 | Deployment | StatefulSet |
|------|-----------|-------------|
| Pod 名称 | 随机后缀（如 nginx-7d4f5b8c-x2k9p） | 固定序号（如 mysql-0、mysql-1） |
| 网络标识 | 不稳定，Pod 重建后 IP 和 DNS 变化 | 稳定，每个 Pod 有固定的 DNS 名称 |
| 存储卷 | Pod 重建后数据丢失（除非使用 PVC） | 每个 Pod 绑定独立的 PVC，重建后数据保留 |
| 部署顺序 | 并行创建 | 按序号顺序创建（0→1→2→...） |
| 删除顺序 | 并行删除 | 按序号逆序删除（...→2→1→0） |
| 更新策略 | RollingUpdate | RollingUpdate（按序逆序更新）/ OnDelete |

**StatefulSet 的 Pod DNS 格式**：
```
<pod-name>.<headless-service>.<namespace>.svc.cluster.local
例如：mysql-0.mysql-headless.default.svc.cluster.local
```

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: database
spec:
  serviceName: mysql-headless    # 必须关联一个 Headless Service
  replicas: 3
  selector:
    matchLabels:
      app: mysql

  # 更新策略
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      partition: 0               # 从序号 >= partition 的 Pod 开始更新

  # Pod 模板
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        ports:
        - containerPort: 3306
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: root-password
        volumeMounts:
        - name: mysql-data
          mountPath: /var/lib/mysql

  # 每个 Pod 对应一个独立的 PVC
  volumeClaimTemplates:
  - metadata:
      name: mysql-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: local-path
      resources:
        requests:
          storage: 20Gi
---
# Headless Service（必须配合使用）
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
  namespace: database
spec:
  clusterIP: None              # Headless Service
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
```

### 4.4.3 DaemonSet

DaemonSet 确保集群中**每个（或特定）节点**上运行一个 Pod 副本。当节点加入集群时自动为其创建 Pod，节点移除时自动回收。

**典型使用场景**：
- **日志收集**：Fluentd、Fluent Bit、Filebeat
- **监控 Agent**：node-exporter、Datadog Agent
- **网络插件**：Calico、Cilium 的 Agent 组件
- **存储守护进程**：Ceph、GlusterFS 的节点守护进程

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
  labels:
    app: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter

  # 更新策略
  updateStrategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1         # 一次最多 1 个节点上的 Pod 不可用

  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true          # 使用宿主机网络（监控场景常用）
      hostPID: true              # 使用宿主机 PID 命名空间
      tolerations:               # 容忍 Master 节点的污点
      - key: node-role.kubernetes.io/control-plane
        effect: NoSchedule
      containers:
      - name: node-exporter
        image: prom/node-exporter:v1.8.2
        args:
        - --web.listen-address=0.0.0.0:9100
        - --path.procfs=/host/proc
        - --path.sysfs=/host/sys
        ports:
        - containerPort: 9100
          hostPort: 9100
        volumeMounts:
        - name: proc
          mountPath: /host/proc
          readOnly: true
        - name: sys
          mountPath: /host/sys
          readOnly: true
      volumes:
      - name: proc
        hostPath:
          path: /proc
      - name: sys
        hostPath:
          path: /sys
```

### 4.4.4 Job / CronJob

**Job** 用于运行一次性任务，确保 Pod 成功执行完毕后终止。支持并行和串行模式。

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-migration
  namespace: backend
spec:
  # 并行 completions 个 Pod，总共需要 completions 个成功完成
  completions: 1                # 总共需要 1 个 Pod 成功完成
  parallelism: 1                # 同时运行 1 个 Pod
  backoffLimit: 6               # 最大重试次数（默认 6）
  activeDeadlineSeconds: 600    # 超时时间，超过后 Job 标记为失败
  ttlSecondsAfterFinished: 3600 # Job 完成后 1 小时自动清理
  template:
    spec:
      restartPolicy: Never       # Job 必须使用 Never 或 OnFailure
      containers:
      - name: migrate
        image: myapp:latest
        command: ["python", "migrate.py"]
```

**CronJob** 用于运行定时任务，基于 Cron 表达式调度。

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: database
spec:
  schedule: "0 2 * * *"         # 每天凌晨 2 点执行
  timeZone: "Asia/Shanghai"     # 时区（K8s 1.25+）
  concurrencyPolicy: Forbid     # 禁止并发运行（Replace=替换旧任务，Allow=允许并发）
  successfulJobsHistoryLimit: 5 # 保留最近 5 个成功的 Job
  failedJobsHistoryLimit: 3     # 保留最近 3 个失败的 Job
  startingDeadlineSeconds: 300  # 如果错过调度时间，300s 内仍可补执行
  jobTemplate:
    spec:
      backoffLimit: 2
      ttlSecondsAfterFinished: 86400
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: backup
            image: postgres:16
            command:
            - /bin/bash
            - -c
            - pg_dump -h db-host -U $DB_USER -d mydb | gzip > /backup/db-$(date +%Y%m%d).sql.gz
            env:
            - name: DB_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
```

### 4.4.5 ReplicaSet

ReplicaSet（RS）用于确保指定数量的 Pod 副本始终运行。它是 Deployment 的底层实现，**通常不直接使用**，而是由 Deployment 管理。

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: nginx-rs
  namespace: default
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.27
        ports:
        - containerPort: 80
```

**为什么不直接使用 ReplicaSet**：
- ReplicaSet 不支持滚动更新和回滚，更新时只能删除旧 RS 再创建新 RS
- Deployment 在 RS 之上增加了版本管理、滚动更新策略、回滚等高级功能
- Deployment 会自动创建和管理 RS（每次更新创建一个新的 RS）

**Deployment 与 ReplicaSet 的关系**：
```
Deployment (nginx-deployment)
  ├── ReplicaSet (nginx-deployment-7d4f5b8c)  ← 当前版本
  │     ├── Pod nginx-deployment-7d4f5b8c-x2k9p
  │     ├── Pod nginx-deployment-7d4f5b8c-m3n7q
  │     └── Pod nginx-deployment-7d4f5b8c-j8t5w
  └── ReplicaSet (nginx-deployment-6c8b9f7a)  ← 旧版本（回滚用）
        └── (已缩容为 0)
```

## 4.5 Service

### 4.5.1 Service 类型
| 类型 | 说明 | 使用场景 |
|------|------|---------|
| ClusterIP | 集群内部访问（默认） | 内部服务通信 |
| NodePort | 节点端口暴露 | 开发测试 |
| LoadBalancer | 云厂商 LB | 生产环境对外暴露 |
| ExternalName | DNS CNAME | 引用外部服务 |
| Headless | 无 ClusterIP | StatefulSet |

### 4.5.2 Service 发现
- **环境变量**：Pod 启动时注入
- **DNS**：CoreDNS 解析 `<service>.<namespace>.svc.cluster.local`

### 4.5.3 kube-proxy 工作模式

kube-proxy 运行在每个节点上，负责实现 Service 的负载均衡和网络代理。K8s 1.31 支持以下三种模式：

**1. iptables 模式（默认）**
```
客户端 Pod → Service ClusterIP → iptables 规则（随机选择后端 Pod）
```
- 原理：为每个 Service 创建 iptables 规则，将访问 ClusterIP 的流量随机转发到后端 Pod
- 优点：无需额外组件，兼容性好
- 缺点：规则随 Service/Endpoint 数量线性增长，大规模集群性能下降；不支持会话保持的精确控制；只支持随机负载均衡

**2. IPVS 模式（推荐生产环境）**
```
客户端 Pod → Service ClusterIP → IPVS 虚拟服务器（多种调度算法）
```
- 原理：基于 Linux 内核的 IPVS（IP Virtual Server）模块，使用哈希表查找后端，O(1) 复杂度
- 优点：性能高，支持多种负载均衡算法（rr、lc、wlc、sh 等），大规模集群表现优异
- 缺点：需要安装 ipvsadm、ipset 等内核模块

**3. nftables 模式（K8s 1.29+ Alpha）**
- 原理：使用 nftables 替代 iptables，是未来的发展方向
- 优点：规则合并效率更高，内核层面更优
- 缺点：目前处于 Alpha 阶段，不建议生产使用

| 特性 | iptables | IPVS |
|------|---------|------|
| 负载均衡算法 | 随机 | rr、lc、wlc、sh、sed、nq |
| 大规模性能 | O(n)，Service 多时性能下降 | O(1)，哈希表查找 |
| 内核要求 | 标准 Linux | 需要 ipvs 内核模块 |
| 会话保持 | 不支持 | 支持（--session-affinity） |
| 适用规模 | < 5000 Service | > 5000 Service |

## 4.6 ConfigMap 与 Secret

### 4.6.1 ConfigMap

ConfigMap 用于存储**非敏感的配置数据**，以键值对形式管理。Pod 可以通过环境变量、命令行参数或 Volume 挂载的方式使用 ConfigMap。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: default
data:
  # 简单键值对
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  # 多行配置文件
  application.yml: |
    server:
      port: 8080
    spring:
      datasource:
        url: jdbc:mysql://db-host:3306/mydb
        username: app_user
    logging:
      level:
        root: INFO
        com.example: DEBUG
---
apiVersion: v1
kind: Pod
metadata:
  name: configmap-demo
  namespace: default
spec:
  containers:
  - name: app
    image: myapp:latest
    # 方式1：作为环境变量注入
    env:
    - name: APP_LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: LOG_LEVEL
    - name: APP_MAX_CONN
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: MAX_CONNECTIONS
    # 方式2：批量注入为环境变量
    envFrom:
    - configMapRef:
        name: app-config
    # 方式3：作为文件挂载
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      items:                    # 可选：只挂载特定 key
      - key: application.yml
        path: application.yml
```

**注意事项**：
- ConfigMap 不提供加密，敏感数据应使用 Secret
- ConfigMap 有大小限制（1MiB）
- ConfigMap 更新后，以 Volume 挂载的配置会自动更新（有延迟），环境变量方式不会自动更新
- ConfigMap 必须在 Pod 引用它之前创建

### 4.6.2 Secret

Secret 用于存储**敏感数据**，如密码、Token、证书等。数据以 Base64 编码存储（注意：Base64 不是加密，仅是编码），建议配合 RBAC 和加密存储使用。

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: default
type: Opaque                    # 通用类型
data:
  # Base64 编码的值
  username: YXBwX3VzZXI=       # echo -n "app_user" | base64
  password: U2VjdXJlQDEyMw==   # echo -n "Secure@123" | base64
---
# Docker 镜像拉取凭证
apiVersion: v1
kind: Secret
metadata:
  name: registry-secret
  namespace: default
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: eyJhdXRocyI6eyJodHRwczovL2luZGV4LmRvY2tlci5pby92MS8iOnsidXNlcm5hbWUiOiJ1c2VyIiwicGFzc3dvcmQiOiJwYXNzIn19fQ==
---
# TLS 证书
apiVersion: v1
kind: Secret
metadata:
  name: tls-secret
  namespace: default
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi...   # 证书内容
  tls.key: LS0tLS1CRUdJTi...   # 私钥内容
---
apiVersion: v1
kind: Pod
metadata:
  name: secret-demo
  namespace: default
spec:
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: DB_USERNAME
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: username
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-credentials
          key: password
    volumeMounts:
    - name: secret-volume
      mountPath: /etc/secrets
      readOnly: true
  # 镜像拉取凭证
  imagePullSecrets:
  - name: registry-secret
  volumes:
  - name: secret-volume
    secret:
      secretName: db-credentials
```

**Secret 类型**：
| 类型 | 用途 |
|------|------|
| Opaque | 通用键值对 |
| kubernetes.io/dockerconfigjson | Docker Registry 认证 |
| kubernetes.io/tls | TLS 证书 |
| kubernetes.io/basic-auth | 基本认证 |
| kubernetes.io/service-account-token | ServiceAccount Token（自动创建） |

**安全建议**：
- 启用 etcd 静态加密（EncryptionConfiguration）
- 使用 RBAC 限制 Secret 的访问权限
- 考虑使用外部密钥管理（如 Vault、AWS Secrets Manager）通过 CSI 驱动注入
- 不要将 Secret 编码到镜像中

## 4.7 Namespace

Namespace 是 Kubernetes 中的**逻辑隔离机制**，将一个物理集群划分为多个虚拟集群。适用于多团队、多项目、多环境的资源隔离。

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    env: dev
    team: backend
---
# 命名空间级别的资源配额
apiVersion: v1
kind: ResourceQuota
metadata:
  name: dev-quota
  namespace: development
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    services: "20"
    persistentvolumeclaims: "30"
---
# 命名空间级别的默认资源限制
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: development
spec:
  limits:
  - default:                    # 默认 limits
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:              # 默认 requests
      cpu: "100m"
      memory: "128Mi"
    max:                        # 最大值
      cpu: "2"
      memory: "2Gi"
    min:                        # 最小值
      cpu: "50m"
      memory: "64Mi"
    type: Container
```

**K8s 默认命名空间**：
| 命名空间 | 说明 |
|---------|------|
| default | 未指定命名空间时的默认空间 |
| kube-system | K8s 系统组件（CoreDNS、kube-proxy 等） |
| kube-public | 公开可读的资源（如集群信息 ConfigMap） |
| kube-node-lease | 节点心跳租约（提高节点检测效率） |

**Namespace 的隔离范围**：
- **能隔离**：Pod、Service、Deployment、ConfigMap、Secret、PVC、RBAC 资源
- **不能隔离**：节点、PV、StorageClass、Namespace 本身
- **网络隔离**：默认所有 Namespace 的 Pod 可以互相通信，需配合 NetworkPolicy 实现网络隔离

## 4.8 面试常见问题

### Q1: K8s 的架构组件有哪些？各自的作用？

Kubernetes 采用经典的 Master-Worker 架构，分为控制平面和工作节点两部分：

**控制平面（Master Node）**：
- **kube-apiserver**：集群的统一入口，所有组件交互都通过它。提供 REST API，处理认证、授权、准入控制。支持水平扩展。
- **etcd**：分布式一致性键值存储，是集群状态的唯一数据源（Single Source of Truth）。存储所有集群数据，使用 Raft 协议保证一致性。生产环境建议 3 或 5 节点集群。
- **kube-scheduler**：负责 Pod 调度，根据资源需求、约束条件（亲和性、Taint/Toleration 等）将 Pod 分配到合适的节点。
- **kube-controller-manager**：运行多个控制器的守护进程，包括 Deployment Controller、Node Controller、Endpoint Controller、ServiceAccount Controller 等。每个控制器通过 Watch API 监听资源变化，执行调谐（Reconcile）操作。
- **cloud-controller-manager**：将云厂商特定的逻辑抽象为独立组件。管理 LoadBalancer、Node 地址、路由等云资源。

**工作节点（Worker Node）**：
- **kubelet**：节点代理，负责注册节点、管理 Pod 生命周期、执行健康检查、上报节点状态。
- **kube-proxy**：维护节点上的网络规则，实现 Service 的负载均衡。支持 iptables、IPVS 模式。
- **Container Runtime**：通过 CRI 接口运行容器，推荐使用 containerd 2.0。

### Q2: Pod 和容器的区别？为什么 K8s 不直接管理容器？

**Pod 和容器的区别**：
- **容器**（Container）是进程级别的隔离和运行环境，由容器运行时（containerd）管理
- **Pod** 是 Kubernetes 的最小调度和部署单元，可以包含一个或多个容器

**为什么 K8s 不直接管理容器**：
1. **共享资源需求**：有些应用需要多个进程紧密协作（如主应用 + 日志代理），它们需要共享网络（同一 IP）、共享存储、共享 IPC 命名空间，直接管理容器无法满足这种需求
2. **生命周期绑定**：同一 Pod 内的容器作为一个整体调度到同一节点，同时创建、同时销毁
3. **抽象层次**：K8s 需要在容器之上添加健康检查、重启策略、资源限制、服务发现等能力，Pod 是承载这些能力的载体
4. **多容器模式**：Pod 支持 Sidecar、Ambassador、Adapter 等设计模式，实现关注点分离

### Q3: Deployment 和 StatefulSet 的区别？

| 维度 | Deployment | StatefulSet |
|------|-----------|-------------|
| **适用场景** | 无状态应用（Web 服务、API） | 有状态应用（数据库、MQ） |
| **Pod 标识** | 随机哈希后缀，不稳定 | 固定序号（app-0、app-1），稳定 |
| **网络标识** | Pod 重建后 DNS 变化 | 每个 Pod 有稳定的 DNS 名称 |
| **存储** | 所有 Pod 共享 PVC 或无持久化 | 每个 Pod 独立的 PVC，数据不丢失 |
| **部署顺序** | 并行创建 | 按序号顺序创建（0→1→2） |
| **更新顺序** | 并行滚动更新 | 按序号逆序滚动更新 |
| **扩缩容** | 随机扩缩 | 按序号顺序扩缩 |

**选择原则**：如果应用不依赖稳定的网络标识和持久化存储，使用 Deployment；如果应用需要稳定的标识、有序部署和独立存储，使用 StatefulSet。

### Q4: Service 的几种类型？ClusterIP 和 Headless 的区别？

**Service 类型**：
1. **ClusterIP**（默认）：分配一个集群内部 IP，只能在集群内访问
2. **NodePort**：在每个节点上开放一个端口（30000-32767），外部可通过 `节点IP:端口` 访问
3. **LoadBalancer**：在 NodePort 基础上，自动创建云厂商的负载均衡器
4. **ExternalName**：将 Service 映射到外部 DNS 名称（CNAME），不创建代理
5. **Headless Service**：将 `clusterIP` 设为 `None`，不分配 VIP

**ClusterIP vs Headless**：
- **ClusterIP**：kube-proxy 为 Service 创建一个虚拟 IP（VIP），请求到达 VIP 后由 iptables/IPVS 负载均衡到后端 Pod。DNS 解析返回 ClusterIP。
- **Headless Service**：不分配 VIP，DNS 解析直接返回后端所有 Pod 的 IP 地址。客户端直接连接 Pod，适用于需要直连特定 Pod 的场景（如 StatefulSet 中每个实例需要被独立寻址）。

### Q5: kube-proxy 的 iptables 模式和 IPVS 模式有什么区别？

| 维度 | iptables 模式 | IPVS 模式 |
|------|-------------|----------|
| **实现原理** | 为每个 Service 创建 iptables NAT 规则 | 使用内核 IPVS 模块，基于哈希表转发 |
| **时间复杂度** | O(n)，规则数随 Service 增长线性增加 | O(1)，哈希表查找 |
| **负载均衡算法** | 仅随机 | 支持轮询（rr）、最小连接（lc）、加权最小连接（wlc）、源地址哈希（sh）等 |
| **大规模性能** | Service 超过 5000 时性能明显下降 | 万级 Service 仍保持高性能 |
| **会话保持** | 不支持 | 支持 |
| **额外依赖** | 无 | 需要 ipvs 内核模块、ipset |
| **适用场景** | 中小规模集群 | 大规模生产集群 |

**选择建议**：节点数 < 1000、Service < 5000 可使用 iptables；超过此规模建议使用 IPVS。

### Q6: livenessProbe 和 readinessProbe 的区别？

| 维度 | livenessProbe | readinessProbe |
|------|-------------|---------------|
| **目的** | 检测容器是否存活 | 检测容器是否就绪接收流量 |
| **失败后果** | **重启容器** | 从 Service Endpoints 中**摘除**，不再接收流量 |
| **影响范围** | 仅影响当前容器 | 影响服务的可用性 |
| **典型场景** | 死锁、无限循环、进程假死 | 等待加载缓存、连接数据库、预热完成 |
| **配置建议** | 设置较长的 initialDelaySeconds | 设置较短的 initialDelaySeconds |

**关键区别**：livenessProbe 失败会导致容器重启，如果配置不当（如探测过于敏感）可能导致频繁重启形成"CrashLoop"；readinessProbe 失败只是暂时不接收流量，不会重启容器，更安全。

**startupProbe 的补充**：K8s 1.18+ 引入 startupProbe，用于慢启动应用。在 startupProbe 成功之前，livenessProbe 和 readinessProbe 不会生效，避免启动过程中被误杀。

### Q7: 什么是 Pod 反亲和？使用场景？

**Pod 反亲和（podAntiAffinity）** 是一种调度约束，指定 Pod 不应该与满足特定标签条件的 Pod 部署在同一拓扑域（如同一节点、同一可用区）。

**两种类型**：
- **requiredDuringSchedulingIgnoredDuringExecution**（硬约束）：调度时必须满足，如果无法满足则 Pod 无法调度
- **preferredDuringSchedulingIgnoredDuringExecution**（软约束）：调度时尽量满足，无法满足时仍可调度

**典型使用场景**：
1. **高可用**：将同一应用的多个副本分散到不同节点，避免单节点故障导致服务不可用
2. **资源均匀分布**：避免同一节点上运行过多高负载 Pod
3. **避免资源争抢**：将 CPU/GPU 密集型应用分散到不同节点

```yaml
# 示例：确保每个节点最多运行一个 Nginx Pod
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector:
        matchExpressions:
        - key: app
          operator: In
          values:
          - nginx
      topologyKey: kubernetes.io/hostname   # 拓扑域为节点级别
```
