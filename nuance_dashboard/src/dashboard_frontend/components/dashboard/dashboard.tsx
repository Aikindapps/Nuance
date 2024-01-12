import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './_dashboard.scss';
import Sidebar from '../sidebar/sidebar';
import Toggle from '../reviewComment/toggle/toggle';
import ReviewComment from '../reviewComment/reviewComment';
import Login from '../login/login';
import logo2 from '../../assets/logo2.svg';



const Dashboard = () => {



    const Metrics = () => <div className='grid-item two-by-four'>metrics</div>;
    const Cycles = () =>
        <>
            <div className='grid-item two-by-two'>cycles monitoring</div>;
        </>

    return (
        <Router>
            <Sidebar />
            <Login />
            <div className="dashboard">
                <div className="dashboard-content">
                    <Routes>
                        <Route path="/review-comments" element={<ReviewComment />} />
                        <Route path="/metrics" element={<Metrics />} />
                        <Route path="/cycles" element={<Cycles />} />
                        <Route path="*" element={<ReviewComment />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
};


export default Dashboard;