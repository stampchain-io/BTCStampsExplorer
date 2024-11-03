import Carousel from "$islands/Carousel.tsx";
import { StampRow } from "globals";

interface HomeCarouselProps {
  carouselStamps: StampRow[];
}

export function HomeCarousel({ carouselStamps }: HomeCarouselProps) {
  return <Carousel stamps={carouselStamps} />;
}
