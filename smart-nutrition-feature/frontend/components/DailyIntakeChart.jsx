import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DailyIntakeChart.css';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28'];

const DailyIntakeChart = ({ userId }) => {
    const [intakeData, setIntakeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Fetch today's intake from our Express backend
        const fetchIntake = async () => {
            try {
                const response = await fetch(`/api/nutrition/today/${userId}`);
                if (!response.ok) throw new Error('Failed to fetch data');
                const data = await response.json();
                setIntakeData(data);
            } catch (error) {
                console.error('Error fetching daily intake:', error);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchIntake();
        }
    }, [userId]);

    if (loading) return <div className="loading">Loading nutrition data...</div>;
    if (!intakeData) return null;

    // 2. Prepare data for Recharts Pie Chart
    // We exclude calories here because we want to visualize macros (components of caloric intake)
    const chartData = [
        { name: 'Protein (g)', value: intakeData.totalProtein },
        { name: 'Carbs (g)', value: intakeData.totalCarbs },
        { name: 'Fats (g)', value: intakeData.totalFats },
    ];

    // Optional: check if all macros are 0
    const hasData = chartData.some(macro => macro.value > 0);

    return (
        <div className="daily-dashboard">
            <h2>Today's Intake Dashboard</h2>

            <div className="dashboard-stats">
                <div className="stat-card">
                    <span className="stat-label">Total Calories</span>
                    <span className="stat-value">{intakeData.totalCalories} kcal</span>
                </div>
            </div>

            {hasData ? (
                <div className="chart-container" style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}g`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}g`} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="no-data">No intake recorded today yet. Add some items to your cart!</p>
            )}
        </div>
    );
};

export default DailyIntakeChart;
