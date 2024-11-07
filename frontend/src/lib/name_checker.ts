// @ts-expect-error
import levenshtein from "js-levenshtein"

/**
 * Check if the users guess is correct.  
 * Compares the name to the names and acronyms of the song.
 * 
 * @param name The users guess
 * @param names List of correct names
 * @param acronyms List of correct acronyms
 * @returns If the guess is correct
 */
export function check_name(name: string, names: string[], acronyms: string[]): boolean {
    name = name.trim().toLowerCase();

    // return if name matches either any names or acronyms
    return check_arr(name, names) || check_arr(name, acronyms);
}

/**
 * Check if the name is in the array  
 * Accounts for case insensitivity
 * 
 * @param name Users input guess
 * @param arr The array to check against
 * @returns If the name is in the array
 */
export function check_arr(name: string, arr: string[]): boolean {
    name = name.trim().toLowerCase();
    for (const item of arr) {
        if (item.trim().toLowerCase() === name) {
            return true;
        }
    }

    return false;
}

/**
 * Check if the name is close to the song name.  
 * But if its the same, return false.
 * 
 * @param name Users input guess
 * @param song The actual song name
 * @returns If the name is close to the song name
 */
export function check_if_close(name: string, song: string): boolean {
    name = name.trim().toLowerCase();
    song = song.trim().toLowerCase();

    const distance = levenshtein(name, song);

    return distance <= 2 && distance !== 0;
}