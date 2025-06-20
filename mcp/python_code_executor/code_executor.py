import asyncio
import concurrent.futures
import io
import traceback
from contextlib import redirect_stderr, redirect_stdout

from pydantic import BaseModel


class CodeExecutionResult(BaseModel):
    code: str
    print_output: str
    success: bool


class CodeExecutionWithHtml(CodeExecutionResult):
    html: str


async def _execute_async_code(code: str) -> CodeExecutionResult:
    """
    Execute user code as async code in the event loop.
    This allows users to use await, asyncio.sleep, etc.
    """
    # Create string buffers to capture stdout and stderr
    stdout_buffer = io.StringIO()
    stderr_buffer = io.StringIO()

    success = True
    captured_output = ""

    try:
        # Create a clean namespace for code execution
        exec_globals = {
            "__builtins__": __builtins__,
            "print": print,
            "asyncio": asyncio,  # Make asyncio available by default
        }
        exec_locals = {}

        # Wrap user code in an async function
        async_code = f"""
async def user_async_function():
{chr(10).join("    " + line for line in code.strip().split(chr(10)))}
"""

        # Create a custom print function that writes to our buffer
        def task_print(*args, **kwargs):
            # Redirect print to our task-specific buffer
            kwargs["file"] = stdout_buffer
            print(*args, **kwargs)

        # Update the globals to use our custom print
        exec_globals["print"] = task_print

        # Execute without global stdout/stderr redirection to avoid conflicts
        # First, define the async function
        exec(async_code, exec_globals, exec_locals)

        # Then, await it with stderr capture
        with redirect_stderr(stderr_buffer):
            user_function = exec_locals["user_async_function"]
            await user_function()

        # Get the captured output
        stdout_content = stdout_buffer.getvalue()
        stderr_content = stderr_buffer.getvalue()

        # Combine stdout and stderr
        captured_output = stdout_content
        if stderr_content:
            captured_output += f"\nSTDERR:\n{stderr_content}"

    except Exception:
        success = False
        # Capture the error message and traceback
        error_traceback = traceback.format_exc()
        captured_output = f"Error executing async code:\n{error_traceback}"

        # Also capture any output that was generated before the error
        stdout_content = stdout_buffer.getvalue()
        stderr_content = stderr_buffer.getvalue()
        if stdout_content or stderr_content:
            captured_output = f"Output before error:\n{stdout_content}"
            if stderr_content:
                captured_output += f"\nSTDERR:\n{stderr_content}"
            captured_output += f"\n\nError:\n{error_traceback}"

    return CodeExecutionResult(
        code=code, print_output=captured_output.strip(), success=success
    )


async def execute_code_async(code: str) -> CodeExecutionResult:
    """
    Execute arbitrary Python code as async code.

    Users can use await, asyncio.sleep, and other async constructs.
    Multiple executions run concurrently in the same event loop.

    Args:
        code: The Python code string to execute (can use await syntax)

    Returns:
        CodeExecutionResult: Object containing the code, captured output, and success status
    """
    return await _execute_async_code(code)


def execute_code(code: str) -> CodeExecutionResult:
    """
    Execute arbitrary Python code (synchronous wrapper).

    This is a synchronous wrapper that runs the async version.
    Use execute_code_async for better performance.

    Args:
        code: The Python code string to execute

    Returns:
        CodeExecutionResult: Object containing the code, captured output, and success status
    """
    # If we're already in an event loop, we can't use asyncio.run()
    try:
        loop = asyncio.get_running_loop()
        # We're in an async context, this shouldn't be called
        return CodeExecutionResult(
            code=code,
            print_output="Error: execute_code() called from async context. Use execute_code_async() instead.",
            success=False,
        )
    except RuntimeError:
        # No event loop running, we can use asyncio.run()
        return asyncio.run(_execute_async_code(code))


async def execute_code_with_sync_fallback(code: str) -> CodeExecutionResult:
    """
    Execute code with fallback to sync execution if async fails.

    This tries to execute as async first, then falls back to sync if needed.
    """
    try:
        # Try async execution first
        return await _execute_async_code(code)
    except SyntaxError as e:
        if "await" in str(e):
            # If it's an await syntax error, the code might be sync
            return await _execute_sync_code_fallback(code)
        else:
            # Other syntax errors should be reported
            return CodeExecutionResult(
                code=code, print_output=f"Syntax error: {str(e)}", success=False
            )


async def _execute_sync_code_fallback(code: str) -> CodeExecutionResult:
    """
    Fallback to execute synchronous code in a thread.
    """

    def _sync_exec(code: str) -> CodeExecutionResult:
        stdout_buffer = io.StringIO()
        stderr_buffer = io.StringIO()

        success = True
        captured_output = ""

        try:
            exec_globals = {
                "__builtins__": __builtins__,
                "print": print,
                "asyncio": asyncio,
            }
            exec_locals = {}

            with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
                exec(code, exec_globals, exec_locals)

            stdout_content = stdout_buffer.getvalue()
            stderr_content = stderr_buffer.getvalue()

            captured_output = stdout_content
            if stderr_content:
                captured_output += f"\nSTDERR:\n{stderr_content}"

        except Exception:
            success = False
            error_traceback = traceback.format_exc()
            captured_output = f"Error executing sync code:\n{error_traceback}"

            stdout_content = stdout_buffer.getvalue()
            stderr_content = stderr_buffer.getvalue()
            if stdout_content or stderr_content:
                captured_output = f"Output before error:\n{stdout_content}"
                if stderr_content:
                    captured_output += f"\nSTDERR:\n{stderr_content}"
                captured_output += f"\n\nError:\n{error_traceback}"

        return CodeExecutionResult(
            code=code, print_output=captured_output.strip(), success=success
        )

    # Run sync code in a thread
    loop = asyncio.get_event_loop()
    with concurrent.futures.ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, _sync_exec, code)
