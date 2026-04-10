# 08 AWS 核心服务

## 8.1 AWS 概述

### 8.1.1 AWS Global Infrastructure
```
AWS
├── Region（区域）：物理隔离的数据中心集群
│   ├── us-east-1（弗吉尼亚北部）—— 最大、服务最多
│   ├── us-east-2（俄亥俄）
│   ├── us-west-2（俄勒冈）
│   ├── eu-west-1（爱尔兰）
│   ├── ap-southeast-1（新加坡）
│   ├── ap-northeast-1（东京）
│   ├── cn-north-1（北京）
│   └── cn-northwest-1（宁夏）
│       （截至 2024 年底，全球共 34 个 Region）
├── Availability Zone（可用区）：区域内独立的数据中心
│   ├── us-east-1a
│   ├── us-east-1b
│   └── us-east-1c
│       （每个 Region 通常 3-6 个 AZ）
├── Local Zone（本地区域）：靠近大城市，低延迟
│   └── 例如 us-east-2-dfw-1（达拉斯）
├── Wavelength（5G 边缘）：部署在运营商数据中心
└── Edge Location（边缘节点）：CloudFront CDN
        （全球 600+ 个边缘节点）
```

**Region 选择原则：**

| 因素 | 说明 |
|------|------|
| 合规要求 | 数据主权法规（如 GDPR、中国网络安全法） |
| 延迟 | 选择离用户最近的 Region |
| 服务可用性 | 并非所有服务都在所有 Region 提供 |
| 成本 | 不同 Region 价格不同 |
| 灾备 | 主备 Region 至少相隔 500 英里 |

### 8.1.2 AWS 账号与组织

**AWS 账号体系：**

```
AWS Organizations（组织）
├── 管理账户（Management Account）
│   ├── 组织单元（OU）：开发环境
│   │   ├── 账号：dev-app
│   │   └── 账号：dev-data
│   ├── 组织单元（OU）：生产环境
│   │   ├── 账号：prod-app
│   │   └── 账号：prod-data
│   └── 组织单元（OU）：沙箱
│       └── 账号：sandbox
```

**核心概念详解：**

| 概念 | 说明 | 最佳实践 |
|------|------|---------|
| **Root Account（根账户）** | 创建 AWS 时的主账户，拥有所有权限 | 仅用于创建组织和管理账户，日常不使用 |
| **IAM User（IAM 用户）** | 根账户或 IAM 下的长期凭证用户 | 通过 IAM 管理所有用户，不使用 Root |
| **IAM Group（用户组）** | 将多个用户归组，批量管理权限 | 按角色分组（如 Developers、Admins） |
| **IAM Role（角色）** | 临时凭证，用于跨账号或服务间授权 | EC2/Lambda 等服务使用 Role 而非 Access Key |
| **AWS Organization（组织）** | 集中管理多个 AWS 账号 | 使用 Consolidated Billing（合并计费）节省成本 |
| **OU（组织单元）** | 组织内的逻辑分组 | 按环境/业务线划分 OU |
| **SCP（服务控制策略）** | 组织级别的权限边界 | 限制 OU 下的账号可使用的服务和区域 |

**多账号策略最佳实践：**

```
1. 按环境分离：dev / staging / prod 各一个账号
2. 按工作负载分离：每个核心业务一个账号
3. 集中日志账号：所有账号的 CloudTrail 日志发送到集中账号
4. 安全账号：集中管理 GuardDuty、Security Hub
5. 网络账号：集中管理 Transit Gateway、Direct Connect
```

## 8.2 计算服务

### 8.2.1 EC2（Elastic Compute Cloud）

**EC2** 是 AWS 最基础的云计算服务，提供可弹性伸缩的虚拟服务器。你可以像使用物理服务器一样使用 EC2，但可以按需启动、停止、扩展。

**EC2 实例生命周期：**

```
pending → running → stopping → stopped → terminating
              ↕
           rebooting

- pending：实例正在启动
- running：实例正在运行（计费中）
- stopping：实例正在停止
- stopped：实例已停止（不产生计算费用，EBS 照常收费）
- terminated：实例已终止（无法恢复，EBS 默认删除）
```

#### EC2 实例类型（2024-2025 最新）

| 类型 | 前缀 | 适用场景 | 最新一代 |
|------|------|---------|---------|
| 通用型 | t3, **m7i**, m7i-flex | Web 应用、开发环境、微服务 | m7i（Intel 4代）、m7i-flex |
| 计算优化 | **c7i**, c7g, c7gn | CPU 密集型、批处理、分布式分析 | c7i（Intel 4代）、c7g（Graviton3） |
| 内存优化 | **r7i**, x2iegd, z1d | 数据库、缓存、内存中分析 | r7i（Intel 4代）、x2iegd |
| 存储优化 | **im7i**, is4gen, d3en | 高频读写、大数据、数据仓库 | im7i（NVMe 本地存储） |
| GPU 通用 | **g5**, g6, g6e | 机器学习推理、视频转码、远程工作站 | g6（NVIDIA L4）、g6e（NVIDIA L40S） |
| GPU 训练 | **p5**, p5e, p4d | 深度学习训练、HPC | p5e（NVIDIA H200）、p5（H100） |
| AI 推理 | **inf2**, inf4, trn1 | 大模型推理、生成式 AI | inf2（Inferentia2）、trn1（Trainium） |
| Graviton | **c7g, m7g, r7g, x7g** | 高性价比、ARM 架构 | Graviton4（2024 发布） |

**Graviton 处理器优势：**

```
AWS Graviton（ARM 架构自研芯片）
├── Graviton2 → 最佳性价比，广泛使用
├── Graviton3 → 性能提升 25%，能效提升 60%
├── Graviton4 → 2024 年发布，性能再提升 30%
│
├── 优势：
│   - 比 Intel/AMD 同等实例便宜 20-40%
│   - 更好的能效比
│   - 支持大多数 Linux 工作负载
│
└── 注意事项：
    - Windows 支持有限
    - 部分商业软件不支持 ARM
    - 需要重新编译或使用兼容镜像
```

#### EC2 关键概念
- **AMI**（Amazon Machine Image）：镜像模板，包含 OS + 软件 + 配置
- **EBS**（Elastic Block Store）：块存储卷，挂载到 EC2 实例
- **Security Group**：虚拟防火墙，实例级别的入站/出站规则
- **Key Pair**：SSH 密钥对，用于登录 Linux 实例
- **User Data**：实例启动时自动执行的脚本（cloud-init）
- **IMDSv2**（Instance Metadata Service v2）：实例元数据查询，v2 更安全（防 SSRF）
- **ENI**（Elastic Network Interface）：弹性网络接口，可绑定多个 IP

**EC2 User Data 示例（启动脚本）：**

```bash
#!/bin/bash
# EC2 User Data 示例：启动时自动安装 Nginx 并配置

# 更新系统
yum update -y

# 安装 Nginx
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# 配置 Nginx
cat > /usr/share/nginx/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>EC2 Instance</title></head>
<body>
<h1>Hello from EC2!</h1>
<p>Instance ID: <span id="instance-id"></span></p>
<p>Availability Zone: <span id="az"></span></p>
<script>
  // 通过 IMDSv2 获取实例元数据
  fetch('http://169.254.169.254/latest/meta-data/instance-id')
    .then(r => r.text())
    .then(id => document.getElementById('instance-id').textContent = id);
  fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
    .then(r => r.text())
    .then(az => document.getElementById('az').textContent = az);
</script>
</body>
</html>
EOF

# 安装 CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
```

#### EC2 选购策略
| 选项 | 特点 | 适用场景 |
|------|------|---------|
| On-Demand | 按需付费，按秒计费 | 不可预测的工作负载、短期任务 |
| Reserved (RI) | 1-3年预留，最高72%折扣 | 稳定、可预测的长期工作负载 |
| Spot | 竞价实例，最高90%折扣 | 可中断的批处理、CI/CD、数据分析 |
| Savings Plans | 承诺用量（$/hr），灵活折扣 | 混合工作负载，跨实例类型 |
| Dedicated Hosts | 专用物理服务器 | 合规要求（License 移植性） |

**EC2 启动模板（Launch Template）示例：**

```bash
# 使用 AWS CLI 创建 Launch Template
aws ec2 create-launch-template \
    --launch-template-name "web-app-template" \
    --launch-template-data '{
        "ImageId": "ami-0abcdef1234567890",
        "InstanceType": "m7i.xlarge",
        "KeyName": "my-key-pair",
        "SecurityGroupIds": ["sg-0123456789abcdef0"],
        "SubnetId": "subnet-0123456789abcdef0",
        "IamInstanceProfile": {
            "Name": "ec2-web-role"
        },
        "UserData": "'$(base64 -w0 user-data.sh)'",
        "TagSpecifications": [
            {
                "ResourceType": "instance",
                "Tags": [
                    {"Key": "Name", "Value": "web-app"},
                    {"Key": "Environment", "Value": "production"}
                ]
            }
        ],
        "MetadataOptions": {
            "HttpTokens": "required",
            "HttpEndpoint": "enabled"
        }
    }'
```

### 8.2.2 Lambda（Serverless 计算）

**Lambda** 是 AWS 的 Serverless 计算服务，无需管理服务器，按代码执行次数和时长付费。事件驱动模型，响应各种 AWS 服务事件。

**Lambda 核心特性：**

| 特性 | 说明 |
|------|------|
| 计费模型 | 按请求次数（$0.20/百万次）+ 执行时长（按 ms 计费） |
| 冷启动 | 首次调用或长时间未调用后，需要初始化执行环境（100ms-数秒） |
| 执行时长 | 最长 15 分钟 |
| 内存配置 | 128MB - 10,240MB（同时影响 CPU 和网络带宽） |
| 并发限制 | 账号级别默认 1,000 并发（可申请提升） |
| 部署包 | 最大 250MB（zip），或使用容器镜像最大 10GB |
| 运行时 | Python、Node.js、Java、Go、.NET、Ruby、自定义运行时 |

**Lambda 冷启动优化：**

```
冷启动过程：
1. 下载代码/容器镜像
2. 初始化运行时环境
3. 执行初始化代码（全局变量、模块导入）
4. 执行 Handler 函数

优化策略：
├── 1. 预置并发（Provisioned Concurrency）
│   - 提前初始化执行环境，消除冷启动
│   - 适合生产环境、延迟敏感场景
│   - 按预置并发数和时长收费
│
├── 2. 减少初始化时间
│   - 减少依赖包大小
│   - 延迟加载非必要模块
│   - 使用 Lambda Layers 共享依赖
│
├── 3. 保持函数温暖
│   - 使用 EventBridge 定时触发（每 5 分钟）
│   - 适合非关键场景的低成本方案
│
├── 4. 选择轻量运行时
│   - Node.js / Python 冷启动快于 Java / .NET
│   - Java 可使用 GraalVM Native Image
│
└── 5. 使用 SnapStart（Java 专用）
    - Java 17+ 的快照启动功能
    - 初始化快照后直接恢复，冷启动降至 ~200ms
```

**Lambda 函数示例（Python）：**

```python
# lambda_function.py
import json
import boto3
import os
from datetime import datetime

# 全局变量（冷启动时初始化，后续调用复用）
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    """
    Lambda Handler - 处理 API Gateway 请求
    """
    http_method = event['httpMethod']
    path = event['path']

    try:
        if http_method == 'GET' and path == '/items':
            return get_items()
        elif http_method == 'POST' and path == '/items':
            return create_item(json.loads(event['body']))
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({'message': 'Not Found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_items():
    """查询所有项目"""
    response = table.scan()
    return {
        'statusCode': 200,
        'body': json.dumps(response['Items'])
    }

def create_item(item):
    """创建新项目"""
    item['created_at'] = datetime.utcnow().isoformat()
    table.put_item(Item=item)
    return {
        'statusCode': 201,
        'body': json.dumps({'message': 'Item created', 'item': item})
    }
```

#### Lambda 触发器

| 触发源 | 类型 | 说明 |
|--------|------|------|
| **API Gateway** | 同步 | REST/HTTP API 触发，Web 应用后端 |
| **S3** | 异步 | 对象上传/删除事件，图片处理、ETL |
| **DynamoDB Streams** | 异步 | 数据变更流，触发下游处理 |
| **Kinesis** | 异步 | 实时数据流处理 |
| **SQS** | 异步 | 消息队列消费，解耦处理 |
| **SNS** | 异步 | 发布/订阅通知 |
| **EventBridge** | 异步 | 事件总线，定时任务（Cron）、事件路由 |
| **CloudWatch Logs** | 异步 | 日志处理、告警 |
| **CloudFront** | 异步 | CDN 边缘函数（Lambda@Edge） |

**Lambda + API Gateway 部署示例：**

```bash
# 使用 AWS SAM 部署 Lambda
# template.yaml
sam deploy --template-file template.yaml --stack-name my-api --capabilities CAPABILITY_IAM

# 或使用 AWS CLI 直接创建
aws lambda create-function \
    --function-name my-api-handler \
    --runtime python3.12 \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://function.zip \
    --role arn:aws:iam::123456789012:role/lambda-execution-role \
    --environment Variables={TABLE_NAME=my-table} \
    --memory-size 256 \
    --timeout 30

# 配置预置并发（消除冷启动）
aws lambda put-provisioned-concurrency-config \
    --function-name my-api-handler \
    --provisioned-concurrent-executions 5
```

### 8.2.3 ECS（Elastic Container Service）

**ECS** 是 AWS 原生的容器编排服务，支持 Docker 容器，有两种启动模式：Fargate（无服务器）和 EC2（自管理）。

**ECS 核心概念：**

```
ECS 架构：
┌─────────────────────────────────────────────┐
│                  ECS Cluster                │
│                                             │
│  ┌─────────────┐  ┌─────────────┐          │
│  │ ECS Service │  │ ECS Service │          │
│  │ (web-app)   │  │ (api-gw)    │          │
│  │             │  │             │          │
│  │ ┌---------┐ │  │ ┌---------┐ │          │
│  │ │  Task 1 │ │  │ │  Task 1 │ │          │
│  │ └---------┘ │  │ └---------┘ │          │
│  │ ┌---------┐ │  │ ┌---------┐ │          │
│  │ │  Task 2 │ │  │ │  Task 2 │ │          │
│  │ └---------┘ │  │ └---------┘ │          │
│  └─────────────┘  └─────────────┘          │
│                                             │
│  启动类型：                                  │
│  ├── Fargate：无服务器，按 vCPU+内存计费     │
│  └── EC2：在 EC2 实例上运行，更灵活          │
└─────────────────────────────────────────────┘

关键概念：
- Task Definition：任务定义（类似 Docker Compose）
- Task：任务（运行中的容器实例）
- Service：服务（管理多个 Task 的生命周期）
- Cluster：集群（一组 ECS 资源的逻辑分组）
```

**ECS Task Definition 示例：**

```json
{
  "family": "web-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "web-app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/web-app:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "SPRING_PROFILES_ACTIVE", "value": "production"},
        {"name": "DB_HOST", "value": "prod-db.xxxxxxx.us-east-1.rds.amazonaws.com"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password-xxxxx"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/web-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

**ECS vs Fargate vs EKS 对比：**

| 维度 | ECS (EC2) | ECS (Fargate) | EKS |
|------|-----------|---------------|-----|
| 服务器管理 | 需要管理 EC2 | 无需管理 | 无需管理（Fargate）或自管理 |
| 调度 | AWS 调度器 | AWS 调度器 | Kubernetes |
| 学习曲线 | 低 | 最低 | 高 |
| 灵活性 | 中 | 中 | 高 |
| 成本 | 低 | 中 | 高 |
| 适用场景 | 简单容器化应用 | 无服务器容器 | 复杂微服务、K8s 生态 |

### 8.2.4 EKS（Elastic Kubernetes Service）

**EKS** 是 AWS 托管的 Kubernetes 服务，自动管理控制平面（API Server、etcd 等），你只需管理工作节点。

**EKS 核心架构：**

```
EKS 集群架构：
┌─────────────────────────────────────────────────┐
│              EKS Control Plane（托管）            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │API Server│  │  etcd    │  │Scheduler │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│  ┌──────────┐  ┌──────────┐                     │
│  │Controller│  │  Cloud   │                     │
│  │  Manager │  │ Controller│                     │
│  └──────────┘  └──────────┘                     │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────+────┐ ┌────+────┐ ┌────+────┐
   │Node Group│ │Node Group│ │Fargate  │
   │ (EC2)   │ │ (EC2)   │ │ Profile │
   │ m7i.xl  │ │ c7i.xl  │ │ (Serverless)│
   └─────────┘ └─────────┘ └─────────┘
```

**EKS 部署示例：**

```bash
# 1. 创建 EKS 集群（使用 eksctl）
eksctl create cluster \
    --name my-cluster \
    --region us-east-1 \
    --version 1.29 \
    --managed \
    --nodegroup-name standard-workers \
    --node-type m7i.xlarge \
    --nodes 3 \
    --nodes-min 2 \
    --nodes-max 10 \
    --node-ami-family AmazonLinux2023

# 2. 配置 kubectl
aws eks update-kubeconfig --region us-east-1 --name my-cluster

# 3. 部署示例应用
cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  labels:
    app: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: 123456789012.dkr.ecr.us-east-1.amazonaws.com/web-app:latest
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
spec:
  type: LoadBalancer
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 8080
EOF

# 4. 使用 Karpenter 自动扩缩容（替代 Cluster Autoscaler）
kubectl apply -f https://raw.githubusercontent.com/aws/karpenter/main/examples/quickstart/default.yaml
```

## 8.3 存储服务

### 8.3.1 S3（Simple Storage Service）

**S3** 是 AWS 的对象存储服务，提供无限容量、99.999999999%（11 个 9）的数据持久性，是 AWS 最常用的存储服务。

**S3 核心特性：**

- 无限存储容量
- 99.999999999% 数据持久性（11 个 9）
- 99.99% 可用性（Standard）
- 支持版本控制、生命周期策略、加密
- 支持 CORS、预签名 URL
- 事件通知（S3 Event → SNS/SQS/Lambda）

#### S3 存储类别

| 类别 | 可用性 | 最低存储天数 | 检索费用 | 适用场景 |
|------|--------|------------|---------|---------|
| **S3 Standard** | 99.99% | 无 | 无 | 热数据、频繁访问 |
| **S3 Express One Zone** | 99.95% | 无 | 无 | 需要极低延迟的频繁访问（单 AZ） |
| **S3 Intelligent-Tiering** | 99.9% | 无 | 无（自动监控） | 访问模式不确定的数据 |
| **S3 Standard-IA** | 99.9% | 30 天 | 按检索量 | 不频繁访问（每月几次） |
| **S3 One Zone-IA** | 99.5% | 30 天 | 按检索量 | 可容忍 AZ 级故障的不频繁数据 |
| **S3 Glacier Instant** | 99.9% | 90 天 | 毫秒级检索 | 归档数据，偶尔需要快速访问 |
| **S3 Glacier Flexible** | 99.99% | 90 天 | 分钟-小时 | 长期归档 |
| **S3 Glacier Deep Archive** | 99.99% | 180 天 | 12-48 小时 | 合规归档，极少访问 |

**S3 Express One Zone（2023 年发布）：**

```
S3 Express One Zone 特点：
├── 单 AZ 存储（非跨 AZ 复制）
├── 数据访问延迟降低 30-50%
├── 吞吐量提升 10 倍
├── 请求成本降低 50%
├── 支持目录桶（Directory Bucket）
├── 自动分区，支持百万级 QPS
│
└── 适用场景：
    - 机器学习训练数据集
    - 大数据分析
    - 高性能计算（HPC）
    - 实时数据处理
```

#### S3 关键概念
- **Bucket**：存储桶，全局唯一命名（如 my-bucket-12345）
- **Object**：对象（Key + Value + Metadata + Version ID）
- **前缀（Prefix）**：类似文件夹的概念（如 images/2024/）
- **生命周期策略**：自动转换存储类别或过期删除
- **版本控制**：对象版本管理，可回滚到历史版本
- **加密**：SSE-S3（AWS 托管密钥）、SSE-KMS（KMS 密钥）、SSE-C（自提供密钥）
- **预签名 URL**：临时授权访问私有对象

**S3 操作示例：**

```bash
# 创建存储桶
aws s3 mb s3://my-app-bucket-2024 --region us-east-1

# 启用版本控制
aws s3api put-bucket-versioning \
    --bucket my-app-bucket-2024 \
    --versioning-configuration Status=Enabled

# 设置加密
aws s3api put-bucket-encryption \
    --bucket my-app-bucket-2024 \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": "arn:aws:kms:us-east-1:123456789012:key/xxxxx"
            }
        }]
    }'

# 配置生命周期策略（30天后转 IA，90天后转 Glacier）
aws s3api put-bucket-lifecycle-configuration \
    --bucket my-app-bucket-2024 \
    --lifecycle-configuration '{
        "Rules": [{
            "ID": "TransitionRule",
            "Filter": {"Prefix": "logs/"},
            "Status": "Enabled",
            "Transitions": [
                {"Days": 30, "StorageClass": "STANDARD_IA"},
                {"Days": 90, "StorageClass": "GLACIER"}
            ],
            "Expiration": {"Days": 365}
        }]
    }'

# 上传文件
aws s3 cp ./app.log s3://my-app-bucket-2024/logs/app-2024-01-01.log

# 生成预签名 URL（有效期 1 小时）
aws s3 presign s3://my-app-bucket-2024/logs/app-2024-01-01.log --expires-in 3600

# 同步目录
aws s3 sync ./dist s3://my-app-bucket-2024/static/ --delete

# 创建 S3 Express One Zone 目录桶
aws s3api create-bucket \
    --bucket my-app-bucket-2024--us-east-1--az-id \
    --region us-east-1 \
    --create-bucket-configuration '{"Location": {"Type": "AvailabilityZone", "Name": "us-east-1a"}}' \
    --object-lock-enabled-for-bucket
```

### 8.3.2 EBS（Elastic Block Store）

**EBS** 是 AWS 的块存储服务，挂载到 EC2 实例作为本地磁盘使用。提供高性能、低延迟的持久化块存储。

**EBS 卷类型（2024 最新）：**

| 类型 | 最大 IOPS | 最大吞吐量 | 适用场景 | 价格 |
|------|----------|-----------|---------|------|
| **gp3**（默认） | 16,000 | 1,000 MB/s | 大多数工作负载（推荐） | 低 |
| **gp4**（2024 新） | 80,000 | 4,000 MB/s | 高性能通用工作负载 | 中 |
| **io2 Block Express** | 256,000 | 4,000 MB/s | 最高性能，数据库 | 高 |
| **io2** | 64,000 | 1,000 MB/s | 高性能数据库 | 高 |
| **st1** | - | 500 MB/s | 吞吐优化 HDD | 最低 |
| **sc1** | - | 250 MB/s | 最低成本 HDD | 最低 |

**EBS 关键特性：**

```
EBS 特性：
├── 快照（Snapshot）
│   - 增量备份，存储到 S3
│   - 可跨 Region 复制
│   - 用于 AMI 创建、数据备份
│   - Fast Snapshot Restore（快速恢复）
│
├── 加密
│   - 使用 AWS KMS 加密
│   - 加密卷的快照自动加密
│   - 从快照创建的卷自动加密
│
├── 多挂载
│   - io2/io2 Block Express 支持多实例挂载（最多 16 个）
│   - 适用于集群文件系统（如 Oracle RAC）
│
└── 生命周期
    - 创建 → 挂载 → 使用 → 快照 → 删除
    - 默认 DeleteOnTermination = true（EC2 终止时删除卷）
```

**EBS 操作示例：**

```bash
# 创建 100GB gp3 卷
aws ec2 create-volume \
    --availability-zone us-east-1a \
    --volume-type gp3 \
    --size 100 \
    --encrypted \
    --kms-key-id arn:aws:kms:us-east-1:123456789012:key/xxxxx \
    --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=app-data}]'

# 挂载到 EC2 实例
aws ec2 attach-volume \
    --volume-id vol-0abcdef1234567890 \
    --instance-id i-0abcdef1234567890 \
    --device /dev/sdf

# 创建快照
aws ec2 create-snapshot \
    --volume-id vol-0abcdef1234567890 \
    --description "Daily backup - $(date +%Y-%m-%d)"

# 修改卷类型/大小（在线修改，无需停机）
aws ec2 modify-volume \
    --volume-id vol-0abcdef1234567890 \
    --volume-type gp3 \
    --size 200 \
    --iops 10000 \
    --throughput 500
```

### 8.3.3 EFS（Elastic File System）

**EFS** 是 AWS 的 NFS 文件存储服务，可同时挂载到多个 EC2 实例，实现文件共享。

**EFS 核心特性：**

| 特性 | 说明 |
|------|------|
| 协议 | NFSv4.1 |
| 挂载 | 同时挂载到数千个 EC2 实例 |
| 容量 | 自动扩展，无需预分配 |
| 可用性 | Regional 模式跨多 AZ，One Zone 模式单 AZ |
| 性能 | 可弹性调整吞吐量和 IOPS |
| 存储类别 | Standard（频繁访问）、Infrequent Access（不频繁访问） |
| 适用场景 | Web 应用静态文件、CMS、数据共享、开发环境 |

**EFS vs EBS vs S3 对比：**

| 维度 | EBS | EFS | S3 |
|------|-----|-----|-----|
| 类型 | 块存储 | 文件存储 | 对象存储 |
| 访问方式 | 挂载到单个 EC2 | 挂载到多个 EC2 | API/HTTP |
| 容量 | 需预分配 | 自动扩展 | 无限 |
| 性能 | 最高（NVMe） | 高 | 中 |
| 价格 | 中 | 高 | 低 |
| 适用场景 | 数据库、系统盘 | 共享文件、CMS | 静态资源、备份、数据湖 |

**EFS 挂载示例：**

```bash
# 创建 EFS 文件系统
aws efs create-file-system \
    --creation-token my-efs-token \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted \
    --tags Key=Name,Value=shared-files

# 在 EC2 上挂载 EFS
# 1. 安装 NFS 客户端
yum install -y amazon-efs-utils

# 2. 创建挂载点
mkdir -p /mnt/efs

# 3. 挂载（使用 DNS 名称）
mount -t efs fs-0abcdef1234567890.efs.us-east-1.amazonaws.com:/ /mnt/efs

# 4. 开机自动挂载（/etc/fstab）
echo "fs-0abcdef1234567890.efs.us-east-1.amazonaws.com:/ /mnt/efs efs _netdev,tls,iam 0 0" >> /etc/fstab
```

### 8.3.4 存储选择决策树
```
需要块存储（像本地磁盘一样）？
  → EBS
    - 数据库、系统盘、高性能应用
    - 需要低延迟、高 IOPS

需要文件共享（多实例同时读写）？
  → EFS
    - 共享配置文件、Web 静态资源
    - 需要多实例同时访问同一文件系统

需要对象存储（海量非结构化数据）？
  → S3
    - 图片、视频、日志、备份数据
    - 需要无限容量、高持久性
    - 需要极低延迟？→ S3 Express One Zone

需要临时存储？
  → EC2 Instance Store
    - 临时数据、缓存、缓冲区
    - 实例终止后数据丢失
    - 最高性能（物理磁盘）
```

## 8.4 网络服务

### 8.4.1 VPC（Virtual Private Cloud）

**VPC** 是 AWS 的虚拟私有网络，让你在 AWS 中创建逻辑隔离的网络环境，完全控制 IP 地址范围、子网、路由表和网络网关。

**VPC 架构示例（生产级双 AZ 设计）：**

```
VPC: 10.0.0.0/16
│
├── 公有子网 10.0.1.0/24 (AZ-a)  ← 有 IGW 路由
│   ├── ALB
│   ├── NAT Gateway
│   └── Bastion Host
│
├── 公有子网 10.0.2.0/24 (AZ-b)
│   └── ALB（备用）
│
├── 私有子网 10.0.10.0/24 (AZ-a)  ← 无 IGW 路由，通过 NAT 访问互联网
│   ├── EC2 (Web/App)
│   └── EFS Mount Target
│
├── 私有子网 10.0.11.0/24 (AZ-b)
│   └── EC2 (Web/App)
│
├── 私有子网 10.0.20.0/24 (AZ-a)  ← 数据库子网（无互联网访问）
│   └── RDS (Primary)
│
├── 私有子网 10.0.21.0/24 (AZ-b)
│   └── RDS (Standby)
│
├── Internet Gateway (IGW)        ← 公有子网访问互联网
├── NAT Gateway                   ← 私有子网访问互联网（出站）
├── VPC Peering                   ← VPC 互联
└── Transit Gateway               ← 多 VPC 集中连接
```

#### VPC 核心组件
- **VPC**：虚拟私有云，定义 CIDR 块（如 10.0.0.0/16）
- **Subnet**：子网，公有子网（有 IGW 路由）/ 私有子网（无 IGW 路由）
- **Route Table**：路由表，控制网络流量方向
- **Internet Gateway (IGW)**：互联网网关，允许 VPC 与互联网通信
- **NAT Gateway**：NAT 网关，私有子网访问互联网（仅出站），按小时+数据处理量计费
- **VPC Peering**：VPC 互联，两个 VPC 之间的点对点连接（非传递性）
- **Transit Gateway**：多 VPC 集中连接，支持传递路由，适合大规模网络
- **VPC Endpoints**：VPC 终端节点，通过私有网络访问 AWS 服务（Gateway Endpoint / Interface Endpoint）
- **Elastic IP**：弹性公网 IP，可动态绑定到 EC2/ENI
- **Network ACL**：子网级别的无状态防火墙
- **Security Group**：实例级别的有状态防火墙

**VPC 创建示例：**

```bash
# 创建 VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query 'Vpc.VpcId' --output text)

# 启用 DNS 支持
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-support
aws ec2 modify-vpc-attribute --vpc-id $VPC_ID --enable-dns-hostnames

# 创建子网
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-b}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.10.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-a}]'
aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-b}]'

# 创建 Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID

# 创建 NAT Gateway（在公有子网中）
aws ec2 allocate-address --domain vpc
aws ec2 create-nat-gateway --subnet-id subnet-public-a --allocation-id eipalloc-xxxxx

# 创建 VPC Endpoint（S3 Gateway Endpoint，免费）
aws ec2 create-vpc-endpoint \
    --vpc-id $VPC_ID \
    --service-name com.amazonaws.us-east-1.s3 \
    --route-table-ids rtb-xxxxx \
    --vpc-endpoint-type Gateway
```

### 8.4.2 安全组 vs NACL
| 维度 | Security Group | NACL |
|------|---------------|------|
| 层级 | 实例级别（ENI） | 子网级别 |
| 状态 | 有状态（自动放行回包） | 无状态（需显式放行入出站） |
| 规则 | 只支持 Allow | 支持 Allow + Deny |
| 默认 | 拒绝所有入站，允许所有出站 | 允许所有入站和出站 |
| 评估顺序 | 所有规则一起评估（非顺序） | 按规则编号顺序评估 |
| 适用场景 | 精细控制实例访问 | 子网级别的批量控制 |

### 8.4.3 CloudFront（CDN）

**CloudFront** 是 AWS 的内容分发网络（CDN），通过全球 600+ 个边缘节点缓存和分发内容，降低延迟、提高访问速度。

**CloudFront 核心特性：**

| 特性 | 说明 |
|------|------|
| 全球边缘节点 | 600+ 个 PoP（Point of Presence） |
| 缓存 | 自动缓存，支持自定义缓存策略 |
| HTTPS | 免费 SSL 证书（ACM），支持自定义域名 |
| 压缩 | 自动 Gzip/Brotli 压缩 |
| Shield 集成 | 内置 DDoS 防护（AWS Shield Standard） |
| WAF 集成 | 可关联 WAF 进行 Web 应用防护 |
| Origin Shield | 源站防护层，减少源站负载 |
| Lambda@Edge | 边缘计算，在边缘节点运行 Lambda 函数 |
| 函数关联 | CloudFront Functions（轻量级边缘函数） |

**CloudFront 分发配置示例：**

```bash
# 创建 CloudFront 分发
aws cloudfront create-distribution \
    --origin-domain-name my-app-bucket-2024.s3.us-east-1.amazonaws.com \
    --default-cache-behavior '{
        "TargetOriginId": "my-s3-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
        "CachedMethods": ["GET", "HEAD", "OPTIONS"],
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "MinTTL": 86400,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    }' \
    --viewer-certificate '{
        "ACMCertificateArn": "arn:aws:acm:us-east-1:123456789012:certificate/xxxxx",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    }' \
    --price-class PriceClass_200 \
    --enabled
```

## 8.5 数据库服务

### 8.5.1 RDS（Relational Database Service）

**RDS** 是 AWS 的托管关系型数据库服务，支持 MySQL、PostgreSQL、MariaDB、Oracle、SQL Server 和 Aurora（MySQL/PostgreSQL 兼容）。

**RDS 核心特性：**

| 特性 | 说明 |
|------|------|
| Multi-AZ | 同 Region 跨 AZ 同步复制，自动故障转移（高可用） |
| Read Replica | 异步只读副本，用于读扩展（最多 15 个跨 Region） |
| 自动备份 | 每日自动备份，保留 1-35 天，支持时间点恢复（PITR） |
| 监控 | CloudWatch 指标、Enhanced Monitoring、Performance Insights |
| 安全 | VPC 隔离、加密（静态+传输）、IAM 认证 |
| 维护 | 自动安装补丁、自动小版本升级 |
| 存储自动扩展 | 自动增加存储空间（可设置上限） |

**Multi-AZ vs Read Replica：**

| 维度 | Multi-AZ | Read Replica |
|------|----------|-------------|
| 目的 | 高可用（故障转移） | 读扩展（性能） |
| 复制方式 | 同步复制 | 异步复制 |
| 应用感知 | 透明切换 | 需要手动配置读连接 |
| 延迟 | 几乎无延迟 | 可能存在复制延迟 |
| 可写 | 仅主库可写 | 仅主库可写 |
| 跨 Region | 不支持 | 支持（跨 Region Read Replica） |

**RDS 创建示例：**

```bash
# 创建 MySQL RDS 实例（Multi-AZ + Read Replica）
aws rds create-db-instance \
    --db-instance-identifier prod-db \
    --db-instance-class db.r7i.xlarge \
    --engine mysql \
    --engine-version 8.0.36 \
    --master-username admin \
    --master-user-password 'MyStr0ngP@ss2024!' \
    --allocated-storage 100 \
    --storage-type gp3 \
    --storage-encrypted \
    --vpc-security-group-ids sg-0123456789abcdef0 \
    --db-subnet-group-name my-db-subnet-group \
    --multi-az \
    --backup-retention-period 30 \
    --preferred-backup-window 03:00-04:00 \
    --preferred-maintenance-window mon:04:00-mon:05:00 \
    --enable-performance-insights \
    --performance-insights-retention-period 7 \
    --monitoring-interval 60 \
    --monitoring-role-arn arn:aws:iam::123456789012:role/rds-monitoring-role \
    --tags Key=Environment,Value=production

# 创建跨 Region Read Replica
aws rds create-db-instance-read-replica \
    --db-instance-identifier prod-db-replica \
    --source-db-instance-identifier arn:aws:rds:us-east-1:123456789012:db:prod-db \
    --db-instance-class db.r7i.large \
    --region us-west-2
```

### 8.5.2 DynamoDB

**DynamoDB** 是 AWS 的全托管 NoSQL 数据库，Serverless 架构，自动扩缩容，单表支持无限数据量和读写吞吐量。

**DynamoDB 核心特性：**

| 特性 | 说明 |
|------|------|
| 性能 | 单位毫秒级延迟，支持千万级 QPS |
| 扩展 | 自动分片，无限水平扩展 |
| 计费 | 按需（On-Demand）或预置（Provisioned） |
| 全局表 | 多 Region 活跃-活跃复制 |
| DAX | DynamoDB Accelerator，内存缓存，微秒级延迟 |
| 流 | DynamoDB Streams，数据变更事件流 |
| TTL | 自动过期删除 |
| 事务 | 支持跨表 ACID 事务 |

#### DynamoDB 核心概念
- **Table**：表，数据存储的基本单位
- **Item**：项（类似行），最大 400KB
- **Attribute**：属性（类似列），支持标量类型和嵌套类型
- **Partition Key**：分区键（必填），决定数据在哪个物理分区
- **Sort Key**：排序键（可选），同一分区内按排序键排序
- **Global Secondary Index (GSI)**：全局二级索引，不同分区键的索引
- **Local Secondary Index (LSI)**：本地二级索引，相同分区键、不同排序键的索引

**DynamoDB 操作示例：**

```bash
# 创建表（按需模式）
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions \
        AttributeName=userId,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=userId,KeyType=HASH \
    --global-secondary-indexes '[
        {
            "IndexName": "EmailIndex",
            "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
            "Projection": {"ProjectionType": "ALL"},
            "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
        }
    ]' \
    --billing-mode PAY_PER_REQUEST \
    --table-class STANDARD \
    --tags Key=Environment,Value=production

# 写入数据
aws dynamodb put-item \
    --table-name Users \
    --item '{
        "userId": {"S": "user-001"},
        "email": {"S": "user@example.com"},
        "name": {"S": "张三"},
        "age": {"N": "28"},
        "createdAt": {"S": "2024-01-15T10:00:00Z"}
    }'

# 查询数据
aws dynamodb get-item \
    --table-name Users \
    --key '{"userId": {"S": "user-001"}}'

# 条件更新
aws dynamodb update-item \
    --table-name Users \
    --key '{"userId": {"S": "user-001"}}' \
    --update-expression "SET #age = :age" \
    --expression-attribute-names '{"#age": "age"}' \
    --expression-attribute-values '{":age": {"N": "29"}}'

# 创建全局表（多 Region 复制）
aws dynamodb create-global-table \
    --global-table-name Users \
    --replication-group '[
        {"RegionName": "us-east-1"},
        {"RegionName": "us-west-2"},
        {"RegionName": "ap-southeast-1"}
    ]'
```

### 8.5.3 ElastiCache

**ElastiCache** 是 AWS 的托管缓存服务，支持 Redis 和 Memcached。

**ElastiCache for Redis vs Memcached：**

| 维度 | Redis | Memcached |
|------|-------|-----------|
| 数据类型 | 字符串、列表、哈希、集合等 | 仅字符串 |
| 持久化 | 支持（RDB/AOF） | 不支持 |
| 高可用 | Multi-AZ（Cluster 模式） | 不支持 |
| 集群 | 支持（分片 + 副本） | 不支持（需客户端分片） |
| 发布/订阅 | 支持 | 不支持 |
| 排序 | 支持（Sorted Set） | 不支持 |
| 适用场景 | 缓存、会话存储、排行榜、消息队列 | 简单缓存、对象缓存 |

**ElastiCache for Redis 创建示例：**

```bash
# 创建 Redis 集群（Cluster 模式，6 节点：3 分片 + 3 副本）
aws elasticache create-replication-group \
    --replication-group-id my-cache-cluster \
    --replication-group-description "Production Redis Cluster" \
    --engine redis \
    --engine-version 7.1 \
    --cache-node-type cache.r7g.large \
    --num-node-groups 3 \
    --replicas-per-node-group 1 \
    --automatic-failover-enabled \
    --multi-az-enabled \
    --at-rest-encryption-enabled \
    --transit-encryption-enabled \
    --auth-token 'MyR3dis@uth2024!' \
    --cache-subnet-group-name my-cache-subnet-group \
    --security-group-ids sg-0123456789abcdef0 \
    --snapshot-retention-limit 7 \
    --snapshot-window 05:00-06:00
```

### 8.5.4 Aurora

**Aurora** 是 AWS 的云原生关系型数据库，MySQL 和 PostgreSQL 兼容，性能最高可达标准 MySQL 的 5 倍、标准 PostgreSQL 的 3 倍。

**Aurora 核心架构：**

```
Aurora 存储架构（独特之处）：
┌─────────────────────────────────────────────────┐
│              Aurora Cluster                     │
│                                                 │
│  ┌──────────┐                                  │
│  │ Primary  │ ← 写节点（1个）                   │
│  │ Instance │                                  │
│  └────┬─────┘                                  │
│       │                                        │
│       │ 6 副本跨 3 AZ                           │
│       ▼                                        │
│  ┌──────────────────────────────────────┐      │
│  │     Aurora Distributed Storage       │      │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│      │
│  │  │AZ-a│ │AZ-a│ │AZ-b│ │AZ-b│ │AZ-c││      │
│  │  │Copy│ │Copy│ │Copy│ │Copy│ │Copy││      │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘│      │
│  │  ┌────┐                              │      │
│  │  │AZ-c│  ← 6 个数据副本跨 3 个 AZ     │      │
│  │  │Copy│                              │      │
│  │  └────┘                              │      │
│  └──────────────────────────────────────┘      │
│       │                                        │
│  ┌────┴─────┐  ┌──────────┐                   │
│  │ Reader 1 │  │ Reader 2 │ ← 读节点（最多15个）│
│  └──────────┘  └──────────┘                   │
└─────────────────────────────────────────────────┘

Aurora 特点：
├── 存储自动扩展（最大 128TB）
├── 计算与存储分离
├── 自动故障转移（< 30 秒）
├── 跨 Region 复制（Global Database）
├── Serverless v2（按秒计费，自动扩缩容）
├── 支持 Parallel Query（并行查询）
└── Machine Learning 集成
```

**Aurora Serverless v2：**

```
Aurora Serverless v2 特点：
├── 按秒计费（ACU - Aurora Capacity Unit）
├── 自动扩缩容（0.5 - 128 ACU）
├── 适合不可预测的工作负载
├── 支持读取扩展
└── 比 Serverless v1 更快、更灵活
```

**Aurora 创建示例：**

```bash
# 创建 Aurora PostgreSQL Serverless v2 集群
aws rds create-db-cluster \
    --db-cluster-identifier aurora-prod \
    --engine aurora-postgresql \
    --engine-mode provisioned \
    --engine-version 15.4 \
    --master-username admin \
    --master-user-password 'MyStr0ngP@ss2024!' \
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=16 \
    --vpc-security-group-ids sg-0123456789abcdef0 \
    --db-subnet-group-name my-db-subnet-group \
    --backup-retention-period 30 \
    --enable-cloudwatch-logs-exports '["postgresql"]'

# 添加 Reader 实例
aws rds create-db-instance \
    --db-cluster-identifier aurora-prod \
    --db-instance-identifier aurora-prod-reader-1 \
    --db-instance-class db.serverless \
    --engine aurora-postgresql
```

## 8.6 面试常见问题

### Q1: EC2 的 On-Demand、Reserved、Spot 实例的区别？

**参考答案：**

| 选项 | 计费方式 | 折扣 | 适用场景 |
|------|---------|------|---------|
| On-Demand | 按秒计费 | 无 | 不可预测的短期工作负载 |
| Reserved (RI) | 1-3 年预留 | 最高 72% | 稳定、可预测的长期工作负载 |
| Spot | 竞价，可中断 | 最高 90% | 可中断的批处理、CI/CD |
| Savings Plans | 承诺 $/hr 用量 | 最高 72% | 混合工作负载，跨实例类型灵活 |

**选择策略：**
- 基础负载（必须运行的服务）→ Reserved 或 Savings Plans
- 可变负载（白天多、晚上少）→ On-Demand + Auto Scaling
- 可中断任务（数据处理、测试）→ Spot
- 最佳实践：组合使用，如 60% RI + 30% On-Demand + 10% Spot

---

### Q2: S3 的存储类别有哪些？如何选择？

**参考答案：**

| 类别 | 适用场景 | 最低存储天数 |
|------|---------|------------|
| Standard | 热数据，频繁访问 | 无 |
| Express One Zone | 极低延迟的频繁访问 | 无 |
| Intelligent-Tiering | 访问模式不确定 | 无 |
| Standard-IA | 每月访问几次 | 30 天 |
| One Zone-IA | 可容忍 AZ 故障的不频繁数据 | 30 天 |
| Glacier Instant | 偶尔需要快速访问的归档 | 90 天 |
| Glacier Flexible | 长期归档 | 90 天 |
| Glacier Deep Archive | 合规归档，极少访问 | 180 天 |

**选择建议：**
- 频繁访问 → Standard
- 访问模式不确定 → Intelligent-Tiering（自动优化成本）
- 不频繁访问 → Standard-IA
- 长期归档 → Glacier Deep Archive
- 需要极低延迟 → S3 Express One Zone

---

### Q3: Security Group 和 NACL 的区别？

**参考答案：**

| 维度 | Security Group | NACL |
|------|---------------|------|
| 作用层级 | 实例级别（ENI） | 子网级别 |
| 状态 | 有状态（自动放行回包） | 无状态（需显式放行） |
| 规则类型 | 仅 Allow | Allow + Deny |
| 默认规则 | 拒绝所有入站，允许所有出站 | 允许所有入站和出站 |
| 评估顺序 | 所有规则一起评估 | 按编号顺序评估 |
| 修改生效 | 立即生效 | 立即生效 |

**最佳实践：** 使用 Security Group 作为主要访问控制，NACL 作为子网级别的额外防护层。

---

### Q4: Lambda 冷启动是什么？如何优化？

**参考答案：**

**冷启动**是指 Lambda 函数在一段时间未被调用后，AWS 需要重新初始化执行环境（下载代码、初始化运行时、加载依赖），导致首次调用延迟增加（通常 100ms - 数秒）。

**优化方案：**
1. **预置并发（Provisioned Concurrency）**：提前初始化环境，彻底消除冷启动（有额外费用）
2. **减少初始化时间**：精简依赖包、延迟加载非必要模块
3. **使用 SnapStart（Java 17+）**：快照启动，冷启动降至 ~200ms
4. **选择轻量运行时**：Node.js/Python 冷启动快于 Java/.NET
5. **保持函数温暖**：使用 EventBridge 定时触发（每 5 分钟）
6. **使用 Lambda Layers**：共享依赖，减少部署包大小

---

### Q5: RDS Multi-AZ 和 Read Replica 的区别？

**参考答案：**

| 维度 | Multi-AZ | Read Replica |
|------|----------|-------------|
| **目的** | 高可用（自动故障转移） | 读扩展（提升读性能） |
| **复制方式** | 同步复制 | 异步复制 |
| **延迟** | 几乎无延迟 | 可能存在复制延迟 |
| **应用感知** | 透明切换，DNS 自动更新 | 需要手动配置读连接 |
| **可写** | 仅主库可写 | 仅主库可写 |
| **跨 Region** | 不支持 | 支持 |
| **计费** | 包含在 Multi-AZ 价格中 | 按 Read Replica 实例计费 |

**使用场景：**
- 需要高可用 → Multi-AZ
- 需要读扩展 → Read Replica
- 最佳实践：同时使用 Multi-AZ（高可用）+ Read Replica（读扩展）

---

### Q6: VPC 中公有子网和私有子网的区别？

**参考答案：**

| 维度 | 公有子网 | 私有子网 |
|------|---------|---------|
| **路由表** | 有 0.0.0.0/0 → IGW 的路由 | 无到 IGW 的路由 |
| **互联网访问** | 直接访问（入站+出站） | 仅通过 NAT Gateway 出站访问 |
| **典型资源** | ALB、Bastion Host、NAT Gateway | EC2 应用服务器、RDS |
| **安全级别** | 较低（有公网 IP） | 较高（无公网 IP） |

**生产环境最佳实践：**
- Web 层（ALB）放在公有子网
- 应用层（EC2）放在私有子网
- 数据层（RDS）放在私有子网（数据库子网）
- 通过 NAT Gateway 让私有子网访问互联网（如下载包、调用外部 API）

---

### Q7: DynamoDB 的分区键和排序键的作用？

**参考答案：**

- **Partition Key（分区键）**：必填，决定数据存储在哪个物理分区。相同分区键的数据存储在同一个分区。选择分区键时需要确保数据均匀分布，避免热点分区。

- **Sort Key（排序键）**：可选，同一分区内按排序键排序。允许在分区键相同的情况下，通过排序键进行范围查询。

**设计原则：**
1. 分区键应该有高基数（大量唯一值），确保数据均匀分布
2. 分区键应该是查询条件中最常用的属性
3. 排序键用于在分区内进行范围查询或排序
4. 如果需要多种查询模式，使用 GSI（全局二级索引）

**示例：**
- 分区键 = userId，排序键 = createdAt → 查询某用户的所有操作记录，按时间排序
- 分区键 = orderId → 直接查询订单
- GSI：分区键 = status → 查询所有待处理的订单
