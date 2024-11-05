import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { Start } from "$lib";
import { error } from "@sveltejs/kit";

export const ssr = false;

async function home_view() {
    const res = await fetch(`${PUBLIC_BACKEND_URL}/stats/home`);
    if (!res.ok) console.error("Failed to increment homepage view");
}

export async function load() {
    try {
        const start_res = await fetch(`${PUBLIC_BACKEND_URL}/start`);
        if (!start_res.ok) {
            throw new Error("Failed to fetch start data");
        }

        const start: Start = await start_res.json();

        const random_res = await fetch(`${PUBLIC_BACKEND_URL}/random`);
        if (!random_res.ok) {
            throw new Error("Failed to fetch random songs");
        }

        const random_songs: string[] = await random_res.json();

        const songs = await fetch(`${PUBLIC_BACKEND_URL}/songs`);
        if (!songs.ok) {
            throw new Error("Failed to fetch songs");
        }

        const all_songs: string[] = await songs.json();

        home_view();

        return {
            start,
            random_songs,
            all_songs,
        };
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            return error(500, e.message);
        }
        else {
            return error(500, "An unknown error occurred");
        }
    }
}