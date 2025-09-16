import React from 'react';
import SummaryCard from './SummaryCard';

const cardData = [
  {
    title: "New Admission",
    value: "1203",
    percentage: 10,
    trend: "10% increase",
    color: "purple",
    label: "Last month",
  },
  {
    title: "Total Student",
    value: "12300",
    percentage: 20,
    trend: "20% increase",
    color: "blue",
    label: "Last month",
  },
  {
    title: "Total Teacher",
    value: "1280k",
    percentage: 20,
    trend: "20% increase",
    color: "green",
    label: "Last month",
  },
  {
    title: "Income",
    value: "65865k",
    percentage: 20,
    trend: "20% Decrease",
    color: "orange",
    label: "Last month",
  },
];

const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
      {cardData.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
};

export default SummaryCards;
