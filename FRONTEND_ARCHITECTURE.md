# 前端架構說明

本專案前端使用 Vue 3 + Vite。架構目標是讓頁面負責流程、API 負責資料交換、components 負責畫面、composables 負責可重用狀態邏輯、utils 負責純函式。

## 目錄總覽

```text
src/
  api/             # API endpoint 與 HTTP client
  components/      # 可重用 UI 與功能元件
  composables/     # 可重用狀態與互動邏輯
  layouts/         # 頁面外框
  router/          # 路由與登入導頁規則
  stores/          # 前端狀態/session helper
  utils/           # 純函式、mapper、排序、HTML 處理
  views/           # 路由頁面
```

## 分層規則

### `api/`

只放打 API 的程式。

- `http.js`：底層 fetch wrapper、base URL、錯誤處理。
- `adminAuth.js`：登入相關 API。
- `activities.js`：活動、活動類型、動漫、刪除/還原活動。
- `activityProducts.js`：活動商品列表、新增、更新。

規則：

- `/api/...` endpoint 字串只能出現在 `src/api`。
- `views` 和 `components` 不直接使用 `fetch`、`apiGet`、`apiPost`。
- 頁面只呼叫語意化函式，例如 `listActivitiesApi()`、`createActivityApi()`。

### `views/`

路由頁面，負責組合資料流與頁面流程。

頁面可以做：

- 呼叫 `api/` 取得或儲存資料。
- 管理頁面 loading、error、dialog open state。
- 把資料和 callback 傳給 components。

頁面不要做：

- 寫大量 UI template。
- 放可重用的互動邏輯。
- 直接寫 API endpoint。
- 放大型 mapper 或純資料轉換工具。

### `components/`

放畫面元件。元件自己的 CSS 寫在自己的 `.vue` 裡，使用 `<style scoped>`。

目前分類：

- `components/ui`：基礎 UI，例如 Button、Field、Message、IconButton。
- `components/layout`：頁面容器與 panel，例如 PageShell、PanelCard。
- `components/activities`：活動管理相關元件。
- `components/products`：商品管理相關元件。
- `components/dashboard`：Dashboard 模組卡片。
- `components/inventory`：庫存頁表格。

規則：

- 元件以 props 接資料，以 emit 回報事件。
- 元件不直接打 API。
- 元件不讀 route，不做 router push，除非它本身就是 route-aware 元件。
- 樣式放在元件內，不放共用 CSS 檔。

### `composables/`

放可重用的狀態與互動邏輯。

目前分類：

- `composables/activities/useActivityRangePicker.js`：活動日期區間選擇器邏輯。
- `composables/common/useImageUpload.js`：圖片上傳、預覽、清理 Object URL。

適合放在 composable 的內容：

- 多個頁面或元件可能共用的 state。
- 互動邏輯比 template 更複雜。
- 需要生命週期清理或事件協調。

### `utils/`

放純函式，不持有 Vue state。

目前分類：

- `utils/html.js`：HTML sanitize / strip。
- `utils/activities/activityMapper.js`：活動 API 資料轉換、日期格式轉換、狀態文字。
- `utils/activities/activityTableSort.js`：活動表格排序。

規則：

- utils 不 import Vue。
- utils 不打 API。
- utils 不操作 DOM，除非檔名和用途明確，例如 HTML sanitize。

### `layouts/`

放頁面外框，例如 `DefaultLayout.vue`。

Layout 可負責：

- header / main layout。
- 登出按鈕。
- 顯示登入者資訊。
- 包住 `router-view`。

### `stores/`

放 session 或跨頁狀態 helper。

目前 `authSession.js` 負責：

- 儲存 token。
- 讀取登入狀態。
- 取得顯示名稱。
- 清除登入資訊。

## 資料流

一般頁面資料流：

```text
view
  -> api module
    -> http.js
      -> backend

backend response
  -> api module
  -> view
  -> utils mapper
  -> components
```

例如活動管理：

```text
activity.vue
  -> listActivitiesApi()
  -> mapActivityFromApi()
  -> ActivityTable.vue
```

新增或編輯活動：

```text
ActivityFormDialog.vue
  -> emit submit
activity.vue
  -> build FormData
  -> createActivityApi() / updateActivityApi()
```

## CSS 規則

- 不使用 `src/style.css` 集中管理頁面樣式。
- 元件自己的 CSS 放在自己的 `.vue`。
- 全站 reset / body / root 等極少數全域設定放在 `App.vue`。
- 共用 UI 樣式應該抽成 component，而不是抽成大型 CSS class。

## 新增功能時放哪裡

新增一個 API：

1. 在 `src/api` 建立或更新對應 domain 檔案。
2. endpoint 字串寫在 api module。
3. view 呼叫 api module 的語意化函式。

新增一個頁面：

1. 在 `src/views` 建立 route page。
2. 在 `src/router/index.js` 加路由。
3. 若頁面有複雜 UI，拆到 `src/components/<domain>`。

新增一段可重用互動：

1. 如果需要 Vue state，放 `src/composables`。
2. 如果是純資料轉換，放 `src/utils`。

新增一個表單或表格：

1. 表單/表格 UI 放 `components/<domain>`。
2. 資料 loading / submit 流程留在 view。
3. API 呼叫留在 `api/`。

## 命名慣例

- Vue component：PascalCase，例如 `ActivityFormDialog.vue`。
- Composable：`useXxx.js`，例如 `useImageUpload.js`。
- API module：以 domain 命名，例如 `activities.js`。
- Utils：以用途命名，例如 `activityMapper.js`、`activityTableSort.js`。

## 目前活動管理頁拆分

```text
views/dashboard/activity.vue
  負責頁面狀態、API 流程、dialog 開關、資料組裝

components/activities/
  ActivityTable.vue
  ActivityFormDialog.vue
  ActivityImagePicker.vue
  DateRangePicker.vue
  RichNoteEditor.vue
  ActivityTrashDialog.vue
  ActivityNoteDialog.vue
  ActivityDeleteConfirmDialog.vue
  CustomSelect.vue

composables/activities/
  useActivityRangePicker.js

composables/common/
  useImageUpload.js

utils/activities/
  activityMapper.js
  activityTableSort.js
```
