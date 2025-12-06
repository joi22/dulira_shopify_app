import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ params }) => {
  const { id, shop } = params;

  const { accessToken } = await prisma.session.findFirst({ where: { shop } });

  // ✅ Only get latest placement
  const upsellTriggerProduct = await prisma.upsellTriggerProduct.findFirst({
    orderBy: { createdAt: "desc" }, // adjust field name if you use `updatedAt` or `id`
    include: {
      campaign: {
        include: {
          rewardProducts: true,
          rewardCollections: true,
          triggerCollections: true,
          triggerProducts: true,
          freeGiftProducts: true,
          offers: true,
          customization: true,
        },
      },
    },
  });

  if (!upsellTriggerProduct) {
    return json({ ok: false, message: "No placement found" }, { status: 404 });
  }

  // enrich rewardCollections with product data
  const campaign = upsellTriggerProduct.campaign;

  let blockProducts = [];
  try {
    const placementRaw =
      typeof campaign.placement === "string"
        ? JSON.parse(campaign.placement)
        : campaign.placement || [];

    // Handle both old array format and new object format
    if (Array.isArray(placementRaw)) {
      // Old format - no block products stored
      blockProducts = [];
    } else if (
      placementRaw &&
      typeof placementRaw === "object" &&
      placementRaw.blockProducts
    ) {
      // New format with metadata
      blockProducts = Array.isArray(placementRaw.blockProducts)
        ? placementRaw.blockProducts
        : [];
    }
  } catch (e) {
    console.error("Error parsing block products from placement:", e);
  }

  let enrichedCollections = [];

  if (campaign.rewardCollections?.length) {
    enrichedCollections = await Promise.all(
      campaign.rewardCollections.map(async (col) => {
        const gid = `gid://shopify/Collection/${col.collectionid}`;
        const gql = `
          query {
            collection(id:"${gid}"){
              products(first: 200){
                edges{ node{
                  id
                  title
                  handle
                  media(first:1){ edges{ node{ preview{ image{ url }}}}}
                  variants(first:200){
                    edges{ node{ id title price image{ url altText } } }
                  }
                }}
              }
            }
          }
        `;

        const response = await fetch(
          `https://${shop}/admin/api/2024-10/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({ query: gql }),
          },
        );

        const result = await response.json();
        const products =
          result?.data?.collection?.products?.edges.map((a) => a.node) || [];

        return {
          ...col,
          products: products.map((p) => ({
            id: p.id.split("/").pop(),
            title: p.title,
            handle: p.handle,
            media: p.media?.edges?.[0]?.node?.preview?.image?.url || null,
            variantId:
              p.variants?.edges?.[0]?.node?.id?.split("/").pop() || null,
            price: p.variants?.edges?.[0]?.node?.price || null,
          })),
        };
      }),
    );
  }

  return json(
    {
      ok: true,
      id,
      shop,
      upsellTriggerProduct: {
        ...upsellTriggerProduct,
        campaign: {
          ...campaign,
          rewardCollectionsWithProducts: enrichedCollections,
          blockProducts: blockProducts, // Add block products to campaign response
        },
      },
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
};
