// ============================================================================
// TITAN ENGINE V8.0: DEEP-MATRIX HEURISTICS & MOOD EVALUATOR
// Extracts 15 brutal, unsanitized traits from the normalized 3D mesh.
// ============================================================================

const TitanHeuristics = {

    // Helper: Distance between two 3D points
    dist: function(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2) + 
            Math.pow(p1.z - p2.z, 2)
        );
    },

    // Helper: Calculate angle in degrees between two points (2D projection)
    angleDeg: function(p1, p2, axis1 = 'x', axis2 = 'y') {
        return Math.atan2(p2[axis2] - p1[axis2], p2[axis1] - p1[axis1]) * (180 / Math.PI);
    },

    // The Brutal Truth Scoring Matrix
    scoreTrait: function(val, lowLimit, highLimit, lowDesc, midDesc, highDesc) {
        if (val <= lowLimit) return { score: val.toFixed(2), description: lowDesc };
        if (val >= highLimit) return { score: val.toFixed(2), description: highDesc };
        return { score: val.toFixed(2), description: midDesc };
    },

    analyzeFace: function(normalizedMesh) {
        const m = normalizedMesh;
        const traits = {};

        // ---------------------------------------------------------
        // METRIC 1: fWHR (Facial Width-to-Height Ratio)
        // Width: Bizygomatic (234 to 454)
        // Height: Upper Lip (164) to Brow (10)
        // ---------------------------------------------------------
        const faceWidth = this.dist(m[234], m[454]);
        const faceHeight = Math.abs(m[164].y - m[10].y);
        const fWHR = faceWidth / faceHeight;
        traits.fWHR = this.scoreTrait(fWHR, 1.75, 1.95, 
            "Low Drive / High Agreeableness (Submissive)", 
            "Balanced Assertiveness", 
            "High Aggression / Dominant Drive (Combative)"
        );

        // ---------------------------------------------------------
        // METRIC 2: Canthal Tilt (Predatory Focus)
        // Angle between inner eye (133) and outer eye (33)
        // ---------------------------------------------------------
        const rightTilt = this.angleDeg(m[133], m[33]);
        const leftTilt = this.angleDeg(m[362], m[263]);
        // Average and normalize (negative means outer eye is higher in standard screen coords)
        const canthalTilt = ((rightTilt + leftTilt) / 2) * -1; 
        traits.canthalTilt = this.scoreTrait(canthalTilt, -3, 3, 
            "Negative Tilt: Defensive / Lethargic / Trusting", 
            "Neutral Tilt: Balanced Perception", 
            "Positive Tilt: Predatory / Hyper-Vigilant / Calculating"
        );

        // ---------------------------------------------------------
        // METRIC 3: Mandibular Gonial Angle (Stress Resistance)
        // Jaw Width (132 to 361) relative to Chin Length (152)
        // ---------------------------------------------------------
        const jawWidth = this.dist(m[132], m[361]);
        const lowerFaceHeight = Math.abs(m[152].y - m[164].y);
        const jawRatio = jawWidth / lowerFaceHeight;
        traits.mandible = this.scoreTrait(jawRatio, 2.2, 2.8, 
            "Narrow/Steep Mandible: Low Stress Tolerance / Flee-Prone", 
            "Standard Mandible: Moderate Resilience", 
            "Flared/Square Mandible: High Physical Tenacity / Stubborn"
        );

        // ---------------------------------------------------------
        // METRIC 4: Maxillary Forward Growth (Vitality/Energy)
        // Z-depth of nose base (2) compared to nasion (168)
        // ---------------------------------------------------------
        const maxillaZ = m[2].z - m[168].z; 
        traits.maxilla = this.scoreTrait(maxillaZ, -10, -18, 
            "Recessed Maxilla: Low Base Vitality / Prone to Fatigue", 
            "Standard Growth", 
            "Forward Maxilla: High Intrinsic Vitality / Imposing"
        );

        // ---------------------------------------------------------
        // METRICS 5, 6, 7: Facial Thirds (Intellect vs. Action)
        // Upper (Intellect), Middle (Commercial), Lower (Instinctual)
        // ---------------------------------------------------------
        const upperThird = Math.abs(m[10].y - m[168].y); // Hairline to Glabella
        const middleThird = Math.abs(m[168].y - m[2].y); // Glabella to Nose Base
        const lowerThird = Math.abs(m[2].y - m[152].y);  // Nose Base to Chin
        const totalHeight = upperThird + middleThird + lowerThird;

        traits.upperThird = this.scoreTrait(upperThird/totalHeight, 0.30, 0.35, 
            "Low Cerebral Processing", "Standard Intellectual Drive", "Highly Theoretical / Over-Thinker");
        
        traits.middleThird = this.scoreTrait(middleThird/totalHeight, 0.30, 0.35, 
            "Low Commercial Drive", "Standard Practicality", "Highly Material / Profit-Driven / Practical");
        
        traits.lowerThird = this.scoreTrait(lowerThird/totalHeight, 0.30, 0.35, 
            "Low Physical Instinct", "Standard Physicality", "Highly Instinctual / Action-Biased / Hedonistic");

        // ---------------------------------------------------------
        // METRIC 8: Zygomaticus vs. Corrugator (Resting Mood Tension)
        // Cheek raise (61 to 205) vs Brow Furrow (107 to 336)
        // ---------------------------------------------------------
        const cheekTension = this.dist(m[61], m[205]); 
        const browTension = this.dist(m[107], m[336]);
        const moodRatio = cheekTension / browTension;
        traits.restingMood = this.scoreTrait(moodRatio, 1.2, 1.6, 
            "Hostile Resting State / High Corrugator Tension", 
            "Neutral / Unreadable State", 
            "Appealing/Warm Resting State / High Zygomaticus Tension"
        );

        // ---------------------------------------------------------
        // METRICS 9-15: Brutal Morphopsychology Expansion
        // ---------------------------------------------------------
        
        // 9. Nasal Prominence (Executive Force)
        const noseDepth = Math.abs(m[4].z - m[168].z);
        traits.noseProminence = this.scoreTrait(noseDepth, 25, 35, "Reactive / Follower", "Standard Force", "High Executive Force / Imposing Will");

        // 10. Eye Deep-Setness (Stoicism / Observation)
        const eyeDepth = m[33].z; 
        traits.eyeDepth = this.scoreTrait(eyeDepth, 5, 12, "Protruding: Emotionally Reactive / Exposed", "Standard Depth", "Deep-Set: Stoic / Guarded / Analytical");

        // 11. Chin Projection (Willpower)
        const chinZ = m[152].z - m[2].z; 
        traits.chinProjection = this.scoreTrait(chinZ, 5, 15, "Recessed Chin: Weak Follow-Through / Yielding", "Standard Willpower", "Projecting Chin: Unyielding / Combative Willpower");

        // 12. Mouth Width (Expressiveness / Sensuality)
        const mouthWidth = this.dist(m[61], m[291]);
        traits.mouthWidth = this.scoreTrait(mouthWidth, 40, 55, "Narrow Mouth: Secretive / Frugal with Expression", "Standard Expressiveness", "Wide Mouth: Expansive / Sensual / Verbose");

        // 13. Brow Ridge Prominence (Primal Dominance)
        const browZ = m[10].z - m[168].z; 
        traits.browRidge = this.scoreTrait(browZ, -5, 5, "Flat Brow: High Agreeableness / Modern", "Standard Brow", "Heavy Brow Ridge: Primal Dominance / Territorial");

        // 14. Philtrum Length (Neuroticism vs. Stoicism)
        const philtrum = this.dist(m[2], m[164]);
        traits.philtrum = this.scoreTrait(philtrum, 10, 18, "Short Philtrum: Highly Reactive / Sensitive", "Standard Philtrum", "Long Philtrum: Blunt / Emotionally Detached");

        // 15. Facial Asymmetry (Internal Conflict)
        const leftSideWidth = Math.abs(m[234].x - m[1].x);
        const rightSideWidth = Math.abs(m[454].x - m[1].x);
        const asymmetry = Math.abs(leftSideWidth - rightSideWidth);
        traits.asymmetry = this.scoreTrait(asymmetry, 2, 6, "Highly Symmetrical: Predictable / Congruent", "Standard Variance", "High Asymmetry: Internal Conflict / Unpredictable Dual Nature");

        return traits;
    }
};
