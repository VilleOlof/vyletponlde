<script lang="ts">
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import Breadcrumbs from "$lib/Breadcrumbs.svelte";
    import type { PageData } from "./$types";

    export let data: PageData;

    let selected_day = data.days[0].unix;

    type DayData = {
        home_views: number;
        day_finished: number;
        clues: {
            [song: string]: {
                [clue: string]: number;
            };
        };
    };

    async function get_songs_for_day(unix: number): Promise<string[]> {
        const res = await fetch(`${PUBLIC_BACKEND_URL}/random?date=${unix}`);
        if (!res.ok) {
            throw new Error("failed to fetch songs");
        }

        return await res.json();
    }

    async function get(unix: number): Promise<{
        data: DayData;
        correct: {
            [song: string]: {
                [clue: string]: number;
            };
        };
    }> {
        const data = await get_data_for_day(unix, false);
        const correct = await get_data_for_day(unix, true);

        return {
            data,
            correct: correct.clues,
        };
    }

    async function get_data_for_day(
        unix: number,
        correct: boolean,
    ): Promise<DayData> {
        const songs = await get_songs_for_day(unix);
        let promises = [];
        for (let song of songs) {
            for (let i = 1; i <= 3; i++) {
                promises.push(async () => {
                    const res = await fetch(
                        `${PUBLIC_BACKEND_URL}/dashboard/clue?key=${data.key}&song=${song}&clue=${i}&date=${unix}${correct ? "&correct=true" : ""}`,
                    );
                    if (!res.ok) {
                        throw new Error("failed to fetch clue");
                    }

                    return await res.json();
                });
            }
        }

        const results = await Promise.all(promises.map((p) => p()));

        let songs_data: {
            [song: string]: {
                [clue: string]: number;
            };
        } = {};
        for (let i = 0; i < songs.length; i++) {
            songs_data[songs[i]] = {};
            for (let j = 1; j <= 3; j++) {
                songs_data[songs[i]][j] = results[i * 3 + j - 1].count;
            }
        }

        const res = await fetch(
            `${PUBLIC_BACKEND_URL}/dashboard/within?key=${data.key}&date=${unix}`,
        );
        if (!res.ok) {
            throw new Error("failed to fetch home views");
        }

        const { home_views, day_finished } = await res.json();

        return {
            home_views,
            day_finished,
            clues: songs_data,
        };
    }
</script>

<svelte:head>
    <title>Dashboard | Vylet Ponlde</title>
</svelte:head>

<Breadcrumbs
    routes={[
        ["/", "home"],
        ["/dashboard", "dashboard"],
    ]}
/>

<div class="flex gap-8">
    <div class="flex flex-col items-center">
        <p class="text-6xl">{data.total.total_home_views}</p>
        <p>homepage views</p>
    </div>

    <div class="flex flex-col items-center">
        <p class="text-6xl">{data.total.total_days_finished}</p>
        <p>games completed</p>
    </div>
</div>

<select class="mt-8 px-4 py-1 text-lg" bind:value={selected_day}>
    {#each data.days as day}
        <option value={day.unix}>{day.format}</option>
    {/each}
</select>

{#await get(selected_day)}
    <p>loading...</p>
{:then data}
    <div class="flex flex-col">
        <li>{data.data.home_views} homepage views</li>
        <li>{data.data.day_finished} games completed</li>
    </div>

    <div class="flex flex-col gap-2 mt-4">
        {#each Object.keys(data.data.clues) as song}
            <div
                class="flex flex-col gap-2 bg-[#f2f2f2] px-4 py-1 items-center"
            >
                <p
                    class="font-bold overflow-hidden text-ellipsis text-nowrap max-w-80"
                >
                    {song}
                </p>
                <div class="flex gap-4">
                    <div class="flex gap-2 justify-center">
                        <p>used:</p>
                        {#each Object.keys(data.data.clues[song]) as clue}
                            <p>{data.data.clues[song][clue]}</p>
                        {/each}
                    </div>
                    <div class="flex gap-2 justify-center">
                        <p>correct:</p>
                        {#each Object.keys(data.data.clues[song]) as clue}
                            <p>{data.correct[song][clue]}</p>
                        {/each}
                    </div>
                </div>
            </div>
        {/each}
    </div>
{:catch _}
    <p>failed to load data</p>
{/await}
