/**
 * Notification utilities for user feedback
 * TODO: Implement proper notification system
 */

import { logger } from "$lib/utils/logger.ts";
import { LOG_NAMESPACES } from "$lib/constants/loggingConstants.ts";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number;
  persistent?: boolean;
}

/**
 * Show a notification to the user
 */
export function showNotification(options: NotificationOptions): void {
  logger.info(LOG_NAMESPACES.NOTIFICATION, {
    message: "Showing notification",
    type: options.type,
    title: options.title,
    content: options.message,
  });

  // TODO: Implement actual notification UI
  if (typeof globalThis !== "undefined" && "console" in globalThis) {
    const prefix = `[${options.type.toUpperCase()}]`;
    const title = options.title ? `${options.title}: ` : "";
    console.log(`${prefix} ${title}${options.message}`);
  }
}

/**
 * Show success notification
 */
export function showSuccess(message: string, title?: string): void {
  const options: NotificationOptions = { type: "success", message };
  if (title !== undefined) {
    options.title = title;
  }
  showNotification(options);
}

/**
 * Show error notification
 */
export function showError(message: string, title?: string): void {
  const options: NotificationOptions = { type: "error", message };
  if (title !== undefined) {
    options.title = title;
  }
  showNotification(options);
}

/**
 * Show warning notification
 */
export function showWarning(message: string, title?: string): void {
  const options: NotificationOptions = { type: "warning", message };
  if (title !== undefined) {
    options.title = title;
  }
  showNotification(options);
}

/**
 * Show info notification
 */
export function showInfo(message: string, title?: string): void {
  const options: NotificationOptions = { type: "info", message };
  if (title !== undefined) {
    options.title = title;
  }
  showNotification(options);
}
