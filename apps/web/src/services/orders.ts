import { gql } from './api'
import type { Order, DestinationSnapshot, VehicleSnapshot } from '@/types'

const FIELDS = `
  id
  account_id
  status
  data
  created_at
  updated_at
  destination_snapshot
  vehicle_snapshot
  comment_for_account
`

export const ordersService = {
  /**
   * 取得所有有效訂單列表
   * 查詢 orders(status: active) 並包含快照資料
   */
  async getAll(): Promise<Order[]> {
    const data = await gql<{ orders: Order[] }>(
      `{ orders(status: active) { ${FIELDS} } }`,
    )
    return data.orders
  },

  /**
   * 取得單一訂單詳情
   * 查詢 order(id: $id) 並包含完整快照資料
   * 可選：包含關聯的計算任務數量
   */
  async getById(id: string): Promise<Order | null> {
    const data = await gql<{ order: Order | null }>(
      `query GetOrder($id: ID!) {
        order(id: $id) {
          ${FIELDS}
        }
      }`,
      { id },
    )
    return data.order
  },

  /**
   * 建立新訂單
   * mutation: createOrder(destination_snapshot: JSON!, vehicle_snapshot: JSON!, data: JSON, comment_for_account: String)
   * 驗證快照資料完整性（至少 1 個地點和車輛）
   */
  async create(data: {
    destination_snapshot: DestinationSnapshot[]
    vehicle_snapshot: VehicleSnapshot[]
    comment_for_account?: string
  }): Promise<Order> {
    // 驗證快照資料
    if (data.destination_snapshot.length === 0) {
      throw new Error('至少需要一個地點')
    }
    if (data.vehicle_snapshot.length === 0) {
      throw new Error('至少需要一輛車輛')
    }

    const result = await gql<{ createOrder: Order }>(
      `mutation CreateOrder(
        $destination_snapshot: JSON!,
        $vehicle_snapshot: JSON!,
        $comment_for_account: String
      ) {
        createOrder(
          destination_snapshot: $destination_snapshot,
          vehicle_snapshot: $vehicle_snapshot,
          comment_for_account: $comment_for_account
        ) {
          ${FIELDS}
        }
      }`,
      {
        destination_snapshot: data.destination_snapshot,
        vehicle_snapshot: data.vehicle_snapshot,
        comment_for_account: data.comment_for_account || null,
      },
    )
    return result.createOrder
  },

  /**
   * 軟刪除訂單
   * mutation: deleteOrder(id: ID!)
   * 更新訂單狀態為 'deleted'
   */
  async delete(id: string): Promise<void> {
    await gql(
      `mutation DeleteOrder($id: ID!) {
        deleteOrder(id: $id) {
          id
        }
      }`,
      { id },
    )
  },
}
