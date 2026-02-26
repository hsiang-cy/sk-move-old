import { useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Truck } from 'lucide-react'
import { useVehicles, useDeleteVehicle } from '@/hooks/useVehicles'
import { useVehicleTypes } from '@/hooks/useVehicleTypes'
import VehicleFormModal from '@/components/vehicles/VehicleFormModal'
import { formatLimit } from '@/lib/utils'
import type { Vehicle } from '@/types'

export default function VehiclesView() {
  const { data: vehicles = [], isLoading, error, refetch } = useVehicles()
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const deleteVehicle = useDeleteVehicle()

  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  function getTypeName(id: string) {
    return vehicleTypes.find((t) => t.id === id)?.name ?? id
  }

  function openCreate() {
    setEditingVehicle(null)
    setShowModal(true)
  }

  function openEdit(v: Vehicle) {
    setEditingVehicle(v)
    setShowModal(true)
  }

  function confirmDelete(v: Vehicle) {
    setDeletingVehicle(v)
    deleteDialogRef.current?.showModal()
  }

  async function handleDelete() {
    if (!deletingVehicle) return
    await deleteVehicle.mutateAsync(deletingVehicle.id)
    deleteDialogRef.current?.close()
    setDeletingVehicle(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">車輛管理</h1>
          <p className="text-base-content/50 text-sm mt-1">新增與管理所有配送車輛</p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          新增車輛
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
                  <th className="font-semibold">車輛名稱</th>
                  <th className="font-semibold">車牌</th>
                  <th className="font-semibold">車輛類型</th>
                  <th className="font-semibold">載貨量</th>
                  <th className="font-semibold">距離限制</th>
                  <th className="font-semibold">工時限制</th>
                  <th className="font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center py-12 text-base-content/40">
                        <Truck className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">尚無車輛</p>
                        <p className="text-sm mt-1">點擊右上角「新增車輛」開始建立</p>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-base-50 border-b border-base-100 last:border-0">
                    <td className="font-medium">{v.name}</td>
                    <td>
                      <span className="badge badge-ghost badge-sm font-mono text-xs">
                        {v.licensePlate}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-outline badge-sm text-xs">
                        {getTypeName(v.vehicleTypeId)}
                      </span>
                    </td>
                    <td className="text-sm font-medium">{v.cargoCapacity}</td>
                    <td className="text-sm">
                      <span className={v.distanceLimit === null ? 'text-base-content/40' : 'text-base-content'}>
                        {formatLimit(v.distanceLimit, '公里')}
                      </span>
                    </td>
                    <td className="text-sm">
                      <span className={v.workingHoursLimit === null ? 'text-base-content/40' : 'text-base-content'}>
                        {formatLimit(v.workingHoursLimit, '小時')}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button
                          className="btn btn-ghost btn-xs tooltip"
                          data-tip="編輯"
                          onClick={() => openEdit(v)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error/60 hover:text-error tooltip"
                          data-tip="刪除"
                          onClick={() => confirmDelete(v)}
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

          {vehicles.length > 0 && (
            <div className="px-4 py-2.5 border-t border-base-200 text-xs text-base-content/40">
              共 {vehicles.length} 輛車輛
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      <VehicleFormModal
        open={showModal}
        editData={editingVehicle}
        onClose={() => setShowModal(false)}
      />

      {/* Delete Confirm Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="modal"
        onClose={() => setDeletingVehicle(null)}
      >
        <div className="modal-box max-w-sm">
          <h3 className="font-semibold text-base mb-2">確認刪除</h3>
          <p className="text-sm text-base-content/70">
            確定要刪除車輛「<strong>{deletingVehicle?.name}</strong>」嗎？<br />
            此操作無法復原。
          </p>
          <div className="modal-action mt-5 pt-4 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={() => deleteDialogRef.current?.close()}>
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              disabled={deleteVehicle.isPending}
              onClick={handleDelete}
            >
              {deleteVehicle.isPending && <span className="loading loading-spinner loading-xs" />}
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
