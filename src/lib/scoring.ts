import { Provider, TimeSlot, ScoredResult } from './types';

export function scoreProviders(
  providerSlots: { provider: Provider; slot: TimeSlot }[],
  weights: { availability: number; rating: number; distance: number },
  userAvailability: TimeSlot[]
): ScoredResult[] {
  const maxDist = Math.max(...providerSlots.map(ps => ps.provider.distance), 1);
  const maxRating = 5;

  return providerSlots.map(({ provider, slot }) => {
    const availMatch = userAvailability.some(
      ua => ua.day === slot.day && ua.start <= slot.start && ua.end >= slot.end
    );
    const availScore = availMatch ? 1 : 0.4;
    const ratingScore = provider.rating / maxRating;
    const distScore = 1 - provider.distance / (maxDist + 1);

    const wTotal = weights.availability + weights.rating + weights.distance;
    const total =
      (weights.availability / wTotal) * availScore +
      (weights.rating / wTotal) * ratingScore +
      (weights.distance / wTotal) * distScore;

    return {
      provider,
      slot,
      scores: {
        availability: Math.round(availScore * 100),
        rating: Math.round(ratingScore * 100),
        distance: Math.round(distScore * 100),
        total: Math.round(total * 100),
      },
    };
  }).sort((a, b) => b.scores.total - a.scores.total);
}
