<script lang="ts">
    export let open: boolean = true;
</script>

{#if open}
    <div
        class="absolute top-0 left-0 w-dvw h-dvh flex items-center justify-center pointer-events-none z-50"
    >
        <button
            on:click={() => (open = false)}
            class="absolute top-0 left-0 bg-black/50 w-dvw h-dvh pointer-events-auto cursor-default"
        ></button>

        <div
            class="bg-white z-50 p-8 flex flex-col gap-4 w-1/4 pointer-events-auto"
        >
            <div class="w-full flex justify-between items-start">
                <h1 class="font-bold text-5xl">how to play</h1>
                <button
                    on:click={() => (open = false)}
                    class="text-4xl hover:underline">x</button
                >
            </div>
            <li>
                <p>
                    There are 5 songs to guess every day. And you only have 3
                    clues per song. <br />
                    <span class="text-black/80">(Restarts at UTC+1)</span>
                </p>
            </li>

            <li>
                Click the 'play' button to listen to each clue. Then make your
                guess!
            </li>

            <li>
                Your guess is not case-sensitive, and it will warn you if it's
                spelled wrong.
            </li>

            <li>
                You can also use acronyms for song that has names longer than 3
                words.<br />
                <span class="text-black/80"
                    >(Like 'BAYPOM' for 'Brother, Are You Proud of Me?')</span
                >
            </li>

            <li>
                Everything you do is saved locally, so you can come back later!
            </li>

            <div class="flex justify-between items-end">
                <p>goodluck {"<3"}</p>

                <button
                    on:click={() => (open = false)}
                    class="hover:underline text-3xl">play</button
                >
            </div>
        </div>
    </div>
{/if}
