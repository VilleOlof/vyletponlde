<script lang="ts">
    import type { Start } from "$lib";
    import Game from "$lib/Game.svelte";

    export let data: {
        start: Start;
        random_songs: string[];
        all_songs: string[];
    };
</script>

<svelte:head>
    <title>Vylet Ponlde</title>
</svelte:head>

<Game {data} date={data.start.today} archived={false} />
