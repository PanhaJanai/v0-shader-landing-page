import React, { useState } from "react";
import { FixedSizeList } from "react-window";

const data = Array.from({ length: 100000 }, (_, index) => `Item ${index}`);

const VirtualizedListExample = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const renderRow = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid lightgrey",
        border: selectedIndex === index ? "2px solid blue" : undefined,
        boxSizing: "border-box",
        cursor: "pointer",
        margin: "10px",
      }}
      onClick={() => setSelectedIndex(index)}
    >
      <span>{data[index]}</span>
    </div>
  );

  return (
    <div style={{ height: "400px", width: "300px", border: "1px solid lightgrey" }}>
      <FixedSizeList
        height={400}
        width={300}
        itemCount={data.length}
        itemSize={40} // Height of each row
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
};

export default VirtualizedListExample;