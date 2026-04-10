# Java 基础核心知识体系

> 面向5年经验Java工程师面试的知识储备文档
> 读者背景：熟悉React，需要快速掌握Java核心知识

---

## 一、面向对象编程 (OOP)

### 1.1 封装、继承、多态的深入理解

#### 概念讲解

**封装（Encapsulation）**
- 将数据（属性）和操作数据的方法绑定在一起
- 通过访问修饰符控制访问权限
- 隐藏内部实现细节，只暴露必要的接口
- 类似于React组件的props和state设计

**继承（Inheritance）**
- 子类继承父类的属性和方法
- 实现代码复用
- Java只支持单继承（一个类只能继承一个父类）
- 类似于React组件继承（但React更推荐组合）

**多态（Polymorphism）**
- 同一个方法调用，不同对象有不同行为
- 编译时多态（方法重载）
- 运行时多态（方法重写 + 向上转型）
- 类似于React中的多态组件（通过props渲染不同内容）

#### 代码示例

```java
// 封装示例
public class User {
    // 私有属性，外部无法直接访问
    private String name;
    private int age;

    // 公共构造方法
    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // getter/setter方法，控制访问
    public String getName() {
        return name;
    }

    public void setName(String name) {
        // 可以添加验证逻辑
        if (name != null && !name.isEmpty()) {
            this.name = name;
        }
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        if (age >= 0 && age <= 150) {
            this.age = age;
        }
    }

    // 业务方法
    public void display() {
        System.out.println("Name: " + name + ", Age: " + age);
    }
}

// 继承示例
class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public void eat() {
        System.out.println(name + " is eating");
    }

    public void sleep() {
        System.out.println(name + " is sleeping");
    }
}

class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name); // 调用父类构造方法
        this.breed = breed;
    }

    // 方法重写
    @Override
    public void eat() {
        System.out.println(name + " (" + breed + ") is eating dog food");
    }

    // 子类特有方法
    public void bark() {
        System.out.println(name + " is barking");
    }
}

class Cat extends Animal {
    public Cat(String name) {
        super(name);
    }

    @Override
    public void eat() {
        System.out.println(name + " is eating cat food");
    }

    public void meow() {
        System.out.println(name + " is meowing");
    }
}

// 多态示例
public class PolymorphismDemo {
    public static void main(String[] args) {
        // 编译时类型是Animal，运行时类型是Dog
        Animal animal1 = new Dog("Buddy", "Golden Retriever");
        Animal animal2 = new Cat("Whiskers");

        // 多态调用：调用的是实际类型的方法
        animal1.eat(); // 输出: Buddy (Golden Retriever) is eating dog food
        animal2.eat(); // 输出: Whiskers is eating cat food

        // 父类方法正常调用
        animal1.sleep(); // 输出: Buddy is sleeping
        animal2.sleep(); // 输出: Whiskers is sleeping

        // 类型判断和向下转型
        if (animal1 instanceof Dog) {
            Dog dog = (Dog) animal1; // 向下转型
            dog.bark(); // 输出: Buddy is barking
        }

        if (animal2 instanceof Cat) {
            Cat cat = (Cat) animal2;
            cat.meow(); // 输出: Whiskers is meowing
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 什么是多态？实现多态的三个必要条件是什么？**
- 多态是同一个方法调用，不同对象有不同行为
- 三个必要条件：继承、重写、向上转型

**Q2: 重载和重写的区别是什么？**
- 重载：同一个类中，方法名相同，参数列表不同
- 重写：子类重新定义父类的方法，方法签名完全相同

**Q3: Java中实现多态的机制是什么？**
- 动态绑定（Dynamic Binding）
- 方法表（Method Table）和虚方法表（Virtual Method Table）

**Q4: 为什么说多态提高了程序的扩展性？**
- 新增子类不需要修改现有代码
- 符合开闭原则（对扩展开放，对修改关闭）

#### 与React对比

| Java | React |
|------|-------|
| 继承 | 组合（Composition） |
| 多态 | 条件渲染、多态组件 |
| 封装 | 组件封装、props/state |
| 接口 | PropTypes/TypeScript接口 |

---

### 1.2 方法重载(Overload) vs 方法重写(Override)

#### 概念讲解

**方法重载（Overloading）**
- 同一个类中，方法名相同
- 参数列表不同（参数个数、类型、顺序）
- 与返回类型无关
- 编译时确定调用哪个方法（静态绑定）

**方法重写（Overriding）**
- 子类重新定义父类的方法
- 方法名、参数列表、返回类型必须相同
- 访问权限不能更严格
- 运行时确定调用哪个方法（动态绑定）

#### 代码示例

```java
public class OverloadOverrideDemo {

    // ============ 方法重载示例 ============
    static class Calculator {
        // 重载1：两个int相加
        public int add(int a, int b) {
            return a + b;
        }

        // 重载2：三个int相加
        public int add(int a, int b, int c) {
            return a + b + c;
        }

        // 重载3：两个double相加
        public double add(double a, double b) {
            return a + b;
        }

        // 重载4：参数顺序不同
        public String add(String a, int b) {
            return a + b;
        }

        public String add(int a, String b) {
            return a + b;
        }

        // 注意：仅返回类型不同不能重载
        // public double add(int a, int b) { return a + b; } // 编译错误
    }

    // ============ 方法重写示例 ============
    static class Vehicle {
        public void start() {
            System.out.println("Vehicle is starting");
        }

        public void stop() {
            System.out.println("Vehicle is stopping");
        }

        public int getMaxSpeed() {
            return 100;
        }
    }

    static class Car extends Vehicle {
        @Override
        public void start() {
            System.out.println("Car is starting with key");
        }

        @Override
        public void stop() {
            System.out.println("Car is stopping with brakes");
        }

        @Override
        public int getMaxSpeed() {
            return 200; // 返回类型必须兼容
        }

        // 访问权限不能更严格
        // private void start() { } // 编译错误

        // 可以抛出更少或更具体的异常
        @Override
        public void stop() throws RuntimeException { // 可以，RuntimeException是Unchecked
            System.out.println("Car is stopping with brakes");
        }
    }

    public static void main(String[] args) {
        // 重载测试
        Calculator calc = new Calculator();
        System.out.println(calc.add(1, 2));           // 3
        System.out.println(calc.add(1, 2, 3));        // 6
        System.out.println(calc.add(1.5, 2.5));       // 4.0
        System.out.println(calc.add("Age: ", 25));    // Age: 25
        System.out.println(calc.add(25, " years"));   // 25 years

        // 重写测试
        Vehicle vehicle = new Car();
        vehicle.start(); // Car is starting with key
        vehicle.stop();  // Car is stopping with brakes
        System.out.println(vehicle.getMaxSpeed()); // 200
    }
}
```

#### ⭐ 面试高频问题

**Q1: 重载的方法能否根据返回类型进行区分？**
- 不能，重载只看方法名和参数列表
- 仅返回类型不同会导致编译错误

**Q2: 重写时，子类方法的访问权限能否比父类更严格？**
- 不能，子类方法的访问权限必须大于或等于父类
- 父类public → 子类必须是public
- 父类protected → 子类可以是protected或public

**Q3: 重写时，子类能否抛出比父类更宽泛的异常？**
- 不能，子类只能抛出父类异常的子类或不抛出异常
- 父类抛出IOException → 子类可以抛出FileNotFoundException或不抛出

**Q4: 静态方法能被重写吗？**
- 不能，静态方法属于类，不属于对象
- 子类定义同名静态方法只是隐藏父类方法，不是重写

#### 与React对比

```javascript
// React中的"重载"（通过参数类型判断）
function Component(props) {
    if (typeof props.content === 'string') {
        return <div>{props.content}</div>;
    } else if (Array.isArray(props.content)) {
        return <ul>{props.content.map(item => <li key={item}>{item}</li>)}</ul>;
    }
}

// React中的"重写"（通过继承或组合）
class BaseButton extends React.Component {
    render() {
        return <button>{this.props.children}</button>;
    }
}

class PrimaryButton extends BaseButton {
    render() {
        return <button className="primary">{this.props.children}</button>;
    }
}
```

---

### 1.3 抽象类 vs 接口（Java 8+ 接口默认方法）

#### 概念讲解

**抽象类（Abstract Class）**
- 不能被实例化
- 可以包含抽象方法和具体方法
- 可以包含成员变量（实例变量、静态变量）
- 可以包含构造方法
- 一个类只能继承一个抽象类

**接口（Interface）**
- Java 8之前：只能包含抽象方法和常量
- Java 8+：可以包含默认方法（default）、静态方法
- Java 9+：可以包含私有方法
- 所有字段默认是 public static final
- 所有方法默认是 public abstract（default方法除外）
- 一个类可以实现多个接口

#### 代码示例

```java
// ============ 抽象类示例 ============
abstract class Animal {
    protected String name;
    protected int age;

    // 抽象类可以有构造方法
    public Animal(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 抽象方法：没有方法体，子类必须实现
    public abstract void makeSound();

    // 具体方法：子类可以直接使用或重写
    public void eat() {
        System.out.println(name + " is eating");
    }

    // 具体方法
    public void sleep() {
        System.out.println(name + " is sleeping");
    }

    // 可以包含成员变量
    public String getName() {
        return name;
    }
}

class Dog extends Animal {
    private String breed;

    public Dog(String name, int age, String breed) {
        super(name, age);
        this.breed = breed;
    }

    @Override
    public void makeSound() {
        System.out.println(name + " barks: Woof!");
    }

    @Override
    public void eat() {
        System.out.println(name + " (" + breed + ") is eating dog food");
    }
}

// ============ 接口示例 ============
// Java 8+ 接口
interface Flyable {
    // 常量（默认 public static final）
    double MAX_ALTITUDE = 10000.0;

    // 抽象方法（默认 public abstract）
    void fly();

    // Java 8: 默认方法
    default void takeOff() {
        System.out.println("Taking off...");
    }

    default void land() {
        System.out.println("Landing...");
    }

    // Java 8: 静态方法
    static void displayInfo() {
        System.out.println("Flyable interface - Max altitude: " + MAX_ALTITUDE);
    }

    // Java 9: 私有方法
    private void checkWeather() {
        System.out.println("Checking weather conditions...");
    }
}

interface Swimmable {
    void swim();

    default void dive() {
        System.out.println("Diving into water...");
    }
}

// 实现多个接口
class Duck extends Animal implements Flyable, Swimmable {
    public Duck(String name, int age) {
        super(name, age);
    }

    @Override
    public void makeSound() {
        System.out.println(name + " quacks: Quack!");
    }

    @Override
    public void fly() {
        System.out.println(name + " is flying");
    }

    @Override
    public void swim() {
        System.out.println(name + " is swimming");
    }

    // 可以重写默认方法
    @Override
    public void takeOff() {
        System.out.println(name + " is taking off from water");
    }
}

// ============ 抽象类 vs 接口对比 ============
abstract class Vehicle {
    protected String brand;

    public Vehicle(String brand) {
        this.brand = brand;
    }

    // 抽象方法
    public abstract void start();

    // 具体方法
    public void stop() {
        System.out.println(brand + " vehicle is stopping");
    }

    // 成员变量
    public String getBrand() {
        return brand;
    }
}

interface Electric {
    void charge();

    // 默认方法
    default void displayBattery() {
        System.out.println("Battery level: 100%");
    }
}

interface GPS {
    void navigate(String destination);

    default void updateLocation() {
        System.out.println("Updating GPS location...");
    }
}

// 电动汽车：继承抽象类 + 实现接口
class ElectricCar extends Vehicle implements Electric, GPS {
    private int batteryLevel;

    public ElectricCar(String brand) {
        super(brand);
        this.batteryLevel = 100;
    }

    @Override
    public void start() {
        System.out.println(brand + " electric car is starting silently");
    }

    @Override
    public void charge() {
        System.out.println(brand + " is charging...");
        batteryLevel = 100;
    }

    @Override
    public void navigate(String destination) {
        System.out.println("Navigating to " + destination);
    }

    @Override
    public void displayBattery() {
        System.out.println(brand + " battery level: " + batteryLevel + "%");
    }
}

public class AbstractVsInterfaceDemo {
    public static void main(String[] args) {
        // 抽象类使用
        Animal dog = new Dog("Buddy", 3, "Golden Retriever");
        dog.makeSound(); // Buddy barks: Woof!
        dog.eat();       // Buddy (Golden Retriever) is eating dog food

        // 接口使用
        Duck duck = new Duck("Donald", 2);
        duck.makeSound(); // Donald quacks: Quack!
        duck.fly();       // Donald is flying
        duck.swim();      // Donald is swimming
        duck.takeOff();   // Donald is taking off from water

        // 接口静态方法
        Flyable.displayInfo(); // Flyable interface - Max altitude: 10000.0

        // 抽象类 + 接口组合
        ElectricCar tesla = new ElectricCar("Tesla");
        tesla.start();              // Tesla electric car is starting silently
        tesla.charge();             // Tesla is charging...
        tesla.displayBattery();     // Tesla battery level: 100%
        tesla.navigate("Home");     // Navigating to Home
        tesla.stop();               // Tesla vehicle is stopping
    }
}
```

#### ⭐ 面试高频问题

**Q1: 抽象类和接口的区别是什么？**
- 抽象类可以有构造方法、成员变量；接口不能
- 一个类只能继承一个抽象类，但可以实现多个接口
- 抽象类用于"is-a"关系；接口用于"can-do"关系

**Q2: 什么时候使用抽象类，什么时候使用接口？**
- 抽象类：需要共享代码、需要成员变量、强关联关系
- 接口：定义契约、多重继承、弱关联关系

**Q3: Java 8接口的默认方法解决了什么问题？**
- 解决接口演进问题：向现有接口添加新方法而不破坏实现类
- 类似于React组件的 defaultProps

**Q4: 一个类实现了两个接口，两个接口有相同的默认方法，如何解决？**
- 类必须重写该方法
- 可以使用 `InterfaceName.super.methodName()` 调用特定接口的默认方法

#### 与React对比

```javascript
// React中的"抽象类"概念
abstract class BaseComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = { loading: false };
    }

    // 抽象方法（子类必须实现）
    renderContent() {
        throw new Error('renderContent must be implemented');
    }

    // 具体方法
    render() {
        if (this.state.loading) {
            return <div>Loading...</div>;
        }
        return this.renderContent();
    }
}

// React中的"接口"概念（通过TypeScript）
interface Flyable {
    fly(): void;
    takeOff(): void;
}

interface Swimmable {
    swim(): void;
    dive(): void;
}

// 实现"接口"
class Duck extends BaseComponent implements Flyable, Swimmable {
    fly() { console.log('Flying'); }
    takeOff() { console.log('Taking off'); }
    swim() { console.log('Swimming'); }
    dive() { console.log('Diving'); }

    renderContent() {
        return <div>Duck Component</div>;
    }
}
```

---

### 1.4 this vs super 关键字

#### 概念讲解

**this 关键字**
- 指向当前对象
- 用于区分成员变量和局部变量
- 调用当前类的构造方法
- 调用当前类的方法

**super 关键字**
- 指向父类对象
- 访问父类的成员变量
- 调用父类的方法
- 调用父类的构造方法

#### 代码示例

```java
class Parent {
    protected String name = "Parent";
    protected int age = 50;

    public Parent() {
        System.out.println("Parent default constructor");
    }

    public Parent(String name) {
        this.name = name;
        System.out.println("Parent constructor with name: " + name);
    }

    public void display() {
        System.out.println("Parent display: name=" + name + ", age=" + age);
    }

    public void show() {
        System.out.println("Parent show method");
    }
}

class Child extends Parent {
    private String name = "Child";
    private int age = 20;

    public Child() {
        // 默认调用父类无参构造：super()
        System.out.println("Child default constructor");
    }

    public Child(String name, int age) {
        // 调用父类带参构造
        super(name);
        this.age = age;
        System.out.println("Child constructor with name: " + name + ", age: " + age);
    }

    public void displayInfo() {
        // this.name - 当前类的成员变量
        System.out.println("this.name = " + this.name);  // Child

        // super.name - 父类的成员变量
        System.out.println("super.name = " + super.name); // Parent

        // 局部变量
        String name = "Local";
        System.out.println("local name = " + name);      // Local

        // 使用this区分成员变量和局部变量
        System.out.println("this.name = " + this.name);  // Child
    }

    public void show() {
        // 调用父类方法
        super.show();  // Parent show method

        // 调用当前类方法
        this.display(); // Parent display: name=Parent, age=50
    }

    // 使用this调用当前类的其他构造方法
    public Child(String name) {
        this(name, 0); // 调用Child(String, int)构造方法
    }
}

public class ThisSuperDemo {
    public static void main(String[] args) {
        // 测试this和super
        Child child1 = new Child();
        child1.displayInfo();
        /*
        this.name = Child
        super.name = Parent
        local name = Local
        this.name = Child
        */

        Child child2 = new Child("Tom", 25);
        /*
        Parent constructor with name: Tom
        Child constructor with name: Tom, age: 25
        */

        child2.show();
        /*
        Parent show method
        Parent display: name=Tom, age=50
        */
    }
}
```

#### ⭐ 面试高频问题

**Q1: this() 和 super() 能在同一个构造方法中同时使用吗？**
- 不能，两者都必须在构造方法的第一行
- 一个构造方法只能调用一个this()或super()

**Q2: super() 可以在普通方法中调用吗？**
- 不可以，super() 只能在构造方法中调用
- 在普通方法中可以使用 super. 访问父类成员

**Q3: this 和 super 可以用在静态方法中吗？**
- 不可以，静态方法属于类，不依赖对象
- this 和 super 都需要对象实例

#### 与React对比

```javascript
// React中的this
class MyComponent extends React.Component {
    constructor(props) {
        super(props); // 类似于Java的super()
        this.state = { count: 0 }; // this指向当前组件实例
    }

    handleClick() {
        this.setState({ count: this.state.count + 1 });
        console.log(this.props.name); // this访问props
    }

    render() {
        return <button onClick={() => this.handleClick()}>
            {this.state.count}
        </button>;
    }
}

// React中没有super关键字访问父类方法
// 但可以通过super()调用父类构造方法
```

---

### 1.5 final、finally、finalize 区别

#### 概念讲解

**final**
- 修饰类：不能被继承
- 修饰方法：不能被重写
- 修饰变量：常量，只能赋值一次

**finally**
- 异常处理的一部分
- try-catch-finally中的finally块
- 无论是否发生异常都会执行

**finalize**
- Object类的方法
- 垃圾回收前调用
- 已被废弃（Java 9+）

#### 代码示例

```java
// ============ final 示例 ============

// final类：不能被继承
final class FinalClass {
    private final int MAX_VALUE = 100; // final常量

    public final void finalMethod() { // final方法：不能被重写
        System.out.println("This method cannot be overridden");
    }
}

// 编译错误：不能继承final类
// class SubClass extends FinalClass { }

class NormalClass {
    private final int id; // final实例变量：必须初始化

    public NormalClass(int id) {
        this.id = id; // 只能赋值一次
    }

    // final方法
    public final void display() {
        System.out.println("ID: " + id);
    }
}

// ============ finally 示例 ============
import java.io.*;

public class FinallyDemo {
    public static void main(String[] args) {
        testFinally1();
        testFinally2();
        testFinallyWithReturn();
        testTryWithResources();
    }

    // finally基本用法
    public static void testFinally1() {
        try {
            System.out.println("Try block");
            int result = 10 / 2;
            System.out.println("Result: " + result);
        } catch (Exception e) {
            System.out.println("Catch block: " + e.getMessage());
        } finally {
            System.out.println("Finally block - always executes");
        }
    }

    // 发生异常时finally也会执行
    public static void testFinally2() {
        try {
            System.out.println("Try block");
            int result = 10 / 0; // 抛出异常
            System.out.println("This line won't execute");
        } catch (ArithmeticException e) {
            System.out.println("Catch block: " + e.getMessage());
        } finally {
            System.out.println("Finally block - executes even after exception");
        }
    }

    // finally与return的关系
    public static int testFinallyWithReturn() {
        try {
            System.out.println("Try block");
            return 1;
        } catch (Exception e) {
            System.out.println("Catch block");
            return 2;
        } finally {
            System.out.println("Finally block - executes before return");
            // finally中的return会覆盖try/catch中的return
            // return 3; // 不推荐这样做
        }
        // 输出：
        // Try block
        // Finally block - executes before return
        // 返回值：1
    }

    // try-with-resources（Java 7+）
    public static void testTryWithResources() {
        // AutoCloseable接口的资源会自动关闭
        try (FileInputStream fis = new FileInputStream("test.txt");
             BufferedReader reader = new BufferedReader(new InputStreamReader(fis))) {

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }

        } catch (IOException e) {
            System.out.println("Exception: " + e.getMessage());
        }
        // 资源会自动关闭，不需要finally块
    }
}

// ============ finalize 示例 ============
class Resource {
    private String name;

    public Resource(String name) {
        this.name = name;
        System.out.println(name + " created");
    }

    @Override
    @Deprecated(since = "9") // finalize已废弃
    protected void finalize() throws Throwable {
        try {
            System.out.println(name + " finalize called - cleaning up");
            // 清理资源
        } finally {
            super.finalize();
        }
    }

    public void cleanup() {
        System.out.println(name + " manual cleanup");
    }
}

public class FinalizeDemo {
    public static void main(String[] args) {
        Resource resource = new Resource("MyResource");
        resource.cleanup();

        // 建议使用try-with-resources或显式调用cleanup()
        // 不要依赖finalize()
        resource = null;
        System.gc(); // 建议垃圾回收（不保证立即执行）

        try {
            Thread.sleep(1000); // 等待垃圾回收
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: final、finally、finalize的区别是什么？**
- final：修饰符，表示不可变
- finally：异常处理块，总是执行
- finalize：Object方法，垃圾回收前调用（已废弃）

**Q2: finally块在什么情况下不会执行？**
- System.exit(0) 退出JVM
- 守护线程中的finally（所有非守护线程结束时）
- 断电、硬件故障等物理原因

**Q3: finally块中有return语句会怎样？**
- 会覆盖try/catch块中的return值
- 不推荐在finally中使用return

**Q4: 为什么finalize()被废弃了？**
- 执行时间不确定
- 性能问题
- 可能导致对象复活
- 推荐使用try-with-resources或Cleaner

#### 与React对比

```javascript
// React中的"finally"概念
class MyComponent extends React.Component {
    componentDidMount() {
        this.fetchData();
    }

    async fetchData() {
        try {
            const data = await api.getData();
            this.setState({ data });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            // 类似于Java的finally
            this.setState({ loading: false });
        }
    }

    componentWillUnmount() {
        // 类似于Java的finalize，但不推荐使用
        // 推荐使用cleanup函数
        this.cleanup();
    }

    cleanup() {
        // 显式清理资源
    }
}

// React Hooks中的cleanup
useEffect(() => {
    const subscription = subscribe();

    // cleanup函数（类似finally）
    return () => {
        subscription.unsubscribe();
    };
}, []);
```

---

### 1.6 静态变量/静态方法/静态代码块/普通代码块执行顺序

#### 概念讲解

**静态变量（Static Variable）**
- 类变量，所有实例共享
- 随类加载而初始化
- 只初始化一次

**静态方法（Static Method）**
- 类方法，不依赖对象
- 只能访问静态成员
- 不能使用this和super

**静态代码块（Static Block）**
- 类加载时执行一次
- 用于初始化静态变量
- 执行顺序：父类静态 → 子类静态

**普通代码块（Instance Block）**
- 创建对象时执行
- 在构造方法之前执行
- 每次创建对象都会执行

#### 代码示例

```java
class Parent {
    static {
        System.out.println("1. Parent static block");
    }

    {
        System.out.println("2. Parent instance block");
    }

    public Parent() {
        System.out.println("3. Parent constructor");
    }

    static int parentStaticVar = printStaticVar("4. Parent static variable");

    private int parentInstanceVar = printInstanceVar("5. Parent instance variable");

    static int printStaticVar(String msg) {
        System.out.println(msg);
        return 0;
    }

    private int printInstanceVar(String msg) {
        System.out.println(msg);
        return 0;
    }
}

class Child extends Parent {
    static {
        System.out.println("6. Child static block");
    }

    {
        System.out.println("7. Child instance block");
    }

    public Child() {
        // 默认调用super()
        System.out.println("8. Child constructor");
    }

    static int childStaticVar = printStaticVar("9. Child static variable");

    private int childInstanceVar = printInstanceVar("10. Child instance variable");

    static int printStaticVar(String msg) {
        System.out.println(msg);
        return 0;
    }

    private int printInstanceVar(String msg) {
        System.out.println(msg);
        return 0;
    }
}

public class ExecutionOrderDemo {
    static {
        System.out.println("11. Main class static block");
    }

    public static void main(String[] args) {
        System.out.println("12. Main method start");

        new Child();

        System.out.println("13. Main method end");
    }
}

/*
执行顺序：
1. Parent static block
2. Parent static variable
3. Main class static block
4. Child static block
5. Child static variable
6. Main method start
7. Parent instance variable
8. Parent instance block
9. Parent constructor
10. Child instance variable
11. Child instance block
12. Child constructor
13. Main method end

总结：
1. 父类静态块和静态变量（按声明顺序）
2. 子类静态块和静态变量（按声明顺序）
3. 父类实例变量和实例块（按声明顺序）
4. 父类构造方法
5. 子类实例变量和实例块（按声明顺序）
6. 子类构造方法
*/
```

#### ⭐ 面试高频问题

**Q1: 静态代码块和实例代码块的执行顺序是什么？**
- 静态代码块：类加载时执行一次，父类→子类
- 实例代码块：创建对象时执行，父类→子类

**Q2: 静态变量和静态代码块的初始化顺序是什么？**
- 按照代码中声明的顺序执行
- 先声明的先执行

**Q3: 静态方法能否访问实例变量？**
- 不能，静态方法属于类，实例变量属于对象
- 静态方法只能访问静态成员

**Q4: 静态导入（import static）的作用是什么？**
- 直接使用静态成员，不需要类名前缀
- 例如：import static java.lang.Math.*;

#### 与React对比

```javascript
// React中的"静态"概念
class MyComponent extends React.Component {
    // 静态属性（类似Java静态变量）
    static defaultProps = {
        name: 'Default'
    };

    static propTypes = {
        name: PropTypes.string
    };

    // 静态方法（类似Java静态方法）
    static getDerivedStateFromProps(props, state) {
        return null;
    }

    constructor(props) {
        super(props);
        // 实例变量（类似Java实例变量）
        this.state = { count: 0 };
    }

    render() {
        return <div>{this.props.name}</div>;
    }
}

// React Hooks中没有静态概念
// 但可以使用useMemo缓存值
```

---

### 1.7 内部类（成员内部类、局部内部类、匿名内部类、静态内部类）

#### 概念讲解

**成员内部类（Member Inner Class）**
- 定义在类内部，方法外部
- 可以访问外部类的所有成员（包括私有）
- 持有外部类的引用

**局部内部类（Local Inner Class）**
- 定义在方法或代码块内部
- 只能在定义它的方法中使用
- 可以访问外部类的成员和方法的final局部变量

**匿名内部类（Anonymous Inner Class）**
- 没有类名的内部类
- 一次性使用
- 常用于事件监听、回调

**静态内部类（Static Nested Class）**
- 使用static修饰
- 不持有外部类的引用
- 只能访问外部类的静态成员

#### 代码示例

```java
public class InnerClassDemo {

    // ============ 成员内部类 ============
    class MemberInnerClass {
        private String name = "MemberInner";

        public void display() {
            // 访问外部类成员
            System.out.println("Outer name: " + InnerClassDemo.this.name);
            System.out.println("Inner name: " + this.name);
        }

        public void accessOuterMembers() {
            // 可以访问外部类的私有成员
            System.out.println("Private field: " + privateField);
            outerMethod();
        }
    }

    // ============ 静态内部类 ============
    static class StaticInnerClass {
        private String name = "StaticInner";

        public void display() {
            // 只能访问外部类的静态成员
            System.out.println("Static field: " + staticField);
            // System.out.println(privateField); // 编译错误
            staticMethod();
        }
    }

    // ============ 外部类成员 ============
    private String name = "OuterClass";
    private int privateField = 100;
    private static int staticField = 200;

    public void outerMethod() {
        System.out.println("Outer method");
    }

    public static void staticMethod() {
        System.out.println("Static method");
    }

    // ============ 局部内部类示例 ============
    public void testLocalInnerClass() {
        final int localVar = 10; // Java 8+ 可以省略final

        class LocalInnerClass {
            public void display() {
                // 可以访问外部类的成员
                System.out.println("Outer name: " + name);
                System.out.println("Local var: " + localVar);
                // localVar = 20; // 编译错误，局部变量实际上是final的
            }
        }

        LocalInnerClass local = new LocalInnerClass();
        local.display();
    }

    // ============ 匿名内部类示例 ============
    public void testAnonymousInnerClass() {
        // 匿名内部类实现接口
        Runnable runnable = new Runnable() {
            @Override
            public void run() {
                System.out.println("Anonymous Runnable");
                System.out.println("Accessing outer field: " + privateField);
            }
        };

        new Thread(runnable).start();

        // 匿名内部类继承抽象类
        Animal animal = new Animal() {
            @Override
            public void makeSound() {
                System.out.println("Anonymous animal sound");
            }
        };

        animal.makeSound();
    }

    public static void main(String[] args) {
        InnerClassDemo outer = new InnerClassDemo();

        // 成员内部类
        MemberInnerClass member = outer.new MemberInnerClass();
        member.display();
        member.accessOuterMembers();

        // 静态内部类
        StaticInnerClass staticInner = new StaticInnerClass();
        staticInner.display();

        // 局部内部类
        outer.testLocalInnerClass();

        // 匿名内部类
        outer.testAnonymousInnerClass();
    }
}

abstract class Animal {
    public abstract void makeSound();
}

// ============ 实际应用示例 ============
import java.util.*;
import java.util.function.*;

public class InnerClassPracticalDemo {
    public static void main(String[] args) {
        // 1. 成员内部类：迭代器模式
        MyList list = new MyList();
        list.add("A");
        list.add("B");
        list.add("C");

        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            System.out.println(iterator.next());
        }

        // 2. 匿名内部类：事件监听
        Button button = new Button();
        button.setOnClickListener(new OnClickListener() {
            @Override
            public void onClick() {
                System.out.println("Button clicked!");
            }
        });
        button.click();

        // 3. Lambda表达式（Java 8+，替代匿名内部类）
        button.setOnClickListener(() -> System.out.println("Lambda click"));

        // 4. 静态内部类：Builder模式
        User user = new User.Builder()
            .name("John")
            .age(30)
            .email("john@example.com")
            .build();
        System.out.println(user);
    }
}

// 成员内部类实现迭代器
class MyList implements Iterable<String> {
    private String[] elements = new String[10];
    private int size = 0;

    public void add(String element) {
        elements[size++] = element;
    }

    @Override
    public Iterator<String> iterator() {
        return new MyIterator(); // 成员内部类
    }

    // 成员内部类
    private class MyIterator implements Iterator<String> {
        private int current = 0;

        @Override
        public boolean hasNext() {
            return current < size;
        }

        @Override
        public String next() {
            return elements[current++];
        }
    }
}

// 接口
interface OnClickListener {
    void onClick();
}

class Button {
    private OnClickListener listener;

    public void setOnClickListener(OnClickListener listener) {
        this.listener = listener;
    }

    public void click() {
        if (listener != null) {
            listener.onClick();
        }
    }
}

// 静态内部类：Builder模式
class User {
    private final String name;
    private final int age;
    private final String email;

    private User(Builder builder) {
        this.name = builder.name;
        this.age = builder.age;
        this.email = builder.email;
    }

    // 静态内部类
    public static class Builder {
        private String name;
        private int age;
        private String email;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder age(int age) {
            this.age = age;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public User build() {
            return new User(this);
        }
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + ", email='" + email + "'}";
    }
}
```

#### ⭐ 面试高频问题

**Q1: 内部类可以访问外部类的私有成员吗？**
- 可以，内部类可以访问外部类的所有成员
- 编译器会自动生成访问方法

**Q2: 静态内部类和非静态内部类的区别？**
- 静态内部类不持有外部类引用
- 静态内部类只能访问外部类的静态成员
- 创建静态内部类不需要外部类实例

**Q3: 局部内部类访问的局部变量为什么必须是final的？**
- 局部内部类的生命周期可能超过方法
- 为了保证数据一致性，局部变量必须是final的
- Java 8+ 可以省略final关键字，但实际上仍然是final

**Q4: 匿名内部类和Lambda表达式的区别？**
- 匿名内部类可以继承类或实现接口
- Lambda只能用于函数式接口
- Lambda更简洁，性能更好

#### 与React对比

```javascript
// React中的"内部类"概念
class OuterComponent extends React.Component {
    // 成员方法（类似成员内部类）
    handleClick() {
        console.log('Clicked');
    }

    render() {
        // 匿名函数（类似匿名内部类）
        const anonymousFunction = function() {
            console.log('Anonymous');
        };

        // 箭头函数（类似Lambda）
        const arrowFunction = () => {
            console.log('Arrow');
        };

        return (
            <div>
                <button onClick={() => this.handleClick()}>
                    Click me
                </button>
            </div>
        );
    }
}

// React中的闭包（类似局部内部类）
function createCounter() {
    let count = 0; // 类似final局部变量

    return {
        increment: () => count++,
        getCount: () => count
    };
}

const counter = createCounter();
counter.increment();
console.log(counter.getCount()); // 1
```

---

## 二、数据类型与运算

### 2.1 基本数据类型（8种）及包装类

#### 概念讲解

**基本数据类型（Primitive Types）**
- byte: 8位，-128~127
- short: 16位，-32768~32767
- int: 32位，-2^31~2^31-1
- long: 64位，-2^63~2^63-1
- float: 32位，单精度
- double: 64位，双精度
- char: 16位，Unicode字符
- boolean: true/false

**包装类（Wrapper Classes）**
- Byte, Short, Integer, Long, Float, Double, Character, Boolean
- 基本类型的对象表示
- 提供工具方法（parseInt、toString等）

#### 代码示例

```java
public class PrimitiveTypesDemo {
    public static void main(String[] args) {
        // ============ 基本数据类型 ============
        byte byteVar = 100;
        short shortVar = 1000;
        int intVar = 100000;
        long longVar = 100000L; // L或l表示long

        float floatVar = 3.14f; // F或f表示float
        double doubleVar = 3.14159265359;

        char charVar = 'A';
        char unicodeChar = '\u4e2d'; // Unicode编码：中

        boolean boolVar = true;

        // ============ 包装类 ============
        Byte byteWrapper = Byte.valueOf((byte) 100);
        Short shortWrapper = Short.valueOf((short) 1000);
        Integer intWrapper = Integer.valueOf(100000);
        Long longWrapper = Long.valueOf(100000L);

        Float floatWrapper = Float.valueOf(3.14f);
        Double doubleWrapper = Double.valueOf(3.14159265359);

        Character charWrapper = Character.valueOf('A');
        Boolean boolWrapper = Boolean.valueOf(true);

        // ============ 自动装箱和拆箱 ============
        Integer autoBox = 100; // 自动装箱：Integer.valueOf(100)
        int autoUnbox = autoBox; // 自动拆箱：autoBox.intValue()

        // ============ 包装类常用方法 ============
        // 字符串转数字
        int parsedInt = Integer.parseInt("123");
        double parsedDouble = Double.parseDouble("3.14");

        // 数字转字符串
        String intToString = Integer.toString(123);
        String doubleToString = Double.toString(3.14);

        // 进制转换
        String binary = Integer.toBinaryString(10);    // "1010"
        String octal = Integer.toOctalString(10);      // "12"
        String hex = Integer.toHexString(10);          // "a"

        // 最大最小值
        System.out.println("Integer max: " + Integer.MAX_VALUE);
        System.out.println("Integer min: " + Integer.MIN_VALUE);

        // ============ 类型转换 ============
        // 小类型到大类型：自动转换
        long longFromInt = intVar;
        double doubleFromInt = intVar;

        // 大类型到小类型：强制转换
        int intFromLong = (int) longVar;
        float floatFromDouble = (float) doubleVar;

        // ============ 数值溢出 ============
        int maxInt = Integer.MAX_VALUE;
        int overflow = maxInt + 1; // 溢出，变为最小值
        System.out.println("Overflow: " + overflow); // -2147483648

        // 使用Math.addExact检测溢出
        try {
            int safeAdd = Math.addExact(maxInt, 1);
        } catch (ArithmeticException e) {
            System.out.println("Overflow detected: " + e.getMessage());
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: int和Integer的区别是什么？**
- int是基本类型，Integer是包装类
- int默认值0，Integer默认null
- Integer是对象，可以使用泛型

**Q2: 为什么要有包装类？**
- 基本类型不能用于泛型
- 需要对象特性（如null值）
- 提供工具方法

**Q3: 自动装箱和拆箱的原理是什么？**
- 编译器自动调用valueOf()和xxxValue()
- Integer.valueOf()会使用缓存（-128~127）

**Q4: 什么时候会发生自动装箱和拆箱？**
- 赋值：Integer i = 100;
- 方法调用：method(100);
- 运算：Integer i = 100; i + 1;

#### 与React对比

```javascript
// JavaScript中的数据类型
// 基本类型：number, string, boolean, null, undefined, symbol, bigint
const num = 100;
const str = "hello";
const bool = true;

// 对象类型：Object, Array, Function
const obj = { name: "John" };
const arr = [1, 2, 3];
const func = () => {};

// 类型转换
const strNum = String(100); // "100"
const numStr = Number("100"); // 100
const boolStr = Boolean(1); // true

// React中的类型检查
import PropTypes from 'prop-types';

MyComponent.propTypes = {
    count: PropTypes.number.isRequired,
    name: PropTypes.string,
    isActive: PropTypes.bool
};
```

---

### 2.2 自动装箱与拆箱（IntegerCache -128~127）

#### 概念讲解

**自动装箱（Autoboxing）**
- 基本类型 → 包装类型
- 编译器调用valueOf()方法
- Integer、Short、Long、Byte：-128~127缓存
- Character：0~127缓存
- Float、Double：无缓存

**自动拆箱（Unboxing）**
- 包装类型 → 基本类型
- 编译器调用xxxValue()方法
- 可能抛出NullPointerException

#### 代码示例

```java
public class AutoboxingDemo {
    public static void main(String[] args) {
        // ============ 自动装箱 ============
        Integer i1 = 100; // Integer.valueOf(100)
        Integer i2 = 100; // Integer.valueOf(100)

        Integer i3 = 200; // Integer.valueOf(200)
        Integer i4 = 200; // Integer.valueOf(200)

        // ============ 缓存比较 ============
        System.out.println("i1 == i2: " + (i1 == i2)); // true（缓存）
        System.out.println("i3 == i4: " + (i3 == i4)); // false（无缓存）

        System.out.println("i1.equals(i2): " + i1.equals(i2)); // true
        System.out.println("i3.equals(i4): " + i3.equals(i4)); // true

        // ============ 自动拆箱 ============
        int i5 = i1; // i1.intValue()
        int i6 = i3; // i3.intValue()

        System.out.println("i5: " + i5); // 100
        System.out.println("i6: " + i6); // 200

        // ============ 运算中的自动拆箱 ============
        Integer a = 100;
        Integer b = 200;
        Integer c = a + b; // 先拆箱，运算，再装箱

        System.out.println("c: " + c); // 300

        // ============ 比较陷阱 ============
        Integer x = 127;
        Integer y = 127;
        System.out.println("x == y: " + (x == y)); // true（缓存）

        Integer m = 128;
        Integer n = 128;
        System.out.println("m == n: " + (m == n)); // false（无缓存）

        // ============ NullPointerException ============
        Integer nullInt = null;
        // int result = nullInt + 1; // NullPointerException

        // 安全的拆箱
        if (nullInt != null) {
            int result = nullInt + 1;
        }

        // ============ 其他包装类的缓存 ============
        // Byte: -128~127
        Byte b1 = 100;
        Byte b2 = 100;
        System.out.println("Byte cache: " + (b1 == b2)); // true

        // Short: -128~127
        Short s1 = 100;
        Short s2 = 100;
        System.out.println("Short cache: " + (s1 == s2)); // true

        // Long: -128~127
        Long l1 = 100L;
        Long l2 = 100L;
        System.out.println("Long cache: " + (l1 == l2)); // true

        // Character: 0~127
        Character c1 = 'A';
        Character c2 = 'A';
        System.out.println("Character cache: " + (c1 == c2)); // true

        // Float、Double: 无缓存
        Float f1 = 100.0f;
        Float f2 = 100.0f;
        System.out.println("Float cache: " + (f1 == f2)); // false

        Double d1 = 100.0;
        Double d2 = 100.0;
        System.out.println("Double cache: " + (d1 == d2)); // false

        // ============ Boolean缓存 ============
        Boolean bool1 = true;
        Boolean bool2 = true;
        System.out.println("Boolean cache: " + (bool1 == bool2)); // true
    }
}
```

#### ⭐ 面试高频问题

**Q1: Integer i = 100; Integer j = 100; i == j 的结果是什么？为什么？**
- true，因为100在缓存范围内（-128~127）
- Integer.valueOf()会返回缓存对象

**Q2: Integer i = 200; Integer j = 200; i == j 的结果是什么？为什么？**
- false，因为200不在缓存范围内
- 每次调用valueOf()都创建新对象

**Q3: 为什么要有IntegerCache？**
- 提高性能，减少对象创建
- 常用数值范围在-128~127之间

**Q4: 如何修改IntegerCache的范围？**
- 通过JVM参数：-XX:AutoBoxCacheMax=<size>
- 只能增大，不能减小

#### 与React对比

```javascript
// JavaScript没有自动装箱/拆箱的概念
// 但有类似的类型转换

const num = 100; // 基本类型
const numObj = new Number(100); // 对象类型

console.log(typeof num); // "number"
console.log(typeof numObj); // "object"

console.log(num === numObj); // false
console.log(num == numObj); // true（类型转换）

// React中的类型转换
const Component = ({ count }) => {
    const countNum = Number(count); // 转换为数字
    const countStr = String(count); // 转换为字符串

    return <div>{countNum}</div>;
};
```

---

### 2.3 值传递 vs 引用传递

#### 概念讲解

**Java只有值传递**
- 基本类型：传递值的副本
- 对象类型：传递引用的副本（不是对象本身）

#### 代码示例

```java
public class PassByValueDemo {
    public static void main(String[] args) {
        // ============ 基本类型传递 ============
        int a = 10;
        System.out.println("Before: a = " + a); // 10
        modifyPrimitive(a);
        System.out.println("After: a = " + a); // 10（不变）

        // ============ 对象类型传递 ============
        StringBuilder sb = new StringBuilder("Hello");
        System.out.println("Before: sb = " + sb); // Hello
        modifyObject(sb);
        System.out.println("After: sb = " + sb); // Hello World（被修改）

        // ============ 重新赋值 ============
        StringBuilder sb2 = new StringBuilder("Hello");
        System.out.println("Before: sb2 = " + sb2); // Hello
        reassignObject(sb2);
        System.out.println("After: sb2 = " + sb2); // Hello（不变）

        // ============ 数组传递 ============
        int[] arr = {1, 2, 3};
        System.out.println("Before: " + Arrays.toString(arr)); // [1, 2, 3]
        modifyArray(arr);
        System.out.println("After: " + Arrays.toString(arr)); // [1, 2, 3, 4]（被修改）

        // ============ String传递（不可变） ============
        String str = "Hello";
        System.out.println("Before: str = " + str); // Hello
        modifyString(str);
        System.out.println("After: str = " + str); // Hello（不变）
    }

    // 基本类型：传递值的副本
    public static void modifyPrimitive(int x) {
        x = 20; // 只修改副本
        System.out.println("Inside method: x = " + x); // 20
    }

    // 对象类型：传递引用的副本，可以修改对象内容
    public static void modifyObject(StringBuilder sb) {
        sb.append(" World"); // 修改对象内容
        System.out.println("Inside method: sb = " + sb); // Hello World
    }

    // 重新赋值：不影响原引用
    public static void reassignObject(StringBuilder sb) {
        sb = new StringBuilder("New"); // 只修改副本引用
        System.out.println("Inside method: sb = " + sb); // New
    }

    // 数组：传递引用的副本，可以修改数组内容
    public static void modifyArray(int[] arr) {
        arr = Arrays.copyOf(arr, arr.length + 1); // 重新赋值
        arr[arr.length - 1] = 4;
        System.out.println("Inside method: " + Arrays.toString(arr)); // [1, 2, 3, 4]
    }

    // String：不可变对象，无法修改
    public static void modifyString(String str) {
        str = str + " World"; // 创建新对象
        System.out.println("Inside method: str = " + str); // Hello World
    }
}
```

#### ⭐ 面试高频问题

**Q1: Java是值传递还是引用传递？**
- Java只有值传递
- 基本类型传递值，对象类型传递引用的副本

**Q2: 为什么说Java是值传递？**
- 方法内修改参数不会影响原变量
- 对象类型传递的是引用的副本，不是对象本身

**Q3: 如何在方法中修改对象的值？**
- 对象类型：直接修改对象的内容
- 基本类型：返回新值

**Q4: String为什么不能被修改？**
- String是不可变对象
- 修改String会创建新对象

#### 与React对比

```javascript
// JavaScript也是值传递
// 对象类型传递引用的副本

function modifyPrimitive(x) {
    x = 20;
}

function modifyObject(obj) {
    obj.name = 'New Name';
}

let num = 10;
modifyPrimitive(num);
console.log(num); // 10（不变）

let obj = { name: 'John' };
modifyObject(obj);
console.log(obj.name); // 'New Name'（被修改）

// React中的props传递
function ChildComponent({ name }) {
    // props是只读的（类似值传递）
    // name = 'New Name'; // 错误

    return <div>{name}</div>;
}

// React中的state修改
function ParentComponent() {
    const [user, setUser] = useState({ name: 'John' });

    const updateUser = () => {
        // 创建新对象（不可变更新）
        setUser({ ...user, name: 'New Name' });
    };

    return <ChildComponent name={user.name} />;
}
```

---

### 2.4 == vs equals() vs hashCode()

#### 概念讲解

**==**
- 基本类型：比较值
- 对象类型：比较内存地址（是否是同一个对象）

**equals()**
- Object默认实现：比较内存地址（==）
- String等类：重写equals()，比较内容

**hashCode()**
- 返回对象的哈希码
- equals()相等的对象，hashCode()必须相等
- hashCode()相等的对象，equals()不一定相等

#### 代码示例

```java
import java.util.*;

public class EqualsHashCodeDemo {
    public static void main(String[] args) {
        // ============ == vs equals() ============
        String s1 = new String("Hello");
        String s2 = new String("Hello");
        String s3 = "Hello";
        String s4 = "Hello";

        System.out.println("s1 == s2: " + (s1 == s2)); // false（不同对象）
        System.out.println("s1.equals(s2): " + s1.equals(s2)); // true（内容相同）

        System.out.println("s3 == s4: " + (s3 == s4)); // true（字符串常量池）
        System.out.println("s3.equals(s4): " + s3.equals(s4)); // true

        // ============ hashCode() ============
        System.out.println("s1.hashCode(): " + s1.hashCode());
        System.out.println("s2.hashCode(): " + s2.hashCode());
        System.out.println("s3.hashCode(): " + s3.hashCode());

        // equals()相等的对象，hashCode()必须相等
        System.out.println("s1.equals(s2) && s1.hashCode() == s2.hashCode(): " +
            (s1.equals(s2) && s1.hashCode() == s2.hashCode())); // true

        // ============ 自定义类 ============
        Person p1 = new Person("John", 30);
        Person p2 = new Person("John", 30);
        Person p3 = new Person("Jane", 25);

        System.out.println("p1 == p2: " + (p1 == p2)); // false
        System.out.println("p1.equals(p2): " + p1.equals(p2)); // true（重写了equals）
        System.out.println("p1.hashCode() == p2.hashCode(): " +
            (p1.hashCode() == p2.hashCode())); // true（重写了hashCode）

        System.out.println("p1.equals(p3): " + p1.equals(p3)); // false

        // ============ HashSet和HashMap ============
        Set<Person> personSet = new HashSet<>();
        personSet.add(p1);
        personSet.add(p2); // 不会重复添加（equals和hashCode相同）
        personSet.add(p3);

        System.out.println("Set size: " + personSet.size()); // 2

        Map<Person, String> personMap = new HashMap<>();
        personMap.put(p1, "Developer");
        personMap.put(p2, "Manager"); // 覆盖p1的值

        System.out.println("Map size: " + personMap.size()); // 1
        System.out.println("p1's role: " + personMap.get(p1)); // Manager

        // ============ 常见陷阱 ============
        // 1. 重写equals()但不重写hashCode()
        class BadPerson {
            private String name;

            public BadPerson(String name) {
                this.name = name;
            }

            @Override
            public boolean equals(Object obj) {
                if (this == obj) return true;
                if (obj == null || getClass() != obj.getClass()) return false;
                BadPerson that = (BadPerson) obj;
                return Objects.equals(name, that.name);
            }

            // 没有重写hashCode()
        }

        BadPerson bp1 = new BadPerson("John");
        BadPerson bp2 = new BadPerson("John");

        Set<BadPerson> badSet = new HashSet<>();
        badSet.add(bp1);
        badSet.add(bp2); // 会重复添加（hashCode不同）

        System.out.println("Bad set size: " + badSet.size()); // 2（错误）

        // 2. null值处理
        String nullStr = null;
        // System.out.println(nullStr.equals("Hello")); // NullPointerException
        System.out.println("Hello".equals(nullStr)); // false（安全）
    }
}

class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 重写equals()
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Person person = (Person) obj;
        return age == person.age && Objects.equals(name, person.name);
    }

    // 重写hashCode()
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + "}";
    }
}
```

#### ⭐ 面试高频问题

**Q1: == 和 equals() 的区别是什么？**
- ==：比较内存地址
- equals()：比较内容（需要重写）

**Q2: 为什么重写equals()必须重写hashCode()？**
- 保证equals()相等的对象hashCode()相同
- 避免HashSet、HashMap出现问题

**Q3: 两个对象hashCode()相同，equals()一定相同吗？**
- 不一定，哈希冲突
- 但equals()相同，hashCode()必须相同

**Q4: String的equals()是如何实现的？**
- 先比较内存地址（==）
- 再比较类型和长度
- 最后逐个字符比较

#### 与React对比

```javascript
// JavaScript中的相等比较
const obj1 = { name: 'John' };
const obj2 = { name: 'John' };

console.log(obj1 === obj2); // false（不同引用）
console.log(obj1 == obj2); // false（不同引用）

// React中的比较
// React使用浅比较（shallow comparison）
const prevProps = { name: 'John', age: 30 };
const nextProps = { name: 'John', age: 30 };

// 浅比较：props.name === nextProps.name && props.age === nextProps.age
// 深比较：递归比较每个属性

// React.memo使用浅比较
const MyComponent = React.memo(function MyComponent(props) {
    return <div>{props.name}</div>;
});

// 自定义比较函数
const MyComponent2 = React.memo(
    function MyComponent2(props) {
        return <div>{props.name}</div>;
    },
    (prevProps, nextProps) => {
        // 返回true表示props相同，不重新渲染
        return prevProps.name === nextProps.name;
    }
);
```

---

### 2.5 String、StringBuilder、StringBuffer 区别与性能

#### 概念讲解

**String**
- 不可变对象
- 线程安全
- 每次修改创建新对象

**StringBuilder**
- 可变对象
- 非线程安全
- 性能最好

**StringBuffer**
- 可变对象
- 线程安全（synchronized）
- 性能比StringBuilder差

#### 代码示例

```java
public class StringBuilderDemo {
    public static void main(String[] args) {
        // ============ String不可变性 ============
        String str1 = "Hello";
        String str2 = str1 + " World"; // 创建新对象
        System.out.println("str1: " + str1); // Hello
        System.out.println("str2: " + str2); // Hello World

        // ============ StringBuilder ============
        StringBuilder sb = new StringBuilder("Hello");
        sb.append(" World"); // 修改原对象
        System.out.println("sb: " + sb); // Hello World

        // ============ StringBuffer ============
        StringBuffer sbuf = new StringBuffer("Hello");
        sbuf.append(" World");
        System.out.println("sbuf: " + sbuf); // Hello World

        // ============ 性能对比 ============
        int iterations = 10000;

        // String拼接
        long startTime = System.currentTimeMillis();
        String strResult = "";
        for (int i = 0; i < iterations; i++) {
            strResult += i;
        }
        long stringTime = System.currentTimeMillis() - startTime;
        System.out.println("String time: " + stringTime + "ms");

        // StringBuilder拼接
        startTime = System.currentTimeMillis();
        StringBuilder sbResult = new StringBuilder();
        for (int i = 0; i < iterations; i++) {
            sbResult.append(i);
        }
        long sbTime = System.currentTimeMillis() - startTime;
        System.out.println("StringBuilder time: " + sbTime + "ms");

        // StringBuffer拼接
        startTime = System.currentTimeMillis();
        StringBuffer sbufResult = new StringBuffer();
        for (int i = 0; i < iterations; i++) {
            sbufResult.append(i);
        }
        long sbufTime = System.currentTimeMillis() - startTime;
        System.out.println("StringBuffer time: " + sbufTime + "ms");

        // ============ StringBuilder常用方法 ============
        StringBuilder builder = new StringBuilder();

        // append：追加
        builder.append("Hello");
        builder.append(" ");
        builder.append("World");

        // insert：插入
        builder.insert(5, " Beautiful");
        System.out.println("After insert: " + builder);

        // delete：删除
        builder.delete(5, 15);
        System.out.println("After delete: " + builder);

        // replace：替换
        builder.replace(0, 5, "Hi");
        System.out.println("After replace: " + builder);

        // reverse：反转
        builder.reverse();
        System.out.println("After reverse: " + builder);

        // capacity：容量
        System.out.println("Capacity: " + builder.capacity());
        System.out.println("Length: " + builder.length());

        // ============ 线程安全测试 ============
        StringBuilder unsafeBuilder = new StringBuilder();
        StringBuffer safeBuilder = new StringBuffer();

        // 多线程环境
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                unsafeBuilder.append("a");
                safeBuilder.append("a");
            }
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("StringBuilder length: " + unsafeBuilder.length()); // 可能<2000
        System.out.println("StringBuffer length: " + safeBuilder.length()); // 2000
    }
}
```

#### ⭐ 面试高频问题

**Q1: String、StringBuilder、StringBuffer的区别是什么？**
- String：不可变，线程安全
- StringBuilder：可变，非线程安全，性能最好
- StringBuffer：可变，线程安全，性能较差

**Q2: 为什么String是不可变的？**
- 安全性：避免被恶意修改
- 线程安全：多线程环境下安全
- 缓存哈希值：提高HashMap性能
- 字符串常量池：节省内存

**Q3: 什么时候使用String、StringBuilder、StringBuffer？**
- String：少量修改、多线程环境
- StringBuilder：大量修改、单线程环境
- StringBuffer：大量修改、多线程环境

**Q4: String的"+"操作是如何优化的？**
- 编译器自动优化为StringBuilder（Java 8及之前）
- Java 9+ 使用 invokedynamic + StringConcatFactory 进行优化，不再直接生成 StringBuilder 代码，性能更好且延迟生成拼接策略
- 在循环中仍建议手动使用 StringBuilder

#### 与React对比

```javascript
// JavaScript字符串
let str = "Hello";
str = str + " World"; // 创建新字符串

// 模板字符串（类似StringBuilder）
const name = "John";
const greeting = `Hello, ${name}!`; // 模板字符串

// 数组join（类似StringBuilder）
const parts = ["Hello", "World"];
const result = parts.join(" "); // "Hello World"

// React中的字符串拼接
function Greeting({ name }) {
    return <div>Hello, {name}!</div>;
}

// React中的条件渲染
function Message({ isLoggedIn }) {
    return (
        <div>
            {isLoggedIn ? <p>Welcome back!</p> : <p>Please log in.</p>}
        </div>
    );
}
```

---

## 四、反射 (Reflection)

### 4.1 Class 对象获取方式（3种）

#### 概念讲解

**反射（Reflection）**
- 在运行时检查和修改类、方法、字段的信息
- Java反射API的核心是Class对象
- 每个类在JVM中都有唯一的Class对象

**获取Class对象的三种方式**
1. `Class.forName("全限定类名")` - 最常用，动态加载
2. `类名.class` - 编译时确定
3. `对象.getClass()` - 运行时获取

#### 代码示例

```java
import java.lang.reflect.*;

public class ReflectionDemo {
    public static void main(String[] args) throws Exception {
        // ============ 获取Class对象的三种方式 ============

        // 方式1：Class.forName() - 动态加载，最常用
        Class<?> clazz1 = Class.forName("java.lang.String");
        System.out.println("Class.forName: " + clazz1.getName());

        // 方式2：类名.class - 编译时确定
        Class<String> clazz2 = String.class;
        System.out.println("String.class: " + clazz2.getName());

        // 方式3：对象.getClass() - 运行时获取
        String str = "Hello";
        Class<?> clazz3 = str.getClass();
        System.out.println("str.getClass(): " + clazz3.getName());

        // 三种方式获取的是同一个Class对象
        System.out.println("clazz1 == clazz2: " + (clazz1 == clazz2)); // true
        System.out.println("clazz2 == clazz3: " + (clazz2 == clazz3)); // true

        // ============ Class对象的基本信息 ============
        Class<?> stringClass = String.class;

        // 类名
        System.out.println("Name: " + stringClass.getName());           // java.lang.String
        System.out.println("Simple name: " + stringClass.getSimpleName()); // String

        // 修饰符
        System.out.println("Modifiers: " + Modifier.toString(stringClass.getModifiers())); // public final

        // 包名
        System.out.println("Package: " + stringClass.getPackage().getName()); // java.lang

        // 父类
        System.out.println("Superclass: " + stringClass.getSuperclass().getName()); // java.lang.Object

        // 实现的接口
        Type[] interfaces = stringClass.getGenericInterfaces();
        for (Type type : interfaces) {
            System.out.println("Interface: " + type.getTypeName());
        }

        // ============ 基本类型的Class对象 ============
        Class<int> intClass = int.class;
        Class<Integer> integerClass = Integer.class;
        System.out.println("int.class == Integer.class: " + (intClass == integerClass)); // false
        System.out.println("int.class == Integer.TYPE: " + (intClass == Integer.TYPE)); // true

        // 数组的Class对象
        Class<?> intArrayClass = int[].class;
        Class<?> stringArrayClass = String[].class;
        System.out.println("int[].class: " + intArrayClass.getName());     // [I
        System.out.println("String[].class: " + stringArrayClass.getName()); // [Ljava.lang.String;

        // ============ 类加载器 ============
        ClassLoader classLoader = String.class.getClassLoader();
        System.out.println("String ClassLoader: " + classLoader); // null（Bootstrap ClassLoader）

        ClassLoader myClassLoader = ReflectionDemo.class.getClassLoader();
        System.out.println("My ClassLoader: " + myClassLoader);
    }
}
```

#### ⭐ 面试高频问题

**Q1: 获取Class对象的三种方式有什么区别？**
- `Class.forName()`：动态加载，需要处理ClassNotFoundException
- `类名.class`：编译时确定，最安全
- `对象.getClass()`：运行时获取

**Q2: 三种方式获取的Class对象是同一个吗？**
- 是的，JVM中每个类只有一个Class对象

**Q3: Class.forName()和类名.class的区别是什么？**
- `Class.forName()`会执行类的静态初始化块
- `类名.class`不会执行静态初始化块

**Q4: 基本类型有Class对象吗？**
- 有，int.class、double.class等
- int.class != Integer.class

#### 与React对比

```javascript
// JavaScript中的反射
class MyClass {
    constructor(name) {
        this.name = name;
    }

    greet() {
        return `Hello, ${this.name}`;
    }
}

const obj = new MyClass("John");

// 获取构造函数
console.log(obj.constructor); // MyClass

// 获取原型
console.log(Object.getPrototypeOf(obj)); // MyClass.prototype

// 检查属性
console.log(obj.hasOwnProperty('name')); // true
console.log('name' in obj); // true

// 获取属性描述符
const descriptor = Object.getOwnPropertyDescriptor(obj, 'name');
console.log(descriptor); // { value: 'John', writable: true, enumerable: true, configurable: true }

// React中的动态组件
const components = {
    Button: ButtonComponent,
    Input: InputComponent,
    Select: SelectComponent
};

function DynamicComponent({ type, ...props }) {
    const Component = components[type];
    return Component ? <Component {...props} /> : null;
}
```

---

### 4.2 获取构造器、方法、字段

#### 概念讲解

**反射API核心方法**
- `getDeclaredConstructors()`：获取所有构造器
- `getDeclaredMethods()`：获取所有方法
- `getDeclaredFields()`：获取所有字段
- `getMethods()`：获取所有public方法（包括继承的）
- `getFields()`：获取所有public字段（包括继承的）

#### 代码示例

```java
import java.lang.reflect.*;
import java.util.*;

public class ReflectionAccessDemo {

    // 测试用类
    static class Person {
        private String name;
        private int age;
        public String address;
        protected String email;

        public Person() {
            this.name = "Unknown";
            this.age = 0;
        }

        private Person(String name) {
            this.name = name;
        }

        public Person(String name, int age) {
            this.name = name;
            this.age = age;
        }

        public String getName() {
            return name;
        }

        private void setName(String name) {
            this.name = name;
        }

        public int getAge() {
            return age;
        }

        public void setAge(int age) {
            this.age = age;
        }

        private void privateMethod() {
            System.out.println("Private method called: name=" + name);
        }

        public void display() {
            System.out.println("Person: name=" + name + ", age=" + age);
        }

        public static void staticMethod() {
            System.out.println("Static method called");
        }
    }

    public static void main(String[] args) throws Exception {
        Class<?> clazz = Person.class;

        // ============ 获取构造器 ============
        System.out.println("===== 构造器 =====");

        // 获取所有声明的构造器（包括private）
        Constructor<?>[] constructors = clazz.getDeclaredConstructors();
        for (Constructor<?> constructor : constructors) {
            System.out.println("Constructor: " + constructor);
        }

        // 获取指定参数的构造器
        Constructor<?> noArgConstructor = clazz.getDeclaredConstructor();
        Constructor<?> stringConstructor = clazz.getDeclaredConstructor(String.class);
        Constructor<?> fullConstructor = clazz.getDeclaredConstructor(String.class, int.class);

        // 使用构造器创建对象
        Person p1 = (Person) noArgConstructor.newInstance();
        Person p2 = (Person) stringConstructor.newInstance("John");
        Person p3 = (Person) fullConstructor.newInstance("Jane", 25);

        // 访问private构造器
        stringConstructor.setAccessible(true); // 突破访问限制
        Person p4 = (Person) stringConstructor.newInstance("Bob");

        // ============ 获取方法 ============
        System.out.println("\n===== 方法 =====");

        // 获取所有声明的方法（包括private）
        Method[] methods = clazz.getDeclaredMethods();
        for (Method method : methods) {
            System.out.println("Method: " + Modifier.toString(method.getModifiers())
                + " " + method.getReturnType().getSimpleName()
                + " " + method.getName()
                + "(" + getParameterTypes(method) + ")");
        }

        // 获取所有public方法（包括继承的）
        Method[] publicMethods = clazz.getMethods();
        System.out.println("Public methods count: " + publicMethods.length);

        // 调用public方法
        Method getNameMethod = clazz.getMethod("getName");
        String name = (String) getNameMethod.invoke(p3);
        System.out.println("Name: " + name); // Jane

        // 调用private方法
        Method setNameMethod = clazz.getDeclaredMethod("setName", String.class);
        setNameMethod.setAccessible(true); // 突破访问限制
        setNameMethod.invoke(p3, "Alice");
        System.out.println("After setName: " + p3.getName()); // Alice

        // 调用private方法
        Method privateMethod = clazz.getDeclaredMethod("privateMethod");
        privateMethod.setAccessible(true);
        privateMethod.invoke(p3); // Private method called: name=Alice

        // 调用static方法
        Method staticMethod = clazz.getDeclaredMethod("staticMethod");
        staticMethod.invoke(null); // 静态方法不需要对象实例

        // ============ 获取字段 ============
        System.out.println("\n===== 字段 =====");

        // 获取所有声明的字段（包括private）
        Field[] fields = clazz.getDeclaredFields();
        for (Field field : fields) {
            System.out.println("Field: " + Modifier.toString(field.getModifiers())
                + " " + field.getType().getSimpleName()
                + " " + field.getName());
        }

        // 获取public字段
        Field[] publicFields = clazz.getFields();
        System.out.println("Public fields count: " + publicFields.length);

        // 读取和修改字段
        Field nameField = clazz.getDeclaredField("name");
        nameField.setAccessible(true);

        // 读取字段值
        String fieldValue = (String) nameField.get(p3);
        System.out.println("Field value: " + fieldValue); // Alice

        // 修改字段值
        nameField.set(p3, "New Name");
        System.out.println("After set: " + p3.getName()); // New Name

        // 修改private static字段
        // Field staticField = clazz.getDeclaredField("staticField");
        // staticField.setAccessible(true);
        // staticField.set(null, "new value"); // 静态字段，对象参数为null

        // ============ 反射操作数组 ============
        System.out.println("\n===== 数组反射 =====");
        int[] intArray = {1, 2, 3, 4, 5};
        Class<?> arrayClass = intArray.getClass();
        System.out.println("Array type: " + arrayClass.getComponentType()); // int
        System.out.println("Array length: " + Array.getLength(intArray)); // 5

        Array.set(intArray, 0, 10);
        System.out.println("Modified array[0]: " + Array.get(intArray, 0)); // 10

        // ============ 反射获取注解 ============
        System.out.println("\n===== 注解反射 =====");
        // 获取类上的注解
        Annotation[] annotations = clazz.getAnnotations();
        for (Annotation annotation : annotations) {
            System.out.println("Annotation: " + annotation);
        }

        // 获取方法上的注解
        Method displayMethod = clazz.getMethod("display");
        Annotation[] methodAnnotations = displayMethod.getAnnotations();
        for (Annotation annotation : methodAnnotations) {
            System.out.println("Method annotation: " + annotation);
        }
    }

    private static String getParameterTypes(Method method) {
        Class<?>[] params = method.getParameterTypes();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < params.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(params[i].getSimpleName());
        }
        return sb.toString();
    }
}
```

#### ⭐ 面试高频问题

**Q1: getDeclaredMethods()和getMethods()的区别是什么？**
- `getDeclaredMethods()`：获取本类声明的所有方法（包括private）
- `getMethods()`：获取所有public方法（包括继承的）

**Q2: setAccessible(true)的作用是什么？**
- 突破访问限制，访问private成员
- 可能被SecurityManager阻止

**Q3: 反射调用方法的性能如何？**
- 比直接调用慢10-100倍
- 可以缓存Method对象提高性能
- JDK 7+有性能优化

**Q4: 反射能访问final字段吗？**
- 可以读取
- 修改需要setAccessible(true)，但可能有安全限制

#### 与React对比

```javascript
// JavaScript中的对象操作（类似反射）
class Person {
    #name = 'John'; // 私有字段
    age = 30;

    constructor(name) {
        this.#name = name;
    }

    greet() {
        return `Hello, ${this.#name}`;
    }
}

const person = new Person('Jane');

// 获取属性
console.log(Object.keys(person)); // ['age']
console.log(person.age); // 30

// 动态调用方法
const methodName = 'greet';
person[methodName](); // 'Hello, Jane'

// React中的动态渲染
function DynamicForm({ fields }) {
    return (
        <form>
            {fields.map(field => {
                const Component = fieldComponents[field.type];
                return <Component key={field.name} {...field} />;
            })}
        </form>
    );
}

const fieldComponents = {
    text: TextInput,
    select: SelectInput,
    checkbox: CheckboxInput
};
```

---

### 4.3 动态代理（JDK动态代理 vs CGLIB代理）

#### 概念讲解

**动态代理（Dynamic Proxy）**
- 在运行时创建代理对象
- 不需要手动编写代理类
- 常用于AOP、日志、事务管理

**JDK动态代理**
- 基于接口
- 使用Proxy和InvocationHandler
- 目标类必须实现接口

**CGLIB代理**
- 基于继承
- 使用字节码生成技术
- 不能代理final类和方法

#### 代码示例

```java
import java.lang.reflect.*;

// ============ 接口和实现类 ============
interface UserService {
    void addUser(String name);
    void deleteUser(String name);
    String getUser(String name);
}

class UserServiceImpl implements UserService {
    @Override
    public void addUser(String name) {
        System.out.println("Adding user: " + name);
    }

    @Override
    public void deleteUser(String name) {
        System.out.println("Deleting user: " + name);
    }

    @Override
    public String getUser(String name) {
        System.out.println("Getting user: " + name);
        return "User: " + name;
    }
}

// ============ JDK动态代理 ============
class JdkProxyHandler implements InvocationHandler {
    private final Object target;

    public JdkProxyHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        // 前置增强
        System.out.println("[JDK Proxy] Before: " + method.getName());

        long startTime = System.currentTimeMillis();

        // 调用目标方法
        Object result = method.invoke(target, args);

        long endTime = System.currentTimeMillis();

        // 后置增强
        System.out.println("[JDK Proxy] After: " + method.getName()
            + ", Time: " + (endTime - startTime) + "ms");

        return result;
    }

    // 创建代理对象
    public static <T> T createProxy(T target) {
        return (T) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            new JdkProxyHandler(target)
        );
    }
}

// ============ CGLIB代理（模拟） ============
// 注意：CGLIB需要额外依赖
// implementation 'cglib:cglib:3.3.0'

/*
import net.sf.cglib.proxy.*;

class CglibProxyHandler implements MethodInterceptor {
    private final Object target;

    public CglibProxyHandler(Object target) {
        this.target = target;
    }

    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
        System.out.println("[CGLIB Proxy] Before: " + method.getName());

        long startTime = System.currentTimeMillis();

        Object result = proxy.invokeSuper(obj, args);

        long endTime = System.currentTimeMillis();

        System.out.println("[CGLIB Proxy] After: " + method.getName()
            + ", Time: " + (endTime - startTime) + "ms");

        return result;
    }

    public static <T> T createProxy(Class<T> clazz) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(clazz);
        enhancer.setCallback(new CglibProxyHandler(null));
        return (T) enhancer.create();
    }
}
*/

// ============ 动态代理测试 ============
public class DynamicProxyDemo {
    public static void main(String[] args) {
        // ============ JDK动态代理 ============
        System.out.println("===== JDK Dynamic Proxy =====");

        UserService userService = new UserServiceImpl();
        UserService proxy = JdkProxyHandler.createProxy(userService);

        // 代理对象调用方法
        proxy.addUser("John");
        /*
        [JDK Proxy] Before: addUser
        Adding user: John
        [JDK Proxy] After: addUser, Time: 0ms
        */

        proxy.deleteUser("Jane");
        String user = proxy.getUser("Bob");
        System.out.println("Result: " + user);

        // 检查代理类型
        System.out.println("Proxy class: " + proxy.getClass().getName());
        // com.sun.proxy.$Proxy0

        // ============ 代理对象的方法 ============
        System.out.println("\n===== Proxy Methods =====");

        // 检查是否是代理对象
        System.out.println("Is proxy: " + Proxy.isProxyClass(proxy.getClass())); // true

        // 获取InvocationHandler
        InvocationHandler handler = Proxy.getInvocationHandler(proxy);
        System.out.println("Handler: " + handler.getClass().getName());

        // ============ 实际应用场景 ============
        System.out.println("\n===== Practical Usage =====");

        // 1. 日志代理
        UserService logProxy = createLogProxy(new UserServiceImpl());
        logProxy.addUser("Alice");

        // 2. 事务代理
        UserService txProxy = createTransactionProxy(new UserServiceImpl());
        txProxy.addUser("Bob");

        // 3. 缓存代理
        UserService cacheProxy = createCacheProxy(new UserServiceImpl());
        cacheProxy.getUser("Charlie");
        cacheProxy.getUser("Charlie"); // 第二次从缓存获取
    }

    // 日志代理
    static UserService createLogProxy(UserService target) {
        return (UserService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                System.out.println("[LOG] " + method.getName() + " called with args: "
                    + Arrays.toString(args));
                Object result = method.invoke(target, args);
                System.out.println("[LOG] " + method.getName() + " returned: " + result);
                return result;
            }
        );
    }

    // 事务代理
    static UserService createTransactionProxy(UserService target) {
        return (UserService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                System.out.println("[TX] Transaction started");
                try {
                    Object result = method.invoke(target, args);
                    System.out.println("[TX] Transaction committed");
                    return result;
                } catch (Exception e) {
                    System.out.println("[TX] Transaction rolled back");
                    throw e;
                }
            }
        );
    }

    // 缓存代理
    static UserService createCacheProxy(UserService target) {
        Map<String, String> cache = new HashMap<>();

        return (UserService) Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(),
            (proxy, method, args) -> {
                if (method.getName().equals("getUser") && args != null && args.length > 0) {
                    String cacheKey = (String) args[0];
                    if (cache.containsKey(cacheKey)) {
                        System.out.println("[CACHE] Hit: " + cacheKey);
                        return cache.get(cacheKey);
                    }
                    Object result = method.invoke(target, args);
                    cache.put(cacheKey, (String) result);
                    System.out.println("[CACHE] Miss: " + cacheKey);
                    return result;
                }
                return method.invoke(target, args);
            }
        );
    }
}
```

#### ⭐ 面试高频问题

**Q1: JDK动态代理和CGLIB代理的区别是什么？**
- JDK：基于接口，目标类必须实现接口
- CGLIB：基于继承，不能代理final类和方法

**Q2: Spring默认使用哪种代理？**
- 有接口：JDK动态代理
- 无接口：CGLIB代理
- Spring Boot 2.x默认使用CGLIB

**Q3: 动态代理的应用场景有哪些？**
- AOP（面向切面编程）
- 日志记录
- 事务管理
- 权限检查
- 缓存
- 远程调用（RPC）

**Q4: 为什么CGLIB不能代理final类？**
- CGLIB通过生成子类实现代理
- final类不能被继承

#### 与React对比

```javascript
// JavaScript中的代理（Proxy对象）
const target = {
    name: 'John',
    greet() {
        return `Hello, ${this.name}`;
    }
};

const handler = {
    get(target, property) {
        console.log(`[Proxy] Getting ${property}`);
        return target[property];
    },
    set(target, property, value) {
        console.log(`[Proxy] Setting ${property} to ${value}`);
        target[property] = value;
        return true;
    },
    apply(target, thisArg, args) {
        console.log(`[Proxy] Calling with args: ${args}`);
        return target.apply(thisArg, args);
    }
};

const proxy = new Proxy(target, handler);
proxy.name; // [Proxy] Getting name
proxy.name = 'Jane'; // [Proxy] Setting name to Jane

// React中的HOC（类似代理模式）
function withLogging(WrappedComponent) {
    return function LoggingComponent(props) {
        console.log('[HOC] Rendering', WrappedComponent.name);
        return <WrappedComponent {...props} />;
    };
}

const EnhancedComponent = withLogging(MyComponent);

// React中的自定义Hook（类似AOP）
function useWithLogging(fn) {
    return useCallback((...args) => {
        console.log('[Hook] Before', fn.name);
        const result = fn(...args);
        console.log('[Hook] After', fn.name);
        return result;
    }, [fn]);
}
```

---

### 4.4 反射的性能问题与安全限制

#### 概念讲解

**性能问题**
- 反射调用比直接调用慢10-100倍
- 主要开销：参数装箱/拆箱、方法查找、安全检查
- 可以通过缓存Method对象优化

**安全限制**
- SecurityManager可以限制反射
- setAccessible(true)可能被拒绝
- 模块系统（Java 9+）限制反射访问

#### 代码示例

```java
import java.lang.reflect.*;

public class ReflectionPerformanceDemo {
    public static void main(String[] args) throws Exception {
        // ============ 性能对比 ============
        Person person = new Person("John", 30);
        Method getNameMethod = Person.class.getMethod("getName");

        int iterations = 10000000;

        // 直接调用
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            person.getName();
        }
        long directTime = System.currentTimeMillis() - startTime;
        System.out.println("Direct call: " + directTime + "ms");

        // 反射调用（不缓存）
        startTime = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            Method method = Person.class.getMethod("getName");
            method.invoke(person);
        }
        long reflectNoCacheTime = System.currentTimeMillis() - startTime;
        System.out.println("Reflection (no cache): " + reflectNoCacheTime + "ms");

        // 反射调用（缓存Method）
        startTime = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            getNameMethod.invoke(person);
        }
        long reflectCacheTime = System.currentTimeMillis() - startTime;
        System.out.println("Reflection (cached): " + reflectCacheTime + "ms");

        // 反射调用（缓存 + setAccessible）
        getNameMethod.setAccessible(true);
        startTime = System.currentTimeMillis();
        for (int i = 0; i < iterations; i++) {
            getNameMethod.invoke(person);
        }
        long reflectAccessibleTime = System.currentTimeMillis() - startTime;
        System.out.println("Reflection (cached + accessible): " + reflectAccessibleTime + "ms");

        System.out.println("\nPerformance ratio:");
        System.out.println("Direct : Reflection (no cache) = 1 : " + (reflectNoCacheTime / directTime));
        System.out.println("Direct : Reflection (cached) = 1 : " + (reflectCacheTime / directTime));

        // ============ 安全限制 ============
        try {
            // 尝试访问系统类的私有字段
            Field valueField = String.class.getDeclaredField("value");
            valueField.setAccessible(true);
            System.out.println("\nAccessing String.value: Success");
        } catch (Exception e) {
            System.out.println("\nAccess denied: " + e.getMessage());
        }

        // ============ 反射的最佳实践 ============
        // 1. 缓存反射对象
        ReflectionCache cache = new ReflectionCache();
        String name = cache.invoke(person, "getName");
        System.out.println("\nCached invoke: " + name);

        // 2. 使用MethodHandle（Java 7+）
        MethodHandles.Lookup lookup = MethodHandles.lookup();
        MethodHandle handle = lookup.findVirtual(Person.class, "getName",
            MethodType.methodType(String.class));
        String handleResult = (String) handle.invoke(person);
        System.out.println("MethodHandle invoke: " + handleResult);
    }
}

class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }
}

// 反射缓存工具类
class ReflectionCache {
    private final Map<String, Method> methodCache = new ConcurrentHashMap<>();

    @SuppressWarnings("unchecked")
    public <T> T invoke(Object target, String methodName, Object... args) {
        try {
            String cacheKey = target.getClass().getName() + "." + methodName;
            Method method = methodCache.computeIfAbsent(cacheKey, key -> {
                try {
                    Class<?>[] paramTypes = new Class<?>[args.length];
                    for (int i = 0; i < args.length; i++) {
                        paramTypes[i] = args[i] != null ? args[i].getClass() : Object.class;
                    }
                    Method m = target.getClass().getMethod(methodName, paramTypes);
                    m.setAccessible(true);
                    return m;
                } catch (NoSuchMethodException e) {
                    throw new RuntimeException(e);
                }
            });

            return (T) method.invoke(target, args);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 反射的性能如何优化？**
- 缓存Method、Field、Constructor对象
- 使用setAccessible(true)跳过安全检查
- 使用MethodHandle（Java 7+）
- 减少反射调用次数

**Q2: 反射的安全问题有哪些？**
- 可以突破访问限制
- 可以修改final字段
- 可能导致安全漏洞

**Q3: Java 9+模块系统对反射有什么影响？**
- 默认不导出包的内部类
- 需要通过--add-opens参数开放
- 反射访问受限

**Q4: MethodHandle和反射的区别？**
- MethodHandle性能更好
- MethodHandle更灵活
- MethodHandle支持类型转换

#### 与React对比

```javascript
// JavaScript中的Proxy性能
const target = { name: 'John' };
const proxy = new Proxy(target, {
    get(target, prop) {
        return target[prop];
    }
});

// 性能对比
const iterations = 1000000;

// 直接访问
let start = performance.now();
for (let i = 0; i < iterations; i++) {
    target.name;
}
console.log('Direct:', performance.now() - start);

// Proxy访问
start = performance.now();
for (let i = 0; i < iterations; i++) {
    proxy.name;
}
console.log('Proxy:', performance.now() - start);

// React中的性能优化
// 使用React.memo避免不必要的重新渲染
const MemoizedComponent = React.memo(function MyComponent(props) {
    return <div>{props.name}</div>;
});

// 使用useMemo缓存计算结果
function ExpensiveComponent({ items }) {
    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
    }, [items]);

    return <List items={sortedItems} />;
}
```

---

### 4.5 反射在实际框架中的应用场景

#### 概念讲解

**反射在框架中的应用**
- Spring：依赖注入、AOP、MVC
- MyBatis：ORM映射
- Jackson：JSON序列化/反序列化
- JUnit：测试框架

#### 代码示例

```java
import java.lang.reflect.*;
import java.util.*;

// ============ 简易IoC容器（模拟Spring DI） ============
class SimpleIoCContainer {
    private final Map<String, Object> beans = new HashMap<>();
    private final Map<String, Class<?>> beanDefinitions = new HashMap<>();

    // 注册Bean定义
    public void registerBean(String name, Class<?> clazz) {
        beanDefinitions.put(name, clazz);
    }

    // 获取Bean（懒加载）
    @SuppressWarnings("unchecked")
    public <T> T getBean(String name) {
        if (beans.containsKey(name)) {
            return (T) beans.get(name);
        }

        Class<?> clazz = beanDefinitions.get(name);
        if (clazz == null) {
            throw new RuntimeException("Bean not found: " + name);
        }

        try {
            // 使用反射创建实例
            Object instance = createInstance(clazz);
            beans.put(name, instance);
            return (T) instance;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create bean: " + name, e);
        }
    }

    // 使用反射创建实例并注入依赖
    private Object createInstance(Class<?> clazz) throws Exception {
        Constructor<?> constructor = clazz.getDeclaredConstructor();
        constructor.setAccessible(true);
        Object instance = constructor.newInstance();

        // 自动注入依赖
        for (Field field : clazz.getDeclaredFields()) {
            if (field.isAnnotationPresent(Inject.class)) {
                Class<?> fieldType = field.getType();
                Object dependency = getBean(fieldType.getSimpleName());
                field.setAccessible(true);
                field.set(instance, dependency);
            }
        }

        return instance;
    }
}

// ============ 简易ORM（模拟MyBatis） ============
class SimpleORM {
    // 将对象转为Map（序列化）
    public static Map<String, Object> toMap(Object obj) throws Exception {
        Map<String, Object> map = new HashMap<>();
        Class<?> clazz = obj.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            if (Modifier.isStatic(field.getModifiers())) continue;

            field.setAccessible(true);
            String columnName = camelToSnake(field.getName());
            map.put(columnName, field.get(obj));
        }

        return map;
    }

    // 将Map转为对象（反序列化）
    public static <T> T fromMap(Map<String, Object> map, Class<T> clazz) throws Exception {
        T instance = clazz.getDeclaredConstructor().newInstance();

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            String fieldName = snakeToCamel(entry.getKey());
            try {
                Field field = clazz.getDeclaredField(fieldName);
                field.setAccessible(true);
                field.set(instance, entry.getValue());
            } catch (NoSuchFieldException e) {
                // 忽略不存在的字段
            }
        }

        return instance;
    }

    // 生成INSERT SQL
    public static String generateInsert(Object obj) throws Exception {
        Map<String, Object> map = toMap(obj);
        String table = camelToSnake(obj.getClass().getSimpleName());

        StringBuilder columns = new StringBuilder();
        StringBuilder values = new StringBuilder();

        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (columns.length() > 0) {
                columns.append(", ");
                values.append(", ");
            }
            columns.append(entry.getKey());
            values.append("'").append(entry.getValue()).append("'");
        }

        return String.format("INSERT INTO %s (%s) VALUES (%s)",
            table, columns, values);
    }

    private static String camelToSnake(String str) {
        return str.replaceAll("([a-z])([A-Z])", "$1_$2").toLowerCase();
    }

    private static String snakeToCamel(String str) {
        StringBuilder sb = new StringBuilder();
        boolean upperCase = false;
        for (char c : str.toCharArray()) {
            if (c == '_') {
                upperCase = true;
            } else {
                sb.append(upperCase ? Character.toUpperCase(c) : c);
                upperCase = false;
            }
        }
        return sb.toString();
    }
}

// ============ 简易JSON序列化 ============
class SimpleJsonSerializer {
    public static String toJson(Object obj) throws Exception {
        if (obj == null) return "null";
        if (obj instanceof String) return "\"" + obj + "\"";
        if (obj instanceof Number || obj instanceof Boolean) return obj.toString();

        Class<?> clazz = obj.getClass();
        if (clazz.isArray() || Iterable.class.isAssignableFrom(clazz)) {
            return arrayToJson(obj);
        }

        return objectToJson(obj);
    }

    private static String objectToJson(Object obj) throws Exception {
        StringBuilder sb = new StringBuilder("{");
        Class<?> clazz = obj.getClass();
        Field[] fields = clazz.getDeclaredFields();

        boolean first = true;
        for (Field field : fields) {
            if (Modifier.isStatic(field.getModifiers())) continue;

            field.setAccessible(true);
            if (!first) sb.append(", ");
            first = false;

            sb.append("\"").append(field.getName()).append("\": ");
            sb.append(toJson(field.get(obj)));
        }

        sb.append("}");
        return sb.toString();
    }

    private static String arrayToJson(Object obj) throws Exception {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;

        if (obj.getClass().isArray()) {
            int length = Array.getLength(obj);
            for (int i = 0; i < length; i++) {
                if (!first) sb.append(", ");
                first = false;
                sb.append(toJson(Array.get(obj, i)));
            }
        } else {
            for (Object item : (Iterable<?>) obj) {
                if (!first) sb.append(", ");
                first = false;
                sb.append(toJson(item));
            }
        }

        sb.append("]");
        return sb.toString();
    }
}

// ============ 测试 ============
@interface Inject {}

class ServiceA {
    public void doSomething() {
        System.out.println("ServiceA doing something");
    }
}

class ServiceB {
    @Inject
    private ServiceA serviceA;

    public void execute() {
        System.out.println("ServiceB executing");
        serviceA.doSomething();
    }
}

class UserEntity {
    private String userName;
    private int userAge;
    private String userEmail;

    public UserEntity() {}

    public UserEntity(String userName, int userAge, String userEmail) {
        this.userName = userName;
        this.userAge = userAge;
        this.userEmail = userEmail;
    }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public int getUserAge() { return userAge; }
    public void setUserAge(int userAge) { this.userAge = userAge; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
}

public class ReflectionFrameworkDemo {
    public static void main(String[] args) throws Exception {
        // ============ IoC容器测试 ============
        System.out.println("===== IoC Container =====");
        SimpleIoCContainer container = new SimpleIoCContainer();
        container.registerBean("ServiceA", ServiceA.class);
        container.registerBean("ServiceB", ServiceB.class);

        ServiceB serviceB = container.getBean("ServiceB");
        serviceB.execute();

        // ============ ORM测试 ============
        System.out.println("\n===== Simple ORM =====");
        UserEntity user = new UserEntity("John", 30, "john@example.com");

        Map<String, Object> userMap = SimpleORM.toMap(user);
        System.out.println("To Map: " + userMap);

        String insertSql = SimpleORM.generateInsert(user);
        System.out.println("Insert SQL: " + insertSql);

        // ============ JSON序列化测试 ============
        System.out.println("\n===== JSON Serializer =====");
        String json = SimpleJsonSerializer.toJson(user);
        System.out.println("JSON: " + json);

        List<String> list = Arrays.asList("Hello", "World");
        String listJson = SimpleJsonSerializer.toJson(list);
        System.out.println("List JSON: " + listJson);
    }
}
```

#### ⭐ 面试高频问题

**Q1: Spring是如何使用反射的？**
- Bean的实例化：通过反射创建对象
- 依赖注入：通过反射注入依赖
- AOP：通过动态代理实现切面
- MVC：通过反射调用Controller方法

**Q2: MyBatis是如何使用反射的？**
- 结果映射：通过反射将ResultSet转为Java对象
- 参数处理：通过反射获取参数值
- SQL执行：通过反射调用Mapper方法

**Q3: Jackson是如何使用反射的？**
- 序列化：通过反射获取字段值
- 反序列化：通过反射设置字段值
- 注解处理：通过反射读取注解

**Q4: 反射的缺点是什么？**
- 性能开销
- 安全风险
- 代码可读性差
- 编译时无法检查

#### 与React对比

```javascript
// React中的"反射"概念
// 1. 动态组件加载（类似反射创建实例）
const components = {
    Button: lazy(() => import('./Button')),
    Input: lazy(() => import('./Input')),
    Select: lazy(() => import('./Select'))
};

function DynamicComponent({ type, ...props }) {
    const Component = components[type];
    return <Suspense fallback={<div>Loading...</div>}>
        <Component {...props} />
    </Suspense>;
}

// 2. React的依赖注入（Context API）
const ThemeContext = React.createContext('light');

function ThemedButton() {
    const theme = useContext(ThemeContext);
    return <button className={theme}>Button</button>;
}

function App() {
    return (
        <ThemeContext.Provider value="dark">
            <ThemedButton />
        </ThemeContext.Provider>
    );
}

// 3. React中的序列化（JSON）
const user = { name: 'John', age: 30 };
const json = JSON.stringify(user); // 序列化
const parsed = JSON.parse(json);   // 反序列化
```

---

## 五、注解 (Annotation)

### 5.1 元注解（@Retention, @Target, @Documented, @Inherited）

#### 概念讲解

**元注解（Meta-Annotation）**
- 用于修饰注解的注解
- 定义注解的行为和范围

**@Retention**
- SOURCE：只在源码中保留，编译后丢弃
- CLASS：保留到class文件中，运行时不可获取
- RUNTIME：保留到运行时，可以通过反射获取

**@Target**
- FIELD：字段
- METHOD：方法
- PARAMETER：参数
- TYPE：类、接口
- CONSTRUCTOR：构造方法
- LOCAL_VARIABLE：局部变量

**@Documented**
- 注解信息包含在JavaDoc中

**@Inherited**
- 注解可以被子类继承

#### 代码示例

```java
import java.lang.annotation.*;

// ============ 元注解示例 ============

// 运行时保留，作用于类和方法
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE, ElementType.METHOD})
@Documented
@Inherited
@interface MyAnnotation {
    String value() default "";
    int priority() default 0;
    String[] tags() default {};
}

// 编译时保留，作用于字段
@Retention(RetentionPolicy.CLASS)
@Target(ElementType.FIELD)
@interface Column {
    String name();
    boolean nullable() default true;
    int length() default 255;
}

// 源码保留，作用于方法
@Retention(RetentionPolicy.SOURCE)
@Target(ElementType.METHOD)
@interface Todo {
    String value();
    String assignee() default "";
}

// 作用于参数
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
@interface Valid {
    String message() default "Invalid value";
}

// 作用于构造方法
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.CONSTRUCTOR)
@interface Inject {
    String name() default "";
}

// ============ 使用注解 ============
@MyAnnotation(value = "UserService", priority = 1, tags = {"service", "user"})
class UserService {
    @Column(name = "user_name", nullable = false, length = 50)
    private String username;

    @Column(name = "user_email", length = 100)
    private String email;

    @MyAnnotation("getUserById")
    public User getUserById(@Valid(message = "ID不能为空") Long id) {
        return new User();
    }

    @Todo(value = "添加缓存", assignee = "John")
    public void cacheUser() {
        // TODO: 添加缓存逻辑
    }
}

class User {}

// 子类继承测试
@MyAnnotation("ParentClass")
class ParentClass {}

class ChildClass extends ParentClass {
    // @Inherited：子类会继承父类的注解
}

public class MetaAnnotationDemo {
    public static void main(String[] args) throws Exception {
        // ============ 读取注解信息 ============
        Class<?> clazz = UserService.class;

        // 读取类上的注解
        MyAnnotation classAnnotation = clazz.getAnnotation(MyAnnotation.class);
        if (classAnnotation != null) {
            System.out.println("Class annotation:");
            System.out.println("  value: " + classAnnotation.value());
            System.out.println("  priority: " + classAnnotation.priority());
            System.out.println("  tags: " + Arrays.toString(classAnnotation.tags()));
        }

        // 读取方法上的注解
        Method method = clazz.getMethod("getUserById", Long.class);
        MyAnnotation methodAnnotation = method.getAnnotation(MyAnnotation.class);
        if (methodAnnotation != null) {
            System.out.println("\nMethod annotation:");
            System.out.println("  value: " + methodAnnotation.value());
        }

        // 读取参数上的注解
        Parameter[] parameters = method.getParameters();
        for (Parameter param : parameters) {
            Valid valid = param.getAnnotation(Valid.class);
            if (valid != null) {
                System.out.println("\nParameter annotation:");
                System.out.println("  message: " + valid.message());
            }
        }

        // 读取字段上的注解
        Field usernameField = clazz.getDeclaredField("username");
        Column columnAnnotation = usernameField.getAnnotation(Column.class);
        if (columnAnnotation != null) {
            System.out.println("\nField annotation:");
            System.out.println("  name: " + columnAnnotation.name());
            System.out.println("  nullable: " + columnAnnotation.nullable());
            System.out.println("  length: " + columnAnnotation.length());
        }

        // ============ @Inherited测试 ============
        MyAnnotation inherited = ChildClass.class.getAnnotation(MyAnnotation.class);
        System.out.println("\nInherited annotation: " +
            (inherited != null ? inherited.value() : "null"));

        // ============ @Documented测试 ============
        // 使用javadoc工具生成文档时，MyAnnotation会出现在文档中
    }
}
```

#### ⭐ 面试高频问题

**Q1: @Retention的三种策略有什么区别？**
- SOURCE：只在源码中，编译后丢弃（如@Override）
- CLASS：保留到class文件，运行时不可获取（如Lombok的@Getter等编译期注解）
- RUNTIME：保留到运行时，可反射获取（如@Test）

**Q2: @Target常用的取值有哪些？**
- TYPE、FIELD、METHOD、PARAMETER、CONSTRUCTOR、LOCAL_VARIABLE

**Q3: @Inherited的作用是什么？**
- 注解可以被子类继承
- 只对类注解有效

**Q4: 自定义注解的语法是什么？**
- 使用@interface关键字
- 定义注解属性（方法）
- 使用元注解修饰

#### 与React对比

```javascript
// JavaScript/TypeScript中的装饰器（类似注解）
// TypeScript装饰器实验性功能

// 类装饰器
function Component(options: { template: string }) {
    return function (target: any) {
        target.prototype.template = options.template;
    };
}

@Component({ template: '<div>Hello</div>' })
class MyComponent {}

// 方法装饰器
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
        console.log(`Calling ${propertyKey} with args:`, args);
        const result = originalMethod.apply(this, args);
        console.log(`Result:`, result);
        return result;
    };
}

class Calculator {
    @Log
    add(a: number, b: number) {
        return a + b;
    }
}

// React中的HOC（类似类装饰器）
function withAuth(WrappedComponent: any) {
    return function AuthComponent(props: any) {
        const isAuthenticated = useAuth();
        if (!isAuthenticated) {
            return <Redirect to="/login" />;
        }
        return <WrappedComponent {...props} />;
    };
}
```

---

### 5.2 自定义注解

#### 概念讲解

**自定义注解的步骤**
1. 使用@interface定义注解
2. 使用元注解修饰
3. 定义注解属性
4. 使用注解
5. 通过反射读取注解

#### 代码示例

```java
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;

// ============ 自定义注解 ============

// 1. 数据库表映射注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Table {
    String name();
    String schema() default "";
}

// 2. 数据库列映射注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Column {
    String name();
    String type() default "VARCHAR";
    boolean primaryKey() default false;
    boolean autoIncrement() default false;
    boolean nullable() default true;
    int length() default 255;
}

// 3. 验证注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface NotNull {
    String message() default "不能为空";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Length {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "长度不合法";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Email {
    String message() default "邮箱格式不正确";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface Range {
    long min() default Long.MIN_VALUE;
    long max() default Long.MAX_VALUE;
    String message() default "范围不合法";
}

// 4. API接口文档注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface ApiOperation {
    String value();
    String notes() default "";
    String[] tags() default {};
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.PARAMETER)
@interface ApiParam {
    String value();
    boolean required() default false;
    String defaultValue() default "";
}

// 5. 缓存注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Cacheable {
    String key();
    long ttl() default 3600; // 秒
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface CacheEvict {
    String key();
}

// ============ 使用自定义注解 ============

@Table(name = "t_user", schema = "mydb")
class UserEntity {
    @Column(name = "id", type = "BIGINT", primaryKey = true, autoIncrement = true)
    private Long id;

    @Column(name = "username", type = "VARCHAR", nullable = false, length = 50)
    @NotNull(message = "用户名不能为空")
    @Length(min = 3, max = 50, message = "用户名长度必须在3-50之间")
    private String username;

    @Column(name = "email", type = "VARCHAR", length = 100)
    @Email(message = "邮箱格式不正确")
    private String email;

    @Column(name = "age", type = "INT")
    @Range(min = 0, max = 150, message = "年龄必须在0-150之间")
    private Integer age;

    public UserEntity() {}

    public UserEntity(String username, String email, Integer age) {
        this.username = username;
        this.email = email;
        this.age = age;
    }

    // getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}

class UserController {
    @ApiOperation(value = "根据ID获取用户", tags = {"用户管理"})
    public UserEntity getUserById(@ApiParam(value = "用户ID", required = true) Long id) {
        return new UserEntity();
    }

    @ApiOperation(value = "创建用户", tags = {"用户管理"})
    public UserEntity createUser(@ApiParam(value = "用户名", required = true) String username,
                                  @ApiParam(value = "邮箱") String email) {
        return new UserEntity(username, email, 25);
    }

    @Cacheable(key = "#id", ttl = 1800)
    public UserEntity getCachedUser(Long id) {
        System.out.println("Querying database for user: " + id);
        return new UserEntity();
    }

    @CacheEvict(key = "#id")
    public void evictUserCache(Long id) {
        System.out.println("Evicting cache for user: " + id);
    }
}

// ============ 注解处理器 ============

// 验证器
class Validator {
    public static List<String> validate(Object obj) throws Exception {
        List<String> errors = new ArrayList<>();
        Class<?> clazz = obj.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            Object value = field.get(obj);

            // @NotNull验证
            NotNull notNull = field.getAnnotation(NotNull.class);
            if (notNull != null && value == null) {
                errors.add(field.getName() + ": " + notNull.message());
            }

            // @Length验证
            if (value instanceof String) {
                Length length = field.getAnnotation(Length.class);
                if (length != null) {
                    String str = (String) value;
                    if (str.length() < length.min() || str.length() > length.max()) {
                        errors.add(field.getName() + ": " + length.message());
                    }
                }

                // @Email验证
                Email email = field.getAnnotation(Email.class);
                if (email != null && !str.matches("^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                    errors.add(field.getName() + ": " + email.message());
                }
            }

            // @Range验证
            if (value instanceof Number) {
                Range range = field.getAnnotation(Range.class);
                if (range != null) {
                    long num = ((Number) value).longValue();
                    if (num < range.min() || num > range.max()) {
                        errors.add(field.getName() + ": " + range.message());
                    }
                }
            }
        }

        return errors;
    }
}

// SQL生成器
class SqlGenerator {
    public static String generateCreateTable(Class<?> clazz) {
        Table table = clazz.getAnnotation(Table.class);
        if (table == null) return null;

        StringBuilder sql = new StringBuilder();
        sql.append("CREATE TABLE ");

        if (!table.schema().isEmpty()) {
            sql.append(table.schema()).append(".");
        }
        sql.append(table.name()).append(" (\n");

        List<String> columns = new ArrayList<>();
        String primaryKey = null;

        for (Field field : clazz.getDeclaredFields()) {
            Column column = field.getAnnotation(Column.class);
            if (column == null) continue;

            StringBuilder colDef = new StringBuilder();
            colDef.append("  ").append(column.name()).append(" ");
            colDef.append(column.type());

            if (column.type().equals("VARCHAR")) {
                colDef.append("(").append(column.length()).append(")");
            }

            if (!column.nullable()) {
                colDef.append(" NOT NULL");
            }

            if (column.autoIncrement()) {
                colDef.append(" AUTO_INCREMENT");
            }

            columns.add(colDef.toString());

            if (column.primaryKey()) {
                primaryKey = column.name();
            }
        }

        sql.append(String.join(",\n", columns));

        if (primaryKey != null) {
            sql.append(",\n  PRIMARY KEY (").append(primaryKey).append(")");
        }

        sql.append("\n);");
        return sql.toString();
    }
}

public class CustomAnnotationDemo {
    public static void main(String[] args) throws Exception {
        // ============ 验证测试 ============
        System.out.println("===== Validation =====");
        UserEntity validUser = new UserEntity("John", "john@example.com", 25);
        List<String> errors = Validator.validate(validUser);
        System.out.println("Valid user errors: " + errors); // []

        UserEntity invalidUser = new UserEntity("", "invalid-email", -1);
        errors = Validator.validate(invalidUser);
        System.out.println("Invalid user errors: " + errors);

        UserEntity nullUser = new UserEntity(null, null, null);
        errors = Validator.validate(nullUser);
        System.out.println("Null user errors: " + errors);

        // ============ SQL生成测试 ============
        System.out.println("\n===== SQL Generation =====");
        String createTableSql = SqlGenerator.generateCreateTable(UserEntity.class);
        System.out.println(createTableSql);

        // ============ 读取API文档注解 ============
        System.out.println("\n===== API Documentation =====");
        Class<?> controllerClass = UserController.class;

        for (Method method : controllerClass.getDeclaredMethods()) {
            ApiOperation apiOp = method.getAnnotation(ApiOperation.class);
            if (apiOp != null) {
                System.out.println("API: " + apiOp.value());
                System.out.println("  Tags: " + Arrays.toString(apiOp.tags()));
                System.out.println("  Notes: " + apiOp.notes());
            }
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 自定义注解的属性类型有哪些限制？**
- 基本类型（int, long, boolean等）
- String
- Class
- 枚举
- 注解
- 以上类型的数组

**Q2: 注解属性可以有默认值吗？**
- 可以，使用default关键字
- 使用注解时可以不指定有默认值的属性

**Q3: 如何在运行时读取注解？**
- 使用反射API
- Class.getAnnotation()
- Method.getAnnotation()
- Field.getAnnotation()

**Q4: 注解可以继承吗？**
- 注解不能使用extends继承
- 可以使用@Inherited让子类继承父类的注解

#### 与React对比

```javascript
// TypeScript装饰器（类似自定义注解）
function validate(target: any, propertyKey: string) {
    // 验证逻辑
}

function minLength(min: number) {
    return function (target: any, propertyKey: string) {
        // 最小长度验证
    };
}

class UserForm {
    @validate @minLength(3)
    username: string = '';

    @validate
    email: string = '';
}

// React中的自定义Hook（类似注解处理器）
function useValidation<T extends object>(values: T, rules: ValidationRules<T>) {
    const errors = useMemo(() => {
        const result: Partial<Record<keyof T, string>> = {};
        for (const key in rules) {
            const rule = rules[key];
            const value = values[key];
            if (rule.required && !value) {
                result[key] = rule.message || `${key} is required`;
            }
        }
        return result;
    }, [values, rules]);

    return { errors, isValid: Object.keys(errors).length === 0 };
}

// 使用
function UserFormComponent() {
    const [values, setValues] = useState({ username: '', email: '' });
    const { errors, isValid } = useValidation(values, {
        username: { required: true, message: '用户名不能为空' },
        email: { required: true, message: '邮箱不能为空' }
    });

    return <form>...</form>;
}
```

---

### 5.3 注解处理器（编译期 vs 运行期）

#### 概念讲解

**编译期注解处理器**
- 在编译时处理注解
- 生成新的源代码或资源文件
- 不影响运行时性能
- 例如：Lombok、MapStruct、Dagger

**运行期注解处理器**
- 在运行时通过反射处理注解
- 灵活性高，但有性能开销
- 例如：Spring、JUnit、Hibernate Validator

#### 代码示例

```java
import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.*;

// ============ 编译期注解处理器（概念演示） ============
// 编译期处理器需要单独的处理器模块
// 以下为简化示例

/**
 * 编译期注解处理器的基本结构：
 *
 * @SupportedAnnotationTypes("com.example.MyAnnotation")
 * @SupportedSourceVersion(SourceVersion.RELEASE_11)
 * public class MyAnnotationProcessor extends AbstractProcessor {
 *
 *     @Override
 *     public boolean process(Set<? extends TypeElement> annotations,
 *                           RoundEnvironment roundEnv) {
 *         for (TypeElement annotation : annotations) {
 *             for (Element element : roundEnv.getElementsAnnotatedWith(annotation)) {
 *                 // 处理注解
 *                 // 生成新的源代码
 *             }
 *         }
 *         return true;
 *     }
 * }
 */

// ============ 运行期注解处理器 ============

// 简易依赖注入容器
@interface Component {
    String name() default "";
}

@interface Autowired {
    String name() default "";
}

@interface Qualifier {
    String value();
}

// 服务接口
interface MessageService {
    String sendMessage(String message);
}

@Component
class EmailService implements MessageService {
    @Override
    public String sendMessage(String message) {
        return "Email: " + message;
    }
}

@Component
class SmsService implements MessageService {
    @Override
    public String sendMessage(String message) {
        return "SMS: " + message;
    }
}

@Component
class NotificationService {
    @Autowired
    @Qualifier("emailService")
    private MessageService messageService;

    public void notify(String message) {
        System.out.println(messageService.sendMessage(message));
    }
}

// 简易DI容器
class DIContainer {
    private final Map<String, Object> instances = new ConcurrentHashMap<>();
    private final Map<Class<?>, String> beanNames = new ConcurrentHashMap<>();

    public void scan(String packageName) throws Exception {
        // 扫描包下的所有类（简化版）
        List<Class<?>> classes = Arrays.asList(
            EmailService.class,
            SmsService.class,
            NotificationService.class
        );

        // 注册Bean
        for (Class<?> clazz : classes) {
            Component component = clazz.getAnnotation(Component.class);
            if (component != null) {
                String beanName = component.name().isEmpty()
                    ? clazz.getSimpleName().substring(0, 1).toLowerCase()
                        + clazz.getSimpleName().substring(1)
                    : component.name();
                instances.put(beanName, clazz.getDeclaredConstructor().newInstance());
                beanNames.put(clazz, beanName);
            }
        }

        // 注入依赖
        for (Object instance : instances.values()) {
            injectDependencies(instance);
        }
    }

    private void injectDependencies(Object instance) throws Exception {
        Class<?> clazz = instance.getClass();

        for (Field field : clazz.getDeclaredFields()) {
            Autowired autowired = field.getAnnotation(Autowired.class);
            if (autowired == null) continue;

            Qualifier qualifier = field.getAnnotation(Qualifier.class);

            Object dependency;
            if (qualifier != null) {
                String beanName = qualifier.value();
                dependency = instances.get(beanName);
            } else {
                // 按类型查找
                dependency = findByType(field.getType());
            }

            if (dependency != null) {
                field.setAccessible(true);
                field.set(instance, dependency);
            }
        }
    }

    private Object findByType(Class<?> type) {
        for (Object instance : instances.values()) {
            if (type.isInstance(instance)) {
                return instance;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    public <T> T getBean(Class<T> type) {
        for (Object instance : instances.values()) {
            if (type.isInstance(instance)) {
                return (T) instance;
            }
        }
        return null;
    }

    public <T> T getBean(String name, Class<T> type) {
        Object instance = instances.get(name);
        return type.cast(instance);
    }
}

// ============ 简易事件总线 ============
@interface Subscribe {}

interface EventListener {
    void onEvent(Object event);
}

class EventBus {
    private final Map<Class<?>, List<EventListener>> listeners = new ConcurrentHashMap<>();

    public void register(Object listener) {
        Class<?> clazz = listener.getClass();

        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(Subscribe.class)) {
                Class<?> eventType = method.getParameterTypes()[0];
                method.setAccessible(true);

                listeners.computeIfAbsent(eventType, k -> new ArrayList<>())
                    .add(event -> {
                        try {
                            method.invoke(listener, event);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    });
            }
        }
    }

    public void post(Object event) {
        List<EventListener> eventListeners = listeners.get(event.getClass());
        if (eventListeners != null) {
            for (EventListener listener : eventListeners) {
                listener.onEvent(event);
            }
        }
    }
}

// 事件类
class UserCreatedEvent {
    private final String username;
    public UserCreatedEvent(String username) { this.username = username; }
    public String getUsername() { return username; }
}

class OrderPlacedEvent {
    private final String orderId;
    public OrderPlacedEvent(String orderId) { this.orderId = orderId; }
    public String getOrderId() { return orderId; }
}

// 事件监听器
class UserEventListener {
    @Subscribe
    public void onUserCreated(UserCreatedEvent event) {
        System.out.println("[UserEvent] User created: " + event.getUsername());
    }
}

class EmailEventListener {
    @Subscribe
    public void onUserCreated(UserCreatedEvent event) {
        System.out.println("[EmailEvent] Welcome email sent to: " + event.getUsername());
    }

    @Subscribe
    public void onOrderPlaced(OrderPlacedEvent event) {
        System.out.println("[EmailEvent] Order confirmation sent for: " + event.getOrderId());
    }
}

public class AnnotationProcessorDemo {
    public static void main(String[] args) throws Exception {
        // ============ DI容器测试 ============
        System.out.println("===== DI Container =====");
        DIContainer container = new DIContainer();
        container.scan("com.example");

        NotificationService notificationService = container.getBean(NotificationService.class);
        notificationService.notify("Hello World!");

        // ============ 事件总线测试 ============
        System.out.println("\n===== Event Bus =====");
        EventBus eventBus = new EventBus();
        eventBus.register(new UserEventListener());
        eventBus.register(new EmailEventListener());

        eventBus.post(new UserCreatedEvent("John"));
        eventBus.post(new OrderPlacedEvent("ORD-001"));
    }
}
```

#### ⭐ 面试高频问题

**Q1: 编译期注解处理器和运行期注解处理器的区别？**
- 编译期：生成代码，不影响运行时性能
- 运行期：反射处理，灵活但有性能开销

**Q2: Lombok是如何工作的？**
- 编译期注解处理器
- 在编译时修改AST（抽象语法树）
- 生成getter/setter/constructor等方法

**Q3: Spring的注解是编译期还是运行期处理？**
- 大部分是运行期处理
- 使用反射扫描和处理注解
- Spring Boot的配置注解有编译期处理

**Q4: 如何实现一个编译期注解处理器？**
- 继承AbstractProcessor
- 实现process方法
- 注册处理器（META-INF/services）

#### 与React对比

```javascript
// Babel插件（类似编译期注解处理器）
// babel-plugin-react-intl：在编译时提取国际化字符串

// React中的运行时处理
// 1. Context API（类似DI容器）
const ServiceContext = React.createContext(null);

function useService<T>(ServiceClass: new () => T): T {
    const services = useContext(ServiceContext);
    return services.get(ServiceClass);
}

// 2. 事件系统（类似EventBus）
class EventEmitter {
    private listeners = new Map();

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    emit(event: string, data: any) {
        const callbacks = this.listeners.get(event) || [];
        callbacks.forEach(callback => callback(data));
    }
}

// 3. 自定义Hook（类似注解处理器）
function useEventBus() {
    const bus = useRef(new EventEmitter());

    useEffect(() => {
        return () => bus.current.removeAllListeners();
    }, []);

    return bus.current;
}
```

---

### 5.4 常见内置注解（@Override, @Deprecated, @SuppressWarnings, @FunctionalInterface）

#### 概念讲解

**@Override**
- 标记方法重写父类方法
- 编译器检查是否正确重写
- 不是必须的，但推荐使用

**@Deprecated**
- 标记过时的元素
- 编译时产生警告
- 可以指定替代方案

**@SuppressWarnings**
- 抑制编译器警告
- 常用值：unchecked, deprecation, rawtypes

**@FunctionalInterface**
- 标记函数式接口
- 只能有一个抽象方法
- 可以有默认方法和静态方法

#### 代码示例

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class BuiltInAnnotationsDemo {
    public static void main(String[] args) {
        // ============ @Override ============
        Animal animal = new Dog("Buddy");
        animal.makeSound(); // Dog: Buddy barks

        // ============ @Deprecated ============
        OldService oldService = new OldService();
        oldService.oldMethod(); // 编译警告

        // ============ @SuppressWarnings ============
        @SuppressWarnings("unchecked")
        List rawList = new ArrayList();
        rawList.add("Hello");
        rawList.add(123);

        @SuppressWarnings("deprecation")
        oldService.oldMethod(); // 不再显示警告

        // ============ @FunctionalInterface ============
        // 使用Lambda表达式
        Calculator add = (a, b) -> a + b;
        System.out.println("Add: " + add.calculate(3, 5)); // 8

        Calculator multiply = (a, b) -> a * b;
        System.out.println("Multiply: " + multiply.calculate(3, 5)); // 15

        // 方法引用
        List<String> names = Arrays.asList("John", "Jane", "Bob", "Alice");
        names.forEach(System.out::println);

        // Stream API
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
        int sum = numbers.stream()
            .filter(n -> n % 2 == 0)
            .mapToInt(Integer::intValue)
            .sum();
        System.out.println("Sum of even numbers: " + sum); // 6

        // 自定义函数式接口
        StringTransformer toUpper = String::toUpperCase;
        StringTransformer toLower = String::toLowerCase;
        StringTransformer trim = String::trim;

        System.out.println(toUpper.transform("hello")); // HELLO
        System.out.println(toLower.transform("HELLO")); // hello
        System.out.println(trim.transform("  hello  ")); // hello

        // 组合函数式接口
        Function<String, String> pipeline = ((Function<String, String>) String::trim)
            .andThen(String::toUpperCase);
        System.out.println(pipeline.apply("  hello  ")); // HELLO
    }
}

// @Override示例
abstract class Animal {
    protected String name;

    public Animal(String name) {
        this.name = name;
    }

    public abstract void makeSound();

    public void eat() {
        System.out.println(name + " is eating");
    }
}

class Dog extends Animal {
    public Dog(String name) {
        super(name);
    }

    @Override
    public void makeSound() {
        System.out.println("Dog: " + name + " barks");
    }

    @Override
    public void eat() {
        System.out.println("Dog: " + name + " eats dog food");
    }

    // @Override
    // public void run() {} // 编译错误：父类没有run方法
}

// @Deprecated示例
class OldService {
    @Deprecated(since = "2.0", forRemoval = true)
    public void oldMethod() {
        System.out.println("This method is deprecated");
    }

    public void newMethod() {
        System.out.println("Use this method instead");
    }
}

// @FunctionalInterface示例
@FunctionalInterface
interface Calculator {
    double calculate(double a, double b);

    // 可以有默认方法
    default void printResult(double a, double b) {
        System.out.println("Result: " + calculate(a, b));
    }

    // 可以有静态方法
    static void info() {
        System.out.println("Calculator functional interface");
    }
}

@FunctionalInterface
interface StringTransformer {
    String transform(String input);

    // 组合方法
    default StringTransformer andThen(StringTransformer after) {
        return input -> after.transform(this.transform(input));
    }
}
```

#### ⭐ 面试高频问题

**Q1: @Override的作用是什么？**
- 强制编译器检查方法是否正确重写
- 避免因方法签名错误导致的bug

**Q2: @Deprecated注解的since和forRemoval属性是什么意思？**
- since：标记从哪个版本开始过时
- forRemoval：是否计划在将来移除

**Q3: @SuppressWarnings常用的值有哪些？**
- unchecked：未检查的类型转换
- deprecation：使用了过时的API
- rawtypes：使用了原始类型

**Q4: @FunctionalInterface的作用是什么？**
- 标记函数式接口（只有一个抽象方法）
- 编译器检查是否满足函数式接口要求
- 可以使用Lambda表达式

#### 与React对比

```javascript
// JavaScript中没有内置注解
// TypeScript中有装饰器

// @Override的等价物
class Parent {
    greet() {
        return 'Hello';
    }
}

class Child extends Parent {
    // TypeScript中没有@Override，但可以重写
    greet() {
        return super.greet() + ' from Child';
    }
}

// @Deprecated的等价物
/** @deprecated Use newMethod instead */
function oldMethod() {
    console.log('Deprecated');
}

function newMethod() {
    console.log('New');
}

// @FunctionalInterface的等价物
// TypeScript函数类型
type Calculator = (a: number, b: number) => number;

const add: Calculator = (a, b) => a + b;
const multiply: Calculator = (a, b) => a * b;

// React中的函数式组件（类似函数式接口）
type Component<P> = (props: P) => React.ReactElement;

const MyComponent: Component<{ name: string }> = ({ name }) => {
    return <div>Hello, {name}</div>;
};
```

---

## 六、异常处理

### 6.1 Checked Exception vs Unchecked Exception

#### 概念讲解

**Checked Exception**
- 编译时检查
- 必须处理（try-catch或throws）
- 继承自Exception（不包括RuntimeException）
- 例如：IOException、SQLException

**Unchecked Exception**
- 运行时检查
- 不需要强制处理
- 继承自RuntimeException
- 例如：NullPointerException、IllegalArgumentException

**Error**
- 不可恢复的错误
- 不应该被捕获
- 例如：OutOfMemoryError、StackOverflowError

#### 代码示例

```java
import java.io.*;
import java.sql.*;

public class ExceptionTypeDemo {
    public static void main(String[] args) {
        // ============ Checked Exception ============
        try {
            readFile("test.txt");
        } catch (IOException e) {
            System.out.println("Checked Exception: " + e.getMessage());
        }

        // ============ Unchecked Exception ============
        try {
            divide(10, 0);
        } catch (ArithmeticException e) {
            System.out.println("Unchecked Exception: " + e.getMessage());
        }

        try {
            processNull(null);
        } catch (NullPointerException e) {
            System.out.println("Unchecked Exception: " + e.getMessage());
        }

        // ============ Error ============
        try {
            recursiveMethod();
        } catch (StackOverflowError e) {
            System.out.println("Error: StackOverflowError");
        }

        // ============ 异常层次结构 ============
        printExceptionHierarchy();
    }

    // Checked Exception：必须声明或捕获
    public static void readFile(String filename) throws IOException {
        FileInputStream fis = new FileInputStream(filename);
        BufferedReader reader = new BufferedReader(new InputStreamReader(fis));
        String line = reader.readLine();
        reader.close();
    }

    // Unchecked Exception：不需要声明
    public static int divide(int a, int b) {
        return a / b; // 可能抛出ArithmeticException
    }

    // Unchecked Exception：NullPointerException
    public static void processNull(String str) {
        str.length(); // 可能抛出NullPointerException
    }

    // Error：StackOverflowError
    public static void recursiveMethod() {
        recursiveMethod(); // 无限递归
    }

    // 异常层次结构
    public static void printExceptionHierarchy() {
        System.out.println("\n===== Exception Hierarchy =====");
        System.out.println("Throwable");
        System.out.println("  ├── Error");
        System.out.println("  │   ├── OutOfMemoryError");
        System.out.println("  │   ├── StackOverflowError");
        System.out.println("  │   └── NoClassDefFoundError");
        System.out.println("  └── Exception");
        System.out.println("      ├── IOException (Checked)");
        System.out.println("      │   ├── FileNotFoundException");
        System.out.println("      │   └── SQLException");
        System.out.println("      ├── ClassNotFoundException (Checked)");
        System.out.println("      └── RuntimeException (Unchecked)");
        System.out.println("          ├── NullPointerException");
        System.out.println("          ├── IllegalArgumentException");
        System.out.println("          ├── IndexOutOfBoundsException");
        System.out.println("          ├── ClassCastException");
        System.out.println("          └── ArithmeticException");
    }
}
```

#### ⭐ 面试高频问题

**Q1: Checked Exception和Unchecked Exception的区别是什么？**
- Checked：编译时检查，必须处理
- Unchecked：运行时异常，不需要强制处理

**Q2: 为什么Java要有Checked Exception？**
- 强制开发者处理可能出现的异常
- 提高代码的健壮性
- 但也增加了代码复杂度

**Q3: 什么时候使用Checked Exception，什么时候使用Unchecked Exception？**
- Checked：可恢复的异常（如文件不存在）
- Unchecked：编程错误（如空指针）

**Q4: Error和Exception的区别是什么？**
- Error：不可恢复的系统错误
- Exception：可恢复的应用异常

#### 与React对比

```javascript
// JavaScript没有Checked Exception
// 所有异常都是Unchecked

// 同步异常
try {
    JSON.parse('invalid json');
} catch (error) {
    console.error('Parse error:', error.message);
}

// 异步异常
async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error.message);
        throw error;
    }
}

// React中的错误处理
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <div>Something went wrong: {this.state.error.message}</div>;
        }
        return this.props.children;
    }
}

// React Hooks中的错误处理
function useAsync(asyncFn) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const result = await asyncFn(...args);
            setData(result);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [asyncFn]);

    return { data, error, loading, execute };
}
```

---

### 6.2 try-catch-finally 执行顺序（含return场景）

#### 概念讲解

**执行顺序**
1. try块正常执行
2. 如果try中抛出异常，跳转到catch块
3. finally块总是执行（即使try/catch中有return）

**return场景**
- try中的return：先保存返回值，执行finally，再返回
- finally中的return：覆盖try/catch中的return（不推荐）

#### 代码示例

```java
public class TryCatchFinallyDemo {
    public static void main(String[] args) {
        // ============ 基本执行顺序 ============
        System.out.println("===== 基本执行顺序 =====");
        testBasicOrder();
        /*
        Try block
        Catch block: / by zero
        Finally block
        */

        // ============ try中有return ============
        System.out.println("\n===== try中有return =====");
        int result1 = testTryReturn();
        System.out.println("Result: " + result1); // 1
        /*
        Try block
        Finally block
        Result: 1
        */

        // ============ catch中有return ============
        System.out.println("\n===== catch中有return =====");
        int result2 = testCatchReturn();
        System.out.println("Result: " + result2); // 2
        /*
        Try block
        Catch block
        Finally block
        Result: 2
        */

        // ============ finally中有return ============
        System.out.println("\n===== finally中有return =====");
        int result3 = testFinallyReturn();
        System.out.println("Result: " + result3); // 3
        /*
        Try block
        Finally block
        Result: 3
        */

        // ============ try和finally都有return ============
        System.out.println("\n===== try和finally都有return =====");
        int result4 = testBothReturn();
        System.out.println("Result: " + result4); // 30
        /*
        Try block
        Finally block
        Result: 30
        注意：finally中的return覆盖了try中的return
        */

        // ============ try中修改返回值 ============
        System.out.println("\n===== try中修改返回值 =====");
        int result5 = testModifyReturn();
        System.out.println("Result: " + result5); // 10（不是20）
        /*
        Try block
        Finally block
        Result: 10
        注意：finally中修改了变量，但返回值已经被保存
        */

        // ============ try-catch-finally都有return ============
        System.out.println("\n===== 复杂场景 =====");
        int result6 = testComplexReturn();
        System.out.println("Result: " + result6); // 3

        // ============ finally中抛出异常 ============
        System.out.println("\n===== finally中抛出异常 =====");
        try {
            testFinallyException();
        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage()); // Finally exception
        }
    }

    // 基本执行顺序
    public static void testBasicOrder() {
        try {
            System.out.println("Try block");
            int result = 10 / 0;
            System.out.println("This won't execute");
        } catch (ArithmeticException e) {
            System.out.println("Catch block: " + e.getMessage());
        } finally {
            System.out.println("Finally block");
        }
    }

    // try中有return
    public static int testTryReturn() {
        try {
            System.out.println("Try block");
            return 1;
        } catch (Exception e) {
            System.out.println("Catch block");
            return 2;
        } finally {
            System.out.println("Finally block");
        }
    }

    // catch中有return
    public static int testCatchReturn() {
        try {
            System.out.println("Try block");
            int result = 10 / 0;
            return 1;
        } catch (ArithmeticException e) {
            System.out.println("Catch block");
            return 2;
        } finally {
            System.out.println("Finally block");
        }
    }

    // finally中有return（不推荐）
    public static int testFinallyReturn() {
        try {
            System.out.println("Try block");
            return 1;
        } catch (Exception e) {
            System.out.println("Catch block");
            return 2;
        } finally {
            System.out.println("Finally block");
            return 3; // 覆盖try/catch中的return
        }
    }

    // try和finally都有return
    public static int testBothReturn() {
        int num = 10;
        try {
            System.out.println("Try block");
            num = 20;
            return num; // 保存返回值20
        } finally {
            System.out.println("Finally block");
            num = 30; // 修改了num，但返回值已经保存为20
            // 如果取消下面的注释，返回30
            // return num;
        }
        // 返回20（不是30）
    }

    // try中修改返回值
    public static int testModifyReturn() {
        int num = 10;
        try {
            System.out.println("Try block");
            return num; // 保存返回值10
        } finally {
            System.out.println("Finally block");
            num = 20; // 修改了num，但返回值已经保存为10
        }
    }

    // 复杂场景
    public static int testComplexReturn() {
        try {
            System.out.println("Try block");
            return 1;
        } catch (Exception e) {
            System.out.println("Catch block");
            return 2;
        } finally {
            System.out.println("Finally block");
            return 3;
        }
    }

    // finally中抛出异常
    public static int testFinallyException() {
        try {
            System.out.println("Try block");
            return 1;
        } finally {
            System.out.println("Finally block");
            throw new RuntimeException("Finally exception");
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: try-catch-finally的执行顺序是什么？**
- try → catch（有异常）→ finally
- try → finally（无异常）
- finally总是执行

**Q2: try中有return，finally还会执行吗？**
- 会执行，finally在return之前执行
- 返回值在finally执行前已经保存

**Q3: finally中的return会覆盖try/catch中的return吗？**
- 会，但不推荐在finally中使用return
- 编译器会发出警告

**Q4: finally中抛出异常会怎样？**
- finally中的异常会覆盖try/catch中的异常
- try/catch中的return会被丢弃

#### 与React对比

```javascript
// JavaScript中的try-catch-finally
function testTryCatchFinally() {
    try {
        console.log('Try block');
        return 1;
    } catch (error) {
        console.log('Catch block');
        return 2;
    } finally {
        console.log('Finally block');
        // return 3; // 覆盖try/catch中的return
    }
}

// React中的cleanup（类似finally）
function MyComponent() {
    useEffect(() => {
        console.log('Mount'); // 类似try

        return () => {
            console.log('Unmount'); // 类似finally
        };
    }, []);

    return <div>My Component</div>;
}

// React中的错误处理
function MyComponent2() {
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const data = await api.getData();
            setData(data);
        } catch (err) {
            setError(err); // 类似catch
        } finally {
            setLoading(false); // 类似finally
        }
    };

    return <div>{error ? <ErrorDisplay error={error} /> : <DataDisplay />}</div>;
}
```

---

### 6.3 try-with-resources（AutoCloseable）

#### 概念讲解

**try-with-resources**
- Java 7引入的语法糖
- 自动关闭实现了AutoCloseable接口的资源
- 替代传统的try-catch-finally
- 支持多个资源

#### 代码示例

```java
import java.io.*;
import java.sql.*;
import java.util.*;

public class TryWithResourcesDemo {
    public static void main(String[] args) {
        // ============ 传统方式 vs try-with-resources ============
        System.out.println("===== 传统方式 =====");
        traditionalFileRead();

        System.out.println("\n===== try-with-resources =====");
        modernFileRead();

        // ============ 多个资源 ============
        System.out.println("\n===== 多个资源 =====");
        multipleResources();

        // ============ 自定义AutoCloseable ============
        System.out.println("\n===== 自定义AutoCloseable =====");
        customResource();

        // ============ 异常抑制 ============
        System.out.println("\n===== 异常抑制 =====");
        suppressedExceptions();
    }

    // 传统方式
    public static void traditionalFileRead() {
        BufferedReader reader = null;
        try {
            reader = new BufferedReader(new StringReader("Hello\nWorld"));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    System.out.println("Close error: " + e.getMessage());
                }
            }
        }
    }

    // try-with-resources方式
    public static void modernFileRead() {
        try (BufferedReader reader = new BufferedReader(new StringReader("Hello\nWorld"))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
        // reader自动关闭
    }

    // 多个资源
    public static void multipleResources() {
        try (BufferedReader reader = new BufferedReader(new StringReader("Hello\nWorld"));
             PrintWriter writer = new PrintWriter(new StringWriter())) {

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
                writer.println(line);
            }

        } catch (IOException e) {
            System.out.println("Error: " + e.getMessage());
        }
        // reader和writer都会自动关闭
        // 关闭顺序与声明顺序相反
    }

    // 自定义AutoCloseable
    public static void customResource() {
        try (MyResource resource1 = new MyResource("Resource1");
             MyResource resource2 = new MyResource("Resource2")) {

            System.out.println("Using resources");
            resource1.doWork();
            resource2.doWork();

        } // resource2先关闭，resource1后关闭
    }

    // 异常抑制
    public static void suppressedExceptions() {
        try (MyResource resource = new MyResource("TestResource")) {
            System.out.println("Throwing exception in try block");
            throw new RuntimeException("Try exception");
        } catch (Exception e) {
            System.out.println("Caught: " + e.getMessage());

            // 获取被抑制的异常
            Throwable[] suppressed = e.getSuppressed();
            for (Throwable t : suppressed) {
                System.out.println("Suppressed: " + t.getMessage());
            }
        }
    }
}

// 自定义AutoCloseable资源
class MyResource implements AutoCloseable {
    private final String name;

    public MyResource(String name) {
        this.name = name;
        System.out.println(name + " opened");
    }

    public void doWork() {
        System.out.println(name + " doing work");
    }

    @Override
    public void close() {
        System.out.println(name + " closed");
        // throw new RuntimeException(name + " close failed");
    }
}

// 实际应用：数据库连接池
class DatabaseConnection implements AutoCloseable {
    private Connection connection;

    public DatabaseConnection(String url, String user, String password) throws SQLException {
        this.connection = DriverManager.getConnection(url, user, password);
        System.out.println("Database connection opened");
    }

    public void executeQuery(String sql) throws SQLException {
        try (Statement stmt = connection.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            while (rs.next()) {
                System.out.println(rs.getString(1));
            }
        }
    }

    @Override
    public void close() throws SQLException {
        if (connection != null) {
            connection.close();
            System.out.println("Database connection closed");
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: try-with-resources的原理是什么？**
- 编译器自动生成finally块
- 调用资源的close()方法
- 实现了AutoCloseable接口的资源

**Q2: 多个资源的关闭顺序是什么？**
- 与声明顺序相反（后声明的先关闭）
- 类似于栈的后进先出

**Q3: try块和close()都抛出异常怎么办？**
- try块的异常作为主异常
- close()的异常作为被抑制的异常
- 可以通过getSuppressed()获取

**Q4: AutoCloseable和Closeable的区别？**
- AutoCloseable：close()抛出Exception
- Closeable：close()抛出IOException

#### 与React对比

```javascript
// JavaScript中的资源清理
// 1. 使用try-finally
function readFile(path) {
    const fs = require('fs');
    let fd;
    try {
        fd = fs.openSync(path, 'r');
        const data = fs.readFileSync(fd, 'utf-8');
        return data;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        }
    }
}

// 2. 使用using语法（TC39 Stage 3提案）
// using resource = new Resource();

// React中的cleanup
function MyComponent() {
    useEffect(() => {
        const subscription = eventBus.subscribe('event', handler);
        const timer = setInterval(() => console.log('tick'), 1000);

        // cleanup函数（类似try-with-resources）
        return () => {
            subscription.unsubscribe();
            clearInterval(timer);
        };
    }, []);

    return <div>My Component</div>;
}

// React中的AbortController（类似AutoCloseable）
function DataFetcher() {
    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/data', { signal: controller.signal })
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => {
                if (err.name !== 'AbortError') {
                    setError(err);
                }
            });

        return () => controller.abort(); // 取消请求
    }, []);

    return <div>{/* ... */}</div>;
}
```

---

### 6.4 自定义异常的最佳实践

#### 概念讲解

**自定义异常的原则**
- 继承Exception或RuntimeException
- 提供有意义的错误信息
- 支持异常链（cause）
- 提供多种构造方法

#### 代码示例

```java
import java.util.*;

// ============ 自定义异常体系 ============

// 基础异常
class BaseException extends RuntimeException {
    private final String errorCode;
    private final String errorMessage;
    private final long timestamp;

    public BaseException(String errorCode, String errorMessage) {
        super(errorMessage);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.timestamp = System.currentTimeMillis();
    }

    public BaseException(String errorCode, String errorMessage, Throwable cause) {
        super(errorMessage, cause);
        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.timestamp = System.currentTimeMillis();
    }

    public String getErrorCode() {
        return errorCode;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public long getTimestamp() {
        return timestamp;
    }

    @Override
    public String toString() {
        return "BaseException{" +
            "errorCode='" + errorCode + '\'' +
            ", errorMessage='" + errorMessage + '\'' +
            ", timestamp=" + timestamp +
            '}';
    }
}

// 业务异常
class BusinessException extends BaseException {
    public BusinessException(String errorCode, String errorMessage) {
        super(errorCode, errorMessage);
    }

    public BusinessException(String errorCode, String errorMessage, Throwable cause) {
        super(errorCode, errorMessage, cause);
    }
}

// 参数校验异常
class ValidationException extends BaseException {
    private final String fieldName;

    public ValidationException(String fieldName, String errorMessage) {
        super("VALIDATION_ERROR", errorMessage);
        this.fieldName = fieldName;
    }

    public String getFieldName() {
        return fieldName;
    }
}

// 资源未找到异常
class ResourceNotFoundException extends BaseException {
    public ResourceNotFoundException(String resourceType, String resourceId) {
        super("NOT_FOUND",
            resourceType + " with id '" + resourceId + "' not found");
    }
}

// 权限异常
class AuthorizationException extends BaseException {
    public AuthorizationException(String message) {
        super("UNAUTHORIZED", message);
    }
}

// ============ 异常枚举 ============
enum ErrorCode {
    // 通用错误 1xxxx
    UNKNOWN_ERROR("10000", "Unknown error"),
    INVALID_PARAMETER("10001", "Invalid parameter"),
    VALIDATION_FAILED("10002", "Validation failed"),

    // 用户错误 2xxxx
    USER_NOT_FOUND("20001", "User not found"),
    USER_ALREADY_EXISTS("20002", "User already exists"),
    INVALID_CREDENTIALS("20003", "Invalid credentials"),

    // 系统错误 3xxxx
    DATABASE_ERROR("30001", "Database error"),
    NETWORK_ERROR("30002", "Network error"),
    FILE_ERROR("30003", "File error");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}

// ============ 异常处理器 ============
class ExceptionHandler {
    public static Map<String, Object> handle(Exception e) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("timestamp", System.currentTimeMillis());

        if (e instanceof BusinessException) {
            BusinessException be = (BusinessException) e;
            response.put("code", be.getErrorCode());
            response.put("message", be.getErrorMessage());
            response.put("status", 400);
        } else if (e instanceof ValidationException) {
            ValidationException ve = (ValidationException) e;
            response.put("code", ve.getErrorCode());
            response.put("message", ve.getErrorMessage());
            response.put("field", ve.getFieldName());
            response.put("status", 422);
        } else if (e instanceof ResourceNotFoundException) {
            ResourceNotFoundException rnfe = (ResourceNotFoundException) e;
            response.put("code", rnfe.getErrorCode());
            response.put("message", rnfe.getErrorMessage());
            response.put("status", 404);
        } else {
            response.put("code", ErrorCode.UNKNOWN_ERROR.getCode());
            response.put("message", ErrorCode.UNKNOWN_ERROR.getMessage());
            response.put("status", 500);
        }

        // 开发环境返回堆栈信息
        response.put("debug", e.toString());

        return response;
    }
}

// ============ 使用示例 ============
class UserService2 {
    private final Map<Long, String> userDatabase = new HashMap<>();

    public UserService2() {
        userDatabase.put(1L, "John");
        userDatabase.put(2L, "Jane");
    }

    public String getUser(Long id) {
        if (id == null) {
            throw new ValidationException("id", "User ID cannot be null");
        }
        if (!userDatabase.containsKey(id)) {
            throw new ResourceNotFoundException("User", String.valueOf(id));
        }
        return userDatabase.get(id);
    }

    public void createUser(Long id, String name) {
        if (id == null || name == null) {
            throw new ValidationException("id/name", "ID and name are required");
        }
        if (userDatabase.containsKey(id)) {
            throw new BusinessException(
                ErrorCode.USER_ALREADY_EXISTS.getCode(),
                ErrorCode.USER_ALREADY_EXISTS.getMessage());
        }
        userDatabase.put(id, name);
    }
}

public class CustomExceptionDemo {
    public static void main(String[] args) {
        UserService2 userService = new UserService2();

        // 测试正常情况
        System.out.println("===== 正常情况 =====");
        try {
            String user = userService.getUser(1L);
            System.out.println("User: " + user);
        } catch (Exception e) {
            System.out.println(ExceptionHandler.handle(e));
        }

        // 测试参数校验
        System.out.println("\n===== 参数校验 =====");
        try {
            userService.getUser(null);
        } catch (Exception e) {
            System.out.println(ExceptionHandler.handle(e));
        }

        // 测试资源未找到
        System.out.println("\n===== 资源未找到 =====");
        try {
            userService.getUser(999L);
        } catch (Exception e) {
            System.out.println(ExceptionHandler.handle(e));
        }

        // 测试业务异常
        System.out.println("\n===== 业务异常 =====");
        try {
            userService.createUser(1L, "New John");
        } catch (Exception e) {
            System.out.println(ExceptionHandler.handle(e));
        }

        // 测试异常链
        System.out.println("\n===== 异常链 =====");
        try {
            try {
                throw new IOException("Database connection failed");
            } catch (IOException e) {
                throw new BusinessException(
                    ErrorCode.DATABASE_ERROR.getCode(),
                    "Failed to get user",
                    e); // 异常链
            }
        } catch (Exception e) {
            System.out.println(ExceptionHandler.handle(e));
            if (e.getCause() != null) {
                System.out.println("Cause: " + e.getCause());
            }
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 自定义异常应该继承Exception还是RuntimeException？**
- 需要强制处理：继承Exception（Checked）
- 编程错误：继承RuntimeException（Unchecked）

**Q2: 什么是异常链？**
- 一个异常导致另一个异常
- 使用cause参数传递原始异常
- 保留完整的异常信息

**Q3: 自定义异常的最佳实践有哪些？**
- 提供有意义的错误信息
- 支持异常链
- 使用错误码
- 提供多种构造方法

**Q4: 如何设计异常体系？**
- 基础异常类
- 业务异常类
- 异常枚举
- 全局异常处理器

#### 与React对比

```javascript
// JavaScript中的自定义错误
class AppError extends Error {
    constructor(code, message, statusCode) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(field, message) {
        super('VALIDATION_ERROR', message, 422);
        this.field = field;
    }
}

class NotFoundError extends AppError {
    constructor(resource) {
        super('NOT_FOUND', `${resource} not found`, 404);
    }
}

// React中的错误处理
function ErrorDisplay({ error }) {
    if (error instanceof ValidationError) {
        return <div className="error">{error.field}: {error.message}</div>;
    }
    if (error instanceof NotFoundError) {
        return <div className="error">404: {error.message}</div>;
    }
    return <div className="error">Unknown error</div>;
}

// React中的全局错误处理
class ErrorBoundary extends React.Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return <ErrorDisplay error={this.state.error} />;
        }
        return this.props.children;
    }
}
```

---

### 6.5 异常处理的面试常见陷阱

#### 概念讲解

**常见陷阱**
1. 在catch块中吞掉异常
2. 在finally中使用return
3. catch块的顺序问题
4. 异常丢失
5. 过度使用Checked Exception

#### 代码示例

```java
import java.io.*;

public class ExceptionTrapDemo {
    public static void main(String[] args) {
        // ============ 陷阱1：吞掉异常 ============
        System.out.println("===== 陷阱1：吞掉异常 =====");
        badSwallowException();
        goodHandleException();

        // ============ 陷阱2：catch块顺序 ============
        System.out.println("\n===== 陷阱2：catch块顺序 =====");
        badCatchOrder();
        goodCatchOrder();

        // ============ 陷阱3：异常丢失 ============
        System.out.println("\n===== 陷阱3：异常丢失 =====");
        exceptionLost();

        // ============ 陷阱4：try块中的return ============
        System.out.println("\n===== 陷阱4：return陷阱 =====");
        int result = returnTrap();
        System.out.println("Result: " + result); // 不是预期的值

        // ============ 陷阱5：NullPointerException ============
        System.out.println("\n===== 陷阱5：NPE陷阱 =====");
        npeTrap1();
        npeTrap2();
        npeTrap3();

        // ============ 最佳实践 ============
        System.out.println("\n===== 最佳实践 =====");
        bestPractice();
    }

    // 陷阱1：吞掉异常（不好）
    public static void badSwallowException() {
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            // 什么都不做，异常被吞掉
        }
        System.out.println("No error reported"); // 但实际上有错误
    }

    // 正确处理异常
    public static void goodHandleException() {
        try {
            int result = 10 / 0;
        } catch (ArithmeticException e) {
            // 至少记录日志
            System.err.println("Division error: " + e.getMessage());
            // 或者重新抛出
            // throw new BusinessException("Calculation error", e);
        }
    }

    // 陷阱2：catch块顺序错误
    public static void badCatchOrder() {
        try {
            throw new FileNotFoundException("File not found");
        } catch (IOException e) { // FileNotFoundException的父类
            System.out.println("IOException caught: " + e.getMessage());
        } catch (FileNotFoundException e) {
            // 永远不会执行，编译错误
            System.out.println("FileNotFoundException caught");
        }
    }

    // 正确的catch块顺序：子类在前，父类在后
    public static void goodCatchOrder() {
        try {
            throw new FileNotFoundException("File not found");
        } catch (FileNotFoundException e) {
            System.out.println("FileNotFoundException caught: " + e.getMessage());
        } catch (IOException e) {
            System.out.println("IOException caught: " + e.getMessage());
        }
    }

    // 陷阱3：异常丢失
    public static void exceptionLost() {
        try {
            try {
                throw new RuntimeException("First exception");
            } finally {
                throw new RuntimeException("Second exception");
            }
        } catch (RuntimeException e) {
            // 只能捕获到第二个异常
            System.out.println("Caught: " + e.getMessage()); // Second exception

            // 第一个异常被抑制
            Throwable[] suppressed = e.getSuppressed();
            for (Throwable t : suppressed) {
                System.out.println("Suppressed: " + t.getMessage()); // First exception
            }
        }
    }

    // 陷阱4：return陷阱
    public static int returnTrap() {
        int num = 10;
        try {
            num = 20;
            return num; // 保存返回值20
        } finally {
            num = 30; // 修改了num，但返回值已经保存为20
            System.out.println("num in finally: " + num); // 30
        }
        // 返回20（不是30）
    }

    // 陷阱5：NullPointerException
    public static void npeTrap1() {
        String str = null;
        // if (str.equals("hello")) { } // NullPointerException

        // 正确做法
        if ("hello".equals(str)) { // 安全
            System.out.println("Equal");
        }
    }

    public static void npeTrap2() {
        Integer num = null;
        // int result = num + 1; // NullPointerException（自动拆箱）

        // 正确做法
        if (num != null) {
            int result = num + 1;
        }
    }

    public static void npeTrap3() {
        Map<String, String> map = new HashMap<>();
        String value = map.get("key"); // 返回null
        // value.toString(); // NullPointerException

        // 正确做法
        String safeValue = map.getOrDefault("key", "default");
        System.out.println("Safe value: " + safeValue);
    }

    // 最佳实践
    public static void bestPractice() {
        // 1. 使用具体的异常类型
        try {
            // ...
        } catch (FileNotFoundException e) {
            // 处理文件未找到
        } catch (IOException e) {
            // 处理其他IO异常
        }

        // 2. 使用try-with-resources
        try (StringReader reader = new StringReader("Hello")) {
            // ...
        } catch (IOException e) {
            System.err.println("IO error: " + e.getMessage());
        }

        // 3. 使用Optional避免NPE
        Optional<String> optional = Optional.ofNullable(getValue());
        String result = optional.orElse("default");
        System.out.println("Optional result: " + result);

        // 4. 使用Objects工具类
        String name = null;
        String safeName = Objects.requireNonNullElse(name, "Unknown");
        System.out.println("Safe name: " + safeName);

        // 5. 使用多catch（Java 7+）
        try {
            // ...
        } catch (FileNotFoundException | SQLException e) {
            System.err.println("Resource error: " + e.getMessage());
        }
    }

    static String getValue() {
        return null;
    }
}
```

#### ⭐ 面试高频问题

**Q1: 为什么不应该在catch块中什么都不做？**
- 异常信息丢失，难以排查问题
- 至少应该记录日志

**Q2: catch块的顺序有什么要求？**
- 子类异常在前，父类异常在后
- 否则编译错误

**Q3: finally中抛出异常会怎样？**
- 覆盖try/catch中的异常
- try/catch中的异常变为被抑制的异常

**Q4: 如何避免NullPointerException？**
- 使用Optional
- 使用Objects.requireNonNull
- 使用字符串常量在前比较
- 使用@Nullable/@NonNull注解

#### 与React对比

```javascript
// JavaScript中的异常处理陷阱

// 陷阱1：吞掉异常
async function fetchData() {
    try {
        const data = await api.getData();
    } catch (error) {
        // 什么都不做
    }
}

// 正确做法
async function fetchDataCorrect() {
    try {
        const data = await api.getData();
        return data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        throw error; // 重新抛出或返回错误状态
    }
}

// 陷阱2：Promise中的异常丢失
async function promiseTrap() {
    try {
        await Promise.all([
            fetchData1(),
            fetchData2(),
            fetchData3()
        ]);
    } catch (error) {
        // 只能捕获第一个失败的Promise
        console.error('Error:', error);
    }
}

// React中的错误处理最佳实践
function useAsync(asyncFn, deps = []) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function execute() {
            setLoading(true);
            setError(null);
            try {
                const result = await asyncFn();
                if (!cancelled) {
                    setData(result);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        execute();

        return () => { cancelled = true; };
    }, deps);

    return { data, error, loading };
}
```

### 2.6 String 不可变性的原理（final char[] + 不可变性设计）

#### 概念讲解

**String不可变性**
- String类被final修饰，不能被继承
- 内部使用final char[]存储数据
- 没有修改字符数组的方法
- 所有修改操作都返回新对象

#### 代码示例

```java
// String源码（简化版）
/*
public final class String implements java.io.Serializable, Comparable<String>, CharSequence {
    private final char value[];  // JDK 9之前
    // private final byte[] value;  // JDK 9+，使用byte[]节省空间

    private int hash;  // 缓存哈希值

    public String(String original) {
        this.value = original.value;
        this.hash = original.hash;
    }

    public String(char value[]) {
        this.value = Arrays.copyOf(value, value.length);
    }

    // 没有修改value的方法
    // 所有方法都返回新String
}
*/

public class StringImmutabilityDemo {
    public static void main(String[] args) {
        // ============ String不可变性演示 ============
        String str1 = "Hello";
        String str2 = str1; // str2指向同一对象

        System.out.println("str1: " + str1); // Hello
        System.out.println("str2: " + str2); // Hello
        System.out.println("str1 == str2: " + (str1 == str2)); // true

        // 修改str1
        str1 = str1 + " World"; // 创建新对象
        System.out.println("After modification:");
        System.out.println("str1: " + str1); // Hello World
        System.out.println("str2: " + str2); // Hello（不变）
        System.out.println("str1 == str2: " + (str1 == str2)); // false

        // ============ String不可变性的好处 ============
        // 1. 线程安全
        String sharedStr = "Shared";
        // 多线程环境下安全，无需同步

        // 2. 缓存哈希值
        String hashStr = "Hello";
        int hashCode1 = hashStr.hashCode();
        int hashCode2 = hashStr.hashCode(); // 使用缓存的哈希值
        System.out.println("hashCode1 == hashCode2: " + (hashCode1 == hashCode2)); // true

        // 3. 字符串常量池
        String poolStr1 = "Hello";
        String poolStr2 = "Hello";
        System.out.println("poolStr1 == poolStr2: " + (poolStr1 == poolStr2)); // true

        // 4. 安全性
        String password = "secret123";
        // 不会被意外修改

        // ============ 反射破坏不可变性 ============
        try {
            String reflectionStr = "Hello";
            System.out.println("Before reflection: " + reflectionStr); // Hello

            // 使用反射修改String
            Field valueField = String.class.getDeclaredField("value");
            valueField.setAccessible(true);
            char[] value = (char[]) valueField.get(reflectionStr);
            value[0] = 'X';

            System.out.println("After reflection: " + reflectionStr); // Xello
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ============ String的线程安全性 ============
        String threadSafeStr = "Thread Safe";

        Runnable task = () -> {
            // 尝试修改String
            String localStr = threadSafeStr;
            localStr = localStr + " Modified";
            System.out.println("Thread: " + Thread.currentThread().getName() +
                ", localStr: " + localStr);
            System.out.println("Thread: " + Thread.currentThread().getName() +
                ", threadSafeStr: " + threadSafeStr);
        };

        Thread t1 = new Thread(task, "Thread-1");
        Thread t2 = new Thread(task, "Thread-2");

        t1.start();
        t2.start();

        try {
            t1.join();
            t2.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        // threadSafeStr始终保持不变
        System.out.println("Final threadSafeStr: " + threadSafeStr); // Thread Safe
    }
}
```

#### ⭐ 面试高频问题

**Q1: 为什么String要设计成不可变的？**
- 线程安全
- 缓存哈希值，提高HashMap性能
- 字符串常量池
- 安全性

**Q2: String的不可变性是如何实现的？**
- final类，不能被继承
- final char[]存储数据
- 没有修改方法

**Q3: 如何修改String的内容？**
- 使用StringBuilder或StringBuffer
- 使用反射（不推荐）

**Q4: String不可变性有什么缺点？**
- 频繁修改会产生大量临时对象
- 性能较差

#### 与React对比

```javascript
// JavaScript字符串是不可变的
let str = "Hello";
str[0] = "X"; // 不生效
console.log(str); // "Hello"

// React中的不可变性
function Counter() {
    const [count, setCount] = useState(0);

    const increment = () => {
        // 错误：直接修改state
        // count = count + 1;

        // 正确：创建新对象
        setCount(count + 1);
    };

    return <div onClick={increment}>{count}</div>;
}

// React中的不可变更新
function UserList() {
    const [users, setUsers] = useState([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
    ]);

    const addUser = () => {
        // 错误：直接修改数组
        // users.push({ id: 3, name: 'Bob' });

        // 正确：创建新数组
        setUsers([...users, { id: 3, name: 'Bob' }]);
    };

    const updateUser = (id) => {
        // 错误：直接修改对象
        // users.find(u => u.id === id).name = 'New Name';

        // 正确：创建新对象
        setUsers(users.map(u =>
            u.id === id ? { ...u, name: 'New Name' } : u
        ));
    };

    return (
        <div>
            {users.map(user => <div key={user.id}>{user.name}</div>)}
            <button onClick={addUser}>Add User</button>
        </div>
    );
}
```

---

### 2.7 字符串常量池（JDK 7+ 字符串常量池移至堆中）

#### 概念讲解

**字符串常量池（String Pool）**
- 存储字符串字面量
- 避免重复创建字符串对象
- JDK 7之前：在永久代（PermGen）
- JDK 7+：在堆中

#### 代码示例

```java
public class StringPoolDemo {
    public static void main(String[] args) {
        // ============ 字符串常量池基本使用 ============
        String s1 = "Hello"; // 字符串常量池
        String s2 = "Hello"; // 使用常量池中的对象
        String s3 = new String("Hello"); // 堆中新对象

        System.out.println("s1 == s2: " + (s1 == s2)); // true（常量池）
        System.out.println("s1 == s3: " + (s1 == s3)); // false（不同对象）
        System.out.println("s1.equals(s3): " + s1.equals(s3)); // true（内容相同）

        // ============ intern()方法 ============
        String s4 = new String("Hello");
        String s5 = s4.intern(); // 放入常量池或返回常量池中的引用

        System.out.println("s1 == s5: " + (s1 == s5)); // true（常量池）
        System.out.println("s4 == s5: " + (s4 == s5)); // false（不同对象）

        // ============ 字符串拼接 ============
        String a = "Hello";
        String b = "World";
        String c = "HelloWorld";

        String d = "Hello" + "World"; // 编译期优化，使用常量池
        String e = a + b; // 运行时拼接，创建新对象
        String f = (a + b).intern(); // 放入常量池

        System.out.println("c == d: " + (c == d)); // true（常量池）
        System.out.println("c == e: " + (c == e)); // false（不同对象）
        System.out.println("c == f: " + (c == f)); // true（常量池）

        // ============ 字符串常量池内存优化 ============
        // 大量重复字符串使用常量池节省内存
        String[] names = new String[1000];
        for (int i = 0; i < names.length; i++) {
            names[i] = "John Doe"; // 使用常量池，只创建一个对象
        }

        // ============ 字符串常量池GC ============
        // JDK 7+：常量池中的字符串可以被GC
        String temp = new String("Temporary").intern();
        temp = null; // 可以被GC

        // ============ 常见陷阱 ============
        // 1. new String()创建多个对象
        String str1 = new String("Hello"); // 创建2个对象：常量池 + 堆

        // 2. 字符串拼接陷阱
        String str2 = "a";
        String str3 = "b";
        String str4 = "ab";

        String str5 = "a" + "b"; // 编译期优化，使用常量池
        String str6 = str2 + str3; // 运行时拼接，创建新对象

        System.out.println("str4 == str5: " + (str4 == str5)); // true
        System.out.println("str4 == str6: " + (str4 == str6)); // false

        // 3. intern()的性能问题
        long startTime = System.currentTimeMillis();
        for (int i = 0; i < 100000; i++) {
            String str = "String" + i;
            str.intern(); // 性能开销
        }
        long endTime = System.currentTimeMillis();
        System.out.println("Intern time: " + (endTime - startTime) + "ms");
    }
}
```

#### ⭐ 面试高频问题

**Q1: 字符串常量池的作用是什么？**
- 避免重复创建字符串对象
- 节省内存
- 提高性能

**Q2: new String("Hello")创建几个对象？**
- 1或2个
- 常量池中没有"Hello"：创建2个（常量池 + 堆）
- 常量池中有"Hello"：创建1个（堆）

**Q3: intern()方法的作用是什么？**
- 将字符串放入常量池
- 如果常量池中已存在，返回引用
- 如果不存在，创建并返回引用

**Q4: JDK 7为什么将字符串常量池移到堆中？**
- 永久代空间有限
- 堆空间更大，可以动态调整
- 方便GC回收

#### 与React对比

```javascript
// JavaScript没有字符串常量池
// 但有类似的字符串intern（某些引擎）

// React中的字符串优化
function MyComponent() {
    // 使用useMemo缓存字符串
    const greeting = useMemo(() => `Hello, ${name}!`, [name]);

    return <div>{greeting}</div>;
}

// React中的常量
const CONSTANTS = {
    API_URL: 'https://api.example.com',
    MAX_ITEMS: 100
};

// 避免重复创建相同字符串
function processData(items) {
    const result = items.map(item => ({
        ...item,
        status: 'completed' // 每次创建新字符串
    }));

    // 优化：使用常量
    const COMPLETED = 'completed';
    const optimizedResult = items.map(item => ({
        ...item,
        status: COMPLETED
    }));

    return optimizedResult;
}
```

---

## 三、泛型

### 3.1 泛型的作用与类型擦除

#### 概念讲解

**泛型（Generics）**
- 参数化类型
- 编译时类型检查
- 避免类型转换
- 提高代码复用性

**类型擦除（Type Erasure）**
- 编译时检查类型
- 运行时擦除类型信息
- 泛型类型变为Object或边界类型
- 保证向后兼容

#### 代码示例

```java
import java.util.*;

public class GenericsDemo {
    public static void main(String[] args) {
        // ============ 泛型基本使用 ============
        // 不使用泛型
        List rawList = new ArrayList();
        rawList.add("Hello");
        rawList.add(123); // 可以添加不同类型
        String str = (String) rawList.get(0); // 需要类型转换
        // Integer num = (Integer) rawList.get(1); // ClassCastException

        // 使用泛型
        List<String> genericList = new ArrayList<>();
        genericList.add("Hello");
        // genericList.add(123); // 编译错误
        String genericStr = genericList.get(0); // 不需要类型转换

        // ============ 自定义泛型类 ============
        Box<String> stringBox = new Box<>("Hello");
        System.out.println(stringBox.get()); // Hello

        Box<Integer> integerBox = new Box<>(123);
        System.out.println(integerBox.get()); // 123

        // ============ 泛型方法 ============
        String[] stringArray = {"Hello", "World"};
        String first = getFirst(stringArray);
        System.out.println("First: " + first);

        Integer[] intArray = {1, 2, 3};
        Integer firstInt = getFirst(intArray);
        System.out.println("First int: " + firstInt);

        // ============ 类型擦除演示 ============
        List<String> stringList = new ArrayList<>();
        List<Integer> integerList = new ArrayList<>();

        // 运行时类型擦除
        System.out.println(stringList.getClass() == integerList.getClass()); // true

        // 不能创建泛型数组
        // List<String>[] stringLists = new List<String>[10]; // 编译错误

        // 可以创建通配符数组
        List<?>[] wildcardLists = new List<?>[10];

        // ============ 泛型边界 ============
        NumberBox<Integer> integerNumberBox = new NumberBox<>(123);
        System.out.println("Double value: " + integerNumberBox.doubleValue());

        NumberBox<Double> doubleNumberBox = new NumberBox<>(3.14);
        System.out.println("Double value: " + doubleNumberBox.doubleValue());

        // ============ 泛型在集合中的应用 ============
        Map<String, Integer> map = new HashMap<>();
        map.put("One", 1);
        map.put("Two", 2);
        map.put("Three", 3);

        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }

        // ============ 泛型类型推断 ============
        // Java 7+ 钻石操作符
        List<String> inferredList = new ArrayList<>(); // 推断为String

        // Java 10+ var关键字
        var varList = new ArrayList<String>(); // 推断为ArrayList<String>
    }

    // 泛型方法
    public static <T> T getFirst(T[] array) {
        if (array == null || array.length == 0) {
            return null;
        }
        return array[0];
    }
}

// 自定义泛型类
class Box<T> {
    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }

    public void set(T value) {
        this.value = value;
    }
}

// 泛型边界
class NumberBox<T extends Number> {
    private T value;

    public NumberBox(T value) {
        this.value = value;
    }

    public T get() {
        return value;
    }

    public double doubleValue() {
        return value.doubleValue();
    }
}
```

#### ⭐ 面试高频问题

**Q1: 泛型的作用是什么？**
- 编译时类型检查
- 避免类型转换
- 提高代码复用性

**Q2: 什么是类型擦除？**
- 编译时检查类型
- 运行时擦除类型信息
- 泛型类型变为Object或边界类型

**Q3: 为什么不能创建泛型数组？**
- 类型擦除后，数组类型信息丢失
- 可能导致类型安全问题

**Q4: 泛型在运行时还存在吗？**
- 不存在，类型擦除
- 但可以通过反射获取部分信息

#### 与React对比

```javascript
// JavaScript没有泛型
// TypeScript有泛型

// TypeScript泛型
function identity<T>(arg: T): T {
    return arg;
}

const num = identity<number>(123);
const str = identity<string>("hello");

// React中的泛型组件
interface Props<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: Props<T>) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{renderItem(item)}</li>
            ))}
        </ul>
    );
}

// 使用泛型组件
interface User {
    id: number;
    name: string;
}

function UserList({ users }: { users: User[] }) {
    return (
        <List
            items={users}
            renderItem={(user) => <span>{user.name}</span>}
        />
    );
}
```

---

### 3.2 上界通配符 <? extends T> vs 下界通配符 <? super T>（PECS原则）

#### 概念讲解

**上界通配符（<? extends T>）**
- T或T的子类
- 只能读取，不能写入
- 生产者（Producer）

**下界通配符（<? super T>）**
- T或T的父类
- 只能写入，不能读取
- 消费者（Consumer）

**PECS原则**
- Producer Extends, Consumer Super
- 生产者使用extends
- 消费者使用super

#### 代码示例

```java
import java.util.*;

public class WildcardDemo {
    public static void main(String[] args) {
        // ============ 上界通配符 <? extends T> ============
        List<Integer> intList = Arrays.asList(1, 2, 3);
        List<Double> doubleList = Arrays.asList(1.1, 2.2, 3.3);
        List<Number> numberList = new ArrayList<>();

        // 上界通配符：可以读取
        printNumbers(intList);
        printNumbers(doubleList);
        printNumbers(numberList);

        // 上界通配符：不能写入
        List<? extends Number> extendsList = intList;
        Number num = extendsList.get(0); // 可以读取
        // extendsList.add(123); // 编译错误，不能写入

        // ============ 下界通配符 <? super T> ============
        List<Number> superNumberList = new ArrayList<>();
        List<Object> objectList = new ArrayList<>();

        // 下界通配符：可以写入
        addNumbers(superNumberList);
        addNumbers(objectList);

        // 下界通配符：读取受限
        List<? super Integer> superList = superNumberList;
        superList.add(123); // 可以写入Integer
        // Integer i = superList.get(0); // 编译错误，只能读取为Object
        Object obj = superList.get(0); // 可以读取为Object

        // ============ PECS原则 ============
        List<Integer> source = Arrays.asList(1, 2, 3);
        List<Number> dest = new ArrayList<>();

        // Producer Extends：生产者使用extends
        copyFromSource(source, dest);

        // Consumer Super：消费者使用super
        copyToDest(source, dest);

        // ============ 实际应用 ============
        // 1. Collections.max()：使用extends
        List<Integer> numbers = Arrays.asList(1, 2, 3);
        Integer max = Collections.max(numbers);

        // 2. Collections.addAll()：使用super
        List<Number> target = new ArrayList<>();
        Collections.addAll(target, 1, 2, 3);

        // 3. 泛型方法中的通配符
        List<String> strings = Arrays.asList("Hello", "World");
        List<Integer> integers = Arrays.asList(1, 2, 3);

        printList(strings);
        printList(integers);
    }

    // 上界通配符：生产者（只读）
    public static void printNumbers(List<? extends Number> list) {
        for (Number num : list) {
            System.out.println(num);
        }
    }

    // 下界通配符：消费者（只写）
    public static void addNumbers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
        list.add(3);
    }

    // PECS原则
    public static <T> void copyFromSource(List<? extends T> source, List<? super T> dest) {
        for (T item : source) {
            dest.add(item);
        }
    }

    public static <T> void copyToDest(List<? extends T> source, List<? super T> dest) {
        for (T item : source) {
            dest.add(item);
        }
    }

    // 无界通配符
    public static void printList(List<?> list) {
        for (Object item : list) {
            System.out.println(item);
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: <? extends T> 和 <? super T> 的区别是什么？**
- <? extends T>：上界，T或T的子类，只读
- <? super T>：下界，T或T的父类，只写

**Q2: 什么是PECS原则？**
- Producer Extends, Consumer Super
- 生产者使用extends
- 消费者使用super

**Q3: 为什么上界通配符不能写入？**
- 编译器无法确定具体类型
- 可能导致类型安全问题

**Q4: 无界通配符<?>的作用是什么？**
- 表示未知类型
- 只能读取为Object
- 不能写入（除了null）

#### 与React对比

```javascript
// TypeScript中的泛型约束
interface Animal {
    name: string;
}

interface Dog extends Animal {
    breed: string;
}

// 上界约束（类似<? extends T>）
function printName<T extends Animal>(animal: T) {
    console.log(animal.name);
}

printName({ name: 'Buddy' });
printName({ name: 'Buddy', breed: 'Golden' });

// React中的泛型约束
interface Props<T extends { id: number }> {
    items: T[];
    selectedId: number;
}

function List<T extends { id: number }>({ items, selectedId }: Props<T>) {
    return (
        <ul>
            {items.map(item => (
                <li key={item.id} style={{ color: item.id === selectedId ? 'red' : 'black' }}>
                    {item.id}
                </li>
            ))}
        </ul>
    );
}

interface User {
    id: number;
    name: string;
}

function UserList() {
    const users: User[] = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
    ];

    return <List items={users} selectedId={1} />;
}
```

---

### 3.3 泛型类、泛型方法、泛型接口

#### 概念讲解

**泛型类**
- 类名后添加类型参数
- 可以在类中使用类型参数
- 创建实例时指定具体类型

**泛型方法**
- 方法返回类型前添加类型参数
- 可以独立于类的类型参数
- 调用时可以推断类型

**泛型接口**
- 接口名后添加类型参数
- 实现类可以指定具体类型
- 也可以保持泛型

#### 代码示例

```java
import java.util.*;

public class GenericClassMethodInterfaceDemo {
    public static void main(String[] args) {
        // ============ 泛型类 ============
        GenericContainer<String> stringContainer = new GenericContainer<>("Hello");
        System.out.println(stringContainer.getValue()); // Hello

        GenericContainer<Integer> integerContainer = new GenericContainer<>(123);
        System.out.println(integerContainer.getValue()); // 123

        // 多个类型参数
        Pair<String, Integer> pair = new Pair<>("Age", 30);
        System.out.println(pair.getKey() + ": " + pair.getValue()); // Age: 30

        // ============ 泛型方法 ============
        String[] strings = {"Hello", "World"};
        String firstString = GenericUtils.getFirst(strings);
        System.out.println("First string: " + firstString);

        Integer[] integers = {1, 2, 3};
        Integer firstInteger = GenericUtils.getFirst(integers);
        System.out.println("First integer: " + firstInteger);

        // 类型推断
        String inferred = GenericUtils.getFirst(strings);

        // ============ 泛型接口 ============
        // 实现泛型接口，指定具体类型
        StringRepository stringRepo = new StringRepository();
        stringRepo.save("Hello");
        System.out.println(stringRepo.get(0)); // Hello

        // 实现泛型接口，保持泛型
        GenericRepository<Integer> intRepo = new GenericRepositoryImpl<>();
        intRepo.save(123);
        System.out.println(intRepo.get(0)); // 123

        // ============ 泛型在集合中的应用 ============
        List<String> stringList = new ArrayList<>();
        stringList.add("Hello");
        stringList.add("World");

        Map<String, Integer> stringIntMap = new HashMap<>();
        stringIntMap.put("One", 1);
        stringIntMap.put("Two", 2);

        Set<Integer> intSet = new HashSet<>();
        intSet.add(1);
        intSet.add(2);
        intSet.add(3);

        // ============ 泛型边界 ============
        Box<Number> numberBox = new Box<>(123);
        System.out.println(numberBox.getValue());

        // Box<String> stringBox = new Box<>("Hello"); // 编译错误
    }
}

// 泛型类
class GenericContainer<T> {
    private T value;

    public GenericContainer(T value) {
        this.value = value;
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }
}

// 多个类型参数
class Pair<K, V> {
    private K key;
    private V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() {
        return key;
    }

    public V getValue() {
        return value;
    }
}

// 泛型方法
class GenericUtils {
    public static <T> T getFirst(T[] array) {
        if (array == null || array.length == 0) {
            return null;
        }
        return array[0];
    }

    public static <T> List<T> asList(T... items) {
        List<T> list = new ArrayList<>();
        Collections.addAll(list, items);
        return list;
    }

    public static <T extends Comparable<T>> T max(T[] array) {
        if (array == null || array.length == 0) {
            return null;
        }

        T max = array[0];
        for (T item : array) {
            if (item.compareTo(max) > 0) {
                max = item;
            }
        }
        return max;
    }
}

// 泛型接口
interface GenericRepository<T> {
    void save(T item);
    T get(int index);
    List<T> getAll();
}

// 实现泛型接口，指定具体类型
class StringRepository implements GenericRepository<String> {
    private List<String> items = new ArrayList<>();

    @Override
    public void save(String item) {
        items.add(item);
    }

    @Override
    public String get(int index) {
        return items.get(index);
    }

    @Override
    public List<String> getAll() {
        return new ArrayList<>(items);
    }
}

// 实现泛型接口，保持泛型
class GenericRepositoryImpl<T> implements GenericRepository<T> {
    private List<T> items = new ArrayList<>();

    @Override
    public void save(T item) {
        items.add(item);
    }

    @Override
    public T get(int index) {
        return items.get(index);
    }

    @Override
    public List<T> getAll() {
        return new ArrayList<>(items);
    }
}

// 泛型边界
class Box<T extends Number> {
    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T getValue() {
        return value;
    }

    public double doubleValue() {
        return value.doubleValue();
    }
}
```

#### ⭐ 面试高频问题

**Q1: 泛型类和泛型方法的区别是什么？**
- 泛型类：整个类使用类型参数
- 泛型方法：只有方法使用类型参数

**Q2: 泛型方法的类型参数如何推断？**
- 根据参数类型自动推断
- 可以显式指定类型参数

**Q3: 泛型接口的实现方式有哪些？**
- 指定具体类型
- 保持泛型

**Q4: 泛型边界的作用是什么？**
- 限制类型参数的范围
- 提供更多的类型信息

#### 与React对比

```javascript
// TypeScript中的泛型类
class GenericContainer<T> {
    private value: T;

    constructor(value: T) {
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }

    setValue(value: T): void {
        this.value = value;
    }
}

const stringContainer = new GenericContainer<string>("Hello");
const numberContainer = new GenericContainer<number>(123);

// TypeScript中的泛型方法
function getFirst<T>(array: T[]): T | null {
    if (array.length === 0) {
        return null;
    }
    return array[0];
}

const firstString = getFirst(["Hello", "World"]);
const firstNumber = getFirst([1, 2, 3]);

// React中的泛型组件
interface Props<T> {
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: Props<T>) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{renderItem(item)}</li>
            ))}
        </ul>
    );
}

// 使用泛型组件
interface User {
    id: number;
    name: string;
}

function UserList({ users }: { users: User[] }) {
    return (
        <List
            items={users}
            renderItem={(user) => <span>{user.name}</span>}
        />
    );
}
```

---

### 3.4 泛型在集合中的应用

#### 概念讲解

**泛型集合**
- List、Set、Map等集合类
- 编译时类型检查
- 避免类型转换
- 提高代码安全性

#### 代码示例

```java
import java.util.*;

public class GenericCollectionsDemo {
    public static void main(String[] args) {
        // ============ List ============
        List<String> stringList = new ArrayList<>();
        stringList.add("Hello");
        stringList.add("World");
        // stringList.add(123); // 编译错误

        for (String str : stringList) {
            System.out.println(str);
        }

        // ============ Set ============
        Set<Integer> intSet = new HashSet<>();
        intSet.add(1);
        intSet.add(2);
        intSet.add(3);
        intSet.add(1); // 重复元素不会被添加

        System.out.println("Set size: " + intSet.size()); // 3

        // ============ Map ============
        Map<String, Integer> stringIntMap = new HashMap<>();
        stringIntMap.put("One", 1);
        stringIntMap.put("Two", 2);
        stringIntMap.put("Three", 3);

        for (Map.Entry<String, Integer> entry : stringIntMap.entrySet()) {
            System.out.println(entry.getKey() + ": " + entry.getValue());
        }

        // ============ 泛型集合的嵌套 ============
        List<List<String>> nestedList = new ArrayList<>();
        List<String> row1 = Arrays.asList("A", "B", "C");
        List<String> row2 = Arrays.asList("D", "E", "F");
        nestedList.add(row1);
        nestedList.add(row2);

        for (List<String> row : nestedList) {
            for (String cell : row) {
                System.out.print(cell + " ");
            }
            System.out.println();
        }

        // ============ 泛型集合的工具方法 ============
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

        // 排序
        Collections.sort(numbers);
        System.out.println("Sorted: " + numbers);

        // 反转
        Collections.reverse(numbers);
        System.out.println("Reversed: " + numbers);

        // 打乱
        Collections.shuffle(numbers);
        System.out.println("Shuffled: " + numbers);

        // 二分查找
        Collections.sort(numbers);
        int index = Collections.binarySearch(numbers, 3);
        System.out.println("Index of 3: " + index);

        // ============ 泛型集合的转换 ============
        List<String> stringList2 = Arrays.asList("1", "2", "3");
        List<Integer> intList = new ArrayList<>();

        for (String str : stringList2) {
            intList.add(Integer.parseInt(str));
        }

        System.out.println("Converted: " + intList);

        // ============ 泛型集合的流式操作 ============
        List<String> names = Arrays.asList("John", "Jane", "Bob", "Alice");

        // 过滤
        List<String> filteredNames = names.stream()
            .filter(name -> name.length() > 3)
            .collect(Collectors.toList());

        System.out.println("Filtered: " + filteredNames);

        // 映射
        List<Integer> nameLengths = names.stream()
            .map(String::length)
            .collect(Collectors.toList());

        System.out.println("Lengths: " + nameLengths);

        // 排序
        List<String> sortedNames = names.stream()
            .sorted()
            .collect(Collectors.toList());

        System.out.println("Sorted: " + sortedNames);

        // ============ 泛型集合的比较器 ============
        List<Person> people = Arrays.asList(
            new Person("John", 30),
            new Person("Jane", 25),
            new Person("Bob", 35)
        );

        // 按年龄排序
        people.sort(Comparator.comparing(Person::getAge));
        System.out.println("Sorted by age: " + people);

        // 按姓名排序
        people.sort(Comparator.comparing(Person::getName));
        System.out.println("Sorted by name: " + people);

        // 多条件排序
        people.sort(Comparator.comparing(Person::getAge)
            .thenComparing(Person::getName));
        System.out.println("Multi-sorted: " + people);
    }
}

class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    @Override
    public String toString() {
        return "Person{name='" + name + "', age=" + age + "}";
    }
}
```

#### ⭐ 面试高频问题

**Q1: 泛型集合的好处是什么？**
- 编译时类型检查
- 避免类型转换
- 提高代码安全性

**Q2: List<String>和List<Object>有什么区别？**
- List<String>只能存储String
- List<Object>可以存储任何对象
- List<String>不是List<Object>的子类型

**Q3: 为什么不能创建泛型数组？**
- 类型擦除后，数组类型信息丢失
- 可能导致类型安全问题

**Q4: 泛型集合的null值如何处理？**
- 泛型集合可以存储null
- 需要显式检查null值

#### 与React对比

```javascript
// TypeScript中的泛型集合
const stringList: string[] = ["Hello", "World"];
const numberSet: Set<number> = new Set([1, 2, 3]);
const stringMap: Map<string, number> = new Map([
    ["One", 1],
    ["Two", 2]
]);

// React中的泛型集合
function ListComponent<T>({ items }: { items: T[] }) {
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{String(item)}</li>
            ))}
        </ul>
    );
}

// 使用泛型组件
interface User {
    id: number;
    name: string;
}

function UserList({ users }: { users: User[] }) {
    return (
        <ListComponent items={users} />
    );
}

// React中的泛型Hook
function useGenericState<T>(initialValue: T): [T, (value: T) => void] {
    const [value, setValue] = useState<T>(initialValue);
    return [value, setValue];
}

function Counter() {
    const [count, setCount] = useGenericState<number>(0);

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
    );
}
```

---


---

## 七、IO 流与 NIO

### 7.1 字节流 vs 字符流

#### 概念讲解

**字节流（Byte Stream）**
- 以字节为单位读写
- 适用于所有类型的数据（二进制、文本、图片等）
- 基类：InputStream、OutputStream

**字符流（Character Stream）**
- 以字符为单位读写
- 只适用于文本数据
- 自动处理字符编码
- 基类：Reader、Writer

#### 代码示例

```java
import java.io.*;

public class StreamDemo {
    public static void main(String[] args) throws Exception {
        // ============ 字节流 ============
        // 文件复制（字节流）
        byteStreamCopy("source.txt", "dest.txt");

        // 缓冲字节流
        bufferedByteStreamCopy("source.txt", "dest2.txt");

        // ============ 字符流 ============
        // 文件读取（字符流）
        charStreamRead("source.txt");

        // 缓冲字符流
        bufferedCharStreamRead("source.txt");

        // 文件写入（字符流）
        charStreamWrite("output.txt", "Hello, World!\nThis is a test.");

        // ============ 转换流 ============
        // InputStreamReader：字节流 → 字符流
        // OutputStreamWriter：字符流 → 字节流
        conversionStream("source.txt");

        // ============ 打印流 ============
        printStream("output.txt");
    }

    // 字节流复制
    public static void byteStreamCopy(String src, String dest) throws IOException {
        try (FileInputStream fis = new FileInputStream(src);
             FileOutputStream fos = new FileOutputStream(dest)) {

            int b;
            while ((b = fis.read()) != -1) {
                fos.write(b);
            }
        }
    }

    // 缓冲字节流复制（推荐）
    public static void bufferedByteStreamCopy(String src, String dest) throws IOException {
        try (BufferedInputStream bis = new BufferedInputStream(new FileInputStream(src));
             BufferedOutputStream bos = new BufferedOutputStream(new FileOutputStream(dest))) {

            byte[] buffer = new byte[1024];
            int len;
            while ((len = bis.read(buffer)) != -1) {
                bos.write(buffer, 0, len);
            }
        }
    }

    // 字符流读取
    public static void charStreamRead(String filename) throws IOException {
        try (FileReader reader = new FileReader(filename)) {
            int ch;
            while ((ch = reader.read()) != -1) {
                System.out.print((char) ch);
            }
        }
    }

    // 缓冲字符流读取（推荐）
    public static void bufferedCharStreamRead(String filename) throws IOException {
        try (BufferedReader reader = new BufferedReader(new FileReader(filename))) {
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        }
    }

    // 字符流写入
    public static void charStreamWrite(String filename, String content) throws IOException {
        try (FileWriter writer = new FileWriter(filename)) {
            writer.write(content);
        }
    }

    // 转换流（指定编码）
    public static void conversionStream(String filename) throws IOException {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new FileInputStream(filename), "UTF-8"));
             BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(new FileOutputStream("output_utf8.txt"), "UTF-8"))) {

            String line;
            while ((line = reader.readLine()) != null) {
                writer.write(line);
                writer.newLine();
            }
        }
    }

    // 打印流
    public static void printStream(String filename) throws IOException {
        try (PrintStream ps = new PrintStream(new FileOutputStream(filename));
             PrintWriter pw = new PrintWriter(new FileWriter(filename, true))) {

            ps.println("PrintStream output");
            ps.printf("Formatted: %s, %d%n", "Hello", 123);

            pw.println("PrintWriter output");
            pw.printf("Formatted: %s, %d%n", "World", 456);
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 字节流和字符流的区别是什么？**
- 字节流：以字节为单位，适用于所有数据
- 字符流：以字符为单位，只适用于文本

**Q2: 为什么要有缓冲流？**
- 减少IO操作次数
- 提高性能
- 默认缓冲区大小8192字节

**Q3: InputStreamReader的作用是什么？**
- 字节流到字符流的桥梁
- 可以指定字符编码

**Q4: 字节流能读取文本文件吗？**
- 可以，但需要处理编码问题
- 推荐使用字符流读取文本文件

#### 与React对比

```javascript
// JavaScript中的文件读取
// Node.js
const fs = require('fs');

// 同步读取
const data = fs.readFileSync('file.txt', 'utf-8');

// 异步读取
fs.readFile('file.txt', 'utf-8', (err, data) => {
    if (err) throw err;
    console.log(data);
});

// 流式读取
const readStream = fs.createReadStream('file.txt');
const writeStream = fs.createWriteStream('output.txt');
readStream.pipe(writeStream);

// React中的文件上传
function FileUpload() {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            console.log('File content:', event.target.result);
        };

        reader.readAsText(file);
    };

    return <input type="file" onChange={handleFileChange} />;
}
```

---

### 7.2 BIO、NIO、AIO 的区别与应用场景

#### 概念讲解

**BIO（Blocking IO）**
- 同步阻塞IO
- 一个连接一个线程
- 简单但扩展性差
- 适用于连接数少的场景

**NIO（Non-blocking IO）**
- 同步非阻塞IO
- 一个线程处理多个连接
- Selector多路复用
- 适用于连接数多但活跃少的场景

**AIO（Asynchronous IO）**
- 异步非阻塞IO
- 回调机制
- Java 7引入
- 适用于高并发场景

#### 代码示例

```java
import java.io.*;
import java.net.*;
import java.nio.*;
import java.nio.channels.*;
import java.util.*;
import java.util.concurrent.*;

public class BioNioAioDemo {
    public static void main(String[] args) throws Exception {
        // BIO、NIO、AIO的对比说明
        System.out.println("===== IO模型对比 =====");
        System.out.println("BIO: 同步阻塞 - 适用于连接数少的场景");
        System.out.println("NIO: 同步非阻塞 - 适用于连接数多但活跃少的场景");
        System.out.println("AIO: 异步非阻塞 - 适用于高并发场景");
    }
}

// ============ BIO服务器 ============
class BioServer {
    public static void start(int port) throws IOException {
        ServerSocket serverSocket = new ServerSocket(port);
        System.out.println("BIO Server started on port " + port);

        while (true) {
            Socket socket = serverSocket.accept(); // 阻塞等待连接
            System.out.println("Client connected: " + socket.getRemoteSocketAddress());

            // 每个连接一个线程
            new Thread(() -> handleClient(socket)).start();
        }
    }

    private static void handleClient(Socket socket) {
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(socket.getInputStream()));
             PrintWriter writer = new PrintWriter(
                socket.getOutputStream(), true)) {

            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println("Received: " + line);
                writer.println("Echo: " + line);

                if ("bye".equalsIgnoreCase(line)) {
                    break;
                }
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            try {
                socket.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

// ============ NIO服务器 ============
class NioServer {
    public static void start(int port) throws IOException {
        Selector selector = Selector.open();
        ServerSocketChannel serverChannel = ServerSocketChannel.open();
        serverChannel.configureBlocking(false);
        serverChannel.bind(new InetSocketAddress(port));
        serverChannel.register(selector, SelectionKey.OP_ACCEPT);

        System.out.println("NIO Server started on port " + port);

        while (true) {
            selector.select(); // 阻塞等待事件

            Set<SelectionKey> selectedKeys = selector.selectedKeys();
            Iterator<SelectionKey> keyIterator = selectedKeys.iterator();

            while (keyIterator.hasNext()) {
                SelectionKey key = keyIterator.next();
                keyIterator.remove();

                if (key.isAcceptable()) {
                    handleAccept(selector, serverChannel);
                } else if (key.isReadable()) {
                    handleRead(key);
                }
            }
        }
    }

    private static void handleAccept(Selector selector, ServerSocketChannel serverChannel)
            throws IOException {
        SocketChannel channel = serverChannel.accept();
        channel.configureBlocking(false);
        channel.register(selector, SelectionKey.OP_READ);
        System.out.println("Client connected: " + channel.getRemoteAddress());
    }

    private static void handleRead(SelectionKey key) throws IOException {
        SocketChannel channel = (SocketChannel) key.channel();
        ByteBuffer buffer = ByteBuffer.allocate(1024);

        int bytesRead = channel.read(buffer);
        if (bytesRead == -1) {
            channel.close();
            return;
        }

        buffer.flip();
        byte[] data = new byte[buffer.limit()];
        buffer.get(data);
        String message = new String(data);
        System.out.println("Received: " + message);

        // 回复
        ByteBuffer response = ByteBuffer.wrap(("Echo: " + message).getBytes());
        channel.write(response);
    }
}

// ============ AIO服务器 ============
class AioServer {
    private AsynchronousServerSocketChannel serverChannel;

    public void start(int port) throws IOException, InterruptedException {
        AsynchronousChannelGroup group = AsynchronousChannelGroup.withThreadPool(
            Executors.newFixedThreadPool(4));

        serverChannel = AsynchronousServerSocketChannel.open(group);
        serverChannel.bind(new InetSocketAddress(port));
        System.out.println("AIO Server started on port " + port);

        serverChannel.accept(null, new CompletionHandler<AsynchronousSocketChannel, Void>() {
            @Override
            public void completed(AsynchronousSocketChannel channel, Void attachment) {
                // 继续接受新连接
                serverChannel.accept(null, this);
                handleClient(channel);
            }

            @Override
            public void failed(Throwable exc, Void attachment) {
                exc.printStackTrace();
            }
        });

        Thread.sleep(Long.MAX_VALUE);
    }

    private void handleClient(AsynchronousSocketChannel channel) {
        ByteBuffer buffer = ByteBuffer.allocate(1024);

        channel.read(buffer, null, new CompletionHandler<Integer, Void>() {
            @Override
            public void completed(Integer bytesRead, Void attachment) {
                if (bytesRead == -1) {
                    try {
                        channel.close();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                    return;
                }

                buffer.flip();
                String message = new String(buffer.array(), 0, bytesRead);
                System.out.println("Received: " + message);

                // 回复
                ByteBuffer response = ByteBuffer.wrap(("Echo: " + message).getBytes());
                channel.write(response, null, new CompletionHandler<Integer, Void>() {
                    @Override
                    public void completed(Integer result, Void attachment) {
                        // 继续读取
                        buffer.clear();
                        channel.read(buffer, null, this);
                    }

                    @Override
                    public void failed(Throwable exc, Void attachment) {
                        exc.printStackTrace();
                    }
                });
            }

            @Override
            public void failed(Throwable exc, Void attachment) {
                exc.printStackTrace();
            }
        });
    }
}
```

#### ⭐ 面试高频问题

**Q1: BIO、NIO、AIO的区别是什么？**
- BIO：同步阻塞，一个连接一个线程
- NIO：同步非阻塞，一个线程处理多个连接
- AIO：异步非阻塞，回调机制

**Q2: NIO的Selector是什么？**
- 多路复用器
- 一个线程管理多个Channel
- 检查哪些Channel有事件就绪

**Q3: 什么场景使用BIO，什么场景使用NIO？**
- BIO：连接数少、数据传输量大
- NIO：连接数多、但每个连接活跃度低

**Q4: Netty使用的是BIO还是NIO？**
- Netty底层使用NIO
- 封装了NIO的复杂性
- 提供了更高层的API

#### 与React对比

```javascript
// Node.js中的IO模型
// Node.js使用事件循环 + 非阻塞IO（类似NIO）

// 非阻塞IO
const fs = require('fs');

// 非阻塞读取
fs.readFile('file.txt', 'utf-8', (err, data) => {
    console.log('File read:', data);
});
console.log('This runs first'); // 非阻塞

// Promise（类似AIO的回调）
const readFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });
};

// async/await
async function main() {
    const data = await readFile('file.txt');
    console.log(data);
}

// React中的数据获取（类似AIO）
function DataComponent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data')
            .then(res => res.json())
            .then(data => {
                setData(data);
                setLoading(false);
            });
    }, []);

    return loading ? <div>Loading...</div> : <div>{data}</div>;
}
```

---

### 7.3 NIO 核心组件（Channel、Buffer、Selector）

#### 概念讲解

**Channel（通道）**
- 双向数据传输
- 可以异步读写
- 常见实现：FileChannel、SocketChannel、ServerSocketChannel

**Buffer（缓冲区）**
- 数据容器
- 核心属性：capacity、position、limit
- 常见实现：ByteBuffer、CharBuffer、IntBuffer

**Selector（选择器）**
- 多路复用器
- 检查Channel的就绪状态
- 事件类型：OP_ACCEPT、OP_CONNECT、OP_READ、OP_WRITE

#### 代码示例

```java
import java.nio.*;
import java.nio.channels.*;
import java.nio.file.*;
import java.io.*;

public class NioCoreDemo {
    public static void main(String[] args) throws Exception {
        // ============ Buffer基本操作 ============
        bufferDemo();

        // ============ FileChannel ============
        fileChannelDemo();

        // ============ Buffer类型 ============
        bufferTypes();
    }

    // Buffer基本操作
    public static void bufferDemo() {
        System.out.println("===== Buffer基本操作 =====");

        // 创建Buffer
        ByteBuffer buffer = ByteBuffer.allocate(1024);
        System.out.println("Initial: capacity=" + buffer.capacity()
            + ", limit=" + buffer.limit()
            + ", position=" + buffer.position());

        // 写入数据
        buffer.put("Hello".getBytes());
        System.out.println("After put: capacity=" + buffer.capacity()
            + ", limit=" + buffer.limit()
            + ", position=" + buffer.position());

        // 切换为读模式
        buffer.flip();
        System.out.println("After flip: capacity=" + buffer.capacity()
            + ", limit=" + buffer.limit()
            + ", position=" + buffer.position());

        // 读取数据
        byte[] data = new byte[buffer.limit()];
        buffer.get(data);
        System.out.println("Read: " + new String(data));

        // 清空Buffer
        buffer.clear();
        System.out.println("After clear: capacity=" + buffer.capacity()
            + ", limit=" + buffer.limit()
            + ", position=" + buffer.position());

        // compact()：保留未读数据
        buffer.put("Hello World".getBytes());
        buffer.flip();
        byte[] first = new byte[5];
        buffer.get(first); // 读取"Hello"
        System.out.println("First read: " + new String(first));
        buffer.compact(); // 保留" World"
        buffer.flip();
        byte[] remaining = new byte[buffer.limit()];
        buffer.get(remaining);
        System.out.println("Remaining: " + new String(remaining)); // " World"
    }

    // FileChannel操作
    public static void fileChannelDemo() throws IOException {
        System.out.println("\n===== FileChannel =====");

        // 写入文件
        try (FileChannel writeChannel = FileChannel.open(
                Paths.get("nio_output.txt"),
                StandardOpenOption.CREATE,
                StandardOpenOption.WRITE)) {

            ByteBuffer buffer = ByteBuffer.wrap("Hello, NIO!".getBytes());
            writeChannel.write(buffer);
        }

        // 读取文件
        try (FileChannel readChannel = FileChannel.open(
                Paths.get("nio_output.txt"),
                StandardOpenOption.READ)) {

            ByteBuffer buffer = ByteBuffer.allocate(1024);
            int bytesRead = readChannel.read(buffer);

            buffer.flip();
            byte[] data = new byte[buffer.limit()];
            buffer.get(data);
            System.out.println("File content: " + new String(data));
        }

        // 文件复制
        try (FileChannel srcChannel = FileChannel.open(
                Paths.get("nio_output.txt"), StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(
                Paths.get("nio_copy.txt"),
                StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {

            destChannel.transferFrom(srcChannel, 0, srcChannel.size());
            System.out.println("File copied");
        }

        // 文件复制（transferTo）
        try (FileChannel srcChannel = FileChannel.open(
                Paths.get("nio_output.txt"), StandardOpenOption.READ);
             FileChannel destChannel = FileChannel.open(
                Paths.get("nio_copy2.txt"),
                StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {

            srcChannel.transferTo(0, srcChannel.size(), destChannel);
            System.out.println("File copied (transferTo)");
        }
    }

    // Buffer类型
    public static void bufferTypes() {
        System.out.println("\n===== Buffer类型 =====");

        // ByteBuffer
        ByteBuffer byteBuffer = ByteBuffer.allocate(1024);

        // CharBuffer
        CharBuffer charBuffer = CharBuffer.allocate(1024);
        charBuffer.put("Hello");
        charBuffer.flip();
        System.out.println("CharBuffer: " + charBuffer.toString());

        // IntBuffer
        IntBuffer intBuffer = IntBuffer.allocate(10);
        intBuffer.put(new int[]{1, 2, 3, 4, 5});
        intBuffer.flip();
        while (intBuffer.hasRemaining()) {
            System.out.print(intBuffer.get() + " ");
        }
        System.out.println();

        // DirectBuffer（直接缓冲区）
        ByteBuffer directBuffer = ByteBuffer.allocateDirect(1024);
        System.out.println("DirectBuffer: " + (directBuffer.isDirect() ? "Yes" : "No"));

        // MappedByteBuffer（内存映射文件）
        try (FileChannel channel = FileChannel.open(
                Paths.get("nio_output.txt"), StandardOpenOption.READ)) {

            MappedByteBuffer mappedBuffer = channel.map(
                FileChannel.MapMode.READ_ONLY, 0, channel.size());

            byte[] data = new byte[(int) channel.size()];
            mappedBuffer.get(data);
            System.out.println("MappedByteBuffer: " + new String(data));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: Buffer的三个核心属性是什么？**
- capacity：容量，创建时确定
- position：当前位置，读写操作会移动
- limit：限制，读模式时表示可读数据量

**Q2: flip()和clear()的区别是什么？**
- flip()：切换为读模式，limit=position，position=0
- clear()：清空Buffer，position=0，limit=capacity

**Q3: 直接缓冲区和非直接缓冲区的区别？**
- 直接缓冲区：使用堆外内存，减少一次拷贝
- 非直接缓冲区：使用堆内存，需要拷贝到内核

**Q4: Selector的工作原理是什么？**
- 注册Channel到Selector
- Selector轮询检查就绪事件
- 返回就绪的SelectionKey集合

#### 与React对比

```javascript
// JavaScript中的Buffer（Node.js）
const buffer = Buffer.from('Hello');
console.log(buffer.toString()); // 'Hello'
console.log(buffer.length); // 5

// Buffer操作
const buf = Buffer.alloc(10);
buf.write('Hello');
console.log(buf.toString()); // 'Hello'

// React中的数据缓冲
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
```

---

### 7.4 FileChannel 与内存映射文件（MappedByteBuffer）

#### 概念讲解

**FileChannel**
- 文件读写通道
- 支持文件锁定
- 支持内存映射

**MappedByteBuffer**
- 将文件映射到内存
- 零拷贝技术
- 适用于大文件操作

#### 代码示例

```java
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.nio.file.*;

public class MappedFileDemo {
    public static void main(String[] args) throws Exception {
        // ============ 内存映射文件 ============
        memoryMappedFile();

        // ============ 文件锁定 ============
        fileLock();

        // ============ 大文件操作 ============
        largeFileOperation();
    }

    // 内存映射文件
    public static void memoryMappedFile() throws IOException {
        System.out.println("===== 内存映射文件 =====");

        // 写入
        try (RandomAccessFile file = new RandomAccessFile("mapped.txt", "rw");
             FileChannel channel = file.getChannel()) {

            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, 1024);

            buffer.put("Hello, Memory Mapped File!".getBytes());
            System.out.println("Data written to mapped file");
        }

        // 读取
        try (RandomAccessFile file = new RandomAccessFile("mapped.txt", "r");
             FileChannel channel = file.getChannel()) {

            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_ONLY, 0, channel.size());

            byte[] data = new byte[(int) channel.size()];
            buffer.get(data);
            System.out.println("Mapped file content: " + new String(data));
        }
    }

    // 文件锁定
    public static void fileLock() throws IOException {
        System.out.println("\n===== 文件锁定 =====");

        try (RandomAccessFile file = new RandomAccessFile("lock.txt", "rw");
             FileChannel channel = file.getChannel()) {

            // 获取独占锁
            FileLock lock = channel.lock();
            System.out.println("File locked");

            try {
                // 临界区操作
                ByteBuffer buffer = ByteBuffer.wrap("Locked data".getBytes());
                channel.write(buffer);
                System.out.println("Data written while locked");
            } finally {
                lock.release();
                System.out.println("File unlocked");
            }
        }
    }

    // 大文件操作
    public static void largeFileOperation() throws IOException {
        System.out.println("\n===== 大文件操作 =====");

        // 创建大文件
        long fileSize = 100 * 1024 * 1024; // 100MB
        try (RandomAccessFile file = new RandomAccessFile("large.dat", "rw");
             FileChannel channel = file.getChannel()) {

            MappedByteBuffer buffer = channel.map(
                FileChannel.MapMode.READ_WRITE, 0, fileSize);

            // 写入数据
            long start = System.currentTimeMillis();
            for (int i = 0; i < fileSize / 8; i++) {
                buffer.putLong(i);
            }
            long writeTime = System.currentTimeMillis() - start;
            System.out.println("Write time: " + writeTime + "ms");

            // 读取数据
            buffer.flip();
            start = System.currentTimeMillis();
            while (buffer.hasRemaining()) {
                buffer.getLong();
            }
            long readTime = System.currentTimeMillis() - start;
            System.out.println("Read time: " + readTime + "ms");
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 内存映射文件的优势是什么？**
- 零拷贝，减少数据拷贝
- 操作系统管理缓存
- 适用于大文件操作

**Q2: MappedByteBuffer的MapMode有几种？**
- READ_ONLY：只读
- READ_WRITE：读写
- PRIVATE：私有（写时复制）

**Q3: 文件锁定的类型有哪些？**
- 独占锁（lock）：只允许一个进程访问
- 共享锁（lock(position, size, shared)）：允许多个进程读取

**Q4: 内存映射文件有什么限制？**
- 文件大小受限于虚拟地址空间
- 需要注意内存使用

#### 与React对比

```javascript
// JavaScript中没有直接的内存映射文件
// 但有类似的零拷贝技术

// Node.js中的流（零拷贝）
const fs = require('fs');
const readStream = fs.createReadStream('large.dat');
const writeStream = fs.createWriteStream('output.dat');
readStream.pipe(writeStream); // 零拷贝

// React中的虚拟列表（类似内存映射）
import { FixedSizeList } from 'react-window';

function LargeList({ items }) {
    const Row = ({ index, style }) => (
        <div style={style}>{items[index]}</div>
    );

    return (
        <FixedSizeList
            height={600}
            itemCount={items.length}
            itemSize={35}
            width="100%"
        >
            {Row}
        </FixedSizeList>
    );
}
```

---

### 7.5 序列化与反序列化（Serializable、serialVersionUID、transient）

#### 概念讲解

**序列化（Serialization）**
- 将对象转为字节序列
- 用于网络传输、持久化
- 实现Serializable接口

**serialVersionUID**
- 序列化版本号
- 用于验证序列化和反序列化的类是否兼容

**transient**
- 修饰不需要序列化的字段
- 序列化时跳过该字段

#### 代码示例

```java
import java.io.*;

public class SerializationDemo {
    public static void main(String[] args) throws Exception {
        // ============ 基本序列化 ============
        serializeObject();
        deserializeObject();

        // ============ transient关键字 ============
        transientDemo();

        // ============ serialVersionUID ============
        serialVersionUidDemo();

        // ============ 深拷贝 ============
        deepCopyDemo();
    }

    // 基本序列化
    public static void serializeObject() throws IOException {
        User user = new User("John", 30, "secret123");

        try (ObjectOutputStream oos = new ObjectOutputStream(
                new FileOutputStream("user.ser"))) {
            oos.writeObject(user);
            System.out.println("Object serialized");
        }
    }

    // 基本反序列化
    public static void deserializeObject() throws IOException, ClassNotFoundException {
        try (ObjectInputStream ois = new ObjectInputStream(
                new FileInputStream("user.ser"))) {
            User user = (User) ois.readObject();
            System.out.println("Object deserialized: " + user);
            // password为null，因为被transient修饰
        }
    }

    // transient关键字
    public static void transientDemo() throws Exception {
        Config config = new Config();
        config.setHost("localhost");
        config.setPort(8080);
        config.setPassword("admin123");

        // 序列化
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(config);

        // 反序列化
        ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
        ObjectInputStream ois = new ObjectInputStream(bis);
        Config restored = (Config) ois.readObject();

        System.out.println("Host: " + restored.getHost());       // localhost
        System.out.println("Port: " + restored.getPort());       // 8080
        System.out.println("Password: " + restored.getPassword()); // null
    }

    // serialVersionUID
    public static void serialVersionUidDemo() throws Exception {
        // 如果序列化和反序列化的类serialVersionUID不同
        // 会抛出InvalidClassException
        System.out.println("serialVersionUID must match between serialization and deserialization");
    }

    // 深拷贝
    public static void deepCopyDemo() throws Exception {
        User original = new User("John", 30, "secret");

        // 使用序列化实现深拷贝
        ByteArrayOutputStream bos = new ByteArrayOutputStream();
        ObjectOutputStream oos = new ObjectOutputStream(bos);
        oos.writeObject(original);

        ByteArrayInputStream bis = new ByteArrayInputStream(bos.toByteArray());
        ObjectInputStream ois = new ObjectInputStream(bis);
        User copied = (User) ois.readObject();

        System.out.println("Original: " + original);
        System.out.println("Copied: " + copied);
        System.out.println("Same object: " + (original == copied)); // false
    }
}

class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private int age;
    private transient String password; // 不序列化

    public User(String name, int age, String password) {
        this.name = name;
        this.age = age;
        this.password = password;
    }

    // getters and setters
    public String getName() { return name; }
    public int getAge() { return age; }
    public String getPassword() { return password; }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + ", password='" + password + "'}";
    }
}

class Config implements Serializable {
    private static final long serialVersionUID = 1L;

    private String host;
    private int port;
    private transient String password; // 不序列化

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }
    public int getPort() { return port; }
    public void setPort(int port) { this.port = port; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
```

#### ⭐ 面试高频问题

**Q1: 什么是序列化？为什么需要序列化？**
- 将对象转为字节序列
- 用于网络传输、持久化存储

**Q2: serialVersionUID的作用是什么？**
- 验证序列化和反序列化的类是否兼容
- 如果不一致，抛出InvalidClassException

**Q3: transient关键字的作用是什么？**
- 修饰的字段不参与序列化
- 反序列化后值为null或默认值

**Q4: 序列化有哪些注意事项？**
- 实现Serializable接口
- 定义serialVersionUID
- 敏感数据使用transient
- 静态变量不参与序列化

#### 与React对比

```javascript
// JavaScript中的序列化
const user = { name: 'John', age: 30, password: 'secret' };

// JSON序列化
const json = JSON.stringify(user);
console.log(json); // '{"name":"John","age":30,"password":"secret"}'

// JSON反序列化
const parsed = JSON.parse(json);
console.log(parsed.name); // 'John'

// 深拷贝
const deepCopy = JSON.parse(JSON.stringify(user));

// React中的状态序列化
function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}
```

---

### 7.6 Java 8+ Files 工具类

#### 概念讲解

**Files工具类**
- Java 7引入
- 简化文件操作
- 支持NIO.2 API

#### 代码示例

```java
import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

public class FilesUtilDemo {
    public static void main(String[] args) throws Exception {
        // ============ 文件创建和删除 ============
        Path path = Paths.get("test_dir");
        if (!Files.exists(path)) {
            Files.createDirectory(path);
            System.out.println("Directory created");
        }

        Path file = path.resolve("test.txt");
        if (!Files.exists(file)) {
            Files.createFile(file);
            System.out.println("File created");
        }

        // ============ 文件写入 ============
        // 写入字符串
        Files.writeString(file, "Hello, Files API!");

        // 写入行
        List<String> lines = Arrays.asList("Line 1", "Line 2", "Line 3");
        Files.write(file, lines);

        // 追加
        Files.writeString(file, "Appended line", StandardOpenOption.APPEND);

        // ============ 文件读取 ============
        // 读取所有内容
        String content = Files.readString(file);
        System.out.println("File content: " + content);

        // 读取所有行
        List<String> readLines = Files.readAllLines(file);
        System.out.println("Lines: " + readLines);

        // ============ 文件复制和移动 ============
        Path copy = path.resolve("copy.txt");
        Files.copy(file, copy, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("File copied");

        Path move = path.resolve("moved.txt");
        Files.move(copy, move, StandardCopyOption.REPLACE_EXISTING);
        System.out.println("File moved");

        // ============ 文件属性 ============
        System.out.println("\n===== 文件属性 =====");
        System.out.println("Size: " + Files.size(file) + " bytes");
        System.out.println("IsRegularFile: " + Files.isRegularFile(file));
        System.out.println("IsDirectory: " + Files.isDirectory(path));
        System.out.println("IsHidden: " + Files.isHidden(file));
        System.out.println("LastModified: " + Files.getLastModifiedTime(file));

        // ============ 目录遍历 ============
        System.out.println("\n===== 目录遍历 =====");

        // 遍历当前目录
        try (Stream<Path> stream = Files.list(path)) {
            stream.forEach(p -> System.out.println("  " + p.getFileName()));
        }

        // 递归遍历
        Path parentDir = Paths.get(".");
        try (Stream<Path> stream = Files.walk(parentDir, 2)) {
            stream.filter(p -> Files.isRegularFile(p))
                .forEach(p -> System.out.println("  " + p));
        }

        // 查找文件
        try (Stream<Path> stream = Files.find(
                parentDir, 10,
                (p, attrs) -> p.toString().endsWith(".java"))) {
            stream.forEach(p -> System.out.println("Java file: " + p));
        }

        // ============ 文件删除 ============
        Files.delete(move);
        System.out.println("\nFile deleted");

        Files.deleteIfExists(file);
        System.out.println("File deleted if exists");

        Files.delete(path);
        System.out.println("Directory deleted");
    }
}
```

#### ⭐ 面试高频问题

**Q1: Files工具类的优势是什么？**
- 简化文件操作
- 支持NIO.2 API
- 支持Stream操作

**Q2: Files.walk()和Files.list()的区别？**
- walk()：递归遍历所有子目录
- list()：只遍历当前目录

**Q3: 如何高效读取大文件？**
- Files.lines()：逐行读取，返回Stream
- 使用BufferedReader
- 使用内存映射文件

**Q4: Files.copy()的选项有哪些？**
- REPLACE_EXISTING：替换已存在文件
- COPY_ATTRIBUTES：复制文件属性
- NOFOLLOW_LINKS：不跟随符号链接

#### 与React对比

```javascript
// JavaScript中的文件操作（Node.js）
const fs = require('fs');
const path = require('path');

// 创建目录
fs.mkdirSync('test_dir');

// 写入文件
fs.writeFileSync('test_dir/test.txt', 'Hello, Node.js!');

// 读取文件
const content = fs.readFileSync('test_dir/test.txt', 'utf-8');

// 复制文件
fs.copyFileSync('test_dir/test.txt', 'test_dir/copy.txt');

// 删除文件
fs.unlinkSync('test_dir/copy.txt');

// React中的文件操作
function FileManager() {
    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
    };

    return <input type="file" onChange={handleUpload} />;
}
```

---

## 八、Java 新特性（Java 8 ~ Java 21）

### 8.1 Lambda 表达式与函数式接口

#### 概念讲解

**Lambda表达式**
- 简洁的匿名函数写法
- 语法：`(参数) -> {方法体}`
- 可以省略参数类型、括号、return

**函数式接口**
- 只有一个抽象方法的接口
- @FunctionalInterface注解
- 常见接口：Runnable、Callable、Comparator

**常用函数式接口**
- Predicate<T>：布尔判断
- Function<T, R>：输入T，输出R
- Consumer<T>：消费T，无返回
- Supplier<T>：提供T，无输入

#### 代码示例

```java
import java.util.*;
import java.util.function.*;
import java.util.stream.*;

public class LambdaDemo {
    public static void main(String[] args) {
        // ============ Lambda基本语法 ============
        // 无参数
        Runnable runnable = () -> System.out.println("Hello Lambda");
        runnable.run();

        // 一个参数（省略括号）
        Consumer<String> consumer = s -> System.out.println(s);
        consumer.accept("Hello Consumer");

        // 多个参数
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        System.out.println("Add: " + add.apply(3, 5));

        // 多行方法体
        Consumer<String> multiLine = s -> {
            System.out.println("Line 1: " + s);
            System.out.println("Line 2: " + s.length());
        };
        multiLine.accept("Hello");

        // ============ 方法引用 ============
        // 类名::静态方法
        Function<String, Integer> parser = Integer::parseInt;
        System.out.println("Parsed: " + parser.apply("123"));

        // 对象::实例方法
        String str = "Hello";
        Supplier<Integer> length = str::length;
        System.out.println("Length: " + length.get());

        // 类名::实例方法
        BiFunction<String, String, Boolean> contains = String::contains;
        System.out.println("Contains: " + contains.apply("Hello World", "World"));

        // 类名::new（构造方法引用）
        Supplier<ArrayList<String>> listFactory = ArrayList::new;
        List<String> newList = listFactory.get();
        newList.add("Created by constructor reference");

        // ============ 常用函数式接口 ============
        // Predicate：布尔判断
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositive = n -> n > 0;
        System.out.println("Is 4 even: " + isEven.test(4));
        System.out.println("Is -1 positive: " + isPositive.test(-1));

        // 组合Predicate
        Predicate<Integer> isEvenAndPositive = isEven.and(isPositive);
        System.out.println("Is 4 even and positive: " + isEvenAndPositive.test(4));

        // Function：转换
        Function<String, String> toUpper = String::toUpperCase;
        Function<String, String> trim = String::trim;
        Function<String, String> pipeline = trim.andThen(toUpper);
        System.out.println("Pipeline: " + pipeline.apply("  hello  "));

        // Consumer：消费
        Consumer<List<String>> printList = list -> list.forEach(System.out::println);
        printList.accept(Arrays.asList("A", "B", "C"));

        // Supplier：提供
        Supplier<Double> random = Math::random;
        System.out.println("Random: " + random.get());

        // ============ 实际应用 ============
        List<String> names = Arrays.asList("John", "Jane", "Bob", "Alice", "Charlie");

        // 排序
        names.sort((a, b) -> a.length() - b.length());
        System.out.println("Sorted by length: " + names);

        names.sort(Comparator.comparing(String::toString).reversed());
        System.out.println("Sorted reversed: " + names);

        // 遍历
        names.forEach(name -> System.out.println("Name: " + name));
    }
}
```

#### ⭐ 面试高频问题

**Q1: Lambda表达式的语法是什么？**
- `(参数) -> {方法体}`
- 可以省略参数类型、括号、return

**Q2: 什么是函数式接口？**
- 只有一个抽象方法的接口
- 可以使用@FunctionalInterface注解

**Q3: 方法引用有哪些形式？**
- 类名::静态方法
- 对象::实例方法
- 类名::实例方法
- 类名::new

**Q4: Lambda表达式可以访问外部变量吗？**
- 可以访问final或effectively final的变量
- 不能修改外部变量

#### 与React对比

```javascript
// JavaScript中的箭头函数（类似Lambda）
const add = (a, b) => a + b;
const greet = name => `Hello, ${name}`;
const doSomething = () => { console.log('Doing something'); };

// React中的函数式组件
const MyComponent = ({ name, onClick }) => {
    return <button onClick={() => onClick(name)}>{name}</button>;
};

// React Hooks中的回调
function useFetch(url) {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetch(url)
            .then(res => res.json())
            .then(data => setData(data));
    }, [url]);

    return data;
}

// JavaScript中的高阶函数（类似函数式接口）
const numbers = [1, 2, 3, 4, 5];
const evens = numbers.filter(n => n % 2 === 0); // Predicate
const doubled = numbers.map(n => n * 2);          // Function
numbers.forEach(n => console.log(n));             // Consumer
const random = () => Math.random();               // Supplier
```

---

### 8.2 Stream API（中间操作 vs 终端操作）

#### 概念讲解

**Stream**
- 数据处理管道
- 支持链式调用
- 惰性求值

**中间操作（Intermediate）**
- 返回新的Stream
- 惰性执行
- 例如：filter、map、sorted、distinct、flatMap

**终端操作（Terminal）**
- 触发执行
- 返回结果
- 例如：collect、forEach、count、reduce、min/max

#### 代码示例

```java
import java.util.*;
import java.util.stream.*;

public class StreamDemo {
    public static void main(String[] args) {
        List<User> users = Arrays.asList(
            new User("John", 30, "Engineering"),
            new User("Jane", 25, "Marketing"),
            new User("Bob", 35, "Engineering"),
            new User("Alice", 28, "Design"),
            new User("Charlie", 32, "Engineering")
        );

        // ============ 中间操作 ============
        // filter：过滤
        List<User> engineers = users.stream()
            .filter(u -> u.getDepartment().equals("Engineering"))
            .collect(Collectors.toList());
        System.out.println("Engineers: " + engineers);

        // map：映射
        List<String> names = users.stream()
            .map(User::getName)
            .collect(Collectors.toList());
        System.out.println("Names: " + names);

        // sorted：排序
        List<User> sortedByAge = users.stream()
            .sorted(Comparator.comparingInt(User::getAge))
            .collect(Collectors.toList());
        System.out.println("Sorted by age: " + sortedByAge);

        // distinct：去重
        List<String> departments = users.stream()
            .map(User::getDepartment)
            .distinct()
            .collect(Collectors.toList());
        System.out.println("Departments: " + departments);

        // flatMap：扁平化
        List<List<String>> nestedList = Arrays.asList(
            Arrays.asList("A", "B"),
            Arrays.asList("C", "D"),
            Arrays.asList("E")
        );
        List<String> flatList = nestedList.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toList());
        System.out.println("Flat: " + flatList);

        // peek：调试
        List<String> peekResult = users.stream()
            .filter(u -> u.getAge() > 30)
            .peek(u -> System.out.println("Filtered: " + u.getName()))
            .map(User::getName)
            .collect(Collectors.toList());

        // limit & skip：分页
        List<User> page1 = users.stream()
            .skip(0)
            .limit(2)
            .collect(Collectors.toList());
        System.out.println("Page 1: " + page1);

        // ============ 终端操作 ============
        // forEach
        users.stream()
            .forEach(u -> System.out.println("User: " + u.getName()));

        // count
        long count = users.stream()
            .filter(u -> u.getAge() > 30)
            .count();
        System.out.println("Users > 30: " + count);

        // reduce
        int totalAge = users.stream()
            .map(User::getAge)
            .reduce(0, Integer::sum);
        System.out.println("Total age: " + totalAge);

        // min/max
        Optional<User> youngest = users.stream()
            .min(Comparator.comparingInt(User::getAge));
        System.out.println("Youngest: " + youngest.orElse(null));

        // anyMatch/allMatch/noneMatch
        boolean hasEngineer = users.stream()
            .anyMatch(u -> u.getDepartment().equals("Engineering"));
        boolean allAdult = users.stream()
            .allMatch(u -> u.getAge() >= 18);
        System.out.println("Has engineer: " + hasEngineer);
        System.out.println("All adult: " + allAdult);

        // findFirst/findAny
        Optional<User> first = users.stream()
            .filter(u -> u.getName().startsWith("J"))
            .findFirst();
        System.out.println("First J: " + first.orElse(null));

        // ============ Collectors ============
        // toList
        List<String> nameList = users.stream()
            .map(User::getName)
            .collect(Collectors.toList());

        // toSet
        Set<String> deptSet = users.stream()
            .map(User::getDepartment)
            .collect(Collectors.toSet());

        // toMap
        Map<String, Integer> nameAgeMap = users.stream()
            .collect(Collectors.toMap(User::getName, User::getAge));
        System.out.println("Name-Age Map: " + nameAgeMap);

        // groupingBy
        Map<String, List<User>> byDept = users.stream()
            .collect(Collectors.groupingBy(User::getDepartment));
        System.out.println("Grouped by dept: " + byDept);

        // partitioningBy
        Map<Boolean, List<User>> partitioned = users.stream()
            .collect(Collectors.partitioningBy(u -> u.getAge() > 30));
        System.out.println("Partitioned: " + partitioned);

        // joining
        String joinedNames = users.stream()
            .map(User::getName)
            .collect(Collectors.joining(", "));
        System.out.println("Joined names: " + joinedNames);

        // summarizingInt
        IntSummaryStatistics stats = users.stream()
            .collect(Collectors.summarizingInt(User::getAge));
        System.out.println("Age stats: " + stats);

        // ============ 并行流 ============
        long parallelCount = users.parallelStream()
            .filter(u -> u.getAge() > 30)
            .count();
        System.out.println("Parallel count: " + parallelCount);
    }
}

class User {
    private String name;
    private int age;
    private String department;

    public User(String name, int age, String department) {
        this.name = name;
        this.age = age;
        this.department = department;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public String getDepartment() { return department; }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + ", dept='" + department + "'}";
    }
}
```

#### ⭐ 面试高频问题

**Q1: 中间操作和终端操作的区别是什么？**
- 中间操作：返回Stream，惰性执行
- 终端操作：触发执行，返回结果

**Q2: Stream的特点是什么？**
- 不存储数据
- 不修改数据源
- 惰性求值
- 只能消费一次

**Q3: 并行流有什么注意事项？**
- 线程安全问题
- 不保证顺序
- 适用于大数据量
- 注意共享变量的修改

**Q4: collect()的常见用法有哪些？**
- Collectors.toList()
- Collectors.toMap()
- Collectors.groupingBy()
- Collectors.joining()

#### 与React对比

```javascript
// JavaScript中的数组方法（类似Stream API）
const users = [
    { name: 'John', age: 30, dept: 'Engineering' },
    { name: 'Jane', age: 25, dept: 'Marketing' },
    { name: 'Bob', age: 35, dept: 'Engineering' }
];

// filter（中间操作）
const engineers = users.filter(u => u.dept === 'Engineering');

// map（中间操作）
const names = users.map(u => u.name);

// sort（中间操作）
const sorted = [...users].sort((a, b) => a.age - b.age);

// reduce（终端操作）
const totalAge = users.reduce((sum, u) => sum + u.age, 0);

// find（终端操作）
const john = users.find(u => u.name === 'John');

// some/every（终端操作）
const hasEngineer = users.some(u => u.dept === 'Engineering');
const allAdult = users.every(u => u.age >= 18);

// React中使用
function UserList({ users }) {
    const engineerNames = users
        .filter(u => u.dept === 'Engineering')
        .map(u => u.name)
        .join(', ');

    return <div>{engineerNames}</div>;
}
```

---

### 8.3 Optional 的正确使用

#### 概念讲解

**Optional**
- 容器对象，可能包含null
- 避免NullPointerException
- 不可序列化

#### 代码示例

```java
import java.util.*;
import java.util.stream.*;

public class OptionalDemo {
    public static void main(String[] args) {
        // ============ 创建Optional ============
        Optional<String> empty = Optional.empty();
        Optional<String> present = Optional.of("Hello");
        Optional<String> nullable = Optional.ofNullable(null);

        System.out.println("Empty: " + empty);
        System.out.println("Present: " + present);
        System.out.println("Nullable: " + nullable);

        // ============ 判断值是否存在 ============
        System.out.println("Is present: " + present.isPresent());
        System.out.println("Is empty: " + empty.isEmpty());

        // ============ 获取值 ============
        // get()：可能抛出NoSuchElementException
        // orElse()：提供默认值
        // orElseGet()：延迟计算默认值
        // orElseThrow()：抛出异常

        String value1 = empty.orElse("Default");
        String value2 = empty.orElseGet(() -> "Computed Default");
        String value3 = empty.orElseThrow(() -> new RuntimeException("Not found"));
        String value4 = present.orElse("Default");

        System.out.println("orElse: " + value1);
        System.out.println("orElseGet: " + value2);
        System.out.println("orElse: " + value4);

        // ============ 链式操作 ============
        // map：转换值
        Optional<Integer> length = present.map(String::length);
        System.out.println("Length: " + length.orElse(0));

        // flatMap：扁平化Optional
        Optional<String> upper = present.flatMap(s -> Optional.of(s.toUpperCase()));
        System.out.println("Upper: " + upper.orElse(""));

        // filter：条件过滤
        Optional<String> filtered = present.filter(s -> s.length() > 3);
        System.out.println("Filtered: " + filtered.orElse("Too short"));

        // ============ 实际应用 ============
        // 服务层
        UserService service = new UserService();
        Optional<User> userOpt = service.findUser(1L);

        // 使用Optional
        String userName = userOpt
            .map(User::getName)
            .orElse("Unknown");
        System.out.println("User name: " + userName);

        // 链式调用
        String email = userOpt
            .filter(u -> u.getAge() > 18)
            .map(User::getEmail)
            .orElse("No email available");
        System.out.println("Email: " + email);

        // ifPresent
        userOpt.ifPresent(u -> System.out.println("Found: " + u.getName()));

        // ============ Optional最佳实践 ============
        // 1. 不要用Optional作为方法参数
        // 2. 不要用Optional作为字段
        // 3. 用Optional作为返回值
        // 4. 不要调用get()而不检查isPresent
    }
}

class UserService {
    private Map<Long, User> userDb = new HashMap<>();

    public UserService() {
        userDb.put(1L, new User("John", 30, "john@example.com"));
        userDb.put(2L, new User("Jane", 25, "jane@example.com"));
    }

    public Optional<User> findUser(Long id) {
        return Optional.ofNullable(userDb.get(id));
    }
}

class User {
    private String name;
    private int age;
    private String email;

    public User(String name, int age, String email) {
        this.name = name;
        this.age = age;
        this.email = email;
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    public String getEmail() { return email; }
}
```

#### ⭐ 面试高频问题

**Q1: Optional的作用是什么？**
- 避免NullPointerException
- 明确表示值可能为null
- 提供链式操作

**Q2: Optional.of()和Optional.ofNullable()的区别？**
- of()：值不能为null，否则NPE
- ofNullable()：值可以为null

**Q3: orElse()和orElseGet()的区别？**
- orElse()：无论是否需要都会执行
- orElseGet()：只在需要时执行（Supplier）

**Q4: Optional的使用场景有哪些？**
- 方法返回值
- Stream操作
- 链式调用

#### 与React对比

```javascript
// JavaScript中没有Optional
// 但有类似的空值处理

// 可选链操作符
const user = { name: 'John', address: { city: 'NYC' } };
const city = user?.address?.city; // 'NYC'
const zip = user?.address?.zip;   // undefined

// 空值合并运算符
const name = user?.name ?? 'Unknown';
const zip2 = user?.address?.zip ?? '00000';

// React中的空值处理
function UserProfile({ user }) {
    return (
        <div>
            <h1>{user?.name ?? 'Guest'}</h1>
            <p>{user?.email ?? 'No email'}</p>
        </div>
    );
}

// React中的条件渲染
function UserList({ users }) {
    return (
        <div>
            {users?.map(user => (
                <div key={user.id}>{user.name}</div>
            )) ?? <div>No users found</div>}
        </div>
    );
}
```

---

### 8.4 CompletableFuture 异步编程

#### 概念讲解

**CompletableFuture**
- Java 8引入的异步编程工具
- 支持链式调用
- 支持组合多个异步操作
- 类似于JavaScript的Promise

#### 代码示例

```java
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

public class CompletableFutureDemo {
    public static void main(String[] args) throws Exception {
        // ============ 基本使用 ============
        // 创建CompletableFuture
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Hello";
        });

        // 链式调用
        CompletableFuture<String> future2 = future1
            .thenApply(s -> s + ", World")
            .thenApply(String::toUpperCase);

        System.out.println("Result: " + future2.get()); // HELLO, WORLD

        // ============ thenApply / thenAccept / thenRun ============
        CompletableFuture.supplyAsync(() -> "Hello")
            .thenApply(s -> s + ", World")       // 转换结果
            .thenAccept(System.out::println)      // 消费结果
            .thenRun(() -> System.out.println("Done")); // 执行后续操作

        // ============ 异常处理 ============
        CompletableFuture<Integer> future3 = CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("Something went wrong");
            }
            return 42;
        })
        .exceptionally(ex -> {
            System.err.println("Error: " + ex.getMessage());
            return -1; // 默认值
        });

        System.out.println("Result: " + future3.get());

        // handle()：处理结果和异常
        CompletableFuture<String> future4 = CompletableFuture.supplyAsync(() -> {
            if (Math.random() > 0.5) {
                throw new RuntimeException("Error");
            }
            return "Success";
        })
        .handle((result, ex) -> {
            if (ex != null) {
                return "Recovered from error";
            }
            return result;
        });

        System.out.println("Handled: " + future4.get());

        // ============ 组合多个Future ============
        // thenCombine：合并两个Future的结果
        CompletableFuture<String> hello = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "Hello";
        });

        CompletableFuture<String> world = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "World";
        });

        CompletableFuture<String> combined = hello.thenCombine(world, (h, w) -> h + ", " + w);
        System.out.println("Combined: " + combined.get());

        // thenCompose：扁平化Future
        CompletableFuture<String> composed = CompletableFuture.supplyAsync(() -> "John")
            .thenCompose(name -> CompletableFuture.supplyAsync(() -> "Hello, " + name));
        System.out.println("Composed: " + composed.get());

        // allOf：等待所有Future完成
        CompletableFuture<Void> allFutures = CompletableFuture.allOf(
            CompletableFuture.supplyAsync(() -> { sleep(500); return 1; }),
            CompletableFuture.supplyAsync(() -> { sleep(700); return 2; }),
            CompletableFuture.supplyAsync(() -> { sleep(300); return 3; })
        );

        allFutures.join();
        System.out.println("All futures completed");

        // anyOf：等待任一Future完成
        CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(
            CompletableFuture.supplyAsync(() -> { sleep(500); return "Fast"; }),
            CompletableFuture.supplyAsync(() -> { sleep(1000); return "Slow"; })
        );
        System.out.println("Any: " + anyFuture.get());

        // ============ 实际应用：并行请求 ============
        ExecutorService executor = Executors.newFixedThreadPool(4);

        CompletableFuture<String> userFuture = CompletableFuture.supplyAsync(() -> {
            sleep(300);
            return "User Data";
        }, executor);

        CompletableFuture<String> orderFuture = CompletableFuture.supplyAsync(() -> {
            sleep(500);
            return "Order Data";
        }, executor);

        CompletableFuture<String> productFuture = CompletableFuture.supplyAsync(() -> {
            sleep(200);
            return "Product Data";
        }, executor);

        // 等待所有数据
        CompletableFuture.allOf(userFuture, orderFuture, productFuture).join();

        // 汇总结果
        String result = Stream.of(userFuture, orderFuture, productFuture)
            .map(CompletableFuture::join)
            .collect(Collectors.joining(", "));
        System.out.println("All data: " + result);

        executor.shutdown();
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: CompletableFuture和Future的区别？**
- CompletableFuture支持链式调用
- CompletableFuture支持组合操作
- CompletableFuture支持异步回调

**Q2: thenApply和thenCompose的区别？**
- thenApply：同步转换结果
- thenCompose：异步转换结果（返回CompletableFuture）

**Q3: allOf和anyOf的区别？**
- allOf：等待所有Future完成
- anyOf：等待任一Future完成

**Q4: CompletableFuture的线程池如何选择？**
- supplyAsync()默认使用ForkJoinPool
- 可以指定自定义线程池

#### 与React对比

```javascript
// JavaScript中的Promise（类似CompletableFuture）
// 创建Promise
const promise = new Promise((resolve, reject) => {
    setTimeout(() => resolve('Hello'), 1000);
});

// 链式调用
promise
    .then(value => value + ', World')
    .then(value => console.log(value))
    .catch(error => console.error(error));

// Promise.all（类似allOf）
Promise.all([
    fetch('/api/user'),
    fetch('/api/orders'),
    fetch('/api/products')
])
    .then(([user, orders, products]) => {
        console.log('All data loaded');
    });

// Promise.race（类似anyOf）
Promise.race([
    fetch('/api/fast'),
    fetch('/api/slow')
])
    .then(result => console.log('First:', result));

// React中的异步数据获取
function DataComponent() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/user').then(r => r.json()),
            fetch('/api/orders').then(r => r.json())
        ])
        .then(([user, orders]) => {
            setData({ user, orders });
            setLoading(false);
        });
    }, []);

    return loading ? <div>Loading...</div> : <div>{JSON.stringify(data)}</div>;
}
```

---

### 8.5 var 关键字（Java 10）

#### 概念讲解

**var关键字**
- Java 10引入的局部变量类型推断
- 只能用于局部变量
- 编译器推断类型
- 不影响运行时性能

#### 代码示例

```java
import java.util.*;
import java.util.stream.*;

public class VarDemo {
    public static void main(String[] args) {
        // ============ var基本使用 ============
        var name = "Hello";           // String
        var number = 123;             // int
        var list = new ArrayList<String>(); // ArrayList<String>
        var map = new HashMap<String, Integer>(); // HashMap<String, Integer>

        System.out.println("name type: " + name.getClass()); // class java.lang.String
        System.out.println("number type: " + ((Object) number).getClass()); // class java.lang.Integer

        // ============ var在循环中使用 ============
        var numbers = List.of(1, 2, 3, 4, 5);
        for (var num : numbers) {
            System.out.print(num + " ");
        }
        System.out.println();

        // ============ var在try-with-resources中使用 ============
        try (var reader = new BufferedReader(new StringReader("Hello"))) {
            System.out.println(reader.readLine());
        } catch (Exception e) {
            e.printStackTrace();
        }

        // ============ var在Stream中使用 ============
        var stream = numbers.stream()
            .filter(n -> n % 2 == 0)
            .map(n -> n * 2);
        stream.forEach(System.out::println);

        // ============ var的限制 ============
        // 1. 不能用于成员变量
        // 2. 不能用于方法参数
        // 3. 不能用于返回类型
        // 4. 必须有初始化值
        // 5. 不能初始化为null

        // var x = null; // 编译错误
        // var arr = {1, 2, 3}; // 编译错误，需要指定类型
        var arr = new int[]{1, 2, 3}; // 正确
    }
}
```

#### ⭐ 面试高频问题

**Q1: var的本质是什么？**
- 编译时类型推断
- 编译后仍然是强类型
- 不影响运行时性能

**Q2: var有哪些限制？**
- 只能用于局部变量
- 必须有初始化值
- 不能初始化为null
- 不能用于Lambda表达式

**Q3: var和JavaScript的var有什么区别？**
- Java的var：编译时类型推断，强类型
- JavaScript的var：弱类型，可重新赋值

**Q4: 什么时候使用var？**
- 类型名称很长时
- try-with-resources
- 泛型类型推断

#### 与React对比

```javascript
// JavaScript/TypeScript中的var/let/const
var oldWay = 'old'; // 函数作用域
let modernWay = 'modern'; // 块作用域
const constant = 'constant'; // 常量

// TypeScript中的类型推断
let name = 'Hello'; // 推断为string
let number = 123;   // 推断为number

// React中的变量声明
function MyComponent() {
    const [count, setCount] = useState(0); // 类型推断
    const ref = useRef<HTMLDivElement>(null); // 泛型类型

    return <div ref={ref}>{count}</div>;
}
```

---

### 8.6 Records（Java 16）

#### 概念讲解

**Records**
- Java 16引入
- 不可变数据载体
- 自动生成equals、hashCode、toString
- 自动生成getter、constructor

#### 代码示例

```java
public class RecordDemo {
    public static void main(String[] args) {
        // ============ 基本Record ============
        Point point = new Point(10, 20);
        System.out.println(point); // Point[x=10, y=20]
        System.out.println("x: " + point.x()); // 10
        System.out.println("y: " + point.y()); // 20

        // equals和hashCode
        Point point2 = new Point(10, 20);
        System.out.println("equals: " + point.equals(point2)); // true
        System.out.println("hashCode: " + (point.hashCode() == point2.hashCode())); // true

        // ============ Record vs 类 ============
        // 传统方式需要写很多代码
        // Record只需要一行

        // ============ Record的构造方法 ============
        Person person = new Person("John", 30);
        System.out.println(person); // Person[name=John, age=30]

        // 自定义构造方法
        PersonWithValidation validated = new PersonWithValidation("John", 30);
        System.out.println(validated);

        // ============ Record实现接口 ============
        Shape circle = new Circle(5.0);
        System.out.println("Area: " + circle.area()); // 78.53981633974483

        // ============ Record的局限性 ============
        // 1. 不可变（字段是final）
        // 2. 不能继承其他类
        // 3. 可以实现接口
    }
}

// 基本Record
record Point(int x, int y) {}

// 带自定义构造方法的Record
record Person(String name, int age) {
    // 紧凑构造方法
    public Person {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("Name cannot be null or empty");
        }
        if (age < 0 || age > 150) {
            throw new IllegalArgumentException("Invalid age");
        }
    }
}

// 带额外字段的Record
record PersonWithValidation(String name, int age) {
    // 紧凑构造方法
    public PersonWithValidation {
        Objects.requireNonNull(name, "Name cannot be null");
        if (age < 0) throw new IllegalArgumentException("Age must be positive");
    }

    // 额外方法
    public boolean isAdult() {
        return age >= 18;
    }
}

// Record实现接口
interface Shape {
    double area();
}

record Circle(double radius) implements Shape {
    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}
```

#### ⭐ 面试高频问题

**Q1: Record的本质是什么？**
- 不可变数据载体
- 自动生成equals、hashCode、toString、getter、constructor
- final类，不能被继承

**Q2: Record和Lombok的@Data有什么区别？**
- Record：不可变，final字段
- @Data：可变，可生成setter

**Q3: Record可以自定义方法吗？**
- 可以添加额外方法
- 可以自定义构造方法

**Q4: Record可以继承其他类吗？**
- 不能继承其他类
- 可以实现接口

#### 与React对比

```typescript
// TypeScript中的类型（类似Record）
type Point = {
    readonly x: number;
    readonly y: number;
};

const point: Point = { x: 10, y: 20 };

// TypeScript中的 Readonly
interface ReadonlyPerson {
    readonly name: string;
    readonly age: number;
}

// React中的不可变状态
function useImmerState<T>(initialState: T) {
    const [state, setState] = useState(initialState);

    const updateState = useCallback((updater: (draft: T) => void) => {
        setState(produce(updater));
    }, []);

    return [state, updateState] as const;
}

// React中的Props类型（类似Record）
interface UserProps {
    readonly name: string;
    readonly age: number;
    readonly email: string;
}

const UserCard: React.FC<UserProps> = ({ name, age, email }) => {
    return (
        <div>
            <h2>{name}</h2>
            <p>Age: {age}</p>
            <p>Email: {email}</p>
        </div>
    );
};
```

---

### 8.7 Sealed Classes（Java 17）

#### 概念讲解

**Sealed Classes**
- Java 17引入
- 限制类的继承
- 使用permits关键字指定允许的子类
- 提高类型安全

#### 代码示例

```java
public class SealedClassDemo {
    public static void main(String[] args) {
        // ============ 基本使用 ============
        Shape circle = new Circle(5.0);
        Shape rectangle = new Rectangle(3.0, 4.0);
        Shape square = new Square(4.0);

        System.out.println("Circle area: " + circle.area());
        System.out.println("Rectangle area: " + rectangle.area());
        System.out.println("Square area: " + square.area());

        // ============ 模式匹配（Java 17+） ============
        printShape(circle);
        printShape(rectangle);
        printShape(square);

        // ============ Sealed Interface ============
        Result<String> success = new Success<>("Data loaded");
        Result<String> error = new Error<>("Network error");

        processResult(success);
        processResult(error);
    }

    // 模式匹配
    static void printShape(Shape shape) {
        switch (shape) {
            case Circle c -> System.out.println("Circle: r=" + c.radius());
            case Rectangle r -> System.out.println("Rectangle: w=" + r.width() + ", h=" + r.height());
            case Square s -> System.out.println("Square: side=" + s.side());
            // 不需要default，编译器知道所有可能的情况
        }
    }

    static void processResult(Result<String> result) {
        switch (result) {
            case Success<String> s -> System.out.println("Success: " + s.value());
            case Error<String> e -> System.out.println("Error: " + e.message());
        }
    }
}

// Sealed Class
sealed class Shape permits Circle, Rectangle, Square {}

record Circle(double radius) extends Shape {
    public double area() { return Math.PI * radius * radius; }
}

record Rectangle(double width, double height) extends Shape {
    public double area() { return width * height; }
}

record Square(double side) extends Shape {
    public double area() { return side * side; }
}

// Sealed Interface
sealed interface Result<T> permits Success, Error {}

record Success<T>(T value) implements Result<T> {}

record Error<T>(String message) implements Result<T> {}
```

#### ⭐ 面试高频问题

**Q1: Sealed Classes的作用是什么？**
- 限制类的继承
- 提高类型安全
- 支持穷举模式匹配

**Q2: Sealed Classes的三种子类修饰符？**
- final：不能被继承
- sealed：继续限制继承
- non-sealed：开放继承

**Q3: Sealed Classes和枚举的区别？**
- 枚举：单例，固定实例
- Sealed Classes：可以有多个实例

**Q4: Sealed Classes的应用场景？**
- AST（抽象语法树）
- 表达式树
- 状态机

#### 与React对比

```typescript
// TypeScript中的联合类型（类似Sealed Classes）
type Shape =
    | { type: 'circle'; radius: number }
    | { type: 'rectangle'; width: number; height: number }
    | { type: 'square'; side: number };

function area(shape: Shape): number {
    switch (shape.type) {
        case 'circle':
            return Math.PI * shape.radius * shape.radius;
        case 'rectangle':
            return shape.width * shape.height;
        case 'square':
            return shape.side * shape.side;
    }
}

// TypeScript中的判别联合类型
type Result<T> =
    | { status: 'success'; value: T }
    | { status: 'error'; message: string };

function processResult<T>(result: Result<T>) {
    switch (result.status) {
        case 'success':
            console.log(result.value);
            break;
        case 'error':
            console.error(result.message);
            break;
    }
}

// React中的状态管理（类似Sealed Classes）
type AppState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: any }
    | { status: 'error'; error: Error };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'FETCH_START':
            return { status: 'loading' };
        case 'FETCH_SUCCESS':
            return { status: 'success', data: action.payload };
        case 'FETCH_ERROR':
            return { status: 'error', error: action.error };
        default:
            return state;
    }
}
```

---

### 8.8 Virtual Threads（Java 21）

#### 概念讲解

**Virtual Threads（虚拟线程）**
- Java 21正式引入
- 轻量级线程
- 由JVM管理，不需要操作系统线程
- 适用于高并发IO密集型任务

#### 代码示例

```java
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.*;

public class VirtualThreadDemo {
    public static void main(String[] args) throws Exception {
        // ============ 创建虚拟线程 ============
        // 方式1：Thread.startVirtualThread
        Thread vThread1 = Thread.startVirtualThread(() -> {
            System.out.println("Virtual Thread 1: " + Thread.currentThread());
        });

        // 方式2：Thread.ofVirtual()
        Thread vThread2 = Thread.ofVirtual()
            .name("my-virtual-thread")
            .start(() -> {
                System.out.println("Virtual Thread 2: " + Thread.currentThread());
            });

        vThread1.join();
        vThread2.join();

        // ============ 虚拟线程 vs 平台线程 ============
        System.out.println("\n===== 虚拟线程 vs 平台线程 =====");

        // 平台线程：10000个线程
        long start = System.currentTimeMillis();
        try (var executor = Executors.newFixedThreadPool(100)) {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < 10000; i++) {
                futures.add(executor.submit(() -> {
                    sleep(100);
                }));
            }
            futures.forEach(f -> { try { f.get(); } catch (Exception e) {} });
        }
        long platformTime = System.currentTimeMillis() - start;
        System.out.println("Platform threads (100 pool): " + platformTime + "ms");

        // 虚拟线程：10000个线程
        start = System.currentTimeMillis();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<?>> futures = new ArrayList<>();
            for (int i = 0; i < 10000; i++) {
                futures.add(executor.submit(() -> {
                    sleep(100);
                }));
            }
            futures.forEach(f -> { try { f.get(); } catch (Exception e) {} });
        }
        long virtualTime = System.currentTimeMillis() - start;
        System.out.println("Virtual threads: " + virtualTime + "ms");

        // ============ StructuredTaskScope（预览特性） ============
        System.out.println("\n===== Structured Concurrency =====");
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
            Subtask<String> user = scope.fork(() -> fetchUser(1));
            Subtask<String> order = scope.fork(() -> fetchOrder(1));

            scope.join();
            scope.throwIfFailed();

            System.out.println("User: " + user.get());
            System.out.println("Order: " + order.get());
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    static String fetchUser(int id) {
        sleep(500);
        return "User-" + id;
    }

    static String fetchOrder(int id) {
        sleep(300);
        return "Order-" + id;
    }

    static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 虚拟线程和平台线程的区别？**
- 虚拟线程：轻量级，JVM管理
- 平台线程：重量级，操作系统管理

**Q2: 虚拟线程适用于什么场景？**
- 高并发IO密集型任务
- 不适用于CPU密集型任务

**Q3: 虚拟线程的数量有限制吗？**
- 几乎没有限制
- 可以创建数百万个虚拟线程

**Q4: 虚拟线程会替代平台线程吗？**
- 不会完全替代
- CPU密集型任务仍需要平台线程

#### 与React对比

```javascript
// JavaScript的单线程模型（类似虚拟线程）
// Node.js使用事件循环处理并发

// 异步操作不会阻塞事件循环
async function fetchUserData() {
    const user = await fetch('/api/user');
    const orders = await fetch('/api/orders');
    return { user, orders };
}

// React中的并发模式
function App() {
    return (
        <React.StrictMode>
            <MyComponent />
        </React.StrictMode>
    );
}

// React 18的并发特性
// 1. startTransition：低优先级更新
function SearchComponent() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value); // 高优先级

        startTransition(() => {
            setResults(searchResults(value)); // 低优先级
        });
    };

    return (
        <div>
            <input value={query} onChange={handleChange} />
            <ResultList results={results} />
        </div>
    );
}

// 2. Suspense：异步数据加载
function DataComponent() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AsyncData />
        </Suspense>
    );
}
```

---

## 九、Java 内存管理基础

### 9.1 栈内存 vs 堆内存

#### 概念讲解

**栈内存（Stack）**
- 线程私有
- 存储局部变量、方法调用
- 自动分配和释放
- 速度快但空间小

**堆内存（Heap）**
- 所有线程共享
- 存储对象实例和数组
- GC管理
- 空间大但速度慢

#### 代码示例

```java
public class MemoryDemo {
    public static void main(String[] args) {
        // ============ 栈内存 ============
        // 基本类型变量存储在栈中
        int a = 10;       // 栈
        double b = 3.14;  // 栈
        boolean c = true; // 栈

        // 引用变量存储在栈中，对象存储在堆中
        String str = new String("Hello"); // 引用在栈，对象在堆
        int[] arr = new int[5];           // 引用在栈，数组在堆

        // 方法调用在栈中
        method1();

        // ============ 堆内存 ============
        // 对象在堆中创建
        Person person = new Person("John", 30); // 对象在堆中

        // 数组在堆中创建
        int[] numbers = new int[1000]; // 数组在堆中

        // 字符串常量池在堆中（JDK 7+）
        String s1 = "Hello"; // 字符串常量池
        String s2 = "Hello"; // 同一个引用
        String s3 = new String("Hello"); // 堆中新对象

        System.out.println("s1 == s2: " + (s1 == s2)); // true
        System.out.println("s1 == s3: " + (s1 == s3)); // false

        // ============ 内存泄漏示例 ============
        // 1. 静态集合持有对象引用
        // 2. 未关闭的资源
        // 3. 内部类持有外部类引用
        // 4. ThreadLocal未清理

        // ============ JVM内存参数 ============
        // -Xms：初始堆大小
        // -Xmx：最大堆大小
        // -Xss：线程栈大小
        // -XX:NewSize：新生代大小
        // -XX:MaxNewSize：最大新生代大小

        Runtime runtime = Runtime.getRuntime();
        System.out.println("\n===== JVM Memory Info =====");
        System.out.println("Max memory: " + (runtime.maxMemory() / 1024 / 1024) + " MB");
        System.out.println("Total memory: " + (runtime.totalMemory() / 1024 / 1024) + " MB");
        System.out.println("Free memory: " + (runtime.freeMemory() / 1024 / 1024) + " MB");
        System.out.println("Used memory: " +
            ((runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024) + " MB");
    }

    public static void method1() {
        int x = 20; // 栈
        method2();
    }

    public static void method2() {
        int y = 30; // 栈
        // 方法返回后，y从栈中弹出
    }
}

class Person {
    private String name;
    private int age;

    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

#### ⭐ 面试高频问题

**Q1: 栈和堆的区别是什么？**
- 栈：线程私有，存储局部变量，自动释放
- 堆：线程共享，存储对象，GC管理

**Q2: 为什么局部变量存储在栈中？**
- 线程安全
- 自动管理生命周期
- 速度快

**Q3: 对象一定在堆中吗？**
- 大部分在堆中
- 逃逸分析后可能在栈上分配

**Q4: String常量池在哪里？**
- JDK 7之前：永久代
- JDK 7+：堆中

#### 与React对比

```javascript
// JavaScript的内存模型
// 栈：基本类型、引用
// 堆：对象、数组、函数

// 栈
let num = 10;
let str = 'hello';
let bool = true;

// 堆
let obj = { name: 'John' };
let arr = [1, 2, 3];
let fn = function() {};

// React中的内存管理
function MyComponent() {
    // 栈：基本类型
    const count = 0;
    const name = 'John';

    // 堆：对象和数组
    const [users, setUsers] = useState([]);
    const [user, setUser] = useState({ name: 'John', age: 30 });

    // 清理副作用（防止内存泄漏）
    useEffect(() => {
        const subscription = eventBus.subscribe('event', handler);

        return () => {
            subscription.unsubscribe(); // 清理
        };
    }, []);

    return <div>{name}</div>;
}

// React中的内存泄漏防范
function DataFetcher() {
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;

        fetchData().then(result => {
            if (!cancelled) {
                setData(result);
            }
        });

        return () => { cancelled = true; };
    }, []);

    return <div>{data}</div>;
}
```

---

### 9.2 方法区 / 元空间

#### 概念讲解

**方法区（Method Area）**
- 线程共享
- 存储类信息、常量、静态变量
- JDK 7及之前：永久代（PermGen）
- JDK 8+：元空间（Metaspace）

**元空间（Metaspace）**
- JDK 8引入
- 使用本地内存
- 不受JVM堆大小限制
- 自动调整大小

#### 代码示例

```java
import java.util.*;
import java.lang.management.*;

public class MetaspaceDemo {
    public static void main(String[] args) {
        // ============ JVM内存信息 ============
        System.out.println("===== JVM Memory Info =====");

        // 堆内存
        MemoryMXBean memoryMXBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryMXBean.getHeapMemoryUsage();
        System.out.println("Heap used: " + (heapUsage.getUsed() / 1024 / 1024) + " MB");
        System.out.println("Heap max: " + (heapUsage.getMax() / 1024 / 1024) + " MB");

        // 非堆内存（包含元空间）
        MemoryUsage nonHeapUsage = memoryMXBean.getNonHeapMemoryUsage();
        System.out.println("Non-heap used: " + (nonHeapUsage.getUsed() / 1024 / 1024) + " MB");
        System.out.println("Non-heap max: " + (nonHeapUsage.getMax() / 1024 / 1024) + " MB");

        // ============ 类加载信息 ============
        ClassLoadingMXBean classLoadingMXBean = ManagementFactory.getClassLoadingMXBean();
        System.out.println("\n===== Class Loading Info =====");
        System.out.println("Loaded classes: " + classLoadingMXBean.getLoadedClassCount());
        System.out.println("Total loaded: " + classLoadingMXBean.getTotalLoadedClassCount());
        System.out.println("Unloaded: " + classLoadingMXBean.getUnloadedClassCount());

        // ============ 元空间OOM ============
        // 可以通过以下参数限制元空间大小
        // -XX:MaxMetaspaceSize=256m
        // -XX:MetaspaceSize=64m
        // -XX:CompressedClassSpaceSize=256m

        // ============ 永久代 vs 元空间 ============
        System.out.println("\n===== PermGen vs Metaspace =====");
        System.out.println("PermGen (JDK 7-):");
        System.out.println("  - 存储在JVM堆中");
        System.out.println("  - 大小固定");
        System.out.println("  - 容易OOM");
        System.out.println("  - 字符串常量池在永久代");
        System.out.println("Metaspace (JDK 8+):");
        System.out.println("  - 使用本地内存");
        System.out.println("  - 大小自动调整");
        System.out.println("  - 不容易OOM");
        System.out.println("  - 字符串常量池在堆中");

        // ============ 运行时常量池 ============
        String s1 = "Hello"; // 字符串常量池
        String s2 = new String("Hello"); // 堆
        String s3 = s2.intern(); // 字符串常量池

        System.out.println("\n===== String Pool =====");
        System.out.println("s1 == s3: " + (s1 == s3)); // true

        // 类常量
        System.out.println("Integer.MAX_VALUE: " + Integer.MAX_VALUE);
        System.out.println("Double.MIN_VALUE: " + Double.MIN_VALUE);
    }
}
```

#### ⭐ 面试高频问题

**Q1: 永久代和元空间的区别？**
- 永久代：JVM堆中，大小固定
- 元空间：本地内存，自动调整

**Q2: 为什么JDK 8用元空间替代永久代？**
- 永久代大小固定，容易OOM
- 字符串常量池移到堆中
- 元空间使用本地内存，更灵活

**Q3: 方法区存储什么？**
- 类信息（字段、方法、构造方法）
- 常量池
- 静态变量
- JIT编译后的代码

**Q4: 元空间会OOM吗？**
- 会，但比永久代少
- 可以通过-XX:MaxMetaspaceSize限制

#### 与React对比

```javascript
// JavaScript没有方法区的概念
// 但有类似的存储

// 全局变量（类似静态变量）
var globalVar = 'global';

// 模块缓存（类似类信息）
// Node.js的require缓存
const moduleCache = require.cache;

// React中的全局状态（类似静态变量）
// Context API
const GlobalContext = React.createContext(null);

function App() {
    return (
        <GlobalContext.Provider value={{ theme: 'dark' }}>
            <ChildComponent />
        </GlobalContext.Provider>
    );
}

function ChildComponent() {
    const { theme } = useContext(GlobalContext);
    return <div>Theme: {theme}</div>;
}

// React中的常量
const CONSTANTS = Object.freeze({
    API_URL: 'https://api.example.com',
    MAX_ITEMS: 100,
    TIMEOUT: 5000
});
```

---

### 9.3 局部变量表、操作数栈、动态链接

#### 概念讲解

**栈帧（Stack Frame）**
- 方法调用时创建
- 包含：局部变量表、操作数栈、动态链接、方法返回地址

**局部变量表（Local Variable Table）**
- 存储方法的参数和局部变量
- 基本类型占1-2个slot
- 引用类型占1个slot
- this占第0个slot

**操作数栈（Operand Stack）**
- 方法执行的工作区
- 算术运算、方法调用的参数传递
- 最大深度在编译时确定

**动态链接（Dynamic Linking）**
- 指向运行时常量池的方法引用
- 支持多态

#### 代码示例

```java
public class StackFrameDemo {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int c = add(a, b);
        System.out.println("Result: " + c);

        // 查看字节码：javap -c StackFrameDemo
    }

    public static int add(int x, int y) {
        int result = x + y;
        return result;
    }

    // 字节码分析：
    // public static int add(int, int);
    //   Code:
    //      0: iload_0           // 从局部变量表加载x到操作数栈
    //      1: iload_1           // 从局部变量表加载y到操作数栈
    //      2: iadd              // 操作数栈顶两个元素相加
    //      3: istore_2          // 结果存储到局部变量表result
    //      4: iload_2           // 加载result
    //      5: ireturn           // 返回
    //
    // 局部变量表：
    //   Slot 0: x (int)
    //   Slot 1: y (int)
    //   Slot 2: result (int)
    //
    // 操作数栈最大深度：2
}

class RecursionDemo {
    private int depth = 0;

    // 栈溢出
    public void recursive() {
        depth++;
        System.out.println("Depth: " + depth);
        recursive(); // 无限递归，导致StackOverflowError
    }

    // 尾递归优化（Java不支持）
    public int factorial(int n) {
        if (n <= 1) return 1;
        return n * factorial(n - 1);
    }

    // 迭代方式（避免栈溢出）
    public int factorialIterative(int n) {
        int result = 1;
        for (int i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
}

// JVM参数
// -Xss：设置线程栈大小
// 默认：512KB（64位系统）
// 增大栈大小：-Xss1m
// 减小栈大小：-Xss256k

public class StackSizeDemo {
    private static int count = 0;

    public static void recursive() {
        count++;
        recursive();
    }

    public static void main(String[] args) {
        try {
            recursive();
        } catch (StackOverflowError e) {
            System.out.println("Stack overflow at depth: " + count);
            System.out.println("Default stack size: ~512KB");
        }
    }
}
```

#### ⭐ 面试高频问题

**Q1: 栈帧包含什么？**
- 局部变量表
- 操作数栈
- 动态链接
- 方法返回地址

**Q2: 局部变量表的存储单位是什么？**
- Slot（变量槽）
- 32位占1个Slot
- 64位占2个Slot

**Q3: 操作数栈的作用是什么？**
- 方法执行的工作区
- 算术运算
- 方法参数传递

**Q4: 什么是动态链接？**
- 将符号引用转为直接引用
- 支持多态
- 指向运行时常量池

#### 与React对比

```javascript
// JavaScript的调用栈
function methodA() {
    console.log('A');
    methodB();
}

function methodB() {
    console.log('B');
    methodC();
}

function methodC() {
    console.log('C');
    // 调用栈：methodA -> methodB -> methodC
}

methodA();

// React中的调用栈
function GrandChild() {
    console.log('GrandChild render');
    return <div>GrandChild</div>;
}

function Child() {
    console.log('Child render');
    return <GrandChild />;
}

function Parent() {
    console.log('Parent render');
    return <Child />;
}

// 渲染调用栈：Parent -> Child -> GrandChild

// React中的错误栈
function ErrorComponent() {
    throw new Error('Something went wrong');
}

class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        console.log('Error stack:', error.stack);
        console.log('Component stack:', errorInfo.componentStack);
    }

    render() {
        return this.props.children;
    }
}
```

---

> 本文档覆盖了Java基础核心知识的所有重要章节，每个知识点都包含：
> 1. 概念讲解（简洁但深入）
> 2. 代码示例（实际可运行的代码）
> 3. 面试高频问题（星号标注）
> 4. 与前端/React的对比说明
>
> 建议结合实际项目练习，加深理解。祝面试顺利！
