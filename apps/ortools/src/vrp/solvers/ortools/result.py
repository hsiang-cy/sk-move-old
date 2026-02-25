from vrp.models.schema import VRPRequest


def parse_solution(routing, manager, solution, time_dimension, data: VRPRequest) -> dict:
    routes = []
    total_distance = 0

    for vehicle_id in range(len(data.vehicles)):
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
