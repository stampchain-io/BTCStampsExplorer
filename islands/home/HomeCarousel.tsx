// import { h } from "preact";
// import Flicking, { MoveEvent, WillChangeEvent } from "@egjs/preact-flicking";
// import { Carousel } from "netzo";
import Slider from "npm:react-slick@0.30.2";

export const HomeCarousel = () => {
  var settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div>
      {/* <Slider {...settings}> */}
      <div>
        <img src="/img/home/carousel1.png" />
      </div>
      <div>
        <img src="/img/home/carousel2.png" />
      </div>
      <div>
        <img src="/img/home/carousel3.png" />
      </div>
      {/* </Slider> */}
    </div>
  );
};
