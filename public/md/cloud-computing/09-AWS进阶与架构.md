# 09 AWS 进阶与架构

## 9.1 IAM（身份与访问管理）

### 9.1.1 IAM 核心概念
- **User**：IAM 用户（人或应用），长期凭证（Access Key + Secret Key）
- **Group**：用户组（批量管理权限，一个用户可以属于多个组）
- **Role**：角色（临时凭证，跨账号/服务间授权，无长期密钥）
- **Policy**：权限策略（JSON 格式，定义允许/拒绝的操作）
- **Permission Boundary**：权限边界（限制用户/角色的最大权限范围）
- **IAM Identity Center**（原 AWS SSO）：集中管理多账号的用户访问

### 9.1.2 Policy 结构

IAM Policy 是 JSON 格式的文档，定义了"谁可以对什么资源执行什么操作"。

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowS3ReadOnly",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::my-app-bucket",
                "arn:aws:s3:::my-app-bucket/*"
            ]
        },
        {
            "Sid": "DenyDeleteS3",
            "Effect": "Deny",
            "Action": "s3:DeleteObject",
            "Resource": "arn:aws:s3:::my-app-bucket/*",
            "Condition": {
                "StringNotEquals": {
                    "aws:PrincipalTag/Department": "ops"
                }
            }
        },
        {
            "Sid": "AllowEC2OnlyInProduction",
            "Effect": "Allow",
            "Action": "ec2:*",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": "us-east-1"
                }
            }
        }
    ]
}
```

**Policy 元素说明：**

| 元素 | 说明 | 示例 |
|------|------|------|
| **Version** | Policy 语言版本 | "2012-10-17"（当前版本） |
| **Statement** | 一条或多条权限声明 | 数组 |
| **Sid** | 声明 ID（可选） | "AllowS3ReadOnly" |
| **Effect** | Allow 或 Deny | "Allow" |
| **Action** | 允许/拒绝的操作 | "s3:GetObject"、"ec2:RunInstances" |
| **Resource** | 目标资源 ARN | "arn:aws:s3:::bucket/*" |
| **Condition** | 附加条件（可选） | IP 地址、标签、时间等 |

**常用 Condition 操作符：**

```json
// 基于 IP 地址限制
"Condition": {
    "IpAddress": {
        "aws:SourceIp": ["203.0.113.0/24", "198.51.100.0/24"]
    }
}

// 基于标签限制
"Condition": {
    "StringEquals": {
        "aws:ResourceTag/Environment": "production"
    }
}

// 基于时间限制（仅工作时间）
"Condition": {
    "DateGreaterThan": {"aws:CurrentTime": "2024-01-01T09:00:00Z"},
    "DateLessThan": {"aws:CurrentTime": "2024-12-31T18:00:00Z"}
}

// 强制使用 MFA
"Condition": {
    "Bool": {
        "aws:MultiFactorAuthPresent": "true"
    }
}
```

### 9.1.3 IAM 最佳实践

**1. 最小权限原则（Least Privilege）**

```json
// 错误示例：给过多权限
{
    "Effect": "Allow",
    "Action": "s3:*",          // 允许所有 S3 操作
    "Resource": "*"            // 对所有资源
}

// 正确示例：只给必要的权限
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject",
        "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::my-app-bucket/uploads/*"
}
```

**2. 不使用 Root Account**

- Root Account 仅用于初始设置和紧急情况
- 为日常管理创建 IAM 用户或使用 IAM Identity Center
- 启用 Root Account 的 MFA 和硬件 MFA
- 定期检查 Root Account 的最后使用时间

**3. 启用 MFA（多因素认证）**

```bash
# 为 IAM 用户启用 MFA
aws iam enable-mfa-device \
    --user-name admin-user \
    --serial-number arn:aws:iam::123456789012:mfa/admin-user \
    --authentication-code-1 123456 \
    --authentication-code-2 789012
```

**4. 使用 Role 而非长期凭证**

```
最佳实践：
├── EC2 实例 → 使用 IAM Role（EC2 Instance Profile）
├── Lambda 函数 → 使用 Execution Role
├── ECS Task → 使用 Task Role
├── 跨账号访问 → 使用 AssumeRole
├── 第三方应用 → 使用 IAM Role + External ID
└── 人类用户 → 使用 IAM Identity Center（SSO）
```

**5. 定期轮换凭证**

```bash
# 创建 Access Key
aws iam create-access-key --user-name dev-user

# 设置 Access Key 自动轮换（90天）
# 使用 AWS Secrets Manager 管理密钥
# 使用 IAM Access Analyzer 检查未使用的权限
aws iam generate-credential-report
aws iam get-credential-report
```

**6. 使用 Permission Boundary**

```json
// Permission Boundary 示例：限制用户只能访问特定 S3 桶
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::dev-bucket-*",
                "arn:aws:s3:::dev-bucket-*/*"
            ]
        }
    ]
}
```

**7. 使用 IAM Access Analyzer**

- 自动分析资源策略，识别对外公开的资源
- 检查未使用的权限和凭证
- 生成基于活动的策略建议

### 9.1.4 STS（Security Token Service）

**STS** 是 AWS 的临时安全凭证服务，通过 AssumeRole 等操作获取临时凭证（Access Key + Secret Key + Session Token），有效期 15 分钟 - 12 小时。

**STS 核心操作：**

| 操作 | 说明 | 使用场景 |
|------|------|---------|
| **AssumeRole** | 扮演一个 IAM Role | 跨账号访问、服务间授权 |
| **AssumeRoleWithWebIdentity** | 通过 OIDC/Web Identity 获取凭证 | Cognito、GitHub Actions |
| **AssumeRoleWithSAML** | 通过 SAML 获取凭证 | 企业 SSO（ADFS、Okta） |
| **GetSessionToken** | 获取 MFA 认证的临时凭证 | CLI 工具 MFA 认证 |
| **DecodeAuthorizationMessage** | 解码授权错误信息 | 调试权限问题 |

**跨账号访问示例：**

```
场景：账号 A 的 EC2 需要访问账号 B 的 S3 桶

账号 A（123456789012）：
├── EC2 Role: app-role
│   └── Policy: 允许 AssumeRole 到账号 B
│       {
│           "Effect": "Allow",
│           "Action": "sts:AssumeRole",
│           "Resource": "arn:aws:iam::999999999999:role/cross-account-s3-role"
│       }

账号 B（999999999999）：
├── Role: cross-account-s3-role
│   ├── Trust Policy: 允许账号 A 的 app-role AssumeRole
│   │   {
│   │       "Version": "2012-10-17",
│   │       "Statement": [{
│   │           "Effect": "Allow",
│   │           "Principal": {
│   │               "AWS": "arn:aws:iam::123456789012:role/app-role"
│   │           },
│   │           "Action": "sts:AssumeRole",
│   │           "Condition": {
│   │               "StringEquals": {
│   │                   "sts:ExternalId": "unique-external-id-2024"
│   │               }
│   │           }
│   │       }]
│   │   }
│   └── Permission Policy: 允许访问 S3 桶
│       {
│           "Effect": "Allow",
│           "Action": ["s3:GetObject", "s3:PutObject"],
│           "Resource": "arn:aws:s3:::target-bucket/*"
│       }
```

**STS AssumeRole 代码示例（Python）：**

```python
import boto3

# 在账号 A 的 EC2 上运行
sts_client = boto3.client('sts')

# AssumeRole 到账号 B
response = sts_client.assume_role(
    RoleArn='arn:aws:iam::999999999999:role/cross-account-s3-role',
    RoleSessionName='cross-account-session',
    ExternalId='unique-external-id-2024',
    DurationSeconds=3600  # 1 小时
)

# 使用临时凭证访问账号 B 的 S3
credentials = response['Credentials']
s3_client = boto3.client(
    's3',
    aws_access_key_id=credentials['AccessKeyId'],
    aws_secret_access_key=credentials['SecretAccessKey'],
    aws_session_token=credentials['SessionToken']
)

# 访问账号 B 的 S3 桶
s3_client.put_object(
    Bucket='target-bucket',
    Key='data/report.csv',
    Body=b'id,name,age\n1,Alice,30\n'
)
```

## 9.2 CloudFormation

### 9.2.1 什么是 CloudFormation

**CloudFormation** 是 AWS 原生的基础设施即代码（IaC）工具，通过 YAML/JSON 模板声明式地定义 AWS 资源，实现基础设施的版本化管理、自动化部署和一致性。

**CloudFormation 核心概念：**

| 概念 | 说明 |
|------|------|
| **Template** | YAML/JSON 格式的基础设施定义文件 |
| **Stack** | 模板的一次部署实例，管理一组资源 |
| **StackSet** | 跨多个账号/Region 部署同一套 Stack |
| **Change Set** | 预览 Stack 更新的变更，确认后执行 |
| **Stack Policy** | 防止意外删除/更新关键资源 |
| **Nested Stack** | 嵌套 Stack，将模板拆分为可复用的模块 |
| **Drift Detection** | 检测实际资源与模板定义的差异 |
| **CloudFormation Registry** | 注册和管理自定义资源类型 |

**CloudFormation 优势：**

```
1. 声明式：定义"想要什么"，而非"怎么做"
2. 幂等性：多次执行结果一致
3. 依赖管理：自动解析资源间的依赖关系
4. 回滚：更新失败自动回滚到之前的状态
5. 审计：所有变更都有记录
6. 免费：CloudFormation 本身不收费
```

### 9.2.2 模板结构

```yaml
# template.yaml - CloudFormation 模板示例
# 部署一个高可用的 Web 应用架构

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production Web Application - Multi-AZ with ALB, ECS, RDS'

# ======== 参数 ========
Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]
    Description: 'Deployment environment'

  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: 'VPC CIDR block'

  InstanceType:
    Type: String
    Default: m7i.xlarge
    AllowedValues: [t3.medium, m7i.large, m7i.xlarge, c7i.xlarge]
    Description: 'EC2 instance type'

  DBInstanceClass:
    Type: String
    Default: db.r7i.xlarge
    Description: 'RDS instance class'

  DBPassword:
    Type: String
    NoEcho: true
    MinLength: 12
    Description: 'Database master password'

# ======== 映射 ========
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0abcdef1234567890
    us-west-2:
      AMI: ami-0123456789abcdef0
    ap-southeast-1:
      AMI: ami-0fedcba9876543210

  EnvironmentConfig:
    production:
      DBSize: 100
      MinInstances: 2
      MaxInstances: 10
    development:
      DBSize: 20
      MinInstances: 1
      MaxInstances: 2

# ======== 条件 ========
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  IsDevelopment: !Equals [!Ref Environment, development]

# ======== 资源 ========
Resources:
  # --- VPC ---
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'

  # --- 子网（2 个公有 + 2 个私有）---
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-a'

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-public-b'

  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-a'

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 6, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-private-b'

  # --- Internet Gateway ---
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # --- NAT Gateway ---
  NatGateway:
    Type: AWS::EC2::NatGateway
    DependsOn: AttachGateway
    Properties:
      AllocationId: !GetAtt NatEIP.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-nat'

  NatEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc

  # --- ALB ---
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-alb'
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Type: application

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${Environment}-tg'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      TargetType: instance
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30

  # --- 安全组 ---
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'ALB Security Group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'EC2 Instance Security Group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  # --- Auto Scaling Group ---
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
        InstanceType: !Ref InstanceType
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y java-17-amazon-corretto
            # 部署应用...

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: '$Latest'
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinInstances]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxInstances]
      TargetGroupARNs:
        - !Ref TargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300

  # --- RDS ---
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Database subnet group'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-db'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: 8.0.36
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      AllocatedStorage: !FindInMap [EnvironmentConfig, !Ref Environment, DBSize]
      StorageType: gp3
      StorageEncrypted: true
      MultiAZ: !If [IsProduction, true, false]
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      BackupRetentionPeriod: !If [IsProduction, 30, 7]
      DeletionPolicy: !If [IsProduction, Snapshot, Delete]

  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Database Security Group'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref InstanceSecurityGroup

# ======== 输出 ========
Outputs:
  ALBDNSName:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-alb-dns'

  RDSEndpoint:
    Description: 'RDS Instance Endpoint'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${Environment}-rds-endpoint'

  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${Environment}-vpc-id'
```

### 9.2.3 Stack 管理

**Stack 生命周期：**

```
CREATE_IN_PROGRESS → CREATE_COMPLETE
                        ↓ (更新)
                  UPDATE_IN_PROGRESS → UPDATE_COMPLETE
                        ↓ (失败)
                  UPDATE_ROLLBACK_IN_PROGRESS → UPDATE_ROLLBACK_COMPLETE
                        ↓ (删除)
                  DELETE_IN_PROGRESS → DELETE_COMPLETE
```

**常用命令：**

```bash
# 创建 Stack
aws cloudformation create-stack \
    --stack-name my-web-app \
    --template-body file://template.yaml \
    --parameters ParameterKey=Environment,ParameterValue=production \
                 ParameterKey=DBPassword,ParameterValue='MyStr0ngP@ss!' \
    --capabilities CAPABILITY_IAM \
    --on-failure ROLLBACK \
    --tags Key=Project,Value=web-app

# 更新 Stack（先创建 Change Set 预览变更）
aws cloudformation create-change-set \
    --stack-name my-web-app \
    --change-set-name update-20240115 \
    --template-body file://template.yaml \
    --parameters ParameterKey=Environment,ParameterValue=production \
                 ParameterKey=InstanceType,ParameterValue=m7i.2xlarge \
                 UsePreviousTemplate=true

# 查看变更预览
aws cloudformation describe-change-set \
    --stack-name my-web-app \
    --change-set-name update-20240115

# 执行变更
aws cloudformation execute-change-set \
    --stack-name my-web-app \
    --change-set-name update-20240115

# 查看事件
aws cloudformation describe-stack-events \
    --stack-name my-web-app

# 删除 Stack
aws cloudformation delete-stack \
    --stack-name my-web-app

# 检测漂移（实际资源与模板不一致）
aws cloudformation detect-stack-drift \
    --stack-name my-web-app
```

### 9.2.4 CloudFormation vs Terraform
| 维度 | CloudFormation | Terraform |
|------|---------------|-----------|
| 云厂商 | 仅 AWS | 多云（AWS、Azure、GCP、阿里云等） |
| 语言 | YAML/JSON | HCL（HashiCorp Configuration Language） |
| 状态管理 | AWS 托管（无需管理） | 本地 state file（需配置远程后端） |
| 社区 | AWS 官方支持 | 全球社区，生态丰富 |
| 学习曲线 | 较低（AWS 用户） | 中等 |
| 模块化 | Nested Stack、StackSets | Module（更灵活） |
| 变更预览 | Change Set | Plan |
| 成本 | 免费 | 免费（Terraform Cloud 付费） |
| 适用场景 | 纯 AWS 环境 | 多云环境、混合云 |

**选择建议：**
- 纯 AWS 环境、团队熟悉 AWS → CloudFormation
- 多云环境、需要统一管理 → Terraform
- 需要丰富的社区模块 → Terraform
- 需要与 AWS 服务深度集成 → CloudFormation

## 9.3 AWS 架构最佳实践

### 9.3.1 Well-Architected Framework

**AWS Well-Architected Framework** 是 AWS 提供的架构最佳实践框架，包含六大支柱，帮助构建安全、高性能、高可用、成本优化的云架构。

**六大支柱详解：**

| 支柱 | 核心问题 | 关键实践 |
|------|---------|---------|
| **运维卓越** | 如何高效运行和监控系统？ | 运营即代码、频繁小批量变更、故障演练、监控告警 |
| **安全性** | 如何保护数据、系统和资产？ | 最小权限、加密 everywhere、安全纵深防御、自动化安全检测 |
| **可靠性** | 如何从故障中恢复？ | 多 AZ/多 Region、自动恢复、故障注入测试、备份策略 |
| **性能效率** | 如何高效使用计算资源？ | 右置资源、数据驱动优化、Serverless、缓存策略 |
| **成本优化** | 如何避免不必要的开销？ | 按需付费、预留实例、资源清理、成本分摊 |
| **可持续性**（2021 新增） | 如何减少环境影响？ | 选择高效 Region、优化资源利用率、使用 Graviton |

**运维卓越关键实践：**

```
1. 运营即代码（Operations as Code）
   - 使用 CloudFormation/Terraform 管理基础设施
   - 使用 Systems Manager 自动化运维任务

2. 频繁、小批量的变更
   - CI/CD 流水线
   - 蓝/绿部署、金丝雀发布

3. 故障演练
   - 使用 Fault Injection Simulator (FIS)
   - 定期进行 Game Day

4. 监控与告警
   - CloudWatch 指标 + 告警
   - CloudWatch Dashboard
   - X-Ray 分布式追踪
```

**安全性关键实践：**

```
1. 最小权限原则
   - IAM Policy 精细化
   - 使用 IAM Access Analyzer

2. 加密
   - 静态加密：S3、EBS、RDS、KMS
   - 传输加密：TLS 1.2+
   - 密钥管理：KMS、自动轮换

3. 网络安全
   - VPC 隔离
   - Security Group + NACL
   - WAF + Shield
   - VPC Flow Logs

4. 安全自动化
   - GuardDuty（威胁检测）
   - Security Hub（安全态势管理）
   - Inspector（漏洞扫描）
   - Config（配置合规检查）
```

### 9.3.2 高可用架构模式

#### 多 AZ 架构

```
         Route 53
            |
    +-------+-------+
    |               |
 +--+--+         +--+--+
 | ALB |         | ALB |  (多 AZ)
 +--+--+         +--+--+
    |               |
 +--+--+         +--+--+
 | ECS |         | ECS |
 |Task |         |Task |
 +--+--+         +--+--+
    |               |
 +--+--+         +--+--+
 |Elasti|       |Elasti|
 |Cache |       |Cache |
 +--+--+         +--+--+
    |               |
 +--+--+         +--+--+
 | RDS |---------| RDS |  (Multi-AZ 同步复制)
 |Primary|      |Standby|
 +-----+         +-----+
```

#### 无服务器架构

```
CloudFront (CDN)
    |
    v
API Gateway (HTTP API)
    |
    +---> Lambda (认证) --> DynamoDB (用户表)
    |
    +---> Lambda (业务) --> DynamoDB (订单表)
    |         |
    |         +---> SNS (通知) --> Lambda (邮件)
    |         |
    |         +---> SQS (异步任务) --> Lambda (处理)
    |
    +---> Lambda (文件) --> S3 (文件存储)
```

#### 容器化微服务架构

```
                    Route 53
                       |
                   +---+---+
                   |  ALB  |
                   +---+---+
                       |
            +----------+----------+
            |                     |
       +----+----+          +----+----+
       | Service |          | Service |
       | Gateway |          |  User   |
       | (ECS)   |          | (ECS)   |
       +----+----+          +----+----+
            |                     |
       +----+----+          +----+----+
       | Service |          | Service |
       |  Order  |          | Payment |
       | (ECS)   |          | (ECS)   |
       +----+----+          +----+----+
            |                     |
            +----------+----------+
                       |
                  +----+----+
                  |Service  |
                  | Mesh    |
                  |(App Mesh)|
                  +---------+

数据层：
├── Aurora PostgreSQL（订单、支付）
├── DynamoDB（用户、会话）
├── ElastiCache Redis（缓存）
└── S3（文件、图片）
```

### 9.3.3 常见架构模式

**1. Web 应用架构**

```
CloudFront → WAF → ALB → ECS/EKS → RDS Multi-AZ + ElastiCache
                                    ↓
                               S3 (静态资源)
```

**2. 批处理架构**

```
S3 (数据源) → EventBridge (定时触发) → Step Functions (编排)
                                        ↓
                                    Lambda (处理)
                                        ↓
                                    S3 (结果) → Athena (查询) → QuickSight (报表)
```

**3. 数据湖架构**

```
数据源 → Kinesis Data Firehose → S3 (Raw Zone)
                                  ↓
                            Glue Crawler (元数据)
                                  ↓
                            Glue ETL Jobs
                                  ↓
                            S3 (Processed Zone)
                                  ↓
                            Athena (SQL 查询)
                                  ↓
                            QuickSight (可视化)
```

**4. 事件驱动架构**

```
事件源 → EventBridge (事件总线)
            ↓
    +-------+-------+-------+
    |       |       |       |
  Lambda  Lambda  SNS    SQS
    |       |       |       |
    ↓       ↓       ↓       ↓
 DynamoDB S3   Lambda  Lambda
                  (邮件)   (处理)
```

**5. 机器学习架构**

```
SageMaker (模型训练)
    ↓
SageMaker Endpoint (模型部署)
    ↓
API Gateway → Lambda → SageMaker Endpoint → DynamoDB/S3
```

## 9.4 AWS 其他重要服务

### 9.4.1 消息队列

| 服务 | 类型 | 特点 | 适用场景 |
|------|------|------|---------|
| **SQS** | 消息队列 | 点对点、解耦、缓冲、重试 | 异步任务处理、削峰填谷 |
| **SNS** | 发布/订阅 | 一对多通知、扇出 | 告警通知、多系统联动 |
| **Kinesis** | 流处理 | 实时数据流、分片 | 日志收集、实时分析、IoT |
| **EventBridge** | 事件总线 | 事件路由、规则匹配、Schema 注册 | 事件驱动架构、SaaS 集成 |
| **MQ** | 消息代理 | 兼容 ActiveMQ/RabbitMQ | 迁移传统应用 |

**SQS vs SNS vs EventBridge 对比：**

```
SQS（消息队列）：
├── 点对点模型（一个生产者 → 一个消费者）
├── 消息保留：1 分钟 - 14 天
├── 两种类型：Standard（无限吞吐）、FIFO（严格顺序）
├── 死信队列（DLQ）：处理失败的消息
└── 延迟队列：延迟消息投递

SNS（发布/订阅）：
├── 一对多模型（一个发布者 → 多个订阅者）
├── 订阅类型：SQS、Lambda、HTTP、Email、SMS
├── 消息过滤：基于属性过滤
└── Fanout 模式：SNS → 多个 SQS 队列

EventBridge（事件总线）：
├── 事件路由（基于内容路由到不同目标）
├── 支持 Cron 表达式（定时任务）
├── Schema Registry（事件模式发现）
├── 支持跨账号/跨 Region 事件路由
└── 内置事件源：180+ AWS 服务事件
```

**SQS + Lambda 异步处理示例：**

```python
# 生产者：发送消息到 SQS
import boto3

sqs = boto3.client('sqs')
queue_url = 'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue'

# 发送消息
sqs.send_message(
    QueueUrl=queue_url,
    MessageBody='{"order_id": "ORD-001", "action": "process"}',
    DelaySeconds=0,
    MessageAttributes={
        'OrderType': {
            'DataType': 'String',
            'StringValue': 'standard'
        }
    }
)

# 消费者：Lambda 函数处理 SQS 消息
def lambda_handler(event, context):
    for record in event['Records']:
        body = json.loads(record['body'])
        order_id = body['order_id']
        # 处理订单...
        print(f"Processing order: {order_id}")
    return {'statusCode': 200, 'body': 'Messages processed'}
```

### 9.4.2 监控与日志

| 服务 | 用途 | 特点 |
|------|------|------|
| **CloudWatch** | 指标监控、日志聚合、告警 | 自定义指标、Dashboard、复合告警 |
| **CloudWatch Logs** | 日志收集和查询 | Logs Insights（SQL 查询）、日志组、日志流 |
| **CloudTrail** | API 调用审计 | 记录所有 AWS API 调用，合规审计 |
| **X-Ray** | 分布式追踪 | 请求链路分析、性能瓶颈定位 |
| **Config** | 资源配置审计 | 配置变更历史、合规规则 |
| **CloudWatch Synthetics** | 可用性监控 | 模拟用户访问，监控端到端可用性 |

**CloudWatch 告警配置示例：**

```bash
# 创建 CPU 使用率告警
aws cloudwatch put-metric-alarm \
    --alarm-name high-cpu-alarm \
    --alarm-description 'CPU usage exceeds 80%' \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-0abcdef1234567890 \
    --statistic Average \
    --period 300 \
    --evaluation-periods 2 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --treat-missing-data missing \
    --alarm-actions arn:aws:sns:us-east-1:123456789012:ops-alerts \
    --ok-actions arn:aws:sns:us-east-1:123456789012:ops-alerts
```

### 9.4.3 数据迁移

| 服务 | 场景 | 特点 |
|------|------|------|
| **DMS**（Database Migration Service） | 数据库迁移 | 近零停机迁移、同构/异构迁移、CDC |
| **Snowball** | PB 级物理迁移 | 物理设备传输，适合大规模数据迁移 |
| **Snowball Edge** | 边缘计算 + 数据迁移 | 带计算能力的 Snowball |
| **Transfer** | SFTP/FTP 传输 | 托管 SFTP/FTPS/S3 访问 |
| **DataSync** | 文件系统迁移 | NFS/SMB → S3/EFS 自动同步 |
| **Migration Hub** | 迁移管理 | 集中跟踪迁移进度 |

**DMS 迁移流程：**

```
1. 创建复制实例（DMS 管理服务）
2. 创建源端点和目标端点
3. 创建迁移任务
4. 选择迁移类型：
   ├── 全量迁移（一次性）
   ├── 全量 + CDC（持续复制）
   └── 仅 CDC（增量复制）
5. 监控迁移进度
6. 验证数据一致性
7. 切换应用到新数据库
```

## 9.5 AWS 认证路径

| 认证 | 级别 | 适合人群 | 考试形式 | 有效期 |
|------|------|---------|---------|--------|
| **Cloud Practitioner (CLF-C02)** | 入门 | 非技术人员、管理者 | 65 题 / 90 分钟 | 3 年 |
| **SAA (Solutions Architect Associate - SAA-C03)** | 中级 | 架构师（推荐首选） | 65 题 / 130 分钟 | 3 年 |
| **DVA (Developer Associate - DVA-C02)** | 中级 | 开发者 | 65 题 / 130 分钟 | 3 年 |
| **SOA (SysOps Associate - SOA-C02)** | 中级 | 运维人员 | 65 题 / 130 分钟 | 3 年 |
| **SAP (Solutions Architect Professional - SAP-C02)** | 高级 | 资深架构师 | 75 题 / 180 分钟 | 3 年 |
| **DevOps Engineer Professional - DOP-C02)** | 高级 | DevOps 工程师 | 75 题 / 180 分钟 | 3 年 |
| **Data Engineer Associate - DEA-C01)** | 中级 | 数据工程师 | 65 题 / 130 分钟 | 3 年 |
| **Machine Learning Specialty - MLS-C01)** | 高级 | ML 工程师 | 65 题 / 180 分钟 | 3 年 |
| **Security Specialty - SCS-C02)** | 高级 | 安全工程师 | 65 题 / 170 分钟 | 3 年 |

**推荐认证路径：**

```
路径 1（架构方向）：
Cloud Practitioner → SAA → SAP

路径 2（开发方向）：
Cloud Practitioner → DVA → DevOps Professional

路径 3（运维方向）：
Cloud Practitioner → SOA → DevOps Professional

路径 4（数据方向）：
Cloud Practitioner → Data Engineer Associate → ML Specialty
```

## 9.6 面试常见问题

### Q1: IAM Role 和 IAM User 的区别？什么时候用 Role？

**参考答案：**

| 维度 | IAM User | IAM Role |
|------|----------|----------|
| 凭证类型 | 长期凭证（Access Key） | 临时凭证（通过 STS 获取） |
| 密钥管理 | 需要手动轮换 | 自动轮换（临时凭证过期） |
| 适用对象 | 人或需要长期访问的应用 | AWS 服务、跨账号访问、临时访问 |
| 安全性 | 较低（长期凭证泄露风险） | 较高（临时凭证、自动过期） |

**使用 Role 的场景：**
1. **AWS 服务间访问**：EC2 访问 S3、Lambda 访问 DynamoDB（使用 Instance Profile / Execution Role）
2. **跨账号访问**：账号 A 的服务需要访问账号 B 的资源（使用 AssumeRole）
3. **第三方访问**：外部合作伙伴访问你的 AWS 资源（使用 External ID）
4. **联合身份**：企业 SSO（ADFS、Okta）登录 AWS（使用 SAML）
5. **CI/CD**：GitHub Actions、GitLab CI 访问 AWS（使用 OIDC）

---

### Q2: CloudFormation 和 Terraform 怎么选？

**参考答案：**

| 维度 | CloudFormation | Terraform |
|------|---------------|-----------|
| 云厂商 | 仅 AWS | 多云 |
| 语言 | YAML/JSON | HCL |
| 状态管理 | AWS 托管 | 本地/远程 state file |
| 社区 | AWS 官方 | 全球社区 |
| 模块化 | Nested Stack | Module |
| 学习曲线 | 低（AWS 用户） | 中等 |

**选择建议：**
- 纯 AWS 环境、团队以 AWS 为主 → **CloudFormation**（深度集成、无需管理状态）
- 多云环境、需要统一 IaC 工具 → **Terraform**（多云支持、社区模块丰富）
- 需要精细的状态管理 → **Terraform**（state import/plan 更灵活）
- 需要 AWS 高级功能（如 StackSets）→ **CloudFormation**

---

### Q3: Well-Architected Framework 的五大支柱？

**参考答案：**

AWS Well-Architected Framework 包含**六大支柱**（2021 年新增可持续性）：

1. **运维卓越（Operational Excellence）**：高效运行和监控系统。关键实践：运营即代码、频繁小批量变更、故障演练、监控告警。

2. **安全性（Security）**：保护数据、系统和资产。关键实践：最小权限、加密、纵深防御、自动化安全检测。

3. **可靠性（Reliability）**：从故障中恢复。关键实践：多 AZ/多 Region、自动恢复、故障注入测试、备份策略。

4. **性能效率（Performance Efficiency）**：高效使用计算资源。关键实践：右置资源、数据驱动优化、Serverless、缓存。

5. **成本优化（Cost Optimization）**：避免不必要的开销。关键实践：按需付费、预留实例、资源清理、成本分摊。

6. **可持续性（Sustainability）**：减少环境影响。关键实践：选择高效 Region、优化资源利用率、使用 Graviton 处理器。

---

### Q4: 设计一个高可用的 Web 架构？

**参考答案：**

```
                    Route 53（DNS + 健康检查 + 故障转移）
                         |
                    CloudFront（CDN + WAF）
                         |
                    Application Load Balancer（多 AZ）
                    /                    \
              AZ-a                     AZ-b
              /                          \
        ECS Fargate                ECS Fargate
        (Web 服务)                 (Web 服务)
              \                          /
               \                        /
            ElastiCache Redis（多 AZ 集群）
                    |
              Aurora PostgreSQL（Multi-AZ）
              /                  \
        Primary              Standby
        (AZ-a)               (AZ-b)
```

**关键设计要点：**
1. **DNS 层**：Route 53 做健康检查和故障转移
2. **CDN 层**：CloudFront 缓存静态资源，WAF 防护
3. **负载均衡层**：ALB 跨多 AZ，自动路由
4. **计算层**：ECS Fargate（无服务器容器），Auto Scaling
5. **缓存层**：ElastiCache Redis Cluster，减轻数据库压力
6. **数据层**：Aurora Multi-AZ，自动故障转移
7. **存储层**：S3 存储静态资源和文件
8. **监控层**：CloudWatch 指标 + 告警 + Dashboard
9. **日志层**：CloudWatch Logs + X-Ray 分布式追踪
10. **安全层**：Security Group + NACL + IAM + KMS 加密

---

### Q5: SQS 和 SNS 的区别？

**参考答案：**

| 维度 | SQS | SNS |
|------|-----|-----|
| 模型 | 点对点（队列） | 发布/订阅（主题） |
| 消费者 | 1 个消费者（拉取） | 多个订阅者（推送） |
| 消息保留 | 1 分钟 - 14 天 | 即时投递，不保留 |
| 消息顺序 | Standard 无序，FIFO 有序 | 无序 |
| 吞吐量 | Standard 无限，FIFO 300 TPS | 无限 |
| 重试 | 内置（可见性超时 + DLQ） | 取决于订阅端 |
| 适用场景 | 异步任务处理、削峰填谷 | 通知、广播、事件分发 |

**组合使用（Fanout 模式）：**
```
生产者 → SNS 主题 → SQS 队列 1 → Lambda（处理订单）
                   → SQS 队列 2 → Lambda（更新库存）
                   → SQS 队列 3 → Lambda（发送通知）
                   → Email 订阅 → 运营人员
```

---

### Q6: Lambda 的冷启动如何优化？

**参考答案：**

**冷启动原因：** Lambda 函数在一段时间未被调用后，AWS 需要重新初始化执行环境（下载代码、初始化运行时、加载依赖）。

**优化方案（按效果排序）：**

1. **预置并发（Provisioned Concurrency）** - 最有效
   - 提前初始化执行环境，彻底消除冷启动
   - 适合生产环境、延迟敏感场景
   - 按预置并发数和时长收费

2. **使用 SnapStart（Java 17+ 专用）**
   - 快照启动，冷启动降至 ~200ms
   - 仅支持 Java 17+ 的 CRaC（Coordinated Restore at Checkpoint）

3. **选择轻量运行时**
   - Node.js / Python 冷启动快于 Java / .NET
   - Java 可使用 GraalVM Native Image

4. **减少初始化时间**
   - 精简依赖包（使用 Lambda Layers 共享）
   - 延迟加载非必要模块
   - 减少部署包大小

5. **保持函数温暖**
   - EventBridge 定时触发（每 5 分钟）
   - 适合非关键场景的低成本方案

6. **合理设置内存**
   - 内存配置同时影响 CPU 和网络
   - 过低内存可能导致初始化缓慢

---

### Q7: 如何实现跨 Region 灾备？

**参考答案：**

```
                    Route 53（全局 DNS + 健康检查）
                    /                    \
            主 Region (us-east-1)    备 Region (us-west-2)
                   |                       |
              ALB (多 AZ)              ALB (多 AZ)
                   |                       |
            ECS/EKS 集群             ECS/EKS 集群
                   |                       |
            ElastiCache              ElastiCache
                   |                       |
            Aurora Primary          Aurora Read Replica
                   |                       |
            S3 (数据)               S3 (跨 Region 复制)
```

**实现方案：**

1. **计算层灾备**
   - AMI 跨 Region 复制
   - ECS Task Definition / EKS 配置跨 Region 一致
   - 使用 Launch Template 确保一致性

2. **数据层灾备**
   - RDS：跨 Region Read Replica（异步复制，RPO 分钟级）
   - Aurora：Global Database（复制延迟 < 1 秒，RPO < 1 秒）
   - DynamoDB：Global Table（多 Region 活跃-活跃）
   - S3：跨 Region 复制（S3 Cross-Region Replication）

3. **网络层灾备**
   - Route 53 健康检查 + DNS 故障转移
   - Transit Gateway 跨 Region 互联
   - VPC 配置跨 Region 一致

4. **故障切换策略**
   - **主动-被动（Active-Passive）**：备 Region 待机，故障时切换
   - **主动-主动（Active-Active）**：两个 Region 同时服务，Route 53 按延迟路由

5. **关键指标**
   - RPO（数据丢失）：Aurora Global Database < 1 秒，RDS Read Replica 分钟级
   - RTO（恢复时间）：Route 53 故障转移 ~60 秒 + 应用启动时间
