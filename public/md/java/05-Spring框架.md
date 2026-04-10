# Spring 框架知识体系

> 面向5年经验Java工程师面试知识储备 | 读者熟悉React，快速掌握Java核心知识

---

## 一、Spring 核心概念

### 1.1 Spring 框架模块图

Spring 框架是一个分层架构，由多个模块组成：

```
┌─────────────────────────────────────────────────────────┐
│                   Spring Web                             │
│         (Spring MVC / Spring WebFlux)                   │
├─────────────────────────────────────────────────────────┤
│                   Spring AOP                             │
│              (AspectJ 集成)                              │
├─────────────────────────────────────────────────────────┤
│              Spring Data Access                          │
│       (JDBC / ORM / Transactions / JMS)                 │
├─────────────────────────────────────────────────────────┤
│              Spring Core Container                       │
│     (Beans / Core / Context / SpEL)                     │
├─────────────────────────────────────────────────────────┤
│                   Spring Test                            │
└─────────────────────────────────────────────────────────┘
```

**核心模块说明：**

| 模块 | 说明 |
|------|------|
| **Spring Core** | 提供框架的基本组成部分，包括 IoC 和 DI |
| **Spring Beans** | BeanFactory 和 Bean 的管理 |
| **Spring Context** | ApplicationContext 接口，扩展 Core 和 Beans |
| **Spring AOP** | 面向切面编程实现 |
| **Spring Web** | Web 应用开发支持（MVC、WebSocket 等） |
| **Spring DAO** | 数据访问对象（JDBC 抽象层） |
| **Spring ORM** | 对象关系映射集成（JPA、Hibernate、MyBatis） |
| **Spring Transaction** | 编程式和声明式事务管理 |

> **React 对比理解**：Spring 框架就像 React 生态系统的集合（React Core + React Router + Redux + React Query 等），每个模块解决一个特定领域的问题。Spring Core 类似 React 核心库，Spring Web 类似 React Router，Spring Data 类似 React Query/TanStack Query。

---

### 1.2 IoC（控制反转）vs DI（依赖注入）

#### IoC（Inversion of Control）- 控制反转

IoC 是一种设计思想，指将对象的创建和管理权从代码内部转移到外部容器。

```java
// 没有 IoC：手动创建依赖对象（紧耦合）
public class OrderService {
    private OrderRepository orderRepository = new OrderRepository(); // 硬编码依赖
}

// 有 IoC：由容器注入依赖（松耦合）
@Service
public class OrderService {
    private final OrderRepository orderRepository;

    @Autowired  // 容器负责注入
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }
}
```

#### DI（Dependency Injection）- 依赖注入

DI 是 IoC 的具体实现方式，通过以下三种方式注入依赖：

```java
// 1. 构造器注入（推荐！）
@Service
public class UserService {
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}

// 2. Setter 注入
@Service
public class UserService {
    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// 3. 字段注入（不推荐，不利于测试）
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}
```

> **React 对比理解**：IoC/DI 类似 React Context。在 React 中，你通过 `<Provider>` 在组件树顶层提供数据，子组件通过 `useContext()` 消费数据，而不需要手动层层传递 props。Spring IoC 容器就是那个"Provider"，Bean 通过 `@Autowired` 类似 `useContext()` 获取依赖。

---

### 1.3 BeanFactory vs ApplicationContext

```java
// BeanFactory - 延迟加载（懒加载）
// ⚠️ XmlBeanFactory 在 Spring 5.2 已标记为 @Deprecated，Spring 6 已移除，推荐使用 ClassPathXmlApplicationContext
BeanFactory factory = new XmlBeanFactory(new ClassPathResource("beans.xml"));
UserService userService = factory.getBean(UserService.class); // 此时才创建Bean

// ApplicationContext - 立即加载（容器启动时创建所有单例Bean）
ApplicationContext context = new ClassPathXmlApplicationContext("beans.xml");
// 或注解方式
AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext(AppConfig.class);
UserService userService = context.getBean(UserService.class); // Bean已创建好
```

| 特性 | BeanFactory | ApplicationContext |
|------|-------------|-------------------|
| Bean 加载时机 | 懒加载（按需创建） | 预加载（启动时创建） |
| 国际化支持 | 不支持 | 支持 MessageSource |
| 事件发布 | 不支持 | 支持 ApplicationEvent |
| AOP 集成 | 需手动配置 | 自动集成 |
| 资源访问 | 简单 | 支持 ResourceLoader |
| BeanPostProcessor 注册 | 需手动调用 | 自动检测并注册 |
| **适用场景** | 资源受限环境 | **绝大多数应用场景** |

> **面试重点**：实际开发中几乎总是使用 `ApplicationContext`，`BeanFactory` 是 Spring 的底层基础设施。

---

### 1.4 Spring 配置方式

#### 1. XML 配置（传统方式）

```xml
<!-- beans.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd
       http://www.springframework.org/schema/context
       http://www.springframework.org/schema/context/spring-context.xsd">

    <!-- 开启注解扫描 -->
    <context:component-scan base-package="com.example"/>

    <!-- 定义 Bean -->
    <bean id="userService" class="com.example.service.UserService">
        <property name="userDao" ref="userDao"/>
    </bean>

    <bean id="userDao" class="com.example.dao.UserDaoImpl"/>
</beans>
```

#### 2. 注解配置（半自动）

```java
@Component      // 通用组件
@Service        // 业务层
@Repository     // 数据访问层
@Controller     // 控制层（Spring MVC）

@Service
public class UserService {
    @Autowired
    private UserDao userDao;
}
```

#### 3. Java Config（全注解，推荐）

```java
@Configuration  // 标记为配置类（相当于 XML 配置文件）
@ComponentScan("com.example")  // 组件扫描
@Import(DataSourceConfig.class) // 导入其他配置
public class AppConfig {

    @Bean  // 相当于 XML 中的 <bean> 标签
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://localhost:3306/mydb");
        ds.setUsername("root");
        ds.setPassword("password");
        return ds;
    }

    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

> **React 对比理解**：XML 配置类似 React 早期的 Class 组件 + 手动配置；Java Config 类似现代 React 的函数式组件 + Hooks，更简洁、类型安全、易于重构。

---

## 二、IoC 容器与 Bean（重点！）

### 2.1 Bean 的生命周期

Bean 的完整生命周期是面试最高频考点之一：

```
实例化（new）
    ↓
属性赋值（依赖注入）
    ↓
Aware 接口回调（BeanNameAware、BeanFactoryAware、ApplicationContextAware）
    ↓
BeanPostProcessor.postProcessBeforeInitialization()
    ↓
@PostConstruct
    ↓
InitializingBean.afterPropertiesSet()
    ↓
自定义 init-method
    ↓
BeanPostProcessor.postProcessAfterInitialization()  ← AOP 代理在此创建
    ↓
Bean 就绪，可使用
    ↓
容器关闭
    ↓
@PreDestroy
    ↓
DisposableBean.destroy()
    ↓
自定义 destroy-method
```

```java
@Component
public class LifecycleBean implements BeanNameAware, BeanFactoryAware,
        ApplicationContextAware, InitializingBean, DisposableBean {

    private String beanName;

    // 1. Aware 接口回调
    @Override
    public void setBeanName(String name) {
        this.beanName = name;
        System.out.println("1. BeanNameAware.setBeanName() → " + name);
    }

    @Override
    public void setBeanFactory(BeanFactory beanFactory) {
        System.out.println("2. BeanFactoryAware.setBeanFactory()");
    }

    @Override
    public void setApplicationContext(ApplicationContext ctx) {
        System.out.println("3. ApplicationContextAware.setApplicationContext()");
    }

    // 2. @PostConstruct（JSR-250 注解）
    @PostConstruct
    public void postConstruct() {
        System.out.println("5. @PostConstruct");
    }

    // 3. InitializingBean 接口
    @Override
    public void afterPropertiesSet() {
        System.out.println("6. InitializingBean.afterPropertiesSet()");
    }

    // 4. 自定义 init-method
    public void customInit() {
        System.out.println("7. customInit()");
    }

    // 5. @PreDestroy（JSR-250 注解）
    @PreDestroy
    public void preDestroy() {
        System.out.println("9. @PreDestroy");
    }

    // 6. DisposableBean 接口
    @Override
    public void destroy() {
        System.out.println("10. DisposableBean.destroy()");
    }

    // 7. 自定义 destroy-method
    public void customDestroy() {
        System.out.println("11. customDestroy()");
    }
}
```

```java
// 配置 init-method 和 destroy-method
@Configuration
public class LifecycleConfig {

    @Bean(initMethod = "customInit", destroyMethod = "customDestroy")
    public LifecycleBean lifecycleBean() {
        return new LifecycleBean();
    }
}
```

**初始化顺序总结：**

| 顺序 | 方式 | 类型 |
|------|------|------|
| 1 | `@PostConstruct` | 注解（推荐） |
| 2 | `InitializingBean.afterPropertiesSet()` | 接口 |
| 3 | `init-method` | XML/Java Config |

**销毁顺序总结：**

| 顺序 | 方式 | 类型 |
|------|------|------|
| 1 | `@PreDestroy` | 注解（推荐） |
| 2 | `DisposableBean.destroy()` | 接口 |
| 3 | `destroy-method` | XML/Java Config |

> **React 对比理解**：Bean 生命周期类似 React 组件生命周期。`@PostConstruct` 类似 `componentDidMount()` 或 `useEffect(() => {}, [])`，`@PreDestroy` 类似 `componentWillUnmount()` 或 `useEffect` 的清理函数。

---

### 2.2 Bean 的作用域

```java
@Component
@Scope("singleton")  // 默认值，可省略
public class SingletonBean {
    // 整个 IoC 容器中只有一个实例
}

@Component
@Scope("prototype")  // 每次请求都创建新实例
public class PrototypeBean {
    // 每次注入或 getBean() 都会创建新对象
}

@Component
@Scope(value = WebApplicationContext.SCOPE_REQUEST, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class RequestBean {
    // 每个 HTTP 请求一个实例
}

@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class SessionBean {
    // 每个 HTTP Session 一个实例
}

@Component
@Scope(value = WebApplicationContext.SCOPE_APPLICATION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class ApplicationBean {
    // 每个 ServletContext 一个实例
}
```

| 作用域 | 说明 | 适用场景 |
|--------|------|----------|
| **singleton**（默认） | 容器中只有一个实例 | 无状态 Service、DAO |
| **prototype** | 每次获取创建新实例 | 有状态对象、临时任务 |
| **request** | 每个 HTTP 请求一个实例 | 请求上下文信息 |
| **session** | 每个 Session 一个实例 | 用户会话信息 |
| **application** | 每个 ServletContext 一个实例 | 全局共享配置 |

> **注意**：Spring 不能管理 prototype Bean 的完整生命周期（不会调用 `@PreDestroy`），因为容器只负责创建，不负责销毁。

---

### 2.3 Bean 的自动装配

#### @Autowired（Spring 提供）

```java
@Service
public class OrderService {

    // 按类型注入（推荐构造器注入）
    private final OrderRepository orderRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    // 当有多个同类型 Bean 时，配合 @Qualifier 指定名称
    @Autowired
    @Qualifier("mysqlOrderRepository")
    private OrderRepository orderRepository;

    // 可选注入（不为null时才注入）
    @Autowired(required = false)
    private CacheService cacheService;
}
```

#### @Resource（JSR-250 标准）

```java
@Service
public class OrderService {

    // 按名称注入（name属性指定Bean名称）
    @Resource(name = "mysqlOrderRepository")
    private OrderRepository orderRepository;

    // 不指定name时，先按字段名匹配，再按类型匹配
    @Resource
    private OrderRepository mysqlOrderRepository;  // 字段名=Bean名称
}
```

#### @Inject（JSR-330 标准）

```java
@Service
public class OrderService {

    @Inject
    private OrderRepository orderRepository;

    // 需要额外引入 jakarta.inject 依赖（Spring 6 / Jakarta EE 9+ 已从 javax 迁移到 jakarta）
}
```

#### @Autowired vs @Resource 区别

| 特性 | @Autowired | @Resource |
|------|-----------|-----------|
| **来源** | Spring 框架 | JSR-250（Java 标准） |
| **匹配优先级** | 先按类型（byType），再按名称（byName） | 先按名称（byName），再按类型（byType） |
| **指定名称** | 配合 `@Qualifier` | 使用 `name` 属性 |
| **适用位置** | 构造器、方法、参数、字段 | 方法、字段 |
| **required 属性** | 支持 `required=false` | 无（可通过 `@Autowired(required=false)` 替代） |
| **推荐程度** | Spring 项目推荐 | 标准化项目推荐 |

> **面试高频问题**：@Autowired 和 @Resource 的区别？
> 答：@Autowired 是 Spring 提供的注解，默认按类型匹配，有多个同类型 Bean 时需配合 @Qualifier；@Resource 是 Java 标准注解，默认按名称匹配，找不到再按类型匹配。

---

### 2.4 循环依赖问题及解决（三级缓存）

#### 什么是循环依赖？

```java
@Service
public class A {
    @Autowired
    private B b;  // A 依赖 B
}

@Service
public class B {
    @Autowired
    private C c;  // B 依赖 C
}

@Service
public class C {
    @Autowired
    private A a;  // C 依赖 A → 形成循环 A → B → C → A
}
```

#### Spring 三级缓存解决循环依赖

```
一级缓存（singletonObjects）：存放完全初始化好的 Bean（成品）
二级缓存（earlySingletonObjects）：存放提前暴露的半成品 Bean（已实例化，未初始化）
三级缓存（singletonFactories）：存放 Bean 工厂（ObjectFactory），用于生成提前引用
```

**解决流程（以 A → B 循环为例）：**

```
1. 创建 A，实例化 A（new A()），将 A 的工厂放入三级缓存
2. A 属性填充，发现需要 B
3. 创建 B，实例化 B（new B()），将 B 的工厂放入三级缓存
4. B 属性填充，发现需要 A
5. 从三级缓存获取 A 的工厂，调用工厂方法获取 A 的早期引用（半成品）
6. 将 A 的早期引用放入二级缓存，删除三级缓存中的 A 工厂
7. B 完成属性填充和初始化，B 创建完成，放入一级缓存
8. A 继续属性填充（此时 B 已创建完成），A 完成初始化，放入一级缓存
```

```java
// Spring 源码关键位置（DefaultSingletonBeanRegistry）
public class DefaultSingletonBeanRegistry {
    // 一级缓存：单例池
    private final Map<String, Object> singletonObjects = new ConcurrentHashMap<>(256);
    // 二级缓存：早期引用
    private final Map<String, Object> earlySingletonObjects = new ConcurrentHashMap<>(16);
    // 三级缓存：单例工厂
    private final Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>(16);

    protected Object getSingleton(String beanName, boolean allowEarlyReference) {
        // 1. 从一级缓存获取
        Object singletonObject = this.singletonObjects.get(beanName);
        if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
            // 2. 从二级缓存获取
            singletonObject = this.earlySingletonObjects.get(beanName);
            if (singletonObject == null && allowEarlyReference) {
                // 3. 从三级缓存获取工厂，创建早期引用
                ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
                if (singletonFactory != null) {
                    singletonObject = singletonFactory.getObject();
                    // 放入二级缓存，移除三级缓存
                    this.earlySingletonObjects.put(beanName, singletonObject);
                    this.singletonFactories.remove(beanName);
                }
            }
        }
        return singletonObject;
    }
}
```

**不能解决的循环依赖场景：**

```java
// 1. 构造器注入的循环依赖（无法解决）
@Service
public class A {
    private final B b;
    @Autowired
    public A(B b) {  // 构造器注入
        this.b = b;
    }
}

@Service
public class B {
    private final A a;
    @Autowired
    public B(A a) {  // 构造器注入 → 循环依赖，启动报错！
        this.a = a;
    }
}

// 解决方案：使用 @Lazy 延迟加载
@Service
public class A {
    private final B b;
    @Autowired
    public A(@Lazy B b) {  // 注入代理对象，延迟获取真实对象
        this.b = b;
    }
}

// 2. prototype 作用域的循环依赖（无法解决）
@Scope("prototype")
@Service
public class A {
    @Autowired
    private B b;
}
```

> **面试高频问题**：Spring 如何解决循环依赖？
> 答：通过三级缓存机制。一级缓存存放成品 Bean，二级缓存存放半成品 Bean，三级缓存存放 Bean 工厂。当 A 依赖 B、B 依赖 A 时，A 先实例化放入三级缓存，B 属性填充时从三级缓存获取 A 的早期引用，B 创建完成后 A 再完成初始化。注意：构造器注入和 prototype 作用域的循环依赖无法自动解决。

---

### 2.5 BeanPostProcessor（Bean 后置处理器）

BeanPostProcessor 是 Spring 中最强大的扩展机制之一，可以在 Bean 初始化前后进行自定义处理。

```java
@Component
public class CustomBeanPostProcessor implements BeanPostProcessor {

    // Bean 初始化前调用（在 @PostConstruct 之前）
    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) {
        if (bean instanceof UserService) {
            System.out.println("初始化前处理: " + beanName);
        }
        return bean;  // 返回原始bean或包装后的bean
    }

    // Bean 初始化后调用（在所有初始化方法之后，包括 init-method）
    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof UserService) {
            System.out.println("初始化后处理: " + beanName);
        }
        return bean;  // AOP 代理对象在此处返回
    }
}
```

**常见的 BeanPostProcessor 实现：**

| BeanPostProcessor | 作用 |
|-------------------|------|
| `AutowiredAnnotationBeanPostProcessor` | 处理 @Autowired 注入 |
| `CommonAnnotationBeanPostProcessor` | 处理 @Resource、@PostConstruct、@PreDestroy |
| `AbstractAutoProxyCreator` | 创建 AOP 代理对象 |
| `AsyncAnnotationBeanPostProcessor` | 处理 @Async 异步方法 |
| `ScheduledAnnotationBeanPostProcessor` | 处理 @Scheduled 定时任务 |

> **React 对比理解**：BeanPostProcessor 类似 React 中的高阶组件（HOC）或中间件。它可以在不修改原始 Bean 代码的情况下，对 Bean 进行增强或包装。

---

### 2.6 @Component、@Service、@Repository、@Controller

```java
@Component   // 通用组件注解，标记为 Spring 管理的 Bean
@Service     // 业务逻辑层（语义化，功能与 @Component 相同）
@Repository  // 数据访问层（语义化，额外支持异常转换为 Spring DataAccessException）
@Controller  // Web 控制层（Spring MVC 中使用，配合 @RequestMapping）
@RestController // = @Controller + @ResponseBody（返回 JSON）
```

```java
// @Repository 的额外功能：异常转换
@Repository
public class UserDaoImpl implements UserDao {
    @Override
    public User findById(Long id) {
        // 原生 SQLException 会被自动转换为 Spring 的 DataAccessException 体系
        throw new SQLException("Connection failed");
        // 转换后变成: DataAccessException → UncategorizedSQLException
    }
}
```

> **React 对比理解**：这些注解类似 React 中的文件夹组织约定。`/components` 放通用组件，`/pages` 放页面组件，`/hooks` 放自定义 Hook。Spring 的分层注解也是约定优于配置的体现。

---

### 2.7 @Configuration 与 @Bean

```java
@Configuration  // 标记为配置类（CGLIB 代理，保证 @Bean 方法返回单例）
public class DataSourceConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource dataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        return factory.getObject();
    }

    // @Bean 之间的依赖通过方法参数注入
    @Bean
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
```

**@Configuration vs @Component 的区别：**

```java
// @Configuration：Full 模式（CGLIB 代理，@Bean 方法是单例）
@Configuration
public class ConfigA {
    @Bean
    public Foo foo() { return new Foo(); }

    @Bean
    public Bar bar() {
        // foo() 调用会被代理拦截，返回同一个单例对象
        return new Bar(foo());
    }
}

// @Component：Lite 模式（普通类，@Bean 方法每次调用创建新对象）
@Component
public class ConfigB {
    @Bean
    public Foo foo() { return new Foo(); }

    @Bean
    public Bar bar() {
        // foo() 是普通方法调用，每次创建新对象！
        return new Bar(foo());
    }
}
```

> **面试高频问题**：@Configuration 和 @Component 的区别？
> 答：@Configuration 使用 CGLIB 代理创建子类，保证 @Bean 方法返回单例对象；@Component 是普通类，@Bean 方法每次调用都会创建新对象。推荐使用 @Configuration。

---

### 2.8 @Conditional 条件装配

```java
// 自定义条件
public class LinuxCondition implements Condition {
    @Override
    public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
        return context.getEnvironment().getProperty("os.name").contains("Linux");
    }
}

@Configuration
public class ConditionalConfig {

    @Bean
    @Conditional(LinuxCondition.class)  // 满足条件才创建
    public EmailService linuxEmailService() {
        return new LinuxEmailService();
    }

    @Bean
    @Conditional(WindowsCondition.class)
    public EmailService windowsEmailService() {
        return new WindowsEmailService();
    }

    // Spring Boot 常用条件注解：
    @Bean
    @ConditionalOnClass(DataSource.class)        // classpath 中存在该类
    @ConditionalOnMissingBean(DataSource.class)   // 容器中不存在该 Bean
    @ConditionalOnProperty(name = "feature.enabled", havingValue = "true")  // 配置属性
    @ConditionalOnWebApplication                  // 是 Web 应用
    @ConditionalOnExpression("${feature.a} && ${feature.b}")  // SpEL 表达式
    public DataSource dataSource() {
        return new HikariDataSource();
    }
}
```

> **React 对比理解**：@Conditional 类似 React 中的条件渲染 `{isLoggedIn ? <Dashboard /> : <Login />}`，根据条件决定是否注册某个 Bean。

---

### 2.9 FactoryBean vs BeanFactory

```java
// FactoryBean：用于创建复杂对象的工厂 Bean
@Component
public class SqlSessionFactoryBean implements FactoryBean<SqlSessionFactory> {

    @Autowired
    private DataSource dataSource;

    // 返回实际创建的对象类型
    @Override
    public SqlSessionFactory getObject() throws Exception {
        SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
        factory.setDataSource(dataSource);
        return factory.getObject();
    }

    // 返回对象的类型
    @Override
    public Class<?> getObjectType() {
        return SqlSessionFactory.class;
    }

    // 是否单例
    @Override
    public boolean isSingleton() {
        return true;
    }
}

// 使用：注入的是 FactoryBean 创建的对象，而不是 FactoryBean 本身
@Autowired
private SqlSessionFactory sqlSessionFactory;  // 注入的是 getObject() 返回的对象

// 如果要获取 FactoryBean 本身，需要加 & 前缀
SqlSessionFactoryBean factory = context.getBean("&sqlSessionFactoryBean");
```

| 特性 | BeanFactory | FactoryBean |
|------|-------------|-------------|
| **本质** | IoC 容器的基础接口 | 创建复杂 Bean 的工厂接口 |
| **关系** | 是容器 | 是容器中的一个 Bean |
| **用途** | 管理所有 Bean | 创建特定的复杂对象 |
| **获取方式** | `getBean("name")` 获取目标对象 | `getBean("&name")` 获取工厂本身 |

> **面试高频问题**：FactoryBean 和 BeanFactory 的区别？
> 答：BeanFactory 是 Spring 容器的基础接口，负责创建和管理 Bean；FactoryBean 是一种特殊的 Bean，用于创建复杂对象。当调用 `getBean()` 时，如果 Bean 实现了 FactoryBean 接口，实际返回的是 `getObject()` 方法创建的对象。

---

## 三、AOP（面向切面编程）

### 3.1 AOP 核心概念

```
┌─────────────────────────────────────────┐
│              切面（Aspect）               │
│  ┌───────────────────────────────────┐  │
│  │         通知（Advice）             │  │
│  │    @Before / @After / @Around     │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │       切入点（Pointcut）          │  │
│  │  execution(* com.example..*(..)) │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    ↓ 应用于
┌─────────────────────────────────────────┐
│          目标对象（Target）               │
│         连接点（JoinPoint）              │
└─────────────────────────────────────────┘
```

| 概念 | 说明 | 类比 |
|------|------|------|
| **切面（Aspect）** | 横切关注点的模块化 | 一个中间件 |
| **连接点（JoinPoint）** | 程序执行中的某个点 | 所有 API 请求 |
| **切入点（Pointcut）** | 匹配连接点的表达式 | 路由匹配规则 |
| **通知（Advice）** | 切面在特定连接点执行的动作 | 中间件的处理函数 |
| **目标对象（Target）** | 被代理的原始对象 | 被中间件包裹的 Handler |
| **织入（Weaving）** | 将切面应用到目标对象的过程 | 应用中间件的过程 |

> **React 对比理解**：AOP 类似 React 中的高阶组件（HOC）或 Redux 中间件。你可以在不修改原始组件/函数的情况下，给它添加日志、权限校验、性能监控等功能。`@Around` 通知类似 Redux middleware 的 `next(action)` 模式。

---

### 3.2 Spring AOP vs AspectJ

| 特性 | Spring AOP | AspectJ |
|------|-----------|---------|
| **实现方式** | 运行时代理（动态代理） | 编译时/加载时织入 |
| **功能范围** | 仅支持方法级别的连接点 | 支持字段、构造器、方法等 |
| **性能** | 较好（运行时生成代理） | 更好（编译时织入） |
| **复杂度** | 简单，开箱即用 | 需要额外的编译器/Agent |
| **依赖** | spring-aop | aspectjweaver |
| **适用场景** | 大多数企业应用 | 需要更细粒度的切面控制 |

```xml
<!-- Spring AOP 依赖 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>

<!-- AspectJ（如需完整功能） -->
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
</dependency>
```

---

### 3.3 五种通知类型

```java
@Aspect
@Component
@Slf4j
public class LoggingAspect {

    // 切入点定义（可复用）
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}

    // 1. 前置通知：方法执行前
    @Before("serviceLayer()")
    public void beforeAdvice(JoinPoint joinPoint) {
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();
        log.info("调用方法: {}，参数: {}", methodName, Arrays.toString(args));
    }

    // 2. 后置通知：方法执行后（无论是否异常）
    @After("serviceLayer()")
    public void afterAdvice(JoinPoint joinPoint) {
        log.info("方法执行完成: {}", joinPoint.getSignature().getName());
    }

    // 3. 返回通知：方法正常返回后
    @AfterReturning(pointcut = "serviceLayer()", returning = "result")
    public void afterReturningAdvice(JoinPoint joinPoint, Object result) {
        log.info("方法返回: {}，结果: {}", joinPoint.getSignature().getName(), result);
    }

    // 4. 异常通知：方法抛出异常后
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void afterThrowingAdvice(JoinPoint joinPoint, Exception ex) {
        log.error("方法异常: {}，异常: {}", joinPoint.getSignature().getName(), ex.getMessage());
    }

    // 5. 环绕通知：最强大，可控制方法是否执行
    @Around("serviceLayer()")
    public Object aroundAdvice(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        long startTime = System.currentTimeMillis();

        log.info("=== 环绕通知开始 === 方法: {}", methodName);
        try {
            // 执行目标方法
            Object result = pjp.proceed();
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("=== 环绕通知结束 === 方法: {}，耗时: {}ms", methodName, elapsed);
            return result;
        } catch (Throwable ex) {
            log.error("=== 环绕通知异常 === 方法: {}，异常: {}", methodName, ex.getMessage());
            throw ex;  // 重新抛出异常
        }
    }
}
```

**通知执行顺序（正常情况）：**
```
@Around（前半部分）→ @Before → 目标方法执行 → @AfterReturning → @After → @Around（后半部分）
```

**通知执行顺序（异常情况）：**
```
@Around（前半部分）→ @Before → 目标方法抛异常 → @AfterThrowing → @After → @Around（异常处理）
```

---

### 3.4 切入点表达式

```java
@Aspect
@Component
public class PointcutExpressions {

    // 1. execution：方法执行（最常用）
    // 匹配 service 包下所有类的所有方法
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void allServiceMethods() {}

    // 匹配 service 包及子包下所有方法
    @Pointcut("execution(* com.example.service..*.*(..))")
    public void allServiceMethodsDeep() {}

    // 匹配特定返回类型、类、方法名
    @Pointcut("execution(public String com.example.service.UserService.getUserName(Long))")
    public void specificMethod() {}

    // 匹配所有 get 开头的方法
    @Pointcut("execution(* com.example.service.*.get*(..))")
    public void allGetterMethods() {}

    // 2. within：类型匹配（匹配类级别）
    @Pointcut("within(com.example.service.*)")
    public void withinServicePackage() {}

    // 3. @annotation：注解匹配（匹配带有特定注解的方法）
    @Pointcut("@annotation(com.example.annotation.Loggable)")
    public void annotatedMethods() {}

    // 4. 组合切入点
    @Pointcut("execution(* com.example.service.*.*(..)) && !execution(* com.example.service.internal.*.*(..))")
    public void publicServiceMethods() {}

    // 5. 参数匹配
    @Pointcut("execution(* com.example.service.*.*(String, ..)) && args(name, ..)")
    public void methodWithFirstStringParam(String name) {}
}
```

**自定义注解 + AOP（实际开发最常用模式）：**

```java
// 自定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface OperationLog {
    String value() default "";
}

// 切面处理
@Aspect
@Component
@Slf4j
public class OperationLogAspect {

    @Around("@annotation(operationLog)")
    public Object logOperation(ProceedingJoinPoint pjp, OperationLog operationLog) throws Throwable {
        String operation = operationLog.value();
        String methodName = pjp.getSignature().getName();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();

        log.info("[操作日志] 用户: {}，操作: {}，方法: {}", username, operation, methodName);

        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        long elapsed = System.currentTimeMillis() - start;

        log.info("[操作日志] 用户: {}，操作: {}，耗时: {}ms", username, operation, elapsed);
        return result;
    }
}

// 使用
@Service
public class UserService {
    @OperationLog("创建用户")
    public User createUser(UserDTO dto) {
        // ...
    }
}
```

---

### 3.5 AOP 实现原理

#### JDK 动态代理 vs CGLIB 代理

```java
// JDK 动态代理：基于接口（目标类必须实现接口）
public interface UserService {
    User findById(Long id);
}

public class UserServiceImpl implements UserService {
    @Override
    public User findById(Long id) {
        return new User(id, "张三");
    }
}

// JDK 动态代理创建
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    new InvocationHandler() {
        @Override
        public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
            System.out.println("Before: " + method.getName());
            Object result = method.invoke(target, args);  // 调用目标方法
            System.out.println("After: " + method.getName());
            return result;
        }
    }
);
```

```java
// CGLIB 代理：基于继承（生成子类，目标类不能是 final）
public class UserService {
    public User findById(Long id) {
        return new User(id, "张三");
    }
}

// CGLIB 代理创建
Enhancer enhancer = new Enhancer();
enhancer.setSuperclass(UserService.class);
enhancer.setCallback(new MethodInterceptor() {
    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
        System.out.println("Before: " + method.getName());
        Object result = proxy.invokeSuper(obj, args);  // 调用父类方法
        System.out.println("After: " + method.getName());
        return result;
    }
});
UserService proxy = (UserService) enhancer.create();
```

| 特性 | JDK 动态代理 | CGLIB 代理 |
|------|-------------|-----------|
| **实现方式** | 基于接口（InvocationHandler） | 基于继承（生成子类） |
| **要求** | 目标类必须实现接口 | 目标类不能是 final 类 |
| **性能** | 生成代理快，调用稍慢 | 生成代理慢，调用快 |
| **Spring 默认** | 有接口时使用 | 无接口时使用 |
| **Spring Boot 2.x+** | 默认使用 CGLIB | - |

```yaml
# Spring Boot 配置代理方式
spring:
  aop:
    proxy-target-class: true  # 强制使用 CGLIB（默认 true）
```

> **面试高频问题**：Spring AOP 的实现原理？
> 答：Spring AOP 底层使用动态代理。如果目标类实现了接口，使用 JDK 动态代理；如果没有实现接口，使用 CGLIB 代理（生成子类）。Spring Boot 2.x 默认使用 CGLIB 代理。代理对象在 BeanPostProcessor 的 `postProcessAfterInitialization` 阶段创建。

---

### 3.6 AOP 实际应用场景

```java
// 1. 日志记录
@Aspect
@Component
@Slf4j
public class LoggingAspect {
    @Around("execution(* com.example.controller.*.*(..))")
    public Object logApiCall(ProceedingJoinPoint pjp) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
        String url = request.getRequestURL().toString();
        String method = request.getMethod();

        log.info("请求: {} {}", method, url);
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();
        log.info("响应: {} {} - 耗时: {}ms", method, url, System.currentTimeMillis() - start);
        return result;
    }
}

// 2. 性能监控
@Aspect
@Component
public class PerformanceAspect {
    @Around("@annotation(com.example.annotation.MonitorPerformance)")
    public Object monitor(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().toShortString();
        long start = System.nanoTime();
        Object result = pjp.proceed();
        long elapsed = (System.nanoTime() - start) / 1_000_000;
        if (elapsed > 1000) {
            log.warn("慢方法警告: {} 耗时 {}ms", methodName, elapsed);
        }
        return result;
    }
}

// 3. 权限校验
@Aspect
@Component
public class PermissionAspect {
    @Before("@annotation(com.example.annotation.RequirePermission)")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        RequirePermission annotation = signature.getMethod().getAnnotation(RequirePermission.class);
        String requiredPermission = annotation.value();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(requiredPermission))) {
            throw new AccessDeniedException("权限不足: " + requiredPermission);
        }
    }
}

// 4. 缓存（简化版）
@Aspect
@Component
public class CacheAspect {
    private final Map<String, Object> cache = new ConcurrentHashMap<>();

    @Around("@annotation(com.example.annotation.Cacheable)")
    public Object cacheResult(ProceedingJoinPoint pjp) throws Throwable {
        String key = pjp.getSignature().toLongString() + Arrays.toString(pjp.getArgs());
        if (cache.containsKey(key)) {
            log.info("缓存命中: {}", key);
            return cache.get(key);
        }
        Object result = pjp.proceed();
        cache.put(key, result);
        return result;
    }
}
```

> **React 对比理解**：AOP 的应用场景类似 React 中的以下模式：
> - 日志切面 → React Logger 中间件（Redux）
> - 权限切面 → React Route Guard（路由守卫）
> - 性能监控 → React Profiler
> - 缓存切面 → React Query / SWR 的缓存机制

---

## 四、Spring 事务管理（重点！）

### 4.1 @Transactional 注解详解

```java
@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    // 基本用法
    @Transactional
    public void createOrder(OrderDTO orderDTO) {
        Order order = new Order(orderDTO);
        orderRepository.save(order);
        inventoryService.deductStock(orderDTO.getProductId(), orderDTO.getQuantity());
    }

    // 完整配置
    @Transactional(
        propagation = Propagation.REQUIRED,      // 传播行为
        isolation = Isolation.READ_COMMITTED,     // 隔离级别
        timeout = 30,                              // 超时时间（秒）
        readOnly = false,                          // 是否只读
        rollbackFor = Exception.class,             // 指定回滚异常
        noRollbackFor = BusinessException.class,   // 指定不回滚异常
        transactionManager = "transactionManager"  // 指定事务管理器
    )
    public void createOrderWithFullConfig(OrderDTO orderDTO) {
        // ...
    }
}
```

#### propagation（7种传播行为）

| 传播行为 | 说明 | 场景 |
|---------|------|------|
| **REQUIRED**（默认） | 有事务就加入，没有就新建 | 大多数业务方法 |
| **REQUIRES_NEW** | 总是新建事务，挂起当前事务 | 独立事务（如日志记录） |
| **NESTED** | 嵌套事务（保存点） | 部分回滚 |
| **SUPPORTS** | 有事务就加入，没有就非事务执行 | 查询方法 |
| **NOT_SUPPORTED** | 非事务执行，挂起当前事务 | 不需要事务的操作 |
| **MANDATORY** | 必须在事务中调用，否则抛异常 | 强制事务环境 |
| **NEVER** | 非事务执行，有事务就抛异常 | 禁止事务的方法 |

```java
@Service
public class TransactionExampleService {

    // REQUIRED：最常用
    @Transactional(propagation = Propagation.REQUIRED)
    public void methodA() {
        // 如果 methodB 在事务中调用，加入 methodB 的事务
        // 如果 methodB 不在事务中调用，新建事务
    }

    // REQUIRES_NEW：独立事务
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordLog(String message) {
        // 无论外层是否有事务，都新建独立事务
        // 外层事务回滚不影响此方法
        // 此方法回滚不影响外层事务
    }

    // NESTED：嵌套事务
    @Transactional(propagation = Propagation.NESTED)
    public void nestedMethod() {
        // 在外层事务中创建保存点（Savepoint）
        // 回滚只回滚到保存点，不影响外层事务
    }

    // 实际场景：主事务 + 独立日志
    @Transactional
    public void placeOrder(Order order) {
        orderRepository.save(order);                    // 主事务
        inventoryService.deductStock(order);            // 主事务
        auditLogService.recordLog("订单创建: " + order); // 独立事务（REQUIRES_NEW）
    }
}
```

#### isolation（4种隔离级别）

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 说明 |
|---------|------|-----------|------|------|
| **DEFAULT** | - | - | - | 使用数据库默认级别（MySQL: REPEATABLE_READ） |
| **READ_UNCOMMITTED** | 可能 | 可能 | 可能 | 最低级别，几乎不用 |
| **READ_COMMITTED** | 不可能 | 可能 | 可能 | Oracle 默认级别 |
| **REPEATABLE_READ** | 不可能 | 不可能 | 可能 | MySQL InnoDB 默认级别 |
| **SERIALIZABLE** | 不可能 | 不可能 | 不可能 | 最高级别，性能差 |

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public List<User> listUsers() {
    return userRepository.findAll();
}
```

#### readOnly、timeout、rollbackFor、noRollbackFor

```java
@Service
public class ProductService {

    // readOnly=true：优化只读操作（MySQL 不加锁，优化查询）
    @Transactional(readOnly = true)
    public Product getProduct(Long id) {
        return productRepository.findById(id).orElse(null);
    }

    // timeout：超时自动回滚
    @Transactional(timeout = 10)  // 10秒超时
    public void batchUpdate(List<Product> products) {
        products.forEach(productRepository::save);
    }

    // rollbackFor：指定回滚异常（默认只回滚 RuntimeException 和 Error）
    @Transactional(rollbackFor = Exception.class)  // 所有异常都回滚
    public void transferMoney(Long fromId, Long toId, BigDecimal amount) throws Exception {
        accountService.deduct(fromId, amount);
        accountService.add(toId, amount);
    }

    // noRollbackFor：指定不回滚的异常
    @Transactional(noRollbackFor = BusinessException.class)
    public void processOrder(Order order) {
        if (order.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("金额不能为负");  // 不回滚
        }
        orderRepository.save(order);
    }
}
```

> **面试高频问题**：@Transactional 默认对什么异常回滚？
> 答：默认只对 `RuntimeException`（运行时异常）和 `Error` 回滚，对受检异常（checked exception）不回滚。建议始终设置 `rollbackFor = Exception.class`。

---

### 4.2 事务失效的常见场景（8种）

```java
@Service
public class TransactionFailService {

    @Autowired
    private TransactionFailService self;  // 注入自身代理

    // ❌ 1. 方法不是 public（事务不生效）
    @Transactional
    private void privateMethod() {
        // 事务不生效！Spring AOP 只能代理 public 方法
    }

    // ❌ 2. 同一个类中方法内部调用（this 调用，不经过代理）
    public void outerMethod() {
        this.innerMethod();  // 直接调用，不经过 AOP 代理，事务不生效！
    }

    @Transactional
    public void innerMethod() {
        // 事务不生效！
    }

    // ✅ 解决方案：注入自身代理或使用 AopContext
    @Transactional
    public void outerMethodFixed() {
        self.innerMethod();  // 通过代理调用，事务生效
    }

    // ❌ 3. 方法被 final/static 修饰（不能被重写，代理无效）
    @Transactional
    public final void finalMethod() {
        // 事务不生效！final 方法不能被 CGLIB 子类重写
    }

    // ❌ 4. 类没有被 Spring 管理（没有 @Service 等注解）
    // public class NotManagedService {
    //     @Transactional  // 不生效！
    //     public void method() {}
    // }

    // ❌ 5. 异常被 catch 吞掉（没有抛出，Spring 不知道异常发生）
    @Transactional
    public void catchException() {
        try {
            // 数据库操作
        } catch (Exception e) {
            log.error("异常", e);  // 吞掉异常，事务不回滚！
            // 应该 throw new RuntimeException(e); 或 TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
        }
    }

    // ❌ 6. 抛出了非 RuntimeException 异常（默认不回滚）
    @Transactional  // 默认 rollbackFor = RuntimeException.class
    public void throwsCheckedException() throws Exception {
        throw new IOException("文件错误");  // 受检异常，不回滚！
    }

    // ✅ 解决方案
    @Transactional(rollbackFor = Exception.class)
    public void fixedThrowsCheckedException() throws Exception {
        throw new IOException("文件错误");  // 回滚
    }

    // ❌ 7. 数据库引擎不支持事务（如 MyISAM）
    // MySQL 的 MyISAM 引擎不支持事务，InnoDB 支持

    // ❌ 8. 传播行为设置不当
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void notSupportedMethod() {
        // 以非事务方式执行，事务不生效
    }
}
```

> **面试高频问题**：Spring 事务失效的场景有哪些？
> 答：(1) 方法非 public；(2) 同类内部调用（this 调用）；(3) 方法被 final/static 修饰；(4) 类未被 Spring 管理；(5) 异常被 catch 吞掉；(6) 抛出非 RuntimeException；(7) 数据库引擎不支持事务；(8) 传播行为设置不当（如 NOT_SUPPORTED）。

---

### 4.3 编程式事务 vs 声明式事务

```java
// 声明式事务（推荐，使用注解）
@Service
public class DeclarativeService {
    @Transactional(rollbackFor = Exception.class)
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        accountMapper.deduct(fromId, amount);
        accountMapper.add(toId, amount);
    }
}

// 编程式事务（灵活但侵入性强）
@Service
public class ProgrammaticService {

    @Autowired
    private PlatformTransactionManager transactionManager;

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        TransactionDefinition definition = new DefaultTransactionDefinition();
        definition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
        definition.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);

        TransactionStatus status = transactionManager.getTransaction(definition);
        try {
            accountMapper.deduct(fromId, amount);
            accountMapper.add(toId, amount);
            transactionManager.commit(status);  // 手动提交
        } catch (Exception e) {
            transactionManager.rollback(status);  // 手动回滚
            throw e;
        }
    }
}

// 编程式事务（使用 TransactionTemplate，推荐方式）
@Service
public class ProgrammaticTemplateService {

    @Autowired
    private TransactionTemplate transactionTemplate;

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        transactionTemplate.execute(status -> {
            try {
                accountMapper.deduct(fromId, amount);
                accountMapper.add(toId, amount);
                return true;
            } catch (Exception e) {
                status.setRollbackOnly();  // 标记回滚
                return false;
            }
        });
    }
}
```

| 特性 | 声明式事务 | 编程式事务 |
|------|-----------|-----------|
| **方式** | @Transactional 注解 | TransactionTemplate / PlatformTransactionManager |
| **侵入性** | 低（非侵入式） | 高（侵入业务代码） |
| **灵活性** | 较低（方法级别） | 高（代码块级别） |
| **可维护性** | 好 | 一般 |
| **推荐场景** | 大多数业务场景 | 需要精细控制事务的场景 |

---

### 4.4 事务的隔离级别与 MySQL 隔离级别对应

```
Spring 隔离级别                    MySQL InnoDB
─────────────────────────────────────────────
ISOLATION_DEFAULT          →    使用 MySQL 默认（REPEATABLE_READ）
ISOLATION_READ_UNCOMMITTED →    READ UNCOMMITTED
ISOLATION_READ_COMMITTED   →    READ COMMITTED
ISOLATION_REPEATABLE_READ  →    REPEATABLE READ
ISOLATION_SERIALIZABLE     →    SERIALIZABLE
```

```java
// Spring Boot 配置默认隔离级别
spring:
  datasource:
    hikari:
      transaction-isolation: TRANSACTION_READ_COMMITTED  # 全局默认
```

---

### 4.5 Spring 事务实现原理

```
请求 → DispatcherServlet → Controller → Service（@Transactional）
                                          ↓
                              TransactionInterceptor（AOP 拦截）
                                          ↓
                              1. 获取事务（TransactionManager.getTransaction()）
                              2. 获取数据库连接，设置隔离级别
                              3. 关闭自动提交（connection.setAutoCommit(false)）
                              4. 执行目标方法
                              5. 成功 → commit()
                              6. 异常 → rollback()
```

```java
// Spring 事务核心流程（简化版）
public class TransactionInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 1. 获取事务属性
        TransactionAttribute txAttr = getTransactionAttributeSource()
            .getTransactionAttribute(invocation.getMethod(), invocation.getThis().getClass());

        // 2. 获取事务管理器
        PlatformTransactionManager tm = determineTransactionManager(txAttr);

        // 3. 开启事务
        TransactionStatus status = tm.getTransaction(txAttr);

        try {
            // 4. 执行目标方法
            Object result = invocation.proceed();
            // 5. 提交事务
            tm.commit(status);
            return result;
        } catch (Throwable ex) {
            // 6. 回滚事务（根据异常类型判断是否回滚）
            if (txAttr.rollbackOn(ex)) {
                tm.rollback(status);
            } else {
                tm.commit(status);
            }
            throw ex;
        }
    }
}
```

> **面试高频问题**：Spring 事务的底层实现原理？
> 答：Spring 事务基于 AOP 实现，通过 `TransactionInterceptor` 拦截带有 `@Transactional` 注解的方法。核心流程：(1) 通过 AOP 代理拦截方法调用；(2) `TransactionManager` 开启事务（获取连接、设置隔离级别、关闭自动提交）；(3) 执行目标方法；(4) 成功则提交，异常则根据配置决定是否回滚。

---

## 五、Spring MVC

### 5.1 DispatcherServlet 工作流程

```
客户端请求
    ↓
① DispatcherServlet（前端控制器，统一入口）
    ↓
② HandlerMapping（处理器映射）
    → 根据 URL 查找对应的 Controller 方法
    ↓
③ HandlerAdapter（处理器适配器）
    → 调用 Controller 方法，处理参数绑定
    ↓
④ Controller（控制器）
    → 执行业务逻辑，返回 ModelAndView 或 ResponseEntity
    ↓
⑤ ModelAndView / @ResponseBody
    ↓
⑥ ViewResolver（视图解析器）
    → 解析逻辑视图名为具体 View（仅 ModelAndView 模式）
    ↓
⑦ View（视图渲染）
    → 渲染模板（Thymeleaf/JSP/Freemarker）
    ↓
⑧ 响应客户端
```

```
┌──────────────────────────────────────────────────────────┐
│                    DispatcherServlet                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │HandlerMapping│→ │HandlerAdapter│→ │   Controller   │   │
│  └─────────────┘  └──────────────┘  └────────────────┘   │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ViewResolver │← │ModelAndView │← │  Interceptors  │   │
│  └─────────────┘  └──────────────┘  └────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

> **React 对比理解**：DispatcherServlet 类似 React 中的 Router（react-router），它是所有请求的入口。HandlerMapping 类似路由配置表，Controller 类似页面组件，ViewResolver 类似模板引擎。

---

### 5.2 @Controller vs @RestController

```java
// @Controller：返回视图名称（传统 MVC 模式）
@Controller
public class PageController {

    @GetMapping("/home")
    public String home(Model model) {
        model.addAttribute("title", "首页");
        model.addAttribute("users", userService.findAll());
        return "home";  // 返回 Thymeleaf/JSP 模板名称
    }
}

// @RestController：返回 JSON 数据（前后端分离模式）
@RestController
@RequestMapping("/api/users")
public class UserApiController {

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);  // 自动序列化为 JSON
    }

    @PostMapping
    public User createUser(@RequestBody UserDTO dto) {
        return userService.create(dto);  // 返回 JSON
    }
}

// @RestController = @Controller + @ResponseBody
```

| 特性 | @Controller | @RestController |
|------|-------------|-----------------|
| **返回值** | 视图名称（模板页面） | JSON/XML 数据 |
| **使用场景** | 服务端渲染（SSR） | 前后端分离（REST API） |
| **注解组合** | 单独使用 | = @Controller + @ResponseBody |
| **现代开发** | 较少使用 | **主流方式** |

---

### 5.3 请求映射

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    // 类级别 + 方法级别组合
    @GetMapping                          // GET /api/v1/users
    public List<User> list() { return userService.findAll(); }

    @GetMapping("/{id}")                 // GET /api/v1/users/123
    public User getById(@PathVariable Long id) { return userService.findById(id); }

    @PostMapping                         // POST /api/v1/users
    public User create(@RequestBody UserDTO dto) { return userService.create(dto); }

    @PutMapping("/{id}")                 // PUT /api/v1/users/123
    public User update(@PathVariable Long id, @RequestBody UserDTO dto) {
        return userService.update(id, dto);
    }

    @DeleteMapping("/{id}")              // DELETE /api/v1/users/123
    public void delete(@PathVariable Long id) { userService.delete(id); }

    // 带查询参数
    @GetMapping("/search")
    public Page<User> search(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return userService.search(keyword, page, size);
    }

    // 多路径映射
    @RequestMapping(value = {"/info", "/detail"}, method = RequestMethod.GET)
    public User info(@RequestParam Long id) { return userService.findById(id); }

    // 请求头参数
    @GetMapping("/check")
    public String checkHeader(@RequestHeader("Authorization") String token) {
        return "Token: " + token;
    }
}
```

---

### 5.4 参数绑定

```java
@RestController
@RequestMapping("/api")
public class BindingController {

    // @RequestParam：查询参数（URL 中 ?key=value）
    // GET /api/users?name=张三&age=25
    @GetMapping("/users")
    public List<User> queryUsers(
        @RequestParam String name,
        @RequestParam(required = false, defaultValue = "0") Integer age
    ) {
        return userService.findByNameAndAge(name, age);
    }

    // @PathVariable：路径参数（URL 中 /{id}）
    // GET /api/users/123
    @GetMapping("/users/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // @RequestBody：请求体（JSON）
    // POST /api/users  Body: {"name": "张三", "email": "zhangsan@example.com"}
    @PostMapping("/users")
    public User createUser(@Valid @RequestBody UserDTO dto) {
        return userService.create(dto);
    }

    // 对象绑定（自动映射查询参数到对象）
    // GET /api/users?name=张三&age=25&page=1&size=10
    @GetMapping("/users/page")
    public PageResult<User> pageQuery(UserQuery query) {
        return userService.pageQuery(query);
    }

    // 文件上传
    @PostMapping("/upload")
    public String upload(@RequestParam("file") MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename();
        String filepath = "/uploads/" + System.currentTimeMillis() + "_" + filename;
        file.transferTo(new File(filepath));
        return "上传成功: " + filepath;
    }

    // 表单提交
    @PostMapping("/login")
    public Result login(
        @RequestParam String username,
        @RequestParam String password,
        HttpSession session
    ) {
        User user = authService.login(username, password);
        session.setAttribute("user", user);
        return Result.success(user);
    }
}

// 查询参数对象
@Data
public class UserQuery {
    private String name;
    private Integer age;
    private Integer page = 1;
    private Integer size = 10;
    private String sortBy = "id";
    private String sortDir = "asc";
}

// DTO 参数校验
@Data
public class UserDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 20, message = "用户名长度2-20")
    private String name;

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotNull(message = "年龄不能为空")
    @Min(value = 0, message = "年龄不能小于0")
    @Max(value = 150, message = "年龄不能大于150")
    private Integer age;
}
```

---

### 5.5 统一异常处理

```java
// 统一响应体
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Result<T> {
    private int code;
    private String message;
    private T data;

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }
}

// 自定义业务异常
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(String message) {
        super(message);
        this.code = 400;
    }

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }
}

// 全局异常处理器
@RestControllerAdvice  // = @ControllerAdvice + @ResponseBody
@Slf4j
public class GlobalExceptionHandler {

    // 处理业务异常
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常: {}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    // 处理参数校验异常
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Map<String, String>> handleValidationException(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors()
            .forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return Result.error(400, "参数校验失败").setData(errors);
    }

    // 处理资源未找到
    @ExceptionHandler(NoHandlerFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNotFoundException(NoHandlerFoundException e) {
        return Result.error(404, "资源不存在: " + e.getRequestURL());
    }

    // 处理所有未捕获异常
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(500, "系统内部错误");
    }
}
```

> **React 对比理解**：统一异常处理类似 React 中的 Error Boundary。Error Boundary 捕获组件渲染错误并显示降级 UI，GlobalExceptionHandler 捕获 Controller 异常并返回统一错误响应。

---

### 5.6 拦截器（HandlerInterceptor）vs 过滤器（Filter）

```java
// 拦截器（Spring MVC 层面）
@Component
@Slf4j
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        String token = request.getHeader("Authorization");
        if (token == null || !jwtUtil.validateToken(token)) {
            response.setStatus(401);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"code\":401,\"message\":\"未登录\"}");
            return false;  // 中断请求
        }
        // 将用户信息放入请求属性
        request.setAttribute("userId", jwtUtil.getUserId(token));
        return true;  // 继续执行
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
                           Object handler, ModelAndView modelAndView) {
        log.info("请求处理完成: {}", request.getRequestURI());
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        log.info("请求完成: {}", request.getRequestURI());
    }
}

// 注册拦截器
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/**")           // 拦截路径
                .excludePathPatterns(                 // 排除路径
                    "/api/auth/login",
                    "/api/auth/register",
                    "/api/public/**"
                );
    }
}
```

```java
// 过滤器（Servlet 层面）
@Component
@Slf4j
public class RequestLogFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        long startTime = System.currentTimeMillis();

        log.info("请求开始: {} {}", httpRequest.getMethod(), httpRequest.getRequestURI());

        chain.doFilter(request, response);  // 继续过滤链

        log.info("请求结束: 耗时 {}ms", System.currentTimeMillis() - startTime);
    }
}
```

| 特性 | 过滤器（Filter） | 拦截器（Interceptor） |
|------|-----------------|---------------------|
| **规范** | Servlet 规范 | Spring MVC 规范 |
| **作用范围** | 所有请求（包括静态资源） | Controller 方法 |
| **执行时机** | 在 DispatcherServlet 之前 | 在 DispatcherServlet 之后 |
| **注入 Bean** | 不能直接注入 Spring Bean | 可以注入 Spring Bean |
| **控制粒度** | URL 级别 | 方法级别（可获取 Handler） |
| **执行顺序** | Filter → DispatcherServlet → Interceptor → Controller | |

```
请求流向：
Filter → Filter → DispatcherServlet → Interceptor(preHandle) → Controller
                                                              ↓
响应流向：                                                     ↓
Filter ← Filter ← DispatcherServlet ← Interceptor(afterCompletion) ← Controller
```

> **React 对比理解**：Filter 类似 React 中的 HTTP 代理（如 Nginx 配置），在请求到达应用之前处理；Interceptor 类似 React Route Guard（路由守卫），在路由匹配后、组件渲染前执行。

---

### 5.7 文件上传

```java
@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    @Value("${file.upload-dir}")
    private String uploadDir;

    // 单文件上传
    @PostMapping("/upload")
    public Result<String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessException("文件不能为空");
        }

        // 验证文件类型
        String contentType = file.getContentType();
        if (!contentType.startsWith("image/")) {
            throw new BusinessException("只支持图片文件");
        }

        // 验证文件大小（默认1MB，配置可调）
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BusinessException("文件大小不能超过5MB");
        }

        // 生成文件名
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID() + extension;

        // 保存文件
        Path filepath = Paths.get(uploadDir, filename);
        Files.createDirectories(filepath.getParent());
        file.transferTo(filepath.toFile());

        return Result.success("/uploads/" + filename);
    }

    // 多文件上传
    @PostMapping("/batch-upload")
    public Result<List<String>> batchUpload(@RequestParam("files") MultipartFile[] files)
            throws IOException {
        List<String> urls = new ArrayList<>();
        for (MultipartFile file : files) {
            String filename = UUID.randomUUID() +
                file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            Path filepath = Paths.get(uploadDir, filename);
            Files.createDirectories(filepath.getParent());
            file.transferTo(filepath.toFile());
            urls.add("/uploads/" + filename);
        }
        return Result.success(urls);
    }
}
```

```yaml
# application.yml 文件上传配置
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB      # 单个文件最大大小
      max-request-size: 50MB   # 单次请求最大大小
```

---

### 5.8 RESTful API 设计规范

```java
@RestController
@RequestMapping("/api/v1")
public class RestfulController {

    // GET    /api/v1/users          → 查询列表
    @GetMapping("/users")
    public PageResult<User> list(UserQuery query) { return userService.pageQuery(query); }

    // GET    /api/v1/users/{id}     → 查询详情
    @GetMapping("/users/{id}")
    public Result<User> getById(@PathVariable Long id) {
        return Result.success(userService.findById(id));
    }

    // POST   /api/v1/users          → 新增
    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    public Result<User> create(@Valid @RequestBody UserDTO dto) {
        return Result.success(userService.create(dto));
    }

    // PUT    /api/v1/users/{id}     → 全量更新
    @PutMapping("/users/{id}")
    public Result<User> update(@PathVariable Long id, @Valid @RequestBody UserDTO dto) {
        return Result.success(userService.update(id, dto));
    }

    // PATCH  /api/v1/users/{id}     → 部分更新
    @PatchMapping("/users/{id}")
    public Result<User> partialUpdate(@PathVariable Long id, @RequestBody Map<String, Object> fields) {
        return Result.success(userService.partialUpdate(id, fields));
    }

    // DELETE /api/v1/users/{id}     → 删除
    @DeleteMapping("/users/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

**RESTful 设计规范总结：**

| 规则 | 说明 |
|------|------|
| URL 用名词 | `/users` 而不是 `/getUsers` |
| HTTP 方法表示操作 | GET 查询、POST 新增、PUT 更新、DELETE 删除 |
| 资源嵌套 | `/users/{id}/orders` 表示用户的订单 |
| 版本号 | `/api/v1/users` |
| 分页参数 | `?page=1&size=10&sort=createdAt,desc` |
| 状态码 | 200 成功、201 创建、204 无内容、400 参数错误、401 未认证、403 无权限、404 不存在、500 服务器错误 |
| 统一响应格式 | `{ code, message, data }` |

> **React 对比理解**：RESTful API 的 URL 设计和 HTTP 方法对应 React 中的前端请求库（axios/fetch）的调用方式。`GET /api/v1/users` 对应 `axios.get('/api/v1/users')`，`POST /api/v1/users` 对应 `axios.post('/api/v1/users', data)`。

---

## 六、Spring Boot（重点！）

### 6.1 Spring Boot 核心特性

```
┌─────────────────────────────────────────────────┐
│               Spring Boot                        │
├─────────────────────────────────────────────────┤
│  1. 自动配置（Auto-Configuration）               │
│     → 根据依赖自动配置 Bean                       │
├─────────────────────────────────────────────────┤
│  2. 起步依赖（Starter Dependencies）             │
│     → 简化依赖管理，一个依赖引入整套功能            │
├─────────────────────────────────────────────────┤
│  3. 内嵌容器（Embedded Container）               │
│     → Tomcat/Jetty/Undertow，无需部署 WAR 包      │
├─────────────────────────────────────────────────┤
│  4. 生产就绪（Production-Ready）                 │
│     → Actuator 监控、健康检查、指标               │
├─────────────────────────────────────────────────┤
│  5. 配置简化                                     │
│     → application.yml/properties，约定优于配置     │
└─────────────────────────────────────────────────┘
```

```xml
<!-- 起步依赖示例 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <!-- 自动引入：spring-web、spring-webmvc、spring-boot-starter-tomcat、jackson 等 -->
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- 自动引入：spring-data-jpa、hibernate、spring-orm 等 -->
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
    <!-- 自动引入：spring-security、spring-security-web 等 -->
</dependency>
```

> **React 对比理解**：Spring Boot 的 Starter 依赖类似 React 的脚手架工具（Create React App / Vite）。你不需要手动配置 Webpack、Babel、ESLint 等，一个 `npm create vite` 就搞定。Spring Boot Starter 也是同理，一个依赖引入整套功能。

---

### 6.2 自动配置原理

```java
// @SpringBootApplication 是一个组合注解
@SpringBootConfiguration      // = @Configuration
@EnableAutoConfiguration       // 开启自动配置
@ComponentScan                 // 组件扫描
public @interface SpringBootApplication {
    // ...
}

// @EnableAutoConfiguration 通过 @Import 导入自动配置类
@AutoConfigurationPackage
@Import(AutoConfigurationImportSelector.class)
public @interface EnableAutoConfiguration {
    // ...
}

// AutoConfigurationImportSelector 读取 spring.factories / AutoConfiguration.imports
// 加载所有自动配置类
```

**自动配置流程：**

```
1. @SpringBootApplication
    ↓
2. @EnableAutoConfiguration
    ↓
3. AutoConfigurationImportSelector
    ↓
4. 读取 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
   （Spring Boot 2.7 之前是 META-INF/spring.factories）
    ↓
5. 加载所有自动配置类（如 DataSourceAutoConfiguration、WebMvcAutoConfiguration 等）
    ↓
6. 根据 @Conditional 系列条件注解判断是否生效
    ↓
7. 满足条件的配置类创建对应的 Bean
```

```java
// 以 DataSourceAutoConfiguration 为例（简化版）
@AutoConfiguration
@ConditionalOnClass(DataSource.class)           // classpath 中有 DataSource 类
@ConditionalOnMissingBean(DataSource.class)      // 容器中没有自定义 DataSource
@EnableConfigurationProperties(DataSourceProperties.class)
public class DataSourceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean  // 没有自定义时才创建
    public DataSource dataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder().build();
    }
}
```

```java
// 自定义配置覆盖自动配置
@Configuration
public class CustomDataSourceConfig {

    @Bean
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl("jdbc:mysql://localhost:3306/custom_db");
        ds.setUsername("custom_user");
        ds.setPassword("custom_password");
        return ds;
        // 因为容器中已有 DataSource Bean，
        // DataSourceAutoConfiguration 的 @ConditionalOnMissingBean 不生效
    }
}
```

> **面试高频问题**：Spring Boot 自动配置原理？
> 答：(1) `@SpringBootApplication` 包含 `@EnableAutoConfiguration`；(2) 通过 `AutoConfigurationImportSelector` 加载自动配置类；(3) 从 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 读取配置类列表；(4) 根据 `@Conditional` 系列条件注解过滤生效的配置；(5) 生效的配置类创建对应的 Bean。用户自定义的 Bean 优先级高于自动配置。

---

### 6.3 @Conditional 系列注解在自动配置中的应用

```java
// Spring Boot 常用条件注解
@ConditionalOnClass(DataSource.class)              // classpath 存在该类
@ConditionalOnMissingClass("com.mysql.jdbc.Driver") // classpath 不存在该类
@ConditionalOnBean(DataSource.class)                // 容器中存在该 Bean
@ConditionalOnMissingBean(DataSource.class)         // 容器中不存在该 Bean
@ConditionalOnProperty(prefix = "spring.datasource", name = "url")  // 配置属性存在
@ConditionalOnProperty(name = "feature.cache.enabled", havingValue = "true")  // 配置值匹配
@ConditionalOnWebApplication                        // 当前是 Web 应用
@ConditionalOnNotWebApplication                     // 当前不是 Web 应用
@ConditionalOnExpression("${feature.a} && ${feature.b}")  // SpEL 表达式
```

```java
// 实际案例：Redis 自动配置
@AutoConfiguration
@ConditionalOnClass(RedisOperations.class)
@EnableConfigurationProperties(RedisProperties.class)
@Import({ LettuceConnectionConfiguration.class, JedisConnectionConfiguration.class })
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }

    @Bean
    @ConditionalOnMissingBean
    public StringRedisTemplate stringRedisTemplate(
            RedisConnectionFactory redisConnectionFactory) {
        return new StringRedisTemplate(redisConnectionFactory);
    }
}
```

---

### 6.4 自定义 Starter

**项目结构：**
```
my-spring-boot-starter/
├── pom.xml
├── src/main/java/
│   └── com/example/starter/
│       ├── MyService.java              # 核心功能
│       ├── MyServiceProperties.java    # 配置属性
│       └── MyServiceAutoConfiguration.java  # 自动配置
└── src/main/resources/
    └── META-INF/
        └── spring/
            └── org.springframework.boot.autoconfigure.AutoConfiguration.imports
```

```java
// 1. 配置属性类
@ConfigurationProperties(prefix = "my.service")
@Data
public class MyServiceProperties {
    private boolean enabled = true;
    private String prefix = "[MY]";
    private String suffix = "[/MY]";
    private int timeout = 5000;
}

// 2. 核心服务类
public class MyService {
    private final MyServiceProperties properties;

    public MyService(MyServiceProperties properties) {
        this.properties = properties;
    }

    public String process(String input) {
        return properties.getPrefix() + input + properties.getSuffix();
    }
}

// 3. 自动配置类
@AutoConfiguration
@ConditionalOnClass(MyService.class)
@ConditionalOnProperty(prefix = "my.service", name = "enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(MyServiceProperties.class)
public class MyServiceAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public MyService myService(MyServiceProperties properties) {
        return new MyService(properties);
    }
}

// 4. 注册自动配置（Spring Boot 2.7+）
// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// 内容：com.example.starter.MyServiceAutoConfiguration

// Spring Boot 2.7 之前使用 META-INF/spring.factories
// org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
//   com.example.starter.MyServiceAutoConfiguration
```

```xml
<!-- 使用自定义 Starter -->
<dependency>
    <groupId>com.example</groupId>
    <artifactId>my-spring-boot-starter</artifactId>
    <version>1.0.0</version>
</dependency>
```

```yaml
# application.yml
my:
  service:
    enabled: true
    prefix: "[CUSTOM]"
    suffix: "[/CUSTOM]"
    timeout: 3000
```

---

### 6.5 配置文件

```yaml
# application.yml（推荐，层级清晰）
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useSSL=false&serverTimezone=UTC
    username: root
    password: ${DB_PASSWORD:default123}  # 环境变量，带默认值
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 5
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

  redis:
    host: localhost
    port: 6379
    password: ${REDIS_PASSWORD:}
    database: 0

# 自定义配置
app:
  name: My Application
  version: 1.0.0
  security:
    token-secret: ${JWT_SECRET:mySecretKey}
    token-expiration: 86400

# 日志配置
logging:
  level:
    root: INFO
    com.example: DEBUG
    org.springframework.web: INFO
  file:
    name: logs/application.log
```

```properties
# application.properties（等价写法）
server.port=8080
server.servlet.context-path=/api
spring.datasource.url=jdbc:mysql://localhost:3306/mydb
spring.datasource.username=root
spring.datasource.password=${DB_PASSWORD:default123}
```

**配置优先级（从高到低）：**

```
1. 命令行参数（--server.port=8080）
2. SPRING_APPLICATION_JSON 环境变量
3. ServletConfig / ServletContext 参数
4. JNDI 属性
5. Java 系统属性（System.getProperties()）
6. 操作系统环境变量
7. application-{profile}.yml（外部 config 目录）
8. application-{profile}.yml（classpath）
9. application.yml（外部 config 目录）
10. application.yml（classpath）
11. @PropertySource 注解
12. 默认属性
```

---

### 6.6 Profile 多环境配置

```yaml
# application.yml（公共配置）
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}  # 默认激活 dev 环境

app:
  name: My Application
```

```yaml
# application-dev.yml（开发环境）
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb_dev
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

logging:
  level:
    com.example: DEBUG
```

```yaml
# application-prod.yml（生产环境）
server:
  port: 80

spring:
  datasource:
    url: jdbc:mysql://prod-db-server:3306/mydb_prod
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 20
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false

logging:
  level:
    com.example: INFO
    root: WARN
```

```yaml
# application-test.yml（测试环境）
server:
  port: 8081

spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

```java
// 代码中使用 @Profile
@Configuration
public class DataSourceConfig {

    @Bean
    @Profile("dev")
    public DataSource devDataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:mysql://localhost:3306/mydb_dev")
            .username("root")
            .password("root")
            .build();
    }

    @Bean
    @Profile("prod")
    public DataSource prodDataSource() {
        return DataSourceBuilder.create()
            .url("jdbc:mysql://prod-server:3306/mydb_prod")
            .username(System.getenv("DB_USERNAME"))
            .password(System.getenv("DB_PASSWORD"))
            .build();
    }
}

// 启动方式
// java -jar app.jar --spring.profiles.active=prod
// java -Dspring.profiles.active=prod -jar app.jar
// export SPRING_PROFILES_ACTIVE=prod && java -jar app.jar
```

> **React 对比理解**：Profile 多环境配置类似 React 中的环境变量（`.env.development`、`.env.production`）。React 通过 `process.env.NODE_ENV` 区分环境，Spring Boot 通过 `spring.profiles.active` 区分环境。

---

### 6.7 Actuator 监控端点

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
# Actuator 配置
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,env,beans,mappings  # 暴露的端点
        base-path: /actuator
  endpoint:
    health:
      show-details: always  # 显示详细健康信息
  info:
    env:
      enabled: true
```

**常用端点：**

| 端点 | 说明 | 示例 |
|------|------|------|
| `/actuator/health` | 健康检查 | `{"status":"UP"}` |
| `/actuator/info` | 应用信息 | 版本、描述等 |
| `/actuator/metrics` | 应用指标 | JVM、HTTP 请求等 |
| `/actuator/env` | 环境属性 | 所有配置属性 |
| `/actuator/beans` | 所有 Bean | 容器中的 Bean 列表 |
| `/actuator/mappings` | 请求映射 | 所有 URL 映射 |
| `/actuator/loggers` | 日志级别 | 查看/修改日志级别 |
| `/actuator/threaddump` | 线程转储 | JVM 线程信息 |
| `/actuator/heapdump` | 堆转储 | 下载堆转储文件 |

```bash
# 常用命令
curl http://localhost:8080/actuator/health
curl http://localhost:8080/actuator/metrics/jvm.memory.used
curl http://localhost:8080/actuator/beans | jq '.contexts.application.beans | keys'
```

```java
// 自定义健康检查
@Component
public class CustomHealthIndicator implements HealthIndicator {

    @Autowired
    private ExternalServiceClient externalServiceClient;

    @Override
    public Health health() {
        try {
            boolean isUp = externalServiceClient.check();
            if (isUp) {
                return Health.up().withDetail("externalService", "可用").build();
            } else {
                return Health.down().withDetail("externalService", "不可用").build();
            }
        } catch (Exception e) {
            return Health.down(e).build();
        }
    }
}
```

---

### 6.8 Spring Boot 启动流程

```
main() 方法
    ↓
① new SpringApplication(primarySources)
    → 推断应用类型（SERVLET / REACTIVE / NONE）
    → 加载初始化器（ApplicationContextInitializer）
    → 加载监听器（ApplicationListener）
    → 推断主类（main 方法所在类）
    ↓
② SpringApplication.run(args)
    ↓
③ 准备环境（prepareEnvironment）
    → 加载配置文件
    → 激活 Profile
    ↓
④ 创建 ApplicationContext
    → 根据 Web 应用类型创建对应的 Context
    → Servlet: AnnotationConfigServletWebServerApplicationContext
    ↓
⑤ 刷新 ApplicationContext（refreshContext）
    → 注册 BeanDefinition
    → 调用 BeanFactoryPostProcessor
    → 注册 BeanPostProcessor
    → 初始化国际化资源
    → 初始化事件广播器
    → 实例化单例 Bean（包括自动配置的 Bean）
    → 完成 AOP 代理创建
    ↓
⑥ 启动内嵌 Web 容器（Tomcat）
    → Tomcat.start()
    → 部署 DispatcherServlet
    ↓
⑦ 发布 ApplicationStartedEvent
    ↓
⑧ 执行 CommandLineRunner / ApplicationRunner
    ↓
⑨ 发布 ApplicationReadyEvent（应用就绪）
```

```java
// 自定义启动逻辑
@Component
@Slf4j
public class StartupRunner implements CommandLineRunner, ApplicationRunner {

    @Override
    public void run(String... args) {
        log.info("CommandLineRunner 执行，参数: {}", Arrays.toString(args));
        // 初始化缓存、预热数据等
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("ApplicationRunner 执行");
        log.info("非选项参数: {}", args.getNonOptionArgs());
        log.info("选项参数: {}", args.getOptionNames());
    }
}

// 自定义启动监听
@Component
@Slf4j
public class StartupEventListener {

    @EventListener(ApplicationReadyEvent.class)
    public void onReady(ApplicationReadyEvent event) {
        log.info("应用启动完成，耗时: {}ms",
            System.currentTimeMillis() - event.getStartTime());
    }
}
```

> **面试高频问题**：Spring Boot 启动流程？
> 答：(1) 创建 SpringApplication，推断应用类型、加载初始化器和监听器；(2) 执行 run 方法；(3) 准备 Environment，加载配置；(4) 创建并刷新 ApplicationContext；(5) 触发自动配置（加载自动配置类、条件过滤、注册 Bean）；(6) 启动内嵌 Web 容器；(7) 发布启动完成事件，执行 Runner。

---

## 七、Spring Data JPA / MyBatis

### 7.1 JPA vs MyBatis 对比

| 特性 | JPA（Hibernate） | MyBatis |
|------|-----------------|---------|
| **ORM 方式** | 全自动 ORM | 半自动（手写 SQL） |
| **SQL 控制** | 自动生成，可优化 | 完全手动控制 |
| **学习曲线** | 较陡（需理解 JPA 规范） | 较平（SQL 即文档） |
| **性能优化** | 较难精细控制 | 容易精细优化 |
| **复杂查询** | Criteria API / JPQL | XML 或注解 SQL |
| **数据库移植** | 好（Dialect 适配） | 差（SQL 方言差异） |
| **适用场景** | 简单 CRUD、快速开发 | 复杂查询、性能敏感 |
| **国内使用** | 外企较多 | **国内主流** |

> **React 对比理解**：JPA 类似 GraphQL（自动处理数据映射），MyBatis 类似 REST API（手动控制数据获取）。JPA 像是"约定优于配置"，MyBatis 像是"显式优于隐式"。

---

### 7.2 MyBatis 核心概念

#### SqlSession、Mapper 接口、XML 映射文件

```java
// Mapper 接口
@Mapper  // 或在启动类加 @MapperScan("com.example.mapper")
public interface UserMapper {

    User findById(Long id);

    List<User> findAll();

    List<User> findByCondition(@Param("name") String name,
                                @Param("age") Integer age,
                                @Param("orderBy") String orderBy);

    int insert(User user);

    int update(User user);

    int deleteById(Long id);

    // 注解方式（简单 SQL）
    @Select("SELECT * FROM user WHERE id = #{id}")
    User selectById(Long id);

    @Insert("INSERT INTO user(name, email, age) VALUES(#{name}, #{email}, #{age})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertUser(User user);
}
```

```xml
<!-- XML 映射文件：resources/mapper/UserMapper.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="com.example.mapper.UserMapper">

    <!-- resultMap：结果映射 -->
    <resultMap id="userResultMap" type="com.example.entity.User">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="email" column="email"/>
        <result property="age" column="age"/>
        <result property="createTime" column="create_time"/>
        <!-- 一对一关联 -->
        <association property="department" javaType="com.example.entity.Department">
            <id property="id" column="dept_id"/>
            <result property="name" column="dept_name"/>
        </association>
        <!-- 一对多关联 -->
        <collection property="roles" ofType="com.example.entity.Role">
            <id property="id" column="role_id"/>
            <result property="name" column="role_name"/>
        </collection>
    </resultMap>

    <!-- 基本查询 -->
    <select id="findById" resultMap="userResultMap">
        SELECT u.*, d.id as dept_id, d.name as dept_name
        FROM user u
        LEFT JOIN department d ON u.dept_id = d.id
        WHERE u.id = #{id}
    </select>

    <!-- 动态 SQL -->
    <select id="findByCondition" resultMap="userResultMap">
        SELECT * FROM user
        <where>
            <if test="name != null and name != ''">
                AND name LIKE CONCAT('%', #{name}, '%')
            </if>
            <if test="age != null">
                AND age = #{age}
            </if>
        </where>
        <if test="orderBy != null and orderBy != ''">
            ORDER BY ${orderBy}
        </if>
    </select>

    <!-- 批量插入 -->
    <insert id="batchInsert">
        INSERT INTO user(name, email, age) VALUES
        <foreach collection="list" item="user" separator=",">
            (#{user.name}, #{user.email}, #{user.age})
        </foreach>
    </insert>

    <!-- 更新（动态 SET） -->
    <update id="update">
        UPDATE user
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="email != null">email = #{email},</if>
            <if test="age != null">age = #{age},</if>
        </set>
        WHERE id = #{id}
    </update>

    <!-- 分页查询 -->
    <select id="findAll" resultMap="userResultMap">
        SELECT * FROM user
        ORDER BY id DESC
        LIMIT #{offset}, #{pageSize}
    </select>
</mapper>
```

#### #{} vs ${}（SQL 注入）

```xml
<!-- #{}：预编译参数（PreparedStatement），防 SQL 注入（推荐） -->
<select id="findById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
    -- 实际执行：SELECT * FROM user WHERE id = ?
    -- 参数通过 PreparedStatement.setString() 设置
</select>

<!-- ${}：字符串替换，存在 SQL 注入风险（仅用于动态列名/表名） -->
<select id="findByCondition" resultType="User">
    SELECT * FROM user ORDER BY ${orderBy}
    -- 实际执行：SELECT * FROM user ORDER BY name
    -- 直接拼接字符串，不安全！
</select>

<!-- 错误示例：SQL 注入 -->
<select id="search" resultType="User">
    SELECT * FROM user WHERE name = '${name}'
    -- 如果 name = "'; DROP TABLE user; --"
    -- 实际执行：SELECT * FROM user WHERE name = ''; DROP TABLE user; --'
    -- 表被删除！
</select>

<!-- 正确做法：使用 #{} -->
<select id="search" resultType="User">
    SELECT * FROM user WHERE name = #{name}
</select>
```

| 特性 | #{} | ${} |
|------|-----|-----|
| **处理方式** | 预编译参数（PreparedStatement） | 字符串直接替换 |
| **SQL 注入** | 安全 | **不安全** |
| **类型处理** | 自动类型转换 | 纯字符串 |
| **适用场景** | 参数值（WHERE 条件值） | 表名、列名、ORDER BY |
| **性能** | 可复用执行计划 | 每次重新编译 |

> **面试高频问题**：MyBatis 中 #{} 和 ${} 的区别？
> 答：#{} 使用预编译参数（PreparedStatement），安全防 SQL 注入；${} 是字符串直接替换，存在 SQL 注入风险。#{} 适用于参数值，${} 仅用于表名、列名等动态部分。

---

#### 一级缓存 vs 二级缓存

```java
// 一级缓存（SqlSession 级别，默认开启）
@Service
public class CacheDemoService {

    @Autowired
    private SqlSession sqlSession;

    public void firstLevelCacheDemo() {
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);

        // 第一次查询：访问数据库
        User user1 = mapper.findById(1L);
        // 第二次查询：从一级缓存获取（同一个 SqlSession）
        User user2 = mapper.findById(1L);

        System.out.println(user1 == user2);  // true（同一对象）

        // 执行增删改操作会清空一级缓存
        mapper.insert(new User("新用户"));
        User user3 = mapper.findById(1L);  // 再次访问数据库
    }
}
```

```xml
<!-- 二级缓存（Mapper/namespace 级别，需手动开启） -->

<!-- 1. 全局配置开启二级缓存 -->
<!-- mybatis-config.xml -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- 2. Mapper XML 中添加 <cache/> -->
<mapper namespace="com.example.mapper.UserMapper">
    <!-- 开启二级缓存 -->
    <cache
        eviction="LRU"           <!-- 回收策略：LRU/FIFO/SOFT/WEAK -->
        flushInterval="60000"    <!-- 刷新间隔：60秒 -->
        size="1024"              <!-- 最大缓存对象数 -->
        readOnly="true"          <!-- 只读缓存 -->
    />

    <select id="findById" resultMap="userResultMap" useCache="true">
        SELECT * FROM user WHERE id = #{id}
    </select>
</mapper>
```

```java
// 二级缓存注意事项
@Service
public class SecondLevelCacheDemo {

    @Autowired
    private SqlSessionFactory sqlSessionFactory;

    public void secondLevelCacheDemo() {
        // 不同的 SqlSession
        try (SqlSession session1 = sqlSessionFactory.openSession();
             SqlSession session2 = sqlSessionFactory.openSession()) {

            UserMapper mapper1 = session1.getMapper(UserMapper.class);
            UserMapper mapper2 = session2.getMapper(UserMapper.class);

            // Session1 查询：访问数据库，结果放入二级缓存
            User user1 = mapper1.findById(1L);
            session1.close();  // 关闭 Session1，数据从一级缓存转移到二级缓存

            // Session2 查询：从二级缓存获取
            User user2 = mapper2.findById(1L);

            System.out.println(user1 == user2);  // false（不同对象，但数据相同）
        }
    }
}
```

| 特性 | 一级缓存 | 二级缓存 |
|------|---------|---------|
| **作用范围** | SqlSession | Mapper（namespace） |
| **默认开启** | 是 | 否（需手动开启） |
| **存储位置** | 内存中 | 可自定义（内存/Redis/Ehcache） |
| **跨 Session** | 否 | 是 |
| **失效时机** | Session 关闭/增删改操作 | 增删改操作/flushInterval |

---

#### 延迟加载

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 全局延迟加载开关 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 按需加载（true：访问属性时加载；false：访问任何属性都加载所有） -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

```xml
<!-- association 延迟加载 -->
<resultMap id="userWithDeptMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <!-- fetchType 覆盖全局配置 -->
    <association property="department" javaType="Department"
                 fetchType="lazy"  <!-- 延迟加载 -->
                 select="com.example.mapper.DepartmentMapper.findById"
                 column="dept_id"/>
</resultMap>

<!-- collection 延迟加载 -->
<resultMap id="userWithOrdersMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order"
                fetchType="lazy"
                select="com.example.mapper.OrderMapper.findByUserId"
                column="id"/>
</resultMap>
```

```java
// 延迟加载效果
User user = userMapper.findById(1L);
// 此时只查询了 user 表，department 和 orders 未加载

String name = user.getName();  // 不触发加载
Department dept = user.getDepartment();  // 触发加载，查询 department 表
List<Order> orders = user.getOrders();   // 触发加载，查询 order 表
```

---

#### MyBatis-Plus 常用功能

```xml
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.5</version>
</dependency>
```

```java
// 实体类
@Data
@TableName("user")
public class User {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("user_name")
    private String name;

    private String email;

    private Integer age;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic  // 逻辑删除字段
    private Integer deleted;
}

// Mapper 接口（继承 BaseMapper，自带 CRUD）
@Mapper
public interface UserMapper extends BaseMapper<User> {
    // 无需编写 XML，自带以下方法：
    // insert(T entity)
    // deleteById(Serializable id)
    // updateById(T entity)
    // selectById(Serializable id)
    // selectList(Wrapper<T> queryWrapper)
    // selectPage(Page<T> page, Wrapper<T> queryWrapper)
    // ...
}

// Service 层
public interface UserService extends IService<User> {}

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {}

// 使用示例
@Service
public class UserBusinessService {

    @Autowired
    private UserService userService;

    // 条件构造器（QueryWrapper）
    public List<User> searchUsers(String name, Integer minAge) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(name != null, User::getName, name)     // LIKE '%name%'
               .ge(minAge != null, User::getAge, minAge)    // age >= minAge
               .orderByDesc(User::getCreateTime);            // ORDER BY create_time DESC
        return userService.list(wrapper);
    }

    // 分页查询
    public Page<User> pageQuery(int pageNum, int pageSize, String keyword) {
        Page<User> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(keyword != null, User::getName, keyword);
        return userService.page(page, wrapper);
    }

    // 批量操作
    public void batchInsert(List<User> users) {
        userService.saveBatch(users, 500);  // 每 500 条一批
    }

    // 保存或更新
    public void saveOrUpdate(User user) {
        userService.saveOrUpdate(user);
    }
}

// 自动填充处理器
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        this.strictInsertFill(metaObject, "createTime", LocalDateTime.class, LocalDateTime.now());
        this.strictInsertFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        this.strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
    }
}

// 分页插件配置
@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor() {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
        return interceptor;
    }
}
```

---

## 八、Spring Security

### 8.1 认证（Authentication）vs 授权（Authorization）

```
认证（Authentication）：你是谁？（登录验证身份）
授权（Authorization）：你能做什么？（权限校验）
```

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF（前后端分离不需要）
            .csrf(csrf -> csrf.disable())
            // 基于 Token，不需要 Session
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 配置请求授权
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()        // 登录注册不需要认证
                .requestMatchers("/api/public/**").permitAll()      // 公开接口
                .requestMatchers("/api/admin/**").hasRole("ADMIN")  // 需要ADMIN角色
                .requestMatchers("/api/user/**").authenticated()    // 需要认证
                .anyRequest().authenticated()                       // 其他都需要认证
            )
            // 添加 JWT 过滤器
            .addFilterBefore(jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}
```

```java
// 用户详情服务
@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username));

        return org.springframework.security.core.userdetails.User
            .withUsername(user.getUsername())
            .password(user.getPassword())
            .roles(user.getRoles().toArray(new String[0]))
            .build();
    }
}
```

> **React 对比理解**：认证类似 React 中的登录状态管理（Context/Redux 存储用户信息），授权类似 React Router 的路由守卫（PrivateRoute 组件检查登录状态和权限）。

---

### 8.2 过滤器链（Filter Chain）

```
HTTP 请求
    ↓
① SecurityContextPersistenceFilter  → 加载 SecurityContext
    ↓
② CorsFilter                       → CORS 跨域处理
    ↓
③ CsrfFilter                       → CSRF 防护（前后端分离可禁用）
    ↓
④ LogoutFilter                     → 登出处理
    ↓
⑤ UsernamePasswordAuthenticationFilter → 表单登录处理
    ↓
⑥ JwtAuthenticationFilter（自定义） → JWT Token 验证
    ↓
⑦ SecurityContextHolderAwareRequestFilter
    ↓
⑧ RememberMeAuthenticationFilter   → 记住我
    ↓
⑨ AnonymousAuthenticationFilter    → 匿名用户
    ↓
⑩ ExceptionTranslationFilter       → 异常转换（401/403）
    ↓
⑪ FilterSecurityInterceptor        → 权限校验（最终检查）
    ↓
Controller
```

---

### 8.3 JWT 集成

```java
// JWT 工具类
@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    // 生成 Token
    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities());
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration * 1000))
            .signWith(SignatureAlgorithm.HS512, secret)
            .compact();
    }

    // 解析 Token
    public Claims parseToken(String token) {
        return Jwts.parser()
            .setSigningKey(secret)
            .parseClaimsJws(token)
            .getBody();
    }

    // 验证 Token
    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 获取用户名
    public String getUsername(String token) {
        return parseToken(token).getSubject();
    }
}
```

```java
// JWT 过滤器
@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null && jwtUtil.validateToken(token)) {
            String username = jwtUtil.getUsername(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());

            authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request));

            // 将认证信息放入 SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

```java
// 认证控制器
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @PostMapping("/login")
    public Result<Map<String, String>> login(@RequestBody LoginRequest request) {
        // 认证
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 生成 Token
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        String token = jwtUtil.generateToken(userDetails);

        return Result.success(Map.of("token", token, "type", "Bearer"));
    }

    @GetMapping("/me")
    public Result<UserDetails> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        return Result.success(userDetails);
    }
}
```

---

### 8.4 OAuth2 基本概念

```
OAuth2 角色：
┌──────────┐      ┌──────────┐      ┌──────────┐
│  资源所有者 │ ──→ │  客户端    │ ──→ │ 授权服务器 │
│ （用户）   │      │ （前端App）│      │ （认证中心）│
└──────────┘      └──────────┘      └──────────┘
                        │                  │
                        └──────→ ┌──────────┐
                                 │ 资源服务器 │
                                 │ （API服务）│
                                 └──────────┘
```

| 概念 | 说明 |
|------|------|
| **Resource Owner** | 资源所有者（用户） |
| **Client** | 第三方应用（前端/移动端） |
| **Authorization Server** | 授权服务器（发放 Token） |
| **Resource Server** | 资源服务器（提供 API） |

**OAuth2 授权模式：**

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| **授权码模式** | 最安全，先获取授权码再换 Token | Web 应用（有后端） |
| **隐式模式** | 直接返回 Token（已不推荐） | 纯前端 SPA |
| **密码模式** | 用户直接提供密码 | 高度信任的第一方应用 |
| **客户端凭证模式** | 无用户参与，客户端直接获取 Token | 服务器间通信 |

```java
// Spring Security OAuth2 资源服务器配置
@Configuration
@EnableWebSecurity
public class OAuth2ResourceServerConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );
        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return JwtDecoders.fromIssuerLocation("https://auth.example.com");
    }
}
```

> **React 对比理解**：OAuth2 类似 React 中的第三方登录（如 "使用 Google 登录"）。React 前端跳转到 Google 授权页面，用户授权后 Google 返回授权码，后端用授权码换取 Access Token。JWT 是 Access Token 的一种实现方式。

---

## 九、Spring 面试高频问题汇总

### 9.1 Spring Bean 生命周期

> **面试问题**：请描述 Spring Bean 的完整生命周期。

**标准答案：**

1. **实例化**：通过反射调用构造方法创建 Bean 实例
2. **属性赋值**：依赖注入（@Autowired、@Value 等）
3. **Aware 接口回调**：BeanNameAware、BeanFactoryAware、ApplicationContextAware
4. **BeanPostProcessor.postProcessBeforeInitialization**：初始化前处理
5. **@PostConstruct**：自定义初始化方法（JSR-250）
6. **InitializingBean.afterPropertiesSet**：接口初始化方法
7. **自定义 init-method**：XML/Java Config 指定的初始化方法
8. **BeanPostProcessor.postProcessAfterInitialization**：初始化后处理（AOP 代理在此创建）
9. **Bean 就绪**：可被应用程序使用
10. **容器关闭**：@PreDestroy → DisposableBean.destroy → destroy-method

**关键点**：AOP 代理对象在 `postProcessAfterInitialization` 阶段创建，这是 `AbstractAutoProxyCreator` 的实现。

---

### 9.2 循环依赖如何解决

> **面试问题**：Spring 如何解决循环依赖？三级缓存分别是什么？

**标准答案：**

Spring 通过**三级缓存**解决单例 Bean 的循环依赖问题：

- **一级缓存（singletonObjects）**：存放完全初始化好的 Bean（成品）
- **二级缓存（earlySingletonObjects）**：存放提前暴露的半成品 Bean（已实例化，未初始化）
- **三级缓存（singletonFactories）**：存放 ObjectFactory，用于生成早期引用

**解决流程**：A 实例化后放入三级缓存 → A 属性填充需要 B → B 实例化放入三级缓存 → B 属性填充需要 A → 从三级缓存获取 A 的工厂 → 调用工厂获取 A 的早期引用 → 放入二级缓存 → B 完成初始化放入一级缓存 → A 完成初始化放入一级缓存。

**不能解决**：构造器注入的循环依赖、prototype 作用域的循环依赖。

**为什么需要三级缓存**：如果只有二级缓存，在存在 AOP 代理的情况下，无法保证每次获取的是同一个代理对象。三级缓存中的 ObjectFactory 可以延迟创建代理对象。

---

### 9.3 @Autowired vs @Resource

> **面试问题**：@Autowired 和 @Resource 的区别？

**标准答案：**

| 维度 | @Autowired | @Resource |
|------|-----------|-----------|
| 来源 | Spring 框架 | JSR-250（Java 标准） |
| 匹配方式 | 先按类型（byType），有多个同类型 Bean 时按名称 | 先按名称（byName），找不到再按类型 |
| 指定名称 | 配合 @Qualifier | 使用 name 属性 |
| 适用位置 | 构造器、方法、参数、字段 | 方法、字段 |
| required | 支持 required=false | 无 |

**推荐**：Spring 项目推荐构造器注入 + @Autowired；需要按名称注入时使用 @Resource。

---

### 9.4 AOP 原理

> **面试问题**：Spring AOP 的实现原理？

**标准答案：**

Spring AOP 基于动态代理实现：

1. **JDK 动态代理**：目标类实现了接口时使用。通过 `Proxy.newProxyInstance()` 创建代理对象，`InvocationHandler` 拦截方法调用。
2. **CGLIB 代理**：目标类没有实现接口时使用。通过 `Enhancer` 创建目标类的子类，`MethodInterceptor` 拦截方法调用。
3. **Spring Boot 2.x 默认使用 CGLIB**（`spring.aop.proxy-target-class=true`）。

**代理创建时机**：在 `BeanPostProcessor.postProcessAfterInitialization` 阶段，由 `AbstractAutoProxyCreator` 判断是否需要创建代理。

**面试追问**：JDK 动态代理和 CGLIB 的区别？
- JDK 代理基于接口，CGLIB 基于继承
- JDK 代理不能代理 final 类/方法，CGLIB 不能代理 final 类
- JDK 代理生成代理快，CGLIB 调用快

---

### 9.5 事务传播行为

> **面试问题**：Spring 事务的传播行为有哪些？

**标准答案：**

| 传播行为 | 说明 |
|---------|------|
| **REQUIRED**（默认） | 有事务加入，没有新建 |
| **REQUIRES_NEW** | 总是新建事务 |
| **NESTED** | 嵌套事务（保存点） |
| **SUPPORTS** | 有事务加入，没有非事务执行 |
| **NOT_SUPPORTED** | 非事务执行，挂起当前事务 |
| **MANDATORY** | 必须在事务中 |
| **NEVER** | 非事务执行，有事务抛异常 |

**高频追问**：REQUIRED 和 REQUIRES_NEW 的区别？
- REQUIRED：加入外层事务，外层回滚则一起回滚
- REQUIRES_NEW：新建独立事务，外层回滚不影响本事务

---

### 9.6 事务失效场景

> **面试问题**：Spring 事务在哪些场景下会失效？

**标准答案（8种）：**

1. **方法非 public**：Spring AOP 只能代理 public 方法
2. **同类内部调用**：this 调用不经过代理，解决方案：注入自身代理或使用 AopContext
3. **方法被 final/static 修饰**：不能被重写，CGLIB 代理无效
4. **类未被 Spring 管理**：没有 @Service 等注解
5. **异常被 catch 吞掉**：没有抛出异常，Spring 不知道需要回滚
6. **抛出非 RuntimeException**：默认只回滚 RuntimeException，需设置 rollbackFor
7. **数据库引擎不支持事务**：如 MySQL 的 MyISAM
8. **传播行为设置不当**：如 NOT_SUPPORTED

---

### 9.7 Spring Boot 自动配置原理

> **面试问题**：Spring Boot 自动配置的原理？

**标准答案：**

1. `@SpringBootApplication` 包含 `@EnableAutoConfiguration`
2. `@EnableAutoConfiguration` 通过 `@Import(AutoConfigurationImportSelector.class)` 导入自动配置
3. `AutoConfigurationImportSelector` 从 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Spring Boot 2.7+）加载配置类列表
4. 每个 AutoConfiguration 类使用 `@Conditional` 系列注解进行条件过滤
5. 满足条件的配置类注册 Bean 到容器中
6. 用户自定义的 Bean（@Bean）优先级高于自动配置（@ConditionalOnMissingBean）

**面试追问**：如何自定义 Starter？
1. 创建 `xxx-spring-boot-starter` 模块
2. 编写配置属性类（`@ConfigurationProperties`）
3. 编写核心功能类
4. 编写自动配置类（`@AutoConfiguration` + `@Conditional`）
5. 注册自动配置（`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`）

---

### 9.8 Spring MVC 执行流程

> **面试问题**：请描述 Spring MVC 的请求处理流程。

**标准答案：**

1. **客户端发送请求** → `DispatcherServlet`（前端控制器）
2. `DispatcherServlet` 调用 `HandlerMapping` → 查找对应的 Controller 方法
3. `DispatcherServlet` 调用 `HandlerAdapter` → 执行 Controller 方法
4. Controller 执行业务逻辑，返回 `ModelAndView` 或 `ResponseEntity`
5. `DispatcherServlet` 将 `ModelAndView` 传给 `ViewResolver` → 解析视图
6. 渲染视图，返回响应

**如果是 @RestController**：跳过步骤 5-6，直接通过 `HttpMessageConverter` 将返回值序列化为 JSON。

**拦截器执行时机**：
- `preHandle`：在 Controller 之前执行
- `postHandle`：在 Controller 之后、视图渲染之前执行
- `afterCompletion`：在视图渲染之后执行（无论是否异常）

---

### 补充：Spring 面试加分项

#### Spring 中的设计模式

| 设计模式 | 应用 |
|---------|------|
| **工厂模式** | BeanFactory、ApplicationContext |
| **单例模式** | Bean 的默认作用域 |
| **代理模式** | AOP（JDK 动态代理、CGLIB） |
| **模板方法模式** | JdbcTemplate、RestTemplate |
| **观察者模式** | ApplicationEvent、ApplicationListener |
| **适配器模式** | HandlerAdapter、MethodArgumentResolver |
| **策略模式** | Resource 接口（ClassPathResource、FileSystemResource） |
| **责任链模式** | Filter Chain、Interceptor Chain |
| **装饰器模式** | BeanWrapper |
| **建造者模式** | BeanDefinitionBuilder |

#### Spring 新版本特性关注

- **Spring 6 / Spring Boot 3**：最低要求 Java 17，支持 Jakarta EE 9+（javax → jakarta），原生支持 GraalVM（AOT 编译）
- **Spring Boot 3.2+**：支持虚拟线程（Virtual Threads），改进的 Observability
- **Spring Authorization Server**：替代已废弃的 Spring Security OAuth2 Auth Server

---

> **文档说明**：本文档覆盖了 Spring 框架面试的核心知识点，每个知识点都配有代码示例和面试高频问题标注。建议结合实际项目经验进行理解和记忆，面试时不仅要说出概念，还要能结合项目场景说明使用方式。

---

## 补充知识点

### 补充一、Spring Boot 自动配置原理（⭐高频）

#### 1. @SpringBootApplication 组合注解

```java
// @SpringBootApplication 是一个组合注解
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@SpringBootConfiguration      // 等价于 @Configuration，标记为配置类
@EnableAutoConfiguration       // 启用自动配置（核心）
@ComponentScan(                // 组件扫描
    excludeFilters = {
        @Filter(type = FilterType.CUSTOM, classes = TypeExcludeFilter.class),
        @Filter(type = FilterType.CUSTOM, classes = AutoConfigurationExcludeFilter.class)
    }
)
public @interface SpringBootApplication {
    // ...
}
```

#### 2. @EnableAutoConfiguration

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
@AutoConfigurationPackage       // 自动配置包（注册当前包下的组件）
@Import(AutoConfigurationImportSelector.class)  // 核心：导入自动配置类
public @interface EnableAutoConfiguration {
    String[] excludeName() default {};  // 排除特定自动配置
    Class<?>[] exclude() default {};
}
```

#### 3. spring.factories / AutoConfiguration.imports

```properties
# Spring Boot 2.x：META-INF/spring.factories
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.example.MyAutoConfiguration,\
  org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration,\
  org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration

# Spring Boot 3.x：META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.example.MyAutoConfiguration
org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration
```

#### 4. @ConditionalOnClass 等条件注解

```java
// 常用条件注解
@ConditionalOnClass(DataSource.class)           // classpath 中存在 DataSource 类
@ConditionalOnMissingClass("com.mysql.jdbc.Driver")  // classpath 中不存在
@ConditionalOnBean(DataSource.class)            // 容器中存在 DataSource Bean
@ConditionalOnMissingBean(DataSource.class)     // 容器中不存在 DataSource Bean
@ConditionalOnProperty(prefix = "spring.datasource", name = "url")  // 配置属性存在
@ConditionalOnWebApplication                    // 是 Web 应用
@ConditionalOnExpression("${spring.cache.enabled:true}")  // SpEL 表达式

// 示例：Redis 自动配置
@Configuration
@ConditionalOnClass(RedisTemplate.class)        // classpath 有 RedisTemplate
@EnableConfigurationProperties(RedisProperties.class)
public class RedisAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")  // 容器中没有自定义的 redisTemplate
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        return template;
    }
}
```

#### 5. 自动配置类的加载流程

```
Spring Boot 启动流程（自动配置部分）：

1. @SpringBootApplication
   → @EnableAutoConfiguration
   → @Import(AutoConfigurationImportSelector.class)

2. AutoConfigurationImportSelector
   → 调用 SpringFactoriesLoader（2.x）或读取 AutoConfiguration.imports（3.x）
   → 加载所有候选自动配置类（约130+个）

3. 过滤（Filtering）
   → 根据 @ConditionalOnClass 排除 classpath 中不存在的依赖
   → 根据 @ConditionalOnProperty 排除未启用的配置
   → 根据 @ConditionalOnMissingBean 排除用户已自定义的 Bean
   → 根据 exclude/excludeName 排除用户指定的配置

4. 加载生效的自动配置类
   → 创建配置类中定义的 Bean
   → 绑定配置属性（@EnableConfigurationProperties）

5. 用户自定义优先
   → 用户定义的 @Bean 优先级高于自动配置
   → @ConditionalOnMissingBean 确保不覆盖用户配置
```

> ⭐ **面试问答：Spring Boot 自动配置原理？**
>
> 答：@SpringBootApplication 包含 @EnableAutoConfiguration，通过 @Import(AutoConfigurationImportSelector.class) 加载自动配置类。Spring Boot 从 classpath 的 META-INF/spring.factories（2.x）或 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports（3.x）中读取所有候选自动配置类，然后根据 @Conditional 系列注解进行过滤，最终加载符合条件的配置类。自动配置类的 Bean 定义使用 @ConditionalOnMissingBean，确保用户自定义的 Bean 优先。

---

### 补充二、Spring 事件机制（⭐⭐中频）

#### 1. ApplicationEvent / @EventListener

```java
// 1. 定义事件（继承 ApplicationEvent）
public class OrderCreatedEvent extends ApplicationEvent {
    private final Long orderId;
    private final BigDecimal amount;

    public OrderCreatedEvent(Object source, Long orderId, BigDecimal amount) {
        super(source);
        this.orderId = orderId;
        this.amount = amount;
    }

    public Long getOrderId() { return orderId; }
    public BigDecimal getAmount() { return amount; }
}

// 2. 发布事件
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    public void createOrder(Long orderId, BigDecimal amount) {
        // 业务逻辑：创建订单
        // ...
        // 发布事件
        eventPublisher.publishEvent(new OrderCreatedEvent(this, orderId, amount));
    }
}

// 3. 监听事件（方式一：@EventListener 注解）
@Component
public class OrderEventListener {

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        System.out.println("订单创建事件: orderId=" + event.getOrderId());
        // 发送通知、更新统计等
    }

    // 支持条件过滤
    @EventListener(condition = "#event.amount > 1000")
    public void handleLargeOrder(OrderCreatedEvent event) {
        System.out.println("大额订单: " + event.getAmount());
    }

    // 支持异步
    @Async
    @EventListener
    public void handleAsync(OrderCreatedEvent event) {
        // 异步执行，不阻塞主流程
    }
}

// 3. 监听事件（方式二：实现 ApplicationListener 接口）
@Component
public class OrderListener implements ApplicationListener<OrderCreatedEvent> {
    @Override
    public void onApplicationEvent(OrderCreatedEvent event) {
        System.out.println("收到订单事件: " + event.getOrderId());
    }
}
```

#### 2. 异步事件监听（@Async）

```java
@Configuration
@EnableAsync  // 启用异步支持
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("event-async-");
        executor.initialize();
        return executor;
    }
}

// 异步监听
@Async("taskExecutor")  // 指定线程池
@EventListener
public void handleAsync(OrderCreatedEvent event) {
    // 在独立线程中执行
}
```

#### 3. 事件发布/监听完整流程

```
事件机制流程：
  1. 发布者调用 ApplicationEventPublisher.publishEvent(event)
  2. AbstractApplicationContext 派发事件
  3. SimpleApplicationEventMulticaster 遍历所有监听器
  4. 匹配事件类型的监听器被调用
  5. 如果是同步监听器，在发布者线程中执行
  6. 如果是 @Async 异步监听器，在线程池中执行

Spring 内置事件：
  - ContextRefreshedEvent：ApplicationContext 初始化或刷新完成
  - ContextStartedEvent：ApplicationContext 启动
  - ContextStoppedEvent：ApplicationContext 停止
  - ContextClosedEvent：ApplicationContext 关闭
  - RequestHandledEvent：HTTP 请求处理完成
```

> ⭐ **面试问答：Spring 事件机制的应用场景？**
>
> 答：Spring 事件机制用于解耦业务逻辑。典型场景：(1) 订单创建后发送通知、更新统计、记录日志；(2) 用户注册后发送欢迎邮件、初始化用户配置；(3) 缓存更新后通知其他模块刷新。优点是发布者和监听器完全解耦，新增监听器无需修改发布者代码。注意同步事件监听会影响主流程性能，耗时操作应使用 @Async 异步监听。

---

### 补充三、@Async 异步执行原理（⭐⭐中频）

#### 1. AsyncAnnotationBeanPostProcessor

```java
// @Async 的实现原理（简化）
// 1. @EnableAsync 导入 AsyncConfigurationSelector
// 2. 注册 AsyncAnnotationBeanPostProcessor
// 3. AsyncAnnotationBeanPostProcessor 为 @Async 方法创建代理
// 4. 代理对象调用时，将任务提交到线程池执行

// 核心处理逻辑
public class AsyncExecutionInterceptor implements MethodInterceptor {
    @Override
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 获取线程池（默认是 SimpleAsyncTaskExecutor）
        Executor executor = getExecutorQualifier();
        // 将方法调用封装为 Callable，提交到线程池
        Callable<Object> task = () -> {
            try {
                return invocation.proceed();
            } catch (Throwable ex) {
                throw ex;
            }
        };
        return doSubmit(task, executor, invocation.getMethod().getReturnType());
    }
}
```

#### 2. 线程池配置

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(200);
        executor.setKeepAliveSeconds(60);
        executor.setThreadNamePrefix("async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);  // 优雅关闭
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) -> {
            // 异步任务异常处理
            log.error("异步任务异常: method={}, params={}", method.getName(), params, ex);
        };
    }
}
```

#### 3. @Async 失效场景

```java
// @Async 失效的常见原因：

// 1. 同一个类内部调用（最常见！）
@Service
public class UserService {
    public void methodA() {
        this.methodB();  // 直接调用，不走代理，@Async 失效！
    }

    @Async
    public void methodB() {
        // 不会异步执行
    }
}

// 解决方案：注入自身代理
@Service
public class UserService {
    @Autowired
    private UserService self;  // 注入代理对象

    public void methodA() {
        self.methodB();  // 通过代理调用，@Async 生效
    }

    @Async
    public void methodB() {}
}

// 2. 方法不是 public
// @Async 只能用于 public 方法，private/protected 方法不会生效

// 3. 没有启用 @EnableAsync
// 必须在配置类上添加 @EnableAsync

// 4. 返回值类型不对
// @Async 方法返回值必须是 void 或 Future/CompletableFuture
@Async
public CompletableFuture<String> asyncMethod() {
    return CompletableFuture.completedFuture("result");
}

// 5. 被 final/static 修饰的方法
// Spring AOP 无法代理 final 或 static 方法
```

> ⭐ **面试问答：@Async 为什么在同类内部调用会失效？**
>
> 答：@Async 基于 Spring AOP 动态代理实现。同类内部调用时（如 this.methodB()），是直接调用目标对象的方法，而不是通过代理对象调用，因此 AOP 切面不会生效。解决方法：(1) 注入自身代理（@Autowired 注入自己）；(2) 使用 AopContext.currentProxy() 获取代理对象；(3) 将异步方法抽取到另一个 Bean 中。

---

### 补充四、@Transactional 隔离级别和超时设置（⭐⭐中频）

#### 1. isolation 属性

```java
// @Transactional 的 isolation 属性
// 对应 java.sql.Connection 的事务隔离级别

// 1. DEFAULT：使用数据库默认隔离级别（MySQL 默认 REPEATABLE_READ）
@Transactional(isolation = Isolation.DEFAULT)

// 2. READ_UNCOMMITTED：读未提交（脏读、不可重复读、幻读都可能发生）
@Transactional(isolation = Isolation.READ_UNCOMMITTED)

// 3. READ_COMMITTED：读已提交（防止脏读，Oracle 默认级别）
@Transactional(isolation = Isolation.READ_COMMITTED)

// 4. REPEATABLE_READ：可重复读（防止脏读和不可重复读，MySQL InnoDB 默认级别）
@Transactional(isolation = Isolation.REPEATABLE_READ)

// 5. SERIALIZABLE：串行化（最高隔离级别，防止所有并发问题，性能最差）
@Transactional(isolation = Isolation.SERIALIZABLE)
```

| 隔离级别 | 脏读 | 不可重复读 | 幻读 | 性能 |
|---------|------|-----------|------|------|
| READ_UNCOMMITTED | 可能 | 可能 | 可能 | 最高 |
| READ_COMMITTED | 防止 | 可能 | 可能 | 高 |
| REPEATABLE_READ | 防止 | 防止 | 可能(InnoDB通过MVCC+间隙锁防止) | 中 |
| SERIALIZABLE | 防止 | 防止 | 防止 | 最低 |

#### 2. timeout / readOnly 属性

```java
// timeout：事务超时时间（秒），超时后自动回滚
// 默认 -1（使用数据库默认超时时间）
@Transactional(timeout = 30)  // 30秒超时

// readOnly：只读事务
// 1. 告知数据库这是只读操作，数据库可以进行优化
// 2. MySQL InnoDB 只读事务不会创建 ReadView（MVCC），减少开销
// 3. 如果在只读事务中执行写操作，会抛出异常
@Transactional(readOnly = true)
public List<User> findAllUsers() {
    return userRepository.findAll();
}

// propagation：传播行为（补充）
@Transactional(propagation = Propagation.REQUIRED)     // 默认：当前有事务则加入，没有则新建
@Transactional(propagation = Propagation.REQUIRES_NEW) // 总是新建事务，挂起当前事务
@Transactional(propagation = Propagation.NESTED)       // 嵌套事务（保存点）
@Transactional(propagation = Propagation.SUPPORTS)     // 有事务则加入，没有则非事务执行
@Transactional(propagation = Propagation.NOT_SUPPORTED)// 非事务执行，挂起当前事务
@Transactional(propagation = Propagation.MANDATORY)    // 必须在事务中调用，否则抛异常
@Transactional(propagation = Propagation.NEVER)        // 必须不在事务中调用，否则抛异常

// rollbackFor：指定哪些异常回滚（默认只回滚 RuntimeException 和 Error）
@Transactional(rollbackFor = Exception.class)  // 所有异常都回滚
@Transactional(noRollbackFor = {BusinessException.class})  // 指定异常不回滚
```

> ⭐ **面试问答：@Transactional 的 propagation 中 REQUIRED 和 REQUIRES_NEW 的区别？**
>
> 答：REQUIRED（默认）：如果当前存在事务，则加入该事务；如果不存在，则新建一个事务。REQUIRES_NEW：总是新建事务，如果当前存在事务，则将当前事务挂起。REQUIRES_NEW 适用于独立事务场景，如日志记录（即使主事务回滚，日志也应该保存）。NESTED 是嵌套事务，基于保存点（Savepoint），回滚只影响嵌套事务内部，不影响外部事务。
