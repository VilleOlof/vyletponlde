import { db } from "..";

export const StatKey = {
    homepage_view: 'homepage_view',
    day_finished: 'day_finished',
    // and all sort of song/clue combinations
} as const;
export type StatKey = typeof StatKey[keyof typeof StatKey];

export function home_view() {
    // increment homepage_view
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), StatKey.homepage_view);
}

export function day_finished() {
    // increment day_finished
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), StatKey.day_finished);
}

export function clue_finished(song: string, clue: string) {
    db.query(`
        INSERT INTO statistics (unix, key, value)
        VALUES (?, ?, '1')
        `).run(Date.now(), `song_${song}_clue_${clue}`);
}

export function get_total_stat(key: StatKey): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ?
        `).get(key) as { total: number }).total || 0;
}

export function get_stat_within_date(key: StatKey, [start, end]: [number, number]): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix >= ? AND unix <= ?
        `).get(key, start, end) as { total: number }).total || 0;
}

export function get_clue_stat(song: string, clue: string, [start, end]: [number, number]): number {
    return (db.query(`
        SELECT SUM(value) as total
        FROM statistics
        WHERE key = ? AND unix >= ? AND unix <= ?
        `).get(`song_${song}_clue_${clue}`, start, end) as { total: number }).total || 0;
}