<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# Cinematic Life Score 🎯


## Basic Details
### Team Name: Itachi


### Team Members
- Team Lead: Mruthula S - Adi Shankara Institute of Engineering and Technology
- Member 2: Anna Catherine - Adi Shankara Institute of Engineering and Technology

### Project Description
Cinematic Life Score turns everyday computer usage into an adaptive, real-time Hollywood film score completely inside your browser. By continuously sampling keyboard rhythm, mouse kinematics, and facial telemetry (mouth aperture, head movement, head tilt) via browser APIs, the client uses mathematical heuristics to evaluate your dramatic intensity ($0\text{--}100$) and dynamically adjusts a multi-layered Web Audio synth orchestra every 500 ms with zero latency, zero cloud costs, and no mandatory backend.

### The Problem (that doesn't exist)
Modern digital workflows are devoid of emotional resonance. Writing an urgent Slack message, fixing a production bug at 1:00 AM, or frantically rewriting an email before hitting "Send" carries the existential weight of an interstellar mission, yet transpires in utter, mundane silence.

### The Solution (that nobody asked for)
An in-browser cinematic engine that scores your desk routine in real time. When typing transitions from a methodical pace to erratic, backspace-heavy bursts alongside rapid head tilting, the deterministic scoring engine detects the sudden plot twist, transitioning the soundscape from a gentle ambient piano arpeggio into driving percussion, staccato brass stabs, and a 4-voice tremolo climax.

## Technical Details
### Technologies/Components Used
For Software:
- Languages used: JavaScript (ES6+), HTML5, CSS3, Python 3.10+ (optional backend)
- Frameworks used: React, Vite, FastAPI (optional offline-first architecture)
- Libraries used: @mediapipe/tasks-vision (Face Landmarker), scikit-learn (optional fallback backend), NumPy
- Tools used: Web Audio API (real-time procedural oscillator synthesis), Browser MediaDevices & Performance APIs, Git, VS Code

### Implementation
For Software:
# Installation
#Clone the repository

git clone https://github.com/your-username/cinematic-life-score.git

cd cinematic-life-score

#Install client dependencies (all core scoring & synthesis run here)

cd frontend

npm install

#(Optional) Set up the secondary ML backend

cd ../backend

python -m venv venv

source venv/bin/activate  # Windows: venv\Scripts\activate

pip install fastapi uvicorn scikit-learn numpy

# Run
#Terminal 1: Run Python Backend
cd backend
source venv/bin/activate # Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
#Terminal 2: Run Client Frontend
cd frontend
npm run dev

### Project Documentation
For Software:

# Screenshots (Add at least 3)
![Screenshot1](Add screenshot 1 here with proper name)
*Add caption explaining what this shows*

![Screenshot2](Add screenshot 2 here with proper name)
*Add caption explaining what this shows*

![Screenshot3](Add screenshot 3 here with proper name)
*Add caption explaining what this shows*

# Diagram
                 +-------------------------------------------------------+
                 |                     USER INPUTS                       |
                 |  Keyboard Telemetry  |  Mouse Motion  |  Camera Feed  |
                 +-------------------------------------------------------+
                                             |
                                    (Rolling 3s Window)
                                             v
                 +-------------------------------------------------------+
                 |          useTelemetry.js + useWebcam.js               |
                 |   - WPM, Rhythm, Accel    - Px/sec, Idle, Clicks      |
                 |   - Head Motion, Head Tilt, Mouth Aperture            |
                 +-------------------------------------------------------+
                                             |
                                     (Every 500ms Tick)
                                             v
                 +-------------------------------------------------------+
                 |            DRAMA SCORING ENGINE (0 - 100)             |
                 |   Primary: In-Browser Mathematical Heuristic Engine   |
                 |   Fallback/Alt: Optional FastAPI Gradient Boosting    |
                 |   Calibration: Z-Score Offset (Mean / Std)            |
                 |   Filter: Exponential Moving Average (Alpha = 0.35)   |
                 +-------------------------------------------------------+
                                             |
                                             v
                 +-------------------------------------------------------+
                 |             musicEngine.js (Web Audio API)            |
                 |   Dynamic Gain Envelopes (Calculated Procedurally)    |
                 +-------------------------------------------------------+
                     |            |             |            |           |
                     v            v             v            v           v
                 0 - 20        20 - 40       40 - 60      60 - 80     80 - 100
                 Piano         Strings       Percussion   Brass       Tremolo Pad
                 (Sine)        (Triangle)    (Rimshot)    (Sawtooth)  + Sub-bass
End-to-end data flow: Client-side input telemetry is captured every 500 ms, converted into a 0–100 index via weighted formulas, smoothed, and routed to five procedural oscillator groups.

### Project Demo
# Video
[Add your demo video link here]
*Explain what the video demonstrates*

## Team Contributions
- Mruthula S: Frontend
- Anna Catherine: Frontend

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)




