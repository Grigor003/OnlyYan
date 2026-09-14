document.addEventListener('DOMContentLoaded', () => {
    const defaultCollection = 'armenia';
    const defaultTheme = 'music';

    const catalog = {
        armenia: {
            id: '01',
            title: 'Armenia',
            themes: {
                music: {
                    id: '01.1',
                    title: 'Music',
                    products: [
                        { title: 'Yerevan', print: 'YEREVAN' },
                        { title: 'Gyumri', print: 'GYUMRI' },
                        { title: 'Hoktemberyan', print: 'HOKTEMBERYAN' },
                        { title: 'Dilijan', print: 'DILIJAN' },
                        { title: 'Kirovakan', print: 'KIROVAKAN' }
                    ]
                },
                movie: {
                    id: '01.2',
                    title: 'Movie',
                    products: [
                        { title: 'Arua', print: 'ARUA' },
                        { title: 'Aster', print: 'ASTER' },
                        { title: 'Talin', print: 'TALIN' },
                        { title: 'Narek', print: 'NAREK' },
                        { title: 'Yot', print: 'YOT' }
                    ]
                }
            }
        },
        france: {
            id: '02',
            title: 'France',
            themes: {
                music: {
                    id: '02.1',
                    title: 'Music',
                    products: [
                        { title: 'Paris', print: 'PARIS' },
                        { title: 'Lyon', print: 'LYON' },
                        { title: 'Marseille', print: 'MARSEILLE' },
                        { title: 'Bordeaux', print: 'BORDEAUX' },
                        { title: 'Cannes', print: 'CANNES' }
                    ]
                },
                movie: {
                    id: '02.2',
                    title: 'Movie',
                    products: [
                        { title: 'Amelie', print: 'AMELIE' },
                        { title: 'Cine', print: 'CINE' },
                        { title: 'Cinema', print: 'CINEMA' },
                        { title: 'Reel', print: 'REEL' },
                        { title: 'Auteur', print: 'AUTEUR' }
                    ]
                }
            }
        },
        georgia: {
            id: '03',
            title: 'Georgia',
            themes: {
                music: {
                    id: '03.1',
                    title: 'Music',
                    products: [
                        { title: 'Tbilisi', print: 'TBILISI' },
                        { title: 'Batumi', print: 'BATUMI' },
                        { title: 'Kutaisi', print: 'KUTAISI' },
                        { title: 'Rustavi', print: 'RUSTAVI' },
                        { title: 'Zugdidi', print: 'ZUGDIDI' }
                    ]
                },
                movie: {
                    id: '03.2',
                    title: 'Movie',
                    products: [
                        { title: 'Cinema', print: 'CINEMA' },
                        { title: 'Director', print: 'DIRECTOR' },
                        { title: 'Montage', print: 'MONTAGE' },
                        { title: 'Screen', print: 'SCREEN' },
                        { title: 'Drama', print: 'DRAMA' }
                    ]
                }
            }
        },
        italy: {
            id: '04',
            title: 'Italy',
            themes: {
                music: {
                    id: '04.1',
                    title: 'Music',
                    products: [
                        { title: 'Rome', print: 'ROME' },
                        { title: 'Milan', print: 'MILAN' },
                        { title: 'Venice', print: 'VENICE' },
                        { title: 'Florence', print: 'FLORENCE' },
                        { title: 'Naples', print: 'NAPLES' }
                    ]
                },
                movie: {
                    id: '04.2',
                    title: 'Movie',
                    products: [
                        { title: 'Neorealism', print: 'NEOREALISM' },
                        { title: 'Sicilia', print: 'SICILIA' },
                        { title: 'Dolce', print: 'DOLCE' },
                        { title: 'Regista', print: 'REGISTA' },
                        { title: 'Luce', print: 'LUCE' }
                    ]
                }
            }
        }
    };

    const collectionAliases = {
        '01': 'armenia',
        '02': 'france',
        '03': 'georgia',
        '04': 'italy'
    };

    const themeAliases = {
        '01.1': 'music',
        '01.2': 'movie',
        '02.1': 'music',
        '02.2': 'movie',
        '03.1': 'music',
        '03.2': 'movie',
        '04.1': 'music',
        '04.2': 'movie'
    };

    const query = new URLSearchParams(window.location.search);
    const collectionParam = query.get('collection');
    const normalizedCollectionValue = collectionParam ? collectionParam.trim().toLowerCase() : null;
    const normalizedCollection = collectionAliases[normalizedCollectionValue] || normalizedCollectionValue;
    const collectionKey = catalog[normalizedCollection] ? normalizedCollection : defaultCollection;
    const collection = catalog[collectionKey];

    const themeParam = query.get('theme');
    const normalizedThemeValue = themeParam ? themeParam.trim().toLowerCase() : null;
    const normalizedTheme = themeAliases[normalizedThemeValue] || normalizedThemeValue;
    const themeKey = collection.themes[normalizedTheme] ? normalizedTheme : defaultTheme;
    const theme = collection.themes[themeKey];

    const titleEl = document.getElementById('hits-title');
    const subtitleEl = document.getElementById('hits-subtitle');
    const taglineEl = document.querySelector('.section-intro p:last-of-type');
    const gridEl = document.getElementById('hits-grid');

    if (!gridEl) {
        return;
    }

    if (titleEl) {
        titleEl.textContent = `${collection.title.toUpperCase()} ${collection.id}`;
    }

    if (subtitleEl) {
        subtitleEl.textContent = `${collection.title} ${theme.title} ${theme.id}`;
    }

    if (taglineEl) {
        taglineEl.textContent = `${collection.title} ${theme.title} Collection`;
    }

    document.title = `${collection.title} ${theme.title} | OnlyYan`;

    gridEl.innerHTML = '';

    theme.products.forEach((product, index) => {
        const itemId = `${theme.id}.${index + 1}`;
        const card = document.createElement('a');
        card.className = `product-card card-${index + 1}`;
        card.href = `constructor.html?exclusive=${encodeURIComponent(`${collection.title} ${theme.title} ${product.title}`)}&id=${encodeURIComponent(itemId)}&collection=${encodeURIComponent(collectionKey)}&theme=${encodeURIComponent(themeKey)}`;
        card.setAttribute('aria-label', `Open ${collection.title} ${theme.title} ${product.title}`);

        const imageBox = document.createElement('div');
        imageBox.className = 'image-box';

        const img = document.createElement('img');
        img.className = 'tshirt-img';
        img.src = 'assets/images/tshirt-front-new.png';
        img.loading = 'lazy';
        img.alt = `${collection.title} ${theme.title} ${product.title} t-shirt`;

        const print = document.createElement('span');
        print.className = 'tshirt-print';
        print.textContent = product.print;

        imageBox.appendChild(img);
        imageBox.appendChild(print);

        const meta = document.createElement('div');
        meta.className = 'product-meta';

        const id = document.createElement('span');
        id.className = 'product-id';
        id.textContent = `[${itemId}]`;

        const title = document.createElement('span');
        title.className = 'product-title';
        title.textContent = `${collection.title} ${theme.title} ${product.title}`;

        meta.appendChild(id);
        meta.appendChild(title);

        card.appendChild(imageBox);
        card.appendChild(meta);

        gridEl.appendChild(card);
    });

    console.assert(
        gridEl.children.length === theme.products.length,
        `Expected ${theme.products.length} cards, got ${gridEl.children.length}`
    );
});
