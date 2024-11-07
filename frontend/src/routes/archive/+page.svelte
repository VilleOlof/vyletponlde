<script lang="ts">
    import { type GameData, type Start } from "$lib";
    import Breadcrumbs from "$lib/Breadcrumbs.svelte";
    import { persisted } from "svelte-persisted-store";
    import type { Writable } from "svelte/store";

    export let data: {
        start: Start;
        days: {
            format: string;
            unix: number;
        }[];
    };

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
</script>

<svelte:head>
    <title>archive | Vylet Ponlde</title>
</svelte:head>

<Breadcrumbs
    routes={[
        [`/`, `home`],
        [`/archive`, `archive`],
    ]}
/>

<div class="flex flex-col flex-wrap gap-4 mt-4">
    {#each data.days as day, i}
        <a
            data-sveltekit-preload-data="false"
            href={`/archive/${day.format}`}
            class="hover:underline text-[#5e75b0] bg-[#f2f2f2] p-2"
        >
            <span
                >#{data.days.length - i - 1}
                {day.format} [{is_complete(day.unix) ? "x" : " "}]</span
            >
        </a>
    {/each}
</div>
