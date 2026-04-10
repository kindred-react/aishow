# Docker和Linux命令与进阶知识点指南

> 适合5年经验开发者的实战手册

## 目录

- [Linux部分](#linux部分)
  - [基础命令](#基础命令)
  - [进阶知识点](#进阶知识点)
- [Docker部分](#docker部分)
  - [基础命令](#基础命令-1)
  - [进阶知识点](#进阶知识点-1)

---

## Linux部分

### 基础命令

#### 1. 文件和目录操作

```bash
# 基础操作
ls -lah                    # 详细列出文件，包括隐藏文件
cd -                       # 返回上一个目录
pwd                        # 显示当前路径
mkdir -p /path/to/dir      # 递归创建目录
rm -rf /path/to/dir        # 递归强制删除（谨慎使用）

# 文件查找和操作
find /path -name "*.log" -mtime +7    # 查找7天前的日志文件
locate filename                      # 快速查找文件（需要updatedb）
grep -r "pattern" /path              # 递归搜索文件内容
grep -i "error" /var/log/*.log        # 忽略大小写搜索

# 文件内容查看
tail -f /var/log/app.log             # 实时查看日志
tail -n 100 file.log                 # 查看最后100行
head -n 50 file.log                  # 查看前50行
less large_file.log                 # 分页查看大文件
```

#### 2. 进程管理

```bash
# 进程查看
ps aux | grep nginx                  # 查看nginx进程
top                                 # 实时进程监控
htop                                # 更友好的进程监控工具
pstree -p                           # 显示进程树

# 进程控制
kill -9 PID                         # 强制终止进程
kill -15 PID                        # 优雅终止进程
pkill -f "process_name"             # 按名称终止进程
pgrep -f "process_name"             # 按名称查找进程ID

# 后台任务
nohup command &                     # 后台运行，忽略挂起信号
jobs                                # 查看后台任务
fg %1                               # 将后台任务1调至前台
bg %1                               # 将后台任务1继续运行
```

#### 3. 网络操作

```bash
# 网络连接查看
netstat -tlnp                       # 查看监听端口
ss -tlnp                            # 更高效的netstat替代品
lsof -i :8080                       # 查看端口占用情况

# 网络测试
ping -c 4 google.com                # ping测试
curl -I https://example.com         # 查看HTTP头信息
wget -O output.txt URL              # 下载文件
telnet host port                    # 测试端口连通性

# 网络配置
ip addr show                        # 查看网络接口
ip route show                       # 查看路由表
ifconfig                            # 传统网络配置命令
```

#### 4. 系统监控

```bash
# 系统资源监控
free -h                            # 查看内存使用情况
df -h                              # 查看磁盘使用情况
du -sh /path/to/dir                # 查看目录大小
iostat -x 1                        # 实时IO监控（需要sysstat包）
vmstat 1                           # 虚拟内存统计

# 系统信息
uname -a                           # 系统详细信息
cat /proc/cpuinfo                  # CPU信息
cat /proc/meminfo                 # 内存详细信息
uptime                            # 系统运行时间和负载

# 日志查看
journalctl -u nginx -f            # 查看特定服务日志
journalctl --since "1 hour ago"   # 查看最近1小时日志
dmesg | tail                       # 查看内核消息
```

#### 5. 权限管理

```bash
# 权限修改
chmod 755 script.sh               # 设置文件权限
chmod +x script.sh                # 添加执行权限
chown user:group file.txt         # 修改文件所有者
chown -R user:group /path         # 递归修改目录所有者

# 用户和组管理
useradd -m -s /bin/bash username  # 创建用户
userdel -r username               # 删除用户及其家目录
groupadd groupname                # 创建组
usermod -aG groupname username    # 将用户添加到组
```

### 进阶知识点

#### 1. Shell脚本编程

```bash
#!/bin/bash

# 变量和数组
name="John"
array=("apple" "banana" "cherry")
echo ${array[0]}                  # 访问数组元素
echo ${array[@]}                  # 访问所有元素

# 条件判断
if [ -f "file.txt" ]; then
    echo "File exists"
elif [ -d "dir" ]; then
    echo "Directory exists"
else
    echo "Not found"
fi

# 循环
for i in {1..10}; do
    echo "Number: $i"
done

while read line; do
    echo "Line: $line"
done < file.txt

# 函数
function log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "Starting process"

# 错误处理
set -e                            # 遇到错误立即退出
set -u                            # 使用未定义变量时报错
set -o pipefail                   # 管道命令失败时退出

trap 'echo "Error occurred"; exit 1' ERR

# 参数处理
while getopts ":a:b:" opt; do
    case $opt in
        a) arg_a="$OPTARG" ;;
        b) arg_b="$OPTARG" ;;
        \?) echo "Invalid option: -$OPTARG" >&2 ;;
    esac
done
```

#### 2. 性能调优

```bash
# CPU性能分析
top -p PID                        # 监控特定进程
mpstat 1 5                        # CPU统计信息
sar -u 1 10                       # CPU使用率历史

# 内存分析
smem                              # 详细的内存使用分析
slabtop                           # 内核slab缓存统计
cat /proc/meminfo | grep -E "MemTotal|MemFree|Cached"

# IO性能分析
iostat -x 1 5                    # IO统计
iotop                            # IO使用情况监控
dd if=/dev/zero of=test bs=1M count=1000 conv=fdatasync  # 磁盘写入测试

# 网络性能
iftop                            # 网络流量监控
nethogs                          # 按进程显示网络使用
tcpdump -i eth0 -w capture.pcap  # 抓包分析

# 系统调优参数
echo 'vm.swappiness=10' >> /etc/sysctl.conf
echo 'net.core.somaxconn=1024' >> /etc/sysctl.conf
sysctl -p                        # 应用内核参数
```

#### 3. 系统安全配置

```bash
# 防火墙配置
ufw enable                        # 启用防火墙
ufw allow 22/tcp                 # 允许SSH端口
ufw deny 80                      # 拒绝HTTP端口
iptables -L -n                   # 查看iptables规则

# SSH安全配置
# /etc/ssh/sshd_config
PermitRootLogin no               # 禁止root登录
PasswordAuthentication no        # 禁用密码登录
Port 2222                        # 修改默认端口

# 文件权限加固
chmod 600 ~/.ssh/id_rsa          # 私钥权限
chmod 644 ~/.ssh/id_rsa.pub      # 公钥权限
find /var/www -type f -exec chmod 644 {} \;  # 设置文件权限
find /var/www -type d -exec chmod 755 {} \;  # 设置目录权限

# 日志审计
auditctl -w /etc/passwd -p wa -k passwd_mod  # 监控文件修改
ausearch -k passwd_mod           # 查看审计日志

# SELinux配置
getenforce                       # 查看SELinux状态
sestatus                         # 详细状态信息
setenforce 0                     # 临时禁用SELinux
```

#### 4. 系统服务管理

```bash
# Systemd服务管理
systemctl start nginx            # 启动服务
systemctl stop nginx             # 停止服务
systemctl restart nginx          # 重启服务
systemctl reload nginx           # 重新加载配置
systemctl enable nginx           # 开机自启
systemctl disable nginx          # 禁用开机自启
systemctl status nginx           # 查看服务状态

# 服务日志
journalctl -u nginx              # 查看服务日志
journalctl -u nginx -f          # 实时查看日志
journalctl -u nginx --since today  # 查看今天的日志

# 自定义服务
# /etc/systemd/system/custom-service.service
[Unit]
Description=Custom Service
After=network.target

[Service]
Type=simple
User=appuser
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 5. 磁盘和存储管理

```bash
# 磁盘分区和格式化
fdisk -l                         # 查看磁盘分区
parted /dev/sdb                  # 分区工具
mkfs.ext4 /dev/sdb1             # 格式化为ext4
mkfs.xfs /dev/sdb1              # 格式化为xfs

# 挂载和卸载
mount /dev/sdb1 /mnt/data        # 挂载分区
umount /mnt/data                 # 卸载分区
mount -t nfs server:/path /mnt   # 挂载NFS共享

# LVM逻辑卷管理
pvcreate /dev/sdb                # 创建物理卷
vgcreate vg01 /dev/sdb           # 创建卷组
lvcreate -L 10G -n lv01 vg01     # 创建逻辑卷
lvextend -L +5G /dev/vg01/lv01   # 扩展逻辑卷
resize2fs /dev/vg01/lv01        # 调整文件系统大小

# RAID配置
mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb1 /dev/sdc1
mdadm --detail /dev/md0          # 查看RAID详情
```

#### 6. 网络高级配置

```bash
# 网络桥接配置
brctl addbr br0                  # 创建网桥
brctl addif br0 eth0             # 添加接口到网桥
ip link set br0 up               # 启用网桥

# VLAN配置
ip link add link eth0 name eth0.100 type vlan id 100
ip addr add 192.168.100.1/24 dev eth0.100

# 静态路由配置
ip route add 192.168.2.0/24 via 192.168.1.1
ip route del default
ip route add default via 192.168.1.254

# 网络命名空间（容器化基础）
ip netns add ns1                 # 创建命名空间
ip netns exec ns1 ip addr        # 在命名空间中执行命令
ip link set veth1 netns ns1      # 将接口移动到命名空间

# 防火墙高级规则
iptables -A INPUT -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -m limit --limit 3/min -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
```

---

## Docker部分

### 基础命令

#### 1. 镜像管理

```bash
# 镜像搜索和拉取
docker search nginx              # 搜索镜像
docker pull nginx:latest         # 拉取最新版本
docker pull nginx:1.21           # 拉取指定版本

# 镜像查看和管理
docker images                    # 查看本地镜像
docker images -a                 # 查看所有镜像（包括中间层）
docker rmi nginx:latest          # 删除镜像
docker rmi $(docker images -q -f dangling=true)  # 删除悬空镜像

# 镜像构建
docker build -t myapp:v1.0 .     # 构建镜像
docker build -f Dockerfile.prod -t myapp:prod .
docker build --build-arg VERSION=1.0 -t myapp .

# 镜像导出和导入
docker save -o myapp.tar myapp:v1.0    # 导出镜像
docker load -i myapp.tar               # 导入镜像
```

#### 2. 容器操作

```bash
# 容器创建和启动
docker run -d --name mynginx -p 80:80 nginx
docker run -it --rm ubuntu bash        # 交互式运行，退出后删除
docker run -v /host/path:/container/path nginx  # 挂载卷

# 容器管理
docker ps                          # 查看运行中的容器
docker ps -a                       # 查看所有容器
docker start mynginx               # 启动容器
docker stop mynginx                # 停止容器
docker restart mynginx             # 重启容器
docker rm mynginx                  # 删除容器
docker rm -f $(docker ps -aq)      # 强制删除所有容器

# 容器信息查看
docker logs mynginx                # 查看容器日志
docker logs -f mynginx             # 实时查看日志
docker logs --tail 100 mynginx     # 查看最后100行
docker inspect mynginx             # 查看容器详细信息
docker stats mynginx               # 查看资源使用情况
docker top mynginx                 # 查看容器进程
```

#### 3. 网络管理

```bash
# 网络查看和创建
docker network ls                  # 查看网络
docker network create mynet        # 创建自定义网络
docker network rm mynet            # 删除网络

# 网络连接
docker network connect mynet mynginx    # 连接容器到网络
docker network disconnect mynet mynginx  # 断开网络连接

# 网络模式
docker run --network=bridge nginx       # 桥接网络（默认）
docker run --network=host nginx         # 主机网络
docker run --network=none nginx         # 无网络
docker run --network=mynet nginx        # 自定义网络
```

#### 4. 存储管理

```bash
# 数据卷管理
docker volume ls                  # 查看数据卷
docker volume create mydata        # 创建数据卷
docker volume rm mydata            # 删除数据卷
docker volume prune               # 清理未使用的卷

# 数据卷使用
docker run -v mydata:/data nginx  # 使用命名卷
docker run -v /host/path:/container/path nginx  # 使用绑定挂载
docker run --mount type=volume,source=mydata,target=/data nginx

# 数据卷备份和恢复
docker run --rm -v mydata:/data -v $(pwd):/backup alpine tar czf /backup/backup.tar /data
docker run --rm -v mydata:/data -v $(pwd):/backup alpine tar xzf /backup/backup.tar -C /
```

#### 5. 容器交互

```bash
# 进入容器
docker exec -it mynginx bash      # 进入容器shell
docker exec mynginx cat /etc/nginx/nginx.conf  # 在容器中执行命令

# 文件传输
docker cp localfile mynginx:/path/    # 复制文件到容器
docker cp mynginx:/path/file .       # 从容器复制文件

# 容器导出和导入
docker export mynginx > mynginx.tar   # 导出容器
docker import mynginx.tar mynginx:latest  # 导入为镜像
```

### 进阶知识点

#### 1. Dockerfile最佳实践

```dockerfile
# 多阶段构建示例
# 构建阶段
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# 优化技巧
# 1. 使用更小的基础镜像
FROM alpine:3.18
FROM node:18-slim

# 2. 合并RUN指令
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    git && \
    rm -rf /var/lib/apt/lists/*

# 3. 利用构建缓存
COPY package.json package-lock.json ./
RUN npm install
COPY . .

# 4. 多阶段构建减少镜像大小
# 如上所示

# 5. 使用.dockerignore
node_modules
npm-debug.log
.git
.env
```

#### 2. Docker Compose实战

```yaml
# docker-compose.yml
# version 字段在 Docker Compose V2 中已废弃，可省略

services:
  webapp:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        VERSION: 1.0
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    volumes:
      - ./app:/usr/share/nginx/html
      - app_logs:/var/log/nginx
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secretpassword
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app-network

volumes:
  db_data:
  redis_data:
  app_logs:

networks:
  app-network:
    driver: bridge
```

```bash
# Docker Compose命令（V2 语法：docker compose，替代旧版 docker-compose）
docker compose up -d              # 后台启动服务
docker compose down               # 停止并删除容器
docker compose down -v            # 停止并删除卷
docker compose ps                 # 查看服务状态
docker compose logs -f webapp     # 查看服务日志
docker compose exec webapp bash   # 进入服务容器
docker compose restart webapp     # 重启服务
docker compose scale webapp=3     # 扩展服务实例
docker compose config             # 验证配置文件
```

#### 3. 容器监控和日志

```bash
# 容器监控
docker stats --no-stream          # 一次性查看资源使用
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" nginx

# 容器日志管理
docker logs --since 1h mynginx    # 查看最近1小时日志
docker logs --until 1h mynginx    # 查看1小时前的日志
docker logs -t mynginx            # 显示时间戳
docker logs --tail 1000 mynginx | grep "ERROR"  # 搜索错误日志

# 日志驱动配置
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# 容器健康检查
docker run --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=3 \
  nginx

docker inspect --format='{{.State.Health.Status}}' mynginx
```

#### 4. 容器安全加固

```bash
# 1. 使用非root用户运行
# Dockerfile
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# 2. 只读根文件系统
docker run --read-only --tmpfs /tmp nginx

# 3. 限制容器权限
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE nginx
docker run --security-opt=no-new-privileges nginx

# 4. 资源限制
docker run -m 512m --cpus="1.5" nginx
docker run --memory-swap=1g nginx

# 5. 网络隔离
docker run --network=none nginx
docker run --network=bridge --publish 8080:80 nginx

# 6. 镜像扫描
trivy image nginx:latest

# 7. 内容信任
export DOCKER_CONTENT_TRUST=1
docker pull nginx
```

#### 5. 容器编排和集群

```bash
# Docker Swarm初始化
docker swarm init --advertise-addr 192.168.1.100

# 节点管理
docker swarm join --token <token> 192.168.1.100:2377
docker node ls
docker node promote worker1
docker node demote manager1

# 服务部署
docker service create --name webapp --replicas 3 -p 80:80 nginx
docker service scale webapp=5
docker service update --image nginx:1.21 webapp
docker service rollback webapp

# Stack部署
docker stack deploy -c docker-compose.yml mystack
docker stack services mystack
docker stack ps mystack
docker stack rm mystack

# 服务发现
docker service create --name db --network mynet postgres
docker service create --name webapp --network mynet --env DB_HOST=db nginx
```

#### 6. 容器网络高级配置

```bash
# 自定义网络驱动
docker network create -d bridge --subnet 192.168.100.0/24 --gateway 192.168.100.1 mynet
docker network create -d overlay --attachable myoverlay

# 网络别名
docker run --network mynet --network-alias webapp nginx
docker run --network mynet --network-alias webapp nginx

# DNS配置
docker run --dns 8.8.8.8 --dns-search example.com nginx

# 端口映射
docker run -p 8080:80 nginx           # 主机8080映射到容器80
docker run -p 80:80 -p 443:443 nginx  # 多端口映射
docker run -p 127.0.0.1:8080:80 nginx # 只监听本地

# 负载均衡
docker service create --name webapp --replicas 3 -p 80:80 nginx
```

#### 7. 容器存储高级应用

```bash
# 卷驱动插件
docker volume create --driver local \
  --opt type=tmpfs \
  --opt device=tmpfs \
  --opt o=size=100m,uid=1000 \
  mytmpfs

# 备份和恢复策略
# 备份
docker run --rm \
  -v mydata:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mydata-$(date +%Y%m%d).tar.gz /data

# 恢复
docker run --rm \
  -v mydata:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mydata-20240101.tar.gz -C /

# 存储配额
docker run -m 1g --storage-opt size=2G nginx

# 卷快照（需要插件）
docker volume create --driver local --opt o=size=100G myvolume
```

#### 8. CI/CD集成

```yaml
# .gitlab-ci.yml 示例
stages:
  - build
  - test
  - deploy

build_image:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

test_image:
  stage: test
  script:
    - docker run $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA npm test

deploy_staging:
  stage: deploy
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:staging
    - docker push $CI_REGISTRY_IMAGE:staging
    - docker-compose -f docker-compose.staging.yml up -d
  only:
    - develop

deploy_production:
  stage: deploy
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker tag $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA $CI_REGISTRY_IMAGE:latest
    - docker push $CI_REGISTRY_IMAGE:latest
    - kubectl set image deployment/webapp webapp=$CI_REGISTRY_IMAGE:latest
  only:
    - main
```

#### 9. 故障排查和调试

```bash
# 容器故障排查
docker inspect mynginx | grep -A 10 "Mounts"
docker exec mynginx cat /etc/resolv.conf
docker exec mynginx netstat -tlnp

# 网络问题排查
docker network inspect mynet
docker exec mynginx ping db
docker exec mynginx curl -v http://db:5432

# 性能分析
docker run --rm --pid=host \
  --cap-add=SYS_PTRACE \
  --security-opt seccomp=unconfined \
  nicolaka/netshoot \
  perf top -p $(docker inspect -f '{{.State.Pid}}' mynginx)

# 资源使用分析
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
docker system df                    # 查看磁盘使用
docker system prune -a              # 清理未使用的资源

# 日志分析
docker logs mynginx 2>&1 | grep -i error
docker logs mynginx --since 1h | jq '.message'  # 如果日志是JSON格式
```

---

## 实用技巧和最佳实践

### Linux技巧

1. **命令历史和快捷键**
   - `Ctrl+R`: 搜索命令历史
   - `Ctrl+A/E`: 移动到行首/行尾
   - `Ctrl+U/K`: 删除到行首/行尾
   - `!!`: 重复上一条命令

2. **管道和重定向**
   - `command > file`: 输出重定向
   - `command >> file`: 追加输出
   - `command 2>&1 | tee file`: 同时输出到文件和屏幕
   - `command1 | command2`: 管道连接

3. **批量操作**
   - `for file in *.log; do gzip "$file"; done`
   - `find . -name "*.tmp" -delete`
   - `parallel gzip ::: *.log`

### Docker技巧

1. **镜像优化**
   - 使用多阶段构建
   - 选择合适的基础镜像
   - 清理不必要的文件
   - 利用构建缓存

2. **容器管理**
   - 使用健康检查
   - 设置资源限制
   - 配置日志轮转
   - 实现优雅关闭

3. **安全实践**
   - 扫描镜像漏洞
   - 使用非root用户
   - 限制容器权限
   - 定期更新镜像

---

## 总结

本指南涵盖了Linux和Docker的核心知识点，从基础命令到进阶应用，适合5年经验的开发者参考使用。在实际工作中，建议：

1. **持续学习**：关注新技术和最佳实践
2. **实践为主**：多动手操作，积累经验
3. **安全第一**：始终考虑安全因素
4. **性能优化**：关注系统性能和资源使用
5. **文档记录**：记录解决方案和经验教训

希望这份指南能帮助你更好地掌握Linux和Docker技术！

---

## Docker 镜像分层原理（⭐高频）

### 联合文件系统（UnionFS）

Docker 镜像的本质是一个**分层的联合文件系统**，多个只读层通过 UnionFS 叠加在一起，形成一个统一的文件系统视图。

```
Docker 镜像分层结构:

+---------------------------+
|     容器可写层 (RW)        |  <- 容器运行时的修改都在这一层
+---------------------------+
|     镜像层 3 (Read-only)   |  <- RUN apt-get install ...
+---------------------------+
|     镜像层 2 (Read-only)   |  <- COPY app.js .
+---------------------------+
|     镜像层 1 (Read-only)   |  <- FROM node:18-alpine
+---------------------------+

关键特性:
- 下层是只读的，只有最上层（容器层）可写
- 当容器需要修改下层文件时，会将其复制到可写层（Copy-on-Write）
- 多个容器可以共享同一个底层镜像
- 删除容器后，可写层也会被删除
```

### OverlayFS 详解

OverlayFS 是 Docker 目前默认的存储驱动（替代了早期的 AUFS）：

```
OverlayFS 结构:

Upper Dir (容器可写层)    Lower Dir (镜像只读层)
+------------------+     +------------------+
| 修改后的文件      |     | 原始文件          |
| 新增的文件        |     |                  |
+------------------+     +------------------+
          \                      /
           \                    /
            +------------------+
            |  Merged Dir      |  <- 容器看到的统一视图
            |  (合并后的结果)   |
            +------------------+

工作目录 (Work Dir):
- OverlayFS 的内部工作目录
- 用于准备文件在上下层之间的移动
```

```bash
# 查看镜像的分层信息
docker history nginx:latest
# IMAGE          CREATED       CREATED BY                                SIZE
# 605c77e024d8   2 weeks ago   /bin/sh -c #(nop) CMD ["nginx" "-g"...    0B
# <missing>      2 weeks ago   /bin/sh -c #(nop) EXPOSE 80               0B
# <missing>      2 weeks ago   /bin/sh -c #(nop) COPY file:...           5.61kB
# ...

# 查看容器的存储驱动信息
docker info | grep -i "storage driver"
# Storage Driver: overlay2

# 查看容器的联合挂载信息
cat /proc/mounts | grep overlay
# overlay on /var/lib/docker/overlay2/xxx/merged type overlay ...

# 查看 overlay2 层的数据目录
ls /var/lib/docker/overlay2/
# 每个目录对应一个层:
# <hash>-init/   -> 初始化层（白名单等）
# <hash>/        -> 数据层
```

### Copy-on-Write 机制

```
Copy-on-Write (写时复制) 工作流程:

场景1: 读取文件
容器读取 /etc/nginx/nginx.conf
    -> 先查 Upper Dir（可写层）
    -> 找不到 -> 查 Lower Dir（只读层）
    -> 找到 -> 直接读取（不需要复制）

场景2: 修改文件
容器修改 /etc/nginx/nginx.conf
    -> 先将文件从 Lower Dir 复制到 Upper Dir
    -> 在 Upper Dir 中修改
    -> Lower Dir 中的原始文件保持不变
    -> 容器看到的是 Upper Dir 中的修改版本

场景3: 删除文件
容器删除 /etc/nginx/nginx.conf
    -> 不是真正删除 Lower Dir 中的文件
    -> 在 Upper Dir 中创建一个 "whiteout" 文件（.wh.nginx.conf）
    -> 容器看到的是 whiteout 文件，表现为文件被删除
    -> Lower Dir 中的文件仍然存在
```

### 层缓存优化

```dockerfile
# ===== 优化前（构建慢，层缓存利用率低）=====
FROM node:18-alpine
WORKDIR /app
COPY . .                    # 任何文件变化都会使这一层缓存失效
RUN npm install              # 每次都要重新安装依赖
RUN npm run build

# ===== 优化后（利用层缓存）=====
FROM node:18-alpine
WORKDIR /app

# 先复制依赖文件（变化频率低）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev        # 依赖不变时直接使用缓存

# 再复制源代码（变化频率高）
COPY . .
RUN npm run build

# ===== 进一步优化 =====
# 1. 合并 RUN 指令减少层数
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# 2. 多阶段构建减少最终镜像大小
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# 最终镜像只有 nginx + 静态文件，没有 node_modules

# 3. 使用 .dockerignore 排除不需要的文件
# .dockerignore
node_modules
npm-debug.log
.git
.env
*.md
```

```bash
# 查看构建过程中每层的缓存命中情况
docker build --progress=plain -t myapp .

# 查看镜像的实际大小
docker images myapp
docker history myapp --no-trunc

# 清理构建缓存
docker builder prune
```

> **面试问答**：
> **Q: Docker 镜像为什么分层？有什么好处？**
> A: (1) **共享层**：多个镜像可以共享相同的底层，节省磁盘空间和传输时间；(2) **缓存加速**：构建时如果某一层没变，直接使用缓存，加快构建速度；(3) **并行下载**：拉取镜像时可以并行下载多个层。缺点是层数过多会增加管理开销。

---

## Docker 网络原理深入（⭐⭐中频）

### bridge 网络的 veth-pair

```
Docker 默认 bridge 网络的数据流向:

                    +------------------+
                    |   docker0 桥     |  (Linux Bridge, 相当于虚拟交换机)
                    |  172.17.0.1      |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                                 |
     +------+------+                   +------+------+
     | veth-xxx1   |                   | veth-xxx2   |
     | (容器端)     |                   | (容器端)     |
     +------+------+                   +------+------+
            |                                 |
     +------+------+                   +------+------+
     | eth0        |                   | eth0        |
     | 172.17.0.2  |                   | 172.17.0.3  |
     | 容器 A      |                   | 容器 B      |
     +-------------+                   +-------------+

veth-pair (Virtual Ethernet Pair):
- 总是成对出现的虚拟网络设备
- 一端在容器的 network namespace 中（显示为 eth0）
- 另一端在宿主机的 network namespace 中（挂在 docker0 桥上）
- 数据从一端进入，从另一端出来（类似一根虚拟网线）
```

```bash
# 查看宿主机上的 veth 设备
ip link show type veth
# veth1234abcd@if3: <BROADCAST,MULTICAST,UP> ...
# veth5678efgh@if3: <BROADCAST,MULTICAST,UP> ...

# 查看 docker0 桥上的设备
bridge fdb show docker0
brctl show

# 查看容器的网络命名空间
docker inspect -f '{{.NetworkSettings.SandboxKey}}' <container_id>
# /var/run/docker/netns/<id>

# 进入容器网络命名空间
nsenter -t <pid> -n ip addr
nsenter -t <pid> -n ip route
```

### iptables 转发原理

```
容器访问外部网络的数据流:

容器 A (172.17.0.2) -> 访问 8.8.8.8:53
    |
    v
eth0 (容器内) -> veth-pair -> docker0 桥
    |
    v
内核路由: 目标 IP 不在 docker0 网段 -> 转发到宿主机默认网关
    |
    v
iptables NAT (POSTROUTING chain):
  - MASQUERADE: 将源 IP 从 172.17.0.2 改为宿主机 IP
  - 这样外部服务器看到的是宿主机 IP，不知道容器的存在
    |
    v
宿主机网卡 -> 外部网络

外部访问容器端口映射的数据流:

外部客户端 -> 宿主机 IP:8080
    |
    v
iptables DNAT (PREROUTING chain):
  - 将目标地址从 宿主机IP:8080 改为 172.17.0.2:80
    |
    v
docker0 桥 -> veth-pair -> 容器 eth0
```

```bash
# 查看 Docker 创建的 iptables 规则
iptables -t nat -L -n

# 关键规则:
# 1. DNAT 规则（端口映射）
# -A DOCKER ! -i docker0 -p tcp -m tcp --dport 8080 -j DNAT --to-destination 172.17.0.2:80

# 2. MASQUERADE 规则（容器访问外部）
# -A POSTROUTING -s 172.17.0.0/16 ! -o docker0 -j MASQUERADE

# 3. FORWARD 规则（容器间通信）
# -A FORWARD -o docker0 -j ACCEPT
# -A FORWARD -i docker0 ! -o docker0 -j ACCEPT

# 查看 FORWARD 链
iptables -L FORWARD -n
```

### 四种网络模式对比

| 模式 | 说明 | 容器 IP | 网络隔离 | 适用场景 |
|------|------|---------|---------|---------|
| **bridge** | 默认模式，通过 veth-pair + docker0 桥通信 | 独立 IP | 同一 bridge 网络互通 | 大多数应用 |
| **host** | 容器直接使用宿主机网络 | 共享宿主机 IP | 无隔离 | 高性能网络需求 |
| **none** | 容器没有网络 | 无 | 完全隔离 | 安全敏感场景 |
| **container** | 共享另一个容器的网络 | 共享 | 与被共享容器一致 | Sidecar 模式 |

```bash
# bridge 模式（默认）
docker run -d --name app1 --network bridge nginx
docker run -d --name app2 --network mynet nginx  # 自定义 bridge

# host 模式
docker run -d --name app3 --network host nginx
# 容器直接使用宿主机的 80 端口，不需要 -p 映射

# none 模式
docker run -d --name app4 --network none alpine
# 容器没有网卡，只有 lo

# container 模式
docker run -d --name app5 --network container:app1 alpine
# app5 共享 app1 的网络命名空间

# 自定义 bridge 网络（推荐）
docker network create --driver bridge --subnet 172.20.0.0/16 mynet
docker run -d --name app6 --network mynet nginx
# 自定义 bridge 支持容器名 DNS 解析
# 默认 bridge 不支持容器名 DNS 解析（需要 --link，已废弃）
```

> **面试问答**：
> **Q: Docker 容器之间怎么通信？**
> A: (1) 同一 bridge 网络的容器通过 veth-pair + docker0 桥通信，使用容器 IP 或容器名（自定义 bridge 支持 DNS）；(2) 不同 bridge 网络的容器不能直接通信，需要通过端口映射到宿主机或使用第三方网络方案；(3) host 模式的容器直接共享宿主机网络，性能最好但无隔离。

---

## Kubernetes 核心概念（⭐高频）

### Pod 生命周期

```
Pod 生命周期状态:

Pending    -> Pod 已创建，但容器镜像正在拉取或调度中
Running    -> Pod 已绑定到节点，至少一个容器正在运行
Succeeded  -> 所有容器成功终止，不会重启
Failed     -> 所有容器已终止，至少一个容器失败退出
Unknown    -> 无法获取 Pod 状态（通常是与节点通信失败）

容器重启策略:
  Always:     容器退出后总是重启（默认，适合 Deployment）
  OnFailure:  容器非正常退出时才重启（适合 Job）
  Never:      容器退出后不重启（适合一次性任务）

Pod 探针:
  Liveness Probe:   存活探针，失败则重启容器
  Readiness Probe:  就绪探针，失败则从 Service Endpoints 中移除
  Startup Probe:    启动探针，用于慢启动容器（成功后才启用其他探针）

探测方式:
  httpGet:    HTTP 请求，返回 2xx/3xx 为成功
  tcpSocket:  TCP 连接成功为成功
  exec:       执行命令，返回 0 为成功
```

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  restartPolicy: Always
  containers:
  - name: myapp
    image: myapp:v1.0
    ports:
    - containerPort: 8080
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
    resources:
      requests:           # 最小资源保证
        cpu: "250m"       # 0.25 核
        memory: "128Mi"
      limits:             # 最大资源限制
        cpu: "500m"       # 0.5 核
        memory: "256Mi"
```

### Deployment（滚动更新、回滚）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
spec:
  replicas: 3                          # 副本数
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate                # 滚动更新策略
    rollingUpdate:
      maxSurge: 1                      # 更新时最多多出 1 个 Pod
      maxUnavailable: 0                # 更新时不允许有 Pod 不可用
  revisionHistoryLimit: 10             # 保留 10 个历史版本
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: myapp:v2.0              # 更新镜像版本触发滚动更新
        ports:
        - containerPort: 8080
```

```bash
# 滚动更新
kubectl set image deployment/myapp-deployment myapp=myapp:v2.0
kubectl rollout status deployment/myapp-deployment    # 查看更新状态

# 回滚
kubectl rollout history deployment/myapp-deployment   # 查看历史版本
kubectl rollout undo deployment/myapp-deployment      # 回滚到上一版本
kubectl rollout undo deployment/myapp-deployment --to-revision=2  # 回滚到指定版本

# 扩缩容
kubectl scale deployment/myapp-deployment --replicas=5
kubectl autoscale deployment/myapp-deployment --min=2 --max=10 --cpu-percent=80  # HPA
```

```
滚动更新过程 (replicas=3, maxSurge=1, maxUnavailable=0):

旧版本: [Pod1] [Pod2] [Pod3]
  |
  v  (创建新 Pod4)
旧版本: [Pod1] [Pod2] [Pod3]
新版本: [Pod4]
  |
  v  (Pod4 就绪后删除 Pod1)
旧版本:        [Pod2] [Pod3]
新版本: [Pod4]
  |
  v  (创建新 Pod5)
旧版本:        [Pod2] [Pod3]
新版本: [Pod4] [Pod5]
  |
  v  (Pod5 就绪后删除 Pod2)
旧版本:               [Pod3]
新版本: [Pod4] [Pod5]
  |
  v  (创建新 Pod6)
旧版本:               [Pod3]
新版本: [Pod4] [Pod5] [Pod6]
  |
  v  (Pod6 就绪后删除 Pod3)
新版本: [Pod4] [Pod5] [Pod6]
```

### Service（ClusterIP/NodePort/LoadBalancer）

```yaml
# ClusterIP（默认，集群内部访问）
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
  - port: 80           # Service 端口
    targetPort: 8080    # Pod 端口

---
# NodePort（通过节点端口访问）
apiVersion: v1
kind: Service
metadata:
  name: myapp-nodeport
spec:
  type: NodePort
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
    nodePort: 30080    # 节点端口（30000-32767）

---
# LoadBalancer（云厂商负载均衡器）
apiVersion: v1
kind: Service
metadata:
  name: myapp-lb
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
```

```
Service 工作原理:

Client -> Service (ClusterIP:80)
    |
    v
kube-proxy (iptables/IPVS 模式)
    |
    v
Endpoints (Pod1:8080, Pod2:8080, Pod3:8080)
    |
    v
负载均衡到后端 Pod

kube-proxy 三种模式:
1. userspace (已废弃): 在用户空间转发，性能差
2. iptables (默认): 使用 iptables 规则转发，O(n) 查找
3. ipvs (推荐): 使用内核 IPVS 模块，O(1) 查找，支持多种负载均衡算法
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: myapp-service
            port:
              number: 80
  - host: api.example.com
    http:
      paths:
      - path: /v1
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls-secret
```

```
Ingress vs Service:
- Service: L4 负载均衡（TCP/UDP），每个 Service 需要一个 LoadBalancer
- Ingress: L7 负载均衡（HTTP/HTTPS），一个 Ingress 可以路由到多个 Service
- Ingress Controller: 实际处理 Ingress 规则的组件（Nginx、Traefik 等）

流量路径:
外部请求 -> LoadBalancer -> Ingress Controller -> Ingress 规则匹配 -> Service -> Pod
```

### ConfigMap / Secret

```yaml
# ConfigMap - 存储非敏感配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  DATABASE_HOST: "db-service"
  CACHE_HOST: "redis-service"
  LOG_LEVEL: "info"
  app.properties: |
    server.port=8080
    spring.profiles.active=prod

---
# Secret - 存储敏感信息（Base64 编码，建议配合加密）
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=   # echo -n "password123" | base64
  API_KEY: YWJjZGVmMTIzNDU2

---
# 在 Pod 中使用
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  containers:
  - name: myapp
    image: myapp:v1.0
    envFrom:
    - configMapRef:
        name: myapp-config
    - secretRef:
        name: myapp-secret
    env:
    - name: SPECIAL_KEY
      valueFrom:
        configMapKeyRef:
          name: myapp-config
          key: DATABASE_HOST
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config
      readOnly: true
  volumes:
  - name: config-volume
    configMap:
      name: myapp-config
```

```bash
# 创建 ConfigMap
kubectl create configmap myapp-config --from-literal=LOG_LEVEL=debug
kubectl create configmap myapp-config --from-file=config.yaml

# 创建 Secret
kubectl create secret generic myapp-secret --from-literal=password=abc123
kubectl create secret generic myapp-secret --from-file=ssh-key=~/.ssh/id_rsa

# 查看
kubectl get configmaps
kubectl get secrets
kubectl describe configmap myapp-config
```

### HPA 自动扩缩容

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70     # CPU 使用率超过 70% 时扩容
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80     # 内存使用率超过 80% 时扩容
```

```bash
# 创建 HPA
kubectl autoscale deployment myapp-deployment --min=2 --max=10 --cpu-percent=70

# 查看 HPA 状态
kubectl get hpa
kubectl describe hpa myapp-hpa

# HPA 扩缩容决策流程:
# 1. Metrics Server 采集 Pod 的 CPU/内存使用率
# 2. HPA Controller 计算目标副本数
#    目标副本数 = ceil(当前副本数 * (当前使用率 / 目标使用率))
# 3. 如果目标副本数在 [minReplicas, maxReplicas] 范围内，执行扩缩容
# 4. 扩容冷却时间 3 分钟，缩容冷却时间 5 分钟
```

### K8s 网络模型（CNI）

```
K8s 网络基本要求:
1. 所有 Pod 之间可以直接通信（不需要 NAT）
2. 所有 Node 和所有 Pod 之间可以直接通信（不需要 NAT）
3. Pod 看到自己的 IP 与其他 Pod 看到它的 IP 一致

常见 CNI 插件:

| CNI 插件 | 网络模式 | 特点 |
|----------|---------|------|
| Flannel | VXLAN/HostGW | 简单易用，适合中小规模 |
| Calico | BGP/VXLAN | 支持网络策略，性能好 |
| Cilium | eBPF | 高性能，支持高级网络策略 |
| Weave Net | VXLAN | 自动发现，加密通信 |

Service 通信:
- ClusterIP: kube-proxy (iptables/IPVS) 实现
- 跨 Node Pod 通信: CNI 插件实现（Overlay 或路由模式）

DNS:
- CoreDNS 提供集群内 DNS 服务
- Service 自动注册 DNS: <service-name>.<namespace>.svc.cluster.local
- Pod 自动注册 DNS: <pod-ip>.<namespace>.pod.cluster.local
```

### K8s 调度

```
调度流程:

Pod 创建请求
    |
    v
Scheduler:
  1. 预选 (Filtering): 排除不满足条件的节点
     - PodFitsResources: 节点资源是否足够
     - PodFitsHostPorts: 节点端口是否冲突
     - MatchNodeSelector: 是否匹配 nodeSelector
     - NoDiskConflict: 存储是否有冲突
     - TaintToleration: 是否容忍节点污点

  2. 优选 (Scoring): 给通过预选的节点打分
     - NodeAffinity: 节点亲和性
     - PodAffinity: Pod 亲和性
     - PodAntiAffinity: Pod 反亲和性
     - 资源均衡: CPU/内存使用率
     - 镜像本地性: 镜像是否已在节点上

  3. 绑定 (Binding): 选择得分最高的节点
```

```yaml
# nodeSelector: 简单的节点选择
spec:
  nodeSelector:
    disktype: ssd

# NodeAffinity: 高级节点亲和性
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/arch
            operator: In
            values: ["amd64"]
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80
        preference:
          matchExpressions:
          - key: disktype
            operator: In
            values: ["ssd"]

# PodAntiAffinity: Pod 反亲和性（分散部署）
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchLabels:
            app: myapp
        topologyKey: kubernetes.io/hostname
      # 确保同一个主机上只有一个 myapp Pod

# Taint/Toleration: 污点与容忍
# 给节点添加污点
kubectl taint nodes node1 dedicated=gpu:NoSchedule
# Pod 设置容忍
spec:
  tolerations:
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"
```

### Docker vs K8s 定位差异

| 维度 | Docker | Kubernetes |
|------|--------|-----------|
| **定位** | 容器运行时 | 容器编排平台 |
| **管理范围** | 单机容器 | 集群级别的容器管理 |
| **核心功能** | 构建、运行容器 | 调度、扩缩容、服务发现、负载均衡 |
| **高可用** | 需要手动实现 | 内置自愈、滚动更新、回滚 |
| **网络** | 单机 bridge 网络 | CNI 跨节点网络、Service、Ingress |
| **存储** | Volume 挂载 | PV/PVC 抽象、StorageClass |
| **配置管理** | 环境变量、配置文件 | ConfigMap、Secret |
| **适用场景** | 开发测试、单机部署 | 生产环境、大规模集群 |

```
关系总结:

Docker: 解决"如何打包和运行应用"的问题
K8s:    解决"如何在大规模集群中管理和编排容器"的问题

K8s 不直接依赖 Docker:
- K8s 通过 CRI (Container Runtime Interface) 与容器运行时交互
- 支持 containerd、CRI-O 等多种运行时
- Docker 作为容器运行时的角色已被 containerd 替代（Docker Engine 仍可用于构建镜像）

架构层次:
应用 -> Docker 镜像 -> K8s Pod -> K8s Service -> K8s Ingress -> 用户
         (打包)        (调度)      (服务发现)    (路由)
```

> **面试问答**：
> **Q: Docker 和 Kubernetes 是什么关系？**
> A: Docker 是容器引擎，负责构建和运行容器；Kubernetes 是容器编排平台，负责在集群中管理和调度容器。Docker 解决"如何运行应用"，K8s 解决"如何在大规模集群中管理应用"。K8s 通过 CRI 接口支持多种容器运行时（containerd、CRI-O 等），不直接依赖 Docker。

> **Q: K8s 中 Pod 为什么要设计出来？为什么不直接操作容器？**
> A: (1) Pod 是 K8s 最小调度单位，一个 Pod 可以包含多个容器，它们共享网络和存储，适合紧密耦合的应用（如 sidecar 模式）；(2) Pod 提供了统一的抽象层，屏蔽底层容器运行时的差异；(3) Pod 级别的探针、资源限制、生命周期管理比容器级别更合理。