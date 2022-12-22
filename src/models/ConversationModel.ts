const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema(
  {
    messagesId: {
      type: [String],
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

module.exports = mongoose.model('Conversations', conversationSchema)

export {}
