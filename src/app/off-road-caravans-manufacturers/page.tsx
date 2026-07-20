import Header from "./components/OffRoadCaravanHeader";
import Middle from "./components/OffRoadCaravanMiddle";
import FaqSection from "./components/FaqSection";
import Footer from "./components/OffRoadCaravanInfoFooter";
import "./offroad.css?=1";

export default function Home() {
  return (
    <div>
      <Header />
      <Middle />
      <Footer />
      <FaqSection />
    </div>
  );
}
