import { cache_all_song_durations } from "./src/ffmpeg"
import { generate_data, get_data, type HistoryData } from "./src/history_tracker";
import { Database } from "bun:sqlite";
import { metadata_routes, reload, songs, type Song } from "./src/songs";
import { stat_routes } from "./src/stats";
import { dashboard_routes } from "./src/dashboard";
import { clue_routes } from "./src/clues";

/// Database for statistics and history tracking
export const db = new Database("config/history.sqlite", { create: true });

// unix is the unix timestamp, normalized to midnight
// and data is the data for that day
// even tho we could generate this data, if we add more songs those would be different
// so we keep a detailed history of the data for each day
db.query(`
    CREATE TABLE IF NOT EXISTS history (
        unix INTEGER PRIMARY KEY,
        data TEXT NOT NULL
    );
`).run();
db.query(`
    CREATE INDEX IF NOT EXISTS history_unix_index ON history (unix);
`).run();
db.query(`
    CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unix INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL
    );
`).run();

export const config: {
    starting_date: string
    private_key: string
} = await Bun.file("config/config.json").json();
await reload(); // reload songs, covers etc

let today = new Date();
today.setHours(0, 0, 0, 0);

/// Check if the day has changed and recache song durations
/// We also reload the song metadata in case it has changed
setInterval(async () => {
    let now = new Date();
    now.setHours(0, 0, 0, 0);

    if (now.getTime() !== today.getTime()) {
        today = now;
        console.log(`New day, switching to ${today.toDateString()} & recaching song durations`);
        await reload();
        await cache_all_song_durations();
    }

    // clear old cache
    for (let key in cache) {
        if (cache[key].cached_at < (now.getTime() - (1000 * 60 * 60 * 24))) {
            delete cache[key];
        }
    }
}, 1000 * 60); // every minute

export let cache: {
    // key is a combination of song name and unix date
    [key: string]: {
        audio: Uint8Array,
        cached_at: number
    }
} = {};

await cache_all_song_durations();

async function get_all_songs(): Promise<Song[]> {
    return Object.values(songs);
}

export const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type"
} as const;

/**
 * # Routes
 * - `/` - What will today's adventure be?
 * - `/songs` - Get all songs
 * - `/random` - Get 3 random songs for today
 * - `/start` - Get the starting date, today's date, how many days have passed and the server timezone
 * - `/song/:song` - Get the song metadata
 * - `/cover/:cover` - Get the cover art for the song in plain text (base64)
 * - `/clue/1/:song` - Get a 0.5 second clip from the song
 * - `/clue/2/:song` - Get a 1 second clip from the song
 * - `/clue/3/:song` - Get a 2.5 second clip from the start of the song
 * - `/stats/home` - Increment the home view count
 * - `/stats/finished` - Increment the day finished count
 * - `/stats/clue?song=:song&clue=:clue` - Increment the clue count
 * - `/dashboard/total?key=:key` - Get the total home views and days finished
 * - `/dashboard/within?key=:key&start=:start&end=:end` - Get the home views and days finished within a date range
 * - `/dashboard/clue?key=:key&song=:song&clue=:clue&start=:start&end=:end` - Get the count for a specific clue within a date range
 * 
 * All clue routes are also based on todays date.
 * And will always return the same clip for the same song for the same day.
 */
Bun.serve({
    port: 7713,
    async fetch(req) {
        if (req.method === "OPTIONS") {
            return new Response(null, {
                headers: { ...CORS_HEADERS }
            });
        }

        const url = new URL(req.url);

        let date = new Date(today.getTime());
        if (url.searchParams.has("date")) {
            const unix = parseInt(url.searchParams.get("date")!);
            if (isNaN(unix)) {
                return new Response("Invalid date", {
                    status: 400
                });
            }

            date = new Date(unix);
            date.setHours(0, 0, 0, 0);

            if (date.getTime() > today.getTime()) {
                return new Response("Invalid date", {
                    status: 400
                });
            }

            const start_time = new Date(config.starting_date).getTime();
            if (date.getTime() < (start_time - (1000 * 60 * 60 * 24))) {
                return new Response("Invalid date", {
                    status: 400
                });
            }
        }

        // if this day doesnt have any generated data, generate it
        // doesnt take that long and should only happen once for each day
        let day_data: HistoryData | undefined = get_data(date.getTime());
        if (day_data === undefined) {
            day_data = generate_data(date.getTime());
        }

        switch (url.pathname) {
            case "/": {
                return new Response("What will today's adventure be?");
            }
            case "/songs": {
                let songs = await get_all_songs();
                return new Response(JSON.stringify(songs), {
                    headers: {
                        "Content-Type": "application/json",
                        ...CORS_HEADERS
                    }
                });
            }
            case "/random": {
                let songs = day_data.songs.map(song => song.name);
                return new Response(JSON.stringify(songs), {
                    headers: {
                        "Content-Type": "application/json",
                        ...CORS_HEADERS
                    }
                });
            }
            case "/start": {
                const start = new Date(config.starting_date);
                return new Response(JSON.stringify({
                    start: start.getTime(),
                    today: today.getTime(),
                    days: Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    // server timezone should be how many minutes after UTC
                    tz_utc_offset: new Date().getTimezoneOffset() * -1
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        ...CORS_HEADERS
                    }
                });
            }
        }

        const metadata_res = await metadata_routes(url, day_data);
        if (metadata_res !== undefined) return metadata_res;

        const clue_res = await clue_routes(url, date, day_data);
        if (clue_res !== undefined) return clue_res;

        const stat_res = await stat_routes(url);
        if (stat_res !== undefined) return stat_res;

        const dashboard_res = await dashboard_routes(url);
        if (dashboard_res !== undefined) return dashboard_res;

        return new Response("Not found", {
            status: 404
        });
    }
})