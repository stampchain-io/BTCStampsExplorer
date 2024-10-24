interface StatusMessagesProps {
  submissionMessage?: {
    message: string;
    txid?: string;
  } | null;
  apiError?: string | null;
  fileUploadError?: string | null;
  walletError?: string | null;
}

export function StatusMessages({
  submissionMessage,
  apiError,
  fileUploadError,
  walletError,
}: StatusMessagesProps) {
  return (
    <>
      {submissionMessage && (
        <div class="w-full text-center text-white mt-4">
          <p>{submissionMessage.message}</p>
          {submissionMessage.txid && (
            <div class="overflow-x-auto" style={{ maxWidth: "100%" }}>
              <span>TXID:&nbsp;</span>
              <a
                href={`https://mempool.space/tx/${submissionMessage.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 underline whitespace-nowrap"
              >
                {submissionMessage.txid}
              </a>
            </div>
          )}
        </div>
      )}
      {apiError && (
        <div class="w-full text-red-500 text-center mt-4">{apiError}</div>
      )}
      {fileUploadError && (
        <div class="w-full text-yellow-500 text-center mt-4">
          {fileUploadError}
        </div>
      )}
      {walletError && (
        <div class="w-full text-red-500 text-center mt-4">{walletError}</div>
      )}
    </>
  );
}
