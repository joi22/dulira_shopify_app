import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request, params }) => {
  const { shop } = params;

  if (!shop) {
    return json(
      { ok: false, message: "Shop parameter is required" },
      { status: 400 },
    );
  }

  const session = await prisma.session.findFirst({ where: { shop } });

  if (!session) {
    return json(
      { ok: false, message: "Shop session not found" },
      { status: 404 },
    );
  }

  const { accessToken } = session;

  const upsellTriggerProduct = await prisma.upsellTriggerProduct.findMany({
    where: {
      shop: shop,
    },
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

  const enrichedCampaigns = await Promise.all(
    upsellTriggerProduct.map(async (trigger) => {
      const campaign = trigger.campaign;
      
      // Extract block products from placement metadata
      // Placement can be: array format ["Page"] or object format {placements: ["Page"], blockProducts: [...]}
      let blockProducts = [];
      try {
        const placementRaw = typeof campaign.placement === 'string' 
          ? JSON.parse(campaign.placement) 
          : campaign.placement || [];
        
        // Handle both old array format and new object format
        if (Array.isArray(placementRaw)) {
          // Old format - no block products stored
          blockProducts = [];
        } else if (placementRaw && typeof placementRaw === 'object' && placementRaw.blockProducts) {
          // New format with metadata
          blockProducts = Array.isArray(placementRaw.blockProducts) ? placementRaw.blockProducts : [];
        }
      } catch (e) {
        console.error('Error parsing block products from placement:', e);
      }
      
      if (
        !campaign.rewardCollections ||
        campaign.rewardCollections.length === 0
      ) {
        return {
          ...trigger,
          campaign: {
            ...campaign,
            blockProducts: blockProducts, // Add block products even if no reward collections
          },
        };
      }

      const enrichedCollections = await Promise.all(
        campaign.rewardCollections.map(async (col) => {
          const gid = `gid://shopify/Collection/${col.collectionid}`;
          const gql = `
          query {
            collection(id:"${gid}"){
              products(first: 200){
                edges{ node{
                  id
                  title
                  media(first:1){
                    edges{
                      node{
                        mediaContentType
                        id
                        preview{
                          image{
                            url
                          }
                        }
                      }
                    }
                  }
                  priceRangeV2{maxVariantPrice{amount}}
                  variants(first:200){
                    edges{
                      node{
                        id
                        title
                        price
                        image{altText url}
                      }
                    }
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
              media: p.media.edges?.[0]?.node?.preview?.image?.url,
              variantId:
                p.variants?.edges?.[0]?.node?.id?.split("/").pop() || null,
              price: p.variants?.edges?.[0]?.node?.price || null,
            })),
          };
        }),
      );

      return {
        ...trigger,
        campaign: {
          ...campaign,
          rewardCollectionsWithProducts: enrichedCollections,
          blockProducts: blockProducts, // Add block products to campaign response
        },
      };
    }),
  );

  return json(
    {
      ok: true,
      shop,
      upsellTriggerProduct: enrichedCampaigns,
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

// Handle OPTIONS for CORS
export const options = async () => {
  return json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    },
  );
};
