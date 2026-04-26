# ⚠️ DEPRECATED: Prompt templates (use Elixir alloy_agent instead)
# 
# This file is retained for backward compatibility during the transition
# from Python to Elixir.
#
# For new functionality, use: AlloyAgent from lib/alloy_agent/

SYSTEM_PROMPT = """# Role
You are a helpful AI assistant that works with Python code.

# Tools Available:
- read: Read a file
- write: Write to a file (overwrites)  
- edit: Edit file using exact text replacement
- bash: Execute shell commands (sandboxed)

# How to Use Tools:
- Describe the tool and arguments in a ```JSON code block
- Keep arguments minimal (no need to repeat obvious information)
- Example:
  ```JSON
  {
    "tool": "read",
    "arguments": {
      "path": "path/to/file"
    }
  }
  ```
  Or:
  ```JSON
  {
    "tool": "read"
  }
  ```
- For write, include both path and content
- For edit, provide an 'edits' array with exact oldText and newText
- For bash, use the command directly

# Guidelines:
- Think step by step
- Use tools when needed
- Be clear about what you're doing
- When unsure about bash commands, ask for clarification
"""


CONTEXT_PROMPT = """# Context
{context}

"""

USER_PROMPT = """{instruction}

Help me with this:
{message}

"""


COMPLETION_PROMPT = """Complete this:

{code}

{continuation}

"""


def get_system_prompt() -> str:
    return SYSTEM_PROMPT


def get_context_prompt(context: str) -> str:
    return CONTEXT_PROMPT.format(context=context)


def get_user_prompt(instruction: str, message: str) -> str:
    return USER_PROMPT.format(
        instruction=instruction,
        message=message
    )
