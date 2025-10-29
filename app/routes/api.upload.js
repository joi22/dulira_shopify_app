import { json } from "@remix-run/node";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "public/uploads");
const makeDir = async () => {
  await fs.mkdir(uploadDir, { recursive: true });
};
makeDir();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.split(" ").join("-")}`);
  },
});
const upload = multer({ storage });

export const action = async ({ request }) => {
  const formData = await request.formData();
  const image = formData.get("image");
  const fileName = formData.get("fileName") || `${Date.now()}-image.png`;

  if (!image) {
    return json({ error: "No image file found in form data" }, { status: 400 });
  }

  if (!fileName) {
    return json({ error: "No file name provided" }, { status: 400 });
  }

  const buffer = await image.arrayBuffer();

  try {
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, Buffer.from(buffer));
    return json({ url: `/uploads/${path.basename(filePath)}` });
  } catch (err) {
    console.log("Error saving file", err);
    return json({ error: "Failed to save file" }, { status: 500 });
  }
};
