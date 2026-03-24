const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const XLSX = require("xlsx");
const mongoose = require("mongoose");

const userModel = require("../schemas/users");
const roleModel = require("../schemas/roles");
const { sendPasswordMail } = require("../utils/sendMail");

const DB_URI = process.env.MONGO_URI || "mongodb://localhost:27017/NNPTUD-C3";
const DEFAULT_INPUT_PATH = "C:/Users/MY TAM/Downloads/user.xlsx";

function getInputPath() {
  const rawArg = process.argv[2];
  if (!rawArg) {
    return DEFAULT_INPUT_PATH;
  }
  return path.resolve(rawArg);
}

function randomPassword(length = 16) {
  // Hex gives [0-9a-f], enough for temporary random passwords.
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

function readRowsFromExcel(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows;
}

function normalizeCell(value) {
  return String(value || "").trim();
}

async function getUserRoleId() {
  const userRole = await roleModel.findOne({
    isDeleted: false,
    name: { $regex: /^user$/i },
  });
  if (!userRole) {
    throw new Error("Khong tim thay role USER trong bang roles.");
  }
  return userRole._id;
}

async function importUsers(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error("Khong tim thay file Excel: " + filePath);
  }

  const rows = readRowsFromExcel(filePath);
  const roleId = await getUserRoleId();

  let createdCount = 0;
  let skippedCount = 0;
  let emailSentCount = 0;
  let emailFailedCount = 0;

  for (const row of rows) {
    const username = normalizeCell(row.username);
    const email = normalizeCell(row.email).toLowerCase();

    if (!username || !email) {
      skippedCount++;
      continue;
    }

    const existed = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (existed) {
      skippedCount++;
      continue;
    }

    const password = randomPassword(16);
    const newUser = new userModel({
      username,
      email,
      password,
      role: roleId,
    });

    await newUser.save();
    createdCount++;

    try {
      await sendPasswordMail(email, username, password);
      emailSentCount++;
    } catch (error) {
      emailFailedCount++;
      console.error("Gui mail that bai cho", email, "-", error.message);
    }
  }

  return {
    totalRows: rows.length,
    createdCount,
    skippedCount,
    emailSentCount,
    emailFailedCount,
  };
}

async function main() {
  const inputPath = getInputPath();
  await mongoose.connect(DB_URI);

  try {
    const result = await importUsers(inputPath);
    console.log("Import hoan tat:", result);
  } finally {
    await mongoose.connection.close();
  }
}

main().catch((error) => {
  console.error("Import users that bai:", error.message);
  process.exit(1);
});
