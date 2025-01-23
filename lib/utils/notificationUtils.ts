import Swal from "sweetalert2";

const ButtonClassNames =
  "inline-flex items-center justify-center border-2 border-solid border-stamp-purple rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-purple tracking-[0.05em] h-[42px] mobileLg:h-[48px] px-4 mobileLg:px-5 hover:border-stamp-purple-highlight hover:text-stamp-purple-highlight transition-colors";

export function showNotification(title: string, text: string, icon: string) {
  Swal.fire({
    title: title || "Notification",
    text: text || "",
    icon: icon || "info",
    background:
      "linear-gradient(to bottom right,#1f002e00,#14001f7f,#1f002e),#000",
    confirmButtonText: "O K",
    customClass: {
      confirmButton: ButtonClassNames,
    },
  });
}
