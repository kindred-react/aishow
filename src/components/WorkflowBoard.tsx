"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Users, ChevronRight, CheckCircle, FileText, Wrench, Target, LayoutGrid, Table2, GitBranch, Eye, EyeOff } from "lucide-react";
import {
  Role,
  ROLES,
  LIFECYCLE_NODES,
  WORKFLOW_DATA,
  LifecycleNode,
  RoleContent,
} from "@/data/workflow";

type ViewMode = "detail" | "swimlane" | "raci";

type ContextMenuState = {
  visible: boolean;
  x: number;
  y: number;
  roleId: Role | null;
};

const VIEW_TABS: { id: ViewMode; label: string; icon: React.ReactNode }[] = [
  { id: "detail", label: "详情视图", icon: <LayoutGrid size={14} /> },
  { id: "swimlane", label: "泳道图", icon: <GitBranch size={14} /> },
  { id: "raci", label: "RACI矩阵", icon: <Table2 size={14} /> },
];

export function WorkflowBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [selectedRole, setSelectedRole] = useState<Role>("pm");
  const [selectedNode, setSelectedNode] = useState<string>("planning");
  const [hiddenRoles, setHiddenRoles] = useState<Set<Role>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    roleId: null,
  });

  const visibleRoles = ROLES.filter((r) => !hiddenRoles.has(r.id));
  const hiddenRolesCount = hiddenRoles.size;
  const hiddenRolesList = ROLES.filter((r) => hiddenRoles.has(r.id));

  const currentRole = ROLES.find((r) => r.id === selectedRole)!;
  const currentData = WORKFLOW_DATA[selectedRole];
  const selectedLifecycleNode = LIFECYCLE_NODES.find((n) => n.id === selectedNode)!;
  const selectedContent = currentData[selectedNode];

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
  };

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const toggleHideRole = (roleId: Role) => {
    setHiddenRoles((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) {
        next.delete(roleId);
      } else {
        next.add(roleId);
      }
      return next;
    });
  };

  const showAllRoles = () => {
    setHiddenRoles(new Set());
  };

  const showContextMenu = (e: React.MouseEvent, roleId: Role) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      roleId,
    });
  };

  const hideContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, roleId: null });
  };

  useEffect(() => {
    const handleClick = () => hideContextMenu();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <section className="workflow-board-shell">
      <div className="workflow-view-tabs">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            className={`workflow-view-tab${viewMode === tab.id ? " active" : ""}`}
            onClick={() => setViewMode(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {viewMode === tab.id && (
              <motion.div
                className="workflow-view-tab-indicator"
                layoutId="workflowViewIndicator"
                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "detail" && (
          <motion.div
            key="detail"
            className="workflow-detail-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <DetailView
              selectedRole={selectedRole}
              selectedNode={selectedNode}
              currentRole={currentRole}
              selectedLifecycleNode={selectedLifecycleNode}
              selectedContent={selectedContent}
              onRoleChange={handleRoleChange}
              onNodeSelect={handleNodeSelect}
              visibleRoles={visibleRoles}
              hiddenRoles={hiddenRoles}
              toggleHideRole={toggleHideRole}
              onShowContextMenu={showContextMenu}
            />
          </motion.div>
        )}

        {viewMode === "swimlane" && (
          <motion.div
            key="swimlane"
            className="workflow-swimlane-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SwimlaneView
              visibleRoles={visibleRoles}
              hiddenRoles={hiddenRoles}
              toggleHideRole={toggleHideRole}
              hiddenRolesCount={hiddenRolesCount}
              showAllRoles={showAllRoles}
              onShowContextMenu={showContextMenu}
            />
          </motion.div>
        )}

        {viewMode === "raci" && (
          <motion.div
            key="raci"
            className="workflow-raci-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <RaciMatrixView
              visibleRoles={visibleRoles}
              hiddenRoles={hiddenRoles}
              toggleHideRole={toggleHideRole}
              onShowContextMenu={showContextMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contextMenu.visible && contextMenu.roleId && (
          <motion.div
            className="role-context-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-header">
              {ROLES.find((r) => r.id === contextMenu.roleId)?.icon}{" "}
              {ROLES.find((r) => r.id === contextMenu.roleId)?.name}
            </div>
            <div className="context-menu-divider" />
            <button
              className="context-menu-item"
              onClick={() => {
                toggleHideRole(contextMenu.roleId!);
                hideContextMenu();
              }}
            >
              <EyeOff size={14} />
              <span>隐藏此角色</span>
            </button>
            {hiddenRolesCount > 0 && (
              <>
                <div className="context-menu-divider" />
                <div className="context-menu-section-title">已隐藏的角色</div>
                {hiddenRolesList.map((role) => (
                  <button
                    key={role.id}
                    className="context-menu-item"
                    onClick={() => {
                      toggleHideRole(role.id);
                      hideContextMenu();
                    }}
                  >
                    <Eye size={14} />
                    <span>{role.icon} {role.name}</span>
                  </button>
                ))}
                <button
                  className="context-menu-item show-all"
                  onClick={() => {
                    showAllRoles();
                    hideContextMenu();
                  }}
                >
                  <Eye size={14} />
                  <span>显示全部角色</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function DetailView({
  selectedRole,
  selectedNode,
  currentRole,
  selectedLifecycleNode,
  selectedContent,
  onRoleChange,
  onNodeSelect,
  visibleRoles,
  hiddenRoles,
  toggleHideRole,
  onShowContextMenu,
}: {
  selectedRole: Role;
  selectedNode: string;
  currentRole: (typeof ROLES)[0];
  selectedLifecycleNode: LifecycleNode;
  selectedContent: RoleContent;
  onRoleChange: (role: Role) => void;
  onNodeSelect: (nodeId: string) => void;
  visibleRoles: typeof ROLES;
  hiddenRoles: Set<Role>;
  toggleHideRole: (roleId: Role) => void;
  onShowContextMenu: (e: React.MouseEvent, roleId: Role) => void;
}) {
  return (
    <>
      <div className="workflow-role-selector-compact">
        <div className="workflow-role-selector-label">
          <Users size={14} />
          <span>角色视角</span>
        </div>
        <div className="workflow-role-buttons-compact">
          {visibleRoles.map((role) => (
            <button
              key={role.id}
              className={`workflow-role-btn-compact${selectedRole === role.id ? " active" : ""}`}
              onClick={() => onRoleChange(role.id)}
              onContextMenu={(e) => {
                onShowContextMenu(e, role.id);
              }}
              style={{
                "--role-color": role.color,
                backgroundColor: selectedRole === role.id ? `${role.color}22` : undefined,
                borderColor: selectedRole === role.id ? role.color : undefined,
              } as React.CSSProperties}
            >
              <span className="workflow-role-icon">{role.icon}</span>
              <span className="workflow-role-name">{role.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="workflow-master-detail">
        <motion.div
          className="workflow-detail-panel-master"
          key={`detail-${selectedRole}-${selectedNode}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <WorkflowNodeDetail
            node={selectedLifecycleNode}
            content={selectedContent}
            role={currentRole}
          />
        </motion.div>

        <div className="workflow-nodes-sidebar">
          <div className="workflow-nodes-sidebar-header">
            <span className="workflow-nodes-sidebar-title">产品生命周期</span>
            <span className="workflow-nodes-sidebar-count">{LIFECYCLE_NODES.length} 个阶段</span>
          </div>
          <div className="workflow-nodes-list">
            {LIFECYCLE_NODES.map((node, index) => (
              <motion.button
                key={node.id}
                className={`workflow-node-item${selectedNode === node.id ? " active" : ""}`}
                onClick={() => onNodeSelect(node.id)}
                style={{ "--node-color": currentRole.color } as React.CSSProperties}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="workflow-node-item-marker" style={{ backgroundColor: selectedNode === node.id ? currentRole.color : "transparent" }}>
                  <span className="workflow-node-item-number">{node.phaseNum}</span>
                </div>
                <div className="workflow-node-item-content">
                  <span className="workflow-node-item-phase">{node.phase}</span>
                  <span className="workflow-node-item-desc">{node.description}</span>
                </div>
                <ChevronRight
                  size={16}
                  className={`workflow-node-item-arrow${selectedNode === node.id ? " active" : ""}`}
                />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function SwimlaneView({
  visibleRoles,
  hiddenRoles,
  toggleHideRole,
  hiddenRolesCount,
  showAllRoles,
  onShowContextMenu,
}: {
  visibleRoles: typeof ROLES;
  hiddenRoles: Set<Role>;
  toggleHideRole: (roleId: Role) => void;
  hiddenRolesCount: number;
  showAllRoles: () => void;
  onShowContextMenu: (e: React.MouseEvent, roleId: Role) => void;
}) {
  const [hoveredCell, setHoveredCell] = useState<{ role: Role; node: string; event: React.MouseEvent } | null>(null);

  const getActivityLevel = (role: Role, nodeId: string): number => {
    const data = WORKFLOW_DATA[role]?.[nodeId];
    if (!data) return 0;
    return Math.min(data.responsibilities.length, 4);
  };

  const getRoleTimeline = (role: Role) => {
    return LIFECYCLE_NODES.map((node) => ({
      nodeId: node.id,
      level: getActivityLevel(role, node.id),
    }));
  };

  const getMaxActivityPhase = (role: Role): string => {
    let maxLevel = 0;
    let maxPhase = LIFECYCLE_NODES[0].id;
    LIFECYCLE_NODES.forEach((node) => {
      const level = getActivityLevel(role, node.id);
      if (level > maxLevel) {
        maxLevel = level;
        maxPhase = node.id;
      }
    });
    return maxPhase;
  };

  const getRoleStartEnd = (role: Role): { start: number; end: number } => {
    let start = 0;
    let end = 7;
    for (let i = 0; i < LIFECYCLE_NODES.length; i++) {
      if (getActivityLevel(role, LIFECYCLE_NODES[i].id) > 0) {
        start = i;
        break;
      }
    }
    for (let i = LIFECYCLE_NODES.length - 1; i >= 0; i--) {
      if (getActivityLevel(role, LIFECYCLE_NODES[i].id) > 0) {
        end = i;
        break;
      }
    }
    return { start, end };
  };

  const hoveredCellData = hoveredCell ? WORKFLOW_DATA[hoveredCell.role]?.[hoveredCell.node] : null;
  const hoveredCellRole = hoveredCell ? ROLES.find((r) => r.id === hoveredCell.role) : null;

  const getPhaseIcon = (nodeId: string): string => {
    const icons: Record<string, string> = {
      planning: "🔍",
      requirements: "📋",
      design: "🎨",
      prototype: "🖼️",
      development: "💻",
      testing: "🧪",
      deployment: "🚀",
      operations: "📊",
    };
    return icons[nodeId] || "•";
  };

  const ROLE_ORDER: Role[] = [
    "executive",
    "stakeholder",
    "pm",
    "ux_researcher",
    "analyst",
    "architect",
    "pmo",
    "designer",
    "developer",
    "tester",
    "ops",
  ];

  const sortedVisibleRoles = [...visibleRoles].sort((a, b) => {
    return ROLE_ORDER.indexOf(a.id) - ROLE_ORDER.indexOf(b.id);
  });

  const getPhaseSeqNum = (nodeId: string): string => {
    const node = LIFECYCLE_NODES.find((n) => n.id === nodeId);
    return node ? `${node.phaseNum}` : "";
  };

  return (
    <div className="swimlane-container">
      <div className="swimlane-header">
        <div className="swimlane-header-corner">
          <span>角色</span>
          <span className="swimlane-header-timeline-label">时间线 →</span>
          {hiddenRolesCount > 0 && (
            <button className="swimlane-show-hidden-btn" onClick={showAllRoles}>
              显示全部({hiddenRolesCount})
            </button>
          )}
        </div>
        {LIFECYCLE_NODES.map((node, index) => (
          <div key={node.id} className="swimlane-header-cell">
            <span className="swimlane-header-seq">{node.phaseNum}→</span>
            <span className="swimlane-header-icon">{getPhaseIcon(node.id)}</span>
            <span className="swimlane-header-title">{node.phase}</span>
          </div>
        ))}
      </div>

      <div className="swimlane-body">
        {sortedVisibleRoles.map((role) => {
          const timeline = getRoleTimeline(role.id);
          const { start, end } = getRoleStartEnd(role.id);
          const maxPhase = getMaxActivityPhase(role.id);

          return (
            <div key={role.id} className="swimlane-row">
              <div
                className="swimlane-row-header"
                onContextMenu={(e) => {
                  onShowContextMenu(e, role.id);
                }}
              >
                <span className="swimlane-row-icon">{role.icon}</span>
                <span className="swimlane-row-name">{role.name}</span>
              </div>
              <div className="swimlane-timeline-track">
                {timeline.map((item, index) => {
                  const isActive = item.level > 0;
                  const isPeak = maxPhase === item.nodeId;
                  const isStart = start === index;
                  const isEnd = end === index;

                  return (
                    <div
                      key={item.nodeId}
                      className={`swimlane-timeline-cell ${isActive ? "active" : ""} ${isPeak ? "peak" : ""}`}
                      onMouseEnter={(e) => {
                        if (isActive) {
                          setHoveredCell({ role: role.id, node: item.nodeId, event: e });
                        }
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                      style={{
                        "--role-color": role.color,
                        "--bar-height": `${item.level * 25}%`,
                      } as React.CSSProperties}
                    >
                      {isActive && (
                        <div className={`swimlane-timeline-bar ${isPeak ? "peak" : ""}`}>
                          <span className="swimlane-cell-seq">{index + 1}</span>
                          {isPeak && <span className="swimlane-timeline-peak-marker">★</span>}
                        </div>
                      )}
                      {isStart && <div className="swimlane-timeline-start-marker" />}
                      {isEnd && <div className="swimlane-timeline-end-marker" />}
                      {index < timeline.length - 1 && <div className="swimlane-cell-connector" />}
                    </div>
                  );
                })}
                <div className="swimlane-timeline-flow-line" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="swimlane-legend">
        <div className="swimlane-legend-item">
          <div className="swimlane-timeline-bar-icon peak" />
          <span>高峰期/核心阶段 ★</span>
        </div>
        <div className="swimlane-legend-item">
          <div className="swimlane-timeline-bar-icon" />
          <span>活跃期</span>
        </div>
        <div className="swimlane-legend-item">
          <div className="swimlane-timeline-start-marker-icon" />
          <span>进入</span>
        </div>
        <div className="swimlane-legend-item">
          <div className="swimlane-timeline-end-marker-icon" />
          <span>退出</span>
        </div>
        <div className="swimlane-legend-item">
          <span className="swimlane-legend-hint">鼠标悬停查看详情</span>
        </div>
      </div>

      <AnimatePresence>
        {hoveredCell && hoveredCellData && hoveredCellRole && (
          <motion.div
            className="swimlane-tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              top: Math.min(hoveredCell.event.clientY + 40, window.innerHeight - 300),
              left: Math.min(hoveredCell.event.clientX + 40, window.innerWidth - 400),
            }}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
          >
            <div className="swimlane-tooltip-header">
              <div className="swimlane-tooltip-badge" style={{ backgroundColor: hoveredCellRole.color }}>
                {hoveredCellRole.icon} {hoveredCellRole.name}
              </div>
              <span className="swimlane-tooltip-phase">
                {getPhaseIcon(hoveredCell.node)} {LIFECYCLE_NODES.find((n) => n.id === hoveredCell.node)?.phase}
              </span>
            </div>
            <div className="swimlane-tooltip-section">
              <span className="swimlane-tooltip-label">负责的事情</span>
              <ul>
                {hoveredCellData.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="swimlane-tooltip-section">
              <span className="swimlane-tooltip-label">交付物</span>
              <div className="swimlane-tooltip-tags">
                {hoveredCellData.deliverables.map((d, i) => (
                  <span key={i} className="swimlane-tooltip-tag">{d}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type RaciRole = "R" | "A" | "C" | "I";

function getRaciForRole(role: Role, nodeId: string): RaciRole | null {
  const data = WORKFLOW_DATA[role]?.[nodeId];
  if (!data) return null;

  const count = data.responsibilities.length;
  if (count >= 3) return "R";
  if (count >= 2) return "A";
  if (count >= 1) return "C";
  return "I";
}

function RaciMatrixView({
  visibleRoles,
  hiddenRoles,
  toggleHideRole,
  onShowContextMenu,
}: {
  visibleRoles: typeof ROLES;
  hiddenRoles: Set<Role>;
  toggleHideRole: (roleId: Role) => void;
  onShowContextMenu: (e: React.MouseEvent, roleId: Role) => void;
}) {
  const [selectedCell, setSelectedCell] = useState<{ role: Role; node: string } | null>(null);

  const selectedCellData = selectedCell ? WORKFLOW_DATA[selectedCell.role]?.[selectedCell.node] : null;
  const selectedCellRole = selectedCell ? ROLES.find((r) => r.id === selectedCell.role) : null;

  const raciColors: Record<RaciRole, string> = {
    R: "#22c55e",
    A: "#6366f1",
    C: "#f59e0b",
    I: "#64748b",
  };

  const raciLabels: Record<RaciRole, string> = {
    R: "执行 Responsible",
    A: "负责 Accountable",
    C: "咨询 Consulted",
    I: "知情 Informed",
  };

  return (
    <div className="raci-container">
      <div className="raci-header">
        <div className="raci-header-corner">角色 / 阶段</div>
        {LIFECYCLE_NODES.map((node) => (
          <div key={node.id} className="raci-header-cell">
            <span className="raci-header-num">{node.phaseNum}</span>
            <span className="raci-header-title">{node.phase}</span>
          </div>
        ))}
      </div>

      <div className="raci-body">
        {visibleRoles.map((role) => (
          <div key={role.id} className="raci-row">
            <div
              className="raci-row-header"
              onContextMenu={(e) => {
                onShowContextMenu(e, role.id);
              }}
            >
              <span className="raci-row-icon">{role.icon}</span>
              <span className="raci-row-name">{role.name}</span>
            </div>
            {LIFECYCLE_NODES.map((node) => {
              const raci = getRaciForRole(role.id, node.id);
              const isSelected = selectedCell?.role === role.id && selectedCell?.node === node.id;
              return (
                <div
                  key={node.id}
                  className={`raci-cell ${raci ? "active" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedCell({ role: role.id, node: node.id })}
                  style={{ backgroundColor: raci ? `${raciColors[raci]}22` : undefined, borderColor: raci ? raciColors[raci] : undefined }}
                >
                  {raci && <span style={{ color: raciColors[raci] }}>{raci}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="raci-legend">
        {(["R", "A", "C", "I"] as RaciRole[]).map((key) => (
          <div key={key} className="raci-legend-item">
            <div className="raci-legend-badge" style={{ backgroundColor: raciColors[key] }}>
              {key}
            </div>
            <span>{raciLabels[key]}</span>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCell && selectedCellData && selectedCellRole && (
          <motion.div
            className="raci-detail-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="raci-detail-header">
              <div className="raci-detail-badge" style={{ backgroundColor: selectedCellRole.color }}>
                {selectedCellRole.icon} {selectedCellRole.name}
              </div>
              <h4>{LIFECYCLE_NODES.find((n) => n.id === selectedCell.node)?.phase}</h4>
            </div>
            <div className="raci-detail-section">
              <span className="raci-detail-label">负责的事情</span>
              <ul>
                {selectedCellData.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div className="raci-detail-section">
              <span className="raci-detail-label">交付物</span>
              <ul>
                {selectedCellData.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
            <div className="raci-detail-section">
              <span className="raci-detail-label">协作角色</span>
              <div className="raci-detail-collaborators">
                {selectedCellData.collaborationRoles.map((c, i) => (
                  <span key={i} className="raci-detail-collaborator">{c}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeliverableItem({
  deliverable,
  tools,
  index,
}: {
  deliverable: string;
  tools: { name: string; href: string; recommended?: boolean }[];
  index: number;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const wrapperRef = useRef<HTMLLIElement>(null);

  const getRelatedTools = () => {
    const keywords: Record<string, string[]> = {
      "市场分析": ["Perplexity", "ChatGPT", "问卷星"],
      "竞品分析": ["Perplexity", "ChatGPT", "百度指数", "蝉妈妈"],
      "用户调研": ["问卷星", "腾讯问卷", "Perplexity", "ChatGPT", "碘问卷"],
      "需求文档": ["Notion", "飞书文档", "腾讯文档", "语雀", "Confluence"],
      "PRD": ["Notion", "飞书文档", "腾讯文档", "语雀", "Confluence"],
      "流程图": ["ProcessOn", "Mermaid", "XMind", "百度脑图", "Draw.io"],
      "原型": ["墨刀", "Figma", "Axure", "MasterGo", "即时设计", "Pixso"],
      "接口文档": ["Apifox", "YApi", "ShowDoc", "飞书项目", "Swagger"],
      "测试": ["Jira", "禅道", "Teambition", "飞书项目", "TestLink"],
      "文档": ["Notion", "飞书文档", "腾讯文档", "语雀", "Confluence", "Markdown"],
      "报告": ["Notion", "飞书文档", "腾讯文档", "语雀"],
      "数据分析": ["神策数据", "GrowingIO", "Mixpanel", "百度统计"],
      "项目管理": ["禅道", "Teambition", "飞书项目", "Notion", "Tower"],
      "团队协作": ["飞书", "钉钉", "企业微信", "Slack", "Notion"],
      "代码管理": ["GitLab", "GitHub", "Gitea", "CODING"],
      "UI设计": ["Figma", "Sketch", "MasterGo", "即时设计", "Pixso", "Adobe XD"],
      "思维导图": ["XMind", "百度脑图", "幕布", "MindMaster"],
      "版本控制": ["GitLab", "GitHub", "SVN", "Gitea"],
    };

    for (const [key, toolNames] of Object.entries(keywords)) {
      if (deliverable.includes(key)) {
        return tools.filter((t) => toolNames.includes(t.name));
      }
    }
    return tools;
  };

  const relatedTools = getRelatedTools();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTooltip]);

  return (
    <motion.li
      ref={wrapperRef}
      className="deliverable-item-wrapper"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <span
        className="deliverable-text-wrapper"
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip(!showTooltip);
        }}
      >
        <span className="workflow-deliverable-icon">📄</span>
        <span className="deliverable-text">{deliverable}</span>
        <span className="deliverable-arrow">{showTooltip ? "▲" : "▼"}</span>
      </span>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="deliverable-bubble"
            initial={{ opacity: 0, scale: 0.9, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -5 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="deliverable-bubble-header">推荐工具</div>
            <div className="deliverable-bubble-tools">
              {relatedTools.map((tool, i) => (
                <a
                  key={i}
                  href={tool.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`deliverable-tool-link${tool.recommended ? " recommended" : ""}`}
                >
                  {tool.recommended && <span className="tool-star">★</span>}
                  {tool.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function WorkflowNodeDetail({
  node,
  content,
  role,
}: {
  node: LifecycleNode;
  content: RoleContent;
  role: (typeof ROLES)[0];
}) {
  return (
    <div className="workflow-detail-content">
      <div className="workflow-detail-header">
        <div
          className="workflow-detail-badge"
          style={{ backgroundColor: role.color }}
        >
          {role.icon} {role.name}
        </div>
        <h3 className="workflow-detail-title">
          {node.phaseNum}. {node.phase}
        </h3>
        <p className="workflow-detail-desc">{node.description}</p>
      </div>

      <div className="workflow-detail-grid">
        <div className="workflow-detail-section">
          <div className="workflow-section-header">
            <CheckCircle size={16} />
            <h4>负责的事情</h4>
          </div>
          <ul className="workflow-responsibility-list">
            {content.responsibilities.map((resp, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {resp}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="workflow-detail-section">
          <div className="workflow-section-header">
            <FileText size={16} />
            <h4>应该输出的文档</h4>
          </div>
          <ul className="workflow-deliverable-list">
            {content.deliverables.map((deliverable, index) => (
              <DeliverableItem
                key={index}
                deliverable={deliverable}
                tools={content.tools}
                index={index}
              />
            ))}
          </ul>
        </div>

        <div className="workflow-detail-section">
          <div className="workflow-section-header">
            <Target size={16} />
            <h4>验收标准</h4>
          </div>
          <ul className="workflow-acceptance-list">
            {content.acceptanceCriteria.map((criteria, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="workflow-acceptance-icon">✓</span>
                {criteria}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="workflow-detail-section workflow-tools-section">
          <div className="workflow-section-header">
            <Wrench size={16} />
            <h4>推荐工具</h4>
          </div>
          <div className="workflow-tools-grid">
            {content.tools.map((tool, index) => (
              <motion.a
                key={index}
                href={tool.href}
                target="_blank"
                rel="noreferrer"
                className={`workflow-tool-card${tool.recommended ? " recommended" : ""}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
              >
                <span className="workflow-tool-name">
                  {tool.recommended && <span className="workflow-tool-star">★ </span>}
                  {tool.name}
                </span>
                <ExternalLink size={14} className="workflow-tool-link" />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
