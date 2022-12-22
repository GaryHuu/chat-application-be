const express = require('express')
const conversationController = require('../controllers/conversationController')

const router = express.Router()

router.get('/:conversationId', conversationController.getMessages)
router.post('/:conversationId', conversationController.chatMessage)
router.get(
  '/:conversationId/message',
  conversationController.getMessageLongPolling
)

module.exports = router

export {}
