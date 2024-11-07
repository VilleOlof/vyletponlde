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
export function day_finished() {
    // increment day_finished
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), StatKey.day_finished);
}

/**
 * Increment the clue count by 1
 * 
 * @param song The song name
 * @param clue The clue number
 */
export function clue_finished(song: string, clue: string) {
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), `song_${song}_clue_${clue}`);
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
 * @param param1 The start and end date
 * @returns The total count
 */
export function get_stat_within_date(key: StatKey, [start, end]: [number, number]): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix >= ? AND unix <= ?
        `).get(key, start, end) as { total: number }).total || 0;
}

/**
 * Get the count of a clue within a date range
 * 
 * @param song The song name
 * @param clue The clue number
 * @param param2 The start and end date
 * @returns The total count
 */
export function get_clue_stat(song: string, clue: string, [start, end]: [number, number]): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix >= ? AND unix <= ?
        `).get(`song_${song}_clue_${clue}`, start, end) as { total: number }).total || 0;
}

/**
 * Routes for incrementing statistics
 * 
 * @param url The URL passed down by the router
 * @returns The response if the route was found
 */
export async function stat_routes(url: URL): Promise<Response | undefined> {
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

    return undefined;
}