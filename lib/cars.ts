export type Car = {
  id: string;
  name: string;
  year: number;
  make: string;
  price: string;
  priceValue: number;
  mileage: string;
  fuel: string;
  transmission: string;
  location: string;
  category: string;
  vehicleType: string;
  brand: string;
  model: string;
  image: string;
};

export const cars: Car[] = [
  {
    id: "hyundai-tucson-2020",
    name: "2020 Hyundai Tucson",
    year: 2020,
    make: "Hyundai",
    price: "$148,000 TTD",
    priceValue: 148000,
    mileage: "48,000 km",
    fuel: "Gasoline",
    transmission: "Automatic",
    location: "Port of Spain",
    category: "Family SUV",
    vehicleType: "suv",
    brand: "Hyundai",
    model: "Tucson",
    image:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "nissan-xtrail-2019",
    name: "2019 Nissan X-Trail",
    year: 2019,
    make: "Nissan",
    price: "$150,000 TTD",
    priceValue: 150000,
    mileage: "55,000 km",
    fuel: "Gasoline",
    transmission: "CVT",
    location: "San Fernando",
    category: "Crossover SUV",
    vehicleType: "suv",
    brand: "Nissan",
    model: "X-Trail",
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "kia-sportage-2021",
    name: "2021 Kia Sportage",
    year: 2021,
    make: "Kia",
    price: "$154,000 TTD",
    priceValue: 154000,
    mileage: "33,000 km",
    fuel: "Gasoline",
    transmission: "Automatic",
    location: "Arima",
    category: "Urban SUV",
    vehicleType: "suv",
    brand: "Kia",
    model: "Sportage",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mazda-3-2019",
    name: "2019 Mazda 3",
    year: 2019,
    make: "Mazda",
    price: "$85,000 TTD",
    priceValue: 85000,
    mileage: "76,000 km",
    fuel: "Gasoline",
    transmission: "Automatic",
    location: "Chaguanas",
    category: "Compact sedan",
    vehicleType: "sedan",
    brand: "Mazda",
    model: "3",
    image:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "toyota-hilux-2018",
    name: "2018 Toyota Hilux",
    year: 2018,
    make: "Toyota",
    price: "$180,000 TTD",
    priceValue: 180000,
    mileage: "68,000 km",
    fuel: "Diesel",
    transmission: "Automatic",
    location: "Point Fortin",
    category: "Utility pickup",
    vehicleType: "pickup",
    brand: "Toyota",
    model: "Hilux",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "bmw-x3-2021",
    name: "2021 BMW X3",
    year: 2021,
    make: "BMW",
    price: "$245,000 TTD",
    priceValue: 245000,
    mileage: "29,000 km",
    fuel: "Gasoline",
    transmission: "Automatic",
    location: "Westmoorings",
    category: "Luxury SUV",
    vehicleType: "luxury",
    brand: "BMW",
    model: "X3",
    image:
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80",
  },
];
