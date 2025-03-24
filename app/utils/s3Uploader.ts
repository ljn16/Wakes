export async function uploadToS3(file: File) {
    const ext = file.name.split('.').pop();
    const type = file.type || 'application/octet-stream';
  
    const res = await fetch(`/api/upload-url?fileType=${type}&ext=${ext}`);
    const { uploadUrl, fileName } = await res.json();
  
    // Perform the upload to S3
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': type },
      body: file,
    });
  
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("❌ Upload failed:", errorText);
      throw new Error("Upload to S3 failed");
    }
  
    const fileUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    console.log("✅ Uploaded to:", fileUrl);
    return fileUrl;
  }