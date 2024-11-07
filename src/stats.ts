import { CORS_HEADERS, db } from "..";

export const StatKey = {
    homepage_view: 'homepage_view',
    day_finished: 'day_finished',
    // and all sort of song/clue combinations
} as const;
export type StatKey = typeof StatKey[keyof typeof StatKey];

/**
 * Increment the homepage view count by 1
 */
export function home_view() {
    // increment homepage_view
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), StatKey.homepage_view);
}

/**
 * Increment the day finished count by 1
 */
export function day_finished(unix: number) {
    // increment day_finished
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(unix, StatKey.day_finished);
}

/**
 * Increment the clue count by 1
 * 
 * @param song The song name
 * @param clue The clue number
 */
export function clue_finished(unix: number, song: string, clue: string) {
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(unix, `song_${song}_clue_${clue}`);
}

/**
 * Increment the correct clue count by 1
 * 
 * @param song The song name
 * @param clue The clue number
 */
export function clue_correct(unix: number, song: string, clue: string) {
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(unix, `song_${song}_clue_${clue}_correct`);
}

/**
 * Get the total count of a statistic
 * 
 * @param key The statistic key
 * @returns The total count
 */
export function get_total_stat(key: StatKey): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ?
        `).get(key) as { total: number }).total || 0;
}

/**
 * Get the total count of a statistic within a date range
 * 
 * @param key The statistic key
 * @param unix The unix timestamp
 * @returns The total count
 */
export function get_stat_within_date(key: StatKey, unix: number): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix = ?
        `).get(key, unix) as { total: number }).total || 0;
}

/**
 * Get the count of a clue within a date range
 * 
 * @param song The song name
 * @param clue The clue number
 * @param unix The unix timestamp
 * @returns The total count
 */
export function get_clue_stat(song: string, clue: string, unix: number): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix = ?
        `).get(`song_${song}_clue_${clue}`, unix) as { total: number }).total || 0;
}

/**
 * Get the count of a correct clue within a date range
 * 
 * @param song The song name
 * @param clue The clue number
 * @param unix The unix timestamp
 * @returns The total count
 */
export function get_correct_clue_stat(song: string, clue: string, unix: number): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix = ?
        `).get(`song_${song}_clue_${clue}_correct`, unix) as { total: number }).total || 0;
}

/**
 * Routes for incrementing statistics
 * 
 * @param url The URL passed down by the router
 * @returns The response if the route was found
 */
export async function stat_routes(url: URL, date: Date): Promise<Response | undefined> {
    const unix = date.getTime();

    if (url.pathname === "/stats/home") {
        home_view();
        return new Response(null, {
            headers: {
                ...CORS_HEADERS
            }
        });
    }
    else if (url.pathname === "/stats/finished") {
        day_finished(unix);
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

        if (url.searchParams.has("correct")) {
            clue_correct(unix, song, clue);
        }

        clue_finished(unix, song, clue);

        return new Response(null, {
            headers: {
                ...CORS_HEADERS
            }
        });
    }

    return undefined;
}