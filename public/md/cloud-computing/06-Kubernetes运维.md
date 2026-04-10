# 06 Kubernetes 运维

## 6.1 K8s 监控体系

### 6.1.1 监控架构
```
                    +------------------+
                    |   Grafana        |
                    |   (可视化)        |
                    +--------+---------+
                             |
                    +--------+---------+
                    |   Prometheus     |
                    |   (数据采集存储)  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------+-----+ +-----+------+ +-----+------+
     | kube-state-  | | node-      | | cadvisor   |
     | metrics      | | exporter   | | (容器指标)  |
     +--------------+ +------------+ +------------+
```

### 6.1.2 Prometheus + Grafana

在 Kubernetes 中，推荐使用 **Prometheus Operator**（kube-prometheus-stack）来部署和管理监控栈。Prometheus Operator 通过 CRD 自动化管理 Prometheus 实例、ServiceMonitor、PrometheusRule 等资源。

**核心 CRD**：
| CRD | 说明 |
|-----|------|
| `Prometheus` | 定义 Prometheus 实例的配置（存储、保留期、资源限制等） |
| `ServiceMonitor` | 声明式地定义 Service 的监控目标，自动发现 Pod Endpoints |
| `PodMonitor` | 类似 ServiceMonitor，但直接基于 Pod 标签选择 |
| `PrometheusRule` | 定义 Prometheus 告警规则和录制规则 |
| `AlertmanagerConfig` | 定义告警路由和通知配置 |
| `ThanosRuler` | Thanos 规则评估组件（用于多集群场景） |

**ServiceMonitor 示例**：
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-monitor
  namespace: monitoring
  labels:
    release: prometheus         # 匹配 Prometheus 实例的选择器
spec:
  selector:
    matchLabels:
      app: my-app               # 选择目标 Service
  namespaceSelector:
    matchNames:
    - default                   # 监控 default 命名空间
  endpoints:
  - port: metrics               # Service 的端口名
    path: /metrics              # 指标路径
    interval: 30s               # 采集间隔
    scrapeTimeout: 10s          # 采集超时
```

**PrometheusRule 告警规则示例**：
```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: app-alerts
  namespace: monitoring
spec:
  groups:
  - name: app.rules
    rules:
    # Pod 崩溃告警
    - alert: PodCrashLooping
      expr: rate(kube_pod_container_status_restarts_total[15m]) * 60 * 5 > 0
      for: 15m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} 正在崩溃循环"
        description: "容器 {{ $labels.container }} 在过去 15 分钟内重启了 {{ $value }} 次"

    # Pod CPU 使用率告警
    - alert: HighPodCPU
      expr: |
        sum(rate(container_cpu_usage_seconds_total{container!="", container!="POD"}[5m])) by (namespace, pod)
        / sum(kube_pod_container_resource_limits{resource="cpu"}) by (namespace, pod) > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} CPU 使用率超过 90%"

    # PVC 空间不足告警
    - alert: PVCAlmostFull
      expr: |
        (kubelet_volume_stats_used_bytes / kubelet_volume_stats_capacity_bytes) > 0.85
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "PVC {{ $labels.persistentvolumeclaim }} 使用率超过 85%"
```

**kube-prometheus-stack 快速部署**：
```bash
# 使用 Helm 安装 kube-prometheus-stack（包含 Prometheus、Grafana、Alertmanager、
# node-exporter、kube-state-metrics、Prometheus Operator）
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.storageClassName=local-path \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
  --set grafana.adminPassword=admin123
```

**关键组件说明**：
- **kube-state-metrics**：监听 K8s API Server，暴露集群状态指标（Deployment 副本数、Pod 状态、Node 条件等）。这些指标无法从 cAdvisor 或 node-exporter 获取。
- **node-exporter**：暴露节点级别的硬件和操作系统指标（CPU、内存、磁盘、网络、文件系统等）。
- **cAdvisor**：内置于 kubelet，暴露容器级别的资源使用指标（CPU、内存、文件系统、网络 IO 等）。

### 6.1.3 关键监控指标
- **节点级**：CPU、内存、磁盘、网络
- **Pod 级**：CPU/内存使用率、重启次数、OOM
- **应用级**：QPS、延迟、错误率（RED 方法）
- **K8s 组件级**：API Server 请求延迟、etcd 性能

> 应用层监控（SkyWalking/Zipkin、ELK）已在 `java/07-分布式与微服务.md` 中覆盖，本文档聚焦 K8s 平台层监控

**K8s 平台层关键 Prometheus 指标**：

| 指标 | 来源 | 说明 |
|------|------|------|
| `kube_pod_status_phase` | kube-state-metrics | Pod 状态（Pending/Running/Failed） |
| `kube_pod_container_status_restarts_total` | kube-state-metrics | Pod 重启次数 |
| `kube_node_status_condition` | kube-state-metrics | 节点状态（Ready/MemoryPressure/DiskPressure） |
| `kube_deployment_status_replicas` | kube-state-metrics | Deployment 副本数 |
| `kube_persistentvolumeclaim_status_phase` | kube-state-metrics | PVC 状态 |
| `container_cpu_usage_seconds_total` | cAdvisor | 容器 CPU 使用量 |
| `container_memory_working_set_bytes` | cAdvisor | 容器内存实际使用量（OOM 判定依据） |
| `node_cpu_seconds_total` | node-exporter | 节点 CPU 使用时间 |
| `node_memory_MemAvailable_bytes` | node-exporter | 节点可用内存 |
| `node_filesystem_avail_bytes` | node-exporter | 节点磁盘可用空间 |
| `etcd_server_has_leader` | etcd | etcd 是否有 Leader |
| `apiserver_request_duration_seconds` | API Server | API 请求延迟 |

## 6.2 K8s 日志体系

### 6.2.1 日志架构
```
Pod 容器日志 → /var/log/containers/
       ↓
    Filebeat / Fluentd / Promtail
       ↓
    Elasticsearch / Loki
       ↓
    Kibana / Grafana
```

### 6.2.2 日志方案对比
| 方案 | 优点 | 缺点 |
|------|------|------|
| EFK (Elastic) | 功能强大、全文搜索 | 资源消耗大 |
| PLG (Loki) | 轻量、与 Grafana 集成 | 不支持全文索引 |
| Fluent Bit | 轻量、高性能 | 插件较少 |

**PLG (Promtail + Loki + Grafana) 方案详解**（推荐 K8s 平台层日志）：

Loki 是 Grafana Labs 开发的日志聚合系统，与 Prometheus 的标签模型一致，特别适合 K8s 环境。

```
+----------+     +----------+     +----------+     +----------+
| Pod 容器  | →   | Promtail | →   |   Loki   | →   | Grafana  |
| stdout    |     | (采集)    |     | (存储)    |     | (查询)   |
+----------+     +----------+     +----------+     +----------+
```

**Loki 与 Elasticsearch 的核心区别**：
| 维度 | Loki | Elasticsearch |
|------|------|-------------|
| 索引方式 | 仅索引标签（Label），不索引日志内容 | 全文索引 |
| 存储成本 | 低（约 ES 的 1/5） | 高 |
| 查询方式 | LogQL（类似 PromQL） | Lucene 查询语法 |
| 全文搜索 | 不支持（或通过 grep 过滤） | 支持 |
| 适用场景 | K8s 平台日志、已有 Grafana 的环境 | 需要全文搜索、复杂日志分析 |

**Promtail DaemonSet 部署示例**：
```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: promtail
  template:
    metadata:
      labels:
        app: promtail
    spec:
      containers:
      - name: promtail
        image: grafana/promtail:2.9.6
        args:
        - -config.file=/etc/promtail/promtail.yaml
        volumeMounts:
        - name: config
          mountPath: /etc/promtail
        - name: containers
          mountPath: /var/lib/docker/containers
          readOnly: true
        - name: pods
          mountPath: /var/log/pods
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: promtail-config
      - name: containers
        hostPath:
          path: /var/lib/docker/containers
      - name: pods
        hostPath:
          path: /var/log/pods
```

**Promtail 配置**：
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
  namespace: monitoring
data:
  promtail.yaml: |
    server:
      http_listen_port: 3101
    positions:
      filename: /tmp/positions.yaml
    clients:
      - url: http://loki:3100/loki/api/v1/push
    scrape_configs:
    - job_name: kubernetes-pods
      kubernetes_sd_configs:
      - role: pod
      pipeline_stages:
      - docker: {}
      relabel_configs:
      - source_labels:
        - __meta_kubernetes_pod_label_app
        target_label: app
      - source_labels:
        - __meta_kubernetes_namespace
        target_label: namespace
      - source_labels:
        - __meta_kubernetes_pod_name
        target_label: pod
```

## 6.3 故障排查

### 6.3.1 Pod 状态排查
| Pod 状态 | 可能原因 | 排查命令 |
|---------|---------|---------|
| Pending | 资源不足、调度失败 | `kubectl describe pod` |
| CrashLoopBackOff | 应用崩溃、配置错误 | `kubectl logs --previous` |
| ImagePullBackOff | 镜像不存在/权限问题 | `kubectl describe pod` |
| OOMKilled | 内存超限 | `kubectl describe pod` |
| Evicted | 节点资源压力 | `kubectl describe node` |

### 6.3.2 常用排查命令

```bash
# ========== Pod 排查 ==========

# 查看 Pod 状态
kubectl get pods -o wide                    # 查看所有 Pod（含节点信息）
kubectl get pods -A                         # 查看所有命名空间的 Pod
kubectl get pods --sort-by='.status.startTime'  # 按启动时间排序
kubectl get pods --field-selector=status.phase=Failed  # 筛选失败 Pod
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.phase}{"\n"}{end}'

# 查看 Pod 详情（重点看 Events 部分）
kubectl describe pod <pod-name> -n <namespace>

# 查看容器日志
kubectl logs <pod-name> -c <container-name> -n <namespace>
kubectl logs <pod-name> --previous                    # 查看上一次崩溃的日志
kubectl logs <pod-name> -f --tail=100                 # 实时跟踪最近 100 行
kubectl logs <pod-name> --since=1h                    # 查看最近 1 小时的日志

# 进入容器调试
kubectl exec -it <pod-name> -c <container-name> -- /bin/sh
kubectl exec -it <pod-name> -- curl -s http://localhost:8080/healthz

# 查看 Pod 资源使用
kubectl top pod <pod-name> --containers

# ========== Service 排查 ==========

# 查看 Service 和 Endpoints
kubectl get svc -o wide
kubectl get endpoints <service-name>
kubectl describe svc <service-name>

# 测试 Service 连通性
kubectl run test-pod --image=busybox:1.36 --rm -it --restart=Never -- wget -qO- http://<service-name>:<port>

# ========== Node 排查 ==========

# 查看节点状态
kubectl get nodes -o wide
kubectl describe node <node-name>
kubectl top node

# 查看节点资源使用详情
kubectl describe node <node-name> | grep -A 5 "Allocated resources"

# ========== 事件排查 ==========

# 查看集群事件
kubectl get events --sort-by='.lastTimestamp'
kubectl get events -w                              # 实时跟踪事件
kubectl get events --field-selector type=Warning   # 只看警告事件
kubectl get events -n <namespace>

# ========== 使用 kubectl debug 调试（K8s 1.18+） ==========

# 在目标 Pod 所在节点启动一个调试容器（共享同一节点）
kubectl debug <pod-name> -it --image=busybox:1.36 --target=<container-name>

# 在节点上启动调试容器
kubectl debug node/<node-name> -it --image=nicolaka/netshoot

# 创建一个临时的调试 Pod（Ephemeral Container）
kubectl debug <pod-name> --image=nicolaka/netshoot --target=<container-name>

# ========== 集群级别排查 ==========

# 查看集群信息
kubectl cluster-info
kubectl get componentstatuses                      # 查看核心组件状态

# 查看 API Server 日志
kubectl logs -n kube-system -l component=kube-apiserver

# 查看 etcd 健康状态（需要访问 etcd Pod）
kubectl exec -n kube-system etcd-<node-name> -- etcdctl endpoint health

# 查看 kubelet 日志（需要 SSH 到节点）
journalctl -u kubelet -f --since=1h
```

### 6.3.3 节点问题排查

**节点 NotReady 排查流程**：

```
节点 NotReady
    ↓
1. 检查节点状态
   kubectl describe node <node-name>
   kubectl get nodes -o wide
    ↓
2. 检查 kubelet 状态
   systemctl status kubelet
   journalctl -u kubelet --since=1h
    ↓
3. 常见原因及处理
```

| 原因 | 现象 | 处理方法 |
|------|------|---------|
| **kubelet 故障** | 节点状态 NotReady | 重启 kubelet：`systemctl restart kubelet` |
| **节点资源压力** | `MemoryPressure`、`DiskPressure` | 清理磁盘空间、迁移 Pod、扩容节点 |
| **网络问题** | 节点与 API Server 通信失败 | 检查网络连通性、防火墙规则、CNI 插件 |
| **容器运行时故障** | containerd 异常 | 重启 containerd：`systemctl restart containerd` |
| **证书过期** | kubelet 无法连接 API Server | 检查并轮换证书：`kubeadm certs check-expiration` |

**节点资源压力处理**：

当节点出现 `MemoryPressure` 或 `DiskPressure` 时，Kubernetes 会自动驱逐（Evict）低优先级的 Pod：

```
节点内存不足
    ↓
Kubelet 检测到内存压力
    ↓
根据 QoS 类别和 Pod 优先级决定驱逐顺序：
  1. BestEffort Pod（无 requests/limits）最先被驱逐
  2. Burstable Pod（requests < limits）其次
  3. Guaranteed Pod（requests = limits）最后
  4. 系统 Pod（kube-system）受保护
    ↓
被驱逐的 Pod 会在其他节点上重建（如果由控制器管理）
```

**节点磁盘问题排查**：
```bash
# 检查磁盘使用
df -h
du -sh /var/lib/docker/*          # Docker 存储占用
du -sh /var/lib/containerd/*      # containerd 存储占用
du -sh /var/log/*                 # 日志占用

# 清理未使用的容器镜像
crictl rmi --prune                # containerd 环境
# 或
docker system prune -a            # Docker 环境

# 清理 kubelet 缓存
rm -rf /var/lib/kubelet/pods/*/volumes/kubernetes.io~empty-dir/*
```

## 6.4 K8s 升级策略

### 6.4.1 版本 skew 策略

Kubernetes 对各组件之间的版本偏差有严格限制，确保集群在升级过程中保持稳定：

| 组件 | 版本偏差规则 | 说明 |
|------|------------|------|
| **kube-apiserver** | 不超过 `kube-apiserver` 版本 | 集群中所有 API Server 实例版本必须一致 |
| **kubelet** | 不超过 `kube-apiserver` 2 个小版本 | kubelet 可以比 API Server 旧最多 2 个小版本 |
| **kube-controller-manager** | 不超过 `kube-apiserver` 1 个小版本 | 必须与 API Server 同版本或低 1 个小版本 |
| **kube-scheduler** | 不超过 `kube-apiserver` 1 个小版本 | 必须与 API Server 同版本或低 1 个小版本 |
| **kube-proxy** | 不超过 `kube-apiserver` 2 个小版本 | 与 kubelet 规则一致 |
| **etcd** | 不超过 `kube-apiserver` 1 个小版本 | 建议与 API Server 同版本 |
| **cloud-controller-manager** | 不超过 `kube-apiserver` 1 个小版本 | 与 kube-controller-manager 规则一致 |

**版本号格式**：`v1.31.x`，其中 `1` 是主版本，`31` 是小版本，`x` 是补丁版本。

**升级路径规则**：
- 只能从当前小版本升级到下一个相邻小版本（如 1.29 → 1.30 → 1.31）
- 不能跳过小版本升级（如不能直接从 1.29 升级到 1.31）
- 补丁版本（如 1.31.0 → 1.31.3）可以随时升级

### 6.4.2 升级步骤

以 kubeadm 集群从 1.30 升级到 1.31 为例：

**阶段一：升级前准备**
```bash
# 1. 备份集群数据（特别是 etcd）
etcdctl snapshot save /backup/etcd-snapshot-$(date +%Y%m%d).db

# 2. 检查当前版本
kubectl version
kubeadm version

# 3. 检查版本偏差
kubeadm upgrade plan

# 4. 验证集群健康状态
kubectl get nodes
kubectl get componentstatuses
kubectl get pods -A

# 5. 确认所有 Pod 都在运行
kubectl get pods --all-namespaces | grep -v Running

# 6. 检查已弃用的 API
kubectl get --raw /metrics | grep apiserver_request_total | grep deprecated
```

**阶段二：升级控制平面**
```bash
# 1. 升级第一个控制平面节点（执行升级的节点）
# 1.1 升级 kubeadm
apt-mark unhold kubeadm && \
apt-get update && apt-get install -y kubeadm=1.31.0-00 && \
apt-mark hold kubeadm

# 1.2 检查升级计划
kubeadm upgrade plan

# 1.3 执行升级（应用升级到所有控制平面组件）
kubeadm upgrade apply v1.31.0

# 1.4 升级 kubelet 和 kubectl
apt-mark unhold kubelet kubectl && \
apt-get install -y kubelet=1.31.0-00 kubectl=1.31.0-00 && \
apt-mark hold kubelet kubectl

# 1.5 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet

# 2. 升级其他控制平面节点
# 在其他控制平面节点上执行：
kubeadm upgrade node
apt-mark unhold kubelet kubectl && \
apt-get install -y kubelet=1.31.0-00 kubectl=1.31.0-00 && \
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet
```

**阶段三：升级工作节点**
```bash
# 逐个升级工作节点
# 1. 驱逐节点上的 Pod（让控制器在其他节点上重建）
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# 2. 在工作节点上执行升级
kubeadm upgrade node
apt-mark unhold kubelet kubectl && \
apt-get install -y kubelet=1.31.0-00 kubectl=1.31.0-00 && \
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet

# 3. 恢复节点调度
kubectl uncordon <node-name>
```

**阶段四：升级后验证**
```bash
# 1. 检查节点版本
kubectl get nodes

# 2. 检查集群组件状态
kubectl get componentstatuses

# 3. 检查所有 Pod 是否正常运行
kubectl get pods -A

# 4. 检查集群事件
kubectl get events --sort-by='.lastTimestamp'

# 5. 运行一致性检查
kubeadm upgrade plan  # 确认没有更多升级可用
```

### 6.4.3 回滚策略

Kubernetes **不支持自动回滚**集群版本。升级后如果出现问题，需要手动回退：

**控制平面回退**：
```bash
# 1. 降级 kubeadm
apt-mark unhold kubeadm && \
apt-get install -y kubeadm=1.30.x-00 && \
apt-mark hold kubeadm

# 2. 降级 kubelet 和 kubectl
apt-mark unhold kubelet kubectl && \
apt-get install -y kubelet=1.30.x-00 kubectl=1.30.x-00 && \
apt-mark hold kubelet kubectl

# 3. 使用 kubeadm 回退
kubeadm upgrade apply v1.30.x --force

# 4. 重启 kubelet
systemctl daemon-reload && systemctl restart kubelet
```

**工作节点回退**：
```bash
# 驱逐 → 降级 → 恢复
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data
apt-mark unhold kubelet kubectl && \
apt-get install -y kubelet=1.30.x-00 kubectl=1.30.x-00 && \
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet
kubectl uncordon <node-name>
```

**预防措施**：
- 升级前完整备份 etcd 数据
- 在测试环境先验证升级流程
- 使用 PDB 保护关键服务
- 逐个节点升级，每次只升级一个节点
- 准备回退方案和操作手册

## 6.5 集群安装与管理

### 6.5.1 kubeadm

kubeadm 是 Kubernetes 官方提供的集群安装工具，用于快速搭建符合最佳实践的 K8s 集群。它不负责机器管理（不创建虚拟机），只负责初始化和配置 K8s 组件。

**kubeadm 初始化集群**：
```bash
# 前置条件
# 1. 所有节点关闭 Swap
swapoff -a
# 2. 加载内核模块
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
modprobe overlay && modprobe br_netfilter

# 3. 配置内核参数
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system

# 4. 安装容器运行时（containerd 2.0）
apt-get install -y containerd.io
containerd config default | tee /etc/containerd/config.toml
# 确保 SystemdCgroup = true
systemctl restart containerd

# 5. 安装 kubeadm、kubelet、kubectl
apt-get update && apt-get install -y apt-transport-https curl
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | \
  gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
  https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /" | \
  tee /etc/apt/sources.list.d/kubernetes.list
apt-get update && apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# 初始化控制平面
kubeadm init \
  --apiserver-advertise-address=192.168.1.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --kubernetes-version=v1.31.0 \
  --cri-socket=unix:///run/containerd/containerd.sock

# 配置 kubectl
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 安装 CNI 网络插件（以 Calico 为例）
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/calico.yaml

# 工作节点加入集群（在 worker 节点上执行）
kubeadm join 192.168.1.10:6443 \
  --token <token> \
  --discovery-token-ca-cert-hash sha256:<hash>
```

**kubeadm 常用命令**：
```bash
kubeadm init                    # 初始化控制平面
kubeadm join                    # 工作节点加入集群
kubeadm reset                   # 重置节点（清除所有 K8s 配置）
kubeadm upgrade                 # 升级集群
kubeadm config                  # 管理 kubeadm 配置
kubeadm token create            # 创建新的加入令牌
kubeadm certs                   # 管理证书
kubeadm certs check-expiration  # 检查证书过期时间
```

### 6.5.2 kops / k3s / RKE

| 工具 | 适用场景 | 特点 |
|------|---------|------|
| **kops** | AWS/GCP 生产环境 | 自动创建和管理云资源（EC2、VPC、LB 等），支持多可用区部署 |
| **k3s** | 边缘计算、IoT、开发测试 | 轻量级 K8s 发行版，单二进制文件，内置 containerd、CoreDNS、Traefik |
| **RKE2 (Rancher)** | 企业级混合云 | 经过 CNCF 认证的 K8s 发行版，支持 Helm、自动证书轮换 |

**k3s 快速安装**：
```bash
# 一键安装（master 节点）
curl -sfL https://get.k3s.io | sh -s - --write-kubeconfig-mode 644

# 获取 Token
cat /var/lib/rancher/k3s/server/node-token

# 工作节点加入
curl -sfL https://get.k3s.io | K3S_URL=https://<master-ip>:6443 \
  K3S_TOKEN=<token> sh -
```

**RKE2 安装**：
```bash
# master 节点
curl -sfL https://get.rke2.io | sh
systemctl enable rke2-server && systemctl start rke2-server

# worker 节点
curl -sfL https://get.rke2.io | sh
systemctl enable rke2-agent && systemctl start rke2-agent
```

### 6.5.3 托管 K8s 服务
| 云厂商 | 服务名 | 特点 |
|--------|-------|------|
| AWS | EKS | 与 AWS 生态集成 |
| Azure | AKS | 企业级支持 |
| GCP | GKE | 自动升级、Autopilot |
| 阿里云 | ACK | 国内合规 |

**托管 K8s 的优势**：
- 控制平面由云厂商管理，无需维护 Master 节点
- 自动升级和补丁管理
- 与云厂商其他服务深度集成（IAM、LB、存储、监控等）
- SLA 保障（通常 99.95% 可用性）
- 按需付费，降低运维成本

**选择建议**：
- 生产环境推荐使用托管 K8s（降低运维复杂度）
- 自建集群适合对数据主权、网络隔离有特殊要求的场景
- 边缘/离线场景使用 k3s

## 6.6 资源管理

### 6.6.1 Resource Requests 和 Limits

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: resource-demo
spec:
  containers:
  - name: app
    image: nginx:1.27
    resources:
      requests:                    # 调度依据 + 最低资源保证
        cpu: "100m"                # 0.1 核 CPU（100 millicores）
        memory: "128Mi"            # 128 MiB 内存
      limits:                      # 资源上限（超过则被限制/终止）
        cpu: "500m"                # 0.5 核 CPU
        memory: "512Mi"            # 512 MiB 内存
```

**requests vs limits 的区别**：

| 维度 | requests | limits |
|------|---------|--------|
| **作用** | 调度依据 + 资源保证 | 资源上限 |
| **CPU 超出** | 无影响 | CPU 被限流（throttle），不会终止 |
| **内存超出** | 无影响 | 容器被 OOMKilled |
| **未设置** | 默认 0（无保证） | 默认等于 requests（不限制 CPU）或无限制（内存） |
| **影响调度** | 是（调度器根据 requests 分配节点） | 否 |

**CPU 单位换算**：
- `1` = 1 核 CPU（1000m）
- `500m` = 0.5 核
- `100m` = 0.1 核

**内存单位换算**：
- `1Gi` = 1024 MiB
- `1Mi` = 1024 KiB
- `1Ki` = 1024 Bytes

### 6.6.2 ResourceQuota

ResourceQuota 用于限制**命名空间级别**的总资源使用量，防止某个团队或项目占用过多集群资源。

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    # 计算资源配额
    requests.cpu: "20"             # 命名空间内所有 Pod 的 CPU requests 总和不超过 20 核
    requests.memory: 40Gi          # 内存 requests 总和不超过 40Gi
    limits.cpu: "40"               # CPU limits 总和不超过 40 核
    limits.memory: 80Gi            # 内存 limits 总和不超过 80Gi

    # 对象数量配额
    pods: "100"                    # 最多 100 个 Pod
    services: "20"                 # 最多 20 个 Service
    persistentvolumeclaims: "30"   # 最多 30 个 PVC
    configmaps: "50"               # 最多 50 个 ConfigMap
    secrets: "50"                  # 最多 50 个 Secret
    replicationcontrollers: "10"   # 最多 10 个 RC

    # 特殊存储类配额
    requests.storage: "500Gi"      # 存储请求总量不超过 500Gi
    <storage-class-name>.storageclass.storage.k8s.io/requests.storage: "200Gi"
```

**ResourceQuota 作用范围**：
- 限制命名空间内所有 Pod 的资源 requests/limits 总和
- 限制 K8s 对象的数量（Pod、Service、PVC 等）
- Pod 创建时必须设置 resources.requests，否则会被 ResourceQuota 拒绝
- 配合 LimitRange 使用，为未设置资源限制的 Pod 提供默认值

### 6.6.3 LimitRange

LimitRange 用于设置命名空间内 Pod/Container 的**默认资源限制**和**资源范围约束**。当 Pod 未指定 resources 时，LimitRange 自动注入默认值。

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: team-a
spec:
  limits:
  # 容器级别的限制
  - type: Container
    default:                      # 默认 limits（未设置时自动注入）
      cpu: "500m"
      memory: "512Mi"
    defaultRequest:                # 默认 requests（未设置时自动注入）
      cpu: "100m"
      memory: "128Mi"
    max:                          # 单个容器的最大值
      cpu: "4"
      memory: "4Gi"
    min:                          # 单个容器的最小值
      cpu: "50m"
      memory: "64Mi"
    maxLimitRequestRatio:          # limits/requests 的最大比例
      cpu: "4"                    # limits 最多是 requests 的 4 倍
      memory: "3"

  # Pod 级别的限制
  - type: Pod
    max:
      cpu: "8"
      memory: "16Gi"

  # PVC 级别的限制
  - type: PersistentVolumeClaim
    max:
      storage: "100Gi"
    min:
      storage: "1Gi"
```

**LimitRange 的自动注入行为**：
| Pod 未设置 | LimitRange 自动注入 |
|-----------|-------------------|
| 未设置 requests | 使用 `defaultRequest` |
| 未设置 limits | 使用 `default` |
| 都未设置 | 同时使用 `defaultRequest` 和 `default` |

### 6.6.4 QoS 类别
| QoS | 说明 | 保证 |
|-----|------|------|
| Guaranteed | requests = limits | 最高 |
| Burstable | requests < limits | 中等 |
| BestEffort | 无 requests/limits | 最低，最先被驱逐 |

**QoS 判定规则**：
- **Guaranteed**：Pod 中所有容器都设置了 CPU 和内存的 requests 和 limits，且 requests == limits
- **Burstable**：Pod 中至少一个容器设置了 CPU 或内存的 requests/limits，但不满足 Guaranteed 条件
- **BestEffort**：Pod 中所有容器都未设置任何 requests 和 limits

**QoS 与驱逐优先级**（节点资源压力时）：
```
驱逐顺序（从先到后）：
1. BestEffort Pod    → 最先被驱逐，无任何资源保证
2. Burstable Pod     → 其次，根据内存使用量排序，使用量越大越先被驱逐
3. Guaranteed Pod    → 最后，除非系统级内存压力（node级别的 OOM）
4. kube-system Pod   → 受 kubelet 保护，不会被驱逐
```

**QoS 与 CPU 限制**：
- Guaranteed 和 Burstable Pod 在 CPU 资源紧张时，会按照 requests 的比例分配 CPU 时间
- BestEffort Pod 只能使用空闲的 CPU 资源

## 6.7 面试常见问题

### Q1: K8s 中 Pod 一直 CrashLoopBackOff 怎么排查？

CrashLoopBackOff 表示容器反复崩溃退出，K8s 指数退避重启（延迟从 10s 递增到最大 5min）。

**系统化排查步骤**：

**第一步：查看容器日志**
```bash
kubectl logs <pod-name> --previous    # 查看上一次崩溃的日志（最重要）
kubectl logs <pod-name> -c <container-name> --previous
```
常见日志报错：
- `java.lang.OutOfMemoryError`：内存不足，增大 limits
- `Connection refused`：依赖服务未就绪，检查 Service 和 Endpoints
- `Configuration error`：配置文件错误，检查 ConfigMap/Secret

**第二步：查看 Pod 事件**
```bash
kubectl describe pod <pod-name>
```
关注 Events 部分，常见信息：
- `Back-off restarting failed container`：容器退出码非 0
- `Error: ImagePullBackOff`：镜像拉取失败（非 CrashLoopBackOff，但表现类似）

**第三步：检查退出码**
```bash
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[*].lastState.terminated}'
```
常见退出码：
| 退出码 | 含义 | 处理方法 |
|--------|------|---------|
| 0 | 正常退出 | 检查容器主进程是否正确运行（前台运行） |
| 1 | 应用错误 | 查看日志排查应用错误 |
| 137 | 被 SIGKILL 终止 | 通常为 OOMKilled，增大内存 limits |
| 139 | 段错误（SIGSEGV） | C/C++ 程序内存错误，检查代码 |
| 143 | 被 SIGTERM 终止 | 优雅关闭超时，检查 preStop 钩子 |

**第四步：进入容器调试**
```bash
kubectl debug <pod-name> -it --image=busybox:1.36 --target=<container-name>
```

**常见原因总结**：
1. **应用启动失败**：配置错误、依赖服务不可用、端口冲突
2. **OOMKilled**：内存 limits 设置过小，或应用存在内存泄漏
3. **健康检查失败**：livenessProbe 配置不当，应用启动慢但探测超时
4. **容器主进程退出**：Dockerfile 中 ENTRYPOINT/CMD 启动的前台进程退出
5. **临时性错误**：数据库连接超时等，可通过增加 restartPolicy: OnFailure 或配置 startupProbe 解决

### Q2: Prometheus 在 K8s 中如何监控自定义指标？

在 K8s 中监控自定义指标（如应用 QPS、业务指标等），有以下几种方式：

**方式一：ServiceMonitor 自动发现（推荐）**

1. 应用暴露 `/metrics` 端点（Prometheus 格式）
2. 创建 ServiceMonitor CRD 自动发现并采集

```yaml
# 应用 Service
apiVersion: v1
kind: Service
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  ports:
  - name: metrics
    port: 9090
    targetPort: 9090
  selector:
    app: my-app
---
# ServiceMonitor
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: my-app-monitor
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: metrics
    path: /metrics
    interval: 30s
```

**方式二：Prometheus Adapter（用于 HPA 自定义指标）**

如果需要基于自定义指标进行 HPA 伸缩，需要通过 Prometheus Adapter 将 Prometheus 指标暴露为 K8s Metrics API：

```
应用 → /metrics → Prometheus 采集 → Prometheus Adapter → K8s Metrics API → HPA
```

```yaml
# Prometheus Adapter 配置（values.yaml 片段）
prometheus:
  url: http://prometheus.monitoring.svc:9090
rules:
  - seriesQuery: 'http_requests_total{namespace!="",pod!=""}'
    resources:
      overrides:
        namespace:
          resource: namespace
        pod:
          resource: pod
    name:
      matches: "^(.*)"
      as: "http_requests_per_second"
    metricsQuery: 'sum(rate(<<.Series>>{<<.LabelMatchers>>}[2m])) by (<<.GroupBy>>)'
```

```yaml
# HPA 使用自定义指标
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
spec:
  metrics:
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

**方式三：PodMonitor（直接基于 Pod 标签）**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: my-app-pod-monitor
spec:
  selector:
    matchLabels:
      app: my-app
  namespaceSelector:
    matchNames:
    - default
  podMetricsEndpoints:
  - port: metrics
    path: /metrics
```

### Q3: EFK 和 PLG 日志方案怎么选？

| 维度 | EFK (Elasticsearch + Fluentd + Kibana) | PLG (Promtail + Loki + Grafana) |
|------|--------------------------------------|-------------------------------|
| **全文搜索** | 支持强大的全文索引和搜索 | 不支持全文索引，仅通过标签过滤 + grep |
| **资源消耗** | 高（ES 内存和磁盘占用大） | 低（Loki 仅索引标签，存储成本低约 5 倍） |
| **查询语法** | Lucene/KQL | LogQL（类似 PromQL，学习成本低） |
| **生态集成** | 成熟的日志分析生态 | 与 Grafana 深度集成，可与 Prometheus 告警联动 |
| **运维复杂度** | 高（ES 集群管理、分片、索引生命周期） | 低（Loki 单体部署，运维简单） |
| **适用规模** | 大规模、需要复杂日志分析 | 中小规模、K8s 原生环境 |

**选择建议**：
- **选 PLG 的场景**：已有 Grafana 监控栈、日志主要用于排查问题（按标签过滤即可）、资源有限、K8s 原生环境
- **选 EFK 的场景**：需要全文搜索、需要复杂的日志分析（聚合、统计）、合规要求（日志长期保存和审计）、大规模日志场景
- **混合方案**：PLG 用于 K8s 平台日志，EFK 用于应用业务日志

### Q4: 什么是 QoS？三种 QoS 的区别？

QoS（Quality of Service）是 Kubernetes 根据 Pod 的资源配置确定的**服务质量等级**，决定了节点资源不足时 Pod 的驱逐优先级和 CPU 分配策略。

**三种 QoS 类别**：

| QoS | 判定条件 | 资源保证 | 驱逐优先级 | CPU 分配 |
|-----|---------|---------|-----------|---------|
| **Guaranteed** | 所有容器设置 requests == limits（CPU 和内存都设置） | 最高，资源完全保证 | 最低（最后被驱逐） | 严格按 limits 限制 |
| **Burstable** | 至少一个容器设置了 requests 或 limits，但不满足 Guaranteed | 中等，保证 requests 的资源 | 中等（按内存使用量排序） | 按 requests 比例分配空闲 CPU |
| **BestEffort** | 所有容器都未设置 requests 和 limits | 最低，无任何保证 | 最高（最先被驱逐） | 仅使用空闲 CPU |

**驱逐策略详解**：
```
节点内存压力触发驱逐时：
  1. 首先驱逐 BestEffort Pod
  2. 其次驱逐 Burstable Pod 中内存使用量超过 requests 的 Pod
     （超出 requests 越多，越先被驱逐）
  3. Burstable Pod 中内存使用量未超过 requests 的 Pod 不会被驱逐
  4. Guaranteed Pod 不会被驱逐（除非节点面临完全 OOM）
```

**最佳实践**：
- 生产环境的关键服务应设置为 Guaranteed QoS（requests == limits）
- 普通服务设置为 Burstable QoS（设置合理的 requests 和 limits）
- 避免使用 BestEffort QoS（无法保证资源，最先被驱逐）
- 配合 LimitRange 为未设置资源的 Pod 注入默认值

### Q5: K8s 集群升级的流程和注意事项？

**升级流程**：
1. **准备阶段**：备份 etcd、检查版本偏差、在测试环境验证、通知相关团队
2. **升级控制平面**：逐个升级 API Server → Controller Manager → Scheduler
3. **升级工作节点**：逐个 `kubectl drain` → 升级 kubelet → `kubectl uncordon`
4. **验证阶段**：检查节点版本、Pod 状态、应用功能

**关键注意事项**：
1. **版本偏差规则**：kubelet 不能比 API Server 旧超过 2 个小版本，不能跳版本升级
2. **逐个节点升级**：每次只升级一个节点，确保服务可用性
3. **PDB 保护**：关键服务设置 PodDisruptionBudget，防止滚动升级时服务不可用
4. **API 弃用检查**：升级前检查是否使用了即将弃用的 API（`kubectl get --raw /metrics | grep deprecated`）
5. **etcd 备份**：升级前必须备份 etcd 数据
6. **网络插件兼容性**：确认 CNI 插件支持目标 K8s 版本
7. **回退方案**：准备回退操作手册，升级后发现问题可快速回退

### Q6: 节点资源不足时，K8s 会如何处理 Pod？

当节点资源不足（内存压力、磁盘压力）时，Kubelet 会触发**驱逐（Eviction）**机制：

**驱逐触发条件**：
| 条件 | 信号 | 默认阈值 |
|------|------|---------|
| `memory.available` | 节点可用内存 | < 100MiB |
| `nodefs.available` | 节点文件系统可用空间 | < 10% |
| `nodefs.inodesFree` | 节点文件系统可用 inode | < 5% |
| `imagefs.available` | 镜像存储可用空间 | < 15% |

**驱逐决策流程**：
```
节点资源不足
    ↓
Kubelet 检测到压力信号
    ↓
按照 QoS 类别和优先级排序：
  1. Pod 优先级（PriorityClass）低的先驱逐
  2. 同优先级内，QoS 等级低的先驱逐
     BestEffort > Burstable > Guaranteed
  3. Burstable Pod 中，内存使用量超出 requests 越多越先驱逐
    ↓
驱逐选中的 Pod
    ↓
Pod 状态变为 Evicted（终止，不会在其他节点重建）
```

**注意**：
- 被驱逐的 Pod 状态变为 `Evicted`（`status.reason = Evicted`），**不会自动在其他节点重建**
- 如果 Pod 由 Deployment/StatefulSet 等控制器管理，控制器会在其他节点上创建新的 Pod 替代
- 驱逐是节点级别的操作，由 kubelet 执行，与 API Server 发起的删除不同
- 可以通过 `systemd-reserved`、`kube-reserved`、`system-reserved` 为系统组件预留资源，减少驱逐发生
