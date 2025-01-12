const { Chat } = require("../models/chat-model");
const { Payments, Points } = require("../models/points-model");
const { Post } = require("../models/post-model");
const { User } = require("../models/user-model");
const { Events } = require("../models/events-model");
const { createHmac, randomBytes } = require("crypto");
const admin = require("firebase-admin");
const { sendPushNotification } = require("../services/push_notification");
const { send } = require("process");
const { Comments } = require("../models/comment-model");

const changePassword = async (req, res) => {
  try {
    const { userId, newPassword, oldPassword } = req.body;
    const user = await User.findOne({ _id: userId });

    const salt = user.salt;
    const hashedPassword = createHmac("sha256", salt)
      .update(oldPassword)
      .digest("hex");
    if (hashedPassword == user.password) {
      const newPasswordHash = createHmac("sha256", salt)
        .update(newPassword)
        .digest("hex");

      await User.updateOne({ _id: userId }, { password: newPasswordHash });
      res.status(200).send(user);
    } else {
      res.status(403).send("Invalid username or password");
    }
  } catch (e) {
    console.log(e);
    res.status(404).send(e);
  }
};

const getUserPosts = async (req, res) => {
  const allPosts = await Post.find({})
    .populate(
      "createdBy",
      "firstName lastName _id nickname dateOfBirth followers following"
    )
    .populate({
      path: "comments",
      populate: {
        path: "createdBy",
        select: "firstName lastName",
      },
    });
  res.send(allPosts);
};

const getUserPostsFollowing = async (req, res) => {
  const userId = req.params.id;

  const user = await User.findById(userId).select("following");

  if (user.following.length == 0) {
    res.status(404).send("Following not found");
  } else {
    const postsByFollowing = await Post.find({
      createdBy: { $in: user.following },
    })
      .populate(
        "createdBy",
        "firstName lastName _id nickname dateOfBirth followers following"
      )
      .populate({
        path: "comments",
        populate: {
          path: "createdBy",
          select: "firstName lastName",
        },
      });
    res.send(postsByFollowing);
  }
};

const getUserDetails = async (req, res) => {
  const id = req.params.id;
  const user = await User.findOne({ _id: id })
    .populate("following", "firstName lastName _id email profileImageUrl")
    .populate("followers", "firstName lastName _id email profileImageUrl")
    .populate({
      path: "pointsSent",
      populate: {
        path: "user",
        select: "_id firstName lastName email",
      },
    })
    .populate({
      path: "pointsReceived",
      populate: {
        path: "user",
        select: "_id firstName lastName email",
      },
    });

  const {
    _id,
    firstName,
    lastName,
    email,
    nickname,
    dateOfBirth,
    gender,
    isPublic,
    followers,
    following,
    auraPoints,
    pointsSent,
    pointsReceived,
    chats,
    profileImageUrl
  } = user;
  res.send({
    _id,
    firstName,
    lastName,
    email,
    nickname,
    dateOfBirth,
    gender,
    isPublic,
    followers,
    following,
    auraPoints,
    pointsSent,
    pointsReceived,
    chats,
    profileImageUrl
  });
};

const updateUserDetails = async (req, res) => {
  const id = req.params.id;
  const user = await User.findOneAndUpdate({ _id: id }, req.body);
  res.send(user);
};

const postUserPosts = async (req, res) => {
  const created = await Post.create(req.body);

  const post = await created.populate("createdBy", "followers");

  console.log(post);

  if (post.createdBy.followers == []) return;
  else {
    for (let i = 0; i < post.createdBy.followers; i++) {
      sendPushNotification(
        "New post alert !!!",
        post.createdBy.firstName +
          " " +
          post.createdBy.lastName +
          " posted a new post",
        post.createdBy.followers[i].pushId
      );
    }
  }

  console.log(post);

  res.send("Post created successfully");
};

const getSinglePosts = async (req, res) => {
  const id = req.params.id;
  const post = await Post.findById(id).populate("createdBy");

  if (post) {
    const {
      _id,
      caption,
      imageUrl,
      reuse,
      likes,
      createdAt,
      createdBy: { firstName, lastName, _id: createdbyId },
    } = post;

    res.send({
      _id,
      caption,
      imageUrl,
      reuse,
      likes,
      createdAt,
      createdBy: { firstName, lastName, createdbyId },
    });
  } else {
    res.status(404).send("Post not found :(");
  }
};

const deleteSinglePosts = async (req, res) => {
  const id = req.params.id;
  const post = await Post.deleteOne({ _id: id });

  res.send(post);
};

const editPosts = async (req, res) => {
  const id = req.params.id;

  const post = await Post.findByIdAndUpdate(id, req.body, { new: true });

  console.log(post);

  res.send("Post edited successfully");
};

const likePosts = async (req, res) => {
  const id = req.params.id;

  const { likedBy } = req.body;

  const post = await Post.findOneAndUpdate(
    { _id: id },
    { $inc: { likes: 1 }, $push: { likedBy: likedBy } }
  ).populate("createdBy", "pushId");

  sendPushNotification(
    "Post liked",
    "Your post was liked",
    post.createdBy.pushId
  );

  console.log(post);

  res.send("Post liked successfully");
};

const dislikePosts = async (req, res) => {
  const id = req.params.id;

  const { likedBy } = req.body;

  const post = await Post.findOneAndUpdate(
    { _id: id },
    { $inc: { likes: -1 }, $pull: { likedBy: likedBy } }
  );

  console.log(post);

  res.send("Post disliked successfully");
};

const commentPosts = async (req, res) => {
  const id = req.params.id;

  const { commentMade, commentMadeBy } = req.body;

  const comment = await Comments.create({
    comment: commentMade,
    createdBy: commentMadeBy,
  });

  const post = await Post.findOneAndUpdate(
    { _id: id },
    { $push: { comments: comment._id } }
  ).populate("createdBy", "pushId");

  // console.log(post);

  // sendPushNotification(
  //   "Comment Added",
  //   "A commented was added on your post",
  //   post.createdBy.pushId
  // );
  res.send("Comment added successfully");
};

const likeComments = async (req, res) => {
  const id = req.params.id;

  const { likedBy } = req.body;

  const comment = await Comments.updateOne({ _id: id }, { $inc: { likes: 1 } });

  const commentPopulated = await Comments.findOne({ _id: id }).populate(
    "createdBy",
    "pushId"
  );

  sendPushNotification(
    "Comment liked",
    "Your comment was liked",
    commentPopulated.createdBy.pushId
  );
  res.send("Comment liked successfully");
};

const searchUsers = async (req, res) => {
  const search = req.query.user;

  const users = await User.find({ email: { $regex: search, $options: "i" } })
    .populate("following", "firstName lastName _id email")
    .populate("followers", "firstName lastName _id email nickname")
    .populate({
      path: "pointsSent",
      populate: {
        path: "user",
        select: "_id firstName lastName email",
      },
    })
    .populate({
      path: "pointsReceived",
      populate: {
        path: "user",
        select: "_id firstName lastName email",
      },
    });

  if (users) {
    res.status(200).send(users);
  } else {
    res.status(404).send("User not found");
  }
};

const followUsers = async (req, res) => {
  try {
    const id = req.params.id;

    const { followedBy } = req.body;

    const userFollowing = await User.findOneAndUpdate(
      { _id: id },
      { $push: { followers: followedBy } }
    );

    const userFollowed = await User.findOneAndUpdate(
      { _id: followedBy },
      { $push: { following: id } }
    );

    sendPushNotification(
      "New follower",
      userFollowed.firstName + " " + userFollowed.lastName + " followed you",
      userFollowing.pushId
    );

    res.json({ message: "Followed successfully" });
  } catch (e) {
    console.log(e);
  }
};

const unfollowUsers = async (req, res) => {
  try {
    const id = req.params.id;

    const { followedBy } = req.body;

    const userFollowing = await User.updateOne(
      { _id: id },
      { $pull: { followers: followedBy } }
    );

    const userFollowed = await User.updateOne(
      { _id: followedBy },
      { $pull: { following: id } }
    );

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (e) {
    console.log(e);
  }
};

const setLastLoggedIn = async (req, res) => {
  try {
    const id = req.params.id;

    const { lastLoggedAt, pushId } = req.body;

    if (!lastLoggedAt || isNaN(new Date(lastLoggedAt))) {
      return res.status(400).json({ error: "Invalid or missing lastLoggedAt" });
    }

    const result = await User.updateOne(
      { _id: id },
      { $set: { lastLoggedAt: new Date(lastLoggedAt), pushId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ message: "Set logged time successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const sendPoints = async (req, res) => {
  try {
    const id = req.params.id;

    const { sentTo, amount, password } = req.body;

    const user = await User.findOne({ _id: id });

    if (user) {
      const salt = user.salt;
      const hashedPassword = createHmac("sha256", salt)
        .update(password)
        .digest("hex");
      if (hashedPassword == user.password) {
        const paymentSender = await Payments.create({
          user: sentTo,
          amount,
          transactionTime: Date.now(),
        });

        await User.updateOne(
          { _id: id },
          {
            $inc: { auraPoints: -amount },
            $push: { pointsSent: paymentSender },
          }
        );

        const paymentReceiver = await Payments.create({
          user: id,
          amount,
          transactionTime: Date.now(),
        });

        const paymentReceiverUser = await User.updateOne(
          { _id: sentTo },
          {
            $inc: { auraPoints: amount },
            $push: { pointsReceived: paymentReceiver },
          }
        );

        const paymentReceiverNotif = await User.findById(sentTo);

        sendPushNotification(
          "Points received",
          user.firstName +
            " " +
            user.lastName +
            " sent you " +
            amount +
            " points",
          paymentReceiverNotif.pushId
        );

        res.status(200).json({ message: "Points sent successfully" });
      } else {
        res.status(400).send("Something went wrong !!!");
      }
    } else {
      res.status(404).send("User not found");
    }
  } catch (e) {
    console.log(e);
  }
};

const getAllChats = async (req, res) => {
  try {
    const id = req.params.id;

    const chats = await Chat.find({ $or: [{ sender: id }, { receiver: id }] })
      .populate("sender", "firstName lastName _id")
      .populate("receiver", "firstName lastName _id");

    res.status(200).send(chats);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const startChat = async (req, res) => {
  try {
    const id = req.params.id;

    const { receiver } = req.body;

    const result = await Chat.create({
      sender: id,
      receiver,
    });

    await User.updateOne({ _id: id }, { $push: { chats: result._id } });

    await User.updateOne(
      { _id: id },
      {
        $push: { chatInfo: { chatID: result._id, socketID: null } },
      }
    );

    await User.updateOne(
      { _id: receiver },
      {
        $push: { chatInfo: { chatID: result._id, socketID: null } },
      }
    );

    await User.updateOne(
      { _id: receiver },
      {
        $push: { chats: result._id },
      }
    );

    res.status(200).send({ chatID: result._id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const continueChat = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await Chat.findOne({
      _id: id,
    })
      .populate("sender", "chatID pushId firstName lastName")
      .populate("receiver", "chatID pushId firstName lastName");

    // sendPushNotification(
    //   "New message",
    //   result.sender.firstName +
    //     " " +
    //     result.sender.lastName +
    //     " sent you a message",
    //   result.receiver.pushId
    // );

    res.status(200).send(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Events.create({ ...req.body, createdBy: id });

    const populatedEvent = await Events.findById(event._id).populate(
      "createdBy",
      "followers firstName lastName"
    );

    await populatedEvent.populate({
      path: "createdBy.followers",
      select: "pushId",
    });

    await Events.findOneAndUpdate(
      { _id: populatedEvent._id },
      { $push: { joinees: id } }
    );

    await User.updateOne(
      { _id: id },
      {
        $push: {
          eventsCreated: populatedEvent._id,
        },
      }
    );

    await User.updateOne(
      { _id: id },
      {
        $push: {
          eventsJoined: populatedEvent._id,
        },
      }
    );

    for (let i = 0; i < populatedEvent.createdBy.followers.length; i++) {
      const follower = populatedEvent.createdBy.followers[i];
      if (follower.pushId) {
        sendPushNotification(
          "New event alert",
          `${populatedEvent.createdBy.firstName} ${populatedEvent.createdBy.lastName} created a new event : ` +
            populatedEvent.name,
          follower.pushId
        );
      }
    }

    res.status(201).send(populatedEvent);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const joinEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const { joinedBy } = req.body;

    const user = await User.findOne({ _id: joinedBy });

    const event = await Events.findOne({ _id: id });

    const populatedEvent = await Events.findById(event._id).populate(
      "createdBy",
      "firstName lastName pushId"
    );

    if (event.isEdited) {
      await Events.findOneAndUpdate(
        { _id: id },
        { $push: { editedJoinees: joinedBy } }
      );
    } else {
      await Events.findOneAndUpdate(
        { _id: id },
        { $push: { joinees: joinedBy } }
      );
    }

    sendPushNotification(
      "Event joined",
      user.firstName +
        " " +
        user.lastName +
        " joined your event : " +
        populatedEvent.name,
      populatedEvent.createdBy.pushId
    );

    await User.updateOne(
      { _id: id },
      {
        $push: {
          eventsJoined: id,
        },
      }
    );

    res.status(201).send("Event joined successfully");
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getEvents = async (req, res) => {
  try {
    const id = req.params.id;

    const events = await Events.find({})
      .populate({
        path: "createdBy",
        match: {
          $or: [{ followers: id }, { _id: id }],
        },
        select: "firstName lastName _id",
      })
      .populate("joinees", "firstName lastName _id")
      .populate("editedJoinees", "firstName lastName _id")
      .populate("attendedBy", "firstName lastName _id")
      .sort({ createdAt: -1 })
      .lean();

    const filteredEvents = events.filter((event) => event.createdBy != null);
    res.status(200).send(filteredEvents);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const leaveEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const { leftBy } = req.body;

    const event = await Events.findOne({
      _id: id,
    });

    if (event.joinees.includes(leftBy)) {
      await Events.findOneAndUpdate(
        {
          _id: id,
        },
        { $pull: { joinees: leftBy } }
      );

      await User.findByIdAndUpdate(
        {
          _id: leftBy,
        },
        {
          $pull: {
            eventsJoined: id,
          },
        }
      );

      res.status(200).send("Event deleted successfully");
    } else if (event.editedJoinees.includes(leftBy)) {
      await Events.findOneAndUpdate(
        {
          _id: id,
        },
        { $pull: { editedJoinees: leftBy } }
      );

      await User.findByIdAndUpdate(
        {
          _id: leftBy,
        },
        {
          $pull: {
            eventsJoined: id,
          },
        }
      );

      res.status(200).send("Event deleted successfully");
    } else {
      res.status(404).send("User not found");
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Events.findOne({
      _id: id,
    });

    if (!event) {
      res.status(404).send("Event not found");
      return;
    } else {
      await User.updateMany(
        { _id: { $in: event.joinees } },
        { $pull: { eventsJoined: id } }
      );

      await User.updateMany(
        { _id: event.createdBy },
        { $pull: { eventsCreated: id } }
      );

      await Events.deleteOne({
        _id: id,
      });

      res.status(200).send("Event deleted successfully");
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const editEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Events.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await Events.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $set: { ...req.body, isEdited: true },
        $push: { editedJoinees: event.createdBy._id },
        $pull: { joinees: event.createdBy._id },
      },
      {
        new: true,
      }
    );

    const populatedUpdatedEvent = await Events.findById(updatedEvent._id)
      .populate("createdBy", "firstName lastName _id pushId")
      .populate("joinees", "firstName lastName _id pushId");

    console.log(populatedUpdatedEvent);
    res.status(200).send("Event Updated!!!");
    for (let i = 0; i < populatedUpdatedEvent.joinees.length; i++) {
      sendPushNotification(
        "Event edited",
        populatedUpdatedEvent.createdBy.firstName +
          " " +
          populatedUpdatedEvent.createdBy.lastName +
          " edited your event : " +
          populatedUpdatedEvent.name,
        populatedUpdatedEvent.joinees[i].pushId
      );
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const continueEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Events.findById(id);

    const { continuedBy } = req.body;

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await Events.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $push: {
          editedJoinees: continuedBy,
        },
        $pull: {
          joinees: continuedBy,
        },
      },
      {
        new: true,
      }
    );

    const populatedEvent = await Events.findById(updatedEvent._id).populate(
      "createdBy",
      "firstName lastName _id pushId"
    );

    const user = await User.findById(continuedBy);

    sendPushNotification(
      "Event continued",
      user.firstName +
        " " +
        user.lastName +
        " continued with your event : " +
        populatedEvent.name,
      populatedEvent.createdBy.pushId
    );

    res.status(200).send("Event Updated!!!");
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const markAttendanceEvent = async (req, res) => {
  try {
    const id = req.params.id;

    const event = await Events.findById(id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const updatedEvent = await Events.findOneAndUpdate(
      {
        _id: id,
      },
      {
        $push: {
          attendedBy: req.body.attendedBy,
        },
      }
    );

    const user = await User.findOne({
      _id: req.body.attendedBy,
    });

    sendPushNotification(
      "Event attended",
      "Your attendance was marked for : " + updatedEvent.name,
      user.pushId
    );

    const populatedEvent = await updatedEvent.populate(
      "createdBy",
      "firstName lastName _id pushId"
    );

    sendPushNotification(
      "Event attendance marked",
      "Attendance was marked for : " + user.firstName + " " + user.lastName,
      populatedEvent.createdBy.pushId
    );

    res.status(200).send("Event Attendance marked!!!");
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  getUserPosts,
  postUserPosts,
  getSinglePosts,
  deleteSinglePosts,
  editPosts,
  getUserDetails,
  updateUserDetails,
  likePosts,
  dislikePosts,
  searchUsers,
  followUsers,
  unfollowUsers,
  setLastLoggedIn,
  sendPoints,
  getAllChats,
  startChat,
  continueChat,
  createEvent,
  getEvents,
  joinEvent,
  leaveEvent,
  deleteEvent,
  editEvent,
  continueEvent,
  markAttendanceEvent,
  changePassword,
  commentPosts,
  likeComments,
  getUserPostsFollowing
};
