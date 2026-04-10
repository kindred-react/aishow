# CSS与HTML核心面试40题

> 本文件涵盖HTML5语义化、CSS核心概念、布局方案、CSS3新特性、响应式设计、性能优化等前端面试高频考点，共40道精选题目，适合系统复习CSS与HTML知识体系。

---

### Q1: HTML5有哪些新增的语义化标签？它们分别用于什么场景？ ⭐

**答案：**

HTML5引入了一系列语义化标签，让页面结构更清晰，对搜索引擎和辅助技术更友好：

| 标签 | 用途 |
|------|------|
| `<header>` | 页面或区块的头部，通常包含导航、logo、标题 |
| `<nav>` | 导航链接区域 |
| `<main>` | 页面主体内容，每个页面只能有一个 |
| `<article>` | 独立的内容单元（博客文章、新闻报道等） |
| `<section>` | 文档中的逻辑分区/章节 |
| `<aside>` | 侧边栏，与主内容相关的辅助信息 |
| `<footer>` | 页面或区块的底部，包含版权、联系方式等 |
| `<figure>` / `<figcaption>` | 独立的引用内容（图片、图表）及其标题 |
| `<details>` / `<summary>` | 可折叠的详情区域 |
| `<time>` | 表示日期/时间 |
| `<mark>` | 高亮标记文本 |
| `<progress>` | 进度条 |
| `<meter>` | 度量衡（如磁盘使用率） |

**语义化的好处：**
1. **SEO优化**：搜索引擎能更好地理解页面结构和内容层级
2. **可访问性**：屏幕阅读器能根据语义标签提供更好的导航体验
3. **代码可读性**：开发者能快速理解页面结构
4. **维护性**：结构清晰，便于团队协作开发

---

### Q2: HTML5的Web Storage有哪些？与Cookie有什么区别？ ⭐⭐

**答案：**

Web Storage包含两种机制：

**1. localStorage**
- 持久化存储，数据不会过期
- 同源（协议+域名+端口）下共享
- 存储容量约5-10MB

**2. sessionStorage**
- 会话级存储，标签页关闭后数据清除
- 仅在当前标签页（页面）内有效
- 存储容量约5-10MB

**与Cookie的区别：**

| 特性 | Cookie | localStorage | sessionStorage |
|------|--------|-------------|---------------|
| 容量 | 约4KB | 约5-10MB | 约5-10MB |
| 生命周期 | 可设置过期时间 | 永久存储 | 会话结束清除 |
| 通信 | 每次请求自动携带 | 不自动发送 | 不自动发送 |
| 作用域 | 同源+路径可配 | 同源共享 | 仅当前页面 |
| API | document.cookie | 简洁的键值对API | 简洁的键值对API |
| 安全 | 可设HttpOnly | 无HttpOnly | 无HttpOnly |

```javascript
// localStorage 使用示例
localStorage.setItem('name', '张三');
const name = localStorage.getItem('name');
localStorage.removeItem('name');
localStorage.clear();

// sessionStorage 使用方式相同
sessionStorage.setItem('token', 'abc123');
```

---

### Q3: HTML中meta标签有哪些常见用途？ ⭐

**答案：**

meta标签用于定义页面的元数据，常见用途包括：

```html
<!-- 字符编码 -->
<meta charset="UTF-8">

<!-- 视口设置（移动端适配必备） -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- 页面描述（SEO） -->
<meta name="description" content="这是一个前端面试题库">

<!-- 关键词（SEO，现代搜索引擎权重已降低） -->
<meta name="keywords" content="前端,面试,CSS,JavaScript">

<!-- 作者 -->
<meta name="author" content="张三">

<!-- 移动端全屏 -->
<meta name="apple-mobile-web-app-capable" content="yes">

<!-- 状态栏颜色 -->
<meta name="theme-color" content="#ffffff">

<!-- HTTP头部等效 -->
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta http-equiv="refresh" content="30">

<!-- Open Graph（社交分享） -->
<meta property="og:title" content="页面标题">
<meta property="og:description" content="页面描述">
<meta property="og:image" content="https://example.com/image.png">

<!-- 禁止搜索引擎索引 -->
<meta name="robots" content="noindex, nofollow">
```

---

### Q4: CSS选择器的优先级是如何计算的？ ⭐⭐

**答案：**

CSS优先级从高到低依次为：

1. `!important`（最高优先级，应尽量避免使用）
2. 内联样式（style属性）—— 权重 1000
3. ID选择器 —— 权重 0100
4. 类选择器、属性选择器、伪类 —— 权重 0010
5. 元素选择器、伪元素 —— 权重 0001
6. 通配符 `*` —— 权重 0000
7. 继承的样式 —— 无权重

**优先级计算规则：**
- 优先级是一个四元组 (inline, id, class, element)
- 比较时从左到右逐级比较
- 同优先级时，后声明的覆盖先声明的

```css
/* 权重计算示例 */
div              /* (0,0,0,1) = 1 */
div p            /* (0,0,0,2) = 2 */
.class1          /* (0,0,1,0) = 10 */
.class1 .class2  /* (0,0,2,0) = 20 */
#id1             /* (0,1,0,0) = 100 */
#id1 .class1     /* (0,1,1,0) = 110 */
div#id1.class1   /* (0,1,1,1) = 111 */
style=""         /* (1,0,0,0) = 1000 */
```

**注意事项：**
- `:not()`伪类本身不增加权重，但其括号内的选择器参与计算
- `:is()`伪类取其参数中优先级最高的选择器
- `!important`会打破正常的层叠规则，维护困难

---

### Q5: 请详细解释CSS盒模型，标准盒模型和IE盒模型有什么区别？ ⭐⭐

**答案：**

CSS盒模型由四部分组成：`content`（内容） + `padding`（内边距） + `border`（边框） + `margin`（外边距）。

**标准盒模型（content-box）：**
- `width/height` 只包含内容区域
- 元素实际占用宽度 = width + padding-left + padding-right + border-left + border-right

**IE盒模型（border-box）：**
- `width/height` 包含 content + padding + border
- 元素实际占用宽度 = width（已包含padding和border）

```css
/* 标准盒模型 */
.box-content {
  box-sizing: content-box; /* 默认值 */
  width: 200px;
  padding: 20px;
  border: 1px solid #000;
  /* 实际宽度 = 200 + 20*2 + 1*2 = 242px */
}

/* IE盒模型（推荐） */
.box-border {
  box-sizing: border-box;
  width: 200px;
  padding: 20px;
  border: 1px solid #000;
  /* 实际宽度 = 200px（内容区域 = 200 - 20*2 - 1*2 = 158px） */
}

/* 全局推荐使用 border-box */
*, *::before, *::after {
  box-sizing: border-box;
}
```

**实际开发建议：**
- 全局设置 `box-sizing: border-box` 是现代前端项目的标配
- border-box让布局计算更直观，width就是元素实际占用的宽度

---

### Q6: 什么是BFC？如何触发BFC？BFC有什么应用场景？ ⭐⭐⭐

**答案：**

**BFC（Block Formatting Context，块级格式化上下文）** 是CSS布局中的一个重要概念，它是一个独立的渲染区域，内部元素的布局不会影响外部元素。

**触发BFC的条件（满足任一即可）：**
1. 根元素（`<html>`）
2. 浮动元素（`float` 不为 `none`）
3. 绝对定位元素（`position` 为 `absolute` 或 `fixed`）
4. 行内块元素（`display` 为 `inline-block`）
5. 表格单元格（`display` 为 `table-cell`）
6. 弹性/网格元素（`display` 为 `flex`、`inline-flex`、`grid`、`inline-grid` 的直接子元素）
7. `overflow` 值不为 `visible`（如 `auto`、`hidden`、`scroll`）
8. `contain` 值为 `layout`、`content`、`paint`、`strict`、`flow`
9. 多列容器（`column-count` 或 `column-width` 不为 `auto`）

**BFC的布局规则：**
1. 内部的Box会在垂直方向上一个接一个放置
2. 属于同一个BFC的两个相邻Box的margin会发生重叠（折叠）
3. 每个元素的左外边缘都与其包含块的左边缘相接触
4. BFC区域不会与float box重叠
5. BFC是一个独立的容器，内外元素互不影响
6. 计算BFC的高度时，浮动元素也会参与计算

**BFC的应用场景：**

```css
/* 1. 清除浮动：让父元素包含浮动子元素 */
.clearfix {
  overflow: hidden; /* 触发BFC */
}

/* 2. 防止margin重叠 */
.wrapper {
  overflow: hidden; /* 创建新的BFC，阻止子元素margin与外部折叠 */
}

/* 3. 自适应两栏布局（左侧固定，右侧自适应） */
.left {
  float: left;
  width: 200px;
}
.right {
  overflow: hidden; /* 触发BFC，不会与左侧浮动元素重叠 */
}
```

---

### Q7: 请详细解释Flex布局，flex-grow、flex-shrink、flex-basis分别是什么？ ⭐⭐

**答案：**

Flex布局（弹性盒布局）是一维布局模型，通过设置 `display: flex` 开启。

**容器属性：**
```css
.container {
  display: flex;
  flex-direction: row | row-reverse | column | column-reverse; /* 主轴方向 */
  flex-wrap: nowrap | wrap | wrap-reverse; /* 是否换行 */
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly; /* 主轴对齐 */
  align-items: stretch | flex-start | flex-end | center | baseline; /* 交叉轴对齐 */
  align-content: flex-start | flex-end | center | space-between | space-around; /* 多行对齐 */
  gap: 10px; /* 行列间距 */
}
```

**项目属性：**

**flex-grow**（放大比例，默认0）：
- 定义项目在剩余空间中的放大比例
- 值为0表示不放大，值为1表示等分剩余空间

**flex-shrink**（缩小比例，默认1）：
- 定义项目在空间不足时的缩小比例
- 值为0表示不缩小

**flex-basis**（初始大小，默认auto）：
- 定义项目在分配多余空间之前的初始大小
- 设置了width时，flex-basis优先级更高

```css
/* flex 是 flex-grow、flex-shrink、flex-basis 的简写 */
.item {
  flex: 1;        /* 等价于 flex: 1 1 0% */
  flex: 0 0 200px; /* 不放大不缩小，固定200px */
  flex: auto;     /* 等价于 flex: 1 1 auto */
  flex: none;     /* 等价于 flex: 0 0 auto */
}
```

**计算示例：**
```css
/* 容器宽度500px，三个子元素 */
.child1 { flex: 1 1 100px; } /* flex-basis: 100px */
.child2 { flex: 2 1 100px; } /* flex-basis: 100px */
.child3 { flex: 1 1 100px; } /* flex-basis: 100px */
/* 总basis = 300px，剩余空间 = 200px */
/* child1 分配: 200 * (1/4) = 50px → 最终 150px */
/* child2 分配: 200 * (2/4) = 100px → 最终 200px */
/* child3 分配: 200 * (1/4) = 50px → 最终 150px */
```

---

### Q8: CSS Grid布局有哪些核心概念和常用属性？ ⭐⭐

**答案：**

Grid布局是二维布局系统，可以同时处理行和列。

**核心概念：**
- **Grid Container**：网格容器（设置 `display: grid` 的元素）
- **Grid Item**：网格项目（容器的直接子元素）
- **Grid Line**：网格线（构成网格结构的分割线）
- **Grid Track**：网格轨道（相邻两条网格线之间的空间）
- **Grid Cell**：网格单元（行和列交叉形成的最小单元）
- **Grid Area**：网格区域（由多个网格单元组成的矩形区域）

**容器属性：**
```css
.container {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr; /* 三列，比例1:2:1 */
  grid-template-rows: 100px auto 50px; /* 三行 */
  grid-template-columns: repeat(3, 1fr); /* 等价于 1fr 1fr 1fr */
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* 自适应列数 */
  gap: 10px 20px; /* 行间距10px，列间距20px */
  justify-items: start | end | center | stretch; /* 水平对齐 */
  align-items: start | end | center | stretch; /* 垂直对齐 */
  justify-content: center | space-between; /* 整体水平对齐 */
  align-content: center | space-between; /* 整体垂直对齐 */
}
```

**项目属性：**
```css
.item {
  grid-column: 1 / 3; /* 从第1条线到第3条线（占2列） */
  grid-row: 1 / 2; /* 从第1条线到第2条线（占1行） */
  grid-column: span 2; /* 占2列 */
  grid-area: 1 / 1 / 3 / 3; /* row-start / col-start / row-end / col-end */
  grid-area: header; /* 使用 grid-template-areas 定义的名称 */
  justify-self: center; /* 单个项目水平对齐 */
  align-self: center; /* 单个项目垂直对齐 */
}
```

**实用示例：经典圣杯布局**
```css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
  min-height: 100vh;
}
.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

---

### Q9: CSS定位有哪些方式？分别有什么特点？ ⭐⭐

**答案：**

CSS有5种定位方式：

**1. static（静态定位，默认值）**
- 正常文档流，top/right/bottom/left/z-index无效

**2. relative（相对定位）**
- 相对于元素自身原始位置偏移
- 不脱离文档流，仍占据原始空间
- 会创建新的层叠上下文

```css
.box {
  position: relative;
  top: 10px;   /* 向下偏移10px */
  left: 20px;  /* 向右偏移20px */
}
```

**3. absolute（绝对定位）**
- 相对于最近的非static定位祖先元素偏移
- 脱离文档流，不占据空间
- 如果没有定位祖先，则相对于初始包含块（通常是viewport）

```css
.parent {
  position: relative; /* 作为定位参考 */
}
.child {
  position: absolute;
  top: 0;
  right: 0;
}
```

**4. fixed（固定定位）**
- 相对于浏览器视口定位
- 脱离文档流
- 滚动时位置不变
- 注意：transform属性会改变fixed的包含块

**5. sticky（粘性定位）**
- 基于scroll位置在relative和fixed之间切换
- 必须指定top/bottom/left/right中至少一个阈值
- 不脱离文档流
- 父元素不能有overflow:hidden/auto

```css
.sticky-header {
  position: sticky;
  top: 0; /* 滚动到顶部时固定 */
  z-index: 100;
}
```

---

### Q10: 什么是层叠上下文（Stacking Context）？如何创建？ ⭐⭐⭐

**答案：**

**层叠上下文**是HTML元素的三维概念，决定了元素在Z轴上的叠放顺序。每个层叠上下文是独立的，内部元素的z-index只在当前上下文内比较。

**创建层叠上下文的条件：**
1. 根元素（`<html>`）
2. `position` 为 `absolute` 或 `relative` 且 `z-index` 不为 `auto`
3. `position` 为 `fixed` 或 `sticky`
4. `opacity` 小于 1
5. `transform` 不为 `none`
6. `filter` 不为 `none`
7. `will-change` 指定了opacity、transform、filter等
8. `isolation` 为 `isolate`
9. `mix-blend-mode` 不为 `normal`
10. `contain` 值为 `layout`、`paint`、`strict`、`content`

**层叠顺序（从后到前）：**
1. 层叠上下文的背景和边框
2. 负z-index的子层叠上下文
3. 块级盒子（文档流中，非定位）
4. 浮动盒子
5. 行内盒子（文档流中，非定位）
6. z-index为0或auto的子层叠上下文
7. 正z-index的子层叠上下文

```html
<!-- 层叠上下文陷阱示例 -->
<div style="position: relative; z-index: 1;">
  <!-- 这个div创建了层叠上下文 -->
  <div style="position: absolute; z-index: 9999;">
    <!-- 这个9999只在父级上下文内有效 -->
    <!-- 无法覆盖父级外部z-index为2的元素 -->
  </div>
</div>
<div style="position: relative; z-index: 2;">
  <!-- 即使z-index只有2，也会覆盖上面z-index为9999的元素 -->
</div>
```

---

### Q11: CSS3的transition、animation和transform分别是什么？有什么区别？ ⭐⭐

**答案：**

**transition（过渡）**
- 需要触发条件（如hover、click）
- 从一个状态平滑过渡到另一个状态
- 只能定义起始和结束状态
- 不可重复，一次性的

```css
.box {
  width: 100px;
  height: 100px;
  background: red;
  transition: width 0.3s ease, background 0.5s linear;
}
.box:hover {
  width: 200px;
  background: blue;
}
```

**animation（动画）**
- 使用@keyframes定义动画序列
- 可以自动播放，不需要触发条件
- 可以定义多个关键帧
- 可控制播放次数、方向、暂停等

```css
@keyframes slideIn {
  0% { transform: translateX(-100%); opacity: 0; }
  50% { transform: translateX(0); opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
}

.box {
  animation: slideIn 2s ease-in-out infinite alternate;
}
```

**animation属性：**
```css
.element {
  animation-name: slideIn;       /* 动画名称 */
  animation-duration: 2s;        /* 持续时间 */
  animation-timing-function: ease; /* 时间函数 */
  animation-delay: 0s;           /* 延迟 */
  animation-iteration-count: infinite; /* 播放次数 */
  animation-direction: alternate; /* 播放方向 */
  animation-fill-mode: forwards;  /* 填充模式 */
  animation-play-state: running;  /* 播放状态 */
}
```

**transform（变换）**
- 用于元素的几何变换
- 不影响文档流
- 常见函数：translate、rotate、scale、skew

```css
.transform-box {
  transform: translate(50px, 100px) rotate(45deg) scale(1.5);
  transform: translateX(50px) translateY(100px);
  transform: rotate3d(1, 1, 0, 45deg);
  transform-origin: center center; /* 变换原点 */
}
```

**三者的区别：**
| 特性 | transition | animation | transform |
|------|-----------|-----------|-----------|
| 触发方式 | 需要事件触发 | 可自动播放 | 配合transition/animation使用 |
| 关键帧 | 仅起始和结束 | 多个关键帧 | 不是动画属性 |
| 循环 | 不支持 | 支持 | 不适用 |
| 性能 | 较好 | 较好 | 最好（GPU加速） |

---

### Q12: 什么是响应式设计？有哪些实现方案？ ⭐⭐

**答案：**

响应式设计（Responsive Design）是指页面能根据不同设备和屏幕尺寸自动调整布局和样式。

**实现方案：**

**1. 媒体查询（Media Query）**
```css
/* 移动优先 */
.container { width: 100%; }

/* 平板 */
@media (min-width: 768px) {
  .container { width: 750px; }
}

/* 桌面 */
@media (min-width: 992px) {
  .container { width: 970px; }
}

/* 大屏 */
@media (min-width: 1200px) {
  .container { width: 1170px; }
}
```

**2. rem/vw/vh单位**
```css
/* rem：相对于根元素font-size */
html { font-size: 16px; }
.box { width: 10rem; } /* 160px */

/* vw/vh：相对于视口宽高 */
.box { width: 50vw; height: 100vh; }

/* vmin/vmax：取视口最小/最大边的百分比 */
.box { font-size: 2vmin; }
```

**3. flexible.js（rem适配方案）**
```javascript
// 动态设置html的font-size
(function() {
  const docEl = document.documentElement;
  function setRemUnit() {
    // 以375px设计稿为基准，1rem = 100px
    const width = docEl.clientWidth;
    docEl.style.fontSize = (width / 3.75) + 'px';
  }
  setRemUnit();
  window.addEventListener('resize', setRemUnit);
})();
```

**4. viewport单位方案（推荐）**
```css
/* 使用vw直接适配，无需JS */
/* 设计稿375px，1vw = 3.75px */
/* 100px = 100/3.75 = 26.667vw */
.box {
  width: 26.667vw;
  /* 可配合postcss-px-to-viewport插件自动转换 */
}
```

**5. CSS Grid/Flex弹性布局**
```css
/* 自动适配的网格 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}
```

**6. 响应式图片**
```html
<picture>
  <source srcset="large.jpg" media="(min-width: 800px)">
  <source srcset="medium.jpg" media="(min-width: 400px)">
  <img src="small.jpg" alt="响应式图片">
</picture>

<img src="photo.jpg"
     srcset="photo-320w.jpg 320w, photo-640w.jpg 640w, photo-1024w.jpg 1024w"
     sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw">
```

---

### Q13: CSS预处理器（Sass/Less）有什么优势？CSS Modules和CSS-in-JS呢？ ⭐⭐

**答案：**

**CSS预处理器（Sass/Less）：**

优势：
1. **变量**：定义可复用的值
2. **嵌套**：减少重复代码
3. **混入（Mixin）**：复用代码块
4. **继承**：一个选择器继承另一个
5. **函数**：内置和自定义函数
6. **模块化**：@import拆分文件

```scss
// Sass示例
$primary-color: #333;
$breakpoint: 768px;

@mixin flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn {
  background: $primary-color;
  padding: 10px 20px;
  &:hover { opacity: 0.8; }
  &--large { padding: 15px 30px; }
}

.container {
  @include flex-center;
  @media (min-width: $breakpoint) {
    flex-direction: row;
  }
}
```

**CSS Modules：**
- 自动为每个类名生成唯一的哈希值，解决全局命名冲突
- 每个CSS文件就是一个模块
- 在React/Vue中广泛使用

```css
/* Button.module.css */
.primary { background: blue; }
.secondary { background: gray; }
```

```jsx
import styles from './Button.module.css';
function Button() {
  return <button className={styles.primary}>Click</button>;
  // 编译后: <button class="Button_primary_abc123">Click</button>
}
```

**CSS-in-JS：**
- 使用JavaScript编写CSS
- 代表库：styled-components、Emotion
- 优势：动态样式、主题切换、消除死代码

```jsx
import styled from 'styled-components';

const Button = styled.button`
  background: ${props => props.primary ? 'blue' : 'gray'};
  padding: 10px 20px;
  border-radius: 4px;
  &:hover { opacity: 0.8; }
`;

// 使用
<Button primary>Click</Button>
```

**三者对比：**
| 特性 | Sass/Less | CSS Modules | CSS-in-JS |
|------|-----------|-------------|-----------|
| 运行时 | 编译时 | 编译时 | 运行时（部分编译时） |
| 作用域 | 全局（靠命名约定） | 局部（自动哈希） | 局部（动态生成） |
| 动态样式 | 有限（mixin） | 有限 | 强大 |
| 学习成本 | 低 | 低 | 中 |
| 性能 | 最好 | 好 | 略有开销 |

---

### Q14: 什么是重绘和回流（重排）？如何优化？ ⭐⭐⭐

**答案：**

**回流（Reflow/重排）：**
- 元素的几何属性发生变化（位置、大小、布局）
- 会重新计算元素的几何信息和位置
- 影响范围大，代价高

**触发回流的操作：**
- 添加/删除可见DOM元素
- 元素位置/尺寸变化（margin、padding、border、width、height）
- 页面初始化渲染
- 浏览器窗口resize
- 读取某些属性：offsetTop、scrollTop、clientTop、getComputedStyle()

**重绘（Repaint）：**
- 元素外观发生变化，但不影响布局
- 如颜色、背景、阴影、visibility等
- 代价相对较小

**优化策略：**

```javascript
// 1. 批量修改DOM，减少回流次数
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);
}
document.getElementById('list').appendChild(fragment);

// 2. 避免频繁读取布局属性（强制同步布局）
// 错误做法：读写交替
for (let i = 0; i < items.length; i++) {
  items[i].style.width = container.offsetWidth + 'px'; // 每次读取都触发回流
}
// 正确做法：缓存布局信息
const width = container.offsetWidth;
for (let i = 0; i < items.length; i++) {
  items[i].style.width = width + 'px';
}

// 3. 使用CSS transform代替top/left
// transform不会触发回流，由GPU处理
.element {
  transform: translateX(100px); /* 推荐 */
  /* left: 100px; */ /* 不推荐，会触发回流 */
}

// 4. 使用will-change提示浏览器
.animated {
  will-change: transform, opacity;
}

// 5. 使用requestAnimationFrame
function animate() {
  element.style.transform = `translateX(${pos}px)`;
  requestAnimationFrame(animate);
}
```

**will-change属性：**
```css
/* 提前告知浏览器元素将发生变化，浏览器可做优化 */
.moving-element {
  will-change: transform;
}
/* 注意：不要滥用，会增加内存占用 */
```

**GPU加速：**
```css
/* 以下属性会触发GPU加速（创建新的合成层） */
.gpu-accelerated {
  transform: translateZ(0);
  /* 或 */
  will-change: transform;
  /* 或 */
  opacity: 0.99;
}
```

---

### Q15: CSS有哪些常见的居中方案？ ⭐⭐

**答案：**

**1. 水平居中**

```css
/* 行内元素 */
.parent { text-align: center; }

/* 块级元素 - 定宽 */
.child {
  width: 200px;
  margin: 0 auto;
}

/* 块级元素 - 不定宽 */
.child {
  display: table;
  margin: 0 auto;
}
```

**2. 垂直居中**

```css
/* 单行文本 */
.parent {
  height: 200px;
  line-height: 200px;
}

/* flex */
.parent {
  display: flex;
  align-items: center;
}
```

**3. 水平垂直居中（最常用）**

```css
/* 方案一：Flex（推荐，最常用） */
.parent {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

/* 方案二：Grid */
.parent {
  display: grid;
  place-items: center;
  height: 300px;
}

/* 方案三：绝对定位 + transform */
.parent {
  position: relative;
  height: 300px;
}
.child {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

/* 方案四：绝对定位 + margin auto */
.parent {
  position: relative;
  height: 300px;
}
.child {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  width: 100px;
  height: 100px;
}

/* 方案五：绝对定位 + calc */
.child {
  position: absolute;
  top: calc(50% - 50px);
  left: calc(50% - 50px);
  width: 100px;
  height: 100px;
}

/* 方案六：table-cell */
.parent {
  display: table-cell;
  vertical-align: middle;
  text-align: center;
}
.child {
  display: inline-block;
}
```

---

### Q16: 如何清除浮动？有哪些方法？ ⭐

**答案：**

浮动元素脱离文档流，会导致父元素高度塌陷。清除浮动的方法：

**1. 额外标签法（不推荐）**
```html
<div class="parent">
  <div class="float-left"></div>
  <div class="clear"></div>
</div>
<style>
  .clear { clear: both; }
</style>
```

**2. 父元素overflow（推荐，简单）**
```css
.parent {
  overflow: hidden; /* 或 auto */
}
```

**3. 伪元素清除浮动（推荐，最常用）**
```css
/* clearfix 方案 */
.clearfix::after {
  content: '';
  display: block;
  clear: both;
  height: 0;
  visibility: hidden;
}

/* 现代浏览器可简写为 */
.clearfix::after {
  content: '';
  display: block;
  clear: both;
}
```

**4. 父元素也设置浮动（不推荐，会影响外层布局）**
```css
.parent { float: left; }
```

**5. 使用Flex或Grid布局（现代方案，无需清除浮动）**
```css
.parent {
  display: flex; /* 或 grid */
}
```

---

### Q17: CSS如何实现文本省略号（单行/多行）？ ⭐

**答案：**

**单行文本省略：**
```css
.ellipsis {
  white-space: nowrap;      /* 不换行 */
  overflow: hidden;         /* 溢出隐藏 */
  text-overflow: ellipsis;  /* 省略号 */
  /* width 需要有明确值 */
}
```

**多行文本省略：**

```css
/* 方案一：-webkit-line-clamp（兼容性较好，推荐） */
.multi-ellipsis {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;    /* 显示3行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 方案二：纯CSS（兼容性一般） */
.multi-ellipsis {
  position: relative;
  max-height: 4.5em;        /* line-height * 行数 */
  line-height: 1.5em;
  overflow: hidden;
}
.multi-ellipsis::after {
  content: '...';
  position: absolute;
  right: 0;
  bottom: 0;
  padding-left: 20px;
  background: linear-gradient(to right, transparent, white 50%);
}
```

---

### Q18: CSS变量（自定义属性）如何使用？ ⭐

**答案：**

CSS变量（Custom Properties）使用 `--` 前缀定义，通过 `var()` 函数使用。

```css
:root {
  --primary-color: #3498db;
  --secondary-color: #2ecc71;
  --font-size-base: 16px;
  --spacing: 8px;
  --border-radius: 4px;
}

.button {
  background: var(--primary-color);
  font-size: var(--font-size-base);
  padding: var(--spacing) calc(var(--spacing) * 2);
  border-radius: var(--border-radius);
}

/* 变量可以继承 */
.card {
  --card-padding: 16px;
  padding: var(--card-padding);
}
.card .title {
  /* 可以使用父级定义的变量 */
  margin-bottom: var(--card-padding);
}

/* 变量可以设置默认值 */
.element {
  color: var(--text-color, #333); /* 如果--text-color未定义，使用#333 */
}

/* JavaScript操作CSS变量 */
// 设置
document.documentElement.style.setProperty('--primary-color', '#e74c3c');
// 读取
const color = getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
```

**CSS变量的优势：**
1. 可在运行时通过JS动态修改，实现主题切换
2. 可以继承，减少重复代码
3. 可设置默认值
4. 参与CSS计算（calc）
5. 比预处理器变量的优势：运行时可修改、可被浏览器DevTools调试

---

### Q19: 伪类和伪元素有什么区别？::before和::after有哪些应用？ ⭐⭐

**答案：**

**伪类（Pseudo-class）：**
- 选择DOM树中已有元素的特殊状态
- 使用单冒号 `:`（CSS3中也支持双冒号）
- 如 `:hover`、`:first-child`、`:nth-child()`、`:focus`、`:disabled`

**伪元素（Pseudo-element）：**
- 创建DOM树中不存在的虚拟元素
- 使用双冒号 `::`（CSS3规范）
- 如 `::before`、`::after`、`::first-line`、`::first-letter`、`::selection`

**核心区别：**
- 伪类是选择元素的某种状态，伪元素是创建虚拟元素
- 伪类出现在选择器的末尾，伪元素也出现在选择器末尾
- 一个选择器只能使用一个伪元素，但可以同时使用多个伪类

**::before 和 ::after 的应用：**

```css
/* 1. 清除浮动 */
.clearfix::after {
  content: '';
  display: block;
  clear: both;
}

/* 2. 图标/装饰 */
.icon::before {
  content: '\2605'; /* 星形字符 */
  margin-right: 8px;
  color: gold;
}

/* 3. 引用样式 */
.quote::before {
  content: '\201C'; /* 左引号 */
  font-size: 3em;
  position: absolute;
  left: -20px;
  top: -10px;
}

/* 4. Tooltip提示 */
.tooltip {
  position: relative;
}
.tooltip::after {
  content: attr(data-tip); /* 使用data属性 */
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.3s;
}
.tooltip:hover::after {
  opacity: 1;
}

/* 5. 自定义复选框 */
.checkbox::after {
  content: '\2713'; /* 对勾 */
  display: none;
}
.checkbox:checked::after {
  display: block;
}

/* 6. 装饰性线条 */
.title::after {
  content: '';
  display: block;
  width: 50px;
  height: 2px;
  background: currentColor;
  margin-top: 10px;
}
```

---

### Q20: CSS Sprite、SVG和Icon Font各有什么优缺点？ ⭐⭐

**答案：**

**CSS Sprite（雪碧图）：**
- 将多个小图标合并为一张大图，通过background-position定位

```css
.icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background: url(sprite.png) no-repeat;
}
.icon-home { background-position: 0 0; }
.icon-user { background-position: -16px 0; }
```

| 优点 | 缺点 |
|------|------|
| 减少HTTP请求数 | 维护困难，修改一个图标要重新生成整张图 |
| 缓存友好 | 不支持多色图标 |
| 兼容性好 | 高DPI屏幕模糊 |
| | 无法通过CSS改变颜色 |

**SVG（矢量图形）：**
```html
<!-- 内联SVG -->
<svg class="icon" viewBox="0 0 24 24">
  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
</svg>

<!-- SVG Sprite -->
<svg style="display:none">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
  </symbol>
</svg>
<svg><use href="#icon-home"/></svg>
```

| 优点 | 缺点 |
|------|------|
| 矢量，任意缩放不失真 | 复杂图形文件较大 |
| 支持多色 | 内联SVG增加DOM节点 |
| 可通过CSS控制颜色、动画 | 需要设计工具导出 |
| 支持压缩（gzip后很小） | IE兼容性需注意 |

**Icon Font（图标字体）：**
```css
/* 引入字体 */
@font-face {
  font-family: 'iconfont';
  src: url('iconfont.woff2') format('woff2');
}
.icon {
  font-family: 'iconfont';
  font-style: normal;
}
```

| 优点 | 缺点 |
|------|------|
| 使用简单，像文字一样 | 只能单色 |
| 矢量，不失真 | 字体加载失败显示方框 |
| 可通过CSS控制大小、颜色 | 渲染可能有锯齿 |
| 兼容性好 | 安全问题（可被抓取） |

**推荐方案：**
- 现代项目优先使用 **SVG**（内联或SVG Sprite）
- 如果需要大量简单单色图标，可考虑 **Icon Font**
- CSS Sprite已逐渐被淘汰

---

### Q21: 什么是CSS的包含块（Containing Block）？ ⭐⭐⭐

**答案：**

包含块是元素定位和尺寸计算的参考矩形区域。不同定位方式下，包含块的确定方式不同：

**1. 根元素的包含块**
- 由视口（viewport）建立

**2. static/relative定位的元素**
- 包含块由最近的块级祖先元素的内容边界（content edge）构成

**3. absolute定位的元素**
- 包含块由最近的非static定位祖先元素的padding边界（padding edge）构成
- 如果没有这样的祖先，则为初始包含块（视口）

**4. fixed定位的元素**
- 包含块由视口建立
- 但如果祖先元素有transform/perspective/filter属性，则该祖先成为包含块

```css
/* absolute定位的包含块示例 */
.parent {
  position: relative;
  padding: 20px;
  width: 300px;
  height: 300px;
}
.child {
  position: absolute;
  top: 0;
  left: 0;
  /* 子元素会定位到父元素的padding区域左上角，不是content区域 */
}
```

---

### Q22: CSS中line-height有什么特殊之处？ ⭐⭐

**答案：**

**line-height的特殊性：**
1. **可以不带单位**：当line-height不带单位时，它是相对于当前元素的font-size计算的
2. **继承性**：无单位的line-height在继承时，子元素会重新根据自身的font-size计算，而不是直接继承计算后的值

```css
.parent {
  font-size: 16px;
  line-height: 1.5; /* 实际行高 = 16 * 1.5 = 24px */
}
.child {
  font-size: 24px;
  /* 继承的是1.5，实际行高 = 24 * 1.5 = 36px */
}

/* 对比带单位的情况 */
.parent-fixed {
  font-size: 16px;
  line-height: 24px; /* 固定值 */
}
.child-fixed {
  font-size: 24px;
  /* 直接继承24px，行高不够 */
}
```

**line-height与垂直居中：**
- 当line-height等于height时，单行文本可以垂直居中
- 原理：文字在行框中默认垂直居中

```css
.center-text {
  height: 40px;
  line-height: 40px; /* 单行文本垂直居中 */
}
```

---

### Q23: display:none、visibility:hidden和opacity:0有什么区别？ ⭐⭐

**答案：**

| 特性 | display:none | visibility:hidden | opacity:0 |
|------|-------------|-------------------|-----------|
| 是否占据空间 | 否 | 是 | 是 |
| 是否触发回流 | 是 | 否 | 否 |
| 是否触发重绘 | 是 | 是 | 是 |
| 子元素是否隐藏 | 是 | 是 | 否（子元素可设opacity显示） |
| 是否可交互 | 否 | 否 | 是 |
| 是否可被选中 | 否 | 否 | 是 |
| transition支持 | 否 | 是 | 是 |
| 表单元素 | 不参与表单提交 | 参与提交 | 参与提交 |
| 可访问性 | 从可访问性树移除 | 仍存在于可访问性树 | 仍存在于可访问性树 |

```css
/* display:none - 完全移除，不占空间 */
.hidden { display: none; }

/* visibility:hidden - 隐藏但占空间 */
.invisible { visibility: hidden; }

/* opacity:0 - 透明但可交互 */
.transparent { opacity: 0; }

/* 配合pointer-events和aria-hidden实现更好的隐藏 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

---

### Q24: CSS中position:fixed在移动端有什么坑？ ⭐⭐

**答案：**

**移动端fixed定位的常见问题：**

**1. 软键盘弹出时fixed失效**
- iOS Safari中，软键盘弹出后，fixed元素会变成absolute行为
- 解决方案：监听键盘事件，手动调整位置

```javascript
// 解决iOS软键盘问题
window.addEventListener('resize', () => {
  if (document.activeElement.tagName === 'INPUT') {
    // 键盘弹出时的处理
    document.activeElement.scrollIntoView({ behavior: 'smooth' });
  }
});
```

**2. transform影响fixed**
- 父元素设置transform后，fixed会变成absolute行为

```css
/* 问题代码 */
.parent {
  transform: translateZ(0); /* fixed子元素不再相对视口 */
}
.fixed-child {
  position: fixed; /* 实际表现为absolute */
}

/* 解决方案：将fixed元素移到transform父元素外面 */
```

**3. iOS Safari的滚动弹性效果**
- fixed元素在滚动时可能产生抖动
- 解决方案：使用 `position: sticky` 替代

---

### Q25: 什么是CSS的margin合并（折叠）？如何防止？ ⭐⭐

**答案：**

**margin折叠规则：**
- 相邻的块级元素的垂直margin会发生合并
- 合并后的margin值取两者中的较大值（不是相加）
- 只发生在垂直方向（上下margin）

**发生折叠的场景：**
1. 相邻兄弟元素的margin
2. 父元素和第一个/最后一个子元素的margin
3. 空块级元素的上下margin

```css
/* 场景1：兄弟元素margin折叠 */
.box1 { margin-bottom: 20px; }
.box2 { margin-top: 30px; }
/* 间距 = max(20, 30) = 30px，不是50px */

/* 场景2：父子元素margin折叠 */
.parent { margin-top: 10px; }
.child { margin-top: 20px; }
/* 父元素顶部margin = max(10, 20) = 20px */
```

**防止margin折叠的方法：**
```css
/* 1. 创建BFC */
.parent {
  overflow: hidden;
  /* 或 display: flow-root;（推荐，无副作用） */
}

/* 2. 使用padding代替margin */
.parent {
  padding-top: 20px;
}

/* 3. 使用border */
.parent {
  border-top: 1px solid transparent;
}

/* 4. 使用flex/grid布局 */
.parent {
  display: flex;
  flex-direction: column;
}

/* 5. 绝对定位 */
.child {
  position: absolute;
}
```

---

### Q26: CSS中link和@import有什么区别？ ⭐

**答案：**

| 特性 | `<link>` | `@import` |
|------|----------|-----------|
| 所属 | HTML标签 | CSS语法 |
| 加载时机 | 页面加载时同步加载CSS | 等待CSS文件下载完后才加载 |
| 兼容性 | 无兼容问题 | CSS2.1规范，老浏览器不支持 |
| JS控制 | 可通过JS动态创建link | 不可通过JS动态控制 |
| 权重 | 同等 | 同等 |
| 并行下载 | 可以与其他资源并行 | 阻塞，串行下载 |

```html
<!-- link方式（推荐） -->
<link rel="stylesheet" href="style.css">
```

```css
/* @import方式（不推荐） */
@import url('style.css');
/* 问题：@import引用的CSS会等到主CSS下载完后才开始下载，造成串行加载 */
```

**结论：** 生产环境中应优先使用 `<link>` 标签引入CSS文件。

---

### Q27: 什么是FOUC？如何避免？ ⭐⭐

**答案：**

**FOUC（Flash of Unstyled Content，无样式内容闪烁）** 是指页面在加载过程中，先显示无样式的HTML内容，然后CSS加载完后突然变成有样式的页面，造成视觉闪烁。

**产生原因：**
- CSS文件加载慢或放在页面底部
- 使用@import引入CSS（串行加载）
- 浏览器渲染机制导致

**避免方法：**
```html
<!-- 1. 将CSS放在head中 -->
<head>
  <link rel="stylesheet" href="style.css">
</head>

<!-- 2. 使用内联关键CSS（Critical CSS） -->
<head>
  <style>
    /* 首屏关键样式内联 */
    body { margin: 0; font-family: sans-serif; }
    .header { background: #333; color: white; height: 60px; }
  </style>
  <link rel="stylesheet" href="style.css" media="print" onload="this.media='all'">
</head>

<!-- 3. 使用preload预加载CSS -->
<head>
  <link rel="preload" href="style.css" as="style">
  <link rel="stylesheet" href="style.css">
</head>
```

---

### Q28: CSS选择器有哪些？如何优化CSS选择器性能？ ⭐⭐

**答案：**

**CSS选择器分类：**

```css
/* 基础选择器 */
*              /* 通配符 */
div            /* 元素选择器 */
.class         /* 类选择器 */
#id            /* ID选择器 */

/* 组合选择器 */
div p          /* 后代选择器 */
div > p        /* 子选择器 */
div + p        /* 相邻兄弟选择器 */
div ~ p        /* 通用兄弟选择器 */

/* 属性选择器 */
[type="text"]  /* 精确匹配 */
[class^="btn"] /* 开头匹配 */
[class$="ing"] /* 结尾匹配 */
[class*="active"] /* 包含匹配 */

/* 伪类选择器 */
:first-child
:last-child
:nth-child(n)
:not()
:is()
:where()
:has()         /* CSS4新特性 */

/* 伪元素选择器 */
::before
::after
::first-line
::first-letter
::selection
```

**选择器性能优化：**
1. 避免使用通配符 `*`
2. 避免过深的后代选择器（如 `#header .nav .item .link`）
3. ID选择器不需要加元素限定（`div#id` 比 `#id` 慢）
4. 使用类选择器代替标签选择器
5. 避免使用 `!important`
6. 右侧选择器尽量具体（浏览器从右到左匹配）

```css
/* 不推荐 */
#header .nav ul li a span {}

/* 推荐 */
.nav-link-text {}

/* :where() 不增加权重 */
:where(.card, .panel) .title {
  font-size: 1.5rem;
}
```

---

### Q29: 什么是CSS的content-visibility属性？ ⭐⭐⭐

**答案：**

`content-visibility` 是CSS的一个性能优化属性，可以跳过屏幕外元素的渲染工作。

```css
/* auto：浏览器自动管理，屏幕外元素跳过渲染 */
.section {
  content-visibility: auto;
  /* 需要配合 contain-intrinsic-size 指定预估大小 */
  contain-intrinsic-size: 0 500px;
}
```

**工作原理：**
- `visible`（默认）：正常渲染
- `hidden`：类似 `display: none`，但保留渲染状态（可恢复）
- `auto`：屏幕外元素跳过渲染，但保留占位空间

**优势：**
- 大幅减少首次渲染时间
- 减少页面加载时的布局和绘制工作量
- 对于长列表/长文章效果显著

**注意：**
- 使用 `auto` 时建议配合 `contain-intrinsic-size` 防止滚动条跳动
- 适合内容较多、超出屏幕的页面

---

### Q30: CSS中如何实现主题切换（深色/浅色模式）？ ⭐⭐

**答案：**

**方案一：CSS变量 + data属性（推荐）**

```css
:root {
  --bg-color: #ffffff;
  --text-color: #333333;
  --primary-color: #1890ff;
}

[data-theme="dark"] {
  --bg-color: #1a1a2e;
  --text-color: #e0e0e0;
  --primary-color: #4fc3f7;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
}
```

```javascript
// 切换主题
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

// 初始化主题
const savedTheme = localStorage.getItem('theme') ||
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);
```

**方案二：prefers-color-scheme媒体查询**

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a2e;
    --text-color: #e0e0e0;
  }
}
```

**方案三：CSS滤镜（简单粗暴）**
```css
[data-theme="dark"] img,
[data-theme="dark"] video {
  filter: brightness(0.8) contrast(1.2);
}
```

---

### Q31: 什么是CSS的will-change属性？使用时有哪些注意事项？ ⭐⭐

**答案：**

`will-change` 属性用于提前告知浏览器元素将要发生的变化，让浏览器提前做好优化准备。

```css
/* 提前告知浏览器该元素将要变化transform和opacity */
.animated-element {
  will-change: transform, opacity;
}

/* 常用于动画元素 */
.slide-in {
  will-change: transform;
}
```

**工作原理：**
- 浏览器会为设置了will-change的元素创建独立的合成层
- 将渲染工作交给GPU处理
- 减少动画卡顿

**注意事项：**
1. **不要滥用**：每个合成层都消耗额外内存
2. **提前设置**：在动画开始前设置，动画结束后移除
3. **不要设置太多属性**：只设置实际会变化的属性
4. **配合transform使用**：transform和opacity是最适合GPU加速的属性

```javascript
// 最佳实践：动态添加和移除
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});
element.addEventListener('animationend', () => {
  element.style.willChange = 'auto';
});
```

---

### Q32: CSS中如何实现多列文本布局？ ⭐

**答案：**

```css
/* 方案一：column属性（传统多列布局） */
.multi-column {
  column-count: 3;           /* 列数 */
  column-width: 200px;       /* 列宽（与column-count二选一） */
  column-gap: 30px;          /* 列间距 */
  column-rule: 1px solid #ccc; /* 列分隔线 */
  column-span: all;          /* 元素跨所有列 */
}

/* 方案二：CSS Grid实现更灵活的多列 */
.grid-columns {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

/* 方案三：CSS Grid实现瀑布流（masonry，实验性） */
.masonry {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: masonry; /* 实验性功能 */
}
```

---

### Q33: 什么是CSS的aspect-ratio属性？ ⭐

**答案：**

`aspect-ratio` 用于设置元素的宽高比，替代传统的padding-top百分比方案。

```css
/* 传统方案：padding-top实现16:9 */
.video-container {
  position: relative;
  padding-top: 56.25%; /* 9/16 = 56.25% */
}
.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 现代方案：aspect-ratio */
.video-container {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* 常用比例 */
.square { aspect-ratio: 1 / 1; }
.video { aspect-ratio: 16 / 9; }
.photo { aspect-ratio: 4 / 3; }
```

---

### Q34: CSS中如何实现毛玻璃效果？ ⭐⭐

**答案：**

```css
/* 使用 backdrop-filter 实现毛玻璃效果 */
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px); /* Safari兼容 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
}

/* 完整的毛玻璃卡片示例 */
.glass-card {
  width: 300px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 兼容性处理：不支持backdrop-filter时的降级方案 */
@supports not (backdrop-filter: blur(10px)) {
  .glass {
    background: rgba(255, 255, 255, 0.85);
  }
}
```

---

### Q35: 什么是CSS的contain属性？ ⭐⭐⭐

**答案：**

`contain` 属性用于限制元素的渲染范围，告诉浏览器该元素的样式和布局不会影响外部元素。

```css
/* contain值 */
.element {
  contain: none;    /* 默认，不限制 */
  contain: layout;  /* 内部布局不影响外部 */
  contain: paint;   /* 内部绘制不影响外部，创建新的stacking context */
  contain: size;    /* 固定尺寸，不受内容影响 */
  contain: style;   /* 计数器等不影响外部 */
  contain: strict;  /* layout + paint + size */
  contain: content; /* layout + paint */
}
```

**使用场景：**
```css
/* 1. 独立组件 */
.widget {
  contain: content;
}

/* 2. 离屏元素 */
.offscreen {
  contain: strict;
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}

/* 3. 第三方嵌入内容 */
.embed {
  contain: strict;
}
```

---

### Q36: 什么是CSS的scroll-snap？如何实现全屏滚动？ ⭐⭐

**答案：**

```css
/* scroll-snap实现全屏滚动 */
.container {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory; /* mandatory: 强制对齐, proximity: 接近对齐 */
}

.section {
  height: 100vh;
  scroll-snap-align: start; /* 对齐位置：start/center/end */
  scroll-snap-stop: always; /* 每次只滚动一个section */
}

/* 水平滚动轮播 */
.carousel {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch; /* iOS平滑滚动 */
}

.carousel-item {
  flex: 0 0 100%;
  scroll-snap-align: center;
}
```

---

### Q37: CSS中如何实现渐变效果？ ⭐

**答案：**

```css
/* 线性渐变 */
.linear {
  background: linear-gradient(to right, red, blue);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background: linear-gradient(to right, red 0%, red 30%, blue 30%, blue 100%);
}

/* 径向渐变 */
.radial {
  background: radial-gradient(circle, red, blue);
  background: radial-gradient(circle at top left, red, blue);
}

/* 锥形渐变 */
.conic {
  background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
  /* 饼图效果 */
  background: conic-gradient(red 0% 25%, blue 25% 50%, green 50% 75%, yellow 75%);
}

/* 重复渐变 */
.repeating {
  background: repeating-linear-gradient(
    45deg,
    #606dbc,
    #606dbc 10px,
    #465298 10px,
    #465298 20px
  );
}

/* 渐变边框 */
.gradient-border {
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              linear-gradient(135deg, #667eea, #764ba2) border-box;
}
```

---

### Q38: 什么是CSS的clip-path？有哪些应用？ ⭐⭐

**答案：**

`clip-path` 用于裁剪元素的显示区域，创建各种形状。

```css
/* 基础形状 */
.circle { clip-path: circle(50%); }
.ellipse { clip-path: ellipse(50% 40% at 50% 50%); }
.triangle { clip-path: polygon(50% 0%, 0% 100%, 100% 100%); }
.hexagon { clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%); }

/* 使用polygon自定义形状 */
.custom {
  clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%);
}

/* 动画效果 */
.animated-clip {
  clip-path: circle(0% at 50% 50%);
  transition: clip-path 0.5s ease;
}
.animated-clip:hover {
  clip-path: circle(100% at 50% 50%);
}

/* 配合clip-path实现图片展示效果 */
.image-reveal {
  clip-path: inset(0 100% 0 0);
  animation: reveal 1s forwards;
}
@keyframes reveal {
  to { clip-path: inset(0 0 0 0); }
}
```

---

### Q39: CSS中有哪些隐藏元素的方法？各有什么区别？ ⭐⭐

**答案：**

```css
/* 1. display: none - 完全不渲染，不占空间 */
.method1 { display: none; }

/* 2. visibility: hidden - 隐藏但占空间 */
.method2 { visibility: hidden; }

/* 3. opacity: 0 - 透明度为0，占空间，可交互 */
.method3 { opacity: 0; }

/* 4. position: absolute + 移出视口 */
.method4 {
  position: absolute;
  top: -9999px;
  left: -9999px;
}

/* 5. clip/clip-path */
.method5 {
  clip: rect(0, 0, 0, 0);
  /* 或 */
  clip-path: polygon(0 0, 0 0, 0 0, 0 0);
}

/* 6. transform: scale(0) */
.method6 { transform: scale(0); }

/* 7. height: 0 + overflow: hidden */
.method7 {
  height: 0;
  overflow: hidden;
  padding: 0;
  margin: 0;
}

/* 8. 无障碍隐藏（屏幕阅读器可读） */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

**选择建议：**
- 完全不显示：`display: none`
- 保留空间：`visibility: hidden`
- 动画过渡：`opacity: 0` + `pointer-events: none`
- 无障碍：`.sr-only` 类

---

### Q40: 什么是CSS的subgrid？如何使用？ ⭐⭐⭐

**答案：**

`subgrid` 允许子元素继承父网格的轨道定义，实现跨层级的网格对齐。

```css
/* 父网格 */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* 子网格：继承父网格的列轨道 */
.card {
  grid-column: span 3; /* 占满3列 */
  display: grid;
  grid-template-columns: subgrid; /* 继承父网格的列定义 */
}

/* 实际应用：卡片内容与网格对齐 */
.layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.card {
  grid-column: span 4;
  display: grid;
  grid-template-columns: subgrid;
  gap: 16px;
}
.card-header { grid-column: span 2; }
.card-body { grid-column: span 2; }
.card-footer { grid-column: span 4; }

/* 行方向的subgrid */
.row-subgrid {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

**subgrid的优势：**
- 子元素可以与父网格的轨道线对齐
- 不需要重复定义网格模板
- 保持整体布局的一致性

**浏览器兼容性：** Chrome 117+、Firefox 71+、Safari 16+，主流现代浏览器已支持。
