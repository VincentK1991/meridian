import contextlib
import logging
from collections.abc import AsyncIterator

import mcp.types as types
from code_executor import CodeExecutionResult, CodeExecutionWithHtml, execute_code_async
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route
from starlette.types import Receive, Scope, Send

logger = logging.getLogger(__name__)


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

    app = Server("code-executor-mcp")

    @app.call_tool()
    async def call_tool(
        name: str, arguments: dict
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        logger.info(f"Tool called: {name} with args: {arguments}")

        if name == "execute_code":
            try:
                code = arguments.get("code")
                # Use async execution for better concurrency
                result: CodeExecutionResult = await execute_code_async(code)

                return [
                    types.TextContent(
                        type="text",
                        text=result.model_dump_json(),
                    )
                ]

            except (ValueError, TypeError) as e:
                return [
                    types.TextContent(
                        type="text",
                        text=f"Error: {str(e)}",
                    )
                ]
        elif name == "execute_code_with_html":
            try:
                code = arguments.get("code")
                # Use async execution for better concurrency
                result_with_html: CodeExecutionWithHtml = await execute_code_async(code)

                return [
                    types.TextContent(
                        type="text",
                        text=result_with_html.model_dump_json(),
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
                name="execute_code",
                description="Execute arbitrary Python code and capture the output",
                inputSchema={
                    "type": "object",
                    "required": ["code"],
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "The Python code to execute",
                        },
                    },
                },
            ),
            types.Tool(
                name="execute_code_with_html",
                description="Execute Python code and capture output with HTML rendering capability",
                inputSchema={
                    "type": "object",
                    "required": ["code"],
                    "properties": {
                        "code": {
                            "type": "string",
                            "description": "The Python code to execute",
                        },
                    },
                },
            ),
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
    # async def test_endpoint(request):
    #     return JSONResponse(
    #         {
    #             "message": "MCP server is running",
    #             "path": request.url.path,
    #             "method": request.method,
    #             "mcp_endpoint": "/mcp",
    #         }
    #     )

    # # Debug endpoint to see all headers
    # async def debug_endpoint(request):
    #     headers = dict(request.headers)
    #     return JSONResponse(
    #         {
    #             "method": request.method,
    #             "path": str(request.url),
    #             "headers": headers,
    #             "query_params": dict(request.query_params),
    #         }
    #     )

    # Alternative MCP handler directly as a route
    async def mcp_route_handler(request):
        logger.info("=== Direct MCP Route Handler ===")
        logger.info(f"Method: {request.method}")
        logger.info(f"Path: {request.url.path}")
        logger.info(f"Headers: {dict(request.headers)}")

        # Convert Starlette request to ASGI scope/receive/send
        scope = request.scope
        request_headers = request.headers
        print(f"request_headers: {request_headers}")

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
            # Route("/", test_endpoint),
            # Route("/test", test_endpoint),
            # Route("/debug", debug_endpoint, methods=["GET", "POST"]),
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

    logger.info(f"Starting server on http://0.0.0.0:{port}")
    uvicorn.run(starlette_app, host="0.0.0.0", port=port, log_level="info")

    return 0


if __name__ == "__main__":
    main()
