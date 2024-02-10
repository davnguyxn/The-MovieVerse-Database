document.addEventListener("DOMContentLoaded", function() {
    checkAndReloadPageIfNeeded();
    loadWatchLists();
    updateSignInButton();
    initClient();
    updateFavorites();
});

function checkAndReloadPageIfNeeded() {
    const hasReloaded = localStorage.getItem('hasReloaded');

    if (!hasReloaded) {
        localStorage.setItem('hasReloaded', true);
        window.location.reload();
    }
}

function updateFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const favoritesMain = document.getElementById('favorites-main');
    favoritesMain.style.textAlign = 'center';
    if (favorites.length > 0) {
        favorites.forEach(movieId => fetchMovieDetails(movieId));
    }
    else {
        favoritesMain.innerHTML = '<div style="display: flex; justify-content: center; align-items: center; text-align: center; width: 100vw;">\n' +
            '                <h2 style="color: white">No Favorite Movies Added Yet.</h2>\n' +
            '            </div>`;';
    }
}

function rotateUserStats() {
    const stats = [
        {
            label: "Your Current Time",
            getValue: () => {
                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                hours = hours < 10 ? '0' + hours : hours;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                return `${hours}:${minutes}`;
            }
        },
        { label: "Most Visited Movie", getValue: getMostVisitedMovie },
        { label: "Your Most Visited Director", getValue: getMostVisitedDirector },
        { label: "Your Most Visited Actor", getValue: getMostVisitedActor },
        {
            label: "Your Unique Movies Discovered",
            getValue: () => {
                const viewedMovies = JSON.parse(localStorage.getItem('uniqueMoviesViewed')) || [];
                return viewedMovies.length;
            }
        },
        {
            label: "Your Favorited Movies",
            getValue: () => {
                const favoritedMovies = JSON.parse(localStorage.getItem('favorites')) || [];
                return favoritedMovies.length;
            }
        },
        {
            label: "Your Most Common Favorited Genre",
            getValue: getMostCommonGenre
        },
        { label: "Your Created Watchlists", getValue: () => localStorage.getItem('watchlistsCreated') || 0 },
        { label: "Your Average Movie Rating", getValue: () => localStorage.getItem('averageMovieRating') || 'Not Rated' },
        {
            label: "Your Unique Directors Discovered",
            getValue: () => {
                const viewedDirectors = JSON.parse(localStorage.getItem('uniqueDirectorsViewed')) || [];
                return viewedDirectors.length;
            }
        },
        {
            label: "Your Unique Actors Discovered",
            getValue: () => {
                const viewedActors = JSON.parse(localStorage.getItem('uniqueActorsViewed')) || [];
                return viewedActors.length;
            }
        },
        {
            label: "Your Unique Production Companies Discovered",
            getValue: () => {
                const viewedCompanies = JSON.parse(localStorage.getItem('uniqueCompaniesViewed')) || [];
                return viewedCompanies.length;
            }
        },
        { label: "Your Trivia Accuracy", getValue: getTriviaAccuracy },
    ];

    let currentStatIndex = 0;

    function updateStatDisplay() {
        const currentStat = stats[currentStatIndex];
        document.getElementById('stats-label').textContent = currentStat.label + ':';
        document.getElementById('stats-display').textContent = currentStat.getValue();
        currentStatIndex = (currentStatIndex + 1) % stats.length;
    }

    updateStatDisplay();

    const localTimeDiv = document.getElementById('local-time');
    let statRotationInterval = setInterval(updateStatDisplay, 3000);

    localTimeDiv.addEventListener('click', () => {
        clearInterval(statRotationInterval);
        updateStatDisplay();
        statRotationInterval = setInterval(updateStatDisplay, 3000);
    });
}

function updateMovieVisitCount(movieId, movieTitle) {
    let movieVisits = JSON.parse(localStorage.getItem('movieVisits')) || {};
    if (!movieVisits[movieId]) {
        movieVisits[movieId] = { count: 0, title: movieTitle };
    }
    movieVisits[movieId].count += 1;
    localStorage.setItem('movieVisits', JSON.stringify(movieVisits));
}

function getMostVisitedMovie() {
    const movieVisits = JSON.parse(localStorage.getItem('movieVisits')) || {};
    let mostVisitedMovie = '';
    let maxVisits = 0;

    for (const movieId in movieVisits) {
        if (movieVisits[movieId].count > maxVisits) {
            mostVisitedMovie = movieVisits[movieId].title;
            maxVisits = movieVisits[movieId].count;
        }
    }

    return mostVisitedMovie || 'Not Available';
}

function getMostVisitedActor() {
    const actorVisits = JSON.parse(localStorage.getItem('actorVisits')) || {};
    let mostVisitedActor = '';
    let maxVisits = 0;

    for (const actorId in actorVisits) {
        if (actorVisits[actorId].count > maxVisits) {
            mostVisitedActor = actorVisits[actorId].name;
            maxVisits = actorVisits[actorId].count;
        }
    }

    return mostVisitedActor || 'Not Available';
}

function getMostVisitedDirector() {
    const directorVisits = JSON.parse(localStorage.getItem('directorVisits')) || {};
    let mostVisitedDirector = '';
    let maxVisits = 0;

    for (const directorId in directorVisits) {
        if (directorVisits[directorId].count > maxVisits) {
            mostVisitedDirector = directorVisits[directorId].name;
            maxVisits = directorVisits[directorId].count;
        }
    }

    return mostVisitedDirector || 'Not Available';
}

function getTriviaAccuracy() {
    let triviaStats = JSON.parse(localStorage.getItem('triviaStats')) || { totalCorrect: 0, totalAttempted: 0 };
    if (triviaStats.totalAttempted === 0) {
        return 'No trivia attempted';
    }
    let accuracy = (triviaStats.totalCorrect / triviaStats.totalAttempted) * 100;
    return `${accuracy.toFixed(1)}% accuracy`;
}

function getMostCommonGenre() {
    const favoriteGenres = JSON.parse(localStorage.getItem('favoriteGenres')) || {};
    let mostCommonGenre = '';
    let maxCount = 0;

    for (const genre in favoriteGenres) {
        if (favoriteGenres[genre] > maxCount) {
            mostCommonGenre = genre;
            maxCount = favoriteGenres[genre];
        }
    }

    return mostCommonGenre || 'Not Available';
}

document.addEventListener('DOMContentLoaded', rotateUserStats);

async function fetchMovieDetails(movieId) {
    const favoritesContainer = document.getElementById('favorites-main');
    const code = 'c5a20c861acf7bb8d9e987dcc7f1b558';
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${code}&append_to_response=credits,keywords,similar`;

    try {
        const response = await fetch(url);
        const movie = await response.json();
        const movieVoteAverage = movie.vote_average.toFixed(1);
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.innerHTML = `
                <img src="${IMGPATH + movie.poster_path}" alt="${movie.title}" style="cursor: pointer" />
                <div class="movie-info" style="cursor: pointer;">
                    <h3>${movie.title}</h3>
                    <span class="${getClassByRate(movieVoteAverage)}">${movieVoteAverage}</span>
                </div>
                <div class="overview" style="cursor: pointer;">
                    <h4>Movie Overview: </h4>
                    ${movie.overview}
                </div>`;

        movieEl.addEventListener('click', () => {
            localStorage.setItem('selectedMovieId', movie.id);
            window.location.href = 'movie-details.html';
            updateMovieVisitCount(movie.id, movie.title);
        });

        favoritesContainer.appendChild(movieEl);

    }
    catch (error) {
        console.error('Error fetching movie details:', error);
        favoritesContainer.innerHTML += '<p>Error loading movie details.</p>';
    }
}

async function showMovieOfTheDay() {
    const year = new Date().getFullYear();
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=c5a20c861acf7bb8d9e987dcc7f1b558&sort_by=vote_average.desc&vote_count.gte=100&primary_release_year=${year}&vote_average.gte=7`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const movies = data.results;

        if (movies.length > 0) {
            const randomMovie = movies[Math.floor(Math.random() * movies.length)];
            localStorage.setItem('selectedMovieId', randomMovie.id);
            window.location.href = 'movie-details.html';
        }
        else {
            fallbackMovieSelection();
        }
    }
    catch (error) {
        console.error('Error fetching movie:', error);
        fallbackMovieSelection();
    }
}

function fallbackMovieSelection() {
    const fallbackMovies = [432413, 299534, 1726, 562, 118340, 455207, 493922, 447332, 22970, 530385, 27205, 264660, 120467, 603, 577922, 76341, 539, 419704, 515001, 118340, 424, 98];
    const randomFallbackMovie = fallbackMovies[Math.floor(Math.random() * fallbackMovies.length)];
    localStorage.setItem('selectedMovieId', randomFallbackMovie);
    window.location.href = 'movie-details.html';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

document.getElementById('delete-watchlist-btn').addEventListener('click', () => openModal('delete-watchlist-modal'));

async function getMovieTitle(movieId) {
    const apiKey = 'c5a20c861acf7bb8d9e987dcc7f1b558';
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        const movie = await response.json();
        return movie.title;
    }
    catch (error) {
        console.error('Error fetching movie title:', error);
        return 'Unknown Movie';
    }
}

async function populateCreateModalWithFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const createForm = document.getElementById('create-watchlist-form');

    let moviesContainer = document.getElementById('movies-container');
    let moviesLabel = document.getElementById('movies-label-create');

    if (moviesContainer) {
        moviesContainer.innerHTML = '';
    }
    else {
        moviesContainer = document.createElement('div');
        moviesContainer.id = 'movies-container';
        createForm.insertBefore(moviesContainer, createForm.querySelector('button[type="submit"]'));
    }

    if (!moviesLabel) {
        moviesLabel = document.createElement('label');
        moviesLabel.id = 'movies-label-create';
        moviesLabel.textContent = 'Select Movies:';
        moviesLabel.htmlFor = 'movies-container';
        createForm.insertBefore(moviesLabel, moviesContainer);
    }

    for (const movieId of favorites) {
        const movieTitle = await getMovieTitle(movieId);
        const movieItem = document.createElement('div');
        movieItem.classList.add('movie-item');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `movie-${movieId}`;
        checkbox.value = movieId;
        checkbox.name = "favoritedMovies";

        const label = document.createElement('label');
        label.htmlFor = `movie-${movieId}`;
        label.textContent = movieTitle;

        movieItem.appendChild(checkbox);
        movieItem.appendChild(label);
        moviesContainer.appendChild(movieItem);
    }
}

document.getElementById('create-watchlist-btn').addEventListener('click', function() {
    document.getElementById('create-watchlist-form').reset();
    populateCreateModalWithFavorites();
    openModal('create-watchlist-modal');
    updateWatchlistsCreated();
});

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

document.getElementById('create-watchlist-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('new-watchlist-name').value;
    const description = document.getElementById('new-watchlist-description').value;
    const selectedMovies = Array.from(document.querySelectorAll('#movies-container input[name="favoritedMovies"]:checked')).map(checkbox => checkbox.value);

    let watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const uniqueId = generateUniqueId();
    watchlists.push({
        id: uniqueId,
        name,
        description,
        movies: selectedMovies,
        pinned: false,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('watchlists', JSON.stringify(watchlists));
    closeModal('create-watchlist-modal');
    updateWatchListsDisplay();
    window.location.reload();
});

document.getElementById('edit-watchlist-btn').addEventListener('click', async function() {
    await populateEditModal();
    openModal('edit-watchlist-modal');
});

async function populateEditModal() {
    const watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const editForm = document.getElementById('edit-watchlist-form');
    editForm.innerHTML = '';

    const selectLabel = document.createElement('label');
    selectLabel.textContent = 'Select A Watch List:';
    selectLabel.setAttribute("for", "watchlist-select");
    editForm.appendChild(selectLabel);

    const select = document.createElement('select');
    select.id = 'watchlist-select';
    select.style.font = 'inherit';
    watchlists.forEach((watchlist, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = watchlist.name;
        select.appendChild(option);
    });

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Watch List Name:';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'edit-watchlist-name';
    nameInput.style.font = 'inherit';

    const descLabel = document.createElement('label');
    descLabel.textContent = 'Description:';

    const descInput = document.createElement('textarea');
    descInput.id = 'edit-watchlist-description';
    descInput.style.font = 'inherit';

    const moviesContainer = document.createElement('div');
    moviesContainer.id = 'edit-movies-container';

    const moviesLabel = document.createElement('label');
    moviesLabel.textContent = 'Select Movies:';

    editForm.appendChild(select);
    editForm.appendChild(nameLabel);
    editForm.appendChild(nameInput);
    editForm.appendChild(descLabel);
    editForm.appendChild(descInput);
    editForm.appendChild(moviesLabel);
    editForm.appendChild(moviesContainer);

    const updateForm = async (watchlist) => {
        nameInput.value = watchlist.name;
        descInput.value = watchlist.description;
        moviesContainer.innerHTML = '';

        for (const movieId of favorites) {
            const movieTitle = await getMovieTitle(movieId);
            const isChecked = watchlist.movies.includes(movieId.toString());

            const movieItem = document.createElement('div');
            movieItem.classList.add('movie-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `edit-movie-${movieId}`;
            checkbox.value = movieId;
            checkbox.checked = isChecked;

            const label = document.createElement('label');
            label.htmlFor = `edit-movie-${movieId}`;
            label.textContent = movieTitle;

            movieItem.appendChild(checkbox);
            movieItem.appendChild(label);
            moviesContainer.appendChild(movieItem);
        }
    };

    select.addEventListener('change', function() {
        updateForm(watchlists[this.value]);
    });

    if (watchlists.length > 0) {
        updateForm(watchlists[0]);
    }

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Save Changes';
    editForm.appendChild(submitButton);
}

document.getElementById('edit-watchlist-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const selectedIndex = document.getElementById('watchlist-select').value;
    const newName = document.getElementById('edit-watchlist-name').value;
    const newDescription = document.getElementById('edit-watchlist-description').value;
    const selectedMovies = Array.from(document.querySelectorAll('#edit-movies-container input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

    let watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    watchlists[selectedIndex] = {
        id: watchlists[selectedIndex].id,
        name: newName,
        description: newDescription,
        movies: selectedMovies,
        pinned: watchlists[selectedIndex].pinned
    };

    localStorage.setItem('watchlists', JSON.stringify(watchlists));
    closeModal('edit-watchlist-modal');
    updateWatchListsDisplay();
    window.location.reload();
});

function populateDeleteModal() {
    const watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const deleteForm = document.getElementById('delete-watchlist-form');
    deleteForm.innerHTML = '';

    const select = document.createElement('select');
    select.id = 'delete-watchlist-select';
    select.style.font = 'inherit';
    watchlists.forEach((watchlist, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = watchlist.name;
        select.appendChild(option);
    });

    const watchlistLabel = document.createElement('label');
    watchlistLabel.textContent = 'Select Watch List to Delete:';
    watchlistLabel.htmlFor = 'delete-watchlist-select';
    deleteForm.appendChild(watchlistLabel);
    deleteForm.appendChild(select);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteForm.appendChild(deleteButton);

    deleteButton.addEventListener('click', function() {
        let watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
        const selectedIndex = select.value;
        const watchListName = watchlists[selectedIndex].name;
        if (!confirm('Are you sure you want to delete the watch list titled "' + watchListName + '"?')) return;
        watchlists.splice(selectedIndex, 1);
        localStorage.setItem('watchlists', JSON.stringify(watchlists));
        closeModal('delete-watchlist-modal');
        updateWatchListsDisplay();
        window.location.reload();
    });
}

document.getElementById('delete-watchlist-btn').addEventListener('click', populateDeleteModal);

async function updateWatchListsDisplay() {
    const watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const displaySection = document.getElementById('watchlists-display-section');
    displaySection.innerHTML = '';

    if (watchlists.length === 0) {
        displaySection.innerHTML = '<p style="text-align: center">No watch lists found. Click on "Create a Watch List" to start adding movies.</p>';
    }
    else {
        for (const watchlist of watchlists) {
            const watchlistDiv = document.createElement('div');
            watchlistDiv.className = 'watchlist';

            const title = document.createElement('h3');
            title.textContent = watchlist.name;
            title.className = 'watchlist-title';

            const description = document.createElement('p');
            description.textContent = watchlist.description;
            description.className = 'watchlist-description';

            watchlistDiv.appendChild(title);
            watchlistDiv.appendChild(description);

            if (watchlist.movies.length === 0) {
                const noMoviesMessage = document.createElement('p');
                noMoviesMessage.textContent = 'This watch list is empty. Use the "Edit a Watch List" button to add movies.';
                noMoviesMessage.style.textAlign = 'center';
                watchlistDiv.appendChild(noMoviesMessage);
            }
            else {
                const moviesContainer = document.createElement('div');
                moviesContainer.className = 'movies-container';
                moviesContainer.style.flexWrap = 'wrap';

                for (const movieId of watchlist.movies) {
                    const movieCard = await fetchMovieDetails(movieId);
                    moviesContainer.appendChild(movieCard);
                }
                watchlistDiv.appendChild(moviesContainer);
            }
            addWatchListControls(watchlistDiv);
            displaySection.appendChild(watchlistDiv);
        }
    }
}

async function fetchMovieDetails(movieId) {
    const code = 'c5a20c861acf7bb8d9e987dcc7f1b558';
    const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${code}&append_to_response=credits,keywords,similar`;

    try {
        const response = await fetch(url);
        const movie = await response.json();
        return createMovieCard(movie);
    }
    catch (error) {
        console.error('Error fetching movie details:', error);
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Error loading movie details.';
        return errorDiv;
    }
}

function createMovieCard(movie) {
    const movieEl = document.createElement('div');
    movieEl.classList.add('movie');
    movieEl.style.cursor = 'pointer';

    movieEl.innerHTML = `
                <img src="${IMGPATH + movie.poster_path}" alt="${movie.title}" style="cursor: pointer">
                <div class="movie-info" style="cursor: pointer">
                    <h3>${movie.title}</h3>
                    <span class="${getClassByRate(movie.vote_average.toFixed(1))}">${movie.vote_average.toFixed(1)}</span>
                </div>
                <div class="overview">
                    <h4>Movie Overview:</h4>
                    ${movie.overview}
                </div>`;
    movieEl.addEventListener('click', () => {
        localStorage.setItem('selectedMovieId', movie.id);
        window.location.href = 'movie-details.html';
        updateMovieVisitCount(movie.id, movie.title);
    });

    return movieEl;
}

const searchForm = document.getElementById('form');
const searchBtn = document.getElementById('button-search');
const searchResultsMain = document.getElementById('search-results');
const altTitle = document.getElementById('search-title');

function getClassByRate(vote){
    if (vote >= 8) {
        return 'green';
    }
    else if (vote >= 5) {
        return 'orange';
    }
    else {
        return 'red';
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchQuery = document.getElementById('search').value;
    localStorage.setItem('searchQuery', searchQuery);
    window.location.href = 'search.html';
});

function handleSearch() {
    const searchQuery = document.getElementById('search').value;
    localStorage.setItem('searchQuery', searchQuery);
    window.location.href = 'search.html';
}

async function getMovies(url) {
    const numberOfMovies = calculateMoviesToDisplay();
    const pagesToFetch = numberOfMovies <= 20 ? 1 : 2;
    let allMovies = [];

    for (let page = 1; page <= pagesToFetch; page++) {
        const response = await fetch(`${url}&page=${page}`);
        const data = await response.json();
        allMovies = allMovies.concat(data.results);
    }

    const popularityThreshold = 0.5;

    allMovies.sort((a, b) => {
        const popularityDifference = Math.abs(a.popularity - b.popularity);
        if (popularityDifference < popularityThreshold) {
            return b.vote_average - a.vote_average;
        }
        return b.popularity - a.popularity;
    });

    if (allMovies.length > 0) {
        showMovies(allMovies.slice(0, numberOfMovies));
        document.getElementById('clear-search-btn').style.display = 'block';
    }
    else {
        searchResultsMain.innerHTML = `<p>No movie with the specified search term found. Please try again.</p>`;
        document.getElementById('clear-search-btn').style.display = 'none';
    }
}

function showMovies(movies){
    searchResultsMain.innerHTML = '';
    movies.forEach((movie) => {
        const { id, poster_path, title, vote_average, overview } = movie;
        const movieE1 = document.createElement('div');
        const voteAverage = vote_average.toFixed(1);
        movieE1.classList.add('movie');

        const movieImage = poster_path
            ? `<img src="${IMGPATH + poster_path}" alt="${title}" style="cursor: pointer;" />`
            : `<div class="no-image" style="text-align: center; padding: 20px;">Image Not Available</div>`;

        movieE1.innerHTML = `
            ${movieImage}
            <div class="movie-info" style="cursor: pointer;">
                <h3>${title}</h3>
                <span class="${getClassByRate(vote_average)}">${voteAverage}</span>
            </div>
            <div class="overview" style="cursor: pointer;">
                <h4>Movie Overview: </h4>
                ${overview}
            </div>`;

        movieE1.addEventListener('click', () => {
            localStorage.setItem('selectedMovieId', id);
            window.location.href = 'movie-details.html';
            updateMovieVisitCount(id, title);
        });

        searchResultsMain.appendChild(movieE1);
    });
}

document.getElementById('clear-search-btn').addEventListener('click', () => {
    location.reload();
});

function calculateMoviesToDisplay() {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 689.9) return 10;
    if (screenWidth <= 1021.24) return 20;
    if (screenWidth <= 1353.74) return 21;
    if (screenWidth <= 1684.9) return 20;
    if (screenWidth <= 2017.49) return 20;
    if (screenWidth <= 2349.99) return 18;
    if (screenWidth <= 2681.99) return 21;
    if (screenWidth <= 3014.49) return 24;
    if (screenWidth <= 3345.99) return 27;
    if (screenWidth <= 3677.99) return 20;
    if (screenWidth <= 4009.99) return 22;
    if (screenWidth <= 4340.99) return 24;
    if (screenWidth <= 4673.49) return 26;
    if (screenWidth <= 5005.99) return 28;
    if (screenWidth <= 5337.99) return 30;
    if (screenWidth <= 5669.99) return 32;
    if (screenWidth <= 6001.99) return 34;
    if (screenWidth <= 6333.99) return 36;
    if (screenWidth <= 6665.99) return 38;
    if (screenWidth <= 6997.99) return 40;
    if (screenWidth <= 7329.99) return 42;
    if (screenWidth <= 7661.99) return 44;
    if (screenWidth <= 7993.99) return 46;
    if (screenWidth <= 8325.99) return 48;
    return 20;
}

function handleSignInOut() {
    const isSignedIn = JSON.parse(localStorage.getItem('isSignedIn')) || false;

    if (isSignedIn) {
        localStorage.setItem('isSignedIn', JSON.stringify(false));
        alert('You have been signed out.');
    }
    else {
        window.location.href = 'sign-in.html';
        return;
    }

    updateSignInButtonState();
}

function updateSignInButtonState() {
    const isSignedIn = JSON.parse(localStorage.getItem('isSignedIn')) || false;

    const signInText = document.getElementById('signInOutText');
    const signInIcon = document.getElementById('signInIcon');
    const signOutIcon = document.getElementById('signOutIcon');

    if (isSignedIn) {
        signInText.textContent = 'Sign Out';
        signInIcon.style.display = 'none';
        signOutIcon.style.display = 'inline-block';
    }
    else {
        signInText.textContent = 'Sign In';
        signInIcon.style.display = 'inline-block';
        signOutIcon.style.display = 'none';
    }
}

document.addEventListener("DOMContentLoaded", function() {
    updateSignInButtonState();
    document.getElementById('googleSignInBtn').addEventListener('click', handleSignInOut);
});

async function loadWatchLists() {
    const watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const displaySection = document.getElementById('watchlists-display-section');

    if (watchlists.length === 0) {
        displaySection.innerHTML = '<p style="text-align: center">No watch lists found. Click on "Create a Watch List" to start adding movies.</p>';
    }
    else {
        watchlists.sort((a, b) => (b.pinned === a.pinned) ? 0 : b.pinned ? 1 : -1);

        for (const watchlist of watchlists) {
            const watchlistDiv = await createWatchListDiv(watchlist);
            if (watchlist.pinned) {
                watchlistDiv.classList.add('pinned');
            }
            displaySection.appendChild(watchlistDiv);
        }
    }

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.length > 0) {
        const favoritesDiv = document.createElement('div');
        favoritesDiv.className = 'watchlist';
        favoritesDiv.id = 'favorites-watchlist';

        const title = document.createElement('h3');
        title.textContent = "Favorited Movies";
        title.className = 'watchlist-title';

        const description = document.createElement('p');
        description.textContent = "A collection of your favorited movies.";
        description.className = 'watchlist-description';

        favoritesDiv.appendChild(title);
        favoritesDiv.appendChild(description);

        const moviesContainer = document.createElement('div');
        moviesContainer.className = 'movies-container';

        for (const movieId of favorites) {
            const movieCard = await fetchMovieDetails(movieId);
            moviesContainer.appendChild(movieCard);
        }

        favoritesDiv.appendChild(moviesContainer);
        displaySection.appendChild(favoritesDiv);
    }
    else {
        const favoritesMain = document.getElementById('favorites-watchlist');
        favoritesMain.innerHTML = '<div style="text-align: center"><p style="text-align: center">No favorites added yet.</p></div>';
        window.location.reload();
    }
}

function isListPinned(watchlistId) {
    const watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const watchlist = watchlists.find(watchlist => watchlist.id === watchlistId);
    return watchlist.pinned;
}

function addWatchListControls(watchlistDiv, watchlistId) {
    const controlContainer = document.createElement('div');
    controlContainer.className = 'watchlist-controls';

    const pinBtn = document.createElement('button');
    pinBtn.id = 'pin-btn';
    pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
    pinBtn.onclick = function() { pinWatchList(watchlistDiv, watchlistId); };
    pinBtn.title = isListPinned(watchlistId) ? 'Unpin this watch list' : 'Pin this watch list';

    const moveUpBtn = document.createElement('button');
    moveUpBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    moveUpBtn.onclick = function() { moveWatchList(watchlistDiv, true); };
    moveUpBtn.title = 'Move this watch list up';

    const moveDownBtn = document.createElement('button');
    moveDownBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
    moveDownBtn.onclick = function() { moveWatchList(watchlistDiv, false); };
    moveDownBtn.title = 'Move this watch list down';

    controlContainer.appendChild(pinBtn);
    controlContainer.appendChild(moveUpBtn);
    controlContainer.appendChild(moveDownBtn);

    watchlistDiv.appendChild(controlContainer);
}

function createWatchListDiv(watchlist) {
    const watchlistDiv = document.createElement('div');
    watchlistDiv.className = 'watchlist';
    watchlistDiv.setAttribute('data-watchlist-id', watchlist.id);

    const title = document.createElement('h3');
    title.textContent = watchlist.name;
    title.className = 'watchlist-title';

    const description = document.createElement('p');
    description.textContent = watchlist.description;
    description.className = 'watchlist-description';

    watchlistDiv.appendChild(title);
    watchlistDiv.appendChild(description);

    const moviesContainer = document.createElement('div');
    moviesContainer.className = 'movies-container';
    moviesContainer.style.flexWrap = 'wrap';
    watchlist.movies.forEach(movieId => {
        fetchMovieDetails(movieId).then(movieCard => moviesContainer.appendChild(movieCard));
    });
    watchlistDiv.appendChild(moviesContainer);

    addWatchListControls(watchlistDiv, watchlist.id);

    return watchlistDiv;
}

function updateWatchlistsOrderInLS() {
    const watchlistsDivs = document.querySelectorAll('#watchlists-display-section > .watchlist');
    let watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];
    const newOrder = Array.from(watchlistsDivs).map(div => div.getAttribute('data-watchlist-id'));

    watchlists.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    localStorage.setItem('watchlists', JSON.stringify(watchlists));
}

function moveWatchList(watchlistDiv, moveUp) {
    const sibling = moveUp ? watchlistDiv.previousElementSibling : watchlistDiv.nextElementSibling;
    if (sibling) {
        const parent = watchlistDiv.parentNode;
        if (moveUp) {
            parent.insertBefore(watchlistDiv, sibling);
        }
        else {
            parent.insertBefore(sibling, watchlistDiv);
        }
        updateWatchlistsOrderInLS();
        updateWatchListsDisplay();
    }
}

function pinWatchList(watchlistDiv, watchlistId) {
    const isPinned = watchlistDiv.classList.contains('pinned');
    let watchlists = JSON.parse(localStorage.getItem('watchlists')) || [];

    watchlists.forEach(watchlist => {
        if (watchlist.id === watchlistId) {
            watchlist.pinned = !isPinned;
        }
    });

    watchlists.sort((a, b) => (b.pinned === a.pinned) ? 0 : b.pinned ? -1 : 1);

    localStorage.setItem('watchlists', JSON.stringify(watchlists));
    watchlistDiv.classList.toggle('pinned');
    loadWatchLists();
    window.location.reload();
}

document.getElementById('settings-btn').addEventListener('click', () => {
    window.location.href = 'settings.html';
});

document.addEventListener('DOMContentLoaded', () => {
    applySettings();

    function applySettings() {
        const savedBg = localStorage.getItem('backgroundImage');
        const savedTextColor = localStorage.getItem('textColor');
        const savedFontSize = localStorage.getItem('fontSize');

        if (savedBg) {
            document.body.style.backgroundImage = `url('${savedBg}')`;
        }
        if (savedTextColor) {
            document.querySelectorAll('h1, h2, h3, p, a, span, div, button, input, select, textarea, label, li').forEach(element => {
                element.style.color = savedTextColor;
            });
        }
        if (savedFontSize) {
            const size = savedFontSize === 'small' ? '12px' : savedFontSize === 'medium' ? '16px' : '20px';
            document.body.style.fontSize = size;
        }
    }
});

function updateWatchlistsCreated() {
    let watchlistsCount = parseInt(localStorage.getItem('watchlistsCreated')) || 0;
    watchlistsCount++;
    localStorage.setItem('watchlistsCreated', watchlistsCount.toString());
}
