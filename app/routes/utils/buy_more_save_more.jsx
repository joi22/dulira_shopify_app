import prisma from "../../db.server";

export const buy_more_save_more = async (
  accessToken,
  shop,
  selectedProducts_Buy,
  admin,
  selectedProducts,
  rewardMode,
  upsellCampaign
) => {
  console.log(rewardMode, "Reward Mode");

  if (rewardMode === "fixed") {
    console.log(selectedProducts_Buy, "Buy More Range Setup");
    for (const product of selectedProducts_Buy) {
      for (const level of product.levels) {
        await prisma.buyMoreRule.create({
          data: {
            campaignId: upsellCampaign.id,
            productId: product.id,
            quantity: parseInt(level.quantity),
            discount: parseFloat(level.discount),
            discountType: level.DiscountType,
          },
        });
      }
    }
  }

  // if (rewardMode === "flame") {
  //   // Step 1: Store selected product IDs in relation table
  //   for (const product of selectedProducts) {
  //     await prisma.flameMatchProduct.create({
  //       data: {
  //         campaignId: upsellCampaign.id,
  //         productId: product.id,
  //       },
  //     });
  //   }

    // Step 2: Store flame settings in campaign
    // await prisma.upsellCampaign.update({
    //   where: { id: campaignId },
    //   data: {
    //     rewardMode: "flame",
    //     goalType: "quantity",
    //     goalAmount: parseInt(flameRange.min),     // min items to pick
    //     goalquantity: parseInt(flameRange.max),   // max items to pick
    //     discountType: "percentage",
    //     discountCode: flameDiscount,              // percent off (25%)
    //   },
    // });
  // }
};
