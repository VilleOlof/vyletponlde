import { cache_all_song_durations, get_song_bite } from "./src/ffmpeg"
import { generate_data, get_data, type HistoryData } from "./src/history_tracker";
import { Database } from "bun:sqlite";
import { covers, reload, songs, type Song } from "./src/songs";
import { clue_finished, day_finished, get_clue_stat, get_stat_within_date, get_total_stat, home_view, StatKey } from "./src/stats";

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

const config: {
    starting_date: string
    private_key: string
} = await Bun.file("config/config.json").json();
await reload(); // reload songs, covers etc

let today = new Date();
today.setHours(0, 0, 0, 0);

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

let cache: {
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

const CORS_HEADERS = {
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

        // the first clue is gonna be a 0.5 second clip randomly from the song
        if (url.pathname.startsWith("/clue/1")) {
            const song = url.pathname.split("/").pop();
            if (!song) {
                return new Response("Not found", {
                    status: 404
                });
            }
            if (cache[song + date.getTime()]) {
                return new Response(cache[song + date.getTime()].audio, {
                    headers: {
                        "Content-Type": "audio/mpeg",
                        ...CORS_HEADERS
                    }
                });
            }

            const name = decodeURIComponent(song);
            if (day_data.songs.find(s => s.name === name) === undefined) {
                return new Response("Not found", {
                    status: 404
                });
            }

            const start = day_data.songs.find(s => s.name === name)?.clue_1_start!; // this should always be defined
            const end = start + 0.5;

            const clip = await get_song_bite(`${name}.mp3`, start, end);

            cache[song + 1 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    ...CORS_HEADERS
                }
            });
        }
        // the second clue is gonna be a 1 second clip randomly from the song
        else if (url.pathname.startsWith("/clue/2")) {
            const song = url.pathname.split("/").pop();
            if (!song) {
                return new Response("Not found", {
                    status: 404
                });
            }

            if (cache[song + date.getTime()]) {
                return new Response(cache[song + date.getTime()].audio, {
                    headers: {
                        "Content-Type": "audio/mpeg",
                        ...CORS_HEADERS
                    }
                });
            }

            const name = decodeURIComponent(song);
            if (day_data.songs.find(s => s.name === name) === undefined) {
                return new Response("Not found", {
                    status: 404
                });
            }

            const start = day_data.songs.find(s => s.name === name)?.clue_2_start!; // this should always be defined
            const end = start + 1;

            const clip = await get_song_bite(`${name}.mp3`, start, end);

            cache[song + 2 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    ...CORS_HEADERS
                }
            });
        }
        // the third clue is gonna be a 2.5 second clip from the start of the song
        else if (url.pathname.startsWith("/clue/3")) {
            const song = url.pathname.split("/").pop();
            if (!song) {
                return new Response("Not found", {
                    status: 404
                });
            }

            if (cache[song + date.getTime()]) {
                return new Response(cache[song + date.getTime()].audio, {
                    headers: {
                        "Content-Type": "audio/mpeg",
                        ...CORS_HEADERS
                    }
                });
            }

            const name = decodeURIComponent(song);
            if (day_data.songs.find(s => s.name === name) === undefined) {
                return new Response("Not found", {
                    status: 404
                });
            }

            const start = 0;
            const end = start + 2.5;

            const clip = await get_song_bite(`${name}.mp3`, start, end);

            cache[song + 3 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg",
                    ...CORS_HEADERS
                }
            });
        }

        if (url.pathname === "/stats/home") {
            home_view();
            return new Response(null, {
                headers: {
                    ...CORS_HEADERS
                }
            });
        }
        else if (url.pathname === "/stats/finished") {
            day_finished();
            return new Response(null, {
                headers: {
                    ...CORS_HEADERS
                }
            });
        }
        else if (url.pathname.startsWith("/stats/clue")) {
            let [song, clue] = [url.searchParams.get("song"), url.searchParams.get("clue")];
            if (!song || !clue) {
                return new Response("Not found", {
                    status: 404
                });
            }

            [song, clue] = [decodeURIComponent(song), decodeURIComponent(clue)];

            clue_finished(song, clue);

            return new Response(null, {
                headers: {
                    ...CORS_HEADERS
                }
            });
        }

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

            let [start_str, end_str] = [url.searchParams.get("start"), url.searchParams.get("end")];
            if (!start_str || !end_str) {
                return new Response("Bad request", {
                    status: 400
                });
            }
            const [start, end] = [parseInt(start_str), parseInt(end_str)];

            if (url.pathname === "/dashboard/within") {
                const home_views = get_stat_within_date(StatKey.homepage_view, [start, end]);
                const day_finished = get_stat_within_date(StatKey.day_finished, [start, end]);

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

                const song_clue = get_clue_stat(song, clue, [start, end]);

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

        return new Response("Not found", {
            status: 404
        });
    }
})