import { PUBLIC_BACKEND_URL } from '$env/static/public';
import { get_days, type Start } from '$lib';
import { error, redirect } from '@sveltejs/kit';

export async function load({ cookies }) {
    const key = cookies.get('vyletponlde-key');
    if (key === undefined) {
        redirect(302, "/dashboard/login");
    }

    const total_res = await fetch(`${PUBLIC_BACKEND_URL}/dashboard/total?key=${key}`);
    if (!total_res.ok) {
        error(total_res.status, await total_res.text());
    }

    const total: {
        total_home_views: number,
        total_days_finished: number,
    } = await total_res.json();

    const start_res = await fetch(`${PUBLIC_BACKEND_URL}/start`);
    if (!start_res.ok) {
        throw new Error("Failed to fetch start data");
    }

    const start: Start = await start_res.json();

    const days = get_days(start);

    return {
        key,
        total,
        days
    }
}