import { Request, Response } from 'express'

const User = require('../models/UserModel')
const Group = require('../models/GroupModel')
const Conversation = require('../models/ConversationModel')

type UserControllerType = {
  register: (req: Request, res: Response) => Promise<void>
  login: (req: Request, res: Response) => Promise<void>
  addFriend: (req: Request, res: Response) => Promise<void>
  getFriends: (req: Request, res: Response) => Promise<void>
  getGroups: (req: Request, res: Response) => Promise<void>
}

const usersController: UserControllerType = {
  register: async (req, res) => {
    try {
      const { name, avatarURL = '' } = req.body
      const newUser = new User({
        avatarURL,
        name,
      })
      const newUserSaved = await newUser.save()
      res.status(200).json(newUserSaved)
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  login: async (req, res) => {
    try {
      const { userId } = req.body
      const user = await User.findById(userId)

      if (!user) {
        res.status(400).json({
          msg: 'User is not existed',
        })
      }

      res.status(200).json(user)
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  addFriend: async (req, res) => {
    try {
      const { userId, friendId } = req.body
      const user = await User.findById(userId)
      const friend = await User.findById(friendId)

      if (!user || !friend) {
        res.status(400).json({
          msg: 'User is not existed',
        })
      }

      const newConversation = new Conversation()
      const newConversationSaved = await newConversation.save()
      const conversationId = newConversationSaved._id

      user?.friends.push({
        userId: friendId,
        conversationId,
      })
      await user.save()

      friend?.friends.push({
        userId: userId,
        conversationId,
      })
      await friend.save()

      res.status(200).json({ msg: 'Create Successfully' })
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  getFriends: async (req, res) => {
    try {
      const { userId } = req.params
      let friendsOfUser = await User.findById(userId).select('friends')
      friendsOfUser = friendsOfUser?.friends || []
      const friendsId = friendsOfUser.map((fr) => fr?.userId)

      const friendsOfUserDetail = await User.find({ _id: { $in: friendsId } })
      const response = friendsOfUserDetail?.map((fr, idx) => {
        return {
          id: friendsOfUser[idx]?.userId,
          conversationId: friendsOfUser[idx]?.conversationId,
          name: fr.name,
          avatarURL: fr.avatarURL,
        }
      })
      res.status(200).json(response)
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
  getGroups: async (req, res) => {
    try {
      const { userId } = req.params
      let groupsOfUser = await User.findById(userId).select('groups')
      groupsOfUser = groupsOfUser?.groups || []
      const groupsId = groupsOfUser.map((gr) => gr?.groupId)

      let groupsOfUserDetail = await Group.find({ _id: { $in: groupsId } })

      const usersInGroupsRequests = groupsOfUserDetail.map((gr) => {
        return User.find({ _id: { $in: gr?.usersId } })
      })

      let userGroups = await Promise.all(usersInGroupsRequests)
      userGroups = userGroups.map((users) => {
        return users.map((user) => {
          return {
            name: user?.name,
            avatarURL: user?.avatarURL,
            id: user?.id,
          }
        })
      })

      groupsOfUserDetail = groupsOfUserDetail.map((group, index) => {
        return {
          ...JSON.parse(JSON.stringify(group)),
          users: JSON.parse(JSON.stringify(userGroups[index])),
        }
      })

      res.status(200).json(groupsOfUserDetail)
    } catch (error) {
      res.status(500).json({ msg: error.message })
    }
  },
}

module.exports = usersController
