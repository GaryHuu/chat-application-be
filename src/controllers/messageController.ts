import { Request, Response } from 'express'

const Message = require('../models/MessageModel')

type MessageControllerType = {
  create: (req: Request, res: Response) => Promise<void>
}

const messageController: MessageControllerType = {
  create: async (req, res) => {
    try {
      const { fromUserId, content, type } = req.body
      const newMessage = new Message({
        fromUserId,
        content,
        type,
      })
      await newMessage.save()
      res.status(200).json({ msg: 'Create Successfully' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = messageController

export {}
