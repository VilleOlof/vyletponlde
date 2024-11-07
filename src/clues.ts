import { cache, CORS_HEADERS } from "../index";
import { get_song_bite } from "./ffmpeg";
import type { HistoryData } from "./history_tracker";

/**
 * Routes for getting clue audio
 * 
 * @param url The URL passed down by the router
 * @returns The response if the route was found
 */
export async function clue_routes(url: URL, date: Date, day_data: HistoryData): Promise<Response | undefined> {
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

    return undefined;
}