import { Icon } from "$icon";
import type { Toast as ToastTypeFromProvider } from "$islands/Toast/ToastProvider.tsx";
import {
  notificationBody,
  notificationContainerError,
  notificationContainerInfo,
  notificationContainerSuccess,
  notificationHeading,
} from "$notification";
import type { ToastComponentProps } from "$types/ui.d.ts";

export const ToastComponent = (
  { id, message, type, onClose, autoDismiss, duration = 4000 }:
    ToastComponentProps,
) => {
  const getIconName = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return "error";
      case "success":
        return "success";
      case "info":
      default:
        return "info";
    }
  };

  const getIconColor = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return "stroke-[#990000]";
      case "success":
        return "stroke-[#009900]";
      case "info":
      default:
        return "stroke-[#999999]";
    }
  };

  const getContainerStyle = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return notificationContainerError;
      case "success":
        return notificationContainerSuccess;
      case "info":
      default:
        return notificationContainerInfo;
    }
  };

  const getProgressBarColor = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return "bg-[#660000]";
      case "success":
        return "bg-[#006600]";
      case "info":
      default:
        return "bg-[#666666]";
    }
  };

  // Split message into first line and remaining lines
  const lines = message.split("\n");
  const firstLine = lines[0];
  const remainingLines = lines.slice(1);

  return (
    <div
      id={`toast-${id}`}
      class={`fixed top-5 left-5 z-50 w-full max-w-md overflow-hidden ${
        getContainerStyle(type)
      }`}
      role="alert"
    >
      <div class="flex items-center space-x-6">
        <Icon
          type="icon"
          name={getIconName(type)}
          weight="bold"
          size="sm"
          color="custom"
          className={getIconColor(type)}
          ariaLabel={`${type} notification`}
        />

        <div class="flex-1 ml-6 break-words">
          <div class={notificationHeading}>{firstLine}</div>
          {remainingLines.length > 0 && (
            <div class={notificationBody}>
              {remainingLines.join("\n")}
            </div>
          )}
        </div>

        <Icon
          type="iconButton"
          name="close"
          weight="bold"
          size="xs"
          color="grey"
          onClick={onClose}
          className="ml-auto"
        />
      </div>

      {autoDismiss && (
        <div class="mt-2 w-full h-1 rounded-full bg-[#1b1b1b]/70">
          <div
            class={`h-full rounded-full ${
              getProgressBarColor(type)
            } transition-all ease-linear`}
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes toast-progress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
};
