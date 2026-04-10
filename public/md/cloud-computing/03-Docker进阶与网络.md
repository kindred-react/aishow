# 03 Docker 进阶与网络

> Docker 基础命令/镜像/容器/Compose 已在 `14-Docker与Linux指南.md` 中覆盖，本文档聚焦**进阶**内容

## 3.1 Docker 架构深入

### 3.1.1 Docker Daemon 架构

Docker 的运行时架构在 Docker 1.11 之后发生了重大变化，从单体架构演进为模块化架构。当前 Docker（27+）的架构如下：

```
+----------------------------------------------------------+
|                    Docker CLI (docker)                     |
|              通过 REST API 与 Docker Engine 通信            |
+----------------------------------------------------------+
                            |
                            | Unix Socket (/var/run/docker.sock)
                            v
+----------------------------------------------------------+
|                  dockerd (Docker Daemon)                   |
|  负责：镜像管理、容器管理、网络管理、卷管理、API 服务        |
|  插件系统：授权插件、卷插件、网络插件、日志插件              |
+----------------------------------------------------------+
                            |
                            | Container Runtime Interface (CRI)
                            v
+----------------------------------------------------------+
|                    containerd                              |
|  高级容器运行时，负责：                                      |
|  - 容器生命周期管理（创建、启动、停止、销毁）                 |
|  - 镜像管理（拉取、解包、存储）                              |
|  - 调用底层运行时执行容器                                    |
|  - 容器快照管理                                             |
+----------------------------------------------------------+
                            |
                            | containerd shim
                            v
+----------------------------------------------------------+
|                      runc                                  |
|  低级容器运行时（OCI 参考实现）                               |
|  负责：根据 OCI 规范创建和运行容器                            |
|  - 创建 Namespace（隔离）                                   |
|  - 设置 Cgroup（资源限制）                                  |
|  - 设置 Rootfs（联合挂载）                                  |
|  - 执行容器进程                                             |
+----------------------------------------------------------+
                            |
                            v
+----------------------------------------------------------+
|                   Linux Kernel                             |
|  Namespaces | Cgroups | seccomp | AppArmor | netfilter     |
+----------------------------------------------------------+
```

**各组件职责**：
- **dockerd**：Docker 的守护进程，是用户与容器交互的入口。接收 CLI/API 请求，负责容器编排、镜像构建、网络和卷管理等高级功能。Docker 27+ 中 dockerd 仍然存在，但越来越多的功能委托给 containerd。
- **containerd**（当前稳定版 2.0+）：行业标准的容器运行时，最初从 Docker 中拆分出来成为独立项目（CNCF 毕业项目）。负责镜像传输和存储、容器执行和监控。containerd 是 Kubernetes 默认的容器运行时。
- **containerd-shim**：每个容器对应一个 shim 进程，负责与 containerd 通信并管理容器的生命周期。即使 containerd 重启，shim 也能保持容器运行。
- **runc**：OCI（Open Container Initiative）参考实现的低级运行时，实际执行容器创建的命令行工具。它调用 Linux 内核的 Namespace、Cgroup 等特性来创建隔离的容器环境。

### 3.1.2 OCI 标准（Open Container Initiative）

OCI 是由 Linux 基金会主导的开放治理组织，旨在建立容器格式和运行时的行业标准，避免容器生态碎片化。

**三大核心规范**：

1. **OCI Runtime Spec（运行时规范）**：定义了如何从文件系统 bundle 运行一个容器。 bundle 包含一个 `config.json`（容器配置）和一个 rootfs（容器根文件系统）。runc 就是这个规范的参考实现。规范涵盖：
   - Linux Namespace 的创建（pid、net、ipc、mnt、uts、user、cgroup）
   - Linux Cgroup 的资源限制设置
   - Linux seccomp 安全过滤
   - 容器生命周期（create、start、delete）

2. **OCI Image Spec（镜像规范）**：定义了容器镜像的格式。镜像由一系列层（layer）和清单（manifest）组成：
   - **层（Layer）**：每个层是一个 tar+gzip 归档文件，包含文件系统的变更
   - **Manifest**：描述镜像的层列表、配置和注解
   - **Image Index**：支持多架构镜像（如同时支持 amd64 和 arm64）
   - **镜像配置（config）**：包含容器的默认命令、环境变量、端口等元数据

3. **OCI Distribution Spec（分发规范）**：定义了容器镜像仓库（Registry）的 API 标准，包括：
   - 镜像的推送（push）和拉取（pull）流程
   - 镜像的标签（tag）和摘要（digest）管理
   - 认证和授权机制（Bearer Token）
   - Registry 的 V2 API（`/v2/<name>/manifests/<reference>`）

### 3.1.3 Containerd vs Docker Engine

| 维度 | Docker Engine | containerd |
|------|--------------|------------|
| 定位 | 完整的容器平台 | 行业标准容器运行时 |
| 功能范围 | 镜像构建、容器管理、网络、卷、Swarm | 容器生命周期、镜像管理 |
| 镜像构建 | 内置 `docker build` | 需配合 BuildKit（`nerdctl build`） |
| Docker Compose | 原生支持 | 需使用 nerdctl compose |
| API | Docker REST API | containerd gRPC API + CRI |
| Kubernetes 兼容 | 需 dockershim（已移除） | 原生 CRI 支持 |
| 资源占用 | 较重（dockerd + containerd + runc） | 较轻（containerd + runc） |
| 社区 | Docker Inc. 主导 | CNCF 毕业项目 |

**Kubernetes 与 Docker 的关系变迁**：
- Kubernetes 1.20 之前：通过 dockershim 组件与 Docker Engine 通信
- Kubernetes 1.20：宣布弃用 dockershim，发出 deprecation 警告
- Kubernetes 1.24（2022 年 5 月）：**正式移除 dockershim**，不再内置对 Docker Engine 的支持
- **移除原因**：(1) Docker Engine 功能过于庞大，K8s 只需要运行时功能；(2) dockershim 维护负担重，代码质量差；(3) OCI 标准的成熟使得直接使用 containerd/CRI-O 成为更好的选择
- **影响**：`docker build` 构建的镜像仍然可以在 K8s 中运行（镜像格式兼容），只是不再通过 Docker Engine 来拉取和管理容器
- **替代方案**：containerd（推荐，K8s 默认）、CRI-O（Red Hat 主导）、Mirantis Container Runtime（原 Docker EE）

## 3.2 Docker 网络深入

### 3.2.1 网络模式详解
| 模式 | 说明 | 适用场景 |
|------|------|---------|
| bridge | 默认模式，通过 veth pair 连接 | 单机容器通信 |
| host | 共享宿主机网络 | 高性能需求 |
| none | 无网络 | 安全隔离 |
| overlay | 跨主机网络 | Docker Swarm / K8s |
| macvlan | 容器直接获取物理网络 IP | 需要容器像物理机一样 |

### 3.2.2 Bridge 网络原理

```
              +------------------+
              |   docker0 桥     |
              |  172.17.0.1/16   |
              +--------+---------+
                       |
            +----------+----------+
            |                     |
     +------+------+       +-----+-----+
     | veth-xxx1a  |       | veth-xxx2b |
     +------+------+       +-----+-----+
            |                     |
     +------+------+       +-----+-----+
     | Container A  |       | Container B |
     | 172.17.0.2   |       | 172.17.0.3  |
     +--------------+       +--------------+
```

**Bridge 网络的完整数据流**：

1. **veth pair（虚拟以太网对）**：每个容器启动时，Docker 创建一对虚拟网卡（veth pair），一端插入容器的 Network Namespace（如 `eth0`），另一端插入宿主机的 `docker0` 网桥。veth pair 类似一根"虚拟网线"，一端发出的数据包会出现在另一端。

2. **iptables 规则与 NAT 原理**：
   - **容器间通信**：同一 bridge 网络的容器通过 docker0 网桥直接通信（二层转发），无需经过 NAT。
   - **容器访问外网**：
     ```
     容器 (172.17.0.2) → veth pair → docker0 → 宿主机路由
     → iptables MASQUERADE（SNAT，将源 IP 改为宿主机 IP）
     → 物理网卡 → 外网
     ```
     Docker 在宿主机的 iptables 的 `nat` 表的 `POSTROUTING` 链中添加 MASQUERADE 规则，将容器的私有 IP 地址转换为宿主机的公网 IP 地址。
   - **外部访问容器（端口映射）**：
     ```
     外部请求 → 宿主机物理网卡 (端口 8080)
     → iptables DNAT（将目标端口映射到容器 IP:端口）
     → docker0 → veth pair → 容器 (172.17.0.2:80)
     ```
     Docker 在 `nat` 表的 `PREROUTING` 链中添加 DNAT 规则，实现端口映射。

3. **关键 iptables 规则**（可通过 `iptables -t nat -L -n` 查看）：
   ```bash
   # 查看 Docker 自动创建的 NAT 规则
   sudo iptables -t nat -L DOCKER -n
   # 输出示例：
   # DNAT  tcp  --  0.0.0.0/0  0.0.0.0/0  tcp dpt:8080 to:172.17.0.2:80

   sudo iptables -t nat -L POSTROUTING -n
   # MASQUERADE  all  --  172.17.0.0/16  0.0.0.0/0
   ```

4. **DNS 解析**：Docker 内置 DNS 服务器（127.0.0.11），容器可以通过容器名互相解析。自定义 bridge 网络支持容器名自动解析，默认 bridge 网络不支持（需使用 `--link`，已不推荐）。

### 3.2.3 Overlay 网络原理

Overlay 网络用于实现跨主机的容器通信，是 Docker Swarm 和 Kubernetes 的核心网络技术。

**VXLAN 封装原理**：

```
主机 A (192.168.1.10)                    主机 B (192.168.1.20)
+---------------------------+           +---------------------------+
| Container A               |           | Container B               |
| 10.0.0.2                  |           | 10.0.0.3                  |
|     |                     |           |     |                     |
|  veth-xxx  →  overlay0    |           |  veth-yyy  →  overlay0    |
|           (VXLAN 接口)     |           |           (VXLAN 接口)     |
+---------------------------+           +---------------------------+
           |                                         |
           |         VXLAN 封装的数据包                |
           |  +-----------------------------------+  |
           +→| 外层 IP: 192.168.1.10 → 192.168.1.20|→+
             | 外层 UDP: 端口 4789                   |
             | 内层 IP: 10.0.0.2 → 10.0.0.3         |
             | 内层 MAC: Container A → Container B   |
             +-----------------------------------+
```

**数据封装过程**：
1. Container A 发送数据包到 Container B（目标 IP: 10.0.0.3）
2. 数据包到达主机 A 的 overlay0 VXLAN 接口
3. VXLAN 模块将原始以太帧封装在 UDP 报文中：
   - **外层头**：源 IP 为主机 A 的物理 IP，目标 IP 为主机 B 的物理 IP，UDP 端口 4789
   - **VXLAN 头**：包含 VNI（VXLAN Network Identifier，24 位，支持约 1600 万个网络隔离）
   - **内层帧**：原始的容器以太帧（源 MAC: Container A，目标 MAC: Container B）
4. 封装后的数据包通过物理网络传输到主机 B
5. 主机 B 的 VXLAN 模块解封装，取出内层帧，转发给 Container B

**控制平面（Gossip 协议）**：
- Docker Overlay 网络使用基于 Serf 的 Gossip 协议作为控制平面
- 集群中的每个节点都运行一个 Gossip agent，通过 UDP 端口 7946 通信
- Gossip 协议负责：
  - 节点发现：自动发现集群中的新节点和离开的节点
  - 状态同步：同步各节点上的容器网络信息（MAC 地址、IP 分配、VTEP 信息）
  - 故障检测：检测节点故障并更新网络状态
- VXLAN 数据转发使用 UDP 端口 4789

### 3.2.4 自定义网络配置

```bash
# ===== 创建自定义 Bridge 网络 =====

# 创建自定义 bridge 网络（推荐用于单机多容器通信）
docker network create --driver bridge --subnet 192.168.100.0/24 --gateway 192.168.100.1 my-net

# 指定 IP 范围（用于排除部分 IP）
docker network create --driver bridge \
  --subnet 192.168.100.0/24 \
  --ip-range 192.168.100.128/25 \
  --gateway 192.168.100.1 \
  my-net-restricted

# 创建网络时添加内部 DNS
docker network create --driver bridge --internal --subnet 10.10.0.0/24 internal-net

# ===== 创建 Overlay 网络（Swarm 模式） =====

# 初始化 Swarm 集群（如果尚未初始化）
docker swarm init --advertise-addr <本机IP>

# 创建可附加的 Overlay 网络（允许独立容器使用，不仅限于 Swarm 服务）
docker network create --driver overlay --attachable --subnet 10.20.0.0/24 my-overlay

# 创建加密的 Overlay 网络（节点间通信使用 IPSec 加密）
docker network create --driver overlay --opt encrypted --subnet 10.30.0.0/24 my-secure-overlay

# ===== 创建 Macvlan 网络 =====

# Macvlan 网络让容器直接获取物理网络的 IP 地址
# 注意：宿主机物理网卡不能与 Macvlan 容器直接通信（需要额外创建 macvlan 接口）

# 创建 macvlan 网络（bridge 模式，容器之间可以互相通信）
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 macvlan-net

# 创建 macvlan 网络（802.1q trunk 模式，基于 VLAN tag）
docker network create -d macvlan \
  --subnet=192.168.10.0/24 \
  --gateway=192.168.10.1 \
  -o parent=eth0.100 macvlan-vlan100

# ===== 网络管理操作 =====

# 查看所有网络
docker network ls

# 查看网络详细信息
docker network inspect my-net

# 将运行中的容器连接到网络
docker network connect my-net my-container

# 将容器从网络中断开
docker network disconnect my-net my-container

# 运行容器时指定网络和 IP
docker run -d --name web --network my-net --ip 192.168.100.10 nginx:alpine

# 删除网络（需先断开所有容器）
docker network rm my-net

# 清理未使用的网络
docker network prune
```

## 3.3 Docker 存储驱动

### 3.3.1 存储驱动类型
| 驱动 | 文件系统 | 特点 |
|------|---------|------|
| overlay2 | ext4/xfs | Docker 默认推荐 |
| fuse-overlay2 | 任意 | 无内核模块要求 |
| btrfs | btrfs | 支持快照 |
| zfs | zfs | 数据完整性保障 |
| device mapper | - | 旧版默认 |

### 3.3.2 Overlay2 分层原理

Overlay2 是 Docker 的默认存储驱动，基于 Linux 内核的 OverlayFS 文件系统实现。它利用**联合挂载（Union Mount）**技术将多个目录叠加在一起，形成一个统一的文件系统视图。

**核心目录结构**：

```
/var/lib/docker/overlay2/<container-id>/
├── lower/          # 只读层（镜像的各层）
│   ├── l/          # 符号链接，指向实际存储的 diff 目录
│   │   ├── ABCDEF... → ../../<layer-hash>/diff/
│   │   ├── GHIJKL... → ../../<layer-hash>/diff/
│   │   └── ...
├── upper/          # 可写层（容器的读写层）
│   └── diff/       # 容器运行时的所有文件修改都写入此目录
├── merged/         # 合并视图（容器看到的完整文件系统）
├── work/           # OverlayFS 内部工作目录（required by kernel）
```

**工作原理**：

1. **lowerdir（只读层）**：由镜像的多个层组成，每层都是只读的。层之间通过硬链接共享相同文件，节省磁盘空间。这些层对所有使用该镜像的容器共享。

2. **upperdir（可写层）**：每个容器独立拥有一个可写层。容器运行时对文件系统的所有修改（创建、修改、删除文件）都记录在此层。
   - **修改文件**：Copy-on-Write（写时复制）。首次修改某个文件时，先将该文件从 lowerdir 复制到 upperdir，然后在 upperdir 中修改。
   - **删除文件**：在 upperdir 中创建一个 "whiteout" 文件（字符设备，主/次设备号为 0/0），遮盖 lowerdir 中的同名文件。
   - **创建文件**：直接在 upperdir 中创建。

3. **merged（合并层）**：通过 OverlayFS 联合挂载将 lowerdir 和 upperdir 合并，容器进程看到的是统一的文件系统。查找文件时，优先从 upperdir 查找，找不到再到 lowerdir 查找。

4. **workdir**：OverlayFS 内部使用的工作目录，用于准备文件操作。

**联合挂载命令**（等价于 Docker 内部操作）：
```bash
# Docker 内部执行的 mount 命令（简化版）
mount -t overlay overlay \
  -o lowerdir=/var/lib/docker/overlay2/l/ABCDEF:/var/lib/docker/overlay2/l/GHIJKL, \
    upperdir=/var/lib/docker/overlay2/<container-id>/upper, \
    workdir=/var/lib/docker/overlay2/<container-id>/work \
  /var/lib/docker/overlay2/<container-id>/merged
```

### 3.3.3 Volume vs Bind Mount vs tmpfs
| 类型 | 说明 | 数据持久化 | 性能 |
|------|------|-----------|------|
| Volume | Docker 管理 | 持久化 | 高 |
| Bind Mount | 指定宿主机路径 | 持久化 | 最高 |
| tmpfs | 内存文件系统 | 不持久化 | 最高 |

## 3.4 Docker 安全加固

### 3.4.1 容器安全最佳实践

除了基础的安全措施（如非 root 用户运行、最小化镜像），进阶安全加固包括以下方面：

**1. Seccomp（Secure Computing Mode）配置**

Seccomp 是 Linux 内核的安全机制，用于限制进程可以调用的系统调用（syscall）。Docker 默认使用一个包含约 40+ 个危险 syscall 的黑名单（如 `mount`、`reboot`、`keyctl` 等）。

```bash
# 使用自定义 seccomp 配置文件运行容器
docker run --rm -it \
  --security-opt seccomp=/path/to/my-seccomp-profile.json \
  nginx:alpine

# 查看容器使用的 seccomp 配置
docker inspect --format='{{.HostConfig.SecurityOpt}}' <container-id>

# 完全禁用 seccomp（不推荐，仅用于调试）
docker run --rm -it --security-opt seccomp=unconfined nginx:alpine
```

**2. AppArmor / SELinux 强制访问控制**

- **AppArmor**（Ubuntu/Debian 默认）：通过配置文件限制程序可以访问的文件、网络端口、能力等。Docker 默认使用 `docker-default` AppArmor 配置。
  ```bash
  # 使用自定义 AppArmor 配置
  docker run --rm -it \
    --security-opt apparmor=my-custom-profile \
    nginx:alpine

  # 禁用 AppArmor（不推荐）
  docker run --rm -it --security-opt apparmor=unconfined nginx:alpine
  ```
- **SELinux**（RHEL/CentOS 默认）：通过安全上下文（security context）实现更细粒度的强制访问控制（MAC）。

**3. Rootless Docker**

Rootless Docker 允许非 root 用户运行 Docker 守护进程，容器进程也以非 root 身份运行。即使容器被攻破，攻击者也只能获得普通用户权限，无法访问宿主机的 root 资源。

```bash
# 安装 rootless docker（需要 uidmap 包）
dockerd-rootless-setuptool.sh install

# 启动 rootless docker
systemctl --user start docker

# 使用 rootless docker
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/docker.sock
docker run --rm hello-world
```

**4. 镜像签名验证**

- **Cosign**（Sigstore 项目，推荐）：基于密钥less的镜像签名方案，使用 Fulcio 证书和 Rekor 透明日志。
  ```bash
  # 签名镜像
  cosign sign --key cosign.key myregistry/myapp:v1.0

  # 验证镜像签名
  cosign verify --key cosign.pub myregistry/myapp:v1.0

  # 使用 Keyless 验证（基于 OIDC）
  cosign verify --certificate-identity=team@company.com \
    --certificate-oidc-issuer=https://accounts.google.com \
    myregistry/myapp:v1.0
  ```
- **Notary**（Docker Content Trust）：Docker 原生的镜像签名方案。
  ```bash
  # 启用 Docker Content Trust
  export DOCKER_CONTENT_TRUST=1

  # 推送和拉取时会自动验证签名
  docker push myregistry/myapp:v1.0
  docker pull myregistry/myapp:v1.0
  ```

### 3.4.2 容器逃逸防护

容器逃逸是指攻击者从一个容器内部突破隔离机制，获取宿主机（或其他容器）的权限。这是容器安全最严重的威胁之一。

**常见逃逸方式及防护措施**：

| 逃逸方式 | 原理 | 防护措施 |
|---------|------|---------|
| **特权容器逃逸** | `--privileged` 授予容器所有能力并挂载所有设备，攻击者可直接访问宿主机磁盘设备 | 禁止使用 `--privileged`；按需授予最小能力（`--cap-add`） |
| **挂载 Docker Socket** | 将 `/var/run/docker.sock` 挂载到容器内，攻击者可通过 Docker API 创建特权容器 | 禁止挂载 docker.sock；使用 Rootless Docker |
| **内核漏洞逃逸** | 利用 Linux 内核漏洞（如 CVE-2022-0185、CVE-2024-1086）从容器内提权到宿主机 | 及时更新宿主机内核；启用 Seccomp 限制危险 syscall |
| **Cgroup 逃逸（CVE-2020-15257）** | 通过宿主机暴露的 cgroup v1 文件系统实现逃逸 | 使用 cgroup v2；限制容器挂载路径 |
| **共享 Namespace 逃逸** | `--pid=host`、`--network=host` 等共享宿主机 Namespace | 按需使用 Namespace 隔离，避免不必要的共享 |
| **AppArmor/Seccomp 绕过** | 利用配置不当的安全策略绕过限制 | 使用严格的安全配置；定期审计安全策略 |

**安全加固清单**：
```bash
# 1. 禁止特权模式，按需授予最小能力
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx:alpine

# 2. 启用只读文件系统（配合 tmpfs 处理需要写入的目录）
docker run --read-only --tmpfs /tmp --tmpfs /run nginx:alpine

# 3. 限制资源（防 DoS）
docker run --memory=512m --cpus=1 --pids-limit=100 nginx:alpine

# 4. 禁止挂载敏感路径
# 不要挂载: /var/run/docker.sock, /, /etc, /proc, /sys

# 5. 使用非 root 用户
docker run --user 1000:1000 nginx:alpine

# 6. 启用 seccomp 和 AppArmor
docker run --security-opt seccomp=default.json \
  --security-opt apparmor=docker-default nginx:alpine

# 7. 设置 no-new-privileges（防止 setuid 提权）
docker run --security-opt no-new-privileges:true nginx:alpine
```

### 3.4.3 镜像安全扫描

```bash
# ===== Trivy（Aqua Security 开源，推荐） =====

# 安装 Trivy
# Ubuntu/Debian: sudo apt-get install trivy
# 或下载二进制: https://github.com/aquasecurity/trivy/releases

# 扫描镜像漏洞
trivy image myapp:latest

# 扫描并输出为表格格式（默认）
trivy image --format table myapp:latest

# 扫描并输出为 JSON（适合 CI/CD 集成）
trivy image --format json --output report.json myapp:latest

# 只扫描严重和高危漏洞
trivy image --severity HIGH,CRITICAL myapp:latest

# 扫描镜像配置问题（如使用 root 用户、没有 HEALTHCHECK）
trivy image --config . trivy-config.yaml myapp:latest

# 扫描文件系统（如代码仓库）
trivy fs /path/to/project

# ===== Docker Scout（Docker 官方） =====

# 查看 CVE 漏洞摘要
docker scout cves myapp:latest

# 查看镜像详细分析（大小、层级、漏洞）
docker scout analyze myapp:latest

# 对比两个镜像的差异
docker scout compare myapp:v1.0 myapp:v2.0

# 快速查看镜像摘要
docker scout quickview myapp:latest
```

## 3.5 Docker 镜像仓库

### 3.5.1 私有仓库搭建

**方案一：Docker Registry（轻量级，适合小团队）**

```bash
# 1. 启动官方 Registry（无认证，仅适合内网测试）
docker run -d -p 5000:5000 --name registry registry:2

# 2. 推送镜像到私有仓库
docker tag myapp:latest localhost:5000/myapp:latest
docker push localhost:5000/myapp:latest

# 3. 拉取镜像
docker pull localhost:5000/myapp:latest

# ===== 带 TLS 和基本认证的 Registry =====

# 1. 生成自签名证书（生产环境建议使用 Let's Encrypt 或企业 CA）
mkdir -p /data/registry/certs
openssl req -newkey rsa:4096 -nodes -sha256 \
  -keyout /data/registry/certs/domain.key \
  -x509 -days 365 \
  -out /data/registry/certs/domain.crt \
  -subj "/CN=registry.example.com"

# 2. 创建认证文件（htpasswd）
mkdir -p /data/registry/auth
docker run --rm httpd:alpine htpasswd -Bbn admin securepassword > /data/registry/auth/htpasswd

# 3. 启动带认证和 TLS 的 Registry
docker run -d -p 443:443 --name registry \
  -v /data/registry/certs:/certs \
  -v /data/registry/auth:/auth \
  -v /data/registry/data:/var/lib/registry \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/domain.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/domain.key \
  -e REGISTRY_AUTH=htpasswd \
  -e REGISTRY_AUTH_HTPASSWD_REALM="Registry Realm" \
  -e REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd \
  registry:2

# 4. 登录私有仓库
docker login registry.example.com
```

**方案二：Harbor（企业级，推荐生产使用）**

Harbor 是 VMware（现属 Broadcom）开源的企业级 Docker Registry，提供镜像管理、安全扫描、RBAC 权限控制等企业功能。

```bash
# 使用 Docker Compose 快速部署 Harbor
# 1. 下载 Harbor 安装包
wget https://github.com/goharbor/harbor/releases/download/v2.12.0/harbor-offline-installer-v2.12.0.tgz
tar xvf harbor-offline-installer-v2.12.0.tgz
cd harbor

# 2. 修改配置
cp harbor.yml.tmpl harbor.yml
# 编辑 harbor.yml，设置 hostname、密码、https 证书等

# 3. 安装并启动
./install.sh --with-trivy  # 安装并集成 Trivy 漏洞扫描

# 4. 访问 Web 管理界面
# https://registry.example.com (admin / Harbor12345)

# Harbor 核心功能：
# - 多项目（Project）管理，支持 RBAC
# - 镜像漏洞扫描（集成 Trivy）
# - 镜像签名和验证（Notary）
# - 镜像复制（跨 Harbor 实例同步）
# - 垃圾回收（GC）
# - Helm Chart 仓库
```

### 3.5.2 镜像分发优化

**1. Registry Mirror（镜像加速）**

在国内访问 Docker Hub 较慢，可配置镜像加速器（Registry Mirror）：

```bash
# 配置 Docker daemon 使用镜像加速
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://registry.docker-cn.com"
  ]
}
EOF

# 重启 Docker
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证配置
docker info | grep -A 5 "Registry Mirrors"
```

**2. 镜像代理（Pull-through Cache）**

搭建本地 Registry 作为 Docker Hub 的缓存代理，首次拉取时从 Docker Hub 获取并缓存，后续请求直接从本地缓存返回：

```bash
# 配置 Registry 作为代理缓存
docker run -d -p 5000:5000 --name registry-cache \
  -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io \
  -v /data/registry-cache:/var/lib/registry \
  registry:2

# 使用时将 Docker Hub 的镜像地址替换为本地代理
docker pull localhost:5000/library/nginx:alpine
# 首次从 Docker Hub 拉取并缓存，后续直接从缓存返回
```

**3. 镜像分层优化**

- **使用多阶段构建**：减少最终镜像层数和大小
  ```dockerfile
  # 构建阶段
  FROM golang:1.22-alpine AS builder
  WORKDIR /app
  COPY . .
  RUN CGO_ENABLED=0 go build -o myapp .

  # 运行阶段（只包含编译后的二进制文件）
  FROM alpine:3.19
  COPY --from=builder /app/myapp /usr/local/bin/myapp
  ENTRYPOINT ["myapp"]
  ```
- **合并 RUN 指令**：减少镜像层数
  ```dockerfile
  # 不推荐：每个 RUN 创建一层
  RUN apk add --no-cache git
  RUN apk add --no-cache curl

  # 推荐：合并为一个 RUN
  RUN apk add --no-cache git curl
  ```
- **利用构建缓存**：将变化频繁的指令（如 `COPY . .`）放在 Dockerfile 后面，变化少的指令（如依赖安装）放在前面

## 3.6 Docker 资源限制

### 3.6.1 CPU 限制

```bash
# ===== --cpus：限制容器可使用的 CPU 核心数（推荐） =====

# 限制容器最多使用 1.5 个 CPU 核心
docker run -d --name web --cpus=1.5 nginx:alpine

# 限制容器最多使用 0.5 个 CPU 核心（50% 的一个核心）
docker run -d --name web --cpus=0.5 nginx:alpine

# ===== --cpu-shares：CPU 相对权重（默认 1024） =====

# 当 CPU 资源紧张时，按权重比例分配 CPU 时间
# 容器 A 权重 1024，容器 B 权重 512 → A 获得约 2/3 的 CPU 时间，B 获得约 1/3
docker run -d --name app-a --cpu-shares=1024 nginx:alpine
docker run -d --name app-b --cpu-shares=512 nginx:alpine

# 注意：cpu-shares 只在 CPU 资源竞争时生效，不限制上限

# ===== --cpuset-cpus：绑定到特定 CPU 核心 =====

# 将容器绑定到 CPU 0 和 1
docker run -d --name web --cpuset-cpus=0,1 nginx:alpine

# 将容器绑定到 CPU 0-3（范围表示）
docker run -d --name web --cpuset-cpus=0-3 nginx:alpine

# ===== --cpu-period 和 --cpu-quota（底层 CFS 调度参数） =====

# cpu-period=100000（100ms），cpu-quota=50000（50ms）
# 等价于 --cpus=0.5
docker run -d --name web \
  --cpu-period=100000 --cpu-quota=50000 \
  nginx:alpine

# ===== 查看容器 CPU 使用情况 =====
docker stats --no-stream web
```

### 3.6.2 内存限制

```bash
# ===== -m / --memory：限制容器最大内存使用量 =====

# 限制容器最多使用 512MB 内存
docker run -d --name web --memory=512m nginx:alpine

# 限制容器最多使用 1GB 内存
docker run -d --name web --memory=1g nginx:alpine

# ===== --memory-reservation：内存软限制（弹性限制） =====

# 软限制 256MB，硬限制 512MB
# 当系统内存紧张时，Docker 会尝试将容器内存压缩到 256MB 以下
# 但容器在短期内可以超过 256MB（最高到硬限制 512MB）
docker run -d --name web \
  --memory=512m --memory-reservation=256m \
  nginx:alpine

# ===== --memory-swap：内存 + Swap 总限制 =====

# 注意：--memory-swap 是内存 + Swap 的总和，不是单独的 Swap 值

# 允许使用 512MB 内存 + 512MB Swap（总共 1GB）
docker run -d --name web --memory=512m --memory-swap=1g nginx:alpine

# 禁止使用 Swap（--memory-swap 等于 --memory）
docker run -d --name web --memory=512m --memory-swap=512m nginx:alpine

# ===== --oom-score-adj：OOM Killer 优先级 =====

# 调整容器被 OOM Killer 杀死的优先级（-1000 到 1000）
# 值越大越容易被杀死，-1000 表示永远不会被 OOM Killer 杀死
docker run -d --name web --oom-score-adj=500 nginx:alpine

# ===== 查看容器内存使用情况 =====
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}" web
```

### 3.6.3 Block IO 限制

Docker 通过 Linux Cgroup 的 blkio 子系统来限制容器的块设备 I/O。

```bash
# ===== 限制读写速率（bps = bytes per second） =====

# 限制容器对 /dev/sda 的读取速率为 10MB/s
docker run -d --name db \
  --device-read-bps /dev/sda:10mb \
  postgres:16

# 限制容器对 /dev/sda 的写入速率为 5MB/s
docker run -d --name db \
  --device-write-bps /dev/sda:5mb \
  postgres:16

# ===== 限制读写 IOPS（每秒 IO 操作数） =====

# 限制容器对 /dev/sda 的读取 IOPS 为 1000
docker run -d --name db \
  --device-read-iops /dev/sda:1000 \
  postgres:16

# 限制容器对 /dev/sda 的写入 IOPS 为 500
docker run -d --name db \
  --device-write-iops /dev/sda:500 \
  postgres:16

# ===== 按权重限制 IO（--blkio-weight） =====

# blkio-weight 范围 10-1000，默认 500
# 当 IO 资源竞争时，按权重比例分配
docker run -d --name app-a --blkio-weight=500 nginx:alpine
docker run -d --name app-b --blkio-weight=250 nginx:alpine
# app-a 获得的 IO 带宽约为 app-b 的 2 倍

# ===== 查看容器 IO 使用情况 =====
docker stats --no-stream --format "table {{.Name}}\t{{.BlockIO}}" db
```

## 3.7 面试常见问题

- Q1: Docker 网络的 bridge 和 overlay 模式有什么区别？
  - **参考答案要点**：Bridge 模式是单机网络，容器通过 docker0 网桥和 veth pair 通信，外部访问通过 iptables NAT 端口映射，适合单机场景。Overlay 模式是跨主机网络，基于 VXLAN 封装（将容器以太帧封装在 UDP 报文中通过物理网络传输），使用 Gossip 协议作为控制平面同步节点状态，适合 Docker Swarm 和 Kubernetes 等多节点集群场景。Bridge 网络延迟低但不能跨主机，Overlay 网络有封装开销（约 50 字节）但支持跨主机通信。

- Q2: overlay2 存储驱动的工作原理？
  - **参考答案要点**：Overlay2 基于 Linux OverlayFS 联合挂载技术。镜像由多个只读层（lowerdir）组成，每个容器有一个独立的可写层（upperdir）。容器看到的文件系统是 lowerdir 和 upperdir 的合并视图（merged）。修改文件时采用 Copy-on-Write 策略：首次修改时将文件从 lowerdir 复制到 upperdir 再修改；删除文件时在 upperdir 创建 whiteout 文件遮盖 lowerdir 的文件。这样多个容器可以共享同一镜像的只读层，节省磁盘空间。

- Q3: 什么是容器逃逸？如何防范？
  - **参考答案要点**：容器逃逸是指攻击者突破容器隔离机制获取宿主机权限。常见方式包括：(1) 特权容器逃逸（`--privileged` 直接访问宿主机设备）；(2) 挂载 docker.sock 逃逸（通过 Docker API 创建特权容器）；(3) 内核漏洞逃逸（利用 Linux 内核漏洞提权）；(4) 不当的 Namespace 共享。防范措施：禁止 `--privileged`，按需授予最小能力（`--cap-drop ALL`）；禁止挂载 docker.sock；启用 Seccomp/AppArmor；使用 Rootless Docker；及时更新宿主机内核；设置 `no-new-privileges`。

- Q4: Volume 和 Bind Mount 的区别？
  - **参考答案要点**：Volume 由 Docker 管理，数据存储在 `/var/lib/docker/volumes/` 目录下，支持驱动插件（如 NFS、Ceph），可跨容器共享，是 Docker 推荐的方式。Bind Mount 将宿主机的任意目录/文件挂载到容器中，用户自行管理路径和数据，灵活性高但可移植性差（路径依赖宿主机环境）。Volume 适合生产环境（可移植、可管理），Bind Mount 适合开发环境（方便编辑宿主机代码实时同步到容器）。

- Q5: containerd 和 Docker Engine 的关系？为什么 K8s 弃用了 Docker？
  - **参考答案要点**：containerd 是 Docker Engine 的底层运行时组件，负责容器生命周期管理和镜像管理。Docker Engine 在 containerd 之上封装了镜像构建（`docker build`）、Docker Compose、Swarm 等高级功能。Kubernetes 1.24 移除 dockershim 的原因：(1) Docker Engine 功能过于庞大，K8s 只需要容器运行时功能（创建/销毁容器、拉取镜像）；(2) dockershim 是 K8s 内部维护的临时适配层，代码质量差且维护负担重；(3) OCI 标准成熟后，K8s 可以通过 CRI（Container Runtime Interface）直接对接 containerd 或 CRI-O，无需 Docker Engine 作为中间层。移除后不影响镜像兼容性，OCI 格式的镜像在任何运行时都可以运行。
