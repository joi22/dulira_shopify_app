import { json } from "@remix-run/node";
import path from "path";
import fs from "fs";
import { LATEST_API_VERSION } from "@shopify/shopify-app-remix/server";
import { authenticate } from "../shopify.server"

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request)
  const { shop } = session
  const formData = await request.formData();

  if (!shop) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  if (!session) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const { accessToken } = session;

  const image = formData.get("image");
  const originalSource = formData.get("originalSrc");
  let imageUrl;
  let imgPath;
  let fileName;
  const domain = session.app_url;
  try {
    if (!originalSource && image instanceof Blob) {
      fileName = formData.get("fileName");
      const newFormData = new FormData();
      newFormData.append("image", image);
      newFormData.append("fileName", fileName);

      const uploadImage = await fetch(`${domain}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadRes = await uploadImage.json();
      // if (uploadRes.ok) {
      // console.log("Upload Response", uploadRes);


      imageUrl = `${domain}/${uploadRes?.url}`;
      imgPath = uploadRes?.url;
      // } else {
      //   console.error("Upload Failed:", uploadRes.error);
      //   return json({ message: "Upload Failed", error: uploadRes.error });
      // }
    } else {
      // console.log({ originalSource });
      imageUrl = originalSource;
      fileName = originalSource.split("/").pop();
    }

    // console.log({ imageUrl, imgPath, fileName });

    const uploadQuery = `
            mutation {
              fileCreate(files: [{
                filename: "${fileName}",
                contentType: IMAGE,
                originalSource: "${imageUrl}"
              }]) {
                files {
                  id
                  fileErrors { message }
                }
                userErrors { message }
              }
            }
          `;

    const uploadResponse = await fetch(
      `https://${shop}/admin/api/${LATEST_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query: uploadQuery }),
      },
    );

    const uploadJson = await uploadResponse.json();
    const fileCreate = uploadJson.data?.fileCreate;

    const currentUploadedId = fileCreate?.files?.[0]?.id;

    if (!currentUploadedId) {
      throw new Error(
        "Upload failed: " +
        JSON.stringify(fileCreate?.fileErrors || fileCreate?.userErrors),
      );
    }

    // Wait for Shopify to process
    await new Promise((r) => setTimeout(r, 5000));

    const fetchQuery = `
            query {
              node(id: "${currentUploadedId}") {
                ... on MediaImage {
                  preview {
                    image {
                      url
                    }
                  }
                }
              }
            }
          `;

    const imageResponse = await fetch(
      `https://${shop}/admin/api/${LATEST_API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query: fetchQuery }),
      },
    );

    const imageJson = await imageResponse.json();

    const finalImageUrl = imageJson.data?.node?.preview?.image?.url;
    // console.log({ finalImageUrl });
    if (!originalSource) {
      const fileToDelete = path.join(process.cwd(), "public", imgPath);
      await fs.unlinkSync(fileToDelete);
    }

    return json(
      { id: currentUploadedId, url: finalImageUrl },
      { status: 200, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  } catch (error) {
    console.log(error);
    if (!originalSource) {
      const fileToDelete = path.join(process.cwd(), "public", imgPath);
      await fs.unlinkSync(fileToDelete);
    }
    return json(
      { error: "Unexpected error" },
      {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  }
};
