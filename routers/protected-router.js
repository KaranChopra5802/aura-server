const express = require("express");
const {
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
  joinEvent,
  getEvents,
  leaveEvent,
  deleteEvent,
  editEvent,
  continueEvent,
  markAttendanceEvent,
  changePassword,
  commentPosts,
  likeComments,
  getUserPostsFollowing
} = require("../routes/post-routes");

const protectedRouter = express.Router();

protectedRouter.get("/posts", getUserPosts);
protectedRouter.get("/posts/following/:id", getUserPostsFollowing);

protectedRouter.get("/user/:id", getUserDetails);
protectedRouter.patch("/user/:id", updateUserDetails);
protectedRouter.post("/posts", postUserPosts);
protectedRouter.get("/posts/:id", getSinglePosts);
protectedRouter.delete("/posts/:id", deleteSinglePosts);
protectedRouter.patch("/posts/:id", editPosts);

protectedRouter.patch("/posts/like/:id", likePosts);
protectedRouter.patch("/posts/dislike/:id", dislikePosts);

protectedRouter.post("/comments/:id", commentPosts);
protectedRouter.patch("/comments/like/:id", likeComments);

protectedRouter.get("/search", searchUsers);
protectedRouter.post("/follow/:id", followUsers);
protectedRouter.post("/unfollow/:id", unfollowUsers);

protectedRouter.patch("/user/setlastlogin/:id", setLastLoggedIn);
protectedRouter.post("/user/change-password", changePassword);

protectedRouter.post("/sendpoints/:id", sendPoints);

protectedRouter.get("/chats/getallchats/:id", getAllChats);
protectedRouter.post("/chats/chat/:id", startChat);
protectedRouter.get("/chats/chat/:id", continueChat);

protectedRouter.post("/events/create/:id", createEvent);
protectedRouter.post("/events/join/:id", joinEvent);
protectedRouter.get("/events/:id", getEvents);
protectedRouter.post("/events/leave/:id", leaveEvent);
protectedRouter.delete("/events/delete/:id", deleteEvent);
protectedRouter.patch("/events/edit/:id", editEvent);
protectedRouter.post("/events/continue/:id", continueEvent);
protectedRouter.post("/events/attendance/:id", markAttendanceEvent);

module.exports = protectedRouter;
