let currentAnimeData = {};
let mySavedAnime = {};

window.onload = async () => {
    await fetchProfileData();
    loadHomeData();           
};

// --- VIEW & TAB NAVIGATION ---
function showView(viewId) {
    document.getElementById('home-view').classList.remove('active');
    document.getElementById('profile-view').classList.remove('active');
    document.getElementById(`${viewId}-view`).classList.add('active');
}

function switchTab(tabId, btnElement) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    btnElement.classList.add('active');
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
        const resAiring = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=24');
        const dataAiring = await resAiring.json();
        renderCards(dataAiring.data, document.getElementById('results-airing'));

        const resTop = await fetch('https://api.jikan.moe/v4/top/anime?limit=24');
        const dataTop = await resTop.json();
        renderCards(dataTop.data, document.getElementById('results-top'));

        const resPopular = await fetch('https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=24');
        const dataPopular = await resPopular.json();
        renderCards(dataPopular.data, document.getElementById('results-popular'));
    } catch (e) {
        console.error("Error loading home categories.");
    }
}

async function searchAnime() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const resultsDiv = document.getElementById('results-search');
    const searchContainer = document.getElementById('search-results-container');
    
    document.getElementById('search-title').innerText = `🔍 Search Results for "${query}"`;
    searchContainer.style.display = 'block';
    resultsDiv.innerHTML = '<p>Searching...</p>';

    try {
        const response = await fetch(`https://api.jikan.moe/v4/anime?q=${query}&limit=24`);
        const data = await response.json();
        renderCards(data.data, resultsDiv);
    } catch (e) {
        resultsDiv.innerHTML = '<p style="color:red;">Error fetching data.</p>';
    }
}

function renderCards(animeArray, container) {
    container.innerHTML = '';
    animeArray.forEach(anime => {
        currentAnimeData[anime.mal_id] = anime;
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.onclick = () => openModal(anime.mal_id);
        const totalEps = anime.episodes ? anime.episodes : '-';
        card.innerHTML = `
            <img src="${anime.images.jpg.large_image_url}" alt="poster">
            <div class="card-content">
                <div class="title">${anime.title}</div>
                <div class="ep-count">Episodes: ${totalEps}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadProfile() {
    await fetchProfileData();
    showView('profile');
    
    document.getElementById('tab-watching').innerHTML = '';
    document.getElementById('tab-completed').innerHTML = '';
    document.getElementById('tab-plan').innerHTML = '';
    document.getElementById('tab-dropped').innerHTML = '';

    Object.values(mySavedAnime).forEach(anime => {
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

// --- MAL XML IMPORT ---
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
        loadProfile(); 
    } catch (e) {
        alert('❌ Error importing file. Ensure the Python backend is running.');
        loadProfile();
    }
}

const mapNames = arr => arr && arr.length > 0 ? arr.map(a => a.name).join(', ') : 'None found';

// --- MODAL LOGIC ---
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

// --- SAVE ACTION ---
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
            fetchProfileData(); 
            if (document.getElementById('profile-view').classList.contains('active')) {
                loadProfile();
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
        searchAnime();
    }
});