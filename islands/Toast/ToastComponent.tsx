import { buttonHover } from "$button";
import { Icon } from "$icon";
import type { Toast as ToastTypeFromProvider } from "$islands/Toast/ToastProvider.tsx";
import {
  notificationBody,
  notificationContainerError,
  notificationContainerInfo,
  notificationContainerSuccess,
  notificationContainerWarning,
  notificationHeading,
} from "$notification";
import type { ToastComponentProps } from "$types/ui.d.ts";

export const ToastComponent = (
  {
    id,
    message,
    body,
    type,
    onClose,
    autoDismiss,
    duration = 3000,
    isAnimatingOut: externalIsAnimatingOut,
  }: ToastComponentProps & { isAnimatingOut?: boolean },
) => {
  // Use the external animation state from the provider
  const shouldAnimateOut = externalIsAnimatingOut ?? false;
  const getIconName = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return "error";
      case "warning":
        return "info";
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
        return "stroke-color-red-700";
      case "warning":
        return "stroke-color-orange-500";
      case "success":
        return "stroke-color-green-700";
      case "info":
      default:
        return "stroke-color-neutral-400";
    }
  };

  const getContainerStyle = (toastType: ToastTypeFromProvider["type"]) => {
    switch (toastType) {
      case "error":
        return notificationContainerError;
      case "warning":
        return notificationContainerWarning;
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
        return "bg-color-red-700";
      case "warning":
        return "bg-color-orange-500";
      case "success":
        return "bg-color-green-700";
      case "info":
      default:
        return "bg-color-neutral-500";
    }
  };

  // Split message into first line and remaining lines
  const lines = message.split("\n");
  const firstLine = lines[0];
  const remainingLines = lines.slice(1);

  return (
    <div
      id={`toast-${id}`}
      class={`fixed top-5 inset-x-5 z-notification !w-auto
        min-[460px]:left-5 min-[460px]:right-auto min-[460px]:max-w-[460px] overflow-hidden ${
        shouldAnimateOut ? "notification-exit" : "notification-enter"
      } ${getContainerStyle(type)}`}
      role="alert"
    >
      <div class="flex items-start space-x-6">
        <Icon
          type="icon"
          name={getIconName(type)}
          weight="bold"
          size="xs"
          color="custom"
          className={`${getIconColor(type)} mt-0.5`}
          ariaLabel={`${type} notification`}
        />

        <div class="flex-1 ml-6 break-words">
          <div class={notificationHeading}>{firstLine}</div>
          {body
            ? (
              <div class={notificationBody}>
                {body}
              </div>
            )
            : remainingLines.length > 0 && (
              <div class={`${notificationBody} whitespace-pre-line`}>
                {remainingLines.join("\n")}
              </div>
            )}
        </div>

        <Icon
          type="iconButton"
          name="close"
          weight="bold"
          size="mdR"
          color="greyLight"
          className={`${buttonHover} -mt-1 tablet:-mt-0.5 ml-auto -mr-1 tablet:-mr-0.5 !p-0.5`}
          ariaLabel="Close notification"
          onClick={onClose}
        />
      </div>

      {autoDismiss && (
        <div class="mt-2 w-full h-0.5 rounded-full bg-color-neutral-800">
          <div
            class={`h-full rounded-full ${
              getProgressBarColor(type)
            } transition-all ease-linear`}
            style={{
              animation: `progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};
