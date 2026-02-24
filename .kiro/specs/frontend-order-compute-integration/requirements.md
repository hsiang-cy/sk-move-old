# 需求文件：前端訂單與路徑計算功能整合

## 簡介

本功能為現有的前端應用程式新增訂單管理和路徑計算功能。使用者可以建立訂單（快照當前的地點和車輛資料），針對訂單觸發路徑計算任務，並視覺化查看計算結果。系統透過 GraphQL API 與後端通訊，使用 OR-Tools 服務進行車輛路徑規劃（VRP）計算。

## 術語表

- **訂單（Order）**：使用者建立的快照，包含特定時間點的地點和車輛資料
- **計算任務（Compute）**：針對訂單觸發的路徑計算請求，由 OR-Tools 服務處理
- **路線（Route）**：計算結果中的單一車輛行駛路徑
- **停靠點（RouteStop）**：路線中的單一停靠位置，包含抵達時間和需求量
- **快照（Snapshot）**：訂單建立時複製的地點或車輛資料，不受後續修改影響
- **OR-Tools**：Google 開發的最佳化工具，用於解決車輛路徑規劃問題
- **系統（System）**：前端應用程式和後端 API 的整體
- **前端（Frontend）**：React 應用程式，負責 UI 顯示和使用者互動
- **後端（Backend）**：GraphQL API 伺服器，負責資料處理和業務邏輯

## 需求

### 需求 1：訂單建立

**使用者故事**：身為使用者，我想要建立訂單並快照當前的地點和車輛資料，以便保存特定時間點的配置用於後續計算。

#### 驗收標準

1. WHEN 使用者建立訂單 THEN 系統 SHALL 快照當前所有有效的地點資料
2. WHEN 使用者建立訂單 THEN 系統 SHALL 快照當前所有有效的車輛資料
3. WHEN 使用者建立訂單 THEN 系統 SHALL 儲存訂單並返回訂單 ID
4. WHEN 使用者建立訂單且沒有有效地點 THEN 系統 SHALL 阻止建立並顯示錯誤訊息
5. WHEN 使用者建立訂單且沒有有效車輛 THEN 系統 SHALL 阻止建立並顯示錯誤訊息

### 需求 2：訂單查詢與管理

**使用者故事**：身為使用者，我想要查看和管理我的訂單，以便追蹤不同時間點的配置和刪除不需要的訂單。

#### 驗收標準

1. WHEN 使用者查詢訂單列表 THEN 系統 SHALL 返回該使用者的所有有效訂單
2. WHEN 使用者查詢單一訂單 THEN 系統 SHALL 返回訂單詳情包含快照資料
3. WHEN 使用者刪除訂單 THEN 系統 SHALL 將訂單狀態更新為 deleted

### 需求 3：計算任務建立與控制

**使用者故事**：身為使用者，我想要針對訂單觸發路徑計算並能夠取消進行中的計算，以便獲得最佳化的配送路線。

#### 驗收標準

1. WHEN 使用者針對訂單觸發計算 THEN 系統 SHALL 建立計算任務並設定狀態為 pending
2. WHEN 計算任務建立 THEN 系統 SHALL 發送請求到 OR-Tools 服務
3. WHEN 計算任務狀態為 pending 或 computing THEN 系統 SHALL 允許取消
4. WHEN 計算任務狀態為 completed、failed 或 cancelled THEN 系統 SHALL 拒絕取消請求
5. WHEN OR-Tools 返回計算結果 THEN 系統 SHALL 更新計算狀態為 completed 並建立路線資料
6. WHEN OR-Tools 返回錯誤 THEN 系統 SHALL 更新計算狀態為 failed 並記錄失敗原因

### 需求 4：計算任務查詢與狀態更新

**使用者故事**：身為使用者，我想要查看計算任務的狀態和結果，以便了解計算進度和獲取完成的路線資料。

#### 驗收標準

1. WHEN 使用者查詢計算任務列表 THEN 系統 SHALL 返回該使用者的所有計算任務
2. WHEN 使用者查詢單一計算任務 THEN 系統 SHALL 返回計算詳情包含關聯的訂單資訊
3. WHEN 使用者查詢已完成的計算任務 THEN 系統 SHALL 返回所有路線和停靠點資料
4. WHEN 計算任務狀態為 pending 或 computing THEN 前端 SHALL 每 3 秒輪詢一次狀態
5. WHEN 計算任務狀態變為終止狀態 THEN 前端 SHALL 停止輪詢

### 需求 5：路線視覺化

**使用者故事**：身為使用者，我想要在地圖上查看計算出的路線，以便直觀地理解配送路徑和停靠順序。

#### 驗收標準

1. WHEN 顯示路線資料 THEN 系統 SHALL 在地圖上標記所有地點
2. WHEN 顯示路線資料 THEN 系統 SHALL 繪製每條路線並使用不同顏色區分
3. WHEN 使用者點擊地點標記 THEN 系統 SHALL 顯示地點詳細資訊
4. WHEN 顯示停靠點資訊 THEN 系統 SHALL 格式化抵達時間為 HH:mm 格式

### 需求 6：路線資料一致性

**使用者故事**：身為系統管理員，我想要確保路線資料的計算正確性，以便提供可靠的配送規劃。

#### 驗收標準

1. WHEN 路線的 total_distance 計算 THEN 系統 SHALL 確保等於所有停靠點距離總和
2. WHEN 路線的 total_time 計算 THEN 系統 SHALL 確保等於所有停靠點時間總和
3. WHEN 路線的 total_load 計算 THEN 系統 SHALL 確保等於所有停靠點需求量總和
4. WHEN 路線的 total_load 計算 THEN 系統 SHALL 確保不超過車輛容量

### 需求 7：停靠點資料驗證

**使用者故事**：身為系統管理員，我想要確保停靠點資料符合業務規則，以便保證配送計畫的可行性。

#### 驗收標準

1. WHEN 停靠點的 arrival_time 設定 THEN 系統 SHALL 確保在地點的時間視窗內
2. WHEN 停靠點按 sequence 排序 THEN 系統 SHALL 確保順序連續且從 0 開始

### 需求 8：安全性與授權

**使用者故事**：身為系統管理員，我想要確保使用者只能存取自己的資料，以便保護資料隱私和安全。

#### 驗收標準

1. WHEN 所有 API 請求發送 THEN 系統 SHALL 包含有效的 Authorization header
2. WHEN 使用者查詢資料 THEN 系統 SHALL 只返回該使用者 account_id 的資料
3. WHEN token 過期 THEN 系統 SHALL 導向登入頁面

### 需求 9：計算狀態轉換

**使用者故事**：身為系統管理員，我想要確保計算任務的狀態轉換符合業務邏輯，以便維護資料一致性。

#### 驗收標準

1. WHEN 計算狀態從 pending 轉換 THEN 系統 SHALL 只允許轉換到 computing 或 cancelled
2. WHEN 計算狀態從 computing 轉換 THEN 系統 SHALL 只允許轉換到 completed、failed 或 cancelled
3. WHEN 計算狀態為終止狀態 THEN 系統 SHALL 不允許任何狀態轉換

### 需求 10：錯誤處理與使用者體驗

**使用者故事**：身為使用者，我想要在發生錯誤時獲得清楚的提示和恢復選項，以便順利完成操作。

#### 驗收標準

1. WHEN 使用者輸入表單資料 THEN 系統 SHALL 驗證必填欄位
2. WHEN 網路請求失敗 THEN 系統 SHALL 自動重試最多 3 次
3. WHEN 網路請求失敗 THEN 系統 SHALL 顯示錯誤訊息和重試按鈕
