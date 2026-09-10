const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/Product");

dotenv.config();

const products = [
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality.",
    price: 79.99,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&h=600&fit=crop",
    ],
    category: "Electronics",
    rating: 4.6,
    featured: true,
    trending: true,
    discountPrice: 64.99,
    stock: 45,
  },
  {
    name: "Classic Denim Jacket",
    description:
      "Timeless denim jacket made from 100% organic cotton. Features a button-front closure, chest pockets, and a relaxed fit.",
    price: 59.99,
    images: [
      "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&h=600&fit=crop",
    ],
    category: "Clothing",
    rating: 4.3,
    featured: true,
    trending: false,
    discountPrice: 47.99,
    stock: 30,
  },
  {
    name: "The Art of Programming",
    description:
      "A comprehensive guide to modern programming paradigms, covering algorithms, data structures, and software design patterns.",
    price: 34.99,
    images: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop",
    ],
    category: "Books",
    rating: 4.8,
    featured: true,
    trending: false,
    discountPrice: null,
    stock: 60,
  },
  {
    name: "Smart LED Desk Lamp",
    description:
      "Adjustable LED desk lamp with wireless charging pad, touch controls, and 5 brightness levels for the perfect workspace setup.",
    price: 45.99,
    images: [
      "https://images.unsplash.com/photo-1524820801657-fd59673fbb05?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1569428047118-ae9338065103?w=600&h=600&fit=crop",
    ],
    category: "Home",
    rating: 4.2,
    featured: false,
    trending: true,
    discountPrice: 36.99,
    stock: 25,
  },
  {
    name: "Yoga Mat Premium",
    description:
      "Extra thick non-slip yoga mat with alignment lines. Eco-friendly TPE material, 6mm thick for maximum comfort.",
    price: 29.99,
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop",
    ],
    category: "Sports",
    rating: 4.5,
    featured: true,
    trending: true,
    discountPrice: null,
    stock: 50,
  },
  {
    name: "Natural Vitamin C Serum",
    description:
      "Organic vitamin C serum with hyaluronic acid and vitamin E. Brightens skin and reduces fine lines.",
    price: 24.99,
    images: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&h=600&fit=crop",
    ],
    category: "Beauty",
    rating: 4.4,
    featured: false,
    trending: true,
    discountPrice: 19.99,
    stock: 80,
  },
  {
    name: "STEM Robot Building Kit",
    description:
      "Educational robot kit for ages 8+. Includes 250+ pieces, Bluetooth app control, and 12 programmable projects.",
    price: 69.99,
    images: [
      "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?w=600&h=600&fit=crop",
    ],
    category: "Toys",
    rating: 4.7,
    featured: true,
    trending: false,
    discountPrice: null,
    stock: 20,
  },
  {
    name: "USB-C Hub Adapter",
    description:
      "7-in-1 USB-C hub with HDMI 4K output, USB 3.0 ports, SD card reader, and 100W power delivery passthrough.",
    price: 39.99,
    images: [
      "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&h=600&fit=crop",
    ],
    category: "Electronics",
    rating: 4.1,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 70,
  },
  {
    name: "Organic Cotton T-Shirt",
    description:
      "Soft and breathable organic cotton t-shirt with a modern slim fit. Available in multiple colors.",
    price: 24.99,
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&h=600&fit=crop",
    ],
    category: "Clothing",
    rating: 4.2,
    featured: false,
    trending: true,
    discountPrice: 19.99,
    stock: 100,
  },
  {
    name: "Mindfulness Meditation Guide",
    description:
      "A practical guide to daily meditation with 30 guided exercises, breathing techniques, and stress management strategies.",
    price: 19.99,
    images: [
      "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1712951174569-a96cc7e30474?w=600&h=600&fit=crop",
    ],
    category: "Books",
    rating: 4.6,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 40,
  },
  {
    name: "Ceramic Plant Pot Set",
    description:
      "Set of 3 minimalist ceramic plant pots with bamboo drainage trays. Perfect for succulents and small houseplants.",
    price: 34.99,
    images: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1547569231-f0b92318f0a1?w=600&h=600&fit=crop",
    ],
    category: "Home",
    rating: 4.3,
    featured: true,
    trending: false,
    discountPrice: null,
    stock: 35,
  },
  {
    name: "Resistance Bands Set",
    description:
      "Set of 5 color-coded resistance bands with varying tension levels. Includes door anchor, ankle straps, and carry bag.",
    price: 19.99,
    images: [
      "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=600&fit=crop",
    ],
    category: "Sports",
    rating: 4.4,
    featured: false,
    trending: true,
    discountPrice: 14.99,
    stock: 65,
  },
  {
    name: "Mechanical Gaming Keyboard",
    description:
      "RGB backlit mechanical keyboard with Cherry MX switches, programmable macro keys, and aircraft-grade aluminum frame.",
    price: 89.99,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=600&fit=crop",
    ],
    category: "Electronics",
    rating: 4.7,
    featured: true,
    trending: true,
    discountPrice: 74.99,
    stock: 30,
  },
  {
    name: "Leather Crossbody Bag",
    description:
      "Genuine leather crossbody bag with adjustable strap, multiple compartments, and RFID-blocking technology.",
    price: 54.99,
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=600&h=600&fit=crop",
    ],
    category: "Clothing",
    rating: 4.5,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 25,
  },
  {
    name: "Stainless Steel Water Bottle",
    description:
      "Double-walled insulated water bottle. Keeps drinks cold for 24 hours or hot for 12 hours. BPA-free.",
    price: 22.99,
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&h=600&fit=crop",
    ],
    category: "Home",
    rating: 4.4,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 90,
  },
  {
    name: "Wireless Charging Pad",
    description:
      "Sleek 15W fast wireless charging pad compatible with all Qi-enabled devices. Includes LED indicator and safety features.",
    price: 29.99,
    images: [
      "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?w=600&h=600&fit=crop",
    ],
    category: "Electronics",
    rating: 4.0,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 55,
  },
  {
    name: "Running Shoes Pro",
    description:
      "Lightweight running shoes with responsive cushioning and breathable mesh upper. Designed for road and trail running.",
    price: 109.99,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&h=600&fit=crop",
    ],
    category: "Sports",
    rating: 4.8,
    featured: true,
    trending: true,
    discountPrice: 89.99,
    stock: 40,
  },
  {
    name: "Portable Bluetooth Speaker",
    description:
      "Waterproof portable speaker with 360-degree sound, 20-hour battery life, and built-in microphone for calls.",
    price: 49.99,
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&h=600&fit=crop",
    ],
    category: "Electronics",
    rating: 4.3,
    featured: false,
    trending: true,
    discountPrice: 39.99,
    stock: 45,
  },
  {
    name: "Scented Soy Candle Set",
    description:
      "Set of 3 hand-poured soy wax candles in lavender, vanilla, and sandalwood scents. 40-hour burn time each.",
    price: 28.99,
    images: [
      "https://images.unsplash.com/photo-1733954427762-31beca62dd60?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1773739685635-76be879b058f?w=600&h=600&fit=crop",
    ],
    category: "Home",
    rating: 4.6,
    featured: true,
    trending: false,
    discountPrice: null,
    stock: 60,
  },
  {
    name: "Complete Mystery Novel",
    description:
      "A gripping thriller mystery novel with twists and turns that will keep you guessing until the very last page.",
    price: 15.99,
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=600&h=600&fit=crop",
    ],
    category: "Books",
    rating: 4.5,
    featured: false,
    trending: false,
    discountPrice: null,
    stock: 75,
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB Connected for seeding");

    await Product.deleteMany({});
    console.log("Existing products cleared");

    await Product.insertMany(products);
    console.log(`${products.length} products seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error(`Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seedDB();