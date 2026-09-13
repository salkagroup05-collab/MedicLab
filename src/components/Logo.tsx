import React from 'react';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * MédicLab brand mark: blue tile (radius = 28% of side) with an off-center
 * cross — vertical bar at full opacity, horizontal bar at 55% opacity.
 * Scales via the SVG viewBox, so a single markup works at every size.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ size = 40, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    style={{ display: 'block', flexShrink: 0 }}
    aria-hidden="true"
  >
    <rect x="0" y="0" width="64" height="64" rx="18" fill="#2563eb" />
    <rect x="27" y="14" width="10" height="36" rx="5" fill="#ffffff" />
    <rect x="14" y="27" width="36" height="10" rx="5" fill="#ffffff" opacity="0.55" />
  </svg>
);
