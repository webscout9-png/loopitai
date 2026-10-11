import React from 'react';

const EXAMPLE_PROMPTS = [
  { text: 'Create a mobile app landing page for a productivity startup', icon: 'i-ph:device-mobile' },
  { text: 'Build a todo app in React using Tailwind', icon: 'i-ph:check-square' },
  { text: 'Build a simple blog using Astro', icon: 'i-ph:article' },
  { text: 'Create a cookie consent form using Material UI', icon: 'i-ph:cookie' },
  { text: 'Make a space invaders game', icon: 'i-ph:game-controller' },
  { text: 'Make a Tic Tac Toe game in html, css and js only', icon: 'i-ph:circles-three' },
];

export function ExamplePrompts(sendMessage?: { (event: React.UIEvent, messageInput?: string): void | undefined }) {
  return (
    <section id="examples" aria-label="Example prompts" className="relative mx-auto mt-5 mb-8 w-full max-w-3xl px-4">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-bolt-elements-textTertiary">
          Start with an idea
        </h2>
        <span className="h-px flex-1 bg-bolt-elements-borderColor" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_PROMPTS.map((examplePrompt) => {
          return (
            <button
              key={examplePrompt.text}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="group flex min-h-12 items-center gap-3 rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-3 py-2 text-left text-xs leading-relaxed text-bolt-elements-textSecondary transition-colors hover:border-accent-500/50 hover:bg-bolt-elements-background-depth-3 hover:text-bolt-elements-textPrimary"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary transition-colors group-hover:text-accent-400">
                <span aria-hidden="true" className={`${examplePrompt.icon} text-lg`} />
              </span>
              <span>{examplePrompt.text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
