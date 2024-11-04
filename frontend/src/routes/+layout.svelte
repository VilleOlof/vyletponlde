<script lang="ts">
	import "../app.css";
</script>

{@html "<!-- What will today's adventure be? -->"}
{@html "<!-- shoutout to the handsome ottomated (https://porterrobinsle.com/), site very much inspired by them -->"}

<svelte:head>
	<title>Vylet Ponlde</title>
</svelte:head>

<div
	class="w-dvw h-dvh flex flex-col items-center gap-2 md:gap-3 p-8 font-IBMPlexMono leading-[1.2em] tracking-[0.01em]"
>
	<div class="flex gap-4 items-center">
		<a href="https://www.vyletpony.com/">
			<img
				src="/vyletponylogo+purple+fill.png"
				alt=""
				class="w-auto h-16"
			/>
		</a>
		<h1 class="text-3xl md:text-5xl font-bold w-min md:w-fit">
			Vylet Ponlde
		</h1>
	</div>

	<div class="text-center flex flex-col gap-1">
		<p class="text-lg">the daily vylet pony song guessing game</p>
		<span class="text-sm"
			>by <a
				href="https://bsky.app/profile/lifelike.dev"
				target="_blank"
				class="hover:underline">VilleOlof</a
			></span
		>
	</div>

	<span>— †† —</span>

	<slot></slot>

	<img src="/MANESIX+BAR.png" alt="" class="h-8 md:h-12 mt-10 md:mt-16" />
</div>
