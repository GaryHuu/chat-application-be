const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: String,
      require: true,
      trim: true,
    },
    content: {
      type: String,
      require: true,
      trim: true,
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

module.exports = mongoose.model('Messages', messageSchema)

export {}
