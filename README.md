# Midearth Travel

可开发的 Next.js 旅游网站项目，基于 [midearth.web.app](https://midearth.web.app/) 重建。

## 技术栈

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- lucide-react

## 项目结构

```
src/
├── app/
│   ├── page.tsx              # 首页
│   ├── layout.tsx
│   └── tours/[slug]/page.tsx # 各 tour 详情页
├── components/               # UI 组件（可读可改）
├── data/tours.ts             # 所有 tour 数据（改内容在这里）
public/                       # 图片资源
```

## 开发

```bash
cd midearth-travel
npm install
npm run dev
```

打开 http://localhost:3000

## Stripe 支付配置

支付使用 Stripe Checkout，信用卡信息始终由 Stripe 托管。先在 Stripe Dashboard 开启 Test mode 并创建 API key，然后复制环境变量：

```bash
cp .env.example .env.local
```

填写 `STRIPE_SECRET_KEY`、`STRIPE_WEBHOOK_SECRET`、`NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`，并执行 `supabase db push` 应用 `202608190001_stripe_payments.sql`。`STRIPE_SECRET_KEY` 和 `STRIPE_WEBHOOK_SECRET` 只能放在服务端环境变量中，不能使用 `NEXT_PUBLIC_` 前缀。

在 Stripe Dashboard 的 Developers → Webhooks 中添加生产地址 `https://你的域名/api/webhooks/stripe`，订阅：

- `checkout.session.completed`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

本地可以使用 Stripe CLI 转发：

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

将 CLI 输出的 `whsec_...` 写入 `.env.local` 后重启开发服务器。支付成功回跳只表示 Stripe Checkout 已完成，订单最终状态以签名 Webhook 写入 Supabase 为准。

## Bilingual Site and Admin Operations

Copy `.env.example` to `.env.local` for local development, and configure the same server-only values in the deployment environment. The initial administrator account requires all of the following values; do not commit real credentials or expose any of them with a `NEXT_PUBLIC_` prefix:

- `ADMIN_INITIAL_EMAIL`: the initial administrator's real email address.
- `ADMIN_INITIAL_PASSWORD`: a non-placeholder password of at least 12 characters.
- `ADMIN_SESSION_SECRET`: a non-placeholder, random secret of at least 32 characters used to sign the HttpOnly admin session cookie.

The CMS is intentionally unlisted from public navigation. Administrators open `/admin` directly; visitors without a valid session are redirected to `/admin/login`, and anonymous `/api/admin/**` requests receive `401 Unauthorized`. The configured initial account remains the bootstrap owner; change its password through deployment configuration and redeploy when access must be rotated.

Apply `supabase/migrations/202609220003_admin_invitations.sql` with `supabase db push` before using administrator invitations. `SUPABASE_SERVICE_ROLE_KEY` is required server-side for this feature. In the CMS header, open the account avatar and choose **Invite administrator** to create a copyable registration link. Send that link manually: it is valid for seven days and can be used once. There is no public registration link.

Login throttling treats requests as `direct` unless `ADMIN_TRUST_PROXY_HEADERS` is set to the exact, lowercase value `true`. Set it only when a trusted reverse proxy overwrites `X-Forwarded-For`; then only the first comma-separated forwarded address is used when it is non-blank, otherwise the source remains `direct`. Any other value, including `TRUE`, leaves forwarded headers untrusted.

The language selector persists the visitor's choice in browser storage across navigation. CMS and tour copy uses the selected Chinese value only when it is non-blank; otherwise it uses the English fallback. Do not add machine-generated Chinese copy for client-owned content.

The Footer Tours column is derived from the configured destination categories, in this order: North America (`/routes/north-america`), Asia (`/routes/asia`), Europe (`/routes/europe`), Sun Destinations (`/routes/sun-destinations`), Bus Tours (`/tours/category/bus-tours`), and Vacation Packages (`/tours/category/vacation-packages`). Invalid or empty internal links are omitted rather than rendered as a link to a missing page.

## 修改内容

- **Tour 列表/详情**：编辑 `src/data/tours.ts`
- **首页区块**：`src/components/` 下各组件
- **样式主题**：`src/app/globals.css` 中的 CSS 变量

## 与原版区别

- 每个 tour 有独立 slug 和详情页（不再全部指向同一页）
- 已移除 "Demo page" 提示
- 除 Maritime Provinces 外，其他 tour 行程为占位，可在 `tours.ts` 补充
