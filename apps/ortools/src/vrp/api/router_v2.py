from fastapi import APIRouter, HTTPException, Request

from vrp.models.schema_v2 import VRPRequestV2

router_v2 = APIRouter(prefix="/vrp/v2", tags=["VRP v2"])


@router_v2.post("/solve", status_code=202)
async def start_computation_v2(request: VRPRequestV2, req: Request):
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

    solve_vrp_v2 = req.app.state.solve_vrp_v2
    await solve_vrp_v2.spawn.aio(request.compute_id, request)

    return {
        "message": "VRP v2 計算已啟動 (Modal Serverless)",
        "compute_id": request.compute_id,
    }
