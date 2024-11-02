import { readdir, rename } from "node:fs/promises";

const files = await readdir("songs");

for (const file of files) {
    let new_file = file.replace("Vylet Pony - ", "");

    // find the last [ and remove evrything after it until the .mp3
    const index = new_file.lastIndexOf("[");
    let newFile = new_file.slice(0, index - 1) + ".mp3";

    await rename(`songs/${file}`, `songs/${newFile}`);
}