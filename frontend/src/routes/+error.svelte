<script lang="ts">
    import { page } from "$app/stores";
</script>

<div>
    <a href="/" class="underline text-[#5e75b0]">home</a>
</div>

<svelte:head>
    <title>whopsi | Vylet Ponlde</title>
</svelte:head>

<p class="text-4xl mt-8">{$page.status}</p>
<p>{$page.error?.message ?? "Internal Server Error"}</p>
