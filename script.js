
const newsContainer = document.getElementById("newsContainer");
const bookmarkContainer = document.getElementById("bookmarkContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const refreshBtn = document.getElementById("refreshBtn");
const themeToggle = document.getElementById("themeToggle");
const categoryButtons = document.querySelectorAll(".category-btn");

const BASE_URL = "https://gnews.io/api/v4";

let currentArticles = [];
let selectedCategory = "general";
let bookmarks = [];

try {
    bookmarks = JSON.parse(
        localStorage.getItem("dailyPulseBookmarks")
    ) || [];
} catch {
    bookmarks = [];
}

// Prevent API content from being interpreted as HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(date) {

    if (!date) {
        return "Date unavailable";
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return "Date unavailable";
    }

    return parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Fetch news from GNews
async function fetchNews(category = "general", keyword = "") {
    newsContainer.innerHTML =
        '<p class="loading-message">Loading latest news...</p>';

    try {
        const isSearch = keyword.trim() !== "";

        const endpoint = isSearch ? "search" : "top-headlines";

        const params = new URLSearchParams({
            lang: "en",
            country: "in",
            max: "10",
            apikey: API_KEY
        });

        if (isSearch) {
            params.set("q", keyword.trim());
        } else {
            params.set("category", category);
        }

        const response = await fetch(
            `${BASE_URL}/${endpoint}?${params}`
        );

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        currentArticles = (data.articles || []).map(article => ({
            id: article.url,
            title: article.title || "Untitled article",
            description: article.description || "No description available.",
            image: article.image || "",
            category: isSearch ? "Search Result" : category,
            date: article.publishedAt,
            source: article.source?.name || "News Source",
            url: article.url
        }));

        displayNews(currentArticles);

    } catch (error) {
        console.error("News loading error:", error);

        newsContainer.innerHTML = `
            <p class="empty-message">
                Unable to load news. Check your API key,
                internet connection and API request limit.
            </p>
        `;
    }
}

// Generate news cards
function createNewsCard(article, savedSection = false) {
    const isSaved = bookmarks.some(item => item.id === article.id);
    const index = savedSection
        ? bookmarks.findIndex(item => item.id === article.id)
        : currentArticles.findIndex(item => item.id === article.id);

    const image = article.image
        ? `<img src="${escapeHTML(article.image)}"
                class="news-image"
                alt="Article image"
                loading="lazy">`
        : "";

    return `
        <article class="news-card">
            ${image}

            <div class="news-content">
                <span class="news-category">
                    ${escapeHTML(article.category)}
                </span>

                <h3>${escapeHTML(article.title)}</h3>

                <p>${escapeHTML(article.description)}</p>

                <p class="article-source">
                    ${escapeHTML(article.source)}
                </p>

                <div class="news-meta">
                    <span>${article.date ? formatDate(article.date) : ""}</span>

                    <div class="news-actions">
                        <button class="bookmark-btn"
                                data-index="${index}"
                                data-saved="${savedSection}">
                            ${isSaved ? "♥ Saved" : "♡ Save"}
                        </button>
                    </div>
                </div>

                <a class="read-more"
                   href="${escapeHTML(article.url)}"
                   target="_blank"
                   rel="noopener noreferrer">
                    Read Full Article →
                </a>
            </div>
        </article>
    `;
}

function displayNews(articles) {
    if (!articles.length) {
        newsContainer.innerHTML =
            '<p class="empty-message">No articles found.</p>';
        return;
    }

    newsContainer.innerHTML = articles
        .map(article => createNewsCard(article))
        .join("");
}

function displayBookmarks() {
    bookmarkContainer.innerHTML = bookmarks.length
        ? bookmarks.map(article => createNewsCard(article, true)).join("")
        : '<p class="empty-message">No saved stories yet.</p>';
}

// Bookmark handling
function toggleBookmark(article) {
    const exists = bookmarks.some(item => item.id === article.id);

    if (exists) {
        bookmarks = bookmarks.filter(item => item.id !== article.id);
    } else {
        bookmarks.push(article);
    }

    localStorage.setItem(
        "dailyPulseBookmarks",
        JSON.stringify(bookmarks)
    );

    displayNews(currentArticles);
    displayBookmarks();
}

function handleBookmarkClick(event, savedSection) {
    const button = event.target.closest(".bookmark-btn");
    if (!button) return;

    const index = Number(button.dataset.index);
    const collection = savedSection ? bookmarks : currentArticles;
    const article = collection[index];

    if (article) toggleBookmark(article);
}

newsContainer.addEventListener("click", event => {
    handleBookmarkClick(event, false);
});

bookmarkContainer.addEventListener("click", event => {
    handleBookmarkClick(event, true);
});

// Category selection
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        categoryButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        selectedCategory = button.dataset.category;
        searchInput.value = "";

        fetchNews(selectedCategory);
    });
});

// Search
function searchNews() {
    const keyword = searchInput.value.trim();

    if (!keyword) {
        fetchNews(selectedCategory);
        return;
    }

    fetchNews(selectedCategory, keyword);
}

searchBtn.addEventListener("click", searchNews);

searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") searchNews();
});

// Refresh
refreshBtn.addEventListener("click", () => {
    fetchNews(selectedCategory, searchInput.value.trim());
});

// Dark mode
if (localStorage.getItem("dailyPulseTheme") === "dark") {
    document.body.classList.add("dark-mode");
}

function updateThemeIcon() {
    themeToggle.textContent =
        document.body.classList.contains("dark-mode") ? "☀" : "☾";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    const theme = document.body.classList.contains("dark-mode")
        ? "dark"
        : "light";

    localStorage.setItem("dailyPulseTheme", theme);
    updateThemeIcon();
});

updateThemeIcon();

// Start app
displayBookmarks();
fetchNews();
