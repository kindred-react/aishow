import { execSync } from "child_process";

function getGitInfo() {
  try {
    const hash = execSync("git rev-parse --short HEAD", { cwd: __dirname }).toString().trim();
    const msg = execSync("git log -1 --pretty=%s", { cwd: __dirname }).toString().trim();
    const date = execSync("git log -1 --pretty=%ci", { cwd: __dirname }).toString().trim();
    return { hash, msg, date };
  } catch {
    return { hash: "unknown", msg: "unknown", date: new Date().toISOString() };
  }
}

const git = getGitInfo();

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GIT_HASH: git.hash,
    NEXT_PUBLIC_GIT_MSG: git.msg,
    NEXT_PUBLIC_BUILD_TIME: git.date,
  },
};

export default nextConfig;
