# ccAnimateJapan.AdminClient

後台 Vue 3 管理介面。功能包含活動/商品、作品（動漫種類 animateType）管理、庫存異動、不分活動的訂單管理、報表分析，以及開團/運費模式設定。

狀態碼與開團說明見 [ARCHITECTURE.md](./ARCHITECTURE.md#狀態碼--開團跨-repo)；權威定義在後端 [`../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md`](../ccAnimateJapan.AdminAPI/docs/STATUS_CODES.md)。

## 架構

前端架構（權威規範）見 [ARCHITECTURE.md](./ARCHITECTURE.md)；開發快速指引見 [CLAUDE.md](./CLAUDE.md)。

## 資料規則

- 商品及庫存畫面的庫存狀態只顯示 Admin API 回傳的 `amount` / `isOutStock`。
- 新增現貨商品可設定初始數量；後續庫存調整請使用庫存管理。
- 訂單管理直接列出全部訂單，明細中的每項商品顯示 `activityName`。
- 下拉式選單統一使用 `CustomSelect`，並依模組套用紅、橘或綠色 tone。

## 驗證

```bash
npm run build
```
