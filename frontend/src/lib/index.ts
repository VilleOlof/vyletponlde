export type Start = {
    start: number;
    today: number;
    days: number;
    tz_utc_offset: number;
};
export type GameData = {
    // Date in unix
    [key: number]: DayData;
}

export type DayData = {
    // data for that day round
    current_song: number;
    current_clue: number;

    songs: {
        // song name
        [key: string]: {
            // clue number 0-3 (3 is finished basically)
            [key: number]: Clue;
            correct: boolean;
            correct_clue: number;
        },
    }
}

export type Clue = {
    guess: string;
    used: boolean;
};

export type SongBuffers = {
    // song name
    [key: string]: {
        // clue number 1-3
        [key: number]: AudioBuffer;
    }
};

export type Song = {
    cover: string,
    link: string,
    artists: string[],
    acronyms: string[],
    names: string[], // the first name is the name to be displayed
};


export function format_date(date: Date): string {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function get_days(start: Start): {
    format: string;
    unix: number;
}[] {
    let days = [];

    for (let i = start.start; i <= start.today; i += 86400000) {
        const date = new Date(i);
        date.setHours(0, 0, 0, 0);

        days.push({
            format: format_date(date),
            unix: date.getTime(),
        });
    }

    days.reverse();

    return days;
}