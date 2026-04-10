# MyBatis与ORM面试30题

> 本题库涵盖MyBatis核心原理、ORM框架对比、缓存机制、动态SQL、插件扩展、Spring集成、MyBatis-Plus等知识点，适合Java后端开发面试准备。

---

### Q1: MyBatis的核心架构是什么？ ⭐

**答案：**

MyBatis的核心架构由以下几个层次组成：

```
┌─────────────────────────────────────────┐
│              mybatis-config.xml          │  全局配置
│              Configuration               │
├─────────────────────────────────────────┤
│           SqlSessionFactory              │  会话工厂
├─────────────────────────────────────────┤
│             SqlSession                   │  会话（接口）
├─────────────────────────────────────────┤
│          Executor (执行器)               │
│     SimpleExecutor / ReuseExecutor /     │
│     BatchExecutor / CachingExecutor      │
├─────────────────────────────────────────┤
│      StatementHandler (语句处理器)       │
│      ParameterHandler (参数处理器)       │
│      ResultSetHandler (结果集处理器)      │
│      TypeHandler (类型处理器)            │
├─────────────────────────────────────────┤
│          MappedStatement                 │  SQL映射
│          (SQL + 参数映射 + 结果映射)       │
└─────────────────────────────────────────┘
```

**核心组件说明：**

| 组件 | 职责 |
|------|------|
| **Configuration** | 全局配置，管理所有配置信息 |
| **SqlSessionFactory** | 创建SqlSession的工厂，全局唯一 |
| **SqlSession** | 面向用户的会话接口，执行SQL、管理事务 |
| **Executor** | SQL执行器，负责SQL的执行和缓存管理 |
| **MappedStatement** | 一条SQL语句的完整封装 |
| **StatementHandler** | JDBC Statement的操作封装 |
| **ParameterHandler** | 参数类型转换和设置 |
| **ResultSetHandler** | 结果集映射到Java对象 |
| **TypeHandler** | Java类型与JDBC类型的转换 |

---

### Q2: #{}和${}有什么区别？如何防止SQL注入？ ⭐

**答案：**

**核心区别：**

| 维度 | #{} | ${} |
|------|-----|-----|
| 处理方式 | 预编译处理（PreparedStatement） | 字符串替换 |
| SQL注入 | 防止SQL注入 | 不防止SQL注入 |
| 类型处理 | 自动类型转换 | 纯字符串替换 |
| 适用场景 | 参数值 | 表名、列名、ORDER BY等 |

**#{} 原理：**
```sql
-- MyBatis XML
SELECT * FROM user WHERE id = #{id}

-- 实际执行（PreparedStatement）
SELECT * FROM user WHERE id = ?
-- 参数通过setString(1, "1 OR 1=1")设置，不会被当作SQL执行
```

**${} 原理：**
```sql
-- MyBatis XML
SELECT * FROM user ORDER BY ${columnName}

-- 实际执行（字符串拼接）
SELECT * FROM user ORDER BY name
-- 如果传入 "name; DROP TABLE user;" 则会被执行
```

**SQL注入防护：**
1. **优先使用#{}**：所有参数值都使用#{}，利用PreparedStatement防止注入
2. **${}的使用场景**：表名、列名、SQL关键字等不能用预编译的地方
3. **${}的安全使用**：在Java代码中进行白名单校验

```java
// ${}安全使用示例 - 白名单校验
public List<User> queryUsers(String orderBy) {
    // 白名单校验
    Set<String> allowedColumns = Set.of("id", "name", "create_time");
    if (!allowedColumns.contains(orderBy)) {
        throw new IllegalArgumentException("Invalid column: " + orderBy);
    }
    return userMapper.selectUsers(orderBy);
}
```

```xml
<!-- XML中使用 -->
<select id="selectUsers" resultType="User">
    SELECT * FROM user ORDER BY ${orderBy}
</select>
```

---

### Q3: MyBatis的一级缓存和二级缓存有什么区别？ ⭐⭐

**答案：**

**一级缓存（Local Cache / SqlSession级别）**

- **作用域**：SqlSession级别，默认开启
- **存储位置**：BaseExecutor中的localCache（HashMap）
- **生命周期**：SqlSession关闭或调用`clearCache()`时清除
- **失效条件**：
  - 执行INSERT/UPDATE/DELETE操作
  - 调用`sqlSession.clearCache()`
  - SqlSession关闭

```java
SqlSession sqlSession = sqlSessionFactory.openSession();
UserMapper mapper = sqlSession.getMapper(UserMapper.class);

// 第一次查询，走数据库
User user1 = mapper.selectById(1);
// 第二次查询，走一级缓存
User user2 = mapper.selectById(1);

System.out.println(user1 == user2); // true（同一对象引用）

sqlSession.close();
```

**二级缓存（Second Level Cache / Mapper级别）**

- **作用域**：Mapper（namespace）级别，需要手动开启
- **存储位置**：可自定义（默认使用PerpetualCache，可集成Redis等）
- **生命周期**：SqlSessionFactory级别，多个SqlSession共享
- **使用条件**：
  - 在mybatis-config.xml中开启全局缓存：`<setting name="cacheEnabled" value="true"/>`
  - 在Mapper XML中添加`<cache/>`标签
  - 实体类必须实现Serializable接口

```xml
<!-- Mapper XML中开启二级缓存 -->
<cache
    eviction="LRU"
    flushInterval="60000"
    size="1024"
    readOnly="true"/>
```

**对比总结：**

| 维度 | 一级缓存 | 二级缓存 |
|------|---------|---------|
| 作用域 | SqlSession | Mapper（namespace） |
| 默认状态 | 开启 | 关闭 |
| 存储结构 | HashMap | 可自定义（LRU/FIFO/SOFT/WEAK） |
| 跨Session共享 | 否 | 是 |
| 序列化要求 | 无 | 实体类需实现Serializable |
| 查询顺序 | 一级缓存 → 二级缓存 → 数据库 | 二级缓存 → 一级缓存 → 数据库 |

**缓存查询顺序：**
```
查询请求 → 二级缓存 → 一级缓存 → 数据库
                ↑            ↑
            跨SqlSession   同一SqlSession
```

---

### Q4: MyBatis Mapper接口绑定的原理是什么？ ⭐⭐

**答案：**

MyBatis通过**动态代理（JDK动态代理）** 实现Mapper接口的绑定，不需要编写实现类。

**工作原理：**

```
UserMapper mapper = sqlSession.getMapper(UserMapper.class);
```

**核心流程：**

1. `SqlSession.getMapper()` 调用 `Configuration.getMapper()`
2. `Configuration` 委托给 `MapperRegistry.getMapper()`
3. `MapperRegistry` 从缓存中获取或创建 `MapperProxyFactory`
4. `MapperProxyFactory` 使用JDK动态代理创建 `MapperProxy`
5. `MapperProxy` 实现了 `InvocationHandler` 接口

**MapperProxy核心源码：**
```java
public class MapperProxy<T> implements InvocationHandler, Serializable {

    private final SqlSession sqlSession;
    private final Class<T> mapperInterface;
    private final Map<Method, MapperMethodInvoker> methodCache;

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        if (Object.class.equals(method.getDeclaringClass())) {
            return method.invoke(this, args);
        }
        // 从缓存获取MapperMethod
        MapperMethodInvoker invoker = methodCache.get(method);
        if (invoker != null) {
            return invoker.invoke(proxy, method, args, sqlSession);
        }
        // 创建并缓存MapperMethod
        return cachedInvoker(method).invoke(proxy, method, args, sqlSession);
    }
}
```

**MapperMethod执行流程：**
```
MapperProxy.invoke()
    → MapperMethod.execute()
        → 判断SQL类型（SELECT/INSERT/UPDATE/DELETE）
        → SqlCommand.getType()
        → 根据类型调用SqlSession对应方法
        → sqlSession.selectOne() / sqlSession.insert() / ...
            → Executor.query() / Executor.update()
                → StatementHandler.prepare()
                → StatementHandler.parameterize()
                → StatementHandler.query() / execute()
```

**注意事项：**
- Mapper接口不能有重载方法（因为XML中SQL的id是方法名，不允许重复）
- Mapper接口方法的参数可以加`@Param`注解指定参数名
- 返回值类型可以是实体类、List、Map、Optional等

---

### Q5: MyBatis的ResultMap映射是如何工作的？ ⭐⭐

**答案：**

**ResultMap** 是MyBatis中最强大的结果映射功能，用于将SQL查询结果映射到复杂的Java对象。

**简单映射（自动映射）：**
```xml
<!-- 自动映射（列名与属性名一致） -->
<select id="selectById" resultType="User">
    SELECT id, name, age FROM user WHERE id = #{id}
</select>
```

**自定义ResultMap：**
```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <result property="age" column="user_age"/>
    <association property="department" javaType="Department">
        <id property="id" column="dept_id"/>
        <result property="name" column="dept_name"/>
    </association>
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id"/>
        <result property="name" column="role_name"/>
    </collection>
</resultMap>
```

**映射规则：**
- `<id>`：标识主键，用于缓存和比较
- `<result>`：普通属性映射
- `<association>`：一对一关联映射
- `<collection>`：一对多关联映射
- `<discriminator>`：鉴别器（根据列值选择不同的映射）

**自动映射级别：**
```xml
<setting name="autoMappingBehavior" value="PARTIAL"/>
```
- `NONE`：关闭自动映射
- `PARTIAL`：默认值，自动映射简单属性，不映射嵌套结果
- `FULL`：自动映射所有属性（包括嵌套结果）

**下划线转驼峰：**
```xml
<setting name="mapUnderscoreToCamelCase" value="true"/>
```

---

### Q6: 什么是N+1查询问题？如何解决？ ⭐⭐

**答案：**

**N+1查询问题**是指查询1条主记录后，再执行N次查询获取关联数据，导致总共执行N+1次SQL。

**问题示例：**
```java
// 查询所有用户（1次查询）
List<User> users = userMapper.selectAll();
for (User user : users) {
    // 每个用户查询一次部门（N次查询）
    Department dept = departmentMapper.selectById(user.getDeptId());
    user.setDepartment(dept);
}
// 总共 1 + N 次查询
```

**解决方案：**

**方案1：嵌套结果（JOIN查询）**
```xml
<resultMap id="userWithDeptMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <association property="department" javaType="Department">
        <id property="id" column="dept_id"/>
        <result property="name" column="dept_name"/>
    </association>
</resultMap>

<select id="selectAllWithDept" resultMap="userWithDeptMap">
    SELECT u.id as user_id, u.name as user_name,
           d.id as dept_id, d.name as dept_name
    FROM user u
    LEFT JOIN department d ON u.dept_id = d.id
</select>
```

**方案2：嵌套查询 + 延迟加载**
```xml
<settings>
    <setting name="lazyLoadingEnabled" value="true"/>
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>

<resultMap id="userLazyMap" type="User">
    <association property="department"
                 column="dept_id"
                 select="com.example.mapper.DepartmentMapper.selectById"
                 fetchType="lazy"/>
</resultMap>
```

**方案3：批量查询（in查询）**
```java
// 先查询所有用户
List<User> users = userMapper.selectAll();
// 收集所有deptId
List<Long> deptIds = users.stream()
    .map(User::getDeptId)
    .distinct()
    .collect(Collectors.toList());
// 批量查询部门
Map<Long, Department> deptMap = departmentMapper.selectByIds(deptIds)
    .stream()
    .collect(Collectors.toMap(Department::getId, Function.identity()));
// 组装
users.forEach(u -> u.setDepartment(deptMap.get(u.getDeptId())));
```

**方案4：MyBatis-Plus的批量查询**
```java
// 使用MyBatis-Plus的LambdaQueryWrapper
List<Long> deptIds = users.stream().map(User::getDeptId).distinct().toList();
List<Department> departments = departmentService.listByIds(deptIds);
```

---

### Q7: MyBatis动态SQL有哪些标签？如何使用？ ⭐⭐

**答案：**

MyBatis动态SQL通过XML标签实现SQL的动态拼接，主要包括以下标签：

**1. if**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    WHERE 1=1
    <if test="name != null and name != ''">
        AND name LIKE CONCAT('%', #{name}, '%')
    </if>
    <if test="age != null">
        AND age = #{age}
    </if>
</select>
```

**2. choose/when/otherwise（类似switch-case）**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    WHERE status = 'ACTIVE'
    <choose>
        <when test="orderBy == 'name'">
            ORDER BY name ASC
        </when>
        <when test="orderBy == 'age'">
            ORDER BY age DESC
        </when>
        <otherwise>
            ORDER BY id ASC
        </otherwise>
    </choose>
</select>
```

**3. where（自动处理WHERE和AND/OR）**
```xml
<select id="selectUsers" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null">
            AND name = #{name}
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>
```

**4. set（自动处理SET和逗号）**
```xml
<update id="updateUser">
    UPDATE user
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="age != null">age = #{age},</if>
        <if test="email != null">email = #{email},</if>
    </set>
    WHERE id = #{id}
</update>
```

**5. foreach（批量操作）**
```xml
<select id="selectByIds" resultType="User">
    SELECT * FROM user
    WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- 批量插入 -->
<insert id="batchInsert">
    INSERT INTO user (name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age})
    </foreach>
</insert>
```

**6. trim（自定义裁剪）**
```xml
<trim prefix="WHERE" prefixOverrides="AND | OR">
    <if test="name != null">AND name = #{name}</if>
    <if test="age != null">AND age = #{age}</if>
</trim>

<trim prefix="SET" suffixOverrides=",">
    <if test="name != null">name = #{name},</if>
    <if test="age != null">age = #{age},</if>
</trim>
```

**7. sql/include（SQL片段复用）**
```xml
<sql id="userColumns">
    id, name, age, email, create_time
</sql>

<select id="selectAll" resultType="User">
    SELECT <include refid="userColumns"/> FROM user
</select>
```

**8. bind（定义变量）**
```xml
<select id="selectByName" resultType="User">
    <bind name="pattern" value="'%' + name + '%'" />
    SELECT * FROM user WHERE name LIKE #{pattern}
</select>
```

---

### Q8: MyBatis插件机制是如何工作的？ ⭐⭐⭐

**答案：**

MyBatis插件（Interceptor）基于**动态代理**实现，可以拦截四大对象的方法调用。

**可拦截的对象和方法：**

| 拦截对象 | 可拦截方法 | 用途 |
|---------|-----------|------|
| Executor | update, query, flushStatements, commit, rollback | SQL执行 |
| StatementHandler | prepare, parameterize, batch, update, query | SQL预处理和执行 |
| ParameterHandler | getParameterObject, setParameters | 参数设置 |
| ResultSetHandler | handleResultSets, handleOutputParameters | 结果映射 |

**插件开发步骤：**

```java
@Intercepts({
    @Signature(type = StatementHandler.class,
               method = "prepare",
               args = {Connection.class, Integer.class})
})
public class SqlLogPlugin implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        // 获取原始SQL
        BoundSql boundSql = statementHandler.getBoundSql();
        String sql = boundSql.getSql();
        System.out.println("执行的SQL: " + sql);
        System.out.println("参数: " + boundSql.getParameterObject());

        long start = System.currentTimeMillis();
        Object result = invocation.proceed(); // 执行原方法
        long end = System.currentTimeMillis();
        System.out.println("执行耗时: " + (end - start) + "ms");

        return result;
    }

    @Override
    public Object plugin(Object target) {
        // 使用Plugin.wrap生成代理对象
        return Plugin.wrap(target, this);
    }

    @Override
    public void setProperties(Properties properties) {
        // 读取配置属性
    }
}
```

**注册插件：**
```xml
<!-- mybatis-config.xml -->
<plugins>
    <plugin interceptor="com.example.plugin.SqlLogPlugin">
        <property name="logLevel" value="INFO"/>
    </plugin>
</plugins>
```

**插件原理（责任链模式）：**
```
目标对象 → Plugin1代理 → Plugin2代理 → Plugin3代理 → 目标对象
```

- 每个Interceptor通过`Plugin.wrap()`生成代理对象
- 多个Interceptor形成责任链
- 调用`invocation.proceed()`时传递到下一个Interceptor
- 最后执行目标方法

**PageHelper分页原理：**
1. 拦截`Executor.query()`方法
2. 获取SQL和参数
3. 根据数据库方言生成COUNT语句，先执行COUNT查询
4. 修改原始SQL添加LIMIT/OFFSET
5. 执行分页查询
6. 包装为PageInfo返回

---

### Q9: MyBatis与Spring集成的原理是什么？ ⭐⭐

**答案：**

**核心组件：**

| 组件 | 职责 |
|------|------|
| `SqlSessionFactoryBean` | 创建SqlSessionFactory，读取配置 |
| `MapperScannerConfigurer` | 扫描Mapper接口，注册为BeanDefinition |
| `SqlSessionTemplate` | 线程安全的SqlSession代理 |
| `MapperFactoryBean` | 为每个Mapper接口创建代理对象 |

**集成原理：**

**1. SqlSessionFactory的创建**
```java
@Bean
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
    SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
    factoryBean.setDataSource(dataSource);
    factoryBean.setTypeAliasesPackage("com.example.entity");
    factoryBean.setMapperLocations(new PathMatchingResourcePatternResolver()
        .getResources("classpath:mapper/*.xml"));

    // MyBatis全局配置
    org.apache.ibatis.session.Configuration configuration =
        new org.apache.ibatis.session.Configuration();
    configuration.setMapUnderscoreToCamelCase(true);
    configuration.setCacheEnabled(true);
    factoryBean.setConfiguration(configuration);

    // 注册插件
    factoryBean.setPlugins(new Interceptor[]{new PageInterceptor()});

    return factoryBean.getObject();
}
```

**2. Mapper接口的扫描与注册**
```java
@MapperScan("com.example.mapper")
// 或者在配置类中
@MapperScan(basePackages = "com.example.mapper",
            sqlSessionFactoryRef = "sqlSessionFactory")
```

`MapperScannerConfigurer`的工作流程：
1. 扫描指定包下的Mapper接口
2. 为每个接口创建`MapperFactoryBean`的BeanDefinition
3. 注册到Spring容器

**3. MapperFactoryBean的原理**
```java
public class MapperFactoryBean<T> extends SqlSessionDaoSupport implements FactoryBean<T> {

    private Class<T> mapperInterface;

    @Override
    public T getObject() throws Exception {
        return getSqlSession().getMapper(mapperInterface);
    }
}
```

**4. SqlSessionTemplate（线程安全）**
```java
public class SqlSessionTemplate implements SqlSession {

    private final SqlSession sqlSessionProxy;

    public SqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
        this.sqlSessionProxy = (SqlSession) newProxyInstance(
            SqlSessionFactory.class.getClassLoader(),
            new Class[]{SqlSession.class},
            new SqlSessionInterceptor());
    }

    // 每次方法调用都从当前事务中获取SqlSession
    private class SqlSessionInterceptor implements InvocationHandler {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            SqlSession sqlSession = getSqlSession(
                SqlSessionTemplate.this.sqlSessionFactory,
                SqlSessionTemplate.this.executorType,
                SqlSessionTemplate.this.exceptionTranslator);
            try {
                return method.invoke(sqlSession, args);
            } finally {
                // 非事务环境下关闭SqlSession
                if (sqlSession != null) {
                    closeSqlSession(sqlSession, SqlSessionTemplate.this.sqlSessionFactory);
                }
            }
        }
    }
}
```

**事务集成：**
- Spring事务管理器（DataSourceTransactionManager）管理事务
- SqlSession与Spring事务绑定
- 同一事务中多次Mapper调用共享同一个SqlSession

---

### Q10: MyBatis-Plus有哪些核心功能？ ⭐⭐

**答案：**

**MyBatis-Plus（MP）** 是MyBatis的增强工具，在MyBatis的基础上只做增强不做改变。

**核心功能：**

**1. 通用CRUD（BaseMapper）**
```java
public interface UserMapper extends BaseMapper<User> {
    // 继承即可拥有CRUD方法，无需编写XML
}

// 使用示例
userMapper.selectById(1L);
userMapper.selectList(new LambdaQueryWrapper<User>().eq(User::getName, "张三"));
userMapper.insert(user);
userMapper.updateById(user);
userMapper.deleteById(1L);
userMapper.selectPage(page, queryWrapper);
```

**2. 条件构造器（Wrapper）**
```java
// LambdaQueryWrapper（推荐，类型安全）
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getName, "张三")
       .ge(User::getAge, 18)
       .between(User::getCreateTime, startDate, endDate)
       .orderByDesc(User::getCreateTime)
       .last("LIMIT 10");

// QueryWrapper
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.eq("name", "张三")
       .ge("age", 18)
       .orderByDesc("create_time");

// UpdateWrapper
UpdateWrapper<User> updateWrapper = new UpdateWrapper<>();
updateWrapper.eq("name", "张三")
             .set("age", 25);
userMapper.update(null, updateWrapper);
```

**3. 代码生成器（AutoGenerator）**
```java
AutoGenerator generator = new AutoGenerator();
DataSourceConfig dsc = new DataSourceConfig.Builder(url, username, password).build();
generator.dataSource(dsc);

GlobalConfig globalConfig = new GlobalConfig.Builder()
    .outputDir(System.getProperty("user.dir") + "/src/main/java")
    .author("author")
    .enableSwagger()
    .build();
generator.global(globalConfig);

PackageConfig packageConfig = new PackageConfig.Builder()
    .parent("com.example")
    .moduleName("user")
    .build();
generator.packageInfo(packageConfig);

StrategyConfig strategy = new StrategyConfig.Builder()
    .addInclude("user", "department") // 表名
    .entityBuilder()
    .enableLombok()
    .enableChainModel()
    .logicDeleteColumnName("is_deleted")
    .versionColumnName("version") // 乐观锁
    .build();
generator.strategy(strategy);

generator.execute();
```
> 注意：MyBatis-Plus 3.5.4+ 代码生成器 API 已更新，以上为旧版写法

**4. 自动填充**
```java
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
        this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());
        this.strictInsertFill(metaObject, "createBy", String.class, getCurrentUser());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", Date.class, new Date());
        this.strictUpdateFill(metaObject, "updateBy", String.class, getCurrentUser());
    }
}

// 实体类
public class User {
    @TableField(fill = FieldFill.INSERT)
    private Date createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Date updateTime;
}
```

**5. 逻辑删除**
```java
@TableLogic
private Integer deleted;

// application.yml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
```

**6. 乐观锁**
```java
@Version
private Integer version;

// 更新时自动添加 WHERE version = ? AND SET version = version + 1
```

**7. 分页插件**
```java
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}

// 使用
Page<User> page = new Page<>(1, 10);
Page<User> result = userMapper.selectPage(page, wrapper);
```

---

### Q11: MyBatis有几种Executor？分别有什么特点？ ⭐⭐

**答案：**

MyBatis有四种Executor：

**1. SimpleExecutor（默认）**
- 每次执行SQL都创建新的Statement
- 执行完毕后关闭Statement
- 适用于一般场景

**2. ReuseExecutor**
- 复用Statement（以SQL为key缓存PreparedStatement）
- 相同SQL复用同一个PreparedStatement
- 适用于频繁执行相同SQL的场景

**3. BatchExecutor**
- 批量执行SQL
- 将多条SQL缓存起来，统一执行
- 适用于批量插入/更新

```java
// 使用BatchExecutor
SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH);
try {
    UserMapper mapper = session.getMapper(UserMapper.class);
    for (User user : userList) {
        mapper.insert(user);
    }
    session.commit(); // 批量提交
} finally {
    session.close();
}
```

**4. CachingExecutor**
- 装饰器模式，包装上述三种Executor
- 增加二级缓存功能
- 当`cacheEnabled=true`时使用

**Executor创建逻辑：**
```java
public Executor newExecutor(Transaction transaction, ExecutorType executorType) {
    executorType = executorType == null ? defaultExecutorType : executorType;
    Executor executor;
    switch (executorType) {
        case SIMPLE:    executor = new SimpleExecutor(this, transaction); break;
        case REUSE:     executor = new ReuseExecutor(this, transaction); break;
        case BATCH:     executor = new BatchExecutor(this, transaction); break;
        default:        throw new ExecutorException("Unknown ExecutorType: " + executorType);
    }
    if (cacheEnabled) {
        executor = new CachingExecutor(executor);
    }
    return executor;
}
```

---

### Q12: MyBatis缓存失效的场景有哪些？ ⭐⭐

**答案：**

**一级缓存失效场景：**

1. **执行增删改操作**：同一SqlSession中执行INSERT/UPDATE/DELETE后，一级缓存被清空
2. **调用clearCache()**：手动清除缓存
3. **SqlSession关闭**：SqlSession关闭后缓存不存在
4. **跨SqlSession**：不同SqlSession之间不共享一级缓存

**二级缓存失效场景：**

1. **执行增删改操作**：同一namespace下的任何增删改操作都会清空该namespace的二级缓存
2. **flushInterval到期**：配置的刷新间隔时间到达
3. **size超出限制**：缓存对象数量超过配置的size，触发淘汰策略
4. **readOnly=false**：每次获取缓存对象时都会创建新对象（反序列化），修改不会影响缓存
5. **事务提交**：在事务未提交时，查询结果不会放入二级缓存

**常见缓存问题：**

**问题1：多表关联查询缓存不一致**
```
UserMapper和DepartmentMapper都有二级缓存
查询User时关联了Department
此时修改Department，UserMapper的缓存不会更新
导致查询到过期的关联数据
```

**解决方案：**
- 关联查询的namespace不使用二级缓存
- 使用`<cache-ref>`共享缓存
- 修改关联表时手动清除相关缓存

```xml
<!-- UserMapper.xml -->
<cache-ref namespace="com.example.mapper.DepartmentMapper"/>
```

**问题2：MyBatis-Plus与二级缓存**
- MyBatis-Plus默认的通用方法会清空缓存
- 自定义SQL需要注意缓存一致性

---

### Q13: 如何自定义TypeHandler？ ⭐⭐

**答案：**

**TypeHandler** 用于Java类型与JDBC类型之间的转换。

**自定义TypeHandler示例（JSON类型）：**

```java
@MappedTypes({List.class})
@MappedJdbcTypes({JdbcType.VARCHAR})
public class JsonTypeHandler extends BaseTypeHandler<List<String>> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     List<String> parameter, JdbcType jdbcType) throws SQLException {
        try {
            ps.setString(i, objectMapper.writeValueAsString(parameter));
        } catch (JsonProcessingException e) {
            throw new SQLException("Error converting List to JSON", e);
        }
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return parseJson(rs.getString(columnName));
    }

    @Override
    public List<String> getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return parseJson(rs.getString(columnIndex));
    }

    @Override
    public List<String> getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return parseJson(cs.getString(columnIndex));
    }

    private List<String> parseJson(String json) {
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}
```

**使用方式：**

**方式1：在ResultMap中指定**
```xml
<resultMap id="userMap" type="User">
    <result property="tags" column="tags"
            typeHandler="com.example.handler.JsonTypeHandler"/>
</resultMap>
```

**方式2：在实体类字段上指定**
```java
public class User {
    @TableField(typeHandler = JsonTypeHandler.class)
    private List<String> tags;
}
```

**方式3：全局注册**
```xml
<!-- mybatis-config.xml -->
<typeHandlers>
    <typeHandler handler="com.example.handler.JsonTypeHandler"
                 javaType="java.util.List" jdbcType="VARCHAR"/>
</typeHandlers>
```

**常见自定义TypeHandler场景：**
- JSON字段（List/Map与VARCHAR互转）
- 枚举类型（Enum与VARCHAR/INT互转）
- 加密字段（敏感数据加密存储）
- 日期类型（自定义日期格式）

---

### Q14: MyBatis如何实现批量插入优化？ ⭐⭐⭐

**答案：**

**方案1：使用foreach生成批量SQL**
```xml
<insert id="batchInsert">
    INSERT INTO user (name, age, email) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age}, #{user.email})
    </foreach>
</insert>
```
- 优点：一次网络往返，效率高
- 缺点：SQL长度可能超过MySQL的`max_allowed_packet`限制
- 建议：每批500-1000条

**方案2：使用ExecutorType.BATCH**
```java
@Service
public class UserService {

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    public void batchInsert(List<User> users) {
        try (SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH)) {
            UserMapper mapper = session.getMapper(UserMapper.class);
            int count = 0;
            for (User user : users) {
                mapper.insert(user);
                count++;
                // 每1000条提交一次，避免内存溢出
                if (count % 1000 == 0) {
                    session.flushStatements();
                    session.clearCache();
                }
            }
            session.flushStatements();
            session.commit();
        }
    }
}
```

**方案3：MyBatis-Plus的saveBatch**
```java
@Service
public class UserService extends ServiceImpl<UserMapper, User> {

    public void batchInsert(List<User> users) {
        // 默认每批1000条
        this.saveBatch(users);

        // 自定义批次大小
        this.saveBatch(users, 500);
    }
}
```

**方案4：JDBC批量操作**
```java
@Repository
public class UserBatchDao {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void batchInsert(List<User> users) {
        String sql = "INSERT INTO user (name, age, email) VALUES (?, ?, ?)";
        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                User user = users.get(i);
                ps.setString(1, user.getName());
                ps.setInt(2, user.getAge());
                ps.setString(3, user.getEmail());
            }

            @Override
            public int getBatchSize() {
                return users.size();
            }
        });
    }
}
```

**性能对比：**

| 方案 | 10000条数据耗时 | 适用场景 |
|------|---------------|---------|
| 逐条insert | ~10s | 少量数据 |
| foreach批量SQL | ~0.5s | 中等数据量 |
| ExecutorType.BATCH | ~1s | 大数据量 |
| saveBatch | ~1s | MyBatis-Plus项目 |
| JDBC batchUpdate | ~0.3s | 追求极致性能 |

---

### Q15: JPA/Hibernate的核心概念有哪些？ ⭐⭐

**答案：**

**JPA（Java Persistence API）** 是Java持久化标准规范，**Hibernate** 是JPA的一种实现。

**核心概念：**

**1. EntityManager**
- JPA的核心接口，类似Hibernate的Session
- 管理实体的生命周期

```java
@PersistenceContext
private EntityManager entityManager;

// 查找
User user = entityManager.find(User.class, 1L);

// JPA查询
TypedQuery<User> query = entityManager.createQuery(
    "SELECT u FROM User u WHERE u.name = :name", User.class);
query.setParameter("name", "张三");
List<User> users = query.getResultList();

// JPQL
@Query("SELECT u FROM User u WHERE u.age > :age")
List<User> findByAge(@Param("age") int age);
```

**2. 实体生命周期**
```
new → transient（瞬态）
    │
    ├─ persist() → managed（托管态）
    │                 │
    │                 ├─ remove() → removed（删除态）
    │                 │
    │                 └─ detach() → detached（游离态）
    │
    └─ 直接使用 → detached
         │
         └─ merge() → managed
```

**3. 级联操作**
```java
@Entity
public class Order {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();
}

// CascadeType类型：
// PERSIST, MERGE, REMOVE, REFRESH, DETACH, ALL
```

**4. 懒加载**
```java
@Entity
public class User {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dept_id")
    private Department department;  // 懒加载，访问时才查询
}

// 懒加载异常处理
// 方案1：@Transactional保证Session开启
// 方案2：使用@EntityGraph指定关联查询
// 方案3：使用join fetch
@Query("SELECT u FROM User u JOIN FETCH u.department")
```

**5. 缓存机制**
- 一级缓存（EntityManager/Session级别）：自动开启
- 二级缓存（SessionFactory级别）：需要配置

```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate.cache.use_second_level_cache: true
      hibernate.cache.region.factory_class: org.hibernate.cache.ehcache.EhCacheRegionFactory
```
> 注意：Hibernate 6.x（Spring Boot 3.x）中二级缓存配置方式有变化，以上为 Hibernate 5.x 写法

---

### Q16: MyBatis vs Hibernate vs JPA 有什么区别？ ⭐⭐

**答案：**

| 维度 | MyBatis | Hibernate | JPA |
|------|---------|-----------|-----|
| 定位 | SQL映射框架 | ORM框架 | 持久化标准规范 |
| SQL控制 | 完全控制SQL | 自动生成SQL | 通过JPQL/HQL |
| 学习曲线 | 低 | 高 | 中 |
| 性能优化 | 灵活可控 | 需要了解HQL优化 | 取决于实现 |
| 数据库移植 | SQL与数据库耦合 | 方言自动适配 | 方言自动适配 |
| 适合场景 | 复杂SQL、报表 | CRUD密集型 | 标准化项目 |

**MyBatis优势：**
- SQL可控，方便优化复杂查询
- 学习成本低
- 与现有SQL无缝集成
- 灵活性高

**Hibernate优势：**
- 开发效率高，减少SQL编写
- 自动建表（DDL）
- 缓存机制完善
- 数据库移植性好
- 支持乐观锁、版本控制

**选择建议：**
- **互联网项目**：MyBatis / MyBatis-Plus（SQL可控，方便优化）
- **企业级项目**：JPA/Hibernate（开发效率高，标准化）
- **混合使用**：Spring Data JPA + MyBatis（简单CRUD用JPA，复杂查询用MyBatis）

---

### Q17: HikariCP和Druid连接池有什么区别？ ⭐⭐

**答案：**

| 维度 | HikariCP | Druid |
|------|---------|-------|
| 性能 | 极高（最快） | 较高 |
| 代码量 | 小（精简） | 大（功能丰富） |
| 监控 | 基础（JMX） | 丰富（内置监控页面） |
| SQL监控 | 不支持 | 支持 |
| 防SQL注入 | 不支持 | 支持（WallFilter） |
| Spring Boot默认 | 是（2.0+） | 否 |
| 社区 | 活跃 | 活跃（阿里） |

**HikariCP配置：**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: root
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-timeout: 30000
      connection-test-query: SELECT 1
      pool-name: MyHikariCP
```

**Druid配置：**
```yaml
spring:
  datasource:
    type: com.alibaba.druid.pool.DruidDataSource
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: root
    druid:
      initial-size: 5
      min-idle: 5
      max-active: 20
      max-wait: 60000
      time-between-eviction-runs-millis: 60000
      min-evictable-idle-time-millis: 300000
      validation-query: SELECT 1
      test-while-idle: true
      test-on-borrow: false
      test-on-return: false
      filters: stat,wall
      stat-view-servlet:
        enabled: true
        login-username: admin
        login-password: admin
```

**性能对比：**
- HikariCP在连接获取/归还速度上优于Druid
- HikariCP通过优化并发控制（ConcurrentBag）减少线程竞争
- HikariCP字节码精简（javassist优化），减少GC压力

**选择建议：**
- 追求极致性能：HikariCP
- 需要SQL监控和防火墙：Druid
- Spring Boot默认推荐：HikariCP

---

### Q18: MyBatis如何实现分页查询？ ⭐⭐

**答案：**

**方案1：RowBounds（内存分页，不推荐）**
```java
List<User> users = userMapper.selectAll(new RowBounds(0, 10));
// 底层是查询所有数据后在内存中截取，性能差
```

**方案2：PageHelper（推荐）**
```java
// 使用PageHelper
PageHelper.startPage(1, 10);
List<User> users = userMapper.selectAll();
PageInfo<User> pageInfo = new PageInfo<>(users);

// PageInfo包含的信息
pageInfo.getTotal();      // 总记录数
pageInfo.getPages();      // 总页数
pageInfo.getPageNum();    // 当前页
pageInfo.getPageSize();   // 每页大小
pageInfo.getList();       // 当前页数据
```

**PageHelper原理：**
1. 使用MyBatis拦截器拦截`Executor.query()`
2. ThreadLocal保存分页参数
3. 生成COUNT语句查询总数
4. 修改原始SQL添加分页语句（MySQL: LIMIT, Oracle: ROWNUM）
5. 执行分页查询

**方案3：MyBatis-Plus分页**
```java
// 配置分页插件
@Configuration
public class MybatisPlusConfig {
    @Bean
    public MybatisPlusInterceptor interceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}

// 使用
Page<User> page = new Page<>(1, 10);
Page<User> result = userMapper.selectPage(page,
    new LambdaQueryWrapper<User>().ge(User::getAge, 18));
```

**方案4：手写分页SQL**
```xml
<select id="selectPage" resultType="User">
    SELECT * FROM user
    WHERE age > #{age}
    LIMIT #{offset}, #{pageSize}
</select>

<select id="selectCount" resultType="int">
    SELECT COUNT(*) FROM user WHERE age > #{age}
</select>
```

---

### Q19: MyBatis的延迟加载是如何实现的？ ⭐⭐

**答案：**

**延迟加载（Lazy Loading）** 是指在需要用到关联对象时才执行查询，而不是在查询主对象时立即加载。

**配置方式：**
```xml
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 按需加载（false表示调用任何属性都会加载所有延迟属性） -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

**实现原理：**

MyBatis通过**动态代理**实现延迟加载：

1. 查询主对象时，关联对象不查询
2. 关联对象字段使用代理对象填充
3. 访问关联对象属性时，代理对象触发真正的查询
4. 查询结果替换代理对象

```xml
<resultMap id="userWithDeptMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <association property="department" javaType="Department"
                 column="dept_id"
                 select="com.example.mapper.DepartmentMapper.selectById"
                 fetchType="lazy"/>
</resultMap>
```

**代理对象创建：**
- MyBatis使用Javassist或CGLIB创建代理对象
- 代理对象实现了关联对象的接口
- 代理对象中保存了触发加载所需的信息（SqlSession、MappedStatement、参数等）

**fetchType属性：**
- `lazy`：延迟加载
- `eager`：立即加载（覆盖全局配置）

**注意事项：**
- 延迟加载需要在SqlSession关闭前访问关联对象
- Spring集成时，确保在事务范围内访问
- MyBatis-Plus中也可以使用延迟加载

---

### Q20: MyBatis如何处理事务？ ⭐⭐

**答案：**

**MyBatis事务管理：**

**1. JdbcTransaction（默认）**
- 使用JDBC的Connection管理事务
- `connection.setAutoCommit(false)` 开启事务
- `connection.commit()` 提交事务
- `connection.rollback()` 回滚事务

**2. ManagedTransaction**
- 事务管理交给容器（如Spring）
- MyBatis自身不管理事务的提交和回滚

**MyBatis-Spring事务集成：**

```java
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;
    @Autowired
    private OrderMapper orderMapper;

    @Transactional
    public void createUserAndOrder(User user, Order order) {
        userMapper.insert(user);
        order.setUserId(user.getId());
        orderMapper.insert(order);
        // 两个操作在同一个事务中，任一失败都会回滚
    }
}
```

**事务传播行为：**
```java
@Transactional(propagation = Propagation.REQUIRED)
// REQUIRED（默认）：如果当前有事务则加入，否则新建
// REQUIRES_NEW：总是新建事务，挂起当前事务
// NESTED：嵌套事务（savepoint）
// SUPPORTS：有事务则加入，没有则以非事务方式执行
// NOT_SUPPORTED：以非事务方式执行，挂起当前事务
// MANDATORY：必须在事务中执行，否则抛异常
// NEVER：不能在事务中执行，否则抛异常
```

**事务隔离级别：**
```java
@Transactional(isolation = Isolation.READ_COMMITTED)
// DEFAULT：使用数据库默认隔离级别
// READ_UNCOMMITTED：读未提交
// READ_COMMITTED：读已提交（Oracle默认）
// REPEATABLE_READ：可重复读（MySQL默认）
// SERIALIZABLE：串行化
```

**注意事项：**
- `@Transactional` 只对public方法生效
- 同一个类中方法调用不会触发事务代理
- 建议在Service层使用事务

---

### Q21: MyBatis的Mapper XML中如何实现枚举映射？ ⭐⭐

**答案：**

**方案1：使用MyBatis内置的EnumTypeHandler**
```xml
<!-- 默认使用EnumTypeHandler，存储枚举名称 -->
<resultMap id="userMap" type="User">
    <result property="status" column="status"
            typeHandler="org.apache.ibatis.type.EnumTypeHandler"/>
</resultMap>
```
- 数据库存储：`ACTIVE`（枚举名称）

**方案2：使用EnumOrdinalTypeHandler**
```xml
<result property="status" column="status"
        typeHandler="org.apache.ibatis.type.EnumOrdinalTypeHandler"/>
```
- 数据库存储：`0`（枚举序号）
- 缺点：修改枚举顺序会导致数据错误

**方案3：自定义枚举TypeHandler（推荐）**
```java
public enum UserStatus {
    ACTIVE(1, "激活"),
    INACTIVE(0, "未激活"),
    BANNED(-1, "封禁");

    private final int code;
    private final String desc;

    UserStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public int getCode() { return code; }
    public String getDesc() { return desc; }

    public static UserStatus fromCode(int code) {
        return Arrays.stream(values())
            .filter(s -> s.code == code)
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown code: " + code));
    }
}
```

```java
@MappedTypes(UserStatus.class)
@MappedJdbcTypes(JdbcType.INTEGER)
public class UserStatusTypeHandler extends BaseTypeHandler<UserStatus> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i,
                                     UserStatus parameter, JdbcType jdbcType) throws SQLException {
        ps.setInt(i, parameter.getCode());
    }

    @Override
    public UserStatus getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return UserStatus.fromCode(rs.getInt(columnName));
    }

    @Override
    public UserStatus getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return UserStatus.fromCode(rs.getInt(columnIndex));
    }

    @Override
    public UserStatus getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return UserStatus.fromCode(cs.getInt(columnIndex));
    }
}
```

**方案4：MyBatis-Plus中使用枚举**
```java
public enum UserStatus implements IEnum<Integer> {
    ACTIVE(1, "激活"),
    INACTIVE(0, "未激活");

    private final int code;
    UserStatus(int code) { this.code = code; }

    @Override
    public Integer getValue() { return code; }
}

// 实体类
public class User {
    private UserStatus status;
}
```

---

### Q22: MyBatis如何实现多数据源配置？ ⭐⭐⭐

**答案：**

**方案1：使用@DS注解（dynamic-datasource，推荐）**

```xml
<!-- 引入依赖 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
    <version>3.6.1</version>
</dependency>
```

```yaml
spring:
  datasource:
    dynamic:
      primary: master
      datasource:
        master:
          url: jdbc:mysql://localhost:3306/db_master
          username: root
          password: root
        slave:
          url: jdbc:mysql://localhost:3306/db_slave
          username: root
          password: root
```

```java
@Service
public class UserService {

    @DS("master")
    public User findById(Long id) {
        return userMapper.selectById(id);
    }

    @DS("slave")
    public List<User> listAll() {
        return userMapper.selectList(null);
    }
}
```

**方案2：手动配置多数据源**

```java
@Configuration
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.master")
    @Primary
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.slave")
    public DataSource slaveDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public SqlSessionFactory masterSqlSessionFactory(
            @Qualifier("masterDataSource") DataSource dataSource) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        bean.setMapperLocations(new PathMatchingResourcePatternResolver()
            .getResources("classpath:mapper/master/*.xml"));
        return bean.getObject();
    }

    @Bean
    public SqlSessionFactory slaveSqlSessionFactory(
            @Qualifier("slaveDataSource") DataSource dataSource) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(dataSource);
        bean.setMapperLocations(new PathMatchingResourcePatternResolver()
            .getResources("classpath:mapper/slave/*.xml"));
        return bean.getObject();
    }
}
```

**方案3：AbstractRoutingDataSource（Spring原生）**

```java
public class DynamicDataSource extends AbstractRoutingDataSource {

    @Override
    protected Object determineCurrentLookupKey() {
        return DataSourceContextHolder.getDataSourceType();
    }
}

public class DataSourceContextHolder {
    private static final ThreadLocal<String> CONTEXT = new ThreadLocal<>();

    public static void setDataSourceType(String type) {
        CONTEXT.set(type);
    }

    public static String getDataSourceType() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}
```

---

### Q23: MyBatis-Plus的逻辑删除是如何实现的？ ⭐⭐

**答案：**

**逻辑删除**通过在数据库中增加一个标识字段（如`is_deleted`），删除操作变为更新操作。

**配置方式：**
```yaml
mybatis-plus:
  global-config:
    db-config:
      logic-delete-field: deleted      # 逻辑删除字段名
      logic-delete-value: 1            # 删除后的值
      logic-not-delete-value: 0        # 未删除的值
```

**实体类：**
```java
public class User {
    private Long id;
    private String name;

    @TableLogic
    private Integer deleted;
}
```

**执行效果：**
```java
// 调用删除
userMapper.deleteById(1L);
// 实际执行的SQL：UPDATE user SET deleted = 1 WHERE id = 1

// 调用查询
userMapper.selectById(1L);
// 实际执行的SQL：SELECT * FROM user WHERE id = 1 AND deleted = 0

// 调用列表查询
userMapper.selectList(null);
// 实际执行的SQL：SELECT * FROM user WHERE deleted = 0
```

**注意事项：**
1. 逻辑删除会自动在所有查询条件中添加`deleted = 0`
2. `selectById`查询已删除的数据会返回null
3. 如果需要查询包含已删除的数据，需要手写SQL
4. 唯一索引需要考虑逻辑删除字段（联合唯一索引）
5. 与物理删除相比，逻辑删除会导致数据量持续增长

**自定义SQL中处理逻辑删除：**
```xml
<!-- 需要手动添加deleted条件 -->
<select id="selectWithDeleted" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>
```

---

### Q24: MyBatis的日志打印如何配置？ ⭐

**答案：**

**MyBatis日志配置：**

```yaml
# application.yml
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

**可选的日志实现：**

| 日志实现 | 说明 |
|---------|------|
| `StdOutImpl` | 输出到控制台（开发环境） |
| `Slf4jImpl` | 使用SLF4J（推荐） |
| `Log4j2Impl` | 使用Log4j2 |
| `Jdk14LoggingImpl` | 使用JDK日志 |
| `CommonsLoggingImpl` | 使用Apache Commons Logging |
| `NoLoggingImpl` | 不输出日志 |

**使用SLF4J（推荐）：**
```yaml
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl

logging:
  level:
    com.example.mapper: debug    # 打印SQL日志
```

**logback.xml配置：**
```xml
<configuration>
    <!-- 打印MyBatis SQL日志 -->
    <logger name="com.example.mapper" level="DEBUG"/>

    <!-- 打印SQL参数（使用P6Spy） -->
    <logger name="p6spy" level="INFO"/>
</configuration>
```

**使用P6Spy打印完整SQL（推荐生产环境调试）：**
```yaml
spring:
  datasource:
    url: jdbc:p6spy:mysql://localhost:3306/mydb
    driver-class-name: com.p6spy.engine.spy.P6SpyDriver
```

```properties
# spy.properties
modulelist=com.p6spy.engine.spy.P6SpyFactory,com.p6spy.engine.logging.P6LogFactory
logMessageFormat=com.p6spy.engine.spy.appender.SingleLineFormat
dateformat=yyyy-MM-dd HH:mm:ss
```

---

### Q25: MyBatis-Plus的条件构造器有哪些用法？ ⭐⭐

**答案：**

**1. QueryWrapper**
```java
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.select("id", "name", "age")          // 指定查询列
       .eq("name", "张三")                    // 等于
       .ne("status", 0)                       // 不等于
       .gt("age", 18)                         // 大于
       .ge("age", 18)                         // 大于等于
       .lt("age", 60)                         // 小于
       .le("age", 60)                         // 小于等于
       .between("age", 18, 60)                // BETWEEN
       .notBetween("age", 0, 18)              // NOT BETWEEN
       .like("name", "张")                    // LIKE '%张%'
       .likeLeft("name", "三")                // LIKE '%三'
       .likeRight("name", "张")               // LIKE '张%'
       .notLike("name", "李")                 // NOT LIKE
       .isNull("deleted_at")                  // IS NULL
       .isNotNull("name")                     // IS NOT NULL
       .in("status", 1, 2, 3)                // IN
       .notIn("status", 0, -1)               // NOT IN
       .inSql("dept_id", "SELECT id FROM department WHERE name = '技术部'")  // IN (SQL)
       .groupBy("dept_id")                    // GROUP BY
       .having("COUNT(*) > 5")                // HAVING
       .orderByAsc("age")                     // ORDER BY ASC
       .orderByDesc("create_time")            // ORDER BY DESC
       .last("LIMIT 10")                      // 追加SQL片段
       .exists("SELECT 1 FROM order WHERE order.user_id = user.id")  // EXISTS
       .notExists("SELECT 1 FROM blacklist WHERE user_id = user.id"); // NOT EXISTS
```

**2. LambdaQueryWrapper（推荐，类型安全）**
```java
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getName, "张三")
       .ge(User::getAge, 18)
       .between(User::getCreateTime, start, end)
       .orderByDesc(User::getCreateTime);

// 防止列名写错，编译期检查
```

**3. UpdateWrapper**
```java
UpdateWrapper<User> wrapper = new UpdateWrapper<>();
wrapper.eq("id", 1)
       .set("name", "李四")
       .set("age", 25)
       .set("update_time", new Date());
userMapper.update(null, wrapper);
```

**4. LambdaUpdateWrapper**
```java
LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<>();
wrapper.eq(User::getId, 1)
       .set(User::getName, "李四")
       .set(User::getAge, 25);
userMapper.update(null, wrapper);
```

---

### Q26: MyBatis如何实现读写分离？ ⭐⭐⭐

**答案：**

**方案1：基于AOP + 自定义注解**
```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ReadOnly {
}

@Aspect
@Component
public class DataSourceAspect {

    @Before("@annotation(readOnly)")
    public void switchToSlave(ReadOnly readOnly) {
        DataSourceContextHolder.setDataSourceType("slave");
    }

    @After("@annotation(readOnly)")
    public void restoreMaster() {
        DataSourceContextHolder.clear();
    }
}

@Service
public class UserService {
    @ReadOnly
    public List<User> listUsers() {
        return userMapper.selectList(null);  // 走从库
    }

    @Transactional
    public void createUser(User user) {
        userMapper.insert(user);  // 走主库
    }
}
```

**方案2：dynamic-datasource（推荐）**
```java
@Service
public class UserService {

    @DS("master")
    @Transactional
    public void createUser(User user) {
        userMapper.insert(user);
    }

    @DS("slave")
    public List<User> listUsers() {
        return userMapper.selectList(null);
    }
}
```

**方案3：MyBatis插件实现自动读写分离**
```java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
               args = {MappedStatement.class, Object.class,
                       RowBounds.class, ResultHandler.class}),
    @Signature(type = Executor.class, method = "update",
               args = {MappedStatement.class, Object.class})
})
public class ReadWriteSplitPlugin implements Interceptor {

    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object parameter = invocation.getArgs()[1];
        // 根据SQL类型判断读写
        // SELECT → 从库
        // INSERT/UPDATE/DELETE → 主库
        // 注意：事务内的查询应该走主库
        return invocation.proceed();
    }
}
```

**注意事项：**
1. 事务内的所有操作必须在同一个数据源（主库）
2. 写操作后的立即读需要走主库（主从同步延迟）
3. 使用`@Transactional`的方法默认走主库
4. 主从同步延迟可能导致读到旧数据

---

### Q27: MyBatis的resultType和resultMap有什么区别？ ⭐

**答案：**

| 维度 | resultType | resultMap |
|------|-----------|-----------|
| 映射方式 | 自动映射（列名=属性名） | 自定义映射规则 |
| 配置复杂度 | 简单 | 复杂 |
| 功能 | 简单映射 | 支持关联、嵌套、鉴别器 |
| 性能 | 略好（无额外处理） | 略差（需要解析映射规则） |
| 下划线转驼峰 | 需要配置mapUnderscoreToCamelCase | 不需要（手动指定） |

**resultType使用：**
```xml
<!-- 列名与属性名一致时使用 -->
<select id="selectById" resultType="User">
    SELECT id, name, age FROM user WHERE id = #{id}
</select>

<!-- 列名与属性名不一致时，使用别名 -->
<select id="selectById" resultType="User">
    SELECT id, user_name as name, user_age as age FROM user WHERE id = #{id}
</select>
```

**resultMap使用：**
```xml
<resultMap id="userMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <result property="age" column="user_age"/>
</resultMap>

<select id="selectById" resultMap="userMap">
    SELECT user_id, user_name, user_age FROM user WHERE user_id = #{id}
</select>
```

**选择建议：**
- 简单查询：resultType（配合`mapUnderscoreToCamelCase`）
- 复杂映射（关联查询、嵌套结果）：resultMap

---

### Q28: MyBatis如何处理一对多和多对多关系？ ⭐⭐

**答案：**

**一对多（association + collection）**

```xml
<!-- 一对一：用户 → 部门 -->
<resultMap id="userWithDeptMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <association property="department" javaType="Department">
        <id property="id" column="dept_id"/>
        <result property="name" column="dept_name"/>
    </association>
</resultMap>

<select id="selectUserWithDept" resultMap="userWithDeptMap">
    SELECT u.id as user_id, u.name as user_name,
           d.id as dept_id, d.name as dept_name
    FROM user u
    LEFT JOIN department d ON u.dept_id = d.id
    WHERE u.id = #{id}
</select>
```

**一对多：部门 → 用户列表**
```xml
<resultMap id="deptWithUsersMap" type="Department">
    <id property="id" column="dept_id"/>
    <result property="name" column="dept_name"/>
    <collection property="users" ofType="User">
        <id property="id" column="user_id"/>
        <result property="name" column="user_name"/>
    </collection>
</resultMap>

<select id="selectDeptWithUsers" resultMap="deptWithUsersMap">
    SELECT d.id as dept_id, d.name as dept_name,
           u.id as user_id, u.name as user_name
    FROM department d
    LEFT JOIN user u ON d.id = u.dept_id
    WHERE d.id = #{id}
</select>
```

**多对多：用户 ↔ 角色**
```xml
<resultMap id="userWithRolesMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <collection property="roles" ofType="Role">
        <id property="id" column="role_id"/>
        <result property="name" column="role_name"/>
    </collection>
</resultMap>

<select id="selectUserWithRoles" resultMap="userWithRolesMap">
    SELECT u.id as user_id, u.name as user_name,
           r.id as role_id, r.name as role_name
    FROM user u
    LEFT JOIN user_role ur ON u.id = ur.user_id
    LEFT JOIN role r ON ur.role_id = r.id
    WHERE u.id = #{id}
</select>
```

**嵌套查询方式：**
```xml
<resultMap id="userLazyMap" type="User">
    <collection property="roles"
                column="id"
                select="com.example.mapper.RoleMapper.selectByUserId"
                fetchType="lazy"/>
</resultMap>
```

---

### Q29: MyBatis-Plus的自动代码生成器如何使用？ ⭐⭐

**答案：**

**MyBatis-Plus Generator 3.5.x用法：**

```java
public class CodeGenerator {

    public static void main(String[] args) {
        // 数据源配置
        DataSourceConfig.Builder dataSourceBuilder = new DataSourceConfig.Builder(
            "jdbc:mysql://localhost:3306/mydb?useSSL=false",
            "root",
            "root"
        );

        FastAutoGenerator.create(dataSourceBuilder)
            // 全局配置
            .globalConfig(builder -> {
                builder.author("generator")
                       .outputDir(System.getProperty("user.dir") + "/src/main/java")
                       .commentDate(DateType.TIME_PACK)
                       .disableOpenDir();
            })
            // 包配置
            .packageConfig(builder -> {
                builder.parent("com.example")
                       .moduleName("system")
                       .entity("entity")
                       .mapper("mapper")
                       .service("service")
                       .serviceImpl("service.impl")
                       .controller("controller")
                       .pathInfo(Collections.singletonMap(
                           OutputFile.xml,
                           System.getProperty("user.dir") + "/src/main/resources/mapper"
                       ));
            })
            // 策略配置
            .strategyConfig(builder -> {
                builder.addInclude("user", "role", "menu") // 表名
                       .addTablePrefix("sys_", "t_")        // 过滤表前缀
                       // Entity策略
                       .entityBuilder()
                       .enableLombok()
                       .enableChainModel()
                       .enableActiveRecord()
                       .enableTableFieldAnnotation()
                       .logicDeleteColumnName("is_deleted")
                       .versionColumnName("version")
                       .naming(NamingStrategy.underline_to_camel)
                       .columnNaming(NamingStrategy.underline_to_camel)
                       // Controller策略
                       .controllerBuilder()
                       .enableRestStyle()
                       // Service策略
                       .serviceBuilder()
                       .formatServiceFileName("%sService")
                       .formatServiceImplFileName("%sServiceImpl")
                       // Mapper策略
                       .mapperBuilder()
                       .enableMapperAnnotation()
                       .enableBaseResultMap()
                       .enableBaseColumnList();
            })
            // 模板引擎配置（可选）
            .templateConfig(builder -> {
                builder.disable(TemplateType.CONTROLLER); // 不生成Controller
            })
            // 执行
            .execute();
    }
}
```

**生成的代码结构：**
```
com.example.system
├── entity/
│   └── User.java          // 实体类（Lombok + 链式调用）
├── mapper/
│   └── UserMapper.java    // Mapper接口（extends BaseMapper）
├── service/
│   ├── UserService.java   // Service接口（extends IService）
│   └── impl/
│       └── UserServiceImpl.java  // Service实现（extends ServiceImpl）
└── controller/
    └── UserController.java  // Controller（RESTful风格）
```

---

### Q30: MyBatis有哪些常见面试问题总结？ ⭐⭐⭐

**答案：**

**高频面试问题汇总：**

**1. MyBatis是半自动ORM吗？**
是的。MyBatis需要程序员自己编写SQL，只负责SQL结果的映射，不像Hibernate全自动生成SQL。

**2. MyBatis为什么用SqlSession而不是直接用Connection？**
SqlSession提供了更高级的API，集成了事务管理、缓存、Mapper代理等功能，屏蔽了底层JDBC的复杂性。

**3. MyBatis的延迟加载有什么限制？**
- 必须在SqlSession范围内使用
- 不能序列化代理对象
- 通过equals/hashCode/toString触发加载可能导致意外查询

**4. MyBatis-Plus的IService有哪些常用方法？**
```java
save(entity)              // 插入
saveBatch(list)           // 批量插入
removeById(id)            // 根据ID删除
removeByMap(map)          // 根据条件删除
updateById(entity)        // 根据ID更新
update(entity, wrapper)   // 根据条件更新
getById(id)               // 根据ID查询
list(wrapper)             // 条件查询列表
page(page, wrapper)       // 分页查询
count(wrapper)            // 条件计数
getOne(wrapper)           // 查询单条
```

**5. MyBatis如何防止全表更新/删除？**
- MyBatis-Plus的`update`和`delete`方法默认需要传入Wrapper条件
- 配置拦截器阻止全表操作

```java
@Bean
public MybatisPlusInterceptor mybatisPlusInterceptor() {
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    // 防止全表更新/删除
    interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());
    return interceptor;
}
```

**6. MyBatis的XML文件中大于号和小于号如何处理？**
```xml
<!-- 方式1：使用CDATA -->
<if test="age != null">
    AND age <![CDATA[ > ]]> #{age}
</if>

<!-- 方式2：使用转义字符 -->
<if test="age != null">
    AND age &gt; #{age}
</if>
```

**7. MyBatis如何传递多个参数？**
```java
// 方式1：@Param注解
User selectByNameAndAge(@Param("name") String name, @Param("age") int age);

// 方式2：Map
User selectByMap(Map<String, Object> params);

// 方式3：实体类
User selectByEntity(User user);

// 方式4：List/Array（配合foreach）
List<User> selectByIds(@Param("ids") List<Long> ids);
```

---

> 本题库覆盖了MyBatis及ORM框架的核心知识点，建议结合实际项目经验加深理解。面试中遇到MyBatis相关问题时，尽量结合源码和实际使用场景来回答。
