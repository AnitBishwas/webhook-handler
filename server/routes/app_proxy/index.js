import { Router } from "express";
import clientProvider from "../../../utils/clientProvider.js";
const proxyRouter = Router();

/**
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
proxyRouter.get("/json", async (req, res) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_shop,
    });
    return res.status(200).send({ content: "Proxy Be Working" });
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});
proxyRouter.use("/test", async (req, res) => {
  try {
    let storeName =
      process.env.NODE_ENV == "dev"
        ? "swiss-local-dev.myshopify.com"
        : "swiss-beauty-dev.myshopify.com";
    const { client } = await clientProvider.offline.graphqlClient({
      shop: storeName,
    });
    const query = `mutation filfillmentEventCreate($fulfillmentEvent: FulfillmentEventInput!){
      fulfillmentEventCreate(fulfillmentEvent : $fulfillmentEvent){
        fulfillmentEvent{
          id
          status
          message
        }
        userErrors{
          field
          message
        }
      }
    }`;
    const variables = {
      fulfillmentEvent: {
        fulfillmentId: "gid://shopify/Fulfillment/6596455956849",
        status: "DELIVERED",
      },
    };
    const { data, extensions, errors } = await client.request(query, {
      variables,
    });
    // console.log(errors);
    res.send({ ok: true }).status(200);
  } catch (err) {
    throw new Error("Failed to handle test reason -->" + err.message);
  }
});
export default proxyRouter;
