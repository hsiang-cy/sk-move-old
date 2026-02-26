import { gql } from './api'
import type { Vehicle } from '@/types'

type ApiVehicle = {
  id: string
  vehicle_number: string
  vehicle_type: number
  data: {
    name?: string
    max_distance?: number    // 公尺，0 = 無限制
    max_working_time?: number // 分鐘，0 = 無限制
    cargo_capacity?: number
  } | null
}

const FIELDS = `id vehicle_number vehicle_type data`

function toVehicle(v: ApiVehicle): Vehicle {
  const maxDist = v.data?.max_distance ?? 0
  const maxTime = v.data?.max_working_time ?? 0
  return {
    id: v.id,
    name: v.data?.name ?? v.vehicle_number,
    licensePlate: v.vehicle_number,
    vehicleTypeId: String(v.vehicle_type),
    distanceLimit: maxDist === 0 ? null : maxDist / 1000,
    workingHoursLimit: maxTime === 0 ? null : maxTime / 60,
    cargoCapacity: v.data?.cargo_capacity ?? 0,
  }
}

function toVars(v: Omit<Vehicle, 'id'>) {
  return {
    vehicle_number: v.licensePlate,
    vehicle_type: v.vehicleTypeId,
    data: {
      name: v.name,
      max_distance: v.distanceLimit === null ? 0 : Math.round(v.distanceLimit * 1000),
      max_working_time: v.workingHoursLimit === null ? 0 : Math.round(v.workingHoursLimit * 60),
      cargo_capacity: v.cargoCapacity,
    },
  }
}

export const vehiclesService = {
  async getAll(): Promise<Vehicle[]> {
    const data = await gql<{ vehicles: ApiVehicle[] }>(
      `{ vehicles(status: active) { ${FIELDS} } }`,
    )
    return data.vehicles.map(toVehicle)
  },

  async create(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const data = await gql<{ createVehicle: ApiVehicle }>(
      `mutation CreateVehicle($vehicle_number: String!, $vehicle_type: ID!, $data: JSON) {
        createVehicle(vehicle_number: $vehicle_number, vehicle_type: $vehicle_type, data: $data) {
          ${FIELDS}
        }
      }`,
      toVars(vehicle),
    )
    return toVehicle(data.createVehicle)
  },

  async update(id: string, vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const data = await gql<{ updateVehicle: ApiVehicle }>(
      `mutation UpdateVehicle($id: ID!, $vehicle_number: String, $vehicle_type: ID, $data: JSON) {
        updateVehicle(id: $id, vehicle_number: $vehicle_number, vehicle_type: $vehicle_type, data: $data) {
          ${FIELDS}
        }
      }`,
      { id, ...toVars(vehicle) },
    )
    return toVehicle(data.updateVehicle)
  },

  async remove(id: string): Promise<void> {
    await gql(
      `mutation DeleteVehicle($id: ID!) { deleteVehicle(id: $id) { id } }`,
      { id },
    )
  },
}
