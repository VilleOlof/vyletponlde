import { CORS_HEADERS } from "..";
import type { HistoryData } from "./history_tracker";

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

/**
 * Reloads the song metadata & covers
 */
export async function reload() {
    songs = await Bun.file("config/song_metadata.json").json();
    song_names = Object.keys(songs);

    if (song_names.length === 0 || song_names.length < 5) {
        throw new Error("There are not enough songs in the song_metadata.json file");
    }

    await load_covers_into_memory();
}

/**
 * Loads all cover images into memory
 */
async function load_covers_into_memory() {
    for (const song of song_names) {
        const cover = songs[song].cover;
        const img = await Bun.file(`covers/${cover}.webp`).arrayBuffer();
        const blob = new Blob([img], { type: "image/webp" });

        covers[cover] = blob;
    }
}

/**
 * Routes for getting song metadata
 * 
 * @param url The URL passed down by the router
 * @returns The response if the route was found
 */
export async function metadata_routes(url: URL, day_data: HistoryData): Promise<Response | undefined> {
    if (url.pathname.startsWith("/song/")) {
        const song = url.pathname.split("/").pop();
        if (!song) {
            return new Response("Not found", {
                status: 404
            });
        }

        const name = decodeURIComponent(song);
        if (day_data.songs.find(s => s.name === name) === undefined) {
            return new Response("Not found", {
                status: 404
            });
        }

        const song_data = songs[name];
        if (!song_data) {
            return new Response("Not found", {
                status: 404
            });
        }

        return new Response(JSON.stringify(song_data), {
            headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS
            }
        });
    }
    if (url.pathname.startsWith("/cover/")) {
        const cover_name = url.pathname.split("/").pop();
        if (!cover_name) {
            return new Response("Not found", {
                status: 404
            });
        }

        const name = decodeURIComponent(cover_name);
        const cover = covers[name];
        if (!cover) {
            return new Response("Not found", {
                status: 404
            });
        }

        return new Response(cover, {
            headers: {
                "Content-Type": "image/webp",
                ...CORS_HEADERS
            }
        });
    }

    return undefined;
}