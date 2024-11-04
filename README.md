# vyletponlde

> https://vyletponlde.lifelike.dev

```bash

# Backend API
# Install dependencies
bun install
# Run the server
bun run index.ts

# Starts the server on port 7713

# Frontend
cd frontend
# Install dependencies
npm install
# Build the frontend
npm run build
# Start the frontend
node -r dotenv/config build
```
*Needs **ffmpeg** & **ffprobe** installed and in the users path*

`config/config.json`
```json
{
    "starting_date": "2024-11-01"
}
```

`config/song_metadata.json`
```json
{
    "file_friendly_name": {
        "cover": "cover_name",
        "link": "link",
        "artists": [
            "a1",
            "a2",
            "a3"
        ],
        "acronyms": [
            "a1",
            "a2",
            "a3"
        ],
        "names": [
            "n1",
            "n2",
            "n3"
        ]
    }
}
```
*do note that the database will create itself under `config/history.sqlite`*  

`/covers`  
a folder that contains all cover art for the songs (.webp)  
`{cover_name}.webp`

`/frontend/.env`
```bash
PUBLIC_BACKEND_URL = "https://api-vyletponlde.lifelike.dev"
```

## TODO
- [X] Fix clue disabled input color
- [X] Add help screen
- [X] Add result end screen (score calc, share, etc)
- [X] Add metadata for all songs (lazy data input job)
- [X] Fix song guessing with new metadata
- [X] Fix show correct song with new metadata
- [X] mobile support
- [ ] add more songs
- [ ] play on different browsers and devices
- [ ] install node adapter and try to build the frontend