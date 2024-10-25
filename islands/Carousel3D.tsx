import { useEffect, useRef } from "preact/hooks";
import createCarouselSlider from "$lib/utils/carousel-slider.ts";

interface SlideData {
  url: string;
  alt: string;
  title: string;
  subTitle: string;
  description: string;
}

const SLIDE_DATA: SlideData[] = [
  {
    url: "/img/home/carousel1.png",
    alt: "Slide 1",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel2.png",
    alt: "Slide 2",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel3.png",
    alt: "Slide 3",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel1.png",
    alt: "Slide 4",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel2.png",
    alt: "Slide 5",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel2.png",
    alt: "Slide 2",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel3.png",
    alt: "Slide 3",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel2.png",
    alt: "Slide 2",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
  {
    url: "/img/home/carousel3.png",
    alt: "Slide 3",
    title: "PEPE",
    subTitle: "BY VOGELMANN",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed consequat eu leo nec efficitur. Proin sed ipsum sed risus consectetur varius a quis magna.",
  },
];

const Carousel3D = () => {
  const swiperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (swiperRef.current) {
      createCarouselSlider(swiperRef.current);
    }
  }, []);

  return (
    <div style={{ width: "80%", height: "500px", margin: "0 auto" }}>
      <div className="carousel-slider h-full" loop ref={swiperRef}>
        <div className="swiper h-full">
          <div className="swiper-wrapper h-full">
            {SLIDE_DATA.map((slide: SlideData, index) => (
              <div className="swiper-slide" key={index}>
                <div className="carousel-slider-animate-opacity">
                  <img
                    className="w-[313px] height-[313px] md:w-[408px] md:h-[408px]"
                    src={slide.url}
                    alt={slide.alt}
                  />
                </div>
              </div>
            ))}
          </div>
          <div class="swiper-pagination mt-12"></div>
        </div>
      </div>
    </div>
  );
};

export default Carousel3D;
