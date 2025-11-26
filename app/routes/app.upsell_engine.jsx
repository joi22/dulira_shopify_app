import {

  PlusIcon,
} from "@shopify/polaris-icons";
import "./_index/style.css";
import {
  Page,
  Card,
  ButtonGroup,
  IndexTable,
  Text,
  EmptyState,
  Layout,
  ActionMenu,

} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";


export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const campaigns = await prisma.UpsellCampaign.findMany({
    where: { shop: session.shop },
    include: {
      offers: { select: { rewardMode: true, rewardType: true } },
      BuyMoreRule: { select: { discountType: true } },
      BogoRule: { select: { buyQty: true, getQty: true } },
      OrderBump: { select: { offerTitle: true } },
      checkout_upsell: { select: { discountType: true } },
      PostPurchaseUpsell: { select: { discountType: true } },
    },
  });

  return {
    campaigns: campaigns.map((campaign) => {
      let rewardMode = null;
      let rewardType = null;

      // Determine reward mode and type based on campaign type
      if (campaign.type === "add_to_unlock") {
        rewardMode = campaign.offers?.[0]?.rewardMode || null;
        rewardType = campaign.offers?.[0]?.rewardType || null;
      } else if (campaign.type === "buy_more_save_more") {
        rewardMode = campaign.BuyMoreRule?.[0] ? "fixed" : null;
        rewardType = "discount";
      } else if (campaign.type === "buy_one_get_one") {
        rewardMode = "fixed";
        rewardType = "gift";
      } else if (campaign.type === "order_bump") {
        rewardMode = "fixed";
        rewardType = "product";
      } else if (campaign.type === "checkout_upsell") {
        rewardMode = "fixed";
        rewardType = "discount";
      } else if (campaign.type === "post_purchase") {
        rewardMode = "fixed";
        rewardType = "discount";
      }

      return {
        ...campaign,
        rewardMode,
        rewardType,
      };
    }),
  };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formdata = await request.formData();
  const delete_id = formdata.get("del_Id");

  if (!delete_id) return null;

  const deleteOperations = [
    prisma.addToUnlockOffer,
    prisma.upsellTriggerProduct,
    prisma.upsellTriggerCollection,
    prisma.upsellRewardProduct,
    prisma.upsellRewardCollection,
    prisma.upsellFreeGiftProduct,
    prisma.customiz,
    prisma.buyMoreRule,
    prisma.bogoRule,
    prisma.bogoFreeItem,
    prisma.orderBump,
    prisma.campaignTargetCountry,
    prisma.campaignExcludeCountry,
    prisma.checkout_upsell,
    prisma.postPurchaseUpsell,
  ];

  await Promise.all(
    deleteOperations.map((op) =>
      op.deleteMany({ where: { campaignId: parseInt(delete_id) } }),
    ),
  );
  await prisma.UpsellCampaign.delete({ where: { id: parseInt(delete_id) } });

  return null;
};

export default function UpsellEngine() {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { campaigns } = useLoaderData();


  const handleChange = useCallback(() => {
    
    navigate("/app/create_campaign");
  }, [navigate]);

  const handeldelete = async (id) => {
    if (!id || !window.confirm(`Are you sure you want to delete this offer?`))
      return;
    const formData = new FormData();
    formData.append("del_Id", id);
    await fetcher.submit(formData, {
      method: "DELETE",
      encType: "multipart/form-data",
    });
  };


  return (
    <Page
      title="Upsell Engine"
      primaryAction={{
        content: "New Campaign",
        icon: PlusIcon,
        onAction: handleChange,
      }}
    >
      <style>{`
        .Polaris-Modal-Dialog__Modal { 
          width: 90vw !important; 
          height: 90vh !important; 
          max-width: none !important; 
          max-height: none !important; 
        } 
        .Polaris-Modal__Body { 
          height: 90%; 
          overflow-y: auto; 
          padding: 20px !important;
        }
        .Polaris-Modal-Section {
          padding: 0 !important;
        }
      `}</style>

      <Layout sectioned>
        <Card>
          {!campaigns || campaigns.length === 0 ? (
            <EmptyState
              heading="No campaigns yet"
              action={{ content: "Create campaign", onAction: handleChange }}
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Create an upsell campaign to start boosting revenue.</p>
            </EmptyState>
          ) : (
            <IndexTable
              resourceName={{ singular: "campaign", plural: "campaigns" }}
              itemCount={campaigns.length}
              selectable={false}
              headings={[
                { title: "Status" },
                { title: "Campaign" },
                { title: "Type" },
                { title: "Placement" },
                { title: "Offer Type" },
                { title: "Reward Type" },
                { title: "Created At" },
                { title: "Actions" },
              ]}
            >
              {campaigns.map((campaign, index) => (
                <IndexTable.Row
                  id={campaign.id}
                  key={campaign.id}
                  position={index}
                >
                  <IndexTable.Cell>
                    <label className="switch-container">
                      <input
                        type="checkbox"
                        checked={campaign.status || false}
                        onChange={(e) =>
                          console.log("Toggle", campaign.id, e.target.checked)
                        }
                        className="switch-input"
                      />
                      <span className="switch-slider"></span>
                    </label>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Text>{campaign.name}</Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{campaign.type}</IndexTable.Cell>
                  <IndexTable.Cell>{campaign.placement}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {campaign.rewardMode === "fixed"
                      ? "Fixed Deal"
                      : campaign.rewardMode === "flame"
                        ? "Flame Match"
                        : "N/A"}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{campaign.rewardType}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <ButtonGroup>
                      <ActionMenu
                        actions={[
                          {
                            content: "Preview",
                            onAction: () => console.log("Preview", campaign.id),
                          },
                          {
                            content: "Edit",
                            onAction: () => console.log("Edit", campaign.id),
                          },
                          {
                            content: "Delete",
                            onAction: () => handeldelete(campaign.id),
                            destructive: true,
                          },
                        ]}
                      />
                    </ButtonGroup>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          )}
        </Card>
      </Layout>
    </Page>
  );
}
