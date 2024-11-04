<script lang="ts">
    import type { Song } from "$lib";

    export let data: {
        songs: Song[];
    };
</script>

<svelte:head>
    <title>songs | Vylet Ponlde</title>
</svelte:head>

<div class="flex items-center justify-center gap-2 flex-wrap">
    <a href="/" class="underline text-[#5e75b0]">home</a>
    <span>{">"}</span>
    <a href="/songs" class="underline text-[#5e75b0]">songs</a>
</div>

<p>{data.songs.length} total songs</p>

<div
    class="flex flex-col text-xs sm:text-sm md:text-base gap-1 max-w-96 text-wrap overflow-auto pl-7 py-2 bg-[#f2f2f2]"
>
    {#each data.songs as song}
        <li class="odd:text-black/70">
            <a href={song.link} target="_blank" class="hover:underline"
                >{song.names[0]}</a
            >
        </li>
    {/each}
</div>
