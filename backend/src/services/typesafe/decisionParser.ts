import { typeSafeDecisionSchema } from '../../schemas/typesafe.schemas';
import { AppError } from '../../utils/AppError';
import type { TypeSafeDecision } from './types';

function tryParseJson(value: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
}

function extractJsonObject(content: string): unknown {
  const trimmed = content.trim();

  const direct = tryParseJson(trimmed);
  if (direct.ok) {
    return direct.value;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI response did not contain a JSON object');
  }

  const extracted = tryParseJson(match[0]);
  if (!extracted.ok) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI response was not valid JSON');
  }

  return extracted.value;
}

export function parseTypeSafeDecision(content: string): TypeSafeDecision {
  const raw = extractJsonObject(content);
  const parsed = typeSafeDecisionSchema.safeParse(raw);

  if (!parsed.success) {
    throw new AppError(
      502,
      'AI_INVALID_RESPONSE',
      'AI decision did not match the expected contract',
    );
  }

  return parsed.data;
}