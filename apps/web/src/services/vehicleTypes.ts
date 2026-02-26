import { gql } from './api'
import type { VehicleType } from '@/types'

type ApiVehicleType = {
  id: string
  name: string
  capacity: number
}

const FIELDS = `id name capacity`

function toVehicleType(t: ApiVehicleType): VehicleType {
  return { id: t.id, name: t.name, capacity: t.capacity }
}

export const vehicleTypesService = {
  async getAll(): Promise<VehicleType[]> {
    const data = await gql<{ customVehicleTypes: ApiVehicleType[] }>(
      `{ customVehicleTypes(status: active) { ${FIELDS} } }`,
    )
    return data.customVehicleTypes.map(toVehicleType)
  },

  async create(t: Omit<VehicleType, 'id'>): Promise<VehicleType> {
    const data = await gql<{ createCustomVehicleType: ApiVehicleType }>(
      `mutation CreateType($name: String!, $capacity: Int!) {
        createCustomVehicleType(name: $name, capacity: $capacity) {
          ${FIELDS}
        }
      }`,
      { name: t.name, capacity: t.capacity },
    )
    return toVehicleType(data.createCustomVehicleType)
  },

  async update(id: string, t: Omit<VehicleType, 'id'>): Promise<VehicleType> {
    const data = await gql<{ updateCustomVehicleType: ApiVehicleType }>(
      `mutation UpdateType($id: ID!, $name: String, $capacity: Int) {
        updateCustomVehicleType(id: $id, name: $name, capacity: $capacity) {
          ${FIELDS}
        }
      }`,
      { id, name: t.name, capacity: t.capacity },
    )
    return toVehicleType(data.updateCustomVehicleType)
  },

  async remove(id: string): Promise<void> {
    await gql(
      `mutation DeleteType($id: ID!) { deleteCustomVehicleType(id: $id) { id } }`,
      { id },
    )
  },
}
