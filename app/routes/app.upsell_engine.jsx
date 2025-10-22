import {
    GiftCardIcon, OrderRepeatIcon, HeartIcon, ClockIcon, ChatIcon, PlusIcon, AlertCircleIcon
} from '@shopify/polaris-icons';
import './_index/style.css'
import {
    Page, Card, ButtonGroup, Button, IndexTable, Text, EmptyState, Layout,
    ActionMenu, Modal, InlineStack, Box, BlockStack, TextField, Divider, Icon,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";

const CATEGORIES = [
    { type: "upsell", title: "Upsell", description: "Encourage customers to upgrade or add higher-value products.", icon: GiftCardIcon },
    { type: "cross_sell", title: "Cross-sell", description: "Suggest complementary products to increase order value.", icon: OrderRepeatIcon },
    { type: "loyalty", title: "Loyalty", description: "Reward customers for purchases to build long-term relationships.", icon: HeartIcon },
    { type: "urgency", title: "Urgency", description: "Motivate quick purchases with time-sensitive offers.", icon: ClockIcon },
    { type: "engagement", title: "Engagement", description: "Boost customer interaction with personalized experiences.", icon: ChatIcon },
];

const CAMPAIGN_CARDS = [
    {
        id: 1, title: "Fixed bundle", type: "buy_one_get_one", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    },
    {
        id: 2, title: "Volume discounts", type: "buy_more_save_more", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    },
    {
        id: 3, title: "Buy X Get Y", type: "bogo", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    },
    {
        id: 4, title: "Fixed bundle", type: "add_to_unlock", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    },
    {
        id: 5, title: "Product add-ons", type: "order_bump", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    },
    {
        id: 6, title: "Frequently bought together", type: "checkout_upsell", url: "addtounlock",
        images: ["https://media.istockphoto.com/id/1471990929/vector/special-offer-banner-mega-sale-off-store-poster-sticker-vector.jpg?s=612x612&w=0&k=20&c=OH8s5-naQZqffl7t11snXxUBVNcSqMFjkr-b8oICsBI="]
    }
];

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const campaigns = await prisma.UpsellCampaign.findMany({
        where: { shop: session.shop },
        include: { offers: { select: { rewardMode: true, rewardType: true } } }
    });

    return {
        campaigns: campaigns.map(campaign => ({
            ...campaign,
            rewardMode: campaign.offers?.[0]?.rewardMode || null,
            rewardType: campaign.offers?.[0]?.rewardType || null
        }))
    };
};

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const formdata = await request.formData();
    const delete_id = formdata.get("del_Id");

    if (!delete_id) return null;

    const deleteOperations = [
        prisma.addToUnlockOffer, prisma.upsellTriggerProduct, prisma.upsellTriggerCollection,
        prisma.upsellRewardProduct, prisma.upsellRewardCollection, prisma.upsellFreeGiftProduct,
        prisma.customiz, prisma.buyMoreRule, prisma.bogoRule, prisma.bogoFreeItem,
        prisma.orderBump, prisma.campaignTargetCountry, prisma.campaignExcludeCountry,
        prisma.checkout_upsell, prisma.postPurchaseUpsell
    ];

    await Promise.all(deleteOperations.map(op => op.deleteMany({ where: { campaignId: parseInt(delete_id) } })));
    await prisma.upsellCampaign.delete({ where: { id: parseInt(delete_id) } });

    return null;
};

const CampaignCard = ({ card, index, campaignName, onSelect }) => {
    const handleSelect = () => {
        if (!campaignName.trim()) return alert("Please enter a campaign name first.");
        onSelect(card);
    };

    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e4e4e4",
            borderRadius: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: "210px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            alignItems: "center",
            padding: "16px",
        }}>
            {/* Image display section - same for all cards */}
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "120px",
                width: "100%",
                border: "1px solid #e1e1e1",
                borderRadius: "12px",
                background: "#f8f8f8",
                marginBottom: "12px",
                overflow: "hidden"
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    width: "100%",
                    height: "100%"
                }}>
                    {card.images.map((img, imgIndex) => (
                        <div key={imgIndex} style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "8px",
                            background: "transparent",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            overflow: "hidden"
                        }}>
                            {/* Use actual image instead of gradient background */}
                            <img
                                src={img}
                                alt={card.title}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px"
                                }}
                                onError={(e) => {
                                    // Fallback if image fails to load
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            {/* Fallback gradient background */}
                            <div style={{
                                width: "100%",
                                height: "100%",
                                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                borderRadius: "8px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "white",
                                fontSize: "14px",
                                fontWeight: "600",
                                display: "none" // Hidden by default, shown only if image fails
                            }}>
                                {card.title}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                textAlign: "left",
                marginBottom: "12px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
            }}>
                <h3 style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#333",
                    marginRight: "120px"
                }}>
                    {card.title}
                </h3>
                <Icon source={AlertCircleIcon} tone="base" />
            </div>

            <Button fullWidth tone="success" variant="secondary" onClick={handleSelect}>
                Select
            </Button>
        </div>
    );
};

const DealTypeModal = ({ open, onClose, onSelect, campaignName, selectedCard }) => {
    return (
        <Modal open={open} onClose={onClose} title="Select Deal Type" small>
            <Modal.Section>
                <BlockStack gap="400">
                    <Text variant="bodyMd">Choose the type of deal you want to create for <strong>"{campaignName}"</strong></Text>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "10px" }}>
                        {/* Fixed Deal Card */}
                        <div
                            style={{
                                background: "#fff",
                                border: "2px solid #e1e1e1",
                                borderRadius: "14px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "space-between",
                                textAlign: "center",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                            }}
                            onClick={() => onSelect("fixed")}
                        >
                            <div
                                style={{
                                    width: "70px",
                                    height: "70px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "30px",
                                    marginBottom: "12px",
                                }}
                            >
                                🔒
                            </div>
                            <Text variant="headingSm">Fixed Deal</Text>
                            <Text tone="subdued" variant="bodySm" alignment="center">
                                Set fixed discounts and offers
                            </Text>
                            <Button
                                fullWidth
                                primary
                                onClick={() => onSelect("fixed")}
                                style={{ marginTop: "16px" }}
                            >
                                Select
                            </Button>
                        </div>

                        {/* Flame Match Card */}
                        <div
                            style={{
                                background: "#fff",
                                border: "2px solid #e1e1e1",
                                borderRadius: "14px",
                                padding: "20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "space-between",
                                textAlign: "center",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                            }}
                            onClick={() => onSelect("flame")}
                        >
                            <div
                                style={{
                                    width: "70px",
                                    height: "70px",
                                    borderRadius: "10px",
                                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontSize: "30px",
                                    marginBottom: "12px",
                                }}
                            >
                                🔥
                            </div>
                            <Text variant="headingSm">Flame Match</Text>
                            <Text tone="subdued" variant="bodySm" alignment="center">
                                Dynamic matching and recommendations
                            </Text>
                            <Button
                                fullWidth
                                primary
                                onClick={() => onSelect("flame")}
                                style={{ marginTop: "16px" }}
                            >
                                Select
                            </Button>
                        </div>
                    </div>
                </BlockStack>
            </Modal.Section>
        </Modal>
    );
};

export default function UpsellEngine() {
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const { campaigns } = useLoaderData();
    const [campaignName, setCampaignName] = useState("");
    const [active, setActive] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDealTypeModal, setShowDealTypeModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);

    const handleChange = useCallback(() => setActive(!active), [active]);

    const handeldelete = async (id) => {
        if (!id || !window.confirm(`Are you sure you want to delete this offer?`)) return;
        const formData = new FormData();
        formData.append("del_Id", id);
        await fetcher.submit(formData, { method: "DELETE", encType: "multipart/form-data" });
    };

    const handleCardSelect = (card) => {
        setSelectedCard(card);
        setShowDealTypeModal(true);
    };

    const handleDealTypeSelect = (dealType) => {
        setShowDealTypeModal(false);
        // Navigate to URL with selected deal type
        navigate(`/app/${selectedCard.url}?type=${selectedCard.type}&name=${encodeURIComponent(campaignName)}&dealType=${dealType}`);
    };

    return (
        <Page title="Upsell Engine" primaryAction={{ content: "New Campaign", icon: PlusIcon, onAction: handleChange }}>
            <style>{`.Polaris-Modal-Dialog__Modal { width: 90vw !important; height: 90vh !important; max-width: none !important; max-height: none !important; } .Polaris-Modal__Body { height: 90%; overflow-y: auto; }`}</style>

            <Layout sectioned>
                <Card>
                    {!campaigns || campaigns.length === 0 ? (
                        <EmptyState heading="No campaigns yet" action={{ content: "Create campaign", onAction: handleChange }} image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png">
                            <p>Create an upsell campaign to start boosting revenue.</p>
                        </EmptyState>
                    ) : (
                        <IndexTable resourceName={{ singular: "campaign", plural: "campaigns" }} itemCount={campaigns.length} selectable={false}
                            headings={[{ title: "Status" }, { title: "Campaign" }, { title: "Type" }, { title: "Placement" }, { title: "Reward Type" }, { title: "Created At" }, { title: "Actions" }]}>
                            {campaigns.map((campaign, index) => (
                                <IndexTable.Row id={campaign.id} key={campaign.id} position={index}>
                                    <IndexTable.Cell>
                                        <label className="switch-container">
                                            <input type="checkbox" checked={campaign.status || false} onChange={(e) => console.log("Toggle", campaign.id, e.target.checked)} className="switch-input" />
                                            <span className="switch-slider"></span>
                                        </label>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell><Text>{campaign.name}</Text></IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.type}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.placement}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.rewardMode}</IndexTable.Cell>
                                    <IndexTable.Cell>{new Date(campaign.createdAt).toLocaleDateString()}</IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <ButtonGroup>
                                            <ActionMenu actions={[
                                                { content: "Preview", onAction: () => console.log("Preview", campaign.id) },
                                                { content: "Edit", onAction: () => console.log("Edit", campaign.id) },
                                                { content: "Delete", onAction: () => handeldelete(campaign.id), destructive: true },
                                            ]} />
                                        </ButtonGroup>
                                    </IndexTable.Cell>
                                </IndexTable.Row>
                            ))}
                        </IndexTable>
                    )}
                </Card>
            </Layout>

            {/* Main Campaign Selection Modal */}
            <Modal open={active} onClose={handleChange} title="Choose a Campaign" large style={{ width: "90%", height: "90%", maxWidth: "none", maxHeight: "none", padding: 0, margin: 0 }}>
                <Modal.Section>
                    {!selectedCategory ? (
                        <BlockStack gap="300">
                            <Text variant="headingMd">Step 1: Name Your Upsell Campaign</Text>
                            <TextField label="Campaign Name" value={campaignName} onChange={setCampaignName} placeholder="e.g., Summer Free Gift Offer" requiredIndicator error={!campaignName ? "Campaign name is required" : ""} />
                            <Divider />
                            <Text variant="headingMd">Step 2: Choose Category</Text>
                            <InlineStack wrap align="center" gap="300" style={{ justifyContent: "center" }}>
                                {CATEGORIES.map((cat) => (
                                    <Box width="150px" minHeight="150px" key={cat.type} onClick={() => setSelectedCategory(cat)} style={{ cursor: "pointer" }}>
                                        <Card>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px" }}>
                                                <cat.icon width="50px" />
                                                <Text variant="headingSm" alignment="center">{cat.title}</Text>
                                                <Text as="p" variant="bodyXs" alignment="center">{cat.description}</Text>
                                            </div>
                                        </Card>
                                    </Box>
                                ))}
                            </InlineStack>
                        </BlockStack>
                    ) : (
                        <div style={{ width: "100%", height: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                                <button onClick={() => setSelectedCategory(null)} style={{ background: "transparent", border: "none", fontSize: "26px", color: "#000", marginTop: "-4px", cursor: "pointer" }} title="Back">←</button>
                                <h2 style={{ marginTop: "-20px", fontSize: "22px", fontWeight: 600, color: "#333", margin: 0 }}>Select bundle type</h2>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px", width: "100%", justifyContent: "center", alignItems: "start" }}>
                                {CAMPAIGN_CARDS.map((card, index) => (
                                    <CampaignCard
                                        key={card.id}
                                        card={card}
                                        index={index}
                                        campaignName={campaignName}
                                        onSelect={handleCardSelect}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </Modal.Section>
            </Modal>

            {/* Deal Type Selection Modal */}
            <DealTypeModal
                open={showDealTypeModal}
                onClose={() => setShowDealTypeModal(false)}
                onSelect={handleDealTypeSelect}
                campaignName={campaignName}
                selectedCard={selectedCard}
            />
        </Page>
    );
}