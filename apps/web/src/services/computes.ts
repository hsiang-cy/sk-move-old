import { gql } from './api'
import type { Compute, Route } from '@/types'

const COMPUTE_FIELDS = `
  id
  account_id
  order_id
  status
  compute_status
  start_time
  end_time
  fail_reason
  data
  created_at
  updated_at
  comment_for_account
`

const ROUTE_FIELDS = `
  id
  compute_id
  vehicle_id
  status
  total_distance
  total_time
  total_load
  created_at
  vehicle {
    id
    name
    licensePlate
    vehicleTypeId
    cargoCapacity
  }
  stops {
    id
    route_id
    destination_id
    sequence
    arrival_time
    demand
    created_at
    destination {
      id
      name
      address
      latitude
      longitude
    }
  }
`

export const computesService = {
  /**
   * 取得計算任務列表
   * 查詢 computes(orderId: $orderId) 並支援可選的 orderId 篩選
   */
  async getAll(orderId?: string): Promise<Compute[]> {
    const query = orderId
      ? `query GetComputes($orderId: ID!) {
          computes(orderId: $orderId) {
            ${COMPUTE_FIELDS}
          }
        }`
      : `{ computes { ${COMPUTE_FIELDS} } }`

    const data = await gql<{ computes: Compute[] }>(
      query,
      orderId ? { orderId } : undefined,
    )
    return data.computes
  },

  /**
   * 取得單一計算任務詳情
   * 查詢 compute(id: $id) 並包含完整的路線和停靠點資料（如果已完成）
   * 包含關聯的訂單資訊（可選）
   */
  async getById(id: string): Promise<Compute | null> {
    const data = await gql<{ compute: Compute | null }>(
      `query GetCompute($id: ID!) {
        compute(id: $id) {
          ${COMPUTE_FIELDS}
          routes {
            ${ROUTE_FIELDS}
          }
        }
      }`,
      { id },
    )
    return data.compute
  },

  /**
   * 建立計算任務
   * mutation: createCompute(order_id: ID!, data: JSON, comment_for_account: String)
   * 初始狀態設為 'pending'
   */
  async create(data: {
    order_id: string
    data?: Record<string, any>
    comment_for_account?: string
  }): Promise<Compute> {
    const result = await gql<{ createCompute: Compute }>(
      `mutation CreateCompute(
        $order_id: ID!,
        $data: JSON,
        $comment_for_account: String
      ) {
        createCompute(
          order_id: $order_id,
          data: $data,
          comment_for_account: $comment_for_account
        ) {
          ${COMPUTE_FIELDS}
        }
      }`,
      {
        order_id: data.order_id,
        data: data.data || null,
        comment_for_account: data.comment_for_account || null,
      },
    )
    return result.createCompute
  },

  /**
   * 取消計算任務
   * mutation: cancelCompute(id: ID!)
   * 驗證狀態是否允許取消（pending 或 computing）
   */
  async cancel(id: string): Promise<Compute> {
    const result = await gql<{ cancelCompute: Compute }>(
      `mutation CancelCompute($id: ID!) {
        cancelCompute(id: $id) {
          ${COMPUTE_FIELDS}
        }
      }`,
      { id },
    )
    return result.cancelCompute
  },

  /**
   * 取得計算任務的所有路線
   * 查詢 compute(id: $computeId) { routes { ... } }
   * 包含每條路線的停靠點資料
   * 包含關聯的車輛和地點資訊
   */
  async getRoutes(computeId: string): Promise<Route[]> {
    const data = await gql<{ compute: { routes: Route[] } | null }>(
      `query GetComputeRoutes($computeId: ID!) {
        compute(id: $computeId) {
          routes {
            ${ROUTE_FIELDS}
          }
        }
      }`,
      { computeId },
    )
    return data.compute?.routes || []
  },
}
