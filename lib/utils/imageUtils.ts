export const NOT_AVAILABLE_IMAGE = "/not-available.png";

export function showFallback(element: HTMLElement) {
  const fallback = document.createElement("img");
  fallback.src = NOT_AVAILABLE_IMAGE;
  fallback.alt = "Content not available";
  fallback.className = "w-full h-full object-contain rounded-lg pixelart";

  if (element instanceof HTMLIFrameElement) {
    element.style.display = "none";
    if (element.parentNode) {
      element.parentNode.appendChild(fallback);
    }
  } else {
    element.innerHTML = "";
    element.appendChild(fallback);
  }
}

export function handleImageError(e: Event) {
  if (e.currentTarget instanceof HTMLImageElement) {
    e.currentTarget.src = NOT_AVAILABLE_IMAGE;
  } else if (e.currentTarget instanceof HTMLIFrameElement) {
    showFallback(e.currentTarget);
  }
}

// function showFallback(element: HTMLElement) {
//   const fallback = document.createElement("img");
//   fallback.src = "/not-available.png";
//   fallback.alt = "Content not available";
//   fallback.className = "w-full h-full object-contain rounded-lg";

//   if (element instanceof HTMLIFrameElement) {
//     element.style.display = "none";
//     if (element.parentNode) {
//       element.parentNode.appendChild(fallback);
//     }
//   } else {
//     element.innerHTML = "";
//     element.appendChild(fallback);
//   }
// }
