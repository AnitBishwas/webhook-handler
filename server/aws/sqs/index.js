import AWS from "aws-sdk";

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const sqs = new AWS.SQS();

const sendToSQS = async (payload) => {
  try {
    const params = {
      QueueUrl: process.env.SQS_URL,
      MessageBody: JSON.stringify(payload),
    };
    return sqs.sendMessage(params).promise();
  } catch (err) {
    throw new Error("Failed to send message to SQS reason -->" + err.message);
  }
};
// const processMessage = async (message) => {
//   const data = JSON.parse(message.Body);

//   console.log("Processing event:", data.topic);

//   // Example logic
//   if (data.topic === "orders/create") {
//     // Allocate cashback
//     // Push analytics to BigQuery
//     // Trigger expiry job
//   }
// };

// const pollQueue = async () => {
//   try {
//     const params = {
//       QueueUrl: process.env.SQS_URL,
//       MaxNumberOfMessages: 10,
//       WaitTimeSeconds: 20,
//     };
//     console.log(params,'hertertee')
//    const result = await sqs.receiveMessage(params).promise();
//     if (!result.Messages) return;
//     for (const message of result.Messages) {
//       try {
//         await processMessage(message);

//         // Delete after successful processing
//         await sqs
//           .deleteMessage({
//             QueueUrl: process.env.SQS_URL,
//             ReceiptHandle: message.ReceiptHandle,
//           })
//           .promise();
//       } catch (err) {
//         console.error("Processing failed:", err);
//       }
//     }
//   } catch (err) {
//     console.log("Failed to poll queue reason -->" + err.message);
//   }
// };
// pollQueue();
export { sendToSQS };
