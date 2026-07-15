import { existsSync, readFileSync } from "node:fs";

const failures = [];
const requiredFiles = [
  "src/app/admin/layout.tsx",
  "src/app/admin/page.tsx",
  "src/app/admin/admin.css",
  "src/components/admin-shell.tsx",
  "src/components/antd-app-provider.tsx",
  "src/components/rich-text-editor.tsx",
  "src/components/tour-editor.tsx",
  "src/data/cms-seed.ts",
  "src/lib/admin-state.ts",
  "src/theme/mid-earth-theme.ts",
  "src/types/cms.ts",
  "test/admin-state.test.ts",
];

for (const path of requiredFiles) {
  if (!existsSync(path)) failures.push(`missing ${path}`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const requiredDependencies = [
  "@ant-design/icons",
  "@ant-design/nextjs-registry",
  "@ant-design/pro-components",
  "@ant-design/v5-patch-for-react-19",
  "@tiptap/extension-link",
  "@tiptap/extension-underline",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "antd",
  "sanitize-html",
];

for (const dependency of requiredDependencies) {
  if (!packageJson.dependencies?.[dependency]) {
    failures.push(`missing dependency ${dependency}`);
  }
}

function readIfPresent(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const navbar = readIfPresent("src/components/navbar.tsx");
const adminLayout = readIfPresent("src/app/admin/layout.tsx");
const adminPage = readIfPresent("src/app/admin/page.tsx");
const adminCss = readIfPresent("src/app/admin/admin.css");
const mapper = readIfPresent("src/lib/travel-data-mapper.ts");

if (!navbar.includes('label: "Admin Portal"') || !navbar.includes('href: "/admin"')) {
  failures.push("navbar does not expose Admin Portal at /admin");
}
if (!navbar.includes('item.key === "admin"') || !navbar.includes('pathname.startsWith("/admin")')) {
  failures.push("navbar does not mark the admin route active");
}
if (!adminLayout.includes("<AntdAppProvider>") || !adminLayout.includes('className="cms-root"')) {
  failures.push("admin layout does not isolate the CMS provider and root");
}
if (!adminPage.includes("<AdminShell />")) {
  failures.push("admin page does not render AdminShell");
}
if (!adminCss.includes(".cms-root,") || /^\s*\*\s*\{/m.test(adminCss)) {
  failures.push("admin stylesheet does not scope its universal reset");
}
if (!mapper.includes('"../data/tours.ts"') || !mapper.includes('"../data/site.ts"')) {
  failures.push("CMS mapper does not use canonical public travel data");
}
if (mapper.includes("travel-site")) {
  failures.push("CMS mapper still uses a duplicated travel-site snapshot");
}

if (failures.length) {
  console.error("Admin integration verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Admin integration verification passed.");
