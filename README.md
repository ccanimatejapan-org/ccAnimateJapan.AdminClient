# ccAnimateJapan.AdminClient

後台 Vue 3 管理介面。功能包含活動/商品、作品（動漫種類 animateType）管理、庫存異動與不分活動的訂單管理。

## Data Rules

- 商品及庫存畫面的庫存狀態只顯示 Admin API 回傳的 `amount` / `isOutStock`。
- 新增現貨商品可設定初始數量；後續庫存調整請使用庫存管理。
- 訂單管理直接列出全部訂單，明細中的每項商品顯示 `activityName`。
- 下拉式選單統一使用 `CustomSelect`，並依模組套用紅、橘或綠色 tone。

## Verify

```bash
npm run build
```
