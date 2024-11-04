import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { Song } from "$lib";
import { error } from "@sveltejs/kit";

export async function load() {
    try {
        const songs_res = await fetch(`${PUBLIC_BACKEND_URL}/songs`);
        if (!songs_res.ok) {
            throw new Error("Failed to fetch songs");
        }

        const songs: Song[] = await songs_res.json();

        return {
            songs
        }
    }
    catch (e) {
        if (e instanceof Error) {
            error(500, e.message);
        }

        error(500, "An unknown error occurred");
    }
}