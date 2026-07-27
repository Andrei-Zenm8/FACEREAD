// ============================================================================
// TITAN ENGINE V8.0: MAIN CONTROLLER (app.js)
// Connects the webcam, runs MediaPipe, and prints the brutal analysis.
// ============================================================================

// 1. Setup Camera and MediaPipe
const videoElement = document.createElement('video');
videoElement.autoplay = true;
videoElement.playsInline = true;

const faceMesh = new FaceMesh({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
}});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// 2. Process the Results
faceMesh.onResults((results) => {
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const rawMesh = results.multiFaceLandmarks[0];
    
    // Check if the Geometry engine is loaded to normalize lens distortion
    const meshToAnalyze = (typeof TitanGeometry !== 'undefined') 
        ? TitanGeometry.normalize(rawMesh) 
        : rawMesh;

    // Run the 15-point brutal matrix
    const analysis = TitanHeuristics.analyzeFace(meshToAnalyze);
    
    // Display results on screen
    displayResults(analysis);
  }
});

// 3. Start Webcam
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  videoElement.srcObject = stream;
  videoElement.play();
  
  // Send video frames to the Face Mesh engine continuously
  async function sendFrame() {
    await faceMesh.send({image: videoElement});
    requestAnimationFrame(sendFrame);
  }
  sendFrame();
}).catch(err => {
    console.error("Camera access denied or unavailable:", err);
    alert("Please allow camera access for the Titan Engine to work.");
});

// 4. Render the Data Matrix to the Screen
function displayResults(traits) {
    // Look for an existing output box, or create a heads-up display (HUD)
    let outputBox = document.getElementById('titan-hud');
    if (!outputBox) {
        outputBox = document.createElement('div');
        outputBox.id = 'titan-hud';
        // Styling it to match a dark, terminal/matrix vibe, expanded for grid
        outputBox.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            left: 20px; /* Expanded left to give the 31-point grid room to breathe */
            bottom: 20px; /* Expanded bottom */
            background: rgba(10, 15, 20, 0.95); 
            color: #00ffcc; 
            padding: 20px; 
            font-family: monospace; 
            z-index: 9999; 
            border: 1px solid #00ffcc; 
            box-shadow: 0 0 15px rgba(0, 255, 204, 0.2);
            overflow-y: auto;
            border-radius: 5px;
        `;
        document.body.appendChild(outputBox);
    }

    // Main header
    let html = `<h3 style="margin-top:0; text-align:center; font-size: 20px; letter-spacing: 2px;">[ TITAN DEEP-SCAN ACTIVE ]</h3><hr style="border-color:#00ffcc; margin-bottom:20px;">`;
    
    // START GRID CONTAINER
    html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 15px;">`;
    
    for (const [key, data] of Object.entries(traits)) {
        // Formats camelCase keys nicely (e.g., riskTolerance -> RISK TOLERANCE)
        const formattedTitle = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        
        // Individual Trait Cards
        html += `
            <div style="background: rgba(0, 255, 204, 0.05); border-left: 3px solid #ff3366; padding: 12px; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                <strong style="color:#ff3366; display:block; margin-bottom:6px; font-size: 14px;">${formattedTitle}</strong>
                <span style="color:#fff; font-weight:bold; font-size: 13px;">SCORE: ${data.score}</span> <br> 
                <span style="color:#a0a0a0; font-size: 12px; display:inline-block; margin-top:5px; line-height: 1.4;">> ${data.description}</span>
            </div>
        `;
    }

    // END GRID CONTAINER
    html += `</div>`;

    outputBox.innerHTML = html;
}
