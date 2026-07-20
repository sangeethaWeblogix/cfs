import { ReactNode } from "react";
import './product.css?=12'

export default function Layout({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
