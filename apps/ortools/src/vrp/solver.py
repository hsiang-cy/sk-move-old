from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

from vrp.schema import VRPRequest


def solve_vrp(data: VRPRequest) -> dict:
    n = len(data.locations)
    num_vehicles = len(data.vehicles)
    depot = data.depot_index

    # ── 1. Index Manager & Routing Model ──
    manager = pywrapcp.RoutingIndexManager(n, num_vehicles, depot)
    routing = pywrapcp.RoutingModel(manager)

    # ── 2. 成本函數：最短總距離 ──
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data.distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # ── 3. 固定使用成本 ──
    for i, vehicle in enumerate(data.vehicles):
        if vehicle.fixed_cost > 0:
            routing.SetFixedCostOfVehicle(vehicle.fixed_cost, i)

    # ── 4. Capacity Dimension ──
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        loc = data.locations[from_node]
        return loc.pickup - loc.delivery

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    vehicle_capacities = [v.capacity for v in data.vehicles]

    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,
        vehicle_capacities,
        False,  # 不強制從 0 出發，讓 solver 依路線決定初始載重
        "Capacity",
    )

    # ── 5. Time Dimension ──
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        travel = data.time_matrix[from_node][to_node]
        service = data.locations[from_node].service_time
        return travel + service

    time_callback_index = routing.RegisterTransitCallback(time_callback)

    max_time = max(loc.time_window_end for loc in data.locations)

    routing.AddDimension(
        time_callback_index,
        max_time,
        max_time,
        False,
        "Time",
    )

    time_dimension = routing.GetDimensionOrDie("Time")

    for location_idx, loc in enumerate(data.locations):
        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(
            loc.time_window_start,
            loc.time_window_end,
        )

    for vehicle_id in range(num_vehicles):
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.Start(vehicle_id))
        )
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.End(vehicle_id))
        )

    # ── 6. 搜尋參數 ──
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_params.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_params.time_limit.seconds = data.time_limit_seconds

    # ── 7. 求解 ──
    solution = routing.SolveWithParameters(search_params)

    if solution is None:
        raise ValueError("找不到可行解，請確認時間窗與容量限制是否過於嚴苛")

    # ── 8. 解析結果 ──
    routes = []
    total_distance = 0

    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)

        if routing.IsEnd(solution.Value(routing.NextVar(index))):
            continue

        stops = []
        route_distance = 0
        route_pickup = 0
        route_delivery = 0

        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            loc = data.locations[node]
            time_var = time_dimension.CumulVar(index)

            stops.append({
                "location_id": loc.id,
                "name": loc.name,
                "arrival_time": solution.Min(time_var),
                "pickup": loc.pickup,
                "delivery": loc.delivery,
            })

            route_pickup += loc.pickup
            route_delivery += loc.delivery
            next_index = solution.Value(routing.NextVar(index))
            # 直接查距離矩陣，避免 GetArcCostForVehicle 會將 fixed_cost 計入弧成本
            from_node = manager.IndexToNode(index)
            to_node = manager.IndexToNode(next_index)
            route_distance += data.distance_matrix[from_node][to_node]
            index = next_index

        node = manager.IndexToNode(index)
        time_var = time_dimension.CumulVar(index)
        stops.append({
            "location_id": data.locations[node].id,
            "name": data.locations[node].name,
            "arrival_time": solution.Min(time_var),
            "pickup": 0,
            "delivery": 0,
        })

        total_distance += route_distance
        routes.append({
            "vehicle_id": data.vehicles[vehicle_id].id,
            "stops": stops,
            "total_distance": route_distance,
            "total_pickup": route_pickup,
            "total_delivery": route_delivery,
        })

    return {
        "status": "success",
        "total_distance": total_distance,
        "routes": routes,
    }
