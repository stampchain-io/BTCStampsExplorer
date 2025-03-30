/* ===== MENU ICON COMPONENT ===== */
export const HamburgerMenuIcon = (
  { isOpen, onClick }: { isOpen: boolean; onClick: () => void },
) => {
  /* ===== CLICK HANDLER WITH ANIMATION TIMING ===== */
  const handleClick = () => { // If we're going from closed to open, add delay
    if (!isOpen) {
      setTimeout(() => {
        onClick();
      }, 250);
    } else {
      onClick(); // If we're closing, trigger immediately
    }
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <div
      className={`hamburger-menu ${isOpen ? "is-active" : ""}`}
      onClick={handleClick}
    >
      <span className="line-1"></span>
      <span className="line-2"></span>
      <span className="line-3"></span>

      {/* ===== COMPONENT STYLES ===== */}
      <style>
        {`
        /* Base button styles */
        .hamburger-menu {
          width: 26px;
          cursor: pointer;
          z-index: 100;
        }
        
        /* Shared line styles */
        .hamburger-menu span {
          display: block;
          height: 3px;
          border-radius: 1px;
          background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          position: relative;
        }

        /* Line spacing */
        .hamburger-menu span + span {
          margin-top: 4px;
        }
        
        /* Individual line styles */
        .line-1 {
          height: 3px;
          width: 100%;
        }
        
        .line-2 {
          height: 3px;
          width: 80%;
          margin-left: auto;
          transition: width 0.3s ease;
        }
       
        .line-3 {
          height: 3px;
          width: 100%;
        }

        /* Hover effects */
        .hamburger-menu:hover span {
          background: linear-gradient(90deg, #AA00FF, #AA00FF, #AA00FF);
          transition: background 0.3s ease;
        }
           
        .hamburger-menu:hover .line-1 {
          width: 100% !important;
          transition: width 0.3s ease;
        }

        .hamburger-menu:hover .line-2 {
          width: 100% !important;
          transition: width 0.3s ease;
        }
        `}
      </style>
    </div>
  );
};
