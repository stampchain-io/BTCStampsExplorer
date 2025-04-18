/* ===== STATES ===== */
/* @baba - refactor and move to shared states file in /layout/ */
import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";

/* ===== MODAL TYPES ===== */
export type ModalAnimation = "scaleUpDown" | "scaleDownUp" | "zoomInOut";

export interface ModalConfig {
  type: "connect" | "search" | "preview" | "filter";
  component: preact.ComponentType;
  animation?: ModalAnimation;
  props?: Record<string, unknown>;
}

export const DEFAULT_MODAL_ANIMATION: ModalAnimation = "scaleUpDown";

/* ===== MODAL STATE ===== */
export interface GlobalModalState {
  isOpen: boolean;
  content: ComponentChildren | null;
  animation: ModalAnimation;
}

// Create the signal with explicit typing
export const globalModal = signal<GlobalModalState>({
  isOpen: false,
  content: null,
  animation: "scaleUpDown",
});

interface SearchState {
  term: string;
  error: string;
  results?: Array<{ tick: string }>;
}

export const searchState = signal<SearchState>({
  term: "",
  error: "",
  results: [],
});

/* ===== MODAL ACTIONS ===== */
export function openModal(
  content: ComponentChildren,
  animation: ModalAnimation = "scaleUpDown",
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

/* ===== EXPORTS ===== */
export const modal = {
  globalModal,
  openModal,
  closeModal,
  DEFAULT_MODAL_ANIMATION,
};

// Default export for convenience
export default modal;
