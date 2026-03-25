import React from 'react';

interface GitHubCornerProps {
  href: string;
}

const GitHubCorner: React.FC<GitHubCornerProps> = ({ href }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-0 right-0 z-[60] group"
      aria-label="View source on GitHub"
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 250 250"
        className="fill-indigo-600 text-white transition-all duration-300 group-hover:fill-indigo-700"
        aria-hidden="true"
      >
        <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z" />
        <path
          d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.5 120.5,78.5 C119.9,75.7 122.2,76.7 122.2,76.7 C124.5,79.7 123.3,82.1 123.3,82.1 C121.0,87.0 125.8,89.4 128.2,88.1"
          fill="currentColor"
          style={{ transformOrigin: '130px 106px' }}
          className="group-hover:animate-[octocat-wave_560ms_ease-in-out]"
        />
        <path
          d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.3 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.9 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
          fill="currentColor"
        />
      </svg>
      <style>{`
        @keyframes octocat-wave {
          0%, 100% { transform: rotate(0); }
          20%, 60% { transform: rotate(-25deg); }
          40%, 80% { transform: rotate(10deg); }
        }
      `}</style>
    </a>
  );
};

export default GitHubCorner;
