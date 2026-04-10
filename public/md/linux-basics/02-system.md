# Linux 系统管理

## 用户和权限

```bash
# 用户管理
useradd username          # 创建用户
userdel username          # 删除用户
usermod -aG group user    # 添加到组
passwd username           # 设置密码

# 用户信息
id username               # 查看用户信息
whoami                    # 当前用户
w                         # 在线用户

# 组管理
groupadd groupname        # 创建组
groups username           # 用户所属组
```

## 服务管理

```bash
# Systemd (CentOS 7+, Ubuntu 16.04+)
systemctl start nginx     # 启动
systemctl stop nginx     # 停止
systemctl restart nginx  # 重启
systemctl status nginx   # 状态
systemctl enable nginx   # 开机自启
systemctl disable nginx  # 禁用

# 查看服务
systemctl list-units --type=service
systemctl list-unit-files

# Service (旧版)
service nginx start
service nginx status
```

## 软件安装

```bash
# Ubuntu/Debian
apt update                # 更新源
apt upgrade              # 升级软件
apt install nginx        # 安装
apt remove nginx         # 卸载
apt search keyword       # 搜索

# CentOS/RHEL
yum install nginx        # 安装（CentOS 7 及以下）
yum remove nginx         # 卸载
yum search keyword       # 搜索

# CentOS 8+ / RHEL 8+ 使用 dnf 替代 yum（yum 实际是指向 dnf 的软链接）
dnf install nginx        # 安装
dnf remove nginx         # 卸载

# ⚠️ 注意：CentOS 8 已于 2021-12-31 EOL（停止维护），CentOS 7 于 2024-06-30 EOL
# 推荐替代发行版：Rocky Linux、AlmaLinux、Oracle Linux

# 包管理
dpkg -i package.deb      # Debian安装
rpm -i package.rpm      # RPM安装
```

## 日志管理

```bash
# 系统日志位置
/var/log/syslog         # 系统日志
/var/log/auth.log       # 认证日志
/var/log/nginx/         # Nginx日志
/var/log/mysql/         # MySQL日志

# 日志查看
journalctl              # Systemd日志
journalctl -u nginx     # 指定服务日志
journalctl -e          # 最新日志

# 日志轮转
logrotate -f /etc/logrotate.conf  # 强制轮转
```

## 定时任务

```bash
# Cron 表达式
# 分 时 日 月 周

# 每分钟执行
* * * * * /path/to/script.sh

# 每天凌晨3点
0 3 * * * /path/to/script.sh

# 每周日凌晨
0 0 * * 0 /path/to/script.sh

# 每月1号凌晨
0 0 1 * * /path/to/script.sh

# 每5分钟
*/5 * * * * /path/to/script.sh

# 编辑 crontab
crontab -e              # 编辑当前用户
crontab -l             # 列出任务
crontab -r             # 删除任务
```

## 环境变量

```bash
# 查看
env                     # 所有环境变量
echo $PATH             # 查看PATH
printenv HOME          # 查看指定变量

# 临时设置
export VAR=value

# 永久设置
# ~/.bashrc 或 /etc/profile
export PATH=$PATH:/new/path
```

## 防火墙

```bash
# Ubuntu (UFW)
ufw status              # 状态
ufw allow 80/tcp       # 开放端口
ufw deny 8080          # 禁止端口
ufw enable             # 启用
ufw disable            # 禁用

# CentOS (firewalld)
firewall-cmd --list-ports
firewall-cmd --add-port=80/tcp
firewall-cmd --reload

# iptables
iptables -L            # 查看规则
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -j DROP
```

## 磁盘和挂载

```bash
# 查看磁盘
fdisk -l                # 分区表
lsblk                   # 块设备

# 格式化
mkfs.ext4 /dev/sdb1

# 挂载
mount /dev/sdb1 /mnt/data
umount /mnt/data

# 开机自动挂载
# /etc/fstab
/dev/sdb1 /mnt/data ext4 defaults 0 2

# 检查磁盘
df -h                   # 使用情况
du -sh /path            # 目录大小
```

## 性能监控

```bash
# CPU/内存
top                     # 实时监控
htop                    # 更好用
vmstat 1                # 虚拟内存统计

# I/O监控
iostat -x 1             # IO统计
iotop                   # IO占用

# 网络监控
iftop                   # 网络流量
netstat -s              # 网络统计

# 综合监控
sar -u 1                # CPU使用率
sar -r 1                # 内存使用率
```

## 系统启动

```bash
# 查看启动日志
dmesg                   # 内核日志
journalctl -b           # 本次启动日志

# 运行级别 (SysV)
runlevel                # 当前级别
init 3                  # 切换到文本模式
init 5                  # 切换到图形模式

# Systemd
systemctl get-default  # 默认target
systemctl set-default multi-user.target
```

---

## 进程与线程的区别（Linux层面）（⭐高频）

### 进程 vs 线程

| 维度 | 进程 (Process) | 线程 (Thread) |
|------|---------------|---------------|
| 本质 | 资源分配的基本单位 | CPU 调度的基本单位 |
| 地址空间 | 独立虚拟地址空间 | 共享进程地址空间 |
| 创建开销 | 大（fork + exec） | 小（clone） |
| 通信方式 | IPC（管道、共享内存等） | 直接读写共享变量 |
| 崩溃影响 | 进程间互不影响 | 一个线程崩溃导致整个进程崩溃 |
| 上下文切换 | 需切换页表、TLB 等 | 只需切换寄存器、栈指针 |

> **面试关键点**：在 Linux 中，线程本质上是通过 `clone()` 系统调用创建的"轻量级进程"。内核并不区分进程和线程，都用 `task_struct` 表示。区别仅在于创建时共享的资源范围不同。

```c
// fork - 创建子进程，完全复制地址空间
pid_t pid = fork();

// clone - 创建线程，共享地址空间
clone(thread_func, stack, CLONE_VM | CLONE_FS | CLONE_FILES | CLONE_SIGHAND, arg);

// exec - 在当前进程中加载新程序
execve("/bin/ls", args, env);
```

### 进程状态转换图

```
                    +------------------+
                    |                  |
          fork()    |    NEW (新建)    |
         +--------->|                  |
         |          +--------+---------+
         |                   |
         |              调度器选中
         |                   |
         |                   v
         |          +--------+---------+
         |          |                  |
         |          |  RUNNING (运行)  |
         |          |                  |
         |          +--+----------+---+
         |             |          |
         |        时间片用完     I/O 请求 / sleep
         |             |          |
         |             v          v
         |          +--+---------+-+--------+
         |          |              |        |
         |          |  READY      | BLOCKED |
         |          | (就绪)      | (阻塞)  |
         |          |              |        |
         |          +------+-------+--------+
         |                 |
         |            I/O 完成
         |                 |
         |                 v
         |          +------+-------+
         |          |              |
         +----------|  ZOMBIE      |  (子进程退出，父进程未 wait)
                    | (僵尸进程)   |
                    +--------------+
```

**进程状态说明**：
- **R (Running/Runnable)**：正在运行或等待 CPU 调度
- **S (Sleeping/Interruptible)**：可中断的睡眠状态（等待事件）
- **D (Disk Sleep/Uninterruptible)**：不可中断的睡眠状态（通常等待磁盘 I/O）
- **Z (Zombie)**：僵尸进程（已终止但父进程未回收）
- **T (Stopped)**：暂停状态（收到 SIGSTOP 信号）

```bash
# 查看进程状态
ps aux | awk '{print $8}' | sort | uniq -c
ps -eo pid,stat,comm | grep -E "Z|D"
```

### 僵尸进程与孤儿进程

**僵尸进程**：
- 子进程退出后，其 PCB（进程控制块）仍保留在内核中，等待父进程调用 `wait()` 回收
- 如果父进程不调用 `wait()`，僵尸进程会一直存在，占用 PID 资源
- 僵尸进程不能被 `kill -9` 杀死（因为它已经"死了"）

```bash
# 查找僵尸进程
ps aux | awk '$8 ~ /Z/ {print $2, $11}'

# 解决方法：杀死父进程，让 init/systemd 接管并回收
kill -9 $(ps -o ppid= -p <zombie_pid>)
```

**孤儿进程**：
- 父进程先于子进程退出，子进程成为孤儿进程
- 孤儿进程会被 `init`（PID=1）或 `systemd` 接管并自动回收
- 孤儿进程是正常现象，不会造成问题

### 进程间通信方式详解

| 方式 | 特点 | 适用场景 |
|------|------|----------|
| **管道 (Pipe)** | 半双工、血缘关系进程间、内核缓冲区 | 父子进程简单通信 |
| **命名管道 (FIFO)** | 无血缘关系进程间通信 | 简单的跨进程消息传递 |
| **消息队列 (Message Queue)** | 结构化消息、有类型 | 异步任务处理 |
| **共享内存 (Shared Memory)** | 最快 IPC、需同步机制 | 大数据量高频交换 |
| **信号量 (Semaphore)** | 计数器、用于同步 | 控制共享资源访问 |
| **信号 (Signal)** | 异步、轻量级 | 进程控制（SIGTERM/SIGKILL） |
| **Socket** | 双向、跨主机 | 网络通信、跨机器 IPC |

```bash
# 管道示例
ls -l | grep ".txt" | wc -l

# 命名管道
mkfifo /tmp/myfifo
# 终端1: cat /tmp/myfifo
# 终端2: echo "hello" > /tmp/myfifo

# 共享内存查看
ipcs -m    # 查看共享内存段
ipcrm -m <shmid>  # 删除共享内存段

# 信号
kill -SIGTERM 1234    # 优雅终止
kill -SIGKILL 1234    # 强制终止
kill -SIGUSR1 1234    # 自定义信号
```

```c
// 共享内存示例
#include <sys/shm.h>
#include <string.h>

int shmid = shmget(IPC_PRIVATE, 1024, IPC_CREAT | 0666);
char *addr = shmat(shmid, NULL, 0);
strcpy(addr, "Hello from shared memory");
shmdt(addr);  // 断开连接
shmctl(shmid, IPC_RMID, NULL);  // 删除共享内存
```

---

## Linux 内存管理深入（⭐高频）

### 虚拟内存空间布局

**32 位系统（4GB 地址空间）**：
```
0xFFFFFFFF +------------------+
           |     内核空间      |  (1GB, 所有进程共享)
0xC0000000 +------------------+
           |     栈 (Stack)    |  (向下增长)
           |        ...        |
           |                  |
           |   共享库映射区    |  (mmap 区域)
           |                  |
           |        ...        |
           |     堆 (Heap)     |  (向上增长, brk)
0x08048000 +------------------+
           |  程序代码段(text)  |
0x00000000 +------------------+
```

**64 位系统（128TB 用户空间，实际使用 47 位）**：
```
0x7FFFFFFFFFFF +------------------+
               |     栈 (Stack)    |
               |     (向下增长)    |
               |                  |
               |   mmap 映射区    |
               |                  |
               |     堆 (Heap)     |
               |     (向上增长)    |
               |                  |
               |  程序代码段(text)  |
0x000000000000 +------------------+
```

```bash
# 查看进程内存映射
cat /proc/<pid>/maps
pmap -x <pid>

# 查看进程内存统计
cat /proc/<pid>/status | grep -E "VmRSS|VmSize|VmSwap"
```

### 页表机制

Linux 使用**多级页表**将虚拟地址映射到物理地址：

```
虚拟地址结构（64位，4级页表）：
+--------+--------+--------+--------+------+
| PGD    | PUD    | PMD    | PTE    | 偏移  |
| 9 bits | 9 bits | 9 bits | 9 bits |12bits|
+--------+--------+--------+--------+------+

查找过程：虚拟地址 -> PGD -> PUD -> PMD -> PTE -> 物理页帧 -> +偏移 = 物理地址
```

**TLB (Translation Lookaside Buffer)**：
- 页表缓存，加速虚拟地址到物理地址的转换
- TLB 命中：直接得到物理地址，无需查页表（~1 个时钟周期）
- TLB 未命中：需要遍历多级页表（~数十个时钟周期）
- 上下文切换时需要刷新 TLB（部分或全部）

```bash
# 查看 TLB 信息
getconf LEVEL1_ICACHE_SIZE
cat /sys/devices/system/cpu/cpu0/cache/index3/size  # L3 缓存
```

### 缺页中断 (Page Fault)

当进程访问的虚拟页不在物理内存中时，触发缺页中断：

```
CPU 访问虚拟地址
    |
    v
查页表 -> 页面在物理内存中? -> 是 -> 直接访问（无中断）
    |
    否
    |
    v
触发缺页中断
    |
    v
判断类型:
    |- 合法访问（页在 swap 中或需要按需分配）
    |     -> 从磁盘加载页面到物理内存
    |     -> 更新页表
    |     -> 重新执行指令
    |
    |- 非法访问（空指针、写只读页等）
          -> 发送 SIGSEGV 信号，进程崩溃
```

```bash
# 查看缺页中断统计
ps -o pid,minflt,majflt,cmd -p <pid>
# minflt: 次要缺页（从内存分配，无需磁盘 I/O）
# majflt: 主要缺页（需要从磁盘读取）
```

### OOM Killer

当系统内存耗尽时，Linux 内核的 OOM Killer 会选择性地杀死进程：

```bash
# 查看 OOM 分数（分数越高越容易被杀）
cat /proc/<pid>/oom_score

# 调整 OOM 优先级（-1000 到 1000，越低越不容易被杀）
echo -500 > /proc/<pid>/oom_score_adj

# 查看内核 OOM 日志
dmesg | grep -i "oom\|out of memory"
journalctl -k | grep -i "oom killer"
```

**OOM Killer 选择进程的评分依据**：
- 内存占用大小
- 进程优先级（nice 值）
- 是否为 root 进程
- 子进程数量
- 运行时间

### Swap 原理与调优

```
物理内存不足时的处理流程：

内存使用率升高
    |
    v
kswapd 内核线程唤醒
    |
    v
扫描页面，选择可回收页面:
    |- 文件页（干净页）：直接丢弃，需要时从磁盘重新读
    |- 文件页（脏页）：写回磁盘后丢弃
    |- 匿名页（堆/栈）：交换到 Swap 分区
    |
    v
如果内存仍然不足 -> 触发 OOM Killer
```

```bash
# Swap 调优参数
# swappiness: 0-100，值越低越倾向于不使用 swap
# 默认 60，建议服务器设为 10
sysctl vm.swappiness=10
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# 查看 Swap 使用情况
free -h
swapon --show
cat /proc/swaps

# 查看哪些进程使用了 Swap
for file in /proc/*/status; do
    awk '/VmSwap|Name/{printf $2 " " $3}END{print ""}' $file
done | sort -k 2 -n -r | head
```

### 内存性能排查

```bash
# 1. free - 查看整体内存使用
free -h
#              total    used    free    shared  buff/cache   available
# Mem:          7.8G    3.2G    1.1G    256M    3.5G        4.0G
# available = free + buff/cache - 不可回收部分（更准确的可用内存）

# 2. vmstat - 虚拟内存统计
vmstat 1 5
# si: 每秒从 swap 读入的内存 (KB)
# so: 每秒写入 swap 的内存 (KB)
# bi: 每秒从块设备读入的块数
# bo: 每秒写入块设备的块数

# 3. sar - 历史内存统计
sar -r 1 5
# kbmemfree, kbmemused, %memused, kbbuffers, kbcached

# 4. /proc/meminfo - 详细内存信息
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree|Dirty|Mapped|Slab"

# 5. slabtop - 内核 slab 缓存
slabtop

# 6. pmap - 进程内存映射
pmap -x <pid>
```

---

## Linux IO 模型（⭐必问）

### 同步/异步、阻塞/非阻塞的概念

```
两个维度：

1. 同步 vs 异步（关注：谁来完成 IO 操作）
   - 同步：应用程序自己完成 IO（读/写等待）
   - 异步：操作系统完成后通知应用程序

2. 阻塞 vs 非阻塞（关注：等待 IO 时能否做其他事）
   - 阻塞：等待 IO 完成，期间不能做其他事
   - 非阻塞：立即返回，IO 未完成时返回错误码 EAGAIN
```

| 模型 | 应用程序 | 内核 |
|------|---------|------|
| 同步阻塞 | 等待 IO 完成 | 等待数据准备好 |
| 同步非阻塞 | 轮询检查 | 立即返回 EAGAIN |
| 异步 IO | 继续做其他事 | 完成后通知应用 |

### 五种 IO 模型

```
1. 阻塞 IO (Blocking IO)
   应用程序: read() ----阻塞等待----> 数据就绪 ----拷贝数据----> 返回
   最简单，默认模式

2. 非阻塞 IO (Non-blocking IO)
   应用程序: read() -> EAGAIN -> read() -> EAGAIN -> ... -> 数据就绪 -> 拷贝 -> 返回
   需要不断轮询，浪费 CPU

3. IO 多路复用 (IO Multiplexing)
   应用程序: select/poll/epoll 等待多个 fd -> 有事件就绪 -> read() -> 返回
   单线程管理多个连接，Redis/Nginx 的核心模型

4. 信号驱动 IO (Signal-driven IO)
   应用程序: 注册 SIGIO 信号 -> 继续做其他事 -> 收到信号 -> read()
   不常用

5. 异步 IO (Asynchronous IO)
   应用程序: aio_read() -> 继续做其他事 -> 内核完成 IO 后通知 -> 数据已就绪
   Linux AIO 不成熟，io_uring 是新的方案
```

### select 原理

```c
#include <sys/select.h>

int select(int nfds, fd_set *readfds, fd_set *writefds, fd_set *exceptfds, struct timeval *timeout);
```

**工作原理**：
1. 将需要监听的 fd 集合从用户态拷贝到内核态
2. 内核遍历所有 fd，检查是否有事件就绪
3. 如果没有就绪，进程阻塞（有 timeout 参数）
4. 有事件就绪后，内核将集合拷贝回用户态
5. 用户态再次遍历集合，找到就绪的 fd

**缺点**：
- **时间复杂度 O(n)**：每次都需要遍历全部 fd
- **FD_SETSIZE 限制**：默认最多 1024 个 fd（`#define FD_SETSIZE 1024`）
- **频繁拷贝**：每次调用都要在用户态和内核态之间拷贝 fd 集合

```c
fd_set readfds;
FD_ZERO(&readfds);
FD_SET(sockfd, &readfds);
FD_SET(stdin, &readfds);

int ret = select(sockfd + 1, &readfds, NULL, NULL, NULL);
if (ret > 0) {
    if (FD_ISSET(sockfd, &readfds)) {
        // sockfd 有数据可读
    }
}
```

### poll 原理

```c
#include <poll.h>

struct pollfd {
    int fd;         // 文件描述符
    short events;   // 关注的事件
    short revents;  // 实际发生的事件
};

int poll(struct pollfd *fds, nfds_t nfds, int timeout);
```

**与 select 的对比**：
- 使用链表（pollfd 数组）代替位图，**没有 FD_SETSIZE 限制**
- 时间复杂度仍然是 **O(n)**，仍需遍历全部 fd
- 仍然存在用户态/内核态之间的数据拷贝

### epoll 原理（⭐⭐⭐核心重点）

```c
#include <sys/epoll.h>

int epfd = epoll_create1(0);  // 创建 epoll 实例

struct epoll_event ev;
ev.events = EPOLLIN;          // 监听读事件
ev.data.fd = sockfd;
epoll_ctl(epfd, EPOLL_CTL_ADD, sockfd, &ev);  // 注册 fd

struct epoll_event events[MAX_EVENTS];
int n = epoll_wait(epfd, events, MAX_EVENTS, -1);  // 等待事件
for (int i = 0; i < n; i++) {
    // 处理就绪事件
}
```

**核心数据结构**：
```
epoll 实例
    |
    +-- 红黑树 (rbtree): 存储所有监听的 fd
    |       - epoll_ctl 添加/删除/修改 fd 时操作红黑树
    |       - O(log n) 的插入和删除
    |
    +-- 双向链表 (ready list): 存储已就绪的 fd
    |       - 当 fd 事件就绪时，回调函数将其加入链表
    |       - epoll_wait 只返回链表中的 fd
    |
    +-- 事件回调机制:
            - 网卡收到数据 -> 硬件中断 -> 内核处理
            - 内核找到对应的 fd，调用回调
            - 回调将 fd 加入 ready list
            - 唤醒等待的进程
```

**LT (Level Triggered) vs ET (Edge Triggered)**：

| 模式 | 触发时机 | 特点 |
|------|---------|------|
| **LT (水平触发)** | 只要缓冲区有数据就通知 | 默认模式，编程简单，可能产生重复通知 |
| **ET (边缘触发)** | 缓冲区从无数据变为有数据时通知一次 | 只通知一次，必须配合非阻塞 + 循环读取 |

```c
// ET 模式必须设置非阻塞
int flags = fcntl(fd, F_GETFL, 0);
fcntl(fd, F_SETFL, flags | O_NONBLOCK);

// ET 模式注册
ev.events = EPOLLIN | EPOLLET;  // 边缘触发

// ET 模式读取（必须循环读到 EAGAIN）
while (1) {
    int n = read(fd, buffer, sizeof(buffer));
    if (n == -1) {
        if (errno == EAGAIN || errno == EWOULDBLOCK) break;
        // 处理错误
    }
    // 处理数据
}
```

**epoll 事件类型**：

| 事件 | 含义 |
|------|------|
| `EPOLLIN` | fd 可读（有数据到达、连接请求） |
| `EPOLLOUT` | fd 可写（发送缓冲区有空间） |
| `EPOLLRDHUP` | 对端关闭连接或半关闭（TCP FIN） |
| `EPOLLPRI` | 有紧急数据可读 |
| `EPOLLERR` | 发生错误 |
| `EPOLLHUP` | fd 被挂起 |

### 为什么 Redis/Nginx 选择 epoll

```
Redis:
- 单线程模型，需要高效管理大量连接
- epoll 的 O(1) 事件通知机制避免了遍历开销
- ET 模式 + 非阻塞 IO 实现高吞吐

Nginx:
- 每个 worker 进程使用 epoll 管理数千个连接
- 事件驱动架构天然适配 epoll
- 支持数万并发连接

对比:
- select: 最多 1024 fd，O(n) 遍历，不适合高并发
- poll: 无数量限制，但仍是 O(n)
- epoll: O(1) 事件通知，仅返回就绪 fd，适合 C10K/C100K
```

**面试问答**：

> **Q: epoll 为什么是 O(1)？**
> A: epoll_wait 只返回就绪的 fd，不需要遍历所有监听的 fd。就绪 fd 的数量通常远小于总数。红黑树操作是 O(log n)，但 epoll_wait 本身是 O(就绪 fd 数量)。

> **Q: epoll 的 LT 和 ET 有什么区别？什么时候用 ET？**
> A: LT 只要数据存在就会通知，ET 只在状态变化时通知一次。ET 减少了系统调用次数，但编程更复杂（必须配合非阻塞 IO + 循环读取）。Nginx 默认使用 ET 模式以获得最高性能。

---

## CPU 调度算法（⭐⭐中频）

### CFS（Completely Fair Scheduler）

Linux 2.6.23 之后默认的调度器，基于**虚拟运行时间 (vruntime)** 实现公平调度：

```
核心思想：
- 每个 CPU 维护一个红黑树，按 vruntime 排序
- vruntime 越小的进程越优先获得 CPU
- 每次调度选择红黑树最左边的进程

vruntime 计算公式：
vruntime += 实际运行时间 * (NICE_0_LOAD / 进程权重)

权重由 nice 值决定：
- nice 值范围: -20 到 19（普通用户 0 到 19）
- nice 值越小，权重越大，vruntime 增长越慢，获得更多 CPU 时间
```

```bash
# 查看进程的调度策略
ps -eo pid,ni,pri,comm | head

# 修改进程优先级
nice -n -5 ./myapp       # 以 nice=-5 启动
renice -n 10 -p <pid>    # 修改运行中进程的 nice 值

# 查看调度器信息
cat /proc/<pid>/sched
# nr_voluntary_switches: 主动切换次数
# nr_involuntary_switches: 被动切换次数
```

### 进程优先级

```
nice 值: -20 ~ 19
  -20 (最高优先级)  <--->  19 (最低优先级)
  默认 nice = 0

实时优先级 (RT priority): 0 ~ 99
  99 (最高)  <--->  0 (最低)
  实时进程优先于普通进程

调度策略:
  - SCHED_NORMAL (CFS): 普通进程
  - SCHED_FIFO: 实时先进先出
  - SCHED_RR: 实时时间片轮转
  - SCHED_DEADLINE: 截止时间调度
```

### 上下文切换开销

```
上下文切换发生时机:
1. 时间片用完
2. 高优先级进程抢占
3. 进程主动让出 CPU (sleep/IO)
4. 中断处理

上下文切换开销:
- 保存当前进程的寄存器、栈指针、程序计数器
- 加载新进程的寄存器、栈指针、程序计数器
- 刷新 TLB（如果切换到不同进程的地址空间）
- 切换内核栈
- 典型开销: 数十微秒

查看上下文切换:
```

```bash
# 查看系统上下文切换次数
vmstat 1
# cs 列: 每秒上下文切换次数
# 正常范围: 几千到几万，超过 10 万可能有问题

# 查看进程的上下文切换
pidstat -w 1
# cswch/s: 每秒自愿上下文切换（等待 IO/sleep）
# nvcswch/s: 每秒非自愿上下文切换（被抢占）

# 查看中断次数
cat /proc/interrupts
```

---

## 性能调优方法论（⭐⭐中频）

### CPU 瓶颈排查流程

```
1. 确认 CPU 负载
   uptime -> load average > CPU 核数? -> 确认是 CPU 瓶颈

2. 定位是哪个 CPU 核心
   mpstat -P ALL 1 -> 某个核心 %usr 或 %sys 过高

3. 定位是哪个进程
   top / ps aux --sort=-%cpu -> 找到 CPU 占用最高的进程

4. 定位是哪段代码
   perf top -p <pid> -> 查看函数级别的 CPU 热点
   perf record -g -p <pid> && perf report -> 生成火焰图

5. 分析原因
   %usr 高 -> 应用计算密集，考虑算法优化、缓存优化
   %sys 高 -> 系统调用过多，考虑减少系统调用、批量处理
   %iowait 高 -> 实际是 IO 瓶颈，不是 CPU
```

```bash
# CPU 排查命令速查
top -bn1 | head -20          # 整体 CPU 使用
mpstat -P ALL 1 3            # 每个 CPU 核心使用率
pidstat -u 1 5               # 每个进程的 CPU 使用
perf top -p <pid>            # 进程内函数热点
```

### 内存瓶颈排查流程

```
1. 确认内存使用
   free -h -> available 接近 0? -> 确认内存不足

2. 查看 Swap 使用
   free -h -> Swap 使用量大? -> 内存严重不足

3. 定位占用内存最多的进程
   ps aux --sort=-%mem | head -10
   smem -rs pss              # 更准确的内存统计（含共享库分摊）

4. 检查是否存在内存泄漏
   valgrind --leak-check=full ./myapp
   pmap -x <pid>             # 观察堆内存是否持续增长

5. 检查内核层面
   slabtop -> 内核 slab 缓存是否异常
   cat /proc/meminfo -> 各项内存指标

6. 解决方案
   - 优化应用内存使用
   - 增加 Swap（临时方案）
   - 增加物理内存
   - 调整 vm.swappiness
```

```bash
# 内存排查命令速查
free -h                      # 整体内存使用
vmstat 1 5                   # si/so 查看 swap 活动
pidstat -r 1 5               # 进程内存使用
sar -r 1 5                   # 历史内存数据
pmap -x <pid>                # 进程内存映射详情
```

### IO 瓶颈排查流程

```
1. 确认 IO 等待
   top -> %wa 高? -> IO 瓶颈
   iostat -x 1 -> %util 接近 100%? -> 磁盘饱和

2. 定位 IO 密集的进程
   iotop -> 按进程查看 IO
   pidstat -d 1 -> 每个进程的 IO 统计

3. 分析 IO 模式
   iostat -x 1:
   - await: 平均 IO 等待时间（正常 < 10ms，> 50ms 有问题）
   - avgqu-sz: 平均队列长度
   - r_await/w_await: 读写等待时间

4. 解决方案
   - 优化 SQL 查询、增加索引
   - 使用更快的存储（SSD 替换 HDD）
   - 增加 IO 队列深度
   - 使用缓存减少磁盘访问
   - 调整 IO 调度器（cfq -> deadline/noop for SSD）
```

```bash
# IO 排查命令速查
iostat -x 1 5                # IO 统计
iotop                        # 进程 IO 实时监控
pidstat -d 1 5               # 进程 IO 统计
iotop -o                     # 只显示有 IO 的进程
```

### 网络瓶颈排查流程

```
1. 确认网络状态
   sar -n DEV 1 -> 网卡流量是否打满
   iftop -> 实时流量监控

2. 检查连接状态
   ss -s -> 连接数统计
   netstat -an | awk '{print $6}' | sort | uniq -c -> 各状态连接数

3. 检查丢包和错误
   netstat -i -> 网卡错误统计
   sar -n EDEV 1 -> 网卡错误率

4. 检查内核参数
   netstat -s -> TCP 统计信息
   # 关注: retransmits、failed connection attempts

5. 抓包分析
   tcpdump -i eth0 -w capture.pcap
   Wireshark 分析

6. 解决方案
   - 调整 TCP 缓冲区大小
   - 开启 TCP 合并/加速
   - 调整内核网络参数
   - 使用负载均衡分散流量
```

```bash
# 网络排查命令速查
ss -s                        # 连接统计
ss -tn state established     # 已建立连接
ss -tn state time-wait       # TIME_WAIT 连接
sar -n DEV 1 5               # 网卡流量
sar -n TCP 1 5               # TCP 统计
netstat -s | grep -i retrans # 重传统计
```
