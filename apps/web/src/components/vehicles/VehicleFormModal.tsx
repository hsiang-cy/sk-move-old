import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useVehicleTypes } from '@/hooks/useVehicleTypes'
import { useCreateVehicle, useUpdateVehicle } from '@/hooks/useVehicles'
import type { Vehicle } from '@/types'

interface Props {
  open: boolean
  editData?: Vehicle | null
  onClose: () => void
}

type FormData = Omit<Vehicle, 'id'>

function defaultForm(): FormData {
  return {
    name: '',
    licensePlate: '',
    vehicleTypeId: '',
    distanceLimit: null,
    workingHoursLimit: null,
    cargoCapacity: 0,
  }
}

export default function VehicleFormModal({ open, editData, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const createVehicle = useCreateVehicle()
  const updateVehicle = useUpdateVehicle()

  const [form, setForm] = useState<FormData>(defaultForm)
  const [unlimitedDistance, setUnlimitedDistance] = useState(true)
  const [unlimitedHours, setUnlimitedHours] = useState(true)
  const [distanceLimitInput, setDistanceLimitInput] = useState(0)
  const [hoursLimitInput, setHoursLimitInput] = useState(8)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      if (editData) {
        setForm({
          name: editData.name,
          licensePlate: editData.licensePlate,
          vehicleTypeId: editData.vehicleTypeId,
          distanceLimit: editData.distanceLimit,
          workingHoursLimit: editData.workingHoursLimit,
          cargoCapacity: editData.cargoCapacity,
        })
        setUnlimitedDistance(editData.distanceLimit === null)
        setUnlimitedHours(editData.workingHoursLimit === null)
        setDistanceLimitInput(editData.distanceLimit ?? 0)
        setHoursLimitInput(editData.workingHoursLimit ?? 8)
      } else {
        setForm(defaultForm())
        setUnlimitedDistance(true)
        setUnlimitedHours(true)
        setDistanceLimitInput(0)
        setHoursLimitInput(8)
      }
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open, editData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    const payload: FormData = {
      ...form,
      distanceLimit: unlimitedDistance ? null : distanceLimitInput,
      workingHoursLimit: unlimitedHours ? null : hoursLimitInput,
    }

    try {
      if (editData) {
        await updateVehicle.mutateAsync({ id: editData.id, data: payload })
      } else {
        await createVehicle.mutateAsync(payload)
      }
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '儲存失敗，請稍後再試')
    }
  }

  const isSubmitting = createVehicle.isPending || updateVehicle.isPending

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box w-full max-w-lg max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{editData ? '編輯車輛' : '新增車輛'}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">車輛名稱 <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例：北區小貨車A"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* License Plate */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">車牌號碼 <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              value={form.licensePlate}
              onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
              placeholder="例：ABC-1234"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Vehicle Type */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">車輛類型 <span className="text-error">*</span></span>
            </label>
            <select
              value={form.vehicleTypeId}
              onChange={(e) => setForm((f) => ({ ...f, vehicleTypeId: e.target.value }))}
              className="select select-bordered w-full"
              required
            >
              <option value="" disabled>請選擇車輛類型</option>
              {vehicleTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
            {vehicleTypes.length === 0 && (
              <label className="label pb-0">
                <span className="label-text-alt text-warning">
                  尚未建立任何車輛類型，請先至「車輛類型」頁面新增
                </span>
              </label>
            )}
          </div>

          {/* Cargo Capacity */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">載貨量 <span className="text-error">*</span></span>
            </label>
            <input
              type="number"
              value={form.cargoCapacity}
              onChange={(e) => setForm((f) => ({ ...f, cargoCapacity: Number(e.target.value) }))}
              min="0"
              step="any"
              placeholder="0"
              className="input input-bordered w-40"
              required
            />
            <label className="label pb-0">
              <span className="label-text-alt text-base-content/40">單位自訂（例：公斤、箱）</span>
            </label>
          </div>

          {/* Distance Limit */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">行駛距離限制</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unlimitedDistance}
                  onChange={(e) => setUnlimitedDistance(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">無限制</span>
              </label>
              {!unlimitedDistance && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={distanceLimitInput}
                    onChange={(e) => setDistanceLimitInput(Number(e.target.value))}
                    min="1"
                    placeholder="500"
                    className="input input-bordered input-sm w-32"
                  />
                  <span className="text-sm text-base-content/50">公里</span>
                </div>
              )}
            </div>
          </div>

          {/* Working Hours Limit */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">工時限制</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unlimitedHours}
                  onChange={(e) => setUnlimitedHours(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">無限制</span>
              </label>
              {!unlimitedHours && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={hoursLimitInput}
                    onChange={(e) => setHoursLimitInput(Number(e.target.value))}
                    min="0.5"
                    step="0.5"
                    placeholder="8"
                    className="input input-bordered input-sm w-32"
                  />
                  <span className="text-sm text-base-content/50">小時</span>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="alert alert-error py-2.5 text-sm">
              <span>{submitError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action mt-2 pt-2 border-t border-base-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting && <span className="loading loading-spinner loading-xs" />}
              {editData ? '更新車輛' : '新增車輛'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>關閉</button>
      </form>
    </dialog>
  )
}
