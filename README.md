# AnimeVault

AnimeVault is a modern, full-stack Single Page Application (SPA) designed to help you track your anime journey. It features a sleek, dark-themed UI with synthwave/cyberpunk accents and integrates directly with the [Jikan API](https://jikan.moe/) to fetch real-time anime data, top charts, and statistics.

> **DEVELOPMENT NOTICE**
> **This project is currently under active development. The codebase, features, and database structures are being updated frequently. Expect frequent commits, architectural changes, and database resets as new features are added.**

## Current Features

* **Dynamic Home Screen:** Browse Top Airing, Top Rated, and Most Popular anime directly from the Jikan API.
* **Live Search:** Search the entire MyAnimeList database instantly.
* **Personal Tracker:** Save anime to your profile and track your episodes, personal scores, and rewatches.
* **MAL XML Import:** Import your official `animelist.xml` from MyAnimeList. The app will automatically read your data and integrate it into the local database.
* **Smart Details Modal:** Click on any anime card to fetch and display deep statistics studios, genres, broadcast time, global score directly from the API.

## Tech Stack

* **Frontend:** Vanilla HTML5, CSS3 (Modern CSS Grid/Flexbox), and JavaScript (ES6+).
* **Backend:** Python 3, Flask, Flask-SQLAlchemy, Flask-CORS.
* **Database:** SQLite.
* **External APIs:** Jikan REST API v4.

## How to Run Locally
 **Install Dependencies:**
   Ensure you have Python installed, then run:
   ```
   pip install flask flask-cors flask-sqlalchemy
   ```
Start the Backend Server:
Navigate to the project folder in your terminal and run:

```
python app.py
```
The server will start locally on http://127.0.0.1:5000

Launch the Interface:
Simply double-click the index.html file to open it in your web browser.

Note: Because this project is evolving rapidly, you may occasionally need to delete the animelist.db file and restart the Python server to apply new database schemas.
