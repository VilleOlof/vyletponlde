<script lang="ts">
    import { format_date, type Start } from "$lib";
    import Breadcrumbs from "$lib/Breadcrumbs.svelte";
    import Game from "$lib/Game.svelte";

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

<Breadcrumbs
    routes={[
        ["/", "home"],
        ["/archive", "archive"],
        [`/archive/${formatted_date}`, formatted_date],
    ]}
/>

<Game {data} date={data.unix} archived={true} />
