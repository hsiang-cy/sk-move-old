from vrp.models.schema import VRPRequest


def add_distance_cost(routing, manager, data: VRPRequest) -> int:
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data.distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    return transit_callback_index


def add_fixed_costs(routing, data: VRPRequest):
    for i, vehicle in enumerate(data.vehicles):
        if vehicle.fixed_cost > 0:
            routing.SetFixedCostOfVehicle(vehicle.fixed_cost, i)


def add_capacity_dimension(routing, manager, data: VRPRequest):
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
        False,
        "Capacity",
    )


def add_time_dimension(routing, manager, data: VRPRequest):
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

    for vehicle_id in range(len(data.vehicles)):
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.Start(vehicle_id))
        )
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.End(vehicle_id))
        )

    return time_dimension
