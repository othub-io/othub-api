require('dotenv').config()
const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

//const indexRouter = require('./routes/index')
//const usersRouter = require('./routes/users')
//const exploreRouter = require('./routes/explore')
//const apiPortalRouter = require('./routes/apiPortal')
//const apiRouter = require('./routes/api')
//const homeRouter = require('./routes/dashboard')

//const dashboardRouter = require('./routes/dashboard')
//const lookupRouter = require('./routes/lookup')
//const publishRouter = require('./routes/publish')
//const searchRouter = require('./routes/search')

//mynodes
//const mynodesSettingsRouter = require('./routes/myNodes/settings')

//alliance
//const allianceMembersRouter = require('./routes/alliance/members')
//const allianceRegisterRouter = require('./routes/alliance/register')
//const allianceDashboardRouter = require('./routes/alliance/dashboard')
//const daoRouter = require('./routes/alliance/dao')

//otnode.com
const node_operatorsRouter = require('./routes/alliance/node_operators')

//stats
const v_nodes_statsRouter_otp = require('./routes/otp/views/v_nodes_stats')
const v_nodes_stats_hourlyRouter_otp = require('./routes/otp/views/v_nodes_stats_hourly')
const v_nodesRouter_otp = require('./routes/otp/views/v_nodes')
const v_pubs_statsRouter_otp = require('./routes/otp/views/v_pubs_stats')

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
app.use('/dkg', express.static(__dirname + 'node_modules/dkg.js'))
app.use('/util', express.static(__dirname + 'public/util'))

//api
app.use('/otp/views/v_nodes_stats', v_nodes_statsRouter_otp)
app.use('/otp/views/v_nodes_stats_hourly', v_nodes_stats_hourlyRouter_otp)
app.use('/otp/views/v_nodes', v_nodesRouter_otp)
app.use('/otp/views/v_pubs_stats', v_pubs_statsRouter_otp)

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
