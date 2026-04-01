"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Users, ChevronRight, CheckCircle, FileText, Wrench, Target } from "lucide-react";
import {
  Role,
  ROLES,
  LIFECYCLE_NODES,
  WORKFLOW_DATA,
  LifecycleNode,
  RoleContent,
} from "@/data/workflow";

export function WorkflowBoard() {
  const [selectedRole, setSelectedRole] = useState<Role>("pm");
  const [selectedNode, setSelectedNode] = useState<string>("planning");

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

  return (
    <section className="workflow-board-shell">
      <div className="workflow-role-selector-compact">
        <div className="workflow-role-selector-label">
          <Users size={14} />
          <span>角色视角</span>
        </div>
        <div className="workflow-role-buttons-compact">
          {ROLES.map((role) => (
            <button
              key={role.id}
              className={`workflow-role-btn-compact${selectedRole === role.id ? " active" : ""}`}
              onClick={() => handleRoleChange(role.id)}
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
                onClick={() => handleNodeSelect(node.id)}
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
    </section>
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
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="workflow-deliverable-icon">📄</span>
                {deliverable}
              </motion.li>
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
