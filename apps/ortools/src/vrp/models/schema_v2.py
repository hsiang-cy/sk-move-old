from vrp.models.schema import Location, Vehicle, VRPRequest


class LocationV2(Location):
    unserved_penalty: int | None = None
    # None = must visit (v1 behavior)
    # set  = optional; higher penalty → solver prefers to visit

    late_penalty: int | None = None
    # None = hard time window (v1 behavior)
    # set  = soft upper bound; penalty per minute arriving after time_window_end

    allowed_vehicle_ids: list[int] | None = None
    # None = any vehicle may visit (v1/v2 behavior)
    # set  = only vehicles whose id is in this list may visit this location


class VehicleV2(Vehicle):
    max_duration_minutes: int | None = None
    # None = unlimited (v1 behavior)
    # set  = CumulVar(End(v)).SetMax(value)


class VRPRequestV2(VRPRequest):
    locations: list[LocationV2]
    vehicles: list[VehicleV2]
