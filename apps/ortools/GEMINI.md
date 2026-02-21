# OR-Tools VRP Solver

A FastAPI-based application that provides an asynchronous solver for the Vehicle Routing Problem (VRP) using Google's OR-Tools.

## Project Overview

The project aims to provide a robust API for solving complex VRP instances, including constraints for vehicle capacity, time windows, and pickup/delivery requirements.

### Main Technologies
- **Python 3.14+**
- **FastAPI**: For building the web API.
- **Google OR-Tools**: For the optimization logic.
- **Pydantic**: For data validation and schema definition.
- **HTTPX**: For sending asynchronous webhook notifications.

### Architecture
- `src/main.py`: Entry point for the FastAPI application.
- `src/vrp/router.py`: API routes, including the asynchronous `/vrp/solve` endpoint and background task handling.
- `src/vrp/schema.py`: Pydantic models for `Location`, `Vehicle`, and `VRPRequest`.
- `src/vrp/solver.py`: Core VRP solving logic using OR-Tools, incorporating Capacity and Time dimensions.

## Building and Running

### Prerequisites
Ensure you have the following Python packages installed:
- `fastapi`
- `uvicorn`
- `ortools`
- `pydantic`
- `httpx`

### Running the Application
From the root directory, navigate to the `src` folder and run the FastAPI server:

```bash
cd src
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. You can access the interactive documentation at `http://localhost:8000/docs`.

### Testing
There is currently no formal test suite. Tests should be added to a `tests` directory in the future.

## Development Conventions

- **Data Validation**: All API inputs and outputs are strictly validated using Pydantic models defined in `src/vrp/schema.py`.
- **Asynchronous Processing**: VRP solving is treated as a long-running background task. The `/vrp/solve` endpoint returns a `job_id` and uses a webhook callback to report the final result.
- **Modular Design**: The VRP logic is encapsulated within the `src/vrp` module, separating routing, schema, and solver logic.
- **OR-Tools Configuration**: The solver uses `PATH_CHEAPEST_ARC` for the initial strategy and `GUIDED_LOCAL_SEARCH` for metaheuristics, with a configurable time limit.
