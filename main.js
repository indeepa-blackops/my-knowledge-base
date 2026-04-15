let posts = [];
let activeFilter = 'all';
let sortOrder = 'newest';

// Initialize from URL on load
function initStateFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('q')) {
    document.getElementById('search').value = params.get('q');
  }
  if (params.has('type')) {
    activeFilter = params.get('type');
    document.querySelectorAll('.filter-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.type === activeFilter)
    );
  }
  if (params.has('sort')) {
    sortOrder = params.get('sort');
    const sortSelect = document.getElementById('sort-filter');
    if (sortSelect) sortSelect.value = sortOrder;
  }
}

// Update URL without reloading
function updateURL() {
  const q = document.getElementById('search').value;
  const dateVal = document.getElementById('date-filter').value;
  
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (activeFilter !== 'all') params.set('type', activeFilter);
  if (dateVal !== 'all') params.set('date', dateVal);
  if (sortOrder !== 'newest') params.set('sort', sortOrder);
  
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', newUrl);
}

async function loadPosts() {
  initStateFromURL();
  
  const res = await fetch('posts.json');
  posts = await res.json();
  
  populateDateFilter();
  render();
}

function populateDateFilter() {
  const monthSet = new Set(posts.map(p => p.date.slice(0, 7)));
  const months = [...monthSet].sort((a, b) => b.localeCompare(a));
  const sel = document.getElementById('date-filter');
  
  const params = new URLSearchParams(window.location.search);
  const urlDate = params.get('date') || 'all';

  months.forEach(ym => {
    const [y, m] = ym.split('-');
    const label = new Date(+y, +m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = ym;
    opt.textContent = label;
    if (ym === urlDate) opt.selected = true;
    sel.appendChild(opt);
  });
}

function setFilter(type) {
  activeFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.type === type)
  );
  render();
}

function handleSortChange() {
  sortOrder = document.getElementById('sort-filter').value;
  render();
}

function handleTagClick(e, tag) {
  e.preventDefault(); // Prevent navigating to the post when clicking a tag
  document.getElementById('search').value = tag;
  render();
}

function clearFilters() {
  document.getElementById('search').value = '';
  document.getElementById('date-filter').value = 'all';
  document.getElementById('sort-filter').value = 'newest';
  sortOrder = 'newest';
  setFilter('all'); // This will also call render() and updateURL()
}

function render() {
  updateURL();

  const q = document.getElementById('search').value.toLowerCase();
  const dateVal = document.getElementById('date-filter').value;
  
  let filtered = posts.filter(p => {
    const matchType = activeFilter === 'all' || p.type === activeFilter;
    const matchDate = dateVal === 'all' || p.date.startsWith(dateVal);
    const matchQ = !q ||
      p.title.toLowerCase().includes(q) ||
      p.desc.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q));
    return matchType && matchDate && matchQ;
  });

  // Sort logic
  filtered.sort((a, b) => {
    if (sortOrder === 'newest') {
      return b.date.localeCompare(a.date);
    } else {
      return a.date.localeCompare(b.date);
    }
  });

  const grid = document.getElementById('grid');
  grid.innerHTML = ''; // Clear current contents

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <p>No posts found matching your criteria.</p>
        <button class="clear-btn" onclick="clearFilters()">Clear Filters</button>
      </div>
    `;
    return;
  }

  const template = document.getElementById('card-template');

  filtered.forEach(p => {
    const clone = template.content.cloneNode(true);
    
    const a = clone.querySelector('a');
    a.href = `posts/${p.file}`;
    
    const badge = clone.querySelector('.badge');
    badge.className = `badge badge-${p.type}`;
    badge.textContent = p.type;
    
    clone.querySelector('.card-date').textContent = formatDate(p.date);
    clone.querySelector('.card-title').textContent = p.title;
    clone.querySelector('.card-desc').textContent = p.desc;
    
    const footer = clone.querySelector('.card-footer');
    (p.tags || []).forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'tag';
      btn.textContent = t;
      btn.onclick = (e) => handleTagClick(e, t);
      footer.appendChild(btn);
    });

    grid.appendChild(clone);
  });
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  const toTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', toTheme);
  localStorage.setItem('theme', toTheme);
  updateThemeToggleIcon();
}

function updateThemeToggleIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';
}

// Initialization on DOM fully loaded (just in case)
document.addEventListener('DOMContentLoaded', () => {
  updateThemeToggleIcon();
  loadPosts();
});
