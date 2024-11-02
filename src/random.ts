import { song_durations } from "./ffmpeg";

// thanks random stackoverflow thread
export function cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export function sfc32(a: number, b: number, c: number, d: number): number {
    a |= 0; b |= 0; c |= 0; d |= 0;
    let t = (a + b | 0) + d | 0;
    d = d + 1 | 0;
    a = b ^ b >>> 9;
    b = c + (c << 3) | 0;
    c = (c << 21 | c >>> 11);
    c = c + t | 0;
    return (t >>> 0) / 4294967296;
}

/**
 * Get 3 random songs from a date.
 * Will always return the same songs for the same date.
 * 
 * @param date The date
 */
export function get_random_songs_from_date(date: Date, num: number): string[] {
    let seed = sfc32(...cyrb128(date.toISOString()));
    let songs = Object.keys(song_durations);
    let random_songs = [];
    for (let i = 0; i < num; i++) {
        let index = Math.floor(seed * songs.length);
        random_songs.push(songs[index]);
        songs.splice(index, 1);
    }
    return random_songs;
}

export function get_random_song_start_from_date(date: Date, song: string, duration: number, index: number): number {
    let seed = sfc32(...cyrb128(date.toISOString() + song + index));
    return Math.floor(seed * duration);
}