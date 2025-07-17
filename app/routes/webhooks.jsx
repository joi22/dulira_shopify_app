import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { admin, shop, topic, payload, session } = await authenticate.webhook(request)

  if (topic === "ORDERS_CREATE") {

  }

}
