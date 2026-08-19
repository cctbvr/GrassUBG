/**
 * GrassUBG Proxy Configuration
 * Ultraviolet proxy integration for censorship evasion
 */

class GrassProxy {
    constructor() {
        // Ultraviolet proxy endpoint - use your own deployment
        this.proxyEndpoint = 'https://grass-ubg-git-main-cctbvrs-projects.vercel.app/uv/';
        this.cacheMap = new Map();
    }

    detectProxyEndpoint() {
        // Priority order for proxy detection
        const endpoints = [
            // Self-hosted Ultraviolet
            `${window.location.origin}/uv/`,
            // Fallback endpoints (replace with your own deployment)
            'https://uv.example.com/',
            // Development fallback
            '/proxy/',
        ];

        return endpoints[0]; // Use the first available
    }

    /**
     * Encode URL for Ultraviolet proxy
     */
    encodeProxyURL(url) {
        // Ensure proper URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        try {
            const proxyURL = new URL(this.proxyEndpoint);
            return `${this.proxyEndpoint}?url=${encodeURIComponent(url)}`;
        } catch (e) {
            console.error('Invalid proxy endpoint:', e);
            return null;
        }
    }

    /**
     * Open URL in proxy viewer
     */
    async openInProxy(url) {
        const encodedURL = this.encodeProxyURL(url);
        
        if (!encodedURL) {
            alert('Proxy not configured. Please set up Ultraviolet.');
            return;
        }

        // Open in game viewer iframe
        const gameViewer = document.getElementById('game-viewer-overlay');
        const gameIframe = document.getElementById('game-iframe');
        
        if (gameViewer && gameIframe) {
            document.getElementById('game-viewer-title').innerHTML = `<i class="fa-solid fa-globe"></i> Web Proxy`;
            gameIframe.src = encodedURL;
            gameViewer.style.display = 'flex';
        } else {
            // Fallback to new window
            window.open(encodedURL, '_blank');
        }
    }

    /**
     * Check if proxy is available
     */
    async checkProxyStatus() {
        try {
            const response = await fetch(this.proxyEndpoint, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            console.warn('Proxy health check failed:', e);
            return false;
        }
    }

    /**
     * Get setup instructions
     */
    getSetupInstructions() {
        return `
<h2>GrassUBG Proxy Setup Guide</h2>
<p><strong>To enable the proxy feature, you need to set up Ultraviolet:</strong></p>

<h3>Option 1: Use a Free Ultraviolet Instance</h3>
<ol>
<li>Deploy Ultraviolet on <a href="https://railway.app" target="_blank">Railway</a>, <a href="https://replit.com" target="_blank">Replit</a>, or <a href="https://vercel.com" target="_blank">Vercel</a></li>
<li>Fork: <a href="https://github.com/titaniumnetwork-dev/Ultraviolet" target="_blank">Ultraviolet Repository</a></li>
<li>Update <code>proxyEndpoint</code> in proxy-config.js</li>
</ol>

<h3>Option 2: Self-Host Locally</h3>
<pre>
git clone https://github.com/titaniumnetwork-dev/Ultraviolet
cd Ultraviolet
npm install
npm start
</pre>

<h3>Option 3: Use TompHTTP (Advanced)</h3>
<p>TompHTTP offers CORS-proxying for advanced setups</p>

<p><strong>After setup, update the proxy endpoint:</strong></p>
<pre>
this.proxyEndpoint = 'https://your-ultraviolet-deployment.com/uv/';
</pre>
        `;
    }
}

// Initialize global proxy instance
window.grassProxy = new GrassProxy();

// Check proxy status on load
window.addEventListener('load', async () => {
    const isAvailable = await window.grassProxy.checkProxyStatus();
    console.log(`GrassUBG Proxy Status: ${isAvailable ? 'Online' : 'Offline - Setup required'}`);
});
