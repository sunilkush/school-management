import React from 'react';

const IncomeAnalysis = () => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm w-full flex flex-col justify-center items-center">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Income Analysis</h2>
            <div className="relative w-72 h-72 mx-auto flex items-center justify-center">

                <div className="absolute left-0 bottom-0 bg-blue-600 text-white rounded-full w-64 h-64 flex flex-col items-center justify-center text-center shadow-lg">
                    <span className="text-2xl font-bold">55</span>
                    <span className="text-sm">Design</span>
                </div>


                <div className="absolute top-0 right-6 bg-cyan-500 text-white rounded-full w-36 h-36 flex flex-col items-center justify-center text-center shadow-lg">
                    <span className="text-xl font-bold">25</span>
                    <span className="text-sm">Development</span>
                </div>


                <div className="absolute bottom-2 right-0 bg-green-400 text-white rounded-full w-24 h-24 flex flex-col items-center justify-center text-center shadow-lg">
                    <span className="text-xl font-bold">20</span>
                    <span className="text-sm">SEO</span>
                </div>
            </div>
        </div>

    );
};

export default IncomeAnalysis;
