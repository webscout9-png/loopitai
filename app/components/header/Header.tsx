import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames(
        'flex items-center px-3 border-b h-[var(--header-height)] bg-bolt-elements-background-depth-1',
        {
          'border-transparent': !chat.started,
          'border-bolt-elements-borderColor': chat.started,
        },
      )}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <a href="/" aria-label="Looopit home" className="flex items-center gap-2 text-bolt-elements-textPrimary">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 text-accent-500">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M8 7.5h8a4.5 4.5 0 0 1 0 9h-1.5M16 16.5H8a4.5 4.5 0 0 1 0-9h1.5M9.5 12h5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">looopit</span>
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="min-w-0 flex-1 px-2 sm:px-4 truncate text-center text-sm text-bolt-elements-textSecondary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="shrink-0">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
