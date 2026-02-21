
## 1. 服務架構

本 API 採用 **非同步 (Asynchronous)** 模式運作：
1. **提交任務**：用戶發送 POST 請求至 `/vrp/solve`。
2. **立即回傳**：系統驗證參數後，立即回傳 `job_id`，代表計算已開始。
3. **結果回傳**：計算完成後（通常在數秒內），系統會將結果透過 **Webhook** 推送至您指定的 `webhook_url`。

---

## 2. API 端點 (Endpoints)

### 提交求解任務
- **URL**: `https://tile-zip--ortools-vrp-solver-api-dev.modal.run/vrp/solve`
- **Method**: `POST`
- **Content-Type**: `application/json`

---

## 3. 請求參數說明 (Request Body)

| 參數名 | 型別 | 必填 | 說明 |
| :--- | :--- | :--- | :--- |
| `webhook_url` | String | 是 | 接收結果的伺服器網址。 |
| `depot_index` | Integer | 否 | 轉運站 (Depot) 在 locations 中的索引值，預設為 `0`。 |
| `locations` | Array | 是 | 地點清單（包含 Depot 與客戶點）。 |
| `vehicles` | Array | 是 | 可用的車輛清單。 |
| `distance_matrix` | Array[Array] | 是 | N x N 距離矩陣 (單位：公尺)。 |
| `time_matrix` | Array[Array] | 是 | N x N 時間矩陣 (單位：分鐘)。 |
| `time_limit_seconds`| Integer | 否 | 求解器運算時間上限，預設 `30` 秒。 |

### Location 物件結構
- `id`: (Int) 唯一識別碼
- `name`: (String) 名稱
- `lat` / `lng`: (Float) 經緯度
- `pickup`: (Int) 此點上貨量
- `delivery`: (Int) 此點卸貨量
- `service_time`: (Int) 停留服務時間 (分鐘)
- `time_window_start`: (Int) 最早抵達時間 (分鐘)
- `time_window_end`: (Int) 最晚抵達時間 (分鐘)

---

## 4. 範例請求 (Example Request)

```json
{
  "webhook_url": "https://your-server.com/callback",
  "locations": [
    { "id": 0, "name": "倉庫", "lat": 25.04, "lng": 121.51, "time_window_end": 1440 },
    { "id": 1, "name": "客戶A", "lat": 25.05, "lng": 121.52, "delivery": 5, "time_window_start": 60, "time_window_end": 120 }
  ],
  "vehicles": [
    { "id": 101, "capacity": 20, "fixed_cost": 50 }
  ],
  "distance_matrix": [[0, 2000], [2000, 0]],
  "time_matrix": [[0, 10], [10, 0]]
}
```

---

## 5. Webhook 結果回傳 (Callback Payload)

當計算完成後，系統會發送以下格式的 JSON 至您的 Webhook URL：

### 成功回應範例
```json
{
  "job_id": "uuid-string",
  "status": "success",
  "total_distance": 4000,
  "routes": [
    {
      "vehicle_id": 101,
      "total_distance": 4000,
      "total_delivery": 5,
      "stops": [
        { "location_id": 0, "arrival_time": 0, "name": "倉庫" },
        { "location_id": 1, "arrival_time": 60, "name": "客戶A" },
        { "location_id": 0, "arrival_time": 80, "name": "倉庫" }
      ]
    }
  ]
}
```

### 錯誤回應範例
若參數錯誤或找不到可行解，會回傳錯誤狀態：
```json
{
  "job_id": "uuid-string",
  "status": "error",
  "message": "找不到可行解，請確認時間窗與容量限制是否過於嚴苛"
}
```

---

## 6. 注意事項
- **矩陣一致性**：`distance_matrix` 與 `time_matrix` 的大小必須與 `locations` 的數量一致（均為 N x N）。
- **時間單位**：請確保 `time_matrix`、`service_time` 與 `time_window` 使用相同的時間單位（建議統一為分鐘）。
- **安全性**：目前 API 為開發測試階段。如需生產環境部署，請聯繫管理員配置 API Key。
