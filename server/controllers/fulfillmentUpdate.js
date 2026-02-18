import DeliveredOrderModel from "../../utils/models/DeliveredOrder.js";
import { WebhookTaskError } from "./helpers.js";
import { sendWebhookFailureEventToDynamoDb } from "../aws/dynamoDB/index.js";
import { sendToSQS } from "../aws/sqs/index.js";

/**
 * List of topics
 * ["ORDER_DELIVERED","CASHBACK_ASSIGN"]
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order pyaload
 */
const mapFulfillmentUpdateWebhook = async (shop, payload) => {
  try {
    console.dir({
      message:'mapping fulfillment handler here',
      payload
    },{
      depth: null
    })
    const checkIfOrderIsAlreadyMarkedDelivered =
      await DeliveredOrderModel.findOneAndUpdate(
        { orderId: payload.order_id },
        {
          $setOnInsert: { orderId: payload.order_id },
        },
        { upsert: true, new: false }
      );
    const checkIfOrderHasDeliveredStatus =
      payload.shipment_status == "delivered";
    if (
      !checkIfOrderIsAlreadyMarkedDelivered &&
      checkIfOrderHasDeliveredStatus
    ) {
      await DeliveredOrderModel.create([
        {
          orderId: payload.order_id,
        },
      ]);
      const results = await Promise.allSettled([
        sendOrderDeliveredEventToSQS(shop, payload),
        sendCashbackAssignEventToSQS(shop, payload),
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
    }
  } catch (err) {
    throw new Error(
      "Failed to map order fulfillment update webhook reason -->" + err.message
    );
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendOrderDeliveredEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "ORDER_DELIVERED",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send order deliver event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.order_id,
      topic: "ORDER_DELIVERED",
    });
  }
};

/**
 *
 * @param {!string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 * @param {!object} payload - order payload
 */
const sendCashbackAssignEventToSQS = async (shop, payload) => {
  try {
    if (!payload || !shop) {
      throw new Error("Payload and shop are required parameters");
    }
    return await sendToSQS({
      topic: "CASHBACK_ASSIGN",
      shop,
      ...payload,
    });
  } catch (err) {
    throw new WebhookTaskError({
      message: "Failed to send cashback assign event to SQS",
      originalError: {
        message: err.message,
        code: err.code,
      },
      orderId: payload.order_id,
      topic: "CASHBACK_ASSIGN",
    });
  }
};

export { mapFulfillmentUpdateWebhook };
