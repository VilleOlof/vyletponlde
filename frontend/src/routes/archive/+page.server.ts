import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { Start } from "$lib";
import { error } from "@sveltejs/kit";

export const ssr = false;

export async function load() {
    try {
        const start_res = await fetch(`${PUBLIC_BACKEND_URL}/start`);
        if (!start_res.ok) {
            throw new Error("Failed to fetch start data");
        }

        const start: Start = await start_res.json();

        return {
            start,
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