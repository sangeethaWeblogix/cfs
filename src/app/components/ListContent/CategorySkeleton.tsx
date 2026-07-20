const CategorySkeleton = () => {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="category-item">
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px 0",
          }}>
            <div style={{
              height: 16,
              width: `${60 + (i % 3) * 20}px`,
              backgroundColor: "#e0e0e0",
              borderRadius: 4,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            <div style={{
              height: 16,
              width: 32,
              backgroundColor: "#e0e0e0",
              borderRadius: 4,
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
          </div>
        </li>
      ))}
    </>
  );
};

export default CategorySkeleton;