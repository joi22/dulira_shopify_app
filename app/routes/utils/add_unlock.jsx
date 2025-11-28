import prisma from "../../db.server";

const Reward_collection = async (
  reward_collection,
  shop,
  accessToken,
  campaignId,
) => {
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
    const products = result?.data?.collection?.products?.edges || [];

    const productData = products.map(({ node }) => ({
      campaignId,
      productId: node.id.split("/").pop(),
      title: node.title,
      price: node.variants?.edges?.[0]?.node?.price || "0.00",
      variantId: node.variants?.edges?.[0]?.node?.id.split("/").pop() || "",
      media: node.media?.edges?.[0]?.node?.preview?.image?.url || "",
    }));

    if (productData.length > 0) {
      await prisma.UpsellFreeGiftProduct.createMany({
        data: productData,
      });
    }
    return productData;
  }
};

export const add_to_unlock_ = async (
  shop,
  accessToken,
  upsellCampaign,
  selectedProducts,
  offers,
  admin,
) => {
  console.log(
    shop,
    accessToken,
    upsellCampaign,
    selectedProducts,
    offers,
    admin,
  );
  try {
    let discountIds = [];

    for (const offer of offers) {
      const {
        id: offerId,
        goalType,
        goalAmount,
        goalquantity,
        rewardMode,
        rewardType,
        discountCode,
        discountType,
        productPickType,
        buyProductPicker,
        buyCollectionPicker,
        rewardProducts,
        rewardCollection,
        goalTextBefore,
        goalTextAfter,
      } = offer;

      let discountId = null;

      if (rewardType === "gift") {
        // ✅ Handle gift BXGY
        const discount = await admin.graphql(
          `
        mutation CreateBxgyDiscount($automaticBxgyDiscount: DiscountAutomaticBxgyInput!) {
          discountAutomaticBxgyCreate(automaticBxgyDiscount: $automaticBxgyDiscount) {
            automaticDiscountNode {
              id
              automaticDiscount { ... on DiscountAutomaticBxgy { title } }
            }
            userErrors { field message }
          }
        }
      `,
          {
            variables: {
              automaticBxgyDiscount: {
                title: `Offer-${offerId}-${Date.now()}`,
                startsAt: new Date().toISOString(),
                customerBuys: {
                  value: goalquantity
                    ? { quantity: String(goalquantity) }
                    : { amount: String(goalAmount) },
                  items: selectedProducts?.length
                    ? {
                        products: {
                          productsToAdd: selectedProducts.map(
                            (item) => `gid://shopify/Product/${item.id}`,
                          ),
                        },
                      }
                    : {
                        collections: {
                          add: buyCollectionPicker.map(
                            (c) => `gid://shopify/Collection/${c.id}`,
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
                      effect: { percentage: 1.0 },
                    },
                  },
                  items: {
                    products: {
                      productsToAdd: rewardProducts.map(
                        (p) => `gid://shopify/Product/${p.id}`,
                      ),
                    },
                  },
                },
              },
            },
          },
        );

        const response = await discount.json();
        discountId =
          response?.data?.discountAutomaticBxgyCreate?.automaticDiscountNode
            ?.id;

        console.log(
          response?.data?.discountAutomaticBxgyCreate,
          " ,✅ Gift BXGY created for offer",
          offerId,
          discountId,
        );
      } else if (rewardType === "discount") {
        // ✅ Handle discount offer - Apply discount to reward products/collections only, not trigger or block products
        // Determine what to apply discount to: reward products or reward collections
        const hasRewardProducts = rewardProducts && rewardProducts.length > 0;
        const hasRewardCollections =
          rewardCollection && rewardCollection.length > 0;

        // If no reward products or collections, skip creating discount
        if (!hasRewardProducts && !hasRewardCollections) {
          console.warn(
            `⚠️ No reward products or collections found for discount offer ${offerId}. Skipping discount creation.`,
          );
          continue;
        }

        // Build items object based on what's available
        let discountItems = {};
        if (hasRewardProducts) {
          // Apply discount to reward products
          discountItems = {
            products: {
              productsToAdd: rewardProducts.map(
                (p) => `gid://shopify/Product/${p.id}`,
              ),
            },
          };
        } else if (hasRewardCollections) {
          // Apply discount to reward collections
          discountItems = {
            collections: {
              add: rewardCollection.map(
                (c) => `gid://shopify/Collection/${c.id}`,
              ),
            },
          };
        }

        const discount = await admin.graphql(
          `
        mutation discountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
          discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
            automaticDiscountNode { id }
            userErrors { field message }
          }
        }`,
          {
            variables: {
              automaticBasicDiscount: {
                title: `Offer-${offerId}-${Date.now()}`,
                startsAt: new Date().toISOString(),
                minimumRequirement:
                  goalType === "quantity"
                    ? {
                        quantity: {
                          greaterThanOrEqualToQuantity: String(goalquantity),
                        },
                      }
                    : {
                        subtotal: {
                          greaterThanOrEqualToSubtotal:
                            parseFloat(goalAmount).toFixed(2),
                        },
                      },
                customerGets: {
                  value:
                    rewardMode === "fixed"
                      ? discountType === "percentage"
                        ? { percentage: parseFloat(discountCode) / 100 }
                        : {
                            discountAmount: {
                              amount: parseFloat(discountCode),
                              appliesOnEachItem: false,
                            },
                          }
                      : { percentage: 1.0 },
                  items: discountItems,
                },
              },
            },
          },
        );

        const response = await discount.json();
        discountId =
          response?.data?.discountAutomaticBasicCreate?.automaticDiscountNode
            ?.id;

        console.log(
          response?.data?.discountAutomaticBasicCreate,
          "✅ Discount created for offer",
          offerId,
          discountId,
        );
      } else if (rewardType === "shipping") {
        // ✅ Handle free shipping
        const shippingDiscount = await admin.graphql(`
        mutation CreateFreeShippingDiscount {
          discountAutomaticFreeShippingCreate(
            freeShippingAutomaticDiscount: {
              title: "Offer-${offerId}-FreeShipping-${Date.now()}",
              startsAt: "${new Date().toISOString()}",
              minimumRequirement: ${
                goalType === "quantity"
                  ? `{ quantity: { greaterThanOrEqualToQuantity: "${goalquantity}" } }`
                  : `{ subtotal: { greaterThanOrEqualToSubtotal: ${parseFloat(goalAmount).toFixed(2)} } }`
              },
              destination: { all: true }
            }
          ) {
            automaticDiscountNode { id }
            userErrors { field message }
          }
        }
      `);

        const response = await shippingDiscount.json();
        discountId =
          response?.data?.discountAutomaticFreeShippingCreate
            ?.automaticDiscountNode?.id;

        console.log(
          response?.data?.discountAutomaticFreeShippingCreate,
          "✅ Free Shipping created for offer",
          offerId,
          discountId,
        );
      }

      // Store each discountId
      if (discountId) {
        discountIds.push({ offerId, discountId });
      }
    }

    return {
      status: "success",
      message: "All offers processed.",
      discounts: discountIds,
    };
  } catch (error) {
    console.error("❌ Error processing offers:", error);
    return {
      status: "error",
      message: error.message || "Something went wrong",
      discounts: [],
    };
  }
};
