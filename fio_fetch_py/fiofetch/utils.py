"""
Utility functions for the fiofetch application.
"""
import urllib.parse


def mask_token(text: str, token: str) -> str:
    """
    Mask the token in strings to prevent exposure in logs and error messages.
    Replaces the token with '<token>' placeholder.
    
    This function handles:
    - Direct token occurrences in text
    - URL-encoded tokens
    
    Args:
        text: The text that may contain the token
        token: The token to mask
        
    Returns:
        The text with all token occurrences replaced by '<token>'
        
    Example:
        >>> mask_token("https://api.example.com/key/abc123/data", "abc123")
        'https://api.example.com/key/<token>/data'
    """
    if not token or not text:
        return text
    
    # Replace token in URLs and any other occurrences
    masked_text = text.replace(token, '<token>')
    
    # Also handle URL-encoded tokens if present
    try:
        encoded_token = urllib.parse.quote(token)
        if encoded_token != token:
            masked_text = masked_text.replace(encoded_token, '<token>')
    except Exception:
        # If encoding fails, just continue with the non-encoded replacement
        pass
    
    return masked_text

