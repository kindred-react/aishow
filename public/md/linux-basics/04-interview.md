# Linux 面试常见问题

## 基础概念

### Q1: Linux 启动过程?

```
1. BIOS/UEFI 自检
2. 加载引导程序 (GRUB)
3. 加载内核 (vmlinuz)
4. 启动 Systemd / init
5. 运行级别 (runlevel)
6. 启动服务
```

### Q2: Linux 文件系统结构?

```
/           # 根目录
├── /bin    # 基本命令
├── /sbin   # 系统管理命令
├── /etc    # 配置文件
├── /home   # 用户目录
├── /root   # 超级用户目录
├── /tmp    # 临时文件
├── /var    # 可变数据（日志）
├── /usr    # 用户程序
├── /proc   # 进程信息
├── /dev    # 设备文件
└── /sys    # 系统信息
```

### Q3: 硬链接 vs 软链接?

| 特性 | 硬链接 | 软链接 |
|------|--------|--------|
| 本质 | 同一文件多个入口 | 独立文件 |
| 跨文件系统 | ❌ | ✅ |
| 删除原文件 | 仍可访问 | 失效 |
| inode | 相同 | 不同 |

```bash
ln file hardlink     # 硬链接
ln -s file softlink  # 软链接
```

### Q4: 进程间通信方式?

- 管道 (pipe)
- 命名管道 (FIFO)
- 信号 (signal)
- 消息队列 (message queue)
- 共享内存 (shared memory)
- 信号量 (semaphore)
- 套接字 (socket)

### Q5: Linux 内存管理?

```
物理内存 -> 页表 -> 虚拟内存
        -> Swap (交换分区)
```

- 物理内存不足时使用 Swap
- 脏页面会被换出
- 定期回收 (kswapd)

---

## 命令行

### Q6: 查看进程占用内存?

```bash
ps aux | grep process
top -p pid
pmap -x pid
```

### Q7: 如何查看端口被占用?

```bash
lsof -i :8080
netstat -tulpn | grep 8080
ss -tulpn | grep 8080
```

### Q8: 日志文件很大如何处理?

```bash
# 实时查看
tail -f log.txt

# 搜索关键词
grep "error" log.txt

# 统计出现次数
grep -c "error" log.txt

# 查看最后100行
tail -n 100 log.txt

# 日志轮转
logrotate
```

---

## 网络

### Q9: 如何查看网络连接?

```bash
netstat -an              # 所有连接
netstat -tn              # TCP连接
netstat -un             # UDP连接
ss -s                   # 统计信息
```

### Q10: TCP 三次握手?

```
客户端                    服务器
  |                        |
  |-------- SYN --------->|  (1)
  |<------ SYN-ACK ------|  (2)
  |-------- ACK -------->|  (3)
  |                        |
  |------ 建立连接 ------|
```

### Q11: TIME_WAIT 状态?

- 主动关闭方会进入 TIME_WAIT
- 等待 2MSL (最大报文生存时间)
- 确保对方收到最后的 ACK
- 过多会影响性能

---

## 性能

### Q12: 负载高如何排查?

```bash
# 1. 查看负载
uptime
# load average: 0.5, 0.6, 0.7 (1/5/15分钟)

# 2. 查看CPU
top
htop

# 3. 查看内存
free -h

# 4. 查看IO
iostat -x 1
iotop

# 5. 查看进程
ps aux --sort=-%cpu
ps aux --sort=-%mem
```

### Q13: 磁盘IO高如何排查?

```bash
# 查看IO状态
iostat -x 1

# 查看IO占用
iotop

# 查看具体进程
pidstat -d 1

# 查看IO等待
vmstat 1
# wa 列表示IO等待
```

---

## 常用面试题

### Q14: 如何查找大文件?

```bash
find / -type f -size +100M
du -h / | sort -rh | head -10
```

### Q15: 如何统计访问量?

```bash
# 统计请求数
wc -l access.log

# 独立IP数
awk '{print $1}' access.log | sort -u | wc -l

# 每小时请求数
awk '{print $4}' access.log | cut -d: -f1 | sort | uniq -c
```

### Q16: 如何做系统监控?

```bash
# 常用监控命令
top           # CPU/内存
htop          # 交互式
vmstat 1      # 系统状态
iostat -x 1  # IO
netstat -s   # 网络
df -h        # 磁盘
```

### Q17: 常用防火墙命令?

```bash
# iptables
iptables -L                    # 查看规则
iptables -A INPUT -p tcp --dport 80 -j ACCEPT  # 开放80端口
iptables -A INPUT -j DROP     # 默认拒绝

# firewalld
firewall-cmd --list-ports
firewall-cmd --add-port=80/tcp
```

### Q18: 如何防止脚本重复运行?

```bash
#!/bin/bash

# 方法1: 使用锁文件
LOCK_FILE="/tmp/myscript.lock"

if [ -f "$LOCK_FILE" ]; then
    echo "Script is running"
    exit 1
fi

trap 'rm -f $LOCK_FILE' EXIT
touch "$LOCK_FILE"

# 脚本内容...
```

---

## 速记表

### 快捷键
| 快捷键 | 作用 |
|--------|------|
| Ctrl+C | 终止 |
| Ctrl+Z | 暂停 |
| Ctrl+D | 退出 |
| Ctrl+L | 清屏 |
| Ctrl+A | 行首 |
| Ctrl+E | 行尾 |

### 常用服务端口
| 端口 | 服务 |
|------|------|
| 22 | SSH |
| 80 | HTTP |
| 443 | HTTPS |
| 3306 | MySQL |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 27017 | MongoDB |

---

## TCP 四次挥手（⭐高频）

### 四次挥手流程图

```
客户端（主动关闭方）              服务器（被动关闭方）
  |                                |
  |-------- FIN (seq=u) --------->|  (1) 客户端发送 FIN，表示不再发送数据
  |                                |
  |<------- ACK (ack=u+1) --------|  (2) 服务器确认收到 FIN
  |                                |      服务器进入 CLOSE_WAIT 状态
  |      客户端进入 FIN_WAIT_2     |      服务器仍可发送数据
  |                                |
  |<------- FIN (seq=w) --------|  (3) 服务器发送完数据后，发送 FIN
  |                                |      服务器进入 LAST_ACK 状态
  |                                |
  |-------- ACK (ack=w+1) ------->|  (4) 客户端确认收到 FIN
  |                                |      服务器关闭连接
  |      客户端进入 TIME_WAIT      |
  |      等待 2MSL 后关闭          |
```

**为什么需要四次？**
- TCP 是全双工的，每个方向都需要单独关闭
- 第二次和第三次挥手之间，服务器可能还有数据要发送（半关闭状态）

### TIME_WAIT 状态（2MSL 原因）

**什么是 TIME_WAIT？**
- 主动关闭连接的一方在发送最后一个 ACK 后进入 TIME_WAIT 状态
- 持续时间为 **2MSL**（Maximum Segment Lifetime，Linux 内核中 TCP_TIMEWAIT_LEN 默认为 60s，所以 TIME_WAIT 持续约 60s（注意：RFC 标准定义为 2MSL，但 Linux 实现中硬编码为 60s））

**为什么需要等待 2MSL？**
1. **确保最后一个 ACK 能到达服务器**：如果 ACK 丢失，服务器会重发 FIN，客户端需要在此期间重发 ACK
2. **让旧连接的残留报文在网络中消亡**：确保网络中该连接的所有报文都过期，避免影响新连接

### CLOSE_WAIT 堆积原因与排查

**CLOSE_WAIT 产生原因**：
- 服务器收到客户端的 FIN 后进入 CLOSE_WAIT，但**没有调用 close() 关闭连接**
- 通常是代码 bug：没有正确关闭 socket，或者缺少 finally 块释放资源

```bash
# 查看 CLOSE_WAIT 数量
ss -tn state close-wait | wc -l
netstat -an | grep CLOSE_WAIT | wc -l

# 查看哪些进程有 CLOSE_WAIT
ss -tnp state close-wait

# 排查步骤
# 1. 找到对应的进程和端口
ss -tnp state close-wait
# 2. 检查应用代码，确认是否正确关闭连接
# 3. 检查连接池配置是否合理
```

### 大量 TIME_WAIT 的解决方案

```bash
# 1. 查看当前 TIME_WAIT 数量
ss -tn state time-wait | wc -l

# 2. 修改内核参数（临时生效）
sysctl -w net.ipv4.tcp_tw_reuse=1        # 允许将 TIME_WAIT 连接复用（客户端有效）
sysctl -w net.ipv4.tcp_fin_timeout=15    # 缩短 FIN_WAIT_2 超时时间（默认 60s）

# 3. 永久生效
cat >> /etc/sysctl.conf << EOF
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
EOF
sysctl -p

# 4. 应用层使用 SO_REUSEADDR
# 服务端设置（允许绑定 TIME_WAIT 状态的端口）
int opt = 1;
setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

# 5. 使用长连接减少短连接带来的 TIME_WAIT
# HTTP Keep-Alive、连接池等
```

> **面试问答**：
> **Q: 服务器上大量 TIME_WAIT 怎么办？**
> A: 首先确认是客户端还是服务端。如果是客户端，开启 `tcp_tw_reuse=1` 允许复用 TIME_WAIT socket。如果是服务端，使用 `SO_REUSEADDR` 允许绑定。根本解决方案是使用长连接（HTTP Keep-Alive、连接池）减少短连接。

---

## HTTPS 握手过程（⭐高频）

### 对称加密 vs 非对称加密

| 特性 | 对称加密 | 非对称加密 |
|------|---------|-----------|
| 密钥 | 加密和解密使用同一个密钥 | 公钥加密，私钥解密 |
| 速度 | 快（AES 约 1GB/s） | 慢（RSA 2048 约 1MB/s） |
| 安全性 | 密钥传输不安全 | 公钥可以公开传输 |
| 算法 | AES、DES、3DES | RSA、ECC、DSA |
| 用途 | 加密实际数据 | 密钥交换、数字签名 |

> HTTPS 的核心思路：用**非对称加密**安全地交换**对称密钥**，然后用**对称加密**传输数据。

### 数字证书（CA、证书链）

```
证书信任链:
根证书 (Root CA)
    |
    +-- 中间证书 (Intermediate CA)
    |       |
    |       +-- 服务器证书 (example.com)
    |
    +-- 其他中间证书
            |
            +-- 其他服务器证书

浏览器验证流程:
1. 服务器发送证书链（服务器证书 + 中间证书）
2. 浏览器用内置的根证书验证中间证书
3. 用中间证书验证服务器证书
4. 检查证书域名是否匹配
5. 检查证书是否过期
6. 检查证书是否被吊销（CRL/OCSP）
```

### TLS 1.2 握手详细流程

```
客户端                              服务器
  |                                    |
  |------ ClientHello ---------------->|  (1) 支持的 TLS 版本、加密套件列表、
  |                                    |      随机数 (Client Random)
  |                                    |
  |<----- ServerHello -----------------|  (2) 选定的 TLS 版本、加密套件、
  |                                    |      随机数 (Server Random)
  |<----- Certificate -----------------|  (3) 服务器证书（含公钥）
  |<----- ServerKeyExchange ----------|  (4) 密钥交换参数（RSA 省略此步）
  |<----- ServerHelloDone ------------|  (5) 服务器握手消息发送完毕
  |                                    |
  |------ ClientKeyExchange ---------->|  (6) 用服务器公钥加密预主密钥 (Pre-Master Secret)
  |------ ChangeCipherSpec ----------->|  (7) 通知后续消息使用协商的密钥加密
  |------ Finished ------------------->|  (8) 加密的握手完成消息
  |                                    |
  |<----- ChangeCipherSpec ------------|  (9) 服务器切换到加密模式
  |<----- Finished --------------------|  (10) 加密的握手完成消息
  |                                    |
  |========= 加密数据传输 =============|
  |                                    |

密钥生成:
  主密钥 (Master Secret) = PRF(Pre-Master Secret, Client Random, Server Random)
  对称密钥 = PRF(主密钥, "key expansion", Client Random, Server Random)
```

### TLS 1.3 优化

```
TLS 1.2 握手: 2-RTT (两个往返)
TLS 1.3 握手: 1-RTT (一个往返)
TLS 1.3 0-RTT: 0-RTT (恢复连接时零往返)

TLS 1.3 改进:
1. 简化握手流程
   - 合并 ServerHello 和密钥交换
   - 去掉 ChangeCipherSpec
   - 减少到 1-RTT

2. 0-RTT 恢复
   - 客户端保存 Session Ticket
   - 重连时直接发送加密数据
   - 注意: 0-RTT 不保证前向安全（重放攻击风险）

3. 强制使用现代加密算法
   - 移除 RC4、DES、3DES、AES-CBC
   - 移除 RSA 密钥交换
   - 只保留 AEAD (AES-GCM, ChaCha20-Poly1305)
   - 强制使用 ECDHE (前向安全)

4. 会话恢复
   - Session ID（服务器端存储）
   - Session Ticket（客户端存储，推荐）
```

### HTTPS 性能优化

```bash
# 1. Session Resumption - 减少握手开销
# Nginx 配置
ssl_session_cache shared:SSL:10m;       # 10MB 缓存约 4 万个会话
ssl_session_timeout 1d;                  # 会话超时时间
ssl_session_tickets on;                  # 启用 Session Ticket

# 2. OCSP Stapling - 减少 OCSP 查询延迟
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /path/to/chain.pem;
resolver 8.8.8.8;

# 3. TLS 1.3 启用
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384';

# 4. HSTS - 强制 HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

# 5. 证书优化
# - 使用 ECDSA 证书（比 RSA 更小更快）
# - 证书链不要太长
# - 开启 HTTP/2 多路复用
```

---

## HTTP 版本对比（⭐⭐中频）

### HTTP/1.0 vs 1.1

| 特性 | HTTP/1.0 | HTTP/1.1 |
|------|----------|----------|
| 连接方式 | 短连接（每次请求新建 TCP） | 默认长连接（Connection: keep-alive） |
| 管线化 | 不支持 | 支持（但浏览器基本未实现） |
| Host 头 | 不需要 | 必需（虚拟主机支持） |
| 断点续传 | 不支持 | 支持（Range 请求） |
| 缓存控制 | Expires | Cache-Control、ETag |
| 状态码 | 较少 | 新增 100 Continue 等 |

```
HTTP/1.1 的队头阻塞问题:
浏览器限制同一域名最多 6 个 TCP 连接
如果某个请求阻塞，后续请求都要等待
-> 解决方案: 域名分片（sharding）、SPDY
```

### HTTP/2

```
核心改进:

1. 二进制分帧 (Binary Framing)
   - HTTP/1.x 是文本协议，HTTP/2 是二进制协议
   - 所有通信在单个 TCP 连接上完成
   - 帧（Frame）是最小通信单位

2. 多路复用 (Multiplexing)
   - 单个 TCP 连接上可以并行发送多个请求/响应
   - 通过 Stream ID 区分不同的请求
   - 解决了 HTTP/1.1 的队头阻塞

3. 头部压缩 (HPACK)
   - 静态表：预定义的 61 个常见头部
   - 动态表：之前发送过的头部
   - 哈夫曼编码：压缩头部值

4. 服务器推送 (Server Push)
   - 服务器可以主动推送资源
   - 例: 请求 HTML 时主动推送 CSS/JS
   - 注意: 实际效果有限，HTTP/2.1 可能移除

5. 流优先级 (Stream Priority)
   - 客户端可以设置流的优先级和依赖关系
```

```nginx
# Nginx 启用 HTTP/2
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}

# HTTP/2 推送
location / {
    http2_push /css/style.css;
    http2_push /js/app.js;
}
```

### HTTP/3

```
核心改进:

1. 基于 QUIC 协议（UDP）
   - 不再使用 TCP，避免 TCP 队头阻塞
   - TCP 队头阻塞: 一个 TCP 包丢失，后续所有包都阻塞
   - QUIC: 每个流独立，一个流丢包不影响其他流

2. 0-RTT / 1-RTT 握手
   - QUIC 将传输层和加密层握手合并
   - 首次连接: 1-RTT
   - 恢复连接: 0-RTT

3. 连接迁移 (Connection Migration)
   - TCP 连接由四元组（源IP、源端口、目的IP、目的端口）标识
   - 网络切换（WiFi -> 4G）会导致 TCP 连接断开
   - QUIC 使用 Connection ID 标识连接，支持网络切换

4. 内置 TLS 1.3
   - QUIC 强制加密，不存在明文传输
```

```
HTTP 版本演进总结:

HTTP/1.0: 短连接，每次请求新建 TCP
HTTP/1.1: 长连接，管线化（未真正实现），队头阻塞
HTTP/2:  多路复用，头部压缩，二进制分帧（TCP 层仍有队头阻塞）
HTTP/3:  基于 QUIC/UDP，彻底解决队头阻塞，0-RTT 握手
```

---

## DNS 解析过程（⭐⭐中频）

### 递归查询 vs 迭代查询

```
递归查询 (Recursive Query):
客户端 -> 本地 DNS 服务器: "帮我查一下 www.example.com 的 IP"
本地 DNS 服务器负责完成整个查询过程，最终返回结果

迭代查询 (Iterative Query):
本地 DNS -> 根 DNS: "www.example.com 的 IP 是什么?"
根 DNS: "我不知道，你去问 .com 的顶级域名服务器"
本地 DNS -> .com TLD: "www.example.com 的 IP 是什么?"
.com TLD: "我不知道，你去问 example.com 的权威 DNS"
本地 DNS -> example.com NS: "www.example.com 的 IP 是什么?"
example.com NS: "是 93.184.216.34"
本地 DNS -> 客户端: "www.example.com 的 IP 是 93.184.216.34"
```

```
完整解析流程:
1. 检查浏览器 DNS 缓存
2. 检查操作系统 DNS 缓存 (/etc/hosts)
3. 检查路由器 DNS 缓存
4. 向本地 DNS 服务器发起递归查询
5. 本地 DNS 服务器进行迭代查询:
   a. 查询根域名服务器 (.)
   b. 查询顶级域名服务器 (.com)
   c. 查询权威域名服务器 (example.com)
6. 本地 DNS 服务器缓存结果
7. 返回 IP 地址给客户端
```

### DNS 缓存层级

```
层级                    缓存时间           说明
浏览器缓存              约 60s           Chrome: chrome://net-internals/#dns
操作系统缓存            取决于 TTL        Linux: systemd-resolved / nscd
路由器缓存              取决于 TTL        家庭/企业路由器
ISP DNS 缓存           取决于 TTL        运营商 DNS 服务器
权威 DNS 服务器         TTL 设置值        域名所有者配置
```

```bash
# 查看 DNS 缓存
# Linux (systemd-resolved)
resolvectl statistics
systemd-resolve --statistics

# 手动查询 DNS
dig www.example.com
nslookup www.example.com
host www.example.com

# 指定 DNS 服务器查询
dig @8.8.8.8 www.example.com
dig @1.1.1.1 www.example.com

# 查看完整解析路径
dig +trace www.example.com
```

### DNS 劫持与防范

**DNS 劫持方式**：
1. **本地劫持**：修改 `/etc/hosts` 或本地 DNS 设置
2. **中间人劫持**：在 DNS 查询路径上篡改响应
3. **ISP 劫持**：运营商返回错误的 IP（广告/钓鱼页面）

**防范措施**：
```bash
# 1. 使用可信 DNS 服务器
# Google DNS: 8.8.8.8, 8.8.4.4
# Cloudflare DNS: 1.1.1.1, 1.0.0.1
# 阿里 DNS: 223.5.5.5, 223.6.6.6

# 2. 使用 DNS over HTTPS (DoH) 或 DNS over TLS (DoT)
# 加密 DNS 查询，防止中间人篡改

# 3. 配置 /etc/resolv.conf
nameserver 8.8.8.8
nameserver 1.1.1.1
options edns0 trust-ad  # 启用 DNSSEC

# 4. 使用 DNSSEC 验证
dig +dnssec www.example.com
# 如果返回 ad (Authenticated Data) 标志，说明验证通过
```

---

## Linux 内核参数调优（⭐⭐中频）

### TCP 相关参数

```bash
# ===== TCP 连接队列 =====

# tcp_max_syn_backlog: SYN 队列长度（半连接队列）
# 默认 128（CentOS）或 1024（Ubuntu）
# 高并发场景建议 8192 或更高
sysctl -w net.ipv4.tcp_max_syn_backlog=8192

# somaxconn: Accept 队列长度（全连接队列）
# 默认 128，建议 65535
sysctl -w net.core.somaxconn=65535

# ===== TIME_WAIT 优化 =====

# tcp_tw_reuse: 允许将 TIME_WAIT socket 用于新连接（仅客户端）
# 默认 0，建议开启
sysctl -w net.ipv4.tcp_tw_reuse=1

# tcp_fin_timeout: FIN_WAIT_2 状态超时时间
# 默认 60s，建议缩短到 15-30s
sysctl -w net.ipv4.tcp_fin_timeout=15

# ===== TCP 缓冲区 =====

# 读写缓冲区大小
sysctl -w net.core.rmem_max=16777216      # 最大读缓冲区 16MB
sysctl -w net.core.wmem_max=16777216      # 最大写缓冲区 16MB
sysctl -w net.ipv4.tcp_rmem="4096 87380 16777216"  # 最小/默认/最大读缓冲区
sysctl -w net.ipv4.tcp_wmem="4096 65536 16777216"  # 最小/默认/最大写缓冲区

# ===== TCP 连接优化 =====

# tcp_keepalive_time: TCP keepalive 探测间隔
# 默认 7200s (2小时)，建议 600s
sysctl -w net.ipv4.tcp_keepalive_time=600

# tcp_keepalive_intvl: keepalive 探测间隔
sysctl -w net.ipv4.tcp_keepalive_intvl=30

# tcp_keepalive_probes: keepalive 探测次数
sysctl -w net.ipv4.tcp_keepalive_probes=3

# tcp_max_orphans: 最大孤儿 socket 数量
sysctl -w net.ipv4.tcp_max_orphans=65535

# ===== TCP 拥塞控制 =====
# 查看当前拥塞控制算法
sysctl net.ipv4.tcp_congestion_control
# 可选: cubic (默认), bbr
sysctl -w net.ipv4.tcp_congestion_control=bbr

# ===== TCP 快速打开 =====
sysctl -w net.ipv4.tcp_fastopen=3  # 1=客户端, 2=服务端, 3=都开启
```

### 内存相关参数

```bash
# ===== Swap =====
# swappiness: 倾向于使用 swap 的程度 (0-100)
# 0: 尽量不用 swap（除非内存不足）
# 60: 默认值
# 100: 积极使用 swap
sysctl -w vm.swappiness=10

# ===== 文件描述符 =====
# file-max: 系统最大文件描述符数
# 默认值通常足够，但高并发需要调大
sysctl -w fs.file-max=1048576

# 每个进程最大文件描述符数
# 在 /etc/security/limits.conf 中设置
# * soft nofile 65535
# * hard nofile 65535

# ===== 内存 overcommit =====
# vm.overcommit_memory:
# 0: 默认，内核根据内存情况决定
# 1: 允许过度分配（Redis 建议设置）
# 2: 不允许过度分配
sysctl -w vm.overcommit_memory=1

# ===== 脏页回写 =====
# vm.dirty_ratio: 脏页占物理内存的百分比，达到此值时同步回写
sysctl -w vm.dirty_ratio=10
# vm.dirty_background_ratio: 脏页占物理内存的百分比，达到此值时后台回写
sysctl -w vm.dirty_background_ratio=5
```

### 网络相关参数

```bash
# ===== 网络接口队列 =====
# net.core.netdev_max_backlog: 网卡接收队列长度
sysctl -w net.core.netdev_max_backlog=5000

# ===== 端口范围 =====
# net.ipv4.ip_local_port_range: 本地端口范围
sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# ===== SYN Cookie =====
# 防御 SYN Flood 攻击
sysctl -w net.ipv4.tcp_syncookies=1

# ===== 连接跟踪 =====
# net.netfilter.nf_conntrack_max: 连接跟踪表大小
sysctl -w net.netfilter.nf_conntrack_max=1048576
```

### 一键调优脚本

```bash
#!/bin/bash
# /etc/sysctl.d/99-performance.conf

# TCP 优化
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_max_orphans = 65535
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.ip_local_port_range = 1024 65535

# TCP 缓冲区
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216

# 内存优化
vm.swappiness = 10
vm.overcommit_memory = 1
vm.dirty_ratio = 10
vm.dirty_background_ratio = 5

# 文件描述符
fs.file-max = 1048576

# 网络接口
net.core.netdev_max_backlog = 5000
```

```bash
# 应用配置
sysctl -p /etc/sysctl.d/99-performance.conf

# 验证
sysctl net.ipv4.tcp_max_syn_backlog
sysctl net.core.somaxconn
```

> **面试问答**：
> **Q: 高并发服务器需要调整哪些内核参数？**
> A: 主要调整三个方面：(1) TCP 连接队列：`tcp_max_syn_backlog` 和 `somaxconn`；(2) 文件描述符：`fs.file-max` 和 `ulimit -n`；(3) 端口范围：`ip_local_port_range`。另外还要调整 TCP 缓冲区大小、TIME_WAIT 复用、keepalive 参数等。
