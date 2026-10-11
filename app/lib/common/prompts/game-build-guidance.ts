const gameRequestPattern =
  /\b(?:gameplay|arcade game|video game|snake|tetris|pong|breakout|tic[- ]tac[- ]toe|platformer|shooter|puzzle game|rpg|minesweeper|wordle|flappy bird|memory match|memory card|2048|chess|checkers)\b|\bgame\b/i;
const gameCreationPattern = /\b(?:build|create|make|develop|implement|code|prototype|add)\b/i;

export function isGameBuildRequest(message: string): boolean {
  if (!gameRequestPattern.test(message) || !gameCreationPattern.test(message)) {
    return false;
  }

  const gameIndex = message.search(gameRequestPattern);
  const taskBeforeGame = message.slice(0, gameIndex);

  return !/\b(?:website|landing page|portfolio|marketing page|store)\b/i.test(taskBeforeGame);
}

export function getGameStarterTemplate(message: string): { template: 'blank'; title: string } | undefined {
  if (!isGameBuildRequest(message)) {
    return undefined;
  }

  const title = message
    .replace(/\[(?:Model|Provider):[^\]]+\]\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .slice(0, 64);

  return { template: 'blank', title: title || 'Game project' };
}

export function getGameBuildGuidance(message: string): string {
  if (!isGameBuildRequest(message)) {
    return '';
  }

  return `
<game_build_requirements>
  This request is for a playable game, not a marketing page. Prioritize a complete, responsive game loop over decorative sections.
  - Implement the requested core mechanic first. Keep the architecture proportionate: use browser APIs or the existing project stack; do not add a game engine or dependencies unless the request needs them.
  - Separate game state updates from rendering. For animation, use requestAnimationFrame with elapsed-time updates and clean up animation frames and input listeners when the game ends or unmounts.
  - Provide visible, accurate controls and working start/restart behavior. Add scoring, pause, win, or game-over states when they fit the requested game; do not add irrelevant states.
  - Handle keyboard input without page scrolling for game controls. Make buttons and essential controls usable on touch screens when appropriate.
  - Keep the play area responsive and ensure movement, collision, boundaries, and state transitions behave consistently at different frame rates and screen sizes.
  - Do not substitute a promotional landing page or unrelated stock photography for the requested playable experience.
  - After writing files, run the project's existing build or test script when one is defined, using a shell action before the final start action. Do not invent scripts or claim checks passed without their output.
  - Keep the visual style focused on the game: a clear play area, readable score/status, and polished controls. Do not turn a game request into a landing page unless explicitly requested.
</game_build_requirements>
`;
}
