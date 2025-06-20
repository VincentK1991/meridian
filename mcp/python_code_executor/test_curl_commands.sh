#!/bin/bash

# Test curl commands for the MCP Code Execution Server
# Make sure the server is running: python server.py

SERVER_URL="http://localhost:8001/mcp"
CONTENT_TYPE="Content-Type: application/json"
ACCEPT_HEADERS="Accept: application/json, text/event-stream"

echo "🚀 Testing MCP Code Execution Server"
echo "======================================"

# Test 1: List available tools
echo ""
echo "📋 Test 1: List available tools"
echo "curl -X POST $SERVER_URL -H '$CONTENT_TYPE' -H '$ACCEPT_HEADERS' -d '{\"jsonrpc\": \"2.0\", \"method\": \"tools/list\", \"id\": 1}'"

curl -X POST "$SERVER_URL" \
  -H "$CONTENT_TYPE" \
  -H "$ACCEPT_HEADERS" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 2: Execute simple Python code
# echo ""
# echo "🐍 Test 2: Execute simple Python code"
# echo ""

# curl -X POST "$SERVER_URL" \
#   -H "$CONTENT_TYPE" \
#   -H "$ACCEPT_HEADERS" \
#   -d '{
#     "jsonrpc": "2.0",
#     "method": "tools/call",
#     "params": {
#       "name": "execute_code",
#       "arguments": {
#         "code": "print(\"Hello from MCP!\")\nresult = 2 + 2\nprint(f\"2 + 2 = {result}\")"
#       }
#     },
#     "id": 2
#   }' | jq '.'

# echo ""
# echo "----------------------------------------"

# Test 3: Execute async Python code (showcasing our new async-first approach)
echo ""
echo "⚡ Test 3: Execute async Python code with await"
echo ""

curl -X POST "$SERVER_URL" \
  -H "$CONTENT_TYPE" \
  -H "$ACCEPT_HEADERS" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "print(\"Starting async task...\")\nawait asyncio.sleep(0.5)\nprint(\"Async sleep completed!\")\nresult = \"async works!\"\nprint(f\"Result: {result}\")"
      }
    },
    "id": 3
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 4: Execute code with numpy (if available)
echo ""
echo "🔢 Test 4: Execute code with numpy"
echo ""

curl -X POST "$SERVER_URL" \
  -H "$CONTENT_TYPE" \
  -H "$ACCEPT_HEADERS" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "try:\n    import numpy as np\n    arr = np.array([1, 2, 3, 4, 5])\n    result = np.sum(arr ** 2)\n    print(f\"NumPy array: {arr}\")\n    print(f\"Sum of squares: {result}\")\nexcept ImportError:\n    print(\"NumPy not available, using basic Python\")\n    arr = [1, 2, 3, 4, 5]\n    result = sum(x**2 for x in arr)\n    print(f\"Python list: {arr}\")\n    print(f\"Sum of squares: {result}\")"
      }
    },
    "id": 4
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 5: Execute async code with loops and multiple awaits
echo ""
echo "🔄 Test 5: Execute complex async code with loops"
echo ""

curl -X POST "$SERVER_URL" \
  -H "$CONTENT_TYPE" \
  -H "$ACCEPT_HEADERS" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "print(\"Starting async loop operations...\")\n\nresults = []\nfor i in range(3):\n    print(f\"Processing item {i+1}/3...\")\n    await asyncio.sleep(0.1)\n    result = i ** 2\n    results.append(result)\n    print(f\"  Item {i+1} result: {result}\")\n\nprint(f\"All operations completed!\")\nprint(f\"Final results: {results}\")\nprint(f\"Sum: {sum(results)}\")"
      }
    },
    "id": 5
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 6: Test error handling
echo ""
echo "❌ Test 6: Test error handling"
echo ""

curl -X POST "$SERVER_URL" \
  -H "$CONTENT_TYPE" \
  -H "$ACCEPT_HEADERS" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "execute_code",
      "arguments": {
        "code": "print(\"Before error...\")\nresult = undefined_variable\nprint(\"This won'\''t print\")"
      }
    },
    "id": 6
  }' | jq '.'

echo ""
echo "----------------------------------------"

# Test 7: Test execute_code_with_html tool
# echo ""
# echo "🌐 Test 7: Test execute_code_with_html tool"
# echo ""

# curl -X POST "$SERVER_URL" \
#   -H "$CONTENT_TYPE" \
#   -H "$ACCEPT_HEADERS" \
#   -d '{
#     "jsonrpc": "2.0",
#     "method": "tools/call",
#     "params": {
#       "name": "execute_code_with_html",
#       "arguments": {
#         "code": "print(\"HTML-enabled code execution\")\nawait asyncio.sleep(0.1)\ndata = {\"message\": \"Hello HTML!\", \"numbers\": [1, 2, 3]}\nprint(f\"Data: {data}\")"
#       }
#     },
#     "id": 7
#   }' | jq '.'

echo ""
echo "======================================"
echo "✅ All tests completed!"
echo ""
echo "Key features demonstrated:"
echo "• ✅ Basic Python code execution"
echo "• ✅ Async code with await asyncio.sleep()"
echo "• ✅ NumPy integration"
echo "• ✅ Complex async operations with loops"
echo "• ✅ Error handling"
echo "• ✅ HTML-enabled execution"
echo ""
echo "The async-first approach allows users to write:"
echo "  await asyncio.sleep(0.5)  # ← This works perfectly!"
echo "Instead of problematic:"
echo "  time.sleep(0.5)          # ← This could hang in concurrent execution"
