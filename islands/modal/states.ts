/* ===== STATES ===== */
/* @baba - refactor and move to shared states file in /layout/ */
import type { GlobalModalState, SearchState } from "$types/ui.d.ts";
import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";

/* ===== MODAL TYPES ===== */
export type ModalAnimation = "slideUpDown" | "slideDownUp" | "zoomInOut";

export interface ModalConfig {
  type: "connect" | "search" | "preview" | "filter";
  component: preact.ComponentType;
  animation?: ModalAnimation;
  props?: Record<string, unknown>;
}

export const DEFAULT_MODAL_ANIMATION: ModalAnimation = "slideUpDown";

// Create the signal with explicit typing
export const globalModal = signal<GlobalModalState>({
  isOpen: false,
  content: null,
  animation: "slideUpDown",
});

export const searchState = signal<SearchState>({
  term: "",
  error: "",
  results: [],
});

/* ===== MODAL ACTIONS ===== */
export function openModal(
  content: ComponentChildren,
  animation: ModalAnimation = "slideUpDown",
) {
  if (!content) {
    return;
  }

  globalModal.value = {
    isOpen: true,
    content,
    animation,
  };
}

export function closeModal() {
  globalModal.value = {
    ...globalModal.value,
    isOpen: false,
  };
}

export function closeForegroundModal() {
  globalModal.value = {
    ...globalModal.value,
    isOpen: false,
  };
}

/* ===== EXPORTS ===== */
export const modal = {
  globalModal,
  openModal,
  closeModal,
  DEFAULT_MODAL_ANIMATION,
};

// Default export for convenience
export default modal;

/* ===== MODAL STACKS ===== */
