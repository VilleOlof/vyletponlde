<script lang="ts">
    export let routes: [string, string][];
</script>

<div class="flex items-center justify-center gap-2 flex-wrap">
    {#each routes as [href, text], i}
        <a {href} class="underline text-[#5e75b0]">{text}</a>
        {#if i < routes.length - 1}
            <span>{">"}</span>
        {/if}
    {/each}
</div>
