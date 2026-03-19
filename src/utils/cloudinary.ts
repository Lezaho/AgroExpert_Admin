export async function uploadToCloudinary(file: File) {

  const preset = import.meta.env.VITE_CLOUDINARY_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dbsokmkxh/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error("Erreur upload image Cloudinary");
  }

  const data = await response.json();

  return data.secure_url;
}