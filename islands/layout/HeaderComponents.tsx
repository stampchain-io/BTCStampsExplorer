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
          width: 26px;
          cursor: pointer;
          z-index: 100;
        }
        
        .hamburger-btn span {
          display: block;
          width: 100%;
          height: 4px;
          border-radius: 1px;
          background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          position: relative;
        }
        
        .hamburger-btn:hover span {
          background: linear-gradient(90deg, #AA00FF, #AA00FF, #AA00FF);
        }
        
        .active span {
        width: 24px;
          animation-fill-mode: forwards !important;
        }

        .active:hover span {
          background: #999999;
        }

        .hamburger-btn span + span {
          margin-top: 4px;
        }
        
        .active .line-1 {
        height: 3px;
          animation: ease 0.3s top forwards;
        }
        
        .not-active .line-1 {
          animation: ease 0.3s top-2 forwards;
        }
        
        .active .line-2 {
        height: 3px;
          animation: ease 0.3s scaled forwards;
        }
        
        /* The middle line styling */
        .not-active .line-2 {
          width: 70%;
          margin-left: auto;
          animation: ease 0.3s scaled-2 forwards;
        }
        
        /* Direct hover style for middle line */
        .hamburger-btn:hover .line-2 {
          width: 100% !important;
          transition: width 0.3s ease;
        }
        
        .active .line-3 {
          height: 3px;
          animation: ease 0.3s bottom forwards;
        }
        
        .not-active .line-3 {
          animation: ease 0.3s bottom-2 forwards;
        }

        @keyframes top {
          0% {
            top: 0;
            transform: rotate(0);
            background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          }
          50% {
            top: 7px;
            transform: rotate(0);
            background: #8f5aa9;
          }
          100% {
            top: 7px;
            transform: rotate(45deg);
            background: #666666;
          }
        }
        
        @keyframes top-2 {
          0% {
            top: 7px;
            transform: rotate(45deg);
          }
          50% {
            top: 7px;
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
            background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          }
          50% {
            bottom: 7px;
            transform: rotate(0);
            background: #666666;
          }
          100% {
            bottom: 7px;
            transform: rotate(135deg);
            background: #666666;
          }
        }
        
        @keyframes bottom-2 {
          0% {
            bottom: 7px;
            transform: rotate(135deg);
          }
          50% {
            bottom: 7px;
            transform: rotate(0);
          }
          100% {
            bottom: 0;
            transform: rotate(0);
          }
        }
        
        @keyframes scaled {
          0% {
            transform: scale(1);
            background: linear-gradient(90deg, #AA00FF, #8800CC, #AA00FF);
          }
          50% {
            transform: scale(0);
            background: #666666;
          }
          100% {
            transform: scale(0);
            background: #666666;
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
