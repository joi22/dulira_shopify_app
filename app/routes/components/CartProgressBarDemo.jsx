import React, { useState } from 'react';
import CartProgressBar from './CartProgressBar';

const CartProgressBarDemo = () => {
  const [cartValue, setCartValue] = useState(25);
  const [itemCount, setItemCount] = useState(1);
  const [placement, setPlacement] = useState("cart");
  const [style, setStyle] = useState({
    primaryColor: "#4CAF50",
    backgroundColor: "#F5F5F5",
    goalCompleteColor: "#FF9800",
    cornerRadius: "square",
    thickness: "thin"
  });

  // Sample offers data
  const sampleOffers = [
    {
      id: 1,
      goalType: "amount_cart",
      goalAmount: 50,
      goalquantity: null,
      rewardType: "discount",
      discountCode: 10,
      discountType: "percentage",
      goalTextBefore: "🛍 Add more to unlock discount!",
      goalTextAfter: "🎉 Discount unlocked!",
      rewardProducts: []
    },
    {
      id: 2,
      goalType: "amount_cart",
      goalAmount: 75,
      goalquantity: null,
      rewardType: "shipping",
      goalTextBefore: "🚚 Almost free shipping!",
      goalTextAfter: "🎉 Free shipping unlocked!",
      rewardProducts: []
    },
    {
      id: 3,
      goalType: "quantity",
      goalquantity: 3,
      goalAmount: null,
      rewardType: "gift",
      goalTextBefore: "🎁 Add more items for free gift!",
      goalTextAfter: "🎉 Choose your free gift!",
      rewardProducts: [
        {
          id: 1,
          title: "Free T-Shirt",
          media: "https://via.placeholder.com/100x100?text=T-Shirt"
        },
        {
          id: 2,
          title: "Free Mug",
          media: "https://via.placeholder.com/100x100?text=Mug"
        }
      ]
    }
  ];

  const testScenarios = [
    { label: "Reset", cartValue: 0, itemCount: 0 },
    { label: "$25 / 1 Item", cartValue: 25, itemCount: 1 },
    { label: "$50 / 2 Items", cartValue: 50, itemCount: 2 },
    { label: "$75 / 3 Items", cartValue: 75, itemCount: 3 },
    { label: "$100 / 4 Items", cartValue: 100, itemCount: 4 }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">CartProgressBar Demo</h1>
        <p className="text-gray-600">Monster Cart-style progress bar component</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Controls</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cart Value ($)</label>
            <input
              type="number"
              value={cartValue}
              onChange={(e) => setCartValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Count</label>
            <input
              type="number"
              value={itemCount}
              onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="home">Home</option>
              <option value="product">Product</option>
              <option value="cart">Cart</option>
            </select>
          </div>
        </div>

        {/* Quick Test Scenarios */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Test Scenarios</label>
          <div className="flex flex-wrap gap-2">
            {testScenarios.map((scenario, index) => (
              <button
                key={index}
                onClick={() => {
                  setCartValue(scenario.cartValue);
                  setItemCount(scenario.itemCount);
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
            <input
              type="color"
              value={style.primaryColor}
              onChange={(e) => setStyle({...style, primaryColor: e.target.value})}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <input
              type="color"
              value={style.backgroundColor}
              onChange={(e) => setStyle({...style, backgroundColor: e.target.value})}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complete Color</label>
            <input
              type="color"
              value={style.goalCompleteColor}
              onChange={(e) => setStyle({...style, goalCompleteColor: e.target.value})}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corner Radius</label>
            <select
              value={style.cornerRadius}
              onChange={(e) => setStyle({...style, cornerRadius: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="square">Square</option>
              <option value="slightly">Slightly Rounded</option>
              <option value="rounded">Fully Rounded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Component Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">CartProgressBar Component</h2>

        <CartProgressBar
          offers={sampleOffers}
          cartValue={cartValue}
          itemCount={itemCount}
          placement={placement}
          style={style}
        />
      </div>

      {/* Code Example */}
      <div className="bg-gray-900 rounded-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre className="text-sm overflow-x-auto">
{`import CartProgressBar from './components/CartProgressBar';

const offers = [
  {
    id: 1,
    goalType: "amount_cart",
    goalAmount: 50,
    rewardType: "discount",
    discountCode: 10,
    discountType: "percentage",
    goalTextBefore: "Add more to unlock discount!",
    goalTextAfter: "Discount unlocked!"
  },
  {
    id: 2,
    goalType: "quantity",
    goalquantity: 3,
    rewardType: "gift",
    rewardProducts: [
      { id: 1, title: "Free T-Shirt", media: "..." }
    ]
  }
];

<CartProgressBar
  offers={offers}
  cartValue={75}
  itemCount={2}
  placement="cart"
  style={{
    primaryColor: "#4CAF50",
    backgroundColor: "#F5F5F5",
    goalCompleteColor: "#FF9800",
    cornerRadius: "square",
    thickness: "thin"
  }}
/>`}
        </pre>
      </div>
    </div>
  );
};

export default CartProgressBarDemo;

