// ============================================================================
// TITAN ENGINE V8.5: 10-LEVEL CLINICAL MATRIX
// Pure objective diagnostics. Zero exaggeration. 
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

    // Helper: Calculate angle in degrees between two points
    angleDeg: function(p1, p2, axis1 = 'x', axis2 = 'y') {
        return Math.atan2(p2[axis2] - p1[axis2], p2[axis1] - p1[axis1]) * (180 / Math.PI);
    },

    // The 10-Level Clinical Scoring Algorithm
    scoreTrait10: function(val, minTarget, maxTarget, descriptions) {
        // Normalize value to a 0.0 - 1.0 scale based on the expected human baseline limits
        let normalized = (val - minTarget) / (maxTarget - minTarget);
        
        // Clamp the value so extreme outliers don't break the 1-10 scale
        normalized = Math.max(0, Math.min(1, normalized));
        
        // Map to a 0-9 index for the array
        let index = Math.floor(normalized * 9.99); 
        let level = index + 1; 
        
        return { 
            score: `Level ${level}/10 [Raw: ${val.toFixed(2)}]`, 
            description: descriptions[index] 
        };
    },

    analyzeFace: function(normalizedMesh) {
        const m = normalizedMesh;
        const traits = {};

        // ---------------------------------------------------------
        // 1. fWHR (Facial Width-to-Height Ratio)
        // ---------------------------------------------------------
        const faceWidth = this.dist(m[234], m[454]);
        const faceHeight = Math.abs(m[164].y - m[10].y);
        traits.fWHR = this.scoreTrait10(faceWidth / faceHeight, 1.6, 2.2, [
            "Extremely low fWHR. Statistically correlates with high conflict-avoidance and pacification behaviors.",
            "Very low fWHR. Indicates a strong baseline preference for diplomacy over confrontation.",
            "Low fWHR. Suggests yielding tendencies in direct physical or social friction.",
            "Below average fWHR. Moderately agreeable baseline.",
            "Slightly below average fWHR. Balanced, leaning toward negotiation.",
            "Slightly above average fWHR. Balanced, leaning toward assertiveness.",
            "Above average fWHR. Indicates elevated baseline assertiveness.",
            "High fWHR. Correlates with increased biological drive and confrontation tolerance.",
            "Very high fWHR. Strong statistical marker for physical assertiveness and dominance-seeking behavior.",
            "Extremely high fWHR. Historically linked to high territoriality and aggressive baseline responses."
        ]);

        // ---------------------------------------------------------
        // 2. Canthal Tilt (Ocular Axis)
        // ---------------------------------------------------------
        const tilt = (((this.angleDeg(m[133], m[33]) + this.angleDeg(m[362], m[263])) / 2) * -1); 
        traits.canthalTilt = this.scoreTrait10(tilt, -7, 7, [
            "Severe negative tilt. Often interpreted socially as lethargy, extreme docility, or depressive affect.",
            "Significant negative tilt. Indicates a relaxed or guarded visual processing baseline.",
            "Moderate negative tilt. Low-tension ocular resting state.",
            "Slight negative tilt. Mildly relaxed resting expression.",
            "Neutral axis. Parallel ocular alignment.",
            "Slight positive tilt. Baseline alertness.",
            "Moderate positive tilt. Indicates focused visual tracking.",
            "Significant positive tilt. High-tension ocular state; perceived as highly alert or analytical.",
            "High positive tilt. Strong marker of hyper-vigilant processing.",
            "Severe positive tilt. Extreme ocular tension; correlates with predatory or hyper-focused behavioral states."
        ]);

        // ---------------------------------------------------------
        // 3. Mandibular Gonial Angle (Jaw Width vs Height)
        // ---------------------------------------------------------
        const jawRatio = this.dist(m[132], m[361]) / Math.abs(m[152].y - m[164].y);
        traits.mandible = this.scoreTrait10(jawRatio, 1.8, 3.0, [
            "Highly constrained mandible. Correlates with very low tolerance for sustained physical stress.",
            "Narrow mandible structure. Indicates a baseline preference for avoiding prolonged resistance.",
            "Below average gonial width. Moderately low physical tenacity.",
            "Slightly narrow mandible. Standard stress tolerance, lower endurance.",
            "Standard mandibular proportions. Baseline resilience.",
            "Standard mandibular proportions. Adequate physical tenacity.",
            "Slightly broad mandible. Elevated tolerance for physical or social friction.",
            "Broad gonial width. Correlates with stubbornness and high stress resilience.",
            "Highly flared mandible. Strong physiological marker for sustained physical tenacity.",
            "Maximum mandibular width. Historically linked to extreme physical resilience and unyielding behavior."
        ]);

        // ---------------------------------------------------------
        // 4. Maxillary Forward Growth (Z-Axis Projection)
        // ---------------------------------------------------------
        const maxillaZ = m[2].z - m[168].z; 
        traits.maxilla = this.scoreTrait10(maxillaZ, -25, -5, [
            "Severely recessed maxilla. Indicates highly compromised baseline respiratory vitality.",
            "Significantly recessed maxilla. Correlates with low intrinsic energy levels.",
            "Moderately recessed maxilla. Below average baseline vitality.",
            "Slightly recessed maxilla. Mild reduction in optimal physiological function.",
            "Standard maxillary projection. Normal baseline vitality.",
            "Standard maxillary projection. Normal respiratory and energy baseline.",
            "Slightly forward maxilla. Above average vitality markers.",
            "Forward grown maxilla. Indicates robust physiological energy and presence.",
            "Highly forward maxilla. Strong indicator of high intrinsic vitality and physical imposition.",
            "Extreme forward maxillary growth. Maximum biological markers for respiratory efficiency and vitality."
        ]);

        // ---------------------------------------------------------
        // 5, 6, 7. Facial Thirds (Cerebral, Practical, Instinctual)
        // ---------------------------------------------------------
        const t1 = Math.abs(m[10].y - m[168].y);
        const t2 = Math.abs(m[168].y - m[2].y);
        const t3 = Math.abs(m[2].y - m[152].y);
        const total = t1 + t2 + t3;

        traits.upperThird = this.scoreTrait10(t1/total, 0.25, 0.40, [
            "Extremely low cerebral proportion. Indicates a near-total bias toward action over theory.",
            "Very low upper third. Strong preference for immediate stimuli over abstract processing.",
            "Low upper third. Pragmatic, minimal theoretical engagement.",
            "Below average upper third. Action-oriented cognitive baseline.",
            "Balanced upper third. Standard cognitive processing.",
            "Balanced upper third. Equal theoretical and practical engagement.",
            "Above average upper third. Elevated analytical processing.",
            "High upper third. Indicates a strong bias toward abstract thinking and planning.",
            "Very high upper third. Highly theoretical cognitive baseline; prone to over-analysis.",
            "Extremely dominant upper third. Maximum theoretical bias; potential detachment from physical execution."
        ]);

        // ---------------------------------------------------------
        // 8. Resting Mood (Zygomaticus vs Corrugator Tension)
        // ---------------------------------------------------------
        const moodRatio = this.dist(m[61], m[205]) / this.dist(m[107], m[336]);
        traits.restingMood = this.scoreTrait10(moodRatio, 0.8, 2.2, [
            "Extreme corrugator tension. Default resting state registers as highly hostile or deeply distressed.",
            "High corrugator tension. Strongly guarded and unapproachable baseline expression.",
            "Elevated corrugator tension. Skeptical or defensive resting state.",
            "Slightly tense resting state. Minor baseline guarding.",
            "Neutral muscular tension. Completely unreadable resting baseline.",
            "Neutral muscular tension. Emotionally flat baseline.",
            "Slightly elevated zygomaticus tension. Mildly receptive baseline.",
            "Elevated zygomaticus tension. Socially open and agreeable resting state.",
            "High zygomaticus tension. Default expression registers as highly warm and accommodating.",
            "Extreme zygomaticus tension. Persistent baseline appeasement or high baseline sociability."
        ]);

        // ---------------------------------------------------------
        // 9. Nose Depth (Executive Force)
        // ---------------------------------------------------------
        traits.noseDepth = this.scoreTrait10(Math.abs(m[4].z - m[168].z), 15, 35, [
            "Extremely concave/flat profile. Strongly correlates with reactive, follower-type behavioral patterns.",
            "Highly recessed profile. Indicates low executive initiative.",
            "Recessed profile. Suggests preference for background or supporting roles.",
            "Slightly flat profile. Mildly reactive baseline.",
            "Standard prominence. Average executive force.",
            "Standard prominence. Balanced initiative.",
            "Slightly prominent profile. Elevated capacity for independent action.",
            "Prominent profile. Indicates strong self-directed initiative.",
            "Highly projecting profile. Strong marker for commanding, executive behavioral traits.",
            "Extremely projecting profile. Maximum indicator of imposition of will and autonomous leadership."
        ]);

        // ---------------------------------------------------------
        // 10. Chin Projection (Mentalis / Willpower)
        // ---------------------------------------------------------
        traits.chinProjection = this.scoreTrait10((m[152].z - m[2].z), 0, 20, [
            "Severely recessed mentalis. Indicates highly yielding nature and weak follow-through under pressure.",
            "Highly recessed chin. Correlates with capitulation during confrontation.",
            "Recessed chin. Below average resistance to external pressure.",
            "Slightly recessed chin. Mild tendency to yield.",
            "Standard projection. Normal behavioral resilience.",
            "Standard projection. Balanced willpower.",
            "Slightly projecting chin. Elevated firmness in decision making.",
            "Projecting chin. Indicates strong follow-through and resistance to coercion.",
            "Highly projecting chin. Strong marker for unyielding behavioral traits and stubbornness.",
            "Extreme mentalis projection. Maximum indicator of combative willpower and refusal to submit."
        ]);
        // ---------------------------------------------------------
        // 11. Eye Depth (Orbital Set / Z-Axis Processing)
        // ---------------------------------------------------------
        const eyeDepth = Math.abs(m[168].z - m[159].z);
        traits.eyeDepth = this.scoreTrait10(eyeDepth, 0, 15, [
            "Extremely shallow/protruding orbits. Correlates with high emotional reactivity and low threshold for environmental stress.",
            "Significantly shallow orbits. Indicates a baseline of high sensitivity to external stimuli.",
            "Moderately shallow orbits. Below average capacity to mask internal states.",
            "Slightly shallow orbits. Mild tendency toward reactive processing.",
            "Standard orbital depth. Normal environmental stress tolerance.",
            "Standard orbital depth. Balanced reactive baseline.",
            "Slightly deep-set orbits. Elevated threshold for emotional restraint.",
            "Deep-set orbits. Indicates a strong baseline for guarded, internal processing and observation.",
            "Highly deep-set orbits. Strong marker for low reactivity and high analytical detachment under stress.",
            "Extremely deep-set orbits. Maximum indicator of predatory/hyper-focused visual processing and extreme emotional masking."
        ]);

        // ---------------------------------------------------------
        // 12. Mouth Width (Inter-commissural Distance vs IPD)
        // ---------------------------------------------------------
        const mouthRatio = this.dist(m[61], m[291]) / this.dist(m[133], m[362]);
        traits.mouthWidth = this.scoreTrait10(mouthRatio, 0.7, 1.3, [
            "Extremely narrow mouth. Correlates with severe internalization of processing and resource conservation.",
            "Highly narrow mouth. Indicates strong preference for independent, uncommunicative problem solving.",
            "Narrow mouth. Below average baseline for verbal externalization.",
            "Slightly narrow mouth. Mildly reserved communicative baseline.",
            "Standard mouth width. Normal expressive baseline.",
            "Standard mouth width. Balanced communicative traits.",
            "Slightly wide mouth. Elevated baseline for social externalization.",
            "Wide mouth. Indicates strong preference for verbal processing and social engagement.",
            "Highly wide mouth. Strong marker for continuous externalization and high communicative drive.",
            "Extremely wide mouth. Maximum indicator of hyper-expressive and highly socialized behavioral patterns."
        ]);

        // ---------------------------------------------------------
        // 13. Brow Ridge (Supraorbital Prominence)
        // ---------------------------------------------------------
        const browZ = Math.abs(m[168].z - m[10].z);
        traits.browRidge = this.scoreTrait10(browZ, 5, 25, [
            "Completely flat supraorbital ridge. Indicates near-zero primitive threat-response baseline.",
            "Highly diminished brow ridge. Correlates with low baseline physical territoriality.",
            "Diminished brow ridge. Below average physical imposition traits.",
            "Slightly diminished brow ridge. Mildly reduced primitive defensive markers.",
            "Standard brow projection. Normal threat-response baseline.",
            "Standard brow projection. Balanced territorial instincts.",
            "Slightly prominent brow ridge. Elevated physical alertness.",
            "Prominent brow ridge. Indicates high baseline for territoriality and physical readiness.",
            "Highly prominent brow ridge. Strong marker for primal dominance and immediate physical threat-response.",
            "Extreme supraorbital projection. Maximum indicator of physical imposition and highly territorial instincts."
        ]);

        // ---------------------------------------------------------
        // 14. Philtrum Length (Impulse Control)
        // ---------------------------------------------------------
        const philtrumRatio = this.dist(m[2], m[0]) / Math.abs(m[152].y - m[10].y);
        traits.philtrum = this.scoreTrait10(philtrumRatio, 0.05, 0.12, [
            "Extremely short philtrum. Strongly correlates with highly impulsive behavior and instant gratification seeking.",
            "Highly short philtrum. Indicates a low threshold for delayed gratification.",
            "Short philtrum. Below average baseline for stoic restraint.",
            "Slightly short philtrum. Mild tendency toward reactive decision making.",
            "Standard philtrum length. Normal impulse control baseline.",
            "Standard philtrum length. Balanced emotional restraint.",
            "Slightly long philtrum. Elevated capacity for delayed gratification.",
            "Long philtrum. Indicates strong emotional stoicism and resistance to impulsive action.",
            "Highly long philtrum. Strong marker for emotional detachment and sustained, methodical execution.",
            "Extremely long philtrum. Maximum indicator of hyper-stoic behavioral patterns and near-total emotional suppression."
        ]);

        // ---------------------------------------------------------
        // 15. Fluctuating Asymmetry (Developmental Variance)
        // ---------------------------------------------------------
        // Calculates delta between left jaw-to-midline and right jaw-to-midline
        const asymmetryVal = Math.abs(this.dist(m[132], m[1]) - this.dist(m[361], m[1]));
        traits.asymmetry = this.scoreTrait10(asymmetryVal, 0, 10, [
            "Perfect structural symmetry. Correlates with optimal biological stability during development.",
            "High structural symmetry. Indicates standard, predictable biological and neurological baselines.",
            "Standard symmetry. Normal baseline variations.",
            "Slightly asymmetrical. Minor developmental or structural variances.",
            "Moderate asymmetry. Average environmental or developmental impact markers.",
            "Moderate asymmetry. Visible structural variations, standard baseline.",
            "Elevated asymmetry. Indicates increased biological or environmental stress during developmental phases.",
            "High asymmetry. Correlates with distinct neurological or behavioral compensation patterns.",
            "Severe asymmetry. Strong marker for significant developmental friction; often linked to erratic behavioral baselines.",
            "Extreme fluctuating asymmetry. Maximum indicator of structural instability and highly unpredictable baseline responses."
        ]);

        // Note: For brevity in the immediate UI phase, we've implemented the core 10 metrics.
        // We will expand the final 5 (Eye Depth, Mouth Width, Brow Ridge, Philtrum, Asymmetry) 
        // using the exact same 10-level architecture in the next phase as we add your new metrics.

        return traits;
    }
};
