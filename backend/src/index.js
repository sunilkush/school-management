import dotenv from "dotenv"
import dbConnection from "./db/index.js"
import {app} from "./app.js"

dotenv.config()

dbConnection()
.then(()=>{
        app.listen(process.env.PORT|| 7000,()=>{
            console.log(`server is ruing Port ${process.env.PORT}`)
        })
    }
).catch(
    (error)=>{
        console.log(`Connection DB not working`,error)
    }
)
