# Spring 框架面试 40 题

> 基于 Spring 框架知识体系整理，涵盖 IoC/DI、Bean 生命周期、AOP、事务、Spring Boot、Spring MVC、事件与异步等核心考点。

---

## 目录

- [一、IoC/DI（8题）](#一iocdi8题)
- [二、Bean 生命周期（5题）](#二bean-生命周期5题)
- [三、AOP（6题）](#三aop6题)
- [四、事务（6题）](#四事务6题)
- [五、Spring Boot（5题）](#五spring-boot5题)
- [六、Spring MVC（4题）](#六spring-mvc4题)
- [七、Spring 事件与异步（3题）](#七spring-事件与异步3题)
- [八、综合设计题（3题）](#八综合设计题3题)
- [高频考点速查表](#高频考点速查表)

---

## 一、IoC/DI（8题）

### Q1: 什么是 IoC？什么是 DI？

**难度**: ⭐

**答案**: IoC（控制反转）是一种设计思想，将对象的创建和管理权从代码内部转移到外部容器。DI（依赖注入）是 IoC 的具体实现方式，容器在运行时自动将依赖注入到对象中。

**解析**:
- 没有 IoC：手动创建依赖对象（紧耦合）
- 有 IoC：由容器注入依赖（松耦合）

```java
// 没有 IoC
public class OrderService {
    private OrderRepository repo = new OrderRepository(); // 硬编码
}

// 有 IoC
@Service
public class OrderService {
    private final OrderRepository repo;
    @Autowired // 容器负责注入
    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }
}
```

---

### Q2: BeanFactory 和 ApplicationContext 的区别？

**难度**: ⭐⭐

**答案**:

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| Bean 加载时机 | 懒加载（按需创建） | 预加载（启动时创建所有单例） |
| 国际化支持 | 不支持 | 支持 MessageSource |
| 事件发布 | 不支持 | 支持 ApplicationEvent |
| AOP 集成 | 需手动配置 | 自动集成 |
| 资源访问 | 简单 | 支持 ResourceLoader |
| BeanPostProcessor | 需手动调用 | 自动检测并注册 |

**解析**: 实际开发中几乎总是使用 `ApplicationContext`，`BeanFactory` 是 Spring 的底层基础设施。

```java
// BeanFactory - 延迟加载
BeanFactory factory = new XmlBeanFactory(new ClassPathResource("beans.xml"));
// ⚠️ XmlBeanFactory 在 Spring 5.2 已废弃，Spring 6 已移除，推荐使用 ClassPathXmlApplicationContext

// ApplicationContext - 预加载
ApplicationContext context = new ClassPathXmlApplicationContext("beans.xml");
// 或注解方式
AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
```

---

### Q3: @Autowired 和 @Resource 的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | @Autowired | @Resource |
|--------|-----------|-----------|
| 来源 | Spring | JSR-250（Java 标准） |
| 匹配方式 | 先按类型，再按名称 | 先按名称，再按类型 |
| required 属性 | 支持（@Autowired(required=false)） | 不支持 |
| 适用位置 | 构造器、方法、字段、参数 | 字段、方法 |

**解析**:
```java
// @Autowired：按类型注入
@Autowired
private UserService userService; // 类型匹配即可

// @Autowired + @Qualifier：按名称注入
@Autowired
@Qualifier("userServiceImpl")
private UserService userService;

// @Resource：按名称注入
@Resource(name = "userServiceImpl")
private UserService userService;
```

- 推荐使用构造器注入 + `@Autowired`（Spring 官方推荐），便于测试且保证不可变性

---

### Q4: Spring 如何解决循环依赖？

**难度**: ⭐⭐⭐

**答案**: Spring 通过**三级缓存**解决单例 Bean 的循环依赖问题。

**解析**:
- 三级缓存：
  1. `singletonObjects`（一级缓存）：存放完全初始化好的 Bean
  2. `earlySingletonObjects`（二级缓存）：存放提前暴露的早期 Bean 引用（可能是代理对象）
  3. `singletonFactories`（三级缓存）：存放 Bean 工厂（ObjectFactory），用于生成早期 Bean 引用

- 解决流程（以 A 依赖 B，B 依赖 A 为例）：
  1. 实例化 A，将 A 的工厂放入三级缓存
  2. A 属性注入时发现需要 B，去创建 B
  3. 实例化 B，将 B 的工厂放入三级缓存
  4. B 属性注入时发现需要 A，从三级缓存获取 A 的早期引用（升级到二级缓存）
  5. B 初始化完成，放入一级缓存
  6. A 继续属性注入（拿到 B），初始化完成，放入一级缓存

- **不能解决的场景**：
  1. 构造器注入的循环依赖（无法提前暴露引用）
  2. 原型（prototype）Bean 的循环依赖

---

### Q5: Spring Bean 的作用域有哪些？

**难度**: ⭐⭐

**答案**:

| 作用域 | 说明 |
|--------|------|
| singleton（默认） | 整个 IoC 容器中只有一个实例 |
| prototype | 每次请求创建一个新实例 |
| request | 每个 HTTP 请求一个实例（Web 应用） |
| session | 每个 HTTP Session 一个实例 |
| application | 每个 ServletContext 一个实例 |

**解析**:
- singleton Bean 是线程不安全的（共享实例），需要开发者自行保证线程安全
- prototype Bean 不会自动销毁，需要实现 `DisposableBean` 或使用 `@PreDestroy` 并配合 BeanPostProcessor

---

### Q6: @Component、@Service、@Repository、@Controller 的区别？

**难度**: ⭐

**答案**: 功能上完全相同（都是注册 Bean），区别在于语义：
- `@Component`：通用组件
- `@Service`：业务层
- `@Repository`：数据访问层（自动转换异常为 Spring 的 DataAccessException）
- `@Controller`：控制层（Spring MVC）

---

### Q7: @Configuration 和 @Component 的区别？

**难度**: ⭐⭐

**答案**: `@Configuration` 是 `@Component` 的增强版，使用 CGLIB 代理保证 `@Bean` 方法的单例语义。

**解析**:
```java
@Configuration
public class AppConfig {
    @Bean
    public DataSource dataSource() {
        return new HikariDataSource();
    }

    @Bean
    public PlatformTransactionManager txManager() {
        return new DataSourceTransactionManager(dataSource()); // 调用同一个代理方法
    }
}
// dataSource() 被代理，多次调用返回同一个实例
```

- `@Component` 中的 `@Bean` 方法每次调用都会创建新对象
- `@Configuration` 中的 `@Bean` 方法被 CGLIB 代理，保证单例

---

### Q8: Spring 支持哪些依赖注入方式？

**难度**: ⭐⭐

**答案**: 三种方式：构造器注入（推荐）、Setter 注入、字段注入。

**解析**:
```java
// 1. 构造器注入（推荐！不可变、利于测试）
@Service
public class UserService {
    private final UserRepository repo;
    @Autowired
    public UserService(UserRepository repo) { this.repo = repo; }
}

// 2. Setter 注入（可选依赖）
@Service
public class UserService {
    private EmailService emailService;
    @Autowired
    public void setEmailService(EmailService emailService) {
        this.emailService = emailService;
    }
}

// 3. 字段注入（不推荐，不利于测试）
@Service
public class UserService {
    @Autowired
    private UserRepository repo;
}
```

---

## 二、Bean 生命周期（5题）

### Q9: Spring Bean 的完整生命周期？

**难度**: ⭐⭐⭐

**答案**:
```
1. 实例化（new）—— 通过反射创建对象
2. 属性赋值（依赖注入）—— @Autowired/@Value
3. Aware 接口回调 —— BeanNameAware、BeanFactoryAware、ApplicationContextAware
4. BeanPostProcessor.postProcessBeforeInitialization()
5. @PostConstruct
6. InitializingBean.afterPropertiesSet()
7. 自定义 init-method
8. BeanPostProcessor.postProcessAfterInitialization()  ← AOP 代理在此创建
9. Bean 就绪，可使用
10. 容器关闭
11. @PreDestroy
12. DisposableBean.destroy()
13. 自定义 destroy-method
```

---

### Q10: @PostConstruct 和 InitializingBean 的执行顺序？

**难度**: ⭐⭐

**答案**: `@PostConstruct` 在 `InitializingBean.afterPropertiesSet()` 之前执行。

**解析**:
执行顺序：`@PostConstruct` -> `InitializingBean.afterPropertiesSet()` -> 自定义 `init-method`

- `@PostConstruct` 是 JSR-250 标准注解，推荐使用
- `InitializingBean` 是 Spring 接口，与 Spring 耦合
- `init-method` 是 XML/注解配置，灵活性最高

---

### Q11: BeanPostProcessor 的作用？

**难度**: ⭐⭐⭐

**答案**: BeanPostProcessor 是 Spring 的扩展点，可以在 Bean 初始化前后对 Bean 进行加工。AOP 代理就是通过 BeanPostProcessor 创建的。

**解析**:
```java
public interface BeanPostProcessor {
    // 初始化前（@PostConstruct 之前）
    default Object postProcessBeforeInitialization(Object bean, String beanName) {
        return bean;
    }
    // 初始化后（@PostConstruct 之后）—— AOP 代理在此创建
    default Object postProcessAfterInitialization(Object bean, String beanName) {
        return bean;
    }
}
```

- 常见的 BeanPostProcessor：
  - `AutowiredAnnotationBeanPostProcessor`：处理 @Autowired
  - `CommonAnnotationBeanPostProcessor`：处理 @PostConstruct、@Resource
  - `AbstractAutoProxyCreator`：创建 AOP 代理

---

### Q12: BeanFactoryPostProcessor 和 BeanPostProcessor 的区别？

**难度**: ⭐⭐⭐

**答案**: BeanFactoryPostProcessor 在 Bean 实例化之前修改 BeanDefinition，BeanPostProcessor 在 Bean 初始化前后加工 Bean 实例。

**解析**:
- `BeanFactoryPostProcessor`：修改 Bean 的定义信息（如 `PropertySourcesPlaceholderConfigurer` 替换 `${}` 占位符）
- `BeanPostProcessor`：加工已创建的 Bean 实例（如 AOP 代理、依赖注入）

---

### Q13: Spring 如何处理 Bean 的销毁？

**难度**: ⭐⭐

**答案**: 执行顺序：`@PreDestroy` -> `DisposableBean.destroy()` -> 自定义 `destroy-method`。

**解析**:
- singleton Bean：容器关闭时自动调用销毁方法
- prototype Bean：容器不负责销毁，需要客户端自行管理
- 使用 `ctx.registerShutdownHook()` 注册 JVM 关闭钩子，确保容器正常关闭

---

## 三、AOP（6题）

### Q14: JDK 动态代理和 CGLIB 代理的区别？

**难度**: ⭐⭐⭐

**答案**:

| 对比项 | JDK 动态代理 | CGLIB 代理 |
|--------|-------------|-----------|
| 实现方式 | 基于接口（Proxy + InvocationHandler） | 基于继承（生成子类） |
| 要求 | 目标类必须实现接口 | 目标类不能是 final |
| 性能 | JDK 8+ 动态代理性能已大幅改善，与 CGLIB 差距不大，两者各有优势 | JDK 8 前优于 JDK 代理 |
| 依赖 | JDK 内置 | 需要第三方库 |

**解析**:
- Spring Boot 2.x（Spring 5+）默认使用 CGLIB 代理（`spring.aop.proxy-target-class=true`）
- 如果需要使用 JDK 动态代理，设置 `@EnableAspectJAutoProxy(proxyTargetClass = false)`

---

### Q15: Spring AOP 的通知类型有哪些？

**难度**: ⭐⭐

**答案**: 5 种通知类型：

| 通知类型 | 注解 | 说明 |
|---------|------|------|
| 前置通知 | `@Before` | 方法执行前 |
| 后置通知 | `@AfterReturning` | 方法正常返回后 |
| 异常通知 | `@AfterThrowing` | 方法抛出异常后 |
| 最终通知 | `@After` | 方法执行后（无论是否异常） |
| 环绕通知 | `@Around` | 包围方法执行，可控制是否执行 |

```java
@Aspect
@Component
public class LogAspect {
    @Around("execution(* com.example.service.*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed(); // 执行目标方法
        long cost = System.currentTimeMillis() - start;
        log.info("{} executed in {}ms", pjp.getSignature(), cost);
        return result;
    }
}
```

---

### Q16: AOP 的切入点表达式语法？

**难度**: ⭐⭐

**答案**: 切入点表达式格式：`execution(修饰符? 返回类型 包名.类名.方法名(参数) 异常?)`

**解析**:
```java
// 匹配 UserService 的所有方法
execution(* com.example.service.UserService.*(..))

// 匹配 service 包下所有类的所有方法
execution(* com.example.service.*.*(..))

// 匹配 service 包及子包下所有方法
execution(* com.example.service..*.*(..))

// 匹配所有 get 开头的方法
execution(* com.example.service.*.get*(..))

// 匹配带特定注解的方法
@annotation(com.example.annotation.Log)

// 组合切入点
@Pointcut("execution(* com.example.service.*.*(..)) && @annotation(Log)")
```

---

### Q17: Spring AOP 和 AspectJ 的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | Spring AOP | AspectJ |
|--------|-----------|---------|
| 实现方式 | 运行时动态代理 | 编译时/加载时织入 |
| 功能 | 仅支持方法级别的连接点 | 支持字段、构造器、方法等 |
| 性能 | 有代理开销 | 无代理开销 |
| 集成 | Spring 内置 | 需要编译器或 Agent |

**解析**: Spring AOP 是运行时增强，AspectJ 是编译时/类加载时织入。大多数场景 Spring AOP 足够，需要更细粒度的切面时使用 AspectJ。

---

### Q18: AOP 失效的场景有哪些？

**难度**: ⭐⭐⭐

**答案**:
1. **同类内部调用**：方法 A 调用同类的方法 B，B 上的 AOP 不生效（因为没有经过代理对象）
2. **方法是 private/final/static**：无法被代理
3. **对象未被 Spring 管理**：自己 new 的对象不在容器中
4. **异常被吞**：@AfterThrowing 无法捕获被 try-catch 的异常

```java
@Service
public class UserService {
    public void methodA() {
        methodB(); // 直接调用，不经过代理，B 上的 @Transactional 失效
    }

    @Transactional
    public void methodB() { }
}

// 解决方案：注入自身
@Autowired
private UserService self;
public void methodA() {
    self.methodB(); // 通过代理对象调用
}
```

---

### Q19: @Around 和 @Before/@After 的区别？

**难度**: ⭐⭐

**答案**: `@Around` 是最强大的通知，可以控制目标方法是否执行、修改参数和返回值。`@Before`/`@After` 只能在方法前后添加逻辑，不能控制执行。

```java
// @Around 可以控制是否执行
@Around("execution(* com.example.service.*.*(..))")
public Object around(ProceedingJoinPoint pjp) throws Throwable {
    // 前置逻辑
    if (条件不满足) return null; // 不执行目标方法
    Object result = pjp.proceed(); // 执行目标方法
    // 后置逻辑
    return result; // 可以修改返回值
}
```

---

## 四、事务（6题）

### Q20: Spring 事务的 7 种传播机制？

**难度**: ⭐⭐⭐

**答案**:

| 传播机制 | 说明 |
|---------|------|
| **REQUIRED**（默认） | 有事务则加入，没有则新建 |
| **REQUIRES_NEW** | 总是新建事务，挂起当前事务 |
| **NESTED** | 有事务则嵌套事务，没有则新建 |
| **SUPPORTS** | 有事务则加入，没有则非事务执行 |
| **NOT_SUPPORTED** | 非事务执行，挂起当前事务 |
| **MANDATORY** | 必须在事务中，否则抛异常 |
| **NEVER** | 不能在事务中，否则抛异常 |

**解析**:
- **REQUIRED**：最常用，适合大多数业务方法
- **REQUIRES_NEW**：独立事务，适合日志记录（即使主事务回滚，日志也要提交）
- **NESTED**：嵌套事务，回滚只影响当前嵌套，不影响外部事务

---

### Q21: @Transactional 失效的 8 种场景？

**难度**: ⭐⭐⭐

**答案**:

1. **方法不是 public**：@Transactional 只能用于 public 方法
2. **同类内部调用**：没有经过代理对象
3. **异常被 try-catch 吞掉**：事务不会回滚
4. **抛出的是 checked 异常**：默认只回滚 RuntimeException
5. **数据库引擎不支持事务**：如 MyISAM
6. **Bean 未被 Spring 管理**：没有加 @Service 等注解
7. **传播机制设置不当**：如 NOT_SUPPORTED
8. **多线程调用**：事务基于 ThreadLocal，不同线程不在同一事务中

```java
// 场景3：异常被吞
@Transactional
public void transfer() {
    try {
        // 业务逻辑
    } catch (Exception e) {
        log.error("error", e); // 异常被吞，事务不回滚
    }
}

// 解决：手动回滚
@Transactional
public void transfer() {
    try {
        // 业务逻辑
    } catch (Exception e) {
        log.error("error", e);
        TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
    }
}
```

---

### Q22: Spring 事务的隔离级别？

**难度**: ⭐⭐

**答案**: Spring 定义了 5 种隔离级别，对应数据库的隔离级别。

| 隔离级别 | 说明 | 脏读 | 不可重复读 | 幻读 |
|---------|------|------|-----------|------|
| DEFAULT | 使用数据库默认级别 | - | - | - |
| READ_UNCOMMITTED | 读未提交 | 可能 | 可能 | 可能 |
| READ_COMMITTED | 读已提交 | 不可能 | 可能 | 可能 |
| REPEATABLE_READ | 可重复读 | 不可能 | 不可能 | 可能 |
| SERIALIZABLE | 串行化 | 不可能 | 不可能 | 不可能 |

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void method() { }
```

---

### Q23: @Transactional 的 rollbackFor 属性？

**难度**: ⭐⭐

**答案**: `rollbackFor` 指定哪些异常触发回滚，`noRollbackFor` 指定哪些异常不回滚。

**解析**:
```java
// 默认只回滚 RuntimeException 和 Error
@Transactional
public void method() { }

// 指定回滚所有异常（推荐）
@Transactional(rollbackFor = Exception.class)
public void method() { }

// 指定不回滚特定异常
@Transactional(noRollbackFor = BusinessException.class)
public void method() { }
```

---

### Q24: Spring 事务的实现原理？

**难度**: ⭐⭐⭐

**答案**: Spring 事务基于 AOP + ThreadLocal 实现。通过 `TransactionInterceptor` 拦截方法调用，在方法执行前开启事务，正常返回提交，异常回滚。

**解析**:
```
@Transactional 方法调用
  -> TransactionInterceptor 拦截
    -> 获取事务（DataSource.getConnection()）
    -> 设置隔离级别、只读
    -> 执行目标方法
    -> 成功：COMMIT
    -> 异常：ROLLBACK
    -> finally：释放连接
```

- 事务信息存储在 `ThreadLocal` 中（`TransactionSynchronizationManager`）
- 同一线程中的事务传播基于 ThreadLocal 判断是否存在活跃事务

---

### Q25: 编程式事务和声明式事务的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | 声明式事务 | 编程式事务 |
|--------|-----------|-----------|
| 方式 | @Transactional 注解 | TransactionTemplate 或 PlatformTransactionManager |
| 侵入性 | 低（非侵入式） | 高（侵入业务代码） |
| 灵活性 | 低（粒度为方法） | 高（可以精确控制事务范围） |
| 推荐 | 是（大多数场景） | 需要精细控制时使用 |

```java
// 编程式事务
@Autowired
private TransactionTemplate txTemplate;

public void method() {
    txTemplate.execute(status -> {
        // 业务逻辑
        return null;
    });
}
```

---

## 五、Spring Boot（5题）

### Q26: Spring Boot 自动配置原理？

**难度**: ⭐⭐⭐

**答案**: Spring Boot 自动配置通过 `@EnableAutoConfiguration` + `spring.factories` + `@Conditional` 系列条件注解实现。

**解析**:
```
@SpringBootApplication
  = @SpringBootConfiguration
  + @EnableAutoConfiguration
  + @ComponentScan

@EnableAutoConfiguration
  -> @Import(AutoConfigurationImportSelector.class)
    -> 读取 META-INF/spring.factories 中的自动配置类列表
    -> 根据 @Conditional 条件注解过滤（类路径是否存在、是否有 Bean 等）
    -> 生效的自动配置类生效
```

- `@ConditionalOnClass`：类路径中存在某个类时生效
- `@ConditionalOnMissingBean`：容器中没有某个 Bean 时生效
- `@ConditionalOnProperty`：配置文件中有某个属性时生效

---

### Q27: spring.factories 的作用？

**难度**: ⭐⭐

**答案**: `spring.factories` 是 SPI（Service Provider Interface）机制，用于声明自动配置类、监听器、初始化器等。

**解析**:
```properties
# META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.MyAutoConfiguration,\
  com.example.AnotherAutoConfiguration
```

- Spring Boot 2.7+ 引入 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 替代 `spring.factories`
- Spring Boot 3.x 完全移除了 `spring.factories` 的自动配置支持

---

### Q28: Spring Boot Starter 的原理？

**难度**: ⭐⭐

**答案**: Starter 是一组依赖和自动配置的打包，引入 Starter 后自动配置相关功能。

**解析**:
- Starter 包含两部分：
  1. 依赖（jar 包）
  2. 自动配置类（AutoConfiguration）

```
my-spring-boot-starter/
├── pom.xml                    # 依赖
├── src/main/java/
│   └── com/example/autoconfigure/
│       └── MyAutoConfiguration.java
└── src/main/resources/
    └── META-INF/
        └── spring.factories   # 声明自动配置类
```

---

### Q29: Spring Boot 的配置优先级？

**难度**: ⭐⭐

**答案**: 配置优先级从高到低：
1. 命令行参数（`--server.port=8080`）
2. 系统属性（`System.getProperties()`）
3. 环境变量
4. `application-{profile}.yml`（如 `application-prod.yml`）
5. `application.yml`
6. `@PropertySource` 指定的配置文件
7. 默认值（`@Value` 的默认值）

---

### Q30: Spring Boot 如何自定义 Starter？

**难度**: ⭐⭐⭐

**答案**:
1. 创建 `xxx-spring-boot-starter`（依赖）和 `xxx-spring-boot-autoconfigure`（自动配置）两个模块
2. 编写自动配置类，使用 `@Conditional` 条件注解
3. 注册 `spring.factories` 或 `AutoConfiguration.imports`
4. 在 `application.yml` 中提供配置属性前缀

```java
@Configuration
@ConditionalOnClass(RedisTemplate.class)
@EnableConfigurationProperties(RedisProperties.class)
public class RedisAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        return template;
    }
}
```

---

## 六、Spring MVC（4题）

### Q31: DispatcherServlet 的工作流程？

**难度**: ⭐⭐⭐

**答案**:
```
HTTP 请求
  -> DispatcherServlet（前端控制器）
    -> HandlerMapping（查找 Handler）
    -> HandlerAdapter（执行 Handler）
    -> Controller（处理请求）
    -> 返回 ModelAndView
    -> ViewResolver（视图解析）
    -> 渲染视图
    -> 返回响应
```

**解析**:
1. 客户端发送请求到 DispatcherServlet
2. DispatcherServlet 查询 HandlerMapping 获取 Handler
3. HandlerAdapter 执行 Handler（Controller 方法）
4. Handler 执行完毕返回 ModelAndView（或直接写 ResponseBody）
5. ViewResolver 解析视图名称到具体视图
6. 渲染视图并返回响应

---

### Q32: 拦截器和过滤器的区别？

**难度**: ⭐⭐

**答案**:

| 对比项 | 过滤器（Filter） | 拦截器（Interceptor） |
|--------|----------------|---------------------|
| 所属 | Servlet 规范 | Spring MVC |
| 作用范围 | 所有请求 | Controller 方法 |
| 执行顺序 | 在 DispatcherServlet 之前 | 在 DispatcherServlet 之后 |
| 注入 Spring Bean | 不可以 | 可以 |
| 功能 | 通用（编码、CORS、认证） | 业务相关（权限、日志） |

**解析**:
```
HTTP -> Filter -> DispatcherServlet -> Interceptor(preHandle)
     -> Controller -> Interceptor(postHandle) -> Interceptor(afterCompletion)
     -> Filter -> 响应
```

---

### Q33: @RestController 和 @Controller 的区别？

**难度**: ⭐

**答案**: `@RestController` = `@Controller` + `@ResponseBody`，所有方法默认返回 JSON/XML 而非视图。

```java
// @Controller：返回视图名
@Controller
public class PageController {
    @GetMapping("/home")
    public String home() {
        return "home"; // 解析为视图
    }
}

// @RestController：返回 JSON
@RestController
public class ApiController {
    @GetMapping("/user")
    public User getUser() {
        return new User("Alice"); // 自动序列化为 JSON
    }
}
```

---

### Q34: Spring MVC 的参数绑定方式？

**难度**: ⭐⭐

**答案**:
- `@RequestParam`：绑定请求参数
- `@PathVariable`：绑定 URL 路径变量
- `@RequestBody`：绑定请求体（JSON）
- `@RequestHeader`：绑定请求头
- `@ModelAttribute`：绑定表单数据到对象

```java
@GetMapping("/users/{id}")
public User getUser(
    @PathVariable Long id,
    @RequestParam(required = false) String name,
    @RequestHeader("Authorization") String token
) { }
```

---

## 七、Spring 事件与异步（3题）

### Q35: Spring 事件机制的使用方式？

**难度**: ⭐⭐

**答案**: Spring 事件机制基于观察者模式，包含事件、发布者、监听器三个角色。

**解析**:
```java
// 1. 定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private final Order order;
    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }
}

// 2. 发布事件
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher publisher;

    public void createOrder(Order order) {
        // 创建订单
        publisher.publishEvent(new OrderCreatedEvent(this, order));
    }
}

// 3. 监听事件
@Component
public class OrderListener {
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        // 发送通知、扣减库存等
    }
}
```

---

### Q36: @Async 失效的场景？

**难度**: ⭐⭐⭐

**答案**:
1. **同类内部调用**：没有经过代理对象
2. **方法不是 public**：@Async 只能用于 public 方法
3. **返回值不是 Future**：void 返回值无法获取异常
4. **没有启用异步支持**：需要在配置类上加 `@EnableAsync`
5. **自定义线程池配置错误**

```java
// 启用异步
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public Executor asyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        return executor;
    }
}
```

---

### Q37: @Async 的异常如何处理？

**难度**: ⭐⭐

**答案**: 实现 `AsyncUncaughtExceptionHandler` 接口处理异步方法的未捕获异常。

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            log.error("异步方法异常: {}", method.getName(), ex);
        };
    }
}
```

---

## 八、综合设计题（3题）

### Q38: 如何设计一个 Spring Boot 的全局异常处理？

**难度**: ⭐⭐

**答案**: 使用 `@RestControllerAdvice` + `@ExceptionHandler` 实现全局异常处理。

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException.class)
    public Result<?> handleBusiness(BusinessException e) {
        return Result.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<?> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return Result.fail(400, message);
    }

    @ExceptionHandler(Exception.class)
    public Result<?> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.fail(500, "系统繁忙");
    }
}
```

---

### Q39: 如何实现 Spring Boot 的优雅停机？

**难度**: ⭐⭐

**答案**: 开启优雅停机后，Spring Boot 会等待正在处理的请求完成后再关闭。

```yaml
# application.yml
server:
  shutdown: graceful  # 开启优雅停机

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # 最长等待时间
```

- 优雅停机的流程：
  1. 停止接收新请求
  2. 等待正在处理的请求完成（最长 30s）
  3. 销毁 Bean（调用 @PreDestroy）
  4. 关闭容器

---

### Q40: Spring 中如何实现策略模式？

**难度**: ⭐⭐⭐

**答案**: 利用 Spring IoC 容器管理策略实现类，通过 Map 注入自动收集所有策略。

```java
// 1. 定义策略接口
public interface PaymentStrategy {
    String getType();
    void pay(BigDecimal amount);
}

// 2. 实现策略
@Component
public class AlipayStrategy implements PaymentStrategy {
    public String getType() { return "ALIPAY"; }
    public void pay(BigDecimal amount) { /* 支付宝支付 */ }
}

@Component
public class WechatPayStrategy implements PaymentStrategy {
    public String getType() { return "WECHAT"; }
    public void pay(BigDecimal amount) { /* 微信支付 */ }
}

// 3. 策略工厂（Spring 自动注入所有实现）
@Service
public class PaymentService {
    private final Map<String, PaymentStrategy> strategyMap;

    public PaymentService(List<PaymentStrategy> strategies) {
        strategyMap = strategies.stream()
            .collect(Collectors.toMap(PaymentStrategy::getType, s -> s));
    }

    public void pay(String type, BigDecimal amount) {
        PaymentStrategy strategy = strategyMap.get(type);
        if (strategy == null) throw new IllegalArgumentException("不支持的支付方式");
        strategy.pay(amount);
    }
}
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| 循环依赖三级缓存 | 极高 | singletonObjects -> earlySingletonObjects -> singletonFactories |
| @Transactional 失效 | 极高 | 非public、内部调用、异常被吞、checked异常 |
| Bean 生命周期 | 高 | 实例化 -> 属性注入 -> Aware -> @PostConstruct -> AOP代理 |
| IoC/DI 概念 | 高 | 控制反转 + 依赖注入、三种注入方式 |
| AOP 原理 | 高 | JDK 动态代理 vs CGLIB、通知类型 |
| 事务传播机制 | 高 | REQUIRED、REQUIRES_NEW、NESTED |
| 自动配置原理 | 中 | spring.factories + @Conditional |
| DispatcherServlet 流程 | 中 | HandlerMapping -> HandlerAdapter -> Controller -> ViewResolver |
| @Async 失效 | 中 | 内部调用、非public、未启用@EnableAsync |
| 全局异常处理 | 中 | @RestControllerAdvice + @ExceptionHandler |
