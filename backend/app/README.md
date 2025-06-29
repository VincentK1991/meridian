# Using Google ADK Web UI

all of the Google ADK agents are in the agents/ folder.
they are organized under this folder structure:

```
agents/
├── __init__.py
├── agent_one/
│   ├── __init__.py
│   └── agent.py
├── agent_two/
│   ├── __init__.py
│   └── agent.py
...
```

to run the web UI to inspect all of the agents. this will load all of the agents under agents/ folder.

```bash
adk web multi_agents --reload
```

this should be available on localhost:8000


## Note 1:

all of the agents are assigned to root_agent variable. we then alias this in the `__init__.py`
for example `__init__.py` for code_execution_agent look something like this

```python
from .agent import root_agent as coding_agent

__all__ = ["coding_agent"]

```
