# React 与 Vue 框架面试 50 题

> 基于 React 与 Vue 框架原理整理，覆盖核心原理、对比分析、设计题及场景题

---

## 目录

- [一、React 核心原理（18题）](#一react-核心原理)
- [二、Vue 核心原理（14题）](#二vue-核心原理)
- [三、React vs Vue 对比（5题）](#三react-vs-vue-对比)
- [四、框架设计题（8题）](#四框架设计题)
- [五、场景题（5题）](#五场景题)
- [高频考点速查表](#高频考点速查表)

---

## 一、React 核心原理

### Q1: 什么是 Virtual DOM？有什么优势？

**难度**: ⭐

**答案**: Virtual DOM 是真实 DOM 的 JavaScript 对象表示。React 通过维护虚拟 DOM 树，状态变化时进行 Diff 计算，找出最小变更集，批量更新真实 DOM。

**解析**:
```javascript
// 真实 DOM
const realDOM = document.createElement('div');

// 虚拟 DOM（JS 对象）
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

// 优势：
// 1. 跨平台 — 可渲染到 DOM、Canvas、Native
// 2. 批量更新 — 多次状态变更合并为一次 DOM 操作
// 3. Diff 算法 — 只更新变化部分，减少 DOM 操作
```

---

### Q2: React Diff 算法的核心策略是什么？

**难度**: ⭐⭐

**答案**: 基于三个假设：(1) 跨层级节点移动极少，只比较同层；(2) 不同类型元素产生不同树，直接替换；(3) key 标识节点身份，通过 key 判断复用。

**解析**:
```jsx
// 列表 Diff 策略
// 旧: [A, B, C, D]  新: [A, E, C, D]
// 1. 从头比较：A === A → 复用
// 2. B !== E → 停止
// 3. 从尾比较：D === D → 复用, C === C → 复用
// 4. 剩余：旧 [B], 新 [E]
// 5. 结论：删除 B，新增 E

// key 的作用
// bad: 使用 index（列表顺序变化时性能差）
{items.map((item, index) => <li key={index}>{item.name}</li>)}

// good: 使用唯一 id
{items.map(item => <li key={item.id}>{item.name}</li>)}
```

---

### Q3: React Fiber 架构解决了什么问题？

**难度**: ⭐⭐⭐

**答案**: Fiber 解决了 React 15 递归渲染不可中断导致主线程阻塞的问题。Fiber 将渲染工作拆分为小单元，支持时间切片和可中断渲染。

**解析**:
```
Stack Reconciler（React 15）：
  递归遍历 → 不可中断 → 长任务阻塞主线程 → 页面卡顿

Fiber Reconciler（React 16+）：
  拆分为 Fiber 节点 → 每个单元执行后检查是否让出主线程
  → 高优先级任务可中断 → 空闲时恢复 → 可中断渲染

Fiber 节点结构：
{
  tag: FunctionComponent,  // 组件类型
  type: App,               // 具体组件
  return: parentFiber,     // 父节点
  child: firstChildFiber,  // 第一个子节点
  sibling: nextFiber,      // 兄弟节点
  alternate: currentFiber, // 双缓冲
  flags: Placement,        // 副作用标记
}
```

---

### Q4: React Hooks 的原理是什么？为什么不能在条件语句中使用？

**难度**: ⭐⭐

**答案**: Hooks 基于闭包 + 链表实现。每个 Fiber 节点的 `memoizedState` 是一个链表，按调用顺序存储所有 Hook 的状态。React 依赖调用顺序来匹配状态，条件语句会导致顺序错乱。

**解析**:
```javascript
// useState 简化实现
let hookIndex = 0;
function useState(initialState) {
  const hook = currentFiber.memoizedState[hookIndex] || {
    state: typeof initialState === 'function' ? initialState() : initialState,
    queue: []
  };
  while (hook.queue.length) {
    const action = hook.queue.shift();
    hook.state = typeof action === 'function' ? action(hook.state) : action;
  }
  currentFiber.memoizedState[hookIndex] = hook;
  hookIndex++;
  const setState = (action) => { hook.queue.push(action); scheduleUpdate(); };
  return [hook.state, setState];
}
// 如果在 if 中使用 Hook，顺序变化导致状态错乱
```

---

### Q5: useEffect 和 useLayoutEffect 的区别？

**难度**: ⭐⭐

**答案**: `useEffect` 异步执行，不阻塞浏览器绘制，在 DOM 更新后异步调用；`useLayoutEffect` 同步执行，在 DOM 更新后、浏览器绘制前同步调用，适合需要测量 DOM 的场景。

**解析**:
```jsx
// useEffect — 异步，不阻塞绘制
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// useLayoutEffect — 同步，阻塞绘制
useLayoutEffect(() => {
  const height = ref.current.getBoundingClientRect().height;
  // 同步修改 DOM，避免闪烁
  if (height > 300) ref.current.style.height = '300px';
}, []);

// 选择原则：
// 1. 大多数情况用 useEffect
// 2. 需要同步读取/修改 DOM 时用 useLayoutEffect
// 3. SSR 中 useLayoutEffect 会报警告
```

---

### Q6: React 合成事件（SyntheticEvent）是什么？

**难度**: ⭐⭐

**答案**: React 的合成事件是对原生事件的跨浏览器封装。所有事件委托到 root 节点（React 17+），自动处理浏览器兼容性，事件对象会被复用。

**解析**:
```jsx
function Button() {
  const handleClick = (e) => {
    console.log(e); // SyntheticEvent
    console.log(e.nativeEvent); // 原生 MouseEvent
    // 注意：事件对象会被复用，异步访问需 persist
    // setTimeout(() => console.log(e.target), 0); // null
    e.persist();
    setTimeout(() => console.log(e.target), 0); // OK
    // 注意：React 17+ 已移除事件池，e.persist() 不再需要
  };
  return <button onClick={handleClick}>Click</button>;
}

// React 17+ 事件委托到 root 而非 document
// 好处：微前端场景下多个 React 根互不干扰
```

---

### Q7: React 批量更新机制是怎样的？

**难度**: ⭐⭐

**答案**: React 18 之前只在 React 事件处理函数中自动批量更新；React 18 之后所有更新都自动批量（包括 setTimeout、Promise、原生事件）。`flushSync` 可强制同步渲染。

**解析**:
```jsx
// React 18 自动批量
function handleClick() {
  setCount(1);   // 不会立即渲染
  setName('张三'); // 不会立即渲染
  // 合并为一次渲染
}

// 强制同步渲染
import { flushSync } from 'react-dom';
function handleClick() {
  flushSync(() => { setCount(1); }); // 立即渲染
  console.log(count); // 1
  flushSync(() => { setName('张三'); }); // 又一次渲染
}
```

---

### Q8: React.memo / useMemo / useCallback 的使用场景和原理？

**难度**: ⭐⭐

**答案**: `React.memo` 浅比较 props 避免不必要的重新渲染；`useMemo` 缓存计算结果；`useCallback` 缓存函数引用。依赖比较使用 `Object.is`。

**解析**:
```jsx
// React.memo
const Child = React.memo(function Child({ name }) {
  console.log('Child rendered');
  return <div>{name}</div>;
});

// useMemo — 缓存计算结果
const sorted = useMemo(() => [...items].sort((a, b) => a.id - b.id), [items]);

// useCallback — 缓存函数引用
const handleClick = useCallback(() => setCount(c => c + 1), []);

// 优化原则：
// 1. 不要过度优化 — 只在确认有性能问题时使用
// 2. useMemo/useCallback 本身有开销（比较依赖项）
// 3. 优先考虑组件拆分和数据结构优化
```

---

### Q9: React 中如何避免不必要的重新渲染？

**难度**: ⭐⭐

**答案**: (1) React.memo 包裹子组件；(2) useMemo/useCallback 缓存值和函数；(3) 状态下放，避免父组件状态变化导致子组件重渲染；(4) 合理拆分组件；(5) 使用 key 优化列表。

**解析**:
```jsx
// 状态下放 — 将状态移到需要它的组件中
// bad: 状态在父组件，导致所有子组件重渲染
function Parent() {
  const [input, setInput] = useState('');
  return (
    <>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <ExpensiveList /> {/* 每次输入都重渲染 */}
    </>
  );
}

// good: 将 input 状态下放到 SearchBar
function SearchBar() {
  const [input, setInput] = useState('');
  return <input value={input} onChange={e => setInput(e.target.value)} />;
}
function Parent() {
  return (
    <>
      <SearchBar />
      <ExpensiveList /> {/* 不受影响 */}
    </>
  );
}
```

---

### Q10: React SSR 的原理是什么？

**难度**: ⭐⭐⭐

**答案**: 服务端将 React 组件渲染为 HTML 字符串（renderToString），客户端接收后直接显示，再通过 hydrate 绑定事件，使应用变为可交互。

**解析**:
```jsx
// 服务端
import { renderToString } from 'react-dom/server';
app.get('*', (req, res) => {
  const html = renderToString(<App url={req.url} />);
  res.send(`<!DOCTYPE html><html><body><div id="root">${html}</div>
    <script src="/bundle.js"></script></body></html>`);
});

// 客户端
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);

// React 18 流式 SSR
import { renderToPipeableStream } from 'react-dom/server';
const stream = renderToPipeableStream(<App />, {
  onShellReady() { stream.pipe(res); },
});
// 优势：TTFB 更快，支持 Suspense
```

---

### Q11: Redux 的工作原理是什么？

**难度**: ⭐⭐

**答案**: Redux 采用单向数据流：View dispatch action → Reducer 纯函数处理 → 返回新 State → View 更新。支持中间件增强 dispatch。

**解析**:
```javascript
// 单向数据流
// View → dispatch(action) → Reducer → new State → View

// Store 实现
function createStore(reducer, middleware) {
  let state;
  let listeners = [];
  function getState() { return state; }
  function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(l => l());
  }
  function subscribe(listener) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  }
  dispatch({ type: '@@INIT' });
  return { getState, dispatch, subscribe };
}

// 中间件 — 洋葱模型
function logger({ getState, dispatch }) {
  return next => action => {
    console.log('dispatching', action);
    const result = next(action);
    console.log('next state', getState());
    return result;
  };
}
```

---

### Q12: React 中 key 的作用是什么？使用 index 作为 key 有什么问题？

**难度**: ⭐⭐

**答案**: key 帮助 React 识别哪些元素改变了（添加/删除/重排序）。使用 index 作为 key 在列表顺序变化时会导致不必要的 DOM 操作和组件状态错误。

**解析**:
```jsx
// 列表 [A, B, C] → [D, B, C]（头部插入 D）
// 使用 index：React 认为 0 号位从 A 变成 D，更新 A→D（错误）
// 使用 id：React 知道 D 是新增，A 被删除（正确）

// index 作为 key 的问题：
// 1. 性能差 — 无法复用已有 DOM
// 2. 状态错误 — 输入框内容可能错位
// 3. 动画异常 — 过渡动画不正确

// 正确做法
{items.map(item => <ListItem key={item.id} data={item} />)}
```

---

### Q13: React 并发模式（Concurrent Mode）是什么？

**难度**: ⭐⭐⭐

**答案**: 并发模式允许 React 中断渲染工作，处理更高优先级的更新。核心 API：`useTransition`、`useDeferredValue`、`Suspense`。

**解析**:
```jsx
// useTransition — 标记非紧急更新
function SearchPage() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 紧急更新：输入框立即响应
    setQuery(e.target.value);
    // 非紧急更新：搜索结果延迟渲染
    startTransition(() => {
      setSearchResults(e.target.value);
    });
  };
  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results />}
    </>
  );
}

// useDeferredValue — 延迟更新值
const deferredQuery = useDeferredValue(query);
```

---

### Q14: React Suspense 的作用和工作原理？

**难度**: ⭐⭐

**答案**: Suspense 让组件"等待"异步操作完成后再渲染，配合 lazy 实现代码分割，配合数据请求库实现异步数据加载。

**解析**:
```jsx
// 代码分割
const LazyComponent = React.lazy(() => import('./LazyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}

// 数据请求（配合 Relay/SWR）
function UserProfile({ userId }) {
  const data = fetchUser(userId); // Suspense 会暂停渲染直到数据就绪
  return <div>{data.name}</div>;
}

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userId="123" />
    </Suspense>
  );
}
```

---

### Q15: useRef 的本质是什么？与 useState 的区别？

**难度**: ⭐⭐

**答案**: useRef 本质是 `{ current: initialValue }`，修改不触发重新渲染。useState 修改会触发重新渲染。useRef 适合保存 DOM 引用和不触发渲染的可变值。

**解析**:
```jsx
// useRef 本质
function useRef(initialValue) {
  const hook = { current: initialValue };
  return hook;
}

// 使用场景
const inputRef = useRef(null); // DOM 引用
const timerRef = useRef(null); // 定时器
const prevCountRef = useRef(0); // 保存前一次的值

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; });
  return ref.current;
}
```

---

### Q16: React 错误边界（Error Boundary）是什么？

**难度**: ⭐⭐

**答案**: 错误边界是 React 组件，可以捕获子组件树中的 JavaScript 错误，记录错误并显示备用 UI。使用 `getDerivedStateFromError` 和 `componentDidCatch`。

**解析**:
```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
    // 上报错误
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

// 使用
<ErrorBoundary>
  <MyWidget />
</ErrorBoundary>
// 注意：函数组件无法成为错误边界
```

---

### Q17: React 中如何实现表单处理？

**难度**: ⭐

**答案**: 受控组件（state 管理表单值）和非受控组件（ref 获取 DOM 值）。推荐受控组件。

**解析**:
```jsx
// 受控组件
function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ name, email });
  };
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button type="submit">Submit</button>
    </form>
  );
}

// 非受控组件
function Form2() {
  const inputRef = useRef(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(inputRef.current.value);
  };
  return <form onSubmit={handleSubmit}><input ref={inputRef} /></form>;
}
```

---

### Q18: React Portal 的作用是什么？

**难度**: ⭐⭐

**答案**: Portal 将子组件渲染到父组件 DOM 层级之外的 DOM 节点。适用于模态框、Tooltip、全屏遮罩等需要脱离父组件样式的场景。

**解析**:
```jsx
import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.body // 渲染到 body 下
  );
}

// 事件冒泡仍然按 React 树传播，不受 DOM 位置影响
```

---

## 二、Vue 核心原理

### Q19: Vue 2 和 Vue 3 响应式的区别？

**难度**: ⭐⭐

**答案**: Vue 2 使用 `Object.defineProperty` 劫持属性 getter/setter，Vue 3 使用 `Proxy` 代理整个对象。Vue 3 解决了 Vue 2 无法检测属性添加/删除、数组索引修改的问题。

**解析**:
```javascript
// Vue 2 — Object.defineProperty
Object.defineProperty(obj, key, {
  get() { dep.depend(); return val; },
  set(newVal) { if (newVal !== val) { val = newVal; dep.notify(); } }
});
// 限制：无法检测属性添加/删除、数组索引修改、需要递归遍历

// Vue 3 — Proxy
const reactive = (target) => new Proxy(target, {
  get(obj, key, receiver) {
    track(obj, key); // 依赖收集
    const result = Reflect.get(obj, key, receiver);
    if (typeof result === 'object' && result !== null) return reactive(result);
    return result;
  },
  set(obj, key, value, receiver) {
    const oldValue = obj[key];
    const result = Reflect.set(obj, key, value, receiver);
    if (oldValue !== value) trigger(obj, key); // 派发更新
    return result;
  }
});
// 优势：可检测属性添加/删除、数组变化、惰性代理、支持 Map/Set
```

---

### Q20: Vue 的依赖收集和派发更新是如何工作的？

**难度**: ⭐⭐⭐

**答案**: Vue 3 使用 `effect` + `reactive` + `WeakMap` 实现依赖收集。读取属性时收集当前 effect，修改属性时触发所有依赖的 effect 重新执行。

**解析**:
```javascript
// targetMap: WeakMap<target, Map<key, Set<effect>>>
let activeEffect = null;
const targetMap = new WeakMap();

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let dep = depsMap.get(key);
  if (!dep) depsMap.set(key, (dep = new Set()));
  dep.add(activeEffect);
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (!dep) return;
  dep.forEach(effect => {
    effect.scheduler ? effect.scheduler() : effect();
  });
}
```

---

### Q21: Vue nextTick 的原理是什么？

**难度**: ⭐⭐

**答案**: Vue 的数据更新是异步的，将 Watcher 放入队列，在下一个微任务中批量执行。nextTick 利用微任务（Promise > MutationObserver > setTimeout）实现。

**解析**:
```javascript
const callbacks = [];
let pending = false;

function nextTick(cb) {
  callbacks.push(cb);
  if (!pending) {
    pending = true;
    if (typeof Promise !== 'undefined') {
      Promise.resolve().then(flushCallbacks);
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

// 使用场景：数据变化后获取更新后的 DOM
this.message = 'new';
console.log(this.$el.textContent); // 旧值
this.$nextTick(() => {
  console.log(this.$el.textContent); // 新值
});
```

---

### Q22: Vue computed 和 watch 的区别？

**难度**: ⭐⭐

**答案**: computed 有缓存，依赖不变不重新计算，必须有返回值，适合派生数据；watch 无缓存，每次都执行回调，可执行副作用，适合在数据变化时执行操作。

**解析**:
```javascript
// computed — 有缓存
const double = computed(() => count.value * 2);

// computed 原理（简化）
function computed(getter) {
  let value, dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() { if (!dirty) { dirty = true; trigger(obj, 'value'); } }
  });
  const obj = {
    get value() {
      if (dirty) { value = effectFn(); dirty = false; }
      track(obj, 'value');
      return value;
    }
  };
  return obj;
}

// watch — 无缓存
watch(count, (newVal, oldVal) => { console.log(`${oldVal} → ${newVal}`); });
// watchEffect — 自动追踪依赖
watchEffect(() => { console.log(`count: ${count.value}`); });
```

---

### Q23: Vue 模板编译的过程是什么？

**难度**: ⭐⭐

**答案**: 模板字符串 → AST（抽象语法树）→ 优化（标记静态节点）→ render 函数。

**解析**:
```
模板 → parse（解析）→ AST → optimize（优化）→ generate（生成）→ render 函数

AST 示例：
<div id="app">
  <h1>{{ title }}</h1>
</div>

↓ 解析为 AST ↓

{
  type: 'Element',
  tag: 'div',
  attrs: [{ name: 'id', value: 'app' }],
  children: [{
    type: 'Element',
    tag: 'h1',
    children: [{ type: 'Expression', content: 'title' }]
  }]
}

↓ 生成 render 函数 ↓

function render() {
  return _c('div', { attrs: { id: 'app' } }, [
    _c('h1', [_v(_s(title))])
  ]);
}
```

---

### Q24: Vue 组件通信有哪些方式？

**难度**: ⭐⭐

**答案**: Props/Emit（父子）、Provide/Inject（跨层级）、EventBus/mitt（任意组件）、Vuex/Pinia（全局状态）、Refs（父访问子）、$attrs（属性透传）。

**解析**:
```javascript
// 1. Props / Emit
<Child :name="name" @update="handleUpdate" />

// 2. Provide / Inject
provide('theme', ref('dark'));
const theme = inject('theme');

// 3. Pinia（推荐）
const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  actions: { increment() { this.count++; } }
});

// 4. Refs
const childRef = ref(null);
<Child ref="childRef" />
childRef.value.someMethod();

// 5. mitt（事件总线）
import mitt from 'mitt';
const emitter = mitt();
emitter.on('event', handler);
emitter.emit('event', data);
```

---

### Q25: Vue 3 Composition API 与 Options API 的区别？

**难度**: ⭐⭐

**答案**: Composition API 按功能组织代码，更好的逻辑复用（Composables）、TypeScript 支持、Tree-shaking；Options API 按选项类型组织代码，适合简单组件。

**解析**:
```javascript
// Composition API — 逻辑复用
function useCounter(initial = 0) {
  const count = ref(initial);
  const double = computed(() => count.value * 2);
  function increment() { count.value++; }
  return { count, double, increment };
}

// 在多个组件中复用
function ComponentA() {
  const { count, double, increment } = useCounter();
  // ...
}

// 优势：
// 1. 更好的逻辑复用（替代 mixins）
// 2. 更好的 TypeScript 支持
// 3. 更灵活的代码组织
// 4. 更小的生产包体积
```

---

### Q26: Vue 3 的 watch 和 watchEffect 有什么区别？

**难度**: ⭐⭐

**答案**: `watch` 需要明确指定监听源，可获取新值和旧值，默认懒执行；`watchEffect` 自动追踪依赖，立即执行一次，无法获取旧值。

**解析**:
```javascript
// watch — 明确指定监听源
watch(count, (newVal, oldVal) => {
  console.log(`${oldVal} → ${newVal}`);
}, { immediate: true, deep: true });

// watchEffect — 自动追踪
watchEffect(() => {
  console.log(`count: ${count.value}`);
  console.log(`name: ${name.value}`);
});

// 选择原则：
// 1. 需要旧值 → watch
// 2. 需要懒执行 → watch
// 3. 多个依赖联动 → watchEffect
// 4. 需要访问 DOM → watch + flush: 'post'
```

---

### Q27: Vue 3 的 ref 和 reactive 有什么区别？

**难度**: ⭐⭐

**答案**: `ref` 适用于基本类型和对象，访问需要 `.value`；`reactive` 仅适用于对象，直接访问属性。`ref` 可以替换整个值，`reactive` 不能替换整个对象。

**解析**:
```javascript
const count = ref(0);
count.value++; // 需要 .value

const state = reactive({ count: 0, name: '张三' });
state.count++; // 直接访问

// ref 可以替换
const user = ref({ name: '张三' });
user.value = { name: '李四' }; // OK

// reactive 不能替换
const state2 = reactive({ name: '张三' });
// state2 = { name: '李四' }; // 丢失响应式

// 最佳实践：推荐使用 ref，更灵活且可替换
```

---

### Q28: Vue 的 keep-alive 组件有什么用？

**难度**: ⭐⭐

**答案**: keep-alive 缓存组件实例，避免重复创建和销毁，保留组件状态。支持 include/exclude/max 属性。

**解析**:
```jsx
<keep-alive include="ComponentA,ComponentB" :max="10">
  <component :is="currentComponent" />
</keep-alive>

// 生命周期：activated（被激活）、deactivated（被缓存）
export default {
  activated() { console.log('组件被激活'); },
  deactivated() { console.log('组件被缓存'); },
};

// 应用场景：标签页切换、列表页详情页缓存
```

---

### Q29: Vue 的指令系统有哪些常用指令？

**难度**: ⭐

**答案**: 内置指令：v-model、v-if/v-show、v-for、v-bind(:)、v-on(@)、v-slot、v-once、v-memo。自定义指令：directive。

**解析**:
```javascript
// 自定义指令
const vFocus = {
  mounted(el) { el.focus(); },
};

// v-if vs v-show
// v-if：条件渲染（DOM 创建/销毁），切换开销大，初始不渲染
// v-show：CSS display 控制，初始渲染开销大，适合频繁切换

// v-memo（Vue 3.2+）
// 缓存子树，依赖不变时跳过更新
<div v-memo="[item.id === selected]">
  <span>{{ item.name }}</span>
</div>
```

---

### Q30: Vue 的 $attrs 和 $listeners 的作用？

**难度**: ⭐⭐

**答案**: `$attrs` 包含父组件传递但未在 props 中声明的属性（class 和 style 除外），`$listeners` 包含父组件传递的事件监听器（Vue 3 中合并到 `$attrs`）。

**解析**:
```jsx
// 父组件
<Child class="custom" title="标题" @click="handleClick" />

// 子组件
defineProps(['title']); // 只声明了 title
// $attrs = { class: 'custom' }（Vue 3 中 class/style 也可能包含）
// $listeners = { click: handleClick }（Vue 2）

// 属性透传（高阶组件）
function withBorder(WrappedComponent) {
  return {
    setup(props, { attrs }) {
      return () => (
        <div class="border">
          <WrappedComponent {...attrs} />
        </div>
      );
    }
  };
}
```

---

### Q31: Vue SSR 的原理是什么？

**难度**: ⭐⭐⭐

**答案**: 服务端将 Vue 组件渲染为 HTML 字符串（renderToString），客户端接收后直接显示，再通过 hydrate 复用 DOM 并绑定事件。

**解析**:
```javascript
// 服务端
import { renderToString } from 'vue/server-renderer';
import { createSSRApp } from 'vue';
const app = createSSRApp(App);
const html = await renderToString(app);

// 客户端
import { createSSRApp } from 'vue';
import { hydrate } from 'vue';
const app = createSSRApp(App);
hydrate(app, document.getElementById('app'));

// Vue SSR vs React SSR：
// 1. Vue 模板编译时优化，SSR 性能更好
// 2. Vue hydration 更高效
// 3. Nuxt.js vs Next.js
```

### Q32: Vue 的虚拟 DOM 和 Diff 算法有什么特点？

**难度**: ⭐⭐

**答案**: Vue 3 的编译时优化包括：静态提升（不参与 Diff）、PatchFlags（标记动态属性，精确更新）、Block Tree（收集动态子节点，减少遍历范围）。

**解析**:
```
Vue 3 编译时优化：

1. 静态提升 — 静态节点只创建一次，不参与 Diff
2. PatchFlags — 标记动态部分
   TEXT = 1        // 动态文本
   CLASS = 2       // 动态 class
   STYLE = 4       // 动态 style
   PROPS = 8       // 动态属性
3. Block Tree — Block 收集所有动态子节点，只遍历动态节点

对比 React：
React 运行时 Diff，需要完整遍历子树
Vue 编译时 + 运行时结合，精确更新
```

---

## 三、React vs Vue 对比

### Q33: React 和 Vue 的核心设计理念有什么区别？

**难度**: ⭐⭐

**答案**: React 核心理念是 `UI = f(state)`，函数式编程，不可变数据；Vue 是渐进式框架，响应式数据，模板语法，可变数据 + 自动依赖追踪。

**解析**:
```javascript
// React — 不可变数据 + 重新渲染
const [count, setCount] = useState(0);
setCount(count + 1); // 创建新值

// Vue — 可变数据 + 依赖追踪
const count = ref(0);
count.value++; // 修改原值，自动追踪依赖
```

---

### Q34: React 和 Vue 的性能对比？

**难度**: ⭐⭐

**答案**: React Fiber 支持时间切片，大列表更新更流畅；Vue 精确的依赖追踪 + 编译时优化，更新更精确。小规模应用 Vue 性能更好，大规模应用各有优势。

**解析**:
```
React 优势：
+ Fiber 时间切片，不阻塞主线程
+ 并发模式优先级调度

Vue 优势：
+ 精确依赖追踪，只更新变化的组件
+ 编译时优化（静态提升、PatchFlags、Block Tree）
+ 模板编译比 JSX 运行时解析更高效
```

---

### Q35: React 和 Vue 的生态系统对比？

**难度**: ⭐

**答案**: React 生态更庞大（Next.js、React Native、Redux 等），Vue 生态更集中（Nuxt.js、Pinia、Element Plus 等），学习曲线 Vue 更平缓。

**解析**:
| 维度 | React | Vue |
|------|-------|-----|
| 路由 | React Router | Vue Router |
| 状态管理 | Redux/Zustand/Jotai | Pinia/Vuex |
| SSR | Next.js | Nuxt.js |
| 移动端 | React Native | -- |
| UI 库 | Ant Design/MUI | Element Plus |
| 构建工具 | Vite / Next.js（CRA 已弃用） | Vite / Nuxt.js（Vue CLI 已弃用） |

---

### Q36: 如何选择 React 和 Vue？

**难度**: ⭐

**答案**: 选 React：团队 JS/函数式背景、需要跨平台、大型复杂应用、生态需求。选 Vue：团队 HTML/CSS 背景、中小型项目、渐进式引入、学习成本低。

---

### Q37: Vue 3 和 React 18 有哪些相似之处？

**难度**: ⭐⭐

**答案**: (1) 都支持函数式编程风格（Composition API / Hooks）；(2) 都有批量更新机制；(3) 都支持 Suspense；(4) 都支持 Teleport/Portal；(5) 都有完善的 TypeScript 支持。

---

## 四、框架设计题

### Q38: 前端路由的原理是什么？

**难度**: ⭐⭐

**答案**: 前端路由有两种模式：Hash 模式（`#` 后的路径变化触发 hashchange 事件）和 History 模式（`pushState/replaceState` + popstate 事件）。

**解析**:
```javascript
// Hash 模式
window.addEventListener('hashchange', () => {
  const path = window.location.hash.slice(1);
  renderComponent(path);
});

// History 模式
function navigate(path) {
  history.pushState({}, '', path);
  renderComponent(path);
}
window.addEventListener('popstate', () => {
  renderComponent(window.location.pathname);
});

// History 模式需要服务器配置回退到 index.html
// Nginx: try_files $uri $uri/ /index.html;
```

---

### Q39: 状态管理的原理是什么？如何设计一个简单的状态管理？

**难度**: ⭐⭐⭐

**答案**: 状态管理核心是发布订阅模式 + 单一数据源。维护一个全局 store，组件订阅状态变化，dispatch action 修改状态。

**解析**:
```javascript
function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getState() { return state; },
    setState(newState) {
      state = typeof newState === 'function' ? newState(state) : newState;
      listeners.forEach(fn => fn(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

const store = createStore({ count: 0 });
store.subscribe(state => console.log('state changed:', state));
store.setState(prev => ({ count: prev.count + 1 }));
```

---

### Q40: 虚拟列表的实现原理是什么？

**难度**: ⭐⭐⭐

**答案**: 只渲染可视区域内的元素，通过 scrollTop 计算起始索引，用占位元素撑开容器高度模拟完整列表。

**解析**:
```jsx
function VirtualList({ items, itemHeight = 50, containerHeight = 500 }) {
  const [scrollTop, setScrollTop] = useState(0);
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + 1, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return (
    <div style={{ height: containerHeight, overflow: 'auto' }}
         onScroll={e => setScrollTop(e.target.scrollTop)}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, width: '100%' }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### Q41: SSR 的原理和优缺点是什么？

**难度**: ⭐⭐

**答案**: SSR 在服务端将组件渲染为 HTML 字符串，客户端接收后直接显示再 hydrate。优点：首屏快、SEO 好。缺点：服务器压力大、TTFB 可能慢、开发复杂度高。

**解析**:
```
CSR: 浏览器加载 HTML → 加载 JS → 渲染页面（首屏慢）
SSR: 服务器渲染 HTML → 浏览器显示 → 加载 JS → hydrate（首屏快）
SSG: 构建时生成静态 HTML → CDN 分发（最快）
ISR: SSG + 增量更新（兼顾性能和动态）

选择建议：
- 营销页面/SEO 要求高 → SSR/SSG
- 后台管理系统 → CSR
- 博客/文档 → SSG
```

---

### Q42: 如何实现一个简单的组件库？

**难度**: ⭐⭐⭐

**答案**: 核心步骤：组件设计（API 设计）、样式方案（CSS Modules/CSS-in-JS）、打包配置（Rollup）、文档（Storybook）、测试（Jest + Testing Library）。

**解析**:
```typescript
// Button 组件
interface ButtonProps {
  type?: 'primary' | 'default' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: (e: MouseEvent) => void;
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  type = 'default', size = 'medium', disabled, onClick, children
}) => (
  <button className={`btn btn-${type} btn-${size}`} disabled={disabled} onClick={onClick}>
    {children}
  </button>
);

// 打包配置要点：
// 1. 输出 ESM + CJS
// 2. 分离样式文件
// 3. Tree Shaking 支持
// 4. TypeScript 声明文件
```

---

### Q43: 微前端架构的设计思路是什么？

**难度**: ⭐⭐⭐

**答案**: 微前端将大型应用拆分为多个独立的小应用，独立开发、部署、运行。核心问题：JS 沙箱隔离、CSS 隔离、通信机制、路由管理。

**解析**:
```javascript
// qiankun 示例
import { registerMicroApps, start } from 'qiankun';

registerMicroApps([
  { name: 'app1', entry: '//localhost:8081', container: '#container', activeRule: '/app1' },
  { name: 'app2', entry: '//localhost:8082', container: '#container', activeRule: '/app2' },
]);
start({ sandbox: { strictStyleIsolation: true } });

// JS 沙箱 — Proxy 拦截全局变量
class ProxySandbox {
  constructor() {
    const fakeWindow = {};
    this.proxy = new Proxy(fakeWindow, {
      get(target, key) { return key in target ? target[key] : window[key]; },
      set(target, key, value) { target[key] = value; return true; }
    });
  }
}
```

---

### Q44: 如何设计一个前端错误监控系统？

**难度**: ⭐⭐⭐

**答案**: 采集（try-catch、window.onerror、unhandledrejection、资源错误、接口错误）→ 上报（sendBeacon）→ 聚合分析（错误分类、去重、告警）→ 可视化看板。

**解析**:
```javascript
// 错误采集
window.onerror = (msg, url, line, col, error) => {
  reportError({ type: 'js', msg, url, line, col, stack: error?.stack });
};

window.addEventListener('unhandledrejection', (e) => {
  reportError({ type: 'promise', reason: e.reason, stack: e.reason?.stack });
});

// 接口错误监控
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (!response.ok) {
    reportError({ type: 'api', url: args[0], status: response.status });
  }
  return response;
};

// 上报
function reportError(error) {
  const body = JSON.stringify({ ...error, timestamp: Date.now(), url: location.href });
  navigator.sendBeacon('/api/errors', body);
}
```

---

### Q45: 如何设计一个前端权限管理系统？

**难度**: ⭐⭐⭐

**答案**: 路由权限（动态路由）、按钮权限（自定义指令/组件）、接口权限（请求拦截器）、菜单权限（根据角色生成菜单）。

**解析**:
```typescript
// 路由权限
const routes = [
  { path: '/dashboard', roles: ['admin', 'user'] },
  { path: '/admin', roles: ['admin'] },
];

function filterRoutes(routes, role) {
  return routes.filter(r => r.roles.includes(role));
}

// 按钮权限 — 自定义指令
app.directive('permission', {
  mounted(el, binding) {
    const permissions = store.state.user.permissions;
    if (!permissions.includes(binding.value)) {
      el.parentNode?.removeChild(el);
    }
  }
});

// 使用
<button v-permission="'user:delete'">删除</button>
```

---

## 五、场景题

### Q46: 大列表渲染如何优化？

**难度**: ⭐⭐

**答案**: (1) 虚拟列表（只渲染可视区域）；(2) 分页加载；(3) React.memo 避免不必要的重渲染；(4) 使用 Web Worker 处理数据；(5) 懒加载。

---

### Q47: 如何实现一个全局 Loading 组件？

**难度**: ⭐⭐

**答案**: 使用 Context/Store 管理 loading 状态，全局注册 Loading 组件，通过 API 控制 show/hide。

**解析**:
```jsx
// React 实现
const LoadingContext = createContext();
function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const show = () => setLoading(true);
  const hide = () => setLoading(false);
  return (
    <LoadingContext.Provider value={{ show, hide }}>
      {children}
      {loading && <div className="global-loading">Loading...</div>}
    </LoadingContext.Provider>
  );
}

// 使用
const { show, hide } = useContext(LoadingContext);
async function fetchData() {
  show();
  await api.getData();
  hide();
}
```

---

### Q48: 如何处理 React 中的竞态条件（Race Condition）？

**难度**: ⭐⭐⭐

**答案**: 使用 AbortController 取消请求、使用 cleanup 函数、使用竞态安全的 Hook。

**解析**:
```jsx
function useFetch(url) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort(); // 清理：取消上一次请求
  }, [url]);

  return { data, error };
}
```

---

### Q49: 如何实现无限滚动加载？

**难度**: ⭐⭐

**答案**: 使用 IntersectionObserver 监听底部哨兵元素，进入视口时加载更多数据。

**解析**:
```jsx
function InfiniteList() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loading]);

  const loadMore = async () => {
    setLoading(true);
    const newItems = await fetchItems(page);
    setItems(prev => [...prev, ...newItems]);
    setPage(p => p + 1);
    setLoading(false);
  };

  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
      <div ref={sentinelRef}>{loading ? 'Loading...' : ''}</div>
    </div>
  );
}
```

---

### Q50: 如何设计一个表单校验库？

**难度**: ⭐⭐⭐

**答案**: 核心设计：Schema 定义校验规则、支持同步/异步校验、支持条件校验、支持自定义校验器。

**解析**:
```typescript
interface Rule {
  required?: boolean;
  message?: string;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: any) => boolean | Promise<boolean>;
}

function validate(value: any, rules: Rule[]): Promise<string[]> {
  const errors: string[] = [];
  for (const rule of rules) {
    if (rule.required && !value) {
      errors.push(rule.message || 'This field is required');
    }
    if (rule.min && value.length < rule.min) {
      errors.push(rule.message || `Minimum length is ${rule.min}`);
    }
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push(rule.message || 'Invalid format');
    }
    if (rule.validator && !(await rule.validator(value))) {
      errors.push(rule.message || 'Validation failed');
    }
  }
  return errors;
}
```

---

## 高频考点速查表

| 考点 | 出现频率 | 核心要点 |
|------|---------|---------|
| Virtual DOM | ★★★★★ | JS 对象表示，Diff 算法三策略 |
| Fiber 架构 | ★★★★ | 时间切片、可中断渲染、双缓冲 |
| Hooks 原理 | ★★★★★ | 闭包 + 链表，调用顺序不可变 |
| Diff 算法 | ★★★★★ | 同层比较、key 复用、列表 Diff |
| 响应式原理 | ★★★★★ | Vue2 defineProperty vs Vue3 Proxy |
| 依赖收集 | ★★★★ | WeakMap + Set，track/trigger |
| 批量更新 | ★★★★ | React 18 自动批量，flushSync |
| SSR | ★★★★ | renderToString + hydrate |
| 状态管理 | ★★★★ | 单向数据流、发布订阅 |
| 组件通信 | ★★★★ | Props/Emit、Provide/Inject、Pinia |
| 虚拟列表 | ★★★ | 只渲染可视区域，占位高度 |
| 错误边界 | ★★★ | getDerivedStateFromError |
| React vs Vue | ★★★ | 设计理念、性能、生态 |
