import { Request, Response } from 'express'

const Conversation = require('../models/ConversationModel')
const Message = require('../models/MessageModel')
const User = require('../models/UserModel')

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
      let messagesData = await Message.find({ _id: { $in: messagesId } })

      const usersRequests = messagesData.map((user) =>
        User.findById(user?.fromUserId)
      )

      const usersResponse = await Promise.all(usersRequests)

      messagesData = messagesData.map((message, idx) => {
        return {
          ...JSON.parse(JSON.stringify(message)),
          user: {
            name: usersResponse[idx].name,
            id: usersResponse[idx]._id,
            avatarURL: usersResponse[idx].avatarURL,
          },
        }
      })

      res.status(200).json(messagesData)
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

      let newMessageSaved = await newMessage.save()
      const newMessageSavedId = newMessageSaved.id

      const { _id, name, avatarURL } = await User.findById(fromUserId)
      newMessageSaved = {
        ...JSON.parse(JSON.stringify(newMessageSaved)),
        user: {
          id: _id,
          name,
          avatarURL,
        },
      }

      conversation.messagesId.unshift(newMessageSavedId)
      await conversation.save()

      if (responseLongPolling?.[conversationId]) {
        const { [fromUserId]: _, ...responseLongPollingNotCurrentUser } =
          responseLongPolling?.[conversationId]
        const listKeyOfResponse = Object.keys(responseLongPollingNotCurrentUser)
        listKeyOfResponse.forEach((key) => {
          const response = responseLongPollingNotCurrentUser?.[key]
          if (response) {
            response.status(200).json(newMessageSaved)
            delete responseLongPolling?.[conversationId]?.[key]
          }
        })
      }

      res.status(200).json(newMessageSaved)
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
