# React 与 Vue 框架原理

> 面向3-5年经验全栈开发者框架原理面试指南

---

## 目录

1. [React 核心原理](#1-react-核心原理)
2. [Vue 核心原理](#2-vue-核心原理)
3. [React vs Vue 对比](#3-react-vs-vue-对比)

---

## 1. React 核心原理

### 1.1 Virtual DOM 的本质

#### 概念

Virtual DOM（虚拟 DOM）是真实 DOM 的 JavaScript 对象表示。React 通过维护一棵虚拟 DOM 树，在状态变化时进行 Diff 计算，找出最小变更集，然后批量更新真实 DOM。

```javascript
// 真实 DOM
const realDOM = document.createElement('div');
realDOM.setAttribute('class', 'container');
realDOM.innerHTML = '<h1>Hello</h1><p>World</p>';

// 虚拟 DOM（JS 对象描述）
const virtualDOM = {
  type: 'div',
  props: {
    className: 'container',
    children: [
      { type: 'h1', props: { children: 'Hello' } },
      { type: 'p', props: { children: 'World' } }
    ]
  }
};

// 虚拟 DOM 的优势：
// 1. 跨平台 — 可以渲染到 DOM、Canvas、Native 等
// 2. 批量更新 — 多次状态变更合并为一次 DOM 操作
// 3. Diff 算法 — 只更新变化的部分，减少 DOM 操作
```

#### Virtual DOM 创建流程

```
JSX → React.createElement() → Virtual DOM Object → ReactDOM.render() → Real DOM
```

```jsx
// JSX 语法
const element = (
  <div className="app">
    <h1>{title}</h1>
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  </div>
);

// 编译后（Babel）
const element = React.createElement(
  'div',
  { className: 'app' },
  React.createElement('h1', null, title),
  React.createElement('ul', null,
    items.map(item =>
      React.createElement('li', { key: item.id }, item.name)
    )
  )
);
```

### 1.2 Diff 算法

#### 核心策略

React 的 Diff 算法基于三个假设：
1. **跨层级的节点移动极少** — 只比较同一层级的节点
2. **不同类型的元素产生不同的树** — 类型不同直接替换
3. **Key 标识节点身份** — 通过 key 判断节点是否可复用

#### 同层比较

```javascript
// 比较两棵虚拟 DOM 树
function diff(oldTree, newTree) {
  // 1. 同层比较，不跨层级
  // 2. 节点类型不同 → 直接替换（销毁旧子树，创建新子树）
  // 3. 节点类型相同 → 更新属性，递归比较子节点
  // 4. 列表比较 → 通过 key 匹配
}
```

#### key 的作用

```jsx
// bad: 使用 index 作为 key（列表顺序变化时性能差，可能导致状态错误）
{items.map((item, index) => <ListItem key={index} data={item} />)}

// good: 使用唯一 id 作为 key
{items.map(item => <ListItem key={item.id} data={item} />)}

// index 作为 key 的问题：
// 列表 [A, B, C] → [D, B, C]（在头部插入 D）
// 使用 index：React 认为 0 号位从 A 变成了 D，需要更新 A→D
// 使用 id：React 知道 D 是新增的，A 被删除了
```

#### 列表 Diff 策略

```
旧列表: [A, B, C, D]
新列表: [A, E, C, D]

1. 从头比较：A === A → 复用
2. B !== E → 停止
3. 从尾比较：D === D → 复用，C === C → 复用
4. 剩余：旧 [B]，新 [E]
5. 结论：删除 B，新增 E
```

### 1.3 Fiber 架构

#### 核心概念

Fiber 是 React 16 引入的新的协调引擎，解决了大型应用中 React 更新可能阻塞主线程的问题。

```javascript
// Fiber 节点结构
const fiber = {
  // 静态结构
  tag: FunctionComponent, // 组件类型
  type: App,              // 具体的组件函数/类
  key: null,

  // 树结构（链表）
  return: parentFiber,    // 父节点
  child: firstChildFiber, // 第一个子节点
  sibling: nextFiber,     // 下一个兄弟节点

  // 工作单元
  pendingProps: {},       // 待处理的 props
  memoizedProps: {},      // 上一次的 props
  memoizedState: {},      // 上一次的 state
  updateQueue: null,      // 更新队列

  // 副作用
  flags: Placement,       // 需要执行的操作（增删改）
  alternate: currentFiber // 双缓冲：指向另一棵树的对应节点
};
```

#### 时间切片与可中断渲染

```
传统 Stack Reconciler（React 15）：
  递归遍历组件树 → 不可中断 → 长任务阻塞主线程 → 页面卡顿

Fiber Reconciler（React 16+）：
  将渲染工作拆分为多个小单元（Fiber 节点）
  → 每个单元执行完后检查是否需要让出主线程
  → 如果需要（有更高优先级任务），暂停当前工作
  → 空闲时恢复工作
  → 实现可中断渲染
```

```javascript
// 简化的 Fiber 工作循环
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    // 执行当前工作单元
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检查是否需要让出主线程
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (nextUnitOfWork) {
    // 还有工作未完成，请求下一次空闲时间
    requestIdleCallback(workLoop);
  } else {
    // 所有工作完成，提交更新
    commitRoot();
  }
}

requestIdleCallback(workLoop);
```
> 注意：此为简化示意，React 实际生产版本使用自研 Scheduler（基于 MessageChannel），而非 requestIdleCallback

#### 双缓冲机制

```
currentFiber（当前屏幕上显示的树）
    ↕ alternate
workInProgressFiber（正在内存中构建的树）

流程：
1. 基于 currentFiber 创建 workInProgressFiber
2. 在 workInProgressFiber 上进行 Diff 和更新
3. workInProgressFiber 构建完成后，切换为 currentFiber
4. 一次性将变更应用到 DOM
```

### 1.4 Hooks 原理

#### useState 闭包原理

```javascript
// useState 的本质：闭包 + 链表
// 每个 Fiber 节点有一个 memoizedState 链表，存储所有 Hook 的状态

// 简化实现
let currentFiber = null;
let hookIndex = 0;

function useState(initialState) {
  const fiber = currentFiber;

  // 获取或创建 Hook
  const hook = fiber.memoizedState[hookIndex] || {
    state: typeof initialState === 'function' ? initialState() : initialState,
    queue: [] // 更新队列
  };

  // 如果有待处理的更新，计算新状态
  while (hook.queue.length) {
    const action = hook.queue.shift();
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  }

  // 保存 Hook
  fiber.memoizedState[hookIndex] = hook;
  hookIndex++;

  // 返回状态和更新函数
  const setState = (action) => {
    hook.queue.push(action);
    // 调度更新
    scheduleUpdate(fiber);
  };

  return [hook.state, setState];
}

// 为什么 Hook 不能在条件语句中使用？
// 因为 React 依赖 Hook 的调用顺序来匹配状态
// 如果顺序变化，状态会错乱
```

#### useEffect 执行时机

```javascript
// useEffect 的执行时机：
// 1. 组件首次渲染完成后（DOM 更新后）
// 2. 依赖项变化后的渲染完成后
// 3. 组件卸载时执行清理函数

// 简化实现
function useEffect(callback, deps) {
  const hook = currentFiber.memoizedState[hookIndex] || {
    deps: undefined,
    cleanup: null
  };

  // 比较依赖项
  const depsChanged = !deps ||
    !hook.deps ||
    deps.some((dep, i) => !Object.is(dep, hook.deps[i]));

  if (depsChanged) {
    // 执行清理函数
    if (hook.cleanup) hook.cleanup();
    // 在浏览器绘制后异步执行
    scheduleCallback(() => {
      hook.cleanup = callback();
    });
    hook.deps = deps;
  }

  hookIndex++;
  return hook;
}

// useEffect vs useLayoutEffect：
// useEffect：异步执行，不阻塞浏览器绘制
// useLayoutEffect：同步执行，在 DOM 更新后、浏览器绘制前执行
// 适用场景：需要测量 DOM 尺寸、同步修改 DOM
```

#### useMemo / useCallback 依赖比较

```javascript
// useMemo — 缓存计算结果
// useCallback — 缓存函数引用

// 依赖比较使用 Object.is（同值相等）
// Object.is(NaN, NaN) === true
// Object.is(+0, -0) === false

// 常见问题：每次渲染都创建新的引用
function Parent() {
  const [count, setCount] = useState(0);

  // bad: 每次渲染都创建新的对象/函数
  const style = { color: 'red' }; // 新引用
  const handleClick = () => {};    // 新引用

  // good: 使用 useMemo/useCallback 缓存
  const memoizedStyle = useMemo(() => ({ color: 'red' }), []);
  const memoizedClick = useCallback(() => {}, []);

  return <Child style={memoizedStyle} onClick={memoizedClick} />;
}

// 依赖数组为空 [] 表示永远不会重新计算
// 依赖数组省略表示每次渲染都重新计算
```

#### useRef 本质

```javascript
// useRef — 返回一个可变引用对象，在组件整个生命周期内保持不变
// 本质：{ current: initialValue }

function useRef(initialValue) {
  const hook = currentFiber.memoizedState[hookIndex] || {
    current: initialValue
  };
  currentFiber.memoizedState[hookIndex] = hook;
  hookIndex++;
  return hook;
}

// useRef vs useState：
// useRef 修改不会触发重新渲染
// useState 修改会触发重新渲染

// useRef 的应用场景：
// 1. 获取 DOM 引用
const inputRef = useRef(null);
useEffect(() => {
  inputRef.current.focus();
}, []);

// 2. 保存不触发渲染的可变值
const timerRef = useRef(null);
useEffect(() => {
  timerRef.current = setInterval(() => {}, 1000);
  return () => clearInterval(timerRef.current);
}, []);

// 3. 保存前一次的值
function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
```

### 1.5 React 合成事件与批量更新

#### 合成事件（SyntheticEvent）

```javascript
// React 的合成事件是对原生事件的跨浏览器封装
// 1. 所有事件都委托到 root 节点（React 17+）
// 2. 自动处理浏览器兼容性
// 3. 事件对象会被复用（事件回调执行完后属性被清空）

function Button() {
  const handleClick = (e) => {
    console.log(e); // SyntheticEvent
    console.log(e.nativeEvent); // 原生 MouseEvent

    // bad: 异步访问事件对象
    setTimeout(() => {
      console.log(e.target); // null（已被清空）
    }, 0);

    // good: 持久化事件对象
    e.persist();
    // 注意：React 17+ 已移除事件池，e.persist() 不再需要，异步访问事件对象是安全的
    setTimeout(() => {
      console.log(e.target); // 正常
    }, 0);
  };

  return <button onClick={handleClick}>Click</button>;
}
```

#### 批量更新

```javascript
// React 18 之前：只在 React 事件处理函数中自动批量更新
function handleClick() {
  setCount(1); // 不会立即重新渲染
  setName('张三'); // 不会立即重新渲染
  // 事件处理函数结束后，合并为一次渲染
}

// React 18 之后：所有更新都自动批量（包括 setTimeout、Promise、原生事件）
function handleClick() {
  setCount(1);
  setName('张三');
  // 自动合并为一次渲染
}

// 如果需要立即获取更新后的值，使用 flushSync
import { flushSync } from 'react-dom';

function handleClick() {
  flushSync(() => {
    setCount(1);
  }); // 强制同步渲染
  console.log(count); // 1

  flushSync(() => {
    setName('张三');
  }); // 又一次渲染
  console.log(name); // '张三'
}
```

### 1.6 React.memo / useMemo / useCallback 性能优化

```jsx
// React.memo — 浅比较 props，避免不必要的重新渲染
const Child = React.memo(function Child({ name, age }) {
  console.log('Child rendered');
  return <div>{name} - {age}</div>;
});

// 自定义比较函数
const Child = React.memo(
  function Child({ name, age }) {
    return <div>{name} - {age}</div>;
  },
  (prevProps, nextProps) => {
    // 返回 true 表示不需要重新渲染
    return prevProps.name === nextProps.name && prevProps.age === nextProps.age;
  }
);

// useMemo — 缓存计算结果
function Parent({ items }) {
  // bad: 每次渲染都重新排序
  const sorted = items.sort((a, b) => a.id - b.id);

  // good: 只在 items 变化时重新排序
  const sortedMemo = useMemo(
    () => [...items].sort((a, b) => a.id - b.id),
    [items]
  );

  return <List items={sortedMemo} />;
}

// useCallback — 缓存函数引用
function Parent() {
  const [count, setCount] = useState(0);

  // bad: 每次渲染创建新函数
  const handleClick = () => setCount(c => c + 1);

  // good: 缓存函数引用
  const handleClickMemo = useCallback(
    () => setCount(c => c + 1),
    [] // 依赖为空，函数永远不会变
  );

  return <Child onClick={handleClickMemo} />;
}

// 优化原则：
// 1. 不要过度优化 — 只在确认有性能问题时使用
// 2. useMemo/useCallback 本身也有开销（比较依赖项）
// 3. 优先考虑组件拆分和数据结构优化
```

### 1.7 React SSR 原理

#### 基本流程

```
服务端：
  1. React 组件 → renderToString() → HTML 字符串
  2. 将 HTML 字符串发送给浏览器

客户端（Hydrate）：
  1. 浏览器接收到 HTML，直接显示（首屏快）
  2. 加载 JS 代码
  3. hydrateRoot() — React 复用已有 DOM，绑定事件
  4. 应用变为可交互状态
```

```jsx
// 服务端
import { renderToString } from 'react-dom/server';
import App from './App';

app.get('*', (req, res) => {
  const html = renderToString(<App url={req.url} />);
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});

// 客户端
import { hydrateRoot } from 'react-dom/client';
import App from './App';

hydrateRoot(document.getElementById('root'), <App />);
```

#### 流式 SSR（React 18）

```jsx
// renderToString — 同步，等待所有组件渲染完才返回
// renderToPipeableStream — 流式，边渲染边发送

import { renderToPipeableStream } from 'react-dom/server';

app.get('*', (req, res) => {
  const stream = renderToPipeableStream(<App />, {
    bootstrapModules: ['/bundle.js'],
    onShellReady() {
      // Shell 部分就绪，开始流式传输
      res.setHeader('content-type', 'text/html');
      stream.pipe(res);
    },
    onError(error) {
      console.error(error);
    }
  });
});

// 优势：
// 1. TTFB 更快 — Shell 部分先返回
// 2. Suspense 支持 — 可以等待数据加载
// 3. HTML 分块传输 — 浏览器逐步渲染
```

### 1.8 状态管理（Redux 原理）

#### 单向数据流

```
View → dispatch(action) → Reducer → new State → View
```

```javascript
// 1. Action — 描述发生了什么
const increment = { type: 'counter/increment', payload: 1 };

// 2. Reducer — 纯函数，根据 action 返回新 state
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'counter/increment':
      return { count: state.count + action.payload };
    case 'counter/decrement':
      return { count: state.count - action.payload };
    default:
      return state;
  }
}

// 3. Store — 全局状态容器
function createStore(reducer, middleware) {
  let state;
  let listeners = [];

  function getState() {
    return state;
  }

  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(listener => listener());
  }

  function subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }

  // 初始化 state
  dispatch({ type: '@@INIT' });

  return { getState, dispatch, subscribe };
}

// 4. 中间件 — 增强 dispatch
function applyMiddleware(...middlewares) {
  return (createStore) => (reducer) => {
    const store = createStore(reducer);
    let dispatch = store.dispatch;

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action) => dispatch(action)
    };

    // 链式组合中间件
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return { ...store, dispatch };
  };
}

function compose(...funcs) {
  if (funcs.length === 0) return f => f;
  if (funcs.length === 1) return funcs[0];
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// Logger 中间件示例
function logger({ getState, dispatch }) {
  return (next) => (action) => {
    console.log('dispatching', action);
    const result = next(action);
    console.log('next state', getState());
    return result;
  };
}

// 使用
const store = createStore(counterReducer, applyMiddleware(logger));
store.dispatch(increment); // count: 1
store.dispatch(increment); // count: 2
```

---

## 2. Vue 核心原理

### 2.1 响应式原理

#### Vue 2: Object.defineProperty

```javascript
// Vue 2 通过 Object.defineProperty 劫持对象属性的 getter/setter
function observe(obj) {
  if (typeof obj !== 'object' || obj === null) return;

  Object.keys(obj).forEach(key => {
    defineReactive(obj, key, obj[key]);
  });
}

function defineReactive(obj, key, val) {
  // 递归观察子对象
  observe(val);

  const dep = new Dep(); // 每个属性对应一个 Dep

  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      // 依赖收集：记录当前 Watcher
      if (Dep.target) {
        dep.depend();
      }
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      // 派发更新：通知所有 Watcher
      dep.notify();
    }
  });
}

// Vue 2 的限制：
// 1. 无法检测属性的添加和删除（需要 $set / $delete）
// 2. 无法检测数组索引的直接修改（需要 $set 或 splice）
// 3. 需要递归遍历所有属性，性能开销大
```

#### Vue 3: Proxy

```javascript
// Vue 3 使用 Proxy 实现响应式
function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key); // 依赖收集
      const result = Reflect.get(obj, key, receiver);
      // 深层响应式（惰性代理）
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      return result;
    },
    set(obj, key, value, receiver) {
      const oldValue = obj[key];
      const result = Reflect.set(obj, key, value, receiver);
      // 只有值真正变化时才触发更新
      if (oldValue !== value) {
        trigger(obj, key); // 派发更新
      }
      return result;
    },
    deleteProperty(obj, key) {
      const hadKey = key in obj;
      const result = Reflect.deleteProperty(obj, key);
      if (hadKey && result) {
        trigger(obj, key);
      }
      return result;
    }
  });
}

// Vue 3 的优势：
// 1. 可以检测属性的添加和删除
// 2. 可以检测数组索引和长度的变化
// 3. 惰性代理 — 只在访问时才对子对象做代理
// 4. 性能更好 — 不需要递归遍历
// 5. 支持 Map、Set、WeakMap、WeakSet
```

### 2.2 依赖收集与派发更新

#### Dep 和 Watcher

```javascript
// Dep — 依赖收集器（Vue 2）
class Dep {
  static target = null; // 当前正在计算的 Watcher

  constructor() {
    this.subscribers = new Set(); // 订阅者集合
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this);
    }
  }

  notify() {
    this.subscribers.forEach(watcher => watcher.update());
  }
}

// Watcher — 观察者（Vue 2）
class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm;
    this.deps = new Set(); // 该 Watcher 订阅的所有 Dep
    this.getter = typeof expOrFn === 'function' ? expOrFn : () => vm[expOrFn];
    this.value = this.get(); // 首次求值，触发依赖收集
  }

  get() {
    Dep.target = this;
    const value = this.getter.call(this.vm); // 触发 getter，收集依赖
    Dep.target = null;
    return value;
  }

  addDep(dep) {
    dep.add(this);
    this.deps.add(dep);
  }

  update() {
    // 异步批量更新（nextTick）
    queueWatcher(this);
  }
}
```

#### Vue 3 的 effect 系统

```javascript
// Vue 3 使用 effect + reactive 实现依赖收集
let activeEffect = null;
const targetMap = new WeakMap(); // target → Map(key → Set(effect))

function track(target, key) {
  if (!activeEffect) return;

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;

  const dep = depsMap.get(key);
  if (!dep) return;

  dep.forEach(effect => {
    if (effect.scheduler) {
      effect.scheduler(); // 调度执行（如 nextTick）
    } else {
      effect(); // 立即执行
    }
  });
}

function effect(fn, options = {}) {
  const effectFn = () => {
    activeEffect = effectFn;
    const result = fn();
    activeEffect = null;
    return result;
  };

  effectFn.scheduler = options.scheduler;
  effectFn.deps = [];

  effectFn(); // 首次执行，收集依赖

  return effectFn;
}

// 使用
const state = reactive({ count: 0, name: '张三' });

effect(() => {
  console.log(`count: ${state.count}`);
});

state.count++; // 触发 effect 重新执行
```

### 2.3 模板编译

#### 编译流程

```
模板字符串 → AST（抽象语法树）→ 优化（标记静态节点）→ render 函数
```

```javascript
// 1. 解析模板生成 AST
const template = `
  <div id="app">
    <h1>{{ title }}</h1>
    <p v-if="show">{{ message }}</p>
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>
  </div>
`;

// AST 结构（简化）
const ast = {
  type: 'Element',
  tag: 'div',
  attrs: [{ name: 'id', value: 'app' }],
  children: [
    {
      type: 'Element',
      tag: 'h1',
      children: [{ type: 'Expression', content: 'title' }]
    },
    {
      type: 'Element',
      tag: 'p',
      directives: [{ name: 'if', value: 'show' }],
      children: [{ type: 'Expression', content: 'message' }]
    },
    {
      type: 'Element',
      tag: 'ul',
      children: [{
        type: 'Element',
        tag: 'li',
        directives: [{ name: 'for', value: 'item in items' }],
        children: [{ type: 'Expression', content: 'item.name' }]
      }]
    }
  ]
};

// 2. 生成 render 函数
// 编译结果（Vue 2 风格）：
const render = function() {
  with (this) {
    return _c('div', { attrs: { id: 'app' } }, [
      _c('h1', [_v(_s(title))]),
      show ? _c('p', [_v(_s(message))]) : _e(),
      _c('ul', items.map(item =>
        _c('li', { key: item.id }, [_v(_s(item.name))])
      ))
    ])
  }
};

// Vue 3 使用 @vue/compiler-dom，不再使用 with，而是直接导入变量
```

### 2.4 nextTick 原理

```javascript
// Vue 的 nextTick 利用微任务队列实现异步批量更新
const callbacks = [];
let pending = false;

function nextTick(cb) {
  callbacks.push(cb);

  if (!pending) {
    pending = true;
    // 使用微任务（优先级：Promise > MutationObserver > setImmediate > setTimeout）
    if (typeof Promise !== 'undefined') {
      Promise.resolve().then(flushCallbacks);
    } else if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(flushCallbacks);
      observer.observe(textNode, { characterData: true });
    } else {
      setTimeout(flushCallbacks, 0);
    }
  }
}

function flushCallbacks() {
  pending = false;
  const copies = callbacks.slice(0);
  callbacks.length = 0;
  copies.forEach(cb => cb());
}

// 为什么需要 nextTick？
// Vue 的更新是异步的 — 数据变化后不会立即更新 DOM
// 而是将 Watcher 放入队列，在下一个微任务中批量执行
// 如果需要在数据变化后获取更新后的 DOM，需要使用 nextTick

this.message = 'new message';
console.log(this.$el.textContent); // 还是旧值
this.$nextTick(() => {
  console.log(this.$el.textContent); // 新值
});
```

### 2.5 computed vs watch

```javascript
// computed — 计算属性
// 1. 有缓存，依赖不变不会重新计算
// 2. 必须有返回值
// 3. 适合从已有数据派生新数据

const count = ref(0);
const double = computed(() => count.value * 2); // 缓存

// watch — 侦听器
// 1. 无缓存，每次都执行回调
// 2. 可以执行副作用（异步操作、DOM 操作）
// 3. 适合在数据变化时执行操作

watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} → ${newVal}`);
});

// watchEffect — 自动追踪依赖
watchEffect(() => {
  console.log(`count is: ${count.value}`);
});

// computed 原理（简化）
function computed(getter) {
  let value;
  let dirty = true; // 是否需要重新计算

  const effectFn = effect(getter, {
    lazy: true, // 不立即执行
    scheduler() {
      if (!dirty) {
        dirty = true;
        trigger(obj, 'value'); // 通知依赖更新
      }
    }
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }
      track(obj, 'value');
      return value;
    }
  };

  return obj;
}
```

### 2.6 组件通信方式

```javascript
// 1. Props / Emit（父子通信）
// 父组件
<Child :name="name" @update="handleUpdate" />

// 子组件
defineProps(['name']);
defineEmits(['update']);

// 2. Provide / Inject（跨层级通信）
// 祖先组件
provide('theme', ref('dark'));

// 后代组件
const theme = inject('theme');

// 3. EventBus（任意组件通信，Vue 3 推荐使用 mitt）
import mitt from 'mitt';
const emitter = mitt();
emitter.on('event', handler);
emitter.emit('event', data);
emitter.off('event', handler);

// 4. Vuex / Pinia（全局状态管理）
// Pinia 示例
import { defineStore } from 'pinia';

const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2
  },
  actions: {
    increment() {
      this.count++;
    }
  }
});

// 5. Refs（父组件访问子组件）
const childRef = ref(null);
<Child ref="childRef" />
childRef.value.someMethod();

// 6. $attrs / $listeners（属性透传）
// Vue 3 中 $attrs 包含了所有未在 props 中声明的属性
```

### 2.7 Vue 3 Composition API vs Options API

```javascript
// Options API（Vue 2 风格）
export default {
  data() {
    return { count: 0, name: '张三' };
  },
  computed: {
    double() { return this.count * 2; }
  },
  methods: {
    increment() { this.count++; }
  },
  mounted() {
    console.log('mounted');
  }
};

// Composition API（Vue 3 风格）
import { ref, computed, onMounted } from 'vue';

export default {
  setup() {
    const count = ref(0);
    const name = ref('张三');

    const double = computed(() => count.value * 2);

    function increment() {
      count.value++;
    }

    onMounted(() => {
      console.log('mounted');
    });

    return { count, name, double, increment };
  }
};

// <script setup> 语法糖（推荐）
<script setup>
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
const name = ref('张三');
const double = computed(() => count.value * 2);

function increment() {
  count.value++;
}

onMounted(() => {
  console.log('mounted');
});
</script>

// Composition API 的优势：
// 1. 更好的逻辑复用（自定义 Hooks / Composables）
// 2. 更好的 TypeScript 支持
// 3. 更灵活的代码组织（按功能而非选项组织）
// 4. 更小的生产包体积（更好的 tree-shaking）

// 逻辑复用示例
function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const double = computed(() => count.value * 2);

  function increment() { count.value++; }
  function decrement() { count.value--; }
  function reset() { count.value = initialValue; }

  return { count, double, increment, decrement, reset };
}
```

### 2.8 Vue SSR 原理

```
服务端：
  1. Vue 组件 → renderToString() → HTML 字符串
  2. 将 HTML 和状态（用于客户端 hydration）发送给浏览器

客户端：
  1. 浏览器接收 HTML，直接显示
  2. 加载 JS 代码
  3. createSSRApp() + hydrate() — 复用 DOM，绑定事件
```

```javascript
// 服务端
import { renderToString } from 'vue/server-renderer';
import { createSSRApp } from 'vue';
import App from './App.vue';

app.get('*', async (req, res) => {
  const app = createSSRApp(App);
  const html = await renderToString(app);
  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="app">${html}</div>
        <script src="/client.js"></script>
      </body>
    </html>
  `);
});

// 客户端
import { createSSRApp } from 'vue';
import { hydrate } from 'vue';
import App from './App.vue';

const app = createSSRApp(App);
hydrate(app, document.getElementById('app'));

// Vue SSR 与 React SSR 的区别：
// 1. Vue 的模板编译在构建时完成，SSR 性能更好
// 2. Vue 的 hydration 更高效（更精确的 DOM diff）
// 3. Nuxt.js vs Next.js — 框架层面的差异
```

---

## 3. React vs Vue 对比

### 3.1 设计理念

| 维度 | React | Vue |
|---|---|---|
| **核心理念** | UI = f(state) | 渐进式框架 |
| **数据流** | 单向数据流 | 单向数据流（v-model 是语法糖） |
| **模板** | JSX（JavaScript 扩展） | Template（HTML 扩展） |
| **状态管理** | useState / useReducer / Redux | ref / reactive / Pinia |
| **学习曲线** | 较陡（需要理解 JSX、Hooks） | 较平缓（模板语法直观） |

### 3.2 响应式

```javascript
// React — 不可变数据 + 重新渲染
const [count, setCount] = useState(0);
setCount(count + 1); // 创建新值，触发重新渲染

// Vue — 可变数据 + 依赖追踪
const count = ref(0);
count.value++; // 修改原值，自动追踪依赖并更新

// 关键区别：
// React 需要手动管理不可变性（如展开运算符创建新对象）
// Vue 通过 Proxy 自动追踪依赖，开发者直接修改数据
```

### 3.3 组件化

```jsx
// React — 函数组件 + Hooks
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// Vue — SFC（单文件组件）+ Composition API
// Counter.vue
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

### 3.4 生态系统

| 维度 | React | Vue |
|---|---|---|
| **路由** | React Router | Vue Router |
| **状态管理** | Redux / Zustand / Jotai | Pinia / Vuex |
| **SSR 框架** | Next.js | Nuxt.js |
| **移动端** | React Native | — |
| **UI 组件库** | Ant Design / MUI | Element Plus / Ant Design Vue |
| **构建工具** | Create React App / Vite | Vite / Vue CLI |

### 3.5 性能对比

```
React：
  + Fiber 架构支持时间切片，大列表更新更流畅
  + 并发模式（Concurrent Mode）支持优先级调度
  - 每次状态更新可能触发整个组件树重新渲染（需要手动优化）

Vue：
  + 精确的依赖追踪，只更新依赖变化的组件
  + 模板编译时优化（静态提升、PatchFlags、Block Tree）
  + 响应式系统自动处理细粒度更新
  - 大规模应用中，响应式系统的 Proxy 开销可能成为瓶颈
```

### 3.6 面试问答

**Q: 如何选择 React 和 Vue？**

选择 React 的场景：
- 团队有 JavaScript/函数式编程背景
- 需要跨平台（React Native）
- 大型复杂应用，需要灵活的架构
- 生态系统需求（如 Next.js 的 SSR/SSG）

选择 Vue 的场景：
- 团队有 HTML/CSS 背景，学习成本低
- 中小型项目，快速开发
- 需要渐进式引入（可以在现有项目中逐步使用）
- 对模板语法更熟悉

**Q: Vue 3 和 React 18 有哪些相似之处？**

1. 都支持函数式编程风格（Composition API / Hooks）
2. 都有批量更新机制
3. 都支持 Suspense（异步组件加载）
4. 都支持 Teleport / Portal（组件渲染到指定位置）
5. 都有完善的 TypeScript 支持

---

> 本文档涵盖了 React 和 Vue 框架的核心原理，包括 Virtual DOM、Diff 算法、Fiber 架构、Hooks 原理、响应式系统、模板编译等高频面试知识点。建议结合源码阅读加深理解。
