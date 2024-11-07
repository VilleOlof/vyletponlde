import { db } from "../index";
import { cyrb128, get_random_song_start_from_unix, sfc32 } from "./random";
import { song_durations } from "./ffmpeg";

export type HistoryData = {
    songs: {
        name: string;
        clue_1_start: number;
        clue_2_start: number;
        // clue 3 is always from 0
    }[]
};

/**
 * Add a history entry
 * 
 * @param id unix timestamp
 * @param data The data for that day (stringified JSON)
 */
export function add_history(id: number, data: string): void {
    db.query(`
        INSERT INTO history (unix, data)
        VALUES (?, ?);
    `).run(id, data);
}

/**
 * Get the data for a specific day
 * 
 * @param unix The unix timestamp
 * @returns The data for that day
 */
export function get_data(unix: number): HistoryData | undefined {
    let data = (db.query(`
        SELECT *
        FROM history
        WHERE unix = ?;
    `).get(unix) as { unix: number, data: string } | undefined)?.data;

    if (!data) {
        return undefined;
    }

    return JSON.parse(data);
}

/**
 * Generate the data for a specific day  
 * Also saves the data to the database
 * 
 * @param unix The unix timestamp
 * @returns The data for that day
 */
export function generate_data(unix: number): HistoryData {
    let seed = sfc32(...cyrb128(unix.toString()));
    let songs = Object.keys(song_durations);
    let data: HistoryData = {
        songs: []
    };
    for (let i = 0; i < 5; i++) {
        let song_idx = Math.floor(seed * songs.length);
        let song = songs[song_idx];
        songs.splice(song_idx, 1);

        let clue_1_start = get_random_song_start_from_unix(unix, song, song_durations[song], 1);
        let clue_2_start = get_random_song_start_from_unix(unix, song, song_durations[song], 2);

        data.songs.push({
            name: song,
            clue_1_start,
            clue_2_start
        });
    }

    // save the data
    db.query(`INSERT INTO history (unix, data) VALUES (?, ?);`).run(unix, JSON.stringify(data));

    return data;
}