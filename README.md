# vyletponlde

> https://vyletponlde.lifelike.dev

Vylet Ponlde is a song guessing game for the artist **[Vylet Pony](https://www.vyletpony.com/)**  
Every day you get 5 new random songs, and 3 clues to guess the song.  
And you get a combined score at the end on how well you did.

All the songs, metadata and covers is data-driven,  
so technically this could be easily changed for another artist.  
*(Provided the entire website design is changed)*


## Installation & Usage

### Server

The server is written in Typescript, using [Bun](https://bun.sh).  

```bash
# Server API
# Install dependencies
bun install
# Run the server
bun run index.ts
# Starts the server on port 7713
```

> [!IMPORTANT]  
> *Needs **ffmpeg** & **ffprobe** installed and in the users path*

### Server Configuration

**`config/config.json`**
```json
{
    "starting_date": "2024-11-01",
    "private_key": "**********",
}
```
The `starting_date` is the date the server will start counting from.  
The `private_key` is used for logging into the dashboard.  

**`config/song_metadata.json`**
```json
{
    "song_file_name_without_ext": {
        "cover": "cover_name_without_ext",
        "link": "<url>",
        "artists": [
            "artist_name"
        ],
        "acronyms": [],
        "names": []
    }
}
```

**`/covers`**  
a folder that contains all cover art for the songs (.webp)  
`{cover_name}.webp`

**`/songs`**  
every single song in .mp3 format  
`{song_name}.mp3`

*do note that a sqlite database will create itself under **`config/history.sqlite`***  

### Data explanation

Gonna try to shortly explain how the data is structured.  

When the server picks 5 random songs, it will look at the `song_metadata.json` file.  
Pick 5 random keys from the object, and then use that key to find a song with the same name in the `songs` folder.  
(`songs/{key}.mp3`)  

The `cover` field from the metadata is used to find the cover art in the `covers` folder.  
(`covers/{cover}.webp`)

Thus its important that the key of every metadata object is the same as the song file name.  
And the cover field is the same as the cover file name. (without any extension).  

### Frontend

```bash
# Frontend
cd frontend
## Install dependencies
npm install

# Development
## Start the frontend
npm run dev

# Production
## Build the frontend
npm run build
## Start the frontend
node -r dotenv/config build
```

### Frontend Configuration

**`/frontend/.env`**
```bash
PUBLIC_BACKEND_URL = "http://localhost:7713"
```