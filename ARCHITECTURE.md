# 前端架構說明

本專案前端使用 **Vue 3（Composition API）+ Vite + Pinia + axios**，採**功能模組（feature-module）架構**：每個功能放在 `src/modules/{feature}/`，跨模組共用的平台程式放在 `src/shared/`。

> 架構目標：每個東西都有明確的家。頁面只負責「流程編排（orchestration）」，可重用狀態邏輯放 composable、純資料轉換放 util、畫面放 component、API 交換放 api、樣式放 scss。**避免再出現上千行的單一頁面檔。**

## 狀態碼 / 開團（跨 repo）

活動/訂單的狀態碼**權威定義在後端**，前端只是鏡像；改任何狀態值務必同步後端與本 repo：

- 權威登記表：[`../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md`](../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md)
- 開團 / 運費 / 補運費怎麼運作：[`../ccAnimateJapan.AdminAPI/docs/GROUP_BUY.md`](../ccAnimateJapan.AdminAPI/docs/GROUP_BUY.md)
- 本 repo 的狀態鏡像檔：
  - `src/modules/activity/utils/activityMapper.js`（活動狀態 `ActivityEnum`、可讀狀態 `activityStatusDisplayOptions`、可寫狀態 `activityStatusOptions`、運費模式 `ShippingMode`、分攤規則 `ShippingShareRule`、開團狀態 `GroupBuyStatus` + 中文標籤）
  - `src/modules/order/utils/orderStatuses.js`（訂單 / 付款 / 物流 / 訂單商品 / 補運費付款 各狀態）
  - `src/modules/order/utils/activityOrderStatus.js`（可下單 / 唯讀活動狀態；目前只有 `Started (3)` 可新建訂單，legacy `Preparing (1)` / `PreparationEnded (2)` 僅可讀）
  - `src/modules/wishPool/utils/wishPoolDecisions.js`（許願池回覆 `Pending` / `Opened` / `NotOpened`，與活動 `groupBuyStatus` 分開）

## 目錄總覽

```text
src/
├─ app/                 # 啟動：main.js、App.vue、pinia.js
├─ router/index.js      # 組裝各模組 routes + 全域登入守衛（含 JWT 過期檢查、legacy #/ 與 /activity 導頁）
├─ layouts/             # DefaultLayout.vue（頁首/登出/包住 router-view；登入後掛載登入過期監聽）
├─ assets/              # 隨程式碼打包的靜態資源：logo/brand-logo.jpg（瀏覽器分頁 favicon，見下方「靜態資源」）
├─ styles/              # 全域 SCSS：variables.scss(tokens)、reset.scss、index.scss
├─ shared/              # 平台層（不依賴 modules/）
│  ├─ api/              # httpClient.js(axios)、apiResponse.js
│  ├─ components/       # 全站共用 UI（AppButton、FormField、PageShell、CustomSelect、ProductTable…）
│  ├─ composables/      # useTableSort、useTablePagination、useNoteDialog、useDialogScrollLock、
│  │                    #   useConfirmDialog、useImageUpload、useMultiImageUpload、useLeaveGuard、
│  │                    #   useSessionExpiryWatcher
│  ├─ stores/           # uiStore(Pinia,loading)、authStore(Pinia)、authSession.js(token helper，含 JWT 過期判斷)
│  ├─ utils/            # format、html、tableSort、validation、formData、download、clipboard、queryString、
│  │                    #   sessionWatcher
│  └─ constants/        # routes.js（ROUTE_NAMES）、imageTypes.js（上傳圖片允許的格式，各圖片選擇器共用）、productLimits.js（商品 / 庫存手動輸入數值的上限，鏡像後端 `ProductValueLimits`）
└─ modules/             # 功能模組
   ├─ dashboard/  auth/  activity/  activityProduct/
   └─ animateType/  inventory/  order/  report/  wishPool/  customer/
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
- `httpClient.js`：唯一的 axios 實例。**攔截器自動帶 `Authorization: Bearer <token>`**、處理 401（清 token、同步 `authStore`、導回登入，`handleUnauthorized` 含防重入；token 過期的偵測見下方「功能備註：登入過期」）、全域 loading 計數、120s 逾時轉 408。後端 envelope `{ status, data, message }` 由 `apiResponse.unwrapApiResponse()` 解開（**沿用「數字版」成功判斷 `Number(status)<400`**）；攔截器回傳 envelope，呼叫端取 `response?.data`。
- 二進位下載（PDF 等）走 `apiBlob(path, { accept, expectContentType, fallbackFileName })` → `{ blob, fileName }`，搭配 `shared/utils/download.triggerBlobDownload`。
- **api 模組不要自己帶 auth header**（攔截器負責）。登入等不需 token 的請求可帶 `{ skipAuthHandling: true }`。

### `shared/stores`（Pinia）
- `uiStore`：全域 loading 遮罩（reference counter + 顯示延遲/最短顯示防抖）。由 httpClient 攔截器驅動。
- `authStore`：反應式登入狀態（`isAuthenticated`/`displayName`/`signIn`/`signOut`/`syncFromStorage`），底層用 `authSession.js`。Pinia 元件外（httpClient、router 守衛）清掉 token 後，用 `syncAuthStoreFromStorage()` 把 store 的 `token` 同步回來。
- `authSession.js`：localStorage token 純函式（`getAdminToken`/`setAdminToken`/`clearAdminToken`/`getValidAdminToken`/`isAdminAuthenticated`/`getTokenExpiry`/`isTokenExpired`/…）。httpClient 與 router 守衛直接用它（不進 Pinia context）。判斷「是否登入」用 `isAdminAuthenticated()`（含 JWT `exp` 檢查）；`getAdminToken()` 只回傳儲存的原始 token，不檢查是否過期。localStorage 讀寫一律包 try/catch（儲存空間被封鎖時視為沒有 token，不丟例外）。

### 樣式
- 全域 reset / tokens 放 `src/styles/`（scss）。元件色彩/間距盡量用 `variables.scss` 的 token。
- 頁面樣式外掛到模組 `styles/*.scss`，頁面以 `<style scoped lang="scss" src="../styles/xxx.scss">` 引入（保持 scoped、同時讓 SFC 變薄）。葉子元件可用內嵌 `<style scoped lang="scss">`。

## 路由
- route name 集中在 `shared/constants/routes.js` 的 `ROUTE_NAMES`；各模組 `routes.js` 只引用、不硬寫字串。
- `router/index.js` 把各模組 `routes` 以 `...xxxRoutes` 組進 `DefaultLayout` children（登入頁為頂層）。**頁面採 lazy load**（`() => import(...)`）。
- 新增頁面流程：補 `ROUTE_NAMES` → 在模組 `routes.js` 加 route → 在 `router/index.js` spread 進來。
- 全域守衛用 `isAdminAuthenticated()` 判斷登入（含 JWT 過期檢查）：沒登入或 token 已過期，開任何頁面（含 `/`、`/dashboard`）都會導到 `/pages/login`。

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
- 模組之間原則上不互相 import；但本專案領域天然巢狀（活動 ⊃ 商品 ⊃ 訂單 ⊃ 庫存、報表跨多域），少數**領域相依**是允許的，例如 `inventory` 取用 `order`/`activityProduct` 的 api、`report` 取用 `activity` 的 mapper、`customer` 取用 `order` 的訂單狀態標籤。新增此類相依前先想清楚方向，避免循環。

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
`dashboard`（功能入口）、`auth`（登入）、`activity`（活動）、`activityProduct`（活動商品）、`animateType`（作品/動漫種類）、`inventory`（庫存）、`order`（訂單）、`customer`（顧客）、`report`（報表分析）、`wishPool`（許願池）。

## 功能備註：運費模式 / 補運費 / 訂單總額

**活動表單（`activity` 模組 `ActivityFormDialog.vue` + `useActivityForm.js`）**

- **活動期間的結束時間預設為 20:00**：管理員從日期區間選擇器選取活動結束日期時，`activityEndDate` 帶入當日 `20:00`；官方出貨期間與列表日期篩選仍以當日 `23:59` 作為結束邊界。
- **現貨活動不顯示運費模式與開團設定**：整段運費/開團 UI 以 `v-if="form.isPreOrder"` 包住；切到現貨時 watch 會把官方出貨期間清空、運費模式強制回 `NoShipping`、分攤規則回 `ByQuantity`、關閉「允許顧客補運費」，避免殘留預購設定被存入或卡驗證。
- **預購**才顯示且必填「官方出貨期間」：表單欄位與 API payload 使用 `officialShippingStartTime` / `officialShippingEndTime`；現貨 payload 不送官方出貨欄位，列表與表格以 `-` 顯示。
- **複製活動**共用活動表單的 `copy` mode：點擊複製先預填來源活動（名稱加「（複製）」），狀態強制 `NotStarted (0)`，預購開團狀態強制 `Recruiting`、現貨為 `NotRequired`；儲存時才以 multipart `POST /api/activities/{sourceId}/copy` 建立副本，不把來源 id 塞進 payload `id`。
- **表單純規則集中在 `src/modules/activity/utils/activityFormRules.js`**：create/edit/copy mode mapping、validation、multipart entries 組裝都在純函式，供 composable 與 colocated `node:test` 共用，避免引入 Vue runtime。
- **預購**才顯示運費模式：`PerItemPrepaid`（境內固定運費：每件預收＋運費成本＋成團數量）、`FreeOverAmount`（滿額免運：免運門檻＋**運費成本**，未達門檻時由顧客分攤該整筆運費）、`NoShipping`（買了就免運：開團數量）。
- **分攤規則唯讀、由運費模式決定**：不給管理員選（`deriveShareRule(mode)`：`FreeOverAmount→ByAmount`、其餘 `→ByQuantity`），前端僅唯讀顯示、後端強制決定。

**訂單顯示（`order` 模組 `OrderListPage.vue` + `orderColumns.js`）**

- 訂單「金額 / 訂單總額」一律顯示後端算好的 **`grandTotal`（= 商品小計 `total` + 補運費 `shippingFee`）**，前端不自行加總；明細另列「商品小計 / 補運費」拆解（補運費 > 0 時）。列表排序基準也用 `grandTotal`。詳見 [後端計算顯示值] 原則。

## 功能備註：登入過期（JWT exp）

- 後台登入用 JWT（存 localStorage，有效 120 分鐘，無續期）。過去路由守衛只檢查「token 存在」，儀表板又不一定會打 API 而等不到 401，所以關掉頁面隔幾天再開，畫面會停在首頁。現在 `authSession.js` 會解析 JWT payload 的 `exp`（`getTokenExpiry`，base64url + UTF-8），`isTokenExpired(token, { now, leewayMs })` 判斷是否過期。
- **過期策略**：距離 `exp` 不到 10 秒（`TOKEN_EXPIRY_LEEWAY_MS`）就視為已過期（避免請求送出途中才失效）；**格式錯誤的 token、沒有 `exp`、`exp` 不是數字，一律視為已過期**（後端簽發的 token 一定帶 `exp`，讀不出來就不是有效憑證，直接重新登入）。
- `isAdminAuthenticated()` / `getValidAdminToken()`：有 token 且未過期才算登入；過期或無效時**清除 token（含舊 `adminSession` key 的遷移）並視為未登入**。因此 router 守衛與根路徑 redirect 在重新開啟頁面時，過期的登入都會導到登入頁。
- **頁面保持開著、分頁被切走很久再切回來**：沒有 API 請求就不會有 401，所以 `DefaultLayout`（只有登入後才掛載）呼叫 `shared/composables/useSessionExpiryWatcher`，在 `visibilitychange`（變成可見）與 `window` 的 `focus` 時重新檢查（純函式 `shared/utils/sessionWatcher.js`，元件卸載時移除監聽）；發現失效就走跟 401 相同的 `httpClient.handleUnauthorized`（清 token、同步 `authStore`、導回登入頁，含防重入）。目前不設定時器，頁面持續開著且沒切走時，仍由下一個 API 的 401 處理。
- 注意：多數 composable 開頭的 `if (!getAdminToken())` 只是「有沒有 token」的前置檢查，不含過期判斷；過期時請求會以 401 收場並走上述導頁。

## 功能備註：訂單管理頁（`order` 模組）

- 左側活動列表只列活動（名稱、類型、狀態、未處理筆數徽章），**不再有「可訂購商品」摘要區塊**。頁面載入與切換活動時**不再取商品清單**：`products`（`/api/orders/activities/{id}/products`）只給「編輯訂單」視窗的商品下拉選單使用，改由 `useOrderForm.openEditOrder` 在打開視窗時才呼叫 `useOrders.loadProducts()`（與訂單明細同時發出，視窗顯示時已備妥）。
- **活動分頁（尚未結單 / 已結單 / 預購已完成 / 商品已入庫 / 已完成）由後端依「該活動所有非取消訂單的最低訂單狀態」歸類**（見後端 `OrderActivityTab`），所以訂單狀態一改，活動可能就要換分頁。
- **狀態變更後立即重整**：編輯訂單儲存、批次改狀態（`一鍵改為…`）、刪除訂單、寄送確認信（後端會把狀態改成「已寄送訂單確認信」，且先改狀態再寄信，所以成功或失敗都重整）完成後，頁面呼叫 `refreshOrderPage`：`useOrders.refreshAfterOrderChange()`（重新取得活動列表、目前活動的訂單、開著的訂單明細）加上 `newOrdersStore.refresh()`（頁首鈴鐺與活動徽章的未處理數）。重整會**停留在目前分頁 / 活動 / 搜尋條件 / 頁碼**（活動列表以 `preserveSelection` 載入，純函式 `utils/orderActivitySelection.js`）；只有目前活動已不屬於這個分頁（例如批次改成「預購已完成」後移到下一個分頁）時，才退回列表第一個活動並回到第 1 頁。
- **競態**：`useOrders` 的活動 / 商品 / 訂單 / 明細載入、`newOrdersStore.refresh` 都用 request token（寫法同 `ReportsPage`），只採用最後一次發出的回應，舊回應晚到不會蓋掉新資料。儲存 / 刪除 / 批次 / 寄信的 in-flight 旗標（`isSavingOrder`、`isDeletingOrder`、`isBulkUpdatingStatus`、`sendingConfirmationOrderId`）在重整完成前都維持 true，防止重複送出。

## 靜態資源（assets / public）與 favicon

- `src/assets/logo/brand-logo.jpg`：品牌 logo（與 WebClient `src/assets/logo/brand-logo.jpg` 同一張）。`index.html` 以 `<link rel="icon" type="image/jpeg" href="/src/assets/logo/brand-logo.jpg" />` 當瀏覽器分頁圖示，Vite build 時會處理成帶 hash 的資源。
- `public/cc-admin-mark.svg`：頁首品牌標記與活動 / 顧客圖片的預設圖，以絕對路徑 `/cc-admin-mark.svg` 引用，與 favicon 無關。
- `assets/` 放隨程式碼打包的靜態檔；API 回傳的圖片 URL 與使用者上傳檔不放這裡。

## 功能備註：圖片上傳格式

- 所有圖片上傳（活動封面、作品、商品、商品批次匯入）只接受 **JPG、PNG、WebP、AVIF**，**不再接受 GIF**，與後端一致。格式清單、`<input accept>` 與錯誤訊息文字統一由 `src/shared/constants/imageTypes.js`（`ALLOWED_IMAGE_TYPES` / `ALLOWED_IMAGE_EXTENSIONS` / `ALLOWED_IMAGE_ACCEPT` / `ALLOWED_IMAGE_LABEL`）產生，各圖片選擇器與 `useImageUpload` / `useMultiImageUpload` 都引用它，不要在元件裡自己寫格式字串或只檢查 `image/*`。

## 功能備註：商品 / 庫存數值上限

- 商品的日幣成本、售價（≤ 10,000,000）、成本匯率（≤ 10）、現貨初始數量（≤ 100,000），以及庫存異動的單筆數量（≤ 100,000）、單位成本 / 售價（≤ 100,000,000）都有上限，常數集中在 `src/shared/constants/productLimits.js`，**必須與後端 `ccAnimateJapan.AdminAPI` 的 `Application/Common/ProductValueLimits.cs` 一致**（後端才是最後防線，超過會被擋）。
- 前端做兩件事：數字輸入欄加 `max`，以及送出前由純函式 `getProductLimitError`（`activityProduct/utils/productForm.js`）、`getStockLimitError`（`inventory/utils/stockTransactionRules.js`）檢查並顯示明確訊息。兩個表單都是 `novalidate`，所以光靠 `max` 屬性不會擋送出，驗證一定要走這些函式。
- 進貨有「30 秒內相同進貨視為重複送出」的後端防呆，回 `409`，訊息會直接顯示在庫存異動對話框（`err.message`）；不需要前端額外處理，但按鈕仍維持 `isSavingTransaction` 期間停用。

## 功能備註：商品批次匯入（預購）

- **入口**：`activityProduct` 模組的商品頁（`ActivityProductsPage.vue`）工具列「批次匯入商品」按鈕，**只在預購活動顯示**；切換活動時會關閉視窗。按鈕開啟 `components/ProductImportDialog.vue`，狀態與流程集中在 `composables/useProductImport.js`，純函式（圖片清單整理、預覽結果 mapper、payload builder）在 `utils/productImport.js`，API 在 `api/activityProductApi.js`，樣式在 `styles/product-import-dialog.scss`。
- **三個步驟**（`IMPORT_STEPS`）：選擇檔案（下載範本、選 Excel、以選資料夾或拖曳加入圖片）→ 預覽與檢查 → 匯入結果。範本下載時帶入商品頁設定的成本匯率 / 售價匯率（`activityRateDefaults`）。
- **資料流**：預覽階段只送 Excel 與**圖片清單**（檔名 / 大小 / 類型，不送圖片本身）到 `.../products/import/preview`，後端回逐列驗證結果；有任何錯誤列時不能匯入（`canImport`）。正式匯入送預覽結果整理出的 `payload`（JSON）加上「Excel 有用到的圖片」到 `.../products/import`，**不會再送 Excel**。後端會重新驗證，前端驗證只是提早提示。
- **前端鏡像後端限制**（`utils/productImport.js`，改後端上限時要一起改）：Excel ≤5MB、圖片每張 ≤5MB、最多 500 張、總共 ≤200MB、檔名不分大小寫比對。
- **逾時與 loading**：圖片量大，正式匯入走 `silent: true`（不顯示全域 loading 遮罩，由視窗自己顯示上傳進度），逾時放寬到 15 分鐘。
- **失敗語意**：後端回應「整批成功或整批不寫入」，因此收到後端明確的失敗回覆時，畫面顯示後端訊息，並可「回到預覽」修正後重送。**但若是網路中斷或逾時（沒有收到後端回應），後端可能已經寫入**；後端沒有防重複機制，重送會建立重複商品。因此 `utils/productImport.js` 的 `describeImportFailure` 把「沒有後端 envelope 回覆」且狀態為 0（斷線）、408（前端逾時）、502 / 503 / 504（閘道逾時）的錯誤視為「結果不確定」：結果頁顯示「無法確認匯入結果」、**拿掉「回到預覽」**（`useProductImport` 的 `isOutcomeUnknown`；`backToPreview` 也會擋下），對話框 emit `outcome-unknown`，商品頁（`handleImportOutcomeUnknown`）重新載入列表並留下提醒，使用者要先確認列表，需要重送時關閉視窗重新開啟。
- **匯入中離開頁面**：對話框用 `shared/composables/useLeaveGuard`（純函式在 `shared/utils/leaveGuard.js`）在匯入進行中攔截關閉分頁 / 重新整理（`beforeunload`）與站內換頁（`onBeforeRouteLeave`、`onBeforeRouteUpdate`，會跳出確認）。使用者仍選擇離開時，請求不會被中止，但結果會遺失，回到商品列表重新載入即可看到實際結果。

## 功能備註：庫存顯示

- 庫存頁由 `inventory` 模組透過 `GET /api/product-stock-transactions/inventory-products` 一次取得包含 `activityId`、`activityName`、`isPreOrder`、庫存與有效訂購數量的扁平商品清單；切換畫面分類不重複呼叫 API。
- API 商品完成數值正規化後，前端會排除「庫存數量 `amount` 與訂購數量 `orderedAmount` 皆為 0」的商品；頁籤筆數、搜尋結果、活動分組與空狀態皆以排除後的商品集合計算。
- 畫面先以「現貨／預購」頁籤區分 `isPreOrder`，再於頁籤內依活動分成可收合區塊。名稱、商品類型與庫存狀態篩選及欄位排序皆在前端套用。
- 庫存頁不使用商品層級分頁；資料切分與活動分組規則集中於 `modules/inventory/utils/inventoryProductGroups.js`，活動區塊 UI 位於 `modules/inventory/components/InventoryActivityGroup.vue`。
