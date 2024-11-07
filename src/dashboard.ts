import { CORS_HEADERS, config } from "../index";
import { get_total_stat, StatKey, get_stat_within_date, get_clue_stat, get_correct_clue_stat } from "./stats";

/**
 * Routes for dashboard statistics
 * 
 * @param url The URL passed down by the router
 * @returns The response if the route was found
 */
export async function dashboard_routes(url: URL, date: Date): Promise<Response | undefined> {
    if (url.pathname.startsWith("/dashboard")) {
        if (config.private_key !== decodeURIComponent(url.searchParams.get("key") || "")) {
            return new Response("Unauthorized", {
                status: 401
            });
        }

        if (url.pathname === "/dashboard") {
            return new Response(null, {
                status: 200,
                headers: {
                    ...CORS_HEADERS
                }
            });
        }

        if (url.pathname === "/dashboard/total") {
            const total_home_views = get_total_stat(StatKey.homepage_view);
            const total_days_finished = get_total_stat(StatKey.day_finished);

            return new Response(JSON.stringify({
                total_home_views,
                total_days_finished
            }), {
                headers: {
                    "Content-Type": "application/json",
                    ...CORS_HEADERS
                }
            });
        }

        const unix = date.getTime();

        if (url.pathname === "/dashboard/within") {
            const home_views = get_stat_within_date(StatKey.homepage_view, unix);
            const day_finished = get_stat_within_date(StatKey.day_finished, unix);

            return new Response(JSON.stringify({
                home_views,
                day_finished
            }), {
                headers: {
                    "Content-Type": "application/json",
                    ...CORS_HEADERS
                }
            });
        }
        else if (url.pathname === "/dashboard/clue") {
            const [song_raw, clue_raw] = [url.searchParams.get("song"), url.searchParams.get("clue")];
            if (!song_raw || !clue_raw) {
                return new Response("Bad request", {
                    status: 400
                });
            }
            const [song, clue] = [decodeURIComponent(song_raw), decodeURIComponent(clue_raw)];

            let song_clue: number;
            if (url.searchParams.has("correct")) {
                song_clue = get_correct_clue_stat(song, clue, unix);
            }
            else {
                song_clue = get_clue_stat(song, clue, unix);
            }

            return new Response(JSON.stringify({
                song,
                clue,
                count: song_clue
            }), {
                headers: {
                    "Content-Type": "application/json",
                    ...CORS_HEADERS
                }
            });
        }
    }

    return undefined;
}