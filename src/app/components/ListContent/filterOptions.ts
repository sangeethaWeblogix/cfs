export const filterOptions = {
  categories: [
    { name: "Off Road", slug: "/off-road-category/" },
    { name: "Family", slug: "/family-category/" },
    { name: "Touring", slug: "/touring-category/" },
    { name: "Luxury", slug: "/luxury-category/" },
    { name: "Pop Top", slug: "/pop-top-category/" },
    { name: "Hybrid", slug: "/hybrid-category/" },
  ],
   
   price: [
    { name: "Caravans Under $20,000 in Australia", slug: "/under-20000/" },
    { name: "Caravans between $20,000 to $30,000 in Australia", slug: "/between-20000-30000/" },
    { name: "Caravans between $30,000 to $40,000 in Australia", slug: "/between-30000-40000/" },
    { name: "Caravans between $40,000 to $50,000 in Australia", slug: "/between-40000-50000/" },
    { name: "Caravans between $50,000 to $70,000 in Australia", slug: "/between-50000-70000/" },
    { name: "Caravans between $70,000 to $100,000 in Australia", slug: "/between-70000-100000/" },
    { name: "Caravans between $100,000 to $150,000 in Australia", slug: "/between-100000-150000/" },
    { name: "Caravans between $150,000 to $200,000 in Australia", slug: "/between-150000-200000/" },
    { name: "Caravans Over $200,000 in Australia", slug: "/over-200000/" },
  ],
  atm: [
    { name: "Under 1500kg", slug: "/under-1500-kg-atm/", value: "1500" },
    {
      name: "1500kg-2500kg",
      slug: "/between-1500-kg-2500-kg-atm/",
      value: "1500-2500",
    },
    {
      name: "2500kg-3500kg",
      slug: "/between-2500-kg-3500-kg-atm/",
      value: "2500-3500",
    },
    {
      name: "3500kg-4500kg",
      slug: "/between-3500-kg-4500-kg-atm/",
      value: "3500-4500",
    },
    { name: "Over 4500kg", slug: "/over-4500-kg-atm/", value: "4500" },
  ],
  sleep: [
    {
      name: "1-2",
      slug: "/between-1-2-people-sleeping-capacity/",
      value: "1-2",
    },
    {
      name: "3-4",
      slug: "/between-3-4-people-sleeping-capacity/",
      value: "3-4",
    },
    {
      name: "4-6",
      slug: "/between-4-6-people-sleeping-capacity/",
      value: "4-6",
    },
    {
      name: "6",
      slug: "/over-6-people-sleeping-capacity/",
      value: "6",
    },
  ],
  length: [
    { name: "Under 12ft", slug: "/under-12-length-in-feet/", value: "12" },
    {
      name: "12ft-14ft",
      slug: "/between-12-14-length-in-feet/",
      value: "12-14",
    },
    {
      name: "15ft-17ft",
      slug: "/between-15-17-length-in-feet/",
      value: "15-17",
    },
    {
      name: "18ft-20ft",
      slug: "/between-18-20-length-in-feet/",
      value: "18-20",
    },
    {
      name: "21ft-23ft",
      slug: "/between-21-23-length-in-feet/",
      value: "21-23",
    },
    { name: "Over 24ft", slug: "/over-24-length-in-feet/", value: "24" },
  ],
  location: {
    state: [
      {
        name: "Australian Capital Territory",
        slug: "/australian-capital-territory-state/",
        region: [
          {
            name: "Australian Capital Territory",
            slug: "/australian-capital-territory-region/",
          },
        ],
      },
      {
        name: "New South Wales",
        slug: "/new-south-wales-state/",
        region: [
          { name: "Sydney", slug: "/sydney-region/" },
          { name: "Hunter", slug: "/hunter-region/" },
          {
            name: "Coffs Harbour",
            slug: "/coffs-harbour-region/",
          },
          {
            name: "Newcastle",
            slug: "/newcastle-region/",
          },
          {
            name: "Southern Highlands",
            slug: "/southern-highlands-region/",
          },
          {
            name: "Richmond Tweed",
            slug: "/richmond-tweed-region/",
          },
          {
            name: "Central Coast",
            slug: "/central-coast-region/",
          },
          {
            name: "Central West",
            slug: "/central-west-region/",
          },
          {
            name: "Mid North Coast",
            slug: "/mid-north-coast-region/",
          },
          { name: "Murray", slug: "/murray-region/" },
          {
            name: "New England",
            slug: "/new-england-region/",
          },
          { name: "Riverina", slug: "/riverina-region/" },
          { name: "Capital", slug: "/capital-region/" },
          { name: "Orana", slug: "/orana-region/" },
          {
            name: "Illawarra",
            slug: "/illawarra-region/",
          },
        ],
      },
      {
        name: "Northern Territory",
        slug: "/northern-territory-state/",
        region: [{ name: "Darwin", slug: "/darwin-region/" }],
      },
      {
        name: "Queensland",
        slug: "/queensland-state/",
        region: [
          {
            name: "Moreton Bay North",
            slug: "/moreton-bay-north-region/",
          },
          { name: "Wide Bay", slug: "/wide-bay-region/" },
          { name: "Gold Coast", slug: "/gold-coast-region/" },
          { name: "Brisbane", slug: "/brisbane-region/" },
          {
            name: "Sunshine Coast",
            slug: "/sunshine-coast-region/",
          },
          {
            name: "Logan Beaudesert",
            slug: "/logan-beaudesert-region/",
          },
          {
            name: "Moreton Bay South",
            slug: "/moreton-bay-south-region/",
          },
          { name: "Townsville", slug: "/townsville-region/" },
          {
            name: "Mackay Isaac Whitsunday",
            slug: "/mackay-isaac-whitsunday-region/",
          },
          { name: "Ipswich", slug: "/ipswich-region/" },
          { name: "Toowoomba", slug: "/toowoomba-region/" },
          { name: "Cairns", slug: "/cairns-region/" },
        ],
      },
      {
        name: "South Australia",
        slug: "/south-australia-state/",
        region: [
          { name: "Adelaide", slug: "/adelaide-region/" },
          {
            name: "South Australia South East",
            slug: "/south-australia-south-east-region/",
          },
        ],
      },
      {
        name: "Tasmania",
        slug: "/tasmania-state/",
        region: [
          { name: "North West", slug: "/north-west-region/" },
          { name: "Hobart", slug: "/hobart-region/" },
          { name: "Launceston", slug: "/launceston-region/" },
        ],
      },
      {
        name: "Victoria",
        slug: "/victoria-state/",
        region: [
          { name: "Melbourne", slug: "/melbourne-region/" },
          { name: "Ballarat", slug: "/ballarat-region/" },
          { name: "Geelong", slug: "/geelong-region/" },
          { name: "Shepparton", slug: "/shepparton-region/" },
          {
            name: "Latrobe Gippsland",
            slug: "/latrobe-gippsland-region/",
          },
          { name: "Bendigo", slug: "/bendigo-region/" },
          {
            name: "Mornington Peninsula",
            slug: "/mornington-peninsula-region/",
          },
          { name: "Hume", slug: "/hume-region/" },
          { name: "North West", slug: "/north-west-region/" },
          {
            name: "Warrnambool And South West",
            slug: "/warrnambool-and-south-west-region/",
          },
        ],
      },
      {
        name: "Western Australia",
        slug: "/western-australia-state/",
        region: [
          { name: "Perth", slug: "/perth-region/" },
          {
            name: "Mandurah",
            slug: "/mandurah-region/",
          },
          {
            name: "Western Australia Outback South",
            slug: "/western-australia-outback-south-region/",
          },
          { name: "Bunbury", slug: "/bunbury-region/" },
        ],
      },
    ],
  },
};
