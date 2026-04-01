"use client";

import { AtlasRouteSwitch } from "@/components/AtlasRouteSwitch";
import { ToolsRecommendationBoard } from "@/components/ToolsRecommendationBoard";

export function ToolsPageView() {
  return (
    <main className="page-shell mounted">
      <div className="ambient" aria-hidden />
      <AtlasRouteSwitch title="产品研发工具推荐矩阵" />
      <section className="content-shell">
        <div className="content-body">
          <div className="content-scroll" style={{ padding: "0.2rem 0.1rem 0.4rem" }}>
            <ToolsRecommendationBoard />
          </div>
        </div>
      </section>
    </main>
  );
}
