# OR-Tools VRP Solver (Modal Serverless)

A serverless optimization engine for solving the Vehicle Routing Problem (VRP) with constraints like time windows, vehicle capacities, and fixed costs.

## Project Overview

This project provides a FastAPI-based interface for solving VRP tasks using Google's OR-Tools, deployed as a serverless application on [Modal](https://modal.com/).

### Technologies
- **Python 3.14**
- **FastAPI**: Web framework for the API.
- **Google OR-Tools**: Constraint programming solver for VRP.
- **Modal**: Serverless infrastructure for deployment and background task execution.
- **Pydantic**: Data validation and serialization.

### Architecture
- **`src/main.py`**: The entry point for the Modal application. It defines the environment (image, dependencies) and exposes two main components:
    - `api`: A FastAPI ASGI application for handling incoming requests.
    - `solve_vrp`: A heavy-compute Modal function that performs the actual optimization.
- **`src/vrp/`**: Core logic package.
    - `router.py`: API endpoints for triggering optimization jobs.
    - `schema.py`: Pydantic models for VRP requests and responses (locations, vehicles, matrices).
    - `solver.py`: The implementation of the OR-Tools routing model.
- **Background Execution**: When a request hits the `/vrp/solve` endpoint, it generates a `job_id` and spawns a background `solve_vrp` task. Once finished, the results are sent to a `webhook_url` provided in the request.

## Building and Running

### Development
To run the application locally in "serve" mode (with hot reloading on Modal's infrastructure):
```bash
modal serve src/main.py
```

### Deployment
To deploy the application to Modal:
```bash
modal deploy src/main.py
```

### Dependencies
Dependencies are managed within `src/main.py` via the `modal.Image` definition:
- `ortools`
- `fastapi[standard]`
- `httpx`

## Development Conventions

- **Validation**: All API requests are validated using Pydantic schemas in `src/vrp/schema.py`.
- **Optimization Logic**: The solver handles:
    - Distance-based cost minimization.
    - Vehicle capacity constraints (pickup/delivery).
    - Time window constraints for each location.
    - Fixed costs per vehicle usage.
- **Error Handling**: The solver catches exceptions and reports them via the webhook payload with a `status: "error"` field.
- **Asynchronous Workflow**: The API responds with a `202 Accepted` status and a `job_id`. The actual result is delivered asynchronously via webhook.
