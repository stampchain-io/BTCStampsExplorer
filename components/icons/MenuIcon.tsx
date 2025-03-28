/* ===== MENU ICON COMPONENT ===== */
export const HamburgerMenuIcon = (
  { isOpen, onClick }: { isOpen: boolean; onClick: () => void },
) => {
  const handleClick = () => {
    // If we're going from closed to open, add delay
    if (!isOpen) {
      setTimeout(() => {
        onClick();
      }, 250);
    } else {
      // If we're closing, trigger immediately
      onClick();
    }
  };

  return (
    <div
      className={`hamburger-menu ${isOpen ? "is-active" : ""}`}
      onClick={handleClick}
    >
      <span className="line-1"></span>
      <span className="line-2"></span>
      <span className="line-3"></span>
      <style>
        {`
        .hamburger-menu {
          width: 26px;
          cursor: pointer;
          z-index: 100;
        }
        
        .hamburger-menu span {
          display: block;
          height: 3px;
          border-radius: 1px;
          background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          position: relative;
        }

        .hamburger-menu span + span {
          margin-top: 4px;
        }
        
        .line-1 {
          height: 3px;
          width: 100%;
        }
        
        .line-2 {
          height: 3px;
          width: 70%;
          margin-left: auto;
        }
       
        .line-3 {
          height: 3px;
          width: 100%;
        }

        .hamburger-menu:hover span {
          background: linear-gradient(90deg, #AA00FF, #AA00FF, #AA00FF);
          transition: background 0.3s ease;
        }
           
        .hamburger-menu:hover .line-2 {
          width: 100% !important;
          transition: width 0.3s ease;
        }
        
        }
      `}
      </style>
    </div>
  );
};
