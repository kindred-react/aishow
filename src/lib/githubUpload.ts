/**
 * GitHub Image Upload
 * 将图片上传到仓库 public/uploads/{folder}/ 目录
 * folder 默认为 "misc"，传入 moduleId 可按模块分类存放
 * 上传后通过 /uploads/{folder}/filename 直接访问
 */

import { GITHUB_REPO, GITHUB_BRANCH, UPLOAD_BASE_DIR } from "@/data/constants";


export async function uploadImageToGitHub(
  file: File,
  folder = "misc"
): Promise<{ ok: boolean; url: string; message: string }> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) return { ok: false, url: "", message: "未配置 GitHub Token" };

  // 生成唯一文件名
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6);
  const filename = `img-${timestamp}-${random}.${ext}`;
  // 按 folder 分类存放
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "-").toLowerCase() || "misc";
  const filePath = `${UPLOAD_BASE_DIR}/${safeFolder}/${filename}`;

  // 读取文件为 Base64
  const base64 = await fileToBase64(file);

  try {
    // 检查文件是否已存在（获取 SHA）
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
    );
    let sha: string | undefined;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // 上传文件
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `upload: add image ${filename}`,
          content: base64,
          sha,
          branch: GITHUB_BRANCH,
        }),
      }
    );

    if (putRes.ok) {
      // 返回 Vercel 部署后的访问路径
      const publicUrl = `/uploads/${safeFolder}/${filename}`;
      return { ok: true, url: publicUrl, message: "图片上传成功，部署后生效" };
    } else {
      const err = await putRes.json();
      return { ok: false, url: "", message: `上传失败: ${err.message}` };
    }
  } catch (e) {
    return { ok: false, url: "", message: `网络错误: ${String(e)}` };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 去掉 data:image/xxx;base64, 前缀
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
