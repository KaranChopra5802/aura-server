const http = require("http");
const { Server } = require("socket.io");
const { User } = require("../models/user-model");
const { Chat } = require("../models/chat-model");
const { sendPushNotification } = require("./push_notification");

let io;
let server;

const initializeSocket = (app) => {
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: [
        "https://mole-present-shrimp.ngrok-free.app",
        "http://aurasocial-env-3.eba-7fmybpcv.ap-south-1.elasticbeanstalk.com",
      ],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    console.log("Chat ID:", socket.handshake.query.chatID);
    const updateResult = await User.updateOne(
      {
        _id: socket.handshake.query.sender,
        "chatInfo.chatID": socket.handshake.query.chatID,
      },
      { $set: { "chatInfo.$.socketID": socket.id } }
    );

    if (updateResult.matchedCount === 0) {
      await User.updateOne(
        { _id: socket.handshake.query.sender },
        {
          $push: {
            chatInfo: {
              socketID: socket.id,
              chatID: socket.handshake.query.chatID,
            },
          },
        }
      );
    }

    socket.on("message", async (data) => {
      console.log("Message received:", data);
      if (data.receiver == null) {
        console.log("herer");
        await receiverNull(data, socket);
      } else {
        const user = await User.findOne({ _id: data.receiver });
        if (user) {
          const chatInfo = user.chatInfo.find(
            (info) => info.chatID.toString() === socket.handshake.query.chatID
          );
          if (chatInfo) {
            const receiverSocketID = chatInfo.socketID;
            console.log("Receiver's Socket ID:", receiverSocketID);

            if (receiverSocketID === null) {
              await receiverNull(data, socket);
            } else {
              const messageData = {
                message: data.message,
                sender: socket.handshake.query.sender,
              };
              await Chat.findByIdAndUpdate(socket.handshake.query.chatID, {
                $push: {
                  messages: messageData,
                },
              });

              console.log("Receiver ID:", data.receiver);

              console.log("Message sent");

              io.to(receiverSocketID).emit("message", data.message);
            }
          } else {
            console.log("Chat not found for this receiver.");
          }
        } else {
          console.log("User not found.");
        }
      }
    });

    // socket.on("typing", (data) => {
    //   if (data.receiver != null) {
    //     io.to(data.receiver).emit("typing", data);
    //   }
    // });

    socket.on("disconnect", async () => {
      const result = await User.findOneAndUpdate(
        {
          _id: socket.handshake.query.sender,
          "chatInfo.chatID": socket.handshake.query.chatID,
        },
        {
          $set: {
            "chatInfo.$.socketID": null,
          },
        },
        { new: true }
      );

      console.log("User disconnected:", result);
    });
  });

  const receiverNull = async (data, socket) => {
    const messageData = {
      message: data.message,
      status: "PENDING",
      sender: socket.handshake.query.sender,
    };
    console.log(messageData);

    const chat = await Chat.findOneAndUpdate(
      { _id: socket.handshake.query.chatID },
      {
        $push: {
          messages: messageData,
        },
      }
    );
    console.log(socket.handshake.query.chatID);

    var receiver;
    var sender;

    if (chat.sender == socket.handshake.query.sender) {
      receiver = chat.receiver;
      sender = chat.sender;
    } else if (chat.receiver == socket.handshake.query.sender) {
      receiver = chat.sender;
      sender = chat.receiver;
    }

    const user = await User.findOne({ _id: receiver });
    const userSender = await User.findOne({ _id: sender });

    // console.log(user);

    try {
      sendPushNotification(
        "New message",
        "You have a new message from " +
          userSender.firstName +
          " " +
          userSender.lastName,
        user.pushId
      );
    } catch (error) {
      console.log(error);
    }
  };
};

module.exports = { initializeSocket, getIO: () => io, getServer: () => server };
