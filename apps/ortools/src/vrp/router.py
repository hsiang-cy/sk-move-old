from fastapi import APIRouter, HTTPException, Request
import uuid

from vrp.schema import VRPRequest

router = APIRouter(prefix="/vrp", tags=["VRP"])


@router.post("/solve", status_code=202)
async def start_computation(request: VRPRequest, req: Request):
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

    solve_vrp = req.app.state.solve_vrp
    await solve_vrp.spawn.aio(job_id, request)

    return {
        "message": "VRP 計算已啟動 (Modal Serverless)",
        "job_id": job_id,
    }
