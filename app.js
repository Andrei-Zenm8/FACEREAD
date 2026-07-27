// ============================================================================
// TITAN ENGINE V8.5: MAIN CONTROLLER (app.js)
// Reconnects file uploads, MediaPipe CNN, geometry alignment, and the grid HUD.
// ============================================================================

// --- I. CORE DOM INITIALIZATION ---
const inputs = { front: document.getElementById('up-front'), left: document.getElementById('up-left'), right: document.getElementById('up-right') };
const canvases = { front: document.getElementById('canv-front'), left: document.getElementById('canv-left'), right: document.getElementById('canv-right') };
const executeBtn = document.getElementById('executeBtn');
const loading = document.getElementById('loading');
const reportPanel = document.getElementById('report');
const reportGrid = document.getElementById('report-grid');

let sourceImages = { front: null, left: null, right: null };
let meshData = { front: null, left: null, right: null };
let processingQueue = [];
let currentAngle = null;

// --- II. MEDIAPIPE CNN CONFIGURATION ---
const faceMesh = new FaceMesh({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.05, minTrackingConfidence: 0.05 });
faceMesh.onResults(handleResults);

// --- III. IMAGE UPLOAD & CANVAS RENDERING ---
Object.keys(inputs).forEach(angle => {
    if (!inputs[angle]) return;
    inputs[angle].addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const lbl = document.getElementById(`lbl-${angle}`);
        if(lbl) {
            lbl.style.background = '#222';
            lbl.style.color = '#FFF';
            lbl.innerText = `${angle.toUpperCase()}_LOADED`;
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canv = canvases[angle];
                const ctx = canv.getContext('2d');
                canv.width = img.width;
                canv.height = img.height;
                ctx.drawImage(img, 0, 0);
                sourceImages[angle] = img;
                if(sourceImages.front && executeBtn) executeBtn.style.display = 'block';
            };
            img.src = event.target.result;
        }
        reader.readAsDataURL(file);
    });
});

// --- IV. EXECUTION PIPELINE ---
if (executeBtn) {
    executeBtn.addEventListener('click', () => {
        executeBtn.style.display = 'none';
        reportPanel.style.display = 'none';
        loading.style.display = 'block';
        processingQueue = ['front', 'left', 'right'].filter(a => sourceImages[a]);
        processNext();
    });
}

async function processNext() {
    if (processingQueue.length === 0) {
        loading.style.display = 'none';
        executeBtn.style.display = 'block';
        executeBtn.innerText = "RECALCULATE TITAN MATRIX";
        buildSpectrumMatrix();
        return;
    }
    currentAngle = processingQueue.shift();
    loading.innerText = `EXTRACTING [${currentAngle.toUpperCase()}] SPATIAL DATA...`;
    try { await faceMesh.send({image: sourceImages[currentAngle]}); } 
    catch (err) { console.warn(`CNN lost track on ${currentAngle}`); meshData[currentAngle] = null; processNext(); }
}

function handleResults(results) {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const lm = results.multiFaceLandmarks[0];
        meshData[currentAngle] = lm;
        const canv = canvases[currentAngle];
        const ctx = canv.getContext('2d');
        ctx.strokeStyle = currentAngle === 'front' ? 'rgba(0, 255, 65, 0.8)' : 'rgba(255, 0, 60, 0.8)'; 
        ctx.lineWidth = 1.0;
        lm.forEach(p => { ctx.beginPath(); ctx.arc(p.x*canv.width, p.y*canv.height, 1, 0, 2*Math.PI); ctx.stroke(); });
    } else { meshData[currentAngle] = null; }
    processNext();
}

// --- V. THE TITAN MATRIX BUILDER (31-POINT GRID) ---
function buildSpectrumMatrix() {
    if (!meshData.front) return alert("CRITICAL ERROR: Frontal mesh extraction failed. Ensure face is fully illuminated and visible.");
    
    const rawMesh = meshData.front;
    const width = canvases.front.width;
    const height = canvases.front.height;
    
    // Step 1: Align and normalize via geometry.js
    const alignmentResult = (typeof TitanGeometry !== 'undefined') 
        ? TitanGeometry.alignAndNormalizeFace(rawMesh, width, height) 
        : { mesh: rawMesh, metrics: {} };

    // Step 2: Run all 31 metrics through heuristics.js
    const traits = TitanHeuristics.analyzeFace(alignmentResult.mesh);

    // Step 3: Build the grid layout for the UI
    let html = "";
    for (const [key, data] of Object.entries(traits)) {
        const formattedTitle = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        
        // 1. Calculate dynamic percentage (safeguard if data.pct is missing, falls back to score out of 10)
        let pct = data.pct || ((parseFloat(data.score) || 5) * 10);
        if (pct > 100) pct = 100;
        
        // 2. Dynamic Tier Coloring (Extreme=Red, Average=Green, Low=Blue)
        let barColor = 'var(--brand)'; 
        if (pct >= 80) barColor = 'var(--alert)'; 
        else if (pct <= 30) barColor = '#0088ff'; 
        
        html += `
        <div class="trait-row">
            <div class="trait-header">
                <span class="trait-name">${formattedTitle}</span>
                <span class="trait-id">TITAN_V8.5</span>
            </div>
            <div class="data-bar-bg">
                <div class="data-bar-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
            <div class="trait-body">
                <div class="reading-box">
                    <strong style="color: ${barColor};">${data.score}</strong><br>
                    <span style="color: #bbb; display: inline-block; margin-top: 5px;">> ${data.description}</span>
                </div>
            </div>
        </div>`;
    }

    reportGrid.innerHTML = html;
    reportPanel.style.display = 'block';
    reportPanel.scrollIntoView({ behavior: 'smooth' });
}
