import prisma from "../../db.server";

export const checkout_upsell_backend = async (
    admin,
    upsellCampaign,
    rewardType,
    rewardMode,
    discountType,
    discount_Value,
    checkout_products,   // array of product objects
    selectedProducts     // array of product IDs
) => {
    // Save campaign config

    console.log(selectedProducts, "selectedProducts ===========>>>>>", checkout_products,discountType,discount_Value,rewardMode,rewardType);

    const chackoutUpsell = await prisma.checkout_upsell.create({
        data: {
            discountCode: discount_Value || null,
            discountType: discountType || "percentage",
            productId: checkout_products?.length ? checkout_products[0].id : null,
            campaignId: upsellCampaign.id || null,
        },
    });

    // Save all upsell reward products in bulk
    if (checkout_products?.length) {
        await prisma.UpsellRewardProduct.createMany({
            data: checkout_products.map((p) => ({
                campaignId: upsellCampaign.id,
                productId: p.id,
                variantId: String(p.variantId),
                title: p.title,
                price: p.price,
                media: p.media,
            })),
        });
    }

    // Build Shopify discount mutation
    const mutation = `
    mutation CreateDiscount($discount: DiscountAutomaticBxgyInput!) {
      discountAutomaticBxgyCreate(automaticBxgyDiscount: $discount) {
        automaticDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
         `;

    const variables = {
        discount: {
            title: `${upsellCampaign.campaignName}-${Date.now()}`,
            startsAt: new Date().toISOString(),
            combinesWith: {
                orderDiscounts: true,
            },
            customerBuys: {
                value: { quantity: "1" },

                items: {
                    products: {
                        productsToAdd: checkout_products.map(
                            (item) => `gid://shopify/Product/${item.id}`
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
                        effect:
                            discountType === "percentage"
                                ? { percentage: parseFloat(discount_Value) / 100 } // 20 means 20%
                                : { amount: String(parseFloat(discount_Value) || "0.00") }, // must be string decimal
                    },
                },
                items: {
                    products: {
                        productsToAdd: selectedProducts.map(
                            (p) => `gid://shopify/Product/${p.id}`
                        ),
                    },
                },
            },

        },
    };

    const response = await admin.graphql(mutation, { variables });
    const resJson = await response.json();

    const errors =
        resJson?.data?.discountAutomaticBxgyCreate?.userErrors || [];
    if (errors.length > 0) {
        console.error("Discount creation failed:", errors);
        throw new Error(JSON.stringify(errors));
    }

    const discountId =
        resJson?.data?.discountAutomaticBxgyCreate?.automaticDiscountNode?.id;
    console.log("✅ Created Checkout Upsell Discount:", discountId);

    // return { dbRecord: chackoutUpsell, discountId };
};
