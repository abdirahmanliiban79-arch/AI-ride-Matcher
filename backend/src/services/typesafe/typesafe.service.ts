import { callTypeSafeChat } from './client';
import { parseTypeSafeDecision } from './decisionParser';
import { buildDecisionPrompt } from './prompt';
import type { TypeSafeDecisionRequest, TypeSafeDecisionResult } from './types';

export async function requestTypeSafeDecision(
  request: TypeSafeDecisionRequest,
): Promise<TypeSafeDecisionResult> {
  const prompt = buildDecisionPrompt(request.requirements, request.candidates);
  const response = await callTypeSafeChat([{ role: 'user', content: prompt }]);
  const decision = parseTypeSafeDecision(response.content);

  return {
    decision,
    meta: {
      model: response.model,
      provider: response.provider,
      latencyMs: response.latencyMs,
      totalTokens: response.totalTokens,
      cost: response.cost,
    },
  };
}