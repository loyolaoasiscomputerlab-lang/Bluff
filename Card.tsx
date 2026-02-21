import React from 'react';
import { motion } from 'motion/react';
import { Card as CardType } from '../types';
import { cn } from '../utils/cn';

interface CardProps {
  card: CardType;
  isHidden?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-slate-900',
  spades: 'text-slate-900',
};

export const CardComponent: React.FC<CardProps> = ({
  card,
  isHidden = false,
  isSelected = false,
  onClick,
  className,
  style,
}) => {
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ 
        scale: isSelected ? 1.1 : 1, 
        opacity: 1,
        y: isSelected ? -20 : 0 
      }}
      whileHover={{ scale: isSelected ? 1.15 : 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        'relative w-24 h-36 rounded-xl border-2 shadow-md cursor-pointer select-none bg-white flex flex-col items-center justify-center',
        isSelected ? 'border-yellow-400 ring-2 ring-yellow-400 shadow-xl z-10' : 'border-slate-200',
        isHidden ? 'bg-slate-800 border-slate-700' : '',
        className
      )}
      style={style}
    >
      {isHidden ? (
        <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-50 rounded-lg" />
      ) : (
        <>
          <div className={cn('absolute top-2 left-2 text-lg font-bold', suitColors[card.suit])}>
            {card.rank}
            <span className="block text-sm">{suitSymbols[card.suit]}</span>
          </div>
          <div className={cn('text-4xl', suitColors[card.suit])}>
            {suitSymbols[card.suit]}
          </div>
          <div className={cn('absolute bottom-2 right-2 text-lg font-bold rotate-180', suitColors[card.suit])}>
            {card.rank}
            <span className="block text-sm">{suitSymbols[card.suit]}</span>
          </div>
        </>
      )}
    </motion.div>
  );
};
