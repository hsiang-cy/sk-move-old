from fastapi import APIRouter, HTTPException
import uuid
import modal

from vrp.schema import VRPRequest

router = APIRouter(prefix="/vrp", tags=["VRP"])


@router.post("/solve", status_code=202)
async def start_computation(request: VRPRequest):
    n = len(request.locations)
    if len(request.distance_matrix) != n:
        raise HTTPException(
            status_code=422,
            detail=f"distance_matrix 應為 {n}x{n}，但收到 {len(request.distance_matrix)} 列",
        )
    if len(request.time_matrix) != n:
        raise HTTPException(
            status_code=422,
            detail=f"time_matrix 應為 {n}x{n}，但收到 {len(request.time_matrix)} 列",
        )

    job_id = str(uuid.uuid4())

    # ── 觸發 Modal 非同步任務 (動態查找函式) ──
    try:
        solve_vrp = modal.Function.from_name("ortools-vrp-solver", "solve_vrp")
        solve_vrp.spawn(job_id, request)
    except Exception as e:
        # 如果 serving 模式下 from_name 不穩定，可以改用相對穩定的方式
        print(f"Modal 任務啟動失敗: {e}")
        # 備選方案：如果是 modal serve，可以使用當前的 app 實例
        # 但在 FastAPI 端點內通常建議用 from_name 或是在 main.py 注入

    return {
        "message": "VRP 計算已啟動 (Modal Serverless)",
        "job_id": job_id,
    }
