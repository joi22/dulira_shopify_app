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
// function extractType(string: string) {
//   let type;
//   if (string.includes("jpg")) {
//     type = "jpg";
//   } else if (string.includes("jpeg")) {
//     type = "jpeg";
//   } else if (string.includes("png")) {
//     type = "png";
//   }
//   return type;
// }
export const action = async ({ request }) => {
  const formData = await request.formData();
  const image = formData.get("image");
  const fileName = formData.get("fileName");
  if (!image) {
    return json({ error: "No image file found in form data" }, { status: 400 });
  }
  const buffer = await image.arrayBuffer();
  //   const imageType = extractType(image.type);
  return new Promise((resolve, reject) => {
    const mockResponse = {
      status: (code) => ({
        json: (data) => reject(json(data, { status: code })),
      }),
    };
    upload.single("image")(request, mockResponse, (err) => {
      if (err) {
        console.log("Error saving file", err);
        reject(json({ error: "File upload failed" }, { status: 500 }));
      } else {
        const filePath = path.join(uploadDir, fileName);
        fs.writeFile(filePath, Buffer.from(buffer))
          .then(() => {
            resolve(json({ url: `/uploads/${path.basename(filePath)}` }));
          })
          .catch((err) => {
            console.log("Error saving file", err);
            reject(json({ error: "Failed to save file" }, { status: 500 }));
          });
      }
    });
  });
};
