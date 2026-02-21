# OR-Tools VRP Solver (Modal.com Migration)

A FastAPI-based application that provides an asynchronous solver for the Vehicle Routing Problem (VRP) using Google's OR-Tools, optimized for deployment on Modal.com.

## Project Overview

The project provides a robust API for solving complex VRP instances. By migrating to Modal.com, we gain "scale-to-zero" capabilities, high-concurrency support, and a simplified deployment pipeline without the need for manual Docker management.

### Main Technologies
- **Python 3.14+**
- **FastAPI**: Web API framework.
- **Google OR-Tools**: Optimization logic.
- **Modal.com**: Serverless infrastructure and background task management.
- **Pydantic**: Data validation.
- **HTTPX**: Webhook notifications.

## Migration Plan to Modal.com

To migrate this service to Modal, we will follow these steps:

### 1. Environment & Image Definition
- **Define `modal.Image`**: Create a base image in `src/main.py` that includes all necessary system and Python dependencies (`ortools`, `fastapi`, `httpx`).
- **Initialize `modal.App`**: Set up the main Modal application container.

### 2. Core Logic Refactoring (`src/vrp/solver.py`)
- **Modal Function**: Decorate the `solve_vrp` function with `@app.function()`.
- **Resource Allocation**: Specify CPU and Memory requirements for the solver to ensure optimal performance for heavy computations.
- **Webhook Integration**: Move the webhook notification logic into a post-processing step within the Modal function to ensure it executes reliably after the solver finishes.

### 3. API & Routing Refactoring (`src/vrp/router.py`)
- **Remove `BackgroundTasks`**: Replace FastAPI's local `BackgroundTasks` with Modal's `.spawn()` method.
- **Asynchronous Triggering**: Update the `/vrp/solve` endpoint to trigger the Modal solver function asynchronously. It will return a Modal `task_id` (as the `job_id`) immediately to the caller.

### 4. Entry Point Update (`src/main.py`)
- **FastAPI Wrapper**: Use `@app.function().fastapi_endpoint()` to expose the FastAPI application as a serverless web endpoint on Modal.
- **Dynamic Imports**: Ensure all internal modules (`vrp.router`, `vrp.solver`) are correctly handled within the Modal container environment.

### 5. Local Development & Testing
- **`modal serve`**: Use the Modal CLI to start a local development session that syncs code changes to the cloud in real-time.
- **Verification**: Test the end-to-end flow: `Request -> FastAPI -> Modal Spawn -> OR-Tools Solve -> Webhook Callback`.

### 6. Deployment
- **`modal deploy`**: Perform a final deployment to generate a permanent URL for the production environment.
- **Domain Configuration**: (Optional) Map a custom domain to the Modal endpoint.

## Building and Running (Modal)

### Prerequisites
1. Install Modal CLI: `pip install modal`
2. Authenticate: `modal setup`

### Development Mode
```bash
modal serve src/main.py
```

### Production Deployment
```bash
modal deploy src/main.py
```

## Development Conventions

- **Serverless First**: Design functions to be stateless.
- **Explicit Resources**: Always define required CPU/Memory for the solver function to avoid resource contention.
- **Webhook Reliability**: The solver is responsible for reporting its own success/failure via the provided `webhook_url`.
