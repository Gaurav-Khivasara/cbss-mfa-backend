import express, { json, urlencoded } from "express"
import session from "express-session"
import passport from "passport"
import dotenv from "dotenv"
import cors from "cors"
import db from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import pg from "pg"
import connectPgSimple from "connect-pg-simple"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "./models/user.js"
import "./config/passportConfig.js"


dotenv.config()

const app = express()
const pgSession = connectPgSimple(session)

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
})


const corsOptions = {
    origin: ["http://localhost:5173"],
    credentials: true,
}
app.use(cors(corsOptions))
// app.use(json({limit: "100vh" }))
app.use(express.json())
app.use(express.urlencoded({ limit: "100mb", extended: true }))
app.use(session({
    store: new pgSession({ pool: pool, tableName: "session" }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6000 * 60 }
}))

app.use(passport.initialize())
app.use(passport.session())

app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 7002

app.post("/api/auth/login", async (req, res) => {
    console.log("Login Request Body: ", req.body)
    const { username, password } = req.body
    if (!username || !password) {
        return res.status(200).j
    }

    try {
        const user = await User.findOne({ username })
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h", })
        return res.status(200).json({ message: "Login successful", token })
    }
    catch (error) {
        console.log("Login error:", error)
        return res.status(500).json({ error: "Internal server error", message: error.message })
    }
})
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))