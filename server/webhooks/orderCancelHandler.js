import { mapOrderCancelWebhook } from "../controllers/orderCancel.js";

/**
 * @typedef { import("../../_developer/types/2025-04/webhooks.js").ORDERS_CREATE } webhookTopic
 */
/**
 * SQS event payload
 * topic - [ORDER_CREATE]
 */

const orderCancelHandler = async (
  topic,
  shop,
  webhookRequestBody,
  webhookId,
  apiVersion
) => {
  /** @type {webhookTopic} */
  const webhookBody = JSON.parse(webhookRequestBody);
  try {
    await mapOrderCancelWebhook(shop, { ...webhookBody, shop });
  } catch (err) {
    console.log(err.message);
  }
};

export default orderCancelHandler;
