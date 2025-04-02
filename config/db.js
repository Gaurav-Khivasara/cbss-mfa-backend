import pkg from 'pg'
const {Pool} = pkg;
import  'dotenv/config'

const pool = new Pool ({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "mfa",
    password: process.env.DB_PASSWORD || "admin",
    port: process.env.DB_PORT || 5432,
})

pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Connection error', err))




export default pool