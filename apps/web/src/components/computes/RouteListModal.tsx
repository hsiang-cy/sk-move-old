import type { Compute } from '@/types'
import { useComputeRoutes } from '@/hooks/useComputes'

interface RouteListModalProps {
  open: boolean
  compute: Compute | null
  onClose: () => void
}

function formatArrivalTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function RouteListModal({ open, compute, onClose }: RouteListModalProps) {
  const { data: routes = [], isLoading } = useComputeRoutes(
    compute?.id ?? '',
    compute?.compute_status,
  )

  if (!open || !compute) return null

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[80vh] overflow-y-auto">
        <h3 className="font-semibold text-lg mb-1">路線結果</h3>
        <p className="text-sm text-base-content/50 mb-4">計算 ID：{compute.id}</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-12 text-base-content/40">
            <p>無路線資料</p>
          </div>
        ) : (
          <div className="space-y-6">
            {routes.map((route, idx) => (
              <div key={route.id} className="border border-base-200 rounded-lg overflow-hidden">
                {/* Route header */}
                <div className="bg-base-50 px-4 py-3 flex flex-wrap gap-4 items-center">
                  <span className="font-semibold text-sm">
                    路線 {idx + 1}
                    {route.vehicle && (
                      <span className="ml-2 font-mono text-base-content/70">
                        {route.vehicle.licensePlate}
                      </span>
                    )}
                    {route.vehicle?.name && (
                      <span className="ml-1 text-base-content/50">（{route.vehicle.name}）</span>
                    )}
                  </span>
                  <span className="text-xs text-base-content/50">
                    總距離：{(route.total_distance / 1000).toFixed(1)} 公里
                  </span>
                  <span className="text-xs text-base-content/50">
                    總時間：{Math.floor(route.total_time / 60)}h{route.total_time % 60}m
                  </span>
                  <span className="text-xs text-base-content/50">
                    總載重：{route.total_load}
                  </span>
                </div>

                {/* Stops table */}
                <div className="overflow-x-auto">
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="text-xs text-base-content/60 uppercase tracking-wider">
                        <th className="w-10">序</th>
                        <th>地點名稱</th>
                        <th>地址</th>
                        <th>到達時間</th>
                        <th>需求量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(route.stops ?? [])
                        .slice()
                        .sort((a, b) => a.sequence - b.sequence)
                        .map((stop) => (
                          <tr key={stop.id} className="hover:bg-base-50">
                            <td className="text-center text-base-content/50">{stop.sequence + 1}</td>
                            <td className="font-medium">
                              {stop.destination?.name ?? `地點 ${stop.destination_id}`}
                            </td>
                            <td className="text-sm text-base-content/60 max-w-xs truncate">
                              {stop.destination?.address ?? '-'}
                            </td>
                            <td className="font-mono text-sm">{formatArrivalTime(stop.arrival_time)}</td>
                            <td>{stop.demand}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>關閉</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>關閉</button>
      </form>
    </dialog>
  )
}
