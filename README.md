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

## 修改内容

- **Tour 列表/详情**：编辑 `src/data/tours.ts`
- **首页区块**：`src/components/` 下各组件
- **样式主题**：`src/app/globals.css` 中的 CSS 变量

## 与原版区别

- 每个 tour 有独立 slug 和详情页（不再全部指向同一页）
- 已移除 "Demo page" 提示
- 除 Maritime Provinces 外，其他 tour 行程为占位，可在 `tours.ts` 补充
