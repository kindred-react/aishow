"use client";
import { useState } from "react";
import { Trash2, X, ImageOff, Loader, CheckCircle } from "lucide-react";
import { learningModules } from "@/data/knowledge";

const REPO = "kindred-react/aishow";
const BRANCH = "main";
const UPLOAD_DIR = "public/uploads";

async function listUploadedImages(token: string): Promise<Array<{ name: string; sha: string; path: string }>> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${UPLOAD_DIR}?ref=${BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map((f: { name: string; sha: string; path: string }) => ({ name: f.name, sha: f.sha, path: f.path })) : [];
}

async function deleteFile(path: string, sha: string, token: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `chore: remove unused image ${path}`,
        sha,
        branch: BRANCH,
      }),
    }
  );
  return res.ok;
}

function getAllImageUrls(): Set<string> {
  const urls = new Set<string>();
  for (const m of learningModules) {
    for (const n of m.knowledgeNodes) {
      if (n.imageUrl) urls.add(n.imageUrl.replace(/^\//, ""));
    }
  }
  return urls;
}

interface OrphanImage {
  name: string;
  sha: string;
  path: string;
  publicPath: string;
  selected: boolean;
}

export function ImageCleanupModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [orphans, setOrphans] = useState<OrphanImage[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleScan = async () => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    if (!token) { setMsg("未配置 GitHub Token"); return; }
    setLoading(true);
    setMsg("");
    try {
      const files = await listUploadedImages(token);
      const usedUrls = getAllImageUrls();
      const orphanFiles = files
        .filter(f => {
          const publicPath = `uploads/${f.name}`;
          return !usedUrls.has(publicPath) && !usedUrls.has(`/${publicPath}`);
        })
        .map(f => ({
          name: f.name,
          sha: f.sha,
          path: f.path,
          publicPath: `/uploads/${f.name}`,
          selected: true,
        }));
      setOrphans(orphanFiles);
      setScanned(true);
      if (orphanFiles.length === 0) setMsg("没有发现孤立图片，仓库很干净 ✓");
    } catch (e) {
      setMsg(`扫描失败: ${String(e)}`);
    }
    setLoading(false);
  };

  const toggleSelect = (name: string) =>
    setOrphans(prev => prev.map(o => o.name === name ? { ...o, selected: !o.selected } : o));

  const handleDelete = async () => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    if (!token) return;
    const toDelete = orphans.filter(o => o.selected);
    if (!toDelete.length) return;
    if (!confirm(`确定删除 ${toDelete.length} 张未引用的图片？此操作不可撤销。`)) return;
    setDeleting(true);
    setMsg("");
    let success = 0;
    for (const img of toDelete) {
      const ok = await deleteFile(img.path, img.sha, token);
      if (ok) {
        success++;
        setOrphans(prev => prev.filter(o => o.name !== img.name));
      }
    }
    setMsg(`已删除 ${success} / ${toDelete.length} 张图片`);
    setDeleting(false);
  };

  const selectedCount = orphans.filter(o => o.selected).length;

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="note-modal-header">
          <span><ImageOff size={14} /> 孤立图片清理</span>
          <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="note-edit-body">
          {!scanned && (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <p style={{ fontSize: "0.8rem", color: "#5a7090", marginBottom: "1rem" }}>
                扫描 GitHub 仓库 <code>public/uploads/</code> 目录，找出未被任何知识点卡片引用的图片
              </p>
              <button type="button" className="note-save-btn note-save-btn-active" onClick={handleScan} disabled={loading}>
                {loading ? <><Loader size={13} className="note-spin" /> 扫描中…</> : <><CheckCircle size={13} /> 开始扫描</>}
              </button>
            </div>
          )}

          {scanned && orphans.length > 0 && (
            <>
              <p style={{ fontSize: "0.75rem", color: "#5a7090", marginBottom: "0.5rem" }}>
                发现 <strong style={{ color: "#f06060" }}>{orphans.length}</strong> 张未引用图片，勾选后可批量删除：
              </p>
              <div className="orphan-img-grid">
                {orphans.map(img => (
                  <div key={img.name}
                    className={`orphan-img-item ${img.selected ? "selected" : ""}`}
                    onClick={() => toggleSelect(img.name)}
                  >
                    <img src={img.publicPath} alt={img.name} loading="lazy" />
                    <span className="orphan-img-name">{img.name}</span>
                    <span className={`orphan-img-check ${img.selected ? "on" : ""}`}>✓</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {msg && <p style={{ fontSize: "0.75rem", color: msg.includes("✓") || msg.includes("已删除") ? "var(--c-neon)" : "#f06060", marginTop: "0.5rem" }}>{msg}</p>}
        </div>

        {scanned && orphans.length > 0 && (
          <div className="note-modal-footer">
            <span className="note-hint">已选 {selectedCount} / {orphans.length} 张</span>
            <button type="button" className="note-delete-btn" onClick={handleDelete} disabled={deleting || selectedCount === 0}>
              {deleting ? <><Loader size={13} className="note-spin" /> 删除中…</> : <><Trash2 size={13} /> 删除选中 ({selectedCount})</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
