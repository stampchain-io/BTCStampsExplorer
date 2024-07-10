// import Flicking, {
//   MoveEvent,
//   WillChangeEvent,
// } from "https://esm.sh/@egjs/preact-flicking@4.11.0";

export const HomeCarousel = () => {
  return (
    // <Flicking
    //   viewportTag="div"
    //   cameraTag="div"
    //   cameraClass=""
    //   align="center"
    //   onMove={(e: MoveEvent) => {}}
    //   onWillChange={(e: WillChangeEvent) => {}}
    //   horizontal={true}
    //   circular={true}
    // >
    //   <div>panel 0</div>
    //   <div>panel 1</div>
    //   <div>panel 2</div>
    // </Flicking>
    <div>
      <div>
        <img src="/img/home/carousel1.png" />
      </div>
      <div>
        <img src="/img/home/carousel2.png" />
      </div>
      <div>
        <img src="/img/home/carousel3.png" />
      </div>
    </div>
  );
};
