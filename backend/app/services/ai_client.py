"""Gemini chat client and message wrapper."""

import asyncio
import logging
import os

from google import genai
from google.genai import types

from ..config import load_emergent_config

class LlmChat:
    def __init__(self, api_key: str, session_id: str, system_message: str):
        self.config = load_emergent_config()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY', '')
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        self.session_id = session_id
        self.system_message = system_message
        
        # Initialize the new Client
        self.client = genai.Client(api_key=self.api_key)
        
        # SETTING: Default to Gemini 3 Flash Preview
        self.model_name = 'gemini-3-flash-preview'

    def with_model(self, provider: str, model: str):
        self.model_name = model
        return self

    async def send_message(self, message):
        """
        Sends a message to Gemini with automatic fallbacks for stability.
        Priority: Gemini 3 Flash -> Gemini 2.0 Flash -> Gemini 1.5 Flash
        """
        # List of models to try in order of preference
        models_to_try = [
            self.model_name,          # The requested model (default: gemini-3-flash-preview)
            'gemini-2.0-flash-exp',   # Fallback 1: High speed experimental
            'gemini-1.5-flash'        # Fallback 2: Stable legacy
        ]

        last_error = None

        for model in models_to_try:
            try:
                logging.debug(f"Attempting to generate response using {model}...")
                
                # Create chat using the new SDK structure
                chat = self.client.chats.create(
                    model=model,
                    config=types.GenerateContentConfig(
                        system_instruction=self.system_message,
                        temperature=0.7
                    )
                )
                response = await asyncio.to_thread(chat.send_message, message.text)
                logging.info(f"Successfully generated response using {model}")
                return response.text

            except Exception as e:
                error_msg = str(e)
                last_error = error_msg
                logging.warning(f"Failed to use {model}: {error_msg}")
                
                # If it's a 404 (Not Found) or 429 (Rate Limit), try the next model
                if "404" in error_msg or "429" in error_msg or "503" in error_msg:
                    continue
                else:
                    # Keep provider details in logs, not in the user's chat bubble.
                    if "401" in error_msg or "UNAUTHENTICATED" in error_msg:
                        raise RuntimeError("Gemini authentication failed") from e
                    raise RuntimeError("Gemini request failed") from e
        
        raise RuntimeError("All configured Gemini models are unavailable")

class UserMessage:
    def __init__(self, text: str):
        self.text = text


