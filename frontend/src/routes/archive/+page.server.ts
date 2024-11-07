import { PUBLIC_BACKEND_URL } from "$env/static/public";
import { format_date, get_days, type Start } from "$lib";
import { error } from "@sveltejs/kit";

export const ssr = false;

// this is a server route, so its timezone is UTC+1 **always**
export async function load() {
    try {
        const start_res = await fetch(`${PUBLIC_BACKEND_URL}/start`);
        if (!start_res.ok) {
            throw new Error("Failed to fetch start data");
        }

        const start: Start = await start_res.json();

        return {
            start,
            days: get_days(start),
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