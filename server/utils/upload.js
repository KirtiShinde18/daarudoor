const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (base64String, folder = "products") => {
  if (!base64String || !base64String.startsWith("data:image")) return null;
  try {
    const result = await cloudinary.uploader.upload(base64String, {
      folder: folder,
    });
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};

const deleteImage = async (public_id) => {
  if (!public_id) return false;
  try {
    await cloudinary.uploader.destroy(public_id);
    return true;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
