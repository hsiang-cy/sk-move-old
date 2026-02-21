import modal
from fastapi import FastAPI
from pathlib import Path

# 獲取 src 目錄路徑
src_path = str(Path(__file__).parent)

# ── 1. 定義 Modal 環境 ──
image = modal.Image.debian_slim(python_version="3.12").pip_install(
    "ortools",
    "fastapi[standard]",
    "httpx",
)

app = modal.App("ortools-vrp-solver", image=image)

# ── 2. 定義掛載 ──
# 使用經由檢查確認存在的 modal.mount.Mount 類別
src_mount = modal.mount.Mount(local_dir=src_path, remote_path="/root/src")

# ── 3. 核心求解函式 (Modal Function) ──
@app.function(
    cpu=2.0, 
    memory=2048,
    mounts=[src_mount],
    env={"PYTHONPATH": "/root/src"}
)
def solve_vrp(job_id: str, data):
    from vrp.solver import solve_vrp_logic
    return solve_vrp_logic(job_id, data)

# ── 4. FastAPI 應用程式 ──
web_app = FastAPI()

@app.function(
    mounts=[src_mount],
    env={"PYTHONPATH": "/root/src"}
)
@modal.asgi_app()
def api():
    from vrp.router import router as vrp_router
    web_app.include_router(vrp_router)
    return web_app
