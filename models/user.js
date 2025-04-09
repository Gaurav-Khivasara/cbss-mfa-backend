import { Sequelize, DataTypes } from "sequelize"
import dotenv from "dotenv"

dotenv.config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
})

const User = sequelize.define("User", {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    isMfaActive: { type: DataTypes.BOOLEAN, allowNull: true },
    twoFactorSecret: { type: DataTypes.STRING },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    verificationCode: { type: DataTypes.STRING }
})

sequelize.sync({ alter: true })
    .then(() => console.log("😎 User table created in PostgreSQL"))
    .catch(err => console.error("😒Error creating table: ", err))



export default User