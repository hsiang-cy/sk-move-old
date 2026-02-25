import uvicorn
import asyncio
from fastapi import FastAPI
from vrp.api.router import router as vrp_router
from vrp.api.router_v2 import router_v2
from vrp.solvers.ortools import solve_vrp_logic
from vrp.solvers.ortools_v2 import solve_vrp_v2_logic

# ── 1. 建立一個模擬 Modal 行為的代理類別 ──
# 因為 router.py 呼叫了 solve_vrp.spawn.aio(compute_id, request)
# 我們在本地用 asyncio 模擬這種非同步啟動的行為
class LocalSolverProxy:
    def __init__(self, logic_fn):
        self.spawn = self._SpawnProxy(logic_fn)

    class _SpawnProxy:
        def __init__(self, logic_fn):
            self._logic_fn = logic_fn

        async def aio(self, compute_id, data):
            print(f"[Local] 啟動 VRP 求解任務: compute_id={compute_id}")
            asyncio.create_task(self._run_logic(compute_id, data))

        async def _run_logic(self, compute_id, data):
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._logic_fn, compute_id, data)

# ── 2. 初始化 FastAPI ──
app = FastAPI(title="VRP Solver Local Dev")
app.state.solve_vrp = LocalSolverProxy(solve_vrp_logic)
app.state.solve_vrp_v2 = LocalSolverProxy(solve_vrp_v2_logic)
app.include_router(vrp_router)
app.include_router(router_v2)

if __name__ == "__main__":
    print("🚀 正在本地啟動 VRP API (純本地模式，不使用 Modal)...")
    print("URL: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
