/* ===== STATUS MESSAGES ===== */
/*@baba-move file*/
import { glassmorphism } from "$layout";

interface StatusMessagesProps {
  submissionMessage?:
    | {
      message: string;
      txid?: string;
    }
    | string
    | null;
  apiError?: string | null;
  fileUploadError?: string | null;
  walletError?: string | null;
  maraError?: string | null;
}

export function StatusMessages({
  submissionMessage,
  apiError,
  fileUploadError,
  walletError,
  maraError,
}: StatusMessagesProps) {
  // Handle different submissionMessage types
  const messageText = typeof submissionMessage === "string"
    ? submissionMessage
    : submissionMessage?.message || "";

  const txid = typeof submissionMessage === "object"
    ? submissionMessage?.txid
    : undefined;

  // Only render submission message if there's actual content
  const hasSubmissionMessage = !!messageText;

  return (
    <>
      {hasSubmissionMessage && (
        <div
          class={`w-full mt-4 ${glassmorphism} bg-gradient-to-br from-green-900/15 to-green-800/25 border-green-500/20 p-4`}
        >
          <p class="text-green-400 text-center font-medium">{messageText}</p>
          {txid && (
            <div class="overflow-x-auto mt-2" style={{ maxWidth: "100%" }}>
              <span class="text-green-300">TXID:&nbsp;</span>
              <a
                href={`https://mempool.space/tx/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                class="text-green-400 underline whitespace-nowrap hover:text-green-300 transition-colors"
              >
                {txid}
              </a>
            </div>
          )}
        </div>
      )}
      {apiError && (
        <div
          class={`w-full mt-4 ${glassmorphism} bg-gradient-to-br from-red-900/15 to-red-800/25 border-red-500/20 p-4`}
        >
          <p class="text-red-400 text-center font-medium">{apiError}</p>
        </div>
      )}
      {fileUploadError && (
        <div
          class={`w-full mt-4 ${glassmorphism} bg-gradient-to-br from-yellow-900/15 to-yellow-800/25 border-yellow-500/20 p-4`}
        >
          <p class="text-yellow-400 text-center font-medium">
            {fileUploadError}
          </p>
        </div>
      )}
      {walletError && (
        <div
          class={`w-full mt-4 ${glassmorphism} bg-gradient-to-br from-red-900/15 to-red-800/25 border-red-500/20 p-4`}
        >
          <p class="text-red-400 text-center font-medium">{walletError}</p>
        </div>
      )}
      {maraError && !apiError && (
        <div
          class={`w-full mt-4 ${glassmorphism} bg-gradient-to-br from-purple-900/15 to-purple-800/25 border-purple-500/20 p-4`}
        >
          <p class="text-purple-400 text-center font-medium">
            MARA Service: {maraError}
          </p>
        </div>
      )}
    </>
  );
}
