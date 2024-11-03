<script lang="ts">
    import { format_date, type GameData, type Start } from "$lib";
    import { persisted } from "svelte-persisted-store";
    import type { Writable } from "svelte/store";

    export let data: {
        start: Start;
    };

    // put all days between start.start and start.today into an array
    let days: {
        format: string;
        unix: number;
    }[] = [];
    for (let i = data.start.start; i <= data.start.today; i += 86400000) {
        const date = new Date(i);
        date.setHours(0, 0, 0, 0);
        days.push({
            format: format_date(date),
            unix: date.getTime(),
        });
    }

    let game_state: Writable<GameData> = persisted("vp-game_state", {});
    function is_complete(unix: number): boolean {
        if (!$game_state[unix]) {
            return false;
        }

        for (const song in $game_state[unix].songs) {
            // all songs must be in clue 4
            if (!$game_state[unix].songs[song][3].used) {
                return false;
            }
        }

        return true;
    }

    $: days = days.reverse();
</script>

<h1 class="text-4xl">Archive</h1>
<div>
    <a href="/" class="underline text-[#5e75b0]">home</a>
    <span>{">"}</span>
    <a href="/archive" class="underline text-[#5e75b0]">archive</a>
</div>

<div class="flex flex-col flex-wrap gap-4 mt-4">
    {#each days as day}
        <a
            data-sveltekit-preload-data="false"
            href={`/archive/${day.format}`}
            class="hover:underline text-[#5e75b0] bg-[#f2f2f2] p-2"
        >
            <span>{day.format} [{is_complete(day.unix) ? "x" : " "}]</span>
        </a>
    {/each}
</div>
