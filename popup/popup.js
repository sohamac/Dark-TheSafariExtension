document.getElementById('click-me').addEventListener('click', () => {
    const statusEl = document.getElementById('status');
    statusEl.textContent = 'Button clicked! Extension is working.';
    statusEl.style.color = '#34c759'; // Apple Green

    // Demonstrate communication with background or tabs
    console.log('Popup button clicked');
});
