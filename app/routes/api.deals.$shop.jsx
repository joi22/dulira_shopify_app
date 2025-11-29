import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ params }) => {
  const { shop } = params;

  if (!shop) {
    return json(
      { ok: false, message: "Shop parameter is required" },
      { status: 400 },
    );
  }

  console.log(`🔍 Fetching campaigns for shop: ${shop}`);

  // Fetch all unique campaigns for this shop via trigger products
  const triggerProducts = await prisma.upsellTriggerProduct.findMany({
    where: { shop: shop },
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
    orderBy: { createdAt: "desc" },
  });

  console.log(
    `📦 Found ${triggerProducts.length} trigger products for shop: ${shop}`,
  );

  if (!triggerProducts || triggerProducts.length === 0) {
    console.log(`⚠️ No trigger products found for shop: ${shop}`);
    return json(
      { ok: true, deals: [] },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      },
    );
  }

  // Get unique campaigns (avoid duplicates if multiple trigger products share the same campaign)
  const campaignMap = new Map();
  triggerProducts.forEach((trigger) => {
    if (trigger.campaign && !campaignMap.has(trigger.campaign.id)) {
      campaignMap.set(trigger.campaign.id, trigger.campaign);
    }
  });

  const uniqueCampaigns = Array.from(campaignMap.values());
  console.log(
    `✅ Found ${uniqueCampaigns.length} unique campaign(s) for shop: ${shop}`,
  );

  // Transform campaigns into deals format expected by frontend
  const deals = uniqueCampaigns.map((campaign) => {
    // Get the first offer for display purposes
    const firstOffer =
      campaign.offers && campaign.offers.length > 0 ? campaign.offers[0] : null;

    // Build offer text from the first offer
    let offerText = "Special Offer";
    let discountAmount = 0;
    let discountText = "";

    if (firstOffer) {
      if (firstOffer.rewardType === "discount") {
        discountAmount = firstOffer.discountCode || 0;
        if (firstOffer.discountType === "percentage") {
          offerText = `Extra ${discountAmount}% off`;
          discountText = `${discountAmount}% discount`;
        } else {
          offerText = `$${discountAmount} off`;
          discountText = `$${discountAmount} discount`;
        }
      } else if (firstOffer.rewardType === "gift") {
        offerText = "Free Gift";
      } else if (firstOffer.rewardType === "shipping") {
        offerText = "Free Shipping";
        discountText = "Free shipping";
      }
    }

    // Get goal information
    const goalQuantity = firstOffer?.goalQuantity || null;
    const goalAmount = firstOffer?.goalAmount || null;
    const goalType = firstOffer?.goalType || null;

    // Format products for display
    const products = (campaign.triggerProducts || []).map((product) => {
      // Parse media - handle string or array
      let imageUrl = "";
      if (typeof product.media === "string") {
        imageUrl = product.media;
      } else if (Array.isArray(product.media) && product.media.length > 0) {
        imageUrl =
          typeof product.media[0] === "string"
            ? product.media[0]
            : product.media[0]?.src || "";
      }

      // Parse price
      const price = parseFloat(product.price) || 0;
      const originalPrice = price * 1.5; // Estimate original price (can be improved)

      return {
        id: product.id,
        productId: product.productId,
        variantId: product.variantId,
        title: product.productTitle || "Product",
        handle: product.handle || "",
        image: imageUrl,
        price: price,
        originalPrice: originalPrice,
        formattedPrice: `€${price.toFixed(2)}`,
        formattedOriginalPrice: `€${originalPrice.toFixed(2)}`,
      };
    });

    return {
      id: campaign.id,
      name: campaign.name || "Bundle Deal",
      type: campaign.type || "unknown",
      badge: "SPECIAL DEAL",
      timer: "",
      offerText: offerText,
      discountText: discountText,
      subtext: "Buy more save more",
      products: products,
      goalQuantity: goalQuantity,
      goalAmount: goalAmount,
      goalType: goalType,
      campaign: campaign, // Include full campaign data if needed
    };
  });

  console.log(`✅ Formatted ${deals.length} deal(s) for frontend`);

  return json(
    {
      ok: true,
      deals: deals,
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
