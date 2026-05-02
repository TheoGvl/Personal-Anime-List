# AnimeVault 

> **DEVELOPMENT NOTICE**
> **This project is a living application and is currently under active continuous development. The codebase, features, and UI are constantly evolving. Expect frequent updates, new tools, and structural improvements as the site continues to grow!**

AnimeVault is a modern, feature-rich Single Page Application (SPA) designed for anime enthusiasts to discover, track, and manage their anime journey. Powered by a Python/Flask backend and an interactive JavaScript frontend, it integrates seamlessly with the [Jikan API](https://jikan.moe/) to provide real-time data, deep statistics, and a beautiful user experience.

## Key Features

### Discovery & Search
* **Dynamic Home Dashboard:** Instantly browse Top Airing, Top Rated, and Most Popular anime of all time.
* **Collapsible Seasonal Anime:** Check out what aired last season, what's airing now, and what's coming next. Seasonal lists are hidden in an accordion format and only fetch data when clicked, ensuring lightning-fast performance and preventing API rate-limiting.
* **Advanced Search:** Filter the massive MyAnimeList database by keyword, specific Genres, and Year of release.
* **Pagination:** Seamlessly browse through hundreds of search results with the "Load More" functionality.

### Personal Anime Tracker
* **Detailed List Management:** Organize your anime into Watching, Completed, Plan to Watch, and Dropped categories.
* **Dynamic Profile Stats:** A real-time statistics bar automatically calculates your Total Anime, Episodes Watched vs. Total, and Mean Score based on the specific tab you are currently viewing.
* **Comprehensive Tracking:** Log your watched episodes, personal score, times rewatched, start/finish dates, custom tags, and personal comments.
* **Smart Sorting:** Sort your personal list by Date Added, Personal Score, or alphabetically by Title.
* **Deep Statistics Modal:** Click on any anime to view its global MAL score, rank, popularity, studios, genres, broadcast time, and full synopsis.

### Customization & Settings
* **Theming System:** Personalize your interface with 4 unique color palettes:
  * Cyberpunk (Dark Purple & Pink)
  * Classic MAL (Navy & Light Blue)
  * OLED Dark (True Black & Gold)
  * Forest (Dark Green & Mint)
* **SFW Filter:** Toggle a Safe-For-Work mode to hide 18+/explicit content from your home feed, searches, and seasonal lists.
* **Profile Preferences:** Choose which category tab (e.g., "Watching" or "Completed") opens by default when you view your profile.
* *All preferences are saved locally in your browser so your experience is always exactly how you left it.*

### MAL XML Integration
* **Easy Migration:** Import your official `animelist.xml` export from MyAnimeList directly into AnimeVault. The app intelligently parses your history and integrates it into your local database, fetching missing images and data on-demand.

## Future Development
AnimeVault is constantly improving. Here is a sneak peek at what is planned for future updates:
* **User Accounts & Authentication:** Support for multiple users with private, secure logins and independent lists.
* **Database Migrations:** Seamless backend updates utilizing Alembic/Flask-Migrate so you never have to reset your database when new features drop.
* **Global Stats Dashboard:** Visual charts and graphs breaking down your entire watch history, favorite genres, and total days watched.
* **Smart Recommendations:** Personalized anime suggestions based on your highly-rated shows.

## Tech Stack

* **Frontend:** Vanilla HTML5, CSS3 (Modern Flexbox/Grid, CSS Variables), Vanilla JavaScript (ES6+ with Async/Await, LocalStorage).
* **Backend:** Python 3, Flask, Flask-SQLAlchemy (SQLite database), Flask-CORS, XML ElementTree.
* **External APIs:** Jikan REST API v4.

## How to Run Locally
 **Install Dependencies:**
   Ensure you have Python installed, then run the following in your terminal:
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
