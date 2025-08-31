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
    tick_products,
    offerType
) => {
    console.log(
        tick_products, "<====>",
        precheck, "<====>",
        bump_iconUrl, "<===>",
        upsellCampaign, "<===>",
        bump_title, "100 <<<<<<<<< +==============",
        bump_countries, "<===>",
        bump_description, "<=====>",
        bump_onetickProducts, "<=====>",
        offerType,
    );
    // Create Product
  //   const new_products = await admin.graphql(
  //       `
  //   mutation productCreate($input: ProductCreateInput!) {
  //     productCreate(product: $input) {
  //       product {
  //         id
  //         title
  //         handle
  //         status
  //       }
  //       userErrors {
  //         field
  //         message
  //       }
  //     }
  //   }
  // `,
  //       {
  //           variables: {
  //               input: {
  //                   title: bump_title,
  //                   descriptionHtml: bump_description,
  //               },
  //           },
  //       }
  //   );

  //   const productData = await new_products.json();
  //   const productId = productData.data.productCreate.product?.id;

  //   console.log("Created Product:", productId);

  //   // Fetch publications (channels)
  //   const publicationsQuery = await admin.graphql(
  //       `
  //   query GetPublications {
  //     publications(first: 10) {
  //       edges {
  //         node {
  //           id
  //           name
  //         }
  //       }
  //     }
  //   }
  // `
  //   );

  //   const publicationsData = await publicationsQuery.json();
  //   const publicationIds = publicationsData.data.publications.edges.map((edg) => edg.node.id);

  //   console.log("Available Publications:", publicationIds);

  //   // Publish product to all available publications
  //   if (productId && publicationIds.length > 0) {
  //       const publishMutation = await admin.graphql(
  //           `
  //     mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
  //       publishablePublish(id: $id, input: $input) {
  //         publishable {
  //           ... on Product {
  //             id
  //             title
  //             handle
  //           }
  //         }
  //         userErrors {
  //           field
  //           message
  //         }
  //       }
  //     }
  //   `,
  //           {
  //               variables: {
  //                   id: productId,
  //                   input: publicationIds.map((pubId) => ({
  //                       publicationId: pubId,
  //                   })),
  //               },
  //           }
  //       );

  //       const publishResponse = await publishMutation.json();
  //       console.log("📢 Product published:", JSON.stringify(publishResponse, null, 2));
  //   }


    await prisma.UpsellRewardProduct.createMany({
        data: {
            campaignId: upsellCampaign.id,
            productId: tick_products.id,
            variantId: String(tick_products.variantId),
            title: tick_products.title,
            price: tick_products.price,
            media: tick_products.media,
        },
    });

    const bump_data = await prisma.orderBump.create({
        data: {
            upsellCampaignId: upsellCampaign.id,   // 👈 relation
            offerTitle: bump_title,
            offerDescription: bump_description,
            iconUrl: bump_iconUrl,
            preChecked: (precheck) ?? false,
            offerType,
            onetickProducts: JSON.stringify(bump_onetickProducts),
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
