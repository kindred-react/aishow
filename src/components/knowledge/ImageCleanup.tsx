"use client";
import { useState } from "react";
import { Trash2, X, ImageOff, Loader, CheckCircle } from "lucide-react";
import { learningModules } from "@/data/knowledge";
import { useI18n } from "@/lib/i18n";

import { GITHUB_REPO, GITHUB_BRANCH, UPLOAD_BASE_DIR } from "@/data/constants";


async function listUploadedImages(token: string): Promise<Array<{ name: string; sha: string; path: string }>> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${UPLOAD_BASE_DIR}?ref=${GITHUB_BRANCH}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data.map((f: { name: string; sha: string; path: string }) => ({ name: f.name, sha: f.sha, path: f.path })) : [];
}

async function deleteFile(path: string, sha: string, token: string): Promise<boolean> {
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
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
        branch: GITHUB_BRANCH,
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
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [orphans, setOrphans] = useState<OrphanImage[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleScan = async () => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    if (!token) { setMsg(t.noGithubToken); return; }
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
      if (orphanFiles.length === 0) setMsg(t.imageCleanupNone);
    } catch (e) {
      setMsg(t.imageCleanupFailed(String(e)));
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
    if (!confirm(t.imageCleanupDeleteConfirm(toDelete.length))) return;
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
    setMsg(t.imageCleanupDeleted(success, toDelete.length));
    setDeleting(false);
  };

  const selectedCount = orphans.filter(o => o.selected).length;

  return (
    <div className="note-overlay" onClick={onClose}>
      <div className="note-modal note-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="note-modal-header">
          <span><ImageOff size={14} /> {t.imageCleanupTitle}</span>
          <button type="button" className="note-close" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="note-edit-body">
          {!scanned && (
            <div className="text-center py-4">
              <p className="text-[0.8rem] text-[#5a7090] mb-4">
                {t.imageCleanupDesc}<code>public/uploads/</code>{t.imageCleanupDescSuffix}
              </p>
              <button type="button" className="note-save-btn note-save-btn-active" onClick={handleScan} disabled={loading}>
                {loading ? <><Loader size={13} className="note-spin" /> {t.imageCleanupScanning}</> : <><CheckCircle size={13} /> {t.imageCleanupStartScan}</>}
              </button>
            </div>
          )}

          {scanned && orphans.length > 0 && (
            <>
              <p className="text-[0.75rem] text-[#5a7090] mb-2">
                {t.imageCleanupFound()}<strong className="text-red-400">{orphans.length}</strong>{t.imageCleanupFoundSuffix}
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

          {msg && <p className={`text-xs mt-2 ${msg.includes("✓") || msg.startsWith(t.imageCleanupDeleted(0,0).slice(0,2)) ? "text-[var(--c-neon)]" : "text-red-400"}`}>{msg}</p>}
        </div>

        {scanned && orphans.length > 0 && (
          <div className="note-modal-footer">
            <span className="note-hint">{t.imageCleanupSelected(selectedCount, orphans.length)}</span>
            <button type="button" className="note-delete-btn" onClick={handleDelete} disabled={deleting || selectedCount === 0}>
              {deleting ? <><Loader size={13} className="note-spin" /> {t.imageCleanupDeleting}</> : <><Trash2 size={13} /> {t.imageCleanupDeleteSelected(selectedCount)}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
