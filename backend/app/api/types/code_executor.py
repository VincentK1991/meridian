from pydantic import BaseModel


class CodeExecutionResult(BaseModel):
    code: str
    print_output: str
    success: bool


class CodeExecutionWithHtml(CodeExecutionResult):
    html: str
