import { describe, expect, it } from 'vitest';
import { getGameBuildGuidance, getGameStarterTemplate, isGameBuildRequest } from './game-build-guidance';

describe('game build guidance', () => {
  it.each([
    'Create a simple Snake game',
    'Build me a playable tic-tac-toe game',
    'Add a pause button to the existing arcade game',
    'Create Minesweeper',
    'Build a Wordle clone',
    '[Model: example]\n[Provider: Example]\nMake a small platformer',
  ])('recognizes a game-building request: %s', (message) => {
    expect(isGameBuildRequest(message)).toBe(true);
  });

  it.each([
    'Create a landing page for my game studio',
    'Build a portfolio website for a game developer',
    'Explain how a game loop works',
    'Create a budgeting app',
  ])('does not treat a non-game task as game generation: %s', (message) => {
    expect(isGameBuildRequest(message)).toBe(false);
    expect(getGameBuildGuidance(message)).toBe('');
    expect(getGameStarterTemplate(message)).toBeUndefined();
  });

  it('uses a blank starter and a readable title for game requests', () => {
    expect(getGameStarterTemplate('[Model: gpt]\n[Provider: OpenAI]\nCreate a Snake game!')).toEqual({
      template: 'blank',
      title: 'Create a Snake game',
    });
  });

  it('includes implementation and validation guidance for playable games', () => {
    const guidance = getGameBuildGuidance('Build a browser game');

    expect(guidance).toContain('not a marketing page');
    expect(guidance).toContain('requestAnimationFrame');
    expect(guidance).toContain('build or test script');
  });
});
