import {
    GiftCardIcon,
    OrderRepeatIcon,
    HeartIcon,
    ClockIcon,
    ChatIcon, PlusIcon
} from '@shopify/polaris-icons';
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
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";

// ✅ Loader
export const loader = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const { shop } = session;

    const campingall = await prisma.UpsellCampaign.findMany({
        where: { shop },
    });

    return { campingall };
};

export const action = async ({ request }) => {
    const { admin, session } = await authenticate.admin(request);
    const { shop, accessToken } = session;
    const formdata = await request.formData();

    const delete_id = formdata.get("del_Id");
    console.log("thsn DELETE ID ,", delete_id);

    await prisma.addToUnlockOffer.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.upsellTriggerProduct.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.upsellTriggerCollection.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.upsellRewardProduct.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.upsellRewardCollection.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.upsellFreeGiftProduct.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.customiz.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.buyMoreRule.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.bogoRule.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.bogoFreeItem.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.orderBump.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.campaignTargetCountry.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.campaignExcludeCountry.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.checkout_upsell.deleteMany({ where: { campaignId: parseInt(delete_id) } });
    await prisma.postPurchaseUpsell.deleteMany({ where: { campaignId: parseInt(delete_id) } });

    // finally delete the campaign
    await prisma.upsellCampaign.delete({ where: { id: parseInt(delete_id) } });




    return null
}

export default function UpsellEngine() {
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const { campingall } = useLoaderData();
    const [status, setStatus] = useState(true);

    const [active, setActive] = useState(false);
    const handleChange = useCallback(() => setActive(!active), [active]);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const resourceName = {
        singular: "campaign",
        plural: "campaigns",
    };

    // ✅ Categories
    const Category = [
        {
            type: "upsell",
            title: "Upsell",
            description:
                "Encourage customers to upgrade or add higher-value products.",
            icon: GiftCardIcon,
        },
        {
            type: "cross_sell",
            title: "Cross-sell",
            description:
                "Suggest complementary products to increase order value.",
            icon: OrderRepeatIcon,
        },
        {
            type: "loyalty",
            title: "Loyalty",
            description:
                "Reward customers for purchases to build long-term relationships.",
            icon: HeartIcon,
        },
        {
            type: "urgency",
            title: "Urgency",
            description:
                "Motivate quick purchases with time-sensitive offers.",
            icon: ClockIcon,
        },
        {
            type: "engagement",
            title: "Engagement",
            description:
                "Boost customer interaction with personalized experiences.",
            icon: ChatIcon,
        },
    ];

    // ✅ Campaign Types (with category)
    const campaignTypes = [
        {
            type: "buy_one_get_one",
            title: "🛍 BOGO",
            desc: "Buy One, Get One Free or Discounted",
            img: bogo,
            url: "addtounlock",
            category: "upsell",
        },
        {
            type: "add_to_unlock",
            title: "🎁 Add to Unlock",
            desc: "Progress bar for free gifts/discounts",
            img: add_to_unlock,
            url: "addtounlock",
            category: "upsell",
        },
        {
            type: "buy_more_save_more",
            title: "📦 Buy More, Save More",
            desc: "Bulk pricing tiers",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/buy_more.png",
            url: "addtounlock",
            category: "upsell",
        },
        {
            type: "checkout_upsell",
            title: "⚡ Checkout Upsell",
            desc: "Quick offers during checkout",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/checkout.png",
            url: "addtounlock",
            category: "upsell",
        },
        {
            type: "order_bump",
            title: "📌 Order Bump",
            desc: "Add-ons like insurance, priority, etc.",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/orderbump.png",
            url: "addtounlock",
            category: "upsell",
        },
        {
            type: "post_purchase",
            title: "🧾 Post-Purchase",
            desc: "Offer shown after order confirmation",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/postpurchase.png",
            url: "addtounlock",
            category: "upsell",
        },

        // 💡 Example for future: Loyalty campaigns
        {
            type: "points_reward",
            title: "⭐ Points Reward",
            desc: "Reward customers with points for purchases",
            img: "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/loyalty.png",
            url: "addtounlock",
            category: "loyalty",
        },
    ];

    const handleSwitchChange = async (field, value, discountId) => {
        if (!discountId) {
            console.error("Invalid discountId:", discountId);
            return;
        }
    };

    const handeldelete = async (id) => {
        if (!id) return;

        if (!window.confirm(`Are you sure you want to delete this offer?`)) {
            return;
        }

        const formData = new FormData();
        formData.append("del_Id", id); // ✅ key = del_Id, value = id

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
            <Layout sectioned>
                <Card>
                    {!campingall || campingall.length === 0 ? (
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
                                        <label className="switch-container">
                                            <input
                                                type="checkbox"
                                                checked={status}
                                                onChange={(e) =>
                                                    handleSwitchChange(
                                                        "Offer_status",
                                                        e.target.checked,
                                                        campaign.id
                                                    )
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
                                    <IndexTable.Cell>{campaign.createdAt}</IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <ButtonGroup>
                                            <ActionMenu
                                                actions={[
                                                    { content: "Preview", onAction: () => console.log("Preview") },
                                                    { content: "Edit", onAction: () => console.log("Edit") },
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

            {/* ✅ Modal */}
            <Modal open={active} onClose={handleChange} title="Choose a Campaign" large>
                <Modal.Section>
                    {!selectedCategory ? (
                        <BlockStack gap={"300"}>
                            <Text variant="headingMd">Step 1: Choose Category</Text>
                            <InlineStack wrap align="center" gap="300">
                                {Category.map((cat) => (
                                    <Box
                                        width='150px'
                                        minHeight='150px'
                                        key={cat.type}
                                        sectioned
                                        onClick={() => setSelectedCategory(cat)}
                                    ><Card >

                                            <cat.icon width="50px" />
                                            <InlineStack align="center" gap="200">
                                                <BlockStack align='center'>
                                                    <Text variant="headingSm">{cat.title}</Text>
                                                    <Text as="p" variant='bodyXs'>{cat.description}</Text>
                                                </BlockStack>
                                                {/* <Button onClick={() => setSelectedCategory(cat.type)}>Selected</Button> */}
                                            </InlineStack>
                                        </Card>
                                    </Box>
                                ))}
                            </InlineStack>
                        </BlockStack>
                    ) : (
                        <BlockStack gap={"200"}>
                            <Text variant="headingMd">
                                Step 2: Choose Campaign Type ({selectedCategory.title})
                            </Text>
                            <InlineStack gap={"100"} align='start'>
                                <Button onClick={() => setSelectedCategory(null)} plain>
                                    ←  Back
                                </Button>
                            </InlineStack>
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
                        </BlockStack>
                    )}
                </Modal.Section>
            </Modal>
        </Page>
    );
}
