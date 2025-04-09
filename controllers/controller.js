import bcrypt from "bcryptjs"
import User from "../models/user.js"
import speakeasy from "speakeasy"
import qrCode from "qrcode"
import jwt from "jsonwebtoken"
import { SendVerificationCode } from "../config/email.js"


export const register = async (req, res) => {
   try {
      const { name, password, email } = req.body
      console.log(req.body)
      if (!name) {
         return res.status(400).json({ message: "Name is required" })
      }

      const existingUser = await User.findOne({ where: { name } })
      if (existingUser) {
         return res.status(400).json({ message: "Name already taken. Choose a different name." })
      }

      const hashedPassword = await bcrypt.hash(password, 10)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      const newUser = new User({
         name,
         email,
         password: hashedPassword,
         isMfaActive: false,
         verificationCode,
         isVerified: false,
      })

      await newUser.save()

      console.log("Sending OTP to:", email)
      await SendVerificationCode(email, verificationCode)
      res.status(201).json({ message: "User registered successfully" })
   }
   catch (error) {
      console.log("Registration error: ", error)
      res.status(500).json({ error: "Error registering user", message: error.message })
   }
}


export const verifyEmail = async (req, res) => {
   try {
      const { code } = req.body
      const user = await User.findOne({ where: { verificationCode: code } })

      if (!user) {
         return res.status(400).json({ success: false, message: "Invalid or Expired code" })
      }

      user.isVerified = true
      user.verificationCode = undefined
      await user.save()
      return res.status(200).json({ success: true, message: "Email verified successfully" })
   }
   catch (error) {
      console.log(error)
      return res.status(500).json({ success: false, message: "Internal server error" })
   }
}


export const login = async (req, res) => {
   try {
      const user = await User.findOne({ where: { name: req.user.name } })
      if (!user.isVerified) {
         return res.status(401).json({ message: "Pending email verification!", name: req.user.name, isMfaActive: req.user.isMfaActive, isVerified: req.user.isVerified })
      }

      console.log("The authenticated user is : ", req.user)
      if (req.user) {
         return res.status(200).json({ message: "User logged in successfully", name: req.user.name, isMfaActive: req.user.isMfaActive, isVerified: req.user.isVerified })
      }
      else {
         return res.status(401).json({ message: "Authentication failed" })
      }
   }
   catch (error) {
      console.error("Login error", error)
      res.status(500).json({ error: "Error during login", message: error.message })
   }

}



export const authStatus = async (req, res) => {
   if (req.user && req.user.isVerified) {
      res.status(200).json({ message: "user logged in successfully", name: req.user.name, isMfaActive: req.user.isMfaActive, isVerified: req.user.isVerified })
   }
   else {
      if (req.user) {
         res.status(401).json({ message: "Unauthorized user", user: req.user.name })
      } else {
         res.status(401).json({ message: "Unauthorized, no user" })
      }
   }
}


export const logout = async (req, res) => {
   if (!req.user) {
      return res.status(401).json({ message: "Unauthorized user" })
   }

   req.logout((err) => {
      if (err) {
         return res.status(400).json({ message: "User not logged in" })
      }

      req.session.destroy(() => {
         res.clearCookie("connect.sid")
         res.status(200).json({ message: "Logout successfull" })
      })
   })
}


export const setup2FA = async (req, res) => {
   try {
      console.log("The req.user is: ", req.user)

      const user = req.user

      var secret = speakeasy.generateSecret()
      console.log("The secret object is : ", secret);

      user.twoFactorSecret = secret.base32;
      user.isMfaActive = true
      await user.save()

      const url = speakeasy.otpauthURL({
         secret: secret.base32,
         label: `${req.user.name}`,
         issuer: "www.cbss-mfa.com",
         encoding: "base32",
      })

      const qrImageUrl = await qrCode.toDataURL(url)
      res.status(200).json({
         secret: secret.base32,
         qrCode: qrImageUrl,
      })
   }
   catch (error) {
      res.status(500).json({ message: "Error setting up 2FA", error: error.message })
   }
}



export const verify2FA = async (req, res) => {
   const { token } = req.body
   const user = req.user

   const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token,
   })

   if (verified) {
      const jwtToken = jwt.sign({ name: user.name }, process.env.JWT_SECRET, { expiresIn: "1hr" })
      res.status(200).json({ message: "2FA successful", token: jwtToken })
   }
   else {
      res.status(400).json({ message: "Invlaid 2FA token" })
   }
}



export const reset2FA = async (req, res) => {
   try {
      const user = req.user
      user.twoFactorSecret = ""
      user.isMfaActive = false
      await user.save()
      res.status(200).json({ message: "2FA reset successfully" })
   }
   catch (error) {
      res.status(500).json({ error: "Error reseting 2FA ", message: error })
   }
}
