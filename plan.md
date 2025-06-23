# working plan

basic session plan

1. ~~create a route to return session information based on a session_id~~
2. ~~display session information in the frontend (events of various types)~~
3. ability to soft delete a session
4. ability for user to send user input into a session
5. output to add to a session (via streaming mode)

basic RAG plan

1. use pgvector + a small embedding model

basic neo4j plan

1. ~~use pydantic structured extraction + embedding~~

MCP plan

1. ~~build a basic streambale http MCP with oauth in the header~~
2. perform ad injection using MCP

Oauth plan
1. building oauth for google to get access_token and refresh_token of various scopes

- right now we still encounter bug where the redirect url needs to be different
between 1. google_identity vs 2. various oauth connections
so that we separate the process of getting oauth for identity of the app
vs getting oauth for access to specific services

because the scope will be difference between the endpoint that verify the google identity redirection
vs the one that verify the oauth connection
and you will get this type of error
```python
Exception: Failed to get user info from Google: Scope has changed from
"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid"
to "https://www.googleapis.com/auth/drive".
```

- also after successful redirect of the oauth integration window,
  the window should not returns to localhost:5173 but should returns to
  a dedicated window saying something like "the redirection finished you may close this window"

-

personalization of agentic AI

what is the value prop?

how can ads be used here?





