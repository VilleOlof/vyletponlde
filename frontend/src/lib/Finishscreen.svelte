<script lang="ts">
    import type { Clue, DayData, Song, SongBuffers } from "$lib";
    import { enableHacks } from "./hack";

    export let day: number;
    export let game: DayData;
    export let volume: number;
    export let current_song_buffers: SongBuffers = {};
    export let current_song_metadata: {
        [key: number]: {
            song: Song;
            cover: Blob;
        };
    };

    function get_clue_color(clue: number, song: string) {
        if (game.songs[song][clue].used) return "bg-[#f03d33]/70";
        if (game.songs[song].correct_clue === clue + 1) return "bg-[#97deb6]";
        return "bg-[#dedede]";
    }
    function get_clue_hint(clue: Clue, song: string, clue_idx: number) {
        const song_data = game.songs[song];

        if (song_data.correct_clue === clue_idx + 1)
            return `you guessed '${clue.guess}'`;
        if (song_data[clue_idx].used) return "skipped";
        else return "";
    }

    function get_correct_num() {
        let correct = 0;
        for (const song in game.songs) {
            if (game.songs[song].correct) correct++;
        }

        return correct;
    }

    function calculate_score() {
        let score = 0;
        for (const song in game.songs) {
            const song_data = game.songs[song];
            if (!song_data.correct) continue;
            score += 4 - song_data.correct_clue;
        }

        return score;
    }

    let context = new AudioContext();
    enableHacks(context);
    let gain_node = context.createGain();
    $: gain_node.gain.value = volume / 100;
    gain_node.connect(context.destination);

    let playing_node: AudioBufferSourceNode | null = null;
    function play_clue(song: string, clue: number) {
        const audio = context.createBufferSource();
        audio.buffer = current_song_buffers[song][clue];
        audio.connect(gain_node);

        if (playing_node) playing_node.stop();
        audio.start();
        playing_node = audio;
    }

    let show_copied = false;
    function share() {
        function get_clue_color(clue: number, song: string) {
            if (game.songs[song][clue].used) return "🟥";
            if (game.songs[song].correct_clue === clue + 1) return "🟩";
            return "⬛";
        }

        const share_msg = `vylet ponlde #${day} ${calculate_score()}/15

${Object.entries(game.songs)
    .map(
        ([song, data]) =>
            `${get_clue_color(0, song)}${get_clue_color(1, song)}${get_clue_color(
                2,
                song,
            )}`,
    )
    .join("\n")}
<https://vyletponlde.lifelike.dev>`;

        navigator.clipboard.writeText(share_msg);
        show_copied = true;

        setTimeout(() => {
            show_copied = false;
        }, 2000);
    }
</script>

<h1 class="font-bold text-3xl">Your results</h1>

<div class="flex flex-col gap-2">
    {#each Object.entries(game.songs) as [song, data]}
        {@const idx = Object.keys(game.songs).indexOf(song)}
        {@const metadata = current_song_metadata[idx]}
        {@const img_url = URL.createObjectURL(metadata.cover)}

        <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-2">
                <img src={img_url} alt="cover" class="w-8 h-8 bg-[#6fa1ff]" />

                <a
                    href={metadata.song.link}
                    target="_blank"
                    class="hover:underline text-ellipsis max-w-52 md:max-w-80 text-nowrap overflow-hidden"
                    >{metadata.song.names[0]}</a
                >
            </div>

            <div class="flex gap-0.5">
                <button
                    on:click={() => play_clue(song, 1)}
                    title={get_clue_hint(data[0], song, 0)}
                    class="{get_clue_color(0, song)} w-6 h-6"
                ></button>
                <button
                    on:click={() => play_clue(song, 2)}
                    title={get_clue_hint(data[1], song, 1)}
                    class="{get_clue_color(1, song)} w-6 h-6"
                ></button>
                <button
                    on:click={() => play_clue(song, 3)}
                    title={get_clue_hint(data[2], song, 2)}
                    class="{get_clue_color(2, song)} w-6 h-6"
                ></button>
            </div>
        </div>
    {/each}
</div>

<div class="flex gap-16 mt-2">
    <div class="flex flex-col items-center">
        <p class="text-4xl">{get_correct_num()}/5</p>
        <p>correct</p>
    </div>

    <div class="flex flex-col items-center">
        <p class="text-4xl">{calculate_score()}/15</p>
        <p>score</p>
    </div>
</div>

<button
    on:click={share}
    class="text-2xl bg-[#f2f2f2] px-4 py-1 mt-2 hover:underline">share</button
>

{#if show_copied}
    <p class="text-black/80">copied to clipboard</p>
{/if}
