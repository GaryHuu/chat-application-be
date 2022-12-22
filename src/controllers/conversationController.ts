import { Request, Response } from 'express'

const Conversation = require('../models/ConversationModel')
const Message = require('../models/MessageModel')

type ConversationControllerType = {
  getMessages: (req: Request, res: Response) => Promise<void>
  chatMessage: (req: Request, res: Response) => Promise<void>
  getMessageLongPolling: (req: Request, res: Response) => Promise<void>
}

type ResponseLongPollingType = {
  [conversationId: string]: {
    [userId: string]: Response
  }
}

let responseLongPolling: ResponseLongPollingType = {}

const conversationsController: ConversationControllerType = {
  getMessages: async (req, res) => {
    try {
      const { conversationId } = req.params
      const conversation = await Conversation.findById(conversationId)

      if (!conversation) {
        res.status(400).json({ msg: 'Conversation does not exist' })
        return
      }

      const messagesId = conversation.messagesId || []
      const messageData = await Message.find({ _id: { $in: messagesId } })

      res.status(200).json(messageData.reverse())
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  chatMessage: async (req, res) => {
    try {
      const { conversationId } = req.params
      const { fromUserId, content } = req.body
      if (!conversationId || !fromUserId || !content) {
        res.status(400).json({ msg: 'Err' })
      }

      const conversation = await Conversation.findById(conversationId)

      if (!conversation) {
        res.status(400).json({ msg: 'Conversation does not exist' })
        return
      }

      if (!fromUserId && !content) {
        res.status(400).json({ msg: 'Error' })
      }

      const newMessage = new Message({
        fromUserId,
        content,
      })

      const newMessageSaved = await newMessage.save()
      const newMessageSavedId = newMessageSaved.id

      conversation.messagesId.unshift(newMessageSavedId)
      await conversation.save()

      if (responseLongPolling?.[conversationId]) {
        const { [fromUserId]: _, ...responseLongPollingNotCurrentUser } =
          responseLongPolling?.[conversationId]
        const listRequest = Object.values(responseLongPollingNotCurrentUser)
        listRequest.forEach((response) => {
          response.status(200).json(newMessageSaved)
        })
      }

      res.status(200).json(newMessageSaved)

      // Tao message => luu db => Tra ve success => Tra ve cho user khac
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  getMessageLongPolling: async (req, res) => {
    try {
      const { conversationId } = req.params
      const { useId } = req.query
      if (!conversationId || !useId) {
        res.status(400).json({ msg: 'Err' })
      }

      if (!responseLongPolling?.[conversationId]) {
        responseLongPolling = {
          ...responseLongPolling,
          [conversationId]: {
            [useId as string]: res,
          },
        }
      } else {
        responseLongPolling = {
          ...responseLongPolling,
          [conversationId]: {
            ...responseLongPolling?.[conversationId],
            [useId as string]: res,
          },
        }
      }
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = conversationsController
