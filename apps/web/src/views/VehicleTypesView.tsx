import { useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { useVehicleTypes, useDeleteVehicleType } from '@/hooks/useVehicleTypes'
import VehicleTypeModal from '@/components/vehicle-types/VehicleTypeModal'
import type { VehicleType } from '@/types'

export default function VehicleTypesView() {
  const { data: types = [], isLoading, error, refetch } = useVehicleTypes()
  const deleteType = useDeleteVehicleType()

  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState<VehicleType | null>(null)
  const [deletingType, setDeletingType] = useState<VehicleType | null>(null)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  function openCreate() {
    setEditingType(null)
    setShowModal(true)
  }

  function openEdit(t: VehicleType) {
    setEditingType(t)
    setShowModal(true)
  }

  function confirmDelete(t: VehicleType) {
    setDeletingType(t)
    deleteDialogRef.current?.showModal()
  }

  async function handleDelete() {
    if (!deletingType) return
    await deleteType.mutateAsync(deletingType.id)
    deleteDialogRef.current?.close()
    setDeletingType(null)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">車輛類型</h1>
          <p className="text-base-content/50 text-sm mt-1">
            定義車輛類別，供地點和車輛設定中使用
          </p>
        </div>
        <button className="btn btn-primary gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          新增類型
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

      {/* Empty state */}
      {!isLoading && !error && types.length === 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body items-center text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-base-content/30" />
            </div>
            <h3 className="font-semibold text-base-content/60">尚無車輛類型</h3>
            <p className="text-sm text-base-content/40 max-w-xs mt-1">
              建立車輛類型後，可在地點設定中指定可接受的車型，在車輛設定中指定車輛的類別
            </p>
            <button className="btn btn-primary btn-sm mt-4 gap-2" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5" />
              建立第一個類型
            </button>
          </div>
        </div>
      )}

      {/* Grid of type cards */}
      {!isLoading && !error && types.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {types.map((t) => (
              <div
                key={t.id}
                className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md hover:border-base-300 transition-all"
              >
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                        <Tag className="w-4 h-4 text-base-content/40" />
                      </div>
                      <div>
                        <span className="font-medium text-sm leading-tight">{t.name}</span>
                        <p className="text-xs text-base-content/40 mt-0.5">載貨量：{t.capacity}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        className="btn btn-ghost btn-xs tooltip"
                        data-tip="編輯"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className="btn btn-ghost btn-xs text-error/50 hover:text-error tooltip"
                        data-tip="刪除"
                        onClick={() => confirmDelete(t)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-base-content/40 px-1">
            共 {types.length} 種車輛類型
          </p>
        </>
      )}

      {/* Modal */}
      <VehicleTypeModal
        open={showModal}
        editData={editingType}
        onClose={() => setShowModal(false)}
      />

      {/* Delete Confirm Dialog */}
      <dialog
        ref={deleteDialogRef}
        className="modal"
        onClose={() => setDeletingType(null)}
      >
        <div className="modal-box max-w-sm">
          <h3 className="font-semibold text-base mb-2">確認刪除</h3>
          <p className="text-sm text-base-content/70">
            確定要刪除車輛類型「<strong>{deletingType?.name}</strong>」嗎？<br />
            <span className="text-warning text-xs">注意：刪除後，使用此類型的地點和車輛設定可能受到影響。</span>
          </p>
          <div className="modal-action mt-5 pt-4 border-t border-base-200">
            <button className="btn btn-ghost btn-sm" onClick={() => deleteDialogRef.current?.close()}>
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              disabled={deleteType.isPending}
              onClick={handleDelete}
            >
              {deleteType.isPending && <span className="loading loading-spinner loading-xs" />}
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
