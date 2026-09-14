# Bedrock AFK Bot — Railway

Lightweight Minecraft Bedrock protocol client with a GitHub-style status dashboard.

## Configure

Edit `settings.json`:

- `server.host` — server address
- `server.port` — Bedrock server port
- `bot.username` — Xbox/Microsoft gamertag
- `reconnect.enabled` — automatic reconnect
- `reconnect.initialDelayMs` — first reconnect delay
- `reconnect.maxDelayMs` — maximum reconnect delay

Do not put your Microsoft password, tokens, or authentication cache into GitHub.

The `.gitignore` excludes the `.minecraft` authentication cache.

## Deploy

1. Upload this entire folder to a GitHub repository.
2. In Railway, create a project from that GitHub repository.
3. Railway installs dependencies and runs `npm start`.
4. Open the Railway public domain to see the dashboard.

The bot uses normal Microsoft/Xbox authentication. It does not bypass CAPTCHA, server verification, anti-bot systems, or other access controls.

Use only on servers that permit automated clients.


## Coordinates
The dashboard now shows the bot's X/Y/Z position and the block coordinates directly under its feet. Exact block names are not shown because that requires loading and decoding the server's world/chunk data.


## Block name
The dashboard now queries the Bedrock world/chunk mirror and displays the actual block name under the bot's feet. It temporarily shows `Waiting for world data...` until the relevant chunk is available.
