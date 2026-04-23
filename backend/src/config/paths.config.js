import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcRoot = path.resolve(__dirname, "..");

export const appPaths = {
  srcRoot,
  views: path.join(srcRoot, "views"),
  public: path.join(srcRoot, "public"),
};
