# Midearth Travel

可开发的 Next.js 旅游网站项目，基于 [midearth.web.app](https://midearth.web.app/) 重建。

## 技术栈

- Next.js 15 (App Router)
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

## 修改内容

- **Tour 列表/详情**：编辑 `src/data/tours.ts`
- **首页区块**：`src/components/` 下各组件
- **样式主题**：`src/app/globals.css` 中的 CSS 变量

## 与原版区别

- 每个 tour 有独立 slug 和详情页（不再全部指向同一页）
- 已移除 "Demo page" 提示
- 除 Maritime Provinces 外，其他 tour 行程为占位，可在 `tours.ts` 补充
