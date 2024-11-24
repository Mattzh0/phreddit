// Comment Document Schema
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxLength: 500
  },
  commentIDs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  commentedBy: {
    type: String,
    required: true,
  },
  commentedDate: {
    type: Date,
    default: Date.now
  },
});

commentSchema.virtual("url").get(function () {
  return `comments/${this._id}`;
})

module.exports = mongoose.model("Comment", commentSchema);