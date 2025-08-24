import prisma from "../../db.server";

export const OrderBump_backend = async (
    admin,
    upsellCampaign,
    bump_title,
    bump_description,
    bump_onetickProducts,
    bump_countries,
    bump_iconUrl,
    precheck,
    tick_products
) => {
    console.log(
        tick_products, "<====>",
        precheck, "<====>",
        bump_iconUrl, "<===>",
        upsellCampaign, "<===>",
        bump_title, "100 <<<<<<<<< +==============",
        bump_countries, "<===>",
        bump_description, "<=====>",
        bump_onetickProducts
    );

    const bump_data = await prisma.orderBump.create({
        data: {
            upsellCampaignId: upsellCampaign.id,   // 👈 relation
            offerTitle: bump_title,
            offerDescription: bump_description,
            iconUrl: bump_iconUrl,
            preChecked: (precheck) ?? false,
            onetickProducts: JSON.stringify(bump_onetickProducts), // if array/object
            // optional toggles if you want to support them
            showConfetti: false,
            showLockedGoals: false,
        },
    });
    await prisma.campaignTargetCountry.createMany({
        data: bump_countries.map(c => ({
            campaignId: upsellCampaign.id,
            code: c.id,
            name: c.title,
        })),
    });
    console.log("✅ Order Bump saved:", bump_data);
    return bump_data;
};
