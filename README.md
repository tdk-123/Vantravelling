# Wanderlust Travel Blog - Website Management Guide

Welcome! This guide explains how to update and manage your travel blog website.

---

## 📁 Folder Structure

```
travel_blog/
├── index.html              # Dutch homepage
├── about.html              # Dutch about page
├── blog.html               # Dutch blog page
├── en/                     # English versions
│   ├── index.html
│   ├── about.html
│   └── blog.html
├── css/
│   └── style.css           # All styling
├── js/
│   ├── main.js             # Blog navigation & language logic
│   └── contact.js          # Contact form logic
├── data/
│   ├── posts-nl.json       # Dutch blog posts
│   └── posts-en.json       # English blog posts
└── assets/
    ├── images/             # Photos for posts & site
    └── videos/             # Videos for posts (optional)
```

---

## ✏️ Updating Homepage Text

The text is now directly inside the HTML files for better simplicity and SEO.

### For Dutch text:
1. Open `index.html`.
2. Edit the text content directly within the tags (e.g., inside `<h1>`, `<p>`).

### For English text:
1. Open `en/index.html`.
2. Edit the text content directly within the tags.

---

## 🖼️ Adding Photos & Videos

### Location:
- **Photos**: Place in `assets/images/`
- **Videos**: Place in `assets/videos/`

### Supported Formats:
- **Images**: JPG, PNG, WebP, GIF
- **Videos**: MP4, WebM

### Tips:
- Use descriptive filenames (e.g., `alps-sunrise-2024.jpg`)
- Optimize images for web (aim for under 500KB)
- Recommended image sizes:
  - Blog posts: 1200x800 pixels
  - Preview cards: 800x600 pixels

---

## 📝 Creating a New Blog Post

### Step 1: Add your media
Place your photo or video in the `assets/images/` or `assets/videos/` folder.

### Step 2: Edit the Dutch posts file
Open `data/posts-nl.json` and add a new entry at the END of the array:

```json
{
    "id": 4,
    "title": "Jouw Titel Hier",
    "date": "25 december 2024",
    "mediaType": "image",
    "mediaSrc": "assets/images/your-photo.jpg",
    "content": "Jouw verhaal hier. Dit kan meerdere zinnen bevatten."
}
```

### Step 3: Edit the English posts file
Open `data/posts-en.json` and add the same post in English.

### Important notes:
- `id` must be unique (use the next number)
- `mediaType` is either `"image"` or `"video"`
- `mediaSrc` is the path to your file
- Posts appear in the order they're listed

---

## 🎨 Adding a Hero Background Image

To add a large background image on the homepage:

1. Place your image in `assets/images/` (e.g., `hero-background.jpg`)
2. Open `index.html` (Dutch) or `en/index.html` (English) and find the `<style>` block after `<body>`.
3. Update the `url(...)` to point to your new image.

---

## 🌐 Language Switching

The website has two languages:
- **Dutch** (default): Base URL (e.g., `yoursite.com/index.html`)
- **English**: `/en/` path (e.g., `yoursite.com/en/index.html`)

Users can switch languages by clicking the flag icons in the top-right corner.

---

## 🚀 Running Locally

To preview your website locally:

1. Open a terminal in the `travel_blog` folder
2. Run a simple server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx serve
   ```
3. Open `http://localhost:8000` in your browser

---

## 📧 Contact Form

### Local Simulation
The contact form currently runs in **simulation mode**. When you click submit:
1. It validates the fields.
2. It pauses to simulate a network request.
3. It shows a success message.
No email is actually sent.

### 🌍 Going Online (Production)
For a real website hosted on GitHub Pages or Netlify, you need an external service.

**Recommended Solution: Formspree**
1. Register at [formspree.io](https://formspree.io).
2. Create a new form and get your unique `form action` URL.
3. Update `contact.html` and `en/contact.html`:
```html
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
```
4. Remove the simulation script from `js/contact.js` or simply rely on the HTML form action.

---

Happy blogging! 🌍✈️
