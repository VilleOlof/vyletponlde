import { PUBLIC_BACKEND_URL } from "$env/static/public";
import type { Start } from "$lib";
import { error } from "@sveltejs/kit";

export const ssr = false;

export async function load({ params }) {
    const { date } = params;

    let date_obj = new Date(date);
    date_obj.setHours(0, 0, 0, 0);

    const unix = date_obj.getTime();

    try {
        const start_res = await fetch(`${PUBLIC_BACKEND_URL}/start`);
        if (!start_res.ok) {
            throw new Error("Failed to fetch start data");
        }

        const start: Start = await start_res.json();

        const random_res = await fetch(`${PUBLIC_BACKEND_URL}/random?date=${unix}`);
        if (random_res.status === 400) {
            throw new Error("Invalid date");
        }

        if (!random_res.ok) {
            throw new Error("Failed to fetch random songs");
        }

        const random_songs: string[] = await random_res.json();

        const songs = await fetch(`${PUBLIC_BACKEND_URL}/songs?date=${unix}`);
        if (!songs.ok) {
            throw new Error("Failed to fetch songs");
        }

        const all_songs: string[] = await songs.json();

        return {
            start,
            random_songs,
            all_songs,
            unix,
        };
    }
    catch (e) {
        console.error(e);
        if (e instanceof Error) {
            throw error(500, e.message);
        }
        else {
            throw error(500, "An unknown error occurred");
        }
    }
}