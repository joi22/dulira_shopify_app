import { json } from '@remix-run/node';
import prisma from '../db.server';



export const loader = async ({ request, params }) => {
  const { id, shop } = params;

  const { accessToken } = await prisma.session.findFirst({ where: { shop } });


  const upsellTriggerProduct = await prisma.upsellTriggerProduct.findMany({
    where: {
      productId: String(id)
    },
    include: {
      campaign: {
        include: {
          rewardProducts: true,
          rewardCollections: true,   // fixed
          triggerCollections: true,
          triggerProducts: true,
          freeGiftProducts: true,    // fixed
          offers: true,
          customization:true,
          // buyMoreRules: true,
          // bogoFreeItems: true,
          // bogoRules: true,
          // orderBump: true,
          // CampaignTargetCountry: true, // fixed
          // CampaignExcludeCountry: true // fixed
        }
      }
    },
    
  });


  const enrichedCampaigns = await Promise.all(
    upsellTriggerProduct.map(async (trigger) => {
      const campaign = trigger.campaign;

      if (!campaign.rewardCollections || campaign.rewardCollections.length === 0) {
        return trigger;
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

          const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
            body: JSON.stringify({ query: gql }),
          });

          const result = await response.json();
          const products = result?.data?.collection?.products?.edges.map((a) => a.node) || [];

          return {
            ...col,
            products: products.map((p) => ({
              id: p.id.split('/').pop(),
              title: p.title,
              handle: p.handle,
              media: p.media.edges?.[0]?.node?.preview?.image?.url,
              variantId: p.variants?.edges?.[0]?.node?.id?.split('/').pop() || null,
              price: p.variants?.edges?.[0]?.node?.price || null,
            })),
          };
        })
      );

      return {
        ...trigger,
        campaign: {
          ...campaign,
          rewardCollectionsWithProducts: enrichedCollections,
        },
      };
    })
  );


  return json({
    ok: true,
    id,
    shop,
    upsellTriggerProduct: enrichedCampaigns
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

