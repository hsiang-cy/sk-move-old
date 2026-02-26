import { useRef, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { useLocations, useDeleteLocation } from '@/hooks/useLocations'
import { useVehicleTypes } from '@/hooks/useVehicleTypes'
import LocationFormModal from '@/components/locations/LocationFormModal'
import { formatTimeWindow } from '@/lib/utils'
import type { Location } from '@/types'

export default function LocationsView() {
  const { data: locations = [], isLoading, error, refetch } = useLocations()
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const deleteLocation = useDeleteLocation()

  const [showModal, setShowModal] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  function getTypeName(id: string) {
    return vehicleTypes.find((t) => t.id === id)?.name ?? id
  }

  function openCreate() {
    setEditingLocation(null)
    setShowModal(true)
  }

  function openEdit(loc: Location) {
    setEditingLocation(loc)
    setShowModal(true)
  }

  function confirmDelete(loc: Location) {
    setDeletingLocation(loc)
    deleteDialogRef.current?.showModal()
  }

  async function handleDelete() {
    if (!deletingLocation) return
    await deleteLocation.mutateAsync(deletingLocation.id)
    deleteDialogRef.current?.close()
    setDeletingLocation(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">地點管理</h1>
          <p className="text-base-content/50 text-sm mt-1">新增與管理所有配送地點</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          新增地點
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <span className="loading loading-spinner loading-md text-primary" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="alert alert-error">
          <span>{error.message}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => refetch()}>重試</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="border-b border-base-200 bg-base-50 text-xs text-base-content/60 uppercase tracking-wider">
                  <th className="font-semibold">地點名稱</th>
                  <th className="font-semibold">地址</th>
                  <th className="font-semibold">經緯度</th>
                  <th className="font-semibold">可收貨時窗</th>
                  <th className="font-semibold">停留時間</th>
                  <th className="font-semibold">可接受車型</th>
                  <th className="font-semibold">需求量</th>
                  <th className="font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                        <MapPin className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">尚無地點</p>
                        <p className="text-sm mt-1">點擊右上角「新增地點」開始建立</p>
                      </div>
                    </td>
                  </tr>
                ) : locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-base-50 border-b border-base-100 last:border-0">
                    <td className="font-medium">{loc.name}</td>
                    <td className="max-w-48">
                      <span className="block truncate text-sm text-base-content/70" title={loc.address}>
                        {loc.address}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-base-content/50 font-mono">
                        {loc.latitude.toFixed(4)},<br />{loc.longitude.toFixed(4)}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        {loc.timeWindows.map((tw, i) => (
                          <span key={i} className="badge badge-ghost badge-sm text-xs font-normal">
                            {formatTimeWindow(tw)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-sm">{loc.dwellTime} 分</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {loc.acceptedVehicleTypes.map((typeId) => (
                          <span key={typeId} className="badge badge-outline badge-sm text-xs">
                            {getTypeName(typeId)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-sm font-medium">{loc.cargoDemand}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip="編輯"
                          onClick={() => openEdit(loc)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error/60 hover:text-error tooltip"
                          data-tip="刪除"
                          onClick={() => confirmDelete(loc)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {locations.length > 0 && (
            <div className="px-4 py-2.5 border-t border-base-200 text-xs text-base-content/40">
              共 {locations.length} 筆地點
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <LocationFormModal
        open={showModal}
        editData={editingLocation}
        onClose={() => setShowModal(false)}
      />

      {/* Delete Confirm Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="modal"
        onClose={() => setDeletingLocation(null)}
      >
        <div className="modal-box max-w-sm">
          <h3 className="font-semibold text-base mb-2">確認刪除</h3>
          <p className="text-sm text-base-content/70">
            確定要刪除地點「<strong>{deletingLocation?.name}</strong>」嗎？<br />
            此操作無法復原。
          </p>
          <div className="modal-action mt-5 pt-4 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={() => deleteDialogRef.current?.close()}>
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              disabled={deleteLocation.isPending}
              onClick={handleDelete}
            >
              {deleteLocation.isPending && <span className="loading loading-spinner loading-xs" />}
              確認刪除
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>關閉</button>
        </form>
      </dialog>
    </div>
  )
}
