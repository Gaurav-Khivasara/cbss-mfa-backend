import { transporter } from "../config/emailConfig.js"
import { Verification_Email_Template } from "../config/email_Templates.js"
import dotenv from "dotenv"

dotenv.config()

export const SendVerificationCode = async (email, verificationCode) => {
    try {
        if (!email) {
            console.log("Error: Recipient email is missing")
            return
        }
        console.log(`Sending OTP ${verificationCode} to ${email}...`)


        const response = await transporter.sendMail({
            from: ' "cbss-mfa" <${process.env.EMAIL_USER}>',
            to: email,
            subject: "Verify your Email ✌️",
            text: `Your verification code is: ${verificationCode}`,
            html: Verification_Email_Template.replace("{verificationCode}", verificationCode),
        })
        console.log('Email send successfully', response)
    }
    catch (error) {
        console.log("Email error", error)
    }
}