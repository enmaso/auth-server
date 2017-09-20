require('dotenv').config()
const express = require('express')
const passport = require('passport')
const Strategy = require('passport-box').Strategy
const Service = require('../lib/service')

passport.serializeUser(function (user, done) {
  done(null, user.id)
})
passport.deserializeUser(function (obj, done) {
  done(null, obj)
})
passport.use(new Strategy({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  callbackURL: process.env.BOX_CLIENT_CALLBACK_URL,
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
  process.nextTick(() => {
    let service = new Service()
    service.provider = 'box'
    service.identity = profile.login
    service.userId = req.session.passport.user
    service.accessToken = accessToken
    service.refreshToken = refreshToken
    service.profile = profile
    service.save(err => {
      if (err) {
        console.error(err)
      }
      return done(null, profile)
    })
  })
}))

const router = express.Router()

router.get('/', passport.authenticate('box', {
  accessType: 'offline',
  approvalPrompt: 'force'
}))

router.get('/callback', (req, res, next) => {
  passport.authenticate('box', function (err, profile, info) {
    if (err) {
      console.error(err)
    }
    res.status(200).json(profile)
  })(req, res, next)
})

module.exports = router
