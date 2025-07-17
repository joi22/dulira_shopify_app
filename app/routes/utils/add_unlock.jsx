import prisma from "../../db.server";

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
  admin
) => {
  console.log(
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
    "=================>>>> hto"
  );

  let discountId = null;

  try {
    if (rewardType === "gift") {
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
                value: { percentage: 1.0 },
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
    console.log(discountId, "Folde Function ")
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
