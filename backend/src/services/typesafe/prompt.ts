import type { DriverCandidate, RideRequirements } from '../matching/eligibility';

export function buildDecisionPrompt(
  requirements: RideRequirements,
  candidates: DriverCandidate[],
): string {
  const lines = [
    'Task: choose the single best driver for this ride request.',
    'Respond with ONLY one JSON object. No markdown, no code fences, no explanation.',
    'Use exactly this shape:',
    '{"selectedDriverId": string, "matchType": "best_match" | "no_match" | "human_review", "confidence": number between 0 and 1}',
    '',
    'Ride request:',
    `- pickup: latitude ${requirements.pickup.latitude}, longitude ${requirements.pickup.longitude}`,
    `- destination: latitude ${requirements.destination.latitude}, longitude ${requirements.destination.longitude}`,
    `- maxPrice: ${requirements.maxPrice}`,
    `- preferredVehicleType: ${requirements.preferredVehicleType}`,
    `- maxWaitTime: ${requirements.maxWaitTime} minutes`,
    '',
    'Eligible drivers:',
    JSON.stringify(candidates),
    '',
    'Choose exactly one driverId from the eligible list.',
    'Use "best_match" when a listed driver is a good choice, "human_review" when you are unsure, and "no_match" only when no listed driver is acceptable.',
  ];

  return lines.join('\n');
}