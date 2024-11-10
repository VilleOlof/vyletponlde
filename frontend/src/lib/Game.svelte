<script lang="ts">
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import type { Start, SongBuffers, GameData, Song } from "$lib";
    import AudioCard from "$lib/AudioCard.svelte";
    import { onDestroy, onMount } from "svelte";
    import { persisted } from "svelte-persisted-store";
    import { writable, type Writable } from "svelte/store";
    import Help from "./Help.svelte";
    import Finishscreen from "./Finishscreen.svelte";
    import { check_if_close, check_name } from "./name_checker";

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
    let volume = persisted("vp-volume", 40);

    let current_song_buffers: SongBuffers = {};
    let current_song_metadata: {
        [key: number]: {
            song: Song;
            cover: Blob;
        };
    };

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
            finished_stat();
        }
    }

    const set_used = (song: string, clue: number) => {
        $game_state[date].songs[song][clue - 1].used = true;
    };

    async function finished_stat() {
        const res = await fetch(
            `${PUBLIC_BACKEND_URL}/stats/finished?date=${date}`,
        );
        if (!res.ok) console.error("Failed to increment finished stat");
    }

    async function clue_stat(
        song: string,
        clue: string | number,
        correct = false,
    ) {
        const res = await fetch(
            `${PUBLIC_BACKEND_URL}/stats/clue?date=${date}&song=${song}&clue=${clue}${correct ? "&correct=true" : ""}`,
        );
        if (!res.ok) console.error("Failed to increment clue stat");
    }

    let typo_hints: boolean[] = [false, false, false];
    function guess(input: string, clue_index: number) {
        if (clue_index !== $current_clue_index) return;

        const song_idx = data.random_songs.indexOf(
            data.random_songs[$current_song],
        );
        const song_data = current_song_metadata[song_idx].song;

        // check if correct
        if (check_name(input, song_data.names, song_data.acronyms)) {
            $game_state[date].songs[data.random_songs[$current_song]].correct =
                true;
            $game_state[date].songs[
                data.random_songs[$current_song]
            ].correct_clue = clue_index;

            $current_clue_index = 4;
            set_used(data.random_songs[$current_song], 4);

            clue_stat(data.random_songs[$current_song], clue_index, true);

            return;
        } else if ($current_clue_index < 4) {
            // typo hints
            for (const name of song_data.names) {
                const close = check_if_close(input, name);
                if (close) {
                    typo_hints[clue_index - 1] = true;

                    setTimeout(() => {
                        typo_hints[clue_index - 1] = false;
                    }, 4000);

                    return; // if it looked like a typo, dont submit
                }
            }

            $current_clue_index += 1;

            set_used(data.random_songs[$current_song], clue_index);
        }

        clue_stat(data.random_songs[$current_song], clue_index);
    }

    function skip(clue_index: number) {
        if (clue_index !== $current_clue_index) return;

        if ($current_clue_index < 4) {
            set_used(data.random_songs[$current_song], clue_index);
            $current_clue_index += 1;
        }

        clue_stat(data.random_songs[$current_song], clue_index);
    }

    function round_state_to_symbol(song: string) {
        let a = $game_state[date].songs[song];
        if (!a) return " ";

        if (a.correct) return "x";
        if (a[3]?.used) return "/";
        if (song === data.random_songs[$current_song]) return "o";
        return " ";
    }

    function is_already_done() {
        if (!$game_state[date]) return false;
        const game = $game_state[date];
        if (game.current_song === 4 && game.current_clue === 4) return true;
        return false;
    }

    function key_press_handler(event: KeyboardEvent) {
        if (event.key === " ") {
            if ($current_clue_index === 4) next_song();
        }
    }

    let view_state: "loading" | "game" | "error" | "finished" = "loading";
    let stuff_loaded = 0;
    const STUFF_TO_LOAD =
        data.random_songs.length * 2 * 2 + data.random_songs.length;
    onMount(async () => {
        document.addEventListener("keypress", key_press_handler);

        // load all songs and their clues into memory
        // create a promise for every song and clue and put them into an array
        let promises = [];
        let context = new AudioContext();
        for (let song of data.random_songs) {
            for (let clue of [1, 2, 3]) {
                promises.push(
                    fetch(
                        `${PUBLIC_BACKEND_URL}/clue/${clue}/${song}?date=${date}`,
                    )
                        .then((res) => res.arrayBuffer())
                        .then((buf) => context.decodeAudioData(buf))
                        .then((audio_buf) => {
                            current_song_buffers[song] =
                                current_song_buffers[song] || {};
                            current_song_buffers[song][clue] = audio_buf;
                            stuff_loaded++;
                        })
                        .catch((e) => {
                            view_state = "error";
                            console.error(`Failed to load audio buffer: ${e}`);
                        }),
                );
            }
        }

        current_song_metadata = {};
        let promises_metadata = [];

        for (let song of data.random_songs) {
            promises_metadata.push(
                fetch(`${PUBLIC_BACKEND_URL}/song/${song}?date=${date}`)
                    .then((res) => res.json())
                    .then((metadata) => {
                        const idx = data.random_songs.indexOf(song);
                        current_song_metadata[idx] =
                            current_song_metadata[idx] || {};

                        current_song_metadata[idx].song = metadata;
                        stuff_loaded++;
                    })
                    .catch((e) => {
                        console.error(`Failed to load metadata: ${e}`);
                    }),
            );
        }

        // these both can be done in parallel
        await Promise.all(promises.concat(promises_metadata));

        let cover_promises = [];
        for (let [_, data] of Object.entries(current_song_metadata)) {
            cover_promises.push(
                fetch(`${PUBLIC_BACKEND_URL}/cover/${data.song.cover}`)
                    .then((res) => res.blob())
                    .then((blob) => {
                        data.cover = blob;
                        stuff_loaded++;
                    })
                    .catch((e) => {
                        console.error(`Failed to load cover: ${e}`);
                    }),
            );
        }

        await Promise.all(cover_promises);

        if (view_state === "error") return;
        if (is_already_done()) view_state = "finished";
        else view_state = "game";
    });

    onDestroy(() => {
        document.removeEventListener("keypress", key_press_handler);
    });

    function days_between(date1: number, date2: number) {
        const one_day = 1000 * 60 * 60 * 24;
        const date1_ms = new Date(date1).getTime();
        const date2_ms = new Date(date2).getTime();
        const difference_ms = date2_ms - date1_ms;
        return Math.round(difference_ms / one_day);
    }
</script>

<div class="flex justify-evenly w-4/5 lg:w-1/5">
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

    {#each [0, 1, 2] as clue}
        <AudioCard
            song={data.random_songs[$current_song]}
            clue={clue + 1}
            current_clue={$current_clue_index}
            audio_buf={current_song_buffers[data.random_songs[$current_song]][
                clue + 1
            ]}
            on_guess={guess}
            on_skip={skip}
            bind:guess_input={$game_state[date].songs[
                data.random_songs[$current_song]
            ][clue].guess}
            correct_clue={$game_state[date].songs[
                data.random_songs[$current_song]
            ].correct_clue}
            used={$game_state[date].songs[data.random_songs[$current_song]][
                clue
            ].used}
            typo_hint={typo_hints[clue]}
            bind:volume={$volume}
        />
    {/each}

    <!-- clue index 4 is just game over-->
    {#if $current_clue_index === 4 && current_song_metadata[$current_song] !== undefined}
        {@const metadata = current_song_metadata[$current_song]}
        {@const img_url = URL.createObjectURL(metadata.cover)}

        <div class="flex bg-[#f2f2f2] gap-3 p-4 mt-4">
            <!-- <div class="w-10 h-10 bg-[#6fa1ff]"></div> -->
            <img src={img_url} alt="cover" class="w-10 h-10 bg-[#6fa1ff]" />
            <div
                class="max-w-52 sm:max-w-80 flex flex-col gap-0.5 overflow-hidden text-ellipsis"
            >
                <a
                    href={metadata.song.link}
                    target="_blank"
                    class="hover:underline text-nowrap text-ellipsis overflow-hidden"
                    >{metadata.song.names[0]}</a
                >
                <p class="text-xs text-wrap max-w-52">
                    ft.{#each metadata.song.artists as artist}
                        {artist}
                        {#if artist !== metadata.song.artists[metadata.song.artists.length - 1]}
                            ,
                        {/if}
                    {/each}
                </p>
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
        game={$game_state[date]}
        {current_song_buffers}
        {current_song_metadata}
        bind:volume={$volume}
        day={days_between(data.start.start, date)}
    />
{:else if view_state === "loading"}
    <img src="/Untitled_Artwork+9.gif" alt="" class="w-80" />
    <p class="text-center">
        loading awesome stuff, just for you ({stuff_loaded} / {STUFF_TO_LOAD})
    </p>
{:else if view_state === "error"}
    <p>
        error loading audio<br />
        please refresh the page
    </p>
{/if}

<Help bind:open={help_open} bind:volume={$volume} />

<!--
    @component

    The main component for a game instance.  
    This handles all game logic, state and view states.  

    @param data - start data, which 5 random songs
    @param date - what date to play
    @param archived - if the game is archived
-->
