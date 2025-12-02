import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a PDF to Supabase Storage with retry logic
 */
export async function uploadPDFWithRetry(
  pdfBlob: Blob,
  bucket: string,
  path: string,
  maxRetries: number = 3
): Promise<string> {
  console.log(`[PDF Upload] Attempting to upload ${path}`);
  console.log(`[PDF Upload] File size: ${(pdfBlob.size / 1024).toFixed(2)} KB`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) {
        console.error(`[PDF Upload] Attempt ${attempt} failed:`, error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      console.log(`[PDF Upload] Success on attempt ${attempt}:`, urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`[PDF Upload] Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed to upload PDF after ${maxRetries} attempts: ${error}`);
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`[PDF Upload] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw new Error('Upload failed unexpectedly');
}

/**
 * Log PDF file sizes for debugging
 */
export function logPDFSizes(pdfs: { name: string; blob: Blob }[]) {
  console.log('[PDF Sizes]');
  let totalSize = 0;
  
  pdfs.forEach(({ name, blob }) => {
    const sizeKB = blob.size / 1024;
    totalSize += sizeKB;
    console.log(`- ${name}: ${sizeKB.toFixed(2)} KB`);
  });
  
  console.log(`- Total: ${totalSize.toFixed(2)} KB`);
  
  // Warn if any PDF is over 2MB
  pdfs.forEach(({ name, blob }) => {
    if (blob.size > 2 * 1024 * 1024) {
      console.warn(`⚠ ${name} is over 2MB! Consider optimization.`);
    }
  });
}

/**
 * Generate and upload a single PDF with retry and logging
 */
export async function generateAndUploadPDF(
  generateFn: () => Promise<Blob>,
  bucket: string,
  path: string,
  name: string
): Promise<string | null> {
  try {
    const blob = await generateFn();
    
    logPDFSizes([{ name, blob }]);
    
    const url = await uploadPDFWithRetry(blob, bucket, path);
    return url;
  } catch (error) {
    console.error(`[PDF Generation] Failed to generate/upload ${name}:`, error);
    return null;
  }
}
