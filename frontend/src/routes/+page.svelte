<script lang="ts">
    import type { Start } from "$lib";
    import Game from "$lib/Game.svelte";

    export let data: {
        start: Start;
        random_songs: string[];
        all_songs: string[];
    };
</script>

<Game {data} date={data.start.today} archived={false} />
