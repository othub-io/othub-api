require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/dkg', express.static(__dirname + 'node_modules/dkg.js'))
app.use('/util', express.static(__dirname + 'public/util'))
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(bodyParser.text({ limit: '200mb' }));
app.use(cors())

//dkg
const getRouter = require('./routes/dkg/get')
const getBidSuggestionRouter = require('./routes/dkg/getBidSuggestion')
const getLatestStateIssuerRouter = require('./routes/dkg/getLatestStateIssuer')
const getOwnerRouter = require('./routes/dkg/getOwner')
const getStateIssuerRouter = require('./routes/dkg/getStateIssuer')
const getStatesRouter = require('./routes/dkg/getStates')
const createRouter= require('./routes/dkg/create')
const queryRouter = require('./routes/dkg/query')
const transferRouter = require('./routes/dkg/transfer')
const create_n_transferRouter = require('./routes/dkg/create_n_transfer')
const updateRouter = require('./routes/dkg/update')
const isValidUALRouter = require('./routes/dkg/isValidUAL')

//app
const appInfoRouter = require('./routes/app/info')
const appCreateRouter = require('./routes/app/create')
const appDeleteRouter = require('./routes/app/delete')
const appEditRouter = require('./routes/app/edit')

//key
const keysInfoRouter = require('./routes/keys/info')
const keysCreateRouter = require('./routes/keys/create')
const keysDeleteRouter = require('./routes/keys/delete')

//txn
const txnsInfoRouter = require('./routes/txns/info')
const txnsDataRouter = require('./routes/txns/data')
const txnsCompleteRouter = require('./routes/txns/complete')
const txnsRejectRouter = require('./routes/txns/reject')

//assets
const assetsHistoryRouter = require('./routes/assets/history')
const assetsInfoRouter = require('./routes/assets/info')

//publisherss
const publishersStatsRouter = require('./routes/publishers/stats')

//pubs
const pubsStatsRouter = require('./routes/pubs/stats')
const pubsActivityRouter = require('./routes/pubs/activity')

//auth
const authRegisterRouter = require('./routes/auth/register')
const authSignRouter = require('./routes/auth/sign')

//users
const userInfoRouter = require('./routes/user/info')
const userEditRouter = require('./routes/user/edit')

//nodes
const nodeActivityRouter = require('./routes/nodes/activity')
const nodeInfoRouter = require('./routes/nodes/info')
const nodeStatsRouter = require('./routes/nodes/stats')

//delegators
const delegatorsActivityRouter = require('./routes/delegators/activity')
const delegatorsStatsRouter = require('./routes/delegators/stats')

//notifications
const telegramEditRouter = require('./routes/notifications/telegram/edit')
const telegramInfoRouter = require('./routes/notifications/telegram/info')
const telegramNotifyRouter = require('./routes/notifications/telegram/notify')

//notifications
const sentimentInfoRouter = require('./routes/sentiment/info')
const sentimentEditRouter = require('./routes/sentiment/edit')
const sentimentDeleteRouter = require('./routes/sentiment/delete')

//images
const imagesRouter = require('./routes/images/index')

//misc
const syncStatusRouter = require('./routes/misc/sync_status')
const blockchainsRouter = require('./routes/misc/blockchains')
const paranetsRouter = require('./routes/misc/paranets')

//dkg
app.use('/dkg/get', getRouter)
app.use('/dkg/getBidSuggestion', getBidSuggestionRouter)
app.use('/dkg/getLatestStateIssuer', getLatestStateIssuerRouter)
app.use('/dkg/getOwner', getOwnerRouter)
app.use('/dkg/getStateIssuer', getStateIssuerRouter)
app.use('/dkg/getStates', getStatesRouter)
app.use('/dkg/create', createRouter)
app.use('/dkg/update', updateRouter)
app.use('/dkg/query', queryRouter)
app.use('/dkg/transfer', transferRouter)
app.use('/dkg/create_n_transfer', create_n_transferRouter)
app.use('/dkg/isValidUAL', isValidUALRouter)

//app
app.use('/app/info', appInfoRouter)
app.use('/app/create', appCreateRouter)
app.use('/app/delete', appDeleteRouter)
app.use('/app/edit', appEditRouter)

//users
app.use('/user/info', userInfoRouter)
app.use('/user/edit', userEditRouter)

//key
app.use('/keys/info', keysInfoRouter)
app.use('/keys/create', keysCreateRouter)
app.use('/keys/delete', keysDeleteRouter)

//txn
app.use('/txns/info', txnsInfoRouter)
app.use('/txns/data', txnsDataRouter)
app.use('/txns/complete', txnsCompleteRouter)
app.use('/txns/reject', txnsRejectRouter)

//assets
app.use('/assets/history', assetsHistoryRouter)
app.use('/assets/info', assetsInfoRouter)

//auth
app.use('/auth/register', authRegisterRouter)
app.use('/auth/sign', authSignRouter)

//publishers
app.use('/publishers/stats', publishersStatsRouter)

//pubs
app.use('/pubs/activity', pubsActivityRouter)
app.use('/pubs/stats', pubsStatsRouter)

//nodes
app.use('/nodes/activity', nodeActivityRouter)
app.use('/nodes/info', nodeInfoRouter)
app.use('/nodes/stats', nodeStatsRouter)

//nodes
app.use('/delegators/activity', delegatorsActivityRouter)
app.use('/delegators/stats', delegatorsStatsRouter)

//sentiment
app.use('/sentiment/info', sentimentInfoRouter)
app.use('/sentiment/edit', sentimentEditRouter)
app.use('/sentiment/delete', sentimentDeleteRouter)

//notifications
app.use('/notifications/telegram/edit', telegramEditRouter)
app.use('/notifications/telegram/info', telegramInfoRouter)
app.use('/notifications/telegram/notify', telegramNotifyRouter)

//images
app.use('/images', imagesRouter)

//misc
app.use('/misc/sync_status', syncStatusRouter)
app.use('/misc/blockchains', blockchainsRouter)
app.use('/misc/paranets', paranetsRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.json({ result: 'Invalid Path.' })
})

module.exports = app
