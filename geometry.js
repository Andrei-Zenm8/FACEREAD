// ============================================================================
// TITAN ENGINE V8.0: 3D GEOMETRY & NORMALIZATION PIPELINE
// Modifies MediaPipe raw landmarks into normalized, scale-invariant 3D arrays.
// ============================================================================

const TitanGeometry = {
    
    /**
     * Standard 3D Euclidean Distance
     */
    calc3D: function(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    },

    /**
     * Standard 2D Distance (Flattened Plane for straight-on proportions)
     */
    calc2D: function(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx*dx + dy*dy);
    },

    /**
     * Find the exact spatial midpoint between two landmarks
     */
    getMidpoint: function(p1, p2) {
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
            z: (p1.z + p2.z) / 2
        };
    },

    /**
     * Calculate the interior angle between three points (Required for Jaw/Brow metrics)
     */
    calcAngle: function(p1, p2, p3) {
        const a = this.calc3D(p2, p3);
        const b = this.calc3D(p1, p3);
        const c = this.calc3D(p1, p2);
        
        // Law of Cosines to extract the angle at vertex p2
        let cosVal = (a*a + c*c - b*b) / (2 * a * c);
        // Clamp to prevent floating point NaN errors
        cosVal = Math.max(-1, Math.min(1, cosVal)); 
        
        return Math.acos(cosVal) * (180 / Math.PI);
    },

    /**
     * The Core Normalization Engine. 
     * Undoes Camera Angle, Scales to IPD, and Flattens Lens Distortion.
     */
    alignAndNormalizeFace: function(landmarks, width, height) {
        // STEP 1: Convert normalized MediaPipe floats to absolute pixel proportions.
        // MediaPipe Z is roughly proportional to the image width.
        let mesh = landmarks.map(p => ({ 
            x: p.x * width, 
            y: p.y * height, 
            z: p.z * width 
        }));

        // STEP 2: Establish the 3D Centroid and shift face to Origin (0,0,0)
        // We use stable structural anchors (Eyes, Glabella, Chin)
        const cx = (mesh[10].x + mesh[152].x + mesh[33].x + mesh[263].x) / 4;
        const cy = (mesh[10].y + mesh[152].y + mesh[33].y + mesh[263].y) / 4;
        const cz = (mesh[10].z + mesh[152].z + mesh[33].z + mesh[263].z) / 4;

        mesh = mesh.map(p => ({ x: p.x - cx, y: p.y - cy, z: p.z - cz }));

        // Helper function for 2D rotational matrices
        const rot = (a, b, angle) => ({
            a: a * Math.cos(angle) - b * Math.sin(angle),
            b: a * Math.sin(angle) + b * Math.cos(angle)
        });

        // STEP 3: Undo Roll (Z-Axis Head Tilt)
        // Aligns the outer eye corners horizontally.
        const roll = Math.atan2(mesh[263].y - mesh[33].y, mesh[263].x - mesh[33].x);
        mesh = mesh.map(p => {
            const r = rot(p.x, p.y, -roll);
            return { x: r.a, y: r.b, z: p.z };
        });

        // STEP 4: Undo Yaw (Y-Axis Head Turn)
        // Aligns the Z-depth of both eyes so the face is looking perfectly forward.
        const yaw = Math.atan2(mesh[263].z - mesh[33].z, mesh[263].x - mesh[33].x);
        mesh = mesh.map(p => {
            const r = rot(p.x, p.z, -yaw);
            return { x: r.a, y: p.y, z: r.b };
        });

        // STEP 5: Undo Pitch (X-Axis Chin Raise/Tuck)
        // Aligns the top of forehead (10) and chin (152) to zero out vertical tilt.
        const pitch = Math.atan2(mesh[152].z - mesh[10].z, mesh[152].y - mesh[10].y);
        mesh = mesh.map(p => {
            const r = rot(p.y, p.z, -pitch);
            return { x: p.x, y: r.a, z: r.b };
        });

        // STEP 6: Scale Invariance via Interpupillary Distance (IPD)
        // Regardless of photo crop, IPD is now universally exactly 100 units.
        const ipd = Math.sqrt(
            Math.pow(mesh[263].x - mesh[33].x, 2) + 
            Math.pow(mesh[263].y - mesh[33].y, 2) + 
            Math.pow(mesh[263].z - mesh[33].z, 2)
        );

        let normalizedMesh = mesh.map(p => ({
            x: (p.x / ipd) * 100,
            y: (p.y / ipd) * 100,
            z: (p.z / ipd) * 100
        }));

        // STEP 7: Focal Length / Lens Distortion Matrix (The Selfie Fix)
        // Estimates wide-angle bulging by measuring the Z-depth of the nose (4) vs the glabella (168)
        const noseDepth = Math.abs(normalizedMesh[4].z - normalizedMesh[168].z);
        
        // In our IPD=100 scale, a standard telephoto portrait has a nose depth of ~30.
        const standardNoseDepth = 30.0;
        let distortionRatio = standardNoseDepth / (noseDepth || 1);
        
        // Clamp bounds to prevent mutation of genuine biological anomalies
        distortionRatio = Math.max(0.75, Math.min(1.25, distortionRatio));

        // Un-warp: If wide-angle, we slightly expand X (to fix narrowing) and severely compress Z (to fix bulging).
        normalizedMesh = normalizedMesh.map(p => ({
            x: p.x * (1 + ((1 - distortionRatio) * 0.4)), 
            y: p.y, 
            z: p.z * distortionRatio 
        }));

        // STEP 8: Extraction & Quality Confidence Scoring
        const pitchDeg = pitch * (180/Math.PI);
        const yawDeg = yaw * (180/Math.PI);
        const rollDeg = roll * (180/Math.PI);
        const maxPose = Math.max(Math.abs(pitchDeg), Math.abs(yawDeg), Math.abs(rollDeg));
        
        let qualityStatus = "OPTIMAL: Telephoto Equivalent";
        let confScore = 100;

        // Punish confidence if the head was turned severely, as hidden geometry had to be inferred
        if (maxPose > 12) { qualityStatus = "ACCEPTABLE (3D POSE CORRECTED)"; confScore -= 10; }
        if (maxPose > 25) { qualityStatus = "POOR (HEAVY 3D ROTATION APPLIED)"; confScore -= 30; }
        if (maxPose > 45) { qualityStatus = "CRITICAL (PROFILE ANGLE EXCEEDS BOUNDS)"; confScore -= 50; }

        // Check if vital features are chopped off the edge of the screen
        const margin = 0.02; 
        const outOfBounds = landmarks.some(p => p.x < margin || p.x > 1-margin || p.y < margin || p.y > 1-margin);
        if (outOfBounds) { qualityStatus = "CRITICAL: FACE OCCLUDED/CROPPED"; confScore -= 35; }

        if (distortionRatio < 0.85) { qualityStatus += " | WIDE-ANGLE LENS CORRECTED"; }

        return {
            mesh: normalizedMesh,
            rawIPD: ipd,
            metrics: {
                pitch_deg: pitchDeg.toFixed(2),
                yaw_deg: yawDeg.toFixed(2),
                roll_deg: rollDeg.toFixed(2),
                distortion_factor: distortionRatio.toFixed(3),
                confidence_score: Math.max(0, confScore),
                status: qualityStatus
            }
        };
    }
};
