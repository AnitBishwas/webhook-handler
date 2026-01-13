import { sendWebhookFailureEventToDynamoDb } from "../aws/dynamoDB/index.js";
import { sendToSQS } from "../aws/sqs/index.js";
import { WebhookTaskError } from "./helpers.js";
import { checkIfCashbackIsUtilisedForOrder } from "./order.js";

/**
 * List of topics
 * ["ORDER_CREATE","CASHBACK_PENDING_ASSIGNED","CASHBACK_UTILISED"]
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order pyaload
 */

const mapOrderCreateWebhook = async (shop, payload) => {
  try {
    const results = await Promise.allSettled([
      sendOrderCreateEventToSQS(shop, payload),
      sendCashbackAssignPendingEventToSQS(shop, payload),
      sendCashbackUtilisedEventToSQS(shop, payload),
    ]);
    results.forEach(async (result, index) => {
      if (result.status === "rejected") {
        const failedWebhook = await sendWebhookFailureEventToDynamoDb({
          orderId: result.reason.orderId,
          topic: result.reason.topic,
          result,
        });
        console.error(`Failed to handle topic ${result.reason.topic}`);
      }
    });
    return results;
  } catch (err) {
    throw new Error("Failed to map order create webhook -->" + err.message);
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendOrderCreateEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "ORDER_CREATE",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send order create event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "ORDER_CREATE",
    });
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendCashbackAssignPendingEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "CASHBACK_PENDING_ASSIGNED",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send cashback pending assigned to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "CASHBACK_PENDING_ASSIGNED",
    });
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendCashbackUtilisedEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    const isCashbackUtilised = await checkIfCashbackIsUtilisedForOrder(
      shop,
      payload.id
    );
    if (!isCashbackUtilised) return;
    return await sendToSQS({
      topic: "CASHBACK_UTILISED",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send cashback utilised event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "CASHBACK_UTILISED",
    });
  }
};
export { mapOrderCreateWebhook };
