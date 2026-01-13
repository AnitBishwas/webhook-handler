import { WebhookTaskError } from "./helpers.js";
import { sendToSQS } from "../aws/sqs/index.js";
import { sendWebhookFailureEventToDynamoDb } from "../aws/dynamoDB/index.js";

/**
 * List of topics
 * ["ORDER_CANCEL","CASHBACK_CANCEL"]
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order pyaload
 */
const mapOrderCancelWebhook = async (shop, payload) => {
  try {
    const results = await Promise.allSettled([
      sendOrderCancelEventToSQS(shop, payload),
      sendCashbackCancelEventToSQS(shop, payload),
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
    console.log("Failed to map order cancel webhook reason -->" + err.message);
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendOrderCancelEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "ORDER_CANCEL",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send order cancel event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "ORDER_CANCEL",
    });
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendCashbackCancelEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "CASHBACK_CANCEL",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send cashback cancel event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.id,
      topic: "CASHBACK_CANCEL",
    });
  }
};

export { mapOrderCancelWebhook };
