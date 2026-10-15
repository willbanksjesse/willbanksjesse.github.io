# Jesse Willbanks — Portfolio

Multi-page portfolio site built with HTML, CSS, JavaScript, and Bootstrap 5.3.

## Structure

```
index.html        Home / About
skills.html       Skills (click a skill to see where it was used)
experience.html   Experience & Education
projects.html     Projects, generated from data/projects.json
contact.html      Contact
css/style.css     Custom styles (palette, type, light/dark themes)
js/script.js      All JavaScript
data/projects.json  Project data
images/           Photos and certificate images
```

## Run locally

The Projects page loads `data/projects.json` with `fetch()`, so open the site through a local server, not by double-clicking the file:

- VS Code: install **Live Server**, right-click `index.html` → *Open with Live Server*
- Or from this folder: `python -m http.server 8000`, then visit http://localhost:8000

## JavaScript features

- Projects fetched from JSON, converted to objects, and rendered as Bootstrap cards in a loop
- Category filter buttons (built from the categories in the JSON) and keyword search
- Project details in a Bootstrap modal with an image carousel
- Dark/light mode toggle, remembered between visits
- Greeting based on the visitor's time of day, skills detail panel, copy-email button, back-to-top button

## Adding a project

Add an object to `data/projects.json` with `title`, `category`, `description`, and `technologies` (plus optional `subtitle`, `role`, `date`, `highlights`, `impact`, `images`). A new category automatically gets its own filter button.
