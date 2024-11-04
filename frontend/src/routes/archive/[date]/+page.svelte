<script lang="ts">
    import { format_date, type Start } from "$lib";
    import Game from "$lib/Game.svelte";
    import { writable } from "svelte/store";

    export let data: {
        start: Start;
        random_songs: string[];
        all_songs: string[];
        unix: number;
    };

    const formatted_date = format_date(new Date(data.unix));
</script>

<svelte:head>
    <title>{formatted_date} | Vylet Ponlde</title>
</svelte:head>

<div class="flex items-center justify-center gap-2 flex-wrap">
    <a href="/" class="underline text-[#5e75b0]">home</a>
    <span>{">"}</span>
    <a href="/archive" class="underline text-[#5e75b0]">archive</a>
    <span>{">"}</span>
    <a href="/archive/{formatted_date}" class="underline text-[#5e75b0]"
        >{formatted_date}</a
    >
</div>

<Game {data} date={data.unix} archived={true} />
