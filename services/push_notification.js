const admin = require("firebase-admin");

async function sendPushNotification(title, body, token, imageUrl, resourceId) {

  try{
 if (token === null || token === undefined || token.length < 2) {
    throw new Error("this is an invalid token");
  }
  const message = {
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        channel_id: "high_importance_channel", 
        icon: "message_icon", 
        tag: "message", 
      },
    },
    apns: {
      payload: {
        aps: {
        //   badge,
          sound: "chime.caf",
        },
      },
    },
    data: {
      click_action: "FLUTTER_NOTIFICATION_CLICK", 
      type: "MESSAGE", 
    },
    token,
  };

  try{
    await admin.messaging().send(message);
  } catch (error) {
    console.log(error);
  }

  console.log("Notification sent successfully");

  }catch (error) {
    console.log(error);
  }

 
}

module.exports = { sendPushNotification };
