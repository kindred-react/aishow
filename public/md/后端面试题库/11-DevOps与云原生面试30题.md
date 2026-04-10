# DevOps与云原生面试30题

> 本题库涵盖Docker核心原理、Kubernetes架构与核心资源、CI/CD流水线、容器编排对比、服务网格、可观测性（日志/监控/告警）、GitOps与基础设施即代码等核心知识点，共30道面试题，适合后端开发工程师与DevOps工程师面试准备。

---

### Q1: Docker的核心原理是什么？镜像分层机制是怎样的？⭐

**答案：**

**Docker核心架构：**

Docker采用C/S架构，由以下组件构成：

```
Docker Client → Docker Daemon（dockerd）
                    ↓
              Containerd（容器运行时管理）
                    ↓
              Containerd-shim
                    ↓
              runc（OCI标准容器运行时）
```

- **Docker Client**：docker命令行工具，通过REST API与Daemon通信
- **Docker Daemon（dockerd）**：后台服务进程，管理镜像、容器、网络、数据卷
- **Containerd**：容器生命周期管理（v1.11后从Daemon中拆分）
- **runc**：OCI（Open Container Initiative）标准的容器运行时，负责创建和运行容器

**镜像分层机制（UnionFS）：**

Docker镜像由多个只读层（Layer）组成，采用联合文件系统（Union File System）实现：

```
┌─────────────────────┐
│  可写容器层（RW）    │  ← 容器运行时的修改
├─────────────────────┤
│  Layer N（只读）     │  ← ADD 指令
├─────────────────────┤
│  Layer 2（只读）     │  ← RUN 指令
├─────────────────────┤
│  Layer 1（只读）     │  ← COPY 指令
├─────────────────────┤
│  Base Image（只读）  │  ← FROM 指令
└─────────────────────┘
```

**分层机制的核心优势：**

1. **共享层**：多个容器可以共享相同的底层镜像层，节省磁盘空间
2. **缓存机制**：构建镜像时，如果某层没有变化，直接使用缓存，加速构建
3. **复制-on-Write（CoW）**：容器修改文件时，从只读层复制到可写层，不影响底层镜像

**OverlayFS（Docker默认存储驱动）：**

```
Upper Dir（容器可写层）
Lower Dir（镜像只读层，可多层）
Merged Dir（合并视图，容器看到的文件系统）
Work Dir（内部工作目录）
```

**查看镜像分层：**
```bash
# 查看镜像历史
docker history nginx:latest

# 查看镜像分层详情
docker inspect nginx:latest
```

---

### Q2: Dockerfile有哪些最佳实践？如何使用多阶段构建？⭐⭐

**答案：**

**Dockerfile最佳实践：**

**1. 使用精简基础镜像**
```dockerfile
# 推荐：使用Alpine或distroless
FROM golang:1.21-alpine AS builder
# 或
FROM gcr.io/distroless/static-debian12
```

**2. 合理利用构建缓存**
```dockerfile
# 先复制依赖文件（变化少），再复制源码（变化多）
COPY go.mod go.sum ./
RUN go mod download          # 这层会被缓存
COPY . .                     # 源码变化不影响上面的缓存
RUN go build -o app
```

**3. 减少镜像层数**
```dockerfile
# 不推荐：每条RUN产生一层
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean

# 推荐：合并为一条RUN
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

**4. 使用.dockerignore**
```
# .dockerignore
.git
node_modules
*.md
Dockerfile
```

**5. 不以root用户运行**
```dockerfile
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser
```

**6. 指定健康检查**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

**多阶段构建（Multi-Stage Build）：**

核心思想：构建阶段使用完整工具链，运行阶段只保留编译产物，大幅减小镜像体积。

```dockerfile
# ===== 阶段一：构建 =====
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# ===== 阶段二：运行 =====
FROM alpine:3.18

# 安装必要工具（如ca-certificates）
RUN apk --no-cache add ca-certificates tzdata
ENV TZ=Asia/Shanghai

WORKDIR /app
COPY --from=builder /app/server .
COPY --from=builder /app/configs ./configs

EXPOSE 8080
USER nobody
ENTRYPOINT ["./server"]
```

**多阶段构建效果对比：**

| 指标 | 不使用多阶段 | 使用多阶段 |
|------|-------------|-----------|
| 镜像大小 | ~800MB | ~20MB |
| 攻击面 | 大（含编译工具） | 小（仅运行时） |
| 启动速度 | 慢 | 快 |

**Java应用多阶段构建示例：**
```dockerfile
# 构建阶段
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# 运行阶段
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

### Q3: Docker网络有哪些模式？分别适用于什么场景？⭐⭐

**答案：**

Docker提供四种网络模式：

**1. Bridge模式（默认）**

```bash
# 创建自定义bridge网络
docker network create my-bridge

# 运行容器并加入网络
docker run -d --name app1 --network my-bridge nginx
docker run -d --name app2 --network my-bridge nginx
# app1和app2可以通过容器名互相访问
```

- 容器通过veth pair连接到宿主机的docker0网桥
- 容器之间通过容器名进行DNS解析
- 通过NAT（iptables）访问外部网络
- 适用于：同一主机上的容器通信

**2. Host模式**

```bash
docker run -d --network host nginx
# 容器直接使用宿主机网络，不进行网络隔离
# 容器端口直接暴露在宿主机上
```

- 容器与宿主机共享网络命名空间
- 不需要端口映射（-p参数无效）
- 性能最好（无NAT开销）
- 缺点：端口冲突风险
- 适用于：对网络性能要求高的场景

**3. Overlay网络**

```bash
# 在Swarm集群中创建overlay网络
docker network create -d overlay my-overlay

# 服务使用overlay网络
docker service create --name web --network my-overlay nginx
```

- 用于跨主机的容器通信（Docker Swarm / Kubernetes）
- 基于VXLAN封装，在UDP 4789端口上传输
- 支持数据加密（--opt encrypted）
- 内置DNS服务发现
- 适用于：集群环境下的跨节点通信

**4. Macvlan网络**

```bash
# 创建macvlan网络（容器获得独立IP）
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 macvlan-net

docker run -d --network macvlan-net --ip 192.168.1.100 nginx
```

- 容器获得与宿主机同一网段的独立MAC和IP地址
- 容器对网络中的其他设备"看起来"像物理机
- 不需要端口映射
- 缺点：宿主机与容器不能直接通信（需额外配置）
- 适用于：需要容器直接接入物理网络的场景（如网络监控）

**网络模式对比：**

| 模式 | 网络隔离 | 跨主机 | 性能 | 端口映射 | 适用场景 |
|------|---------|--------|------|---------|---------|
| Bridge | 是 | 否 | 中 | 需要 | 单机容器通信 |
| Host | 否 | - | 高 | 不需要 | 高性能需求 |
| Overlay | 是 | 是 | 中 | 自动 | 集群跨节点通信 |
| Macvlan | 是 | 是 | 高 | 不需要 | 物理网络接入 |

---

### Q4: Docker存储有哪些方式？Volume、Bind Mount、Tmpfs有什么区别？⭐⭐

**答案：**

Docker提供三种数据存储方式：

**1. Volume（数据卷，推荐）**

```bash
# 创建数据卷
docker volume create my-data

# 使用数据卷
docker run -d -v my-data:/app/data nginx

# 查看数据卷
docker volume inspect my-data
# 存储位置：/var/lib/docker/volumes/my-data/_data
```

- 由Docker管理，存储在`/var/lib/docker/volumes/`
- 支持卷驱动（local、nfs、cifs等）
- 支持命名卷，便于管理和共享
- 容器删除后数据不会丢失
- 支持第三方存储插件

**2. Bind Mount（绑定挂载）**

```bash
# 将宿主机目录挂载到容器
docker run -d -v /host/path:/container/path nginx

# 只读挂载
docker run -d -v /host/path:/container/path:ro nginx
```

- 将宿主机上的任意目录或文件挂载到容器
- 直接映射宿主机路径，性能好
- 缺点：依赖宿主机目录结构，可移植性差
- 适用于：开发环境（代码热更新）、配置文件挂载

**3. Tmpfs（临时文件系统）**

```bash
# 挂载tmpfs（内存文件系统）
docker run -d --tmpfs /app/cache:rw,size=100m nginx
```

- 数据存储在宿主机内存中
- 容器停止后数据丢失
- 性能极高（内存读写）
- 适用于：敏感数据（不落盘）、临时缓存

**对比总结：**

| 特性 | Volume | Bind Mount | Tmpfs |
|------|--------|-----------|-------|
| 存储位置 | /var/lib/docker/volumes/ | 宿主机任意路径 | 内存 |
| 数据持久化 | 是 | 是 | 否（容器停止即丢失） |
| 可移植性 | 好 | 差 | 中 |
| 性能 | 高 | 最高 | 最高 |
| 管理方式 | Docker CLI管理 | 手动管理 | 自动 |
| 共享给其他容器 | 支持 | 支持 | 不支持 |
| 适用场景 | 生产环境数据持久化 | 开发环境、配置文件 | 敏感数据、临时缓存 |

**生产环境Volume最佳实践：**
```bash
# 使用命名卷
docker run -d \
  -v app-data:/var/lib/mysql \
  -v app-config:/etc/mysql/conf.d \
  --name mysql \
  mysql:8.0

# 备份数据卷
docker run --rm -v app-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/data.tar.gz /data
```

---

### Q5: Kubernetes的架构是怎样的？Master和Node各有哪些组件？⭐⭐

**答案：**

**K8s整体架构：**

```
┌──────────────────────────────────────────────────┐
│                   Master Node                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │kube-apiserver│ │Scheduler│ │Controller Manager│  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────────┐ │
│  │              etcd（分布式存储）                │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
          ↕
┌──────────────────────────────────────────────────┐
│                   Worker Node                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  kubelet  │ │ kube-proxy│ │Container Runtime│  │
│  └──────────┘ └──────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────────┐ │
│  │              Pod（容器组）                     │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Master组件：**

| 组件 | 功能 |
|------|------|
| **kube-apiserver** | 集群的统一入口，所有组件通过API Server通信，提供REST API，负责认证、授权、准入控制 |
| **etcd** | 分布式键值存储，保存集群所有状态数据（Pod、Service、ConfigMap等），使用Raft协议保证一致性 |
| **Scheduler** | 负责Pod调度，根据资源需求、亲和性/反亲和性、污点容忍等策略将Pod分配到合适的Node |
| **Controller Manager** | 运行各种控制器（Deployment Controller、Node Controller、ReplicaSet Controller等），负责集群状态的协调和维护 |

**Node组件：**

| 组件 | 功能 |
|------|------|
| **kubelet** | Node上的代理，负责Pod的生命周期管理（创建、销毁、健康检查），与API Server通信 |
| **kube-proxy** | 维护节点上的网络规则（iptables/IPVS），实现Service的负载均衡和网络代理 |
| **Container Runtime** | 容器运行时（containerd/CRI-O），负责拉取镜像、创建和运行容器（K8s 1.24+ 移除了dockershim） |

**关键概念：**

- **声明式API**：用户通过YAML声明期望状态，K8s控制器负责将实际状态调整为期望状态
- **控制循环（Reconciliation Loop）**：控制器持续对比期望状态和实际状态，执行调谐操作
- **所有组件通信都通过API Server**，组件之间不直接通信

---

### Q6: Pod的生命周期是怎样的？三种探针有什么区别？⭐⭐

**答案：**

**Pod生命周期：**

```
Pending → Running → Succeeded / Failed
            ↑          ↓
         CrashLoopBackOff
```

**Pod状态：**

| 状态 | 说明 |
|------|------|
| Pending | 已被接受但容器尚未创建（调度中/拉取镜像中） |
| Running | Pod已绑定到Node，至少一个容器正在运行 |
| Succeeded | 所有容器正常终止且不会重启 |
| Failed | 所有容器已终止，至少一个容器异常退出 |
| Unknown | 无法获取Pod状态（通常是与Node通信失败） |

**Pod创建流程：**

```
1. 用户提交Pod YAML → API Server
2. API Server验证并存储到etcd
3. Scheduler调度Pod到目标Node
4. 目标Node的kubelet创建Pod
5. kubelet调用CRI拉取镜像
6. kubelet创建容器
7. 执行PostStart Hook
8. 执行启动探针（Startup Probe）
9. 启动探针通过后，执行就绪探针（Readiness Probe）和存活探针（Liveness Probe）
```

**三种探针：**

**1. 存活探针（Liveness Probe）**
- 检测容器是否正在运行
- 探测失败 → 杀死容器 → 根据restartPolicy决定是否重启
- 防止死锁、无限循环等进程假死情况

**2. 就绪探针（Readiness Probe）**
- 检测容器是否准备好接收流量
- 探测失败 → 从Service的Endpoints中移除
- 确保只有准备好的Pod接收流量

**3. 启动探针（Startup Probe）**（K8s 1.18+）
- 检测容器是否启动完成
- 启动成功后，存活探针和就绪探针才开始工作
- 适用于启动较慢的应用（避免被存活探针误杀）

**探针方法：**

| 方法 | 说明 |
|------|------|
| httpGet | 向容器发送HTTP请求，2xx/3xx视为成功 |
| tcpSocket | 尝试与容器的指定端口建立TCP连接 |
| exec | 在容器内执行命令，返回0视为成功 |
| grpc（1.24+） | 使用gRPC健康检查协议 |

**YAML配置示例：**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
spec:
  containers:
  - name: app
    image: my-app:latest
    ports:
    - containerPort: 8080
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30    # 最多失败30次
      periodSeconds: 10       # 每10秒探测一次
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15 # 容器启动后15秒开始探测
      periodSeconds: 10       # 每10秒探测一次
      failureThreshold: 3     # 连续失败3次则重启
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 3
```

**探针配置建议：**
- initialDelaySeconds要大于应用启动时间
- periodSeconds不宜太短（避免给服务带来压力）
- 生产环境建议三种探针都配置
- 启动慢的应用一定要配置startupProbe

---

### Q7: Deployment、StatefulSet、DaemonSet、Job/CronJob分别适用于什么场景？⭐⭐

**答案：**

**1. Deployment（无状态应用）**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  strategy:
    type: RollingUpdate        # 滚动更新（默认）
    rollingUpdate:
      maxSurge: 1              # 更新时最多多出1个Pod
      maxUnavailable: 0        # 更新时不允许有Pod不可用
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
```

- 适用场景：Web服务、API服务、微服务等无状态应用
- 特点：Pod名称随机、无序，可随意扩缩容
- 支持滚动更新、回滚
- 底层通过管理ReplicaSet实现

**2. StatefulSet（有状态应用）**

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql-headless   # 必须关联Headless Service
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        volumeMounts:
        - name: data
          mountPath: /var/lib/mysql
  volumeClaimTemplates:         # 每个Pod自动创建独立的PVC
  - metadata:
      name: data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

- 适用场景：数据库（MySQL、PostgreSQL）、消息队列（Kafka、RabbitMQ）、Elasticsearch
- 特点：
  - Pod名称有序：`mysql-0, mysql-1, mysql-2`
  - 每个Pod有固定、独立的持久化存储
  - 按序号顺序创建/删除（0→1→2）
  - 网络标识固定（通过Headless Service）

**3. DaemonSet（每个节点运行一个Pod）**

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      tolerations:             # 容忍所有污点（包括Master节点）
      - operator: Exists
      containers:
      - name: node-exporter
        image: prom/node-exporter:latest
        ports:
        - containerPort: 9100
          hostPort: 9100
```

- 适用场景：日志采集（Filebeat/Fluentd）、监控（node-exporter）、网络插件（Calico/Flannel）
- 特点：每个Node自动运行一个Pod，新节点加入时自动创建
- 不需要指定replicas

**4. Job（一次性任务）**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-migration
spec:
  completions: 1               # 需要成功完成的Pod数
  parallelism: 1               # 并行运行的Pod数
  backoffLimit: 3              # 失败重试次数
  activeDeadlineSeconds: 600   # 超时时间
  template:
    spec:
      restartPolicy: Never     # Job必须设置为Never或OnFailure
      containers:
      - name: migrate
        image: my-app:latest
        command: ["python", "migrate.py"]
```

- 适用场景：数据迁移、批处理、数据库备份

**5. CronJob（定时任务）**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-cleanup
spec:
  schedule: "0 2 * * *"        # 每天凌晨2点执行
  concurrencyPolicy: Forbid    # 禁止并发执行（Replace/Allow/Forbid）
  successfulJobsHistoryLimit: 5
  failedJobsHistoryLimit: 3
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: cleanup
            image: my-app:latest
            command: ["python", "cleanup.py"]
```

- 适用场景：定时备份、定时清理、定时报表

**对比总结：**

| 工作负载 | Pod命名 | 存储 | 扩缩容 | 适用场景 |
|---------|---------|------|--------|---------|
| Deployment | 随机 | 共享/无 | 随意 | 无状态服务 |
| StatefulSet | 有序固定 | 独立PVC | 按序 | 有状态服务 |
| DaemonSet | 随机 | 无/共享 | 随Node数 | 节点级服务 |
| Job | 随机 | 无 | 不适用 | 一次性任务 |
| CronJob | 随机 | 无 | 不适用 | 定时任务 |

---

### Q8: Kubernetes Service有哪些类型？Ingress和Service有什么区别？⭐⭐

**答案：**

**Service类型：**

**1. ClusterIP（默认）**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: ClusterIP           # 默认类型
  selector:
    app: nginx
  ports:
  - port: 80                # Service端口
    targetPort: 8080        # Pod端口
    protocol: TCP
```

- 分配集群内部虚拟IP，仅在集群内可访问
- 通过kube-proxy（iptables/IPVS）实现负载均衡
- 适用于：集群内部服务间通信

**2. NodePort**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080         # 节点端口（30000-32767）
```

- 在每个Node上开放一个端口
- 通过`<NodeIP>:<NodePort>`访问
- 适用于：开发测试环境、简单对外暴露

**3. LoadBalancer**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 8080
```

- 自动创建云厂商的负载均衡器（AWS ELB、阿里云SLB等）
- 自动将外部流量导入NodePort
- 适用于：云环境对外暴露服务

**4. Headless Service**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None           # 不分配ClusterIP
  selector:
    app: mysql
  ports:
  - port: 3306
```

- 不分配ClusterIP，DNS直接解析到Pod IP
- 返回所有Pod的A记录：`mysql-0.mysql-headless.ns.svc.cluster.local`
- 适用于：StatefulSet、需要直接访问特定Pod的场景

**Service vs Ingress：**

| 维度 | Service | Ingress |
|------|---------|---------|
| 层级 | L4（TCP/UDP） | L7（HTTP/HTTPS） |
| 路由 | 无路径路由 | 支持基于路径/域名的路由 |
| TLS | 需要每个Service配置 | 统一配置TLS证书 |
| 访问方式 | NodePort/LoadBalancer | 通过Ingress Controller统一入口 |
| 适用场景 | 内部通信、简单暴露 | 对外暴露HTTP/HTTPS服务 |

**Ingress配置示例：**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: tls-secret
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /order
        pathType: Prefix
        backend:
          service:
            name: order-service
            port:
              number: 80
      - path: /user
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
```

**主流Ingress Controller：**

| 实现 | 特点 |
|------|------|
| Nginx Ingress | 最成熟、社区活跃 |
| Traefik | 原生支持自动发现、配置热更新 |
| Kong | 基于OpenResty，API网关功能丰富 |
| APISIX | 高性能、插件丰富 |

---

### Q9: ConfigMap和Secret有什么区别？PV/PVC的工作原理是什么？⭐⭐

**答案：**

**ConfigMap vs Secret：**

**ConfigMap（配置数据）：**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  # 键值对形式
  LOG_LEVEL: "info"
  DB_HOST: "mysql-service"
  # 文件形式
  application.yml: |
    server:
      port: 8080
    spring:
      datasource:
        url: jdbc:mysql://mysql:3306/mydb
```

**Secret（敏感数据）：**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
data:
  # Base64编码
  username: YWRtaW4=       # echo -n 'admin' | base64
  password: MWYyZQ==       # echo -n '1f2e' | base64
---
# 或使用stringData（明文，K8s自动编码）
apiVersion: v1
kind: Secret
metadata:
  name: db-secret
type: Opaque
stringData:
  username: admin
  password: 1f2e
```

**对比：**

| 维度 | ConfigMap | Secret |
|------|-----------|--------|
| 存储内容 | 非敏感配置 | 敏感数据（密码、密钥、证书） |
| 存储方式 | 明文存储在etcd | Base64编码存储在etcd（非加密） |
| 大小限制 | 1MB | 1MB |
| 使用方式 | 环境变量/Volume挂载 | 环境变量/Volume挂载 |
| 安全性 | 无特殊保护 | 可配合RBAC限制访问 |

**在Pod中使用：**
```yaml
spec:
  containers:
  - name: app
    image: my-app:latest
    env:
    - name: LOG_LEVEL
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: LOG_LEVEL
    - name: DB_PASSWORD
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    configMap:
      name: app-config
```

**注意：** 生产环境中建议使用外部密钥管理系统（如Vault、AWS Secrets Manager）配合CSI驱动。

---

**PV/PVC（持久化存储）：**

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│   Pod    │────→│   PVC    │────→│     PV      │────→ 物理存储
│(消费方)  │     │(存储请求) │     │(存储资源)    │     (NFS/Ceph/云盘)
└──────────┘     └──────────┘     └──────────────┘
```

- **PV（PersistentVolume）**：集群级别的存储资源，由管理员创建或动态供给
- **PVC（PersistentVolumeClaim）**：用户的存储请求，绑定到合适的PV

**PV示例：**
```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
  - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain  # Retain/Delete/Recycle
  nfs:
    server: 192.168.1.100
    path: /data/nfs
```

**PVC示例：**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard  # StorageClass用于动态供给
```

**StorageClass（动态供给）：**
```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
```

**访问模式：**

| 模式 | 缩写 | 说明 |
|------|------|------|
| ReadWriteOnce | RWO | 可被单个节点以读写模式挂载 |
| ReadOnlyMany | ROX | 可被多个节点以只读模式挂载 |
| ReadWriteMany | RWX | 可被多个节点以读写模式挂载 |
| ReadWriteOncePod | RWOP | 可被单个Pod以读写模式挂载（K8s 1.27+） |

---

### Q10: HPA（Horizontal Pod Autoscaler）的工作原理是什么？⭐⭐

**答案：**

**HPA自动扩缩容原理：**

HPA控制器周期性（默认15秒）查询Pod的指标数据，根据目标值自动调整Pod副本数。

```
期望副本数 = ceil(当前副本数 × (当前指标值 / 目标指标值))
```

**基于CPU的HPA：**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # 目标CPU使用率70%
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60    # 扩容稳定窗口
      policies:
      - type: Pods
        value: 2                        # 每次最多扩2个Pod
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容稳定窗口（5分钟）
      policies:
      - type: Pods
        value: 1                        # 每次最多缩1个Pod
        periodSeconds: 60
```

**基于自定义指标的HPA：**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa-custom
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second   # 自定义指标
      target:
        type: AverageValue
        averageValue: "1000"             # 每个Pod目标1000 QPS
```

**前提条件：**

1. Pod必须配置资源请求（requests）：
```yaml
resources:
  requests:
    cpu: 200m
    memory: 256Mi
```

2. 集群需要安装Metrics Server：
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

3. 自定义指标需要安装Prometheus Adapter。

**扩缩容行为配置（behavior）：**

- `stabilizationWindowSeconds`：稳定窗口时间，防止指标波动导致频繁扩缩
- `scaleUp.policies`：扩容策略（每次最多扩多少、多久扩一次）
- `scaleDown.policies`：缩容策略（缩容更保守，避免误缩）

**VPA（Vertical Pod Autoscaler）：**
- 垂直扩缩容：调整Pod的CPU/内存requests
- 会重启Pod（修改资源请求需要重建）
- 适用于：无法水平扩展的有状态应用

---

### Q11: CI/CD流水线是如何设计的？Jenkins、GitLab CI、GitHub Actions各有什么特点？⭐⭐

**答案：**

**CI/CD核心概念：**

- **CI（Continuous Integration，持续集成）**：代码提交后自动构建、测试，尽早发现问题
- **CD（Continuous Delivery，持续交付）**：通过自动化将代码部署到预发布环境，随时可手动发布
- **CD（Continuous Deployment，持续部署）**：通过自动化将代码直接部署到生产环境

**典型CI/CD流水线：**

```
代码提交 → 代码检查 → 单元测试 → 构建 → 集成测试
→ 构建镜像 → 推送镜像仓库 → 部署到Staging → 自动化测试
→ 审批 → 部署到Production → 健康检查 → 告警通知
```

**1. Jenkins Pipeline**

```groovy
pipeline {
    agent any
    environment {
        REGISTRY = 'registry.example.com'
        IMAGE = '${REGISTRY}/my-app'
    }
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
            }
            post {
                always {
                    junit '**/target/surefire-reports/*.xml'
                }
            }
        }
        stage('Build & Push') {
            steps {
                sh "docker build -t ${IMAGE}:${BUILD_NUMBER} ."
                sh "docker push ${IMAGE}:${BUILD_NUMBER}"
                sh "docker tag ${IMAGE}:${BUILD_NUMBER} ${IMAGE}:latest"
                sh "docker push ${IMAGE}:latest"
            }
        }
        stage('Deploy to Staging') {
            steps {
                sh "kubectl set image deployment/my-app my-app=${IMAGE}:${BUILD_NUMBER} -n staging"
            }
        }
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message "Deploy to Production?"
            }
            steps {
                sh "kubectl set image deployment/my-app my-app=${IMAGE}:${BUILD_NUMBER} -n production"
            }
        }
    }
    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
```

**2. GitLab CI/CD**

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_IMAGE: registry.example.com/my-app

test:
  stage: test
  image: maven:3.9-openjdk-17
  script:
    - mvn test
  artifacts:
    reports:
      junit: target/surefire-reports/*.xml

build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  script:
    - docker build -t ${DOCKER_IMAGE}:${CI_COMMIT_SHA} .
    - docker push ${DOCKER_IMAGE}:${CI_COMMIT_SHA}
  only:
    - main
    - merge_requests

deploy_staging:
  stage: deploy-staging
  image: bitnami/kubectl
  script:
    - kubectl set image deployment/my-app my-app=${DOCKER_IMAGE}:${CI_COMMIT_SHA} -n staging
  environment:
    name: staging
  only:
    - main

deploy_production:
  stage: deploy-production
  image: bitnami/kubectl
  script:
    - kubectl set image deployment/my-app my-app=${DOCKER_IMAGE}:${CI_COMMIT_SHA} -n production
  environment:
    name: production
  when: manual
  only:
    - main
```

**3. GitHub Actions**

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with:
        java-version: '17'
        distribution: 'temurin'
    - run: mvn test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    - uses: docker/build-push-action@v5
      with:
        push: true
        tags: ghcr.io/${{ github.repository }}:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v4
    - run: |
        kubectl set image deployment/my-app \
          my-app=ghcr.io/${{ github.repository }}:${{ github.sha }} \
          -n production
```

**对比：**

| 特性 | Jenkins | GitLab CI | GitHub Actions |
|------|---------|-----------|----------------|
| 部署方式 | 自托管 | 自托管/SaaS | SaaS |
| 配置方式 | Jenkinsfile（Groovy） | .gitlab-ci.yml（YAML） | YAML |
| 插件生态 | 最丰富 | 丰富 | 丰富 |
| 学习成本 | 高 | 中 | 低 |
| 与代码仓库集成 | 需要配置 | 原生集成 | 原生集成 |
| 并行构建 | 支持 | 支持 | 支持 |
| 免费额度 | 无限制 | 无限制 | 公开仓库免费，私有仓库2000分钟/月 |

---

### Q12: Docker Compose、Kubernetes、Docker Swarm有什么区别？如何选择？⭐⭐

**答案：**

**对比：**

| 维度 | Docker Compose | Docker Swarm | Kubernetes |
|------|---------------|-------------|------------|
| 定位 | 单机多容器编排 | 轻量级集群编排 | 企业级容器编排 |
| 复杂度 | 低 | 中 | 高 |
| 学习曲线 | 平缓 | 中等 | 陡峭 |
| 集群规模 | 单机 | 中小规模（<100节点） | 大规模（数千节点） |
| 服务发现 | 内置DNS | 内置DNS | CoreDNS |
| 负载均衡 | 内置 | 内置（VIP+Routing Mesh） | Service（iptables/IPVS） |
| 存储管理 | Volume | Volume | PV/PVC/StorageClass |
| 自动扩缩容 | 不支持 | 有限支持 | HPA/VPA |
| 自愈能力 | 自动重启 | 自动重启 | 自动重启、重建、调度 |
| 滚动更新 | 支持 | 支持 | 支持（更精细） |
| 配置管理 | env_file | Config/Secret | ConfigMap/Secret |
| 生态 | 小 | 小 | 非常大 |
| 社区活跃度 | 中 | 低（Docker已减少投入） | 非常高 |

**Docker Compose示例：**
```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - db
      - redis
    environment:
      - DB_HOST=db
      - REDIS_HOST=redis

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=123456
      - MYSQL_DATABASE=mydb
    volumes:
      - db-data:/var/lib/mysql

  redis:
    image: redis:7-alpine

volumes:
  db-data:
```

**选择建议：**

- **Docker Compose**：开发环境、小型项目、单机部署
- **Docker Swarm**：中小规模集群、已有Docker生态、不想引入K8s复杂度的团队
- **Kubernetes**：生产环境、大规模集群、需要丰富生态和高级特性

**趋势：** Docker Swarm社区活跃度持续下降，新项目建议直接使用Kubernetes或轻量级K8s发行版（K3s、Minikube、Kind）。

---

### Q13: Helm是什么？如何编写和使用Helm Chart？⭐⭐

**答案：**

**Helm是Kubernetes的包管理器**，类似于Linux的apt/yum，用于简化K8s应用的部署和管理。

**核心概念：**

- **Chart**：一个Helm包，包含一组K8s资源定义的模板
- **Release**：Chart的一个运行实例
- **Repository**：Chart仓库，存放和共享Chart

**Chart目录结构：**
```
my-chart/
├── Chart.yaml          # Chart元信息
├── values.yaml         # 默认配置值
├── templates/          # K8s资源模板
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── _helpers.tpl    # 模板辅助函数
│   └── NOTES.txt       # 安装后提示信息
└── charts/             # 依赖的子Chart
```

**Chart.yaml：**
```yaml
apiVersion: v2
name: my-app
description: A Helm chart for my application
type: application
version: 1.0.0           # Chart版本
appVersion: "1.0.0"      # 应用版本
maintainers:
  - name: devops-team
    email: devops@example.com
```

**values.yaml：**
```yaml
replicaCount: 2

image:
  repository: my-registry/my-app
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: app.example.com
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    cpu: 200m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
```

**模板示例（deployment.yaml）：**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "my-app.fullname" . }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "my-app.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "my-app.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: 80
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

**常用命令：**
```bash
# 创建Chart
helm create my-chart

# 安装
helm install my-app ./my-chart

# 自定义安装
helm install my-app ./my-chart -f custom-values.yaml

# 升级
helm upgrade my-app ./my-chart

# 回滚
helm rollback my-app 1

# 卸载
helm uninstall my-app

# 查看Release
helm list

# 添加仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm install nginx bitnami/nginx
```

---

### Q14: 什么是服务网格（Service Mesh）？Istio的核心架构是什么？⭐⭐⭐

**答案：**

**服务网格（Service Mesh）：**

服务网格是一个专门处理服务间通信的基础设施层，通过Sidecar代理（如Envoy）拦截所有服务间的网络流量，实现流量管理、安全通信和可观测性，**无需修改应用代码**。

**核心特性：**
- 流量管理（负载均衡、灰度发布、熔断、重试）
- 安全（mTLS双向认证、授权策略）
- 可观测性（分布式追踪、指标采集）

**Istio架构（Istio 1.20+）：**

```
┌──────────────────────────────────────────────┐
│              Istio Control Plane             │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ istiod   │  │          │  │           │  │
│  │(Pilot +  │  │Citadel   │  │ Proxy     │  │
│  │ Galley)  │  │(证书管理) │  │ Config    │  │
│  └──────────┘  └──────────┘  └───────────┘  │
└──────────────────────────────────────────────┘
          ↕ (xDS API)
┌──────────────────────────────────────────────┐
│              Data Plane (Sidecar)            │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  App A   │  │  App B   │  │  App C    │  │
│  │  + Envoy │  │  + Envoy │  │  + Envoy  │  │
│  └──────────┘  └──────────┘  └───────────┘  │
└──────────────────────────────────────────────┘
```

**Istio 1.x（传统架构）：**
- **Pilot**：服务发现、流量管理（通过xDS下发给Envoy）
- **Citadel**：证书管理、密钥分发
- **Galley**：配置验证和分发

**Istio 1.20+（统一架构）：**
- 合并为单一组件 **istiod**，简化部署和运维

**Envoy Sidecar代理：**
- 以Sidecar容器形式注入到每个Pod中
- 拦截所有入站和出站流量
- 动态配置通过xDS协议从istiod获取

**流量管理示例：**

```yaml
# 虚拟服务（路由规则）
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - match:
    - headers:
        x-user-type:
          exact: beta
    route:
    - destination:
        host: reviews
        subset: v2
  - route:
    - destination:
        host: reviews
        subset: v1
---
# 目标规则（版本定义）
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
```

**灰度发布（金丝雀发布）：**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-service
spec:
  hosts:
  - my-service
  http:
  - route:
    - destination:
        host: my-service
        subset: v1
      weight: 90           # 90%流量到v1
    - destination:
        host: my-service
        subset: v2
      weight: 10           # 10%流量到v2
```

**mTLS配置：**
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT           # 强制mTLS
```

**Istio vs 不使用服务网格：**

| 维度 | 不使用服务网格 | 使用Istio |
|------|--------------|----------|
| 流量管理 | 代码实现或Spring Cloud | 声明式配置，与代码解耦 |
| 安全通信 | 需要应用层实现 | 自动mTLS |
| 可观测性 | 需要集成SDK | 自动采集指标和追踪 |
| 多语言支持 | 需要每种语言实现 | 语言无关（Sidecar） |
| 复杂度 | 低 | 高（引入Sidecar开销） |

---

### Q15: ELK/EFK日志收集架构是怎样的？如何设计生产级日志系统？⭐⭐

**答案：**

**ELK Stack：**
- **E**lasticsearch：分布式搜索和存储引擎
- **L**ogstash：日志收集、解析、转换
- **K**ibana：日志可视化

**EFK Stack（更轻量）：**
- **E**lasticsearch
- **F**luentd / Filebeat：日志收集
- **K**ibana

**生产级日志架构：**

```
应用容器 → Filebeat/Fluent Bit → Kafka（缓冲） → Logstash（解析） → Elasticsearch → Kibana
```

**为什么需要Kafka缓冲？**
- 日志产生速率可能超过Logstash处理能力
- Kafka作为缓冲层，防止日志丢失
- 支持多个Logstash消费者并行处理

**Filebeat配置（K8s DaemonSet）：**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: filebeat-config
data:
  filebeat.yml: |-
    filebeat.autodiscover:
      providers:
      - type: kubernetes
        namespace: default
        hints.enabled: true
        templates:
          - condition:
              contains:
                kubernetes.labels.app: my-app
            config:
              - type: container
                paths:
                  - /var/log/containers/*-${data.kubernetes.container.id}.log
                processors:
                - decode_json_fields:
                    fields: ["message"]
                    target: ""
                    overwrite_keys: true
    output.kafka:
      hosts: ["kafka:9092"]
      topic: "app-logs"
      required_acks: 1
      compression: gzip
```

**Logstash配置：**
```ruby
input {
  kafka {
    bootstrap_servers => "kafka:9092"
    topics => ["app-logs"]
    consumer_threads => 4
    codec => json
  }
}

filter {
  # 解析日志时间
  grok {
    match => { "message" => "%{TIMESTAMP_ISO8601:timestamp}" }
  }

  # 移除不需要的字段
  mutate {
    remove_field => ["agent", "ecs", "input", "log"]
  }

  # 添加字段
  mutate {
    add_field => { "env" => "production" }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

**ES索引生命周期管理（ILM）：**
```json
PUT _ilm/policy/app-logs-policy
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": { "max_size": "50GB", "max_age": "1d" }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": { "number_of_shards": 1 },
          "forcemerge": { "max_num_segments": 1 }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

**日志规范建议：**
- 统一JSON格式输出
- 包含traceId、spanId（便于链路追踪）
- 包含service、host、timestamp等基础字段
- 按日志级别分类（ERROR/WARN/INFO/DEBUG）
- 敏感信息脱敏

---

### Q16: Prometheus + Grafana监控告警体系如何搭建？⭐⭐

**答案：**

**Prometheus核心概念：**

- **指标（Metrics）**：带标签的时间序列数据
- **PromQL**：Prometheus查询语言
- **抓取（Pull）**：Prometheus主动从目标拉取指标
- **Pushgateway**：短生命周期任务推送指标的中转站
- **Alertmanager**：告警管理、分组、路由、去重

**监控架构：**

```
应用（暴露/metrics端点）
    ↑ Pull
Prometheus Server ←→ Alertmanager → 邮件/钉钉/Slack
    ↓
Grafana（可视化仪表盘）
```

**Prometheus配置：**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets:
      - alertmanager:9093

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
      action: replace
      target_label: __address__
      regex: (.+)
      replacement: $1:8080

  - job_name: 'node-exporter'
    static_configs:
    - targets: ['node-exporter:9100']
```

**告警规则：**
```yaml
# alert_rules.yml
groups:
- name: app-alerts
  rules:
  - alert: HighErrorRate
    expr: |
      rate(http_requests_total{status=~"5.."}[5m])
      / rate(http_requests_total[5m]) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate on {{ $labels.service }}"
      description: "Error rate is {{ $value | humanizePercentage }}"

  - alert: HighMemoryUsage
    expr: |
      container_memory_working_set_bytes / container_spec_memory_limit_bytes > 0.85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage on {{ $labels.pod }}"

  - alert: PodCrashLooping
    expr: rate(kube_pod_container_status_restarts_total[15m]) > 0.1
    for: 5m
    labels:
      severity: critical
```

**Alertmanager配置：**
```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'service']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
  - match:
      severity: critical
    receiver: 'critical-alerts'
    repeat_interval: 1h

receivers:
- name: 'default'
  webhook_configs:
  - url: 'http://alert-gateway:8080/webhook/prometheus'

- name: 'critical-alerts'
  webhook_configs:
  - url: 'http://alert-gateway:8080/webhook/prometheus'
```

**Grafana Dashboard关键指标：**

| 类别 | 指标 | 说明 |
|------|------|------|
| 基础资源 | CPU/内存/磁盘/网络 | node-exporter采集 |
| K8s资源 | Pod/Deployment/Node状态 | kube-state-metrics |
| 应用指标 | QPS/延迟/错误率 | 应用暴露的metrics |
| 中间件 | MySQL/Redis/Kafka指标 | 各自的exporter |

**四大黄金信号（Google SRE）：**
1. **延迟（Latency）**：请求响应时间
2. **流量（Traffic）**：系统请求量
3. **错误（Errors）**：请求错误率
4. **饱和度（Saturation）**：资源使用率

---

### Q17: 什么是GitOps？如何用ArgoCD实现GitOps？⭐⭐

**答案：**

**GitOps核心思想：**

Git仓库是应用的**唯一事实来源（Single Source of Truth）**，所有环境的配置都存储在Git中，通过Git的PR/MR流程进行变更审批，自动化工具检测Git仓库变化并同步到集群。

**GitOps核心原则：**
1. 声明式：系统状态用声明式配置描述
2. 版本控制：所有配置存储在Git中
3. 自动化：自动将Git中的配置应用到集群
4. 持续协调：持续对比期望状态和实际状态

**GitOps vs 传统运维：**

| 维度 | 传统运维 | GitOps |
|------|---------|--------|
| 变更方式 | 手动执行kubectl/helm | 修改Git → 自动同步 |
| 审计 | 依赖操作日志 | Git提交记录天然审计 |
| 回滚 | 手动操作 | git revert |
| 协作 | 权限管理复杂 | Git PR/MR流程 |
| 一致性 | 容易漂移 | 持续协调，自动纠正 |

**ArgoCD架构：**

```
Git仓库（K8s manifests）
    ↓
ArgoCD Application Controller（检测变化）
    ↓
Kubernetes API Server（应用配置）
    ↓
ArgoCD UI / CLI（查看状态）
```

**ArgoCD Application配置：**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app-production
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/k8s-manifests.git
    targetRevision: main
    path: overlays/production    # Kustomize overlay路径
    # 或使用Helm Chart
    # chart: my-chart
    # repoURL: https://charts.myorg.com
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true               # 自动删除Git中不存在的资源
      selfHeal: true            # 自动修复配置漂移
    syncOptions:
    - CreateNamespace=true
```

**ArgoCD + Helm示例：**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/helm-charts.git
    targetRevision: main
    path: charts/my-app
    helm:
      valueFiles:
      - values-production.yaml
      parameters:
      - name: image.tag
        value: v1.2.0
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**GitOps工作流：**
```
1. 开发者fork仓库，创建feature分支
2. 修改K8s manifests或Helm values
3. 提交PR，代码审查
4. 合并到main分支
5. ArgoCD检测到变化，自动同步到集群
6. ArgoCD UI显示同步状态
7. 出现问题 → git revert → 自动回滚
```

---

### Q18: Terraform基础设施即代码的核心概念是什么？⭐⭐

**答案：**

**Terraform是HashiCorp开源的基础设施即代码（IaC）工具**，用声明式语言（HCL）定义和管理云资源。

**核心概念：**

| 概念 | 说明 |
|------|------|
| Provider | 云厂商/服务的插件（AWS、GCP、Azure、K8s等） |
| Resource | 基础设施资源的定义（VPC、EC2、RDS等） |
| State | 当前基础设施的状态文件（.tfstate），记录已创建的资源 |
| Module | 可复用的资源组合（类似函数） |
| Variable | 输入变量 |
| Output | 输出值 |
| Data Source | 查询已有基础设施信息 |

**Terraform工作流程：**
```
编写代码(.tf) → terraform init → terraform plan → terraform apply
```

**示例——创建AWS EKS集群：**
```hcl
# main.tf
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
  }

  backend "s3" {
    bucket = "terraform-state-prod"
    key    = "eks/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

variable "cluster_name" {
  default = "my-eks-cluster"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "${var.cluster_name}-vpc"
  }
}

# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  vpc_config {
    subnet_ids = aws_subnet.private[*].id
  }
  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "worker-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id
  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 1
  }
}

output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}
```

**State管理最佳实践：**
- 使用远程存储（S3 + DynamoDB锁）
- 不要手动修改state文件
- 使用`terraform import`导入已有资源
- 定期运行`terraform plan`检测配置漂移

**Terraform vs 其他IaC工具：**

| 维度 | Terraform | Pulumi | AWS CloudFormation |
|------|-----------|--------|-------------------|
| 语言 | HCL | Python/Go/TS等 | YAML/JSON |
| 云厂商支持 | 多云 | 多云 | 仅AWS |
| 状态管理 | State文件 | State文件 | 由AWS管理 |
| 学习成本 | 中 | 低（用已有语言） | 低 |
| 社区 | 最大 | 增长中 | AWS生态 |

---

### Q19: 如何实现Kubernetes集群的安全加固？⭐⭐⭐

**答案：**

**K8s安全最佳实践：**

**1. RBAC（基于角色的访问控制）**

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: production

# Role（命名空间级别权限）
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: production
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]

# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: production
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: production
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

**2. Pod安全标准（Pod Security Standards）**

```yaml
# Pod安全策略（K8s 1.25+ 使用Pod Security Admission）
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

三种策略级别：
- **Privileged**：无限制（不推荐）
- **Baseline**：最低安全基线（禁止特权容器、hostPID等）
- **Restricted**：严格限制（禁止root用户、要求安全上下文等）

**3. NetworkPolicy（网络策略）**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}              # 选中所有Pod
  policyTypes:
  - Ingress                    # 默认拒绝所有入站流量
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-web-to-api
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web-frontend
    ports:
    - protocol: TCP
      port: 8080
```

**4. Secret加密**

```yaml
# 启用etcd加密
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
    - secrets
    providers:
    - aescbc:
        keys:
        - name: key1
          secret: <base64-encoded-key>
    - identity: {}
```

**5. 镜像安全**

```yaml
spec:
  containers:
  - name: app
    image: my-registry/my-app:v1.0
    imagePullPolicy: Always
  imagePullSecrets:
  - name: registry-secret
```

- 使用私有镜像仓库
- 定期扫描镜像漏洞（Trivy、Clair）
- 使用签名镜像（cosign、Notary）

**6. 审计日志**

```yaml
# /etc/kubernetes/audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: Metadata
  resources:
  - group: ""
    resources: ["secrets", "configmaps"]
```

---

### Q20: Kubernetes中如何实现零停机部署？⭐⭐

**答案：**

**零停机部署策略：**

**1. 滚动更新（Rolling Update）**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # 更新时最多多出1个Pod
      maxUnavailable: 0     # 更新过程中不允许有Pod不可用
  template:
    spec:
      containers:
      - name: app
        image: my-app:v2
        readinessProbe:     # 就绪探针确保新Pod准备好后才接收流量
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3
```

**滚动更新过程：**
```
步骤1: v1 v1 v1 v1     （初始状态）
步骤2: v1 v1 v1 v1 v2   （创建1个v2，maxSurge=1）
步骤3: v1 v1 v1 v2      （v2就绪后删除1个v1）
步骤4: v1 v1 v1 v2 v2   （再创建1个v2）
步骤5: v1 v1 v2 v2      （删除1个v1）
...重复直到全部更新为v2
```

**2. 蓝绿部署**

```yaml
# 蓝色环境（当前版本）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-blue
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
      version: blue
  template:
    metadata:
      labels:
        app: my-app
        version: blue
    spec:
      containers:
      - name: app
        image: my-app:v1

# 绿色环境（新版本）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app-green
spec:
  replicas: 4
  selector:
    matchLabels:
      app: my-app
      version: green
  template:
    metadata:
      labels:
        app: my-app
        version: green
    spec:
      containers:
      - name: app
        image: my-app:v2

# 切换流量：修改Service selector
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
    version: green    # 从blue切换到green
```

**3. 金丝雀发布（Canary）**

通过Ingress或Service Mesh逐步将流量切换到新版本：

```yaml
# 使用Istio VirtualService实现
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: my-app
spec:
  hosts:
  - my-app
  http:
  - route:
    - destination:
        host: my-app
        subset: stable
      weight: 95
    - destination:
        host: my-app
        subset: canary
      weight: 5
```

**零停机关键要素：**

1. **就绪探针**：确保新Pod完全就绪后才接收流量
2. **优雅关闭（Graceful Shutdown）**：
```yaml
spec:
  terminationGracePeriodSeconds: 30   # 优雅关闭超时时间
  containers:
  - name: app
    lifecycle:
      preStop:
        exec:
          command: ["/bin/sh", "-c", "sleep 10"]  # 等待10秒让LB摘除
```

3. **Pod Disruption Budget（PDB）**：
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: my-app-pdb
spec:
  minAvailable: "50%"   # 至少50%的Pod可用
  selector:
    matchLabels:
      app: my-app
```

---

### Q21: Kubernetes中如何进行资源管理（Requests和Limits）？⭐⭐

**答案：**

**Requests和Limits：**

- **Requests**：调度时保证的最小资源量（调度依据）
- **Limits**：容器能使用的最大资源量（限制上限）

```yaml
spec:
  containers:
  - name: app
    image: my-app:latest
    resources:
      requests:
        cpu: 200m          # 0.2核CPU
        memory: 256Mi      # 256MB内存
      limits:
        cpu: 500m          # 0.5核CPU
        memory: 512Mi      # 512MB内存
```

**QoS等级（Quality of Service）：**

| QoS等级 | 配置 | 行为 |
|---------|------|------|
| **Guaranteed** | requests == limits（CPU和内存都设置） | 最高优先级，最后被驱逐 |
| **Burstable** | requests < limits（至少设置了requests） | 中等优先级 |
| **BestEffort** | 未设置requests和limits | 最低优先级，最先被驱逐 |

**资源不足时的驱逐顺序：**
```
BestEffort → Burstable（超出requests的部分） → Guaranteed
```

**CPU vs 内存超限行为：**

| 资源 | 超过Limit行为 |
|------|-------------|
| CPU | 限流（throttle），不会终止 |
| 内存 | OOMKilled（容器被终止） |

**LimitRange（命名空间默认资源限制）：**
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - default:              # 默认Limits
      cpu: 500m
      memory: 512Mi
    defaultRequest:        # 默认Requests
      cpu: 100m
      memory: 128Mi
    max:                   # 单个容器最大值
      cpu: "2"
      memory: 2Gi
    min:                   # 单个容器最小值
      cpu: 50m
      memory: 64Mi
    type: Container
```

**ResourceQuota（命名空间总资源配额）：**
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: namespace-quota
  namespace: production
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    pods: "50"
    services: "20"
```

**资源配额建议：**
- 生产环境必须设置requests和limits
- requests根据实际使用量设置（可通过监控获取）
- limits = requests的1.5-2倍（留出突发空间）
- 内存Limit不要设置太大（避免OOM影响其他Pod）

---

### Q22: Kubernetes集群的高可用方案有哪些？⭐⭐⭐

**答案：**

**K8s高可用架构：**

```
                    ┌──────────────┐
                    │  Load Balancer│
                    └──────┬───────┘
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Master 1 │ │ Master 2 │ │ Master 3 │
        │ API      │ │ API      │ │ API      │
        │ Scheduler│ │ Scheduler│ │ Scheduler│
        │ Controller│ │Controller│ │Controller│
        └──────────┘ └──────────┘ └──────────┘
              ↕            ↕            ↕
        ┌──────────────────────────────────┐
        │           etcd Cluster           │
        │  (3或5节点，Raft协议)            │
        └──────────────────────────────────┘
```

**etcd高可用：**

```yaml
# etcd配置（3节点集群）
etcd:
  --name=etcd-1
  --initial-advertise-peer-urls=http://10.0.0.1:2380
  --listen-peer-urls=http://10.0.0.1:2380
  --listen-client-urls=http://10.0.0.1:2379
  --advertise-client-urls=http://10.0.0.1:2379
  --initial-cluster=etcd-1=http://10.0.0.1:2380,etcd-2=http://10.0.0.2:2380,etcd-3=http://10.0.0.3:2380
  --initial-cluster-token=etcd-cluster-1
  --initial-cluster-state=new
```

**etcd高可用最佳实践：**
- 使用3或5个节点（容忍1或2个节点故障）
- 独立磁盘（SSD），etcd对磁盘IO敏感
- 定期备份（`etcdctl snapshot save`）
- 启用认证（`--auth-token-ttl`）
- 监控关键指标：WAL fsync延迟、DB大小、Leader变更次数

**API Server高可用：**

```nginx
# Nginx负载均衡配置
stream {
    upstream k8s_api_servers {
        server 10.0.0.1:6443;
        server 10.0.0.2:6443;
        server 10.0.0.3:6443;
    }
    server {
        listen 6443;
        proxy_pass k8s_api_servers;
    }
}
```

或使用云厂商的负载均衡器（AWS ELB、阿里云SLB）。

**Node高可用：**
- 多Worker节点，Pod自动调度到可用节点
- PodDisruptionBudget防止维护时Pod不可用
- 反亲和性（PodAntiAffinity）分散Pod到不同节点

```yaml
# Pod反亲和性
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - my-app
        topologyKey: kubernetes.io/hostname
```

**应用层高可用：**
- Deployment多副本
- Pod健康检查（liveness/readiness探针）
- PDB（Pod Disruption Budget）
- 拓扑分布约束（TopologySpreadConstraints）

---

### Q23: 什么是Container Runtime Interface（CRI）？K8s为什么弃用Docker？⭐⭐

**答案：**

**CRI（Container Runtime Interface）：**

CRI是Kubernetes定义的容器运行时接口标准，包含两个gRPC服务：

1. **RuntimeService**：管理Pod和容器的生命周期（创建、启动、停止、删除）
2. **ImageService**：管理镜像（拉取、列表、删除）

```
kubelet → CRI (gRPC) → Container Runtime (containerd/CRI-O)
```

**K8s弃用Docker的原因（K8s 1.20公告，1.24移除dockershim）：**

1. **架构冗余**：Docker本身包含containerd，K8s通过dockershim → Docker → containerd → runc，链路过长
2. **维护负担**：dockershim是K8s代码库的一部分，维护成本高
3. **功能缺失**：dockershim不支持CGroup v2、某些Pod安全特性
4. **CRI标准化**：CRI已成为标准，containerd/CRI-O直接实现CRI，更高效

**替代方案：**

| 运行时 | 说明 | 特点 |
|--------|------|------|
| containerd | Docker的核心运行时组件 | 轻量、高效、CNCF毕业 |
| CRI-O | 专为K8s设计的运行时 | 简洁、安全、OCI兼容 |

**迁移影响：**
- 已有镜像无需重新构建（镜像格式是OCI标准，与运行时无关）
- `docker build` → 替换为`buildah`、`kaniko`或`img`
- `docker ps` → 替换为`crictl ps`
- Docker Compose → 替换为K8s Deployment/StatefulSet或Kompose

**containerd配置示例：**
```toml
# /etc/containerd/config.toml
version = 2

[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.k8s.io/pause:3.9"

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc]
  runtime_type = "io.containerd.runc.v2"

[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true    # 使用systemd cgroup驱动
```

---

### Q24: Kubernetes网络模型是怎样的？CNI插件有哪些？⭐⭐

**答案：**

**K8s网络模型三大基本要求：**

1. 所有Pod之间可以直接通信（不需要NAT）
2. 所有Node和所有Pod之间可以直接通信（不需要NAT）
3. Pod看到自己的IP与其他Pod看到的IP一致

**K8s网络通信类型：**

```
1. Pod ↔ Pod（同一Node）    → 通过cni0网桥
2. Pod ↔ Pod（不同Node）    → 通过CNI插件的overlay网络
3. Pod ↔ Service            → 通过kube-proxy（iptables/IPVS）
4. 外部 ↔ Service           → 通过NodePort/LoadBalancer/Ingress
```

**kube-proxy三种模式：**

| 模式 | 原理 | 性能 | 适用规模 |
|------|------|------|---------|
| userspace | 早期模式，在用户空间代理 | 最低 | 已废弃 |
| iptables | 使用iptables规则 | 中 | 中小规模（5000+ Service时性能下降） |
| IPVS | 使用Linux IPVS | 高 | 大规模（支持多种调度算法） |

**主流CNI插件对比：**

| 插件 | 网络模式 | 性能 | 特点 |
|------|---------|------|------|
| Calico | BGP/VXLAN | 高 | 支持NetworkPolicy、eBPF数据面 |
| Flannel | VXLAN/host-gw | 中 | 简单易用、不支持NetworkPolicy |
| Cilium | eBPF | 最高 | 支持NetworkPolicy、可观测性、透明加密 |
| Weave | VXLAN | 中 | 自动发现、加密 |
| Antrea | OVS | 高 | VMware主推、支持NetworkPolicy |

**Calico配置示例：**
```yaml
# Calico BGP模式
apiVersion: crd.projectcalico.org/v1
kind: IPPool
metadata:
  name: default-ipv4-ippool
spec:
  cidr: 10.244.0.0/16
  ipipMode: Never           # 不使用IP-in-IP（BGP直接路由）
  natOutgoing: true
  blockSize: 26
```

**Cilium（eBPF模式）优势：**
- 绕过iptables，直接在内核层面处理网络策略
- 支持七层网络策略（HTTP、gRPC、Kafka等）
- 内置可观测性（Hubble）
- 性能最优，适合大规模集群

---

### Q25: 如何实现Kubernetes多集群管理？⭐⭐⭐

**答案：**

**多集群管理方案：**

**1. Federation V2（KubeFed）**

```yaml
# KubeFed Cluster
apiVersion: types.kubefed.io/v1beta1
kind: KubeFedCluster
metadata:
  name: cluster-east
spec:
  apiEndpoint: https://east-api.example.com
  secretRef:
    name: cluster-east-secret
```

- 官方方案，但社区活跃度下降
- 适合简单的多集群应用分发

**2. Rancher**

```yaml
# Rancher管理多集群
# 提供统一UI管理多个K8s集群
# 支持导入已有集群或创建新集群
# 内置应用商店、监控、日志
```

- 最成熟的多集群管理平台
- 统一UI和API
- 支持集群模板、RBAC

**3. Cluster API（CAPI）**

```yaml
# Cluster API定义集群
apiVersion: cluster.x-k8s.io/v1beta1
kind: Cluster
metadata:
  name: my-cluster
spec:
  controlPlaneRef:
    apiVersion: controlplane.cluster.x-k8s.io/v1beta1
    kind: KubeadmControlPlane
    name: my-cluster-control-plane
  infrastructureRef:
    apiVersion: infrastructure.cluster.x-k8s.io/v1beta1
    kind: AWSCluster
    name: my-cluster-infrastructure
```

- K8s原生的集群生命周期管理
- 声明式管理集群的创建、升级、删除
- 支持多云（AWS、GCP、Azure、vSphere等）

**4. ArgoCD + ApplicationSet（GitOps多集群）**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-all-clusters
spec:
  generators:
  - list:
      elements:
      - cluster: cluster-east
        url: https://east-api.example.com
      - cluster: cluster-west
        url: https://west-api.example.com
  template:
    metadata:
      name: 'my-app-{{cluster}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/myorg/k8s-manifests.git
        targetRevision: main
        path: overlays/{{cluster}}
      destination:
        server: '{{url}}'
        namespace: production
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

**多集群服务网格（Istio Multi-Cluster）：**

```
Cluster East ←→ Cluster West
    ↑                ↑
    └── Istiod ──────┘
        (共享控制面或独立控制面)
```

**多集群管理最佳实践：**
- 使用GitOps管理多集群配置
- 每个集群独立管理，避免跨集群强耦合
- 使用Cluster API自动化集群生命周期
- 统一监控和日志（多集群Prometheus Thanos方案）

---

### Q26: Kubernetes中如何进行故障排查？⭐⭐

**答案：**

**常见故障排查流程：**

**1. Pod状态异常**

```bash
# 查看Pod状态
kubectl get pods -o wide

# 查看Pod事件（非常重要！）
kubectl describe pod <pod-name>

# 查看Pod日志
kubectl logs <pod-name>
kubectl logs <pod-name> -c <container-name>  # 多容器时指定
kubectl logs <pod-name> --previous            # 查看上一个容器的日志（CrashLoopBackOff时有用）
```

**常见Pod异常及解决：**

| 状态 | 原因 | 解决方案 |
|------|------|---------|
| ImagePullBackOff | 镜像不存在/权限不足 | 检查镜像名、imagePullSecrets |
| CrashLoopBackOff | 容器启动后崩溃 | 查看日志`--previous`，检查配置 |
| Pending | 资源不足/调度失败 | `describe`查看Events，检查资源配额 |
| OOMKilled | 内存超限 | 增加memory limit或优化应用 |
| ContainerCreating | 镜像拉取中/挂载失败 | `describe`查看Events |

**2. Service无法访问**

```bash
# 检查Service Endpoints
kubectl get endpoints <service-name>

# 检查DNS解析
kubectl exec -it <pod-name> -- nslookup <service-name>

# 检查iptables规则
iptables -t nat -L -n | grep <service-name>

# 检查kube-proxy日志
kubectl logs -n kube-system -l k8s-app=kube-proxy
```

**3. Node异常**

```bash
# 查看Node状态
kubectl get nodes -o wide
kubectl describe node <node-name>

# 查看Node资源使用
kubectl top nodes

# 查看Node上的Pod
kubectl get pods --all-namespaces --field-selector spec.nodeName=<node-name>

# 查看Node事件
kubectl get events --field-selector involvedObject.kind=Node
```

**4. 排查工具**

```bash
# kubectl debug（K8s 1.18+，调试运行中的Pod）
kubectl debug <pod-name> -it --image=busybox

# 查看集群事件
kubectl get events --sort-by='.lastTimestamp'

# 查看资源使用
kubectl top pods -n <namespace>

# 检查API Server健康
kubectl cluster-info
kubectl get componentstatuses
```

**故障排查清单：**

```
1. kubectl get pods → 查看Pod状态
2. kubectl describe pod → 查看Events
3. kubectl logs → 查看应用日志
4. kubectl get endpoints → 检查Service关联
5. kubectl get nodes → 检查Node状态
6. kubectl get events → 查看集群事件
7. 检查资源配额（ResourceQuota/LimitRange）
8. 检查网络策略（NetworkPolicy）
9. 检查RBAC权限
10. 检查etcd健康状态
```

---

### Q27: 什么是Serverless？Knative的核心概念是什么？⭐⭐

**答案：**

**Serverless（无服务器）：**

Serverless并不是没有服务器，而是开发者无需关心服务器的管理（自动扩缩容、按使用量计费）。

**Serverless分类：**
- **FaaS（Function as a Service）**：AWS Lambda、Cloud Functions
- **BaaS（Backend as a Service）**：数据库、认证、存储等后端服务
- **Serverless容器**：Knative、AWS Fargate

**Knative核心组件：**

```
┌────────────────────────────────────────┐
│              Knative Serving           │
│  (自动扩缩容、流量管理、版本管理)       │
├────────────────────────────────────────┤
│              Knative Eventing          │
│  (事件驱动、事件路由)                   │
└────────────────────────────────────────┘
         ↕
┌────────────────────────────────────────┐
│              Kubernetes                │
└────────────────────────────────────────┘
```

**Knative Serving核心概念：**

```yaml
# Knative Service
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: my-app
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/min-scale: "0"     # 最小副本数为0（自动缩容到0）
        autoscaling.knative.dev/target: "100"       # 每个Pod目标100并发
    spec:
      containers:
      - image: my-registry/my-app:latest
        ports:
        - containerPort: 8080
        env:
        - name: TARGET
          value: "Knative"
```

**Knative核心特性：**

1. **Scale to Zero**：无流量时自动缩容到0，节省资源
2. **自动扩缩容**：基于请求量自动扩容（KPA - Knative Pod Autoscaler）
3. **流量管理**：版本路由、灰度发布
4. **自动回滚**：新版本异常自动回滚到旧版本

**Knative Eventing：**
```yaml
# 事件源 → Broker → Trigger → Service
apiVersion: eventing.knative.dev/v1
kind: Broker
metadata:
  name: default
---
apiVersion: eventing.knative.dev/v1
kind: Trigger
metadata:
  name: my-trigger
spec:
  broker: default
  filter:
    attributes:
      type: dev.knative.event.order-created
  subscriber:
    ref:
      apiVersion: serving.knative.dev/v1
      kind: Service
      name: order-processor
```

**Knative vs 传统Deployment：**

| 维度 | Deployment | Knative Serving |
|------|-----------|----------------|
| 最小副本 | >=1 | 0（Scale to Zero） |
| 扩缩容 | HPA（基于CPU/自定义指标） | KPA（基于并发请求数） |
| 流量管理 | 需要Ingress/Istio | 内置路由和灰度 |
| 冷启动 | 无 | 有（从0扩容时） |
| 适用场景 | 常驻服务 | 弹性工作负载 |

---

### Q28: 如何设计一个高可用的CI/CD系统？⭐⭐⭐

**答案：**

**高可用CI/CD架构：**

```
┌──────────────────────────────────────────────────────┐
│                    Git仓库                           │
│          (GitHub/GitLab/Bitbucket)                   │
└────────────────────┬─────────────────────────────────┘
                     ↓ Webhook
┌──────────────────────────────────────────────────────┐
│               CI/CD Platform                         │
│  ┌──────────────┐  ┌──────────────┐                  │
│  │ GitLab Runner│  │ GitLab Runner│ (多Runner高可用)  │
│  │   Runner 1   │  │   Runner 2   │                  │
│  └──────────────┘  └──────────────┘                  │
│         ↕                ↕                           │
│  ┌──────────────────────────────────────────────┐    │
│  │           缓存（S3/MinIO/NFS）               │    │
│  └──────────────────────────────────────────────┘    │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│              Artifact Registry                        │
│         (Harbor/ECR/GCR)                              │
└────────────────────┬─────────────────────────────────┘
                     ↓
┌──────────────────────────────────────────────────────┐
│              GitOps (ArgoCD/Flux)                     │
│         自动同步到K8s集群                             │
└──────────────────────────────────────────────────────┘
```

**高可用设计要点：**

**1. Runner高可用**
```yaml
# GitLab Runner配置（K8s模式）
concurrent = 20
check_interval = 30

[[runners]]
  name = "kubernetes-runner"
  url = "https://gitlab.example.com/"
  token = "RUNNER_TOKEN"
  executor = "kubernetes"
  [runners.kubernetes]
    namespace = "ci"
    poll_timeout = 600
    poll_interval = 5
    # 使用多个namespace分散负载
    [[runners.kubernetes.pod_labels]]
      "runner" = "gitlab-runner"
```

**2. 缓存共享**
- 使用S3/MinIO作为分布式缓存
- 多个Runner共享缓存，避免重复下载依赖

**3. 镜像仓库高可用**
```yaml
# Harbor高可用部署
# - 双副本数据库（MySQL主从）
# - Redis哨兵模式
# - 多副本Registry
# - 对象存储后端（S3/MinIO）
```

**4. 安全设计**
- Runner使用最小权限
- Secret通过CI/CD平台的Secret管理
- 镜像签名和扫描
- 构建环境隔离（Docker-in-Docker或Kaniko）

**5. 流水线设计原则**
- 快速反馈：单元测试 < 5分钟
- 并行执行：独立的测试可以并行
- 增量构建：利用缓存加速
- 分阶段审批：生产部署需要人工审批

---

### Q29: 容器安全有哪些最佳实践？⭐⭐

**答案：**

**容器安全最佳实践：**

**1. 镜像安全**

```dockerfile
# 使用精简基础镜像
FROM gcr.io/distroless/static-debian12

# 不以root运行
RUN useradd -r -s /bin/false appuser
USER appuser

# 固定版本，不使用latest
FROM nginx:1.25.3-alpine
```

- 使用Alpine或distroless基础镜像（减少攻击面）
- 固定镜像版本标签（不使用`latest`）
- 定期扫描镜像漏洞（Trivy、Clair、Snyk）
- 使用镜像签名（cosign、Notary）
- 多阶段构建（构建阶段和运行阶段分离）

**2. 运行时安全**

```yaml
# Pod安全上下文
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

- 不以root用户运行
- 禁止特权容器（`privileged: false`）
- 只读根文件系统
- 限制Linux Capabilities
- 使用Seccomp/AppArmor限制系统调用
- 启用Pod Security Standards

**3. 网络安全**

```yaml
# NetworkPolicy：默认拒绝所有流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

- 默认拒绝所有网络流量
- 按需开放（最小权限原则）
- 使用NetworkPolicy隔离命名空间
- 启用mTLS（Service Mesh）

**4. Secret管理**

- 不在镜像中硬编码密码
- 使用K8s Secret或外部密钥管理（Vault、AWS Secrets Manager）
- 启用etcd加密
- 使用CSI Secret Store驱动

**5. 供应链安全**

- 镜像仓库访问控制
- 镜像签名验证（Sigstore/cosign）
- SBOM（Software Bill of Materials）生成
- 使用可信构建环境

**6. 运行时监控**

- Falco：运行时安全监控（检测异常行为）
- Open Policy Agent（OPA/Gatekeeper）：策略引擎
- 审计日志：记录所有API操作

```yaml
# OPA Gatekeeper策略示例
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: require-non-root
spec:
  crd:
    spec:
      names:
        kind: RequireNonRoot
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      violation[{"msg": msg}] {
        container := input.review.object.spec.containers[_]
        not container.securityContext.runAsNonRoot
        msg := sprintf("Container <%s> must set runAsNonRoot", [container.name])
      }
```

---

### Q30: 如何从零搭建一个生产级Kubernetes平台？⭐⭐⭐

**答案：**

**生产级K8s平台搭建步骤：**

**第一步：基础设施规划**

```
集群规模：3 Master + N Worker
硬件要求：
  Master: 4C8G（小规模）或 8C16G（大规模）
  Worker: 根据工作负载规划
网络规划：
  Pod CIDR: 10.244.0.0/16
  Service CIDR: 10.96.0.0/12
  Node CIDR: 192.168.1.0/24
```

**第二步：选择K8s发行版和安装方式**

| 方式 | 适用场景 | 工具 |
|------|---------|------|
| 托管服务 | 不想管理Master | EKS/GKE/AKS |
| kubeadm | 自建集群（最通用） | kubeadm init/join |
| k3s | 轻量级/边缘计算 | k3s install script |
| RKE2 | 安全合规要求 | RKE2 installer |
| Kops | AWS自建 | kops create cluster |

**第三步：核心组件安装**

```bash
# 1. CNI插件（选择Calico）
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.26.0/manifests/calico.yaml

# 2. Metrics Server（HPA依赖）
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 3. Ingress Controller（Nginx）
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace \
  --set controller.replicaCount=2

# 4. cert-manager（自动TLS证书）
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace \
  --set installCRDs=true
```

**第四步：可观测性**

```bash
# Prometheus + Grafana
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace

# EFK日志
helm install elasticsearch elastic/elasticsearch \
  --namespace logging --create-namespace
helm install kibana elastic/kibana \
  --namespace logging --create-namespace
helm install filebeat elastic/filebeat \
  --namespace logging --create-namespace
```

**第五步：安全加固**

```bash
# RBAC：创建命名空间和ServiceAccount
# NetworkPolicy：配置网络策略
# Pod Security：启用Pod Security Admission
# Secret加密：配置etcd加密
# 审计日志：配置API Server审计
```

**第六步：GitOps配置**

```bash
# 安装ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 配置Application
argocd app create my-app \
  --repo https://github.com/myorg/k8s-manifests.git \
  --path overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production
```

**第七步：备份与灾备**

```bash
# Velero备份
velero install --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.7.0 \
  --bucket velero-backups \
  --secret-file ./credentials-velero \
  --backup-location-config region=us-east-1

# 定时备份
velero schedule create daily-backup --schedule="0 2 * * *"
```

**生产级检查清单：**

```
[ ] 高可用Master（3节点）
[ ] etcd集群（3或5节点，独立磁盘）
[ ] CNI插件（Calico/Cilium）
[ ] Ingress Controller（多副本）
[ ] cert-manager（自动TLS）
[ ] Metrics Server（HPA依赖）
[ ] Prometheus + Grafana（监控）
[ ] EFK/ELK（日志）
[ ] ArgoCD（GitOps）
[ ] Velero（备份恢复）
[ ] RBAC（权限控制）
[ ] NetworkPolicy（网络隔离）
[ ] Pod Security Admission
[ ] Secret加密
[ ] 资源Requests/Limits
[ ] PDB（Pod Disruption Budget）
[ ] 镜像仓库（Harbor）
[ ] 日志规范（JSON格式、traceId）
[ ] 告警规则（黄金信号）
```
