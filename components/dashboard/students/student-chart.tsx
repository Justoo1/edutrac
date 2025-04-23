"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
} from "chart.js";

// Register the required chart components
ChartJS.register(ArcElement, Tooltip, Legend);

export function StudentsChart() {
  const data: ChartData<"doughnut"> = {
    labels: ["Boys", "Girls"],
    datasets: [
      {
        label: "Students",
        data: [45414, 40270],
        backgroundColor: ["rgba(173, 216, 230, 0.7)", "rgba(255, 213, 128, 0.7)"],
        borderColor: ["rgba(173, 216, 230, 1)", "rgba(255, 213, 128, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-medium">Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-80">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex space-x-2">
              <div className="text-center">
                <h3 className="text-2xl font-bold">45,414</h3>
                <p className="text-sm text-gray-500">Boys (47%)</p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold">40,270</h3>
                <p className="text-sm text-gray-500">Girls (53%)</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}