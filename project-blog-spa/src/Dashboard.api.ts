import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
    return {
        success: true,
        labels: ["Jan", "Feb", "Mar", "Apr"],
        data: [45, 82, 120, 95],
        note: "This is a transpiled version of Dashboard.api"
    };
});
