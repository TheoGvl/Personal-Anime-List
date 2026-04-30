let currentAnimeData = {};
let mySavedAnime = {};
let currentSearchPage = 1;
let isSearching = false;

// Tracker for which seasonal lists have been fetched
let loadedSeasons = { last: false, this: false, next: false };

// Settings State
let userSettings = {
    theme: 'cyberpunk',
    sfw: 'true',
    defaultTab: 'watching'
};

const themeColors = {
    cyberpunk: { '--bg-dark': '#12091c', '--bg-card': '#201335', '--border-color': '#3b2259', '--accent-color': '#ff4da6' },
    classic: { '--bg-dark': '#0b1622', '--bg-card': '#151f2e', '--border-color': '#2a3b4e', '--accent-color': '#3db4f2' },
    oled: { '--bg-dark': '#000000', '--bg-card': '#111111', '--border-color': '#333333', '--accent-color': '#f5c518' },
    forest: { '--bg-dark': '#0a1710', '--bg-card': '#12261a', '--border-color': '#1e3d2a', '--accent-color': '#4ade80' }
};

window.onload = async () => {
    loadSettings(); 
    await fetchProfileData();
    loadHomeData();           
};

// --- SETTINGS LOGIC ---
function loadSettings() {
    const saved = localStorage.getItem('animeVaultSettings');
    if (saved) {
        userSettings = JSON.parse(saved);
    }
    
    document.getElementById('set-theme').value = userSettings.theme;
    document.getElementById('set-sfw').value = userSettings.sfw;
    document.getElementById('set-tab').value = userSettings.defaultTab;

    applyThemeColors();
}

function applySettings() {
    userSettings.theme = document.getElementById('set-theme').value;
    userSettings.sfw = document.getElementById('set-sfw').value;
    userSettings.defaultTab = document.getElementById('set-tab').value;
    
    localStorage.setItem('animeVaultSettings', JSON.stringify(userSettings));
    applyThemeColors();
    
    if (document.getElementById('home-view').classList.contains('active')) {
        loadHomeData();
    }
    
    // If SFW is toggled, reset the seasonal cache so it re-fetches cleanly next time opened
    loadedSeasons = { last: false, this: false, next: false };
    document.getElementById('results-last-season').innerHTML = '';
    document.getElementById('results-this-season').innerHTML = '';
    document.getElementById('results-next-season').innerHTML = '';
}

function applyThemeColors() {
    const colors = themeColors[userSettings.theme];
    for (let key in colors) {
        document.documentElement.style.setProperty(key, colors[key]);
    }
}

// --- VIEW & TAB NAVIGATION ---
function showView(viewId) {
    document.getElementById('home-view').classList.remove('active');
    document.getElementById('profile-view').classList.remove('active');
    document.getElementById('settings-view').classList.remove('active');
    document.getElementById('seasonal-view').classList.remove('active');
    
    document.getElementById(`${viewId}-view`).classList.add('active');
}

function switchTab(tabId, btnElement) {
    if (!btnElement) btnElement = document.getElementById(`tab-btn-${tabId}`);
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
}

// --- DATA FETCHING ---
async function fetchProfileData() {
    try {
        const res = await fetch('http://127.0.0.1:5000/api/mylist');
        const data = await res.json();
        mySavedAnime = {};
        data.forEach(anime => {
            mySavedAnime[anime.anime_id] = anime;
        });
    } catch (e) {
        console.error("Could not fetch profile data.");
    }
}

async function loadHomeData() {
    try {
        const sfwParam = userSettings.sfw === 'true' ? '&sfw=true' : '';

        const resAiring = await fetch(`https://api.jikan.moe/v4/top/anime?filter=airing&limit=24${sfwParam}`);
        const dataAiring = await resAiring.json();
        renderCards(dataAiring.data, document.getElementById('results-airing'));

        await new Promise(resolve => setTimeout(resolve, 500));

        const resTop = await fetch(`https://api.jikan.moe/v4/top/anime?limit=24${sfwParam}`);
        const dataTop = await resTop.json();
        renderCards(dataTop.data, document.getElementById('results-top'));

        await new Promise(resolve => setTimeout(resolve, 500));

        const resPopular = await fetch(`https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24${sfwParam}`);
        const dataPopular = await resPopular.json();
        renderCards(dataPopular.data, document.getElementById('results-popular'));
        
    } catch (e) {
        console.error("Error loading home categories:", e);
    }
}

// --- SEASONAL COLLAPSIBLE LOGIC ---
async function toggleSeason(seasonType, headerElement) {
    const grid = document.getElementById(`results-${seasonType}-season`);

    if (grid.style.display === 'none' || grid.style.display === '') {
        // Expand
        grid.style.display = 'grid';
        headerElement.innerHTML = headerElement.innerHTML.replace('▶', '▼');

        // Only fetch if we haven't loaded it yet
        if (!loadedSeasons[seasonType]) {
            await fetchSpecificSeason(seasonType, grid);
            loadedSeasons[seasonType] = true;
        }
    } else {
        // Collapse
        grid.style.display = 'none';
        headerElement.innerHTML = headerElement.innerHTML.replace('▼', '▶');
    }
}

async function fetchSpecificSeason(seasonType, container) {
    container.innerHTML = '<p style="grid-column: 1 / -1;">Fetching seasonal anime...</p>';
    const sfwParam = userSettings.sfw === 'true' ? '&sfw=true' : '';
    let url = '';

    try {
        if (seasonType === 'this') {
            url = `https://api.jikan.moe/v4/seasons/now?limit=24${sfwParam}`;
        } else if (seasonType === 'next') {
            url = `https://api.jikan.moe/v4/seasons/upcoming?limit=24${sfwParam}`;
        } else if (seasonType === 'last') {
            const month = new Date().getMonth() + 1;
            let year = new Date().getFullYear();
            let currentSeason = '';
            
            if (month >= 1 && month <= 3) currentSeason = 'winter';
            else if (month >= 4 && month <= 6) currentSeason = 'spring';
            else if (month >= 7 && month <= 9) currentSeason = 'summer';
            else currentSeason = 'fall';

            let prevSeason = '';
            if (currentSeason === 'winter') { prevSeason = 'fall'; year -= 1; }
            else if (currentSeason === 'spring') { prevSeason = 'winter'; }
            else if (currentSeason === 'summer') { prevSeason = 'spring'; }
            else { prevSeason = 'summer'; }

            url = `https://api.jikan.moe/v4/seasons/${year}/${prevSeason}?limit=24${sfwParam}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        renderCards(data.data, container);

    } catch (e) {
        console.error(`Error loading ${seasonType} season:`, e);
        container.innerHTML = '<p style="color:red; grid-column: 1 / -1;">Error loading data.</p>';
    }
}

// --- ADVANCED SEARCH & PAGINATION ---
async function triggerSearch() {
    currentSearchPage = 1;
    document.getElementById('results-search').innerHTML = ''; 
    await executeSearch();
}

async function loadMoreSearch() {
    currentSearchPage++;
    await executeSearch();
}

async function executeSearch() {
    if (isSearching) return;
    isSearching = true;

    const query = document.getElementById('searchInput').value.trim();
    const genre = document.getElementById('genreFilter').value;
    const year = document.getElementById('yearFilter').value;

    let url = `https://api.jikan.moe/v4/anime?page=${currentSearchPage}&limit=24`;
    if (query) url += `&q=${query}`;
    if (genre) url += `&genres=${genre}`;
    if (year) {
        url += `&start_date=${year}-01-01&end_date=${year}-12-31`;
    }
    if (userSettings.sfw === 'true') url += '&sfw=true';

    const resultsDiv = document.getElementById('results-search');
    const searchContainer = document.getElementById('search-results-container');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    
    document.getElementById('search-title').innerText = `🔍 Search Results`;
    searchContainer.style.display = 'block';
    
    if (currentSearchPage === 1) resultsDiv.innerHTML = '<p>Searching...</p>';
    else loadMoreBtn.innerText = 'Loading...';

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (currentSearchPage === 1) resultsDiv.innerHTML = ''; 
        
        if (data.data.length === 0 && currentSearchPage === 1) {
            resultsDiv.innerHTML = '<p>No anime found matching your criteria.</p>';
            loadMoreBtn.style.display = 'none';
        } else {
            renderCards(data.data, resultsDiv, true); 
            
            if (data.pagination && data.pagination.has_next_page) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.innerText = '⬇️ Load More Results';
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }
    } catch (e) {
        if (currentSearchPage === 1) resultsDiv.innerHTML = '<p style="color:red;">Error fetching data.</p>';
        loadMoreBtn.innerText = '⬇️ Load More Results';
    }
    
    isSearching = false;
}

function renderCards(animeArray, container, append = false) {
    if (!append) container.innerHTML = '';
    
    if (!animeArray) return;
    
    animeArray.forEach(anime => {
        currentAnimeData[anime.mal_id] = anime;
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.onclick = () => openModal(anime.mal_id);
        
        const totalEps = anime.episodes ? anime.episodes : '-';
        const globalScore = anime.score ? `⭐ ${anime.score}` : '⭐ N/A';
        
        card.innerHTML = `
            <img src="${anime.images.jpg.large_image_url}" alt="poster">
            <div class="card-content">
                <div class="title">${anime.title}</div>
                <div class="user-rating">${globalScore}</div>
                <div class="ep-count">Episodes: ${totalEps}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- PROFILE LOGIC ---
async function loadProfile(initialLoad = true) {
    await fetchProfileData();
    showView('profile');
    
    if (initialLoad) {
        switchTab(userSettings.defaultTab);
    }
    
    document.getElementById('tab-watching').innerHTML = '';
    document.getElementById('tab-completed').innerHTML = '';
    document.getElementById('tab-plan').innerHTML = '';
    document.getElementById('tab-dropped').innerHTML = '';

    const sortBy = document.getElementById('profileSort').value;
    let animeList = Object.values(mySavedAnime);

    if (sortBy === 'newest') {
        animeList.sort((a, b) => b.id - a.id); 
    } else if (sortBy === 'score') {
        animeList.sort((a, b) => (b.personal_score || 0) - (a.personal_score || 0));
    } else if (sortBy === 'title') {
        animeList.sort((a, b) => a.title.localeCompare(b.title));
    }

    animeList.forEach(anime => {
        if (!currentAnimeData[anime.anime_id]) {
            currentAnimeData[anime.anime_id] = {
                mal_id: anime.anime_id,
                title: anime.title,
                synopsis: anime.synopsis,
                episodes: anime.total_episodes,
                images: { jpg: { large_image_url: anime.image_url } }
            };
        }

        const scoreText = anime.personal_score ? `<div class="user-rating">My Score: ${anime.personal_score}/10</div>` : '';
        const watched = anime.episodes_watched || 0;
        const total = anime.total_episodes ? anime.total_episodes : '-';
        
        const imgDisplay = anime.image_url === "placeholder.png" 
            ? "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
            : anime.image_url;

        const card = document.createElement('div');
        card.className = 'anime-card';
        card.onclick = () => openModal(anime.anime_id);
        card.innerHTML = `
            <img src="${imgDisplay}" alt="poster">
            <div class="card-content">
                <div class="title">${anime.title}</div>
                <div class="ep-count">Ep: ${watched} / ${total}</div>
                ${scoreText}
            </div>
        `;

        if (anime.status === 'Watching') document.getElementById('tab-watching').appendChild(card);
        else if (anime.status === 'Completed') document.getElementById('tab-completed').appendChild(card);
        else if (anime.status === 'Dropped') document.getElementById('tab-dropped').appendChild(card);
        else document.getElementById('tab-plan').appendChild(card);
    });
}

async function importMAL() {
    const fileInput = document.getElementById('malXmlFile');
    if (!fileInput.files.length) return;
    
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    document.getElementById('tab-watching').innerHTML = '<p>Importing XML... This might take a moment.</p>';
    document.getElementById('tab-completed').innerHTML = '';
    document.getElementById('tab-plan').innerHTML = '';
    document.getElementById('tab-dropped').innerHTML = '';

    try {
        const res = await fetch('http://127.0.0.1:5000/api/import_xml', {
            method: 'POST',
            body: formData
        });
        const result = await res.json();
        alert(result.message);
        loadProfile(false); 
    } catch (e) {
        alert('❌ Error importing file. Ensure the Python backend is running.');
        loadProfile(false);
    }
}

const mapNames = arr => arr && arr.length > 0 ? arr.map(a => a.name).join(', ') : 'None found';

async function openModal(mal_id) {
    document.getElementById('animeModal').style.display = 'block';
    let anime = currentAnimeData[mal_id];
    
    document.getElementById('dt-genres').innerText = "Loading...";
    
    if (!anime.genres || anime.images.jpg.large_image_url === "placeholder.png") {
        try {
            const res = await fetch(`https://api.jikan.moe/v4/anime/${mal_id}`);
            const data = await res.json();
            anime = data.data;
            currentAnimeData[mal_id] = anime; 
        } catch (e) {
            console.error("Failed to load deep details");
        }
    }

    document.getElementById('modalTitle').innerText = anime.title;
    document.getElementById('modalImg').src = anime.images.jpg.large_image_url;
    document.getElementById('modalSynopsis').innerText = anime.synopsis || "No synopsis available.";
    
    document.getElementById('dt-type').innerText = anime.type || 'Unknown';
    document.getElementById('dt-episodes').innerText = anime.episodes || 'Unknown';
    document.getElementById('dt-status').innerText = anime.status || 'Unknown';
    document.getElementById('dt-aired').innerText = anime.aired ? anime.aired.string : 'Unknown';
    document.getElementById('dt-premiered').innerText = (anime.season && anime.year) ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}` : 'Unknown';
    document.getElementById('dt-broadcast').innerText = anime.broadcast ? anime.broadcast.string : 'Unknown';
    document.getElementById('dt-producers').innerText = mapNames(anime.producers);
    document.getElementById('dt-licensors').innerText = mapNames(anime.licensors);
    document.getElementById('dt-studios').innerText = mapNames(anime.studios);
    document.getElementById('dt-source').innerText = anime.source || 'Unknown';
    document.getElementById('dt-genres').innerText = mapNames(anime.genres);
    document.getElementById('dt-demographics').innerText = mapNames(anime.demographics);
    document.getElementById('dt-duration').innerText = anime.duration || 'Unknown';
    document.getElementById('dt-rating').innerText = anime.rating || 'Unknown';

    document.getElementById('dt-score').innerText = anime.score ? `${anime.score} (scored by ${anime.scored_by.toLocaleString()} users)` : 'N/A';
    document.getElementById('dt-ranked').innerText = anime.rank ? `#${anime.rank}` : 'N/A';
    document.getElementById('dt-popularity').innerText = anime.popularity ? `#${anime.popularity}` : 'N/A';
    document.getElementById('dt-members').innerText = anime.members ? anime.members.toLocaleString() : 'N/A';
    document.getElementById('dt-favorites').innerText = anime.favorites ? anime.favorites.toLocaleString() : 'N/A';

    const savedData = mySavedAnime[mal_id];
    const totalEps = anime.episodes || (savedData ? savedData.total_episodes : null);
    
    document.getElementById('modalStatus').value = savedData ? savedData.status : 'Plan to Watch';
    document.getElementById('modalPersonalScore').value = (savedData && savedData.personal_score) ? savedData.personal_score : '';
    document.getElementById('modalTimesWatched').value = (savedData && savedData.times_watched) ? savedData.times_watched : 0;
    
    const epInput = document.getElementById('modalEpWatched');
    epInput.value = (savedData && savedData.episodes_watched) ? savedData.episodes_watched : 0;
    epInput.setAttribute('max', totalEps || '');
    document.getElementById('modalEpTotalText').innerText = totalEps ? `/ ${totalEps}` : '/ -';

    document.getElementById('modalStartDate').value = (savedData && savedData.start_date) ? savedData.start_date : '';
    document.getElementById('modalFinishDate').value = (savedData && savedData.finish_date) ? savedData.finish_date : '';
    document.getElementById('modalTags').value = (savedData && savedData.tags) ? savedData.tags : '';
    document.getElementById('modalComments').value = (savedData && savedData.comments) ? savedData.comments : '';

    document.getElementById('modalSaveBtn').onclick = () => saveFromModal(mal_id);
}

document.getElementById('modalEpWatched').addEventListener('input', function() {
    const max = parseInt(this.getAttribute('max'));
    let val = parseInt(this.value) || 0;
    if (max && val >= max) {
        this.value = max;
        document.getElementById('modalStatus').value = 'Completed';
    }
});

document.getElementById('modalPersonalScore').addEventListener('input', function() {
    let val = parseInt(this.value);
    if (val > 10) this.value = 10;
    if (val < 1 && this.value !== "") this.value = 1;
});

document.getElementById('modalStatus').addEventListener('change', function() {
    if (this.value === 'Completed') {
        const max = document.getElementById('modalEpWatched').getAttribute('max');
        if (max) document.getElementById('modalEpWatched').value = max;
    }
});

async function saveFromModal(mal_id) {
    const anime = currentAnimeData[mal_id];
    
    const status = document.getElementById('modalStatus').value;
    const scoreVal = document.getElementById('modalPersonalScore').value;
    const timesWatchedVal = document.getElementById('modalTimesWatched').value;
    const score = scoreVal ? parseInt(scoreVal) : null;
    const epWatched = parseInt(document.getElementById('modalEpWatched').value) || 0;
    const totalEps = anime.episodes || null;

    try {
        const res = await fetch('http://127.0.0.1:5000/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                anime_id: mal_id,
                title: anime.title,
                image_url: anime.images?.jpg?.large_image_url || "placeholder.png",
                status: status,
                synopsis: anime.synopsis || "No synopsis available.",
                personal_score: score,
                episodes_watched: epWatched,
                total_episodes: totalEps,
                start_date: document.getElementById('modalStartDate').value,
                finish_date: document.getElementById('modalFinishDate').value,
                tags: document.getElementById('modalTags').value,
                comments: document.getElementById('modalComments').value,
                times_watched: timesWatchedVal ? parseInt(timesWatchedVal) : 0
            })
        });
        
        if(res.ok) {
            alert('✅ Saved successfully!');
            closeModal();
            mySavedAnime[mal_id] = mySavedAnime[mal_id] || {};
            mySavedAnime[mal_id].status = status;
            mySavedAnime[mal_id].personal_score = score;
            mySavedAnime[mal_id].episodes_watched = epWatched;
            
            if (document.getElementById('profile-view').classList.contains('active')) {
                loadProfile(false); 
            }
        } else {
            alert('❌ Failed to save.');
        }
    } catch (e) {
        alert('❌ Error: Python backend is not running.');
    }
}

function closeModal() {
    document.getElementById('animeModal').style.display = 'none';
}

window.onclick = function(event) {
    if (event.target === document.getElementById('animeModal')) {
        closeModal();
    }
};

document.getElementById("searchInput").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        triggerSearch();
    }
});