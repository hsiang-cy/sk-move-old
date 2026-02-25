import httpx
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

from vrp.models.schema_v2 import VRPRequestV2
from vrp.solvers.ortools_v2.constraints import (
    add_distance_cost,
    add_fixed_costs,
    add_capacity_dimension,
    add_time_dimension_v2,
    add_optional_stops,
    add_max_duration,
)
from vrp.solvers.ortools_v2.result import parse_solution


def solve_vrp_v2_logic(compute_id: int, data: VRPRequestV2):
    try:
        manager = pywrapcp.RoutingIndexManager(
            len(data.locations), len(data.vehicles), data.depot_index
        )
        routing = pywrapcp.RoutingModel(manager)

        add_distance_cost(routing, manager, data)
        add_fixed_costs(routing, data)
        add_capacity_dimension(routing, manager, data)
        time_dimension = add_time_dimension_v2(routing, manager, data)

        # v2 features
        add_optional_stops(routing, manager, data)
        add_max_duration(routing, data, time_dimension)

        search_params = pywrapcp.DefaultRoutingSearchParameters()
        search_params.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_params.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_params.time_limit.seconds = data.time_limit_seconds

        solution = routing.SolveWithParameters(search_params)

        if solution is None:
            raise ValueError("找不到可行解，請確認時間窗與容量限制是否過於嚴苛")

        result = parse_solution(routing, manager, solution, time_dimension, data)
        payload = {"compute_id": compute_id, **result}

    except Exception as e:
        payload = {
            "compute_id": compute_id,
            "status": "error",
            "message": str(e),
        }

    if data.webhook_url:
        try:
            with httpx.Client() as client:
                client.post(data.webhook_url, json=payload, timeout=10)
        except Exception as webhook_err:
            print(f"[compute_id={compute_id}] Webhook 發送失敗: {webhook_err}")

    return payload
