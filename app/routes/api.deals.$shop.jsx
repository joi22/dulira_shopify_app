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

  // Get all campaigns for this shop (active or without status)
  const campaigns = await prisma.UpsellCampaign.findMany({
    where: {
      shop: shop,
      OR: [{ status: "ACTIVE" }, { status: null }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      offers: true,
      BuyMoreRule: true,
      BogoRule: true,
      customization: true,
    },
  });

  if (!campaigns || campaigns.length === 0) {
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

  // Format deals data for frontend
  const deals = campaigns.map((campaign) => {
    // Get offer details (for add to unlock campaigns)
    const firstOffer = campaign.offers?.[0];

    // Get Buy More Save More details
    const buyMoreRule = campaign.BuyMoreRule?.[0];

    // Get BOGO details
    const bogoRule = campaign.BogoRule?.[0];

    // Determine deal type and format
    let dealInfo = {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      createdAt: campaign.createdAt,
      offerText: "",
      subtext: "",
      badge: "",
      timer: "",
    };

    // Format based on campaign type
    if (campaign.type === "add_to_unlock" && firstOffer) {
      // Add to Unlock campaign
      const discountValue = firstOffer.discountCode || 0;
      const discountType = firstOffer.discountType || "percentage";

      dealInfo.offerText =
        discountType === "percentage"
          ? `Extra ${discountValue}% off &`
          : `Extra €${discountValue} off &`;
      dealInfo.subtext = "Buy more save more";
      dealInfo.badge = "SPECIAL DEAL";
    } else if (campaign.type === "buy_more_save_more" && buyMoreRule) {
      // Buy More Save More campaign
      const discountValue = buyMoreRule.discount || 0;
      const discountType = buyMoreRule.discountType || "percentage";

      dealInfo.offerText =
        discountType === "percentage"
          ? `Extra ${discountValue}% off &`
          : `Extra €${discountValue} off &`;
      dealInfo.subtext = "Buy more save more";
      dealInfo.badge = "BUNDLE DEAL";
    } else if (campaign.type === "bogo" && bogoRule) {
      // BOGO campaign
      dealInfo.offerText = `Buy ${bogoRule.buyQty} Get ${bogoRule.getQty} Free`;
      dealInfo.subtext = "Buy more save more";
      dealInfo.badge = "BOGO DEAL";
    } else {
      // Default/Other campaign types
      dealInfo.offerText = campaign.name || "Special Offer";
      dealInfo.subtext = "Buy more save more";
      dealInfo.badge = "DEAL";
    }

    return dealInfo;
  });

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
