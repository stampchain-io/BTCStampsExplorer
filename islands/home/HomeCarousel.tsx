import Carousel from "../Carousel.tsx";

export const HomeCarousel = () => {
  return (
    <div class="w-full h-[400px]">
      <Carousel
        showNavigation={true}
        automatic={true}
        interval={5000}
      />
    </div>
  );
};
