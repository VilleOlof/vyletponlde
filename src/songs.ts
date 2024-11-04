export type Song = {
    cover: string,
    link: string,
    artists: string[],
    acronyms: string[],
    names: string[], // the first name is the name to be displayed
};

export let songs: { [key: string]: Song } = {};
export let covers: { [key: string]: Blob } = {};
export let song_names = Object.keys(songs);

export async function reload() {
    songs = await Bun.file("config/song_metadata.json").json();
    song_names = Object.keys(songs);

    if (song_names.length === 0 || song_names.length < 5) {
        throw new Error("There are not enough songs in the song_metadata.json file");
    }

    await load_covers_into_memory();
}

async function load_covers_into_memory() {
    for (const song of song_names) {
        const cover = songs[song].cover;
        const img = await Bun.file(`covers/${cover}.webp`).arrayBuffer();
        const blob = new Blob([img], { type: "image/webp" });

        covers[cover] = blob;
    }
}