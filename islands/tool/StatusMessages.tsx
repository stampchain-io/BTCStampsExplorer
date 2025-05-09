/* ===== STATUS MESSAGES ===== */
/*@baba-move file*/
interface StatusMessagesProps {
  submissionMessage?: {
    message: string;
    txid?: string;
  } | string | null;
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
  // Handle different submissionMessage types
  const messageText = typeof submissionMessage === 'string' 
    ? submissionMessage 
    : submissionMessage?.message || '';
    
  const txid = typeof submissionMessage === 'object' ? submissionMessage?.txid : undefined;
  
  // Only render submission message if there's actual content
  const hasSubmissionMessage = !!messageText;
  
  return (
    <>
      {hasSubmissionMessage && (
        <div class="w-full text-center text-white mt-4">
          <p>{messageText}</p>
          {txid && (
            <div class="overflow-x-auto" style={{ maxWidth: "100%" }}>
              <span>TXID:&nbsp;</span>
              <a
                href={`https://mempool.space/tx/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-500 underline whitespace-nowrap"
              >
                {txid}
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
