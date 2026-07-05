# 前端架構說明

本專案前端使用 **Vue 3（Composition API）+ Vite + Pinia + axios**，採**功能模組（feature-module）架構**：每個功能放在 `src/modules/{feature}/`，跨模組共用的平台程式放在 `src/shared/`。

> 架構目標：每個東西都有明確的家。頁面只負責「流程編排（orchestration）」，可重用狀態邏輯放 composable、純資料轉換放 util、畫面放 component、API 交換放 api、樣式放 scss。**避免再出現上千行的單一頁面檔。**

## 目錄總覽

```text
src/
├─ app/                 # 啟動：main.js、App.vue、pinia.js
├─ router/index.js      # 組裝各模組 routes + 全域登入守衛（含 legacy #/ 與 /activity 導頁）
├─ layouts/             # DefaultLayout.vue（頁首/登出/包住 router-view）
├─ styles/              # 全域 SCSS：variables.scss(tokens)、reset.scss、index.scss
├─ shared/              # 平台層（不依賴 modules/）
│  ├─ api/              # httpClient.js(axios)、apiResponse.js
│  ├─ components/       # 全站共用 UI（AppButton、FormField、PageShell、CustomSelect、ProductTable…）
│  ├─ composables/      # useTableSort、useTablePagination、useNoteDialog、useDialogScrollLock、
│  │                    #   useConfirmDialog、useImageUpload、useMultiImageUpload
│  ├─ stores/           # uiStore(Pinia,loading)、authStore(Pinia)、authSession.js(token helper)
│  ├─ utils/            # format、html、tableSort、validation、formData、download、clipboard、queryString
│  └─ constants/        # routes.js（ROUTE_NAMES）
└─ modules/             # 功能模組
   ├─ dashboard/  auth/  activity/  activityProduct/
   └─ animateType/  inventory/  order/  report/
```

每個模組內部結構（依需要）：

```text
modules/{feature}/
├─ pages/        # 路由頁面（薄 orchestration）：XxxPage.vue
├─ components/   # 該功能的展示元件（表單 Dialog 等）
├─ composables/  # 該功能的可重用狀態邏輯（useXxx.js）
├─ utils/        # 該功能的純函式（mapper / 欄位定義 / payload builder…）
├─ api/          # 該功能的 API（xxxApi.js，呼叫 httpClient）
├─ styles/       # 該功能頁面的 scss（由頁面以 <style src> 外掛）
└─ routes.js     # 該功能的路由（使用 ROUTE_NAMES）
```

## 平台層（shared/）規範

### `shared/api`
- `httpClient.js`：唯一的 axios 實例。**攔截器自動帶 `Authorization: Bearer <token>`**、處理 401（清 token + 導回登入）、全域 loading 計數、120s 逾時轉 408。後端 envelope `{ status, data, message }` 由 `apiResponse.unwrapApiResponse()` 解開（**沿用「數字版」成功判斷 `Number(status)<400`**）；攔截器回傳 envelope，呼叫端取 `response?.data`。
- 二進位下載（PDF 等）走 `apiBlob(path, { accept, expectContentType, fallbackFileName })` → `{ blob, fileName }`，搭配 `shared/utils/download.triggerBlobDownload`。
- **api 模組不要自己帶 auth header**（攔截器負責）。登入等不需 token 的請求可帶 `{ skipAuthHandling: true }`。

### `shared/stores`（Pinia）
- `uiStore`：全域 loading 遮罩（reference counter + 顯示延遲/最短顯示防抖）。由 httpClient 攔截器驅動。
- `authStore`：反應式登入狀態（`isAuthenticated`/`displayName`/`signIn`/`signOut`），底層用 `authSession.js`。
- `authSession.js`：localStorage token 純函式（`getAdminToken`/`setAdminToken`/`clearAdminToken`/`isAdminAuthenticated`/…）。httpClient 與 router 守衛直接用它（不進 Pinia context）。

### 樣式
- 全域 reset / tokens 放 `src/styles/`（scss）。元件色彩/間距盡量用 `variables.scss` 的 token。
- 頁面樣式外掛到模組 `styles/*.scss`，頁面以 `<style scoped lang="scss" src="../styles/xxx.scss">` 引入（保持 scoped、同時讓 SFC 變薄）。葉子元件可用內嵌 `<style scoped lang="scss">`。

## 路由
- route name 集中在 `shared/constants/routes.js` 的 `ROUTE_NAMES`；各模組 `routes.js` 只引用、不硬寫字串。
- `router/index.js` 把各模組 `routes` 以 `...xxxRoutes` 組進 `DefaultLayout` children（登入頁為頂層）。**頁面採 lazy load**（`() => import(...)`）。
- 新增頁面流程：補 `ROUTE_NAMES` → 在模組 `routes.js` 加 route → 在 `router/index.js` spread 進來。

## 資料流（一般頁面）

```text
XxxPage.vue (orchestration)
  -> useXxx() composable（狀態/互動）
       -> xxxApi.js -> httpClient -> backend
       -> utils（純轉換）
  -> 子元件（props in / emit out）
```

## 測試
- 純函式 / 業務規則用 Node 內建 `node:test`（`*.test.js` colocate）。執行：
  `node --import ./tools/test-alias.register.mjs --test`（loader 讓 `@/` alias 在測試中可解析）。
- 優先測：mapper、filters、欄位定義、payload builder、狀態表、`shippableOrders` 之類聚合邏輯、shared utils。

## 跨模組相依
- `shared/` **不可** import `modules/`。
- 模組之間原則上不互相 import；但本專案領域天然巢狀（活動 ⊃ 商品 ⊃ 訂單 ⊃ 庫存、報表跨多域），少數**領域相依**是允許的，例如 `inventory` 取用 `order`/`activityProduct` 的 api、`report` 取用 `activity` 的 mapper。新增此類相依前先想清楚方向，避免循環。

## 新增功能放哪裡
- 新 API：在該模組 `api/xxxApi.js` 加函式（呼叫 httpClient），endpoint 字串只出現在 api 檔。
- 新頁面：模組 `pages/` 加 `XxxPage.vue`（薄）；複雜 UI 拆到模組 `components/`。
- 可重用互動：模組 `composables/`（若跨模組共用 → `shared/composables/`）。
- 純資料轉換：模組 `utils/`（若跨模組共用 → `shared/utils/`）。
- 指向 WebClient 的公開頁連結若只屬於單一功能，放在該功能 `utils/`（例如活動的 `activityFormUrl.js`），避免回到頁面內硬寫路徑。

## 命名慣例
- 頁面：`XxxPage.vue`（PascalCase）。元件：PascalCase。
- Composable：`useXxx.js`。API 模組：`xxxApi.js`。Util：以用途命名。
- route name：`ROUTE_NAMES.XXX`。

## 既有模組
`dashboard`（功能入口）、`auth`（登入）、`activity`（活動）、`activityProduct`（活動商品）、`animateType`（作品/動漫種類）、`inventory`（庫存）、`order`（訂單）、`report`（報表分析）。
