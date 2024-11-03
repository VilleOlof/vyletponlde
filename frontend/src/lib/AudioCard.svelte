<script lang="ts">
    import { PUBLIC_BACKEND_URL } from "$env/static/public";

    export let song: string;
    export let clue: number;
    export let current_clue: number;
    export let audio_buf: AudioBuffer;
    export let on_guess: (guess: string, clue_index: number) => void;
    export let on_skip: (clue_index: number) => void;
    export let correct_clue: number;
    export let used: boolean;

    let context = new AudioContext();
    let playing_node: AudioBufferSourceNode | null = null;

    let audio_bg: HTMLDivElement;
    let raf: number | null = null;
    let progress = 0;
    let opacity = 0;

    export let guess_input: string;

    async function play() {
        const audio = context.createBufferSource();
        if (!audio_buf) {
            audio_buf = await context.decodeAudioData(
                await (
                    await fetch(`${PUBLIC_BACKEND_URL}/clue/${clue}/${song}`)
                ).arrayBuffer(),
            );
        }
        audio.buffer = audio_buf;
        audio.connect(context.destination);

        if (playing_node) playing_node.stop();
        audio.start();
        playing_node = audio;

        opacity = 1;
        progress = 0;

        if (raf) cancelAnimationFrame(raf);
        const duration = audio_buf.duration * 1000;
        const start_time = performance.now();
        const tick = (time: number) => {
            const elapsed = time - start_time;
            if (elapsed > duration) {
                progress = 1;
                opacity = 1 - (elapsed - duration) / 300;
                if (opacity <= 0) {
                    opacity = 0;
                    return;
                }
                raf = requestAnimationFrame(tick);
                return;
            }
            progress = elapsed / duration;
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
    }

    const clue_to_text: { [key: number]: string } = {
        1: "0.5 seconds",
        2: "1 second",
        3: "start of song",
    } as const;

    $: is_disabled = current_clue === 4 || current_clue > clue;
    function get_input_color() {
        if (correct_clue === clue)
            return "disabled:bg-[#97deb6]"; // green
        else if (used) return "disabled:bg-[#f03d33]/70"; // red

        if (current_clue === 4 && correct_clue < clue)
            return "disabled:bg-[#dedede]"; // gray
    }
</script>

<div
    class="bg-[#f2f2f2] p-1 flex flex-col gap-2 relative"
    style={current_clue < clue ? "opacity: 50%;" : ""}
>
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div
            bind:this={audio_bg}
            class="pointer-events-none left-0 top-0 z-0 w-full h-full origin-left bg-[#8bc9ff]/20"
            style:transform="scaleX({progress})"
            style:opacity
        ></div>
    </div>

    <div class="flex px-4 pt-3 gap-4">
        <button
            on:click={play}
            class="text-[#4f87cf] z-10 text-xl font-bold hover:underline underline-offset-2"
        >
            play
        </button>
        {#key correct_clue}
            {#key used}
                <input
                    bind:value={guess_input}
                    class="outline-none px-2 z-10 {get_input_color()}"
                    type="text"
                    disabled={is_disabled}
                    placeholder={is_disabled ? "" : "guess a song"}
                    on:keypress={(e) => {
                        if (e.key === "Enter") {
                            if (guess_input) on_guess(guess_input, clue);
                        }
                    }}
                />
            {/key}
        {/key}
        <button
            on:click={() => {
                if (guess_input) {
                    on_guess(guess_input, clue);
                } else {
                    on_skip(clue);
                }
            }}
            class="text-[#8757e0] w-12 z-10 text-end hover:underline"
            >{guess_input ? "guess" : "skip"}</button
        >
    </div>

    <p class="text-end z-10 opacity-80 pr-3">{clue_to_text[clue]}</p>

    <div
        class="absolute top-0 z-20 left-0 w-full h-full"
        style={current_clue < clue ? "display: flex" : "display: none"}
    ></div>
</div>
