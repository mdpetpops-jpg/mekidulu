# Mekidulu 独立站 · 运营与维护手册

> 最后更新：2026-10-20
> 适用对象：日常维护这个站点的人（不需要懂 Next.js）
> 一句话：**网站代码在 GitHub，线上跑在 Vercel，数据存在 Supabase，发信走 Brevo，AI 对话走 DeepSeek。**

---

## 0. 一分钟速查

| 我要做什么 | 去哪里 |
|---|---|
| 看网站 | https://www.mekidulu.com |
| 看谁留了资料（线索） | Supabase → Table Editor → `leads` |
| 改首页文案 / 标题 | GitHub → `app/page.tsx` |
| 改产品、价格、规格 | GitHub → `lib/site.ts` |
| 发一篇新文章 | GitHub → `content/journal/`（新建 `.md`） |
| 换/加说明书 PDF | GitHub → `public/manuals/` |
| 更新产品画册 PDF | 运行 `scripts/build-catalogue.py` |
| 改 AI 客服说话方式 | GitHub → `lib/chat/prompt.ts` |
| 改自动回复 / 开发信内容 | GitHub → `lib/outreach/copy.ts` |
| 看部署是否成功 | Vercel → 项目 `mekidulu` → Deployments |
| 换密钥 | Vercel → Settings → Environment Variables |
| 看发信记录 / 退信 | Brevo → Transactional → Logs |

---

## 1. 系统全貌

```
访客
 │
 ├── https://mekidulu.com ──308──▶ https://www.mekidulu.com   （Vercel 托管）
 │        │
 │        ├── /            首页（Hero / 工程 / 产品线卡 / 批发 / 品牌故事）
 │        ├── /shop        16 个单品，每个带 Amazon / Walmart 直链
 │        ├── /blog        5 篇旧文章（Markdown 渲染）
 │        ├── /manuals     12 份装配说明书 PDF
 │        ├── /catalog     2026 产品画册（19 页 PDF）
 │        ├── /wholesale   留资表单（B2B 主入口）
 │        └── /unsubscribe 退订页
 │
 ├── 留资表单 → /api/leads → 写 Supabase `leads` 表
 │                          └─ 异步：DeepSeek 写感谢信 → Brevo 发邮件
 │
 ├── 右下角 AI 客服 → /api/chat → DeepSeek（带产品/说明书知识）
 │
 └── 每天 09:00（美东）→ /api/cron/outreach
                          └─ 读 `prospects` 表 pending → DeepSeek 写开发信
                             → Brevo 发信 → 状态改 sent
```

### 各服务分别负责什么

| 服务 | 用途 | 账号入口 |
|---|---|---|
| **Vercel** | 托管网站、跑 API、跑定时任务 | https://vercel.com |
| **Supabase** | 存留资线索、开发信名单 | https://supabase.com/dashboard |
| **GitHub** | 存代码（`mdpetpops-jpg/mekidulu`） | https://github.com |
| **Brevo** | 发邮件（SMTP 中继） | https://app.brevo.com |
| **DeepSeek** | AI 客服 + 邮件文案生成 | https://platform.deepseek.com |
| **Upstash QStash**（可选，未启用） | 开发信 3–8 分钟间隔排队 | https://console.upstash.com |

---

## 2. 关键身份信息（存好）

| 项目 | 值 |
|---|---|
| 正式域名 | `www.mekidulu.com`（`mekidulu.com` 自动 308 跳过来） |
| Vercel 项目名 | `mekidulu` |
| Vercel 项目 ID | `prj_1XsVFktF8cv25zrDH7Ca6g3csiKc` |
| Vercel 团队 ID | `team_k3SEntloHTwnjG4dWcjb2WLn` |
| Supabase 项目 | `kmqzkvpwsuutfrizvsiv.supabase.co`（US West / Oregon） |
| GitHub 仓库 | `mdpetpops-jpg/mekidulu`，主分支 `main` |
| Brevo SMTP | 服务器 `smtp-relay.brevo.com`，端口 `587`，Login `bf204c001@smtp-brevo.com` |
| 发件人 | `Mekidulu <sales@mekidulu.com>`（必须在 Brevo 里已验证） |
| 定时任务 | `/api/cron/outreach`，`0 13 * * *`（UTC） |

> ⚠️ 密钥本身**不要写在这个文件里**。它们只存在两个地方：Vercel 环境变量、以及你的密码管理器。

---

## 3. 环境变量（Vercel → Settings → Environment Variables）

| 变量名 | 作用 | 注意 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目地址 | 换了项目必须同步换**所有** Supabase 变量，并**重新部署** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 公开 key（前端用） | `sb_publishable_…` |
| `SUPABASE_SERVICE_ROLE_KEY1` | 服务端写库密钥 | **名字结尾有 `1`**，代码里就用的这个；`sb_secret_…` |
| `SUPABASE_SERVICE_ROLE_KEY` | 重复项 | 代码没用到，可删，避免混淆 |
| `DEEPSEEK_API_KEY` | AI 客服 + 文案 | `sk-…` |
| `BREVO_SMTP_KEY` | 发信密钥 | `xsmtpsib-…`（SMTP key，不是 API key） |
| `BREVO_SMTP_USER` | SMTP 登录名 | `bf204c001@smtp-brevo.com` |
| `BREVO_API_KEY` | （当前无用） | 现在存的是 SMTP key，代码会自动忽略；换成 `xkeysib-…` 才会走 API 通道 |
| `CRON_SECRET` | 保护定时任务接口 | 随机 48 位；手动触发任务时要带 |
| `NEXT_PUBLIC_SITE_URL` | 站点规范地址（未设置） | 建议设为 `https://www.mekidulu.com`，影响 canonical / OG / 退订链接 |

**改完环境变量必须重新部署才生效**（`NEXT_PUBLIC_*` 是构建时写死的）。

---

## 4. 代码结构：改什么去哪里

```
app/
  page.tsx                  首页全部内容（Hero、工程参数、产品线卡、批发、品牌故事）
  layout.tsx                全站框架：字体、SEO、导航、页脚、AI 客服挂载
  globals.css               品牌色、字体、文章排版样式
  shop/page.tsx             商品墙（数据来自 lib/site.ts）
  blog/page.tsx             文章列表
  blog/[slug]/page.tsx      文章详情（Markdown 渲染）
  manuals/page.tsx          说明书列表页
  catalog/page.tsx          画册页（下载按钮）
  wholesale/page.tsx        批发留资页
  unsubscribe/page.tsx      退订页
  api/leads/route.ts        留资接口（写库 + 触发自动回复）
  api/chat/route.ts         AI 客服接口（DeepSeek）
  api/cron/outreach/route.ts  每日开发信主入口
  api/outreach/worker/route.ts 单封发送（QStash 队列目标）
  api/unsubscribe/route.ts  退订接口

components/
  site-header.tsx           顶部导航
  site-footer.tsx           页脚
  wholesale-form.tsx        留资表单交互
  support-chat.tsx          右下角 AI 客服面板
  unsubscribe-form.tsx      退订表单
  icons.tsx                 图标

lib/
  site.ts                   ★ 品牌信息、产品、价格、渠道链接（改内容最常来这里）
  journal.ts                读取 content/journal/*.md
  manuals/index.ts          说明书目录 + 8782 装配指南
  brevo.ts                  发邮件（SMTP / API 双通道）
  deepseek.ts               DeepSeek 调用封装
  outreach/copy.ts          ★ 自动回复与开发信的提示词
  outreach/sender.ts        发送流程 + 状态回写
  outreach/qstash.ts        队列（可选）
  leads/schema.ts           表单校验规则
  rate-limit.ts             限流（10 分钟 5 次留资 / 20 次对话）
  supabase/admin.ts         服务端数据库客户端（只在服务端用）

content/
  journal/*.md              ★ 博客文章（frontmatter + 正文）
  manuals/qj8782.json       8782 装配步骤（草稿，未审核）

public/
  images/                   图片（已压缩成 webp）
  images/amazon/            13 个亚马逊 SKU 的商品图
  manuals/*.pdf             12 份装配说明书
  catalog/*.pdf             产品画册 + 封面预览图

supabase/migrations/
  0001_create_leads.sql     留资表建表脚本
  0002_create_prospects.sql 开发信名单建表脚本（**还没执行**）

scripts/
  deploy-vercel.mjs         直接部署到 Vercel（不用 git）
  push-to-github.mjs        直接推 GitHub（不用 git）
  build-catalogue.py        重新生成画册 PDF
  test-outreach.mjs         发一封测试开发信
  smoke.mjs                 全站自检（50 项）
```

---

## 5. 日常操作怎么做

### 5.1 改首页文字

1. GitHub 打开 `app/page.tsx`
2. 点右上角铅笔图标编辑
3. 改文字 → 底部 **Commit changes**（提交到 `main`）
4. 若 Vercel 已连 Git：等 2–3 分钟自动上线；**目前还没连**，见第 7 节

### 5.2 改产品 / 价格 / 加型号

编辑 `lib/site.ts`：

- `products` —— 线卡三个型号（名称、高度、层数、MSRP、Walmart 链接）
- `amazonListings` —— 13 个亚马逊在售款（ASIN、标题、图片路径、在哪些站点）
- `marketplaces` —— 渠道链接（Amazon US/UK/JP/DE/FR、Walmart、Cdiscount）

加一个亚马逊型号：往 `amazonListings` 里加一条，图片放到 `public/images/amazon/`。
价格会显示成 "Marketplace price"（因为各国售价不同），要显示具体数字就改 `ShopProduct.price`。

### 5.3 发一篇新文章

1. 在 `content/journal/` 新建 `你的英文-slug.md`
2. 文件开头必须是：

```markdown
---
slug: my-article
title: "文章标题"
date: "2026-11-01"
category: "Maintenance Guide"
cover: "/images/journal-carpet.webp"
summary: "一句话摘要，会显示在列表页。"
---

正文用 Markdown 写，## 二级标题、**加粗**、- 列表、![图片](/images/xxx.webp)
```

3. 提交 → 列表页和 `/blog/my-article` 自动出现（无需改代码）

### 5.4 换 / 加说明书

- 文件丢进 `public/manuals/`，命名如 `T05.pdf`
- 在 `lib/manuals/index.ts` 的 `manualFiles` 里加一行 `{ id: "T05", model: "T05", hasTextLayer: false }`
- 如果这个说明书对应某个在售型号，加上 `productId: "meki-xxx"`

### 5.5 重新生成产品画册

画册是用代码从站点数据生成的（19 页 A4）。改了产品后想更新画册：

```bash
python scripts/build-catalogue.py
```

输出：`public/catalog/mekidulu-catalogue-2026.pdf`（以及封面预览图）。提交后 `/catalog` 上的下载按钮自动指向新文件。

> 如果你有设计好的原版画册 PDF，直接替换这个文件即可，不用跑脚本。

### 5.6 看 / 导出客户线索

1. Supabase → **Table Editor** → `leads`
2. 字段含义：
   - `business_email` 邮箱（已自动转小写）
   - `company_name` 公司名
   - `estimated_volume` 体量（5-50 / 50-200 / 200+）
   - `notes` 客户留言
   - `status` 状态（new / contacted / qualified / won / lost）——**跟进后手动改**
   - `page_path` 客户从哪个页面提交的
   - `created_at` 提交时间
3. 导出：Table Editor 右上角 **Export** → CSV

### 5.7 加开发信名单

1. Supabase → Table Editor → `prospects`（**建表 SQL 见 `supabase/migrations/0002_create_prospects.sql`，需先执行**）
2. 逐条插入：`email`（必填）、`store_name`、`website`，`status` 保持 `pending`
3. 系统每天上午 9 点（美东）自动取 pending 发送，发完变 `sent`，失败变 `failed` 并在 `last_error` 写原因

### 5.8 手动触发一次开发信（测试用）

在电脑上执行（需要 `CRON_SECRET`，在 Vercel 环境变量里）：

```bash
CRON_SECRET=你的密钥 node scripts/test-outreach.mjs 收件邮箱
```

不填收件邮箱默认发给 `wuhp@live.com`。这个接口**只发一封**，不读数据库。

### 5.9 看 AI 客服说了什么

系统**不保存**对话（隐私考虑）。想评估回答质量，只能自己上网站点右下角试。
想改说话方式：`lib/chat/prompt.ts`（人设、语言规则、能说什么不能说什么）。

---

## 6. 数据库

### 6.1 `leads`（已建好，正在用）

留资线索。**开启了 RLS 且没有任何策略** —— 意味着只有服务端（service_role key）能读写，浏览器无论如何拿不到数据。这是故意的。

### 6.2 `prospects`（已建好，2026-10-20）

开发信名单。已通过 Supabase Management API 建表并实测发送成功（1 条测试记录 → `sent` → 已删除）。

字段：`id / email / store_name / website / status / created_at / sent_at / last_error`
状态：`pending`（待发）→ `sent`（已发）/ `failed`（失败）/ `unsubscribed`（已退订）

如果以后要重建（比如换了 Supabase 项目），执行 `supabase/migrations/0002_create_prospects.sql`，
最后一句 `notify pgrst, 'reload schema';` 不能省。

**手动触发一次发送**（不等定时任务）：

```bash
CRON_SECRET=xxx node -e "fetch('https://www.mekidulu.com/api/cron/outreach?force=1',{method:'POST',headers:{'x-cron-secret':process.env.CRON_SECRET}}).then(r=>r.text()).then(console.log)"
```

返回 `{"ok":true,"mode":"inline","sent":1,...}` 即成功；`?force=1` 用于绕过"只在纽约时间 8/9 点发送"的闸门。

### 6.3 改表结构

不要直接在 Table Editor 点改，容易和代码不一致。正确做法：写一个新的 SQL 文件放 `supabase/migrations/0003_xxx.sql`，执行，并同步改代码里的字段名。

---

## 7. 发布上线：目前有两条路

### 路线 A：直接部署（现在实际在用）

不需要 git，直接打包上传到 Vercel：

```bash
VERCEL_TOKEN=你的Vercel令牌 node scripts/deploy-vercel.mjs
```

约 3–4 分钟，输出 `READY → https://...` 即成功。
**目前的线上版本都是这样发出去的。**

### 路线 B：GitHub 推送（**已启用**）

代码在 GitHub（`mdpetpops-jpg/mekidulu`），Vercel 项目**已于 2026-10-20 连接该仓库**，
生产分支为仓库默认分支 `main`。

之后每次在 GitHub 上改完东西（网页改、或 `git push`），Vercel 自动构建上线，约 2–3 分钟。
不需要再手动部署。

> 没有 git 也可以推：`GITHUB_TOKEN=你的令牌 node scripts/push-to-github.mjs`
> 推完到 Vercel → Deployments 能看到一次来源标记为 GitHub 的部署。

### 路线 A：直接部署（备用，仍可用）

不需要 git，直接打包上传到 Vercel：

```bash
VERCEL_TOKEN=你的Vercel令牌 node scripts/deploy-vercel.mjs
```

约 3–4 分钟，输出 `READY → https://...` 即成功。
Git 连接建立之前，线上版本都是这样发出去的；现在仅作为紧急备用手段。

### 部署完必做：自检

```bash
BASE_URL=https://www.mekidulu.com node scripts/smoke.mjs
```

应该看到 **50/50 checks passed**。任何 FAIL 都会打印原因。

---

## 8. 排障手册（照着查）

| 现象 | 原因 | 怎么办 |
|---|---|---|
| 留资表单提示 "We could not save your inquiry" | 数据库写入失败 | 看返回里的 `detail`：<br>`PGRST205` = 表不存在 → 跑建表 SQL<br>`Invalid API key` = 密钥和 URL 不是同一个项目 |
| 表单返回 503 | 环境变量缺失 | 检查 4 个 Supabase 变量是否齐全，改完要**重新部署** |
| 表单返回 429 | 同一 IP 提交太频繁（10 分钟 5 次） | 正常限流，换网络或等 10 分钟 |
| AI 客服提示 "being set up" | `DEEPSEEK_API_KEY` 缺失 | 补变量 + 重新部署 |
| 发信 503 "Brevo credentials are not usable" | 缺 `BREVO_SMTP_USER`，或 key 类型不对 | 确认是 SMTP key（`xsmtpsib-`）+ Login 邮箱；或换 API key（`xkeysib-`） |
| 发信 401 "sender not verified" | 发件人没在 Brevo 验证 | Brevo → Senders → 验证 `sales@mekidulu.com` |
| 开发信接口 401 | `CRON_SECRET` 不对 | 从 Vercel 变量里取正确值 |
| 开发信接口 502 "Could not read the prospect queue" | `prospects` 表没建 | 执行 `0002` SQL |
| 定时任务没跑 | 计划限制 / 时间没到 | 看 Vercel → 项目 → Cron Jobs；注意是 **UTC** 13:00 |
| 网站白屏 / 500 | 构建失败或运行时错误 | Vercel → Deployments → 点最新一次 → Build Logs |
| 改了代码但线上没变 | 没部署 / 没连 Git | 走路线 A 手动部署，或先连接 Git |

---

## 9. 成本与配额（心里有数）

| 服务 | 免费额度 | 说明 |
|---|---|---|
| Vercel | Hobby：100 GB 流量/月 | 注意 Hobby 的 cron **只能一天一次**，正好够用 |
| Supabase | 免费 500 MB 数据库 | 线索是纯文本，几年都用不完；**长期不活跃会被暂停**（这次就是换了新项目） |
| DeepSeek | 按量付费，极便宜 | 一条客服回复约几分钱 |
| Brevo | 免费 300 封/天 | 冷邮件必须控制量，超了直接拒发 |
| QStash | 免费 500 次/天 | 启用后用于 3–8 分钟间隔排队 |

---

## 10. 安全与密钥轮换

**已经暴露在聊天记录里、建议轮换的：**

1. `DEEPSEEK_API_KEY`
2. `SUPABASE_SERVICE_ROLE_KEY1` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `BREVO_SMTP_KEY`
4. GitHub token（推送已用完，直接吊销）
5. Vercel token（部署用，用完吊销）

**轮换步骤**（以 DeepSeek 为例）：
1. 到对应平台生成新 key，删掉旧的
2. Vercel → Settings → Environment Variables → 找到变量 → Edit → 粘贴新值
3. **重新部署**（路线 A 或 B）
4. 跑一次 `smoke.mjs` 确认

> 数据库密钥（service_role）尤其重要：它绕过所有权限控制，泄露等于数据库被拿走。

---

## 11. 今天做完的事（时间线）

| 阶段 | 内容 | 结果 |
|---|---|---|
| 1 | 盘点旧站（GitHub Pages 静态 HTML） | 发现没有 Next.js 代码、没有画册 PDF、文章是 `blog.html?id=` 形式 |
| 2 | 从零搭 Next.js 16 + Tailwind v4 + Supabase | 首页、配色、字体、组件体系 |
| 3 | 迁移素材 | 图片 55 MB → 1.4 MB；12 份说明书入库 |
| 4 | 任务 1 首页 | Hero、工程参数、产品线卡、批发、品牌故事 |
| 5 | 任务 2 留资 | `/wholesale` + `/api/leads` + `leads` 表 |
| 6 | 任务 3 博客 | `/blog`、5 篇文章、301 重定向（含 `/journal/*` 兜底） |
| 7 | 任务 4 商城 | `/shop` 16 个单品、Amazon 13 个 ASIN、Walmart、Cdiscount |
| 8 | 任务 5 AI 客服 | 右下角客服、DeepSeek、多语言、说明书接地 |
| 9 | 补充 | `/manuals` 说明书页、`/catalog` 画册（19 页 PDF）、`/unsubscribe` 退订 |
| 10 | 开发信系统 | 每日 cron、自动回复、SMTP 发信、限流分片、QStash 兼容 |
| 11 | 上线 | Vercel 生产部署、域名生效、`smoke` 50/50 |
| 12 | 代码入库 | GitHub `main`，commit `2bc8ef12`，105 个文件 |

---

## 12. 还没做完的事（待办）

| # | 事项 | 谁来做 | 说明 |
|---|---|---|---|
| 1 | ~~建 `prospects` 表~~ | ✅ 已完成 | 2026-10-20 建表并实测发送成功 |
| 2 | ~~Vercel 连接 GitHub~~ | ✅ 已完成 | push 即自动部署，已验证 |
| 3 | 轮换所有暴露的密钥 | 你 | 见第 10 节 |
| 4 | `MEKI-Y18` 缺说明书 | 你 | 旧站就没有这份文件 |
| 5 | 4 份损坏的 PDF | 你 | `8782 / YN105 / B12 / T04`，建议从原始设计文件重导出 |
| 6 | 确认 8782 装配步骤 | 你 | `content/manuals/qj8782.json` 里标了 `reviewed: false`，确认后改成 `true`，AI 才敢逐步讲解 |
| 7 | 美国站 listing 标题 | 你 | 现在开头是 `Yinanroa Mekidulu…`，建议改成 `Mekidulu` 开头 |
| 8 | Cdiscount 单品链接 | 你 | 现在只有品牌搜索页，单品链接转化更好 |
| 9 | 启用 QStash（可选） | 可选 | 加 `QSTASH_TOKEN` 后自动切成 3–8 分钟间隔；不加则每次 2 封、间隔 12 秒 |

---

## 13. 出事了怎么办（紧急预案）

**网站打不开**
1. 打开 https://vercel.com → 项目 `mekidulu` → Deployments
2. 看最新一次是不是红色（Failed）
3. 如果是，点 **⋯ → Promote to Production** 选上一个正常的版本回滚（30 秒恢复）

**数据库写不进去**
1. Supabase 项目是否被暂停（免费版长期不活跃会暂停）
2. `leads` 表是否还在
3. Vercel 变量里的 URL 和 key 是否属于同一个项目

**发信被封 / 退信率高**
1. 立刻停开发信：Vercel → 项目 → **Cron Jobs** → 暂停 `/api/cron/outreach`
2. Brevo → Transactional → Logs 看退信原因
3. 降低每日数量（环境变量 `OUTREACH_BATCH_SIZE` 改成 1）

**密钥泄露**
1. 立刻在对应平台吊销
2. 生成新 key 写进 Vercel
3. 重新部署
