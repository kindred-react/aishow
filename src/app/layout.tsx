import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Show - 大模型知识图谱",
  description: "用更形象的方式记录与学习大模型知识点和操作流程",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
