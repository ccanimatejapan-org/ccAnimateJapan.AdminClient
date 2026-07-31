# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 本文件以繁體中文為主，協助 Claude Code 及新加入的開發者快速上手。

## 專案概述

ccAnimateJapan 的**後台管理介面**，技術棧 **Vue 3（Composition API）+ Vite + Pinia + axios**，採功能模組（feature-module）架構。功能：活動 / 商品、作品（動漫種類 animateType）、庫存異動、不分活動的訂單管理、報表分析（apexcharts）、開團 / 運費模式設定。資料來自後端 `ccAnimateJapan.AdminAPI`，登入採 JWT bearer。

**`ARCHITECTURE.md` 是本專案前端架構最完整、最權威的說明**（資料夾責任、模組邊界、資料流、命名、新功能放哪、狀態碼鏡像）。**做任何結構性調整前請先閱讀它。** 本文件只補「光看檔案結構不容易看出」的重點。

## 工作流程規範（重要）

- **每次修改完成後都要做 code review**（由 Claude 進行，可用 `/code-review`），再進入下一個變更。
- **工具分工**：規劃＝Claude（分析需求、設計策略、拆步驟）；實作＝Codex；code review＝Claude。
- **不要自動 commit**：調整完成後僅將變更留在工作目錄（unstaged），不要 `git add` / `commit` / `push`，由使用者最後檢查後自行提交。

## 文件同步規則（改功能就改文件）

新增或修改功能時，**必須同步更新相關文件**，並與程式碼一起 commit（不要事後補）：架構 / 模組邊界 → [`ARCHITECTURE.md`](ARCHITECTURE.md)；狀態值 → 同步各鏡像檔並確認與後端 [`STATUS_CODES.md`](../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md) 一致；開團 / 運費行為 → 後端 [`GROUP_BUY.md`](../ccAnimateJapan.AdminAPI/docs/GROUP_BUY.md)。

## 常用指令

```bash
npm run dev        # Vite dev server（http://127.0.0.1:5173，對應 AdminAPI CORS）
npm run build      # 建置到 dist/（也是主要驗證方式）
npm run preview    # 預覽 build 產物

# 測試（Node 內建 node:test，*.test.js colocate；loader 讓 @/ alias 可解析）
node --import ./tools/test-alias.register.mjs --test
```

目前**沒有 lint 指令**；改完以 `npm run build` 驗證。

## 重要慣例

- **路徑別名**：`@` → `src`。
- **模組結構**：功能放 `src/modules/{feature}/`（`pages/ components/ composables/ utils/ api/ styles/ routes.js`，依需要）。`src/shared/` 放跨模組共用平台程式，**不可 import `src/modules/`**；模組之間原則上不互相 import，少數**領域相依**允許（如 `inventory` 用 `order`/`activityProduct` 的 api、`report` 用 `activity` 的 mapper）——見 `ARCHITECTURE.md`。
- **路由**：route name 集中在 `src/shared/constants/routes.js` 的 `ROUTE_NAMES`，各模組 `routes.js` 只引用；頁面 lazy load。新增流程：補 `ROUTE_NAMES` → 模組 `routes.js` → `router/index.js` spread 進來。
- **API 寫法**：一律走 `src/shared/api/httpClient.js`（唯一 axios 實例）。攔截器**自動帶 `Authorization: Bearer`**、處理 401、解開 envelope `{status,data,message}`（`unwrapApiResponse`，成功判斷 `Number(status)<400`）。**api 檔不要自己帶 auth header**；endpoint 字串只出現在 api 檔。二進位下載走 `apiBlob`。
- **下拉選單**統一用 `CustomSelect`，依模組套紅 / 橘 / 綠 tone。
- **顯示值由後端算**：如訂單金額一律顯示後端的 `grandTotal`（＝商品小計 `total` + 補運費 `shippingFee`），前端不自行加總；庫存只顯示 API 的 `amount` / `isOutStock`。
- **樣式**：頁面 scss 以 `<style scoped lang="scss" src="../styles/xxx.scss">` 外掛（保持 scoped、SFC 變薄）；色彩 / 間距用 `src/styles/variables.scss` 的 token。
- **測試 colocate**：`*.test.js` 放來源檔旁；優先測 mapper / filters / 欄位定義 / payload builder / 狀態表 / 聚合邏輯 / shared utils。

## 狀態碼 / 開團

活動 / 訂單的狀態碼**權威在後端**，前端是鏡像；改任何狀態值務必同步後端與本 repo。鏡像檔清單與說明見 `ARCHITECTURE.md` 的「狀態碼 / 開團」段；權威登記表與運作見後端：

- 狀態登記表：[`../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md`](../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md)
- 開團 / 運費 / 補運費：[`../ccAnimateJapan.AdminAPI/docs/GROUP_BUY.md`](../ccAnimateJapan.AdminAPI/docs/GROUP_BUY.md)
