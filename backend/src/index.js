import dotenvSafe from "dotenv-safe";
import dbConnection from "./db/index.js";
import { app } from "./app.js";

dotenvSafe.config({ allowEmptyValues: false });

dbConnection()
  .then(() => {
    app.listen(process.env.PORT || 7000, () => {
      console.log(`server is running Port ${process.env.PORT || 7000}`);
    });
  })
  .catch((error) => {
    console.error("Connection DB not working", error);
    process.exit(1);
  });
