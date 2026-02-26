#!/usr/bin/env python3
"""
GraphQL API 完整 CRUD 測試腳本
需要先執行：npm run dev
需要 requests：pip install requests
"""

import json
import random
import string
import sys
import requests

BASE_URL = "http://localhost:8787/graphql"

# ── ANSI 顏色 ────────────────────────────────────────────────────────────────
GRN  = "\033[92m"
RED  = "\033[91m"
YEL  = "\033[93m"
BLU  = "\033[94m"
CYN  = "\033[96m"
DIM  = "\033[2m"
BOLD = "\033[1m"
RST  = "\033[0m"

PASS = f"{GRN}✓{RST}"
FAIL = f"{RED}✗{RST}"

# ── helpers ──────────────────────────────────────────────────────────────────
def rand6():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))

def section(title: str):
    print(f"\n{BLU}{BOLD}{'─' * 50}{RST}")
    print(f"{BLU}{BOLD}  {title}{RST}")
    print(f"{BLU}{BOLD}{'─' * 50}{RST}")

def ok(label: str, data=None):
    print(f"  {PASS} {label}")
    if data:
        dumped = json.dumps(data, ensure_ascii=False, indent=4)
        for line in dumped.splitlines():
            print(f"      {DIM}{line}{RST}")

def fail(label: str, msg: str):
    print(f"  {FAIL} {label}: {RED}{msg}{RST}")

def gql(query: str, variables: dict = None, token: str = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = {"query": query}
    if variables:
        body["variables"] = variables
    resp = requests.post(BASE_URL, json=body, headers=headers, timeout=10)
    payload = resp.json()
    if "errors" in payload:
        raise RuntimeError(payload["errors"][0]["message"])
    return payload["data"]

def expect_error(query: str, variables: dict = None, token: str = None) -> str:
    """執行一個預期會失敗的請求，回傳 error message（含 graphql-yoga 錯誤遮蔽後的原始訊息）"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = {"query": query}
    if variables:
        body["variables"] = variables
    resp = requests.post(BASE_URL, json=body, headers=headers, timeout=10)
    payload = resp.json()
    if "errors" in payload:
        err = payload["errors"][0]
        # graphql-yoga 在 prod 模式會遮蔽成 "Unexpected error."，
        # 原始訊息藏在 extensions.originalError.message
        original = (err.get("extensions") or {}).get("originalError") or {}
        return original.get("message") or err["message"]
    raise RuntimeError("預期收到錯誤，但請求成功了")

# ── 測試計數 ──────────────────────────────────────────────────────────────────
passed = 0
failed = 0

def assert_ok(label: str, fn, *args, **kwargs):
    global passed, failed
    try:
        result = fn(*args, **kwargs)
        ok(label, result)
        passed += 1
        return result
    except Exception as e:
        fail(label, str(e))
        failed += 1
        return None

def assert_err(label: str, expected_substr: str, fn, *args, **kwargs):
    global passed, failed
    try:
        msg = fn(*args, **kwargs)
        if expected_substr.lower() in msg.lower():
            ok(f"{label} → \"{msg}\"")
            passed += 1
        else:
            fail(label, f"期望含 '{expected_substr}'，實際得到 '{msg}'")
            failed += 1
    except Exception as e:
        fail(label, str(e))
        failed += 1

# ═════════════════════════════════════════════════════════════════════════════
def main():
    suffix = rand6()
    account_name = f"test_user_{suffix}"
    email        = f"{account_name}@test.com"
    password     = "Test1234!"
    people_name  = f"測試用戶_{suffix}"

    print(f"\n{BOLD}{CYN}╔══════════════════════════════════════════════════╗{RST}")
    print(f"{BOLD}{CYN}║   GraphQL API 完整 CRUD 測試                     ║{RST}")
    print(f"{BOLD}{CYN}╚══════════════════════════════════════════════════╝{RST}")
    print(f"  目標：{YEL}{BASE_URL}{RST}")
    print(f"  帳號：{YEL}{account_name}{RST}")

    # ── 0. 健康檢查 ──────────────────────────────────────────────────────────
    section("0. 健康檢查")
    try:
        r = requests.get("http://localhost:8787/version", timeout=5)
        ok(f"伺服器版本：{r.text}")
    except Exception as e:
        print(f"\n{RED}無法連線伺服器：{e}{RST}")
        print(f"{YEL}請先執行 npm run dev{RST}\n")
        sys.exit(1)

    token = None

    # ── 1. 帳號：register / login / me ───────────────────────────────────────
    section("1. 帳號 (Account)")

    reg = assert_ok("register", gql, """
        mutation Register($a:String!,$e:String!,$p:String!,$n:String!) {
          register(account:$a, email:$e, password:$p, people_name:$n) {
            token
            account { account_id account account_role point status }
          }
        }
    """, {"a": account_name, "e": email, "p": password, "n": people_name})

    if reg:
        token = reg["register"]["token"]
        print(f"      {DIM}token: {token[:40]}...{RST}")

    login = assert_ok("login", gql, """
        mutation Login($a:String!,$p:String!) {
          login(account:$a, password:$p) {
            token
            account { account_id account account_role }
          }
        }
    """, {"a": account_name, "p": password})

    if login:
        token = login["login"]["token"]  # 用最新 token

    assert_ok("me (帶 token)", gql, """
        { me { account_id account email people_name account_role point } }
    """, token=token)

    assert_ok("me (無 token) → null", gql, "{ me { account_id } }")

    assert_err(
        "未登入存取 destinations → Unauthorized",
        "unauthorized",
        expect_error,
        "{ destinations { id } }"
    )

    if not token:
        print(f"\n{RED}無法取得 token，中止測試{RST}\n")
        sys.exit(1)

    # ── 2. Destination CRUD ──────────────────────────────────────────────────
    section("2. Destination CRUD")

    dest1 = assert_ok("createDestination #1（倉庫）", gql, """
        mutation CreateDest($name:String!,$addr:String!,$lat:String!,$lng:String!,$data:JSON) {
          createDestination(name:$name, address:$addr, lat:$lat, lng:$lng,
            data:$data, comment_for_account:"主要出發點") {
            id name address lat lng status comment_for_account data
          }
        }
    """, {
        "name": f"倉庫_{suffix}",
        "addr": "台北市信義區信義路五段7號",
        "lat":  "25.0330",
        "lng":  "121.5654",
        "data": {"is_depot": True},
    }, token=token)

    dest2 = assert_ok("createDestination #2（客戶A）", gql, """
        mutation CreateDest($name:String!,$addr:String!,$lat:String!,$lng:String!) {
          createDestination(name:$name, address:$addr, lat:$lat, lng:$lng) {
            id name status
          }
        }
    """, {
        "name": f"客戶A_{suffix}",
        "addr": "台北市大安區忠孝東路四段1號",
        "lat":  "25.0418",
        "lng":  "121.5476",
    }, token=token)

    dest3 = assert_ok("createDestination #3（客戶B）", gql, """
        mutation CreateDest($name:String!,$addr:String!,$lat:String!,$lng:String!) {
          createDestination(name:$name, address:$addr, lat:$lat, lng:$lng) {
            id name status
          }
        }
    """, {
        "name": f"客戶B_{suffix}",
        "addr": "新北市板橋區縣民大道二段7號",
        "lat":  "25.0120",
        "lng":  "121.4630",
    }, token=token)

    assert_ok("destinations（列出全部）", gql, """
        { destinations { id name status } }
    """, token=token)

    dest1_id = dest1["createDestination"]["id"] if dest1 else None
    dest2_id = dest2["createDestination"]["id"] if dest2 else None
    dest3_id = dest3["createDestination"]["id"] if dest3 else None

    if dest2_id:
        assert_ok(f"destination(id:{dest2_id})（單筆查詢）", gql, """
            query GetDest($id:ID!) { destination(id:$id) { id name address lat lng } }
        """, {"id": dest2_id}, token=token)

        assert_ok(f"updateDestination(id:{dest2_id})", gql, """
            mutation UpdDest($id:ID!) {
              updateDestination(id:$id, name:"客戶A_已更新", comment_for_account:"備註已更新") {
                id name comment_for_account updated_at
              }
            }
        """, {"id": dest2_id}, token=token)

        assert_ok(f"deleteDestination(id:{dest2_id})（軟刪除）", gql, """
            mutation DelDest($id:ID!) {
              deleteDestination(id:$id) { id name status }
            }
        """, {"id": dest2_id}, token=token)

    assert_ok("destinations(status:active)（過濾刪除後）", gql, """
        { destinations(status:active) { id name status } }
    """, token=token)

    # ── 3. CustomVehicleType CRUD ────────────────────────────────────────────
    section("3. CustomVehicleType CRUD")

    cvt1 = assert_ok("createCustomVehicleType（小貨車）", gql, """
        mutation {
          createCustomVehicleType(
            name:"小貨車", capacity:1000,
            comment_for_account:"最大承重1噸"
          ) { id name capacity status comment_for_account }
        }
    """, token=token)

    cvt2 = assert_ok("createCustomVehicleType（大貨車）", gql, """
        mutation {
          createCustomVehicleType(name:"大貨車", capacity:5000) {
            id name capacity
          }
        }
    """, token=token)

    assert_ok("customVehicleTypes（列出全部）", gql, """
        { customVehicleTypes { id name capacity status } }
    """, token=token)

    cvt1_id = cvt1["createCustomVehicleType"]["id"] if cvt1 else None
    cvt2_id = cvt2["createCustomVehicleType"]["id"] if cvt2 else None

    if cvt1_id:
        assert_ok(f"customVehicleType(id:{cvt1_id})（單筆查詢）", gql, """
            query GetCVT($id:ID!) {
              customVehicleType(id:$id) { id name capacity comment_for_account }
            }
        """, {"id": cvt1_id}, token=token)

        assert_ok(f"updateCustomVehicleType(id:{cvt1_id})", gql, """
            mutation UpdCVT($id:ID!) {
              updateCustomVehicleType(id:$id, capacity:1200, comment_for_account:"容量升級至1.2噸") {
                id name capacity comment_for_account updated_at
              }
            }
        """, {"id": cvt1_id}, token=token)

    if cvt2_id:
        assert_ok(f"deleteCustomVehicleType(id:{cvt2_id})（軟刪除）", gql, """
            mutation DelCVT($id:ID!) {
              deleteCustomVehicleType(id:$id) { id name status }
            }
        """, {"id": cvt2_id}, token=token)

    # ── 4. Vehicle CRUD ──────────────────────────────────────────────────────
    section("4. Vehicle CRUD")

    v1 = assert_ok("createVehicle #1（含 depot + vehicleTypeInfo field resolver）", gql, """
        mutation CreateVehicle($vt:ID!, $depot:ID!) {
          createVehicle(
            vehicle_number:"TEST-AA-0001",
            vehicle_type:$vt,
            depot_id:$depot,
            comment_for_account:"測試車輛一號"
          ) {
            id vehicle_number status comment_for_account
            vehicleTypeInfo { id name capacity }
            depot { id name address }
          }
        }
    """, {"vt": cvt1_id, "depot": dest1_id}, token=token)

    v2 = assert_ok("createVehicle #2（無 depot）", gql, """
        mutation CreateVehicle($vt:ID!) {
          createVehicle(vehicle_number:"TEST-BB-0002", vehicle_type:$vt) {
            id vehicle_number status
            vehicleTypeInfo { name }
            depot { name }
          }
        }
    """, {"vt": cvt1_id}, token=token)

    assert_ok("vehicles（列出全部）", gql, """
        {
          vehicles {
            id vehicle_number status
            vehicleTypeInfo { name capacity }
            depot { name }
          }
        }
    """, token=token)

    v1_id = v1["createVehicle"]["id"] if v1 else None
    v2_id = v2["createVehicle"]["id"] if v2 else None

    if v1_id:
        assert_ok(f"vehicle(id:{v1_id})（單筆）", gql, """
            query GetVeh($id:ID!) {
              vehicle(id:$id) {
                id vehicle_number comment_for_account
                vehicleTypeInfo { name capacity }
                depot { name address }
              }
            }
        """, {"id": v1_id}, token=token)

        assert_ok(f"updateVehicle(id:{v1_id})", gql, """
            mutation UpdVeh($id:ID!, $depot:ID!) {
              updateVehicle(
                id:$id,
                vehicle_number:"TEST-AA-0001-UPD",
                depot_id:$depot,
                comment_for_account:"備註已更新"
              ) {
                id vehicle_number comment_for_account updated_at
                depot { name }
              }
            }
        """, {"id": v1_id, "depot": dest3_id}, token=token)

    if v2_id:
        assert_ok(f"deleteVehicle(id:{v2_id})（軟刪除）", gql, """
            mutation DelVeh($id:ID!) {
              deleteVehicle(id:$id) { id vehicle_number status }
            }
        """, {"id": v2_id}, token=token)

    assert_ok("vehicles(status:active)（過濾刪除後）", gql, """
        { vehicles(status:active) { id vehicle_number status } }
    """, token=token)

    # ── 5. Order CRUD ────────────────────────────────────────────────────────
    section("5. Order CRUD")

    dest_snapshot = {"destinations": [
        {"id": dest1_id, "name": f"倉庫_{suffix}", "lat": "25.0330", "lng": "121.5654", "is_depot": True},
        {"id": dest3_id, "name": f"客戶B_{suffix}", "lat": "25.0120", "lng": "121.4630"},
    ]}
    veh_snapshot = {"vehicles": [
        {"id": v1_id, "vehicle_number": "TEST-AA-0001-UPD", "capacity": 1200},
    ]}

    order1 = assert_ok("createOrder", gql, """
        mutation CreateOrder($ds:JSON!, $vs:JSON!) {
          createOrder(
            destination_snapshot:$ds,
            vehicle_snapshot:$vs,
            comment_for_account:"測試訂單一號"
          ) {
            id status comment_for_account
            destination_snapshot vehicle_snapshot
            computes { id }
          }
        }
    """, {"ds": dest_snapshot, "vs": veh_snapshot}, token=token)

    order2 = assert_ok("createOrder #2（備用）", gql, """
        mutation CreateOrder($ds:JSON!, $vs:JSON!) {
          createOrder(destination_snapshot:$ds, vehicle_snapshot:$vs) {
            id status
          }
        }
    """, {"ds": dest_snapshot, "vs": veh_snapshot}, token=token)

    assert_ok("orders（列出全部）", gql, """
        { orders { id status comment_for_account computes { id } } }
    """, token=token)

    order1_id = order1["createOrder"]["id"] if order1 else None
    order2_id = order2["createOrder"]["id"] if order2 else None

    if order1_id:
        assert_ok(f"order(id:{order1_id})（單筆）", gql, """
            query GetOrder($id:ID!) {
              order(id:$id) {
                id status comment_for_account
                destination_snapshot vehicle_snapshot
              }
            }
        """, {"id": order1_id}, token=token)

    if order2_id:
        assert_ok(f"deleteOrder(id:{order2_id})（軟刪除）", gql, """
            mutation DelOrder($id:ID!) {
              deleteOrder(id:$id) { id status }
            }
        """, {"id": order2_id}, token=token)

    # ── 6. Compute CRUD ──────────────────────────────────────────────────────
    section("6. Compute CRUD")

    comp1 = assert_ok("createCompute", gql, """
        mutation CreateComp($oid:ID!) {
          createCompute(
            order_id:$oid,
            comment_for_account:"測試計算任務"
          ) {
            id compute_status status order_id comment_for_account
            routes { id }
          }
        }
    """, {"oid": order1_id}, token=token)

    comp2 = assert_ok("createCompute #2（用來取消）", gql, """
        mutation CreateComp($oid:ID!) {
          createCompute(order_id:$oid) { id compute_status }
        }
    """, {"oid": order1_id}, token=token)

    assert_ok(f"computes(orderId:{order1_id})（依 order 篩選）", gql, """
        query GetComps($oid:ID!) {
          computes(orderId:$oid) { id compute_status status order_id }
        }
    """, {"oid": order1_id}, token=token)

    comp1_id = comp1["createCompute"]["id"] if comp1 else None
    comp2_id = comp2["createCompute"]["id"] if comp2 else None

    if comp1_id:
        assert_ok(f"compute(id:{comp1_id})（單筆）", gql, """
            query GetComp($id:ID!) {
              compute(id:$id) {
                id compute_status order_id comment_for_account
                routes { id stops { id } }
              }
            }
        """, {"id": comp1_id}, token=token)

    if comp2_id:
        assert_ok(f"cancelCompute(id:{comp2_id})", gql, """
            mutation CancelComp($id:ID!) {
              cancelCompute(id:$id) { id compute_status updated_at }
            }
        """, {"id": comp2_id}, token=token)

    assert_ok("computes(status:cancelled)（篩選已取消）", gql, """
        { computes(status:cancelled) { id compute_status order_id } }
    """, token=token)

    # ── 7. pointLogs ─────────────────────────────────────────────────────────
    section("7. PointLogs")

    assert_ok("pointLogs（應為空，無扣點記錄）", gql, """
        { pointLogs { id change reason created_at } }
    """, token=token)

    # ── 8. Account 的 point_logs field resolver ───────────────────────────────
    section("8. Account.point_logs field resolver")

    assert_ok("me { point_logs }（field resolver）", gql, """
        { me { account_id point point_logs { id change reason } } }
    """, token=token)

    # ── 結果統計 ──────────────────────────────────────────────────────────────
    total = passed + failed
    print(f"\n{BOLD}{CYN}{'═' * 50}{RST}")
    print(f"{BOLD}  測試結果：{GRN}{passed} 通過{RST}  {RED}{failed} 失敗{RST}  {DIM}/ {total} 共計{RST}")
    print(f"{BOLD}{CYN}{'═' * 50}{RST}\n")

    if failed:
        sys.exit(1)

if __name__ == "__main__":
    main()
