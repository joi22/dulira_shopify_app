import prisma from "../../db.server";

/**
 * Helper function to make GraphQL requests to Shopify
 */
const shopifyGraphqlRequest = async ({
  shop,
  accessToken,
  query,
  variables,
}) => {
  const response = await fetch(
    `https://${shop}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  return await response.json();
};

export const createDiscountsWithExtension = async (
  shop,
  accessToken,
  offers,
  createdOffersMap, // Map of offer.id (from frontend) to createdOffer.id (from database)
) => {
  try {
    console.log(createdOffersMap, "createdOffersMap ==========>>>>>>>", offers);

    const functionId = process.env.FUNCTION_ID;
    if (!functionId) {
      console.error(
        "❌ Function ID not available. Cannot create discount functions.",
      );
      return { success: false, error: "Function ID not available" };
    }

    // Group offers by unique identifier
    // For discount offers, we'll group by rewardType + discountType + discountCode
    // This allows multiple tiers of the same discount type
    const offerConfigMap = new Map();

    for (const offer of offers) {
      // Only process discount offers
      if (offer.rewardType !== "discount") {
        continue;
      }

      // Create a unique key for grouping
      const offerUnique = `${offer.rewardType}-${offer.discountType}-${offer.discountCode}-${offer.goalType}`;

      if (!offerConfigMap.has(offerUnique)) {
        offerConfigMap.set(offerUnique, []);
      }

      // Get the created offer ID from database
      const createdOfferId = createdOffersMap.get(offer.id);

      // Get product IDs from reward products
      const productIds =
        offer.rewardProducts?.map((p) => p.id) ||
        offer.rewardCollection?.map((c) => c.id) ||
        [];

      offerConfigMap.get(offerUnique).push({
        offerId: createdOfferId || offer.id,
        minimumQuantity:
          offer.goalType === "quantity" ? parseInt(offer.goalquantity) : null,
        minimumAmount:
          offer.goalType === "amount_cart"
            ? parseFloat(offer.goalAmount)
            : null,
        discountValue: parseFloat(offer.discountCode) || 0,
        discountType: offer.discountType, // "percentage" or "amount"
        productIds: productIds,
        selectAll: productIds.length === 0, // If no products selected, apply to all
        goalType: offer.goalType,
      });
    }

    // Shopify mutation query to create discount function
    const discountQuery = `
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          userErrors {
            field
            message
          }
          automaticAppDiscount {
            discountId
            title
            startsAt
            endsAt
            status
            appDiscountType {
              appKey
              functionId
            }
            combinesWith {
              orderDiscounts
              productDiscounts
              shippingDiscounts
            }
          }
        }
      }
    `;

    const discountResults = [];

    // Step 4: Create Shopify discount function per offer group with all tiers
    for (const [offerUnique, discountsArray] of offerConfigMap.entries()) {
      console.log(
        `Creating Shopify discount function for offer ${offerUnique} with ${discountsArray.length} tiers:`,
        discountsArray,
      );

      const metafieldValue = JSON.stringify(discountsArray);

      // Get the first offer from the group to determine customerBuys requirements
      const firstConfig = discountsArray[0];
      const firstOffer = offers.find(
        (o) =>
          o.id === firstConfig.offerId ||
          createdOffersMap.get(o.id) === firstConfig.offerId,
      );

      // Build customerBuys based on the offer's trigger products/collections
      let customerBuysItems = null;
      if (firstOffer) {
        const buyProducts = firstOffer.buyProductPicker || [];
        const buyCollections = firstOffer.buyCollectionPicker || [];

        if (buyProducts.length > 0) {
          customerBuysItems = {
            products: {
              productsToAdd: buyProducts.map(
                (p) => `gid://shopify/Product/${p.id || p}`,
              ),
            },
          };
        } else if (buyCollections.length > 0) {
          customerBuysItems = {
            collections: {
              add: buyCollections.map(
                (c) => `gid://shopify/Collection/${c.id || c}`,
              ),
            },
          };
        } else {
          // If no specific products/collections, apply to all items
          customerBuysItems = {
            allItems: {
              allItems: true,
            },
          };
        }
      } else {
        // Fallback: apply to all items if we can't find the offer
        customerBuysItems = {
          allItems: {
            allItems: true,
          },
        };
      }

      // Build customerBuys value based on goalType
      const firstConfigValue = discountsArray[0];
      let customerBuysValue = null;
      if (
        firstConfigValue.goalType === "quantity" &&
        firstConfigValue.minimumQuantity
      ) {
        customerBuysValue = {
          quantity: String(firstConfigValue.minimumQuantity),
        };
      } else if (
        firstConfigValue.goalType === "amount_cart" &&
        firstConfigValue.minimumAmount
      ) {
        customerBuysValue = {
          amount: String(firstConfigValue.minimumAmount),
        };
      } else {
        // Default to quantity 1 if no goal specified
        customerBuysValue = {
          quantity: "1",
        };
      }

      const variables = {
        automaticAppDiscount: {
          title: `Bulk Discount Function - ${offerUnique} - ${Date.now()}`,
          functionId: functionId,
          startsAt: new Date().toISOString(),
          combinesWith: {
            orderDiscounts: false,
            productDiscounts: true,
            shippingDiscounts: false,
          },
          customerBuys: {
            value: customerBuysValue,
            items: customerBuysItems,
            isOneTimePurchase: true,
            isSubscription: false,
          },
          metafields: [
            {
              namespace: "$app:product-discount",
              key: "function-configuration",
              type: "json",
              value: metafieldValue,
            },
          ],
        },
      };

      const jsonResponse = await shopifyGraphqlRequest({
        shop,
        accessToken,
        query: discountQuery,
        variables,
      });

      const discountID =
        jsonResponse?.data?.discountAutomaticAppCreate?.automaticAppDiscount
          ?.discountId;

      if (!discountID) {
        const errors =
          jsonResponse?.data?.discountAutomaticAppCreate?.userErrors || [];
        console.error(
          `Failed to create discount function for offer ${offerUnique}`,
          errors,
        );
        continue;
      }

      // Update all offers in this group with the discount ID
      for (const config of discountsArray) {
        discountResults.push({
          offerId: config.offerId,
          discountId: discountID,
        });

        // Update the offer in database with discount ID
        // Note: We'll need to add a discountId field to AddToUnlockOffer model
        try {
          await prisma.addToUnlockOffer.update({
            where: { id: config.offerId },
            data: { discountId: discountID },
          });
        } catch (error) {
          console.error(
            `Failed to update offer ${config.offerId} with discount ID:`,
            error,
          );
        }
      }

      console.log(
        `✅ Created discount function for offer ${offerUnique} with ID: ${discountID}`,
      );
    }

    return {
      success: true,
      discounts: discountResults,
    };
  } catch (error) {
    console.error("❌ Error creating discounts with extension:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
