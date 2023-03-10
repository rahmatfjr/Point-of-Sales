module.exports = {
  isLoggedIn: (req, res, next) => {
    // console.log(req.session.user)
    if (req.session.user) {
      return next()
    }
    res.redirect('/login')
  },

  isAdmin: function (req, res, next) {
    // console.log('user ', req.session.user);
    if (req.session.user && req.session.user.role == 'admin') {
      return next()
    }
    res.redirect('/sales')
  }

}