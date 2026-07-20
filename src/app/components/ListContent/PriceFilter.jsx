export default function PriceFilter() {
  return (
    <div className="filter-item">
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Min</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="10000">$10,000</option>
                      <option value="20000">$20,000</option>
                      <option value="30000">$30,000</option>
                      <option value="40000">$40,000</option>
                      <option value="50000">$50,000</option>
                      <option value="60000">$60,000</option>
                      <option value="70000">$70,000</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Max</label>
                    <select className="cfs-select-input form-select">
                      <option value="">Any</option>
                      <option value="10000">$10,000</option>
                      <option value="20000">$20,000</option>
                      <option value="30000">$30,000</option>
                      <option value="40000">$40,000</option>
                      <option value="50000">$50,000</option>
                      <option value="60000">$60,000</option>
                      <option value="70000">$70,000</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
