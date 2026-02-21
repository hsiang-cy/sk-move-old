import uvicorn
import asyncio
from fastapi import FastAPI
from vrp.router import router as vrp_router
from vrp.solver import solve_vrp_logic

# ── 1. 建立一個模擬 Modal 行為的代理類別 ──
# 因為 router.py 呼叫了 solve_vrp.spawn.aio(job_id, request)
# 我們在本地用 asyncio 模擬這種非同步啟動的行為
class LocalSolverProxy:
    class SpawnProxy:
        async def aio(self, job_id, data):
            # 在本地直接啟動一個背景任務
            print(f"[Local] 啟動 VRP 求解任務: {job_id}")
            asyncio.create_task(self._run_logic(job_id, data))
        
        async def _run_logic(self, job_id, data):
            # 呼叫原本的 solver 邏輯
            # 因為 solver 是同步的，我們在 thread 中執行避免阻塞 FastAPI
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, solve_vrp_logic, job_id, data)

    def __init__(self):
        self.spawn = self.SpawnProxy()

# ── 2. 初始化 FastAPI ──
app = FastAPI(title="VRP Solver Local Dev")
app.state.solve_vrp = LocalSolverProxy()
app.include_router(vrp_router)

if __name__ == "__main__":
    print("🚀 正在本地啟動 VRP API (純本地模式，不使用 Modal)...")
    print("URL: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
