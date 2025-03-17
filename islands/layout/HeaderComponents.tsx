// Hamburger Menu Icon that animates to X
export const HamburgerMenuIcon = (
  { isOpen, onClick }: { isOpen: boolean; onClick: () => void },
) => {
  return (
    <div
      className={`hamburger-btn ${isOpen ? "active" : "not-active"}`}
      onClick={onClick}
    >
      <span className="line-1"></span>
      <span className="line-2"></span>
      <span className="line-3"></span>
      <style>
        {`
        .hamburger-btn {
          width: 30px;
          cursor: pointer;
          z-index: 100;
        }
        
        .hamburger-btn span {
          display: block;
          width: 100%;
          height: 4px;
          border-radius: 0px;
          background: linear-gradient(90deg, #AA00FF, #8800CC, #660099);
          transition: all 0.3s;
          position: relative;
        }
        
        .hamburger-btn:hover span {
          background: linear-gradient(90deg, #AA00FF, #AA00FF, #AA00FF);
        }
        
        .active span {
          background: #666666;
        }

        .active:hover span {
          background: #CCCCCC;
        }

        .hamburger-btn span + span {
          margin-top: 4px;
        }
        
        /* Give specific class names to better target each line */
        .active .line-1 {
          animation: ease 0.2s top forwards;
        }
        
        .not-active .line-1 {
          animation: ease 0.2s top-2 forwards;
        }
        
        .active .line-2 {
          animation: ease 0.2s scaled forwards;
        }
        
        /* The middle line styling */
        .not-active .line-2 {
          width: 70%;
          margin-left: auto;
          animation: ease 0.2s scaled-2 forwards;
        }
        
        /* Direct hover style for middle line */
        .hamburger-btn:hover .line-2 {
          width: 100% !important; /* Important to override other styles */
          transition: width 0.3s ease;
        }
        
        .active .line-3 {
          animation: ease 0.2s bottom forwards;
        }
        
        .not-active .line-3 {
          animation: ease 0.2s bottom-2 forwards;
        }

        @keyframes top {
          0% {
            top: 0;
            transform: rotate(0);
          }
          50% {
            top: 8px;
            transform: rotate(0);
          }
          100% {
            top: 8px;
            transform: rotate(45deg);
          }
        }
        
        @keyframes top-2 {
          0% {
            top: 8px;
            transform: rotate(45deg);
          }
          50% {
            top: 8px;
            transform: rotate(0deg);
          }
          100% {
            top: 0;
            transform: rotate(0deg);
          }
        }
        
        @keyframes bottom {
          0% {
            bottom: 0;
            transform: rotate(0);
          }
          50% {
            bottom: 8px;
            transform: rotate(0);
          }
          100% {
            bottom: 8px;
            transform: rotate(135deg);
          }
        }
        
        @keyframes bottom-2 {
          0% {
            bottom: 8px;
            transform: rotate(135deg);
          }
          50% {
            bottom: 8px;
            transform: rotate(0);
          }
          100% {
            bottom: 0;
            transform: rotate(0);
          }
        }
        
        @keyframes scaled {
          50% {
            transform: scale(0);
          }
          100% {
            transform: scale(0);
          }
        }
        
        @keyframes scaled-2 {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
      `}
      </style>
    </div>
  );
};
