import React from "react";
import styles from "./GallerySkeleton.module.css";

export default function GallerySkeleton() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.thumbs}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.thumb}></div>
        ))}
      </div>
      <div className={styles.main}></div>
    </div>
  );
}
