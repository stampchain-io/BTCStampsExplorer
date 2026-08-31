/**
 * Form Refactor
 * =============
 *
 * TODO(btcstamps) @baba
 *
 * Current components in this directory:
 * - InputField.tsx: Generic text/number input (error text, alignment, uppercase, disabled)
 * - SRC20InputField.tsx: SRC20-specific text input (error text, uppercase, pattern/inputMode)
 * - SelectField.tsx: Native <select> wrapper with placeholder/error support
 * - SelectDate.tsx: Flatpickr-backed date range input
 * - SearchInputField.tsx: Shared search input (icon + loading state) used by SearchStampModal/SearchSRC20Modal
 * - SearchErrorDisplay.tsx: Shared "no results" error display used by SearchStampModal/SearchSRC20Modal
 *
 * Look into merging the input fields (InputField.tsx / SRC20InputField.tsx largely overlap)
 * Add commentary
 * Why is there no SRC101InputField - @reinamora
 * Do we need a MailInputField - @reinamora
 * Check up on validation files
 *
 *
 */
