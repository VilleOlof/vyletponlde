// @ts-expect-error
import levenshtein from "js-levenshtein"

export function check_name(name: string, song: string, acronyms: string[]): boolean {
    name = name.trim().toLowerCase();
    for (const acronym of acronyms) {
        if (acronym.trim().toLowerCase() === name) {
            return true;
        }
    }

    if (name === song.trim().toLowerCase()) {
        return true;
    }

    return false;
}

export function check_if_close(name: string, song: string): boolean {
    name = name.trim().toLowerCase();
    song = song.trim().toLowerCase();

    const distance = levenshtein(name, song);

    return distance <= 2;
}