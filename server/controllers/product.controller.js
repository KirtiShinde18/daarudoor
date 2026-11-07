const Product = require("../models/Product");
const { uploadImage, deleteImage } = require("../utils/upload");

// @desc    Create a product
// @route   POST /api/admin/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, image, category, brand, description, volume, price, discountPrice, stock, status } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: "Please provide all required fields." });
    }

    let imageUrl = image;
    let imagePublicId = null;

    if (image && image.startsWith("data:image")) {
      const uploadResult = await uploadImage(image);
      if (uploadResult) {
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      }
    }

    const product = new Product({
      name,
      image: imageUrl,
      imagePublicId,
      category,
      brand,
      description,
      volume,
      price,
      discountPrice,
      stock,
      status,
    });

    const createdProduct = await product.save();
    res.status(201).json({ success: true, data: createdProduct });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private/Admin
const getProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let query = { isDeleted: false };

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      query.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { brand: searchRegex },
        { volume: searchRegex }
      ];
    }
    if (category) {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/admin/products/:id
// @access  Private/Admin
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, image, category, brand, description, volume, price, discountPrice, stock, status } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let imageUrl = product.image;
    let imagePublicId = product.imagePublicId;

    if (image && image.startsWith("data:image")) {
      const uploadResult = await uploadImage(image);
      if (uploadResult) {
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
        
        // Delete old image
        if (product.imagePublicId) {
          await deleteImage(product.imagePublicId);
        }
      }
    } else if (image === "") {
      // User removed the image explicitly
      if (product.imagePublicId) {
        await deleteImage(product.imagePublicId);
      }
      imageUrl = "";
      imagePublicId = null;
    }

    product.name = name || product.name;
    product.image = imageUrl;
    product.imagePublicId = imagePublicId;
    product.category = category || product.category;
    product.brand = brand !== undefined ? brand : product.brand;
    product.description = description !== undefined ? description : product.description;
    product.volume = volume !== undefined ? volume : product.volume;
    product.price = price !== undefined ? price : product.price;
    product.discountPrice = discountPrice !== undefined ? discountPrice : product.discountPrice;
    product.stock = stock !== undefined ? stock : product.stock;
    product.status = status || product.status;

    const updatedProduct = await product.save();

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// @desc    Delete a product (Soft Delete)
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Do NOT delete the image for soft delete, keep it in Cloudinary
    // Just update the flags
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({ success: true, message: "Product moved to trash" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
