export interface RatingSummary {
  ratingAvg: number;
  ratingCount: number;
}

export const clampCount = (value: number): number => Math.max(0, Number(value) || 0);

export const applyCountDelta = (currentValue: number | undefined, delta: number): number =>
  clampCount((currentValue ?? 0) + delta);

export const calculateOptimisticRatingSummary = (
  currentAvg: number | undefined,
  currentCount: number | undefined,
  nextRating: number,
  previousRating?: number | null
): RatingSummary => {
  const rating = Math.min(5, Math.max(1, Math.round(nextRating)));
  const count = clampCount(currentCount ?? 0);
  const avg = Number(currentAvg ?? 0);
  const hasPreviousRating = previousRating !== null && previousRating !== undefined;
  const nextCount = hasPreviousRating ? Math.max(1, count) : count + 1;
  const totalBefore = avg * count;
  const totalAfter = hasPreviousRating ? totalBefore - Number(previousRating) + rating : totalBefore + rating;
  const ratingAvg = nextCount > 0 ? Number((totalAfter / nextCount).toFixed(2)) : rating;

  return {
    ratingAvg,
    ratingCount: nextCount,
  };
};
