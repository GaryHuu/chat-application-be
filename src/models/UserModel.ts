const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true,
    },
    avatarURL: {
      type: String,
      trim: true,
    },
    friends: {
      type: [
        {
          userId: String,
          conversationId: String,
        },
      ],
      default: [],
    },
    groups: {
      type: [
        {
          groupId: String,
          conversationId: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id
        delete ret._id
      },
    },
  }
)

module.exports = mongoose.model('Users', userSchema)
