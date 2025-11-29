import React from 'react';

const stickers = [
  '😀', '😂', '😍', '🤔', '😎', '🥳', '😢', '😡', '👍', '👎'
];

const StickerSelector = ({ onSelect }) => {
  return (
    <div className="sticker-selector">
      {stickers.map((sticker, index) => (
        <span
          key={index}
          onClick={() => onSelect(sticker)}
          style={{ fontSize: '24px', cursor: 'pointer', margin: '5px' }}
        >
          {sticker}
        </span>
      ))}
    </div>
  );
};

export default StickerSelector;