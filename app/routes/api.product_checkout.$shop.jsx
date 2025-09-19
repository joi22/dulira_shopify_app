import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ params }) => {
  const { shop } = params;

  // Optional: fetch session if needed
  const { accessToken } = await prisma.session.findFirst({ where: { shop } });

const checkout_upsell = await prisma.upsellTriggerProduct.findMany({
  include: {
    campaign: true, 
  },
});

  return json(
    {
      ok: true,
      checkout_upsell,
      shop,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
};
