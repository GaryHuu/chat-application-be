const mongoose = require('mongoose')

const groupSchema = new mongoose.Schema(
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
    conversationId: {
      type: String,
      require: true,
    },
    usersId: {
      type: [String],
      require: true,
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

module.exports = mongoose.model('Groups', groupSchema)

export {}
