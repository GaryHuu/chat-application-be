require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const userRouter = require('./router/userRouter')
const conversationRouter = require('./router/conversationRouter')
const messageRouter = require('./router/messageRouter')
const groupRouter = require('./router/groupRouter')

const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())

const MONGOOSE_URL: string = process.env.MONGOOSE_URL
mongoose.connect(MONGOOSE_URL, (error: string) => {
  if (error) throw error

  console.log('Connected to MongoDB success')
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log('Server started'))

app.use('/api/users', userRouter)
app.use('/api/conversations', conversationRouter)
app.use('/api/messages', messageRouter)
app.use('/api/groups', groupRouter)

export {}
