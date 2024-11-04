// @ts-expect-error
import levenshtein from "js-levenshtein"

export function check_name(name: string, names: string[], acronyms: string[]): boolean {
    name = name.trim().toLowerCase();

    // return if name matches either any names or acronyms
    return check_arr(name, names) || check_arr(name, acronyms);
}

export function check_arr(name: string, arr: string[]): boolean {
    name = name.trim().toLowerCase();
    for (const item of arr) {
        if (item.trim().toLowerCase() === name) {
            return true;
        }
    }

    return false;
}

export function check_if_close(name: string, song: string): boolean {
    name = name.trim().toLowerCase();
    song = song.trim().toLowerCase();

    const distance = levenshtein(name, song);

    return distance <= 2 && distance !== 0;
}