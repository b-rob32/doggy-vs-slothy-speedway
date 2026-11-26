# 🏁 Doggy vs. Slothy Speedway

A joyful 2-player real-time math racing game featuring **Team Doggy** and **Team Slothy**!

## Features
- **2-Player Real-Time Racing (2 Devices)**: Peer-to-peer WebRTC (`PeerJS`) with a simple 4-letter room code — works on any Wi-Fi or internet connection with zero backend server.
- **Solo vs. CPU Mode**: Practice against Chill, Speedy, or Turbo Pro AI and earn Speed Coins anytime.
- **Math Modes & Fair Play**:
  - Addition, Subtraction, Multiplication (with optional single times-table focus ×2–×12), Division, and Mixed.
  - Easy, Medium, and Hard difficulty tiers.
  - Selectable **Multiple Choice (4 big buttons + keys 1–4)** or **Type Answer (on-screen numpad + keyboard)**.
  - Optional **Custom Math per Player** toggle so sisters of different ages can race fairly!
  - Optional **Fair Race (No Garage Perks)** toggle for 100% pure math speed.
- **Speedway Racing & Unique Turbo Animations**:
  - Lap Races (2, 3, or 5 laps) and 60-second Timed Sprints.
  - Wrong-answer spin-outs and streak-powered **Turbo Boosts** with unique Team Doggy & Team Slothy action animations!
- **Garage Shop & Speed Coins**:
  - Earn Speed Coins every race to buy unlockable **Cars**, **Performance Gear**, **Driver Accessories**, and **Particle Trails** — rendered live on the track!
- **Career Stats & Profile Transfer**:
  - Lifetime stats across all races, per-operation mastery bars, recent race history, and a Backup/Transfer code to sync between tablets.

## Running Locally
```bash
npm install
npm run dev
```

## Deploying to GitHub Pages
Push to `main` and enable **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included workflow automatically builds and publishes the game!
