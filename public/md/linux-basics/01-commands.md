# Linux 基础命令

## 文件操作

```bash
# 查看文件
ls -la                    # 详细列表
ls -lh                    # 人性化大小
ls -a                     # 显示隐藏文件
ls -lt                    # 按时间排序

# 文件浏览
cat file.txt              # 全部显示
head -n 20 file.txt       # 前20行
tail -n 20 file.txt       # 后20行
tail -f log.txt           # 实时监控

# 文件查找
find /path -name "*.txt"          # 按名称查找
find /path -type f -size +100M    # 查找大于100M的文件
find /path -mtime -7               # 7天内修改的文件

which python           # 命令所在路径
whereis python         # 命令位置和帮助文档

# 文件权限
chmod 755 file         # 所有者rwx,组r-x,其他r-x
chmod +x script.sh     # 添加执行权限
chown user:group file  # 改变所有者

# 文本处理
grep "pattern" file           # 搜索
grep -r "pattern" /path        # 递归搜索
grep -v "pattern" file         # 反向匹配
grep -n "pattern" file         # 显示行号

awk '{print $1}' file         # 打印第一列
sed 's/old/new/g' file         # 替换
sort file                      # 排序
uniq file                      # 去重
wc -l file                     # 统计行数
```

## 目录操作

```bash
cd /path           # 切换目录
pwd                # 当前目录
mkdir -p a/b/c     # 创建目录树
rmdir              # 删除空目录
rm -rf             # 强制删除

# 目录跳转技巧
cd ~               # home目录
cd -               # 上一个目录
cd ..              # 上一级
```

## 系统操作

```bash
# 进程管理
ps -ef             # 查看所有进程
ps aux | grep node # 查找node进程
top                # 实时进程监控
htop                # 交互式进程查看

kill -9 pid        # 强制杀死进程
kill -15 pid       # 优雅终止

# 内存和磁盘
df -h              # 磁盘使用
du -sh /path       # 目录大小
free -h            # 内存使用

# 系统信息
uname -a           # 系统信息
cat /etc/os-release # 系统版本
uptime             # 运行时间
```

## 网络操作

```bash
# 网络诊断
ping -c 4 baidu.com    # 测试连接
curl -I url            # 查看HTTP头
wget url               # 下载文件

netstat -tulpn         # 查看端口
ss -tulpn              # 更快的端口信息查看（替代已废弃的 netstat）

# SSH操作
ssh user@host          # 连接远程服务器
scp file user@host:/path  # 复制文件
rsync -av src/ dest/  # 同步目录
```

## 压缩解压

```bash
# 压缩
tar -cvf archive.tar dir/
tar -czvf archive.tar.gz dir/
tar -cjvf archive.tar.bz2 dir/
zip -r archive.zip dir/

# 解压
tar -xvf archive.tar
tar -xzvf archive.tar.gz
tar -xjvf archive.tar.bz2
unzip archive.zip
```

## 管道和重定向

```bash
# 重定向
command > file          # 输出到文件(覆盖)
command >> file         # 输出到文件(追加)
command 2> error.txt   # 错误输出
command > out.txt 2>&1 # 合并输出

# 管道
cat file | grep pattern | wc -l
history | grep git
```

## 其他常用

```bash
# 快捷键
Ctrl+C    # 终止
Ctrl+Z    # 暂停
Ctrl+D    # 退出
Ctrl+L    # 清屏

# 命令行技巧
!!              # 上一条命令
!$              # 上一条命令的参数
Alt+.           # 上一个命令的参数

# 别名
alias ll='ls -la'
```

## 面试常问命令

```bash
# 1. 查找最近修改的文件
find / -type f -mtime -1

# 2. 统计文件中某个词出现次数
grep -o "word" file | wc -l

# 3. 查看日志最后100行
tail -n 100 log.txt

# 4. 实时查看日志
tail -f app.log

# 5. 查看磁盘占用前10
du -h / | sort -rh | head -10

# 6. 查找占用端口的进程
lsof -i :8080

# 7. 批量重命名
rename 's/old/new/' *.txt
```

## 权限详解

```
rwx rwx rwx
所有者  组   其他

r = 4 (读)
w = 2 (写)
x = 1 (执行)

755 = rwxr-xr-x
644 = rw-r--r--
777 = rwxrwxrwx
```

---

## strace 调试命令（⭐⭐中频）

`strace` 是 Linux 下最强大的动态跟踪工具，可以跟踪进程的系统调用和信号。

### 基本用法

```bash
# 跟踪一个新命令的所有系统调用
strace ls -la

# 跟踪已运行的进程（-p 指定 PID）
strace -p 1234

# 跟踪子进程（-f 参数）
strace -f ./myapp

# 只跟踪特定的系统调用
strace -e trace=open,openat,read,write ./myapp

# 跟踪网络相关系统调用
strace -e trace=network ./myapp

# 跟踪与进程相关的系统调用
strace -e trace=process ./myapp

# 跟踪信号
strace -e trace=signal ./myapp

# 记录系统调用时间
strace -T ./myapp

# 统计每个系统调用的耗时和次数
strace -c ./myapp

# 输出到文件
strace -o output.log ./myapp

# 显示时间戳
strace -tt ./myapp
```

### 排查网络超时

```bash
# 跟踪网络相关的系统调用，查看连接超时位置
strace -e trace=connect,sendto,recvfrom,sendmsg,recvmsg,poll,select,epoll_wait -tt -p <pid>

# 常见输出分析：
# connect(3, {sa_family=AF_INET, sin_port=htons(3306), ...}, 16) = -1 EINPROGRESS
# -> 正在建立 TCP 连接
# poll([{fd=3, events=POLLOUT}], 1, 5000) = 0 (Timeout)
# -> 等待 5 秒超时，说明对端不可达或端口未开放

# 排查 DNS 解析慢
strace -e trace=connect,sendto,recvfrom -tt curl https://example.com
# 如果看到 connect 到 53 端口（DNS）耗时很长，说明 DNS 解析慢
```

### 排查文件权限问题

```bash
# 跟踪文件操作相关系统调用
strace -e trace=open,openat,access,stat,chmod,chown -p <pid>

# 常见输出分析：
# open("/etc/myapp/config.yml", O_RDONLY) = -1 EACCES (Permission denied)
# -> 权限不足
# open("/var/log/myapp.log", O_WRONLY|O_CREAT, 0644) = -1 ENOENT (No such file or directory)
# -> 目录不存在
# access("/etc/ssl/certs/ca-bundle.crt", R_OK) = -1 EACCES (Permission denied)
# -> SSL 证书文件权限问题
```

### 排查程序启动失败

```bash
# 跟踪程序启动过程
strace -f -e trace=file ./myapp 2>&1 | head -50

# 常见场景：
# 1. 找不到共享库
# open("libxxx.so", O_RDONLY) = -1 ENOENT (No such file or directory)
# -> 解决: ldconfig 或设置 LD_LIBRARY_PATH

# 2. 配置文件找不到
# open("/etc/myapp.conf", O_RDONLY) = -1 ENOENT
# -> 检查配置文件路径

# 3. 端口被占用
# bind(3, {sa_family=AF_INET, sin_port=htons(8080)}, 16) = -1 EADDRINUSE
# -> 端口已被其他进程占用
```

> **面试问答**：
> **Q: 程序运行缓慢怎么排查？**
> A: 使用 `strace -c ./myapp` 统计系统调用耗时分布，找到耗时最多的系统调用。常见原因包括：频繁的小文件 I/O（建议合并读取）、DNS 解析慢（检查 DNS 配置）、网络连接超时（检查网络和对端服务）。

---

## tcpdump 抓包（⭐⭐中频）

`tcpdump` 是 Linux 下最常用的网络抓包工具，可以截获网络上的数据包。

### 基本用法

```bash
# 抓取指定网卡的所有流量
tcpdump -i eth0

# 抓取指定端口的流量
tcpdump -i eth0 port 80
tcpdump -i eth0 port 3306

# 抓取指定主机的流量
tcpdump -i eth0 host 192.168.1.100

# 抓取指定网段的流量
tcpdump -i eth0 net 192.168.1.0/24

# 抓取 TCP 流量
tcpdump -i eth0 tcp

# 抓取 UDP 流量
tcpdump -i eth0 udp

# 抓取 ICMP 流量（ping）
tcpdump -i eth0 icmp

# 只抓取 10 个包
tcpdump -i eth0 -c 10

# 保存到文件（pcap 格式，可用 Wireshark 打开）
tcpdump -i eth0 -w capture.pcap

# 读取 pcap 文件
tcpdump -r capture.pcap

# 显示更详细的信息（-vv 更详细）
tcpdump -i eth0 -vv

# 不解析域名（提高速度）
tcpdump -i eth0 -nn

# 显示 ASCII 内容（查看 HTTP 数据）
tcpdump -i eth0 -A -s 0 port 80

# 显示十六进制内容
tcpdump -i eth0 -X -s 0 port 80
```

### 高级过滤语法

```bash
# 组合过滤：源地址 + 目标端口
tcpdump -i eth0 src host 192.168.1.100 and dst port 80

# 抓取 SYN 包（三次握手的第一次）
tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn) != 0'

# 抓取 FIN 包（四次挥手的标志）
tcpdump -i eth0 'tcp[tcpflags] & (tcp-fin) != 0'

# 抓取 RST 包（连接重置）
tcpdump -i eth0 'tcp[tcpflags] & (tcp-rst) != 0'

# 抓取 HTTP GET 请求
tcpdump -i eth0 -A -s 0 'tcp port 80 and (((ip[2:2] - ((ip[0]&0xf)<<2)) - ((tcp[12]&0xf0)>>2)) != 0)'

# 抓取指定长度的包（大于 1000 字节）
tcpdump -i eth0 'greater 1000'

# 抓取指定长度的包（小于 100 字节）
tcpdump -i eth0 'less 100'

# 排除某个端口的流量
tcpdump -i eth0 'not port 22'

# 抓取多个端口
tcpdump -i eth0 'port 80 or port 443 or port 8080'

# 抓取指定 TCP 标志位组合（SYN + ACK）
tcpdump -i eth0 'tcp[tcpflags] & (tcp-syn|tcp-ack) = (tcp-syn|tcp-ack)'

# 按包内容过滤（抓取包含 "GET" 的包）
tcpdump -i eth0 -A -s 0 'port 80 and (tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420)'
# 0x47455420 = "GET "
```

### Wireshark 分析

```bash
# 1. 在服务器上抓包
tcpdump -i eth0 -w /tmp/capture.pcap -c 10000 port 80

# 2. 下载到本地
scp user@server:/tmp/capture.pcap ./

# 3. 用 Wireshark 打开分析
# 常用过滤表达式：
# tcp.flags.syn == 1          -> SYN 包
# tcp.flags.rst == 1          -> RST 包
# http.request.method == GET  -> HTTP GET 请求
# tcp.analysis.retransmission -> TCP 重传
# ip.addr == 192.168.1.100    -> 指定 IP
# tcp.port == 3306            -> 指定端口
# tcp.time_delta > 0.1        -> 间隔超过 100ms 的包（排查延迟）
```

> **面试问答**：
> **Q: 如何排查网络连接超时？**
> A: (1) 先用 `ping` 测试网络连通性；(2) 用 `telnet` 或 `nc` 测试端口连通性；(3) 用 `tcpdump` 抓包分析，看 SYN 包是否有响应；(4) 如果 SYN 无响应，检查防火墙、路由、对端服务状态；(5) 如果有 SYN-ACK 但后续包丢失，检查网络质量。

---

## lsof 高级用法（⭐⭐中频）

`lsof`（LiSt Open Files）可以列出当前系统打开的文件信息，是排查文件和端口问题的利器。

### 基本用法

```bash
# 列出所有打开的文件
lsof

# 查看某个进程打开的文件
lsof -p 1234

# 查看某个用户打开的文件
lsof -u username

# 查看某个目录下被打开的文件
lsof +D /var/log

# 查看某个文件被哪些进程打开
lsof /var/log/syslog

# 查看某个端口被哪个进程占用
lsof -i :8080
lsof -i :3306

# 查看所有网络连接
lsof -i

# 查看 TCP 连接
lsof -i tcp

# 查看 UDP 连接
lsof -i udp

# 查看所有监听端口
lsof -i -sTCP:LISTEN

# 查看所有已建立的连接
lsof -i -sTCP:ESTABLISHED

# 查看某个网段的连接
lsof -i @192.168.1.0/24

# 按命令名过滤
lsof -c nginx
lsof -c java

# 组合过滤：某个用户的网络连接
lsof -u nginx -i
```

### 查看进程打开的文件

```bash
# 查看进程打开的所有文件描述符
lsof -p <pid>

# 只查看某个进程的网络连接
lsof -a -p <pid> -i

# 查看进程打开的文件数量（排查 fd 泄漏）
lsof -p <pid> | wc -l

# 查看进程打开的特定类型文件
lsof -p <pid> | grep -E "\.log|\.conf|\.txt"

# 查看进程打开的 socket
lsof -p <pid> -a -i

# 查看进程的工作目录
lsof -p <pid> | grep cwd

# 查看进程加载的共享库
lsof -p <pid> | grep "\.so"

# 查看进程的内存映射文件
lsof -p <pid> | grep mem
```

### 恢复已删除文件

```bash
# 场景：日志文件被 rm 删除，但进程还在写入，空间未释放
# 1. 找到占用已删除文件的进程
lsof | grep deleted

# 输出示例：
# nginx  1234  root  5w  REG  8,1  1024  5678 /var/log/nginx/access.log (deleted)

# 2. 恢复文件（通过 /proc/<pid>/fd/<fd>）
cat /proc/1234/fd/5 > /var/log/nginx/access.log.recovered

# 3. 或者直接清理（让进程重新创建文件）
# 先 kill -USR1 nginx 让它重新打开日志文件
kill -USR1 $(cat /var/run/nginx.pid)
```

### 查看用户活动

```bash
# 查看某个用户的所有活动
lsof -u username

# 查看某个用户打开的网络连接
lsof -u username -i

# 查看某个用户打开的文件（排除库文件）
lsof -u username | grep -v "\.so"

# 查看所有进程的终端
lsof | grep tty

# 查看所有进程的标准输出/错误重定向
lsof | grep -E "1w|2w"

# 查看所有进程的管道
lsof | grep FIFO

# 查看所有进程的 Unix Socket
lsof -U

# 查看所有进程的 IPv4/IPv6 连接
lsof -i 4
lsof -i 6
```

### 常见排查场景

```bash
# 场景1: 端口被占用
lsof -i :8080
# COMMAND   PID   USER   FD   TYPE  DEVICE SIZE/OFF NODE NAME
# java     1234  app    45u  IPv6  12345      0t0  TCP *:8080 (LISTEN)

# 场景2: 文件被占用无法删除/卸载
lsof /mnt/data
# 找到占用文件的进程后 kill 或 stop

# 场景3: 磁盘空间不足但文件已删除
lsof +L1
# +L1: 只显示 link count < 1 的文件（已删除但未释放）

# 场景4: 查看系统打开文件总数
lsof | wc -l
# 如果接近 ulimit -n 的限制，需要调大

# 场景5: 查看哪个进程使用了最多的文件描述符
lsof | awk '{print $2}' | sort | uniq -c | sort -rn | head
```

> **面试问答**：
> **Q: 磁盘空间满了但找不到大文件？**
> A: 可能是已删除的文件仍被进程占用（空间未释放）。使用 `lsof +L1` 或 `lsof | grep deleted` 找到这些文件，然后通过 `/proc/<pid>/fd/<n>` 恢复或 kill 进程释放空间。
