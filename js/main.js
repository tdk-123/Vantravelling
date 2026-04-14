document.addEventListener('DOMContentLoaded', () => {
    // ===== SHARED UTILITIES =====

    // Detect language from URL path
    function getCurrentLang() {
        // Simple check: if path contains '/en/', it's English
        return window.location.pathname.includes('/en/') ? 'en' : 'nl';
    }

    function getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/en/')) {
        // We're in /base/en/file.html — base is everything before /en/
        return path.substring(0, path.indexOf('/en/'));
    } else {
        // We're in /base/file.html — base is everything before the filename
        return path.substring(0, path.lastIndexOf('/'));
    }
    }
// Switch language (preserves URL hash for blog post navigation)
function switchLanguage(targetLang) {
    const hash = window.location.hash;
    const currentPath = window.location.pathname;
    const basePath = getBasePath();

    const pathParts = currentPath.split('/');
    let filename = pathParts.pop();
    if (!filename) filename = 'index.html';

    let newPath;
    if (targetLang === 'en') {
        if (!currentPath.includes('/en/')) {
            newPath = basePath + '/en/' + filename;
        } else {
            newPath = currentPath;
        }
    } else {
        if (currentPath.includes('/en/')) {
            newPath = basePath + '/' + filename;
        } else {
            newPath = currentPath;
        }
    }

    if (newPath) {
        window.location.href = newPath + hash;
    }
}
    // Initialize language switcher
    function initLangSwitcher() {
        const lang = getCurrentLang();
        const switcher = document.getElementById('lang-switcher');

        if (switcher) {
            // Highlight current language
            const nlBtn = switcher.querySelector('.lang-nl');
            const enBtn = switcher.querySelector('.lang-en');

            if (nlBtn) {
                nlBtn.classList.toggle('active', lang === 'nl');
                nlBtn.addEventListener('click', () => switchLanguage('nl'));
            }
            if (enBtn) {
                enBtn.classList.toggle('active', lang === 'en');
                enBtn.addEventListener('click', () => switchLanguage('en'));
            }
        }
    }

    // Initialize immediately
    initLangSwitcher();

    // Get the correct data path based on language and folder location
    function getDataPath() {
        const lang = getCurrentLang();
        const isInEnFolder = window.location.pathname.includes('/en/');
        // If in en folder, data is in ../data. If in root, data is in data.
        const prefix = isInEnFolder ? '../' : '';
        return `${prefix}data/posts-${lang}.json`;
    }

    // Get the correct media path based on folder location
    function getMediaPath(src) {
        const isInEnFolder = window.location.pathname.includes('/en/');
        // If it's an external URL, return as-is
        if (src.startsWith('http')) return src;
        // For local assets, add prefix if in /en folder
        return isInEnFolder ? '../' + src : src;
    }

// Get the blog page path based on language
function getBlogPath() {
    const basePath = getBasePath();
    const isInEnFolder = window.location.pathname.includes('/en/');
    return isInEnFolder ? basePath + '/en/blog.html' : basePath + '/blog.html';
}

    // Get post index from URL hash (e.g., #post-2 -> 1)
    // If no hash, returns -1 to signal "use newest post"
    function getPostIndexFromHash() {
        const hash = window.location.hash;
        console.log('[DEBUG] getPostIndexFromHash. Raw hash:', hash);

        // Use regex for more robust matching
        const match = hash.match(/post-(\d+)/);
        if (match && match[1]) {
            const postId = parseInt(match[1], 10);
            console.log('[DEBUG] Regex matched postId:', postId);
            if (!isNaN(postId) && postId >= 1) {
                return postId - 1; // Convert to 0-based index
            }
        }

        console.log('[DEBUG] No valid hash index found, will use newest post');
        return -1; // Signal to use newest post (last in array)
    }

    // Update URL hash without triggering navigation
    function updateUrlHash(index) {
        const newHash = `#post-${index + 1}`;
        if (window.location.hash !== newHash) {
            history.replaceState(null, '', newHash);
        }
    }

    // ===== HOMEPAGE PREVIEW CARDS =====
    const previewGrid = document.getElementById('preview-grid');

    if (previewGrid) {
        // Load posts and create preview cards for the 3 latest
        // Load posts and create preview cards for the 3 latest
        // Add cache buster to prevent caching issues
        fetch(getDataPath() + '?t=' + new Date().getTime())
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} fetching ${getDataPath()}`);
                }
                return response.json();
            })
            .then(posts => {
                console.log('[DEBUG] Preview fetch posts:', posts);
                if (!Array.isArray(posts) || posts.length === 0) {
                    console.warn('No posts found to display.');
                    previewGrid.innerHTML = '<p>No posts available.</p>';
                    return;
                }

                // Get the 3 most recent posts (assuming they're in chronological order, newest last)
                // Reverse to get newest first, then take 3
                const latestPosts = [...posts].reverse().slice(0, 3);

                console.log('[DEBUG] Latest posts to render:', latestPosts);

                previewGrid.innerHTML = '';

                latestPosts.forEach((post, displayIndex) => {
                    // Calculate the actual index in the original posts array
                    const actualIndex = posts.length - 1 - displayIndex;

                    const card = document.createElement('div');
                    card.className = 'preview-card';
                    card.style.cursor = 'pointer';

                    // Use a placeholder image for videos
                    let imageSrc = 'assets/images/placeholder_2.png';
                    let previewText = '';

                    // Find first image/video and first text for preview
                    if (post.blocks) {
                        const mediaBlock = post.blocks.find(b => b.type === 'image' || b.type === 'video' || b.type === 'gallery');
                        const textBlock = post.blocks.find(b => b.type === 'text');

                        if (mediaBlock) {
                            if (mediaBlock.type === 'image') imageSrc = getMediaPath(mediaBlock.src);
                            else if (mediaBlock.type === 'video') imageSrc = getMediaPath('assets/images/placeholder_2.png'); // Video placeholder
                            else if (mediaBlock.type === 'gallery' && mediaBlock.images.length > 0) imageSrc = getMediaPath(mediaBlock.images[0].src);
                        }

                        if (textBlock) {
                            previewText = textBlock.content;
                        }
                    } else {
                        // Fallback for unexpected structure
                        previewText = "No content available.";
                    }

                    // Truncate content for preview
                    previewText = previewText.length > 80
                        ? previewText.substring(0, 80) + '...'
                        : previewText;

                    card.innerHTML = `
                        <img src="${imageSrc}" alt="${post.title}" class="preview-image" onerror="this.src='assets/images/placeholder_3.png'">
                        <div class="preview-content">
                            <p class="preview-date">${post.date}</p>
                            <h3>${post.title}</h3>
                            <p>${previewText}</p>
                        </div>
                    `;

                    // Click handler to navigate to blog with specific post
                    card.addEventListener('click', () => {
                        window.location.href = getBlogPath() + `#post-${actualIndex + 1}`;
                    });

                    previewGrid.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error loading preview posts:', error);
                previewGrid.innerHTML = '<p>Error loading content.</p>';
            });
    }

    // ===== BLOG PAGE FUNCTIONALITY =====
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const postArea = document.getElementById('blog-post-area');
    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    const postBody = document.getElementById('post-body'); // Unified container

    // Lightbox Elements (created dynamically)
let lightboxCtx = {
    isOpen: false,
    images: [],
    currentIndex: 0,
    el: null,
    imgEl: null,
    captionEl: null,
    // Zoom/pan state
    scale: 1,
    translateX: 0,
    translateY: 0,
};

function initLightbox() {
    if (document.querySelector('.lightbox')) return;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
        <div class="lightbox-close">&times;</div>
        <div class="lightbox-nav lightbox-prev">&#10094;</div>
        <div class="lightbox-nav lightbox-next">&#10095;</div>
        <div class="lightbox-content-wrapper">
            <img class="lightbox-img" src="" alt="">
            <div class="lightbox-caption"></div>
        </div>
    `;
    document.body.appendChild(lb);
    lightboxCtx.el = lb;
    lightboxCtx.imgEl = lb.querySelector('.lightbox-img');
    lightboxCtx.captionEl = lb.querySelector('.lightbox-caption');

    // --- Click events ---
    lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lightbox-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        if (lightboxCtx.scale === 1) prevImage();
    });
    lb.querySelector('.lightbox-next').addEventListener('click', (e) => {
        e.stopPropagation();
        if (lightboxCtx.scale === 1) nextImage();
    });
    lb.addEventListener('click', (e) => {
        if (e.target === lb) closeLightbox();
    });

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
        if (!lightboxCtx.isOpen) return;
        if (e.key === 'Escape') {
            if (lightboxCtx.scale > 1) resetZoom();
            else closeLightbox();
        }
        if (lightboxCtx.scale === 1) {
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        }
    });

    // --- Touch state ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;
    let isDragging = false;
    let dragMode = null; // 'pan' | 'swipe' | 'dismiss' | 'pinch'
    let dragCurrentX = 0;
    let dragCurrentY = 0;

    // Pinch state
    let pinchStartDist = 0;
    let pinchStartScale = 1;

    function getTouchDist(e) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function clampTranslate(x, y, scale) {
        const rect = lightboxCtx.imgEl.getBoundingClientRect();
        // rect reflects current rendered size (before scale transform)
        // max pan = half the extra size revealed by zoom, in scaled coords
        const maxX = (rect.width  * (scale - 1)) / (2 * scale);
        const maxY = (rect.height * (scale - 1)) / (2 * scale);
        return {
            x: Math.max(-maxX, Math.min(maxX, x)),
            y: Math.max(-maxY, Math.min(maxY, y)),
        };
    }

    // All touch listeners on the container so dismiss works on dark area too
    lb.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Start of pinch
            dragMode = 'pinch';
            isDragging = true;
            pinchStartDist = getTouchDist(e);
            pinchStartScale = lightboxCtx.scale;
            return;
        }
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            touchStartTime = Date.now();
            isDragging = false;
            dragMode = null;
            dragCurrentX = lightboxCtx.translateX;
            dragCurrentY = lightboxCtx.translateY;
        }
    }, { passive: true });

    lb.addEventListener('touchmove', (e) => {
        if (dragMode === 'pinch' && e.touches.length === 2) {
            const newDist = getTouchDist(e);
            let newScale = pinchStartScale * (newDist / pinchStartDist);
            newScale = Math.max(1, Math.min(4, newScale));
            const clamped = clampTranslate(lightboxCtx.translateX, lightboxCtx.translateY, newScale);
            lightboxCtx.scale = newScale;
            lightboxCtx.translateX = clamped.x;
            lightboxCtx.translateY = clamped.y;
            applyZoomTransform();
            updateZoomedState();
            return;
        }

        if (e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        if (!isDragging) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            isDragging = true;
            if (lightboxCtx.scale > 1) {
                dragMode = 'pan';
            } else {
                dragMode = Math.abs(dy) > Math.abs(dx) ? 'dismiss' : 'swipe';
            }
        }

        if (dragMode === 'pan') {
            const clamped = clampTranslate(
                lightboxCtx.translateX + dx,
                lightboxCtx.translateY + dy,
                lightboxCtx.scale
            );
            dragCurrentX = clamped.x;
            dragCurrentY = clamped.y;
            applyZoomTransform(dragCurrentX, dragCurrentY);
        } else if (dragMode === 'dismiss') {
            if (dy > 0) {
                lb.style.transition = 'none';
                lb.style.transform = `translateY(${dy}px)`;
                lb.style.opacity = Math.max(0, 1 - dy / 300);
            }
        }
    }, { passive: true });

    lb.addEventListener('touchend', (e) => {
        // Pinch ended — just commit, don't interpret as tap
        if (dragMode === 'pinch') {
            // If scale snapped back to ~1, fully reset
            if (lightboxCtx.scale <= 1.05) resetZoom();
            dragMode = null;
            isDragging = false;
            return;
        }

        if (e.touches.length > 0) return; // still fingers on screen

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - touchStartX;
        const dy = endY - touchStartY;
        const elapsed = Date.now() - touchStartTime;
        const now = Date.now();

        // --- Double-tap ---
        if (!isDragging && elapsed < 300) {
            const timeSinceLastTap = now - lastTapTime;
            const tapDx = endX - lastTapX;
            const tapDy = endY - lastTapY;
            const tapDist = Math.sqrt(tapDx * tapDx + tapDy * tapDy);

            if (timeSinceLastTap < 300 && tapDist < 40) {
                // Cycle: 1 → 2 → 4 → 1
                let newScale;
                if (lightboxCtx.scale < 1.5) newScale = 2;
                else if (lightboxCtx.scale < 3) newScale = 4;
                else { resetZoom(); lastTapTime = 0; return; }

                // Center zoom on tap point
                const rect = lightboxCtx.imgEl.getBoundingClientRect();
                const offsetX = (rect.left + rect.width  / 2) - endX;
                const offsetY = (rect.top  + rect.height / 2) - endY;
                const clamped = clampTranslate(offsetX, offsetY, newScale);
                lightboxCtx.scale = newScale;
                lightboxCtx.translateX = clamped.x;
                lightboxCtx.translateY = clamped.y;
                lightboxCtx.imgEl.style.transition = 'transform 0.25s ease';
                applyZoomTransform();
                updateZoomedState();
                lastTapTime = 0;
                return;
            }
            lastTapTime = now;
            lastTapX = endX;
            lastTapY = endY;
            return;
        }

        // --- Drag end ---
        if (dragMode === 'pan') {
            lightboxCtx.translateX = dragCurrentX;
            lightboxCtx.translateY = dragCurrentY;
        } else if (dragMode === 'dismiss') {
            if (dy > 80) {
                closeLightbox();
            } else {
                lb.style.transition = '';
                lb.style.transform = '';
                lb.style.opacity = '';
            }
        } else if (dragMode === 'swipe' && lightboxCtx.scale === 1) {
            if (dx < -50) nextImage();
            else if (dx > 50) prevImage();
        }

        isDragging = false;
        dragMode = null;
    }, { passive: true });
}

function applyZoomTransform(x, y) {
    // Use stored values if not passed explicitly (e.g. during pinch)
    const tx = (x !== undefined) ? x : lightboxCtx.translateX;
    const ty = (y !== undefined) ? y : lightboxCtx.translateY;
    lightboxCtx.imgEl.style.transform =
        `scale(${lightboxCtx.scale}) translate(${tx / lightboxCtx.scale}px, ${ty / lightboxCtx.scale}px)`;
}

function updateZoomedState() {
    if (lightboxCtx.scale > 1) {
        lightboxCtx.el.classList.add('zoomed');
    } else {
        lightboxCtx.el.classList.remove('zoomed');
    }
}

function resetZoom() {
    lightboxCtx.scale = 1;
    lightboxCtx.translateX = 0;
    lightboxCtx.translateY = 0;
    lightboxCtx.imgEl.style.transition = 'transform 0.25s ease';
    lightboxCtx.imgEl.style.transform = '';
    lightboxCtx.el.classList.remove('zoomed');
    lightboxCtx.el.style.transition = '';
    lightboxCtx.el.style.transform = '';
    lightboxCtx.el.style.opacity = '';
}

    function openLightbox(imagesData, index) {
        if (!lightboxCtx.el) initLightbox();

        lightboxCtx.images = imagesData;
        lightboxCtx.currentIndex = index;
        lightboxCtx.isOpen = true;
        lightboxCtx.el.classList.add('open');
        updateLightboxImage();
    }

    function closeLightbox() {
        if (!lightboxCtx.el) return;
        lightboxCtx.isOpen = false;
        lightboxCtx.el.classList.remove('open');
	resetZoom();
    }

    function nextImage() {
        lightboxCtx.currentIndex = (lightboxCtx.currentIndex + 1) % lightboxCtx.images.length;
        updateLightboxImage();
    }

    function prevImage() {
        lightboxCtx.currentIndex = (lightboxCtx.currentIndex - 1 + lightboxCtx.images.length) % lightboxCtx.images.length;
        updateLightboxImage();
    }

    function updateLightboxImage() {
	resetZoom();
        const imgData = lightboxCtx.images[lightboxCtx.currentIndex];
        lightboxCtx.imgEl.src = getMediaPath(imgData.src); // Ensure path is correct
        lightboxCtx.imgEl.alt = imgData.alt;
        lightboxCtx.captionEl.textContent = imgData.alt || '';
    }

    // Don't run blog logic if elements don't exist
    if (!postArea) return;
// ===== SWIPE NAVIGATION =====
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 50; // Minimum px to count as a swipe
const SWIPE_ANGLE_LIMIT = 0.75; // Max vertical ratio to distinguish horizontal swipe

postArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

postArea.addEventListener('touchend', (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    // Ignore if mostly vertical (user is scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_ANGLE_LIMIT) return;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;

    if (deltaX < 0 && currentIndex < posts.length - 1) {
        // Swipe left → next post
        currentIndex++;
        renderPost(currentIndex);
    } else if (deltaX > 0 && currentIndex > 0) {
        // Swipe right → previous post
        currentIndex--;
        renderPost(currentIndex);
    }
}, { passive: true });
    
// --- Gallery layout helpers ---

function getImageOrientation(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth <= img.naturalHeight ? 'vertical' : 'horizontal');
        img.onerror = () => resolve('horizontal'); // safe fallback
        img.src = src;
    });
}

function getGalleryConfig(n, h1, h2) {
    // h1, h2 = 'vertical' | 'horizontal' | null
    // Returns { cols, cells[] }
    // Each cell: { cls: '' | 'wide' | 'tall' | 'large' }
    // 'wide'  = grid-column: span 2
    // 'tall'  = grid-row: span 2
    // 'large' = grid-column: span 2 AND grid-row: span 2

    const plain = (count) => Array(count).fill({ cls: '' });
    const hero1cls = (o) => o === 'vertical' ? 'tall' : 'wide';
    const hero2cls = (o) => o === 'vertical' ? 'tall' : 'wide';

    switch (n) {
        case 1:  return { cols: 1, cells: [{ cls: 'wide' }] };

        case 2:  return { cols: 2, cells: [{ cls: '' }, { cls: '' }] };

        case 3:  return {
            cols: 2,
            cells: [{ cls: hero1cls(h1) }, ...plain(2)]
        };

        case 4:  return { cols: 2, cells: plain(4) };

        case 5:  return {
            cols: 3,
            cells: [{ cls: hero1cls(h1) }, ...plain(4)]
        };

        case 6:  return { cols: 3, cells: plain(6) };

        case 7:  return {
            cols: 4,
            cells: [{ cls: hero1cls(h1) }, ...plain(6)]
        };

        case 8:  return { cols: 4, cells: plain(8) };

        case 9:  return { cols: 3, cells: plain(9) };

        case 10: {
            // hero2 goes below hero1 if h1 is horizontal, to the right if h1 is vertical
            const c1 = hero1cls(h1);
            const c2 = hero2cls(h2);
            return { cols: 4, cells: [{ cls: c1 }, { cls: c2 }, ...plain(8)] };
        }

        case 11: return {
            cols: 4,
            cells: [{ cls: hero1cls(h1) }, ...plain(10)]
        };

        case 12: return { cols: 4, cells: plain(12) };

        case 13: return {
            cols: 4,
            cells: [{ cls: 'large' }, ...plain(12)]
        };

        case 14: {
            const c1 = hero1cls(h1);
            const c2 = hero2cls(h2);
            return { cols: 4, cells: [{ cls: c1 }, { cls: c2 }, ...plain(12)] };
        }

        case 15: return { cols: 5, cells: plain(15) };

        case 16: return { cols: 4, cells: plain(16) };

        case 17: return {
            cols: 5,
            cells: [{ cls: 'large' }, ...plain(16)]
        };

        case 18: {
            const c1 = hero1cls(h1);
            const c2 = hero2cls(h2);
            return { cols: 5, cells: [{ cls: c1 }, { cls: c2 }, ...plain(16)] };
        }

        case 19: return {
            cols: 5,
            cells: [{ cls: hero1cls(h1) }, ...plain(18)]
        };

        case 20: return { cols: 5, cells: plain(20) };

        default: return { cols: 4, cells: plain(n) };
    }
}

function getMobileGalleryConfig(n, h1, h2) {
    // Mobile: max 3 cols, heroes can be 'wide' or 'tall', never 'large'
    // 1 col for n=1, 2 cols for n=2-4, 3 cols for n>=5
    const plain = (count) => Array(count).fill({ cls: '' });
    const hcls = (o) => o === 'vertical' ? 'tall' : 'wide';

    switch (n) {
        case 1:  return { cols: 1, cells: plain(1) };

        case 2:  return { cols: 2, cells: plain(2) };

        case 3:  return {
            cols: 2,
            cells: [{ cls: hcls(h1) }, ...plain(2)]
        };

        case 4:  return { cols: 2, cells: plain(4) };

        // --- 3 columns from here ---

        case 5:  return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(4)]
        };

        case 6:  return { cols: 3, cells: plain(6) };

        case 7:  return {
            cols: 3,
            // hero2 goes below hero1 if h1 is horizontal, to the right if h1 is vertical
            const c1 = hero1cls(h1);
            const c2 = hero2cls(h2);
            cells: [{ cls: c1 }, { cls: c2 }, ...plain(5)]
        };

        case 8:  return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(7)]
        };

        case 9:  return { cols: 3, cells: plain(9) };

        case 10: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, { cls: hcls(h2) }, ...plain(8)]
        };

        case 11: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(10)]
        };

        case 12: return { cols: 3, cells: plain(12) };

        case 13: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, { cls: hcls(h2) }, ...plain(11)]
        };

        case 14: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(13)]
        };

        case 15: return { cols: 3, cells: plain(15) };

        case 16: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, { cls: hcls(h2) }, ...plain(14)]
        };

        case 17: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(16)]
        };

        case 18: return { cols: 3, cells: plain(18) };

        case 19: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, { cls: hcls(h2) }, ...plain(17)]
        };

        case 20: return {
            cols: 3,
            cells: [{ cls: hcls(h1) }, ...plain(19)]
        };

        default: return { cols: 3, cells: plain(n) };
    }
}

let posts = [];
let currentIndex = getPostIndexFromHash();

    // Fetch posts data
    fetch(getDataPath() + '?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            posts = data;
            if (posts.length > 0) {
                currentIndex = getPostIndexFromHash();
                // If no hash provided (-1), default to newest post (last in array)
                if (currentIndex === -1) currentIndex = posts.length - 1;
                if (currentIndex >= posts.length) currentIndex = posts.length - 1;
                renderPost(currentIndex);
            }
        })
        .catch(error => console.error('Error loading posts:', error));

    function renderPost(index) {
        if (index < 0 || index >= posts.length) return;

        const post = posts[index];
        updateUrlHash(index);

        postArea.classList.remove('visible');

        setTimeout(() => {
            titleEl.textContent = post.title;
            dateEl.textContent = post.date;

            // Clear existing blocks
            postBody.innerHTML = '';

            // Render Blocks
            if (post.blocks && Array.isArray(post.blocks)) {
                post.blocks.forEach(block => {
                    const blockDiv = document.createElement('div');
                    blockDiv.className = 'post-block';

                    if (block.type === 'text') {
                        blockDiv.classList.add('post-block-text');
                        blockDiv.innerHTML = `<p>${block.content}</p>`;
                        postBody.appendChild(blockDiv);
		    } else if (block.type === 'image') {
		        blockDiv.classList.add('post-block-image');
		        const img = document.createElement('img');
		        img.src = getMediaPath(block.src);
		        img.alt = block.alt || '';
		        img.loading = 'lazy';
		        img.style.cursor = 'pointer';
		        img.addEventListener('click', () => openLightbox([{ src: block.src, alt: block.alt || '' }], 0));
		        blockDiv.appendChild(img);
		        postBody.appendChild(blockDiv);
		    
                    } else if (block.type === 'video') {
                        blockDiv.classList.add('post-block-video');
                        const video = document.createElement('video');
                        video.src = getMediaPath(block.src);
                        video.controls = true;
                        blockDiv.appendChild(video);
                        postBody.appendChild(blockDiv);
} else if (block.type === 'gallery') {
    blockDiv.classList.add('gallery-grid');
    const images = block.images;
    const count = images.length;

const isMobile = window.innerWidth <= 768;

// Counts that need h1 on desktop, mobile, or both
const needsH1 = [3, 5, 7, 8, 10, 11, 13, 14, 17, 18, 19, 20].includes(count);
// Counts that need h2 on desktop, mobile, or both
const needsH2 = [10, 13, 14, 16, 18, 19].includes(count);

const buildGrid = (h1, h2) => {
    blockDiv.innerHTML = '';
    const { cols, cells } = isMobile
        ? getMobileGalleryConfig(count, h1, h2)
        : getGalleryConfig(count, h1, h2);
    blockDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    images.forEach((imgData, i) => {
        const item = document.createElement('div');
        const cls = (cells[i] && cells[i].cls) ? cells[i].cls : '';
        item.className = ('gallery-item ' + cls).trim();

        const img = document.createElement('img');
        img.src = getMediaPath(imgData.src);
        img.alt = imgData.alt || '';
        img.loading = 'lazy';

        item.appendChild(img);
        item.addEventListener('click', () => openLightbox(images, i));
        blockDiv.appendChild(item);
    });
};

    if (needsH1 || needsH2) {
        // Render a plain grid immediately so the post doesn't look broken while loading
        buildGrid(null, null);

        const h1src = needsH1 ? getMediaPath(images[0].src) : null;
        const h2src = needsH2 ? getMediaPath(images[1].src) : null;

        Promise.all([
            h1src ? getImageOrientation(h1src) : Promise.resolve(null),
            h2src ? getImageOrientation(h2src) : Promise.resolve(null),
        ]).then(([h1, h2]) => {
            buildGrid(h1, h2);
        });
    } else {
        buildGrid(null, null);
    }

    postBody.appendChild(blockDiv);
}                });
            }

            prevBtn.disabled = index === 0;
            nextBtn.disabled = index === posts.length - 1;

            postArea.classList.add('visible');

            // Re-init lightbox if needed (ensure it exists)
            initLightbox();
        }, 400);
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderPost(currentIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < posts.length - 1) {
            currentIndex++;
            renderPost(currentIndex);
        }
    });

    window.addEventListener('hashchange', () => {
        const newIndex = getPostIndexFromHash();
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < posts.length) {
            currentIndex = newIndex;
            renderPost(currentIndex);
        }
    });
});
