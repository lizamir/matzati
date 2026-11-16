# מצאתי! · Matzati

Smart lost-and-found desk for schools, kindergartens and community centers. Final project for Focus AI BotCamp (n8n agents and automation), by Liz Hajage.

- `index.html` – landing page with a live demo wired to n8n webhooks (report form, live board, chat with the orchestrator agent, staff mode)
- `game.html` – a small game where you play the matching agent
- `video/matzati-demo.mp4` – narrated walkthrough
- `assets/js` – one module per feature (`api`, `demo`, `board`, `chat`, `game`, `items`, `a11y`)

The site is static (no build step, no keys in the browser). All logic runs in five n8n workflows: intake and matching, the conversational orchestrator with four sub-agents, board/staff/daily digest, error monitoring, and an MCP server.

Run locally: `python3 -m http.server 4173` and open http://localhost:4173

All items, the institution and its policies are labeled demo data.
