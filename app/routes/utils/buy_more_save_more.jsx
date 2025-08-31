import prisma from "../../db.server";

export const buy_more_save_more = async (
  accessToken,
  shop,
  selectedProducts_Buy,
  admin,
  selectedProducts,
  rewardMode,
  flameLevel,
  upsellCampaign,
) => {
  console.log(selectedProducts_Buy.map(p => p.levels), "this All Set level thsib buy")
  if (rewardMode === "fixed") {
    for (const product of selectedProducts_Buy) {
      for (const level of product.levels) {
        // Save the rule in your database
        await prisma.buyMoreRule.create({
          data: {
            campaignId: upsellCampaign.id,
            productId: product.id,
            quantity: parseInt(level.quantity),
            discount: parseFloat(level.discount),
            discountType: level.DiscountType || "percentage",
          },
        });
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

        // Construct the correct value object for discount
        const discountType = level.DiscountType || "percentage"; // Ensure fallback

        let valueObj;
        if (discountType === "percentage") {
          valueObj = { percentage: parseFloat(level.discount) / 100 };
        } else if (discountType === "amount") {
          valueObj = {
            discountAmount: {
              amount: parseFloat(level.discount).toFixed(2),
              appliesOnEachItem: true,
            },
          };
        } else {
          throw new Error(`Unsupported discount type: ${discountType}`);
        }

        // Create the Shopify automatic discount
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
                title: `${upsellCampaign.name}-${Date.now()}` || "Discount",
                startsAt: new Date().toISOString(),
                combinesWith: {
                  productDiscounts: true,
                },
                minimumRequirement: {
                  quantity: {
                    greaterThanOrEqualToQuantity: String(level.quantity),
                  },
                },
                customerGets: {
                  value: valueObj,
                  items: {
                    products: {
                      productsToAdd:
                        `gid://shopify/Product/${product.id}`

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

        const discountId = response?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id;
        console.log("✅ Discount Created:", discountId);
      }
    }
  }

  if (rewardMode === "flame") {

    for (const product of selectedProducts_Buy) {

      const products = await prisma.UpsellRewardProduct.create({
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
    for (const level of flameLevel) {
      // Save each rule per product in DB

        await prisma.buyMoreRule.create({
          data: {
            campaignId: upsellCampaign.id,
            productId: "",
            quantity: parseInt(level.quantity),
            discount: parseFloat(level.discount),
            discountType: level.discountType,
          },
        });



      // Build discount value object based on type
      let valueObj;
      if (level.discountType === "percentage") {
        valueObj = { percentage: parseFloat(level.discount) / 100 };
      } else if (level.discountType === "fixed") {
        valueObj = {
          discountAmount: {
            amount: parseFloat(level.discount).toFixed(2),
            appliesOnEachItem: true,
          },
        };
      } else {
        throw new Error(`Unsupported discount type: ${level.discountType}`);
      }

      // Generate a list of all selected product GIDs
      const productGIDs = selectedProducts_Buy.map(
        (p) => `gid://shopify/Product/${p.id}`
      );

      // Create one discount per level, applied to all selected products
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
              title: `${upsellCampaign.name}-${level.quantity}-${Date.now()}` || "Discount",
              startsAt: new Date().toISOString(),
              combinesWith: {
                productDiscounts: true,
              },
              minimumRequirement: {
                quantity: {
                  greaterThanOrEqualToQuantity: String(level.quantity),
                },
              },
              customerGets: {
                value: valueObj,
                items: {
                  products: {
                    productsToAdd: productGIDs,
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

      const discountId =
        response?.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id;
      console.log("✅ Discount Created:", discountId);
    }
  }




};
