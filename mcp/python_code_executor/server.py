import contextlib
import logging
from collections.abc import AsyncIterator
from contextvars import ContextVar

import mcp.types as types
from code_executor import CodeExecutionResult, CodeExecutionWithHtml, execute_code_async
from mcp.server.lowlevel import Server
from mcp.server.streamable_http_manager import StreamableHTTPSessionManager
from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route
from starlette.types import Receive, Scope, Send

logger = logging.getLogger(__name__)

# Context variable to store request headers for use in tools
request_headers_context: ContextVar[dict] = ContextVar("request_headers", default={})


def create_message_prompt(
    tool_name: str = "execute_code",
) -> list[types.PromptMessage]:
    """Create the messages for the prompt with comprehensive code execution tool context."""
    messages = []

    # Create comprehensive context about the code execution tools
    tool_context = """
# Python Code Execution Tools

I have access to powerful Python code execution tools that can run arbitrary Python code and capture the output. Here's what you need to know:

## Available Tools

### 1. `execute_code`
- **Purpose**: Execute arbitrary Python code and capture printed output
- **Input**: Raw Python code as a string (NO markdown code blocks needed)
- **Output**: JSON object with `code`, `print_output`, and `success` fields

### 2. `execute_code_with_html`
- **Purpose**: Same as execute_code but with HTML rendering capability
- **Input**: Raw Python code as a string (NO markdown code blocks needed)
- **Output**: JSON object with `code`, `print_output`, `success`, and `html` fields

## ⚠️ Important: Code Input Format

**PROVIDE RAW PYTHON CODE ONLY** - Do NOT wrap in markdown code blocks!

✅ **CORRECT FORMAT:**
```
print("Hello World")
result = 2 + 2
print(f"Result: {result}")
```

❌ **INCORRECT FORMAT:**
```
```python
print("Hello World")
result = 2 + 2
print(f"Result: {result}")
```
```

The tools expect plain Python code strings, not markdown-formatted code blocks.

## Key Features

### ✅ Async-First Execution
- Code runs as async by default - you can use `await` syntax directly
- Perfect for concurrent execution without blocking
- Example: `await asyncio.sleep(0.5)` works perfectly

### ✅ Full Python Support
- Import any available libraries (numpy, pandas, matplotlib, etc.)
- Execute complex computations and data processing
- Handle loops, functions, classes, and all Python constructs

### ✅ Output Capture
- All `print()` statements are captured
- Both stdout and stderr are included
- Execution success/failure status is tracked

### ✅ Error Handling
- Comprehensive error reporting with full tracebacks
- Partial output captured even when errors occur
- Clear success/failure indicators

## Example Usage Patterns

### Basic Computation
```python
result = 2 + 2
print(f"2 + 2 = {result}")
```

### Async Operations
```python
print("Starting async task...")
await asyncio.sleep(0.5)
print("Async operation completed!")
```

### Data Processing with NumPy
```python
import numpy as np
arr = np.array([1, 2, 3, 4, 5])
result = np.sum(arr ** 2)
print(f"Array: {arr}")
print(f"Sum of squares: {result}")
```

### Complex Async Loops
```python
results = []
for i in range(3):
    print(f"Processing item {i+1}...")
    await asyncio.sleep(0.1)
    result = i ** 2
    results.append(result)
print(f"Final results: {results}")
```

## Output Format
The tools return a JSON object like:
```json
{
  "code": "print('Hello World')",
  "print_output": "Hello World",
  "success": true
}
```

## Best Practices
- Use `await asyncio.sleep()` instead of `time.sleep()` for delays
- The code execution is async-first, perfect for concurrent operations
- All standard Python libraries and async constructs are supported
- Error messages include full tracebacks for debugging

""".strip()

    if tool_name == "execute_code":
        # Add the tool context
        messages.append(
            types.PromptMessage(
                role="user", content=types.TextContent(type="text", text=tool_context)
            )
        )
    elif tool_name == "execute_code_with_html":
        messages.append(
            types.PromptMessage(
                role="user", content=types.TextContent(type="text", text=tool_context)
            )
        )

    return messages


# Create the MCP server at module level for hot reload support
mcp_server = Server("code-executor-mcp")


@mcp_server.call_tool()
async def call_tool(
    name: str, arguments: dict
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    logger.info(f"Tool called: {name} with args: {arguments}")

    # Get headers from context
    headers = request_headers_context.get({})
    user_api_key = headers.get("user-api-key", "Not provided")
    logger.info(f"Headers available in tool: user-api-key={user_api_key}")

    if name == "execute_code":
        try:
            code = arguments.get("code")

            # Inject header information into the code execution environment
            # Add header info as a print statement at the beginning
            header_info = f"print('=== MCP Server Header Info ===')\nprint('user-api-key: {user_api_key}')\nprint('=== End Header Info ===')\n\n"
            enhanced_code = header_info + code

            # Use async execution for better concurrency
            result: CodeExecutionResult = await execute_code_async(enhanced_code)

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

            # Inject header information into the code execution environment
            # Add header info as a print statement at the beginning
            header_info = f"print('=== MCP Server Header Info ===')\nprint('user-api-key: {user_api_key}')\nprint('=== End Header Info ===')\n\n"
            enhanced_code = header_info + code

            # Use async execution for better concurrency
            result_with_html: CodeExecutionWithHtml = await execute_code_async(
                enhanced_code
            )

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


@mcp_server.list_tools()
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


@mcp_server.get_prompt()
async def get_prompt(
    name: str, arguments: dict[str, str] | None = None
) -> types.GetPromptResult:
    if name != "execute_code" and name != "execute_code_with_html":
        raise ValueError(f"Unknown prompt: {name}")

    return types.GetPromptResult(
        messages=create_message_prompt(
            tool_name=name,
        ),
        description="A simple prompt with optional context and topic arguments",
    )


@mcp_server.list_prompts()
async def list_prompts() -> list[types.Prompt]:
    return [
        types.Prompt(
            name="execute_code",
            title="Execute Code Prompt",
            description="Execute Python code and capture the output",
        ),
        types.Prompt(
            name="execute_code_with_html",
            title="Execute Code with HTML Prompt",
            description="Execute Python code and capture output with HTML rendering capability",
        ),
    ]


# Create the session manager with true stateless mode
session_manager = StreamableHTTPSessionManager(
    app=mcp_server,
    event_store=None,
    json_response=True,
    stateless=True,
)


async def handle_streamable_http(scope: Scope, receive: Receive, send: Send) -> None:
    logger.info("=== MCP Request ===")
    logger.info(f"Method: {scope.get('method', 'Unknown')}")
    logger.info(f"Path: {scope.get('path', 'Unknown')}")
    logger.info(f"Query: {scope.get('query_string', b'').decode()}")

    # Log headers and store them in context
    headers = dict(scope.get("headers", []))
    headers_dict = {key.decode(): value.decode() for key, value in headers.items()}
    request_headers_context.set(headers_dict)
    logger.info(f"Stored headers in context: {headers_dict}")

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
        logger.info("JSON Response: True")
        logger.info("Stateless: True")
        logger.info("=============================")
        try:
            yield
        finally:
            logger.info("MCP Server shutting down...")


# Alternative MCP handler directly as a route
async def mcp_route_handler(request):
    logger.info("=== Direct MCP Route Handler ===")
    logger.info(f"Method: {request.method}")
    logger.info(f"Path: {request.url.path}")
    logger.info(f"Headers: {dict(request.headers)}")

    # Extract and store headers in context for use by tools
    headers_dict = dict(request.headers)
    request_headers_context.set(headers_dict)
    logger.info(f"Stored headers in context: {headers_dict}")

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


# Create the Starlette app at module level for hot reload
app = Starlette(
    debug=True,
    routes=[
        Route("/mcp", mcp_route_handler, methods=["GET", "POST"]),
        Route("/mcp/", mcp_route_handler, methods=["GET", "POST"]),
        Mount("/mcp-mount", app=handle_streamable_http),
    ],
    lifespan=lifespan,
)


def main(
    port: int = 8001,
    log_level: str = "INFO",
    json_response: bool = True,
    reload: bool = False,
) -> int:
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    import uvicorn

    logger.info(f"Starting server on http://0.0.0.0:{port}")
    if reload:
        logger.info("🔥 Hot reload enabled - server will restart on file changes")
        # For reload to work, we need to pass the app as an import string
        uvicorn.run(
            "server:app",
            host="0.0.0.0",
            port=port,
            log_level="info",
            reload=True,
        )
    else:
        # Normal mode - pass the app object directly
        uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

    return 0


if __name__ == "__main__":
    import sys

    # Check if --reload flag is passed
    reload = "--reload" in sys.argv
    main(reload=reload)

"""
# Example Usage:

1. Get the prompt

curl -X POST http://localhost:8001/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "prompts/get",
    "params": {
      "name": "simple"
    }
  }'

2. Execute code (note: use double quotes inside the code string)

curl -X POST http://localhost:8001/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "print(\"Hello World\")"
      }
    }
  }'

3. Execute code with multiline example

curl -X POST http://localhost:8001/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "result = 2 + 2\nprint(f\"Result: {result}\")\nprint(\"Calculation complete!\")"
      }
    }
  }'

4. Execute async code

curl -X POST http://localhost:8001/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "import asyncio\nprint(\"Starting async task...\")\nawait asyncio.sleep(0.5)\nprint(\"Async task completed!\")"
      }
    }
  }'

5. Execute code with HTML output

curl -X POST http://localhost:8001/mcp \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "execute_code_with_html",
      "arguments": {
        "code": "print(\"HTML-enabled execution\")\ndata = {\"message\": \"Hello HTML!\", \"numbers\": [1, 2, 3]}\nprint(f\"Data: {data}\")"
      }
    }
  }'

Note: When including quotes in the code string, use double quotes (\") instead of single quotes (') to avoid JSON parsing errors.
"""
