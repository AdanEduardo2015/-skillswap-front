import { Flex } from "@chakra-ui/react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";

interface RatingStarsProps {
  value?: number | null;
  max?: number;
  size?: number;
  label?: string;
}

export default function RatingStars({ value = 0, max = 5, size = 16, label }: RatingStarsProps) {
  const rating = Math.max(0, Math.min(Number(value ?? 0), max));

  return (
    <Flex
      align="center"
      gap={1}
      color="accent.500"
      aria-label={label ?? `Calificacion ${rating} de ${max}`}
      role="img"
    >
      {Array.from({ length: max }).map((_, index) => {
        const position = index + 1;

        if (rating >= position) {
          return <FaStar key={position} size={size} />;
        }

        if (rating >= position - 0.5) {
          return <FaStarHalfAlt key={position} size={size} />;
        }

        return <FaRegStar key={position} size={size} />;
      })}
    </Flex>
  );
}
