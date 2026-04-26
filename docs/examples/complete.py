# ⚠️ DEPRECATED: Python completion (use Elixir alloy_agent instead)
# 
# This file is retained for backward compatibility during the transition
# from Python to Elixir.
#
# For new functionality, use: AlloyAgent from lib/alloy_agent/

from models import get_model, get_model_config
from prompt_templates import system_prompt, context_prompt, user_prompt, completion_prompt

def complete(file: str, prompt: str, model=None) -> str:
    """
    Complete code for a given file.
    
    Args:
        file: Path to the file to complete
        prompt: The prompt for completion
        model: Model to use (None for auto-selection)
    
    Returns:
        Completion text
    """
    
    # TODO: Migrate to Elixir alloy_agent
    # For now, this is a stub
    
    if not file or not file.endswith('.py'):
        raise ValueError("This file is deprecated. Use Elixir alloy_agent instead.")
    
    return f"[Python completion stub - migrated to Elixir alloy_agent]"
