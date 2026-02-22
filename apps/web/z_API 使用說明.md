# API 使用說明

> 給前端開發者的 GraphQL API 參考文件

---

## 基本資訊

| 項目 | 值 |
|------|---|
| Endpoint | `POST /graphql` |
| Content-Type | `application/json` |
| 認證方式 | `Authorization: Bearer <token>` |

所有請求都打同一個端點 `/graphql`，以 JSON body 傳遞查詢。

---

## 認證流程

### 1. 註冊

```graphql
mutation {
  register(
    account: "myaccount"
    email: "me@example.com"
    password: "secret123"
    people_name: "王小明"
  ) {
    token
    account {
      account_id
      account
      account_role
    }
  }
}
```

### 2. 登入

```graphql
mutation {
  login(account: "myaccount", password: "secret123") {
    token
    account {
      account_id
      account_role
    }
  }
}
```

### 3. 帶 Token 發送請求

取得 `token` 後，所有需要登入的請求都要在 Header 帶上：

```
Authorization: Bearer eyJhbGciOi...
```

---

## Enum 定義

```graphql
# 通用狀態（所有資料列都有）
enum Status {
  active    # 正常
  inactive  # 停用
  deleted   # 已軟刪除（資料仍存在，但不應顯示給使用者）
}

# 帳號角色（權限由低到高）
enum AccountRole {
  just_view  # 只能查詢，不能寫入
  guest
  normal     # 一般使用者（預設）
  manager
  admin
}

# 計算任務狀態
enum ComputeStatus {
  initial    # 剛建立
  pending    # 排隊中
  computing  # 計算中
  completed  # 完成
  failed     # 失敗
  cancelled  # 已取消
}
```

---

## 型別定義

### Account（帳號）

```graphql
type Account {
  account_id:       ID!
  status:           Status!
  account_role:     AccountRole!
  account:          String!       # 登入帳號名稱
  email:            String!
  company_name:     String
  company_industry: String
  people_name:      String!
  phone:            String
  point:            Int!          # 剩餘點數
  created_at:       Float         # Unix timestamp（秒）
  updated_at:       Float
  data:             JSON
  point_logs:       [PointLog!]!  # 點數異動記錄（field resolver）
}
```

### PointLog（點數紀錄）

```graphql
type PointLog {
  id:         ID!
  account_id: Int!
  change:     Int!     # 正數 = 增加，負數 = 扣除
  reason:     String!  # 例："compute_cost"、"manual_adjustment"
  data:       JSON
  created_at: Float
}
```

### Destination（地點）

```graphql
type Destination {
  id:                  ID!
  account_id:          Int!
  status:              Status!
  name:                String!
  address:             String!
  lat:                 String!
  lng:                 String!
  data:                JSON     # 擴充欄位，見下方說明
  created_at:          Float
  updated_at:          Float
  comment_for_account: String
}
```

`data` 常用欄位（由前端自行定義放入）：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `is_depot` | boolean | 是否為倉庫（出發點） |
| `time_window` | `[{start, end}]` | 可接受時間窗，以分鐘計（0 = 00:00） |
| `operation_time` | number | 預計停留分鐘數 |
| `demand` | number | 需求量 |

### CustomVehicleType（自訂車輛類型）

```graphql
type CustomVehicleType {
  id:                  ID!
  account_id:          Int!
  status:              Status!
  name:                String!
  capacity:            Int!     # 最大載重/容積，單位自訂
  data:                JSON
  created_at:          Float
  updated_at:          Float
  comment_for_account: String
}
```

### Vehicle（車輛）

```graphql
type Vehicle {
  id:                  ID!
  account_id:          Int!
  status:              Status!
  vehicle_number:      String!
  vehicle_type:        Int!               # 對應 CustomVehicleType.id
  depot_id:            Int                # 預設出發地，對應 Destination.id
  data:                JSON
  created_at:          Float
  updated_at:          Float
  comment_for_account: String
  vehicleTypeInfo:     CustomVehicleType  # field resolver
  depot:               Destination        # field resolver
}
```

`data` 常用欄位：

| 欄位 | 型別 | 說明 |
|------|------|------|
| `max_distance` | number | 最大行駛距離（公尺），0 = 無限制 |
| `max_working_time` | number | 最長工時（分鐘），0 = 無限制 |

### Order（訂單）

```graphql
type Order {
  id:                   ID!
  account_id:           Int!
  status:               Status!
  data:                 JSON
  created_at:           Float
  updated_at:           Float
  destination_snapshot: JSON!   # 建立當下的地點快照
  vehicle_snapshot:     JSON!   # 建立當下的車輛快照
  comment_for_account:  String
  computes:             [Compute!]!  # field resolver
}
```

> **快照設計說明**：訂單建立後，地點與車輛的資料若有異動，快照不會跟著變。計算引擎會以快照為準。

### Compute（計算任務）

```graphql
type Compute {
  id:                  ID!
  account_id:          Int!
  order_id:            Int!
  status:              Status!
  compute_status:      ComputeStatus!
  start_time:          Float
  end_time:            Float
  fail_reason:         String
  data:                JSON
  created_at:          Float
  updated_at:          Float
  comment_for_account: String
  routes:              [Route!]!  # field resolver，計算完成後才有資料
}
```

### Route（路線）

```graphql
type Route {
  id:             ID!
  compute_id:     Int!
  vehicle_id:     Int!
  status:         Status!
  total_distance: Int!    # 公尺
  total_time:     Int!    # 分鐘
  total_load:     Int!
  created_at:     Float
  vehicle:        Vehicle      # field resolver
  stops:          [RouteStop!]!  # field resolver，已按 sequence 排序
}
```

### RouteStop（路線站點）

```graphql
type RouteStop {
  id:             ID!
  route_id:       Int!
  destination_id: Int!
  sequence:       Int!          # 站序，0 = 出發倉庫
  arrival_time:   Int!          # 抵達時間（分鐘，距當天 00:00）
  demand:         Int!
  created_at:     Float
  destination:    Destination   # field resolver
}
```

---

## Query

所有查詢（除了 `me`）都需要登入，且只會回傳**自己帳號的資料**。

```graphql
type Query {
  # 帳號
  me: Account                                         # 未登入回 null

  # 點數
  pointLogs: [PointLog!]!

  # 地點
  destinations(status: Status): [Destination!]!       # status 不傳則回傳全部
  destination(id: ID!): Destination

  # 車輛類型
  customVehicleTypes(status: Status): [CustomVehicleType!]!
  customVehicleType(id: ID!): CustomVehicleType

  # 車輛
  vehicles(status: Status): [Vehicle!]!
  vehicle(id: ID!): Vehicle

  # 訂單
  orders(status: Status): [Order!]!
  order(id: ID!): Order

  # 計算任務
  computes(orderId: ID, status: ComputeStatus): [Compute!]!
  compute(id: ID!): Compute
}
```

### 查詢範例

**列出所有 active 地點**

```graphql
{
  destinations(status: active) {
    id
    name
    address
    lat
    lng
    data
    comment_for_account
  }
}
```

**取得訂單及其所有計算結果（含路線站點）**

```graphql
{
  order(id: "1") {
    id
    status
    computes {
      id
      compute_status
      routes {
        id
        total_distance
        total_time
        vehicle {
          vehicle_number
          vehicleTypeInfo { name capacity }
        }
        stops {
          sequence
          arrival_time
          demand
          destination {
            name
            address
            lat
            lng
          }
        }
      }
    }
  }
}
```

---

## Mutation

需要 `normal` 以上角色才能執行寫入操作。`just_view` 角色呼叫 Mutation 會得到 `Forbidden`。

```graphql
type Mutation {
  # 帳號
  register(account: String!, email: String!, password: String!, people_name: String!): AuthPayload!
  login(account: String!, password: String!): AuthPayload!

  # 地點
  createDestination(name: String!, address: String!, lat: String!, lng: String!, data: JSON, comment_for_account: String): Destination!
  updateDestination(id: ID!, name: String, address: String, lat: String, lng: String, data: JSON, comment_for_account: String): Destination!
  deleteDestination(id: ID!): Destination!   # 軟刪除

  # 車輛類型
  createCustomVehicleType(name: String!, capacity: Int!, data: JSON, comment_for_account: String): CustomVehicleType!
  updateCustomVehicleType(id: ID!, name: String, capacity: Int, data: JSON, comment_for_account: String): CustomVehicleType!
  deleteCustomVehicleType(id: ID!): CustomVehicleType!   # 軟刪除

  # 車輛
  createVehicle(vehicle_number: String!, vehicle_type: ID!, depot_id: ID, data: JSON, comment_for_account: String): Vehicle!
  updateVehicle(id: ID!, vehicle_number: String, vehicle_type: ID, depot_id: ID, data: JSON, comment_for_account: String): Vehicle!
  deleteVehicle(id: ID!): Vehicle!   # 軟刪除

  # 訂單
  createOrder(destination_snapshot: JSON!, vehicle_snapshot: JSON!, data: JSON, comment_for_account: String): Order!
  deleteOrder(id: ID!): Order!   # 軟刪除

  # 計算任務
  createCompute(order_id: ID!, data: JSON, comment_for_account: String): Compute!
  cancelCompute(id: ID!): Compute!
}
```

### Mutation 說明

| 操作 | 說明 |
|------|------|
| `deleteXxx` | 軟刪除，`status` 變為 `deleted`，資料不會真正刪除 |
| `cancelCompute` | 只能取消自己的 Compute，`compute_status` → `cancelled` |
| `createOrder` | 需傳入地點與車輛的 JSON 快照，建議在建立時從當前資料組合 |

### Mutation 範例

**建立地點（含 data）**

```graphql
mutation {
  createDestination(
    name: "台北倉庫"
    address: "台北市信義區信義路五段7號"
    lat: "25.0330"
    lng: "121.5654"
    data: { is_depot: true, operation_time: 30 }
    comment_for_account: "主要出發點"
  ) {
    id
    name
    status
  }
}
```

> 若在程式碼中動態傳入 `data`，請使用 GraphQL Variables 避免跳脫問題：

```graphql
mutation CreateDest($data: JSON) {
  createDestination(name: "台北倉庫", address: "...", lat: "...", lng: "...", data: $data) {
    id
  }
}
```

**建立訂單（快照）**

```graphql
mutation CreateOrder($ds: JSON!, $vs: JSON!) {
  createOrder(
    destination_snapshot: $ds
    vehicle_snapshot: $vs
    comment_for_account: "2024/02 配送計畫"
  ) {
    id
    status
  }
}
```

Variables：

```json
{
  "ds": {
    "destinations": [
      { "id": "1", "name": "台北倉庫", "lat": "25.0330", "lng": "121.5654", "is_depot": true },
      { "id": "2", "name": "客戶A",    "lat": "25.0418", "lng": "121.5476", "demand": 5 }
    ]
  },
  "vs": {
    "vehicles": [
      { "id": "1", "vehicle_number": "ABC-1234", "capacity": 1000 }
    ]
  }
}
```

**發起計算**

```graphql
mutation {
  createCompute(order_id: "1") {
    id
    compute_status
  }
}
```

計算為非同步，建立後 `compute_status` 為 `initial`，之後會依序變為 `pending → computing → completed / failed`。輪詢方式：

```graphql
{
  compute(id: "1") {
    compute_status
    fail_reason
    routes {
      id
      total_distance
      total_time
      stops { sequence arrival_time destination { name } }
    }
  }
}
```

---

## 錯誤格式

```json
{
  "errors": [
    {
      "message": "Unauthorized",
      "extensions": {
        "code": "INTERNAL_SERVER_ERROR"
      }
    }
  ],
  "data": null
}
```

| 錯誤訊息 | 原因 |
|----------|------|
| `Unauthorized` | 未帶 Token 或 Token 無效 |
| `Forbidden` | 角色權限不足（如 `just_view` 嘗試寫入） |
| `Account not found` | 登入帳號不存在 |
| `Invalid password` | 密碼錯誤 |
| `Destination not found` | 操作的資料不存在，或不屬於當前帳號 |

---

## 資料關聯圖

```
Account
  └─ point_logs: [PointLog]

Destination      ←── Vehicle.depot
CustomVehicleType ←── Vehicle.vehicleTypeInfo

Order
  └─ computes: [Compute]
       └─ routes: [Route]
            ├─ vehicle: Vehicle
            └─ stops: [RouteStop]
                  └─ destination: Destination
```

`→` 表示 field resolver（查詢時自動 JOIN，不需額外請求）。
