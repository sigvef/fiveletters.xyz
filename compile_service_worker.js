const fs = require("fs");
const child_process = require("child_process");

const sha_hash = child_process.execSync("git rev-parse HEAD").toString().trim();
const filenames = ["/"];

function findFilenames(path) {
  if (fs.lstatSync(path).isDirectory()) {
    for (const child of fs.readdirSync(path)) {
      findFilenames(path + "/" + child);
    }
  } else {
    filenames.push(path.slice(5));
  }
}
findFilenames("dist");

const file = fs.readFileSync("dist/serviceWorker.js");
fs.writeFileSync(
  "dist/serviceWorker.js",
  file
    .toString()
    .replace("SHA_HASH", sha_hash)
    .replace(
      "/* FILES */",
      filenames.map((filename) => `"${filename}"`).join(",\n")
    )
);
