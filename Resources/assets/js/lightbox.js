const Lightbox = {
    overlay: null,
    imageContainer: null,
    image: null,
    closeBtn: null,
    prevBtn: null,
    nextBtn: null,
    counter: null,
    images: [],
    currentIndex: 0,
    isOpen: false,
    scale: 1,
    translateX: 0,
    translateY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    lastTranslateX: 0,
    lastTranslateY: 0,

    init() {
        this.createOverlay();
        this.bindEvents();
        this.attachToImages();
    },

    createOverlay() {
        if (document.getElementById('lightbox-overlay')) {
            this.overlay = document.getElementById('lightbox-overlay');
            this.imageContainer = this.overlay.querySelector('.lightbox-image-container');
            this.image = this.overlay.querySelector('.lightbox-image');
            this.closeBtn = this.overlay.querySelector('.lightbox-close');
            this.prevBtn = this.overlay.querySelector('.lightbox-prev');
            this.nextBtn = this.overlay.querySelector('.lightbox-next');
            this.counter = this.overlay.querySelector('.lightbox-counter');
            return;
        }

        this.overlay = document.createElement('div');
        this.overlay.id = 'lightbox-overlay';
        this.overlay.className = 'lightbox-overlay';
        this.overlay.innerHTML = `
            <button class="lightbox-close" aria-label="Close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <button class="lightbox-prev" aria-label="Previous">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <button class="lightbox-next" aria-label="Next">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            <div class="lightbox-image-container">
                <img class="lightbox-image" src="" alt="">
            </div>
            <div class="lightbox-counter"></div>
        `;

        document.body.appendChild(this.overlay);

        this.imageContainer = this.overlay.querySelector('.lightbox-image-container');
        this.image = this.overlay.querySelector('.lightbox-image');
        this.closeBtn = this.overlay.querySelector('.lightbox-close');
        this.prevBtn = this.overlay.querySelector('.lightbox-prev');
        this.nextBtn = this.overlay.querySelector('.lightbox-next');
        this.counter = this.overlay.querySelector('.lightbox-counter');
    },

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.prev();
        });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        });

        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay || e.target === this.imageContainer) {
                this.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case '0':
                    this.resetZoom();
                    break;
            }
        });

        this.image.addEventListener('wheel', (e) => {
            if (!this.isOpen) return;
            e.preventDefault();

            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });

        this.image.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());

        this.image.addEventListener('touchstart', (e) => this.startDrag(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.drag(e), { passive: false });
        document.addEventListener('touchend', () => this.endDrag());

        this.image.addEventListener('dblclick', (e) => {
            e.preventDefault();
            if (this.scale > 1) {
                this.resetZoom();
            } else {
                this.scale = 2;
                this.updateTransform();
            }
        });
    },

    attachToImages() {
        const mdContents = document.querySelectorAll('.md-content:not([data-lightbox-initialized])');

        mdContents.forEach(container => {
            container.setAttribute('data-lightbox-initialized', 'true');

            const images = container.querySelectorAll('img');
            images.forEach(img => {
                if (img.closest('a')) return;
                
                img.style.cursor = 'zoom-in';
                img.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.openFromContainer(container, img);
                });
            });
        });
    },

    openFromContainer(container, clickedImg) {
        this.images = Array.from(container.querySelectorAll('img')).filter(img => !img.closest('a'));
        this.currentIndex = this.images.indexOf(clickedImg);
        this.open();
    },

    open() {
        if (this.images.length === 0) return;

        this.isOpen = true;
        this.resetZoom();
        this.updateImage();
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        this.prevBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
        this.nextBtn.style.display = this.images.length > 1 ? 'flex' : 'none';
        this.counter.style.display = this.images.length > 1 ? 'block' : 'none';
    },

    close() {
        this.isOpen = false;
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.resetZoom();
    },

    prev() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.resetZoom();
        this.updateImage();
    },

    next() {
        if (this.images.length <= 1) return;
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.resetZoom();
        this.updateImage();
    },

    updateImage() {
        const currentImg = this.images[this.currentIndex];
        this.image.src = currentImg.src;
        this.image.alt = currentImg.alt || '';

        if (this.images.length > 1) {
            this.counter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }
    },

    zoomIn() {
        this.scale = Math.min(this.scale * 1.2, 5);
        this.updateTransform();
    },

    zoomOut() {
        this.scale = Math.max(this.scale / 1.2, 0.5);
        if (this.scale <= 1) {
            this.translateX = 0;
            this.translateY = 0;
        }
        this.updateTransform();
    },

    resetZoom() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.updateTransform();
    },

    updateTransform() {
        this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
        this.image.style.cursor = this.scale > 1 ? 'grab' : 'zoom-in';
    },

    startDrag(e) {
        if (this.scale <= 1) return;

        this.isDragging = true;
        this.image.style.cursor = 'grabbing';

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.startX = clientX - this.translateX;
        this.startY = clientY - this.translateY;

        e.preventDefault();
    },

    drag(e) {
        if (!this.isDragging) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        this.translateX = clientX - this.startX;
        this.translateY = clientY - this.startY;

        this.updateTransform();
        e.preventDefault();
    },

    endDrag() {
        if (!this.isDragging) return;

        this.isDragging = false;
        this.image.style.cursor = this.scale > 1 ? 'grab' : 'zoom-in';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Lightbox.init();
});

document.addEventListener('htmx:afterSwap', () => {
    setTimeout(() => {
        Lightbox.attachToImages();
    }, 50);
});

document.addEventListener('widgetInitialized', () => {
    Lightbox.attachToImages();
});
