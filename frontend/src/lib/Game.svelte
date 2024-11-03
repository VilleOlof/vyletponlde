<script lang="ts">
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import type { Start, SongBuffers, GameData } from "$lib";
    import AudioCard from "$lib/AudioCard.svelte";
    import { onMount } from "svelte";
    import { persisted } from "svelte-persisted-store";
    import { writable, type Writable } from "svelte/store";
    import Help from "./Help.svelte";
    import Finishscreen from "./Finishscreen.svelte";

    export let data: {
        start: Start;
        random_songs: string[];
        all_songs: string[];
    };
    export let date: number;
    export let archived: boolean;

    let help_open = false;

    // let history: Writable<History> = persisted("vp-history", {});
    let game_state: Writable<GameData> = persisted("vp-game_state", {});
    let current_song_buffers: SongBuffers = {};

    // if new day, reset current song
    if (date !== data.start.today && !archived) {
        date = data.start.today;

        $game_state[date] = {
            current_song: 0,
            current_clue: 1,
            songs: {},
        };

        for (let i = 0; i < data.random_songs.length; i++) {
            $game_state[date].songs[data.random_songs[i]] = {
                correct: false,
                correct_clue: -1,
            };
            for (let j = 0; j < 4; j++) {
                $game_state[date].songs[data.random_songs[i]][j] = {
                    guess: "",
                    used: false,
                };
            }
        }
    } else if ($game_state[date] === undefined) {
        $game_state[date] = {
            current_song: 0,
            current_clue: 1,
            songs: {},
        };

        for (let i = 0; i < data.random_songs.length; i++) {
            $game_state[date].songs[data.random_songs[i]] = {
                correct: false,
                correct_clue: -1,
            };
            for (let j = 0; j < 4; j++) {
                $game_state[date].songs[data.random_songs[i]][j] = {
                    guess: "",
                    used: false,
                };
            }
        }
    }

    let current_song = writable($game_state[date].current_song);
    let current_clue_index = writable($game_state[date].current_clue);
    current_song.subscribe((value) => {
        $game_state[date].current_song = value;
    });
    current_clue_index.subscribe((value) => {
        $game_state[date].current_clue = value;
    });

    // make sure they are in local storage
    $: $game_state = $game_state;

    function next_song() {
        set_used(data.random_songs[$current_song], 4);

        if ($current_song < data.random_songs.length - 1) {
            $current_song += 1;
            $current_clue_index = 1;
        } else {
            // if all songs finished, show result screen here
            view_state = "finished";
        }
    }

    const set_used = (song: string, clue: number) => {
        $game_state[date].songs[song][clue - 1].used = true;
    };

    function guess(input: string, clue_index: number) {
        if (clue_index !== $current_clue_index) return;

        if (input === data.random_songs[$current_song]) {
            $game_state[date].songs[data.random_songs[$current_song]].correct =
                true;
            $game_state[date].songs[
                data.random_songs[$current_song]
            ].correct_clue = clue_index;

            $current_clue_index = 4;
            set_used(data.random_songs[$current_song], 4);
        } else if ($current_clue_index < 4) {
            $current_clue_index += 1;

            set_used(data.random_songs[$current_song], clue_index);
        }
    }

    function skip(clue_index: number) {
        if (clue_index !== $current_clue_index) return;

        if ($current_clue_index < 4) {
            set_used(data.random_songs[$current_song], clue_index);
            $current_clue_index += 1;
        }
    }

    function round_state_to_symbol(song: string) {
        let a = $game_state[date].songs[song];
        if (!a) return " ";

        if (a.correct) return "x";
        if (a[3].used) return "/";
        if (song === data.random_songs[$current_song]) return "o";
        return " ";
    }

    function is_already_done() {
        if (!$game_state[date]) return false;
        const game = $game_state[date];
        if (game.current_song === 4 && game.current_clue === 4) return true;
        return false;
    }

    let view_state: "loading" | "game" | "error" | "finished" = "loading";
    let songs_loaded = 0;
    onMount(async () => {
        // load all songs and their clues into memory
        // create a promise for every song and clue and put them into an array
        let promises = [];
        let context = new AudioContext();
        for (let song of data.random_songs) {
            for (let clue of [1, 2, 3]) {
                promises.push(
                    fetch(`${PUBLIC_BACKEND_URL}/clue/${clue}/${song}`)
                        .then((res) => res.arrayBuffer())
                        .then((buf) => context.decodeAudioData(buf))
                        .then((audio_buf) => {
                            current_song_buffers[song] =
                                current_song_buffers[song] || {};
                            current_song_buffers[song][clue] = audio_buf;
                            songs_loaded++;
                        })
                        .catch((e) => {
                            view_state = "error";
                            console.error(`Failed to load audio buffer: ${e}`);
                        }),
                );
            }
        }

        // wait for all promises to resolve
        await Promise.all(promises);

        if (is_already_done()) view_state = "finished";
        else view_state = "game";
    });

    function days_between(date1: number, date2: number) {
        const one_day = 1000 * 60 * 60 * 24;
        const date1_ms = new Date(date1).getTime();
        const date2_ms = new Date(date2).getTime();
        const difference_ms = date2_ms - date1_ms;
        return Math.round(difference_ms / one_day);
    }
</script>

<div class="flex justify-evenly w-1/5">
    <a class="w-1/3 text-center hover:underline" href="/archive">archive</a>
    <p class="w-1/3 text-center">day #{days_between(data.start.start, date)}</p>
    <button
        on:click={() => (help_open = !help_open)}
        class="w-1/3 text-center hover:underline">help</button
    >
</div>

<!-- lil bit messy -->
{#if view_state === "game"}
    <div class="font-bold flex gap-1">
        {#if $game_state[date]}
            {#key $current_clue_index}
                {#each data.random_songs as song}
                    <span>[{round_state_to_symbol(song)}]</span>
                {/each}
            {/key}
        {:else}
            <p>[ ]</p>
            <p>[ ]</p>
            <p>[ ]</p>
            <p>[ ]</p>
            <p>[ ]</p>
        {/if}
    </div>

    <p>song {$current_song + 1}/{data.random_songs.length}</p>

    <AudioCard
        song={data.random_songs[$current_song]}
        clue={1}
        current_clue={$current_clue_index}
        audio_buf={current_song_buffers[data.random_songs[$current_song]][1]}
        on_guess={guess}
        on_skip={skip}
        bind:guess_input={$game_state[date].songs[
            data.random_songs[$current_song]
        ][0].guess}
        correct_clue={$game_state[date].songs[data.random_songs[$current_song]]
            .correct_clue}
        used={$game_state[date].songs[data.random_songs[$current_song]][0].used}
    />
    <AudioCard
        song={data.random_songs[$current_song]}
        clue={2}
        current_clue={$current_clue_index}
        audio_buf={current_song_buffers[data.random_songs[$current_song]][2]}
        on_guess={guess}
        on_skip={skip}
        bind:guess_input={$game_state[date].songs[
            data.random_songs[$current_song]
        ][1].guess}
        correct_clue={$game_state[date].songs[data.random_songs[$current_song]]
            .correct_clue}
        used={$game_state[date].songs[data.random_songs[$current_song]][1].used}
    />
    <AudioCard
        song={data.random_songs[$current_song]}
        clue={3}
        current_clue={$current_clue_index}
        audio_buf={current_song_buffers[data.random_songs[$current_song]][3]}
        on_guess={guess}
        on_skip={skip}
        bind:guess_input={$game_state[date].songs[
            data.random_songs[$current_song]
        ][2].guess}
        correct_clue={$game_state[date].songs[data.random_songs[$current_song]]
            .correct_clue}
        used={$game_state[date].songs[data.random_songs[$current_song]][2].used}
    />

    <!-- clue index 4 is just game over-->
    {#if $current_clue_index === 4}
        <div class="flex bg-[#f2f2f2] gap-3 p-4 mt-4">
            <div class="w-10 h-10 bg-[#6fa1ff]"></div>
            <div>
                <a href="/" class="w-80 hover:underline"
                    >{data.random_songs[$current_song]}</a
                >
                <p class="text-xs">ft. Vylet Pony</p>
            </div>
            <button
                class="bg-[#dedede] hover:underline px-2"
                on:click={next_song}
            >
                {#if $current_song === data.random_songs.length - 1}
                    finish
                {:else}
                    song {$current_song + 1}
                {/if}
            </button>
        </div>
    {/if}
{:else if view_state === "finished"}
    <Finishscreen
        {date}
        game={$game_state[date]}
        {current_song_buffers}
        day={days_between(data.start.start, date)}
    />
{:else if view_state === "loading"}
    <img src="/Untitled_Artwork+9.gif" alt="" class="w-80" />
    <p>
        loading awesome songs ({songs_loaded} / {data.random_songs.length * 3})
    </p>
{:else if view_state === "error"}
    <p>
        error loading audio<br />
        please refresh the page
    </p>
{/if}

<Help bind:open={help_open} />
