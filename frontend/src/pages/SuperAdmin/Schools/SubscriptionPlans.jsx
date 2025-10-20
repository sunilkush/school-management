import React from "react";

const SubscriptionPlans = () => {
  // Sample subscription plans data
  const plans = [
    { id: 1, name: "Basic", price: "₹5,000", duration: "1 Year" },
    { id: 2, name: "Standard", price: "₹12,000", duration: "1 Year" },
    { id: 3, name: "Premium", price: "₹20,000", duration: "1 Year" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Subscription Plans</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="border rounded-lg p-4 shadow hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-gray-600">{plan.duration}</p>
            <p className="text-green-600 font-bold mt-2">{plan.price}</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Select Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
