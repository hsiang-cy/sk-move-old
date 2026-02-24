# 實作計畫：前端訂單與路徑計算功能整合

## 概述

本實作計畫將為前端應用程式新增訂單管理和路徑計算功能。實作將遵循現有的架構模式（Service 層 + Hook 層 + View 層），使用 TypeScript、React、TanStack Query 和 GraphQL。實作順序從底層服務開始，逐步向上建構到 UI 層，確保每個階段都可以獨立測試和驗證。

## 任務清單

- [x] 1. 建立專案結構和型別定義
  - 建立 `src/services/orders.ts` 和 `src/services/computes.ts` 檔案
  - 建立 `src/types/order.ts` 和 `src/types/compute.ts` 型別定義檔案
  - 定義 Order、Compute、Route、RouteStop 等介面
  - 定義 ComputeStatus 列舉型別
  - _需求：1.1, 1.2, 2.1, 3.1, 4.1_

- [x] 2. 實作訂單服務層（Orders Service）
  - [x] 2.1 實作 ordersService.getAll() 方法
    - 撰寫 GraphQL query 取得訂單列表
    - 實作資料轉換邏輯（API 格式轉前端格式）
    - 包含 destination_snapshot 和 vehicle_snapshot 欄位
    - _需求：2.1, 8.2_

  - [x] 2.2 實作 ordersService.getById() 方法
    - 撰寫 GraphQL query 取得單一訂單詳情
    - 包含完整的快照資料和關聯的計算任務數量
    - _需求：2.2_

  - [x] 2.3 實作 ordersService.create() 方法
    - 撰寫 GraphQL mutation 建立訂單
    - 接收地點和車輛快照資料作為參數
    - 驗證快照資料完整性（至少 1 個地點和車輛）
    - _需求：1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.4 實作 ordersService.delete() 方法
    - 撰寫 GraphQL mutation 軟刪除訂單
    - 更新訂單狀態為 'deleted'
    - _需求：2.3_

  - [ ]* 2.5 撰寫訂單服務層單元測試
    - 測試所有 CRUD 方法
    - 測試錯誤處理邏輯
    - 使用 Mock fetch 模擬 API 回應
    - _需求：1.1, 1.2, 2.1, 2.2, 2.3_

- [x] 3. 實作計算任務服務層（Computes Service）
  - [x] 3.1 實作 computesService.getAll() 方法
    - 撰寫 GraphQL query 取得計算任務列表
    - 包含關聯的訂單基本資訊
    - 支援按 order_id 篩選
    - _需求：4.1, 8.2_

  - [x] 3.2 實作 computesService.getById() 方法
    - 撰寫 GraphQL query 取得單一計算任務詳情
    - 包含完整的路線和停靠點資料（如果已完成）
    - 包含關聯的訂單資訊
    - _需求：4.2, 4.3_

  - [x] 3.3 實作 computesService.create() 方法
    - 撰寫 GraphQL mutation 建立計算任務
    - 接收 order_id 作為參數
    - 初始狀態設為 'pending'
    - _需求：3.1, 3.2_

  - [x] 3.4 實作 computesService.cancel() 方法
    - 撰寫 GraphQL mutation 取消計算任務
    - 驗證狀態是否允許取消（pending 或 computing）
    - _需求：3.3, 3.4_

  - [x] 3.5 實作 computesService.getRoutes() 方法
    - 撰寫 GraphQL query 取得計算任務的所有路線
    - 包含每條路線的停靠點資料
    - 包含關聯的車輛和地點資訊
    - _需求：4.3_

  - [ ]* 3.6 撰寫計算任務服務層單元測試
    - 測試所有 CRUD 方法
    - 測試狀態轉換邏輯
    - 測試錯誤處理邏輯
    - _需求：3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] 4. 實作訂單 React Hooks
  - [x] 4.1 實作 useOrders hook
    - 使用 TanStack Query 的 useQuery
    - 設定 queryKey: ['orders']
    - 設定 staleTime: 30 秒
    - _需求：2.1_

  - [x] 4.2 實作 useOrder hook
    - 接收 orderId 參數
    - 設定 queryKey: ['order', orderId]
    - _需求：2.2_

  - [x] 4.3 實作 useCreateOrder hook
    - 使用 TanStack Query 的 useMutation
    - 成功後 invalidate ['orders'] cache
    - _需求：1.3_

  - [x] 4.4 實作 useDeleteOrder hook
    - 使用 TanStack Query 的 useMutation
    - 成功後 invalidate ['orders'] cache
    - _需求：2.3_

  - [ ]* 4.5 撰寫訂單 hooks 單元測試
    - 使用 @testing-library/react-hooks
    - 測試 cache invalidation 行為
    - 測試錯誤處理
    - _需求：1.3, 2.1, 2.2, 2.3_

- [x] 5. 實作計算任務 React Hooks
  - [x] 5.1 實作 useComputes hook
    - 使用 TanStack Query 的 useQuery
    - 設定 queryKey: ['computes', { orderId }]
    - 支援可選的 orderId 篩選參數
    - 設定 staleTime: 0（需要即時狀態）
    - _需求：4.1_

  - [x] 5.2 實作 useCompute hook
    - 接收 computeId 參數
    - 設定 queryKey: ['compute', computeId]
    - 實作輪詢邏輯：當狀態為 pending 或 computing 時每 3 秒 refetch
    - 當狀態變為終止狀態時停止輪詢
    - _需求：4.2, 4.4, 4.5_

  - [ ]* 5.3 撰寫屬性測試：輪詢行為
    - **屬性 10：輪詢行為**
    - **驗證：需求 4.4, 4.5**
    - 生成隨機的狀態轉換序列
    - 驗證輪詢在正確的狀態下啟動和停止

  - [x] 5.4 實作 useCreateCompute hook
    - 使用 TanStack Query 的 useMutation
    - 成功後 invalidate ['computes'] cache
    - _需求：3.1_

  - [x] 5.5 實作 useCancelCompute hook
    - 使用 TanStack Query 的 useMutation
    - 成功後 invalidate ['compute', computeId] cache
    - 處理取消失敗的錯誤（已完成的任務無法取消）
    - _需求：3.3, 3.4_

  - [x] 5.6 實作 useComputeRoutes hook
    - 接收 computeId 參數
    - 設定 queryKey: ['compute', computeId, 'routes']
    - 設定 staleTime: 5 分鐘（完成後不會變動）
    - 只在 compute_status 為 'completed' 時啟用
    - _需求：4.3_

  - [ ]* 5.7 撰寫計算任務 hooks 單元測試
    - 測試輪詢邏輯
    - 測試 cache invalidation
    - 測試條件查詢（enabled 參數）
    - _需求：3.1, 3.3, 4.1, 4.2, 4.4, 4.5_

- [ ] 6. 檢查點 - 確保服務層和 Hook 層測試通過
  - 確保所有測試通過，如有問題請詢問使用者

- [x] 7. 實作共用 UI 元件
  - [x] 7.1 實作 ComputeStatusBadge 元件
    - 接收 status 和 className props
    - 根據狀態顯示不同顏色和文字
    - pending: 灰色「等待中」
    - computing: 藍色「計算中」（帶動畫）
    - completed: 綠色「已完成」
    - failed: 紅色「失敗」
    - cancelled: 橙色「已取消」
    - 使用 DaisyUI badge 元件和 Tailwind CSS
    - _需求：4.1_

  - [ ]* 7.2 撰寫 ComputeStatusBadge 元件測試
    - 測試所有狀態的渲染
    - 測試 className 傳遞
    - 使用 @testing-library/react
    - _需求：4.1_

- [-] 8. 實作訂單管理頁面
  - [ ] 8.1 建立 OrdersView 元件
    - 建立 `src/routes/_auth.orders.tsx` 路由檔案
    - 建立 `src/views/OrdersView.tsx` 元件檔案
    - 使用 useOrders hook 取得訂單列表
    - 顯示訂單表格（ID、建立時間、地點數量、車輛數量、狀態）
    - 顯示 loading 和 error 狀態
    - 提供「建立訂單」按鈕
    - 提供「查看詳情」和「刪除訂單」按鈕
    - 提供「前往計算」連結
    - _需求：2.1, 2.3_

  - [x] 8.2 實作 OrderFormModal 元件
    - 建立 `src/components/orders/OrderFormModal.tsx`
    - 接收 open 和 onClose props
    - 使用 useLocations 和 useVehicles hooks 取得當前資料
    - 顯示當前有效的地點列表（唯讀預覽）
    - 顯示當前有效的車輛列表（唯讀預覽）
    - 提供備註欄位（comment_for_account）
    - 驗證至少有 1 個地點和車輛，否則禁用提交按鈕
    - 使用 useCreateOrder hook 提交表單
    - 成功後關閉 modal 並顯示成功訊息
    - _需求：1.1, 1.2, 1.3, 1.4, 1.5, 10.1_

  - [x] 8.3 實作 OrderDetailModal 元件
    - 建立 `src/components/orders/OrderDetailModal.tsx`
    - 接收 open、order 和 onClose props
    - 顯示訂單基本資訊（ID、建立時間、狀態、備註）
    - 顯示快照的地點列表（表格形式）
    - 顯示快照的車輛列表（表格形式）
    - 顯示該訂單的計算任務數量
    - 提供「前往計算」按鈕
    - _需求：2.2_

  - [ ]* 8.4 撰寫訂單頁面元件測試
    - 測試訂單列表渲染
    - 測試建立訂單流程
    - 測試刪除訂單流程
    - 測試錯誤處理（無地點或車輛）
    - _需求：1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

  - [ ]* 8.5 撰寫屬性測試：訂單快照完整性
    - **屬性 1：訂單快照完整性**
    - **驗證：需求 1.1, 1.2, 1.3**
    - 生成隨機的地點和車輛資料
    - 驗證快照包含所有必要欄位
    - 驗證快照資料可以成功傳遞給 createCompute

  - [ ]* 8.6 撰寫屬性測試：訂單建立前置條件
    - **屬性 2：訂單建立前置條件**
    - **驗證：需求 1.4, 1.5**
    - 測試無地點或無車輛時的錯誤處理
    - 驗證錯誤訊息正確顯示

- [ ] 9. 實作計算任務管理頁面
  - [ ] 9.1 建立 ComputesView 元件
    - 建立 `src/routes/_auth.computes.tsx` 路由檔案
    - 建立 `src/views/ComputesView.tsx` 元件檔案
    - 使用 useComputes hook 取得計算任務列表
    - 使用 useOrders hook 取得訂單列表（用於篩選）
    - 顯示計算任務表格（ID、訂單、狀態、開始時間、結束時間）
    - 整合 ComputeStatusBadge 元件顯示狀態
    - 提供「建立計算」按鈕（選擇訂單）
    - 提供「查看結果」連結
    - 提供「取消計算」按鈕（僅限 pending/computing 狀態）
    - 支援按訂單篩選計算任務
    - _需求：3.1, 3.3, 3.4, 4.1_

  - [ ]* 9.2 撰寫計算任務頁面元件測試
    - 測試計算任務列表渲染
    - 測試建立計算流程
    - 測試取消計算流程
    - 測試狀態篩選
    - _需求：3.1, 3.3, 3.4, 4.1_

  - [ ]* 9.3 撰寫屬性測試：計算狀態機轉換
    - **屬性 7：計算狀態機轉換**
    - **驗證：需求 3.3, 3.4, 9.1, 9.2, 9.3**
    - 生成隨機的狀態轉換序列
    - 驗證所有轉換都符合狀態機規則
    - 驗證終止狀態不允許轉換

- [ ] 10. 實作路徑視覺化元件
  - [ ] 10.1 安裝地圖相依套件
    - 執行 `npm install leaflet react-leaflet @types/leaflet date-fns`
    - 在專案中引入 Leaflet CSS
    - _需求：5.1, 5.2_

  - [ ] 10.2 實作 RouteMap 元件
    - 建立 `src/components/routes/RouteMap.tsx`
    - 接收 routes 和 destinations props
    - 使用 react-leaflet 顯示地圖
    - 在地圖上標記所有地點（倉庫和配送點使用不同顏色）
    - 繪製每條路線（使用不同顏色區分車輛）
    - 顯示路線方向箭頭
    - 點擊地點時顯示 Popup（名稱、地址、抵達時間）
    - 提供圖層控制（切換顯示/隱藏特定路線）
    - 使用 React.memo 最佳化渲染
    - 使用 Canvas Renderer 提升效能
    - _需求：5.1, 5.2, 5.3_

  - [ ] 10.3 實作 RouteStopCard 元件
    - 建立 `src/components/routes/RouteStopCard.tsx`
    - 接收 stop 和 destination props
    - 顯示停靠順序（sequence）
    - 顯示地點名稱和地址
    - 使用 date-fns 格式化 arrival_time 為 HH:mm 格式
    - 顯示需求量（demand）
    - 提供視覺化時間軸指示器
    - _需求：5.4_

  - [ ]* 10.4 撰寫屬性測試：時間格式化一致性
    - **屬性 12：時間格式化一致性**
    - **驗證：需求 5.4**
    - 生成隨機的 arrival_time（0-1440 分鐘）
    - 驗證格式化結果為 HH:mm 格式
    - 驗證往返轉換的一致性

  - [ ] 10.5 實作 RouteList 元件
    - 建立 `src/components/routes/RouteList.tsx`
    - 接收 routes props
    - 顯示每條路線的摘要資訊（車輛、總距離、總時間、總載重）
    - 可展開/收合查看該路線的所有停靠點
    - 整合 RouteStopCard 元件顯示停靠點
    - 提供排序功能（按距離、時間、載重）
    - _需求：4.3_

  - [ ]* 10.6 撰寫路徑視覺化元件測試
    - 測試地圖渲染
    - 測試路線和標記顯示
    - 測試互動功能（點擊、展開/收合）
    - 測試時間格式化
    - _需求：5.1, 5.2, 5.3, 5.4_

- [ ] 11. 實作計算詳情頁面
  - [ ] 11.1 建立 ComputeDetailView 元件
    - 建立 `src/routes/_auth.computes.$id.tsx` 路由檔案
    - 建立 `src/views/ComputeDetailView.tsx` 元件檔案
    - 從路由參數取得 computeId
    - 使用 useCompute hook 取得計算任務詳情（含輪詢）
    - 使用 useComputeRoutes hook 取得路線資料（僅在 completed 時）
    - 顯示計算任務基本資訊（ID、狀態、開始時間、結束時間、失敗原因）
    - 整合 ComputeStatusBadge 元件
    - 顯示關聯的訂單資訊
    - 如果狀態為 completed，整合 RouteMap 和 RouteList 元件
    - 如果狀態為 pending/computing，顯示載入動畫
    - 如果狀態為 failed，顯示失敗原因
    - _需求：4.2, 4.3, 4.4, 4.5_

  - [ ]* 11.2 撰寫計算詳情頁面元件測試
    - 測試不同狀態的渲染
    - 測試輪詢行為
    - 測試路徑視覺化整合
    - _需求：4.2, 4.3, 4.4, 4.5_

- [ ] 12. 實作資料驗證和錯誤處理
  - [ ] 12.1 實作網路請求重試機制
    - 在 TanStack Query 設定中配置 retry: 3
    - 設定 retryDelay 為遞增延遲
    - _需求：10.2_

  - [ ] 12.2 實作全域錯誤處理
    - 建立 ErrorBoundary 元件
    - 處理 401 錯誤（token 過期）導向登入頁面
    - 顯示錯誤訊息和重試按鈕
    - _需求：8.3, 10.3_

  - [ ] 12.3 實作表單驗證
    - 在 OrderFormModal 中驗證必填欄位
    - 驗證快照資料完整性
    - 顯示驗證錯誤訊息
    - _需求：10.1_

  - [ ]* 12.4 撰寫屬性測試：網路請求重試機制
    - **屬性 20：網路請求重試機制**
    - **驗證：需求 10.2, 10.3**
    - 模擬網路失敗
    - 驗證重試次數和延遲
    - 驗證最終錯誤處理

- [ ] 13. 實作資料一致性驗證
  - [ ]* 13.1 撰寫屬性測試：路線統計資料一致性
    - **屬性 13：路線統計資料一致性**
    - **驗證：需求 6.1, 6.2, 6.3**
    - 生成隨機的路線和停靠點資料
    - 驗證 total_distance、total_time、total_load 等於停靠點總和

  - [ ]* 13.2 撰寫屬性測試：車輛容量限制
    - **屬性 14：車輛容量限制**
    - **驗證：需求 6.4**
    - 生成隨機的路線資料
    - 驗證 total_load 不超過車輛容量

  - [ ]* 13.3 撰寫屬性測試：時間視窗約束
    - **屬性 15：時間視窗約束**
    - **驗證：需求 7.1**
    - 生成隨機的停靠點資料
    - 驗證 arrival_time 在時間視窗內

  - [ ]* 13.4 撰寫屬性測試：停靠點序號連續性
    - **屬性 16：停靠點序號連續性**
    - **驗證：需求 7.2**
    - 生成隨機的停靠點列表
    - 驗證 sequence 從 0 開始且連續

- [ ] 14. 實作安全性和授權
  - [ ] 14.1 實作 API 請求攔截器
    - 在所有 GraphQL 請求中自動加入 Authorization header
    - 從 localStorage 讀取 token
    - _需求：8.1_

  - [ ] 14.2 實作 token 過期處理
    - 監聽 401 回應
    - 清除 localStorage 中的 token
    - 導向登入頁面
    - _需求：8.3_

  - [ ]* 14.3 撰寫屬性測試：使用者資料隔離
    - **屬性 3：使用者資料隔離**
    - **驗證：需求 2.1, 4.1, 8.2**
    - 模擬多個使用者的資料
    - 驗證查詢結果只包含當前使用者的資料

  - [ ]* 14.4 撰寫屬性測試：API 請求認證
    - **屬性 17：API 請求認證**
    - **驗證：需求 8.1**
    - 驗證所有請求都包含 Authorization header
    - 驗證 header 格式正確（Bearer token）

- [ ] 15. 檢查點 - 確保所有功能完整且測試通過
  - 確保所有測試通過，如有問題請詢問使用者

- [ ] 16. 整合和最佳化
  - [ ] 16.1 整合導航選單
    - 在主選單中新增「訂單管理」和「路徑計算」連結
    - 確保路由正確配置
    - _需求：2.1, 4.1_

  - [ ] 16.2 實作快取策略最佳化
    - 配置 TanStack Query 的 staleTime 和 cacheTime
    - 訂單列表：staleTime 30 秒
    - 計算任務：staleTime 0 秒
    - 路線資料：staleTime 5 分鐘
    - _需求：4.4, 4.5_

  - [ ] 16.3 實作地圖渲染最佳化
    - 使用 React.memo 避免不必要的重新渲染
    - 實作 clustering 處理大量標記點
    - 延遲載入地圖（切換到地圖 tab 時才初始化）
    - _需求：5.1, 5.2_

  - [ ] 16.4 實作列表虛擬化（如果需要）
    - 如果訂單或計算任務列表超過 100 筆，使用 @tanstack/react-virtual
    - 實作搜尋和篩選功能
    - _需求：2.1, 4.1_

  - [ ]* 16.5 撰寫端對端整合測試
    - 測試完整流程：建立訂單 → 觸發計算 → 查看結果
    - 測試取消計算流程
    - 測試刪除訂單流程
    - _需求：1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1, 4.2, 4.3_

- [ ] 17. 最終檢查點 - 確保所有測試通過並準備交付
  - 確保所有測試通過，如有問題請詢問使用者

## 注意事項

- 標記 `*` 的任務為可選任務，可以跳過以加快 MVP 開發
- 每個任務都參照特定的需求編號以確保可追溯性
- 檢查點任務確保增量驗證
- 屬性測試驗證通用的正確性屬性
- 單元測試驗證特定的範例和邊界情況
- 所有程式碼使用 TypeScript 撰寫
- 遵循現有的專案架構和程式碼風格
