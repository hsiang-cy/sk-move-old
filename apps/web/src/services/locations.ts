import { gql } from './api'
import type { Location } from '@/types'

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0')
  const m = (minutes % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

type ApiDestination = {
  id: string
  name: string
  address: string
  lat: string
  lng: string
  data: {
    time_window?: Array<{ start: number; end: number }>
    operation_time?: number
    demand?: number
    accepted_vehicle_types?: string[]
  } | null
}

const FIELDS = `id name address lat lng data`

function toLocation(d: ApiDestination): Location {
  return {
    id: d.id,
    name: d.name,
    address: d.address,
    latitude: parseFloat(d.lat),
    longitude: parseFloat(d.lng),
    timeWindows: (d.data?.time_window ?? [{ start: 540, end: 1020 }]).map((tw) => ({
      start: minutesToTime(tw.start),
      end: minutesToTime(tw.end),
    })),
    dwellTime: d.data?.operation_time ?? 15,
    acceptedVehicleTypes: d.data?.accepted_vehicle_types ?? [],
    cargoDemand: d.data?.demand ?? 0,
  }
}

function toVars(loc: Omit<Location, 'id'>) {
  return {
    name: loc.name,
    address: loc.address,
    lat: String(loc.latitude),
    lng: String(loc.longitude),
    data: {
      time_window: loc.timeWindows.map((tw) => ({
        start: timeToMinutes(tw.start),
        end: timeToMinutes(tw.end),
      })),
      operation_time: loc.dwellTime,
      demand: loc.cargoDemand,
      accepted_vehicle_types: loc.acceptedVehicleTypes,
    },
  }
}

export const locationsService = {
  async getAll(): Promise<Location[]> {
    const data = await gql<{ destinations: ApiDestination[] }>(
      `{ destinations(status: active) { ${FIELDS} } }`,
    )
    return data.destinations.map(toLocation)
  },

  async create(loc: Omit<Location, 'id'>): Promise<Location> {
    const data = await gql<{ createDestination: ApiDestination }>(
      `mutation CreateDest($name: String!, $address: String!, $lat: String!, $lng: String!, $data: JSON) {
        createDestination(name: $name, address: $address, lat: $lat, lng: $lng, data: $data) {
          ${FIELDS}
        }
      }`,
      toVars(loc),
    )
    return toLocation(data.createDestination)
  },

  async update(id: string, loc: Omit<Location, 'id'>): Promise<Location> {
    const data = await gql<{ updateDestination: ApiDestination }>(
      `mutation UpdateDest($id: ID!, $name: String, $address: String, $lat: String, $lng: String, $data: JSON) {
        updateDestination(id: $id, name: $name, address: $address, lat: $lat, lng: $lng, data: $data) {
          ${FIELDS}
        }
      }`,
      { id, ...toVars(loc) },
    )
    return toLocation(data.updateDestination)
  },

  async remove(id: string): Promise<void> {
    await gql(
      `mutation DeleteDest($id: ID!) { deleteDestination(id: $id) { id } }`,
      { id },
    )
  },
}
