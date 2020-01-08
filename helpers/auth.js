module.exports.register = function(req, res) {
  User.register(new User({username:req.body.username}), req.body.password, function(err, newUser) {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function(){ 
        res.redirect("/")
      })
    }
  })
}

module.exports.logout = function(req, res){
  console.log(req.user.username + " has logged out")
  req.logout()
  res.redirect("/")
}