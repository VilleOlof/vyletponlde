import { $ } from "bun";
import { readdir } from "fs/promises";

export let song_durations: { [key: string]: number } = {};

export async function cache_all_song_durations() {
    const files = await readdir("songs");

    let promises = [];
    for (const file of files) {
        const name = file.replace(".mp3", "");
        promises.push(get_song_duration(file).then(duration => {
            song_durations[name] = duration;
        }));
    }

    await Promise.all(promises);

    // then sort by ASC (so random song seeds are consistent)
    song_durations = Object.fromEntries(Object.entries(song_durations).sort(([, a], [, b]) => a - b));

    console.log("Cached all song durations");
}

/**
 * Gets the duration of a song in seconds.
 * 
 * @param song The song name
 */
export async function get_song_duration(song: string): Promise<number> {
    const duration = await $`ffprobe -i "songs/${song}" -show_entries format=duration -v quiet -of csv="p=0"`.text();
    return parseFloat(duration);
}

/**
 * Gets a clip of a song.
 * 
 * @param song The song name
 * @param start Seconds to start at
 * @param end Seconds to end at
 * @returns The song clip in a Uint8Array (mp3)
 */
export async function get_song_bite(song: string, start: number, end: number): Promise<Uint8Array> {
    return (await $`ffmpeg -nostats -loglevel 0 -i "songs/${song}" -ss ${start} -to ${end} -c copy -f mp3 pipe:1`.quiet()).bytes();
}