import React, { useState } from 'react';
import Toggle from "../../UI/toggle/toggle";

const membershipOptions = [
    { period: 'Weekly', fee: 0, icp: 0.5, ckbtc: 1.14, usd: 2.03 },
    { period: 'Monthly', fee: 0, icp: 0.5, ckbtc: 1.14, usd: 2.03 },
    { period: 'Annually', fee: 0, icp: 0.5, ckbtc: 1.14, usd: 2.03 },
    { period: 'Lifetime', fee: 0, icp: 0.5, ckbtc: 1.14, usd: 2.03, disabled: true }
];

const MembershipSubscription = () => {
    const [fees, setFees] = useState(membershipOptions.map(option => option.fee));

    const handleFeeChange = (index: any, value: any) => {
        setFees(prevFees => {
            const newFees = [...prevFees];
            newFees[index] = value;
            return newFees;
        });
    };

    return (
        <div className="membership-subscription">
            <p className='mainTitle'>MEMBERSHIP SUBSCRIPTION</p>
            <p>Allow readers full access to all your personal articles that are published for 'Members' for a periodical fee.</p>
            <div className="subscription-settings-options">
                <div className="subscription-settings-header">
                    <div className="header-toggle"></div>
                    <div className="header-period">PERIOD</div>
                    <div className="header-fee">PERIODICAL FEE (IN NUA)</div>
                    <div className="header-conversion"></div>
                </div>
                {membershipOptions.map((option, index) => (
                    <div key={option.period} className={`subscription-settings-option ${option.disabled ? 'disabled' : ''}`}>
                        <div className="toggle">
                            <Toggle toggled={!option.disabled} callBack={() => { }} />
                        </div>
                        <div className="period">{option.period}</div>
                        <div className="fee-controls">
                            <div className="value-container">
                                <input
                                    type="number"
                                    value={fees[index]}
                                    placeholder='0 NUA'
                                    onChange={(e) => { fees[index] <= 0 ? 0 : handleFeeChange(index, parseFloat(e.target.value) || 0) }}
                                    disabled={option.disabled}
                                />
                                <div className="buttons">
                                    <button className='subscription-inc-dec-button' onClick={() => handleFeeChange(index, fees[index] + 1)} disabled={option.disabled}>+</button>
                                    <button className='subscription-inc-dec-button' onClick={() => handleFeeChange(index, fees[index] - 1)} disabled={fees[index] <= 0 || option.disabled}>-</button>
                                </div>
                            </div>
                        </div>
                        <div className="fees">
                            = {option.icp} ICP | {option.ckbtc} ckBTC | {option.usd} USD
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MembershipSubscription;
