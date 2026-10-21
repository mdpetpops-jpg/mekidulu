"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "仪表盘", hint: "总览" },
  { href: "/admin/leads", label: "线索池", hint: "留资" },
  { href: "/admin/sources", label: "邮箱获取", hint: "拓客" },
  { href: "/admin/outreach", label: "开发信追踪", hint: "外呼" },
  { href: "/admin/blog", label: "博客管理", hint: "内容" },
  { href: "/admin/traffic", label: "流量分析", hint: "来源" },
  { href: "/admin/ai", label: "AI 调度", hint: "提示词" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex h-full flex-col justify-between">
      <div>
        <Link href="/admin" className="block px-4 py-5">
          <span className="block text-[15px] font-extrabold tracking-[0.18em] text-canvas">MEKIDULU</span>
          <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.22em] text-canvas/40">
            Command center
          </span>
        </Link>

        <ul className="mt-2 space-y-0.5 px-2">
          {LINKS.map((link) => {
            const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
                    active
                      ? "bg-canvas/10 font-semibold text-canvas"
                      : "text-canvas/60 hover:bg-canvas/5 hover:text-canvas"
                  }`}
                >
                  {link.label}
                  <span className="text-[9px] uppercase tracking-[0.12em] text-canvas/30">{link.hint}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-1 px-4 pb-5">
        <a href="/" className="block text-[11px] text-canvas/50 hover:text-canvas">
          ← 返回网站
        </a>
        <button type="button" onClick={logout} className="block text-[11px] text-canvas/50 hover:text-canvas">
          退出登录
        </button>
      </div>
    </nav>
  );
}
