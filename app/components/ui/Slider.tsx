import { motion } from 'framer-motion';
import { memo } from 'react';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { genericMemo } from '~/utils/react';

export type SliderOptions<T> = {
  left: { value: T; text: string };
  middle?: { value: T; text: string };
  right: { value: T; text: string };
};

interface SliderProps<T> {
  selected: T;
  options: SliderOptions<T>;
  setSelected?: (selected: T) => void;
}

export const Slider = genericMemo(<T,>({ selected, options, setSelected }: SliderProps<T>) => {
  const hasMiddle = !!options.middle;
  const isLeftSelected = hasMiddle ? selected === options.left.value : selected === options.left.value;
  const isMiddleSelected = hasMiddle && options.middle ? selected === options.middle.value : false;

  return (
    <div
      role="group"
      aria-label="Workspace view"
      className="flex items-center flex-wrap shrink-0 gap-0.5 bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor overflow-hidden rounded-md p-0.5"
    >
      <SliderButton
        selected={isLeftSelected}
        setSelected={() => setSelected?.(options.left.value)}
        label={options.left.text}
      >
        {options.left.text}
      </SliderButton>

      {options.middle && (
        <SliderButton
          selected={isMiddleSelected}
          setSelected={() => setSelected?.(options.middle!.value)}
          label={options.middle.text}
        >
          {options.middle.text}
        </SliderButton>
      )}

      <SliderButton
        selected={!isLeftSelected && !isMiddleSelected}
        setSelected={() => setSelected?.(options.right.value)}
        label={options.right.text}
      >
        {options.right.text}
      </SliderButton>
    </div>
  );
});

interface SliderButtonProps {
  selected: boolean;
  label: string;
  children: string | JSX.Element | Array<JSX.Element | string>;
  setSelected: () => void;
}

const SliderButton = memo(({ selected, label, children, setSelected }: SliderButtonProps) => {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${label} view`}
      onClick={setSelected}
      className={classNames(
        'bg-transparent text-xs sm:text-sm px-2 sm:px-2.5 py-1 rounded relative transition-colors',
        selected
          ? 'text-bolt-elements-item-contentAccent'
          : 'text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive',
      )}
    >
      <span className="relative z-10">{children}</span>
      {selected && (
        <motion.span
          layoutId="pill-tab"
          transition={{ duration: 0.2, ease: cubicEasingFn }}
          className="absolute inset-0 z-0 bg-bolt-elements-item-backgroundAccent rounded"
        ></motion.span>
      )}
    </button>
  );
});
