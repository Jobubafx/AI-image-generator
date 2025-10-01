// Configuration
const CONFIG = {
    openRouterApiKey: import.meta.env?.VITE_OPENROUTER_API_KEY || process.env?.OPENROUTER_API_KEY,
    openRouterUrl: 'https://openrouter.ai/api/v1/chat/completions',
    nanoBananaModel: 'google/gemini-2.5-pro-preview-03-25:free', // Using Gemini 2.5 Pro via OpenRouter
    geminiFlashModel: 'google/gemini-2.0-flash-exp:free'
};

// Application State
class AppState {
    constructor() {
        this.uploadedImages = [];
        this.selectedStyle = '';
        this.selectedRatio = '9:16';
        this.conceptPrompt = '';
        this.generatedImages = [];
        this.gallery = JSON.parse(localStorage.getItem('aiGallery') || '[]');
        this.currentGeneratedImage = null;
    }

    saveToGallery(imageData) {
        const galleryItem = {
            id: Date.now().toString(),
            imageUrl: imageData,
            style: this.selectedStyle,
            ratio: this.selectedRatio,
            concept: this.conceptPrompt,
            timestamp: new Date().toISOString()
        };
        
        this.gallery.unshift(galleryItem);
        localStorage.setItem('aiGallery', JSON.stringify(this.gallery));
        return galleryItem;
    }

    clearGallery() {
        this.gallery = [];
        localStorage.removeItem('aiGallery');
    }

    removeFromGallery(id) {
        this.gallery = this.gallery.filter(item => item.id !== id);
        localStorage.setItem('aiGallery', JSON.stringify(this.gallery));
    }
}

// Initialize app
const appState = new AppState();

// DOM Elements
const elements = {
    // Sections
    uploadSection: document.getElementById('upload-section'),
    styleSection: document.getElementById('style-section'),
    conceptSection: document.getElementById('concept-section'),
    progressSection: document.getElementById('progress-section'),
    resultsSection: document.getElementById('results-section'),
    refinementSection: document.getElementById('refinement-section'),
    gallerySection: document.getElementById('gallery-section'),
    
    // Upload elements
    uploadArea: document.getElementById('upload-area'),
    fileInput: document.getElementById('file-input'),
    imagePreview: document.getElementById('image-preview'),
    analyzeBtn: document.getElementById('analyze-btn'),
    generateDirectBtn: document.getElementById('generate-direct-btn'),
    
    // Style elements
    styleInputs: document.querySelectorAll('input[name="style"]'),
    ratioInputs: document.querySelectorAll('input[name="ratio"]'),
    backToUpload: document.getElementById('back-to-upload'),
    proceedToConcept: document.getElementById('proceed-to-concept'),
    
    // Concept elements
    conceptTypeInputs: document.querySelectorAll('input[name="concept-type"]'),
    conceptTopic: document.getElementById('concept-topic'),
    conceptPrompt: document.getElementById('concept-prompt'),
    generateConceptBtn: document.getElementById('generate-concept-btn'),
    backToStyle: document.getElementById('back-to-style'),
    generateImageBtn: document.getElementById('generate-image-btn'),
    
    // Progress elements
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    
    // Results elements
    generatedImage: document.getElementById('generated-image'),
    downloadBtn: document.getElementById('download-btn'),
    generateVariationBtn: document.getElementById('generate-variation-btn'),
    refineBtn: document.getElementById('refine-btn'),
    saveToGalleryBtn: document.getElementById('save-to-gallery-btn'),
    
    // Refinement elements
    refinePreview: document.getElementById('refine-preview'),
    refinementPrompt: document.getElementById('refinement-prompt'),
    applyRefinement: document.getElementById('apply-refinement'),
    cancelRefinement: document.getElementById('cancel-refinement'),
    
    // Gallery elements
    galleryGrid: document.getElementById('gallery-grid'),
    clearGallery: document.getElementById('clear-gallery'),
    
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    
    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingMessage: document.getElementById('loading-message')
};

// API Service
class OpenRouterService {
    constructor() {
        this.apiKey = CONFIG.openRouterApiKey;
        this.baseUrl = CONFIG.openRouterUrl;
    }

    async makeRequest(messages, model = CONFIG.nanoBananaModel, maxTokens = 4000) {
        if (!this.apiKey) {
            throw new Error('OpenRouter API key not configured. Please add it in Vercel environment variables.');
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Image Generator'
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async generateImagePrompt(style, uploadedImagesInfo, topic = '') {
        const prompt = this.buildImagePrompt(style, uploadedImagesInfo, topic);
        
        const messages = [
            {
                role: 'system',
                content: 'You are a creative AI assistant that generates detailed, professional image generation prompts. Create prompts that will produce high-quality, studio-grade images suitable for the specified design style.'
            },
            {
                role: 'user',
                content: prompt
            }
        ];

        return await this.makeRequest(messages, CONFIG.geminiFlashModel);
    }

    buildImagePrompt(style, uploadedImagesInfo, topic) {
        const aspectRatios = {
            '9:16': 'portrait (9:16 aspect ratio)',
            '1:1': 'square (1:1 aspect ratio)',
            '16:9': 'landscape (16:9 aspect ratio)',
            '3:4': 'vertical (3:4 aspect ratio)',
            '4:3': 'horizontal (4:3 aspect ratio)'
        };

        const ratioText = aspectRatios[appState.selectedRatio] || 'standard aspect ratio';

        let basePrompt = `Create a detailed, professional image generation prompt for a ${style} in ${ratioText}. `;
        
        if (topic) {
            basePrompt += `The main topic/theme is: "${topic}". `;
        }

        if (uploadedImagesInfo && uploadedImagesInfo.length > 0) {
            basePrompt += `Incorporate elements from ${uploadedImagesInfo.length} reference image(s). `;
        }

        basePrompt += `The image should be:
        - High quality, professional, studio-grade
        - Excellent lighting and composition
        - Suitable for commercial use
        - Visually appealing and engaging
        - Optimized for the specified design style

        Provide a comprehensive prompt that includes details about:
        - Style and aesthetic
        - Lighting and atmosphere
        - Composition and framing
        - Color palette
        - Key visual elements
        - Overall mood and feeling

        Make the prompt descriptive and specific enough to generate a professional-quality image.`;

        return basePrompt;
    }

    async generateImage(finalPrompt) {
        // For Nano Banana image generation via OpenRouter
        // Note: Actual image generation would depend on OpenRouter's available image generation models
        const messages = [
            {
                role: 'system',
                content: 'You are helping to generate images based on detailed prompts. Provide guidance for image generation.'
            },
            {
                role: 'user',
                content: `Generate an image based on this prompt: ${finalPrompt}

                Since direct image generation isn't available through this API endpoint, provide a detailed description of what the image should look like, and we'll use this for demonstration purposes.`
            }
        ];

        // For demonstration, we'll create a placeholder image
        // In a real implementation, you would use an actual image generation API
        return this.createPlaceholderImage(finalPrompt);
    }

    async createPlaceholderImage(prompt) {
        // Create a canvas-based placeholder image
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set dimensions based on selected aspect ratio
            const [width, height] = appState.selectedRatio.split(':').map(Number);
            canvas.width = 800;
            canvas.height = (800 * height) / width;

            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Add text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('AI Generated Image', canvas.width / 2, canvas.height / 2 - 20);
            
            ctx.font = '16px Arial';
            ctx.fillText(appState.selectedStyle, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText(`${width}:${height} Aspect Ratio`, canvas.width / 2, canvas.height / 2 + 50);

            resolve(canvas.toDataURL('image/png'));
        });
    }

    async removeBackground(imageData) {
        // Simulate background removal
        // In a real implementation, you would use a background removal API
        await this.simulateProgress('Removing background...', 2000);
        return imageData; // Return original for demo
    }

    async simulateProgress(message, duration) {
        return new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                updateProgress(progress, message);
                if (progress >= 100) {
                    clearInterval(interval);
                    resolve();
                }
            }, duration / 10);
        });
    }
}

const apiService = new OpenRouterService();

// UI Management
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update navigation
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.target === sectionId);
    });

    // Special handling for gallery
    if (sectionId === 'gallery-section') {
        renderGallery();
    }
}

function updateProgress(percent, message) {
    if (elements.progressFill) {
        elements.progressFill.style.width = `${percent}%`;
    }
    if (elements.progressText) {
        elements.progressText.textContent = message;
    }
}

function showLoading(message = 'Processing your request...') {
    if (elements.loadingMessage) {
        elements.loadingMessage.textContent = message;
    }
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('show');
    }
}

// Image Handling
function handleFileSelect(files) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    Array.from(files).forEach(file => {
        if (!validTypes.includes(file.type)) {
            alert('Please upload only JPEG, PNG, or WebP images.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            appState.uploadedImages.push({
                data: imageData,
                name: file.name,
                type: file.type
            });
            renderImagePreviews();
            updateActionButtons();
        };
        reader.readAsDataURL(file);
    });
}

function renderImagePreviews() {
    elements.imagePreview.innerHTML = '';
    
    appState.uploadedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${image.data}" alt="Preview ${index + 1}">
            <button class="remove-image" onclick="removeUploadedImage(${index})">×</button>
        `;
        elements.imagePreview.appendChild(previewItem);
    });
}

function removeUploadedImage(index) {
    appState.uploadedImages.splice(index, 1);
    renderImagePreviews();
    updateActionButtons();
}

function updateActionButtons() {
    const hasImages = appState.uploadedImages.length > 0;
    elements.analyzeBtn.disabled = !hasImages;
    elements.generateDirectBtn.disabled = !hasImages;
}

// Event Handlers
function setupEventListeners() {
    // File upload
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

    // Drag and drop
    elements.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.add('dragover');
    });

    elements.uploadArea.addEventListener('dragleave', () => {
        elements.uploadArea.classList.remove('dragover');
    });

    elements.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadArea.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });

    // Analyze button
    elements.analyzeBtn.addEventListener('click', async () => {
        if (appState.uploadedImages.length === 0) return;

        showLoading('Analyzing images and removing backgrounds...');
        try {
            // Process each image for background removal
            for (let i = 0; i < appState.uploadedImages.length; i++) {
                appState.uploadedImages[i].data = await apiService.removeBackground(
                    appState.uploadedImages[i].data
                );
            }
            
            renderImagePreviews();
            showSection('style-section');
        } catch (error) {
            alert('Error during image analysis: ' + error.message);
        } finally {
            hideLoading();
        }
    });

    // Direct generation
    elements.generateDirectBtn.addEventListener('click', () => {
        showSection('style-section');
    });

    // Style selection
    elements.styleInputs.forEach(input => {
        input.addEventListener('change', () => {
            appState.selectedStyle = input.value;
            elements.proceedToConcept.disabled = !appState.selectedStyle;
        });
    });

    // Aspect ratio selection
    elements.ratioInputs.forEach(input => {
        input.addEventListener('change', () => {
            appState.selectedRatio = input.value;
        });
    });

    // Navigation
    elements.backToUpload.addEventListener('click', () => showSection('upload-section'));
    elements.proceedToConcept.addEventListener('click', () => showSection('concept-section'));

    // Concept generation
    elements.generateConceptBtn.addEventListener('click', generateConcept);
    elements.generateImageBtn.addEventListener('click', generateImage);

    // Concept type toggle
    elements.conceptTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const isManual = e.target.value === 'manual';
            elements.generateConceptBtn.disabled = isManual;
            if (isManual) {
                elements.conceptPrompt.placeholder = 'Enter your custom prompt here...';
            } else {
                elements.conceptPrompt.placeholder = 'AI will generate a creative concept based on your images and selected style...';
            }
        });
    });

    // Back to style
    elements.backToStyle.addEventListener('click', () => showSection('style-section'));

    // Image actions
    elements.downloadBtn.addEventListener('click', downloadGeneratedImage);
    elements.generateVariationBtn.addEventListener('click', generateVariation);
    elements.refineBtn.addEventListener('click', () => {
        elements.refinePreview.src = elements.generatedImage.src;
        showSection('refinement-section');
    });
    elements.saveToGalleryBtn.addEventListener('click', saveToGallery);

    // Refinement
    elements.applyRefinement.addEventListener('click', applyRefinement);
    elements.cancelRefinement.addEventListener('click', () => showSection('results-section'));

    // Gallery
    elements.clearGallery.addEventListener('click', clearGallery);

    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.target));
    });

    // Suggestions dropdown
    setupSuggestionsDropdown();
}

function setupSuggestionsDropdown() {
    const toggle = document.querySelector('.suggestions-toggle');
    const menu = document.querySelector('.suggestions-menu');
    const textarea = elements.refinementPrompt;

    if (toggle && menu) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('show');
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            menu.classList.remove('show');
        });

        // Handle suggestion selection
        menu.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                textarea.value = item.textContent;
                menu.classList.remove('show');
            });
        });
    }
}

// Core Functions
async function generateConcept() {
    if (!appState.selectedStyle) {
        alert('Please select a design style first.');
        return;
    }

    showLoading('Generating creative concept...');
    try {
        const uploadedImagesInfo = appState.uploadedImages.map(img => ({
            name: img.name,
            type: img.type
        }));

        const topic = elements.conceptTopic.value;
        const concept = await apiService.generateImagePrompt(
            appState.selectedStyle,
            uploadedImagesInfo,
            topic
        );

        elements.conceptPrompt.value = concept;
        appState.conceptPrompt = concept;
    } catch (error) {
        alert('Error generating concept: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function generateImage() {
    let finalPrompt = '';

    if (document.querySelector('input[name="concept-type"]:checked').value === 'manual') {
        finalPrompt = elements.conceptPrompt.value;
    } else {
        finalPrompt = appState.conceptPrompt;
    }

    if (!finalPrompt.trim()) {
        alert('Please generate or enter a concept prompt first.');
        return;
    }

    showSection('progress-section');
    
    try {
        updateProgress(10, 'Initializing image generation...');
        
        // Add style and ratio context to prompt
        const enhancedPrompt = `${finalPrompt}. Style: ${appState.selectedStyle}. Aspect ratio: ${appState.selectedRatio}. High quality, professional, studio-grade image.`;
        
        updateProgress(30, 'Generating image with AI...');
        const imageData = await apiService.generateImage(enhancedPrompt);
        
        updateProgress(90, 'Finalizing image...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        appState.currentGeneratedImage = imageData;
        elements.generatedImage.src = imageData;
        
        updateProgress(100, 'Complete!');
        setTimeout(() => showSection('results-section'), 500);
        
    } catch (error) {
        alert('Error generating image: ' + error.message);
        showSection('concept-section');
    }
}

async function generateVariation() {
    if (!appState.currentGeneratedImage) return;
    
    showLoading('Generating variation...');
    try {
        // For variation, we can modify the existing prompt slightly
        const variationPrompt = appState.conceptPrompt + ' Create a variation with different colors and composition.';
        const imageData = await apiService.generateImage(variationPrompt);
        
        appState.currentGeneratedImage = imageData;
        elements.generatedImage.src = imageData;
    } catch (error) {
        alert('Error generating variation: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function applyRefinement() {
    const refinementText = elements.refinementPrompt.value.trim();
    if (!refinementText) {
        alert('Please enter refinement instructions.');
        return;
    }

    showLoading('Applying refinements...');
    try {
        // Enhanced prompt with refinements
        const refinedPrompt = `${appState.conceptPrompt}. Refinements: ${refinementText}. Maintain high quality and professional appearance.`;
        const imageData = await apiService.generateImage(refinedPrompt);
        
        appState.currentGeneratedImage = imageData;
        elements.generatedImage.src = imageData;
        
        showSection('results-section');
    } catch (error) {
        alert('Error applying refinements: ' + error.message);
    } finally {
        hideLoading();
    }
}

function downloadGeneratedImage() {
    if (!appState.currentGeneratedImage) return;
    
    const link = document.createElement('a');
    link.download = `ai-generated-${appState.selectedStyle}-${Date.now()}.png`;
    link.href = appState.currentGeneratedImage;
    link.click();
}

function saveToGallery() {
    if (!appState.currentGeneratedImage) return;
    
    const galleryItem = appState.saveToGallery(appState.currentGeneratedImage);
    alert('Image saved to gallery!');
    renderGallery();
}

function renderGallery() {
    if (!elements.galleryGrid) return;
    
    if (appState.gallery.length === 0) {
        elements.galleryGrid.innerHTML = '<p class="no-images">No images in gallery yet.</p>';
        return;
    }

    elements.galleryGrid.innerHTML = appState.gallery.map(item => `
        <div class="gallery-item">
            <img src="${item.imageUrl}" alt="Generated image">
            <div class="gallery-item-actions">
                <button onclick="downloadGalleryImage('${item.id}')" title="Download">📥</button>
                <button onclick="deleteGalleryImage('${item.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function downloadGalleryImage(id) {
    const item = appState.gallery.find(img => img.id === id);
    if (item) {
        const link = document.createElement('a');
        link.download = `gallery-image-${id}.png`;
        link.href = item.imageUrl;
        link.click();
    }
}

function deleteGalleryImage(id) {
    if (confirm('Are you sure you want to delete this image from the gallery?')) {
        appState.removeFromGallery(id);
        renderGallery();
    }
}

function clearGallery() {
    if (confirm('Are you sure you want to clear all images from the gallery? This cannot be undone.')) {
        appState.clearGallery();
        renderGallery();
    }
}

// Global functions for HTML event handlers
window.removeUploadedImage = removeUploadedImage;
window.downloadGalleryImage = downloadGalleryImage;
window.deleteGalleryImage = deleteGalleryImage;

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateActionButtons();
    renderGallery();
    
    // Check for API key
    if (!CONFIG.openRouterApiKey) {
        console.warn('OpenRouter API key not found. Please set it in Vercel environment variables.');
    }
});
