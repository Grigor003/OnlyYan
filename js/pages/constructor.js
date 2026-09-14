document.addEventListener('DOMContentLoaded', () => {
    const CANVAS_SIZE = 500;
    const MAX_LOGO_BYTES = 5 * 1024 * 1024;
    const DEFAULT_COLOR = '#2b2b2b';
    const LIGHT_SHIRT_COLOR = '#f4f0e8';
    const PRICE_CUSTOM = '18.900 AMD';
    const PRICE_EXCLUSIVE = '16.900 AMD';

    const nodes = {
        addTextBtn: document.getElementById('add-text-btn'),
        addLogoBtn: document.getElementById('add-logo-btn'),
        deleteBtn: document.getElementById('delete-btn'),
        logoUpload: document.getElementById('logo-upload'),
        textColor: document.getElementById('text-color'),
        textFont: document.getElementById('text-font'),
        standardTools: document.getElementById('standard-tools'),
        exclusiveTools: document.getElementById('exclusive-tools'),
        prodTitle: document.getElementById('prod-title'),
        orderBtn: document.getElementById('order-btn'),
        orderPhone: document.getElementById('order-phone'),
        orderEmail: document.getElementById('order-email'),
        orderAddress: document.getElementById('order-address'),
        orderSummary: document.getElementById('order-summary'),
        orderFeedback: document.getElementById('order-feedback'),
        price: document.querySelector('.price'),
        viewFront: document.getElementById('view-front'),
        viewBack: document.getElementById('view-back'),
        canvasFrontEl: document.getElementById('canvas-front'),
        canvasBackEl: document.getElementById('canvas-back'),
        tshirtCanvasFrontEl: document.getElementById('tshirt-canvas-front'),
        tshirtCanvasBackEl: document.getElementById('tshirt-canvas-back')
    };

    if (typeof fabric === 'undefined') {
        const unavailable = document.getElementById('constructor-unavailable');
        if (unavailable) {
            unavailable.classList.remove('is-hidden');
        }
        document.querySelectorAll('.tool-button, .view-btn, .size-btn, .color-dot, .buy-button, select').forEach((control) => {
            control.disabled = true;
        });
        return;
    }

    if (!nodes.canvasFrontEl || !nodes.canvasBackEl || !nodes.tshirtCanvasFrontEl || !nodes.tshirtCanvasBackEl) {
        return;
    }

    const query = new URLSearchParams(window.location.search);
    const cityParam = query.get('exclusive');
    const productIdParam = query.get('id');
    const collectionParam = query.get('collection');
    const themeParam = query.get('theme');

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

    function normalizeCollection(value) {
        if (!value) {
            return null;
        }

        const safe = value.trim().toLowerCase();
        const collections = ['armenia', 'france', 'georgia', 'italy'];
        if (collections.includes(safe)) {
            return safe;
        }

        return collectionAliases[safe] || null;
    }

    function normalizeTheme(value) {
        if (!value) {
            return null;
        }

        const safe = value.trim().toLowerCase();
        if (safe === 'music' || safe === 'movie') {
            return safe;
        }

        return themeAliases[safe] || null;
    }

    const collectionKey = normalizeCollection(collectionParam);
    const themeKey = normalizeTheme(themeParam);
    const state = {
        exclusiveCity: cityParam ? cityParam.trim() : null,
        productId: productIdParam ? productIdParam.trim() : null,
        collection: collectionKey,
        theme: themeKey,
        currentSide: 'front',
        currentColor: DEFAULT_COLOR,
        currentSize: 'M'
    };

    const canvasFront = new fabric.Canvas('canvas-front');
    const canvasBack = new fabric.Canvas('canvas-back');

    const tshirtFrontCtx = nodes.tshirtCanvasFrontEl.getContext('2d', { willReadFrequently: true });
    const tshirtBackCtx = nodes.tshirtCanvasBackEl.getContext('2d', { willReadFrequently: true });
    const tshirtImgs = {
        front: new Image(),
        back: new Image()
    };

    function showStatus(message) {
        if (!nodes.orderFeedback) {
            console.log(message);
            return;
        }
        nodes.orderFeedback.textContent = message;
    }

    function sanitizeFileName(value) {
        if (!value) {
            return 'custom';
        }
        const safe = value.replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 16);
        return safe || 'custom';
    }

    function isValidHex(color) {
        return /^#[0-9a-fA-F]{6}$/.test(color);
    }

    function setToolState(id, enabled) {
        const el = document.getElementById(id);
        if (!el) {
            return;
        }
        el.disabled = !enabled;
        el.setAttribute('aria-disabled', String(!enabled));
    }

    function getActiveCanvas() {
        return state.currentSide === 'front' ? canvasFront : canvasBack;
    }

    function updateExclusivePrintColor() {
        if (!state.exclusiveCity) {
            return;
        }
        const targetFill = state.currentColor === LIGHT_SHIRT_COLOR ? '#363330' : '#ffffff';
        [canvasFront, canvasBack].forEach((canvas) => {
            canvas.getObjects().forEach((obj) => {
                if (obj.__exclusivePrint) {
                    obj.set('fill', targetFill);
                }
            });
            canvas.renderAll();
        });
    }

    function createExclusivePrint() {
        const text = new fabric.Text(
            state.exclusiveCity.toUpperCase(),
            {
                left: canvasFront.getWidth() / 2,
                top: canvasFront.getHeight() * 0.45,
                originX: 'center',
                originY: 'center',
                fontFamily: 'Manrope',
                fontWeight: 900,
                fontSize: 24,
                fill: '#ffffff',
                letterSpacing: 3,
                selectable: false,
                evented: false,
                hasControls: false,
                hasBorders: false
            }
        );
        text.__exclusivePrint = true;
        canvasFront.add(text);
        canvasFront.centerObject(text);
        canvasFront.renderAll();
        updateExclusivePrintColor();
    }

    function applyColorToTshirt(ctx, img, hexColor) {
        if (!img.complete || img.naturalWidth === 0) {
            return;
        }

        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = hexColor;
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        ctx.globalCompositeOperation = 'source-over';

        if (hexColor === LIGHT_SHIRT_COLOR) {
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    function applyShirtColor(hexColor) {
        applyColorToTshirt(tshirtFrontCtx, tshirtImgs.front, hexColor);
        applyColorToTshirt(tshirtBackCtx, tshirtImgs.back, hexColor);
        state.currentColor = hexColor;
        updateExclusivePrintColor();
        canvasFront.renderAll();
        canvasBack.renderAll();
    }

    function updateToolButtonsColor(hexColor, selectedButton) {
        const buttons = document.querySelectorAll('.color-dot');
        buttons.forEach((btn) => {
            btn.classList.toggle('active', btn === selectedButton);
            btn.setAttribute('aria-checked', btn === selectedButton ? 'true' : 'false');
        });
        applyShirtColor(hexColor);
    }

    function setupSizeSelection() {
        const sizeBtns = document.querySelectorAll('.size-btn');
        sizeBtns.forEach((btn) => {
            const size = btn.getAttribute('data-size') || btn.textContent.trim();
            btn.addEventListener('click', () => {
                sizeBtns.forEach((item) => {
                    item.classList.remove('active');
                    item.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');
                state.currentSize = size;
            });
        });
    }

    function setupColorSelection() {
        const colorDots = document.querySelectorAll('.color-dot');
        colorDots.forEach((dot) => {
            dot.addEventListener('click', () => {
                const selected = dot.getAttribute('data-hex');
                if (!selected || !isValidHex(selected)) {
                    return;
                }
                updateToolButtonsColor(selected, dot);
            });
        });
    }

    function setupSideSwitcher() {
        const viewBtns = document.querySelectorAll('.view-btn');
        if (!viewBtns.length) {
            return;
        }

        viewBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const nextSide = btn.getAttribute('data-side');
                if (nextSide !== 'front' && nextSide !== 'back') {
                    return;
                }

                state.currentSide = nextSide;
                viewBtns.forEach((item) => {
                    const isActive = item === btn;
                    item.classList.toggle('active', isActive);
                    item.setAttribute('aria-pressed', String(isActive));
                });

                nodes.viewFront.classList.toggle('active', nextSide === 'front');
                nodes.viewBack.classList.toggle('active', nextSide === 'back');
            });
        });
    }

    // ponytail: только шрифты с армянскими глифами, Noto Sans страхует кириллицу
    const FONT_FALLBACKS = ['"Noto Sans"', '"Noto Sans Armenian"'];
    function parseFont(value) {
        const [family, weight] = (value || 'Noto Sans Armenian').split('|');
        return { family, weight: weight || 'bold' };
    }
    function fontStack(family) {
        return [`"${family}"`, ...FONT_FALLBACKS].join(',');
    }

    function applyFontFamily(canvas, obj, value) {
        const { family, weight } = parseFont(value);
        obj.set({ fontFamily: fontStack(family), fontWeight: weight });
        canvas.renderAll();
        if (document.fonts?.load) {
            Promise.allSettled([family, 'Noto Sans', 'Noto Sans Armenian'].map((f) => document.fonts.load(`${weight} 24px "${f}"`))).then(() => canvas.renderAll());
        }
    }

    function addTextLayer() {
        const canvas = getActiveCanvas();
        const color = nodes.textColor ? nodes.textColor.value : '#000';
        const font = nodes.textFont ? nodes.textFont.value : 'Noto Sans Armenian';
        const { family, weight } = parseFont(font);
        const text = new fabric.IText('Your Text', {
            left: canvas.getWidth() / 2,
            top: 120,
            originX: 'center',
            fontFamily: fontStack(family),
            fill: color,
            fontSize: 24,
            fontWeight: weight
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        applyFontFamily(canvas, text, font);
    }

    function addLogoLayer(event) {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }
        if (!file.type.startsWith('image/')) {
            showStatus('Only image files are allowed for logo upload.');
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            showStatus('File is too large. Maximum size is 5 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            fabric.Image.fromURL(loadEvent.target?.result, (image) => {
                if (!image) {
                    showStatus('Failed to add the logo.');
                    return;
                }

                const canvas = getActiveCanvas();
                const maxWidth = 130;
                const maxHeight = 130;
                const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);

                image.set({
                    left: canvas.getWidth() / 2,
                    top: canvas.getHeight() / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    cornerSize: 8
                });

                canvas.add(image);
                canvas.setActiveObject(image);
                canvas.renderAll();
            });
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    function deleteActiveObject() {
        const activeCanvas = getActiveCanvas();
        const activeObject = activeCanvas.getActiveObject();
        if (!activeObject) {
            showStatus('Select an element to delete.');
            return;
        }

        activeCanvas.remove(activeObject);
        activeCanvas.discardActiveObject();
        activeCanvas.renderAll();
        showStatus('Element deleted.');
    }

    function buildOrderText() {
        const size = state.currentSize || 'M';
        const type = state.exclusiveCity ? 'Exclusive Edition' : 'Custom Design';
        const product = `${nodes.prodTitle?.textContent || 'Custom Tee'} (${sanitizeFileName(state.productId)})`;
        const price = nodes.price ? nodes.price.textContent : '';

        return [
            `Product: ${product}`,
            `Type: ${type}`,
            `City: ${state.exclusiveCity || 'Custom'}`,
            `Size: ${size}`,
            `Color: ${state.currentColor}`,
            `Front/Back Objects: ${canvasFront.getObjects().length}/${canvasBack.getObjects().length}`,
            `Price: ${price}`
        ].join('\n');
    }

    function shirtMockup(fabricCanvas, shirtEl) {
        const full = document.createElement('canvas');
        full.width = 500;
        full.height = 500;
        const ctx = full.getContext('2d');
        ctx.drawImage(shirtEl, 0, 0, 500, 500);
        ctx.drawImage(fabricCanvas.getElement(), 125, 125, 250, 300);
        return full.toDataURL('image/png');
    }

    async function showOrderSummary() {
        if (!nodes.orderSummary || !nodes.orderFeedback) {
            return;
        }

        if (!state.exclusiveCity && !hasAnyUserObjects()) {
            showStatus('Add at least one element before ordering.');
            return;
        }

        const phone = nodes.orderPhone ? nodes.orderPhone.value.trim() : '';
        const email = nodes.orderEmail ? nodes.orderEmail.value.trim() : '';
        const address = nodes.orderAddress ? nodes.orderAddress.value.trim() : '';
        if (!phone) {
            showStatus('Leave your phone so we can contact you.');
            nodes.orderPhone.focus();
            return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            showStatus('Check your email address.');
            nodes.orderEmail.focus();
            return;
        }
        if (!address) {
            showStatus('Leave your delivery address.');
            nodes.orderAddress.focus();
            return;
        }

        const apiUrl = window.location.protocol.startsWith('http') ? '/api/orders' : 'http://127.0.0.1:5000/api/orders';
        const text = buildOrderText();
        nodes.orderSummary.textContent = text;
        nodes.orderSummary.classList.remove('is-hidden');

        nodes.orderBtn.disabled = true;
        const prevLabel = nodes.orderBtn.textContent;
        nodes.orderBtn.textContent = 'Sending...';
        try {
            canvasFront.discardActiveObject();
            canvasBack.discardActiveObject();
            canvasFront.renderAll();
            canvasBack.renderAll();
            const hasFront = canvasFront.getObjects().length > 0;
            const hasBack = canvasBack.getObjects().length > 0;
            const payload = {
                product_name: nodes.prodTitle ? nodes.prodTitle.textContent : 'Custom Tee',
                price: nodes.price ? nodes.price.textContent : '',
                size: state.currentSize || 'M',
                color: state.currentColor,
                phone,
                email,
                address,
                design_front: hasFront ? canvasFront.toDataURL('image/png') : '',
                design_back: hasBack ? canvasBack.toDataURL('image/png') : '',
                mockup_front: hasFront ? shirtMockup(canvasFront, nodes.tshirtCanvasFrontEl) : '',
                mockup_back: hasBack ? shirtMockup(canvasBack, nodes.tshirtCanvasBackEl) : ''
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('server answered ' + response.status);
            }
            const result = await response.json();
            showStatus(`Order placed! Your order number: ${result.order_id}`);
            nodes.orderBtn.textContent = 'Order sent';
        } catch (error) {
            showStatus(`Order failed (${error.message}). Check connection, or copy the summary manually.`);
            nodes.orderBtn.disabled = false;
            nodes.orderBtn.textContent = prevLabel;
        }
    }

    function hasAnyUserObjects() {
        return canvasFront.getObjects().some((obj) => !obj.__exclusivePrint) || canvasBack.getObjects().some((obj) => !obj.__exclusivePrint);
    }

    function setupBackLink() {
        const backLink = document.getElementById('back-link');
        if (!backLink) {
            return;
        }

        if (!state.collection || !state.theme) {
            backLink.href = 'hits.html';
            return;
        }

        const collectionName = {
            armenia: 'Armenia',
            france: 'France',
            georgia: 'Georgia',
            italy: 'Italy'
        }[state.collection];
        const themeName = state.theme === 'music' ? 'Music' : 'Movie';

        const params = new URLSearchParams({ collection: state.collection, theme: state.theme });
        backLink.href = `hits.html?${params.toString()}`;
        backLink.textContent = `← Back to ${collectionName} ${themeName}`;
        backLink.setAttribute('aria-label', `Back to ${collectionName} ${themeName}`);
    }

    function setupStandardTools() {
        if (!nodes.standardTools || !nodes.exclusiveTools) {
            return;
        }

        if (state.exclusiveCity) {
            nodes.standardTools.classList.add('is-hidden');
            nodes.exclusiveTools.classList.remove('is-hidden');
            return;
        }

        nodes.standardTools.classList.remove('is-hidden');
        nodes.exclusiveTools.classList.add('is-hidden');

        if (!nodes.addTextBtn || !nodes.addLogoBtn || !nodes.deleteBtn || !nodes.logoUpload || !nodes.textColor || !nodes.textFont) {
            return;
        }

        nodes.addTextBtn.addEventListener('click', addTextLayer);
        nodes.addLogoBtn.addEventListener('click', () => nodes.logoUpload.click());
        nodes.logoUpload.addEventListener('change', addLogoLayer);

        nodes.deleteBtn.addEventListener('click', deleteActiveObject);

        nodes.textColor.addEventListener('change', (event) => {
            const activeCanvas = getActiveCanvas();
            const activeObj = activeCanvas.getActiveObject();
            const color = event.target.value;
            if (activeObj && activeObj.type === 'i-text') {
                activeObj.set('fill', color);
                activeCanvas.renderAll();
            }
        });

        nodes.textFont.addEventListener('change', (event) => {
            const activeCanvas = getActiveCanvas();
            const activeObj = activeCanvas.getActiveObject();
            if (activeObj && activeObj.type === 'i-text') {
                applyFontFamily(activeCanvas, activeObj, event.target.value);
            }
        });
    }

    function setupCommonControls() {
        setupSizeSelection();
        setupColorSelection();
        setupSideSwitcher();

        if (nodes.orderBtn) {
            nodes.orderBtn.addEventListener('click', showOrderSummary);
        }

        const initialSizeBtn = document.querySelector('.size-btn.active[data-size]') || document.querySelector('.size-btn[data-size]');
        if (initialSizeBtn) {
            state.currentSize = initialSizeBtn.getAttribute('data-size') || initialSizeBtn.textContent.trim();
            initialSizeBtn.classList.add('active');
            initialSizeBtn.setAttribute('aria-checked', 'true');
            document.querySelectorAll('.size-btn').forEach((btn) => {
                if (btn !== initialSizeBtn) {
                    btn.setAttribute('aria-checked', 'false');
                }
            });
        }

        const initialColorDot = document.querySelector('.color-dot.active[data-hex]') || document.querySelector('.color-dot[data-hex]');
        if (initialColorDot) {
            state.currentColor = initialColorDot.getAttribute('data-hex');
            initialColorDot.classList.add('active');
            initialColorDot.setAttribute('aria-checked', 'true');
            document.querySelectorAll('.color-dot').forEach((btn) => {
                if (btn !== initialColorDot) {
                    btn.setAttribute('aria-checked', 'false');
                }
            });
        }

        if (nodes.price) {
            nodes.price.textContent = state.exclusiveCity ? PRICE_EXCLUSIVE : PRICE_CUSTOM;
        }

        if (state.exclusiveCity && state.productId) {
            const normalizedCity = state.exclusiveCity.toUpperCase();
            if (nodes.prodTitle) {
                nodes.prodTitle.textContent = `Tee [${sanitizeFileName(state.productId)}] ${normalizedCity}`;
            }
        }
    }

    function disableUnusedControls() {
        ['add-text-btn', 'add-logo-btn', 'delete-btn', 'text-color'].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) {
                return;
            }
            setToolState(id, false);
            el.style.opacity = 0.8;
        });
    }

    function init() {
        setupCommonControls();
        setupBackLink();
        setupStandardTools();

        if (state.exclusiveCity) {
            document.body.classList.add('mode-exclusive');
            disableUnusedControls();
            if (canvasFront.getObjects().every((obj) => !obj.__exclusivePrint)) {
                createExclusivePrint();
            }
        }

        tshirtImgs.front.src = 'assets/images/tshirt-front-new.png';
        tshirtImgs.back.src = 'assets/images/tshirt-back-new.png';

        tshirtImgs.front.onload = () => {
            applyShirtColor(state.currentColor);
        };
        tshirtImgs.back.onload = () => {
            applyShirtColor(state.currentColor);
        };
    }

    init();
});
