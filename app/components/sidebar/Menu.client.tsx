import { motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { ThemeSwitch } from '~/components/ui/ThemeSwitch';
import { ControlPanel } from '~/components/@settings/core/ControlPanel';
import { SettingsButton, HelpButton } from '~/components/ui/SettingsButton';
import { Button } from '~/components/ui/Button';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from '~/components/chat/APIKeyManager';
import { db, deleteById, getAll, chatId, type ChatHistoryItem, useChatHistory } from '~/lib/persistence';
import { cubicEasingFn } from '~/utils/easings';
import { HistoryItem } from './HistoryItem';
import { binDates } from './date-binning';
import { useSearchFilter } from '~/lib/hooks/useSearchFilter';
import { classNames } from '~/utils/classNames';
import { useStore } from '@nanostores/react';
import { profileStore } from '~/lib/stores/profile';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import type { ProviderInfo } from '~/types/model';
import type { ModelInfo } from '~/lib/modules/llm/types';

const menuVariants = {
  closed: {
    opacity: 0,
    visibility: 'hidden',
    left: '-288px',
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
  open: {
    opacity: 1,
    visibility: 'initial',
    left: 0,
    transition: {
      duration: 0.2,
      ease: cubicEasingFn,
    },
  },
} satisfies Variants;

type DialogContent =
  | { type: 'delete'; item: ChatHistoryItem }
  | { type: 'bulkDelete'; items: ChatHistoryItem[] }
  | null;

interface MenuProps {
  provider?: ProviderInfo;
  setProvider?: (provider: ProviderInfo) => void;
  providerList?: ProviderInfo[];
  model?: string;
  setModel?: (model: string) => void;
  modelList?: ModelInfo[];
  apiKeys?: Record<string, string>;
  onApiKeysChange?: (providerName: string, apiKey: string) => void;
  isModelLoading?: string;
}

export const Menu = ({
  provider,
  setProvider,
  providerList = [],
  model,
  setModel,
  modelList = [],
  apiKeys = {},
  onApiKeysChange,
  isModelLoading,
}: MenuProps) => {
  const { duplicateCurrentChat, exportChat } = useChatHistory();
  const menuRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState<ChatHistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<DialogContent>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profile = useStore(profileStore);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'home' | 'ai' | 'usage'>('home');

  const { filteredItems: filteredList, handleSearchChange } = useSearchFilter({
    items: list,
    searchFields: ['description'],
  });

  const loadEntries = useCallback(() => {
    if (db) {
      getAll(db)
        .then((list) => list.filter((item) => item.urlId && item.description))
        .then(setList)
        .catch((error) => toast.error(error.message));
    }
  }, []);

  const deleteChat = useCallback(
    async (id: string): Promise<void> => {
      if (!db) {
        throw new Error('Database not available');
      }

      // Delete chat snapshot from localStorage
      try {
        const snapshotKey = `snapshot:${id}`;
        localStorage.removeItem(snapshotKey);
        console.log('Removed snapshot for chat:', id);
      } catch (snapshotError) {
        console.error(`Error deleting snapshot for chat ${id}:`, snapshotError);
      }

      // Delete the chat from the database
      await deleteById(db, id);
      console.log('Successfully deleted chat:', id);
    },
    [db],
  );

  const deleteItem = useCallback(
    (event: React.UIEvent, item: ChatHistoryItem) => {
      event.preventDefault();
      event.stopPropagation();

      // Log the delete operation to help debugging
      console.log('Attempting to delete chat:', { id: item.id, description: item.description });

      deleteChat(item.id)
        .then(() => {
          toast.success('Chat deleted successfully', {
            position: 'bottom-right',
            autoClose: 3000,
          });

          // Always refresh the list
          loadEntries();

          if (chatId.get() === item.id) {
            // hard page navigation to clear the stores
            console.log('Navigating away from deleted chat');
            window.location.pathname = '/';
          }
        })
        .catch((error) => {
          console.error('Failed to delete chat:', error);
          toast.error('Failed to delete conversation', {
            position: 'bottom-right',
            autoClose: 3000,
          });

          // Still try to reload entries in case data has changed
          loadEntries();
        });
    },
    [loadEntries, deleteChat],
  );

  const deleteSelectedItems = useCallback(
    async (itemsToDeleteIds: string[]) => {
      if (!db || itemsToDeleteIds.length === 0) {
        console.log('Bulk delete skipped: No DB or no items to delete.');
        return;
      }

      console.log(`Starting bulk delete for ${itemsToDeleteIds.length} chats`, itemsToDeleteIds);

      let deletedCount = 0;
      const errors: string[] = [];
      const currentChatId = chatId.get();
      let shouldNavigate = false;

      // Process deletions sequentially using the shared deleteChat logic
      for (const id of itemsToDeleteIds) {
        try {
          await deleteChat(id);
          deletedCount++;

          if (id === currentChatId) {
            shouldNavigate = true;
          }
        } catch (error) {
          console.error(`Error deleting chat ${id}:`, error);
          errors.push(id);
        }
      }

      // Show appropriate toast message
      if (errors.length === 0) {
        toast.success(`${deletedCount} chat${deletedCount === 1 ? '' : 's'} deleted successfully`);
      } else {
        toast.warning(`Deleted ${deletedCount} of ${itemsToDeleteIds.length} chats. ${errors.length} failed.`, {
          autoClose: 5000,
        });
      }

      // Reload the list after all deletions
      await loadEntries();

      // Clear selection state
      setSelectedItems([]);
      setSelectionMode(false);

      // Navigate if needed
      if (shouldNavigate) {
        console.log('Navigating away from deleted chat');
        window.location.pathname = '/';
      }
    },
    [deleteChat, loadEntries, db],
  );

  const closeDialog = () => {
    setDialogContent(null);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);

    if (selectionMode) {
      // If turning selection mode OFF, clear selection
      setSelectedItems([]);
    }
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const newSelectedItems = prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id];
      console.log('Selected items updated:', newSelectedItems);

      return newSelectedItems; // Return the new array
    });
  }, []); // No dependencies needed

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedItems.length === 0) {
      toast.info('Select at least one chat to delete');
      return;
    }

    const selectedChats = list.filter((item) => selectedItems.includes(item.id));

    if (selectedChats.length === 0) {
      toast.error('Could not find selected chats');
      return;
    }

    setDialogContent({ type: 'bulkDelete', items: selectedChats });
  }, [selectedItems, list]); // Keep list dependency

  const selectAll = useCallback(() => {
    const allFilteredIds = filteredList.map((item) => item.id);
    setSelectedItems((prev) => {
      const allFilteredAreSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => prev.includes(id));

      if (allFilteredAreSelected) {
        // Deselect only the filtered items
        const newSelectedItems = prev.filter((id) => !allFilteredIds.includes(id));
        console.log('Deselecting all filtered items. New selection:', newSelectedItems);

        return newSelectedItems;
      } else {
        // Select all filtered items, adding them to any existing selections
        const newSelectedItems = [...new Set([...prev, ...allFilteredIds])];
        console.log('Selecting all filtered items. New selection:', newSelectedItems);

        return newSelectedItems;
      }
    });
  }, [filteredList]); // Depends only on filteredList

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open, loadEntries]);

  // Exit selection mode when sidebar is closed
  useEffect(() => {
    if (!open && selectionMode) {
      /*
       * Don't clear selection state anymore when sidebar closes
       * This allows the selection to persist when reopening the sidebar
       */
      console.log('Sidebar closed, preserving selection state');
    }
  }, [open, selectionMode]);

  useEffect(() => {
    const enterThreshold = 20;
    const exitThreshold = 20;

    function onMouseMove(event: MouseEvent) {
      if (isSettingsOpen) {
        return;
      }

      if (event.pageX < enterThreshold) {
        setOpen(true);
      }

      if (menuRef.current && event.clientX > menuRef.current.getBoundingClientRect().right + exitThreshold) {
        setOpen(false);
      }
    }

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isSettingsOpen]);

  const handleDuplicate = async (id: string) => {
    await duplicateCurrentChat(id);
    loadEntries(); // Reload the list after duplication
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    setOpen(false);
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
  };

  const setDialogContentWithLogging = useCallback((content: DialogContent) => {
    console.log('Setting dialog content:', content);
    setDialogContent(content);
  }, []);

  return (
    <>
      <motion.div
        ref={menuRef}
        initial="closed"
        animate={open ? 'open' : 'closed'}
        variants={menuVariants}
        style={{ width: '288px' }}
        className={classNames(
          'flex selection-accent flex-col side-menu fixed top-0 h-full',
          'bg-bolt-elements-background-depth-1 border-r border-bolt-elements-borderColor',
          'text-sm',
          isSettingsOpen ? 'z-40' : 'z-sidebar',
        )}
      >
        <div className="h-12 flex items-center justify-between px-3 border-b border-bolt-elements-borderColor bg-bolt-elements-background-depth-2">
          <a href="/" className="flex items-center gap-2 text-bolt-elements-textPrimary" aria-label="Looopit home">
            <span className="flex h-6 w-6 items-center justify-center rounded border border-bolt-elements-borderColor text-accent-400">
              <span className="i-ph:code text-sm" />
            </span>
            <span className="text-xs font-semibold tracking-tight">looopit</span>
          </a>
          <div className="flex items-center gap-3">
            <HelpButton onClick={() => window.open('https://stackblitz-labs.github.io/bolt.diy/', '_blank')} />
            <span className="font-medium text-xs text-bolt-elements-textSecondary truncate">
              {profile?.username || 'Guest User'}
            </span>
            <div className="flex items-center justify-center w-7 h-7 overflow-hidden bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary rounded-md shrink-0">
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile?.username || 'User'}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <div className="i-ph:user-fill text-lg" />
              )}
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <a
                href="/"
                className="flex-1 flex gap-2 items-center bg-accent-500/10 text-accent-500 hover:bg-accent-500/15 rounded-md px-3 py-2 transition-colors"
              >
                <span className="inline-block i-ph:plus-circle h-4 w-4" />
                <span className="text-sm font-medium">Start new chat</span>
              </a>
              <button
                onClick={toggleSelectionMode}
                className={classNames(
                  'flex gap-1 items-center rounded-md px-3 py-2 transition-colors',
                  selectionMode
                    ? 'bg-accent-500 text-white border border-accent-600'
                    : 'bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor',
                )}
                aria-label={selectionMode ? 'Exit selection mode' : 'Enter selection mode'}
              >
                <span className={selectionMode ? 'i-ph:x h-4 w-4' : 'i-ph:check-square h-4 w-4'} />
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <span className="i-ph:magnifying-glass h-4 w-4 text-bolt-elements-textTertiary" />
              </div>
              <input
                className="w-full bg-bolt-elements-background-depth-2 relative pl-9 pr-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-accent-500/50 text-sm text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary border border-bolt-elements-borderColor"
                type="search"
                placeholder="Search chats..."
                onChange={handleSearchChange}
                aria-label="Search chats"
              />
            </div>
          </div>
          <div className="px-4 pt-3 pb-2">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-1">
              {[
                { id: 'home', label: 'Home' },
                { id: 'ai', label: 'AI & Providers' },
                { id: 'usage', label: 'Usage' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as 'home' | 'ai' | 'usage')}
                  className={classNames(
                    'rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
                    activeSection === tab.id
                      ? 'bg-accent-500/15 text-accent-500'
                      : 'text-bolt-elements-textTertiary hover:text-bolt-elements-textPrimary',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {activeSection === 'ai' ? (
            <div className="flex-1 overflow-auto px-3 py-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-bolt-elements-textSecondary">
                      AI & Providers
                    </div>
                  </div>
                  <ModelSelector
                    model={model}
                    setModel={setModel}
                    modelList={modelList}
                    provider={provider}
                    setProvider={setProvider}
                    providerList={providerList}
                    apiKeys={apiKeys}
                    modelLoading={isModelLoading}
                    chatStarted={false}
                  />
                </div>
                {provider && !LOCAL_PROVIDERS.includes(provider.name) && (
                  <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                    <APIKeyManager
                      provider={provider}
                      apiKey={apiKeys[provider.name] || ''}
                      setApiKey={(key) => onApiKeysChange?.(provider.name, key)}
                    />
                  </div>
                )}
                <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-sm text-bolt-elements-textSecondary">
                  Bring your own provider keys to keep billing in your hands and avoid fixed paid subscriptions.
                </div>
              </div>
            </div>
          ) : activeSection === 'usage' ? (
            <div className="flex-1 overflow-auto px-3 py-2">
              <div className="space-y-3">
                <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3">
                  <div className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-bolt-elements-textSecondary">
                    Usage overview
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Requests', value: '128' },
                      { label: 'Tokens', value: '62.4K' },
                      { label: 'Spend', value: '$0.00' },
                      { label: 'Provider', value: 'OpenRouter' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-1 p-2"
                      >
                        <div className="text-[10px] uppercase tracking-[0.12em] text-bolt-elements-textTertiary">
                          {stat.label}
                        </div>
                        <div className="mt-1 text-sm font-medium text-bolt-elements-textPrimary">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 p-3 text-sm text-bolt-elements-textSecondary">
                  Usage is tracked by provider and model so you can keep costs clear and controlled with your own API
                  keys.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm px-4 py-2">
                <div className="font-medium text-bolt-elements-textSecondary">Chats</div>
                {selectionMode && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {selectedItems.length === filteredList.length ? 'Deselect all' : 'Select all'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteClick}
                      disabled={selectedItems.length === 0}
                    >
                      Delete selected
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto px-3 pb-3">
                {filteredList.length === 0 && (
                  <div className="px-4 text-gray-500 dark:text-gray-400 text-sm">
                    {list.length === 0 ? 'No previous conversations' : 'No matches found'}
                  </div>
                )}
                <DialogRoot open={dialogContent !== null}>
                  {binDates(filteredList).map(({ category, items }) => (
                    <div key={category} className="mt-2 first:mt-0 space-y-1">
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 sticky top-0 z-1 bg-white dark:bg-gray-950 px-4 py-1">
                        {category}
                      </div>
                      <div className="space-y-0.5 pr-1">
                        {items.map((item) => (
                          <HistoryItem
                            key={item.id}
                            item={item}
                            exportChat={exportChat}
                            onDelete={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              console.log('Delete triggered for item:', item);
                              setDialogContentWithLogging({ type: 'delete', item });
                            }}
                            onDuplicate={() => handleDuplicate(item.id)}
                            selectionMode={selectionMode}
                            isSelected={selectedItems.includes(item.id)}
                            onToggleSelection={toggleItemSelection}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                  <Dialog onBackdrop={closeDialog} onClose={closeDialog}>
                    {dialogContent?.type === 'delete' && (
                      <>
                        <div className="p-6 bg-white dark:bg-gray-950">
                          <DialogTitle className="text-gray-900 dark:text-white">Delete Chat?</DialogTitle>
                          <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
                            <p>
                              You are about to delete{' '}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {dialogContent.item.description}
                              </span>
                            </p>
                            <p className="mt-2">Are you sure you want to delete this chat?</p>
                          </DialogDescription>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                          <DialogButton type="secondary" onClick={closeDialog}>
                            Cancel
                          </DialogButton>
                          <DialogButton
                            type="danger"
                            onClick={(event) => {
                              console.log('Dialog delete button clicked for item:', dialogContent.item);
                              deleteItem(event, dialogContent.item);
                              closeDialog();
                            }}
                          >
                            Delete
                          </DialogButton>
                        </div>
                      </>
                    )}
                    {dialogContent?.type === 'bulkDelete' && (
                      <>
                        <div className="p-6 bg-white dark:bg-gray-950">
                          <DialogTitle className="text-gray-900 dark:text-white">Delete Selected Chats?</DialogTitle>
                          <DialogDescription className="mt-2 text-gray-600 dark:text-gray-400">
                            <p>
                              You are about to delete {dialogContent.items.length}{' '}
                              {dialogContent.items.length === 1 ? 'chat' : 'chats'}:
                            </p>
                            <div className="mt-2 max-h-32 overflow-auto border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900 p-2">
                              <ul className="list-disc pl-5 space-y-1">
                                {dialogContent.items.map((item) => (
                                  <li key={item.id} className="text-sm">
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {item.description}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <p className="mt-3">Are you sure you want to delete these chats?</p>
                          </DialogDescription>
                        </div>
                        <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                          <DialogButton type="secondary" onClick={closeDialog}>
                            Cancel
                          </DialogButton>
                          <DialogButton
                            type="danger"
                            onClick={() => {
                              const itemsToDeleteNow = [...selectedItems];
                              console.log(
                                'Bulk delete confirmed for',
                                itemsToDeleteNow.length,
                                'items',
                                itemsToDeleteNow,
                              );
                              deleteSelectedItems(itemsToDeleteNow);
                              closeDialog();
                            }}
                          >
                            Delete
                          </DialogButton>
                        </div>
                      </>
                    )}
                  </Dialog>
                </DialogRoot>
              </div>
            </>
          )}
          <div className="flex items-center justify-between border-t border-bolt-elements-borderColor px-3 py-2">
            <div className="flex items-center gap-3">
              <SettingsButton onClick={handleSettingsClick} />
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </motion.div>

      <ControlPanel open={isSettingsOpen} onClose={handleSettingsClose} />
    </>
  );
};
