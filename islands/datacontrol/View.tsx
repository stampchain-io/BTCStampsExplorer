import { Button } from "$components/shared/Button.tsx";

const ViewToggleButton = () => {
  const handleView = (view: string) => {
    const url = new URL(globalThis.location.href);
    url.searchParams.set("view", view);
    globalThis.location.href = url.toString();
  };
  return (
    <>
      <div class="inline-flex rounded-md shadow-xs" role="group">
        <div class="tooltip-container">
          <Button
            variant="icon"
            class="rounded-none rounded-s-md"
            onClick={() => handleView("small")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <g>
                  <rect width="4" height="4" x="1" y="1" rx="1" ry="1" />
                  <rect width="4" height="4" x="1" y="6" rx="1" ry="1" />
                  <rect width="4" height="4" x="1" y="11" rx="1" ry="1" />
                  <rect width="4" height="4" x="6" y="11" rx="1" ry="1" />
                  <rect width="4" height="4" x="6" y="6" rx="1" ry="1" />
                  <rect width="4" height="4" x="11" y="6" rx="1" ry="1" />
                  <rect width="4" height="4" x="11" y="11" rx="1" ry="1" />
                  <rect width="4" height="4" x="6" y="1" rx="1" ry="1" />
                  <rect width="4" height="4" x="11" y="1" rx="1" ry="1" />
                </g>
              </svg>
            }
          />
          <div class="tooltip-text">Small</div>
        </div>
        <div class="tooltip-container">
          <Button
            variant="icon"
            class="border-l-0 border-r-0 rounded-none"
            onClick={() => handleView("large")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
              >
                <g>
                  <rect width="7" height="7" rx="1" ry="1" />
                  <rect width="7" height="7" y="9" rx="1" ry="1" />
                  <rect width="7" height="7" x="9" rx="1" ry="1" />
                  <rect width="7" height="7" x="9" y="9" rx="1" ry="1" />
                </g>
              </svg>
            }
          />
          <div class="tooltip-text">Large</div>
        </div>
        <div class="tooltip-container">
          <Button
            variant="icon"
            class="rounded-none rounded-e-md"
            onClick={() => handleView("detail")}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 32 32"
              >
                <path d="M8 6h9v2H8zm0-3h11v2H8zM1 3h6v6H1zm7 11h9v2H8zm0-3h11v2H8zm-7 0h6v6H1z" />
              </svg>
            }
          />
          <div class="tooltip-text">Detail</div>
        </div>
      </div>
    </>
  );
};

export default ViewToggleButton;
