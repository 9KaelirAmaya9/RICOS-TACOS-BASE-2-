import { supabase } from "@/integrations/supabase/client";

export interface UploadResult {
  url: string;
  path: string;
}

export const uploadWorkOrderPDF = async (
  pdfBlob: Blob,
  userId: string,
  workOrderNumber: string
): Promise<UploadResult> => {
  const timestamp = Date.now();
  const fileName = `WO-${workOrderNumber}-${timestamp}.pdf`;
  const filePath = `${userId}/${fileName}`;

  const bucketName = "work-order-pdfs";

  console.log("[WorkOrderStorage] Uploading PDF", {
    bucket: bucketName,
    filePath,
    userId,
  });

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, pdfBlob, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (error) {
    console.error("[WorkOrderStorage] Storage upload error", {
      bucket: bucketName,
      filePath,
      userId,
      error,
    });

    const message = error.message?.toLowerCase().includes("bucket")
      ? "Storage configuration error. Please contact administrator."
      : `Failed to upload PDF: ${error.message}`;

    throw new Error(message);
  }

  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  console.log("[WorkOrderStorage] Generated public URL", {
    bucket: bucketName,
    filePath,
    publicUrl: urlData.publicUrl,
  });

  return {
    url: urlData.publicUrl,
    path: filePath,
  };
};

export const deleteWorkOrderPDF = async (pdfUrl: string): Promise<void> => {
  if (!pdfUrl) return;

  const bucketName = "work-order-pdfs";

  try {
    // Extract the file path from the URL
    const urlParts = pdfUrl.split("/storage/v1/object/public/" + bucketName + "/");
    if (urlParts.length < 2) {
      console.warn("[WorkOrderStorage] Could not extract file path from URL", {
        bucket: bucketName,
        pdfUrl,
      });
      return;
    }

    const filePath = urlParts[1];

    console.log("[WorkOrderStorage] Deleting PDF", {
      bucket: bucketName,
      filePath,
    });

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error("[WorkOrderStorage] Storage delete error", {
        bucket: bucketName,
        filePath,
        error,
      });
      throw new Error(`Failed to delete PDF: ${error.message}`);
    }
  } catch (error) {
    console.error("[WorkOrderStorage] Error deleting PDF from storage", error);
    // Don't throw - allow DB deletion to proceed even if storage fails
  }
};
