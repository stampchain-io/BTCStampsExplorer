import { subtitlePurple, titlePurpleLD } from "$text";
import ModalTestContent from "$islands/content/ModalTestContent.tsx";

export default function ModalTestPage() {
  return (
    <div class="flex flex-col items-center p-6 gap-6">
      {/* Header */}
      <h1 class={titlePurpleLD}>MODAL</h1>
      <h2 class={subtitlePurple}>TESTING</h2>

      {/* Modal Testing Island */}
      <ModalTestContent />
    </div>
  );
}
