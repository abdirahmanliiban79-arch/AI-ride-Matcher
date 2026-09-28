import { z } from 'zod';

import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

const CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 30_000;

const chatCompletionResponseSchema = z.object({
  model: z.string(),
  provider: z.string().optional(),
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string() }),
      }),
    )
    .min(1),
  usage: z
    .object({
      total_tokens: z.number().optional(),
      cost: z.number().optional(),
    })
    .optional(),
});

export type ChatMessage = {
  role: 'system' | 'user';
  content: string;
};

export type TypeSafeChatResult = {
  content: string;
  model: string;
  provider: string | null;
  latencyMs: number;
  totalTokens: number | null;
  cost: number | null;
};

export async function callTypeSafeChat(messages: ChatMessage[]): Promise<TypeSafeChatResult> {
  const apiKey = env.TYPE_SAFE_API_KEY;
  if (!apiKey) {
    throw new AppError(500, 'AI_NOT_CONFIGURED', 'TypeSafe API key is not configured');
  }

  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: env.TYPE_SAFE_MODEL, messages }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new AppError(504, 'AI_TIMEOUT', 'The AI decision engine timed out');
    }

    throw new AppError(502, 'AI_PROVIDER_ERROR', 'Failed to reach the AI decision engine');
  }

  if (!response.ok) {
    throw new AppError(502, 'AI_PROVIDER_ERROR', `AI provider returned HTTP ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned a non-JSON response');
  }

  const parsed = chatCompletionResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(
      502,
      'AI_INVALID_RESPONSE',
      'AI provider response did not match the expected shape',
    );
  }

  const choice = parsed.data.choices[0];
  if (!choice) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned no choices');
  }

  return {
    content: choice.message.content,
    model: parsed.data.model,
    provider: parsed.data.provider ?? null,
    latencyMs: Date.now() - startedAt,
    totalTokens: parsed.data.usage?.total_tokens ?? null,
    cost: parsed.data.usage?.cost ?? null,
  };
}