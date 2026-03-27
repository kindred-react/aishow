"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Code2 } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Framework {
  id: string;
  name: string;
  org: string;
  color: string;
  accent: string;
  tag: string;
  strength: string;
  complexity: string;
  mcpMode: string;
  bestFor: string;
  keyPoints: string[];
  code: string;
}

const frameworks: Framework[] = [
  {
    id: "openai-sdk",
    name: "OpenAI Agents SDK",
    org: "OpenAI",
    color: "var(--c-neon)",
    accent: "rgba(99,243,255,0.08)",
    tag: "官方 · 轻量",
    strength: "简单易用",
    complexity: "⭐ 低",
    mcpMode: "MCPServerStdio / 缓存列表",
    bestFor: "快速原型、多Agent Handoffs",
    keyPoints: [
      "源自 OpenAI 内部 Swarm 项目",
      "支持 Handoffs（Agent转交）和 Guardrails（护栏）",
      "cache_tools_list=True 自动缓存工具列表",
      "最小集功能设计，上手极快",
    ],
    code: `import asyncio, os
from agents import Agent, Runner, AsyncOpenAI
from agents.mcp import MCPServerStdio

async def main():
    # 1. 创建 MCP Server
    search_server = MCPServerStdio(params={
        "command": "npx",
        "args": ["-y", "@mcptools/mcp-tavily"],
        "env": {**os.environ}
    })
    await search_server.connect()

    # 2. 创建 Agent 并集成 MCP
    agent = Agent(
        name="助手Agent",
        instructions="你是一个具有网页搜索能力的助手。",
        mcp_servers=[search_server],
    )
    result = await Runner.run(agent, "Llama4.0发布了吗？")
    print(result.final_output)
    await search_server.cleanup()

asyncio.run(main())`,
  },
  {
    id: "langgraph",
    name: "LangGraph",
    org: "LangChain",
    color: "var(--c-lime)",
    accent: "rgba(176,255,112,0.08)",
    tag: "生态成熟 · 功能强大",
    strength: "有状态Graph工作流",
    complexity: "⭐⭐⭐ 高",
    mcpMode: "MultiServerMCPClient",
    bestFor: "复杂Agentic Workflow、多Agent系统",
    keyPoints: [
      "任务建模为有状态 Graph 结构",
      "MultiServerMCPClient 支持多 MCP Server",
      "Prebuilt 接口可快速创建 ReAct Agent",
      "LangChain 生态无缝集成",
    ],
    code: `from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
import asyncio, os

model = ChatOpenAI(model="gpt-4o-mini")

async def run_agent():
    async with MultiServerMCPClient({
        "tavily": {
            "command": "npx",
            "args": ["-y", "@mcptools/mcp-tavily"],
            "env": {**os.environ}
        }
    }) as client:
        agent = create_react_agent(model, client.get_tools())
        response = await agent.ainvoke({
            "messages": [("human", "Llama4.0发布了吗？")]
        })
        return response["messages"][-1].content

asyncio.run(run_agent())`,
  },
  {
    id: "llamaindex",
    name: "LlamaIndex",
    org: "LlamaIndex",
    color: "var(--c-violet)",
    accent: "rgba(158,141,255,0.08)",
    tag: "企业级RAG+Agent",
    strength: "数据中心型LLM应用",
    complexity: "⭐⭐ 中",
    mcpMode: "McpToolSpec + BasicMCPClient",
    bestFor: "企业级RAG、事件驱动Workflow",
    keyPoints: [
      "最初专注 RAG，现扩展为全能框架",
      "AgentWorkflow 比 LangGraph 更简单",
      "SSE 模式只需替换 BasicMCPClient 的 url 参数",
      "大量预置 RAG 优化模块",
    ],
    code: `from llama_index.tools.mcp import McpToolSpec, BasicMCPClient
from llama_index.llms.openai import OpenAI
from llama_index.core.agent import ReActAgent
import asyncio, os

llm = OpenAI(model="gpt-4o-mini")

async def main():
    mcp_client = BasicMCPClient(
        "npx", ["-y", "@mcptools/mcp-tavily"],
        env={**os.environ}
    )
    tools = await McpToolSpec(client=mcp_client).to_tool_list_async()
    agent = ReActAgent.from_tools(
        tools, llm=llm, verbose=True,
        system_prompt="你是一个具有网页搜索能力的助手。"
    )
    response = await agent.aquery("Llama4.0发布了吗？")
    print(response)

asyncio.run(main())`,
  },
  {
    id: "autogen",
    name: "AutoGen 0.4+",
    org: "Microsoft",
    color: "var(--c-cyan)",
    accent: "rgba(102,201,255,0.08)",
    tag: "分布式多Agent",
    strength: "企业级多Agent协作",
    complexity: "⭐⭐⭐ 高",
    mcpMode: "mcp_server_tools / SseServerParams",
    bestFor: "分布式系统、细粒度控制",
    keyPoints: [
      "微软开发，专注多 Agent 对话协调",
      "AutoGen-Core 提供底层 API 控制",
      "支持分布式多 Agent 架构",
      "SSE 模式用 SseServerParams 替换",
    ],
    code: `from autogen_ext.tools.mcp import StdioServerParams, mcp_server_tools
from autogen_ext.models import OpenAIChatCompletionClient
import asyncio, os

async def get_mcp_tools():
    server_params = StdioServerParams(
        command="npx",
        args=["-y", "@mcptools/mcp-tavily"],
        env={**os.environ}
    )
    return await mcp_server_tools(server_params)

async def main():
    tools = await get_mcp_tools()
    # 注册到 runtime 并发送消息
    runtime = SingleThreadedAgentRuntime()
    await ToolUseAgent.register(runtime, "my_agent", lambda: ToolUseAgent(tools))
    response = await runtime.send_message(
        Message("Llama4.0发布了吗？"),
        AgentId("my_agent", "default")
    )

asyncio.run(main())`,
  },
  {
    id: "pydantic-ai",
    name: "Pydantic AI",
    org: "Pydantic",
    color: "var(--c-orange)",
    accent: "rgba(255,180,84,0.08)",
    tag: "强类型 · 结构化输出",
    strength: "类型验证与结构化输出",
    complexity: "⭐ 低",
    mcpMode: "MCPServerStdio / MCPServerHTTP",
    bestFor: "结构化输出、与其他框架集成",
    keyPoints: [
      "来自 Pydantic 库开发者",
      "天然结构化输出与强类型验证",
      "SSE 模式用 MCPServerHTTP 替换",
      "与其他框架集成良好",
    ],
    code: `from pydantic_ai import Agent
from pydantic_ai.mcp import MCPServerStdio
import asyncio, os

server = MCPServerStdio(
    'npx', ["-y", "@mcptools/mcp-tavily"],
    env={**os.environ}
)
agent = Agent(
    name="助手Agent",
    system_prompt="你是一个具有网页搜索能力的助手。",
    model='openai:gpt-4o-mini',
    mcp_servers=[server]
)

async def main():
    async with agent.run_mcp_servers():
        result = await agent.run('Llama4.0发布了吗?')
    print(result.data)

asyncio.run(main())`,
  },
  {
    id: "smolagents",
    name: "SmolAgents",
    org: "HuggingFace",
    color: "var(--c-pink)",
    accent: "rgba(255,128,191,0.08)",
    tag: "轻量 · 代码工具调用",
    strength: "代码生成式工具调用",
    complexity: "⭐ 低",
    mcpMode: "ToolCollection.from_mcp",
    bestFor: "HuggingFace生态、CodeAgent",
    keyPoints: [
      "HuggingFace 出品，核心是 CodeAgent",
      "基于代码生成的工具调用（非JSON）",
      "ToolCollection.from_mcp 一行集成",
      "SSE 模式替换 server_parameters 为 url",
    ],
    code: `from smolagents import ToolCollection, CodeAgent, LiteLLMModel
from mcp import StdioServerParameters
import os

model = LiteLLMModel(model_id="gpt-4o-mini")
server_parameters = StdioServerParameters(
    command="npx",
    args=["-y", "@mcptools/mcp-tavily"],
    env={**os.environ},
)

with ToolCollection.from_mcp(
    server_parameters, trust_remote_code=True
) as tool_collection:
    agent = ToolCallingAgent(
        tools=[*tool_collection.tools], model=model
    )
    response = agent.run("Llama4.0发布了吗？")
    print(response)`,
  },
  {
    id: "camel",
    name: "Camel",
    org: "Camel-AI",
    color: "var(--c-lime)",
    accent: "rgba(176,255,112,0.06)",
    tag: "角色扮演 · 多Agent",
    strength: "角色扮演式多Agent协作",
    complexity: "⭐⭐ 中",
    mcpMode: "MCPToolkit + MCPClient",
    bestFor: "多Agent角色扮演、RAG应用",
    keyPoints: [
      "专注 Agent 角色扮演和交互协作",
      "内置多种角色 Agent 抽象",
      "可将 Camel 工具集发布为 MCP Server",
      "SSE 模式替换 MCPClient 为 url",
    ],
    code: `import asyncio, os
from camel.toolkits.mcp_toolkit import MCPToolkit, MCPClient
from camel.agents import ChatAgent

async def run_example():
    mcp_client = MCPClient(
        command_or_url="npx",
        args=["-y", "@mcptools/mcp-tavily"],
        env={**os.environ}
    )
    await mcp_client.connect()
    tools = MCPToolkit(servers=[mcp_client]).get_tools()
    agent = ChatAgent(system_message="根据任务，使用搜索工具获取信息。", tools=tools)
    response = await agent.astep("Llama4.0发布了吗？")
    print(response.msgs[0].content)
    await mcp_client.disconnect()

asyncio.run(run_example())`,
  },
  {
    id: "crewai",
    name: "CrewAI",
    org: "CrewAI",
    color: "var(--c-cyan)",
    accent: "rgba(102,201,255,0.06)",
    tag: "团队协作 · 角色职责",
    strength: "结构化Agent团队编排",
    complexity: "⭐⭐ 中",
    mcpMode: "MCPAdapt + CrewAIAdapter（第三方）",
    bestFor: "团队式多Agent、Agentic Workflow",
    keyPoints: [
      "角色扮演设计，每个 Agent 有明确职责",
      "Flow 功能创建可靠 Agentic Workflow",
      "官方 MCP 集成尚未正式发布，需第三方适配器",
      "Crew 结构适合复杂任务分工",
    ],
    code: `import os
from crewai import Agent, Crew, Task
from mcp import StdioServerParameters
from mcpadapt.core import MCPAdapt
from mcpadapt.crewai_adapter import CrewAIAdapter

with MCPAdapt(
    StdioServerParameters(
        command="npx",
        args=["-y", "@mcptools/mcp-tavily"],
        env={**os.environ}
    ),
    CrewAIAdapter(),
) as tools:
    agent = Agent(
        role="SearchAgent",
        goal="使用搜索工具获取信息",
        backstory="你是一个中文搜索助手",
        tools=tools, llm="gpt-4o-mini",
    )
    task = Task(
        description="Llama4.0的最新消息",
        agent=agent,
        expected_output="消息列表"
    )
    task.execute_sync()`,
  },
];

const compareRows = [
  { label: "来源", key: "org" as const },
  { label: "特色标签", key: "tag" as const },
  { label: "复杂度", key: "complexity" as const },
  { label: "MCP集成", key: "mcpMode" as const },
  { label: "最适合", key: "bestFor" as const },
];

export function AgentFrameworkCompare() {
  const [showAll, setShowAll] = useState(true);
  const [activeId, setActiveId] = useState("openai-sdk");

  const active = frameworks.find(f => f.id === activeId) ?? frameworks[0];

  return (
    <div className="afc-root">
      {/* 对比总表 */}
      <div className="apc-table-header" onClick={() => setShowAll(v => !v)}>
        <span>8种主流Agent框架横向对比</span>
        {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      <AnimatePresence initial={false}>
        {showAll && (
          <motion.div key="all" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div className="apc-table-wrap">
              <table className="apc-table">
                <thead>
                  <tr>
                    <th>维度</th>
                    {frameworks.map(f => (
                      <th key={f.id} style={{ color: f.color }}>
                        {f.name}
                        <span className="apc-th-en">{f.org}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map(row => (
                    <tr key={row.key}>
                      <td className="apc-row-label">{row.label}</td>
                      {frameworks.map(f => (
                        <td key={f.id}>{f[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 框架选择标签 */}
            <div className="afc-tabs">
              {frameworks.map(f => (
                <button
                  key={f.id}
                  type="button"
                  className={`afc-tab ${activeId === f.id ? "afc-tab-active" : ""}`}
                  style={{ borderColor: activeId === f.id ? f.color : undefined, color: activeId === f.id ? f.color : undefined }}
                  onClick={() => setActiveId(f.id)}
                >
                  {f.name}
                </button>
              ))}
            </div>

            {/* 详情面板 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className="afc-panel"
                style={{ borderColor: active.color, background: active.accent }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="afc-panel-header">
                  <div>
                    <strong style={{ color: active.color }}>{active.name}</strong>
                    <span className="afc-tag">{active.tag}</span>
                  </div>
                  <div className="afc-meta">
                    <span>{active.complexity}</span>
                    <span className="afc-mcp-mode"><Code2 size={11} /> {active.mcpMode}</span>
                  </div>
                </div>

                <div className="afc-body">
                  <ul className="apc-key-points">
                    {active.keyPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>

                  <div className="afc-code-wrap">
                    <div className="afc-code-label">集成 MCP Server 示例代码</div>
                    <SyntaxHighlighter
                      language="python"
                      style={oneDark}
                      customStyle={{ fontSize: "0.72rem", borderRadius: "7px", margin: 0, maxHeight: "320px" }}
                      showLineNumbers
                    >
                      {active.code}
                    </SyntaxHighlighter>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
