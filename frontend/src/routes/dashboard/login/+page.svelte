<script>
    import { goto } from "$app/navigation";
    import { PUBLIC_BACKEND_URL } from "$env/static/public";
    import Breadcrumbs from "$lib/Breadcrumbs.svelte";

    let key = "";
    async function login() {
        const res = await fetch(`${PUBLIC_BACKEND_URL}/dashboard?key=${key}`);
        if (!res.ok) {
            alert("login failed");
            return;
        }

        document.cookie = `vyletponlde-key=${key}; path=/dashboard; max-age=31536000`;
        await goto("/dashboard");
    }
</script>

<svelte:head>
    <title>Login | Vylet Ponlde</title>
</svelte:head>

<Breadcrumbs
    routes={[
        ["/", "home"],
        ["/dashboard", "dashboard"],
        ["/dashboard/login", "login"],
    ]}
/>

<input
    bind:value={key}
    type="password"
    placeholder="key"
    class="bg-[#f2f2f2] px-2 text-lg"
/>

<button
    on:click={login}
    class="text-[#8757e0] w-12 z-10 text-end hover:underline">login</button
>
