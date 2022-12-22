import { Request, Response } from 'express'

const Group = require('../models/GroupModel')
const Conversation = require('../models/ConversationModel')
const User = require('../models/UserModel')

type GroupControllerType = {
  create: (req: Request, res: Response) => Promise<void>
}

const groupController: GroupControllerType = {
  create: async (req, res) => {
    try {
      const { name, avatarURL, usersId } = req.body

      const newConversation = new Conversation()
      const newConversationSaved = await newConversation.save()
      const conversationId = newConversationSaved._id

      const newGroup = new Group({
        name,
        avatarURL,
        usersId,
        conversationId,
      })
      const newGroupSaved = await newGroup.save()
      const groupId = newGroupSaved._id

      const getUserRequests = usersId.map((userId) => User.findById(userId))
      const users = await Promise.all(getUserRequests)

      const updateUserRequests = users.map((user) => {
        user.groups.push({
          groupId,
          conversationId,
        })

        return user.save()
      })

      await Promise.all(updateUserRequests)

      res.status(200).json({ msg: 'Create Successfully' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = groupController

export {}
