import { Flex, Text, chakra } from "@chakra-ui/react";
import { useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";

interface InteractiveRatingProps {
  value?: number | null;
  count?: number;
  userRating?: number | null;
  disabled?: boolean;
  isLoading?: boolean;
  onRate: (rating: number) => void;
}

export default function InteractiveRating({
  value = 0,
  count = 0,
  userRating,
  disabled = false,
  isLoading = false,
  onRate,
}: InteractiveRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating ?? userRating ?? Math.round(value ?? 0);
  const ratingLabel = `${Number(value ?? 0).toFixed(1)} (${count ?? 0})`;

  return (
    <Flex align="center" gap={2} onClick={(event) => event.stopPropagation()}>
      <Flex align="center" gap={1} aria-label={`Calificacion ${ratingLabel}`}>
        {Array.from({ length: 5 }).map((_, index) => {
          const rating = index + 1;
          const isActive = displayRating >= rating;
          const Icon = isActive ? FaStar : FaRegStar;

          return (
            <chakra.button
              key={rating}
              type="button"
              aria-label={`Calificar con ${rating} estrella${rating === 1 ? "" : "s"}`}
              disabled={disabled || isLoading}
              color={isActive ? "accent.500" : "muted.300"}
              cursor={disabled ? "default" : "pointer"}
              opacity={disabled ? 0.5 : 1}
              onMouseEnter={() => !disabled && setHoverRating(rating)}
              onMouseLeave={() => setHoverRating(null)}
              onFocus={() => !disabled && setHoverRating(rating)}
              onBlur={() => setHoverRating(null)}
              onClick={() => !disabled && !isLoading && onRate(rating)}
              p={1}
            >
              <Icon size={16} />
            </chakra.button>
          );
        })}
      </Flex>
      <Text color="gray.300" fontSize="sm" minW="4.25rem">
        {ratingLabel}
      </Text>
    </Flex>
  );
}
