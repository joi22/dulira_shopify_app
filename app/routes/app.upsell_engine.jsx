import { PlusIcon } from '@shopify/polaris-icons';
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
} from "@shopify/polaris";
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

    const resourceName = {
        singular: "campaign",
        plural: "campaigns",
    };

    return (
        <Page
            title="Upsell Engine"
            primaryAction={{
                content: 'New Campaign',
                icon: PlusIcon,
                accessibilityLabel: 'Create New Campaign',
                onAction: () => { navigate('/app/upsell'); },
            }}
        >
            <Layout sectioned>
                <Card>
                    {(!campingall || campingall.length === 0) ? (
                        <EmptyState
                            heading="No campaigns yet"
                            action={{ content: "Create campaign", url: "/app/upsell" }}
                            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                        >
                            <p>
                                Create an upsell campaign to start boosting your revenue with
                                offers like BOGO, Post-Purchase, or FBT.
                            </p>
                        </EmptyState>
                    ) : (
                        <IndexTable
                            resourceName={resourceName}
                            itemCount={campingall.length}
                            selectable={false} // ✅ disables the selection checkboxes
                            headings={[
                                { title: "Status" },
                                { title: "Campaign" },
                                { title: "Type" },
                                { title: "Placement" },
                                { title: "Created At" },
                                // { title: "Deal" },
                                // { title: "Revenue" },
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
                                            <label className="switch"> <input type="checkbox" /> <span class="slider round"></span> </label>
                                        </Badge>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>
                                        <Text>{campaign.name}</Text>
                                    </IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.type}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.placement}</IndexTable.Cell>
                                    <IndexTable.Cell>{campaign.createdAt}</IndexTable.Cell>
                                    {/* <IndexTable.Cell>{campaign.deal}</IndexTable.Cell> */}
                                    {/* <IndexTable.Cell>{campaign.revenue}</IndexTable.Cell> */}
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
        </Page>
    );
};
