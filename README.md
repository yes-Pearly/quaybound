# QUAYBOUND

**25 levels. Five terrible vehicles.** A browser driving game by **Pigeon Studio**.

Drive a buggy, a van, a monster truck, a kart or a suspiciously legal rocket car across 25 short tracks. Boost strips, springs, falling roads, see-saws, moving bridges, ice, conveyor belts, swinging balls, sweepers and presses. Grab the three stamps. Try again. Honk for absolutely no reason.

English by default; French available. Keyboard and touch controls. Fullscreen. Local best times. No account, ads, analytics, CDN, remote fonts or runtime downloads.

| Controls | Action |
| --- | --- |
| → / D / W | Go; tilt backwards in the air |
| ← / A / S | Brake, reverse; tilt forwards in the air |
| R | Instant retry |
| Escape / P | Pause |
| F | Fullscreen |
| H | Honk |
| M | Sound |
| Space | Start / retry / next |

**Play locally:** open `index.html` or `Quaybound.html` in a modern browser. The complete game is embedded, including both libraries. No server or installation is required. WebGL must be available.

## Source edition

Edit `levels.js`, `physics.js`, `render.js`, `game.js`, `i18n.js`, `audio.js`, `style.css` and `shell.html`. Regenerate the two playable HTML files:

```sh
node scripts/build-standalone.cjs
```

The template `shell.html` is for development through HTTP. The generated `index.html` is the direct-opening and hosting entry point. Do not edit generated HTML by hand.

Regression checks:

```sh
node --test tests/*.test.cjs
```

The physics checks complete all 25 recommended-vehicle routes with all stamps within their target times, exercise the garage vehicles, braking, air control, parking, boosts, springs, falling planks, see-saws, crush hazards, water failures and the countdown. Browser playtesting checks rendering, controls, menus, translation and fullscreen separately.

## GitHub Pages

Publish the playable `index.html` at the repository root. In **Settings → Pages**, choose **Deploy from a branch → main → /(root)**. The source edition also includes an optional Actions deployment workflow. No build is required for the published game.

## Français

**25 pistes. Cinq engins douteux.** Un jeu de navigateur de **Pigeon Studio**. Choisis un véhicule dans le garage, accélère, freine et recommence. Les arrivées jaunes demandent de se garer ; les flèches jaunes donnent un boost. **H** : pouêt. **EN / FR** : français. **F** : plein écran. Les records restent dans ton navigateur.

Pour jouer hors ligne, ouvre `index.html` ou `Quaybound.html` directement dans Chrome, Firefox, Edge ou Safari. Le jeu est inclus dans chaque fichier.

## Credits

Original game code, procedural artwork, pigeon logo and synthesized sound: **Pigeon Studio**, 2026. All rights reserved for original game material. No assets from Drive Mad are included.

Three.js 0.170.0 and Matter.js 0.20.0 are included under their MIT licenses. See `vendor/THREE-LICENSE.txt`, `vendor/MATTER-LICENSE.txt`, or the combined `LICENSES.txt`.
