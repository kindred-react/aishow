"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ZoomIn, X } from "lucide-react";

interface MLAlgorithm {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  accent: string;
  imageUrl?: string;
  category: string;
  complexity: string;
  supervised: string;
  bestFor: string;
  llmLink: string;
  flow: string[];
  keyPoints: string[];
}

const algorithms: MLAlgorithm[] = [
  {
    id: "linear-regression",
    name: "线性回归",
    nameEn: "Linear Regression",
    color: "var(--c-cyan)",
    accent: "rgba(102,201,255,0.10)",
    imageUrl: "/ml-algorithms/linear-regression.png",
    category: "回归",
    complexity: "⭐ 极低",
    supervised: "✅ 有监督",
    bestFor: "房价预测、趋势分析",
    llmLink: "输出层 logits = Wx + b",
    flow: ["输入特征", "线性变换 Wx+b", "预测连续值", "最小化平方误差", "参数更新"],
    keyPoints: [
      "最小二乘法，最小化 Σ(y - ŷ)²",
      "高斯1809年提出，最古老的统计学习方法",
      "Python: sklearn.LinearRegression",
      "大模型关联：Transformer 每层线性变换的基础",
    ],
  },
  {
    id: "logistic-regression",
    name: "逻辑回归",
    nameEn: "Logistic Regression",
    color: "var(--c-lime)",
    accent: "rgba(176,255,112,0.10)",
    imageUrl: "/ml-algorithms/logistic-regression.png",
    category: "分类",
    complexity: "⭐ 极低",
    supervised: "✅ 有监督",
    bestFor: "二分类、概率输出",
    llmLink: "Softmax = 多分类逻辑回归",
    flow: ["输入特征", "线性变换", "Sigmoid→(0,1)", "输出分类概率", "交叉熵损失更新"],
    keyPoints: [
      "Sigmoid: σ(x) = 1/(1+e⁻ˣ)，压缩到(0,1)",
      "输出可解释为概率，适合置信度场景",
      "大模型关联：next-token 预测用 Softmax（多分类版）",
      "适用：垃圾邮件分类、疾病预测",
    ],
  },
  {
    id: "gradient-descent",
    name: "梯度下降",
    nameEn: "Gradient Descent",
    color: "var(--c-neon)",
    accent: "rgba(99,243,255,0.10)",
    category: "优化",
    complexity: "⭐⭐ 中",
    supervised: "通用优化器",
    bestFor: "神经网络训练、参数优化",
    llmLink: "Adam 是大模型训练主流优化器",
    flow: ["初始化参数", "前向传播计算损失", "反向传播求梯度", "θ=θ-lr×∇L", "迭代收敛"],
    keyPoints: [
      "Cauchy 1847年提出，沿梯度反方向下降",
      "变种：SGD / Mini-batch / Adam（自适应）",
      "大模型训练标配：AdamW + 学习率预热 + 余弦退火",
      "风险：局部最小值、梯度消失/爆炸",
    ],
  },
  {
    id: "neural-network",
    name: "神经网络",
    nameEn: "Neural Network",
    color: "var(--c-violet)",
    accent: "rgba(158,141,255,0.10)",
    imageUrl: "/ml-algorithms/neural-network.png",
    category: "深度学习",
    complexity: "⭐⭐⭐ 高",
    supervised: "✅ 有监督为主",
    bestFor: "图像/语音/NLP 复杂任务",
    llmLink: "Transformer 是特殊深层神经网络",
    flow: ["输入层", "隐藏层×N（线性+激活）", "前向传播", "损失计算", "反向传播更新"],
    keyPoints: [
      "结构：输入层 → 多隐藏层 → 输出层",
      "激活函数：ReLU / GELU（大模型常用GELU）",
      "大模型关联：GPT/BERT 都是特殊深层神经网络",
      "训练技巧：Dropout、BatchNorm、残差连接",
    ],
  },
  {
    id: "decision-tree",
    name: "决策树",
    nameEn: "Decision Tree",
    color: "var(--c-orange)",
    accent: "rgba(255,180,84,0.10)",
    imageUrl: "/ml-algorithms/decision-tree.png",
    category: "分类/回归",
    complexity: "⭐ 低",
    supervised: "✅ 有监督",
    bestFor: "可解释性要求高的场景",
    llmLink: "CoT 推理类比决策树分解",
    flow: ["选最优特征", "按阈值分裂", "递归子集", "到达叶子节点", "输出预测结果"],
    keyPoints: [
      "分裂标准：信息增益（ID3）/ 基尼系数（CART）",
      "优点：可视化、可解释、无需归一化",
      "集成进化：随机森林、XGBoost、LightGBM",
      "大模型关联：CoT 推理类似决策树逐步分解",
    ],
  },
  {
    id: "kmeans",
    name: "K均值聚类",
    nameEn: "K-Means",
    color: "var(--c-pink)",
    accent: "rgba(255,128,191,0.10)",
    imageUrl: "/ml-algorithms/kmeans.png",
    category: "聚类",
    complexity: "⭐⭐ 中",
    supervised: "❌ 无监督",
    bestFor: "数据分组、语义聚类",
    llmLink: "Embedding 空间语义聚类",
    flow: ["随机初始化K质心", "分配最近质心", "更新质心", "迭代收敛", "输出K个簇"],
    keyPoints: [
      "需预设 K（肘部法则选择）",
      "K-means++ 改进初始化稳定性",
      "大模型关联：对 Embedding 向量做语义聚类",
      "RAG 应用：检索结果聚类后再送 LLM，减少重复",
    ],
  },
];

const compareRows = [
  { label: "类别", key: "category" as const },
  { label: "复杂度", key: "complexity" as const },
  { label: "监督类型", key: "supervised" as const },
  { label: "最适合", key: "bestFor" as const },
  { label: "大模型关联", key: "llmLink" as const },
];

export function MLAlgorithmCompare() {
  const [showTable, setShowTable] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; name: string } | null>(null);

  return (
    <div className="apc-root">
      <div className="apc-table-header" onClick={() => setShowTable(v => !v)}>
        <span>六种算法横向对比</span>
        {showTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      <AnimatePresence initial={false}>
        {showTable && (
          <motion.div key="table" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div className="apc-table-wrap">
              <table className="apc-table">
                <thead>
                  <tr>
                    <th>维度</th>
                    {algorithms.map(a => (
                      <th key={a.id} style={{ color: a.color }}>
                        {a.name}
                        <span className="apc-th-en">{a.nameEn}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map(row => (
                    <tr key={row.key}>
                      <td className="apc-row-label">{row.label}</td>
                      {algorithms.map(a => (
                        <td key={a.id}>{a[row.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="apc-cards" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        {algorithms.map((a, i) => (
          <motion.article
            key={a.id}
            className="apc-card apc-card-open"
            style={{ borderColor: a.color, background: a.accent }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <div className="apc-card-header">
              <div className="apc-card-title">
                <strong style={{ color: a.color }}>{a.name}</strong>
                <span className="apc-card-en">{a.nameEn}</span>
              </div>
              <span className="apc-complexity">{a.complexity}</span>
            </div>

            <div className="apc-flow">
              {a.flow.map((step, idx) => (
                <span key={idx} className="apc-flow-step">
                  {step}
                  {idx < a.flow.length - 1 && <span className="apc-flow-arrow">→</span>}
                </span>
              ))}
            </div>

            <div className="apc-detail">
              {a.imageUrl && (
                <button type="button" className="apc-img-btn"
                  onClick={() => setLightboxImg({ src: a.imageUrl!, name: a.name })}
                  title="点击查看大图"
                >
                  <img src={a.imageUrl} alt={a.name} className="apc-detail-img" loading="lazy" />
                  <span className="apc-img-hint"><ZoomIn size={12} /> 点击放大</span>
                </button>
              )}
              <ul className="apc-key-points">
                {a.keyPoints.map((pt, j) => <li key={j}>{pt}</li>)}
              </ul>
            </div>
          </motion.article>
        ))}
      </div>

      <AnimatePresence>
        {lightboxImg && (
          <motion.div className="apc-lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setLightboxImg(null)}>
            <motion.div className="apc-lightbox-inner" initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }} transition={{ duration: 0.22 }} onClick={(e) => e.stopPropagation()}>
              <div className="apc-lightbox-header">
                <span>{lightboxImg.name} — 算法示意图</span>
                <button type="button" className="apc-lightbox-close" onClick={() => setLightboxImg(null)}><X size={16} /></button>
              </div>
              <img src={lightboxImg.src} alt={lightboxImg.name} className="apc-lightbox-img" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
