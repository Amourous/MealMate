import React, { useMemo } from 'react';
import './AnimatedBackground.css';

const FOOD_ICONS = ['🥑', '🥕', '🍳', '🥦', '🍋', '🍅', '🥐', '🍲', '☕', '🌮', '🌶️', '🥗'];

export default function AnimatedBackground() {
    // Generate random positions and delays for the floating icons
    const floatingItems = useMemo(() => {
        return FOOD_ICONS.map((icon, i) => ({
            id: i,
            icon,
            left: `${Math.random() * 100}vw`,
            top: `${Math.random() * 100}vh`,
            animationDelay: `${Math.random() * -20}s`,
            animationDuration: `${20 + Math.random() * 15}s`,
            scale: 0.8 + Math.random() * 1.5
        }));
    }, []);

    return (
        <div className="animated-bg-container">
            <div className="orb orb-1"></div>
            <div className="orb orb-2"></div>
            <div className="orb orb-3"></div>
            <div className="grid-overlay"></div>
            
            <div className="floating-icons-layer">
                {floatingItems.map((item) => (
                    <div 
                        key={item.id} 
                        className="floating-food-icon"
                        style={{
                            left: item.left,
                            top: item.top,
                            animationDelay: item.animationDelay,
                            animationDuration: item.animationDuration,
                            '--scale': item.scale
                        }}
                    >
                        {item.icon}
                    </div>
                ))}
            </div>
        </div>
    );
}
