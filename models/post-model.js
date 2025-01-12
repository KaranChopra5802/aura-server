const { model, Schema } = require("mongoose");

const postSchema = new Schema({
    createdAt : {
        type : Date,
        default : Date.now
    },
    createdBy : {
        type : Schema.Types.ObjectId,
        ref : "users",
        required : true
    },
    caption :{
        type: String,
    },
    imageUrl :{
        type: String
    },
    likes :{
        type: Number,
        default : 0
    },
    reuse :{
        type: Boolean,
        default: false
    },
    likedBy : {
        type: [Schema.Types.ObjectId],
        ref: "users"
    },
    comments:{
        type: [Schema.Types.ObjectId],
        ref: "comments"
    }
});

const Post = model("posts", postSchema);

module.exports = { Post };

