export const someIcon = [
  "M10 10L20 20",  // Regular path - uses icon-level styles
  {
    path: "M5 5L15 15", 
    style: "stroke-red-500"  // Custom stroke, no fill
  },
  {
    path: "M16 17.5C16.8284...", 
    style: "stroke-none fill-stroke"  // Gets fill matching icon color!
  }
];