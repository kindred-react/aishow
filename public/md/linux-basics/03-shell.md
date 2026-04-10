# Shell 脚本基础

## 入门示例

```bash
#!/bin/bash

# 变量
name="Tom"
echo "Hello, $name"

# 数组
arr=(1 2 3 4 5)
echo ${arr[0]}

# 读取输入
read -p "请输入名字: " name

# 条件判断
if [ "$name" == "Tom" ]; then
    echo "Hello Tom"
elif [ "$name" == "Jim" ]; then
    echo "Hello Jim"
else
    echo "Unknown"
fi
```

## 循环

```bash
# for 循环
for i in {1..5}; do
    echo $i
done

for file in *.txt; do
    echo $file
done

# while 循环
count=0
while [ $count -lt 5 ]; do
    echo $count
    count=$((count + 1))
done

# 读取文件
while read line; do
    echo $line
done < file.txt
```

## 函数

```bash
# 定义函数
function greet() {
    echo "Hello, $1"
}

greet "Tom"

# 返回值
function get_sum() {
    echo $(($1 + $2))
}

result=$(get_sum 3 5)
echo $result  # 输出 8
```

## 字符串操作

```bash
str="Hello World"

# 长度
echo ${#str}

# 切片
echo ${str:0:5}      # Hello
echo ${str:6}        # World

# 替换
echo ${str/World/Tom}  # Hello Tom

# 截取
echo ${str#Hello}     #  World
echo ${str%World}     # Hello 
```

## 脚本实战

```bash
#!/bin/bash
# 批量重命名文件

for file in *.txt; do
    mv "$file" "backup_$file"
done

# 批量压缩日志
find /var/log -name "*.log" -mtime +7 -exec gzip {} \;

# 自动备份
#!/bin/bash
backup_dir="/backup"
date=$(date +%Y%m%d)
mysqldump -u root -p dbname > $backup_dir/db_$date.sql

# 监控服务
#!/bin/bash
if ! pgrep nginx > /dev/null; then
    echo "Nginx is down, restarting..."
    systemctl restart nginx
fi
```

## 常用工具

```bash
# curl 发送请求
curl -X GET "http://api.example.com/users"
curl -X POST "http://api.example.com/users" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tom"}'

# jq JSON处理
curl -s "http://api.example.com/users" | jq '.[0].name'

# sed 文本处理
sed -i 's/old/new/g' file.txt  # 替换
sed -n '1,10p' file.txt         # 1-10行

# awk 数据处理
awk -F',' '{print $1}' file.csv
awk '{sum+=$1} END {print sum}' numbers.txt
```

## 错误处理

```bash
#!/bin/bash

set -e  # 遇错退出
set -u  # 未定义变量报错
set -o pipefail  # 管道错误

# 捕获错误
trap 'echo "Error on line $LINENO"' ERR

# 检查文件存在
if [ ! -f "file.txt" ]; then
    echo "File not found"
    exit 1
fi

# 检查命令是否成功
command || { echo "Command failed"; exit 1; }
```
