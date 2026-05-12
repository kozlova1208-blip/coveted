// Luxit card deck
// Each card needs only: id, brand, name, image

const cards = [
  {
    id: '001',
    brand: 'Jenny Packham',
    name: 'Gown',
    image: 'https://www.net-a-porter.com/variants/images/46376663163079791/ou/w2000_q60.jpg',
  },
  {
    id: '002',
    brand: 'Versace',
    name: 'Shirt',
    image: 'https://www.net-a-porter.com/variants/images/46376663163047532/ou/w2000_q60.jpg',
  },
  {
    id: '003',
    brand: 'Lanvin',
    name: 'Dress',
    image: 'https://www.net-a-porter.com/variants/images/46376663162958032/ou/w2000_q60.jpg',
  },
  {
    id: '004',
    brand: 'Bode',
    name: 'Dress',
    image: 'https://www.net-a-porter.com/variants/images/46376663162967268/ou/w2000_q60.jpg',
  },
  {
    id: '005',
    brand: 'Acne Studios',
    name: 'Jacket',
    image: 'https://www.net-a-porter.com/variants/images/46376663162964233/ou/w2000_q60.jpg',
  },
  {
    id: '006',
    brand: 'Staud',
    name: 'Bag',
    image: 'https://www.net-a-porter.com/variants/images/46376663162986142/ou/w2000_q60.jpg',
  },
  {
    id: '007',
    brand: 'JW Anderson',
    name: 'Bag',
    image: 'https://www.net-a-porter.com/variants/images/46376663162971353/ou/w2000_q60.jpg',
  },
  {
    id: '008',
    brand: 'Chloe',
    name: 'Jacket',
    image: 'https://www.net-a-porter.com/variants/images/46376663162848011/ou/w2000_q60.jpg',
  },
  {
    id: '009',
    brand: 'Farm Rio',
    name: 'Shorts',
    image: 'https://www.net-a-porter.com/variants/images/46376663162892034/ou/w2000_q60.jpg',
  },
  {
    id: '010',
    brand: 'Alemais',
    name: 'Trousers',
    image: 'https://www.net-a-porter.com/variants/images/46376663162877471/ou/w2000_q60.jpg',
  },
  {
    id: '011',
    brand: 'Khaite',
    name: 'Skirt',
    image: 'https://www.net-a-porter.com/variants/images/1647597358475253/ou/w2000_q60.jpg',
  },
  {
    id: '012',
    brand: 'Dries Van Noten',
    name: 'Pants',
    image: 'https://www.net-a-porter.com/variants/images/46376663162929264/ou/w2000_q60.jpg',
  },
  {
    id: '013',
    brand: 'Rue De Verneul',
    name: 'Bag',
    image: 'https://www.net-a-porter.com/variants/images/46376663162985780/ou/w2000_q60.jpg',
  },
  {
    id: '014',
    brand: 'Pauline Dujancourt',
    name: 'Bag',
    image: 'https://www.net-a-porter.com/variants/images/46376663163042934/ou/w2000_q60.jpg',
  },
  {
    id: '015',
    brand: 'Simone Rocha',
    name: 'Bag',
    image: 'https://www.net-a-porter.com/variants/images/46376663163027643/ou/w2000_q60.jpg',
  },
  {
    id: '016',
    brand: 'CLIO PEPPIATT',
    name: 'Dress',
    image: 'https://www.net-a-porter.com/variants/images/1647597359522744/ou/w2000_q60.jpg',
  },
  {
    id: '017',
    brand: 'ACNE STUDIOS',
    name: 'Jeans',
    image: 'https://www.net-a-porter.com/variants/images/46376663162964420/ou/w2000_q60.jpg',
  },
  {
    id: '018',
    brand: 'Rick Owens',
    name: 'Sunglasses',
    image: 'https://www.net-a-porter.com/variants/images/46376663163026752/ou/w2000_q60.jpg',
  },
  {
    id: '019',
    brand: 'Brioni',
    name: 'Coat',
    image: 'https://www.mrporter.com/variants/images/46376663162978689/ou/w2000_q60.jpg',
  },
  {
    id: '020',
    brand: 'PROLETA RE ART',
    name: 'Jacket',
    image: 'https://www.mrporter.com/variants/images/1647597345344652/ou/w2000_q60.jpg',
  },
  {
    id: '021',
    brand: 'Bottega Veneta',
    name: 'Trousers',
    image: 'https://www.mrporter.com/variants/images/1647597317411046/ou/w2000_q60.jpg',
  },
  {
    id: '022',
    brand: 'SATOSHI NAKAMOTO',
    name: 'Jeans',
    image: 'https://www.mrporter.com/variants/images/46376663162876438/ou/w2000_q60.jpg',
  },
  {
    id: '023',
    brand: 'Missoni',
    name: 'Robe',
    image: 'https://www.mrporter.com/variants/images/46376663162928499/ou/w2000_q60.jpg',
  },
  {
    id: '024',
    brand: 'Tom Ford',
    name: 'Suit',
    image: 'https://www.mrporter.com/variants/images/46376663163003034/ou/w2000_q60.jpg',
  },
  {
    id: '025',
    brand: 'Aton',
    name: 'Suit',
    image: 'https://www.mrporter.com/variants/images/46376663162978308/ou/w2000_q60.jpg',
  },
  {
    id: '026',
    brand: 'Brunello Cucinelli',
    name: 'Coat',
    image: 'https://www.net-a-porter.com/variants/images/46376663162950536/ou/w2000_q60.jpg',
  },
  {
    id: '027',
    brand: 'Balenciaga',
    name: 'Coat',
    image: 'https://www.net-a-porter.com/variants/images/1647597332662613/ou/w2000_q60.jpg',
  },
  {
    id: '028',
    brand: 'Alaia',
    name: 'Vest',
    image: 'https://www.net-a-porter.com/variants/images/46376663162911652/ou/w2000_q60.jpg',
  },
  {
    id: '029',
    brand: 'Oscar de la Renta',
    name: 'Gown',
    image: 'https://www.net-a-porter.com/variants/images/46376663163031425/ou/w2000_q60.jpg',
  },
  {
    id: '030',
    brand: 'Alaia',
    name: 'Coat',
    image: 'https://www.net-a-porter.com/variants/images/1647597340613685/ou/w2000_q60.jpg',
  },
];

module.exports = { cards };
