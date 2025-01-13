export interface SRC20BackgroundUpload {
  fileData: string;
  tick: string;
}

export interface SRC20BackgroundUploadResult {
  success: boolean;
  message?: string;
  url?: string;
}
