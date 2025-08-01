/**
 * @fileoverview SortingStyles - Styled sorting components matching BTCStampsExplorer design system
 * @description Provides pre-styled sorting components that align with the existing design patterns,
 * using the established color palette, typography, and spacing conventions
 */

import { buttonStyles } from "$button";
import { TEXT_STYLES } from "$card";
import type { SortOption, UseSortingConfig } from "$lib/types/sorting.d.ts";
import { SortingComponent } from "$islands/sorting/SortingComponent.tsx";
import { SortingProvider } from "$islands/sorting/SortingProvider.tsx";
import type {
  CompleteSortingInterfaceProps,
  StyledSortingButtonsProps,
  StyledSortingDropdownProps,
  StyledSortingErrorProps,
  StyledSortingLabelProps,
} from "$types/ui.d.ts";

// ===== STYLED SORTING COMPONENTS =====

/**
 * Props for StyledSortingDropdown
 */

/**
 * StyledSortingDropdown - Dropdown with BTCStampsExplorer styling
 */
function StyledSortingDropdown({
  options,
  className = "",
  placeholder = "Sort by...",
  size = "md",
  showLoading = false,
}: StyledSortingDropdownProps) {
  const sizeClasses = {
    sm: "h-[34px] px-3 text-xs",
    md: "h-[38px] px-4 text-sm",
    lg: "h-[42px] px-4 text-sm",
  };

  return (
    <div className="styled-sorting-dropdown">
      <SortingComponent.Dropdown
        options={options}
        placeholder={placeholder}
        showLoading={showLoading}
        className={`
          sorting-dropdown--styled
          ${sizeClasses[size]}
          rounded-md
          bg-stamp-grey focus:bg-stamp-grey-light
          border-2 border-transparent
          hover:border-stamp-purple-bright
          focus-within:border-stamp-purple-bright
          font-medium text-stamp-grey-darkest
          placeholder:font-light placeholder:text-stamp-grey-darkest
          outline-none focus:outline-none
          transition-colors duration-300
          ${className}
        `}
      />
    </div>
  );
}

/**
 * Props for StyledSortingButtons
 */

/**
 * StyledSortingButtons - Button group with BTCStampsExplorer styling
 */
function StyledSortingButtons({
  options,
  className = "",
  variant = "secondary",
  size = "md",
  showIcons = true,
  showLoading = false,
}: StyledSortingButtonsProps) {
  const getVariantClasses = (variant: string, isActive: boolean) => {
    const baseClasses = `
      ${buttonStyles.base}
      ${buttonStyles.size[size]}
      font-medium
      transition-all duration-300
      border-2
    `;

    switch (variant) {
      case "primary":
        return `${baseClasses} ${
          isActive
            ? "bg-stamp-purple-bright border-stamp-purple-bright text-white"
            : "bg-stamp-purple border-stamp-purple text-white hover:bg-stamp-purple-bright hover:border-stamp-purple-bright"
        }`;
      case "secondary":
        return `${baseClasses} ${
          isActive
            ? "bg-stamp-grey-light border-stamp-purple-bright text-stamp-grey-darkest"
            : "bg-stamp-grey border-stamp-grey text-stamp-grey-darkest hover:bg-stamp-grey-light hover:border-stamp-purple-bright"
        }`;
      case "ghost":
        return `${baseClasses} ${
          isActive
            ? "bg-transparent border-stamp-purple-bright text-stamp-purple-bright"
            : "bg-transparent border-transparent text-stamp-grey-light hover:border-stamp-purple-bright hover:text-stamp-purple-bright"
        }`;
      default:
        return baseClasses;
    }
  };

  return (
    <div className="styled-sorting-buttons">
      <SortingComponent.Buttons
        options={options}
        showIcons={showIcons}
        showLoading={showLoading}
        className={`
          sorting-buttons--styled
          flex flex-wrap gap-2
          ${className}
        `}
        renderButton={(option, isActive) => (
          <button
            type="button"
            disabled={showLoading}
            className={`
              ${getVariantClasses(variant, isActive)}
              ${showLoading ? "opacity-50 cursor-not-allowed" : ""}
              rounded-md
              flex items-center gap-2
              whitespace-nowrap
            `}
            aria-pressed={isActive}
          >
            {showIcons && option.icon && (
              <span className="sorting-button__icon">
                {/* Icon would be rendered here based on option.icon */}
                <span className="w-4 h-4 opacity-70">⚡</span>
              </span>
            )}
            <span className="sorting-button__label">
              {option.label}
            </span>
            {isActive && (
              <span className="sorting-button__check text-xs">
                ✓
              </span>
            )}
          </button>
        )}
      />
    </div>
  );
}

/**
 * Props for StyledSortingLabel
 */

/**
 * StyledSortingLabel - Label with BTCStampsExplorer styling
 */
function StyledSortingLabel({
  className = "",
  variant = "default",
  showDirection = true,
  showLoading = false,
}: StyledSortingLabelProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return `
          ${TEXT_STYLES.minimal.price.base}
          ${TEXT_STYLES.minimal.price.sizes}
          text-stamp-grey-light
        `;
      case "detailed":
        return `
          font-medium text-stamp-grey-darkest
          text-sm mobileLg:text-base
        `;
      default:
        return `
          font-normal text-stamp-grey-light
          text-xs mobileLg:text-sm
        `;
    }
  };

  return (
    <div className="styled-sorting-label">
      <SortingComponent.Label
        showDirection={showDirection}
        showLoading={showLoading}
        className={`
          sorting-label--styled
          ${getVariantClasses()}
          transition-colors duration-300
          ${className}
        `}
      />
    </div>
  );
}

/**
 * Props for StyledSortingError
 */

/**
 * StyledSortingError - Error display with BTCStampsExplorer styling
 */
function StyledSortingError({
  className = "",
  showRetry = true,
}: StyledSortingErrorProps) {
  return (
    <div className="styled-sorting-error">
      <SortingComponent.Error
        showRetry={showRetry}
        className={`
          sorting-error--styled
          bg-red-900/20 border border-red-500/30
          rounded-md p-4
          text-red-400
          flex items-center gap-3
          ${className}
        `}
      />
    </div>
  );
}

// ===== COMPLETE SORTING INTERFACE =====

/**
 * Props for CompleteSortingInterface
 */

/**
 * CompleteSortingInterface - Complete sorting UI with provider
 */
function CompleteSortingInterface({
  config,
  options,
  variant = "dropdown",
  size = "md",
  className = "",
  showLabel = true,
  showError = true,
}: CompleteSortingInterfaceProps) {
  return (
    <SortingProvider config={config}>
      <SortingComponent
        className={`
          complete-sorting-interface
          ${className}
        `}
      >
        <div className="flex items-center gap-3">
          {/* Sort Controls */}
          <div className="flex-1">
            {variant === "dropdown" && (
              <StyledSortingDropdown
                options={options}
                size={size}
              />
            )}
            {variant === "buttons" && (
              <StyledSortingButtons
                options={options}
                size={size}
              />
            )}
            {variant === "hybrid" && (
              <div className="flex items-center gap-2">
                <div className="desktop:hidden">
                  <StyledSortingDropdown
                    options={options}
                    size={size}
                  />
                </div>
                <div className="hidden desktop:block">
                  <StyledSortingButtons
                    options={options}
                    size={size}
                    variant="ghost"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Current Sort Label */}
          {showLabel && (
            <div className="hidden tablet:block">
              <StyledSortingLabel variant="compact" />
            </div>
          )}
        </div>

        {/* Error Display */}
        {showError && (
          <div className="mt-2">
            <StyledSortingError />
          </div>
        )}
      </SortingComponent>
    </SortingProvider>
  );
}

// ===== EXPORTS =====

export {
  CompleteSortingInterface,
  StyledSortingButtons,
  StyledSortingDropdown,
  StyledSortingError,
  StyledSortingLabel,
};
