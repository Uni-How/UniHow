export default function Skeleton({ className = '', style = {} }) {
  return (
    <div className={`skeleton ${className}`} style={style}>
      <style jsx>{`
        .skeleton {
          background-color: #e0e0e0;
          background-image: linear-gradient(
            90deg,
            #e0e0e0 0px,
            #f0f0f0 40px,
            #e0e0e0 80px
          );
          background-size: 200% 100%;
          border-radius: 4px;
          animation: skeleton-loading 1.5s infinite linear;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
      `}</style>
    </div>
  );
}
