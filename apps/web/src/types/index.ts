export interface TimeWindow {
  start: string // "HH:mm"
  end: string   // "HH:mm"
}

export interface Location {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  timeWindows: TimeWindow[]
  dwellTime: number          // 分鐘
  acceptedVehicleTypes: string[] // VehicleType IDs
  cargoDemand: number
}

export interface Vehicle {
  id: string
  name: string
  licensePlate: string
  vehicleTypeId: string
  distanceLimit: number | null    // null = 無限制（公里）
  workingHoursLimit: number | null // null = 無限制（小時）
  cargoCapacity: number
}

export interface VehicleType {
  id: string
  name: string
  capacity: number
}

export interface LoginCredentials {
  account: string
  password: string
}

export interface RegisterCredentials {
  account: string
  email: string
  password: string
  people_name: string
}

export interface AuthUser {
  id: string
  account: string
  account_role: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

// Order related types
export interface Order {
  id: string
  account_id: number
  status: 'inactive' | 'active' | 'deleted'
  data: Record<string, any> | null
  created_at: number | null
  updated_at: number | null
  destination_snapshot: DestinationSnapshot[]
  vehicle_snapshot: VehicleSnapshot[]
  comment_for_account: string | null
  computes?: Compute[]
}

export interface DestinationSnapshot {
  id: number
  name: string
  address: string
  lat: string
  lng: string
  is_depot?: boolean
  pickup?: number
  delivery?: number
  service_time?: number
  time_window_start?: number
  time_window_end?: number
}

export interface VehicleSnapshot {
  id: number
  vehicle_number: string
  capacity: number
  fixed_cost?: number
}

// Compute related types
export type ComputeStatus = 'initial' | 'pending' | 'computing' | 'completed' | 'failed' | 'cancelled'

export interface Compute {
  id: string
  account_id: number
  order_id: number
  status: 'inactive' | 'active' | 'deleted'
  compute_status: ComputeStatus
  start_time: number | null
  end_time: number | null
  fail_reason: string | null
  data: Record<string, any> | null
  created_at: number | null
  updated_at: number | null
  comment_for_account: string | null
  routes?: Route[]
}

// Route related types
export interface Route {
  id: string
  compute_id: number
  vehicle_id: number
  status: 'inactive' | 'active' | 'deleted'
  total_distance: number  // 公尺
  total_time: number      // 分鐘
  total_load: number      // 載重
  created_at: number | null
  vehicle?: Vehicle
  stops?: RouteStop[]
}

export interface RouteStop {
  id: string
  route_id: number
  destination_id: number
  sequence: number        // 停靠順序（從 0 開始）
  arrival_time: number    // 抵達時間（分鐘，從 00:00 開始）
  demand: number          // 需求量
  created_at: number | null
  destination?: Location
}
