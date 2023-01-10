import { Request, Response } from 'express'

const Conversation = require('../models/ConversationModel')
const Message = require('../models/MessageModel')
const User = require('../models/UserModel')
const Group = require('../models/GroupModel')

type ConversationControllerType = {
  getMessages: (req: Request, res: Response) => Promise<void>
  getConversationInfo: (req: Request, res: Response) => Promise<void>
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
      const { lastMessageId } = req.query
      const conversation = await Conversation.findById(conversationId)

      if (!conversation) {
        res.status(400).json({ msg: 'Conversation does not exist' })
        return
      }

      const messagesIdOfConversation = conversation.messagesId || []
      let messagesId = messagesIdOfConversation

      if (lastMessageId) {
        const index = messagesIdOfConversation.findIndex(
          (id) => id === lastMessageId
        )

        if (index >= 0) {
          messagesId = messagesIdOfConversation.slice(0, index)
        }
      }

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
      const { fromUserId, content, type } = req.body
      if (!conversationId || !fromUserId || !content || !type) {
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
        type,
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
      const { userId } = req.query
      if (!conversationId || !userId) {
        res.status(400).json({ msg: 'Err' })
      }

      if (!responseLongPolling?.[conversationId]) {
        responseLongPolling = {
          ...responseLongPolling,
          [conversationId]: {
            [userId as string]: res,
          },
        }
      } else {
        responseLongPolling = {
          ...responseLongPolling,
          [conversationId]: {
            ...responseLongPolling?.[conversationId],
            [userId as string]: res,
          },
        }
      }
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  getConversationInfo: async (req, res) => {
    try {
      const { conversationId } = req.params
      const { userId } = req.query
      if (!conversationId || !userId) {
        res.status(400).json({ msg: 'Conversation does not exist' })
        return
      }

      const user = await User.findById(userId)
      const objectsOfConversation = [...user?.friends, ...user?.groups]
      const object = objectsOfConversation.find((cv) => {
        return cv?.conversationId === conversationId
      })

      if (object?.userId) {
        const objectUser = await User.findById(object.userId)
        res.status(200).json({
          name: objectUser?.name,
          avatarURL: objectUser?.avatarURL,
          id: conversationId,
        })
        return
      }

      if (object?.groupId) {
        const objectGr = await Group.findById(object.groupId)
        res.status(200).json({
          name: objectGr?.name,
          avatarURL: objectGr?.avatarURL,
          Id: conversationId,
        })
        return
      }

      res.status(400).json({ msg: 'Conversation does not exist' })
    } catch (error) {}
  },
}

module.exports = conversationsController
