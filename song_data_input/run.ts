import { readdir } from "node:fs/promises"

export type Song = {
    cover: string,
    link: string,
    artists: string[],
    acronyms: string[],
    names: string[], // the first name is the name to be displayed
};

const all_songs = (await readdir("../songs")).map(file => file.replace(".mp3", ""));
let song_metadata: { [key: string]: Song } = await Bun.file("input.json").json();

while (true) {
    let data: Song = {
        cover: "",
        link: "",
        artists: ["Vylet Pony"],
        acronyms: [],
        names: []
    };
    let song_file_name: string;

    while (true) {
        const link = prompt("Link?:")?.trim();
        if (!link) {
            console.log("Please enter a valid link");
            continue;
        }

        if (link.startsWith("https://tidal.com")) {
            // automatic /u conversion
            data.link = `${link}/u`
        }
        else {
            data.link = link;
        }

        break;
    }

    while (true) {
        const artists = prompt("Artists? (comma seperated):");
        if (!artists) {
            break;
        }

        data.artists = data.artists.concat(artists.split(",").map(artist => artist.trim()));
        break;
    }

    while (true) {
        const file_name = prompt("File name?:")?.trim();
        if (!file_name || !all_songs.includes(file_name)) {
            console.log("Please enter a valid file name");
            continue;
        }

        song_file_name = file_name;
        break;
    }

    while (true) {
        const cover_name = prompt("Cover name?:")?.trim();
        if (!cover_name) {
            console.log("Please enter a valid cover name");
            continue;
        }

        data.cover = cover_name;
        break;
    }

    while (true) {
        const names = prompt("Names? (comma seperated):");
        if (!names) {
            console.log("Please enter a valid name");
            continue;
        }

        data.names = names.split(",").map(name => name.trim());
        break;
    }

    while (true) {
        const acronyms = prompt("Acronyms? (comma seperated):");
        if (!acronyms) {
            break;
        }

        data.acronyms = acronyms.split(",").map(acronym => acronym.trim());
        break;
    }

    song_metadata[song_file_name] = data;
    console.log(`Added song: ${song_file_name}\n`);

    // save the data
    await Bun.write("input.json", JSON.stringify(song_metadata, null, 4));
}