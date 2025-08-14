import prisma from "../../db.server";


export const Bogo = async (accessToken, admin, upsellCampaign, selectedProducts, freeItems, Rules) => {

  for (const product of selectedProducts) {
    await prisma.UpsellRewardProduct.create({
      data: {
        campaignId: upsellCampaign.id,
        productId: product.id,
        title: product.title,
        price: product.price,
        variantId: String(product.variantId),
        media: product.media,
      },
    });
  }
  for (const rule of Rules) {
    const get = rule.get;
    const buy = rule.buy;


    console.log(freeItems, "this selected Products ")
    await prisma.BogoRule.create({
      data: {
        campaignId: upsellCampaign.id,
        buyQty: String(buy),
        getQty: String(get),
      },
    });

    // Create free items using Promise.all
    await Promise.all(
      freeItems.map((p) =>
        prisma.BogoFreeItem.create({
          data: {
            campaignId: upsellCampaign.id,
            productId: p.id,
            title: p.title,
            price: p.price,
            variantId: String(p.variantId),
            media: p.media,
          },
        })
      )
    );

    const discount = await admin.graphql(
      `#graphql
    mutation CreateBxgyDiscount($automaticBxgyDiscount: DiscountAutomaticBxgyInput!) {
      discountAutomaticBxgyCreate(automaticBxgyDiscount: $automaticBxgyDiscount) {
        automaticDiscountNode {
          id
          automaticDiscount {
            ... on DiscountAutomaticBxgy {
              title
              startsAt
              endsAt
              customerBuys {
                isOneTimePurchase
                isSubscription
                items {
                  ... on AllDiscountItems {
                    allItems
                  }
                }
                value {
                  ... on DiscountQuantity {
                    quantity
                  }
                   ... on DiscountPurchaseAmount{
                amount
              }
                }
              }
              customerGets {
                items {
                  ... on DiscountCollections {
                    collections(first: 100) {
                      edges {
                        node {
                         id
                        }
                      }
                    }
                  }
                }
                value {
                  ... on DiscountPercentage {
                    percentage
                  }
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `,
      {
        variables: {
          automaticBxgyDiscount: {
            title: `${upsellCampaign.campaignName}-BOGO-${Date.now()}`,
            startsAt: new Date().toISOString(),
            customerBuys: {
              value: { quantity: String(buy) },

              items: selectedProducts.length
                ? {
                  products: {
                    productsToAdd: selectedProducts.map(
                      (item) => `gid://shopify/Product/${item.id}`
                    ),
                  },
                }
                : {
                  collections: {
                    add: selectedCollections.map(
                      (p) => `gid://shopify/Collection/${p.id}`
                    ),
                  },
                },

              isOneTimePurchase: true,
              isSubscription: false,
            },


            customerGets: {
              value: {
                discountOnQuantity: {
                  quantity: get,
                  effect: {
                    percentage: 1.0,
                  },
                },
              },
              items: {
                products: {
                  productsToAdd: freeItems.map(
                    (p) => `gid://shopify/Product/${p.id}`
                  ),
                },
              },
            },
          }
        },
      }
    );

    const response = await discount.json();
    const userErrors =
      response?.data?.discountAutomaticBxgyCreate?.userErrors;

    if (userErrors?.length > 0) {
      console.error("Shopify BXGY Discount Creation Errors:", userErrors);
      throw new Error(JSON.stringify(userErrors));
    }

    const discountId =
      response?.data?.discountAutomaticBxgyCreate?.automaticDiscountNode?.id;
    console.log("✅ BXGY Discount Created:", discountId);


  }
};








