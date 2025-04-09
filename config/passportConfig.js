import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local"
import bcrypt from "bcryptjs";
import User from "../models/user.js";


passport.use(new LocalStrategy(
    { usernameField: 'name' },
    async (name, password, done) => {
        try {
            const user = await User.findOne({ where: { name } })
            if (!user) return done(null, false, { message: "User not found" })

            const isMatch = await bcrypt.compare(password, user.password)
            if (isMatch) return done(null, user)
            else return done(null, false, { message: "Incorrect password" })
        }
        catch (error) {
            return done(error)
        }
        // User.findOne({ name: name }, function(err, user))
        //   if(err) { return done(err) }
        //   if(!user) { return done(null, false) }
        //   if(!user.verifyPassword(password)) {}
    }
))

passport.serializeUser(async (user, done) => {
    done(null, user.id)
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log("We are inside Deserialise user")
        const user = await User.findByPk(id)
        done(null, user)
    }
    catch (error) {
        done(error)
    }
})