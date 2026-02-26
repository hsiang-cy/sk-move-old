import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useVehicleTypes } from '@/hooks/useVehicleTypes'
import { useCreateLocation, useUpdateLocation } from '@/hooks/useLocations'
import type { Location } from '@/types'

interface Props {
  open: boolean
  editData?: Location | null
  onClose: () => void
}

type FormData = Omit<Location, 'id'>

function defaultForm(): FormData {
  return {
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    timeWindows: [{ start: '09:00', end: '17:00' }],
    dwellTime: 15,
    acceptedVehicleTypes: [],
    cargoDemand: 0,
  }
}

export default function LocationFormModal({ open, editData, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { data: vehicleTypes = [] } = useVehicleTypes()
  const createLocation = useCreateLocation()
  const updateLocation = useUpdateLocation()

  const [form, setForm] = useState<FormData>(defaultForm)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSubmitError(null)
      setForm(editData ? {
        name: editData.name,
        address: editData.address,
        latitude: editData.latitude,
        longitude: editData.longitude,
        timeWindows: editData.timeWindows.map((tw) => ({ ...tw })),
        dwellTime: editData.dwellTime,
        acceptedVehicleTypes: [...editData.acceptedVehicleTypes],
        cargoDemand: editData.cargoDemand,
      } : defaultForm())
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [open, editData])

  function addTimeWindow() {
    setForm((f) => ({ ...f, timeWindows: [...f.timeWindows, { start: '09:00', end: '17:00' }] }))
  }

  function removeTimeWindow(index: number) {
    setForm((f) => ({ ...f, timeWindows: f.timeWindows.filter((_, i) => i !== index) }))
  }

  function updateTimeWindow(index: number, field: 'start' | 'end', value: string) {
    setForm((f) => ({
      ...f,
      timeWindows: f.timeWindows.map((tw, i) => i === index ? { ...tw, [field]: value } : tw),
    }))
  }

  function toggleType(id: string) {
    setForm((f) => ({
      ...f,
      acceptedVehicleTypes: f.acceptedVehicleTypes.includes(id)
        ? f.acceptedVehicleTypes.filter((x) => x !== id)
        : [...f.acceptedVehicleTypes, id],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.timeWindows.length === 0) { setSubmitError('至少需要一個時窗'); return }
    if (form.acceptedVehicleTypes.length === 0) { setSubmitError('至少選擇一種可接受的車輛類型'); return }

    setSubmitError(null)
    try {
      if (editData) {
        await updateLocation.mutateAsync({ id: editData.id, data: form })
      } else {
        await createLocation.mutateAsync(form)
      }
      onClose()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '儲存失敗，請稍後再試')
    }
  }

  const isSubmitting = createLocation.isPending || updateLocation.isPending

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box w-full max-w-2xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{editData ? '編輯地點' : '新增地點'}</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">地點名稱 <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例：台北倉庫"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Address */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">地址 <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="例：台北市信義區信義路五段7號"
              className="input input-bordered w-full"
              required
            />
          </div>

          {/* Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label pt-0">
                <span className="label-text font-medium">緯度 <span className="text-error">*</span></span>
              </label>
              <input
                type="number"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: Number(e.target.value) }))}
                step="any"
                min="-90"
                max="90"
                placeholder="25.0330"
                className="input input-bordered w-full"
                required
              />
            </div>
            <div className="form-control">
              <label className="label pt-0">
                <span className="label-text font-medium">經度 <span className="text-error">*</span></span>
              </label>
              <input
                type="number"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: Number(e.target.value) }))}
                step="any"
                min="-180"
                max="180"
                placeholder="121.5654"
                className="input input-bordered w-full"
                required
              />
            </div>
          </div>

          {/* Time Windows */}
          <div className="form-control">
            <div className="flex items-center justify-between mb-1.5">
              <span className="label-text font-medium">
                可收貨時窗 <span className="text-error">*</span>
              </span>
              <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={addTimeWindow}>
                <Plus className="w-3 h-3" />新增時段
              </button>
            </div>
            <div className="space-y-2">
              {form.timeWindows.map((tw, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={tw.start}
                    onChange={(e) => updateTimeWindow(i, 'start', e.target.value)}
                    className="input input-bordered input-sm flex-1"
                    required
                  />
                  <span className="text-base-content/40 text-sm select-none">至</span>
                  <input
                    type="time"
                    value={tw.end}
                    onChange={(e) => updateTimeWindow(i, 'end', e.target.value)}
                    className="input input-bordered input-sm flex-1"
                    required
                  />
                  {form.timeWindows.length > 1 ? (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm btn-circle text-base-content/30 hover:text-error"
                      onClick={() => removeTimeWindow(i)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dwell Time */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">
                預計停留時間 <span className="text-error">*</span>
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.dwellTime}
                onChange={(e) => setForm((f) => ({ ...f, dwellTime: Number(e.target.value) }))}
                min="1"
                placeholder="15"
                className="input input-bordered w-32"
                required
              />
              <span className="text-sm text-base-content/50">分鐘（含裝卸貨時間）</span>
            </div>
          </div>

          {/* Accepted Vehicle Types */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">
                可接受車輛類型 <span className="text-error">*</span>
              </span>
            </label>
            {vehicleTypes.length > 0 ? (
              <div className="border border-base-300 rounded-xl p-3 flex flex-wrap gap-2">
                {vehicleTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border transition-all select-none ${
                      form.acceptedVehicleTypes.includes(type.id)
                        ? 'border-primary bg-primary text-primary-content font-medium'
                        : 'border-base-300 hover:border-base-content/30 bg-base-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={form.acceptedVehicleTypes.includes(type.id)}
                      onChange={() => toggleType(type.id)}
                    />
                    <span className="text-sm">{type.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-base-300 rounded-xl p-4 text-center text-sm text-base-content/40">
                尚未建立任何車輛類型，請先至{' '}
                <Link to="/vehicle-types" className="link link-primary" onClick={onClose}>
                  車輛類型
                </Link>{' '}
                頁面新增
              </div>
            )}
          </div>

          {/* Cargo Demand */}
          <div className="form-control">
            <label className="label pt-0">
              <span className="label-text font-medium">
                貨物需求量 <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="number"
              value={form.cargoDemand}
              onChange={(e) => setForm((f) => ({ ...f, cargoDemand: Number(e.target.value) }))}
              min="0"
              step="any"
              placeholder="0"
              className="input input-bordered w-40"
              required
            />
            <label className="label pb-0">
              <span className="label-text-alt text-base-content/40">單位自訂（例：公斤、箱、件）</span>
            </label>
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
              {editData ? '更新地點' : '新增地點'}
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
