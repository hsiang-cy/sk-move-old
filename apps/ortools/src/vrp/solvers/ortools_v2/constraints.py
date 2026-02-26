from vrp.models.schema_v2 import VRPRequestV2

# Reused from v1 (same logic, typed against VRPRequestV2 which is compatible)

def add_distance_cost(routing, manager, data: VRPRequestV2) -> int:
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data.distance_matrix[from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    return transit_callback_index


def add_fixed_costs(routing, data: VRPRequestV2):
    for i, vehicle in enumerate(data.vehicles):
        if vehicle.fixed_cost > 0:
            routing.SetFixedCostOfVehicle(vehicle.fixed_cost, i)


def add_capacity_dimension(routing, manager, data: VRPRequestV2):
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


def add_time_dimension_v2(routing, manager, data: VRPRequestV2):
    """
    Time dimension with soft time window support.

    Per location:
    - late_penalty is None → hard range [start, end] (v1 behavior)
    - late_penalty is not None → hard lower bound [start, max_time] +
      SetCumulVarSoftUpperBound(index, end, penalty) for soft upper bound
    """
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
        if loc.late_penalty is None:
            # Hard time window (v1 behavior)
            time_dimension.CumulVar(index).SetRange(
                loc.time_window_start,
                loc.time_window_end,
            )
        else:
            # Soft upper bound: hard lower, open upper + penalty for lateness
            time_dimension.CumulVar(index).SetRange(
                loc.time_window_start,
                max_time,
            )
            time_dimension.SetCumulVarSoftUpperBound(
                index,
                loc.time_window_end,
                loc.late_penalty,
            )

    for vehicle_id in range(len(data.vehicles)):
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.Start(vehicle_id))
        )
        routing.AddVariableMinimizedByFinalizer(
            time_dimension.CumulVar(routing.End(vehicle_id))
        )

    return time_dimension


def add_optional_stops(routing, manager, data: VRPRequestV2):
    """
    Mark non-depot locations with unserved_penalty as optional via AddDisjunction.
    Locations with unserved_penalty = None are required (must visit).
    """
    for location_idx, loc in enumerate(data.locations):
        if location_idx == data.depot_index:
            continue
        if loc.unserved_penalty is not None:
            index = manager.NodeToIndex(location_idx)
            routing.AddDisjunction([index], loc.unserved_penalty)


def add_vehicle_constraints(routing, manager, data: VRPRequestV2):
    """
    Restrict which vehicles may visit a location.

    Uses routing.solver().Add(VehicleVar != v_idx) rather than RemoveValue(),
    because RemoveValue() can be silently bypassed when combined with
    AddDisjunction / soft time windows / max_duration in the same model.
    solver().Add() goes through the CP propagation engine and is always enforced.
    """
    id_to_idx = {v.id: idx for idx, v in enumerate(data.vehicles)}
    all_vehicle_indices = set(range(len(data.vehicles)))
    solver = routing.solver()

    for location_idx, loc in enumerate(data.locations):
        if loc.allowed_vehicle_ids is None:
            continue
        allowed_indices = {id_to_idx[vid] for vid in loc.allowed_vehicle_ids if vid in id_to_idx}
        forbidden_indices = all_vehicle_indices - allowed_indices
        if not forbidden_indices:
            continue
        node_index = manager.NodeToIndex(location_idx)
        for v_idx in forbidden_indices:
            solver.Add(routing.VehicleVar(node_index) != v_idx)


def add_max_duration(routing, data: VRPRequestV2, time_dimension):
    """
    Cap each vehicle's route duration via CumulVar(End(v)).SetMax().
    Only applied when max_duration_minutes is set on the vehicle.
    """
    for v_idx, vehicle in enumerate(data.vehicles):
        if vehicle.max_duration_minutes is not None:
            time_dimension.CumulVar(routing.End(v_idx)).SetMax(
                vehicle.max_duration_minutes
            )
