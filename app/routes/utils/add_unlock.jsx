import prisma from "../../db.server";


const Reward_collection = async (reward_collection, shop, accessToken, campaignId) => {


  for (const colId of reward_collection.map((items) => items.id)) {
    const gid = `gid://shopify/Collection/${colId}`;
    const gql = `
      query {
        collection(id:"${gid}") {
          products(first: 200) {
            edges {
              node {
                id
                title
                handle
                media(first: 1) {
                  edges {
                    node {
                      preview {
                        image {
                          url
                        }
                      }
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      title
                      price
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query: gql }),
    });

    const result = await response.json();
    const products = result?.data?.collection?.products?.edges || [];

    const productData = products.map(({ node }) => ({
      campaignId,
      productId: node.id.split("/").pop(),
      title: node.title,
      price: node.variants?.edges?.[0]?.node?.price || '0.00',
      variantId: node.variants?.edges?.[0]?.node?.id.split("/").pop() || '',
      media: node.media?.edges?.[0]?.node?.preview?.image?.url || '',
    }));

    if (productData.length > 0) {
      await prisma.UpsellFreeGiftProduct.createMany({
        data: productData,
      });
    }
  }
};


export const add_to_unlock_ = async (
  shop,
  accessToken,
  rewardType,
  campaignName,
  goalType,
  goalQuantity,
  goalAmounts,
  discountCode,
  rewardProducts,
  upsellCampaign,
  reward_collection,
  rewardMode,
  discountType,
  admin,
  selectedProducts,
  selectedCollections
) => {

  let discountId = null;

  try {
    if (rewardType === "gift") {

      const campaignId = upsellCampaign.id;
      console.log(reward_collection, "this Fronted ")
      const rewads_product = await Reward_collection(reward_collection, shop, accessToken, campaignId)

      await prisma.UpsellRewardProduct.createMany({
        data: selectedProducts.map((p) => ({
          campaignId: upsellCampaign.id,
          productId: p.id,
          variantId: String(p.variantId),
          title: p.title,
          price: p.price,
          media: p.media,
        })),
      });

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
              title: `${campaignName}-${Date.now()}`,
              startsAt: new Date().toISOString(),
              customerBuys: {
                value: goalQuantity
                  ? { quantity: String(goalQuantity) }
                  : { amount: String(goalAmounts) },

                items: selectedProducts?.length
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
                    quantity: "1",
                    effect: {
                      percentage: 1.0,
                    },
                  },
                },
                items: {
                  collections: {
                    add: reward_collection.map(
                      (p) => `gid://shopify/Collection/${p.id}`
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


    } else if (rewardType === "discount") {
      const discount = await admin.graphql(
        `#graphql
        mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
          discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
            automaticDiscountNode {
              id
              automaticDiscount {
                ... on DiscountAutomaticBasic {
                  title
                }
              }
            }
            userErrors {
              field
              code
              message
            }
          }
        }`,
        {
          variables: {
            automaticBasicDiscount: {
              title: `${campaignName}-${Date.now()}` || "Discount",
              startsAt: new Date().toISOString(),
              combinesWith: {
                productDiscounts: rewardType === "discount",
                shippingDiscounts: rewardType === "shipping",
                orderDiscounts: false,
              },
              minimumRequirement:
                goalType === "quantity"
                  ? {
                    quantity: {
                      greaterThanOrEqualToQuantity: String(goalQuantity),
                    },
                  }
                  : {
                    subtotal: {
                      greaterThanOrEqualToSubtotal: parseFloat(goalAmounts).toFixed(2),
                    },
                  },
              customerGets: {
                value:
                  rewardMode === "fixed"
                    ? rewardType === "shipping"
                      ? { percentage: 1.0 }
                      : discountType === "percentage"
                        ? { percentage: parseFloat(discountCode) / 100 }
                        : {
                          discountAmount: {
                            amount: parseFloat(discountCode),
                            appliesOnEachItem: false,
                          },
                        }
                    : { percentage: 1.0 },
                items: {
                  products: {
                    productsToAdd: rewardProducts.map(
                      (p) => `gid://shopify/Product/${p.id}`
                    ),
                  },
                },
              },
            },
          },
        }
      );

      const response = await discount.json();
      const userErrors = response?.data?.discountAutomaticBasicCreate?.userErrors;

      if (userErrors?.length > 0) {
        console.error("Shopify Discount Creation Errors:", userErrors);
        throw new Error(JSON.stringify(userErrors));
      }

      discountId = response?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id;
      console.log("✅ Discount Created:", discountId);

      if (rewardProducts.length > 0) {
        await prisma.UpsellRewardProduct.createMany({
          data: rewardProducts.map((p) => ({
            campaignId: upsellCampaign.id,
            productId: p.id,
            title: p.title,
            price: p.price,
            variantId: String(p.variantId),
            handle: p.handle,
            media: p.media,
          })),
        });
      }
    } else if (rewardType === "shipping") {
      const minimumRequirementBlock =
        goalType === "quantity"
          ? `
        minimumRequirement: {
          quantity: { greaterThanOrEqualToQuantity: "${String(goalQuantity)}" }
        },`
          : `
        minimumRequirement: {
          subtotal: { greaterThanOrEqualToSubtotal: ${parseFloat(goalAmounts).toFixed(2)} }
        },`;

      const shippingDiscountTitle = `${campaignName}-FreeShipping-${Date.now()}`;
      const startsAt = new Date().toISOString();

      const shippingDiscount = await admin.graphql(`
        mutation CreateFreeShippingDiscount {
          discountAutomaticFreeShippingCreate(
            freeShippingAutomaticDiscount: {
              title: "${shippingDiscountTitle}",
              startsAt: "${startsAt}",
              appliesOnOneTimePurchase: true,
              appliesOnSubscription: true,
              ${minimumRequirementBlock}
              destination: { all: true }
            }
          ) {
            automaticDiscountNode {
              id
              automaticDiscount {
                ... on DiscountAutomaticFreeShipping {
                  title
                  startsAt
                  endsAt
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `);

      const shippingResponse = await shippingDiscount.json();
      const shippingErrors = shippingResponse?.data?.discountAutomaticFreeShippingCreate?.userErrors;

      if (shippingErrors?.length > 0) {
        console.error("Free Shipping Creation Errors:", shippingErrors);
        throw new Error(JSON.stringify(shippingErrors));
      }

      discountId = shippingResponse?.data?.discountAutomaticFreeShippingCreate?.automaticDiscountNode?.id;
      console.log("✅ Free Shipping Discount Created:", discountId);

      if (rewardProducts.length > 0) {
        await prisma.UpsellRewardProduct.createMany({
          data: rewardProducts.map((p) => ({
            campaignId: upsellCampaign.id,
            productId: p.id,
            title: p.title,
            price: p.price,
            variantId: String(p.variantId),
            handle: p.handle,
            media: p.media,
          })),
        });
      }
    }
    return {
      status: "success",
      message: "Reward setup completed.",
      discountId,
    };
  } catch (error) {
    console.error("❌ Error in add_to_unlock:", error);
    return {
      status: "error",
      message: error.message || "Something went wrong",
      discountId: null,
    };
  }
};



