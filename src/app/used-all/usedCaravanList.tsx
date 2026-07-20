import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/solid.min.css";
import Image from "next/image";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  regular_price: string;
  sale_price: string;
  condition: string;
  location: string;
  make: string;
  model: string;
  length: string;
  kg: string;
  slug: string;
  sku: string;
};

export default function ProductCard({ caravan }: { caravan: Product }) {
  const href = `/product/${caravan.slug}`;

  const base = `https://caravansforsale.imagestack.net/400x300/${caravan.sku}/${caravan.slug}`;
  const image = `${base}main1.avif`;

  const price = caravan.sale_price || caravan.regular_price;

  const tags = [
    caravan.length,
    caravan.kg,
    caravan.make,
    caravan.model,
  ].filter(Boolean);

  return (
    <a href={href} className="lli_head">
      <div className="product-card">
        <div className="img">
          <div className="background_thumb">
            <Image
              src={image}
              alt={caravan.name}
              fill
              className="object-cover blur-sm opacity-30"
            />
          </div>

          <div className="main_thumb position-relative">
            <Image
              src={image}
              alt={caravan.name}
              width={400}
              height={300}
              className="w-full object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </div>

        <div className="product_de">
          <div className="info">
            <h3 className="title cursor-pointer">{caravan.name}</h3>
          </div>

          <div className="price">
            <div className="metc2">
              <h5 className="slog">{price}</h5>
            </div>
          </div>

          <ul className="vehicleDetailsWithIcons simple">
            {tags.map((tag, i) => (
              <li key={i} className="attribute3_list">
                <span>{tag}</span>
              </li>
            ))}
          </ul>

          <div className="bottom_mid">
            <span>
              <i className="bi bi-check-circle-fill"></i> {caravan.condition}
            </span>
            <span>
              <i className="fa-solid fa-location-dot"></i> {caravan.location}
            </span>
          </div>

           <div className="bottom_button">

            <button className="btn btn-primary">
              View Details
            </button>
          </div>
         </div>
      </div>
    </a>
  );
}
