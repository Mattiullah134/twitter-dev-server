import { initServer } from "./app/index";
import * as dotenv from "dotenv";
dotenv.config();

async function init() {
    const app = await initServer();
    app.listen(8000, () => {
        console.log(`Server started at the port 8000`);

    })
}

init();