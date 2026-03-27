/**
 * GitHub API 工具：将笔记写入仓库的 notes.ts 文件
 * 需要环境变量 NEXT_PUBLIC_GITHUB_TOKEN
 */

const REPO = "kindred-react/aishow";
const FILE_PATH = "src/data/notes.ts";
const BRANCH = "main";

export async function saveNotesToGitHub(notes: Record<string, string>): Promise<{ ok: boolean; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) {
    return { ok: false, message: "未配置 GitHub Token，笔记仅保存在本地" };
  }

  const content = generateNotesFileContent(notes);
  const encoded = btoa(unescape(encodeURIComponent(content)));

  try {
    // 1. 获取当前文件的 SHA（更新文件时需要）
    const getRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    let sha: string | undefined;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // 2. 写入文件
    const putRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `chore: update user notes [${new Date().toLocaleString("zh-CN")}]`,
          content: encoded,
          sha,
          branch: BRANCH,
        }),
      }
    );

    if (putRes.ok) {
      return { ok: true, message: "笔记已保存到 GitHub，约1-2分钟后部署生效" };
    } else {
      const err = await putRes.json();
      return { ok: false, message: `GitHub API 错误: ${err.message}` };
    }
  } catch (e) {
    return { ok: false, message: `网络错误: ${String(e)}` };
  }
}

export function generateNotesFileContent(notes: Record<string, string>): string {
  const entries = Object.entries(notes)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`)
    .join(",\n");

  return `// 用户笔记数据文件\n// 此文件由网页编辑器自动更新，请勿手动修改格式\nexport const userNotes: Record<string, string> = {\n${entries ? entries + "\n" : ""}};\n`;
}
