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
        // Styling it to match a dark, terminal/matrix vibe
        outputBox.style.cssText = `
            position: fixed; 
            top: 20px; 
            right: 20px; 
            background: rgba(10, 15, 20, 0.9); 
            color: #00ffcc; 
            padding: 20px; 
            font-family: monospace; 
            z-index: 9999; 
            border: 1px solid #00ffcc; 
            box-shadow: 0 0 10px rgba(0, 255, 204, 0.3);
            max-height: 90vh; 
            overflow-y: auto;
            border-radius: 5px;
            min-width: 300px;
        `;
        document.body.appendChild(outputBox);
    }

    let html = `<h3 style="margin-top:0; text-align:center;">[ TITAN DEEP-SCAN ACTIVE ]</h3><hr style="border-color:#00ffcc; margin-bottom:15px;">`;
    
    for (const [key, data] of Object.entries(traits)) {
        html += `
            <div style="margin-bottom: 12px; font-size: 14px;">
                <strong style="color:#ff3366;">${key.toUpperCase()}:</strong> ${data.score} <br> 
                <span style="color:#e0e0e0; font-size: 12px;">> ${data.description}</span>
            </div>
        `;
    }
    outputBox.innerHTML = html;
}
