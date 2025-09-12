import { PlusIcon } from '@shopify/polaris-icons';
import bogo from './_index/media/bogo.jpg'
import add_to_unlock from './_index/media/addtounlock.png'
import './_index/style.css'
import {
    Page,
    Card,
    Badge,
    ButtonGroup,
    Button,
    IndexTable,
    Text,
    EmptyState,
    Layout,
    ActionMenu,
    Modal,
    TextContainer,
    InlineStack,
    Thumbnail,
    Box,
    BlockStack,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useLoaderData, useNavigate } from "@remix-run/react";

// ✅ Loader
export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    const campingall = await prisma.UpsellCampaign.findMany({
        where: { shop },
    });

    return { campingall };
};

export default function UpsellEngine() {
    const navigate = useNavigate();
    const { campingall } = useLoaderData();

    const [active, setActive] = useState(false);
    const handleChange = useCallback(() => setActive(!active), [active]);

    const resourceName = {
        singular: "campaign",
        plural: "campaigns",
    };

    const campaignTypes = [
        {
            type: "buy_one_get_one",
            title: "🛍 BOGO",
            desc: "Buy One, Get One Free or Discounted",
            img: bogo,
            url:'addtounlock'
        },
        {
            type: "add_to_unlock",
            title: "🎁 Add to Unlock",
            desc: "Progress bar for free gifts/discounts",
            img: add_to_unlock,
            url:'addtounlock'
            
        },
        {
            type: "buy_more_save_more",
            title: "📦 Buy More, Save More",
            desc: "Bulk pricing tiers",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/buy_more.png",
            url:'addtounlock'
        },
        {
            type: "checkout_upsell",
            title: "⚡ Checkout Upsell",
            desc: "Quick offers during checkout",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/checkout.png",
            url:'addtounlock'
        },
        {
            type: "order_bump",
            title: "📌 Order Bump",
            desc: "Add-ons like insurance, priority, etc.",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/orderbump.png",
            url:'addtounlock'
        },
        {
            type: "post_purchase",
            title: "🧾 Post-Purchase",
            desc: "Offer shown after order confirmation",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/postpurchase.png",
            url:'addtounlock'
        },
    ];

    return (
        <Page
            title="Upsell Engine"
            primaryAction={{
                content: 'New Campaign',
                icon: PlusIcon,
                onAction: handleChange,
            }}
        >
            <Layout sectioned>
                <Card>
                    {(!campingall || campingall.length === 0) ? (
                        <EmptyState
                            heading="No campaigns yet"
                            action={{ content: "Create campaign", onAction: handleChange }}
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>Create an upsell campaign to start boosting revenue.</p>
                        </EmptyState>
                    ) : (
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={campingall.length}
                            selectable={false}
                            headings={[
                                { title: "Status" },
                                { title: "Campaign" },
                                { title: "Type" },
                                { title: "Placement" },
                                { title: "Created At" },
                                { title: "Actions" },
                            ]}
                        >
                            {campingall.map((campaign, index) => (
                                <IndexTable.Row
                                    id={campaign.id}
                                    key={campaign.id}
                                    position={index}
                                >
                                    <IndexTable.Cell>
                                        <Badge status={campaign.status ? "success" : "critical"}>
                                            <label className="switch">
                                                <input type="checkbox" />
                                                <span className="slider round"></span>
                                            </label>
                                        </Badge>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <Text>{campaign.name}</Text>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.type}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.placement}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.createdAt}</IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <ButtonGroup>
                                            <ActionMenu
                                                actions={[
                                                    { content: "Preview", onAction: () => console.log("Preview") },
                                                    { content: "Edit", onAction: () => console.log("Edit") },
                                                    { content: "Delete", onAction: () => console.log("Delete"), destructive: true },
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

            {/* ✅ Modal without Stack */}
            <Modal
                open={active}
                onClose={handleChange}
                title="Choose a Campaign Type"
                large
            >
                <Modal.Section>
                    <div className="campaign-grid">
                        <InlineStack wrap align='space-around' gap={'300'}>
                            {campaignTypes.map((c) => (
                                <div className="campaign-card" key={c.type}>
                                    <Box width='250px' >
                                        <Card roundedAbove='md'>
                                            <BlockStack gap={"200"}>
                                                <Thumbnail
                                                    size=''
                                                    source={c.img}
                                                    alt={c.title}
                                                />

                                                <Text variant="headingMd">{c.title}</Text>

                                                <p>{c.desc}</p>
                                                <Button
                                                    onClick={() => navigate(`/app/${c.url}?type=${c.type}`)}
                                                    primary
                                                >
                                                    Select
                                                </Button>

                                            </BlockStack>

                                        </Card>
                                    </Box>
                                </div>
                            ))}
                        </InlineStack>
                    </div>

                </Modal.Section>
            </Modal>

            {/* ✅ CSS in ./_index/style.css */}
            {/* 
      .campaign-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
      }
      .campaign-card {
        border: 1px solid #e1e3e5;
        border-radius: 8px;
        padding: 16px;
        background: #fff;
        text-align: center;
      }
      .campaign-card img {
        margin-bottom: 12px;
        border-radius: 6px;
      }
      */}
        </Page>
    );
};
