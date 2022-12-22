const express = require('express')
const userController = require('../controllers/userController')

const router = express.Router()

router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/:userId/friends', userController.getFriends)
router.get('/:userId/groups', userController.getGroups)
router.post('/add-friends', userController.addFriend)

module.exports = router

export {}
