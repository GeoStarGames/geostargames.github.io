const games = [
    { name: 'Break The Siege', file_name: 'BreakTheSiege', imageSrc: 'Games/BreakTheSiege/logo.png' },
    { name: 'Potion Cooker', file_name: 'BreakTheSiege', imageSrc: 'Games/PotionCooker/logo.png' }
    
];

function createGameBlocks() {
    const container = document.getElementById('projects-block');

    games.forEach(game => {
        const block = document.createElement('div');
        block.className = 'about-project-block';

        const link = document.createElement('a');
        link.href='Games/'+game.file_name+'/GameData/main.html';

        const img = document.createElement('img');
        img.className = 'about-project-image-block';
        img.src = game.imageSrc;
        img.draggable = false;

        const title = document.createElement('p');
        title.className = 'about-project-image-block-title';
        title.textContent = game.name;

        link.appendChild(img);
        block.appendChild(link);
        block.appendChild(title);
        container.appendChild(block);
    });
}

createGameBlocks();

function searchProjects() {
    const searchQuery = document.getElementById('search-bar').value.toLowerCase();
    const projectBlocks = document.querySelectorAll('#projects-block .about-project-block');
    let found = false;

    const existingNoResults = document.getElementById('no-results');
    if (existingNoResults) {
        existingNoResults.remove();
    }

    projectBlocks.forEach(block => {
        const title = block.querySelector('.about-project-image-block-title').textContent.toLowerCase();
        if (title.includes(searchQuery)) {
            block.style.display = 'block';
            found = true;
        } else {
            block.style.display = 'none';
        }
    });

    if (!found) {
        const noResults = document.createElement('p');
        noResults.id = 'no-results';
        noResults.textContent = 'No results found :<';
        noResults.style.fontStyle = 'italic';
        noResults.style.color = '#555';
        document.getElementById('projects-block').appendChild(noResults);
    }
}

document.getElementById('search-bar').addEventListener('input', searchProjects);