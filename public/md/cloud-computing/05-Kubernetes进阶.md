# 05 Kubernetes 进阶

## 5.1 Ingress

### 5.1.1 Ingress vs Service

Service 和 Ingress 是 Kubernetes 中两种不同层次的流量入口机制：

| 维度 | Service | Ingress |
|------|---------|---------|
| **OSI 层次** | 四层（TCP/UDP） | 七层（HTTP/HTTPS） |
| **路由能力** | 基于 IP:Port 转发 | 基于 Host、Path 转发 |
| **TLS 终止** | 不支持（需在应用层处理） | 原生支持 TLS 证书管理 |
| **域名路由** | 不支持 | 支持多域名、多路径路由 |
| **对外暴露** | LoadBalancer 类型需要多个 LB | 一个 Ingress Controller 可代理所有服务 |
| **成本** | 每个 Service 一个 LB（费用高） | 共享一个 LB（成本低） |

**工作原理**：
```
外部请求 → LoadBalancer / NodePort
    → Ingress Controller（Nginx/Traefik）
        → 根据 Host/Path 规则路由
            → Service A（ClusterIP）
            → Service B（ClusterIP）
            → Service C（ClusterIP）
```

**核心优势**：Ingress 将多个 Service 的入口统一管理，支持基于域名的虚拟主机、URL 路径路由、TLS 终止、流量限流、重写等高级功能，是生产环境 HTTP/HTTPS 服务对外暴露的标准方式。

### 5.1.2 Ingress Controller
| Controller | 特点 |
|-----------|------|
| Nginx Ingress | 最流行，社区活跃 |
| Traefik | 自动发现，配置简单 |
| Istio Gateway | Service Mesh 集成 |

### 5.1.3 Ingress 规则配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "10"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
spec:
  ingressClassName: nginx           # 指定 Ingress Controller（K8s 1.18+）

  # TLS 配置
  tls:
  - hosts:
    - app.example.com
    - api.example.com
    secretName: tls-secret          # 包含 tls.crt 和 tls.key 的 Secret

  rules:
  # 基于域名的路由
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
      - path: /api(/|$)(.*)
        pathType: Prefix
        backend:
          service:
            name: backend-api
            port:
              number: 8080

  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: api-v1-service
            port:
              number: 8080
      - path: /v2
        pathType: Prefix
        backend:
          service:
            name: api-v2-service
            port:
              number: 8080
```

**pathType 说明**：
| pathType | 说明 |
|----------|------|
| **Exact** | 精确匹配路径 |
| **Prefix** | 前缀匹配（按 `/` 分割） |
| **ImplementationSpecific** | 由 Ingress Controller 决定 |

**常用 Nginx Ingress 注解**：
| 注解 | 说明 |
|------|------|
| `nginx.ingress.kubernetes.io/rewrite-target` | URL 重写目标 |
| `nginx.ingress.kubernetes.io/ssl-redirect` | 强制 HTTPS 重定向 |
| `nginx.ingress.kubernetes.io/proxy-body-size` | 请求体大小限制 |
| `nginx.ingress.kubernetes.io/cors-allow-origin` | CORS 允许的源 |
| `nginx.ingress.kubernetes.io/limit-rps` | 每秒请求速率限制 |
| `nginx.ingress.kubernetes.io/affinity` | 会话亲和性（cookie） |

## 5.2 持久化存储

### 5.2.1 Volume 类型
| 类型 | 说明 |
|------|------|
| emptyDir | Pod 生命周期临时存储 |
| hostPath | 挂载宿主机目录 |
| configMap/secret | 配置/密钥挂载 |
| PVC | 持久化存储（推荐） |

### 5.2.2 PV（PersistentVolume）

PV 是集群级别的**存储资源**，由管理员创建或通过 StorageClass 动态供给。PV 独立于 Pod 的生命周期，Pod 删除后 PV 中的数据仍然保留。

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-pv
  labels:
    storage-type: nfs
spec:
  capacity:
    storage: 50Gi
  # 访问模式
  accessModes:
  - ReadWriteMany              # 多节点读写
  # 回收策略
  persistentVolumeReclaimPolicy: Retain
  # 存储类
  storageClassName: nfs
  # NFS 配置
  nfs:
    server: 192.168.1.100
    path: /data/shared
  # 挂载选项
  mountOptions:
  - hard
  - nfsvers=4.1
```

**访问模式**：
| 模式 | 缩写 | 说明 |
|------|------|------|
| ReadWriteOnce | RWO | 单节点读写（最常用） |
| ReadOnlyMany | ROX | 多节点只读 |
| ReadWriteMany | RWX | 多节点读写 |
| ReadWriteOncePod | RWOP | 单 Pod 读写（K8s 1.22+） |

**回收策略**：
| 策略 | 说明 |
|------|------|
| Retain | PV 保留数据，需手动清理后才能重新绑定 |
| Delete | PVC 删除时自动删除 PV 和底层存储 |
| Recycle（已弃用） | 执行 `rm -rf` 清理数据（K8s 1.31 中已移除） |

### 5.2.3 PVC（PersistentVolumeClaim）

PVC 是用户对存储的**请求声明**，类似 Pod 消费节点资源，PVC 消费 PV 资源。PVC 会自动绑定到满足条件的 PV。

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: app-data-pvc
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: local-path   # 指定 StorageClass（空字符串表示静态绑定）
  resources:
    requests:
      storage: 10Gi              # 请求 10Gi 存储
  # 可选：选择特定 PV
  selector:
    matchLabels:
      storage-type: nfs
---
# 在 Pod 中使用 PVC
apiVersion: v1
kind: Pod
metadata:
  name: app-with-pvc
  namespace: default
spec:
  containers:
  - name: app
    image: nginx:1.27
    volumeMounts:
    - name: data
      mountPath: /app/data
  volumes:
  - name: data
    persistentVolumeClaim:
      claimName: app-data-pvc
```

**PV 与 PVC 的绑定关系**：
```
管理员创建 PV          用户创建 PVC          自动绑定
+----------+         +----------+         +----------+
| PV       | ←匹配→  | PVC      | ←引用→  | Pod      |
| 50Gi NFS |         | 10Gi     |         | /app/data|
+----------+         +----------+         +----------+
```

### 5.2.4 StorageClass

StorageClass 用于实现**动态存储供给**，无需管理员预先创建 PV。当用户创建 PVC 时，StorageClass 自动创建匹配的 PV。

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-path
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"   # 设为默认 StorageClass
provisioner: rancher.io/local-path    # 存储供给方（不同厂商不同）
reclaimPolicy: Delete                 # PVC 删除时自动删除 PV
volumeBindingMode: WaitForFirstConsumer  # 等待 Pod 调度后再绑定（延迟绑定）
allowVolumeExpansion: true            # 允许 PVC 扩容
parameters:
  pathPattern: "{{ .PVC.Namespace }}/{{ .PVC.Name }}"
---
# 使用动态供给的 PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
  namespace: default
spec:
  accessModes:
  - ReadWriteOnce
  storageClassName: local-path       # 引用 StorageClass
  resources:
    requests:
      storage: 20Gi
```

**volumeBindingMode**：
| 模式 | 说明 |
|------|------|
| Immediate | PVC 创建后立即绑定（默认） |
| WaitForFirstConsumer | 等待 Pod 使用该 PVC 被调度后再绑定，确保 PV 在正确的节点上创建 |

**常见 StorageClass provisioner**：
| provisioner | 说明 |
|-------------|------|
| `kubernetes.io/aws-ebs` | AWS EBS 卷 |
| `kubernetes.io/gce-pd` | GCP Persistent Disk |
| `kubernetes.io/azure-disk` | Azure Disk |
| `disk.csi.aliyuncs.com` | 阿里云云盘 |
| `rancher.io/local-path` | 本地路径（开发测试） |
| `topolvm.cybozu.com` | 本地 LVM 卷 |

### 5.2.5 CSI（Container Storage Interface）

CSI 是 Kubernetes 提供的**标准化存储插件接口**，允许存储厂商编写独立的存储驱动，而无需修改 K8s 核心代码。

**CSI 架构**：
```
+------------------+     +------------------+     +------------------+
|   K8s 组件       |     |   CSI Sidecar    |     |   CSI Driver     |
|                  |     |   (辅助容器)      |     |   (存储厂商实现)  |
| kubelet          | ←→  | CSI-NodeDriver   | ←→  | Node Plugin      |
| external-        | ←→  | Registrar        |     | (节点级)          |
| provisioner      | ←→  | external-        | ←→  | Controller       |
| (Controller)     |     | provisioner      |     | Plugin           |
|                  |     | external-        | ←→  | (控制平面级)      |
|                  |     | attacher         |     |                  |
+------------------+     +------------------+     +------------------+
```

**CSI 的核心组件**：
- **CSI Driver**：存储厂商实现的 gRPC 服务，分为 Node Plugin（节点级，执行挂载/卸载）和 Controller Plugin（控制平面级，管理卷的创建/删除/附加/分离）
- **CSI Sidecar**：K8s 社区提供的辅助容器，将 CSI Driver 与 K8s API 对接
  - `external-provisioner`：监听 PVC，调用 CSI 创建/删除卷
  - `external-attacher`：监听 VolumeAttachment，调用 CSI 附加/分离卷
  - `external-resizer`：监听 PVC 扩容请求
  - `csi-node-driver-registrar`：向 kubelet 注册 CSI Node Plugin
  - `livenessprobe`：CSI Driver 的健康检查

**常见 CSI 驱动**：
| CSI 驱动 | 存储后端 |
|----------|---------|
| AWS EBS CSI | Amazon EBS |
| GCE PD CSI | Google Persistent Disk |
| Azure Disk CSI | Azure Disk |
| Alibaba Cloud CSI | 阿里云 NAS/云盘/OSS |
| Local Path Provisioner | 本地磁盘 |
| Longhorn | 分布式块存储 |
| Ceph CSI | Ceph RBD/CephFS |

## 5.3 RBAC（基于角色的访问控制）

### 5.3.1 四个核心对象
- **Role**：命名空间级别的权限规则
- **ClusterRole**：集群级别的权限规则
- **RoleBinding**：将 Role 绑定到用户/组/ServiceAccount
- **ClusterRoleBinding**：将 ClusterRole 绑定到用户/组/ServiceAccount

### 5.3.2 RBAC 配置示例

```yaml
# 1. 定义命名空间级别的 Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: default
rules:
- apiGroups: [""]                    # 核心 API 组（Pod、Service 等）
  resources: ["pods", "pods/log"]    # 资源类型
  verbs: ["get", "list", "watch"]    # 允许的操作
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list"]
---
# 2. 定义集群级别的 ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: secret-reader
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["nodes"]
  verbs: ["get", "list"]
---
# 3. 将 Role 绑定到 ServiceAccount（命名空间级别）
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: default
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
---
# 4. 将 ClusterRole 绑定到 ServiceAccount（集群级别）
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-secrets-global
subjects:
- kind: ServiceAccount
  name: app-service-account
  namespace: default
roleRef:
  kind: ClusterRole
  name: secret-reader
  apiGroup: rbac.authorization.k8s.io
---
# 5. 创建 ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-service-account
  namespace: default
---
# 6. 在 Pod 中使用 ServiceAccount
apiVersion: v1
kind: Pod
metadata:
  name: sa-demo
  namespace: default
spec:
  serviceAccountName: app-service-account   # 指定 ServiceAccount
  containers:
  - name: app
    image: myapp:latest
```

**RBAC 最佳实践**：
- 遵循**最小权限原则**：只授予必要的权限
- 使用 ServiceAccount 而非用户账户进行 Pod 内 API 访问
- 定期审计 RBAC 配置，清理不必要的权限
- 使用 `kubectl auth can-i --list` 检查权限
- 避免使用 `cluster-admin` ClusterRole（拥有所有权限）

## 5.4 Helm

### 5.4.1 Helm 是什么

Helm 是 Kubernetes 的**包管理器**，类似 Linux 系统的 apt/yum 或 Node.js 的 npm。它将多个 K8s 资源打包为一个可版本化、可复用的单元（Chart），简化了应用的部署和管理。

**核心概念**：
| 概念 | 说明 |
|------|------|
| **Chart** | 一个 Helm 包，包含一组 K8s 资源的模板和配置 |
| **Release** | Chart 的一个运行实例，同一个 Chart 可以安装多个 Release |
| **Repository** | Chart 的仓库，用于存储和共享 Chart |
| **Values** | Chart 的配置参数，用于自定义部署 |

**Helm 的优势**：
- 一条命令部署复杂应用（如 `helm install prometheus prometheus-community/kube-prometheus-stack`）
- 支持版本管理和回滚
- 模板化配置，支持参数化部署（dev/staging/prod 不同配置）
- 丰富的社区 Chart 仓库（Artifact Hub）

### 5.4.2 Chart 结构
```
my-chart/
├── Chart.yaml          # Chart 元数据
├── values.yaml         # 默认配置值
├── templates/          # K8s 资源模板
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl    # 模板辅助函数
└── charts/             # 依赖的子 Chart
```

### 5.4.3 常用命令

```bash
# 添加 Chart 仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update                               # 更新仓库索引

# 搜索 Chart
helm search repo nginx                         # 搜索仓库中的 Chart
helm search hub prometheus                     # 搜索 Artifact Hub

# 查看 Chart 信息
helm show values bitnami/nginx                 # 查看默认配置
helm show readme bitnami/nginx                 # 查看 README
helm template my-release bitnami/nginx         # 本地渲染模板（不安装）

# 安装
helm install my-nginx bitnami/nginx            # 安装（使用默认配置）
helm install my-nginx bitnami/nginx -f custom-values.yaml  # 使用自定义配置
helm install my-nginx bitnami/nginx --set replicaCount=3 --set service.type=NodePort  # 命令行传参
helm install my-nginx ./my-chart               # 从本地目录安装
helm install my-nginx bitnami/nginx -n production --create-namespace  # 指定命名空间

# 升级
helm upgrade my-nginx bitnami/nginx            # 升级到最新版本
helm upgrade my-nginx bitnami/nginx -f new-values.yaml  # 修改配置并升级
helm upgrade --install my-nginx bitnami/nginx  # 不存在则安装，存在则升级（推荐 CI/CD 使用）

# 回滚
helm rollback my-nginx 1                       # 回滚到版本 1
helm rollback my-nginx 0                       # 回滚到上一个版本
helm history my-nginx                          # 查看版本历史

# 查看
helm list                                      # 列出所有 Release
helm list -n production                        # 列出指定命名空间的 Release
helm status my-nginx                           # 查看 Release 状态
helm get values my-nginx                       # 查看当前配置值
helm get all my-nginx                          # 查看所有资源信息

# 卸载
helm uninstall my-nginx                        # 卸载 Release
helm uninstall my-nginx --keep-history         # 卸载但保留历史记录
```

## 5.5 HPA（水平Pod自动伸缩）

### 5.5.1 HPA 工作原理

HPA（Horizontal Pod Autoscaler）根据监控指标自动调整 Deployment/StatefulSet/ReplicaSet 的 Pod 副本数。

**工作流程**：
```
Metrics Server（采集 CPU/内存指标）
    ↓
自定义指标适配器（采集自定义指标，如 QPS）
    ↓
HPA Controller（每 15s 检查一次指标）
    ↓
计算期望副本数 = ceil(当前副本数 * (当前指标值 / 期望指标值))
    ↓
调用 Scale 子资源调整副本数
```

**指标来源**：
| 指标类型 | 数据源 | 说明 |
|---------|--------|------|
| Resource | Metrics Server | CPU、内存使用率 |
| Pods | 自定义指标 API（Prometheus Adapter） | Pod 级别的自定义指标（如 QPS） |
| Object | 自定义指标 API | K8s 对象指标（如 Ingress QPS） |
| ContainerResource | Metrics Server | 容器级别的 CPU、内存 |

**前置条件**：必须安装 **Metrics Server** 才能使用 CPU/内存指标进行自动伸缩。

### 5.5.2 HPA 配置

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment

  minReplicas: 2                    # 最小副本数
  maxReplicas: 10                   # 最大副本数

  metrics:
  # CPU 指标
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization           # 使用率（相对于 requests）
        averageUtilization: 70      # 目标 CPU 使用率 70%

  # 内存指标
  - type: Resource
    resource:
      name: memory
      target:
        type: AverageValue          # 平均值
        averageValue: "500Mi"       # 目标平均内存 500Mi

  # 自定义指标（需要 Prometheus Adapter）
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"

  behavior:
    # 扩容行为
    scaleUp:
      stabilizationWindowSeconds: 60    # 扩容稳定窗口（60s 内不重复扩容）
      policies:
      - type: Pods
        value: 4                        # 每次最多增加 4 个 Pod
        periodSeconds: 60               # 在 60s 内
      - type: Percent
        value: 100                      # 或增加当前副本数的 100%
        periodSeconds: 60
      selectPolicy: Max                 # 多个策略取最大值

    # 缩容行为
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容稳定窗口（5 分钟内不重复缩容）
      policies:
      - type: Pods
        value: 1                        # 每次最多减少 1 个 Pod
        periodSeconds: 60
      - type: Percent
        value: 10                       # 或减少当前副本数的 10%
        periodSeconds: 60
      selectPolicy: Min                 # 多个策略取最小值（更保守）
```

### 5.5.3 VPA（垂直Pod自动伸缩）

VPA（Vertical Pod Autoscaler）根据容器的历史和当前资源使用情况，自动调整 Pod 的 CPU 和内存 requests/limits。

**VPA 由三个组件组成**：
- **VPA Recommender**：监控资源使用，计算推荐值
- **VPA Updater**：驱逐需要更新的 Pod（使其以新资源配置重建）
- **VPA Admission Controller**：在 Pod 创建/更新时注入推荐的资源设置

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: app-vpa
  namespace: default
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment

  updatePolicy:
    updateMode: Auto               # Auto=自动更新（驱逐 Pod），Recreate=重建时更新，Off=仅建议

  resourcePolicy:
    containerPolicies:
    - containerName: '*'
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: "4"
        memory: 8Gi
      controlledResources: ["cpu", "memory"]
    - containerName: sidecar        # 排除特定容器
      mode: "Off"

  recommenders:
  - name: custom-recommender       # 可自定义推荐器
```

**HPA 与 VPA 的对比**：
| 维度 | HPA | VPA |
|------|-----|-----|
| 调整方向 | 水平（增减 Pod 数量） | 垂直（调整 Pod 资源限制） |
| 适用场景 | 负载波动大 | 资源配置不合理 |
| 副本数变化 | 是 | 否 |
| Pod 重建 | 不需要 | 需要驱逐重建 |
| 注意事项 | 需要 Metrics Server | **不要与 HPA 同时使用 CPU/内存指标** |

## 5.6 网络策略（NetworkPolicy）

### 5.6.1 默认网络行为

在 Kubernetes 中，**默认情况下所有 Pod 之间的网络是完全互通的**，无论它们是否在同一个 Namespace 中。这意味着：
- 任何 Pod 可以访问任何其他 Pod 的任何端口
- 没有入站（ingress）或出站（egress）限制
- 这是一个安全隐患，特别是在多租户环境中

**NetworkPolicy 是解决此问题的机制**，但需要注意：
- NetworkPolicy 是**白名单模式**：创建的规则是"允许"规则，未匹配到的流量默认拒绝
- NetworkPolicy 需要 CNI 网络插件支持（Calico、Cilium 等支持，Flannel 默认不支持）
- 如果没有为 Pod 创建任何 NetworkPolicy，则该 Pod 的网络流量不受限制
- NetworkPolicy 只控制 Pod 的网络流量，不控制 Node 之间的流量

### 5.6.2 NetworkPolicy 配置

```yaml
# 1. 允许特定命名空间的 Pod 访问
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-from-frontend
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: api-server           # 作用于 backend 命名空间中 app=api-server 的 Pod
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:        # 允许来自 frontend 命名空间的流量
        matchLabels:
          env: frontend
    - podSelector:              # 允许来自同一命名空间中 app=monitoring 的 Pod
        matchLabels:
          app: monitoring
    ports:
    - protocol: TCP
      port: 8080
---
# 2. 拒绝所有入站流量（命名空间级别的隔离）
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: sensitive
spec:
  podSelector: {}               # 选择所有 Pod（空选择器 = 全部）
  policyTypes:
  - Ingress
  # ingress 为空 = 拒绝所有入站流量
---
# 3. 允许所有出站流量，但限制目标
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: restrict-egress
  namespace: backend
spec:
  podSelector:
    matchLabels:
      app: api-server
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          env: database
      podSelector:
        matchLabels:
          app: mysql
    ports:
    - protocol: TCP
      port: 3306
  # 允许 DNS 解析（必须显式允许，否则 Pod 无法解析域名）
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
---
# 4. 完全隔离（拒绝所有入站和出站）
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: full-isolation
  namespace: quarantine
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**注意事项**：
- 创建 NetworkPolicy 时，必须确保 DNS 流量（UDP/TCP 53 端口）被允许，否则 Pod 无法解析域名
- NetworkPolicy 的 `podSelector: {}` 表示选择命名空间中的所有 Pod，不是"不选择"
- 需要确认 CNI 插件是否支持 NetworkPolicy（Calico、Cilium、Weave Net 支持；Flannel 不支持）

## 5.7 亲和性调度进阶

### 5.7.1 nodeAffinity

节点亲和性用于限制 Pod 只能调度到满足特定条件的节点上。分为两种类型：

- **requiredDuringSchedulingIgnoredDuringExecution**（硬约束）：调度时必须满足，否则 Pod 无法调度。已运行的 Pod 不受影响。
- **preferredDuringSchedulingIgnoredDuringExecution**（软约束）：调度器尽量满足，无法满足时仍可调度到其他节点。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: affinity-demo
spec:
  affinity:
    nodeAffinity:
      # 硬约束：必须调度到带有 zone=east 标签的节点
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values:
            - east-1
            - east-2
          - key: node-type
            operator: NotIn
            values:
            - spot-instance

      # 软约束：优先调度到带有 gpu=true 标签的节点
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80                  # 权重 1-100
        preference:
          matchExpressions:
          - key: gpu
            operator: In
            values:
            - "true"
      - weight: 20
        preference:
          matchExpressions:
          - key: disktype
            operator: In
            values:
            - ssd
  containers:
  - name: app
    image: myapp:latest
```

**支持的 operator**：`In`、`NotIn`、`Exists`、`DoesNotExist`、`Gt`、`Lt`

### 5.7.2 podAffinity

Pod 亲和性用于将 Pod 调度到与满足特定标签条件的 Pod 相同的拓扑域中。适用于需要网络邻近性或协作的应用。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: cache-pod
spec:
  affinity:
    podAffinity:
      # 硬约束：必须调度到与 app=web-server Pod 相同节点上
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - web-server
        topologyKey: kubernetes.io/hostname    # 拓扑域为节点级别

      # 软约束：优先调度到与 app=web-server Pod 相同可用区
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchLabels:
              app: web-server
          topologyKey: topology.kubernetes.io/zone   # 拓扑域为可用区级别
  containers:
  - name: redis
    image: redis:7
```

**典型场景**：前端应用和缓存部署在同一节点（降低网络延迟）、同一应用的多个组件部署在同一可用区。

### 5.7.3 podAntiAffinity

Pod 反亲和性用于将 Pod 调度到远离满足特定标签条件的 Pod 的拓扑域中。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-server
  template:
    metadata:
      labels:
        app: web-server
    spec:
      affinity:
        podAntiAffinity:
          # 硬约束：每个节点最多运行一个 web-server Pod
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchExpressions:
              - key: app
                operator: In
                values:
                - web-server
            topologyKey: kubernetes.io/hostname

          # 软约束：优先分布到不同可用区
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: web-server
              topologyKey: topology.kubernetes.io/zone
      containers:
      - name: nginx
        image: nginx:1.27
```

**典型场景**：将同一应用的 Pod 分散到不同节点（高可用）、避免资源争抢、满足合规要求（数据分布在不同可用区）。

### 5.7.4 Topology Spread Constraints

Topology Spread Constraints 提供了更灵活的拓扑分布控制，相比亲和性调度更加直观和精确。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-server
spec:
  replicas: 6
  selector:
    matchLabels:
      app: web-server
  template:
    metadata:
      labels:
        app: web-server
    spec:
      topologySpreadConstraints:
      # 在节点级别均匀分布
      - maxSkew: 1                    # 任意两个拓扑域中的 Pod 数量差最大为 1
        topologyKey: kubernetes.io/hostname
        whenUnsatisfiable: DoNotSchedule   # 无法满足时不调度（硬约束）
        labelSelector:
          matchLabels:
            app: web-server

      # 在可用区级别均匀分布
      - maxSkew: 2
        topologyKey: topology.kubernetes.io/zone
        whenUnsatisfiable: ScheduleAnyway  # 无法满足时仍调度（软约束）
        labelSelector:
          matchLabels:
            app: web-server
      containers:
      - name: nginx
        image: nginx:1.27
```

**参数说明**：
| 参数 | 说明 |
|------|------|
| `maxSkew` | 允许的最大分布偏差 |
| `topologyKey` | 拓扑域的标签键 |
| `whenUnsatisfiable` | `DoNotSchedule`（硬约束）或 `ScheduleAnyway`（软约束） |
| `labelSelector` | 选择要分布的 Pod |

**与亲和性的对比**：
| 维度 | 亲和性调度 | Topology Spread |
|------|----------|----------------|
| 控制粒度 | "在一起"或"不在一起" | "均匀分布" |
| 配置复杂度 | 较复杂 | 更直观 |
| 分布保证 | 不保证均匀 | 保证最大偏差 |
| 推荐场景 | 强制约束（如 GPU 节点） | 均匀分布（如高可用） |

## 5.8 Init Container

Init Container（初始化容器）在主容器启动之前运行，用于完成初始化任务。所有 Init Container 按顺序执行，**必须全部成功完成后，主容器才会启动**。

**特点**：
- 支持 Pod 中所有普通容器的字段（Volume、资源限制等）
- 比主容器先启动，按定义顺序串行执行
- 成功执行完毕后自动退出，不会与主容器同时运行
- 如果任何一个 Init Container 失败，Pod 会重启，所有 Init Container 重新执行

**典型使用场景**：
1. **等待依赖就绪**：等待数据库、缓存等外部服务可用
2. **初始化配置**：生成配置文件、注册到服务发现
3. **数据迁移**：在应用启动前执行数据库 Schema 迁移
4. **下载远程文件**：从远程服务器下载证书、配置文件等到共享 Volume

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: init-container-demo
spec:
  initContainers:
  # 1. 等待 MySQL 就绪
  - name: wait-for-mysql
    image: busybox:1.36
    command: ['sh', '-c', 'until nc -z mysql-service 3306; do echo "Waiting for MySQL..."; sleep 2; done;']

  # 2. 执行数据库迁移
  - name: db-migration
    image: myapp:latest
    command: ["python", "migrate.py"]
    env:
    - name: DB_HOST
      value: "mysql-service"

  # 3. 下载配置文件
  - name: download-config
    image: busybox:1.36
    command: ['sh', '-c', 'wget -O /shared/app.conf https://config-server.example.com/app.conf']
    volumeMounts:
    - name: config-volume
      mountPath: /shared

  containers:
  - name: app
    image: myapp:latest
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
  volumes:
  - name: config-volume
    emptyDir: {}
```

## 5.9 Pod Disruption Budget（PDB）

Pod Disruption Budget（Pod 中断预算）用于限制**自愿中断**（Voluntary Disruption）场景下同时不可用的 Pod 数量，确保服务在集群维护期间仍保持最小可用性。

**自愿中断 vs 非自愿中断**：
| 类型 | 说明 | 示例 |
|------|------|------|
| 自愿中断 | 主动操作导致的中断 | `kubectl drain`、节点维护、Deployment 滚动更新、缩容 |
| 非自愿中断 | 不可控的中断 | 节点故障、Pod OOMKilled、网络问题 |

PDB **只对自愿中断生效**，无法防止非自愿中断。

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
  namespace: default
spec:
  # 选择受保护的 Pod
  selector:
    matchLabels:
      app: web-server

  # 方式1：指定最少可用数量
  minAvailable: 2              # 至少保持 2 个 Pod 可用

  # 方式2：指定最多不可用数量（与 minAvailable 二选一）
  # maxUnavailable: 1          # 最多允许 1 个 Pod 不可用

  # 支持百分比
  # minAvailable: "50%"        # 至少保持 50% 的 Pod 可用
  # maxUnavailable: "25%"      # 最多允许 25% 的 Pod 不可用
```

**PDB 的工作机制**：
```
kubectl drain node-1
    → Eviction API 检查 PDB
    → 如果驱逐后不满足 PDB → 拒绝驱逐
    → 如果满足 PDB → 允许驱逐
```

**最佳实践**：
- 对关键服务（如 API 网关、支付服务）设置 PDB
- `minAvailable` 建议设置为 2 或副本数的一半以上
- 配合 PDB 使用 `kubectl drain --ignore-daemonsets --delete-emptydir-data`
- 注意：PDB 设置过严可能导致节点无法维护（驱逐被拒绝）

## 5.10 面试常见问题

### Q1: Ingress 和 Service LoadBalancer 的区别？

| 维度 | Service LoadBalancer | Ingress |
|------|---------------------|---------|
| **网络层次** | 四层（TCP/UDP） | 七层（HTTP/HTTPS） |
| **路由能力** | 仅基于 IP:Port 转发 | 基于 Host、Path 路由 |
| **TLS** | 在应用层处理 | Ingress Controller 统一处理 TLS 终止 |
| **数量** | 每个 Service 一个 LB | 多个 Service 共享一个 LB |
| **成本** | 高（多个 LB） | 低（一个 LB） |
| **功能** | 负载均衡 | 负载均衡 + 路由 + TLS + 限流 + 重写 |

**选择建议**：HTTP/HTTPS 服务使用 Ingress；非 HTTP 协议（如 TCP 数据库连接）使用 Service LoadBalancer 或 NodePort。

### Q2: PV、PVC、StorageClass 的关系？

三者构成了 Kubernetes 的存储抽象体系：

```
StorageClass（定义存储"类型"和供给方式）
    ↓ 动态供给
PV（集群级别的存储"资源"，管理员创建或自动创建）
    ↓ 绑定
PVC（用户的存储"请求"，Pod 通过 PVC 使用存储）
    ↓ 引用
Pod（挂载 PVC 作为 Volume）
```

- **StorageClass**：定义存储的"类型"和供给策略（provisioner、reclaimPolicy 等），类似云硬盘的"规格"
- **PV**：实际的存储资源，有容量、访问模式、回收策略等属性
- **PVC**：用户对存储的请求声明，包含所需容量、访问模式、StorageClass 等
- **绑定关系**：PVC 会自动绑定到满足条件的 PV；如果配置了 StorageClass 且没有匹配的 PV，则自动创建新的 PV

**静态供给 vs 动态供给**：
- 静态供给：管理员预先创建 PV，PVC 手动或自动匹配
- 动态供给：用户创建 PVC 指定 StorageClass，系统自动创建 PV

### Q3: RBAC 中 Role 和 ClusterRole 的区别？

| 维度 | Role | ClusterRole |
|------|------|-------------|
| **作用范围** | 命名空间级别 | 集群级别 |
| **可管理资源** | 当前命名空间的资源 | 所有命名空间的资源 + 集群级资源（Node、PV、Namespace 等） |
| **绑定方式** | RoleBinding（同一命名空间） | ClusterRoleBinding（全局生效）或 RoleBinding（限定命名空间） |

**ClusterRole 的特殊用途**：即使通过 RoleBinding 将 ClusterRole 绑定到特定命名空间，ClusterRole 中定义的集群级资源权限（如 nodes、persistentvolumes）仍然有效，但命名空间级资源的权限会被限定到绑定所在的命名空间。

**常见内置 ClusterRole**：
| ClusterRole | 说明 |
|-------------|------|
| `cluster-admin` | 超级管理员，拥有所有权限 |
| `admin` | 命名空间管理员，可管理命名空间内所有资源 |
| `edit` | 可编辑命名空间内资源，但不能管理 RBAC 和配额 |
| `view` | 只读权限 |

### Q4: Helm 的 Chart 模板是如何工作的？

Helm Chart 模板基于 Go 模板引擎，通过 `values.yaml` 中的参数渲染 K8s 资源 YAML。

**模板渲染流程**：
```
values.yaml（用户配置）
    ↓ 覆盖
templates/*.yaml（模板文件）
    ↓ Go 模板引擎渲染
K8s 资源 YAML（最终部署的文件）
```

**核心模板语法**：
- `{{ .Values.key }}`：引用 values.yaml 中的值
- `{{ .Release.Name }}`：引用 Release 名称
- `{{ .Chart.Name }}`：引用 Chart 名称
- `{{ include "chartname.fullname" . }}`：引用 `_helpers.tpl` 中定义的模板函数
- `{{- if .Values.enabled }}...{{- end }}`：条件判断
- `{{- range .Values.items }}...{{- end }}`：循环
- `{{ .Values.key | default "default-value" }}`：默认值
- `{{ .Values.key | quote }}`：加引号

**多环境配置**：通过 `-f` 参数覆盖 values.yaml，实现 dev/staging/prod 不同配置：
```bash
helm install my-app ./chart -f values-dev.yaml
helm install my-app ./chart -f values-prod.yaml
```

### Q5: HPA 的伸缩策略是什么？冷却时间怎么配置？

**伸缩计算公式**：
```
期望副本数 = ceil(当前副本数 * (当前指标值 / 期望指标值))
```
例如：当前 3 个副本，CPU 使用率 90%，目标 70%，则期望副本数 = ceil(3 * 90/70) = ceil(3.86) = 4

**冷却时间通过 `behavior` 字段配置**（K8s 1.18+）：
- `stabilizationWindowSeconds`：稳定窗口时间，在此时间窗口内取最大/最小指标值进行计算，避免频繁伸缩
  - 扩容默认 0s（立即响应）
  - 缩容默认 300s（5 分钟稳定窗口）
- `policies`：定义单次伸缩的幅度限制
  - `type: Pods`：按固定 Pod 数量
  - `type: Percent`：按当前副本数的百分比
  - `periodSeconds`：策略生效的时间窗口
  - `selectPolicy`：多个策略时取 Max（扩容）或 Min（缩容）

**最佳实践**：
- 扩容要快（短稳定窗口、大步长），缩容要慢（长稳定窗口、小步长）
- 避免频繁缩容导致服务抖动
- 确保 Pod 已配置 `resources.requests`，否则 CPU 使用率无法计算

### Q6: NetworkPolicy 默认是允许还是拒绝？

**默认是允许所有流量**。但需要注意这里的"默认"含义：

1. **没有 NetworkPolicy 的情况**：Pod 的所有入站和出站流量都是允许的
2. **有 NetworkPolicy 但未匹配的情况**：Pod 的流量被拒绝（白名单模式）

具体来说：
- 如果一个 Pod 没有任何 NetworkPolicy 选中它，则它的网络不受限制
- 如果一个 Pod 被某个 NetworkPolicy 选中，则**只有该 NetworkPolicy 中明确允许的流量才能通过**，其他流量全部拒绝
- 多个 NetworkPolicy 选中同一个 Pod 时，规则取**并集**（union）

**实现完全隔离的方式**：创建一个选择所有 Pod 但 ingress/egress 规则为空的 NetworkPolicy：
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}           # 选择所有 Pod
  policyTypes: [Ingress, Egress]  # 拒绝所有入站和出站
```
