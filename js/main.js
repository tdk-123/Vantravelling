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
    // ===== FIX STICKY HOVER ON TOUCH DEVICES =====
    document.querySelectorAll('.nav-arrow').forEach(btn => {
        btn.addEventListener('pointerdown', () => {
            btn.classList.add('pressed');
        });
        btn.addEventListener('pointerup', () => {
            setTimeout(() => btn.classList.remove('pressed'), 150);
        });
    });}
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
        images: [], // {src, alt}
        currentIndex: 0,
        el: null,
        imgEl: null,
        captionEl: null
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

        // Events
        lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
        lb.querySelector('.lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); prevImage(); });
        lb.querySelector('.lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); nextImage(); });
        lb.addEventListener('click', (e) => {
            if (e.target === lb) closeLightbox();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (!lightboxCtx.isOpen) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        });
        // Touch swipe for lightbox
        let lbTouchStartX = 0;
        lb.addEventListener('touchstart', (e) => {
            lbTouchStartX = e.touches[0].clientX;
        }, { passive: true });

        lb.addEventListener('touchend', (e) => {
            const deltaX = e.changedTouches[0].clientX - lbTouchStartX;
            if (Math.abs(deltaX) < 50) return;
            if (deltaX < 0) nextImage();
            else prevImage();
        }, { passive: true });
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
                        img.alt = block.alt;
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

                        // Collect all images in this gallery for the lightbox
                        const galleryImages = block.images;

                        block.images.forEach((imgData, imgIndex) => {
                            const item = document.createElement('div');
                            item.className = `gallery-item ${imgData.className || ''}`;

                            const img = document.createElement('img');
                            img.src = getMediaPath(imgData.src);
                            img.alt = imgData.alt;

                            item.appendChild(img);
                            item.addEventListener('click', () => {
                                openLightbox(galleryImages, imgIndex);
                            });

                            blockDiv.appendChild(item);
                        });
                        postBody.appendChild(blockDiv);
                    }
                });
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
