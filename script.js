// Constants
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const mainKeywordInput = document.getElementById('mainKeyword');
const backgroundInfoInput = document.getElementById('backgroundInfo');
const charCountSpan = document.getElementById('charCount');
const generateOutlineBtn = document.getElementById('generateOutline');
const writeArticleBtn = document.getElementById('writeArticle');
const outlineOutput = document.getElementById('outlineOutput');
const articleOutput = document.getElementById('articleOutput');
const copyArticleBtn = document.getElementById('copyArticle');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
backgroundInfoInput.addEventListener('input', updateCharCount);
generateOutlineBtn.addEventListener('click', generateOutline);
writeArticleBtn.addEventListener('click', writeArticle);
copyArticleBtn.addEventListener('click', copyArticleToClipboard);
apiKeyInput.addEventListener('change', fetchModels);

async function initializeApp() {
    updateCharCount();
    if (apiKeyInput.value) {
        await fetchModels();
    }
}

async function fetchModels() {
    if (!apiKeyInput.value) return;

    try {
        modelSelect.innerHTML = '<option value="">Loading models...</option>';
        const response = await fetch(`${OPENROUTER_API_URL}/models`, {
            headers: {
                'Authorization': `Bearer ${apiKeyInput.value}`,
                'HTTP-Referer': window.location.href,
                'X-Title': "Alex's Simple Writer"
            }
        });

        if (!response.ok) throw new Error('Failed to fetch models');

        const data = await response.json();
        const models = data.data
            .map(model => ({
                id: model.id,
                name: model.name || model.id
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        modelSelect.innerHTML = models
            .map(model => `<option value="${model.id}">${model.name}</option>`)
            .join('');
    } catch (error) {
        console.error('Error fetching models:', error);
        modelSelect.innerHTML = '<option value="">Failed to load models</option>';
        alert('Failed to fetch models. Please check your API key.');
    }
}

function updateCharCount() {
    const count = backgroundInfoInput.value.length;
    charCountSpan.textContent = count;
    charCountSpan.style.color = count >= 50000 ? 'red' : '#64748b';
}

async function generateOutline() {
    if (!validateInputs()) return;

    try {
        generateOutlineBtn.disabled = true;
        generateOutlineBtn.classList.add('loading');
        
        const prompt = `Based on the main keyword "${mainKeywordInput.value}"${
            backgroundInfoInput.value ? ` and the following background information:\n\n${backgroundInfoInput.value}\n\n` : ', '
        }generate an SEO-optimized outline that perfectly and directly addresses the search intent of a user searching for the main keyword, adds no fluff and is concise and to the point. Alvways use brazilian portuguese language`;

        outlineOutput.innerHTML = 'Generating outline...';
        const response = await makeOpenRouterRequest(prompt);
        outlineOutput.innerHTML = response.replace(/\n/g, '<br>');
    } catch (error) {
        console.error('Error generating outline:', error);
        outlineOutput.innerHTML = 'Failed to generate outline. Please try again.';
    } finally {
        generateOutlineBtn.disabled = false;
        generateOutlineBtn.classList.remove('loading');
    }
}

async function writeArticle() {
    if (!validateInputs() || !outlineOutput.innerHTML) {
        alert('Please generate an outline first');
        return;
    }

    try {
        writeArticleBtn.disabled = true;
        writeArticleBtn.classList.add('loading');
        
        const prompt = `Use markdown formatting, bolded words, lists and tables to write a 2000 word article based on the main keyword "${mainKeywordInput.value}", ${
            backgroundInfoInput.value ? 'the following background information:\n\n' + backgroundInfoInput.value + '\n\nand ' : ''
        }the following outline:\n\n${outlineOutput.innerHTML.replace(/<br>/g, '\n')}`;

        articleOutput.innerHTML = 'Generating article...';
        const response = await makeOpenRouterRequest(prompt);
        articleOutput.innerHTML = response.replace(/\n/g, '<br>');
    } catch (error) {
        console.error('Error writing article:', error);
        articleOutput.innerHTML = 'Failed to generate article. Please try again.';
    } finally {
        writeArticleBtn.disabled = false;
        writeArticleBtn.classList.remove('loading');
    }
}

async function makeOpenRouterRequest(prompt) {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeyInput.value}`,
            'HTTP-Referer': window.location.href,
            'X-Title': "Alex's Simple Writer"
        },
        body: JSON.stringify({
            model: modelSelect.value,
            messages: [{
                role: 'user',
                content: prompt
            }]
        })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.choices[0].message.content;
}

function validateInputs() {
    if (!apiKeyInput.value) {
        alert('Please enter your OpenRouter API key');
        apiKeyInput.focus();
        return false;
    }
    if (!modelSelect.value) {
        alert('Please select a model');
        modelSelect.focus();
        return false;
    }
    if (!mainKeywordInput.value) {
        alert('Please enter a main keyword');
        mainKeywordInput.focus();
        return false;
    }
    return true;
}

async function copyArticleToClipboard() {
    try {
        const articleText = articleOutput.innerHTML.replace(/<br>/g, '\n');
        await navigator.clipboard.writeText(articleText);
        const originalText = copyArticleBtn.textContent;
        copyArticleBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyArticleBtn.textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy article to clipboard');
    }
}
