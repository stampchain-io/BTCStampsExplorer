import { useState } from "preact/hooks";

export default function AdminMusic() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const titleGreyDL =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black gray-gradient3";
  const subTitleGrey =
    "text-2xl mobileMd:text-3xl mobileLg:text-4xl font-extralight text-stamp-grey-light mb-1.5 mobileLg:mb-3";
  const bodyTextLight =
    "text-base mobileLg:text-lg font-medium text-stamp-grey-light";

  const handleFileUpload = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setMessage({ type: "error", text: "Please select an audio file" });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage(null);

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const response = await fetch("/api/internal/secure-audio/upload", {
        method: "POST",
        body: formData,
        headers: {
          "x-csrf-token": (window as any).__CSRF_TOKEN__ || "",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setMessage({ type: "success", text: "File uploaded successfully!" });
      input.value = ""; // Reset input
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className={titleGreyDL}>MUSIC MANAGEMENT</h1>
      <h2 className={subTitleGrey}>UPLOAD AUDIO</h2>

      <div className="flex flex-col gap-4 max-w-xl">
        <div className="flex flex-col gap-2">
          <label className={bodyTextLight}>Select Audio File</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="block w-full text-sm text-stamp-grey-light
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-stamp-purple-darker file:text-stamp-grey-light
              hover:file:bg-stamp-purple-dark
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {isUploading && (
          <div className="w-full bg-stamp-card-bg rounded-full h-2.5">
            <div
              className="bg-stamp-purple-bright h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-900/20 text-green-300"
                : "bg-red-900/20 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className={subTitleGrey}>UPLOADED TRACKS</h2>
        {/* Track list will be added here */}
      </div>
    </div>
  );
}
