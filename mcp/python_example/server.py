import contextlib
import logging
from collections.abc import AsyncIterator

from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route
from starlette.types import Receive, Scope, Send

import mcp.types as types
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager

logger = logging.getLogger(__name__)


# @click.command()
# @click.option("--port", default=3000, help="Port to listen on for HTTP")
# @click.option(
#     "--log-level",
#     default="INFO",
#     help="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
# )
# @click.option(
#     "--json-response",
#     is_flag=True,
#     default=False,
#     help="Enable JSON responses instead of SSE streams",
# )
def main(
    port: int = 8001,
    log_level: str = "INFO",
    json_response: bool = True,
) -> int:
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    app = Server("mcp-calculator-demo")

    @app.call_tool()
    async def call_tool(
        name: str, arguments: dict
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        logger.info(f"Tool called: {name} with args: {arguments}")

        if name == "calculate":
            operation = arguments.get("operation")
            a = arguments.get("a")
            b = arguments.get("b")

            try:
                # Ensure we have numbers
                a = float(a)
                b = float(b)

                # Perform the calculation
                if operation == "add":
                    result = a + b
                elif operation == "subtract":
                    result = a - b
                elif operation == "multiply":
                    result = a * b
                elif operation == "divide":
                    if b == 0:
                        raise ValueError("Cannot divide by zero")
                    result = a / b
                else:
                    raise ValueError(f"Unknown operation: {operation}")

                return [
                    types.TextContent(
                        type="text",
                        text=f"Result: {a} {operation} {b} = {result}",
                    )
                ]

            except (ValueError, TypeError) as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}",
                    )
                ]
        else:
            return [
                types.TextContent(
                    type="text",
                    text=f"Unknown tool: {name}",
                )
            ]

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        logger.info("Tools list requested")
        return [
            types.Tool(
                name="calculate",
                description="Perform basic arithmetic operations (add, subtract, multiply, divide)",
                inputSchema={
                    "type": "object",
                    "required": ["operation", "a", "b"],
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide"],
                            "description": "The arithmetic operation to perform",
                        },
                        "a": {
                            "type": "number",
                            "description": "The first number",
                        },
                        "b": {
                            "type": "number",
                            "description": "The second number",
                        },
                    },
                },
            )
        ]

    # Create the session manager with true stateless mode
    session_manager = StreamableHTTPSessionManager(
        app=app,
        event_store=None,
        json_response=True,
        stateless=True,
    )

    async def handle_streamable_http(
        scope: Scope, receive: Receive, send: Send
    ) -> None:
        logger.info("=== MCP Request ===")
        logger.info(f"Method: {scope.get('method', 'Unknown')}")
        logger.info(f"Path: {scope.get('path', 'Unknown')}")
        logger.info(f"Query: {scope.get('query_string', b'').decode()}")

        # Log headers
        headers = dict(scope.get("headers", []))
        for key, value in headers.items():
            logger.info(f"Header {key.decode()}: {value.decode()}")

        # Log body if it's a POST
        if scope.get("method") == "POST":
            message = await receive()
            logger.info(f"Body type: {message.get('type', 'Unknown')}")
            if message.get("body"):
                logger.info(f"Body: {message['body'].decode()}")

            # Create a new receive callable that returns the same message
            async def new_receive():
                return message

            await session_manager.handle_request(scope, new_receive, send)
        else:
            await session_manager.handle_request(scope, receive, send)

    @contextlib.asynccontextmanager
    async def lifespan(app: Starlette) -> AsyncIterator[None]:
        """Context manager for session manager."""
        async with session_manager.run():
            logger.info("=== MCP Server Started ===")
            logger.info("Server: mcp-calculator-demo")
            logger.info(f"Port: {port}")
            logger.info("JSON Response: True")
            logger.info("Stateless: True")
            logger.info("=============================")
            try:
                yield
            finally:
                logger.info("MCP Server shutting down...")

    # Add a test endpoint
    async def test_endpoint(request):
        return JSONResponse(
            {
                "message": "MCP server is running",
                "path": request.url.path,
                "method": request.method,
                "mcp_endpoint": "/mcp",
            }
        )

    # Debug endpoint to see all headers
    async def debug_endpoint(request):
        headers = dict(request.headers)
        return JSONResponse(
            {
                "method": request.method,
                "path": str(request.url),
                "headers": headers,
                "query_params": dict(request.query_params),
            }
        )

    # Alternative MCP handler directly as a route
    async def mcp_route_handler(request):
        logger.info("=== Direct MCP Route Handler ===")
        logger.info(f"Method: {request.method}")
        logger.info(f"Path: {request.url.path}")
        logger.info(f"Headers: {dict(request.headers)}")

        # Convert Starlette request to ASGI scope/receive/send
        scope = request.scope

        async def receive():
            # For POST requests, read the body
            if request.method == "POST":
                body = await request.body()
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.request", "body": b"", "more_body": False}

        # We need to create a custom send function to capture the response
        response_data = {"status": 200, "headers": [], "body": b""}

        async def send(message):
            if message["type"] == "http.response.start":
                response_data["status"] = message["status"]
                response_data["headers"] = message.get("headers", [])
            elif message["type"] == "http.response.body":
                response_data["body"] += message.get("body", b"")

        try:
            await session_manager.handle_request(scope, receive, send)

            # Convert headers back to Starlette format
            headers = {}
            for header_pair in response_data["headers"]:
                key, value = header_pair
                headers[key.decode()] = value.decode()

            from starlette.responses import Response

            return Response(
                content=response_data["body"],
                status_code=response_data["status"],
                headers=headers,
            )
        except Exception as e:
            logger.error(f"Error in MCP handler: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)

    # Create an ASGI application using the transport
    starlette_app = Starlette(
        debug=True,
        routes=[
            Route("/", test_endpoint),
            Route("/test", test_endpoint),
            Route("/debug", debug_endpoint, methods=["GET", "POST"]),
            # Try both mount and direct route
            Route("/mcp", mcp_route_handler, methods=["GET", "POST"]),
            Route(
                "/mcp/", mcp_route_handler, methods=["GET", "POST"]
            ),  # with trailing slash
            Mount("/mcp-mount", app=handle_streamable_http),  # alternative mount
        ],
        lifespan=lifespan,
    )

    import uvicorn

    logger.info(f"Starting server on http://127.0.0.1:{port}")
    uvicorn.run(starlette_app, host="127.0.0.1", port=port, log_level="info")

    return 0


if __name__ == "__main__":
    main()
