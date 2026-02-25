import modal
from fastapi import FastAPI

# ── 1. 定義 Modal 環境 ──
# add_local_python_source 將 vrp 套件直接嵌入 image，不需要手動掛載
image = (
    modal.Image.debian_slim(python_version="3.14")
    .pip_install("uv")
    .run_commands("uv pip install --system ortools 'fastapi[standard]' httpx")
    .add_local_python_source("vrp")
)

app = modal.App("ortools-vrp-solver", image=image)

# ── 2. 核心求解函式 (Modal Function) ──
# 注意：OR-Tools 的 RoutingModel 搜尋演算法（如 Local Search）主要是單執行緒運作。
# 因此，將 cpu 設為 1.0 或 2.0 即可，增加更多 CPU 核心並不會加速單一任務的求解速度。
# 資源分配的重點應在於 'memory'，因為當地點數量 (N) 增加時，
# 距離與時間矩陣的大小是按 N^2 增長，記憶體不足會導致 OOM (Out of Memory) 崩潰。
@app.function(cpu=1.0, memory=2048)
def solve_vrp(compute_id: int, data):
    from vrp.solvers.ortools import solve_vrp_logic
    return solve_vrp_logic(compute_id, data)

# ── 3. FastAPI 應用程式 ──
@app.function()
@modal.asgi_app()
def api():
    from vrp.api.router import router as vrp_router
    web_app = FastAPI()
    web_app.state.solve_vrp = solve_vrp  # 直接傳入 function reference，不用 from_name
    web_app.include_router(vrp_router)
    return web_app
