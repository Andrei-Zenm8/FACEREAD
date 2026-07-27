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

        // --- GLOBAL METRICS ---
        // Define these here so downstream traits don't throw ReferenceErrors
        const IPD = this.dist(m[33], m[263]);
        const jawWidth = this.dist(m[132], m[361]);

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
        const chinProjVal = m[152].z - m[2].z;
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
        // ============================================================================
        // ADVANCED PREDICTIVE ABSTRACTIONS (BLOCK 1)
        // ============================================================================

        // ---------------------------------------------------------
        // 16. Political Alignment (Ideological Baseline / Motive Temperament)
        // ---------------------------------------------------------
        // Combines fWHR (Facial Width-to-Height) and Jaw Angularity to calculate 
        // the preference for hierarchy/authority vs. egalitarianism.
        const ideologyScore = (faceWidth / faceHeight) * jawRatio;
        traits.politicalAlignment = this.scoreTrait10(ideologyScore, 2.8, 6.6, [
            "Extreme Egalitarian Baseline. Biologically highly predisposed to anti-hierarchical and ultra-progressive ideologies.",
            "Strong Egalitarian Baseline. Correlates with distinct preferences for decentralized authority and progressive systems.",
            "Moderate Egalitarian. Default psychological stance favors collective consensus over strict hierarchy.",
            "Leaning Egalitarian. Mild preference for democratic resource distribution.",
            "Centrist/Neutral Baseline. Highly adaptable ideological framework; pragmatism outweighs rigid ideology.",
            "Centrist/Neutral Baseline. Situationally dependent ideological alignment.",
            "Leaning Hierarchical. Mild preference for established systems and defined authority structures.",
            "Moderate Hierarchical. Default stance heavily favors meritocracy, tradition, and structured authority.",
            "Strong Hierarchical Baseline. Correlates with rigid conservative preferences and high respect for established institutional forms.",
            "Extreme Hierarchical Baseline. Maximum biological predisposition toward rigid authority, strict traditionalism, and stratified systems."
        ]);

        // ---------------------------------------------------------
        // 17. Childhood Experience (Developmental Friction)
        // ---------------------------------------------------------
        // Uses microscopic FA (Fluctuating Asymmetry) across the mid-face to predict 
        // environmental/biological stress during early development.
        const developmentalStress = asymmetryVal * (this.dist(m[33], m[263]) / IPD);
        traits.childhoodExperience = this.scoreTrait10(developmentalStress, 0, 12, [
            "Extremely low developmental friction. Indicates a highly stable, predictable, and low-stress early childhood environment.",
            "Very low developmental friction. Correlates with consistent nurturing and biological stability during formative years.",
            "Low developmental friction. Standard, highly stable early environmental baseline.",
            "Below average friction. Relatively smooth developmental trajectory with minimal disruptions.",
            "Standard developmental baseline. Normal mix of stability and environmental challenges.",
            "Standard developmental baseline. Average psychological friction during early growth.",
            "Elevated developmental friction. Indicates noticeable environmental, biological, or emotional turbulence during formative years.",
            "High developmental friction. Strong marker for a highly unstable or stressful early childhood environment.",
            "Severe developmental friction. Correlates with deeply chaotic, disrupted, or highly challenging early circumstances.",
            "Extreme developmental friction. Maximum biological marker for severe structural and environmental trauma during development."
        ]);

        // ---------------------------------------------------------
        // 18. Parental Imprint (Maternal vs Paternal Dominance)
        // ---------------------------------------------------------
        // Compares left auricular/hemisphere volume (maternal) vs right (paternal).
        const leftHemisphereVol = this.dist(m[234], m[10]) + this.dist(m[234], m[152]);
        const rightHemisphereVol = this.dist(m[454], m[10]) + this.dist(m[454], m[152]);
        const parentalImprint = leftHemisphereVol / rightHemisphereVol;
        traits.parentalImprint = this.scoreTrait10(parentalImprint, 0.85, 1.15, [
            "Extreme Paternal Imprint. Indicates near-total psychological domination or influence by the father/masculine figure.",
            "Strong Paternal Imprint. Heavy reliance on the masculine figure for core psychological and behavioral modeling.",
            "Moderate Paternal Imprint. Father figure was the primary structural authority in early development.",
            "Slight Paternal Imprint. Mild bias toward masculine behavioral modeling.",
            "Perfectly Balanced Imprint. Equal psychological integration of both maternal and paternal figures.",
            "Perfectly Balanced Imprint. Symmetrical developmental influence.",
            "Slight Maternal Imprint. Mild bias toward feminine behavioral modeling.",
            "Moderate Maternal Imprint. Mother figure was the primary emotional and structural anchor.",
            "Strong Maternal Imprint. Heavy reliance on the feminine figure for core psychological modeling.",
            "Extreme Maternal Imprint. Indicates near-total psychological domination or influence by the mother/feminine figure."
        ]);

        // ---------------------------------------------------------
        // 19. Romantic Relationship Behavior (Amativeness / Conjugality)
        // ---------------------------------------------------------
        // Calculates lip volume (inner mucous membrane distance) combined with chin indentation.
        const lipVolume = this.dist(m[13], m[14]) / this.dist(m[61], m[291]);
        const chinIndentation = Math.abs(m[175].z - m[152].z);
        const amativenessScore = lipVolume + (chinIndentation * 0.5);
        traits.romanticBehavior = this.scoreTrait10(amativenessScore, 0.1, 0.5, [
            "Extremely detached. Biologically predisposed to severe emotional isolation; views romantic attachment as a strict utility.",
            "Highly stoic baseline. Intensely guarded in romance; prioritizes extreme autonomy over emotional enmeshment.",
            "Reserved baseline. Highly selective, slow to attach, and maintains strict emotional boundaries.",
            "Pragmatic baseline. Balanced, conditional attachment; values independence alongside partnership.",
            "Standard conjugate baseline. Normal romantic attachment and pair-bonding instincts.",
            "Standard conjugate baseline. Stable, predictable affection metrics.",
            "Elevated amativeness. Strong desire for emotional enmeshment and persistent validation in relationships.",
            "High amativeness. Intensely passionate baseline; heavily reliant on continuous emotional and physical connection.",
            "Severe amativeness. Prone to absolute devotion, extreme jealousy, and hyper-fixation on the romantic partner.",
            "Extreme amativeness. Maximum biological marker for obsessive, consuming, and potentially volatile romantic attachments."
        ]);

        // ---------------------------------------------------------
        // 20. Career Alignment (Execution vs. Abstract Vector)
        // ---------------------------------------------------------
        // Measures Pyriform (Mental/Artistic) vs. Motive (Action/System) facial proportions.
        const pyriformRatio = t1 / t3; // Cerebral third vs Instinctual third
        traits.careerAlignment = this.scoreTrait10(pyriformRatio, 0.6, 1.4, [
            "Hyper-Kinetic/Physical Execution. Ideal for pure physical labor, combat, or intense kinetic deployment. Zero abstract tolerance.",
            "Tactical Execution. Excels in immediate, hands-on, crisis-response careers (military, frontline operations).",
            "Systematic Execution. Strong alignment with direct management, logistics, and hard-metric operational roles.",
            "Pragmatic Management. Prefers practical, ground-level business execution over theoretical planning.",
            "Balanced Vector. Capable in both tactical execution and mid-level abstract planning.",
            "Balanced Vector. Adaptable to varied career environments.",
            "Abstract Management. Prefers high-level strategy, architectural design, and complex system planning.",
            "Theoretical/Artistic. Strong alignment with pure creative design, literature, and abstract conceptualization.",
            "Hyper-Theoretical. Excels exclusively in pure philosophy, advanced mathematics, or isolated creative arts.",
            "Pure Abstraction. Maximum biological marker for theoretical detachment; entirely unsuited for practical, ground-level execution."
        ]);
        // ============================================================================
        // BEHAVIORAL & SUBCONSCIOUS ABSTRACTIONS (BLOCK 2)
        // ============================================================================

        // ---------------------------------------------------------
        // 21. Core Aptitude Vector (Naturally Talented At)
        // ---------------------------------------------------------
        // Evaluates the dominant facial third: Upper (Mental/Pyriform), Middle (Motive), Lower (Vital).
        // The Pyriform face correlates with literary and artistic talent[cite: 1], while the Motive (long) face correlates with physical action[cite: 1].
        const aptitudeScore = (t1 > t2 && t1 > t3) ? 0.2 : (t2 > t1 && t2 > t3) ? 0.5 : 0.8;
        traits.coreAptitude = this.scoreTrait10(aptitudeScore + (asymmetryVal * 0.1), 0.1, 1.0, [
            "Hyper-Mental Aptitude. Extreme natural talent for abstract theory, literature, and isolated artistic creation. Untalented at physical execution.",
            "Strong Mental Aptitude. Naturally excels in creative, academic, and strategic thinking.",
            "Mental-Motive Hybrid. Talented at translating abstract concepts into mechanical or operational reality.",
            "Leaning Mechanical. Aptitude favors structural design, engineering, and logistics.",
            "Pure Motive Aptitude. Extremely talented in direct physical action, speed, and active execution[cite: 1]. Untalented at passive, desk-bound tasks.",
            "Motive-Vital Hybrid. Excels at managing physical resources and directing teams.",
            "Leaning Vital. Natural talent for sales, diplomacy, and resource acquisition.",
            "Strong Vital Aptitude. Highly talented in commercial trading, socialization, and rapid versatility.",
            "Extreme Vital Aptitude. Maximum natural talent for public engagement, networking, and rapid situational adaptation.",
            "Hyper-Vital Aptitude. Purely driven by instinctual social mechanics and environmental absorption."
        ]);

        // ---------------------------------------------------------
        // 22. Interpersonal Dynamics (Social Interaction)
        // ---------------------------------------------------------
        // Measures facial roundness (Vital temperament) vs angularity. The round face is highly genial and versatile[cite: 1].
        const socialRatio = faceWidth / faceHeight;
        traits.interpersonalDynamics = this.scoreTrait10(socialRatio, 0.7, 1.0, [
            "Extremely Isolationist. Interacts with severe reservation; heavily depletes energy in social environments.",
            "Highly Guarded. Prefers minimal interaction; highly selective and transactional with social energy.",
            "Reserved. Default interaction is polite but distant. Keeps strict boundaries.",
            "Pragmatic Socializer. Interacts effectively when necessary for operational goals.",
            "Balanced Interpersonal Baseline. Capable of both isolation and active socialization without extreme drain.",
            "Accessible Baseline. Naturally open to interaction; default stance is approachable.",
            "Genial & Versatile. Interacts with high elasticity and ease of manner[cite: 1].",
            "Highly Social. Actively seeks out interaction; processes information best through dialogue.",
            "Hyper-Extroverted. Interacts continuously; strongly relies on external validation and group dynamics.",
            "Extreme Vital Socializer. Maximum biological drive for continuous, unrestricted interpersonal engagement."
        ]);

        // ---------------------------------------------------------
        // 23. Challenge Resolution (Facing Friction)
        // ---------------------------------------------------------
        // Calculates nasal convexity (Combative/Roman baseline). The combative nose indicates a disposition to fight, contend, and argue[cite: 1].
        const combativeZ = Math.abs(m[6].z - m[168].z);
        traits.challengeResolution = this.scoreTrait10(combativeZ, 5, 20, [
            "Total Evasion. Instinctually avoids conflict at all costs; collapses or retreats under direct pressure.",
            "Highly Defensive. Meets challenges with extreme caution and attempts to subvert rather than confront.",
            "Defensive/Yielding. Prefers compromise and pacification when facing friction.",
            "Tactical Evasion. Navigates around challenges rather than breaking through them.",
            "Measured Resistance. Meets challenges with calculated, proportionate force.",
            "Direct Resistance. Default stance is to hold ground and defend current positions.",
            "Combative Baseline. Meets challenges head-on; natural disposition to argue, contend, and conquer[cite: 1].",
            "Highly Aggressive. Actively attacks impediments; thrives on friction and high-stakes conflict.",
            "Hyper-Aggressive. Actively seeks out and provokes challenges; utilizes overpowering force.",
            "Maximum Belligerence. Extreme biological imperative to violently crush any perceived challenge or opposition."
        ]);

        // ---------------------------------------------------------
        // 24. Teleological Drive (Aiming for Goals)
        // ---------------------------------------------------------
        // Derived from mandibular width and projection. The broad, square chin indicates masterfulness and never giving up[cite: 1].
        const goalDrive = jawWidth * chinProjVal;
        traits.goalAiming = this.scoreTrait10(goalDrive, 50, 150, [
            "Apathetic Baseline. Near-zero internal drive for long-term goal acquisition; highly reactive to immediate stimuli.",
            "Low Tenacity. Abandons goals quickly when faced with sustained friction.",
            "Variable Drive. Goal pursuit is entirely dependent on fluctuating enthusiasm or external pressure.",
            "Moderate Tenacity. Capable of achieving short-to-medium term objectives with external structuring.",
            "Standard Operational Drive. Consistent, average pursuit of established milestones.",
            "Determined Baseline. Sustains focus on goals despite moderate setbacks.",
            "High Tenacity. Strongly enduring; pursues objectives with disciplined, long-term focus.",
            "Masterful Execution. Broad, square-jawed persistence; physically and mentally refuses to yield until the goal is secured[cite: 1].",
            "Relentless Drive. Hyper-fixated on goal acquisition; will exhaust all biological and environmental resources to win.",
            "Extreme Teleological Fixation. Maximum biological marker for absolute, unbreakable, and ruthless goal obsession."
        ]);

        // ---------------------------------------------------------
        // 25. Daily Operational Baseline (Typical Day)
        // ---------------------------------------------------------
        // Synthesizes the structural execution pattern (Motive temperament) versus impulse.
        const operationalPattern = (faceHeight / jawWidth) * philtrumRatio;
        traits.typicalDay = this.scoreTrait10(operationalPattern, 0.05, 0.25, [
            "Pure Chaos. Daily routine is entirely unstructured, impulsive, and dictated by momentary desires.",
            "Highly Unstructured. Resists schedules; operates entirely on spontaneous bursts of energy.",
            "Reactive Routine. Day is dictated by external demands rather than internal systemization.",
            "Loose Framework. Maintains a basic skeleton of a routine but frequently deviates.",
            "Standard Framework. Balances structured habits with necessary daily flexibility.",
            "Systematic Baseline. Prefers a predictable, moderately optimized daily flow.",
            "Highly Structured. Day is tightly scheduled; relies heavily on tracking, data, and optimized habit loops.",
            "Rigidly Optimized. Typical day is executed with mechanical precision; zero tolerance for operational inefficiency.",
            "Hyper-Systemized. Entire existence is compartmentalized into strict execution algorithms and spreadsheets.",
            "Extreme Algorithmic Routine. Maximum biological marker for severe rigidity; absolute deviation panic."
        ]);

        // ---------------------------------------------------------
        // 26. Cognitive Capacity (Approximate Intelligence)
        // ---------------------------------------------------------
        // Uses Camper's Facial Angle (measuring forehead prominence to upper lip) which historically denotes degrees of intelligence[cite: 1].
        const facialAngle = TitanGeometry.calcAngle(m[10], m[33], m[152]);
        traits.cognitiveCapacity = this.scoreTrait10(facialAngle, 75, 95, [
            "Severely Diminished Processing. Indicates highly primitive cognitive processing and minimal abstract retention.",
            "Low Processing Baseline. Concrete, slow-moving cognitive absorption.",
            "Below Average Capacity. Struggles with complex, multi-layered abstract reasoning.",
            "Standard Practical Intellect. Functional, everyday cognitive processing. Learns through repetition.",
            "Average Cognitive Capacity. Standard processing speed and abstract comprehension.",
            "Above Average Capacity. Quick discernment; easily grasps and applies new conceptual frameworks.",
            "High Cognitive Processing. Sharp, analytical mind; strong capacity for synthesis and complex problem-solving.",
            "Superior Intellect. Rapid, highly expansive cognitive capacity; naturally dissects and rebuilds complex systems.",
            "Exceptional Processing. Near-genius baseline; extreme speed in abstract pattern recognition.",
            "Maximum Cognitive Synthesis. Extreme biological marker for profound, high-velocity intellectual and theoretical capacity."
        ]);

        // ---------------------------------------------------------
        // 27. Deepest Unconscious Fears (Threat Anticipation)
        // ---------------------------------------------------------
        // Calculates the dip of the nasal septum (Apprehensive Nose), which indicates a constant state of foreboding and fear[cite: 1].
        const septumDip = m[2].y - m[1].y; // Nose tip vs septum base
        traits.unconsciousFears = this.scoreTrait10(septumDip, -2, 5, [
            "Absolute Fearlessness. Near-total absence of threat anticipation; biologically incapable of foreboding.",
            "Extremely Low Apprehension. Highly oblivious to environmental or interpersonal dangers.",
            "Low Apprehension. Rarely anticipates negative outcomes; naturally overly-optimistic.",
            "Standard Threat Detection. Normal, healthy baseline of situational awareness.",
            "Balanced Apprehension. Accurately evaluates actual risks without unconscious panic.",
            "Elevated Caution. Unconsciously scans environments for potential failure points or structural collapse.",
            "Deep Fear of Betrayal. High unconscious anticipation of interpersonal deceit or system failure.",
            "Strong Foreboding Baseline. The apprehensive nose structure indicates constant anxiety and fear of the future[cite: 1].",
            "Severe Unconscious Paranoia. Deeply terrified of total loss of control; constantly modeling worst-case scenarios.",
            "Extreme Threat Anticipation. Maximum marker for paralyzing unconscious dread and hyper-vigilant paranoia."
        ]);

        // ---------------------------------------------------------
        // 28. Deepest Unconscious Desires (Core Drive)
        // ---------------------------------------------------------
        // Measures the concavity/indentation of the chin. An indented chin shows a hunger and thirst for affection and the desire to be loved[cite: 1].
        const chinDesire = Math.abs(m[175].z - m[152].z);
        traits.unconsciousDesires = this.scoreTrait10(chinDesire, 1, 8, [
            "Nihilistic Autonomy. Deepest desire is total, absolute isolation and zero dependency on any entity.",
            "Extreme Independence. Core unconscious drive is to remain entirely untouched and uninfluenced by others.",
            "Structural Dominance. Unconscious desire is to build and control static systems rather than connect.",
            "Status & Approval. Deeply desires public recognition and hierarchical superiority.",
            "Security & Stability. Core drive is absolute environmental and financial predictability.",
            "Intellectual Supremacy. Unconsciously desires to be universally recognized for cognitive output.",
            "Slight Affection Drive. Underlying desire for specific, curated interpersonal connection.",
            "Strong Hunger for Affection. The indented chin indicates a deep, continuous desire to be loved and validated[cite: 1].",
            "Severe Need for Enmeshment. Unconsciously desires total psychological fusion with another individual.",
            "Extreme Devotional Thirst. Maximum biological marker for an all-consuming, desperate unconscious drive for absolute love."
        ]);
        // ============================================================================
        // OPERATIONAL & RISK ABSTRACTIONS (BLOCK 3)
        // ============================================================================

        // ---------------------------------------------------------
        // 29. Time Management Prediction (Execution Velocity)
        // ---------------------------------------------------------
        // Calculates facial length (Motive/Speed) vs. nasal concavity (Snub/Procrastination).
        const executionVelocity = (faceHeight / faceWidth) - (Math.abs(m[1].z - m[4].z) * 0.5);
        traits.timeManagement = this.scoreTrait10(executionVelocity, 1.0, 1.8, [
            "Severe Procrastination Baseline. Mind hesitates and defers action entirely[cite: 1]. Highly unstructured execution.",
            "High Procrastination. Operates with extreme delay; struggles significantly with direct, timely execution.",
            "Delayed Execution. Habitually defers tasks; requires intense external deadlines to finalize output.",
            "Variable Velocity. Execution speed fluctuates based on immediate interest or external pressure.",
            "Standard Execution Baseline. Normal, practical pacing. Neither hyper-fast nor chronically delayed.",
            "Consistent Pacing. Reliable and structured approach to time management and task completion.",
            "Direct Execution. Elevated activity levels; moves through tasks with minimal hesitation.",
            "High Velocity. Strong directness of movements[cite: 1]. Operates with deliberate, sustained speed.",
            "Hyper-Kinetic Execution. Highly impatient with delay; executes operations with aggressive rapidity.",
            "Maximum Execution Velocity. Extreme biological drive for immediate, relentless action and absolute zero latency."
        ]);

        // ---------------------------------------------------------
        // 30. Persuasion Perceptibility (Skepticism vs. Credulity)
        // ---------------------------------------------------------
        // Measures nasal alar width (Confiding vs Secretive). 
        const alarWidth = this.dist(m[129], m[358]) / IPD;
        traits.persuasionPerceptibility = this.scoreTrait10(alarWidth, 0.4, 0.8, [
            "Extreme Credulity. Highly confiding disposition[cite: 1]. Biologically predisposed to implicitly trust external data and persuasion.",
            "High Susceptibility. Very easily influenced by environmental sentiment, marketing, and authoritative suggestions.",
            "Trusting Baseline. Open to persuasion; default stance assumes the validity of presented information.",
            "Receptive but Grounded. Mildly trusting; requires only standard validation to be persuaded.",
            "Balanced Perceptibility. Evaluates persuasion logically; standard skepticism baseline.",
            "Pragmatic Skeptic. Requires solid empirical data before yielding to external influence.",
            "Guarded Baseline. Default stance is suspicious of motives; naturally resists persuasion tactics.",
            "Highly Skeptical. Strong secretiveness and concealment[cite: 1]. Deeply distrustful of sales mechanics or behavioral design.",
            "Severe Skepticism. Near-impervious to persuasion; automatically assumes deception in all external input.",
            "Absolute Paranoia. Maximum biological marker for total distrust; completely rejects all external influence and persuasion."
        ]);

        // ---------------------------------------------------------
        // 31. Risk Tolerance (Volatility Threshold)
        // ---------------------------------------------------------
        // Combines nasal bridge projection (Roman/Reckless) and mandibular width (Broad/Daring).
        const volatilityThreshold = (Math.abs(m[6].z - m[168].z)) * (jawWidth / IPD);
        traits.riskTolerance = this.scoreTrait10(volatilityThreshold, 5, 25, [
            "Extreme Risk Aversion. Biologically incapable of handling uncertainty; total panic response to high-stakes volatility.",
            "Severe Caution. Highly apprehensive; meticulously calculates all variables to avoid any potential loss.",
            "Risk Averse Baseline. Strongly prefers established, predictable, and heavily guarded operational structures.",
            "Conservative Operator. Will only accept minimal risk if heavily hedged and logically sound.",
            "Standard Volatility Threshold. Capable of navigating normal, everyday uncertainties without structural collapse.",
            "Calculated Risk Taker. Willing to leverage assets or safety if the probability matrix is highly favorable.",
            "Elevated Risk Appetite. Comfortable operating in uncertain, high-stakes environments.",
            "High Volatility Tolerance. Shows distinct courage and daring[cite: 1]; actively utilizes risk as a strategic tool.",
            "Hyper-Risk Appetite. Thrives on extreme volatility; actively seeks out highly uncertain, high-yield scenarios.",
            "Maximum Recklessness. Exhibits a reckless disregard for personal safety[cite: 1] or asset preservation; absolute biological appetite for gambling."
        ]);

        // Note: For brevity in the immediate UI phase, we've implemented the core 10 metrics.
        // We will expand the final 5 (Eye Depth, Mouth Width, Brow Ridge, Philtrum, Asymmetry) 
        // using the exact same 10-level architecture in the next phase as we add your new metrics.

        return traits;
    }
};
