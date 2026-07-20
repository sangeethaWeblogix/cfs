export default function LocationFilter() {
  return (
    <div className="filter-item">
            <div className="location-list">
              <div className="row">
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>State</label>
                    <select className="cfs-select-input form-select">
                      <option>Any</option>
                      <option>Australian Capital Territory</option>
                      <option>New South Wales</option>
                      <option>Northern Territory</option>
                      <option>Queensland</option>
                      <option>South Australia</option>
                      <option>Tasmania</option>
                      <option>Victoria</option>
                      <option>Victoria</option>
                      <option>Western Australia</option>
                    </select>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="location-item">
                    <label>Region</label>
                    <select className="cfs-select-input form-select" disabled>
                      <option>Any</option>
                      <option>Melbourne</option>
                      <option>Brisbane</option>
                      <option>Adelaide</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
