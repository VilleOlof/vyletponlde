import { cache_all_song_durations, get_song_bite, song_durations } from "./src/ffmpeg"
import { readdir } from "node:fs/promises";
import { get_random_songs_from_date, get_random_song_start_from_date } from "./src/random";

const config: {
    starting_date: string
} = await Bun.file("config.json").json();

let today = new Date();
today.setHours(0, 0, 0, 0);

setInterval(async () => {
    let now = new Date();
    now.setHours(0, 0, 0, 0);

    if (now.getTime() !== today.getTime()) {
        today = now;
        console.log(`New day, switching to ${today.toDateString()} & recaching song durations`);
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

async function get_all_songs(): Promise<string[]> {
    return (await readdir("songs"));
}

async function get_duration(song: string): Promise<{ duration: number, name: string } | Response> {
    // decode the encoded song name from the URL
    song = decodeURIComponent(song);

    const duration = song_durations[song];
    if (!duration) {
        return new Response("Not found", {
            status: 404
        });
    }

    return { duration, name: song };
}

// implement a baisc cache that is cleaned upon new day

/**
 * # Routes
 * - `/` - What will today's adventure be?
 * - `/songs` - Get all songs
 * - `/random` - Get 3 random songs for today
 * - `/start` - Get the starting date, today's date, how many days have passed and the server timezone
 * - `/clue/1/:song` - Get a 0.5 second clip from the song
 * - `/clue/2/:song` - Get a 1 second clip from the song
 * - `/clue/3/:song` - Get a 2.5 second clip from the start of the song
 * 
 * All clue routes are also based on todays date.
 * And will always return the same clip for the same song for the same day.
 */
Bun.serve({
    port: 7713,
    async fetch(req) {
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

        switch (url.pathname) {
            case "/": {
                return new Response("What will today's adventure be?");
            }
            case "/songs": {
                let songs = await get_all_songs();
                return new Response(JSON.stringify(songs), {
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
            }
            case "/random": {
                let songs = get_random_songs_from_date(date, 5);
                return new Response(JSON.stringify(songs), {
                    headers: {
                        "Content-Type": "application/json"
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
                        "Content-Type": "application/json"
                    }
                });
            }
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
                        "Content-Type": "audio/mpeg"
                    }
                });
            }

            const data = await get_duration(song);
            if (data instanceof Response) {
                return data;
            }

            const start = get_random_song_start_from_date(date, data.name, data.duration - 0.5, 1);
            const end = start + 0.5;

            const clip = await get_song_bite(`${data.name}.mp3`, start, end);

            cache[song + 1 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg"
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
                        "Content-Type": "audio/mpeg"
                    }
                });
            }

            const data = await get_duration(song);
            if (data instanceof Response) {
                return data;
            }

            const start = get_random_song_start_from_date(date, data.name, data.duration - 0.5, 2);
            const end = start + 1;

            const clip = await get_song_bite(`${data.name}.mp3`, start, end);

            cache[song + 2 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg"
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
                        "Content-Type": "audio/mpeg"
                    }
                });
            }

            const data = await get_duration(song);
            if (data instanceof Response) {
                return data;
            }

            const start = 0;
            const end = start + 2.5;

            const clip = await get_song_bite(`${data.name}.mp3`, start, end);

            cache[song + 3 + date.getTime()] = {
                audio: clip,
                cached_at: Date.now()
            };

            return new Response(clip, {
                headers: {
                    "Content-Type": "audio/mpeg"
                }
            });
        }



        return new Response("Not found", {
            status: 404
        });
    }
})