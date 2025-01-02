// Configurare API
const NEWS_API_URL = 'https://min-api.cryptocompare.com/data/v2/news/';
const NEWS_PER_PAGE = 15;
let currentPage = 1;
let activeFilter = 'all';

const FILTER_CATEGORIES = [
    { id: 'all', label: 'Toate știrile', icon: 'fas fa-globe' },
    { id: 'bitcoin', label: 'Bitcoin', icon: 'fab fa-bitcoin' },
    { id: 'ethereum', label: 'Ethereum', icon: 'fab fa-ethereum' },
    { id: 'trading', label: 'Trading', icon: 'fas fa-chart-line' },
    { id: 'mining', label: 'Mining', icon: 'fas fa-microchip' }
];

// Funcție pentru formatarea datei
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Funcție pentru încărcarea știrilor
const loadNews = async (page, searchTerm = '') => {
    const newsContainer = document.querySelector('.news-container');
    // Adăugăm loading state
    newsContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Se încarcă știrile...</p>
        </div>
    `;

    try {
        const response = await fetch(`${NEWS_API_URL}?lang=EN`);
        const data = await response.json();

        if (data.Data && Array.isArray(data.Data)) {
            let newsData = data.Data;
            
            // Filtrare după searchTerm și categorie activă
            if (searchTerm || activeFilter !== 'all') {
                newsData = newsData.filter(item => {
                    const matchesSearch = !searchTerm || 
                        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.body.toLowerCase().includes(searchTerm.toLowerCase());
                    
                    const matchesFilter = activeFilter === 'all' || 
                        item.categories.toLowerCase().includes(activeFilter.toLowerCase()) ||
                        item.title.toLowerCase().includes(activeFilter.toLowerCase());
                    
                    return matchesSearch && matchesFilter;
                });
            }

            if (newsData.length === 0) {
                newsContainer.classList.add('empty');
                newsContainer.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>Nu au fost găsite rezultate</h3>
                        <p>Încercați să modificați termenii de căutare sau filtrele aplicate.</p>
                    </div>
                `;
                return;
            }

            newsContainer.classList.remove('empty');

            // Paginare
            const startIndex = (page - 1) * NEWS_PER_PAGE;
            const endIndex = startIndex + NEWS_PER_PAGE;
            const paginatedNews = newsData.slice(startIndex, endIndex);

            newsContainer.innerHTML = paginatedNews.map(item => `
                <div class="news-card" onclick="window.open('${item.url}', '_blank')">
                    <div class="news-image-container">
                        <img src="${item.imageurl}" 
                             alt="${item.title}" 
                             class="news-image"
                             onerror="this.src='https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=500'">
                    </div>
                    <div class="news-content">
                        <div>
                            <h3 class="news-title">${item.title}</h3>
                            <p class="news-excerpt">${item.body.slice(0, 150)}...</p>
                        </div>
                        <div class="news-meta">
                            <div class="source-date">
                                <span class="news-source">${item.source_info.name}</span>
                                <span class="news-date">${formatDate(item.published_on * 1000)}</span>
                            </div>
                            <div class="news-stats">
                                <span class="categories">${item.categories.split('|')[0]}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            // Actualizare paginare
            const totalPages = Math.ceil(newsData.length / NEWS_PER_PAGE);
            updatePagination(page, totalPages);

            // Animații
            document.querySelectorAll('.news-card').forEach((card, index) => {
                card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.1}s`;
            });
        } else {
            throw new Error('Nu s-au putut încărca știrile');
        }
    } catch (error) {
        console.error('Eroare la încărcarea știrilor:', error);
        newsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Ne pare rău, a apărut o eroare la încărcarea știrilor. Vă rugăm să încercați din nou mai târziu.</p>
                <button class="retry-btn" onclick="loadNews(currentPage)">
                    <i class="fas fa-redo"></i> Încearcă din nou
                </button>
            </div>
        `;
    }
};

// Funcție pentru actualizarea paginării
const updatePagination = (currentPage, totalPages) => {
    const pagination = document.querySelector('.pagination');
    
    pagination.innerHTML = `
        <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </button>
        ${generatePageNumbers(currentPage, totalPages)}
        <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    pagination.querySelectorAll('.pagination-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!button.disabled) {
                const newPage = parseInt(button.dataset.page);
                loadNews(newPage);
                currentPage = newPage;
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
};

// Funcție pentru generarea numerelor de pagină
const generatePageNumbers = (current, total) => {
    const pages = [];
    const range = 2;

    for (let i = 1; i <= total; i++) {
        if (
            i === 1 ||
            i === total ||
            (i >= current - range && i <= current + range)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return pages.map(page => {
        if (page === '...') {
            return '<span class="pagination-ellipsis">...</span>';
        }
        return `
            <button class="pagination-btn ${page === current ? 'active' : ''}" 
                    data-page="${page}">
                ${page}
            </button>
        `;
    }).join('');
};

// Adaugă funcționalitate de căutare
const setupSearch = () => {
    const searchInput = document.querySelector('.news-search');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = e.target.value.toLowerCase();
            loadNews(1, searchTerm);
        }, 300);
    });
};

// Funcție pentru setarea filtrelor
const setupFilters = () => {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (!filterButtons.length) return;

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizăm stilurile butoanelor
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Actualizăm filtrul activ și reîncărcăm știrile
            activeFilter = btn.dataset.filter;
            const searchTerm = document.querySelector('.news-search').value;
            loadNews(1, searchTerm);
        });
    });
};

// Funcție pentru inițializarea structurii HTML
const initializeNewsSection = () => {
    const newsSection = document.querySelector('.news');
    if (!newsSection) return;

    // Verificăm dacă elementele necesare există, dacă nu, le creăm
    if (!newsSection.querySelector('.news-container')) {
        const newsContainer = document.createElement('div');
        newsContainer.className = 'news-container';
        newsSection.appendChild(newsContainer);
    }

    if (!newsSection.querySelector('.search-container')) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        searchContainer.innerHTML = `
            <div class="search-icon">
                <i class="fas fa-search"></i>
            </div>
            <input type="text" class="news-search" placeholder="Caută știri crypto...">
        `;
        newsSection.insertBefore(searchContainer, newsSection.firstChild);
    }

    if (!newsSection.querySelector('.filter-buttons')) {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-buttons';
        filterContainer.innerHTML = FILTER_CATEGORIES.map(category => `
            <button class="filter-btn ${category.id === 'all' ? 'active' : ''}" data-filter="${category.id}">
                <i class="${category.icon}"></i>
                ${category.label}
            </button>
        `).join('');
        const searchContainer = newsSection.querySelector('.search-container');
        searchContainer.after(filterContainer);
    }

    if (!newsSection.querySelector('.pagination')) {
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        newsSection.appendChild(pagination);
    }
};

// Inițializare la încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    initializeNewsSection();
    loadNews(currentPage);
    setupSearch();
    setupFilters();
}); 