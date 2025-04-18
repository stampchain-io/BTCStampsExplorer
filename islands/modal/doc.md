/**
*
*
* OVERVIEW
* ========
*
* MODAL INFRASTRUCTURE
* ===================
*
* Core Components
* --------------
* - ModalOverlay.tsx: Handles modal animations and backdrop
* - ModalProvider.tsx: Root-level provider that manages modal state
* - states.ts: Centralized state management for modals
*
* Integration
* ----------
* The modal system is integrated at the root level in _app.tsx, ensuring consistent behavior across the application.
* Example implementation from StampOverviewHeader.tsx:
*
* ```tsx
* const handleOpenSearch = () => {
*   searchState.value = { term: "", error: "" };
*   const modalContent = (
*     <ModalSearchBase onClose={() => {
*       searchState.value = { term: "", error: "" };
*       closeModal();
*     }}>
*       <SearchContent {...props} />
*     </ModalSearchBase>
*   );
*   openModal(modalContent, "scaleDownUp");
* };
* ```
*
* Animation Types
* -------------
* The system supports three animation types (defined in modal.css):
* 1. scaleUpDown: Scales and slides up from bottom on open and down on close
* 2. scaleDownUp: Scales and slides down from top and up on close
* 3. zoomInOut: Zooms in/out from center
*
* Each animation includes:
* - Entry animation
* - Exit animation
* - Background fade transitions
*
* Overlay System
* -------------
* ModalOverlay provides:
* - Backdrop with blur effect
* - Click-outside-to-close functionality
* - Animation handling
* - Focus trap for accessibility
* - Keyboard support (ESC to close)
*
* Usage:
* 1. Import required components:
*    ```tsx
*    import { openModal, closeModal } from "$islands/modal/states.ts";
*    ```
*
* 2. Create modal content:
*    ```tsx
*    const modalContent = (
*      <ModalBase onClose={handleClose}>
*        {/* Your modal content */}
*      </ModalBase>
*    );
*    ```
*
* 3. Open modal with animation:
*    ```tsx
*    openModal(modalContent, "scaleUpDown");
*    ```
*
* MODAL COMPONENTS
* ===============
*
* Base Components
* --------------
* - ModalBase.tsx: Primary base component for most modals
* - ModalSearchBase.tsx: Specialized base for search-related modals
* - WalletProvider.tsx: Base component for wallet connection functionality
*
* Active Modals
* ------------
* 1. BuyStampModal.tsx
*    - Base: ModalBase
*    - Purpose: Handles stamp purchase transactions
*
* 2. ConnectWalletModal.tsx
*    - Base: ModalBase + WalletProviderBase
*    - Purpose: Manages wallet connections
*    - Note: Integrates with WalletProviderBase for provider functionality
*
* 3. DetailSRC101Modal.tsx
*    - Base: ModalBase
*    - Purpose: Displays SRC101 token details
*
* 4. DonateStampModal.tsx
*    - Base: ModalBase
*    - Purpose: Handles stamp donation transactions
*
* 5. FilterSRC20Modal.tsx
*    - Base: ModalBase
*    - Purpose: Provides filtering options for SRC20 tokens
*
* 6. PreviewCodeModal.tsx
*    - Base: ModalBase
*    - Purpose: Displays code previews
*
* 7. PreviewImageModal.tsx
*    - Base: ModalBase
*    - Purpose: Shows image previews
*
* 8. RecieveAddyModal.tsx
*    - Base: ModalBase
*    - Purpose: Displays receiving address with QR code
*
* 9. SearchSRC20Modal.tsx
*    - Base: ModalSearchBase
*    - Purpose: Search functionality for SRC20 tokens
*
* 10. SearchStampModal.tsx
*    - Base: ModalSearchBase
*    - Purpose: Search functionality for stamps
*
* 11. SendBTCModal.tsx
*    - Base: ModalBase
*    - Purpose: Handles BTC sending transactions
*
* Work in Progress
* ---------------
* - SendStampModalWIP.tsx
*   - Status: Not in active use
*   - Purpose: Planned implementation for stamp sending functionality
*
* State Management
* ---------------
* - states.ts provides centralized modal state management and operations
*
*
* IMPORTS
* =======
* The modals need to be imported directly and cannot use barrel imports, since this creates a wierd bug
*  - the database content gets stuck in perpetual loading and buttons become inactive and do not work
*
*
*/
