
export default {
  fetch(request) {
    // tHis file only exists to throw a 404, which causes it to fallback to static file via the `"not_found_handling": "single-page-application"` setting.
    // I've done is so I can host a static app in a worker instead of using cloudflare pages.
		return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
