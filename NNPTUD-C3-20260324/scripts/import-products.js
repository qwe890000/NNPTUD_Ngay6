const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const mongoose = require("mongoose");
const { default: slugify } = require("slugify");

const categoryModel = require("../schemas/categories");
const productModel = require("../schemas/products");
const inventoryModel = require("../schemas/inventories");

const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/NNPTUD-C3";
const DEFAULT_INPUT_PATH = "C:/Users/MY TAM/Downloads/products_3000_rows.xlsx";

function getInputPath() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    return DEFAULT_INPUT_PATH;
  }
  return path.resolve(rawArg);
}

function readRowsFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function buildUniqueCategorySlug(baseName) {
  const baseSlug = slugify(baseName, { lower: true, strict: false, replacement: "-" });
  let finalSlug = baseSlug || "category";
  let index = 0;

  while (true) {
    const existed = await categoryModel.findOne({ slug: finalSlug });
    if (!existed) {
      return finalSlug;
    }
    index += 1;
    finalSlug = (baseSlug || "category") + "-" + index;
  }
}

async function findOrCreateCategoryByName(categoryName) {
  const normalizedName = normalizeText(categoryName) || "Uncategorized";
  let category = await categoryModel.findOne({
    isDeleted: false,
    name: { $regex: "^" + normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", $options: "i" },
  });

  if (category) {
    return { category, created: false };
  }

  const slug = await buildUniqueCategorySlug(normalizedName);
  category = new categoryModel({
    name: normalizedName,
    slug,
  });
  await category.save();
  return { category, created: true };
}

async function importProducts(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("Khong tim thay file Excel: " + filePath);
  }

  const rows = readRowsFromExcel(filePath);
  let createdCount = 0;
  let skippedCount = 0;
  let categoryCreatedCount = 0;

  for (const row of rows) {
    const sku = normalizeText(row.sku);
    const title = normalizeText(row.title);
    const categoryName = normalizeText(row.category);
    const price = normalizeNumber(row.price, 0);
    const stock = Math.max(0, normalizeNumber(row.stock, 0));

    if (!title) {
      skippedCount++;
      continue;
    }

    const existedProduct = await productModel.findOne({
      isDeleted: false,
      title: title,
    });
    if (existedProduct) {
      skippedCount++;
      continue;
    }

    const categoryResult = await findOrCreateCategoryByName(categoryName);
    if (categoryResult.created) {
      categoryCreatedCount++;
    }

    const newProduct = new productModel({
      title,
      slug: slugify(title, { lower: true, strict: false, replacement: "-" }),
      price,
      description: sku ? "SKU: " + sku : "",
      category: categoryResult.category._id,
    });
    await newProduct.save();

    const newInventory = new inventoryModel({
      product: newProduct._id,
      stock,
    });
    await newInventory.save();

    createdCount++;
  }

  return {
    totalRows: rows.length,
    createdCount,
    skippedCount,
    categoryCreatedCount,
  };
}

async function main() {
  const inputPath = getInputPath();
  await mongoose.connect(DB_URI);

  try {
    const result = await importProducts(inputPath);
    console.log("Import products hoan tat:", result);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error("Import products that bai:", error.message);
  process.exit(1);
});
